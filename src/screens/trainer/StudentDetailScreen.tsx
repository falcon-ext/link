import { useState } from 'react';
import { View, Text, TouchableOpacity, Switch, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { StudentsStackParams } from '../../navigation/StudentsStack';
import { supabase } from '../../lib/supabase';
import { Avatar } from '../../components/Avatar';

type Props = {
  navigation: NativeStackNavigationProp<StudentsStackParams, 'StudentDetail'>;
  route: RouteProp<StudentsStackParams, 'StudentDetail'>;
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function calcAge(dateStr: string | null) {
  if (!dateStr) return null;
  const birth = new Date(dateStr);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export function StudentDetailScreen({ navigation, route }: Props) {
  const [student, setStudent] = useState(route.params.student);
  const [toggling, setToggling] = useState(false);

  async function handleToggleActive() {
    const next = !student.is_active;
    const label = next ? 'ativar' : 'desativar';

    Alert.alert(
      `${next ? 'Ativar' : 'Desativar'} aluno`,
      `Deseja ${label} ${student.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: next ? 'Ativar' : 'Desativar',
          style: next ? 'default' : 'destructive',
          onPress: async () => {
            setToggling(true);
            const { error } = await supabase
              .from('profiles')
              .update({ is_active: next })
              .eq('id', student.id);
            setToggling(false);
            if (!error) setStudent((s) => ({ ...s, is_active: next }));
          },
        },
      ]
    );
  }

  const age = calcAge(student.birth_date);

  return (
    <SafeAreaView className="flex-1 bg-brand-dark">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View className="px-6 pt-4 pb-6 items-center">
          <TouchableOpacity className="self-start mb-4" onPress={() => navigation.goBack()}>
            <Text className="text-brand-green text-sm">← Voltar</Text>
          </TouchableOpacity>

          <Avatar name={student.name} size={80} />
          <Text className="text-white text-xl font-bold mt-3">{student.name}</Text>
          <Text className="text-gray-400 text-sm mt-1">{student.email}</Text>

          <View className={`mt-3 px-3 py-1 rounded-full ${student.is_active ? 'bg-brand-green/20' : 'bg-gray-700'}`}>
            <Text className={`text-sm font-medium ${student.is_active ? 'text-brand-green' : 'text-gray-400'}`}>
              {student.is_active ? 'Ativo' : 'Inativo'}
            </Text>
          </View>
        </View>

        {/* Informações */}
        <View className="px-6">
          <View className="bg-brand-dark-2 rounded-2xl p-5 mb-4">
            <Text className="text-xs font-semibold text-gray-500 uppercase mb-3">Informações</Text>

            {[
              { label: 'Telefone', value: student.phone ?? '—' },
              { label: 'Nascimento', value: age ? `${formatDate(student.birth_date)} (${age} anos)` : formatDate(student.birth_date) },
              { label: 'Objetivo', value: student.goal ?? '—' },
            ].map(({ label, value }) => (
              <View key={label} className="mb-3">
                <Text className="text-xs text-gray-500 mb-0.5">{label}</Text>
                <Text className="text-white text-sm">{value}</Text>
              </View>
            ))}
          </View>

          {/* Ativar / Desativar */}
          <View className="bg-brand-dark-2 rounded-2xl p-5 mb-4">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-white font-medium">Acesso ao app</Text>
                <Text className="text-gray-400 text-xs mt-0.5">
                  {student.is_active ? 'Aluno pode fazer login' : 'Login bloqueado'}
                </Text>
              </View>
              <Switch
                value={student.is_active}
                onValueChange={handleToggleActive}
                disabled={toggling}
                trackColor={{ false: '#374151', true: '#8DC63F' }}
                thumbColor="#fff"
              />
            </View>
          </View>

          {/* Fichas de Treino */}
          <TouchableOpacity
            className="bg-brand-dark-2 border border-brand-dark-3 rounded-2xl py-4 items-center mb-3 flex-row justify-center"
            onPress={() => navigation.navigate('ProgramsList', { student })}
          >
            <Text className="text-white font-bold text-base">Fichas de Treino</Text>
          </TouchableOpacity>

          {/* Histórico */}
          <TouchableOpacity
            className="bg-brand-dark-2 border border-brand-dark-3 rounded-2xl py-4 items-center mb-3 flex-row justify-center"
            onPress={() => navigation.navigate('StudentHistory', { student })}
          >
            <Text className="text-white font-bold text-base">Histórico de Treinos</Text>
          </TouchableOpacity>

          {/* Editar */}
          <TouchableOpacity
            className="bg-brand-green rounded-2xl py-4 items-center"
            onPress={() => navigation.navigate('EditStudent', { student })}
          >
            <Text className="text-brand-dark font-bold text-base">Editar dados</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
