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
  navigation: NativeStackNavigationProp<StudentsStackParams, 'EditSheetExercise'>;
  route: RouteProp<StudentsStackParams, 'EditSheetExercise'>;
};

const REST_OPTIONS = [
  { label: '30s', value: 30 },
  { label: '45s', value: 45 },
  { label: '1min', value: 60 },
  { label: '90s', value: 90 },
  { label: '2min', value: 120 },
  { label: '3min', value: 180 },
];

export function EditSheetExerciseScreen({ navigation, route }: Props) {
  const { sheetExercise } = route.params;

  const [sets, setSets] = useState(String(sheetExercise.sets));
  const [reps, setReps] = useState(sheetExercise.reps);
  const [load, setLoad] = useState(sheetExercise.load ?? '');
  const [rest, setRest] = useState<number | null>(sheetExercise.rest_seconds);
  const [notes, setNotes] = useState(sheetExercise.notes ?? '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await supabase.from('sheet_exercises').update({
      sets: parseInt(sets) || 3,
      reps: reps.trim() || '12',
      load: load.trim() || null,
      rest_seconds: rest,
      notes: notes.trim() || null,
    }).eq('id', sheetExercise.id);
    setSaving(false);
    navigation.goBack();
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-dark">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View className="px-6 pt-4 pb-10">
            <TouchableOpacity className="mb-6" onPress={() => navigation.goBack()}>
              <Text className="text-brand-green text-sm">← Voltar</Text>
            </TouchableOpacity>

            <Text className="text-2xl font-bold text-white mb-1">
              {sheetExercise.exercise?.name ?? 'Exercício'}
            </Text>
            <Text className="text-gray-400 text-sm mb-8">Editar parâmetros</Text>

            <View className="flex-row gap-4 mb-4">
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-400 mb-1">Séries</Text>
                <TextInput
                  className="bg-brand-dark-2 border border-brand-dark-3 rounded-xl px-4 py-3 text-base text-white"
                  keyboardType="number-pad"
                  value={sets}
                  onChangeText={setSets}
                />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-400 mb-1">Repetições</Text>
                <TextInput
                  className="bg-brand-dark-2 border border-brand-dark-3 rounded-xl px-4 py-3 text-base text-white"
                  value={reps}
                  onChangeText={setReps}
                />
              </View>
            </View>

            <Text className="text-sm font-medium text-gray-400 mb-1">Carga</Text>
            <TextInput
              className="bg-brand-dark-2 border border-brand-dark-3 rounded-xl px-4 py-3 text-base text-white mb-4"
              placeholder="Ex: 20kg, Corporal..."
              placeholderTextColor="#6b7280"
              autoCapitalize="none"
              value={load}
              onChangeText={setLoad}
            />

            <Text className="text-sm font-medium text-gray-400 mb-2">Descanso</Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {REST_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  activeOpacity={0.7}
                  onPress={() => setRest(rest === opt.value ? null : opt.value)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: rest === opt.value ? '#8DC63F' : '#2E3330',
                    backgroundColor: rest === opt.value ? '#8DC63F' : '#242827',
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '500', color: rest === opt.value ? '#1A1D1C' : '#9CA3AF' }}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text className="text-sm font-medium text-gray-400 mb-1">Observações</Text>
            <TextInput
              className="bg-brand-dark-2 border border-brand-dark-3 rounded-xl px-4 py-3 text-base text-white mb-8"
              placeholder="Ex: Manter costas neutras..."
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
                <Text className="text-brand-dark font-bold text-base">Salvar alterações</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
