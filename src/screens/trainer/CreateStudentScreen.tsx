import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StudentsStackParams } from '../../navigation/StudentsStack';
import { supabase } from '../../lib/supabase';

type Props = {
  navigation: NativeStackNavigationProp<StudentsStackParams, 'CreateStudent'>;
};

export function CreateStudentScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      Alert.alert('Atenção', 'Preencha todos os campos.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Atenção', 'As senhas não coincidem.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Atenção', 'A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setSaving(true);

    const { data, error } = await supabase.functions.invoke('create-student', {
      body: { name: name.trim(), email: email.trim().toLowerCase(), password },
    });

    setSaving(false);

    if (error || !data?.success) {
      Alert.alert('Erro', data?.error ?? 'Não foi possível criar o aluno.');
      return;
    }

    Alert.alert(
      'Aluno criado!',
      `Conta criada com sucesso.\n\nCompartilhe com ${name.trim()}:\nE-mail: ${email.trim().toLowerCase()}\nSenha: ${password}`,
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-dark">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View className="px-6 pt-4 pb-10">
            <TouchableOpacity className="mb-6" onPress={() => navigation.goBack()}>
              <Text className="text-brand-green text-sm">← Voltar</Text>
            </TouchableOpacity>

            <Text className="text-2xl font-bold text-white mb-1">Novo aluno</Text>
            <Text className="text-gray-400 text-sm mb-8">
              Crie a conta e repasse o e-mail e senha para o aluno.
            </Text>

            <Text className="text-sm font-medium text-gray-400 mb-1">Nome completo</Text>
            <TextInput
              className="bg-brand-dark-2 border border-brand-dark-3 rounded-xl px-4 py-3 text-base text-white mb-4"
              placeholder="Nome do aluno"
              placeholderTextColor="#6b7280"
              autoCapitalize="words"
              value={name}
              onChangeText={setName}
            />

            <Text className="text-sm font-medium text-gray-400 mb-1">E-mail</Text>
            <TextInput
              className="bg-brand-dark-2 border border-brand-dark-3 rounded-xl px-4 py-3 text-base text-white mb-4"
              placeholder="email@aluno.com"
              placeholderTextColor="#6b7280"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />

            <Text className="text-sm font-medium text-gray-400 mb-1">Senha</Text>
            <TextInput
              className="bg-brand-dark-2 border border-brand-dark-3 rounded-xl px-4 py-3 text-base text-white mb-4"
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor="#6b7280"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <Text className="text-sm font-medium text-gray-400 mb-1">Confirmar senha</Text>
            <TextInput
              className="bg-brand-dark-2 border border-brand-dark-3 rounded-xl px-4 py-3 text-base text-white mb-8"
              placeholder="Repita a senha"
              placeholderTextColor="#6b7280"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <TouchableOpacity
              className={`rounded-xl py-4 items-center ${saving ? 'bg-brand-green-dark' : 'bg-brand-green'}`}
              onPress={handleCreate}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#1A1D1C" />
              ) : (
                <Text className="text-brand-dark font-bold text-base">Criar aluno</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
