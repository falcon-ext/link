import { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';

type WorkoutLogEntry = {
  id: string;
  finished_at: string;
  duration_seconds: number | null;
  sheet_id: string;
  sheetName: string;
};

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m > 0 && s > 0) return `${m}min ${s}s`;
  if (m > 0) return `${m}min`;
  return `${s}s`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export function HistoryScreen() {
  const { profile } = useAuthStore();
  const [logs, setLogs] = useState<WorkoutLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  async function loadHistory() {
    setLoading(true);

    const { data: logData } = await supabase
      .from('workout_logs')
      .select('id, finished_at, duration_seconds, sheet_id')
      .eq('student_id', profile!.id)
      .not('finished_at', 'is', null)
      .order('finished_at', { ascending: false });

    if (!logData || logData.length === 0) {
      setLogs([]);
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

    setLogs(
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

  // Calendário
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() === month;

  const trainedDays = new Set(
    logs
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
        <View className="px-6 pt-8 pb-4">
          <Text className="text-white text-2xl font-bold">Histórico</Text>
          <Text className="text-gray-400 text-sm mt-1">
            {logs.length} treino{logs.length !== 1 ? 's' : ''} realizados
          </Text>
        </View>

        {/* Calendário */}
        <View className="mx-6 bg-brand-dark-2 rounded-2xl p-4 mb-6">
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
              <Ionicons
                name="chevron-forward"
                size={20}
                color={isCurrentMonth ? '#374151' : '#8DC63F'}
              />
            </TouchableOpacity>
          </View>

          {/* Cabeçalho dias da semana */}
          <View className="flex-row mb-1">
            {WEEKDAYS.map((d) => (
              <Text
                key={d}
                className="text-gray-500 text-xs font-semibold text-center"
                style={{ width: '14.285%' }}
              >
                {d}
              </Text>
            ))}
          </View>

          {/* Grid */}
          <View className="flex-row flex-wrap">
            {calendarCells.map((day, idx) => {
              if (day === null) {
                return (
                  <View
                    key={`e-${idx}`}
                    style={{ width: '14.285%' }}
                    className="h-9"
                  />
                );
              }
              const trained = trainedDays.has(day);
              const isToday = isCurrentMonth && today.getDate() === day;
              return (
                <View
                  key={day}
                  style={{ width: '14.285%' }}
                  className="h-9 items-center justify-center"
                >
                  <View
                    className="w-8 h-8 rounded-full items-center justify-center"
                    style={{
                      backgroundColor: trained
                        ? '#8DC63F'
                        : isToday
                        ? '#2E3330'
                        : 'transparent',
                    }}
                  >
                    <Text
                      className="text-xs font-semibold"
                      style={{
                        color: trained
                          ? '#1A1D1C'
                          : isToday
                          ? '#8DC63F'
                          : '#6b7280',
                      }}
                    >
                      {day}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Legenda */}
          <View className="flex-row items-center mt-3">
            <View className="w-3 h-3 rounded-full bg-brand-green mr-1.5" />
            <Text className="text-gray-500 text-xs">Dia treinado</Text>
          </View>
        </View>

        {/* Lista */}
        {logs.length === 0 ? (
          <View className="items-center mt-4 px-8">
            <Ionicons name="time-outline" size={48} color="#374151" />
            <Text className="text-gray-400 text-base font-semibold mt-3 text-center">
              Nenhum treino ainda
            </Text>
            <Text className="text-gray-600 text-sm mt-1 text-center">
              Seus treinos aparecerão aqui após a conclusão.
            </Text>
          </View>
        ) : (
          <View className="px-6">
            <Text className="text-xs font-semibold text-gray-500 uppercase mb-3">
              Todos os treinos
            </Text>
            {logs.map((item) => (
              <View key={item.id} className="bg-brand-dark-2 rounded-2xl p-4 mb-3">
                <View className="flex-row items-center justify-between mb-2">
                  <Text
                    className="text-white font-semibold flex-1 mr-2"
                    numberOfLines={1}
                  >
                    {item.sheetName}
                  </Text>
                  <View className="bg-brand-green/20 rounded-full px-2 py-0.5">
                    <Text className="text-brand-green text-xs font-semibold">Concluído</Text>
                  </View>
                </View>
                <View className="flex-row items-center">
                  <Ionicons name="calendar-outline" size={13} color="#6b7280" />
                  <Text className="text-gray-400 text-xs ml-1">
                    {formatDate(item.finished_at)}
                  </Text>
                  {item.duration_seconds ? (
                    <>
                      <Text className="text-gray-600 text-xs mx-2">·</Text>
                      <Ionicons name="time-outline" size={13} color="#6b7280" />
                      <Text className="text-gray-400 text-xs ml-1">
                        {formatDuration(item.duration_seconds)}
                      </Text>
                    </>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
