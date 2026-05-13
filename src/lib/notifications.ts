import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from './supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerPushToken(userId: string) {
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    await supabase.from('profiles').update({ push_token: token }).eq('id', userId);
  } catch {
    // Expo Go não suporta push tokens remotos; ignorado silenciosamente
  }
}

export async function sendPush(token: string, title: string, body: string) {
  if (!token) return;
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to: token, title, body, sound: 'default' }),
  });
}

export async function sendPushToStudent(studentId: string, title: string, body: string) {
  const { data } = await supabase
    .from('profiles')
    .select('push_token')
    .eq('id', studentId)
    .single();
  const token = (data as any)?.push_token;
  if (token) await sendPush(token, title, body);
}

export async function sendPushToAllStudents(title: string, body: string) {
  const { data } = await supabase
    .from('profiles')
    .select('push_token')
    .eq('role', 'student')
    .eq('is_active', true)
    .not('push_token', 'is', null);
  for (const row of (data ?? []) as { push_token: string }[]) {
    await sendPush(row.push_token, title, body);
  }
}

// Lembrete de treino local (agendado no dispositivo do aluno)
export async function scheduleWorkoutReminder(hour: number, minute: number) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (hour < 0) return; // -1 = desativar

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Hora de treinar! 💪',
      body: 'Seu treino te espera. Bora!',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

export async function cancelWorkoutReminder() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
