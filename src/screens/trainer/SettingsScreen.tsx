import { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';

export function SettingsScreen() {
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    Alert.alert('Sair', 'Deseja encerrar a sessão?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          await supabase.auth.signOut();
          setLoading(false);
          // O listener em App.tsx redireciona para o AuthStack automaticamente
        },
      },
    ]);
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-6 pt-6">
        <Text className="text-2xl font-bold text-gray-900 mb-8">Configurações</Text>

        <TouchableOpacity
          className="flex-row items-center justify-between py-4 border-b border-gray-100"
          onPress={() => {}}
        >
          <Text className="text-base text-gray-800">Código de acesso dos alunos</Text>
          <Text className="text-gray-400">›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="mt-8 bg-red-50 border border-red-200 rounded-xl py-4 items-center"
          onPress={handleLogout}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ef4444" />
          ) : (
            <Text className="text-red-500 font-semibold text-base">Sair da conta</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
