import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Modal,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { db } from '../api/supabase';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Toggle } from '../components/Toggle';
import { useTheme, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../styles/theme';

interface Note {
  id?: string;
  title: string;
  content: string;
  is_private: boolean;
  created_by: string;
  created_by_name: string;
  created_at?: string;
}

type RootStackParamList = {
  Dashboard: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const NotepadScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { userProfile } = useAuth();
  const { colors, isDarkMode } = useTheme();

  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'public' | 'private'>('public');
  const [loading, setLoading] = useState(false);

  // Note Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formIsPrivate, setFormIsPrivate] = useState(false);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // View note detail modal state
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  const fetchNotes = async () => {
    if (!userProfile) return;
    setLoading(true);
    try {
      const { data, error } = await db.getNotes(userProfile.role, userProfile.id);
      if (!error && data) {
        setNotes(data);
      } else if (error) {
        console.error('Error loading notes:', error);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchNotes();
    }, [userProfile])
  );

  // Filter notes based on activeTab and search query
  useEffect(() => {
    let result = notes.filter((n) => {
      if (activeTab === 'public') {
        return !n.is_private;
      } else {
        return n.is_private && n.created_by === userProfile?.id;
      }
    });

    if (search.trim() !== '') {
      const query = search.toLowerCase();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(query) ||
          n.content.toLowerCase().includes(query)
      );
    }

    setFilteredNotes(result);
  }, [search, notes, activeTab, userProfile]);

  // Setup navigation drawer trigger
  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('Dashboard')}
          style={{ marginLeft: SPACING.md, padding: SPACING.xs }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, colors]);

  const openForm = (note: Note | null = null) => {
    if (note) {
      setEditingNote(note);
      setFormTitle(note.title);
      setFormContent(note.content);
      setFormIsPrivate(note.is_private);
    } else {
      setEditingNote(null);
      setFormTitle('');
      setFormContent('');
      // Default privacy to matching the active tab
      setFormIsPrivate(activeTab === 'private');
    }
    setFormError('');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formTitle.trim()) {
      setFormError('Note Title is required.');
      return;
    }
    if (!formContent.trim()) {
      setFormError('Note Content is required.');
      return;
    }
    if (!userProfile) return;

    setSaving(true);
    const noteData: Note = {
      title: formTitle.trim(),
      content: formContent.trim(),
      is_private: formIsPrivate,
      created_by: userProfile.id,
      created_by_name: userProfile.name,
    };

    if (editingNote?.id) {
      noteData.id = editingNote.id;
    }

    try {
      const { error } = await db.saveNote(noteData);
      if (error) {
        setFormError(error.message || 'Failed to save note.');
      } else {
        setModalVisible(false);
        fetchNotes();
      }
    } catch (e: any) {
      setFormError(e.message || 'An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (noteId: string) => {
    Alert.alert('Delete Note', 'Are you sure you want to delete this note?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            const { error } = await db.deleteNote(noteId);
            if (error) {
              Alert.alert('Error', error.message || 'Failed to delete note.');
            } else {
              fetchNotes();
            }
          } catch (e: any) {
            Alert.alert('Error', e.message || 'An unexpected error occurred.');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const openDetail = (note: Note) => {
    setSelectedNote(note);
    setDetailModalVisible(true);
  };

  const styles = getStyles(colors, isDarkMode);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Tab Selectors */}
      <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'public' && styles.tabButtonActive]}
          onPress={() => setActiveTab('public')}
        >
          <Ionicons
            name="people-outline"
            size={18}
            color={activeTab === 'public' ? colors.secondary : colors.textMuted}
          />
          <Text style={[styles.tabText, { color: activeTab === 'public' ? colors.text : colors.textMuted }]}>
            Public Notes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'private' && styles.tabButtonActive]}
          onPress={() => setActiveTab('private')}
        >
          <Ionicons
            name="lock-closed-outline"
            size={18}
            color={activeTab === 'private' ? colors.secondary : colors.textMuted}
          />
          <Text style={[styles.tabText, { color: activeTab === 'private' ? colors.text : colors.textMuted }]}>
            Private Notes
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Header */}
      <View style={[styles.header, { backgroundColor: colors.cardBg, borderBottomColor: colors.border }]}>
        <Input
          value={search}
          onChangeText={setSearch}
          placeholder="Search notes by title or description..."
          icon="search-outline"
          onClear={() => setSearch('')}
          containerStyle={styles.searchBar}
        />
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.secondary }]}
          onPress={() => openForm(null)}
        >
          <Ionicons name="add" size={24} color="#000000" />
        </TouchableOpacity>
      </View>

      {/* Loading Indicator */}
      {loading && notes.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.secondary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading notes...</Text>
        </View>
      ) : (
        /* Notes List */
        <FlatList
          data={filteredNotes}
          keyExtractor={(item) => item.id || 'k'}
          contentContainerStyle={styles.listContainer}
          refreshing={loading}
          onRefresh={fetchNotes}
          ListEmptyComponent={
            <Card style={styles.emptyCard}>
              <Ionicons name="journal-outline" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                {search ? 'No notes match your search.' : `No ${activeTab} notes created yet.`}
              </Text>
            </Card>
          }
          renderItem={({ item }) => {
            const isOwner = item.created_by === userProfile?.id;
            return (
              <Card style={styles.noteCard} onPress={() => openDetail(item)}>
                <View style={styles.noteCardHeader}>
                  <Text style={[styles.noteTitle, { color: colors.text }]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  {isOwner && (
                    <View style={styles.noteActions}>
                      <TouchableOpacity onPress={() => openForm(item)} style={styles.actionIcon}>
                        <Ionicons name="pencil-outline" size={18} color={colors.secondary} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDelete(item.id!)} style={styles.actionIcon}>
                        <Ionicons name="trash-outline" size={18} color={colors.danger} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
                <Text style={[styles.noteSnippet, { color: colors.textMuted }]} numberOfLines={2}>
                  {item.content}
                </Text>
                <View style={[styles.noteDivider, { backgroundColor: colors.border }]} />
                <View style={styles.noteFooter}>
                  <Text style={[styles.noteMeta, { color: colors.textMuted }]}>
                    By: {isOwner ? 'You' : item.created_by_name}
                  </Text>
                  {item.created_at && (
                    <Text style={[styles.noteMeta, { color: colors.textMuted }]}>
                      {new Date(item.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </Text>
                  )}
                </View>
              </Card>
            );
          }}
        />
      )}

      {/* Note Form Modal (Create / Edit) */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContainer, { backgroundColor: colors.cardBg }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingNote ? 'Edit Note' : 'Create New Note'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {formError ? <Text style={[styles.modalError, { color: colors.danger }]}>{formError}</Text> : null}

            <Input
              label="Note Title"
              value={formTitle}
              onChangeText={setFormTitle}
              placeholder="e.g. Sales Reminders"
              icon="bookmark-outline"
            />

            <Input
              label="Note Description / Content"
              value={formContent}
              onChangeText={setFormContent}
              placeholder="Write your note details here..."
              icon="document-text-outline"
              multiline
              numberOfLines={4}
              style={styles.contentInput}
            />

            <Toggle
              label="Private Note"
              description="Only you can see this note. Toggle off to share with everyone."
              value={formIsPrivate}
              onValueChange={setFormIsPrivate}
              style={styles.privateToggle}
            />

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setModalVisible(false)}
                style={styles.modalBtn}
                disabled={saving}
              />
              <Button
                title={saving ? 'Saving...' : 'Save Note'}
                onPress={handleSave}
                style={styles.modalBtn}
                loading={saving}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Note Detail Modal (View Only) */}
      <Modal
        visible={detailModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.detailOverlay}>
          <View style={[styles.detailContainer, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <View style={styles.detailHeader}>
              <View style={styles.detailTitleBox}>
                <Ionicons
                  name={selectedNote?.is_private ? 'lock-closed' : 'people'}
                  size={16}
                  color={colors.secondary}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.detailTitle, { color: colors.text }]} numberOfLines={1}>
                  {selectedNote?.title}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <View style={[styles.detailDivider, { backgroundColor: colors.border }]} />
            <ScrollView style={styles.detailScroll} contentContainerStyle={styles.detailContentContainer}>
              <Text style={[styles.detailText, { color: colors.text }]}>{selectedNote?.content}</Text>
            </ScrollView>
            <View style={[styles.detailDivider, { backgroundColor: colors.border }]} />
            <View style={styles.detailFooter}>
              <Text style={[styles.detailMeta, { color: colors.textMuted }]}>
                Author: {selectedNote?.created_by === userProfile?.id ? 'You' : selectedNote?.created_by_name}
              </Text>
              {selectedNote?.created_at && (
                <Text style={[styles.detailMeta, { color: colors.textMuted }]}>
                  {new Date(selectedNote.created_at).toLocaleString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const getStyles = (colors: any, isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    height: 48,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  tabButtonActive: {
    borderBottomWidth: 3,
    borderBottomColor: colors.secondary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    borderBottomWidth: 1,
    gap: SPACING.md,
  },
  searchBar: {
    flex: 1,
    marginBottom: SPACING.md,
  },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...TYPOGRAPHY.bodyMuted,
    marginTop: SPACING.md,
  },
  listContainer: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  emptyCard: {
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  emptyText: {
    ...TYPOGRAPHY.bodyMuted,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  noteCard: {
    marginBottom: SPACING.md,
  },
  noteCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  noteTitle: {
    ...TYPOGRAPHY.h3,
    fontWeight: '700',
    flex: 1,
  },
  noteActions: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  actionIcon: {
    padding: SPACING.xs,
  },
  noteSnippet: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: SPACING.sm,
  },
  noteDivider: {
    height: 1,
    marginVertical: SPACING.sm,
  },
  noteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  noteMeta: {
    fontSize: 11,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    paddingBottom: Platform.OS === 'ios' ? SPACING.xxxl : SPACING.xl,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    ...TYPOGRAPHY.h2,
    fontWeight: '700',
  },
  modalError: {
    fontSize: 13,
    marginBottom: SPACING.md,
    fontWeight: '500',
  },
  contentInput: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: SPACING.sm,
  },
  privateToggle: {
    borderBottomWidth: 0,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.md,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  modalBtn: {
    flex: 1,
  },
  detailOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  detailContainer: {
    width: '90%',
    maxHeight: '75%',
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailTitle: {
    ...TYPOGRAPHY.h2,
    fontWeight: '700',
    flex: 1,
  },
  detailDivider: {
    height: 1,
    marginVertical: SPACING.md,
  },
  detailScroll: {
    maxHeight: 300,
  },
  detailContentContainer: {
    paddingVertical: SPACING.xs,
  },
  detailText: {
    fontSize: 14,
    lineHeight: 22,
  },
  detailFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailMeta: {
    fontSize: 11,
    fontWeight: '500',
  },
});
