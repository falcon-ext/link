import { useState, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

type Tip = {
  id: string;
  title: string;
  body: string;
  category: string;
  created_at: string;
};

const CATEGORY_COLORS: Record<string, string> = {
  Nutrição: '#F59E0B',
  Treino: '#3B82F6',
  Recuperação: '#8B5CF6',
  Geral: '#8DC63F',
};

export function StudentTipsScreen() {
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadTips();
    }, [])
  );

  async function loadTips() {
    setLoading(true);
    const { data } = await supabase
      .from('tips')
      .select('*')
      .order('created_at', { ascending: false });
    setTips((data as Tip[]) ?? []);
    setLoading(false);
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-brand-dark items-center justify-center">
        <ActivityIndicator color="#8DC63F" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-dark">
      <View className="px-6 pt-8 pb-4">
        <Text className="text-white text-2xl font-bold">Dicas</Text>
        <Text className="text-gray-400 text-sm mt-1">Conteúdo do seu personal</Text>
      </View>

      {tips.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="bulb-outline" size={56} color="#374151" />
          <Text className="text-gray-400 text-lg font-semibold mt-4 text-center">
            Nenhuma dica ainda
          </Text>
          <Text className="text-gray-600 text-sm mt-2 text-center">
            Seu personal ainda não publicou dicas.
          </Text>
        </View>
      ) : (
        <FlatList
          data={tips}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
          renderItem={({ item }) => {
            const color = CATEGORY_COLORS[item.category] ?? '#8DC63F';
            return (
              <View className="bg-brand-dark-2 rounded-2xl p-5 mb-3">
                <View
                  className="rounded-full px-2 py-0.5 self-start mb-2"
                  style={{ backgroundColor: color + '22' }}
                >
                  <Text className="text-xs font-semibold" style={{ color }}>
                    {item.category}
                  </Text>
                </View>
                <Text className="text-white font-bold text-base mb-2">{item.title}</Text>
                <Text className="text-gray-400 text-sm leading-5">{item.body}</Text>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
