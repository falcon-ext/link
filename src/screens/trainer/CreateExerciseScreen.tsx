import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  Alert, ScrollView, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { ExercisesStackParams } from '../../navigation/ExercisesStack';
import { supabase } from '../../lib/supabase';
import { uploadToCloudinary, cloudinaryVideoThumbnail } from '../../lib/cloudinary';
import { MuscleGroup } from '../../types';

type Props = {
  navigation: NativeStackNavigationProp<ExercisesStackParams, 'CreateExercise'>;
  route: RouteProp<ExercisesStackParams, 'CreateExercise' | 'EditExercise'>;
};

const MUSCLE_OPTIONS: { key: MuscleGroup; label: string }[] = [
  { key: 'chest', label: 'Peito' },
  { key: 'back', label: 'Costas' },
  { key: 'legs', label: 'Pernas' },
  { key: 'shoulders', label: 'Ombros' },
  { key: 'biceps', label: 'Bíceps' },
  { key: 'triceps', label: 'Tríceps' },
  { key: 'core', label: 'Core' },
  { key: 'cardio', label: 'Cardio' },
  { key: 'other', label: 'Outro' },
];

export function CreateExerciseScreen({ navigation, route }: Props) {
  const editing = route.name === 'EditExercise' && 'exercise' in route.params ? route.params.exercise : null;

  const [name, setName] = useState(editing?.name ?? '');
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>(editing?.muscle_group ?? 'chest');
  const [equipment, setEquipment] = useState(editing?.equipment ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(editing?.video_url ?? null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function pickVideo() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 0.7,
      videoMaxDuration: 60,
    });
    if (!result.canceled && result.assets[0]) {
      setVideoUri(result.assets[0].uri);
    }
  }

  async function recordVideo() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'Autorize o acesso à câmera nas configurações.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 0.7,
      videoMaxDuration: 60,
    });
    if (!result.canceled && result.assets[0]) {
      setVideoUri(result.assets[0].uri);
    }
  }

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert('Atenção', 'Digite o nome do exercício.');
      return;
    }

    setSaving(true);
    let finalVideoUrl = videoUrl;

    if (videoUri) {
      try {
        setUploading(true);
        finalVideoUrl = await uploadToCloudinary(videoUri, 'video');
        setUploading(false);
      } catch {
        setUploading(false);
        setSaving(false);
        Alert.alert('Erro', 'Falha no upload do vídeo. Tente novamente.');
        return;
      }
    }

    const payload = {
      name: name.trim(),
      muscle_group: muscleGroup,
      equipment: equipment.trim() || null,
      description: description.trim() || null,
      video_url: finalVideoUrl,
      thumbnail_url: finalVideoUrl ? cloudinaryVideoThumbnail(finalVideoUrl) : null,
      is_custom: true,
    };

    if (editing) {
      await supabase.from('exercises').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('exercises').insert(payload);
    }

    setSaving(false);
    navigation.goBack();
  }

  const thumb = videoUri ?? (videoUrl ? cloudinaryVideoThumbnail(videoUrl) : null);

  return (
    <SafeAreaView className="flex-1 bg-brand-dark">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View className="px-6 pt-4 pb-10">
            <TouchableOpacity className="mb-6" onPress={() => navigation.goBack()}>
              <Text className="text-brand-green text-sm">← Voltar</Text>
            </TouchableOpacity>

            <Text className="text-2xl font-bold text-white mb-8">
              {editing ? 'Editar exercício' : 'Novo exercício'}
            </Text>

            {/* Nome */}
            <Text className="text-sm font-medium text-gray-400 mb-1">Nome do exercício</Text>
            <TextInput
              className="bg-brand-dark-2 border border-brand-dark-3 rounded-xl px-4 py-3 text-base text-white mb-4"
              placeholder="Ex: Supino Reto"
              placeholderTextColor="#6b7280"
              autoCapitalize="words"
              value={name}
              onChangeText={setName}
            />

            {/* Grupo muscular */}
            <Text className="text-sm font-medium text-gray-400 mb-2">Grupo muscular</Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {MUSCLE_OPTIONS.map((opt) => {
                const active = muscleGroup === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    activeOpacity={0.7}
                    onPress={() => setMuscleGroup(opt.key)}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: active ? '#8DC63F' : '#2E3330',
                      backgroundColor: active ? '#8DC63F' : '#242827',
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '500', color: active ? '#1A1D1C' : '#9CA3AF' }}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Equipamento */}
            <Text className="text-sm font-medium text-gray-400 mb-1">Equipamento</Text>
            <TextInput
              className="bg-brand-dark-2 border border-brand-dark-3 rounded-xl px-4 py-3 text-base text-white mb-4"
              placeholder="Ex: Barra, Haltere, Cabo..."
              placeholderTextColor="#6b7280"
              autoCapitalize="words"
              value={equipment}
              onChangeText={setEquipment}
            />

            {/* Descrição */}
            <Text className="text-sm font-medium text-gray-400 mb-1">Descrição / execução</Text>
            <TextInput
              className="bg-brand-dark-2 border border-brand-dark-3 rounded-xl px-4 py-3 text-base text-white mb-6"
              placeholder="Descreva como executar o exercício..."
              placeholderTextColor="#6b7280"
              autoCapitalize="sentences"
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
            />

            {/* Vídeo */}
            <Text className="text-sm font-medium text-gray-400 mb-2">Vídeo de demonstração</Text>
            {thumb ? (
              <View className="mb-3">
                <Image
                  source={{ uri: thumb }}
                  className="w-full rounded-2xl aspect-video"
                  resizeMode="cover"
                />
                <TouchableOpacity
                  className="mt-2 items-center"
                  onPress={() => { setVideoUri(null); setVideoUrl(null); }}
                >
                  <Text className="text-red-400 text-sm">Remover vídeo</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="flex-row gap-3 mb-6">
                <TouchableOpacity
                  className="flex-1 bg-brand-dark-2 border border-brand-dark-3 rounded-xl py-4 items-center"
                  onPress={recordVideo}
                >
                  <Ionicons name="videocam-outline" size={24} color="#8DC63F" />
                  <Text className="text-gray-400 text-xs mt-1">Gravar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 bg-brand-dark-2 border border-brand-dark-3 rounded-xl py-4 items-center"
                  onPress={pickVideo}
                >
                  <Ionicons name="folder-outline" size={24} color="#8DC63F" />
                  <Text className="text-gray-400 text-xs mt-1">Galeria</Text>
                </TouchableOpacity>
              </View>
            )}

            {uploading && (
              <View className="flex-row items-center justify-center mb-4">
                <ActivityIndicator color="#8DC63F" size="small" />
                <Text className="text-gray-400 text-sm ml-2">Enviando vídeo...</Text>
              </View>
            )}

            <TouchableOpacity
              className={`rounded-xl py-4 items-center ${saving ? 'bg-brand-green-dark' : 'bg-brand-green'}`}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#1A1D1C" />
              ) : (
                <Text className="text-brand-dark font-bold text-base">
                  {editing ? 'Salvar alterações' : 'Criar exercício'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
