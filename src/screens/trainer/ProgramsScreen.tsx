import { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { StudentsStackParams } from '../../navigation/StudentsStack';
import { supabase } from '../../lib/supabase';
import { Program } from '../../types';

type Props = {
  navigation: NativeStackNavigationProp<StudentsStackParams, 'ProgramsList'>;
  route: RouteProp<StudentsStackParams, 'ProgramsList'>;
};

export function ProgramsScreen({ navigation, route }: Props) {
  const { student } = route.params;
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      supabase
        .from('programs')
        .select('*')
        .eq('student_id', student.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          setPrograms((data as Program[]) ?? []);
          setLoading(false);
        });
    }, [student.id])
  );

  return (
    <SafeAreaView className="flex-1 bg-brand-dark">
      <View className="px-6 pt-4 pb-3 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text className="text-brand-green text-sm">← Voltar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="bg-brand-green w-9 h-9 rounded-full items-center justify-center"
          onPress={() => navigation.navigate('CreateProgram', { student })}
        >
          <Text className="text-brand-dark text-xl font-bold leading-none">+</Text>
        </TouchableOpacity>
      </View>

      <Text className="text-2xl font-bold text-white px-6 mb-4">
        Fichas de {student.name.split(' ')[0]}
      </Text>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#8DC63F" />
        </View>
      ) : (
        <FlatList
          data={programs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              className="bg-brand-dark-2 rounded-2xl p-4 mb-3 flex-row items-center"
              onPress={() => navigation.navigate('ProgramDetail', { program: item, student })}
            >
              <Ionicons name="document-text-outline" size={22} color="#8DC63F" className="mr-3" />
              <View className="flex-1 ml-3">
                <Text className="text-white font-semibold text-base">{item.name}</Text>
              </View>
              <View className={`px-2 py-0.5 rounded-full mr-3 ${item.is_active ? 'bg-brand-green/20' : 'bg-gray-700'}`}>
                <Text className={`text-xs font-medium ${item.is_active ? 'text-brand-green' : 'text-gray-400'}`}>
                  {item.is_active ? 'Ativa' : 'Inativa'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#6b7280" />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View className="items-center mt-16">
              <Ionicons name="document-text-outline" size={48} color="#374151" />
              <Text className="text-gray-500 text-center mt-4">Nenhuma ficha criada ainda.</Text>
              <Text className="text-gray-600 text-center text-sm mt-1">Toque em + para criar a primeira.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
