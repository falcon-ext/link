import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { StudentsStackParams } from '../../navigation/StudentsStack';
import { supabase } from '../../lib/supabase';
import { AssessmentFull, AssessmentPhoto } from './TrainerAssessmentListScreen';

type Props = {
  navigation: NativeStackNavigationProp<StudentsStackParams, 'AssessmentCompare'>;
  route: RouteProp<StudentsStackParams, 'AssessmentCompare'>;
};

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function bmi(w: number | null, h: number | null): number | null {
  if (!w || !h) return null;
  return parseFloat((w / Math.pow(h / 100, 2)).toFixed(1));
}

function delta(a: number | null, b: number | null): string {
  if (a == null || b == null) return '';
  const diff = b - a;
  if (diff === 0) return '=';
  return diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1);
}

function DeltaText({ a, b }: { a: number | null; b: number | null }) {
  const d = delta(a, b);
  if (!d) return null;
  const color = d === '=' ? '#6b7280' : d.startsWith('+') ? '#60a5fa' : '#f59e0b';
  return <Text style={{ color, fontSize: 11, fontWeight: '600' }}>{d}</Text>;
}

type Side = { assessment: AssessmentFull; photos: AssessmentPhoto[] };

function MetricRow({ label, aVal, bVal, unit }: { label: string; aVal: number | null; bVal: number | null; unit?: string }) {
  if (aVal == null && bVal == null) return null;
  const fmt = (v: number | null) => v != null ? `${v}${unit ?? ''}` : '—';
  return (
    <View className="flex-row items-center py-2.5" style={{ borderBottomWidth: 1, borderBottomColor: '#2E3330' }}>
      <Text className="text-white text-sm font-semibold" style={{ width: 72 }}>{fmt(aVal)}</Text>
      <View className="flex-1 items-center">
        <Text className="text-gray-500 text-xs">{label}</Text>
        <DeltaText a={aVal} b={bVal} />
      </View>
      <Text className="text-white text-sm font-semibold text-right" style={{ width: 72 }}>{fmt(bVal)}</Text>
    </View>
  );
}

export function AssessmentCompareScreen({ navigation, route }: Props) {
  const { studentId, assessmentAId, assessmentBId } = route.params;
  const [sideA, setSideA] = useState<Side | null>(null);
  const [sideB, setSideB] = useState<Side | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    const ids = [assessmentAId, assessmentBId];
    const { data: assessData } = await supabase
      .from('physical_assessments')
      .select('*')
      .in('id', ids);

    const { data: photoData } = await supabase
      .from('assessment_photos')
      .select('*')
      .in('assessment_id', ids);

    const photos = (photoData ?? []) as AssessmentPhoto[];
    const list   = (assessData ?? []) as AssessmentFull[];

    // Sort: A = older, B = newer
    const sorted = list.sort((x, y) => x.assessed_at.localeCompare(y.assessed_at));
    const first = sorted[0];
    const last  = sorted[1] ?? sorted[0];

    setSideA({ assessment: first, photos: photos.filter((p) => p.assessment_id === first.id) });
    setSideB({ assessment: last,  photos: photos.filter((p) => p.assessment_id === last.id)  });
    setLoading(false);
  }

  if (loading || !sideA || !sideB) {
    return (
      <SafeAreaView className="flex-1 bg-brand-dark items-center justify-center">
        <ActivityIndicator color="#8DC63F" />
      </SafeAreaView>
    );
  }

  const a = sideA.assessment;
  const b = sideB.assessment;
  const bmiA = bmi(a.weight_kg, a.height_cm);
  const bmiB = bmi(b.weight_kg, b.height_cm);

  // All photo positions from both assessments
  const allPositions = [...new Set([
    ...sideA.photos.map((p) => p.position),
    ...sideB.photos.map((p) => p.position),
  ])];

  return (
    <SafeAreaView className="flex-1 bg-brand-dark">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View className="px-6 pt-4 pb-4">
          <TouchableOpacity className="mb-3" onPress={() => navigation.goBack()}>
            <Text className="text-brand-green text-sm">← Voltar</Text>
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">Comparativo</Text>
        </View>

        {/* Datas */}
        <View className="mx-6 flex-row items-center justify-between bg-brand-dark-2 rounded-2xl px-4 py-3 mb-4">
          <Text className="text-brand-green text-sm font-semibold">{formatDate(a.assessed_at)}</Text>
          <Text className="text-gray-600 text-xs">vs</Text>
          <Text className="text-brand-green text-sm font-semibold">{formatDate(b.assessed_at)}</Text>
        </View>

        {/* Métricas */}
        <View className="mx-6 bg-brand-dark-2 rounded-2xl p-4 mb-4">
          <Text className="text-white font-semibold mb-2">Composição corporal</Text>
          <MetricRow label="Peso"      aVal={a.weight_kg}    bVal={b.weight_kg}    unit="kg" />
          <MetricRow label="Altura"    aVal={a.height_cm}    bVal={b.height_cm}    unit="cm" />
          <MetricRow label="IMC"       aVal={bmiA}           bVal={bmiB} />
          <MetricRow label="% Gordura" aVal={a.body_fat_pct} bVal={b.body_fat_pct} unit="%" />
        </View>

        {(a.chest_cm || b.chest_cm || a.waist_cm || b.waist_cm || a.hip_cm || b.hip_cm ||
          a.abdomen_cm || b.abdomen_cm || a.bicep_cm || b.bicep_cm || a.thigh_cm || b.thigh_cm) && (
          <View className="mx-6 bg-brand-dark-2 rounded-2xl p-4 mb-4">
            <Text className="text-white font-semibold mb-2">Circunferências</Text>
            <MetricRow label="Peitoral" aVal={a.chest_cm}   bVal={b.chest_cm}   unit="cm" />
            <MetricRow label="Cintura"  aVal={a.waist_cm}   bVal={b.waist_cm}   unit="cm" />
            <MetricRow label="Quadril"  aVal={a.hip_cm}     bVal={b.hip_cm}     unit="cm" />
            <MetricRow label="Abdômen"  aVal={a.abdomen_cm} bVal={b.abdomen_cm} unit="cm" />
            <MetricRow label="Bíceps"   aVal={a.bicep_cm}   bVal={b.bicep_cm}   unit="cm" />
            <MetricRow label="Coxa"     aVal={a.thigh_cm}   bVal={b.thigh_cm}   unit="cm" />
          </View>
        )}

        {/* Fotos lado a lado */}
        {allPositions.length > 0 && (
          <View className="mx-6 bg-brand-dark-2 rounded-2xl p-4 mb-4">
            <Text className="text-white font-semibold mb-3">Fotos comparadas</Text>
            {allPositions.map((pos) => {
              const photoA = sideA.photos.find((p) => p.position === pos);
              const photoB = sideB.photos.find((p) => p.position === pos);
              return (
                <View key={pos} className="mb-5">
                  <Text className="text-gray-500 text-xs uppercase font-semibold mb-2 text-center">{pos}</Text>
                  <View className="flex-row justify-between">
                    {[photoA, photoB].map((photo, i) => (
                      <View key={i} style={{ width: '48%' }}>
                        {photo ? (
                          <Image
                            source={{ uri: photo.photo_url }}
                            style={{ width: '100%', aspectRatio: 3 / 4, borderRadius: 10 }}
                            resizeMode="cover"
                          />
                        ) : (
                          <View
                            style={{ width: '100%', aspectRatio: 3 / 4, borderRadius: 10, backgroundColor: '#1A1D1C', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Text className="text-gray-700 text-xs">Sem foto</Text>
                          </View>
                        )}
                        <Text className="text-gray-500 text-xs text-center mt-1">
                          {i === 0 ? formatDate(a.assessed_at) : formatDate(b.assessed_at)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
