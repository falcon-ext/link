import { useState, useCallback, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Modal, TextInput,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { sendPushToStudent, sendPushToAllStudents } from '../../lib/notifications';

type Tip = {
  id: string;
  title: string;
  body: string;
  category: string;
  student_id: string | null;
  created_at: string;
};

type Student = { id: string; name: string };

const CATEGORIES = ['Geral', 'Nutrição', 'Treino', 'Recuperação'];

const CATEGORY_COLORS: Record<string, string> = {
  Nutrição: '#F59E0B',
  Treino: '#3B82F6',
  Recuperação: '#8B5CF6',
  Geral: '#8DC63F',
};

export function TipsScreen() {
  const [tips, setTips]           = useState<Tip[]>([]);
  const [students, setStudents]   = useState<Student[]>([]);
  const [loading, setLoading]     = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTip, setEditingTip]     = useState<Tip | null>(null);
  const [title, setTitle]         = useState('');
  const [body, setBody]           = useState('');
  const [category, setCategory]   = useState('Geral');
  const [targetId, setTargetId]   = useState<string | null>(null); // null = todos
  const [saving, setSaving]       = useState(false);

  useEffect(() => {
    loadStudents();
  }, []);

  useFocusEffect(useCallback(() => { loadTips(); }, []));

  async function loadStudents() {
    const { data } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('role', 'student')
      .eq('is_active', true)
      .order('name');
    setStudents((data as Student[]) ?? []);
  }

  async function loadTips() {
    setLoading(true);
    const { data } = await supabase
      .from('tips')
      .select('*')
      .order('created_at', { ascending: false });
    setTips((data as Tip[]) ?? []);
    setLoading(false);
  }

  function openCreate() {
    setEditingTip(null);
    setTitle('');
    setBody('');
    setCategory('Geral');
    setTargetId(null);
    setModalVisible(true);
  }

  function openEdit(tip: Tip) {
    setEditingTip(tip);
    setTitle(tip.title);
    setBody(tip.body);
    setCategory(tip.category);
    setTargetId(tip.student_id);
    setModalVisible(true);
  }

  async function handleSave() {
    if (!title.trim() || !body.trim()) {
      Alert.alert('Atenção', 'Preencha título e conteúdo.');
      return;
    }
    setSaving(true);

    const payload = {
      title: title.trim(),
      body: body.trim(),
      category,
      student_id: targetId ?? null,
    };

    let error: any;
    if (editingTip) {
      ({ error } = await supabase.from('tips').update(payload).eq('id', editingTip.id));
    } else {
      ({ error } = await supabase.from('tips').insert(payload));
    }

    setSaving(false);
    if (error) {
      Alert.alert('Erro', 'Não foi possível salvar a dica.');
      return;
    }

    setModalVisible(false);
    loadTips();

    // Push notification
    const pushTitle = `Nova dica: ${payload.title}`;
    const pushBody  = payload.body.length > 80 ? payload.body.slice(0, 80) + '…' : payload.body;
    if (targetId) {
      sendPushToStudent(targetId, pushTitle, pushBody).catch(() => {});
    } else {
      sendPushToAllStudents(pushTitle, pushBody).catch(() => {});
    }
  }

  async function handleDelete(tip: Tip) {
    Alert.alert('Excluir dica', `Deseja excluir "${tip.title}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('tips').delete().eq('id', tip.id);
          setTips((prev) => prev.filter((t) => t.id !== tip.id));
        },
      },
    ]);
  }

  function studentName(id: string | null) {
    if (!id) return null;
    return students.find((s) => s.id === id)?.name ?? null;
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-dark">
      <View className="px-6 pt-8 pb-4 flex-row items-center justify-between">
        <View>
          <Text className="text-white text-2xl font-bold">Dicas</Text>
          <Text className="text-gray-400 text-sm mt-1">
            {tips.length} publicada{tips.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity
          className="bg-brand-green w-10 h-10 rounded-full items-center justify-center"
          onPress={openCreate}
        >
          <Ionicons name="add" size={24} color="#1A1D1C" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#8DC63F" />
        </View>
      ) : tips.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="bulb-outline" size={56} color="#374151" />
          <Text className="text-gray-400 text-lg font-semibold mt-4 text-center">
            Nenhuma dica ainda
          </Text>
          <Text className="text-gray-600 text-sm mt-2 text-center">
            Toque em + para criar a primeira.
          </Text>
        </View>
      ) : (
        <FlatList
          data={tips}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
          renderItem={({ item }) => {
            const color   = CATEGORY_COLORS[item.category] ?? '#8DC63F';
            const forName = studentName(item.student_id);
            return (
              <View className="bg-brand-dark-2 rounded-2xl p-5 mb-3">
                <View className="flex-row items-start">
                  <View className="flex-1 mr-3">
                    <View className="flex-row flex-wrap mb-2">
                      <View
                        className="rounded-full px-2 py-0.5 mr-2"
                        style={{ backgroundColor: color + '22' }}
                      >
                        <Text className="text-xs font-semibold" style={{ color }}>
                          {item.category}
                        </Text>
                      </View>
                      {forName && (
                        <View className="rounded-full px-2 py-0.5 bg-brand-dark">
                          <Text className="text-xs font-semibold text-gray-400">
                            Para: {forName}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-white font-bold text-base mb-1">{item.title}</Text>
                    <Text className="text-gray-400 text-sm leading-5" numberOfLines={3}>
                      {item.body}
                    </Text>
                  </View>
                  <View className="items-center gap-y-2">
                    <TouchableOpacity onPress={() => openEdit(item)} className="p-1">
                      <Ionicons name="pencil-outline" size={18} color="#4B5563" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item)} className="p-1">
                      <Ionicons name="trash-outline" size={18} color="#4B5563" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View className="bg-brand-dark rounded-t-3xl px-6 pt-6 pb-8">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-white text-xl font-bold">
                  {editingTip ? 'Editar dica' : 'Nova dica'}
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>

              {/* Categoria */}
              <Text className="text-sm font-medium text-gray-400 mb-2">Categoria</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                {CATEGORIES.map((cat) => {
                  const selected = category === cat;
                  const color    = CATEGORY_COLORS[cat];
                  return (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setCategory(cat)}
                      className="rounded-full px-3 py-1.5 mr-2"
                      style={{
                        backgroundColor: selected ? color : '#242827',
                        flexShrink: 0,
                        flexGrow: 0,
                      }}
                    >
                      <Text
                        className="text-xs font-semibold"
                        style={{ color: selected ? '#1A1D1C' : '#6b7280' }}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Para qual aluno */}
              <Text className="text-sm font-medium text-gray-400 mb-2">Para</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                {[{ id: null, name: 'Todos' }, ...students].map((s) => {
                  const selected = targetId === s.id;
                  return (
                    <TouchableOpacity
                      key={s.id ?? 'all'}
                      onPress={() => setTargetId(s.id)}
                      className="rounded-full px-3 py-1.5 mr-2"
                      style={{
                        backgroundColor: selected ? '#8DC63F' : '#242827',
                        flexShrink: 0,
                        flexGrow: 0,
                      }}
                    >
                      <Text
                        className="text-xs font-semibold"
                        style={{ color: selected ? '#1A1D1C' : '#6b7280' }}
                      >
                        {s.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Título */}
              <Text className="text-sm font-medium text-gray-400 mb-1">Título</Text>
              <TextInput
                className="bg-brand-dark-2 border border-brand-dark-3 rounded-xl px-4 py-3 text-base text-white mb-4"
                placeholder="Ex: Como se hidratar bem"
                placeholderTextColor="#6b7280"
                value={title}
                onChangeText={setTitle}
              />

              {/* Conteúdo */}
              <Text className="text-sm font-medium text-gray-400 mb-1">Conteúdo</Text>
              <TextInput
                className="bg-brand-dark-2 border border-brand-dark-3 rounded-xl px-4 py-3 text-base text-white mb-6"
                placeholder="Escreva o conteúdo da dica..."
                placeholderTextColor="#6b7280"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                style={{ minHeight: 100 }}
                value={body}
                onChangeText={setBody}
              />

              <TouchableOpacity
                className={`rounded-xl py-4 items-center ${saving ? 'bg-brand-green-dark' : 'bg-brand-green'}`}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#1A1D1C" />
                ) : (
                  <Text className="text-brand-dark font-bold text-base">
                    {editingTip ? 'Salvar alterações' : 'Publicar dica'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
