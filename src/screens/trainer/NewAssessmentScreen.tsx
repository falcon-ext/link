import { useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  ScrollView, Alert, Image, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { StudentsStackParams } from '../../navigation/StudentsStack';
import { supabase } from '../../lib/supabase';
import { uploadToCloudinary } from '../../lib/cloudinary';
import { sendPushToStudent } from '../../lib/notifications';
import {
  Sex, Protocol, SFKey, PROTOCOL_FIELDS, PROTOCOL_LABELS,
  calcPollock3, calcPollock7, calcGuedes,
  calcRCQ, calcICE, rcqRisk, iceRisk, BodyComp,
} from '../../lib/bodyComposition';

type Props = {
  navigation: NativeStackNavigationProp<StudentsStackParams, 'NewAssessment'>;
  route: RouteProp<StudentsStackParams, 'NewAssessment'>;
};

type PhotoSlot = { position: string; url: string | null; uploading: boolean };
type SFState   = Record<SFKey, string>;

const POSITIONS = ['Frente', 'Lado', 'Costas'];

function todayBR(): string {
  const d = new Date();
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}

function brToISO(br: string): string | null {
  const parts = br.split('/');
  if (parts.length !== 3) return null;
  const [d, m, y] = parts;
  if (d.length !== 2 || m.length !== 2 || y.length !== 4) return null;
  return `${y}-${m}-${d}`;
}

function Field({
  label, value, onChangeText, unit, placeholder, keyboardType = 'numeric', half = false,
}: {
  label: string; value: string; onChangeText: (v: string) => void;
  unit?: string; placeholder?: string; keyboardType?: any; half?: boolean;
}) {
  return (
    <View style={{ width: half ? '48%' : '100%', marginBottom: 12 }}>
      <Text className="text-gray-400 text-xs mb-1">{label}{unit ? ` (${unit})` : ''}</Text>
      <TextInput
        className="bg-brand-dark border border-brand-dark-3 rounded-xl px-3 py-2.5 text-white text-sm"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholder={placeholder ?? '—'}
        placeholderTextColor="#4B5563"
      />
    </View>
  );
}

function ComputedRow({
  label, value, note, noteColor,
}: {
  label: string; value: string | null; note?: string; noteColor?: string;
}) {
  return (
    <View
      className="flex-row items-center justify-between py-2.5"
      style={{ borderBottomWidth: 1, borderBottomColor: '#2E3330' }}
    >
      <Text className="text-gray-400 text-sm">{label}</Text>
      <View className="items-end">
        <Text className={`text-sm font-semibold ${value ? 'text-white' : 'text-gray-700'}`}>
          {value ?? '—'}
        </Text>
        {note && (
          <Text style={{ color: noteColor ?? '#6b7280', fontSize: 11 }}>{note}</Text>
        )}
      </View>
    </View>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <Text className="text-white font-semibold mb-3">{title}</Text>
  );
}

const EMPTY_SF: SFState = {
  sfPeitoral: '', sfAxilarMedia: '', sfTriceps: '',
  sfSubescapular: '', sfAbdominal: '', sfSuprailiaca: '', sfCoxa: '',
};

export function NewAssessmentScreen({ navigation, route }: Props) {
  const { student } = route.params;

  // Dados básicos
  const [date, setDate]   = useState(todayBR());
  const [sex, setSex]     = useState<Sex | null>(null);
  const [age, setAge]     = useState('');

  // Antropometria
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');

  // Perimetria
  const [chest, setChest]               = useState('');
  const [waist, setWaist]               = useState('');
  const [abdomen, setAbdomen]           = useState('');
  const [hip, setHip]                   = useState('');
  const [bicep, setBicep]               = useState('');
  const [bracoContraido, setBracoContraido] = useState('');
  const [thigh, setThigh]               = useState('');
  const [coxaMedial, setCoxaMedial]     = useState('');

  // Dobras
  const [protocol, setProtocol] = useState<Protocol | null>(null);
  const [sf, setSf]             = useState<SFState>(EMPTY_SF);

  // Outros
  const [notes, setNotes]   = useState('');
  const [photos, setPhotos] = useState<PhotoSlot[]>(
    POSITIONS.map((p) => ({ position: p, url: null, uploading: false }))
  );
  const [saving, setSaving] = useState(false);

  function updateSf(key: SFKey, value: string) {
    setSf((prev) => ({ ...prev, [key]: value }));
  }

  // Cálculos em tempo real
  const computed = useMemo(() => {
    const w = parseFloat(weight) || null;
    const h = parseFloat(height) || null;
    const bmiVal = (w && h) ? +(w / (h / 100) ** 2).toFixed(1) : null;

    const waistN = parseFloat(waist) || null;
    const hipN   = parseFloat(hip)   || null;
    const rcqVal = (waistN && hipN) ? calcRCQ(waistN, hipN) : null;
    const iceVal = (waistN && h)    ? calcICE(waistN, h)    : null;

    let bc: BodyComp | null = null;
    let sigma: number | null = null;

    if (sex && protocol) {
      const fields = PROTOCOL_FIELDS[protocol][sex];
      const vals   = fields.map((f) => parseFloat(sf[f.key]) || 0);

      if (vals.every((v) => v > 0)) {
        sigma = +vals.reduce((a, b) => a + b, 0).toFixed(1);
        const ageN = parseInt(age) || 0;

        if (protocol === 'pollock3' && ageN > 0) {
          bc = calcPollock3(sex, ageN, vals[0], vals[1], vals[2], w ?? undefined);
        } else if (protocol === 'pollock7' && ageN > 0) {
          bc = calcPollock7(sex, ageN, vals, w ?? undefined);
        } else if (protocol === 'guedes') {
          bc = calcGuedes(sex, vals[0], vals[1], vals[2], w ?? undefined);
        }
      }
    }

    return { bmiVal, rcqVal, iceVal, sigma, bc };
  }, [weight, height, waist, hip, sex, protocol, age, sf]);

  const needsAge = protocol === 'pollock3' || protocol === 'pollock7';
  const ageN     = parseInt(age) || 0;
  const showAgeWarning = needsAge && protocol && sex && ageN === 0;

  async function pickPhoto(index: number) {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [3, 4],
    });
    if (result.canceled || !result.assets[0]) return;

    setPhotos((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], uploading: true };
      return next;
    });
    try {
      const url = await uploadToCloudinary(result.assets[0].uri, 'image');
      setPhotos((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], url, uploading: false };
        return next;
      });
    } catch {
      Alert.alert('Erro', 'Não foi possível enviar a foto.');
      setPhotos((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], uploading: false };
        return next;
      });
    }
  }

  function addExtraPosition() {
    setPhotos((prev) => [...prev, { position: 'Outro', url: null, uploading: false }]);
  }

  async function handleSave() {
    const isoDate = brToISO(date);
    if (!isoDate) {
      Alert.alert('Data inválida', 'Use o formato DD/MM/AAAA.');
      return;
    }

    const hasAnyData =
      weight || height || chest || waist || abdomen || hip ||
      bicep || bracoContraido || thigh || coxaMedial ||
      Object.values(sf).some(Boolean) || notes || photos.some((p) => p.url);

    if (!hasAnyData) {
      Alert.alert('', 'Preencha pelo menos um campo antes de salvar.');
      return;
    }

    setSaving(true);
    try {
      const { data: assessment, error } = await supabase
        .from('physical_assessments')
        .insert({
          student_id:         student.id,
          assessed_at:        isoDate,
          sex:                sex ?? null,
          age_years:          age ? parseInt(age) : null,
          weight_kg:          weight     ? parseFloat(weight)     : null,
          height_cm:          height     ? parseFloat(height)     : null,
          body_fat_pct:       computed.bc?.fatPct ?? null,
          chest_cm:           chest      ? parseFloat(chest)      : null,
          waist_cm:           waist      ? parseFloat(waist)      : null,
          hip_cm:             hip        ? parseFloat(hip)        : null,
          abdomen_cm:         abdomen    ? parseFloat(abdomen)    : null,
          bicep_cm:           bicep      ? parseFloat(bicep)      : null,
          braco_contraido_cm: bracoContraido ? parseFloat(bracoContraido) : null,
          thigh_cm:           thigh      ? parseFloat(thigh)      : null,
          coxa_medial_cm:     coxaMedial ? parseFloat(coxaMedial): null,
          skinfold_protocol:  protocol ?? null,
          sf_peitoral:        sf.sfPeitoral     ? parseFloat(sf.sfPeitoral)     : null,
          sf_axilar_media:    sf.sfAxilarMedia  ? parseFloat(sf.sfAxilarMedia)  : null,
          sf_triceps:         sf.sfTriceps      ? parseFloat(sf.sfTriceps)      : null,
          sf_subescapular:    sf.sfSubescapular ? parseFloat(sf.sfSubescapular) : null,
          sf_abdominal:       sf.sfAbdominal    ? parseFloat(sf.sfAbdominal)    : null,
          sf_suprailiaca:     sf.sfSuprailiaca  ? parseFloat(sf.sfSuprailiaca)  : null,
          sf_coxa:            sf.sfCoxa         ? parseFloat(sf.sfCoxa)         : null,
          notes:              notes || null,
        })
        .select('id')
        .single();

      if (error || !assessment) throw error;

      const photoInserts = photos
        .filter((p) => p.url)
        .map((p) => ({ assessment_id: assessment.id, position: p.position, photo_url: p.url! }));
      if (photoInserts.length > 0) {
        await supabase.from('assessment_photos').insert(photoInserts);
      }

      sendPushToStudent(
        student.id,
        'Nova avaliação registrada 📊',
        'Seu personal registrou uma nova avaliação física. Confira no app!',
      ).catch(() => {});

      Alert.alert('Salvo!', 'Avaliação registrada com sucesso.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar a avaliação.');
    } finally {
      setSaving(false);
    }
  }

  const riskColor = (risk: string) => {
    if (risk === 'Baixo' || risk === 'Ideal') return '#8DC63F';
    if (risk === 'Moderado' || risk === 'Atenção') return '#f59e0b';
    return '#ef4444';
  };

  return (
    <SafeAreaView className="flex-1 bg-brand-dark">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Header */}
          <View className="px-6 pt-4 pb-2">
            <TouchableOpacity className="mb-3" onPress={() => navigation.goBack()}>
              <Text className="text-brand-green text-sm">← Voltar</Text>
            </TouchableOpacity>
            <Text className="text-white text-2xl font-bold">Nova Avaliação</Text>
            <Text className="text-gray-400 text-sm mt-0.5">{student.name}</Text>
          </View>

          <View className="px-6 mt-2">
            {/* Dados básicos */}
            <View className="bg-brand-dark-2 rounded-2xl p-4 mb-4">
              <SectionTitle title="Dados básicos" />

              <Field
                label="Data" value={date} onChangeText={setDate}
                placeholder="DD/MM/AAAA" keyboardType="numbers-and-punctuation"
              />

              {/* Sexo */}
              <Text className="text-gray-400 text-xs mb-1.5">Sexo</Text>
              <View className="flex-row mb-3">
                {(['M', 'F'] as Sex[]).map((s) => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setSex(s)}
                    className="mr-2 px-5 py-2 rounded-xl"
                    style={{ backgroundColor: sex === s ? '#8DC63F' : '#2E3330' }}
                  >
                    <Text
                      className="text-sm font-semibold"
                      style={{ color: sex === s ? '#1A1D1C' : '#9CA3AF' }}
                    >
                      {s === 'M' ? '♂ Masculino' : '♀ Feminino'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Field label="Idade" unit="anos" value={age} onChangeText={setAge} />
            </View>

            {/* Antropometria */}
            <View className="bg-brand-dark-2 rounded-2xl p-4 mb-4">
              <SectionTitle title="Antropometria" />
              <View className="flex-row justify-between flex-wrap">
                <Field label="Peso" unit="kg" value={weight} onChangeText={setWeight} half />
                <Field label="Altura" unit="cm" value={height} onChangeText={setHeight} half />
              </View>
              {computed.bmiVal && (
                <View className="flex-row items-center justify-between bg-brand-dark rounded-xl px-3 py-2.5">
                  <Text className="text-gray-400 text-sm">IMC calculado</Text>
                  <Text className="text-white text-sm font-semibold">{computed.bmiVal}</Text>
                </View>
              )}
            </View>

            {/* Perimetria */}
            <View className="bg-brand-dark-2 rounded-2xl p-4 mb-4">
              <SectionTitle title="Perimetria (cm)" />
              <View className="flex-row justify-between flex-wrap">
                <Field label="Cintura"         value={waist}         onChangeText={setWaist}         half />
                <Field label="Quadril"          value={hip}           onChangeText={setHip}           half />
                <Field label="Abdômen"          value={abdomen}       onChangeText={setAbdomen}       half />
                <Field label="Peitoral"         value={chest}         onChangeText={setChest}         half />
                <Field label="Braço relaxado"   value={bicep}         onChangeText={setBicep}         half />
                <Field label="Braço contraído"  value={bracoContraido} onChangeText={setBracoContraido} half />
                <Field label="Coxa proximal"    value={thigh}         onChangeText={setThigh}         half />
                <Field label="Coxa medial"      value={coxaMedial}    onChangeText={setCoxaMedial}    half />
              </View>
            </View>

            {/* Dobras cutâneas */}
            <View className="bg-brand-dark-2 rounded-2xl p-4 mb-4">
              <SectionTitle title="Dobras cutâneas (mm)" />

              {/* Seletor de protocolo */}
              <Text className="text-gray-400 text-xs mb-1.5">Protocolo</Text>
              <View className="flex-row mb-3">
                {(['pollock3', 'pollock7', 'guedes'] as Protocol[]).map((p) => (
                  <TouchableOpacity
                    key={p}
                    onPress={() => setProtocol(p)}
                    className="mr-2 px-4 py-2 rounded-xl"
                    style={{ backgroundColor: protocol === p ? '#8DC63F' : '#2E3330' }}
                  >
                    <Text
                      className="text-xs font-semibold"
                      style={{ color: protocol === p ? '#1A1D1C' : '#9CA3AF' }}
                    >
                      {PROTOCOL_LABELS[p]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {showAgeWarning && (
                <View className="flex-row items-center bg-brand-dark rounded-xl px-3 py-2 mb-3">
                  <Ionicons name="information-circle-outline" size={16} color="#f59e0b" />
                  <Text className="text-yellow-500 text-xs ml-2">
                    Informe a idade nos Dados básicos para calcular % gordura (Pollock)
                  </Text>
                </View>
              )}

              {/* Campos dinâmicos por protocolo + sexo */}
              {protocol && sex ? (
                <View className="flex-row justify-between flex-wrap">
                  {PROTOCOL_FIELDS[protocol][sex].map((field) => (
                    <Field
                      key={field.key}
                      label={field.label}
                      value={sf[field.key]}
                      onChangeText={(v) => updateSf(field.key, v)}
                      half={PROTOCOL_FIELDS[protocol][sex].length > 3}
                    />
                  ))}
                </View>
              ) : (
                <Text className="text-gray-600 text-sm">
                  Selecione o sexo e protocolo para ver os campos.
                </Text>
              )}
            </View>

            {/* Índices & Composição Corporal */}
            <View className="bg-brand-dark-2 rounded-2xl p-4 mb-4">
              <SectionTitle title="Índices & Composição Corporal" />
              <Text className="text-gray-600 text-xs mb-3">Calculado automaticamente com base nos dados acima</Text>

              <View className="bg-brand-dark rounded-xl overflow-hidden">
                <ComputedRow
                  label="IMC"
                  value={computed.bmiVal ? String(computed.bmiVal) : null}
                />
                <ComputedRow
                  label="RCQ (cintura/quadril)"
                  value={computed.rcqVal ? String(computed.rcqVal) : null}
                  note={computed.rcqVal && sex ? rcqRisk(computed.rcqVal, sex) : undefined}
                  noteColor={computed.rcqVal && sex ? riskColor(rcqRisk(computed.rcqVal, sex)) : undefined}
                />
                <ComputedRow
                  label="Índice cintura-estatura"
                  value={computed.iceVal ? String(computed.iceVal) : null}
                  note={computed.iceVal ? iceRisk(computed.iceVal) : undefined}
                  noteColor={computed.iceVal ? riskColor(iceRisk(computed.iceVal)) : undefined}
                />
                <ComputedRow
                  label="Σ Dobras"
                  value={computed.sigma ? `${computed.sigma} mm` : null}
                />

                {computed.bc ? (
                  <>
                    <View className="h-px bg-brand-dark-3 my-1" />
                    <ComputedRow label="% Gordura"   value={`${computed.bc.fatPct}%`} />
                    <ComputedRow label="% Músculo"   value={`${computed.bc.musclePct}%`} />
                    <ComputedRow label="% Resíduo"   value={`${computed.bc.residualPct}%`} />
                    {computed.bc.fatKg != null && (
                      <ComputedRow label="Massa gordurosa" value={`${computed.bc.fatKg} kg`} />
                    )}
                    {computed.bc.leanKg != null && (
                      <ComputedRow label="Massa magra" value={`${computed.bc.leanKg} kg`} />
                    )}
                  </>
                ) : (
                  <ComputedRow label="Composição corporal" value={null} />
                )}
              </View>
            </View>

            {/* Observações */}
            <View className="bg-brand-dark-2 rounded-2xl p-4 mb-4">
              <SectionTitle title="Observações" />
              <TextInput
                className="bg-brand-dark border border-brand-dark-3 rounded-xl px-3 py-3 text-white text-sm"
                value={notes}
                onChangeText={setNotes}
                placeholder="Observações gerais..."
                placeholderTextColor="#4B5563"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Fotos */}
            <View className="bg-brand-dark-2 rounded-2xl p-4 mb-6">
              <SectionTitle title="Fotos" />
              <View className="flex-row flex-wrap">
                {photos.map((slot, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => pickPhoto(i)}
                    disabled={slot.uploading}
                    style={{ width: '30%', marginRight: (i + 1) % 3 === 0 ? 0 : '5%', marginBottom: 12 }}
                  >
                    <View
                      className="rounded-xl overflow-hidden items-center justify-center"
                      style={{
                        height: 90, backgroundColor: '#1A1D1C',
                        borderWidth: 1, borderColor: '#2E3330',
                        borderStyle: slot.url ? 'solid' : 'dashed',
                      }}
                    >
                      {slot.uploading ? (
                        <ActivityIndicator color="#8DC63F" />
                      ) : slot.url ? (
                        <Image source={{ uri: slot.url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                      ) : (
                        <>
                          <Ionicons name="camera-outline" size={22} color="#4B5563" />
                          <Text className="text-gray-600 text-xs mt-1">{slot.position}</Text>
                        </>
                      )}
                    </View>
                    {slot.url && (
                      <Text className="text-gray-500 text-xs text-center mt-1">{slot.position}</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity onPress={addExtraPosition} className="flex-row items-center mt-1">
                <Ionicons name="add-circle-outline" size={18} color="#8DC63F" />
                <Text className="text-brand-green text-sm ml-1">Adicionar outra posição</Text>
              </TouchableOpacity>
            </View>

            {/* Salvar */}
            <TouchableOpacity
              className="bg-brand-green rounded-2xl py-4 items-center"
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#1A1D1C" />
              ) : (
                <Text className="text-brand-dark font-bold text-base">Salvar avaliação</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
