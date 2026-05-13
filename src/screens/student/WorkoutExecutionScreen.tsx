import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { StudentWorkoutStackParams } from '../../navigation/StudentWorkoutStack';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { SheetExercise } from '../../types';

type Props = {
  navigation: NativeStackNavigationProp<StudentWorkoutStackParams, 'WorkoutExecution'>;
  route: RouteProp<StudentWorkoutStackParams, 'WorkoutExecution'>;
};

type SetEntry = { done: boolean; loadUsed: string };

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}min ${s}s` : `${s}s`;
}

export function WorkoutExecutionScreen({ navigation, route }: Props) {
  const { sheet, program } = route.params;
  const { profile } = useAuthStore();

  const [exercises, setExercises] = useState<SheetExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [sets, setSets] = useState<Record<string, SetEntry>>({});
  const [elapsed, setElapsed] = useState(0);
  const [saving, setSaving] = useState(false);

  const startedAt = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadExercises();
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  async function loadExercises() {
    const { data } = await supabase
      .from('sheet_exercises')
      .select('*, exercise:exercises(*)')
      .eq('sheet_id', sheet.id)
      .order('order_index');
    const list = (data as SheetExercise[]) ?? [];
    setExercises(list);

    const initial: Record<string, SetEntry> = {};
    for (const ex of list) {
      for (let i = 1; i <= ex.sets; i++) {
        initial[`${ex.id}-${i}`] = { done: false, loadUsed: ex.load ?? '' };
      }
    }
    setSets(initial);
    setLoading(false);
  }

  function toggleSet(exId: string, setNum: number) {
    const key = `${exId}-${setNum}`;
    setSets((prev) => ({ ...prev, [key]: { ...prev[key], done: !prev[key].done } }));
  }

  function updateLoad(exId: string, setNum: number, load: string) {
    const key = `${exId}-${setNum}`;
    setSets((prev) => ({ ...prev, [key]: { ...prev[key], loadUsed: load } }));
  }

  function isExerciseDone(ex: SheetExercise) {
    for (let i = 1; i <= ex.sets; i++) {
      if (!sets[`${ex.id}-${i}`]?.done) return false;
    }
    return true;
  }

  const totalSets = exercises.reduce((acc, ex) => acc + ex.sets, 0);
  const doneSets = Object.values(sets).filter((s) => s.done).length;

  async function handleFinish() {
    if (doneSets === 0) {
      Alert.alert('Atenção', 'Complete pelo menos uma série antes de finalizar.');
      return;
    }

    Alert.alert('Finalizar treino', `Você completou ${doneSets} de ${totalSets} séries. Deseja finalizar?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Finalizar',
        onPress: async () => {
          if (timerRef.current) clearInterval(timerRef.current);
          setSaving(true);
          const duration = Math.floor((Date.now() - startedAt.current) / 1000);

          const { data: log } = await supabase
            .from('workout_logs')
            .insert({
              student_id: profile!.id,
              sheet_id: sheet.id,
              finished_at: new Date().toISOString(),
              duration_seconds: duration,
            })
            .select()
            .single();

          let postId: string | undefined;

          if (log) {
            const setLogs = [];
            for (const ex of exercises) {
              for (let i = 1; i <= ex.sets; i++) {
                const s = sets[`${ex.id}-${i}`];
                if (s?.done) {
                  setLogs.push({
                    workout_log_id: log.id,
                    sheet_exercise_id: ex.id,
                    set_number: i,
                    load_used: s.loadUsed.trim() || null,
                  });
                }
              }
            }
            if (setLogs.length > 0) {
              await supabase.from('set_logs').insert(setLogs);
            }

            // Auto check-in no feed
            const { data: post } = await supabase
              .from('feed_posts')
              .insert({
                student_id: profile!.id,
                workout_log_id: log.id,
                student_name: profile!.name,
                student_avatar_url: profile!.avatar_url ?? null,
                sheet_name: sheet.name,
              })
              .select('id')
              .single();
            postId = post?.id ?? undefined;
          }

          setSaving(false);
          navigation.replace('WorkoutSummary', {
            sheetName: sheet.name,
            duration,
            setsCompleted: doneSets,
            exercisesTotal: exercises.length,
            postId,
          });
        },
      },
    ]);
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
      {/* Header */}
      <View className="px-6 pt-4 pb-3 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text className="text-brand-green text-sm">← Voltar</Text>
        </TouchableOpacity>
        <View className="items-center">
          <Text className="text-white font-bold">{sheet.name}</Text>
          <Text className="text-gray-400 text-xs">{formatDuration(elapsed)}</Text>
        </View>
        <View className="items-end">
          <Text className="text-brand-green font-bold text-sm">{doneSets}/{totalSets}</Text>
          <Text className="text-gray-500 text-xs">séries</Text>
        </View>
      </View>

      {/* Barra de progresso */}
      <View className="mx-6 mb-4 h-1.5 bg-brand-dark-3 rounded-full overflow-hidden">
        <View
          className="h-full bg-brand-green rounded-full"
          style={{ width: totalSets > 0 ? `${(doneSets / totalSets) * 100}%` : '0%' }}
        />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled">
        {exercises.map((ex, exIndex) => {
          const done = isExerciseDone(ex);
          return (
            <View
              key={ex.id}
              className="rounded-2xl p-4 mb-4"
              style={{ backgroundColor: done ? '#1e2d1a' : '#242827' }}
            >
              {/* Exercise header */}
              <View className="flex-row items-center mb-3">
                <View
                  className="w-7 h-7 rounded-full items-center justify-center mr-2"
                  style={{ backgroundColor: done ? '#8DC63F33' : '#2E3330' }}
                >
                  {done ? (
                    <Ionicons name="checkmark" size={14} color="#8DC63F" />
                  ) : (
                    <Text className="text-gray-400 text-xs font-bold">{exIndex + 1}</Text>
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-white font-semibold">{ex.exercise?.name}</Text>
                  <Text className="text-gray-500 text-xs">
                    {ex.sets} séries × {ex.reps} reps
                    {ex.rest_seconds ? ` · ${ex.rest_seconds}s descanso` : ''}
                  </Text>
                </View>
              </View>

              {/* Set rows */}
              <View className="bg-brand-dark rounded-xl overflow-hidden">
                <View className="flex-row px-3 py-2 border-b border-brand-dark-3">
                  <Text className="text-gray-500 text-xs w-12">Série</Text>
                  <Text className="text-gray-500 text-xs flex-1">Carga</Text>
                  <Text className="text-gray-500 text-xs w-16 text-center">Feito</Text>
                </View>
                {Array.from({ length: ex.sets }, (_, i) => i + 1).map((setNum) => {
                  const key = `${ex.id}-${setNum}`;
                  const setEntry = sets[key];
                  const isDone = setEntry?.done ?? false;
                  return (
                    <View
                      key={setNum}
                      className="flex-row items-center px-3 py-2.5 border-b border-brand-dark-3"
                      style={{ backgroundColor: isDone ? '#8DC63F15' : 'transparent' }}
                    >
                      <Text
                        className="w-12 font-bold text-sm"
                        style={{ color: isDone ? '#8DC63F' : '#9CA3AF' }}
                      >
                        {setNum}
                      </Text>
                      <TextInput
                        className="flex-1 text-white text-sm"
                        placeholder={ex.load ?? 'Carga'}
                        placeholderTextColor="#4B5563"
                        value={setEntry?.loadUsed ?? ''}
                        onChangeText={(v) => updateLoad(ex.id, setNum, v)}
                        autoCapitalize="none"
                        editable={!isDone}
                        style={{ opacity: isDone ? 0.5 : 1 }}
                      />
                      <TouchableOpacity
                        onPress={() => toggleSet(ex.id, setNum)}
                        className="w-16 items-center"
                      >
                        <View
                          className="w-8 h-8 rounded-full items-center justify-center"
                          style={{
                            backgroundColor: isDone ? '#8DC63F' : 'transparent',
                            borderWidth: isDone ? 0 : 2,
                            borderColor: '#2E3330',
                          }}
                        >
                          {isDone && <Ionicons name="checkmark" size={18} color="#1A1D1C" />}
                        </View>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>

              {ex.notes ? (
                <Text className="text-gray-600 text-xs mt-2 italic">{ex.notes}</Text>
              ) : null}
            </View>
          );
        })}
      </ScrollView>

      {/* Finalizar botão flutuante */}
      <View className="absolute bottom-0 left-0 right-0 px-6 pb-8 pt-4 bg-brand-dark border-t border-brand-dark-3">
        <TouchableOpacity
          className={`rounded-xl py-4 items-center ${saving ? 'bg-brand-green-dark' : 'bg-brand-green'}`}
          onPress={handleFinish}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#1A1D1C" />
          ) : (
            <Text className="text-brand-dark font-bold text-base">Finalizar Treino</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
