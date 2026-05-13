import { useState, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import {
  getLevelInfo,
  getLevelTitle,
  ACHIEVEMENTS,
  checkAchievements,
  computeStats,
} from '../../lib/gamification';

type RankingEntry = {
  student_id: string;
  student_name: string;
  avatar_url: string | null;
  workout_count: number;
  rank: number;
};

type Period = 'month' | 'semester' | 'year';

const PERIODS: { key: Period; label: string }[] = [
  { key: 'month',    label: 'Mês'      },
  { key: 'semester', label: 'Semestre' },
  { key: 'year',     label: 'Ano'      },
];

const RANK_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];

export function ConquistasScreen() {
  const { profile } = useAuthStore();

  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingRanking, setLoadingRanking] = useState(false);

  const [levelInfo, setLevelInfo] = useState({
    level: 1, currentXP: 0, nextLevelXP: 30, totalXP: 0,
  });
  const [unlockedAchievements, setUnlockedAchievements] = useState<Set<string>>(new Set());

  const [period, setPeriod] = useState<Period>('month');
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadStats();
      loadRanking('month');
    }, [])
  );

  async function loadStats() {
    setLoadingStats(true);
    const { data: logData } = await supabase
      .from('workout_logs')
      .select('finished_at')
      .eq('student_id', profile!.id)
      .not('finished_at', 'is', null);

    const logs = (logData ?? []) as { finished_at: string }[];
    const stats = computeStats(logs);
    setLevelInfo(getLevelInfo(stats.activeDays));
    setUnlockedAchievements(checkAchievements(stats));
    setLoadingStats(false);
  }

  async function loadRanking(p: Period) {
    setLoadingRanking(true);
    const { data: rankData } = await supabase.rpc('get_ranking', { period: p });
    const rankList = (rankData ?? []) as RankingEntry[];
    setRanking(rankList);
    const myEntry = rankList.find((r) => r.student_id === profile!.id);
    setMyRank(myEntry?.rank ?? null);
    setLoadingRanking(false);
  }

  function handlePeriodChange(p: Period) {
    setPeriod(p);
    loadRanking(p);
  }

  const xpProgress =
    levelInfo.nextLevelXP > 0
      ? Math.min((levelInfo.currentXP / levelInfo.nextLevelXP) * 100, 100)
      : 100;

  if (loadingStats) {
    return (
      <SafeAreaView className="flex-1 bg-brand-dark items-center justify-center">
        <ActivityIndicator color="#8DC63F" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-dark">
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="px-6 pt-8 pb-4">
          <Text className="text-white text-2xl font-bold">Conquistas</Text>
          <Text className="text-gray-400 text-sm mt-1">Seu progresso no PowerLink</Text>
        </View>

        {/* Card de Nível */}
        <View className="mx-6 bg-brand-dark-2 rounded-2xl p-5 mb-4">
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-gray-400 text-xs uppercase font-semibold mb-0.5">
                {getLevelTitle(levelInfo.level)}
              </Text>
              <Text className="text-white text-3xl font-bold">
                Nível {levelInfo.level}
              </Text>
            </View>
            <View className="w-16 h-16 rounded-full bg-brand-green/20 items-center justify-center">
              <Text className="text-brand-green text-2xl font-bold">{levelInfo.level}</Text>
            </View>
          </View>

          <View className="flex-row justify-between mb-1">
            <Text className="text-gray-500 text-xs">Progresso</Text>
            <Text className="text-gray-400 text-xs">
              {levelInfo.currentXP} / {levelInfo.nextLevelXP} XP
            </Text>
          </View>
          <View className="h-2 bg-brand-dark-3 rounded-full overflow-hidden mb-2">
            <View
              className="h-full bg-brand-green rounded-full"
              style={{ width: `${xpProgress}%` }}
            />
          </View>
          <Text className="text-gray-600 text-xs">
            {levelInfo.totalXP} XP total · {Math.floor(levelInfo.totalXP / 30)} treinos realizados
          </Text>
        </View>

        {/* Ranking */}
        <View className="mx-6 mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-white font-bold text-base">Ranking</Text>
            {myRank != null && (
              <View className="bg-brand-green/20 rounded-full px-2 py-0.5">
                <Text className="text-brand-green text-xs font-semibold">
                  #{myRank} você
                </Text>
              </View>
            )}
          </View>

          {/* Seletor de período */}
          <View className="flex-row bg-brand-dark-2 rounded-xl p-1 mb-3">
            {PERIODS.map(({ key, label }) => {
              const selected = period === key;
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => handlePeriodChange(key)}
                  className="flex-1 rounded-lg py-2 items-center"
                  style={{ backgroundColor: selected ? '#8DC63F' : 'transparent' }}
                >
                  <Text
                    className="text-xs font-semibold"
                    style={{ color: selected ? '#1A1D1C' : '#6b7280' }}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Lista do ranking */}
          <View className="bg-brand-dark-2 rounded-2xl overflow-hidden">
            {loadingRanking ? (
              <View className="py-8 items-center">
                <ActivityIndicator color="#8DC63F" />
              </View>
            ) : ranking.length === 0 ? (
              <View className="p-5 items-center">
                <Ionicons name="trophy-outline" size={32} color="#374151" />
                <Text className="text-gray-500 text-sm mt-2">
                  Nenhum treino neste período ainda.
                </Text>
              </View>
            ) : (
              ranking.slice(0, 10).map((entry, idx) => {
                const isMe = entry.student_id === profile!.id;
                const color = idx < 3 ? RANK_COLORS[idx] : '#6b7280';
                const isLast = idx === Math.min(ranking.length, 10) - 1;
                return (
                  <View
                    key={entry.student_id}
                    className="flex-row items-center px-4 py-3"
                    style={{
                      backgroundColor: isMe ? '#8DC63F15' : 'transparent',
                      borderBottomWidth: isLast ? 0 : 1,
                      borderBottomColor: '#2E3330',
                    }}
                  >
                    <Text
                      className="w-6 text-xs font-bold text-center mr-3"
                      style={{ color }}
                    >
                      {idx + 1}
                    </Text>
                    <View className="w-8 h-8 rounded-full bg-brand-dark items-center justify-center mr-3">
                      <Text className="text-white text-xs font-bold">
                        {entry.student_name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <Text
                      className="flex-1 text-sm font-semibold"
                      style={{ color: isMe ? '#8DC63F' : '#fff' }}
                      numberOfLines={1}
                    >
                      {isMe ? `${entry.student_name} (você)` : entry.student_name}
                    </Text>
                    <Text className="text-gray-400 text-sm font-semibold">
                      {entry.workout_count} treino{entry.workout_count !== 1 ? 's' : ''}
                    </Text>
                  </View>
                );
              })
            )}
          </View>
        </View>

        {/* Medalhas */}
        <View className="mx-6">
          <Text className="text-white font-bold text-base mb-3">
            Medalhas ({unlockedAchievements.size}/{ACHIEVEMENTS.length})
          </Text>
          <View className="flex-row flex-wrap">
            {ACHIEVEMENTS.map((ach, idx) => {
              const unlocked = unlockedAchievements.has(ach.id);
              return (
                <View
                  key={ach.id}
                  className="bg-brand-dark-2 rounded-2xl p-4 mb-3"
                  style={{
                    width: '48%',
                    marginRight: idx % 2 === 0 ? '4%' : 0,
                    opacity: unlocked ? 1 : 0.35,
                  }}
                >
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center mb-2"
                    style={{ backgroundColor: unlocked ? '#8DC63F22' : '#2E3330' }}
                  >
                    <Ionicons
                      name={ach.icon as any}
                      size={20}
                      color={unlocked ? '#8DC63F' : '#4B5563'}
                    />
                  </View>
                  <Text className="text-white text-xs font-bold mb-0.5">{ach.title}</Text>
                  <Text className="text-gray-500 text-xs leading-4">{ach.description}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
