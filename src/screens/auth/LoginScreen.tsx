import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
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
    if (authError) setError('E-mail ou senha incorretos.');
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-dark">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View className="flex-1 justify-center px-6">

          {/* Logo */}
          <View className="items-center mb-12">
            <Image
              source={require('../../../PowerLink.png')}
              className="w-36 h-36"
              resizeMode="contain"
            />
          </View>

          {/* Campos */}
          <Text className="text-sm font-medium text-gray-400 mb-1">E-mail</Text>
          <TextInput
            className="bg-brand-dark-2 border border-brand-dark-3 rounded-xl px-4 py-3 text-base text-white mb-4"
            placeholder="seu@email.com"
            placeholderTextColor="#6b7280"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <Text className="text-sm font-medium text-gray-400 mb-1">Senha</Text>
          <TextInput
            className="bg-brand-dark-2 border border-brand-dark-3 rounded-xl px-4 py-3 text-base text-white mb-2"
            placeholder="••••••••"
            placeholderTextColor="#6b7280"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity
            className="self-end mb-6"
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text className="text-sm text-brand-green">Esqueci minha senha</Text>
          </TouchableOpacity>

          {error ? (
            <Text className="text-sm text-red-400 mb-4 text-center">{error}</Text>
          ) : null}

          <TouchableOpacity
            className={`rounded-xl py-4 items-center ${loading ? 'bg-brand-green-dark' : 'bg-brand-green'}`}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#1A1D1C" />
            ) : (
              <Text className="text-brand-dark font-bold text-base">Entrar</Text>
            )}
          </TouchableOpacity>


        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
