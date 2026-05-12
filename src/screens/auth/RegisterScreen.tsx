import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
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

    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });

    if (signUpError || !data.user) {
      setError(signUpError?.message ?? 'Erro ao criar conta. Tente novamente.');
      setLoading(false);
      return;
    }

    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      role: 'student',
      name: name.trim(),
      email: email.trim().toLowerCase(),
    });

    setLoading(false);

    if (profileError) {
      setError('Conta criada, mas erro ao salvar perfil. Contate seu personal.');
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-dark">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View className="flex-1 px-6 py-8">

            <TouchableOpacity className="mb-8" onPress={() => navigation.goBack()}>
              <Text className="text-brand-green text-sm">← Voltar</Text>
            </TouchableOpacity>

            <Text className="text-3xl font-bold text-white mb-1">Cadastro</Text>
            <Text className="text-base text-gray-400 mb-8">Crie sua conta de aluno</Text>

            {[
              { label: 'Nome completo', value: name, setter: setName, placeholder: 'Seu nome', caps: 'words' as const, keyboard: 'default' as const, secure: false },
              { label: 'E-mail', value: email, setter: setEmail, placeholder: 'seu@email.com', caps: 'none' as const, keyboard: 'email-address' as const, secure: false },
              { label: 'Senha', value: password, setter: setPassword, placeholder: 'Mínimo 6 caracteres', caps: 'none' as const, keyboard: 'default' as const, secure: true },
              { label: 'Confirmar senha', value: confirmPassword, setter: setConfirmPassword, placeholder: 'Repita a senha', caps: 'none' as const, keyboard: 'default' as const, secure: true },
              { label: 'Código de acesso', value: accessCode, setter: setAccessCode, placeholder: 'Fornecido pelo seu personal', caps: 'none' as const, keyboard: 'default' as const, secure: false },
            ].map(({ label, value, setter, placeholder, caps, keyboard, secure }) => (
              <View key={label}>
                <Text className="text-sm font-medium text-gray-400 mb-1">{label}</Text>
                <TextInput
                  className="bg-brand-dark-2 border border-brand-dark-3 rounded-xl px-4 py-3 text-base text-white mb-4"
                  placeholder={placeholder}
                  placeholderTextColor="#6b7280"
                  autoCapitalize={caps}
                  keyboardType={keyboard}
                  secureTextEntry={secure}
                  value={value}
                  onChangeText={setter}
                />
              </View>
            ))}

            {error ? (
              <Text className="text-sm text-red-400 mb-4 text-center">{error}</Text>
            ) : null}

            <TouchableOpacity
              className={`rounded-xl py-4 items-center mt-2 ${loading ? 'bg-brand-green-dark' : 'bg-brand-green'}`}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#1A1D1C" />
              ) : (
                <Text className="text-brand-dark font-bold text-base">Criar conta</Text>
              )}
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
