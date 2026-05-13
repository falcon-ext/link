import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Switch, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { StudentsStackParams } from '../../navigation/StudentsStack';
import { supabase } from '../../lib/supabase';
import { sendPushToStudent } from '../../lib/notifications';

type Props = {
  navigation: NativeStackNavigationProp<StudentsStackParams, 'CreateProgram'>;
  route: RouteProp<StudentsStackParams, 'CreateProgram'>;
};

export function CreateProgramScreen({ navigation, route }: Props) {
  const { student } = route.params;
  const [name, setName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert('Atenção', 'Digite o nome da ficha.');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('programs').insert({
      student_id: student.id,
      name: name.trim(),
      is_active: isActive,
    });
    setSaving(false);
    if (!error) {
      sendPushToStudent(
        student.id,
        'Nova ficha de treino! 🏋️',
        `Seu personal criou a ficha "${name.trim()}". Acesse o app para ver.`,
      ).catch(() => {});
    }
    navigation.goBack();
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-dark">
      <View className="px-6 pt-4 pb-10 flex-1">
        <TouchableOpacity className="mb-6" onPress={() => navigation.goBack()}>
          <Text className="text-brand-green text-sm">← Voltar</Text>
        </TouchableOpacity>

        <Text className="text-2xl font-bold text-white mb-2">Nova ficha</Text>
        <Text className="text-gray-400 text-sm mb-8">{student.name}</Text>

        <Text className="text-sm font-medium text-gray-400 mb-1">Nome da ficha</Text>
        <TextInput
          className="bg-brand-dark-2 border border-brand-dark-3 rounded-xl px-4 py-3 text-base text-white mb-6"
          placeholder="Ex: Treino A/B/C — Hipertrofia"
          placeholderTextColor="#6b7280"
          autoCapitalize="sentences"
          value={name}
          onChangeText={setName}
          autoFocus
        />

        <View className="bg-brand-dark-2 rounded-2xl p-5 mb-8 flex-row items-center justify-between">
          <View>
            <Text className="text-white font-medium">Ficha ativa</Text>
            <Text className="text-gray-400 text-xs mt-0.5">Aluno verá esta ficha no app</Text>
          </View>
          <Switch
            value={isActive}
            onValueChange={setIsActive}
            trackColor={{ false: '#374151', true: '#8DC63F' }}
            thumbColor="#fff"
          />
        </View>

        <TouchableOpacity
          className={`rounded-xl py-4 items-center ${saving ? 'bg-brand-green-dark' : 'bg-brand-green'}`}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#1A1D1C" />
          ) : (
            <Text className="text-brand-dark font-bold text-base">Criar ficha</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
