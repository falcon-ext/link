import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, View } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { AuthStack } from './AuthStack';
import { StudentTabs } from './StudentTabs';
import { TrainerTabs } from './TrainerTabs';

export function RootNavigator() {
  const { profile, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!profile ? (
        <AuthStack />
      ) : profile.role === 'trainer' ? (
        <TrainerTabs />
      ) : (
        <StudentTabs />
      )}
    </NavigationContainer>
  );
}
