import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, View } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { AuthStack } from './AuthStack';
import { StudentTabs } from './StudentTabs';
import { TrainerTabs } from './TrainerTabs';

export function RootNavigator() {
  const { profile, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <SafeAreaProvider>
        <View className="flex-1 items-center justify-center bg-brand-dark">
          <ActivityIndicator size="large" color="#8DC63F" />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={{ ...DarkTheme, colors: { ...DarkTheme.colors, background: '#1A1D1C' } }}>
        {!profile ? (
          <AuthStack />
        ) : profile.role === 'trainer' ? (
          <TrainerTabs />
        ) : (
          <StudentTabs />
        )}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
