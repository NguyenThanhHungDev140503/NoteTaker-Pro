import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Star, Clock } from 'lucide-react-native';
import { NoteCard } from '@/components/NoteCard';
import { SearchBar } from '@/components/SearchBar';
import { noteService } from '@/services/noteService';
import { Note } from '@/types/note';

export default function HomeScreen() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);
  const [favoriteNotes, setFavoriteNotes] = useState<Note[]>([]);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const allNotes = await noteService.getAllNotes();
      setNotes(allNotes);
      
      // Get recent notes (last 5)
      const recent = allNotes
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 5);
      setRecentNotes(recent);
      
      // Get favorite notes
      const favorites = allNotes.filter(note => note.isFavorite);
      setFavoriteNotes(favorites);
    } catch (error) {
      Alert.alert('Error', 'Failed to load notes');
    }
  };

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Your notes are ready</Text>
      </View>

      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search your notes..."
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {searchQuery ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Search Results</Text>
            {filteredNotes.length > 0 ? (
              filteredNotes.map((note) => (
                <NoteCard key={note.id} note={note} onUpdate={loadNotes} />
              ))
            ) : (
              <Text style={styles.emptyText}>No notes found</Text>
            )}
          </View>
        ) : (
          <>
            {favoriteNotes.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Star size={20} color="#FFD700" />
                  <Text style={styles.sectionTitle}>Favorites</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {favoriteNotes.map((note) => (
                    <View key={note.id} style={styles.horizontalCard}>
                      <NoteCard note={note} onUpdate={loadNotes} compact />
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Clock size={20} color="#007AFF" />
                <Text style={styles.sectionTitle}>Recent Notes</Text>
              </View>
              {recentNotes.length > 0 ? (
                recentNotes.map((note) => (
                  <NoteCard key={note.id} note={note} onUpdate={loadNotes} />
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No notes yet</Text>
                  <Text style={styles.emptySubtext}>
                    Tap the Create tab to start writing
                  </Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  horizontalCard: {
    marginRight: 12,
    width: 200,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
  },
});