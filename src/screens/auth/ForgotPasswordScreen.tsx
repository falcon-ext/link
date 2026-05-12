import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthStackParams } from '../../navigation/AuthStack';
import { supabase } from '../../lib/supabase';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParams, 'ForgotPassword'>;
};

export function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSend() {
    if (!email) {
      setError('Digite seu e-mail.');
      return;
    }
    setLoading(true);
    setError('');
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
    setLoading(false);
    if (resetError) {
      setError('Não foi possível enviar o e-mail. Verifique o endereço.');
      return;
    }
    setSent(true);
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-dark">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View className="flex-1 justify-center px-6">

          <TouchableOpacity className="mb-8" onPress={() => navigation.goBack()}>
            <Text className="text-brand-green text-sm">← Voltar</Text>
          </TouchableOpacity>

          <Text className="text-3xl font-bold text-white mb-1">Recuperar senha</Text>
          <Text className="text-base text-gray-400 mb-8">
            Enviaremos um link para redefinir sua senha.
          </Text>

          {sent ? (
            <View className="bg-brand-dark-2 border border-brand-green rounded-xl p-5 items-center">
              <Text className="text-brand-green font-bold text-base mb-1">E-mail enviado!</Text>
              <Text className="text-gray-400 text-sm text-center">
                Verifique sua caixa de entrada e siga as instruções.
              </Text>
              <TouchableOpacity className="mt-4" onPress={() => navigation.goBack()}>
                <Text className="text-brand-green font-medium">Voltar para o login</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text className="text-sm font-medium text-gray-400 mb-1">E-mail</Text>
              <TextInput
                className="bg-brand-dark-2 border border-brand-dark-3 rounded-xl px-4 py-3 text-base text-white mb-6"
                placeholder="seu@email.com"
                placeholderTextColor="#6b7280"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />

              {error ? (
                <Text className="text-sm text-red-400 mb-4 text-center">{error}</Text>
              ) : null}

              <TouchableOpacity
                className={`rounded-xl py-4 items-center ${loading ? 'bg-brand-green-dark' : 'bg-brand-green'}`}
                onPress={handleSend}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#1A1D1C" />
                ) : (
                  <Text className="text-brand-dark font-bold text-base">Enviar link</Text>
                )}
              </TouchableOpacity>
            </>
          )}

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
