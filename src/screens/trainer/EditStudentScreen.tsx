import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { StudentsStackParams } from '../../navigation/StudentsStack';
import { supabase } from '../../lib/supabase';

type Props = {
  navigation: NativeStackNavigationProp<StudentsStackParams, 'EditStudent'>;
  route: RouteProp<StudentsStackParams, 'EditStudent'>;
};

export function EditStudentScreen({ navigation, route }: Props) {
  const { student } = route.params;
  const [name, setName] = useState(student.name);
  const [phone, setPhone] = useState(student.phone ?? '');
  const [birthDate, setBirthDate] = useState(student.birth_date ?? '');
  const [goal, setGoal] = useState(student.goal ?? '');
  const [saving, setSaving] = useState(false);

  function formatBirthDate(text: string) {
    const digits = text.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  }

  function parseDateToISO(dateStr: string) {
    const parts = dateStr.split('/');
    if (parts.length !== 3 || parts[2].length !== 4) return null;
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert('Atenção', 'O nome não pode estar vazio.');
      return;
    }

    const isoDate = birthDate ? parseDateToISO(birthDate) : null;
    if (birthDate && !isoDate) {
      Alert.alert('Atenção', 'Data de nascimento inválida. Use o formato DD/MM/AAAA.');
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        name: name.trim(),
        phone: phone.trim() || null,
        birth_date: isoDate,
        goal: goal.trim() || null,
      })
      .eq('id', student.id);
    setSaving(false);

    if (error) {
      Alert.alert('Erro', 'Não foi possível salvar as alterações.');
      return;
    }

    Alert.alert('Sucesso', 'Dados atualizados!', [
      { text: 'OK', onPress: () => navigation.pop(2) },
    ]);
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-dark">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View className="px-6 pt-4 pb-10">
            <TouchableOpacity className="mb-6" onPress={() => navigation.goBack()}>
              <Text className="text-brand-green text-sm">← Voltar</Text>
            </TouchableOpacity>

            <Text className="text-2xl font-bold text-white mb-1">Editar aluno</Text>
            <Text className="text-gray-400 text-sm mb-8">{student.email}</Text>

            {[
              { label: 'Nome completo', value: name, setter: setName, placeholder: 'Nome do aluno', caps: 'words' as const, keyboard: 'default' as const },
              { label: 'Telefone', value: phone, setter: setPhone, placeholder: '(11) 99999-9999', caps: 'none' as const, keyboard: 'phone-pad' as const },
            ].map(({ label, value, setter, placeholder, caps, keyboard }) => (
              <View key={label}>
                <Text className="text-sm font-medium text-gray-400 mb-1">{label}</Text>
                <TextInput
                  className="bg-brand-dark-2 border border-brand-dark-3 rounded-xl px-4 py-3 text-base text-white mb-4"
                  placeholder={placeholder}
                  placeholderTextColor="#6b7280"
                  autoCapitalize={caps}
                  keyboardType={keyboard}
                  value={value}
                  onChangeText={setter}
                />
              </View>
            ))}

            <Text className="text-sm font-medium text-gray-400 mb-1">Data de nascimento</Text>
            <TextInput
              className="bg-brand-dark-2 border border-brand-dark-3 rounded-xl px-4 py-3 text-base text-white mb-4"
              placeholder="DD/MM/AAAA"
              placeholderTextColor="#6b7280"
              keyboardType="numeric"
              value={birthDate}
              onChangeText={(t) => setBirthDate(formatBirthDate(t))}
            />

            <Text className="text-sm font-medium text-gray-400 mb-1">Objetivo</Text>
            <TextInput
              className="bg-brand-dark-2 border border-brand-dark-3 rounded-xl px-4 py-3 text-base text-white mb-8"
              placeholder="Ex: Hipertrofia, emagrecimento..."
              placeholderTextColor="#6b7280"
              autoCapitalize="sentences"
              multiline
              numberOfLines={3}
              value={goal}
              onChangeText={setGoal}
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
