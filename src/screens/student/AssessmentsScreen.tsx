import { useState, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Image, TouchableOpacity } from 'react-native';
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
  abdomen_cm: number | null;
  bicep_cm: number | null;
  thigh_cm: number | null;
  skinfolds: string | null;
  notes: string | null;
};

type Photo = { id: string; assessment_id: string; position: string; photo_url: string };

const CHART_H = 80;
const BAR_W   = 32;

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}

function bmi(w: number | null, h: number | null): string | null {
  if (!w || !h) return null;
  return (w / Math.pow(h / 100, 2)).toFixed(1);
}

function MetricCol({ label, value, unit }: { label: string; value: string | number; unit?: string }) {
  return (
    <View className="flex-1 items-center py-3">
      <Text className="text-white font-bold text-lg">
        {value}
        {unit && <Text className="text-gray-500 text-xs">{unit}</Text>}
      </Text>
      <Text className="text-gray-500 text-xs mt-0.5">{label}</Text>
    </View>
  );
}

function MeasureRow({ label, value, unit = 'cm', last = false }: {
  label: string; value: number | null; unit?: string; last?: boolean;
}) {
  if (value == null) return null;
  return (
    <View
      className="flex-row items-center justify-between py-2.5 px-4"
      style={{ borderBottomWidth: last ? 0 : 1, borderBottomColor: '#2E3330' }}
    >
      <Text className="text-gray-400 text-sm">{label}</Text>
      <Text className="text-white text-sm font-semibold">{value} {unit}</Text>
    </View>
  );
}

export function AssessmentsScreen() {
  const { profile } = useAuthStore();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [photoMap, setPhotoMap]       = useState<Record<string, Photo[]>>({});
  const [expanded, setExpanded]       = useState<Record<string, boolean>>({});
  const [loading, setLoading]         = useState(true);

  useFocusEffect(useCallback(() => { loadAssessments(); }, []));

  async function loadAssessments() {
    setLoading(true);
    const { data } = await supabase
      .from('physical_assessments')
      .select('*')
      .eq('student_id', profile!.id)
      .order('assessed_at', { ascending: false });

    const list = (data as Assessment[]) ?? [];
    setAssessments(list);

    if (list.length > 0) {
      const ids = list.map((a) => a.id);
      const { data: photoData } = await supabase
        .from('assessment_photos')
        .select('*')
        .in('assessment_id', ids);
      const pm: Record<string, Photo[]> = {};
      for (const p of (photoData ?? []) as Photo[]) {
        if (!pm[p.assessment_id]) pm[p.assessment_id] = [];
        pm[p.assessment_id].push(p);
      }
      setPhotoMap(pm);
    }
    setLoading(false);
  }

  const chartPoints = assessments
    .filter((a) => a.weight_kg != null)
    .slice(0, 6)
    .reverse();
  const maxW  = chartPoints.length > 0 ? Math.max(...chartPoints.map((a) => a.weight_kg!)) : 0;
  const minW  = chartPoints.length > 0 ? Math.min(...chartPoints.map((a) => a.weight_kg!)) : 0;
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
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="px-6 pt-8 pb-4">
          <Text className="text-white text-2xl font-bold">Avaliações</Text>
          <Text className="text-gray-400 text-sm mt-1">
            {assessments.length} avaliação{assessments.length !== 1 ? 'ões' : ''}
          </Text>
        </View>

        {assessments.length === 0 ? (
          <View className="flex-1 items-center justify-center px-8 mt-16">
            <Ionicons name="body-outline" size={56} color="#374151" />
            <Text className="text-gray-400 text-lg font-semibold mt-4 text-center">
              Nenhuma avaliação
            </Text>
            <Text className="text-gray-600 text-sm mt-2 text-center">
              Seu personal ainda não registrou{'\n'}nenhuma avaliação física.
            </Text>
          </View>
        ) : (
          <>
            {/* Gráfico de peso */}
            {chartPoints.length >= 2 && (
              <View className="mx-6 bg-brand-dark-2 rounded-2xl p-4 mb-5">
                <Text className="text-white font-semibold mb-3">Evolução de peso</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: CHART_H + 36 }}>
                    {chartPoints.map((a, i) => {
                      const barH = Math.max(8, ((a.weight_kg! - minW) / range) * CHART_H + 8);
                      const isLast = i === chartPoints.length - 1;
                      return (
                        <View key={a.id} style={{ width: BAR_W, marginRight: i < chartPoints.length - 1 ? 8 : 0, alignItems: 'center' }}>
                          <Text style={{ color: '#8DC63F', fontSize: 9, marginBottom: 2 }}>{a.weight_kg}kg</Text>
                          <View style={{ width: BAR_W, height: barH, backgroundColor: isLast ? '#8DC63F' : '#2E5B1A', borderRadius: 4 }} />
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

            {/* Cards de avaliação */}
            <View className="px-6">
              {assessments.map((item) => {
                const imc    = bmi(item.weight_kg, item.height_cm);
                const photos = photoMap[item.id] ?? [];
                const isOpen = expanded[item.id] ?? false;

                const circumferences: { label: string; value: number | null }[] = [
                  { label: 'Peitoral',  value: item.chest_cm   },
                  { label: 'Cintura',   value: item.waist_cm   },
                  { label: 'Quadril',   value: item.hip_cm     },
                  { label: 'Abdômen',   value: item.abdomen_cm },
                  { label: 'Bíceps',    value: item.bicep_cm   },
                  { label: 'Coxa',      value: item.thigh_cm   },
                ].filter((c) => c.value != null);

                const hasDetails = circumferences.length > 0 || item.skinfolds || item.notes || photos.length > 0;

                return (
                  <View key={item.id} className="bg-brand-dark-2 rounded-2xl mb-4 overflow-hidden">
                    {/* Data */}
                    <View className="px-5 pt-4 pb-3 border-b border-brand-dark-3">
                      <Text className="text-brand-green text-xs font-semibold uppercase">
                        {formatDate(item.assessed_at)}
                      </Text>
                    </View>

                    {/* Métricas principais */}
                    {(item.weight_kg != null || imc || item.body_fat_pct != null) && (
                      <View className="flex-row border-b border-brand-dark-3">
                        {item.weight_kg != null && (
                          <>
                            <MetricCol label="Peso" value={item.weight_kg} unit="kg" />
                            {(imc || item.body_fat_pct != null) && (
                              <View className="w-px bg-brand-dark-3" />
                            )}
                          </>
                        )}
                        {imc && (
                          <>
                            <MetricCol label="IMC" value={imc} />
                            {item.body_fat_pct != null && <View className="w-px bg-brand-dark-3" />}
                          </>
                        )}
                        {item.body_fat_pct != null && (
                          <MetricCol label="Gordura" value={item.body_fat_pct} unit="%" />
                        )}
                      </View>
                    )}

                    {/* Expandir / recolher detalhes */}
                    {hasDetails && (
                      <TouchableOpacity
                        className="flex-row items-center justify-between px-5 py-3"
                        onPress={() => setExpanded((prev) => ({ ...prev, [item.id]: !isOpen }))}
                      >
                        <Text className="text-gray-400 text-sm">
                          {isOpen ? 'Ocultar detalhes' : 'Ver detalhes'}
                        </Text>
                        <Ionicons
                          name={isOpen ? 'chevron-up' : 'chevron-down'}
                          size={16}
                          color="#6b7280"
                        />
                      </TouchableOpacity>
                    )}

                    {isOpen && (
                      <>
                        {/* Circunferências */}
                        {circumferences.length > 0 && (
                          <View className="border-t border-brand-dark-3">
                            <Text className="text-gray-500 text-xs uppercase font-semibold px-4 pt-3 pb-1">
                              Medidas
                            </Text>
                            <View className="bg-brand-dark rounded-xl mx-4 mb-3 overflow-hidden">
                              {circumferences.map((c, idx) => (
                                <MeasureRow
                                  key={c.label}
                                  label={c.label}
                                  value={c.value}
                                  last={idx === circumferences.length - 1}
                                />
                              ))}
                            </View>
                          </View>
                        )}

                        {/* Dobras */}
                        {item.skinfolds && (
                          <View className="px-5 pb-3">
                            <Text className="text-gray-500 text-xs uppercase font-semibold mb-1">Dobras</Text>
                            <Text className="text-gray-300 text-sm">{item.skinfolds}</Text>
                          </View>
                        )}

                        {/* Observações */}
                        {item.notes && (
                          <View className="px-5 pb-3">
                            <Text className="text-gray-500 text-xs uppercase font-semibold mb-1">Observações</Text>
                            <Text className="text-gray-300 text-sm">{item.notes}</Text>
                          </View>
                        )}

                        {/* Fotos */}
                        {photos.length > 0 && (
                          <View className="pb-4">
                            <Text className="text-gray-500 text-xs uppercase font-semibold px-5 mb-2">Fotos</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
                              {photos.map((photo) => (
                                <View key={photo.id} className="mr-3 items-center">
                                  <Image
                                    source={{ uri: photo.photo_url }}
                                    style={{ width: 100, height: 133, borderRadius: 10 }}
                                    resizeMode="cover"
                                  />
                                  <Text className="text-gray-600 text-xs text-center mt-1">{photo.position}</Text>
                                </View>
                              ))}
                            </ScrollView>
                          </View>
                        )}
                      </>
                    )}
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
