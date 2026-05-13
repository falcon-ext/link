import { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator, ScrollView, Image, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { StudentsStackParams } from '../../navigation/StudentsStack';
import { supabase } from '../../lib/supabase';

type Props = {
  navigation: NativeStackNavigationProp<StudentsStackParams, 'TrainerAssessmentList'>;
  route: RouteProp<StudentsStackParams, 'TrainerAssessmentList'>;
};

export type AssessmentFull = {
  id: string;
  assessed_at: string;
  weight_kg: number | null;
  height_cm: number | null;
  body_fat_pct: number | null;
  chest_cm: number | null;
  waist_cm: number | null;
  hip_cm: number | null;
  abdomen_cm: number | null;
  bicep_cm: number | null;
  thigh_cm: number | null;
  skinfolds: string | null;
  notes: string | null;
};

export type AssessmentPhoto = {
  id: string;
  assessment_id: string;
  position: string;
  photo_url: string;
};

function bmi(w: number | null, h: number | null): string {
  if (!w || !h) return '—';
  return (w / Math.pow(h / 100, 2)).toFixed(1);
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

const CHART_H = 80;
const BAR_W   = 32;

export function TrainerAssessmentListScreen({ navigation, route }: Props) {
  const { student } = route.params;
  const [assessments, setAssessments] = useState<AssessmentFull[]>([]);
  const [photoMap, setPhotoMap]       = useState<Record<string, AssessmentPhoto[]>>({});
  const [loading, setLoading]         = useState(true);
  const [selected, setSelected]       = useState<string[]>([]);

  useFocusEffect(useCallback(() => { load(); setSelected([]); }, []));

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from('physical_assessments')
      .select('*')
      .eq('student_id', student.id)
      .order('assessed_at', { ascending: false });

    const list = (data ?? []) as AssessmentFull[];
    setAssessments(list);

    if (list.length > 0) {
      const ids = list.map((a) => a.id);
      const { data: photoData } = await supabase
        .from('assessment_photos')
        .select('*')
        .in('assessment_id', ids);
      const pm: Record<string, AssessmentPhoto[]> = {};
      for (const p of (photoData ?? []) as AssessmentPhoto[]) {
        if (!pm[p.assessment_id]) pm[p.assessment_id] = [];
        pm[p.assessment_id].push(p);
      }
      setPhotoMap(pm);
    }
    setLoading(false);
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) {
        Alert.alert('', 'Selecione no máximo 2 avaliações para comparar.');
        return prev;
      }
      return [...prev, id];
    });
  }

  // Chart — last 6 with weight, ascending order
  const chartPoints = assessments
    .filter((a) => a.weight_kg != null)
    .slice(0, 6)
    .reverse();
  const maxW = chartPoints.length > 0 ? Math.max(...chartPoints.map((a) => a.weight_kg!)) : 0;
  const minW = chartPoints.length > 0 ? Math.min(...chartPoints.map((a) => a.weight_kg!)) : 0;
  const range = maxW - minW || 1;

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-brand-dark items-center justify-center">
        <ActivityIndicator color="#8DC63F" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-dark">
      <ScrollView contentContainerStyle={{ paddingBottom: selected.length === 2 ? 100 : 32 }}>
        {/* Header */}
        <View className="px-6 pt-4 pb-2">
          <TouchableOpacity className="mb-3" onPress={() => navigation.goBack()}>
            <Text className="text-brand-green text-sm">← Voltar</Text>
          </TouchableOpacity>
          <Text className="text-white text-2xl font-bold">Avaliações</Text>
          <Text className="text-gray-400 text-sm mt-0.5">{student.name}</Text>
        </View>

        {/* Gráfico de peso */}
        {chartPoints.length >= 2 && (
          <View className="mx-6 bg-brand-dark-2 rounded-2xl p-4 mb-5 mt-2">
            <Text className="text-white font-semibold mb-3">Evolução de peso (kg)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: CHART_H + 36 }}>
                {chartPoints.map((a, i) => {
                  const barH = Math.max(8, ((a.weight_kg! - minW) / range) * CHART_H + 8);
                  return (
                    <View key={a.id} style={{ width: BAR_W, marginRight: i < chartPoints.length - 1 ? 8 : 0, alignItems: 'center' }}>
                      <Text style={{ color: '#8DC63F', fontSize: 9, marginBottom: 2 }}>{a.weight_kg}kg</Text>
                      <View style={{ width: BAR_W, height: barH, backgroundColor: i === chartPoints.length - 1 ? '#8DC63F' : '#2E5B1A', borderRadius: 4 }} />
                      <Text style={{ color: '#6b7280', fontSize: 8, marginTop: 3, textAlign: 'center' }}>
                        {a.assessed_at.slice(5).replace('-', '/')}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Hint de seleção */}
        {assessments.length >= 2 && selected.length < 2 && (
          <Text className="text-gray-600 text-xs text-center mb-3">
            Selecione 2 avaliações para comparar
          </Text>
        )}

        {/* Lista */}
        <View className="px-6">
          {assessments.length === 0 ? (
            <View className="items-center mt-10">
              <Ionicons name="body-outline" size={48} color="#374151" />
              <Text className="text-gray-400 text-base font-semibold mt-3 text-center">
                Nenhuma avaliação ainda
              </Text>
            </View>
          ) : (
            assessments.map((item) => {
              const isSelected = selected.includes(item.id);
              const thumbs = (photoMap[item.id] ?? []).slice(0, 3);

              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => navigation.navigate('AssessmentDetail', { assessment: item, student, photos: photoMap[item.id] ?? [] })}
                  onLongPress={() => toggleSelect(item.id)}
                  className="bg-brand-dark-2 rounded-2xl p-4 mb-3"
                  style={{ borderWidth: isSelected ? 2 : 0, borderColor: '#8DC63F' }}
                >
                  <View className="flex-row items-start">
                    {/* Checkbox */}
                    <TouchableOpacity
                      onPress={() => toggleSelect(item.id)}
                      className="mr-3 mt-0.5"
                      hitSlop={8}
                    >
                      <View
                        className="w-5 h-5 rounded items-center justify-center"
                        style={{ backgroundColor: isSelected ? '#8DC63F' : 'transparent', borderWidth: 1.5, borderColor: isSelected ? '#8DC63F' : '#4B5563' }}
                      >
                        {isSelected && <Ionicons name="checkmark" size={12} color="#1A1D1C" />}
                      </View>
                    </TouchableOpacity>

                    <View className="flex-1">
                      <Text className="text-brand-green text-xs font-semibold mb-2">
                        {formatDate(item.assessed_at)}
                      </Text>

                      {/* Métricas principais */}
                      <View className="flex-row flex-wrap gap-x-4 gap-y-1 mb-2">
                        {item.weight_kg != null && (
                          <Text className="text-white text-sm">
                            <Text className="text-gray-500">Peso </Text>{item.weight_kg}kg
                          </Text>
                        )}
                        {item.weight_kg != null && item.height_cm != null && (
                          <Text className="text-white text-sm">
                            <Text className="text-gray-500">IMC </Text>{bmi(item.weight_kg, item.height_cm)}
                          </Text>
                        )}
                        {item.body_fat_pct != null && (
                          <Text className="text-white text-sm">
                            <Text className="text-gray-500">GC </Text>{item.body_fat_pct}%
                          </Text>
                        )}
                      </View>

                      {/* Thumbnails de fotos */}
                      {thumbs.length > 0 && (
                        <View className="flex-row mt-1">
                          {thumbs.map((p) => (
                            <Image
                              key={p.id}
                              source={{ uri: p.photo_url }}
                              style={{ width: 44, height: 44, borderRadius: 8, marginRight: 6 }}
                              resizeMode="cover"
                            />
                          ))}
                          {(photoMap[item.id] ?? []).length > 3 && (
                            <View style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: '#2E3330', alignItems: 'center', justifyContent: 'center' }}>
                              <Text className="text-gray-400 text-xs font-bold">
                                +{(photoMap[item.id] ?? []).length - 3}
                              </Text>
                            </View>
                          )}
                        </View>
                      )}
                    </View>

                    <Ionicons name="chevron-forward" size={16} color="#6b7280" />
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* FAB Nova avaliação */}
      <TouchableOpacity
        onPress={() => navigation.navigate('NewAssessment', { student })}
        className="absolute bottom-8 right-6 w-14 h-14 rounded-full bg-brand-green items-center justify-center"
        style={{ elevation: 6, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } }}
      >
        <Ionicons name="add" size={28} color="#1A1D1C" />
      </TouchableOpacity>

      {/* Bottom bar comparar */}
      {selected.length === 2 && (
        <View
          className="absolute bottom-0 left-0 right-0 bg-brand-dark-2 px-6 py-4"
          style={{ borderTopWidth: 1, borderTopColor: '#2E3330' }}
        >
          <TouchableOpacity
            className="bg-brand-green rounded-2xl py-4 items-center"
            onPress={() => navigation.navigate('AssessmentCompare', {
              studentId: student.id,
              assessmentAId: selected[0],
              assessmentBId: selected[1],
            })}
          >
            <Text className="text-brand-dark font-bold text-base">Comparar avaliações</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
