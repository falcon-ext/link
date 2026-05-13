import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StudentsScreen } from '../screens/trainer/StudentsScreen';
import { StudentDetailScreen } from '../screens/trainer/StudentDetailScreen';
import { EditStudentScreen } from '../screens/trainer/EditStudentScreen';
import { CreateStudentScreen } from '../screens/trainer/CreateStudentScreen';
import { StudentHistoryScreen } from '../screens/trainer/StudentHistoryScreen';
import { SessionDetailScreen } from '../screens/trainer/SessionDetailScreen';
import { ExerciseEvolutionScreen } from '../screens/trainer/ExerciseEvolutionScreen';
import { ProgramsScreen } from '../screens/trainer/ProgramsScreen';
import { CreateProgramScreen } from '../screens/trainer/CreateProgramScreen';
import { ProgramDetailScreen } from '../screens/trainer/ProgramDetailScreen';
import { SheetDetailScreen } from '../screens/trainer/SheetDetailScreen';
import { ExercisePickerScreen } from '../screens/trainer/ExercisePickerScreen';
import { AddExerciseParamsScreen } from '../screens/trainer/AddExerciseParamsScreen';
import { EditSheetExerciseScreen } from '../screens/trainer/EditSheetExerciseScreen';
import { TrainerAssessmentListScreen, AssessmentFull, AssessmentPhoto } from '../screens/trainer/TrainerAssessmentListScreen';
import { NewAssessmentScreen } from '../screens/trainer/NewAssessmentScreen';
import { AssessmentDetailScreen } from '../screens/trainer/AssessmentDetailScreen';
import { AssessmentCompareScreen } from '../screens/trainer/AssessmentCompareScreen';
import { Profile, Program, WorkoutSheet, Exercise, SheetExercise } from '../types';

export type StudentsStackParams = {
  StudentsList: undefined;
  StudentDetail: { student: Profile };
  EditStudent: { student: Profile };
  CreateStudent: undefined;
  StudentHistory: { student: Profile };
  SessionDetail: { logId: string; sheetName: string; finishedAt: string; studentId: string };
  ExerciseEvolution: { studentId: string; exerciseId: string; exerciseName: string };
  TrainerAssessmentList: { student: Profile };
  NewAssessment: { student: Profile };
  AssessmentDetail: { assessment: AssessmentFull; student: Profile; photos: AssessmentPhoto[] };
  AssessmentCompare: { studentId: string; assessmentAId: string; assessmentBId: string };
  ProgramsList: { student: Profile };
  CreateProgram: { student: Profile };
  ProgramDetail: { program: Program; student: Profile };
  SheetDetail: { sheet: WorkoutSheet; program: Program };
  ExercisePicker: { sheetId: string; orderIndex: number };
  AddExerciseParams: { sheetId: string; exercise: Exercise; orderIndex: number };
  EditSheetExercise: { sheetExercise: SheetExercise };
};

const Stack = createNativeStackNavigator<StudentsStackParams>();

export function StudentsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="StudentsList" component={StudentsScreen} />
      <Stack.Screen name="StudentDetail" component={StudentDetailScreen} />
      <Stack.Screen name="EditStudent" component={EditStudentScreen} />
      <Stack.Screen name="CreateStudent" component={CreateStudentScreen} />
      <Stack.Screen name="StudentHistory" component={StudentHistoryScreen} />
      <Stack.Screen name="SessionDetail" component={SessionDetailScreen} />
      <Stack.Screen name="ExerciseEvolution" component={ExerciseEvolutionScreen} />
      <Stack.Screen name="TrainerAssessmentList" component={TrainerAssessmentListScreen} />
      <Stack.Screen name="NewAssessment" component={NewAssessmentScreen} />
      <Stack.Screen name="AssessmentDetail" component={AssessmentDetailScreen} />
      <Stack.Screen name="AssessmentCompare" component={AssessmentCompareScreen} />
      <Stack.Screen name="ProgramsList" component={ProgramsScreen} />
      <Stack.Screen name="CreateProgram" component={CreateProgramScreen} />
      <Stack.Screen name="ProgramDetail" component={ProgramDetailScreen} />
      <Stack.Screen name="SheetDetail" component={SheetDetailScreen} />
      <Stack.Screen name="ExercisePicker" component={ExercisePickerScreen} />
      <Stack.Screen name="AddExerciseParams" component={AddExerciseParamsScreen} />
      <Stack.Screen name="EditSheetExercise" component={EditSheetExerciseScreen} />
    </Stack.Navigator>
  );
}
