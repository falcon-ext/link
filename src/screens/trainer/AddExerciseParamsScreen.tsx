import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { StudentsStackParams } from '../../navigation/StudentsStack';
import { supabase } from '../../lib/supabase';

type Props = {
  navigation: NativeStackNavigationProp<StudentsStackParams, 'AddExerciseParams'>;
  route: RouteProp<StudentsStackParams, 'AddExerciseParams'>;
};

const REST_OPTIONS = [
  { label: '30s', value: 30 },
  { label: '45s', value: 45 },
  { label: '1min', value: 60 },
  { label: '90s', value: 90 },
  { label: '2min', value: 120 },
  { label: '3min', value: 180 },
];

export function AddExerciseParamsScreen({ navigation, route }: Props) {
  const { sheetId, exercise, orderIndex } = route.params;
  const [sets, setSets] = useState('3');
  const [reps, setReps] = useState('12');
  const [load, setLoad] = useState('');
  const [rest, setRest] = useState<number | null>(60);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await supabase.from('sheet_exercises').insert({
      sheet_id: sheetId,
      exercise_id: exercise.id,
      sets: parseInt(sets) || 3,
      reps: reps.trim() || '12',
      load: load.trim() || null,
      rest_seconds: rest,
      notes: notes.trim() || null,
      order_index: orderIndex,
    });
    setSaving(false);
    navigation.pop(2);
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-dark">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View className="px-6 pt-4 pb-10">
            <TouchableOpacity className="mb-6" onPress={() => navigation.goBack()}>
              <Text className="text-brand-green text-sm">← Voltar</Text>
            </TouchableOpacity>

            <Text className="text-2xl font-bold text-white mb-1">{exercise.name}</Text>
            <Text className="text-gray-400 text-sm mb-8">Defina os parâmetros para este exercício</Text>

            {/* Séries e Repetições */}
            <View className="flex-row gap-4 mb-4">
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-400 mb-1">Séries</Text>
                <TextInput
                  className="bg-brand-dark-2 border border-brand-dark-3 rounded-xl px-4 py-3 text-base text-white"
                  placeholder="3"
                  placeholderTextColor="#6b7280"
                  keyboardType="number-pad"
                  value={sets}
                  onChangeText={setSets}
                />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-400 mb-1">Repetições</Text>
                <TextInput
                  className="bg-brand-dark-2 border border-brand-dark-3 rounded-xl px-4 py-3 text-base text-white"
                  placeholder="12"
                  placeholderTextColor="#6b7280"
                  value={reps}
                  onChangeText={setReps}
                />
              </View>
            </View>

            {/* Carga */}
            <Text className="text-sm font-medium text-gray-400 mb-1">Carga</Text>
            <TextInput
              className="bg-brand-dark-2 border border-brand-dark-3 rounded-xl px-4 py-3 text-base text-white mb-4"
              placeholder="Ex: 20kg, Corporal, 3 placas..."
              placeholderTextColor="#6b7280"
              autoCapitalize="none"
              value={load}
              onChangeText={setLoad}
            />

            {/* Descanso */}
            <Text className="text-sm font-medium text-gray-400 mb-2">Descanso</Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {REST_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  className={`px-4 py-2 rounded-full border ${rest === opt.value ? 'bg-brand-green border-brand-green' : 'border-brand-dark-3 bg-brand-dark-2'}`}
                  onPress={() => setRest(rest === opt.value ? null : opt.value)}
                >
                  <Text className={`text-sm font-medium ${rest === opt.value ? 'text-brand-dark' : 'text-gray-400'}`}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Observações */}
            <Text className="text-sm font-medium text-gray-400 mb-1">Observações</Text>
            <TextInput
              className="bg-brand-dark-2 border border-brand-dark-3 rounded-xl px-4 py-3 text-base text-white mb-8"
              placeholder="Ex: Manter costas neutras, controlar a descida..."
              placeholderTextColor="#6b7280"
              autoCapitalize="sentences"
              multiline
              numberOfLines={3}
              value={notes}
              onChangeText={setNotes}
            />

            <TouchableOpacity
              className={`rounded-xl py-4 items-center ${saving ? 'bg-brand-green-dark' : 'bg-brand-green'}`}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#1A1D1C" />
              ) : (
                <Text className="text-brand-dark font-bold text-base">Adicionar à ficha</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
