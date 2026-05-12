import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { StudentWorkoutStackParams } from '../../navigation/StudentWorkoutStack';

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
  const { sheetName, duration, setsCompleted, exercisesTotal } = route.params;

  return (
    <SafeAreaView className="flex-1 bg-brand-dark items-center justify-center px-6">
      <View className="w-24 h-24 rounded-full bg-brand-green/20 items-center justify-center mb-6">
        <Ionicons name="trophy" size={48} color="#8DC63F" />
      </View>

      <Text className="text-white text-3xl font-bold mb-2">Treino concluído!</Text>
      <Text className="text-gray-400 text-base mb-10">{sheetName}</Text>

      <View className="w-full bg-brand-dark-2 rounded-2xl p-5 mb-8">
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

      <TouchableOpacity
        className="bg-brand-green rounded-xl py-4 items-center w-full"
        onPress={() => navigation.navigate('WorkoutPick')}
      >
        <Text className="text-brand-dark font-bold text-base">Voltar ao início</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
