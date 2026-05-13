import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { StudentsStackParams } from '../../navigation/StudentsStack';
import { supabase } from '../../lib/supabase';

type Props = {
  navigation: NativeStackNavigationProp<StudentsStackParams, 'StudentHistory'>;
  route: RouteProp<StudentsStackParams, 'StudentHistory'>;
};

type LogEntry = {
  id: string;
  finished_at: string;
  duration_seconds: number | null;
  sheet_id: string;
  sheetName: string;
};

type Period = 'week' | 'month' | 'all';

const PERIODS: { key: Period; label: string }[] = [
  { key: 'week',  label: 'Semana' },
  { key: 'month', label: 'Mês'    },
  { key: 'all',   label: 'Tudo'   },
];

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTH_NAMES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
];

function formatDuration(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  if (m > 0 && sec > 0) return `${m}min ${sec}s`;
  if (m > 0) return `${m}min`;
  return `${sec}s`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function cutoffForPeriod(period: Period): Date | null {
  const now = new Date();
  if (period === 'week')  return new Date(now.getTime() - 7  * 86400000);
  if (period === 'month') return new Date(now.getTime() - 30 * 86400000);
  return null;
}

export function StudentHistoryScreen({ navigation, route }: Props) {
  const { student } = route.params;
  const [allLogs, setAllLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading]   = useState(true);
  const [period, setPeriod]     = useState<Period>('all');
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  useFocusEffect(
    useCallback(() => { loadHistory(); }, [])
  );

  async function loadHistory() {
    setLoading(true);

    const { data: logData } = await supabase
      .from('workout_logs')
      .select('id, finished_at, duration_seconds, sheet_id')
      .eq('student_id', student.id)
      .not('finished_at', 'is', null)
      .order('finished_at', { ascending: false });

    if (!logData || logData.length === 0) {
      setAllLogs([]);
      setLoading(false);
      return;
    }

    const sheetIds = [...new Set((logData as any[]).map((l) => l.sheet_id as string))];
    const { data: sheetData } = await supabase
      .from('workout_sheets')
      .select('id, name')
      .in('id', sheetIds);

    const sheetMap: Record<string, string> = {};
    for (const s of (sheetData ?? []) as { id: string; name: string }[]) {
      sheetMap[s.id] = s.name;
    }

    setAllLogs(
      (logData as any[]).map((l) => ({
        id: l.id,
        finished_at: l.finished_at,
        duration_seconds: l.duration_seconds,
        sheet_id: l.sheet_id,
        sheetName: sheetMap[l.sheet_id] ?? 'Treino',
      }))
    );
    setLoading(false);
  }

  const cutoff = cutoffForPeriod(period);
  const logs = cutoff
    ? allLogs.filter((l) => new Date(l.finished_at) >= cutoff)
    : allLogs;

  // Calendário
  const year  = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth    = new Date(year, month + 1, 0).getDate();
  const today          = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  const trainedDays = new Set(
    allLogs
      .filter((l) => {
        const d = new Date(l.finished_at);
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .map((l) => new Date(l.finished_at).getDate())
  );

  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-brand-dark items-center justify-center">
        <ActivityIndicator color="#8DC63F" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-dark">
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Header */}
        <View className="px-6 pt-4 pb-2">
          <TouchableOpacity className="mb-3" onPress={() => navigation.goBack()}>
            <Text className="text-brand-green text-sm">← Voltar</Text>
          </TouchableOpacity>
          <Text className="text-white text-2xl font-bold">Histórico</Text>
          <Text className="text-gray-400 text-sm mt-0.5">{student.name}</Text>
        </View>

        {/* Calendário */}
        <View className="mx-6 bg-brand-dark-2 rounded-2xl p-4 mb-5 mt-2">
          <View className="flex-row items-center justify-between mb-4">
            <TouchableOpacity onPress={() => setCurrentMonth(new Date(year, month - 1, 1))} className="p-1">
              <Ionicons name="chevron-back" size={20} color="#8DC63F" />
            </TouchableOpacity>
            <Text className="text-white font-semibold">
              {MONTH_NAMES[month]} {year}
            </Text>
            <TouchableOpacity
              onPress={() => setCurrentMonth(new Date(year, month + 1, 1))}
              disabled={isCurrentMonth}
              className="p-1"
            >
              <Ionicons name="chevron-forward" size={20} color={isCurrentMonth ? '#374151' : '#8DC63F'} />
            </TouchableOpacity>
          </View>

          <View className="flex-row mb-1">
            {WEEKDAYS.map((d) => (
              <Text key={d} className="text-gray-500 text-xs font-semibold text-center" style={{ width: '14.285%' }}>
                {d}
              </Text>
            ))}
          </View>

          <View className="flex-row flex-wrap">
            {calendarCells.map((day, idx) => {
              if (day === null) return <View key={`e-${idx}`} style={{ width: '14.285%' }} className="h-9" />;
              const trained = trainedDays.has(day);
              const isToday = isCurrentMonth && today.getDate() === day;
              return (
                <View key={day} style={{ width: '14.285%' }} className="h-9 items-center justify-center">
                  <View
                    className="w-8 h-8 rounded-full items-center justify-center"
                    style={{ backgroundColor: trained ? '#8DC63F' : isToday ? '#2E3330' : 'transparent' }}
                  >
                    <Text
                      className="text-xs font-semibold"
                      style={{ color: trained ? '#1A1D1C' : isToday ? '#8DC63F' : '#6b7280' }}
                    >
                      {day}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          <View className="flex-row items-center mt-3">
            <View className="w-3 h-3 rounded-full bg-brand-green mr-1.5" />
            <Text className="text-gray-500 text-xs">Dia treinado</Text>
          </View>
        </View>

        {/* Filtro de período */}
        <View className="mx-6 flex-row bg-brand-dark-2 rounded-xl p-1 mb-4">
          {PERIODS.map(({ key, label }) => {
            const selected = period === key;
            return (
              <TouchableOpacity
                key={key}
                onPress={() => setPeriod(key)}
                className="flex-1 rounded-lg py-2 items-center"
                style={{ backgroundColor: selected ? '#8DC63F' : 'transparent' }}
              >
                <Text className="text-xs font-semibold" style={{ color: selected ? '#1A1D1C' : '#6b7280' }}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Lista */}
        <View className="px-6">
          <Text className="text-xs font-semibold text-gray-500 uppercase mb-3">
            {logs.length} treino{logs.length !== 1 ? 's' : ''}
          </Text>

          {logs.length === 0 ? (
            <View className="items-center mt-4">
              <Ionicons name="time-outline" size={48} color="#374151" />
              <Text className="text-gray-400 text-base font-semibold mt-3 text-center">
                Nenhum treino neste período
              </Text>
            </View>
          ) : (
            logs.map((item) => (
              <TouchableOpacity
                key={item.id}
                className="bg-brand-dark-2 rounded-2xl p-4 mb-3"
                onPress={() => navigation.navigate('SessionDetail', {
                  logId: item.id,
                  sheetName: item.sheetName,
                  finishedAt: item.finished_at,
                  studentId: student.id,
                })}
              >
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-white font-semibold flex-1 mr-2" numberOfLines={1}>
                    {item.sheetName}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color="#6b7280" />
                </View>
                <View className="flex-row items-center">
                  <Ionicons name="calendar-outline" size={13} color="#6b7280" />
                  <Text className="text-gray-400 text-xs ml-1">{formatDate(item.finished_at)}</Text>
                  {item.duration_seconds ? (
                    <>
                      <Text className="text-gray-600 text-xs mx-2">·</Text>
                      <Ionicons name="time-outline" size={13} color="#6b7280" />
                      <Text className="text-gray-400 text-xs ml-1">{formatDuration(item.duration_seconds)}</Text>
                    </>
                  ) : null}
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
