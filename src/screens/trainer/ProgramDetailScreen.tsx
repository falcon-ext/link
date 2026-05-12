import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator,
  TextInput, Alert, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { StudentsStackParams } from '../../navigation/StudentsStack';
import { supabase } from '../../lib/supabase';
import { WorkoutSheet } from '../../types';

type Props = {
  navigation: NativeStackNavigationProp<StudentsStackParams, 'ProgramDetail'>;
  route: RouteProp<StudentsStackParams, 'ProgramDetail'>;
};

export function ProgramDetailScreen({ navigation, route }: Props) {
  const { student } = route.params;
  const [program, setProgram] = useState(route.params.program);
  const [sheets, setSheets] = useState<WorkoutSheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSheetName, setNewSheetName] = useState('');
  const [addingSheet, setAddingSheet] = useState(false);
  const [showInput, setShowInput] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadSheets();
    }, [program.id])
  );

  async function loadSheets() {
    setLoading(true);
    const { data } = await supabase
      .from('workout_sheets')
      .select('*')
      .eq('program_id', program.id)
      .order('order_index');
    setSheets((data as WorkoutSheet[]) ?? []);
    setLoading(false);
  }

  async function handleAddSheet() {
    if (!newSheetName.trim()) return;
    setAddingSheet(true);
    await supabase.from('workout_sheets').insert({
      program_id: program.id,
      name: newSheetName.trim(),
      order_index: sheets.length,
    });
    setNewSheetName('');
    setShowInput(false);
    setAddingSheet(false);
    loadSheets();
  }

  async function handleDeleteSheet(sheet: WorkoutSheet) {
    Alert.alert('Excluir treino', `Excluir "${sheet.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('workout_sheets').delete().eq('id', sheet.id);
          loadSheets();
        },
      },
    ]);
  }

  async function handleToggleActive() {
    const next = !program.is_active;
    await supabase.from('programs').update({ is_active: next }).eq('id', program.id);
    setProgram((p) => ({ ...p, is_active: next }));
  }

  async function handleDeleteProgram() {
    Alert.alert(
      'Excluir ficha',
      `Deseja excluir "${program.name}"? Todos os treinos serão perdidos.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            await supabase.from('programs').delete().eq('id', program.id);
            navigation.goBack();
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-dark">
      <View className="px-6 pt-4 pb-3">
        <TouchableOpacity className="mb-4" onPress={() => navigation.goBack()}>
          <Text className="text-brand-green text-sm">← Voltar</Text>
        </TouchableOpacity>
        <View className="flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-white flex-1 mr-2">{program.name}</Text>
          <View className={`px-3 py-1 rounded-full ${program.is_active ? 'bg-brand-green/20' : 'bg-gray-700'}`}>
            <Text className={`text-xs font-medium ${program.is_active ? 'text-brand-green' : 'text-gray-400'}`}>
              {program.is_active ? 'Ativa' : 'Inativa'}
            </Text>
          </View>
        </View>
        <Text className="text-gray-400 text-sm mt-1">{student.name}</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#8DC63F" />
        </View>
      ) : (
        <FlatList
          data={sheets}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
          ListHeaderComponent={
            sheets.length > 0 ? (
              <Text className="text-xs font-semibold text-gray-500 uppercase mb-3 mt-2">Treinos</Text>
            ) : null
          }
          renderItem={({ item, index }) => (
            <TouchableOpacity
              className="bg-brand-dark-2 rounded-2xl p-4 mb-3 flex-row items-center"
              onPress={() => navigation.navigate('SheetDetail', { sheet: item, program })}
            >
              <View className="w-8 h-8 rounded-full bg-brand-green/20 items-center justify-center mr-3">
                <Text className="text-brand-green text-sm font-bold">
                  {String.fromCharCode(65 + index)}
                </Text>
              </View>
              <Text className="text-white font-semibold flex-1">{item.name}</Text>
              <TouchableOpacity
                onPress={() => handleDeleteSheet(item)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                className="mr-2"
              >
                <Ionicons name="trash-outline" size={18} color="#6b7280" />
              </TouchableOpacity>
              <Ionicons name="chevron-forward" size={18} color="#6b7280" />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            !showInput ? (
              <View className="items-center mt-8 mb-4">
                <Ionicons name="list-outline" size={40} color="#374151" />
                <Text className="text-gray-500 text-center mt-3">Nenhum treino ainda.</Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            <View>
              {showInput ? (
                <View className="bg-brand-dark-2 rounded-2xl p-4 mb-3">
                  <TextInput
                    className="text-white text-base mb-3 border-b border-brand-dark-3 pb-2"
                    placeholder="Ex: Ficha A — Peito e Tríceps"
                    placeholderTextColor="#6b7280"
                    value={newSheetName}
                    onChangeText={setNewSheetName}
                    autoFocus
                    autoCapitalize="sentences"
                  />
                  <View className="flex-row gap-3">
                    <TouchableOpacity
                      className="flex-1 py-2 rounded-xl bg-brand-dark-3 items-center"
                      onPress={() => { setShowInput(false); setNewSheetName(''); }}
                    >
                      <Text className="text-gray-400 font-medium">Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="flex-1 py-2 rounded-xl bg-brand-green items-center"
                      onPress={handleAddSheet}
                      disabled={addingSheet}
                    >
                      {addingSheet ? (
                        <ActivityIndicator color="#1A1D1C" size="small" />
                      ) : (
                        <Text className="text-brand-dark font-bold">Adicionar</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  className="border-2 border-dashed border-brand-dark-3 rounded-2xl py-4 items-center mb-6"
                  onPress={() => setShowInput(true)}
                >
                  <Ionicons name="add-circle-outline" size={24} color="#8DC63F" />
                  <Text className="text-brand-green text-sm mt-1">Adicionar treino</Text>
                </TouchableOpacity>
              )}

              <View className="bg-brand-dark-2 rounded-2xl p-5 mb-4 flex-row items-center justify-between">
                <View>
                  <Text className="text-white font-medium">Ficha ativa</Text>
                  <Text className="text-gray-400 text-xs mt-0.5">Aluno verá esta ficha no app</Text>
                </View>
                <Switch
                  value={program.is_active}
                  onValueChange={handleToggleActive}
                  trackColor={{ false: '#374151', true: '#8DC63F' }}
                  thumbColor="#fff"
                />
              </View>

              <TouchableOpacity
                className="bg-red-900/30 border border-red-900 rounded-2xl py-3 items-center"
                onPress={handleDeleteProgram}
              >
                <Text className="text-red-400 font-semibold">Excluir ficha</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
