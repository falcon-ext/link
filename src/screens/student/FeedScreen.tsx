import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  Image, Alert, Modal, Switch, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { uploadToCloudinary } from '../../lib/cloudinary';
import { getLevelInfo, getLevelTitle } from '../../lib/gamification';
import { scheduleWorkoutReminder, cancelWorkoutReminder } from '../../lib/notifications';

type FeedPost = {
  id: string;
  student_id: string;
  student_name: string;
  student_avatar_url: string | null;
  sheet_name: string | null;
  photo_url: string | null;
  created_at: string;
};

type LikeState = { count: number; liked: boolean };

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function FeedScreen() {
  const { profile } = useAuthStore();
  const navigation = useNavigation<any>();

  const [loading, setLoading]   = useState(true);
  const [posts, setPosts]       = useState<FeedPost[]>([]);
  const [likeMap, setLikeMap]   = useState<Record<string, LikeState>>({});
  const [workoutCount, setWorkoutCount] = useState(0);
  const [uploading, setUploading]       = useState<string | null>(null);

  const [reminderModal, setReminderModal]     = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderHour, setReminderHour]       = useState('07');
  const [reminderMinute, setReminderMinute]   = useState('00');
  const [savingReminder, setSavingReminder]   = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadFeed();
    }, [])
  );

  async function loadFeed() {
    setLoading(true);

    const { count } = await supabase
      .from('workout_logs')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', profile!.id)
      .not('finished_at', 'is', null);
    setWorkoutCount(count ?? 0);

    const { data: postData } = await supabase
      .from('feed_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30);

    const fetchedPosts = (postData ?? []) as FeedPost[];
    setPosts(fetchedPosts);

    if (fetchedPosts.length > 0) {
      const postIds = fetchedPosts.map((p) => p.id);
      const { data: likesData } = await supabase
        .from('post_likes')
        .select('post_id, student_id')
        .in('post_id', postIds);

      const likes = (likesData ?? []) as { post_id: string; student_id: string }[];
      const map: Record<string, LikeState> = {};
      for (const postId of postIds) {
        const postLikes = likes.filter((l) => l.post_id === postId);
        map[postId] = {
          count: postLikes.length,
          liked: postLikes.some((l) => l.student_id === profile!.id),
        };
      }
      setLikeMap(map);
    }

    setLoading(false);
  }

  async function toggleLike(postId: string) {
    const current = likeMap[postId] ?? { count: 0, liked: false };
    setLikeMap((prev) => ({
      ...prev,
      [postId]: { count: current.liked ? current.count - 1 : current.count + 1, liked: !current.liked },
    }));

    if (current.liked) {
      await supabase.from('post_likes').delete()
        .eq('post_id', postId).eq('student_id', profile!.id);
    } else {
      await supabase.from('post_likes').insert({ post_id: postId, student_id: profile!.id });
    }
  }

  async function deletePost(postId: string) {
    Alert.alert(
      'Excluir post',
      'Tem certeza que quer remover este check-in do feed?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            await supabase.from('feed_posts').delete().eq('id', postId);
            setPosts((prev) => prev.filter((p) => p.id !== postId));
            setLikeMap((prev) => {
              const next = { ...prev };
              delete next[postId];
              return next;
            });
          },
        },
      ]
    );
  }

  async function addPhoto(postId: string) {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (result.canceled || !result.assets[0]) return;

    setUploading(postId);
    try {
      const url = await uploadToCloudinary(result.assets[0].uri, 'image');
      await supabase.from('feed_posts').update({ photo_url: url }).eq('id', postId);
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, photo_url: url } : p))
      );
    } catch {
      Alert.alert('Erro', 'Não foi possível enviar a foto.');
    } finally {
      setUploading(null);
    }
  }

  async function openReminderModal() {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const daily = scheduled.find(
      (n) => (n.trigger as any)?.type === 'daily' || (n.trigger as any)?.repeats === true
    );
    if (daily) {
      const trigger = daily.trigger as any;
      setReminderEnabled(true);
      setReminderHour(String(trigger.hour ?? 7).padStart(2, '0'));
      setReminderMinute(String(trigger.minute ?? 0).padStart(2, '0'));
    } else {
      setReminderEnabled(false);
      setReminderHour('07');
      setReminderMinute('00');
    }
    setReminderModal(true);
  }

  async function saveReminder() {
    const h = parseInt(reminderHour, 10);
    const m = parseInt(reminderMinute, 10);
    if (reminderEnabled && (isNaN(h) || h < 0 || h > 23 || isNaN(m) || m < 0 || m > 59)) {
      Alert.alert('Horário inválido', 'Digite um horário válido (0–23 para hora, 0–59 para minuto).');
      return;
    }
    setSavingReminder(true);
    if (reminderEnabled) {
      await scheduleWorkoutReminder(h, m);
    } else {
      await cancelWorkoutReminder();
    }
    setSavingReminder(false);
    setReminderModal(false);
    Alert.alert(
      reminderEnabled ? 'Lembrete ativado! 💪' : 'Lembrete desativado',
      reminderEnabled
        ? `Você receberá um lembrete todos os dias às ${reminderHour}:${reminderMinute}.`
        : 'O lembrete de treino foi cancelado.',
    );
  }

  // Checkins de hoje — um por aluno (deduplicado)
  const todayCheckins = Object.values(
    posts
      .filter((p) => isToday(p.created_at))
      .reduce<Record<string, FeedPost>>((acc, p) => {
        if (!acc[p.student_id]) acc[p.student_id] = p;
        return acc;
      }, {})
  );

  const { level, currentXP, nextLevelXP } = getLevelInfo(workoutCount);
  const xpProgress = nextLevelXP > 0 ? (currentXP / nextLevelXP) * 100 : 100;

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-brand-dark items-center justify-center">
        <ActivityIndicator color="#8DC63F" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-dark">
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="px-6 pt-8 pb-4 flex-row items-center justify-between">
          <Text className="text-white text-2xl font-bold">Feed</Text>
          <TouchableOpacity onPress={openReminderModal} className="p-1">
            <Ionicons name="notifications-outline" size={22} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Level bar */}
        <TouchableOpacity
          className="mx-6 bg-brand-dark-2 rounded-2xl px-4 py-3 mb-5"
          onPress={() => navigation.navigate('Perfil')}
        >
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-white text-sm font-semibold">
              {getLevelTitle(level)} · Nível {level}
            </Text>
            <Text className="text-brand-green text-xs">{currentXP}/{nextLevelXP} XP →</Text>
          </View>
          <View className="h-1.5 bg-brand-dark-3 rounded-full overflow-hidden">
            <View
              className="h-full bg-brand-green rounded-full"
              style={{ width: `${xpProgress}%` }}
            />
          </View>
        </TouchableOpacity>

        {/* Quem treinou hoje */}
        <View className="mb-5">
          <Text className="text-xs font-semibold text-gray-500 uppercase px-6 mb-3">
            Quem treinou hoje
          </Text>
          {todayCheckins.length === 0 ? (
            <Text className="text-gray-600 text-sm px-6">
              Seja o primeiro a treinar hoje! 💪
            </Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24 }}
            >
              {todayCheckins.map((checkin) => (
                <View key={checkin.student_id} className="items-center mr-4">
                  <View
                    className="w-14 h-14 rounded-full bg-brand-green/20 items-center justify-center mb-1"
                    style={{ borderWidth: 2, borderColor: '#8DC63F' }}
                  >
                    {checkin.student_avatar_url ? (
                      <Image
                        source={{ uri: checkin.student_avatar_url }}
                        style={{ width: 56, height: 56, borderRadius: 28 }}
                      />
                    ) : (
                      <Text className="text-brand-green text-xl font-bold">
                        {checkin.student_name.charAt(0).toUpperCase()}
                      </Text>
                    )}
                  </View>
                  <Text
                    className="text-gray-400 text-xs"
                    numberOfLines={1}
                    style={{ maxWidth: 56 }}
                  >
                    {checkin.student_name.split(' ')[0]}
                  </Text>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Feed */}
        <Text className="text-xs font-semibold text-gray-500 uppercase px-6 mb-3">
          Atividade recente
        </Text>

        {posts.length === 0 ? (
          <View className="items-center mt-6 px-8">
            <Ionicons name="people-outline" size={48} color="#374151" />
            <Text className="text-gray-400 text-base font-semibold mt-3 text-center">
              Nenhuma atividade ainda
            </Text>
            <Text className="text-gray-600 text-sm mt-1 text-center">
              Os treinos aparecerão aqui quando forem concluídos.
            </Text>
          </View>
        ) : (
          posts.map((post) => {
            const isMe = post.student_id === profile!.id;
            const likes = likeMap[post.id] ?? { count: 0, liked: false };
            const isUploading = uploading === post.id;

            return (
              <View key={post.id} className="bg-brand-dark-2 mx-6 rounded-2xl mb-4 overflow-hidden">
                {/* Header do post */}
                <View className="flex-row items-center p-4 pb-3">
                  <View className="w-10 h-10 rounded-full bg-brand-green/20 items-center justify-center mr-3">
                    {post.student_avatar_url ? (
                      <Image
                        source={{ uri: post.student_avatar_url }}
                        style={{ width: 40, height: 40, borderRadius: 20 }}
                      />
                    ) : (
                      <Text className="text-brand-green font-bold text-base">
                        {post.student_name.charAt(0).toUpperCase()}
                      </Text>
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-semibold text-sm">
                      {post.student_name}
                    </Text>
                    <Text className="text-gray-500 text-xs">
                      {post.sheet_name ? `Treinou · ${post.sheet_name}` : 'Treinou'}
                      {' · '}
                      {timeAgo(post.created_at)}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    {isMe && (
                      <TouchableOpacity onPress={() => deletePost(post.id)} hitSlop={8}>
                        <Ionicons name="trash-outline" size={17} color="#6b7280" />
                      </TouchableOpacity>
                    )}
                    <View className="w-6 h-6 rounded-full bg-brand-green/20 items-center justify-center">
                      <Ionicons name="checkmark" size={14} color="#8DC63F" />
                    </View>
                  </View>
                </View>

                {/* Foto */}
                {post.photo_url && (
                  <Image
                    source={{ uri: post.photo_url }}
                    style={{ width: '100%', height: 220 }}
                    resizeMode="cover"
                  />
                )}

                {/* Footer: like + adicionar foto */}
                <View className="flex-row items-center px-4 py-3">
                  <TouchableOpacity
                    onPress={() => toggleLike(post.id)}
                    className="flex-row items-center mr-5"
                  >
                    <Ionicons
                      name={likes.liked ? 'heart' : 'heart-outline'}
                      size={22}
                      color={likes.liked ? '#ef4444' : '#6b7280'}
                    />
                    {likes.count > 0 && (
                      <Text className="text-gray-400 text-sm ml-1">{likes.count}</Text>
                    )}
                  </TouchableOpacity>

                  {isMe && !post.photo_url && (
                    <TouchableOpacity
                      onPress={() => addPhoto(post.id)}
                      disabled={isUploading}
                      className="flex-row items-center"
                    >
                      {isUploading ? (
                        <ActivityIndicator size="small" color="#8DC63F" />
                      ) : (
                        <>
                          <Ionicons name="camera-outline" size={18} color="#8DC63F" />
                          <Text className="text-brand-green text-xs ml-1 font-semibold">
                            Adicionar foto
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Reminder modal */}
      <Modal visible={reminderModal} animationType="slide" transparent>
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View className="bg-brand-dark rounded-t-3xl px-6 pt-6 pb-10">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-white text-xl font-bold">Lembrete de treino</Text>
                <TouchableOpacity onPress={() => setReminderModal(false)}>
                  <Ionicons name="close" size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>

              <View className="bg-brand-dark-2 rounded-2xl p-4 flex-row items-center justify-between mb-5">
                <View>
                  <Text className="text-white font-medium">Ativar lembrete diário</Text>
                  <Text className="text-gray-500 text-xs mt-0.5">
                    Receba um aviso no horário escolhido
                  </Text>
                </View>
                <Switch
                  value={reminderEnabled}
                  onValueChange={setReminderEnabled}
                  trackColor={{ false: '#374151', true: '#8DC63F' }}
                  thumbColor="#fff"
                />
              </View>

              {reminderEnabled && (
                <View className="mb-6">
                  <Text className="text-sm font-medium text-gray-400 mb-3">Horário</Text>
                  <View className="flex-row items-center justify-center">
                    <TextInput
                      className="bg-brand-dark-2 border border-brand-dark-3 rounded-xl text-white text-3xl font-bold text-center"
                      style={{ width: 80, paddingVertical: 12 }}
                      keyboardType="number-pad"
                      maxLength={2}
                      value={reminderHour}
                      onChangeText={setReminderHour}
                      placeholder="07"
                      placeholderTextColor="#4B5563"
                    />
                    <Text className="text-white text-3xl font-bold mx-3">:</Text>
                    <TextInput
                      className="bg-brand-dark-2 border border-brand-dark-3 rounded-xl text-white text-3xl font-bold text-center"
                      style={{ width: 80, paddingVertical: 12 }}
                      keyboardType="number-pad"
                      maxLength={2}
                      value={reminderMinute}
                      onChangeText={setReminderMinute}
                      placeholder="00"
                      placeholderTextColor="#4B5563"
                    />
                  </View>
                </View>
              )}

              <TouchableOpacity
                className={`rounded-xl py-4 items-center ${savingReminder ? 'bg-brand-green-dark' : 'bg-brand-green'}`}
                onPress={saveReminder}
                disabled={savingReminder}
              >
                {savingReminder ? (
                  <ActivityIndicator color="#1A1D1C" />
                ) : (
                  <Text className="text-brand-dark font-bold text-base">Salvar</Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
