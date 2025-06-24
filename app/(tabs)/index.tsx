import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Star, Clock, Plus } from 'lucide-react-native';
import { router } from 'expo-router';
import { NoteCard } from '@/components/NoteCard';
import { SearchBar } from '@/components/SearchBar';
import { useNotes } from '@/contexts/NotesContext';
import { useNotesSync } from '@/hooks/useNotesSync';

export default function HomeScreen() {
  const { 
    notes, 
    loading, 
    error, 
    getFavoriteNotes, 
    getRecentNotes, 
    searchNotes, 
    refreshNotes 
  } = useNotes();
  
  useNotesSync(); // Auto-sync when app becomes active
  
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshNotes();
    } finally {
      setRefreshing(false);
    }
  };

  const favoriteNotes = getFavoriteNotes();
  const recentNotes = getRecentNotes(5);
  const filteredNotes = searchQuery ? searchNotes(searchQuery) : [];

  const handleCreateNote = () => {
    router.push('/(tabs)/create');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>NoteTaker-Pro</Text>
        </View>
        <TouchableOpacity style={styles.createButton} onPress={handleCreateNote}>
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search your notes..."
      />

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#007AFF']}
            tintColor="#007AFF"
          />
        }
      >
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={refreshNotes}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {searchQuery ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Search size={20} color="#007AFF" />
              <Text style={styles.sectionTitle}>Search Results ({filteredNotes.length})</Text>
            </View>
            {filteredNotes.length > 0 ? (
              filteredNotes.map((note) => (
                <NoteCard key={note.id} note={note} />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No notes found</Text>
                <Text style={styles.emptySubtext}>Try a different search term</Text>
              </View>
            )}
          </View>
        ) : (
          <>
            {favoriteNotes.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Star size={20} color="#FFD700" />
                  <Text style={styles.sectionTitle}>Favorites ({favoriteNotes.length})</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {favoriteNotes.map((note) => (
                    <View key={note.id} style={styles.horizontalCard}>
                      <NoteCard note={note} compact />
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Clock size={20} color="#007AFF" />
                <Text style={styles.sectionTitle}>Recent Notes ({recentNotes.length})</Text>
              </View>
              {recentNotes.length > 0 ? (
                recentNotes.map((note) => (
                  <NoteCard key={note.id} note={note} />
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No notes yet</Text>
                  <Text style={styles.emptySubtext}>
                    Tap the + button to create your first note
                  </Text>
                </View>
              )}
            </View>

            {notes.length > 5 && !searchQuery && (
              <View style={styles.section}>
                <TouchableOpacity 
                  style={styles.viewAllButton}
                  onPress={() => router.push('/(tabs)/notes')}
                >
                  <Text style={styles.viewAllText}>View All Notes ({notes.length})</Text>
                </TouchableOpacity>
              </View>
            )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  headerContent: {
    flex: 1,
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
  createButton: {
    backgroundColor: '#007AFF',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  retryButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  viewAllButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  viewAllText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
});