import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { StudentsStackParams } from '../../navigation/StudentsStack';
import { supabase } from '../../lib/supabase';
import { Avatar } from '../../components/Avatar';
import { Profile } from '../../types';

type Props = {
  navigation: NativeStackNavigationProp<StudentsStackParams, 'StudentsList'>;
};

export function StudentsScreen({ navigation }: Props) {
  const [students, setStudents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchStudents() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .order('name');
    setStudents((data as Profile[]) ?? []);
  }

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchStudents().finally(() => setLoading(false));
    }, [])
  );

  async function onRefresh() {
    setRefreshing(true);
    await fetchStudents();
    setRefreshing(false);
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-dark">
      <View className="px-6 pt-6 pb-2 flex-row items-center justify-between">
        <View>
          <Text className="text-2xl font-bold text-white">Alunos</Text>
          <Text className="text-sm text-gray-400 mt-1">
            {students.length} {students.length === 1 ? 'aluno cadastrado' : 'alunos cadastrados'}
          </Text>
        </View>
        <TouchableOpacity
          className="bg-brand-green w-10 h-10 rounded-full items-center justify-center"
          onPress={() => navigation.navigate('CreateStudent')}
        >
          <Text className="text-brand-dark text-2xl font-bold leading-none">+</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#8DC63F" />
        </View>
      ) : students.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-gray-500 text-center text-base">
            Nenhum aluno cadastrado ainda.{'\n'}Compartilhe o código de acesso para que seus alunos se cadastrem.
          </Text>
        </View>
      ) : (
        <FlatList
          data={students}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8DC63F" />}
          renderItem={({ item }) => (
            <TouchableOpacity
              className="flex-row items-center bg-brand-dark-2 rounded-2xl p-4 mb-3"
              onPress={() => navigation.navigate('StudentDetail', { student: item })}
            >
              <Avatar name={item.name} size={48} />
              <View className="flex-1 ml-3">
                <Text className="text-white font-semibold text-base">{item.name}</Text>
                <Text className="text-gray-400 text-sm mt-0.5">{item.email}</Text>
                {item.goal ? (
                  <Text className="text-gray-500 text-xs mt-0.5" numberOfLines={1}>{item.goal}</Text>
                ) : null}
              </View>
              <View className={`px-2 py-1 rounded-full ${item.is_active ? 'bg-brand-green/20' : 'bg-gray-700'}`}>
                <Text className={`text-xs font-medium ${item.is_active ? 'text-brand-green' : 'text-gray-400'}`}>
                  {item.is_active ? 'Ativo' : 'Inativo'}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}
