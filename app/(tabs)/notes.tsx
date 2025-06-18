import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Grid, List, Filter } from 'lucide-react-native';
import { NoteCard } from '@/components/NoteCard';
import { SearchBar } from '@/components/SearchBar';
import { FilterModal } from '@/components/FilterModal';
import { noteService } from '@/services/noteService';
import { Note } from '@/types/note';

export default function NotesScreen() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isGridView, setIsGridView] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    sortBy: 'updatedAt' as 'updatedAt' | 'createdAt' | 'title',
    sortOrder: 'desc' as 'asc' | 'desc',
    showFavoritesOnly: false,
  });

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const allNotes = await noteService.getAllNotes();
      setNotes(allNotes);
    } catch (error) {
      Alert.alert('Error', 'Failed to load notes');
    }
  };

  const getFilteredAndSortedNotes = () => {
    let filtered = notes.filter(note =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (filters.showFavoritesOnly) {
      filtered = filtered.filter(note => note.isFavorite);
    }

    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (filters.sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'updatedAt':
        default:
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
      }

      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  };

  const renderNote = ({ item }: { item: Note }) => (
    <View style={isGridView ? styles.gridItem : styles.listItem}>
      <NoteCard note={item} onUpdate={loadNotes} compact={isGridView} />
    </View>
  );

  const filteredNotes = getFilteredAndSortedNotes();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>All Notes</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowFilters(true)}
          >
            <Filter size={20} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setIsGridView(!isGridView)}
          >
            {isGridView ? (
              <List size={20} color="#007AFF" />
            ) : (
              <Grid size={20} color="#007AFF" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search notes..."
      />

      <FlatList
        data={filteredNotes}
        renderItem={renderNote}
        keyExtractor={(item) => item.id}
        numColumns={isGridView ? 2 : 1}
        key={isGridView ? 'grid' : 'list'}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {searchQuery ? 'No notes found' : 'No notes yet'}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery 
                ? 'Try a different search term'
                : 'Create your first note to get started'}
            </Text>
          </View>
        }
      />

      <FilterModal
        visible={showFilters}
        filters={filters}
        onApply={setFilters}
        onClose={() => setShowFilters(false)}
      />
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  listContainer: {
    padding: 20,
  },
  gridItem: {
    flex: 1,
    margin: 6,
  },
  listItem: {
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
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