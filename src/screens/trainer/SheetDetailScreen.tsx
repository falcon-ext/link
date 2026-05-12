import { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { StudentsStackParams } from '../../navigation/StudentsStack';
import { supabase } from '../../lib/supabase';
import { SheetExercise } from '../../types';

type Props = {
  navigation: NativeStackNavigationProp<StudentsStackParams, 'SheetDetail'>;
  route: RouteProp<StudentsStackParams, 'SheetDetail'>;
};

export function SheetDetailScreen({ navigation, route }: Props) {
  const { sheet, program } = route.params;
  const [exercises, setExercises] = useState<SheetExercise[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadExercises();
    }, [sheet.id])
  );

  async function loadExercises() {
    setLoading(true);
    const { data } = await supabase
      .from('sheet_exercises')
      .select('*, exercise:exercises(*)')
      .eq('sheet_id', sheet.id)
      .order('order_index');
    setExercises((data as SheetExercise[]) ?? []);
    setLoading(false);
  }

  async function handleDelete(item: SheetExercise) {
    Alert.alert('Remover exercício', `Remover "${item.exercise?.name}" desta ficha?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('sheet_exercises').delete().eq('id', item.id);
          loadExercises();
        },
      },
    ]);
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-dark">
      <View className="px-6 pt-4 pb-3">
        <TouchableOpacity className="mb-4" onPress={() => navigation.goBack()}>
          <Text className="text-brand-green text-sm">← Voltar</Text>
        </TouchableOpacity>
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-2xl font-bold text-white">{sheet.name}</Text>
            <Text className="text-gray-400 text-sm mt-0.5">{program.name}</Text>
          </View>
          <TouchableOpacity
            className="bg-brand-green w-9 h-9 rounded-full items-center justify-center"
            onPress={() =>
              navigation.navigate('ExercisePicker', {
                sheetId: sheet.id,
                orderIndex: exercises.length,
              })
            }
          >
            <Text className="text-brand-dark text-xl font-bold leading-none">+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#8DC63F" />
        </View>
      ) : (
        <FlatList
          data={exercises}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24, paddingTop: 8 }}
          renderItem={({ item, index }) => (
            <View className="bg-brand-dark-2 rounded-2xl p-4 mb-3 flex-row items-start">
              <Text className="text-brand-green font-bold text-base w-7">{index + 1}.</Text>
              <View className="flex-1">
                <Text className="text-white font-semibold">{item.exercise?.name ?? '—'}</Text>
                <View className="flex-row flex-wrap gap-2 mt-2">
                  <View className="bg-brand-dark-3 rounded-lg px-3 py-1">
                    <Text className="text-gray-300 text-xs">
                      {item.sets} séries × {item.reps} reps
                    </Text>
                  </View>
                  {item.load ? (
                    <View className="bg-brand-dark-3 rounded-lg px-3 py-1">
                      <Text className="text-gray-300 text-xs">{item.load}</Text>
                    </View>
                  ) : null}
                  {item.rest_seconds ? (
                    <View className="bg-brand-dark-3 rounded-lg px-3 py-1">
                      <Text className="text-gray-300 text-xs">{item.rest_seconds}s descanso</Text>
                    </View>
                  ) : null}
                </View>
                {item.notes ? (
                  <Text className="text-gray-500 text-xs mt-2 italic">{item.notes}</Text>
                ) : null}
              </View>
              <View className="flex-row gap-3 ml-2">
                <TouchableOpacity
                  onPress={() => navigation.navigate('EditSheetExercise', { sheetExercise: item })}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Ionicons name="pencil-outline" size={18} color="#8DC63F" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDelete(item)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Ionicons name="trash-outline" size={18} color="#6b7280" />
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View className="items-center mt-16">
              <Ionicons name="barbell-outline" size={48} color="#374151" />
              <Text className="text-gray-500 text-center mt-4">Nenhum exercício nesta ficha.</Text>
              <Text className="text-gray-600 text-center text-sm mt-1">Toque em + para adicionar.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
