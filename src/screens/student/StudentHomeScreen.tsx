import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { Program, WorkoutSheet } from '../../types';
import { getLevelInfo, getLevelTitle } from '../../lib/gamification';

export function StudentHomeScreen() {
  const { profile } = useAuthStore();
  const navigation = useNavigation<any>();
  const [program, setProgram] = useState<Program | null>(null);
  const [sheets, setSheets] = useState<WorkoutSheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [workoutCount, setWorkoutCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      if (!profile) return;
      loadProgram();
    }, [profile?.id])
  );

  async function loadProgram() {
    setLoading(true);

    const { count } = await supabase
      .from('workout_logs')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', profile!.id)
      .not('finished_at', 'is', null);
    setWorkoutCount(count ?? 0);

    const { data: prog } = await supabase
      .from('programs')
      .select('*')
      .eq('student_id', profile!.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    setProgram(prog ?? null);

    if (prog) {
      const { data: sheetData } = await supabase
        .from('workout_sheets')
        .select('*')
        .eq('program_id', prog.id)
        .order('order_index');
      setSheets((sheetData as WorkoutSheet[]) ?? []);
    } else {
      setSheets([]);
    }
    setLoading(false);
  }

  const firstName = profile?.name?.split(' ')[0] ?? '';
  const { level, currentXP, nextLevelXP } = getLevelInfo(workoutCount);
  const xpProgress = nextLevelXP > 0 ? (currentXP / nextLevelXP) * 100 : 100;

  return (
    <SafeAreaView className="flex-1 bg-brand-dark">
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="px-6 pt-8 pb-4">
          <Text className="text-gray-400 text-sm">Bem-vindo,</Text>
          <Text className="text-white text-3xl font-bold">{firstName} 💪</Text>
        </View>

        {/* Card de nível */}
        <TouchableOpacity
          className="mx-6 bg-brand-dark-2 rounded-2xl px-4 py-3 mb-4"
          onPress={() => navigation.navigate('Conquistas')}
        >
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-white text-sm font-semibold">
              {getLevelTitle(level)} · Nível {level}
            </Text>
            <Text className="text-brand-green text-xs">
              {currentXP}/{nextLevelXP} XP →
            </Text>
          </View>
          <View className="h-1.5 bg-brand-dark-3 rounded-full overflow-hidden">
            <View
              className="h-full bg-brand-green rounded-full"
              style={{ width: `${xpProgress}%` }}
            />
          </View>
        </TouchableOpacity>

        <View className="px-6 mt-2">
          {loading ? (
            <ActivityIndicator color="#8DC63F" />
          ) : program ? (
            <View>
              <View className="bg-brand-dark-2 rounded-2xl p-5 mb-4">
                <Text className="text-xs font-semibold text-gray-500 uppercase mb-1">Ficha Ativa</Text>
                <Text className="text-white text-lg font-bold mb-3">{program.name}</Text>
                <Text className="text-gray-400 text-sm mb-4">{sheets.length} treino{sheets.length !== 1 ? 's' : ''} disponíveis</Text>
                <TouchableOpacity
                  className="bg-brand-green rounded-xl py-3 items-center"
                  onPress={() => navigation.navigate('Workout')}
                >
                  <Text className="text-brand-dark font-bold text-base">Iniciar Treino</Text>
                </TouchableOpacity>
              </View>

              {sheets.length > 0 && (
                <View>
                  <Text className="text-xs font-semibold text-gray-500 uppercase mb-3">Treinos</Text>
                  {sheets.map((sheet, index) => (
                    <TouchableOpacity
                      key={sheet.id}
                      className="bg-brand-dark-2 rounded-2xl p-4 mb-3 flex-row items-center"
                      onPress={() => navigation.navigate('Workout', {
                        screen: 'WorkoutExecution',
                        params: { sheet, program },
                      })}
                    >
                      <View className="w-9 h-9 rounded-full bg-brand-green/20 items-center justify-center mr-3">
                        <Text className="text-brand-green font-bold">
                          {String.fromCharCode(65 + index)}
                        </Text>
                      </View>
                      <Text className="text-white font-semibold flex-1">{sheet.name}</Text>
                      <Ionicons name="play-circle-outline" size={22} color="#8DC63F" />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ) : (
            <View className="items-center mt-16">
              <Ionicons name="document-text-outline" size={56} color="#374151" />
              <Text className="text-gray-400 text-lg font-semibold mt-4 text-center">
                Nenhuma ficha ativa
              </Text>
              <Text className="text-gray-600 text-sm mt-2 text-center">
                Seu personal ainda não criou uma ficha para você.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
