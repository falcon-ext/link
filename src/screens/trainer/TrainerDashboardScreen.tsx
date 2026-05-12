import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

export function TrainerDashboardScreen() {
  const { profile } = useAuthStore();
  const [totalStudents, setTotalStudents] = useState<number | null>(null);
  const [activeStudents, setActiveStudents] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('profiles')
        .select('is_active')
        .eq('role', 'student');
      setTotalStudents(data?.length ?? 0);
      setActiveStudents(data?.filter((s) => s.is_active).length ?? 0);
      setLoading(false);
    }
    fetch();
  }, []);

  const firstName = profile?.name?.split(' ')[0] ?? '';

  return (
    <SafeAreaView className="flex-1 bg-brand-dark">
      <View className="px-6 pt-6">
        <Text className="text-gray-400 text-sm">Bem-vindo,</Text>
        <Text className="text-white text-2xl font-bold mb-8">{firstName}</Text>

        {loading ? (
          <ActivityIndicator color="#8DC63F" />
        ) : (
          <View className="flex-row gap-4">
            <View className="flex-1 bg-brand-dark-2 rounded-2xl p-5">
              <Text className="text-brand-green text-3xl font-bold">{totalStudents}</Text>
              <Text className="text-gray-400 text-sm mt-1">Alunos cadastrados</Text>
            </View>
            <View className="flex-1 bg-brand-dark-2 rounded-2xl p-5">
              <Text className="text-brand-green text-3xl font-bold">{activeStudents}</Text>
              <Text className="text-gray-400 text-sm mt-1">Alunos ativos</Text>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
