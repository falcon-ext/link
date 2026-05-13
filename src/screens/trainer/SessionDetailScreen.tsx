import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { StudentsStackParams } from '../../navigation/StudentsStack';
import { supabase } from '../../lib/supabase';

type Props = {
  navigation: NativeStackNavigationProp<StudentsStackParams, 'SessionDetail'>;
  route: RouteProp<StudentsStackParams, 'SessionDetail'>;
};

type SetEntry = {
  set_number: number;
  reps_done: number | null;
  load_used: string | null;
};

type ExerciseGroup = {
  exerciseId: string;
  exerciseName: string;
  sets: SetEntry[];
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  });
}

export function SessionDetailScreen({ navigation, route }: Props) {
  const { logId, sheetName, finishedAt, studentId } = route.params;
  const [groups, setGroups]   = useState<ExerciseGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadSession(); }, []);

  async function loadSession() {
    const { data: setData } = await supabase
      .from('set_logs')
      .select('exercise_id, set_number, reps_done, load_used')
      .eq('workout_log_id', logId)
      .order('set_number');

    if (!setData || setData.length === 0) {
      setGroups([]);
      setLoading(false);
      return;
    }

    const exerciseIds = [...new Set((setData as any[]).map((s) => s.exercise_id as string))];
    const { data: exData } = await supabase
      .from('exercises')
      .select('id, name')
      .in('id', exerciseIds);

    const exMap: Record<string, string> = {};
    for (const e of (exData ?? []) as { id: string; name: string }[]) {
      exMap[e.id] = e.name;
    }

    const groupMap: Record<string, ExerciseGroup> = {};
    for (const s of setData as any[]) {
      if (!groupMap[s.exercise_id]) {
        groupMap[s.exercise_id] = {
          exerciseId: s.exercise_id,
          exerciseName: exMap[s.exercise_id] ?? 'Exercício',
          sets: [],
        };
      }
      groupMap[s.exercise_id].sets.push({
        set_number: s.set_number,
        reps_done: s.reps_done,
        load_used: s.load_used,
      });
    }

    // preserve order by first appearance
    const ordered = exerciseIds.map((id) => groupMap[id]).filter(Boolean);
    setGroups(ordered);
    setLoading(false);
  }

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
          <Text className="text-white text-xl font-bold">{sheetName}</Text>
          <Text className="text-gray-400 text-sm mt-1 capitalize">{formatDate(finishedAt)}</Text>
        </View>

        {/* Exercícios */}
        <View className="px-6">
          {groups.length === 0 ? (
            <View className="items-center mt-8">
              <Ionicons name="barbell-outline" size={48} color="#374151" />
              <Text className="text-gray-400 text-base mt-3 text-center">
                Nenhuma série registrada nesta sessão.
              </Text>
            </View>
          ) : (
            groups.map((group) => (
              <View key={group.exerciseId} className="bg-brand-dark-2 rounded-2xl p-4 mb-4">
                {/* Nome do exercício + botão de evolução */}
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-white font-bold text-base flex-1 mr-2" numberOfLines={2}>
                    {group.exerciseName}
                  </Text>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('ExerciseEvolution', {
                      studentId,
                      exerciseId: group.exerciseId,
                      exerciseName: group.exerciseName,
                    })}
                    className="flex-row items-center bg-brand-green/15 rounded-full px-3 py-1"
                  >
                    <Ionicons name="trending-up-outline" size={13} color="#8DC63F" />
                    <Text className="text-brand-green text-xs font-semibold ml-1">Evolução</Text>
                  </TouchableOpacity>
                </View>

                {/* Cabeçalho da tabela */}
                <View className="flex-row mb-2 pb-2" style={{ borderBottomWidth: 1, borderBottomColor: '#2E3330' }}>
                  <Text className="text-gray-500 text-xs font-semibold" style={{ width: 48 }}>Série</Text>
                  <Text className="text-gray-500 text-xs font-semibold flex-1">Reps</Text>
                  <Text className="text-gray-500 text-xs font-semibold" style={{ width: 80, textAlign: 'right' }}>Carga</Text>
                </View>

                {/* Séries */}
                {group.sets.map((set) => (
                  <View key={set.set_number} className="flex-row py-1.5">
                    <View
                      className="items-center justify-center rounded-full"
                      style={{ width: 48 }}
                    >
                      <View className="w-6 h-6 rounded-full bg-brand-green/20 items-center justify-center">
                        <Text className="text-brand-green text-xs font-bold">{set.set_number}</Text>
                      </View>
                    </View>
                    <Text className="text-white text-sm flex-1">
                      {set.reps_done != null ? `${set.reps_done} reps` : '—'}
                    </Text>
                    <Text className="text-white text-sm font-semibold" style={{ width: 80, textAlign: 'right' }}>
                      {set.load_used ? `${set.load_used}` : '—'}
                    </Text>
                  </View>
                ))}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
