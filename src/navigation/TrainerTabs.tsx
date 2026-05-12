import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TrainerDashboardScreen } from '../screens/trainer/TrainerDashboardScreen';
import { StudentsScreen } from '../screens/trainer/StudentsScreen';
import { ExercisesScreen } from '../screens/trainer/ExercisesScreen';
import { TipsScreen } from '../screens/trainer/TipsScreen';
import { SettingsScreen } from '../screens/trainer/SettingsScreen';

const Tab = createBottomTabNavigator();

export function TrainerTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Dashboard" component={TrainerDashboardScreen} options={{ title: 'Início' }} />
      <Tab.Screen name="Students" component={StudentsScreen} options={{ title: 'Alunos' }} />
      <Tab.Screen name="Exercises" component={ExercisesScreen} options={{ title: 'Exercícios' }} />
      <Tab.Screen name="Tips" component={TipsScreen} options={{ title: 'Dicas' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'Config' }} />
    </Tab.Navigator>
  );
}
