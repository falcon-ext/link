import { useState, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';

type Assessment = {
  id: string;
  assessed_at: string;
  weight_kg: number | null;
  height_cm: number | null;
  body_fat_pct: number | null;
  chest_cm: number | null;
  waist_cm: number | null;
  hip_cm: number | null;
  bicep_cm: number | null;
  thigh_cm: number | null;
  notes: string | null;
};

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function Metric({ label, value, unit }: { label: string; value: number | null; unit: string }) {
  if (value == null) return null;
  return (
    <View className="items-center px-3">
      <Text className="text-white font-bold text-base">
        {value}
        <Text className="text-gray-500 text-xs">{unit}</Text>
      </Text>
      <Text className="text-gray-500 text-xs mt-0.5">{label}</Text>
    </View>
  );
}

export function AssessmentsScreen() {
  const { profile } = useAuthStore();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadAssessments();
    }, [])
  );

  async function loadAssessments() {
    setLoading(true);
    const { data } = await supabase
      .from('physical_assessments')
      .select('*')
      .eq('student_id', profile!.id)
      .order('assessed_at', { ascending: false });
    setAssessments((data as Assessment[]) ?? []);
    setLoading(false);
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-brand-dark items-center justify-center">
        <ActivityIndicator color="#8DC63F" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-dark">
      <View className="px-6 pt-8 pb-4">
        <Text className="text-white text-2xl font-bold">Avaliações</Text>
        <Text className="text-gray-400 text-sm mt-1">
          {assessments.length} avaliação{assessments.length !== 1 ? 'ões' : ''}
        </Text>
      </View>

      {assessments.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="body-outline" size={56} color="#374151" />
          <Text className="text-gray-400 text-lg font-semibold mt-4 text-center">
            Nenhuma avaliação
          </Text>
          <Text className="text-gray-600 text-sm mt-2 text-center">
            Seu personal ainda não registrou{'\n'}nenhuma avaliação física.
          </Text>
        </View>
      ) : (
        <FlatList
          data={assessments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
          renderItem={({ item }) => {
            const hasMainMetrics = item.weight_kg != null || item.height_cm != null || item.body_fat_pct != null;
            const hasMeasures = item.chest_cm != null || item.waist_cm != null || item.hip_cm != null
              || item.bicep_cm != null || item.thigh_cm != null;

            return (
              <View className="bg-brand-dark-2 rounded-2xl p-5 mb-4">
                <Text className="text-brand-green text-xs font-semibold uppercase mb-4">
                  {formatDate(item.assessed_at)}
                </Text>

                {hasMainMetrics && (
                  <View className="flex-row justify-around bg-brand-dark rounded-xl p-4 mb-4">
                    <Metric label="Peso" value={item.weight_kg} unit="kg" />
                    {item.weight_kg != null && item.height_cm != null && (
                      <View className="w-px bg-brand-dark-3" />
                    )}
                    <Metric label="Altura" value={item.height_cm} unit="cm" />
                    {item.body_fat_pct != null && (
                      <View className="w-px bg-brand-dark-3" />
                    )}
                    <Metric label="% Gordura" value={item.body_fat_pct} unit="%" />
                  </View>
                )}

                {hasMeasures && (
                  <View>
                    <Text className="text-gray-500 text-xs uppercase font-semibold mb-2">
                      Medidas
                    </Text>
                    <View className="flex-row flex-wrap">
                      {item.chest_cm != null && (
                        <View className="bg-brand-dark rounded-lg px-3 py-1.5 mr-2 mb-2">
                          <Text className="text-gray-400 text-xs">
                            Peit. <Text className="text-white font-semibold">{item.chest_cm}cm</Text>
                          </Text>
                        </View>
                      )}
                      {item.waist_cm != null && (
                        <View className="bg-brand-dark rounded-lg px-3 py-1.5 mr-2 mb-2">
                          <Text className="text-gray-400 text-xs">
                            Cintura <Text className="text-white font-semibold">{item.waist_cm}cm</Text>
                          </Text>
                        </View>
                      )}
                      {item.hip_cm != null && (
                        <View className="bg-brand-dark rounded-lg px-3 py-1.5 mr-2 mb-2">
                          <Text className="text-gray-400 text-xs">
                            Quadril <Text className="text-white font-semibold">{item.hip_cm}cm</Text>
                          </Text>
                        </View>
                      )}
                      {item.bicep_cm != null && (
                        <View className="bg-brand-dark rounded-lg px-3 py-1.5 mr-2 mb-2">
                          <Text className="text-gray-400 text-xs">
                            Bíceps <Text className="text-white font-semibold">{item.bicep_cm}cm</Text>
                          </Text>
                        </View>
                      )}
                      {item.thigh_cm != null && (
                        <View className="bg-brand-dark rounded-lg px-3 py-1.5 mr-2 mb-2">
                          <Text className="text-gray-400 text-xs">
                            Coxa <Text className="text-white font-semibold">{item.thigh_cm}cm</Text>
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}

                {item.notes ? (
                  <Text className="text-gray-500 text-xs mt-2 italic">{item.notes}</Text>
                ) : null}
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
