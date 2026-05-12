import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { TrainerDashboardScreen } from '../screens/trainer/TrainerDashboardScreen';
import { StudentsScreen } from '../screens/trainer/StudentsScreen';
import { ExercisesScreen } from '../screens/trainer/ExercisesScreen';
import { TipsScreen } from '../screens/trainer/TipsScreen';
import { SettingsScreen } from '../screens/trainer/SettingsScreen';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const Tab = createBottomTabNavigator();

const tabs: {
  name: string;
  label: string;
  component: React.ComponentType;
  icon: IoniconsName;
  iconActive: IoniconsName;
}[] = [
  { name: 'Dashboard', label: 'Início',     component: TrainerDashboardScreen, icon: 'home-outline',    iconActive: 'home' },
  { name: 'Students',  label: 'Alunos',     component: StudentsScreen,         icon: 'people-outline',  iconActive: 'people' },
  { name: 'Exercises', label: 'Exercícios', component: ExercisesScreen,        icon: 'barbell-outline', iconActive: 'barbell' },
  { name: 'Tips',      label: 'Dicas',      component: TipsScreen,             icon: 'bulb-outline',    iconActive: 'bulb' },
  { name: 'Settings',  label: 'Config',     component: SettingsScreen,         icon: 'settings-outline',iconActive: 'settings' },
];

export function TrainerTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const tab = tabs.find((t) => t.name === route.name);
        return {
          headerShown: false,
          tabBarActiveTintColor: '#8DC63F',
          tabBarInactiveTintColor: '#6b7280',
          tabBarStyle: {
            backgroundColor: '#1A1D1C',
            borderTopColor: '#2E3330',
            borderTopWidth: 1,
            height: 60,
            paddingBottom: 8,
            paddingTop: 6,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '500',
          },
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? (tab?.iconActive ?? 'home') : (tab?.icon ?? 'home-outline')}
              size={size}
              color={color}
            />
          ),
        };
      }}
    >
      {tabs.map((tab) => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={tab.component}
          options={{ title: tab.label }}
        />
      ))}
    </Tab.Navigator>
  );
}
