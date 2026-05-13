import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { StudentsStackParams } from '../../navigation/StudentsStack';
import { supabase } from '../../lib/supabase';

type Props = {
  navigation: NativeStackNavigationProp<StudentsStackParams, 'ExerciseEvolution'>;
  route: RouteProp<StudentsStackParams, 'ExerciseEvolution'>;
};

type DataPoint = {
  date: string;       // ISO
  maxLoad: number;    // kg
  totalSets: number;
};

const CHART_HEIGHT = 150;
const BAR_WIDTH    = 36;
const BAR_GAP      = 10;
const SCREEN_W     = Dimensions.get('window').width;

function shortDate(iso: string) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatDateFull(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export function ExerciseEvolutionScreen({ navigation, route }: Props) {
  const { studentId, exerciseId, exerciseName } = route.params;
  const [points, setPoints] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadEvolution(); }, []);

  async function loadEvolution() {
    // Busca todos os set_logs deste exercício para este aluno
    const { data: logIds } = await supabase
      .from('workout_logs')
      .select('id, finished_at')
      .eq('student_id', studentId)
      .not('finished_at', 'is', null)
      .order('finished_at', { ascending: true });

    if (!logIds || logIds.length === 0) {
      setPoints([]);
      setLoading(false);
      return;
    }

    const ids = (logIds as { id: string; finished_at: string }[]);
    const idList = ids.map((l) => l.id);
    const dateMap: Record<string, string> = {};
    for (const l of ids) dateMap[l.id] = l.finished_at;

    const { data: setData } = await supabase
      .from('set_logs')
      .select('workout_log_id, load_used, set_number')
      .eq('exercise_id', exerciseId)
      .in('workout_log_id', idList);

    if (!setData || setData.length === 0) {
      setPoints([]);
      setLoading(false);
      return;
    }

    // Agrupa por sessão → max carga
    const sessionMap: Record<string, { maxLoad: number; totalSets: number; date: string }> = {};
    for (const s of setData as any[]) {
      const logId = s.workout_log_id as string;
      const load  = parseFloat(s.load_used ?? '0') || 0;
      if (!sessionMap[logId]) {
        sessionMap[logId] = { maxLoad: 0, totalSets: 0, date: dateMap[logId] };
      }
      if (load > sessionMap[logId].maxLoad) sessionMap[logId].maxLoad = load;
      sessionMap[logId].totalSets++;
    }

    const result: DataPoint[] = Object.values(sessionMap)
      .filter((p) => p.maxLoad > 0)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((p) => ({ date: p.date, maxLoad: p.maxLoad, totalSets: p.totalSets }));

    setPoints(result);
    setLoading(false);
  }

  const maxLoad = points.length > 0 ? Math.max(...points.map((p) => p.maxLoad)) : 0;
  const lastLoad = points.length > 0 ? points[points.length - 1].maxLoad : null;
  const firstLoad = points.length > 0 ? points[0].maxLoad : null;
  const gain = lastLoad != null && firstLoad != null && firstLoad > 0
    ? ((lastLoad - firstLoad) / firstLoad) * 100
    : null;

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-brand-dark items-center justify-center">
        <ActivityIndicator color="#8DC63F" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-dark">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View className="px-6 pt-4 pb-4">
          <TouchableOpacity className="mb-3" onPress={() => navigation.goBack()}>
            <Text className="text-brand-green text-sm">← Voltar</Text>
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold" numberOfLines={2}>{exerciseName}</Text>
          <Text className="text-gray-400 text-sm mt-0.5">Evolução de carga</Text>
        </View>

        {points.length === 0 ? (
          <View className="items-center mt-10 px-8">
            <Ionicons name="trending-up-outline" size={48} color="#374151" />
            <Text className="text-gray-400 text-base font-semibold mt-3 text-center">
              Sem dados de carga ainda
            </Text>
            <Text className="text-gray-600 text-sm mt-1 text-center">
              Os dados aparecerão após o aluno registrar cargas neste exercício.
            </Text>
          </View>
        ) : (
          <>
            {/* Cards de resumo */}
            <View className="flex-row px-6 mb-5 gap-3">
              <View className="flex-1 bg-brand-dark-2 rounded-2xl p-4 items-center">
                <Text className="text-gray-400 text-xs mb-1">Carga atual</Text>
                <Text className="text-white text-xl font-bold">{lastLoad}kg</Text>
              </View>
              <View className="flex-1 bg-brand-dark-2 rounded-2xl p-4 items-center">
                <Text className="text-gray-400 text-xs mb-1">Máximo</Text>
                <Text className="text-white text-xl font-bold">{maxLoad}kg</Text>
              </View>
              <View className="flex-1 bg-brand-dark-2 rounded-2xl p-4 items-center">
                <Text className="text-gray-400 text-xs mb-1">Evolução</Text>
                <Text
                  className="text-xl font-bold"
                  style={{ color: gain == null ? '#6b7280' : gain >= 0 ? '#8DC63F' : '#ef4444' }}
                >
                  {gain == null ? '—' : `${gain >= 0 ? '+' : ''}${gain.toFixed(0)}%`}
                </Text>
              </View>
            </View>

            {/* Gráfico de barras */}
            <View className="mx-6 bg-brand-dark-2 rounded-2xl p-4 mb-5">
              <Text className="text-white font-semibold mb-4">Carga máxima por sessão</Text>

              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: CHART_HEIGHT + 44, paddingBottom: 4 }}>
                  {points.map((p, i) => {
                    const barH = maxLoad > 0 ? Math.max(4, (p.maxLoad / maxLoad) * CHART_HEIGHT) : 4;
                    const isLast = i === points.length - 1;
                    return (
                      <View
                        key={i}
                        style={{ width: BAR_WIDTH, marginRight: i < points.length - 1 ? BAR_GAP : 0, alignItems: 'center' }}
                      >
                        {/* Valor em cima da barra */}
                        <Text style={{ color: '#8DC63F', fontSize: 9, marginBottom: 2 }}>
                          {p.maxLoad}kg
                        </Text>
                        {/* Barra */}
                        <View
                          style={{
                            width: BAR_WIDTH,
                            height: barH,
                            backgroundColor: isLast ? '#8DC63F' : '#2E5B1A',
                            borderRadius: 5,
                            borderTopLeftRadius: 5,
                            borderTopRightRadius: 5,
                          }}
                        />
                        {/* Data */}
                        <Text style={{ color: '#6b7280', fontSize: 9, marginTop: 4, textAlign: 'center' }}>
                          {shortDate(p.date)}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            </View>

            {/* Lista de sessões */}
            <View className="px-6">
              <Text className="text-xs font-semibold text-gray-500 uppercase mb-3">
                {points.length} sessão{points.length !== 1 ? 'ões' : ''}
              </Text>
              {[...points].reverse().map((p, i) => (
                <View key={i} className="flex-row items-center bg-brand-dark-2 rounded-2xl px-4 py-3 mb-2">
                  <View className="flex-1">
                    <Text className="text-white text-sm font-semibold">{formatDateFull(p.date)}</Text>
                    <Text className="text-gray-500 text-xs mt-0.5">{p.totalSets} série{p.totalSets !== 1 ? 's' : ''}</Text>
                  </View>
                  <Text className="text-white font-bold text-base">{p.maxLoad}kg</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
