import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

export function SettingsScreen() {
  const { profile } = useAuthStore();
  const [currentCode, setCurrentCode] = useState('');
  const [newCode, setNewCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [loadingCode, setLoadingCode] = useState(false);
  const [savingCode, setSavingCode] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    fetchCode();
  }, []);

  async function fetchCode() {
    setLoadingCode(true);
    const { data } = await supabase
      .from('app_settings')
      .select('access_code')
      .eq('id', 1)
      .single();
    if (data) setCurrentCode(data.access_code);
    setLoadingCode(false);
  }

  async function handleSaveCode() {
    if (!newCode.trim()) {
      Alert.alert('Atenção', 'Digite o novo código antes de salvar.');
      return;
    }
    if (newCode.trim().length < 4) {
      Alert.alert('Atenção', 'O código deve ter no mínimo 4 caracteres.');
      return;
    }

    setSavingCode(true);
    const { error } = await supabase
      .from('app_settings')
      .update({ access_code: newCode.trim(), updated_at: new Date().toISOString() })
      .eq('id', 1);
    setSavingCode(false);

    if (error) {
      Alert.alert('Erro', 'Não foi possível salvar o código.');
      return;
    }

    setCurrentCode(newCode.trim());
    setNewCode('');
    Alert.alert('Sucesso', 'Código de acesso atualizado!');
  }

  async function handleLogout() {
    Alert.alert('Sair', 'Deseja encerrar a sessão?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          await supabase.auth.signOut();
          setLoggingOut(false);
        },
      },
    ]);
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-dark">
      <View className="px-6 pt-6">
        <Text className="text-2xl font-bold text-white mb-2">Configurações</Text>
        <Text className="text-sm text-gray-400 mb-8">
          Olá, {profile?.name?.split(' ')[0]}
        </Text>

        {/* Código de acesso */}
        <View className="bg-brand-dark-2 rounded-2xl p-5 mb-4">
          <Text className="text-base font-semibold text-white mb-1">Código de acesso dos alunos</Text>
          <Text className="text-xs text-gray-400 mb-4">
            Compartilhe este código com seus alunos para que possam se cadastrar no app.
          </Text>

          {/* Código atual */}
          <Text className="text-xs font-medium text-gray-400 mb-1">Código atual</Text>
          {loadingCode ? (
            <ActivityIndicator color="#8DC63F" />
          ) : (
            <View className="flex-row items-center justify-between bg-brand-dark rounded-xl px-4 py-3 mb-4">
              <Text className="text-base text-white font-mono">
                {showCode ? currentCode : '•'.repeat(currentCode.length)}
              </Text>
              <TouchableOpacity onPress={() => setShowCode(!showCode)}>
                <Text className="text-brand-green text-sm">{showCode ? 'Ocultar' : 'Mostrar'}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Novo código */}
          <Text className="text-xs font-medium text-gray-400 mb-1">Novo código</Text>
          <TextInput
            className="bg-brand-dark border border-brand-dark-3 rounded-xl px-4 py-3 text-base text-white mb-4"
            placeholder="Digite o novo código"
            placeholderTextColor="#6b7280"
            autoCapitalize="none"
            value={newCode}
            onChangeText={setNewCode}
          />

          <TouchableOpacity
            className={`rounded-xl py-3 items-center ${savingCode ? 'bg-brand-green-dark' : 'bg-brand-green'}`}
            onPress={handleSaveCode}
            disabled={savingCode}
          >
            {savingCode ? (
              <ActivityIndicator color="#1A1D1C" />
            ) : (
              <Text className="text-brand-dark font-bold">Salvar código</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity
          className="bg-brand-dark-2 border border-red-900 rounded-2xl py-4 items-center mt-4"
          onPress={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut ? (
            <ActivityIndicator color="#ef4444" />
          ) : (
            <Text className="text-red-400 font-semibold">Sair da conta</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
