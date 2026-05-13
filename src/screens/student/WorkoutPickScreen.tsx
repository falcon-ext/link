import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { StudentWorkoutStackParams } from '../../navigation/StudentWorkoutStack';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { Program, WorkoutSheet } from '../../types';

type Props = {
  navigation: NativeStackNavigationProp<StudentWorkoutStackParams, 'WorkoutPick'>;
};

type ProgramWithSheets = Program & { sheets: WorkoutSheet[] };

export function WorkoutPickScreen({ navigation }: Props) {
  const { profile } = useAuthStore();
  const [programs, setPrograms]         = useState<ProgramWithSheets[]>([]);
  const [trainedToday, setTrainedToday] = useState<Set<string>>(new Set());
  const [loading, setLoading]           = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!profile) return;
      loadData();
    }, [profile?.id])
  );

  async function loadData() {
    setLoading(true);

    const { data: progData } = await supabase
      .from('programs')
      .select('*')
      .eq('student_id', profile!.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    const progs = (progData as Program[]) ?? [];

    if (progs.length > 0) {
      const progIds = progs.map((p) => p.id);

      const { data: sheetData } = await supabase
        .from('workout_sheets')
        .select('*')
        .in('program_id', progIds)
        .order('order_index');

      const sheets = (sheetData as WorkoutSheet[]) ?? [];

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { data: todayLogs } = await supabase
        .from('workout_logs')
        .select('sheet_id')
        .eq('student_id', profile!.id)
        .gte('finished_at', todayStart.toISOString())
        .not('finished_at', 'is', null);
      setTrainedToday(new Set((todayLogs ?? []).map((l: any) => l.sheet_id)));

      setPrograms(progs.map((p) => ({
        ...p,
        sheets: sheets.filter((s) => s.program_id === p.id),
      })));
    } else {
      setPrograms([]);
      setTrainedToday(new Set());
    }

    setLoading(false);
  }

  const totalSheets = programs.reduce((acc, p) => acc + p.sheets.length, 0);

  return (
    <SafeAreaView className="flex-1 bg-brand-dark">
      <View className="px-6 pt-6 pb-4">
        <Text className="text-2xl font-bold text-white">Treino</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#8DC63F" />
        </View>
      ) : programs.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="document-text-outline" size={56} color="#374151" />
          <Text className="text-gray-400 text-lg font-semibold mt-4 text-center">
            Nenhuma ficha ativa
          </Text>
          <Text className="text-gray-600 text-sm mt-2 text-center">
            Seu personal ainda não criou uma ficha para você.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}>
          {programs.map((program) => (
            <View key={program.id} className="mb-6">
              {/* Cabeçalho da ficha — só aparece se houver mais de uma */}
              {programs.length > 1 && (
                <View className="mb-3">
                  <Text className="text-gray-400 text-xs uppercase font-semibold mb-0.5">Ficha</Text>
                  <Text className="text-white text-lg font-bold">{program.name}</Text>
                </View>
              )}

              {programs.length === 1 && (
                <View className="mb-4">
                  <Text className="text-gray-400 text-sm mb-0.5">Ficha atual</Text>
                  <Text className="text-white text-xl font-bold">{program.name}</Text>
                </View>
              )}

              {program.sheets.length === 0 ? (
                <Text className="text-gray-500 text-sm text-center py-4">
                  Nenhum treino cadastrado nesta ficha.
                </Text>
              ) : (
                program.sheets.map((sheet, index) => {
                  const done = trainedToday.has(sheet.id);
                  return (
                    <TouchableOpacity
                      key={sheet.id}
                      className="bg-brand-dark-2 rounded-2xl p-5 mb-3 flex-row items-center"
                      style={{ opacity: done ? 0.55 : 1 }}
                      onPress={() => {
                        if (done) {
                          Alert.alert(
                            'Treino já realizado',
                            `Você já fez "${sheet.name}" hoje. Volte amanhã! 💪`,
                          );
                          return;
                        }
                        navigation.navigate('WorkoutExecution', { sheet, program });
                      }}
                    >
                      <View
                        className="w-12 h-12 rounded-full items-center justify-center mr-4"
                        style={{ backgroundColor: done ? '#2E3330' : '#8DC63F22' }}
                      >
                        {done ? (
                          <Ionicons name="checkmark" size={22} color="#8DC63F" />
                        ) : (
                          <Text className="text-brand-green text-lg font-bold">
                            {String.fromCharCode(65 + index)}
                          </Text>
                        )}
                      </View>
                      <View className="flex-1">
                        <Text className="text-white font-bold text-base">{sheet.name}</Text>
                        {done && (
                          <Text className="text-brand-green text-xs mt-0.5">Concluído hoje ✓</Text>
                        )}
                      </View>
                      {done ? (
                        <TouchableOpacity
                          onPress={() => navigation.navigate('WorkoutView', { sheet })}
                          className="bg-brand-dark px-3 py-1.5 rounded-full"
                          hitSlop={8}
                        >
                          <Text className="text-gray-400 text-xs font-semibold">Ver</Text>
                        </TouchableOpacity>
                      ) : (
                        <Ionicons name="chevron-forward" size={22} color="#8DC63F" />
                      )}
                    </TouchableOpacity>
                  );
                })
              )}

              {/* Separador entre fichas */}
              {programs.length > 1 && (
                <View className="h-px bg-brand-dark-3 mt-2" />
              )}
            </View>
          ))}

          {totalSheets === 0 && programs.length > 0 && (
            <View className="items-center mt-8">
              <Text className="text-gray-500 text-center">
                Suas fichas ainda não têm treinos cadastrados.
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
