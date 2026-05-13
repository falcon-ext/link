import { useState } from 'react';
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

type Props = {
  navigation: NativeStackNavigationProp<StudentsStackParams, 'NewAssessment'>;
  route: RouteProp<StudentsStackParams, 'NewAssessment'>;
};

type PhotoSlot = { position: string; url: string | null; uploading: boolean };

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

function calcBMI(weight: string, height: string): string {
  const w = parseFloat(weight);
  const h = parseFloat(height);
  if (!w || !h) return '';
  return (w / Math.pow(h / 100, 2)).toFixed(1);
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

export function NewAssessmentScreen({ navigation, route }: Props) {
  const { student } = route.params;

  const [date, setDate]           = useState(todayBR());
  const [weight, setWeight]       = useState('');
  const [height, setHeight]       = useState('');
  const [bodyFat, setBodyFat]     = useState('');
  const [chest, setChest]         = useState('');
  const [waist, setWaist]         = useState('');
  const [hip, setHip]             = useState('');
  const [abdomen, setAbdomen]     = useState('');
  const [bicep, setBicep]         = useState('');
  const [thigh, setThigh]         = useState('');
  const [skinfolds, setSkinfolds] = useState('');
  const [notes, setNotes]         = useState('');
  const [photos, setPhotos]       = useState<PhotoSlot[]>(
    POSITIONS.map((p) => ({ position: p, url: null, uploading: false }))
  );
  const [saving, setSaving] = useState(false);

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

    const hasAnyData = weight || height || bodyFat || chest || waist ||
      hip || abdomen || bicep || thigh || skinfolds || notes ||
      photos.some((p) => p.url);

    if (!hasAnyData) {
      Alert.alert('', 'Preencha pelo menos um campo antes de salvar.');
      return;
    }

    setSaving(true);
    try {
      const { data: assessment, error } = await supabase
        .from('physical_assessments')
        .insert({
          student_id:   student.id,
          assessed_at:  isoDate,
          weight_kg:    weight    ? parseFloat(weight)    : null,
          height_cm:    height    ? parseFloat(height)    : null,
          body_fat_pct: bodyFat   ? parseFloat(bodyFat)   : null,
          chest_cm:     chest     ? parseFloat(chest)     : null,
          waist_cm:     waist     ? parseFloat(waist)     : null,
          hip_cm:       hip       ? parseFloat(hip)       : null,
          abdomen_cm:   abdomen   ? parseFloat(abdomen)   : null,
          bicep_cm:     bicep     ? parseFloat(bicep)     : null,
          thigh_cm:     thigh     ? parseFloat(thigh)     : null,
          skinfolds:    skinfolds || null,
          notes:        notes     || null,
        })
        .select('id')
        .single();

      if (error || !assessment) throw error;

      const photoInserts = photos
        .filter((p) => p.url)
        .map((p) => ({
          assessment_id: assessment.id,
          position: p.position,
          photo_url: p.url!,
        }));

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

  const bmi = calcBMI(weight, height);

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
            {/* Data */}
            <View className="bg-brand-dark-2 rounded-2xl p-4 mb-4">
              <Text className="text-white font-semibold mb-3">Data</Text>
              <Field label="Data" value={date} onChangeText={setDate} placeholder="DD/MM/AAAA" keyboardType="numbers-and-punctuation" />
            </View>

            {/* Métricas principais */}
            <View className="bg-brand-dark-2 rounded-2xl p-4 mb-4">
              <Text className="text-white font-semibold mb-3">Composição corporal</Text>
              <View className="flex-row justify-between flex-wrap">
                <Field label="Peso" unit="kg" value={weight} onChangeText={setWeight} half />
                <Field label="Altura" unit="cm" value={height} onChangeText={setHeight} half />
                <Field label="% Gordura" unit="%" value={bodyFat} onChangeText={setBodyFat} half />
                <View style={{ width: '48%', marginBottom: 12 }}>
                  <Text className="text-gray-400 text-xs mb-1">IMC (calculado)</Text>
                  <View className="bg-brand-dark border border-brand-dark-3 rounded-xl px-3 py-2.5">
                    <Text className="text-white text-sm">{bmi || '—'}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Circunferências */}
            <View className="bg-brand-dark-2 rounded-2xl p-4 mb-4">
              <Text className="text-white font-semibold mb-3">Circunferências (cm)</Text>
              <View className="flex-row justify-between flex-wrap">
                <Field label="Cintura"  value={waist}   onChangeText={setWaist}   half />
                <Field label="Quadril"  value={hip}     onChangeText={setHip}     half />
                <Field label="Abdômen"  value={abdomen} onChangeText={setAbdomen} half />
                <Field label="Peitoral" value={chest}   onChangeText={setChest}   half />
                <Field label="Bíceps"   value={bicep}   onChangeText={setBicep}   half />
                <Field label="Coxa"     value={thigh}   onChangeText={setThigh}   half />
              </View>
            </View>

            {/* Dobras cutâneas */}
            <View className="bg-brand-dark-2 rounded-2xl p-4 mb-4">
              <Text className="text-white font-semibold mb-3">Dobras cutâneas</Text>
              <Text className="text-gray-500 text-xs mb-2">Registre os valores livremente (ex: Peitoral: 12mm, Abdômen: 18mm)</Text>
              <TextInput
                className="bg-brand-dark border border-brand-dark-3 rounded-xl px-3 py-3 text-white text-sm"
                value={skinfolds}
                onChangeText={setSkinfolds}
                placeholder="Ex: Peitoral 12mm, Abdômen 18mm, Coxa 22mm"
                placeholderTextColor="#4B5563"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Observações */}
            <View className="bg-brand-dark-2 rounded-2xl p-4 mb-4">
              <Text className="text-white font-semibold mb-3">Observações</Text>
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
              <Text className="text-white font-semibold mb-3">Fotos</Text>
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
                      style={{ height: 90, backgroundColor: '#1A1D1C', borderWidth: 1, borderColor: '#2E3330', borderStyle: slot.url ? 'solid' : 'dashed' }}
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
