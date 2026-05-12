import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StudentsScreen } from '../screens/trainer/StudentsScreen';
import { StudentDetailScreen } from '../screens/trainer/StudentDetailScreen';
import { EditStudentScreen } from '../screens/trainer/EditStudentScreen';
import { CreateStudentScreen } from '../screens/trainer/CreateStudentScreen';
import { ProgramsScreen } from '../screens/trainer/ProgramsScreen';
import { CreateProgramScreen } from '../screens/trainer/CreateProgramScreen';
import { ProgramDetailScreen } from '../screens/trainer/ProgramDetailScreen';
import { SheetDetailScreen } from '../screens/trainer/SheetDetailScreen';
import { ExercisePickerScreen } from '../screens/trainer/ExercisePickerScreen';
import { AddExerciseParamsScreen } from '../screens/trainer/AddExerciseParamsScreen';
import { Profile, Program, WorkoutSheet, Exercise } from '../types';

export type StudentsStackParams = {
  StudentsList: undefined;
  StudentDetail: { student: Profile };
  EditStudent: { student: Profile };
  CreateStudent: undefined;
  ProgramsList: { student: Profile };
  CreateProgram: { student: Profile };
  ProgramDetail: { program: Program; student: Profile };
  SheetDetail: { sheet: WorkoutSheet; program: Program };
  ExercisePicker: { sheetId: string; orderIndex: number };
  AddExerciseParams: { sheetId: string; exercise: Exercise; orderIndex: number };
};

const Stack = createNativeStackNavigator<StudentsStackParams>();

export function StudentsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="StudentsList" component={StudentsScreen} />
      <Stack.Screen name="StudentDetail" component={StudentDetailScreen} />
      <Stack.Screen name="EditStudent" component={EditStudentScreen} />
      <Stack.Screen name="CreateStudent" component={CreateStudentScreen} />
      <Stack.Screen name="ProgramsList" component={ProgramsScreen} />
      <Stack.Screen name="CreateProgram" component={CreateProgramScreen} />
      <Stack.Screen name="ProgramDetail" component={ProgramDetailScreen} />
      <Stack.Screen name="SheetDetail" component={SheetDetailScreen} />
      <Stack.Screen name="ExercisePicker" component={ExercisePickerScreen} />
      <Stack.Screen name="AddExerciseParams" component={AddExerciseParamsScreen} />
    </Stack.Navigator>
  );
}
