import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  Image, Alert, Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { uploadToCloudinary } from '../../lib/cloudinary';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TrainerProfileStackParams } from '../../navigation/TrainerProfileStack';

type Props = {
  navigation: NativeStackNavigationProp<TrainerProfileStackParams, 'TrainerFeed'>;
};

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

export function TrainerFeedScreen({ navigation }: Props) {
  const { profile } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [posts, setPosts]     = useState<FeedPost[]>([]);
  const [likeMap, setLikeMap] = useState<Record<string, LikeState>>({});

  // Post modal
  const [postModal, setPostModal]                   = useState(false);
  const [postCaption, setPostCaption]               = useState('');
  const [postPhotoUrl, setPostPhotoUrl]             = useState<string | null>(null);
  const [uploadingPostPhoto, setUploadingPostPhoto] = useState(false);
  const [savingPost, setSavingPost]                 = useState(false);

  useFocusEffect(useCallback(() => { loadFeed(); }, []));

  async function loadFeed() {
    setLoading(true);
    const { data: postData } = await supabase
      .from('feed_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

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
      await supabase.from('post_likes').delete().eq('post_id', postId).eq('student_id', profile!.id);
    } else {
      await supabase.from('post_likes').insert({ post_id: postId, student_id: profile!.id });
    }
  }

  function confirmDelete(postId: string, authorName: string) {
    Alert.alert(
      'Excluir post',
      `Remover esta publicação de ${authorName} do feed?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir', style: 'destructive',
          onPress: async () => {
            await supabase.from('feed_posts').delete().eq('id', postId);
            setPosts((prev) => prev.filter((p) => p.id !== postId));
            setLikeMap((prev) => { const next = { ...prev }; delete next[postId]; return next; });
          },
        },
      ],
    );
  }

  async function pickPostPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (result.canceled || !result.assets[0]) return;

    setUploadingPostPhoto(true);
    try {
      const url = await uploadToCloudinary(result.assets[0].uri, 'image');
      setPostPhotoUrl(url);
    } catch {
      Alert.alert('Erro', 'Não foi possível enviar a foto.');
    } finally {
      setUploadingPostPhoto(false);
    }
  }

  async function handlePost() {
    if (!postCaption.trim() && !postPhotoUrl) {
      Alert.alert('Atenção', 'Escreva uma mensagem ou adicione uma foto.');
      return;
    }
    setSavingPost(true);
    const { data: post, error } = await supabase
      .from('feed_posts')
      .insert({
        student_id:         profile!.id,
        student_name:       profile!.name,
        student_avatar_url: profile!.avatar_url ?? null,
        sheet_name:         postCaption.trim() || null,
        photo_url:          postPhotoUrl,
      })
      .select()
      .single();
    setSavingPost(false);

    if (error) {
      Alert.alert('Erro', 'Não foi possível publicar no feed.');
      return;
    }
    setPosts((prev) => [post as FeedPost, ...prev]);
    setLikeMap((prev) => ({ ...prev, [(post as FeedPost).id]: { count: 0, liked: false } }));
    setPostModal(false);
    setPostCaption('');
    setPostPhotoUrl(null);
  }

  const todayCheckins = Object.values(
    posts
      .filter((p) => isToday(p.created_at))
      .reduce<Record<string, FeedPost>>((acc, p) => {
        if (!acc[p.student_id]) acc[p.student_id] = p;
        return acc;
      }, {})
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-brand-dark items-center justify-center">
        <ActivityIndicator color="#8DC63F" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-dark">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View className="px-6 pt-4 pb-4 flex-row items-center justify-between">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text className="text-brand-green text-sm">← Voltar</Text>
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">Feed dos alunos</Text>
          <TouchableOpacity onPress={() => setPostModal(true)}>
            <Ionicons name="add-circle-outline" size={26} color="#8DC63F" />
          </TouchableOpacity>
        </View>

        {/* Quem treinou hoje */}
        <View className="mb-5">
          <Text className="text-xs font-semibold text-gray-500 uppercase px-6 mb-3">
            Quem treinou hoje
          </Text>
          {todayCheckins.length === 0 ? (
            <Text className="text-gray-600 text-sm px-6">Nenhum aluno treinou ainda hoje.</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24 }}>
              {todayCheckins.map((checkin) => (
                <View key={checkin.student_id} className="items-center mr-4">
                  <View
                    className="w-14 h-14 rounded-full bg-brand-green/20 items-center justify-center mb-1"
                    style={{ borderWidth: 2, borderColor: '#8DC63F' }}
                  >
                    {checkin.student_avatar_url ? (
                      <Image source={{ uri: checkin.student_avatar_url }} style={{ width: 56, height: 56, borderRadius: 28 }} />
                    ) : (
                      <Text className="text-brand-green text-xl font-bold">
                        {checkin.student_name.charAt(0).toUpperCase()}
                      </Text>
                    )}
                  </View>
                  <Text className="text-gray-400 text-xs" numberOfLines={1} style={{ maxWidth: 56 }}>
                    {checkin.student_name.split(' ')[0]}
                  </Text>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Posts */}
        <Text className="text-xs font-semibold text-gray-500 uppercase px-6 mb-3">Atividade recente</Text>

        {posts.length === 0 ? (
          <View className="items-center mt-6 px-8">
            <Ionicons name="people-outline" size={48} color="#374151" />
            <Text className="text-gray-400 text-base font-semibold mt-3 text-center">Nenhuma atividade ainda</Text>
          </View>
        ) : (
          posts.map((post) => {
            const likes = likeMap[post.id] ?? { count: 0, liked: false };
            return (
              <View key={post.id} className="bg-brand-dark-2 mx-6 rounded-2xl mb-4 overflow-hidden">
                <View className="flex-row items-center p-4 pb-3">
                  <View className="w-10 h-10 rounded-full bg-brand-green/20 items-center justify-center mr-3">
                    {post.student_avatar_url ? (
                      <Image source={{ uri: post.student_avatar_url }} style={{ width: 40, height: 40, borderRadius: 20 }} />
                    ) : (
                      <Text className="text-brand-green font-bold text-base">
                        {post.student_name.charAt(0).toUpperCase()}
                      </Text>
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-semibold text-sm">{post.student_name}</Text>
                    <Text className="text-gray-500 text-xs">{timeAgo(post.created_at)}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => confirmDelete(post.id, post.student_name)}
                    hitSlop={8}
                  >
                    <Ionicons name="trash-outline" size={17} color="#6b7280" />
                  </TouchableOpacity>
                </View>

                {post.sheet_name && (
                  <View className="px-4 pb-3">
                    <Text className="text-white text-sm leading-5">{post.sheet_name}</Text>
                  </View>
                )}

                {post.photo_url && (
                  <Image source={{ uri: post.photo_url }} style={{ width: '100%', height: 220 }} resizeMode="cover" />
                )}

                <View className="flex-row items-center px-4 py-3">
                  <TouchableOpacity onPress={() => toggleLike(post.id)} className="flex-row items-center">
                    <Ionicons
                      name={likes.liked ? 'heart' : 'heart-outline'}
                      size={22}
                      color={likes.liked ? '#ef4444' : '#6b7280'}
                    />
                    {likes.count > 0 && (
                      <Text className="text-gray-400 text-sm ml-1">{likes.count}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Modal — nova publicação */}
      <Modal visible={postModal} animationType="slide" transparent>
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
            <View className="bg-brand-dark-2 rounded-t-3xl px-6 pt-5 pb-8" style={{ borderTopWidth: 1, borderTopColor: '#2E3330' }}>
              <View className="flex-row items-center justify-between mb-5">
                <Text className="text-white text-lg font-bold">Nova publicação</Text>
                <TouchableOpacity onPress={() => { setPostModal(false); setPostCaption(''); setPostPhotoUrl(null); }}>
                  <Ionicons name="close" size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>

              <TextInput
                className="bg-brand-dark border border-brand-dark-3 rounded-xl px-3 py-3 text-white text-sm mb-4"
                value={postCaption}
                onChangeText={setPostCaption}
                placeholder="Escreva uma mensagem para seus alunos..."
                placeholderTextColor="#4B5563"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              <TouchableOpacity
                onPress={pickPostPhoto}
                disabled={uploadingPostPhoto}
                className="rounded-xl overflow-hidden mb-5"
                style={{
                  height: postPhotoUrl ? 180 : 56,
                  backgroundColor: '#1A1D1C',
                  borderWidth: 1, borderColor: '#2E3330',
                  borderStyle: postPhotoUrl ? 'solid' : 'dashed',
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                {uploadingPostPhoto ? (
                  <ActivityIndicator color="#8DC63F" />
                ) : postPhotoUrl ? (
                  <Image source={{ uri: postPhotoUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                ) : (
                  <View className="flex-row items-center">
                    <Ionicons name="image-outline" size={20} color="#4B5563" />
                    <Text className="text-gray-600 text-sm ml-2">Adicionar foto (opcional)</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-brand-green rounded-2xl py-4 items-center"
                onPress={handlePost}
                disabled={savingPost || uploadingPostPhoto}
              >
                {savingPost
                  ? <ActivityIndicator color="#1A1D1C" />
                  : <Text className="text-brand-dark font-bold text-base">Publicar</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
