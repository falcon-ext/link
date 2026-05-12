import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParams } from '../../navigation/AuthStack';
import { supabase } from '../../lib/supabase';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParams, 'Login'>;
};

export function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin() {
    if (!email || !password) {
      setError('Preencha e-mail e senha.');
      return;
    }

    setLoading(true);
    setError('');

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (authError) {
      setError('E-mail ou senha incorretos.');
    }
    // Se autenticou, o listener em App.tsx redireciona automaticamente
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View className="flex-1 justify-center px-6">
        <Text className="text-3xl font-bold text-gray-900 mb-1">PowerLink</Text>
        <Text className="text-base text-gray-500 mb-10">Faça login para continuar</Text>

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
          className="border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900 mb-2"
          placeholder="••••••••"
          placeholderTextColor="#9ca3af"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          className="self-end mb-6"
          onPress={() => navigation.navigate('ForgotPassword')}
        >
          <Text className="text-sm text-indigo-600">Esqueci minha senha</Text>
        </TouchableOpacity>

        {error ? (
          <Text className="text-sm text-red-500 mb-4 text-center">{error}</Text>
        ) : null}

        <TouchableOpacity
          className={`rounded-xl py-4 items-center ${loading ? 'bg-indigo-300' : 'bg-indigo-600'}`}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-semibold text-base">Entrar</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          className="mt-6 items-center"
          onPress={() => navigation.navigate('Register')}
        >
          <Text className="text-sm text-gray-500">
            Aluno? <Text className="text-indigo-600 font-medium">Cadastre-se aqui</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
