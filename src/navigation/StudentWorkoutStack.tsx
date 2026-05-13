import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WorkoutPickScreen } from '../screens/student/WorkoutPickScreen';
import { WorkoutExecutionScreen } from '../screens/student/WorkoutExecutionScreen';
import { WorkoutSummaryScreen } from '../screens/student/WorkoutSummaryScreen';
import { WorkoutViewScreen } from '../screens/student/WorkoutViewScreen';
import { WorkoutSheet, Program } from '../types';

export type StudentWorkoutStackParams = {
  WorkoutPick: undefined;
  WorkoutExecution: { sheet: WorkoutSheet; program: Program };
  WorkoutSummary: {
    sheetName: string;
    duration: number;
    setsCompleted: number;
    exercisesTotal: number;
    postId?: string;
  };
  WorkoutView: { sheet: WorkoutSheet };
};

const Stack = createNativeStackNavigator<StudentWorkoutStackParams>();

export function StudentWorkoutStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: '#1A1D1C' } }}>
      <Stack.Screen name="WorkoutPick" component={WorkoutPickScreen} />
      <Stack.Screen name="WorkoutExecution" component={WorkoutExecutionScreen} />
      <Stack.Screen name="WorkoutSummary" component={WorkoutSummaryScreen} />
      <Stack.Screen name="WorkoutView" component={WorkoutViewScreen} />
    </Stack.Navigator>
  );
}
