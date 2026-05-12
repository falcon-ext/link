import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParams } from '../../navigation/AuthStack';
import { supabase } from '../../lib/supabase';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParams, 'Register'>;
};

export function RegisterScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleRegister() {
    if (!name || !email || !password || !confirmPassword || !accessCode) {
      setError('Preencha todos os campos.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setLoading(true);
    setError('');

    // Valida o código de acesso
    const { data: settings, error: settingsError } = await supabase
      .from('app_settings')
      .select('access_code')
      .eq('id', 1)
      .single();

    if (settingsError || !settings) {
      setError('Erro ao verificar código. Tente novamente.');
      setLoading(false);
      return;
    }

    if (settings.access_code !== accessCode.trim()) {
      setError('Código de acesso inválido.');
      setLoading(false);
      return;
    }

    // Cria o usuário
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });

    if (signUpError || !data.user) {
      setError(signUpError?.message ?? 'Erro ao criar conta. Tente novamente.');
      setLoading(false);
      return;
    }

    // Cria o perfil
    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      role: 'student',
      name: name.trim(),
      email: email.trim().toLowerCase(),
    });

    setLoading(false);

    if (profileError) {
      setError('Conta criada, mas erro ao salvar perfil. Contate seu personal.');
      return;
    }

    // O listener em App.tsx redireciona automaticamente
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 justify-center px-6 py-10">
          <TouchableOpacity className="mb-6" onPress={() => navigation.goBack()}>
            <Text className="text-indigo-600 text-sm">← Voltar</Text>
          </TouchableOpacity>

          <Text className="text-3xl font-bold text-gray-900 mb-1">Cadastro</Text>
          <Text className="text-base text-gray-500 mb-8">Crie sua conta de aluno</Text>

          <Text className="text-sm font-medium text-gray-700 mb-1">Nome completo</Text>
          <TextInput
            className="border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900 mb-4"
            placeholder="Seu nome"
            placeholderTextColor="#9ca3af"
            autoCapitalize="words"
            value={name}
            onChangeText={setName}
          />

          <Text className="text-sm font-medium text-gray-700 mb-1">E-mail</Text>
          <TextInput
            className="border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900 mb-4"
            placeholder="seu@email.com"
            placeholderTextColor="#9ca3af"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <Text className="text-sm font-medium text-gray-700 mb-1">Senha</Text>
          <TextInput
            className="border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900 mb-4"
            placeholder="Mínimo 6 caracteres"
            placeholderTextColor="#9ca3af"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <Text className="text-sm font-medium text-gray-700 mb-1">Confirmar senha</Text>
          <TextInput
            className="border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900 mb-4"
            placeholder="Repita a senha"
            placeholderTextColor="#9ca3af"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          <Text className="text-sm font-medium text-gray-700 mb-1">Código de acesso</Text>
          <TextInput
            className="border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900 mb-6"
            placeholder="Fornecido pelo seu personal"
            placeholderTextColor="#9ca3af"
            autoCapitalize="none"
            value={accessCode}
            onChangeText={setAccessCode}
          />

          {error ? (
            <Text className="text-sm text-red-500 mb-4 text-center">{error}</Text>
          ) : null}

          <TouchableOpacity
            className={`rounded-xl py-4 items-center ${loading ? 'bg-indigo-300' : 'bg-indigo-600'}`}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-base">Criar conta</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
