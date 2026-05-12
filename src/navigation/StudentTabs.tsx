import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StudentHomeScreen } from '../screens/student/StudentHomeScreen';
import { WorkoutScreen } from '../screens/student/WorkoutScreen';
import { HistoryScreen } from '../screens/student/HistoryScreen';
import { AssessmentsScreen } from '../screens/student/AssessmentsScreen';
import { StudentTipsScreen } from '../screens/student/StudentTipsScreen';

const Tab = createBottomTabNavigator();

export function StudentTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={StudentHomeScreen} options={{ title: 'Início' }} />
      <Tab.Screen name="Workout" component={WorkoutScreen} options={{ title: 'Treino' }} />
      <Tab.Screen name="History" component={HistoryScreen} options={{ title: 'Histórico' }} />
      <Tab.Screen name="Assessments" component={AssessmentsScreen} options={{ title: 'Avaliações' }} />
      <Tab.Screen name="Tips" component={StudentTipsScreen} options={{ title: 'Dicas' }} />
    </Tab.Navigator>
  );
}
