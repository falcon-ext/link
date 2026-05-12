import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { ExercisesStackParams } from '../../navigation/ExercisesStack';
import { supabase } from '../../lib/supabase';
import { cloudinaryVideoThumbnail } from '../../lib/cloudinary';

type Props = {
  navigation: NativeStackNavigationProp<ExercisesStackParams, 'ExerciseDetail'>;
  route: RouteProp<ExercisesStackParams, 'ExerciseDetail'>;
};

const MUSCLE_LABELS: Record<string, string> = {
  chest: 'Peito', back: 'Costas', legs: 'Pernas', shoulders: 'Ombros',
  biceps: 'Bíceps', triceps: 'Tríceps', core: 'Core', cardio: 'Cardio', other: 'Outro',
};

export function ExerciseDetailScreen({ navigation, route }: Props) {
  const { exercise } = route.params;
  const [playing, setPlaying] = useState(false);

  const player = useVideoPlayer(exercise.video_url ?? '', (p) => {
    p.loop = true;
  });

  async function handleDelete() {
    Alert.alert('Excluir exercício', `Deseja excluir "${exercise.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('exercises').delete().eq('id', exercise.id);
          navigation.goBack();
        },
      },
    ]);
  }

  const thumb = exercise.thumbnail_url ?? (exercise.video_url ? cloudinaryVideoThumbnail(exercise.video_url) : null);

  return (
    <SafeAreaView className="flex-1 bg-brand-dark">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="px-6 pt-4">
          <TouchableOpacity className="mb-4" onPress={() => navigation.goBack()}>
            <Text className="text-brand-green text-sm">← Voltar</Text>
          </TouchableOpacity>
        </View>

        {/* Vídeo ou thumbnail */}
        {exercise.video_url ? (
          <View className="mx-6 rounded-2xl overflow-hidden bg-black aspect-video mb-6">
            {playing ? (
              <VideoView
                player={player}
                style={{ flex: 1 }}
                allowsFullscreen
                allowsPictureInPicture
              />
            ) : (
              <TouchableOpacity
                className="flex-1 items-center justify-center"
                onPress={() => { player.play(); setPlaying(true); }}
              >
                {thumb ? (
                  <Image source={{ uri: thumb }} style={{ position: 'absolute', width: '100%', height: '100%' }} resizeMode="cover" />
                ) : null}
                <View className="bg-black/40 w-16 h-16 rounded-full items-center justify-center">
                  <Ionicons name="play" size={32} color="#8DC63F" />
                </View>
              </TouchableOpacity>
            )}
          </View>
        ) : thumb ? (
          <Image source={{ uri: thumb }} className="mx-6 rounded-2xl aspect-video mb-6" resizeMode="cover" />
        ) : (
          <View className="mx-6 rounded-2xl aspect-video bg-brand-dark-2 items-center justify-center mb-6">
            <Ionicons name="barbell-outline" size={48} color="#4b5563" />
            <Text className="text-gray-500 text-sm mt-2">Sem vídeo</Text>
          </View>
        )}

        <View className="px-6">
          <Text className="text-white text-2xl font-bold mb-1">{exercise.name}</Text>
          <Text className="text-brand-green text-sm mb-4">{MUSCLE_LABELS[exercise.muscle_group]}{exercise.equipment ? ` • ${exercise.equipment}` : ''}</Text>

          {exercise.description ? (
            <View className="bg-brand-dark-2 rounded-2xl p-4 mb-6">
              <Text className="text-gray-300 text-sm leading-6">{exercise.description}</Text>
            </View>
          ) : null}

          {exercise.is_custom ? (
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 bg-brand-dark-2 border border-brand-dark-3 rounded-xl py-3 items-center"
                onPress={() => navigation.navigate('EditExercise', { exercise })}
              >
                <Text className="text-white font-semibold">Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-red-900/30 border border-red-900 rounded-xl py-3 items-center"
                onPress={handleDelete}
              >
                <Text className="text-red-400 font-semibold">Excluir</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="bg-brand-dark-2 rounded-xl p-3">
              <Text className="text-gray-500 text-xs text-center">Exercício padrão — não pode ser editado</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
