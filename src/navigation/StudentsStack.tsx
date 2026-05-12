import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StudentsScreen } from '../screens/trainer/StudentsScreen';
import { StudentDetailScreen } from '../screens/trainer/StudentDetailScreen';
import { EditStudentScreen } from '../screens/trainer/EditStudentScreen';
import { CreateStudentScreen } from '../screens/trainer/CreateStudentScreen';
import { Profile } from '../types';

export type StudentsStackParams = {
  StudentsList: undefined;
  StudentDetail: { student: Profile };
  EditStudent: { student: Profile };
  CreateStudent: undefined;
};

const Stack = createNativeStackNavigator<StudentsStackParams>();

export function StudentsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="StudentsList" component={StudentsScreen} />
      <Stack.Screen name="StudentDetail" component={StudentDetailScreen} />
      <Stack.Screen name="EditStudent" component={EditStudentScreen} />
      <Stack.Screen name="CreateStudent" component={CreateStudentScreen} />
    </Stack.Navigator>
  );
}
