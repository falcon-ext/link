import { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { StudentWorkoutStackParams } from '../../navigation/StudentWorkoutStack';
import { supabase } from '../../lib/supabase';
import { uploadToCloudinary } from '../../lib/cloudinary';

type Props = {
  navigation: NativeStackNavigationProp<StudentWorkoutStackParams, 'WorkoutSummary'>;
  route: RouteProp<StudentWorkoutStackParams, 'WorkoutSummary'>;
};

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}min ${s}s` : `${s}s`;
}

export function WorkoutSummaryScreen({ navigation, route }: Props) {
  const { sheetName, duration, setsCompleted, exercisesTotal, postId } = route.params;

  const [uploading, setUploading] = useState(false);
  const [photoAdded, setPhotoAdded] = useState(false);

  async function handleAddPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (result.canceled || !result.assets[0]) return;

    setUploading(true);
    try {
      const url = await uploadToCloudinary(result.assets[0].uri, 'image');
      await supabase.from('feed_posts').update({ photo_url: url }).eq('id', postId);
      setPhotoAdded(true);
    } catch {
      Alert.alert('Erro', 'Não foi possível enviar a foto. Tente pelo feed.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-dark items-center justify-center px-6">
      <View className="w-24 h-24 rounded-full bg-brand-green/20 items-center justify-center mb-6">
        <Ionicons name="trophy" size={48} color="#8DC63F" />
      </View>

      <Text className="text-white text-3xl font-bold mb-2">Treino concluído!</Text>
      <Text className="text-gray-400 text-base mb-10">{sheetName}</Text>

      <View className="w-full bg-brand-dark-2 rounded-2xl p-5 mb-6">
        <View className="flex-row justify-around">
          <View className="items-center">
            <Text className="text-brand-green text-2xl font-bold">{formatDuration(duration)}</Text>
            <Text className="text-gray-500 text-sm mt-1">Duração</Text>
          </View>
          <View className="w-px bg-brand-dark-3" />
          <View className="items-center">
            <Text className="text-brand-green text-2xl font-bold">{setsCompleted}</Text>
            <Text className="text-gray-500 text-sm mt-1">Séries feitas</Text>
          </View>
          <View className="w-px bg-brand-dark-3" />
          <View className="items-center">
            <Text className="text-brand-green text-2xl font-bold">{exercisesTotal}</Text>
            <Text className="text-gray-500 text-sm mt-1">Exercícios</Text>
          </View>
        </View>
      </View>

      {/* Check-in postado */}
      <View className="w-full bg-brand-dark-2 rounded-2xl px-4 py-3 mb-4 flex-row items-center">
        <Ionicons name="checkmark-circle" size={20} color="#8DC63F" />
        <Text className="text-gray-400 text-sm ml-2 flex-1">
          Check-in postado no feed
        </Text>
        {postId && !photoAdded && (
          <TouchableOpacity
            onPress={handleAddPhoto}
            disabled={uploading}
            className="flex-row items-center"
          >
            {uploading ? (
              <ActivityIndicator size="small" color="#8DC63F" />
            ) : (
              <>
                <Ionicons name="camera-outline" size={16} color="#8DC63F" />
                <Text className="text-brand-green text-xs ml-1 font-semibold">
                  + Foto
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
        {photoAdded && (
          <Text className="text-brand-green text-xs font-semibold">Foto adicionada ✓</Text>
        )}
      </View>

      <TouchableOpacity
        className="bg-brand-green rounded-xl py-4 items-center w-full"
        onPress={() => navigation.navigate('WorkoutPick')}
      >
        <Text className="text-brand-dark font-bold text-base">Voltar ao início</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
