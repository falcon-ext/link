import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StudentProfileScreen } from '../screens/student/StudentProfileScreen';
import { FeedScreen } from '../screens/student/FeedScreen';
import { StudentWorkoutStack } from './StudentWorkoutStack';
import { HistoryScreen } from '../screens/student/HistoryScreen';
import { AssessmentsScreen } from '../screens/student/AssessmentsScreen';
import { StudentTipsScreen } from '../screens/student/StudentTipsScreen';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const Tab = createBottomTabNavigator();

const tabs: {
  name: string;
  label: string;
  component: React.ComponentType;
  icon: IoniconsName;
  iconActive: IoniconsName;
}[] = [
  { name: 'Perfil',       label: 'Perfil',     component: StudentProfileScreen, icon: 'person-outline',  iconActive: 'person'  },
  { name: 'Home',         label: 'Feed',       component: FeedScreen,           icon: 'people-outline',  iconActive: 'people'  },
  { name: 'Workout',      label: 'Treino',     component: StudentWorkoutStack,  icon: 'fitness-outline', iconActive: 'fitness' },
  { name: 'History',      label: 'Histórico',  component: HistoryScreen,        icon: 'time-outline',    iconActive: 'time'    },
  { name: 'Assessments',  label: 'Avaliações', component: AssessmentsScreen,    icon: 'body-outline',    iconActive: 'body'    },
  { name: 'Tips',         label: 'Dicas',      component: StudentTipsScreen,    icon: 'bulb-outline',    iconActive: 'bulb'    },
];

export function StudentTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const tab = tabs.find((t) => t.name === route.name);
        return {
          headerShown: false,
          animation: 'fade',
          sceneStyle: { backgroundColor: '#1A1D1C' },
          tabBarActiveTintColor: '#8DC63F',
          tabBarInactiveTintColor: '#6b7280',
          tabBarStyle: {
            backgroundColor: '#1A1D1C',
            borderTopColor: '#2E3330',
            borderTopWidth: 1,
            height: 56 + insets.bottom,
            paddingBottom: insets.bottom + 6,
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
