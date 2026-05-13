import { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { StudentWorkoutStackParams } from '../../navigation/StudentWorkoutStack';
import { supabase } from '../../lib/supabase';
import { SheetExercise } from '../../types';

type Props = {
  navigation: NativeStackNavigationProp<StudentWorkoutStackParams, 'WorkoutView'>;
  route: RouteProp<StudentWorkoutStackParams, 'WorkoutView'>;
};

const MUSCLE_LABELS: Record<string, string> = {
  chest: 'Peitoral', back: 'Costas', legs: 'Pernas', shoulders: 'Ombros',
  biceps: 'Bíceps', triceps: 'Tríceps', core: 'Core', cardio: 'Cardio', other: 'Outro',
};

export function WorkoutViewScreen({ navigation, route }: Props) {
  const { sheet } = route.params;
  const [exercises, setExercises] = useState<SheetExercise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('sheet_exercises')
      .select('*, exercise:exercises(*)')
      .eq('sheet_id', sheet.id)
      .order('order_index')
      .then(({ data }) => {
        setExercises((data as SheetExercise[]) ?? []);
        setLoading(false);
      });
  }, [sheet.id]);

  return (
    <SafeAreaView className="flex-1 bg-brand-dark">
      {/* Header */}
      <View className="px-6 pt-4 pb-3 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text className="text-brand-green text-sm">← Voltar</Text>
        </TouchableOpacity>
        <View className="items-center">
          <Text className="text-white font-bold">{sheet.name}</Text>
          <Text className="text-brand-green text-xs font-semibold">Visualização</Text>
        </View>
        <View style={{ width: 48 }} />
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#8DC63F" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}>
          <Text className="text-gray-500 text-xs uppercase font-semibold mb-4 mt-2">
            {exercises.length} exercício{exercises.length !== 1 ? 's' : ''}
          </Text>

          {exercises.map((ex, idx) => (
            <View key={ex.id} className="bg-brand-dark-2 rounded-2xl p-4 mb-4">
              {/* Exercise header */}
              <View className="flex-row items-center mb-3">
                <View className="w-8 h-8 rounded-full bg-brand-green/20 items-center justify-center mr-3">
                  <Text className="text-brand-green text-sm font-bold">{idx + 1}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-white font-semibold text-base">
                    {ex.exercise?.name}
                  </Text>
                  {ex.exercise?.muscle_group && (
                    <Text className="text-gray-500 text-xs">
                      {MUSCLE_LABELS[ex.exercise.muscle_group] ?? ex.exercise.muscle_group}
                    </Text>
                  )}
                </View>
              </View>

              {/* Métricas */}
              <View className="flex-row bg-brand-dark rounded-xl overflow-hidden mb-3">
                <View className="flex-1 items-center py-3 border-r border-brand-dark-3">
                  <Text className="text-white font-bold text-lg">{ex.sets}</Text>
                  <Text className="text-gray-500 text-xs">séries</Text>
                </View>
                <View className="flex-1 items-center py-3 border-r border-brand-dark-3">
                  <Text className="text-white font-bold text-lg">{ex.reps}</Text>
                  <Text className="text-gray-500 text-xs">reps</Text>
                </View>
                <View className="flex-1 items-center py-3">
                  <Text className="text-white font-bold text-lg">
                    {ex.load ? ex.load : '—'}
                  </Text>
                  <Text className="text-gray-500 text-xs">
                    {ex.load ? 'kg' : 'carga'}
                  </Text>
                </View>
              </View>

              {/* Descanso + observações */}
              {(ex.rest_seconds || ex.notes) && (
                <View className="flex-row flex-wrap gap-2">
                  {ex.rest_seconds ? (
                    <View className="flex-row items-center bg-brand-dark rounded-full px-3 py-1">
                      <Ionicons name="timer-outline" size={12} color="#6b7280" style={{ marginRight: 4 }} />
                      <Text className="text-gray-400 text-xs">{ex.rest_seconds}s descanso</Text>
                    </View>
                  ) : null}
                  {ex.notes ? (
                    <View className="flex-row items-center bg-brand-dark rounded-full px-3 py-1 flex-1">
                      <Ionicons name="information-circle-outline" size={12} color="#6b7280" style={{ marginRight: 4 }} />
                      <Text className="text-gray-400 text-xs" numberOfLines={1}>{ex.notes}</Text>
                    </View>
                  ) : null}
                </View>
              )}
            </View>
          ))}

          {exercises.length === 0 && (
            <View className="items-center mt-10">
              <Ionicons name="barbell-outline" size={48} color="#374151" />
              <Text className="text-gray-500 text-sm mt-3 text-center">
                Nenhum exercício cadastrado neste treino.
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
