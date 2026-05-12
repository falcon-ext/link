import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { StudentsStackParams } from '../../navigation/StudentsStack';
import { supabase } from '../../lib/supabase';
import { Exercise, MuscleGroup } from '../../types';
import { cloudinaryVideoThumbnail } from '../../lib/cloudinary';

type Props = {
  navigation: NativeStackNavigationProp<StudentsStackParams, 'ExercisePicker'>;
  route: RouteProp<StudentsStackParams, 'ExercisePicker'>;
};

const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  chest: 'Peito', back: 'Costas', legs: 'Pernas', shoulders: 'Ombros',
  biceps: 'Bíceps', triceps: 'Tríceps', core: 'Core', cardio: 'Cardio', other: 'Outro',
};

const FILTERS: { key: MuscleGroup | 'all'; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'chest', label: 'Peito' },
  { key: 'back', label: 'Costas' },
  { key: 'legs', label: 'Pernas' },
  { key: 'shoulders', label: 'Ombros' },
  { key: 'biceps', label: 'Bíceps' },
  { key: 'triceps', label: 'Tríceps' },
  { key: 'core', label: 'Core' },
  { key: 'cardio', label: 'Cardio' },
];

export function ExercisePickerScreen({ navigation, route }: Props) {
  const { sheetId, orderIndex } = route.params;
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<MuscleGroup | 'all'>('all');

  useFocusEffect(
    useCallback(() => {
      supabase
        .from('exercises')
        .select('*')
        .order('name')
        .then(({ data }) => {
          setExercises((data as Exercise[]) ?? []);
          setLoading(false);
        });
    }, [])
  );

  const filtered = exercises.filter((e) => {
    const matchGroup = filter === 'all' || e.muscle_group === filter;
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase());
    return matchGroup && matchSearch;
  });

  return (
    <SafeAreaView className="flex-1 bg-brand-dark">
      <View className="px-6 pt-4 pb-3 flex-row items-center">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
          <Text className="text-brand-green text-sm">← Voltar</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-white">Escolher exercício</Text>
      </View>

      <View className="px-6 mb-3">
        <View className="flex-row items-center bg-brand-dark-2 border border-brand-dark-3 rounded-xl px-3">
          <Ionicons name="search-outline" size={18} color="#6b7280" />
          <TextInput
            className="flex-1 py-3 px-2 text-base text-white"
            placeholder="Buscar exercício..."
            placeholderTextColor="#6b7280"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <FlatList
        data={FILTERS}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.key}
        style={{ flexGrow: 0, flexShrink: 0 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 8 }}
        renderItem={({ item }) => {
          const active = filter === item.key;
          return (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setFilter(item.key)}
              style={{
                marginRight: 8,
                paddingHorizontal: 16,
                paddingVertical: 7,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: active ? '#8DC63F' : '#2E3330',
                backgroundColor: active ? '#8DC63F' : '#242827',
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '500', color: active ? '#1A1D1C' : '#9CA3AF' }}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#8DC63F" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 4, paddingBottom: 24 }}
          renderItem={({ item }) => {
            const thumb = item.thumbnail_url ?? (item.video_url ? cloudinaryVideoThumbnail(item.video_url) : null);
            return (
              <TouchableOpacity
                className="flex-row items-center bg-brand-dark-2 rounded-2xl p-4 mb-3"
                onPress={() =>
                  navigation.navigate('AddExerciseParams', { sheetId, exercise: item, orderIndex })
                }
              >
                {thumb ? (
                  <Image source={{ uri: thumb }} className="w-12 h-12 rounded-xl" resizeMode="cover" />
                ) : (
                  <View className="w-12 h-12 rounded-xl bg-brand-dark-3 items-center justify-center">
                    <Ionicons name="barbell-outline" size={20} color="#6b7280" />
                  </View>
                )}
                <View className="flex-1 ml-3">
                  <Text className="text-white font-semibold">{item.name}</Text>
                  <Text className="text-gray-400 text-sm mt-0.5">{MUSCLE_LABELS[item.muscle_group]}</Text>
                </View>
                <Ionicons name="add-circle-outline" size={22} color="#8DC63F" />
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <Text className="text-gray-500 text-center mt-10">Nenhum exercício encontrado.</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}
