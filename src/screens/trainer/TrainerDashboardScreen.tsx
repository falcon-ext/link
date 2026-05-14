import { useCallback, useState } from 'react';
import {
  View, Text, ActivityIndicator, ScrollView, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

type StudentSnap = {
  id: string;
  name: string;
  avatar_url: string | null;
};

function todayISO() {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

function startOfWeekISO() {
  const d = new Date();
  const day = d.getDay(); // 0 = domingo
  const diff = day === 0 ? -6 : 1 - day; // segunda-feira
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}

function sevenDaysAgoISO() {
  const d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return d.toISOString().split('T')[0];
}

function Avatar({ student, size = 52 }: { student: StudentSnap; size?: number }) {
  const initials = student.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', backgroundColor: '#2E3330', alignItems: 'center', justifyContent: 'center' }}>
      {student.avatar_url ? (
        <Image source={{ uri: student.avatar_url }} style={{ width: size, height: size }} resizeMode="cover" />
      ) : (
        <Text style={{ color: '#8DC63F', fontSize: size * 0.33, fontWeight: 'bold' }}>{initials}</Text>
      )}
    </View>
  );
}

export function TrainerDashboardScreen() {
  const { profile } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [totalActive, setTotalActive]       = useState(0);
  const [trainedToday, setTrainedToday]     = useState<StudentSnap[]>([]);
  const [weekCount, setWeekCount]           = useState(0);
  const [sumidos, setSumidos]               = useState<StudentSnap[]>([]);

  useFocusEffect(useCallback(() => { load(); }, []));

  async function load() {
    setLoading(true);

    const today      = todayISO();
    const tomorrow   = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const weekStart  = startOfWeekISO();
    const sevenAgo   = sevenDaysAgoISO();

    // Todos os alunos ativos
    const { data: activeData } = await supabase
      .from('profiles')
      .select('id, name, avatar_url')
      .eq('role', 'student')
      .eq('is_active', true);
    const activeStudents = (activeData ?? []) as StudentSnap[];
    setTotalActive(activeStudents.length);

    // Quem treinou hoje
    const { data: todayLogs } = await supabase
      .from('workout_logs')
      .select('student_id')
      .gte('finished_at', today)
      .lt('finished_at', tomorrow)
      .not('finished_at', 'is', null);

    const todayIds = new Set((todayLogs ?? []).map((l: any) => l.student_id));
    setTrainedToday(activeStudents.filter((s) => todayIds.has(s.id)));

    // Treinos na semana
    const { count: wCount } = await supabase
      .from('workout_logs')
      .select('id', { count: 'exact', head: true })
      .gte('finished_at', weekStart)
      .not('finished_at', 'is', null);
    setWeekCount(wCount ?? 0);

    // Alunos que não treinaram nos últimos 7 dias
    const { data: recentLogs } = await supabase
      .from('workout_logs')
      .select('student_id')
      .gte('finished_at', sevenAgo)
      .not('finished_at', 'is', null);

    const recentIds = new Set((recentLogs ?? []).map((l: any) => l.student_id));
    setSumidos(activeStudents.filter((s) => !recentIds.has(s.id)));

    setLoading(false);
  }

  const firstName = profile?.name?.split(' ')[0] ?? '';
  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });

  return (
    <SafeAreaView className="flex-1 bg-brand-dark">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View className="px-6 pt-6 pb-4">
          <Text className="text-gray-400 text-sm capitalize">{today}</Text>
          <Text className="text-white text-2xl font-bold mt-0.5">Olá, {firstName} 👋</Text>
        </View>

        {loading ? (
          <View className="items-center mt-16">
            <ActivityIndicator color="#8DC63F" />
          </View>
        ) : (
          <View className="px-6">

            {/* Cards de números */}
            <View className="flex-row gap-4 mb-6">
              <View className="flex-1 bg-brand-dark-2 rounded-2xl p-5">
                <Text className="text-brand-green text-3xl font-bold">
                  {trainedToday.length}
                  <Text className="text-gray-500 text-lg font-normal">/{totalActive}</Text>
                </Text>
                <Text className="text-gray-400 text-sm mt-1">Treinaram hoje</Text>
              </View>
              <View className="flex-1 bg-brand-dark-2 rounded-2xl p-5">
                <Text className="text-brand-green text-3xl font-bold">{weekCount}</Text>
                <Text className="text-gray-400 text-sm mt-1">Treinos na semana</Text>
              </View>
            </View>

            {/* Quem treinou hoje */}
            <View className="bg-brand-dark-2 rounded-2xl p-5 mb-4">
              <Text className="text-white font-semibold mb-1">Treinaram hoje</Text>
              {trainedToday.length === 0 ? (
                <Text className="text-gray-600 text-sm mt-2">Nenhum aluno treinou ainda hoje.</Text>
              ) : (
                <View className="mt-3 flex-row flex-wrap gap-3">
                  {trainedToday.map((s) => (
                    <View key={s.id} className="items-center" style={{ width: 56 }}>
                      <Avatar student={s} size={48} />
                      <Text className="text-gray-400 text-xs mt-1 text-center" numberOfLines={1}>
                        {s.name.split(' ')[0]}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Sumidos */}
            <View className="bg-brand-dark-2 rounded-2xl p-5 mb-4">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-white font-semibold">Não treinam há 7+ dias</Text>
                {sumidos.length > 0 && (
                  <View className="bg-red-900/50 rounded-full px-2.5 py-0.5">
                    <Text className="text-red-400 text-xs font-bold">{sumidos.length}</Text>
                  </View>
                )}
              </View>
              {sumidos.length === 0 ? (
                <Text className="text-brand-green text-sm mt-2">Todos os alunos treinaram recentemente!</Text>
              ) : (
                <View className="mt-3 flex-row flex-wrap gap-3">
                  {sumidos.map((s) => (
                    <View key={s.id} className="items-center" style={{ width: 56 }}>
                      <View style={{ opacity: 0.6 }}>
                        <Avatar student={s} size={48} />
                      </View>
                      <Text className="text-gray-500 text-xs mt-1 text-center" numberOfLines={1}>
                        {s.name.split(' ')[0]}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
