import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ExercisesScreen } from '../screens/trainer/ExercisesScreen';
import { ExerciseDetailScreen } from '../screens/trainer/ExerciseDetailScreen';
import { CreateExerciseScreen } from '../screens/trainer/CreateExerciseScreen';
import { Exercise } from '../types';

export type ExercisesStackParams = {
  ExercisesList: undefined;
  ExerciseDetail: { exercise: Exercise };
  CreateExercise: undefined;
  EditExercise: { exercise: Exercise };
};

const Stack = createNativeStackNavigator<ExercisesStackParams>();

export function ExercisesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="ExercisesList" component={ExercisesScreen} />
      <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} />
      <Stack.Screen name="CreateExercise" component={CreateExerciseScreen} />
      <Stack.Screen name="EditExercise" component={CreateExerciseScreen} />
    </Stack.Navigator>
  );
}
