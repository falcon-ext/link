import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TrainerProfileScreen } from '../screens/trainer/TrainerProfileScreen';
import { TrainerFeedScreen } from '../screens/trainer/TrainerFeedScreen';

export type TrainerProfileStackParams = {
  TrainerProfile: undefined;
  TrainerFeed: undefined;
};

const Stack = createNativeStackNavigator<TrainerProfileStackParams>();

export function TrainerProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: '#1A1D1C' } }}>
      <Stack.Screen name="TrainerProfile" component={TrainerProfileScreen} />
      <Stack.Screen name="TrainerFeed"    component={TrainerFeedScreen} />
    </Stack.Navigator>
  );
}
