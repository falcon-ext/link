import { useState } from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator, Alert,
  ScrollView, TextInput, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { uploadToCloudinary } from '../../lib/cloudinary';
import { TrainerProfileStackParams } from '../../navigation/TrainerProfileStack';

type Nav = NativeStackNavigationProp<TrainerProfileStackParams, 'TrainerProfile'>;

export function TrainerProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { profile, setProfile } = useAuthStore();

  const [name, setName]           = useState(profile?.name ?? '');
  const [bio, setBio]             = useState(profile?.bio ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const isDirty =
    name.trim() !== (profile?.name ?? '') ||
    bio.trim() !== (profile?.bio ?? '') ||
    avatarUrl !== (profile?.avatar_url ?? null);

  async function pickAvatar() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || !result.assets[0]) return;

    setUploadingAvatar(true);
    try {
      const url = await uploadToCloudinary(result.assets[0].uri, 'image');
      setAvatarUrl(url);
    } catch {
      Alert.alert('Erro', 'Não foi possível enviar a foto.');
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert('Atenção', 'O nome não pode ficar vazio.');
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ name: name.trim(), bio: bio.trim() || null, avatar_url: avatarUrl })
      .eq('id', profile!.id);
    setSaving(false);

    if (error) {
      Alert.alert('Erro', 'Não foi possível salvar as alterações.');
      return;
    }
    setProfile({ ...profile!, name: name.trim(), bio: bio.trim() || null, avatar_url: avatarUrl });
    Alert.alert('Salvo!', 'Perfil atualizado com sucesso.');
  }

  async function handleLogout() {
    Alert.alert('Sair', 'Deseja encerrar a sessão?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair', style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          await supabase.auth.signOut();
          setLoggingOut(false);
        },
      },
    ]);
  }

  const initials = (profile?.name ?? 'P').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <SafeAreaView className="flex-1 bg-brand-dark">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="px-6 pt-6 pb-2">
          <Text className="text-white text-2xl font-bold">Perfil</Text>
        </View>

        {/* Avatar */}
        <View className="items-center mt-6 mb-6">
          <TouchableOpacity onPress={pickAvatar} disabled={uploadingAvatar}>
            <View style={{ width: 110, height: 110, borderRadius: 55, backgroundColor: '#2E3330', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
              {uploadingAvatar ? (
                <ActivityIndicator color="#8DC63F" />
              ) : avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={{ width: 110, height: 110 }} resizeMode="cover" />
              ) : (
                <Text style={{ color: '#8DC63F', fontSize: 36, fontWeight: 'bold' }}>{initials}</Text>
              )}
            </View>
            <View style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 30, height: 30, borderRadius: 15,
              backgroundColor: '#8DC63F', alignItems: 'center', justifyContent: 'center',
              borderWidth: 2, borderColor: '#1A1D1C',
            }}>
              <Ionicons name="camera" size={15} color="#1A1D1C" />
            </View>
          </TouchableOpacity>
        </View>

        <View className="px-6">
          {/* Dados do perfil */}
          <View className="bg-brand-dark-2 rounded-2xl p-5 mb-4">
            <Text className="text-white font-semibold mb-4">Dados pessoais</Text>

            <Text className="text-gray-400 text-xs mb-1">Nome</Text>
            <TextInput
              className="bg-brand-dark border border-brand-dark-3 rounded-xl px-3 py-2.5 text-white text-sm mb-4"
              value={name}
              onChangeText={setName}
              placeholder="Seu nome"
              placeholderTextColor="#4B5563"
            />

            <Text className="text-gray-400 text-xs mb-1">Bio</Text>
            <TextInput
              className="bg-brand-dark border border-brand-dark-3 rounded-xl px-3 py-3 text-white text-sm"
              value={bio}
              onChangeText={setBio}
              placeholder="Conte um pouco sobre você..."
              placeholderTextColor="#4B5563"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Salvar */}
          {isDirty && (
            <TouchableOpacity
              className="bg-brand-green rounded-2xl py-4 items-center mb-4"
              onPress={handleSave}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator color="#1A1D1C" />
                : <Text className="text-brand-dark font-bold text-base">Salvar alterações</Text>
              }
            </TouchableOpacity>
          )}

          {/* Feed dos alunos */}
          <TouchableOpacity
            className="bg-brand-dark-2 rounded-2xl py-5 px-5 flex-row items-center mb-4"
            onPress={() => navigation.navigate('TrainerFeed')}
          >
            <View className="w-11 h-11 rounded-xl bg-brand-green items-center justify-center mr-4">
              <Ionicons name="megaphone-outline" size={22} color="#1A1D1C" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-bold text-base">Feed dos alunos</Text>
              <Text className="text-gray-500 text-sm mt-0.5">Ver, moderar e publicar no feed</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#4B5563" />
          </TouchableOpacity>

          {/* Logout */}
          <TouchableOpacity
            className="bg-brand-dark-2 border border-red-900 rounded-2xl py-4 items-center mt-2"
            onPress={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut
              ? <ActivityIndicator color="#ef4444" />
              : <Text className="text-red-400 font-semibold">Sair da conta</Text>
            }
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
