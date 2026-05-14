import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { StudentsStackParams } from '../../navigation/StudentsStack';
import { AssessmentFull, AssessmentPhoto } from './TrainerAssessmentListScreen';
import { supabase } from '../../lib/supabase';
import {
  computeFromAssessment, sfSigma, calcRCQ, calcICE,
  rcqRisk, iceRisk, PROTOCOL_LABELS, PROTOCOL_FIELDS,
  Sex, Protocol,
} from '../../lib/bodyComposition';

type Props = {
  navigation: NativeStackNavigationProp<StudentsStackParams, 'AssessmentDetail'>;
  route: RouteProp<StudentsStackParams, 'AssessmentDetail'>;
};

function bmi(w: number | null, h: number | null): string | null {
  if (!w || !h) return null;
  return (w / Math.pow(h / 100, 2)).toFixed(1);
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  });
}

function Row({ label, value, unit, last = false }: {
  label: string; value: number | null | string; unit?: string; last?: boolean;
}) {
  if (value == null || value === '') return null;
  return (
    <View
      className="flex-row items-center justify-between py-2.5"
      style={{ borderBottomWidth: last ? 0 : 1, borderBottomColor: '#2E3330' }}
    >
      <Text className="text-gray-400 text-sm">{label}</Text>
      <Text className="text-white text-sm font-semibold">
        {value}{unit ? ` ${unit}` : ''}
      </Text>
    </View>
  );
}

function RiskRow({ label, value, risk, last = false }: {
  label: string; value: string | null; risk: string | null; last?: boolean;
}) {
  if (!value) return null;
  const color = !risk ? '#fff'
    : (risk === 'Baixo' || risk === 'Ideal') ? '#8DC63F'
    : (risk === 'Moderado' || risk === 'Atenção') ? '#f59e0b'
    : '#ef4444';
  return (
    <View
      className="flex-row items-center justify-between py-2.5"
      style={{ borderBottomWidth: last ? 0 : 1, borderBottomColor: '#2E3330' }}
    >
      <Text className="text-gray-400 text-sm">{label}</Text>
      <View className="items-end">
        <Text className="text-white text-sm font-semibold">{value}</Text>
        {risk && <Text style={{ color, fontSize: 11 }}>{risk}</Text>}
      </View>
    </View>
  );
}

export function AssessmentDetailScreen({ navigation, route }: Props) {
  const { assessment: a, student, photos } = route.params;
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    Alert.alert(
      'Excluir avaliação',
      `Tem certeza que deseja excluir a avaliação de ${formatDate(a.assessed_at)}? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir', style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await supabase.from('assessment_photos').delete().eq('assessment_id', a.id);
              const { error } = await supabase.from('physical_assessments').delete().eq('id', a.id);
              if (error) throw error;
              navigation.goBack();
            } catch {
              Alert.alert('Erro', 'Não foi possível excluir a avaliação.');
              setDeleting(false);
            }
          },
        },
      ],
    );
  }

  function handleEdit() {
    navigation.navigate('NewAssessment', { student, assessment: a, editPhotos: photos });
  }

  const imc  = bmi(a.weight_kg, a.height_cm);
  const bc   = computeFromAssessment(a);
  const sigma = sfSigma(a);
  const rcq  = (a.waist_cm && a.hip_cm)    ? calcRCQ(a.waist_cm, a.hip_cm)   : null;
  const ice  = (a.waist_cm && a.height_cm) ? calcICE(a.waist_cm, a.height_cm) : null;
  const sex  = a.sex as Sex | null;

  const hasPerimetria = !!(
    a.chest_cm || a.waist_cm || a.hip_cm || a.abdomen_cm ||
    a.bicep_cm || a.braco_contraido_cm || a.thigh_cm || a.coxa_medial_cm
  );

  const protocol = a.skinfold_protocol as Protocol | null;
  const sfFields = (protocol && sex) ? PROTOCOL_FIELDS[protocol][sex] : [];
  const sfKeyMap: Record<string, number | null> = {
    sfPeitoral:     a.sf_peitoral,
    sfAxilarMedia:  a.sf_axilar_media,
    sfTriceps:      a.sf_triceps,
    sfSubescapular: a.sf_subescapular,
    sfAbdominal:    a.sf_abdominal,
    sfSuprailiaca:  a.sf_suprailiaca,
    sfCoxa:         a.sf_coxa,
  };

  const byPosition: Record<string, AssessmentPhoto[]> = {};
  for (const p of photos) {
    if (!byPosition[p.position]) byPosition[p.position] = [];
    byPosition[p.position].push(p);
  }
  const positions = Object.keys(byPosition);

  return (
    <SafeAreaView className="flex-1 bg-brand-dark">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="px-6 pt-4 pb-4">
          <View className="flex-row items-center justify-between mb-3">
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text className="text-brand-green text-sm">← Voltar</Text>
            </TouchableOpacity>
            <View className="flex-row items-center">
              <TouchableOpacity onPress={handleEdit} hitSlop={8} className="mr-5">
                <Ionicons name="create-outline" size={22} color="#8DC63F" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} hitSlop={8} disabled={deleting}>
                {deleting
                  ? <ActivityIndicator size="small" color="#ef4444" />
                  : <Ionicons name="trash-outline" size={22} color="#ef4444" />
                }
              </TouchableOpacity>
            </View>
          </View>
          <Text className="text-white text-xl font-bold capitalize">{formatDate(a.assessed_at)}</Text>
          <Text className="text-gray-400 text-sm mt-0.5">{student.name}</Text>
        </View>

        <View className="px-6">
          {/* Antropometria */}
          <View className="bg-brand-dark-2 rounded-2xl p-4 mb-4">
            <Text className="text-white font-semibold mb-2">Antropometria</Text>
            <Row label="Sexo"   value={a.sex === 'M' ? 'Masculino' : a.sex === 'F' ? 'Feminino' : null} />
            <Row label="Idade"  value={a.age_years} unit="anos" />
            <Row label="Peso"   value={a.weight_kg} unit="kg" />
            <Row label="Altura" value={a.height_cm} unit="cm" />
            <Row label="IMC"    value={imc} last />
          </View>

          {/* Índices */}
          {(rcq || ice) && (
            <View className="bg-brand-dark-2 rounded-2xl p-4 mb-4">
              <Text className="text-white font-semibold mb-2">Índices</Text>
              <RiskRow
                label="RCQ (cintura/quadril)"
                value={rcq ? String(rcq) : null}
                risk={rcq && sex ? rcqRisk(rcq, sex) : null}
              />
              <RiskRow
                label="Índice cintura-estatura"
                value={ice ? String(ice) : null}
                risk={ice ? iceRisk(ice) : null}
                last
              />
            </View>
          )}

          {/* Composição corporal */}
          {(a.body_fat_pct != null || bc) && (
            <View className="bg-brand-dark-2 rounded-2xl p-4 mb-4">
              <Text className="text-white font-semibold mb-2">Composição corporal</Text>
              {protocol && (
                <Row label="Protocolo" value={PROTOCOL_LABELS[protocol]} />
              )}
              {sigma != null && (
                <Row label="Σ Dobras" value={sigma} unit="mm" />
              )}
              <Row label="% Gordura"   value={bc?.fatPct ?? a.body_fat_pct} unit="%" />
              {bc && (
                <>
                  <Row label="% Músculo"   value={bc.musclePct} unit="%" />
                  <Row label="% Resíduo"   value={bc.residualPct} unit="%" />
                  {bc.fatKg  != null && <Row label="Massa gordurosa" value={bc.fatKg}  unit="kg" />}
                  {bc.leanKg != null && <Row label="Massa magra"     value={bc.leanKg} unit="kg" last />}
                </>
              )}
            </View>
          )}

          {/* Perimetria */}
          {hasPerimetria && (
            <View className="bg-brand-dark-2 rounded-2xl p-4 mb-4">
              <Text className="text-white font-semibold mb-2">Perimetria</Text>
              <Row label="Cintura"        value={a.waist_cm}          unit="cm" />
              <Row label="Quadril"        value={a.hip_cm}            unit="cm" />
              <Row label="Abdômen"        value={a.abdomen_cm}        unit="cm" />
              <Row label="Peitoral"       value={a.chest_cm}          unit="cm" />
              <Row label="Braço relaxado" value={a.bicep_cm}          unit="cm" />
              <Row label="Braço contraído" value={a.braco_contraido_cm} unit="cm" />
              <Row label="Coxa proximal"  value={a.thigh_cm}          unit="cm" />
              <Row label="Coxa medial"    value={a.coxa_medial_cm}    unit="cm" last />
            </View>
          )}

          {/* Dobras cutâneas */}
          {sfFields.length > 0 && (
            <View className="bg-brand-dark-2 rounded-2xl p-4 mb-4">
              <Text className="text-white font-semibold mb-2">
                Dobras cutâneas{protocol ? ` — ${PROTOCOL_LABELS[protocol]}` : ''}
              </Text>
              {sfFields.map((f, i) => (
                <Row
                  key={f.key}
                  label={f.label}
                  value={sfKeyMap[f.key]}
                  unit="mm"
                  last={i === sfFields.length - 1}
                />
              ))}
            </View>
          )}

          {/* Dobras (texto legado) */}
          {a.skinfolds && !protocol && (
            <View className="bg-brand-dark-2 rounded-2xl p-4 mb-4">
              <Text className="text-white font-semibold mb-2">Dobras cutâneas</Text>
              <Text className="text-gray-300 text-sm leading-5">{a.skinfolds}</Text>
            </View>
          )}

          {/* Observações */}
          {a.notes && (
            <View className="bg-brand-dark-2 rounded-2xl p-4 mb-4">
              <Text className="text-white font-semibold mb-2">Observações</Text>
              <Text className="text-gray-300 text-sm leading-5">{a.notes}</Text>
            </View>
          )}

          {/* Fotos */}
          {positions.length > 0 && (
            <View className="bg-brand-dark-2 rounded-2xl p-4 mb-4">
              <Text className="text-white font-semibold mb-3">Fotos</Text>
              {positions.map((pos) => (
                <View key={pos} className="mb-4">
                  <Text className="text-gray-500 text-xs uppercase font-semibold mb-2">{pos}</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {byPosition[pos].map((photo) => (
                      <Image
                        key={photo.id}
                        source={{ uri: photo.photo_url }}
                        style={{ width: 140, height: 186, borderRadius: 12, marginRight: 10 }}
                        resizeMode="cover"
                      />
                    ))}
                  </ScrollView>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
