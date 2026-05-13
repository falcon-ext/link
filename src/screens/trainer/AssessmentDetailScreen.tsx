import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { StudentsStackParams } from '../../navigation/StudentsStack';
import { AssessmentFull, AssessmentPhoto } from './TrainerAssessmentListScreen';

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

function Row({ label, value, unit }: { label: string; value: number | null | string; unit?: string }) {
  if (value == null || value === '') return null;
  return (
    <View className="flex-row items-center justify-between py-2.5" style={{ borderBottomWidth: 1, borderBottomColor: '#2E3330' }}>
      <Text className="text-gray-400 text-sm">{label}</Text>
      <Text className="text-white text-sm font-semibold">
        {value}{unit ? ` ${unit}` : ''}
      </Text>
    </View>
  );
}

export function AssessmentDetailScreen({ navigation, route }: Props) {
  const { assessment: a, student, photos } = route.params;
  const imc = bmi(a.weight_kg, a.height_cm);

  // Group photos by position
  const byPosition: Record<string, AssessmentPhoto[]> = {};
  for (const p of photos) {
    if (!byPosition[p.position]) byPosition[p.position] = [];
    byPosition[p.position].push(p);
  }
  const positions = Object.keys(byPosition);

  return (
    <SafeAreaView className="flex-1 bg-brand-dark">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View className="px-6 pt-4 pb-4">
          <TouchableOpacity className="mb-3" onPress={() => navigation.goBack()}>
            <Text className="text-brand-green text-sm">← Voltar</Text>
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold capitalize">{formatDate(a.assessed_at)}</Text>
          <Text className="text-gray-400 text-sm mt-0.5">{student.name}</Text>
        </View>

        <View className="px-6">
          {/* Composição corporal */}
          <View className="bg-brand-dark-2 rounded-2xl p-4 mb-4">
            <Text className="text-white font-semibold mb-2">Composição corporal</Text>
            <Row label="Peso"       value={a.weight_kg}    unit="kg" />
            <Row label="Altura"     value={a.height_cm}    unit="cm" />
            <Row label="IMC"        value={imc} />
            <Row label="% Gordura"  value={a.body_fat_pct} unit="%" />
          </View>

          {/* Circunferências */}
          {(a.chest_cm || a.waist_cm || a.hip_cm || a.abdomen_cm || a.bicep_cm || a.thigh_cm) && (
            <View className="bg-brand-dark-2 rounded-2xl p-4 mb-4">
              <Text className="text-white font-semibold mb-2">Circunferências</Text>
              <Row label="Peitoral" value={a.chest_cm}   unit="cm" />
              <Row label="Cintura"  value={a.waist_cm}   unit="cm" />
              <Row label="Quadril"  value={a.hip_cm}     unit="cm" />
              <Row label="Abdômen"  value={a.abdomen_cm} unit="cm" />
              <Row label="Bíceps"   value={a.bicep_cm}   unit="cm" />
              <Row label="Coxa"     value={a.thigh_cm}   unit="cm" />
            </View>
          )}

          {/* Dobras cutâneas */}
          {a.skinfolds ? (
            <View className="bg-brand-dark-2 rounded-2xl p-4 mb-4">
              <Text className="text-white font-semibold mb-2">Dobras cutâneas</Text>
              <Text className="text-gray-300 text-sm leading-5">{a.skinfolds}</Text>
            </View>
          ) : null}

          {/* Observações */}
          {a.notes ? (
            <View className="bg-brand-dark-2 rounded-2xl p-4 mb-4">
              <Text className="text-white font-semibold mb-2">Observações</Text>
              <Text className="text-gray-300 text-sm leading-5">{a.notes}</Text>
            </View>
          ) : null}

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
