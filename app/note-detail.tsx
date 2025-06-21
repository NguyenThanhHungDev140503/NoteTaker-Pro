import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { 
  ArrowLeft, 
  Star, 
  Share, 
  Edit3, 
  Calendar,
  Camera,
  Mic,
  Play,
  Pause
} from 'lucide-react-native';
import { Note } from '@/types/note';
import { noteService } from '@/services/noteService';

const { width: screenWidth } = Dimensions.get('window');

export default function NoteDetailScreen() {
  const { noteId } = useLocalSearchParams<{ noteId: string }>();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  useEffect(() => {
    loadNote();
  }, [noteId]);

  const loadNote = async () => {
    if (!noteId) return;
    
    try {
      const noteData = await noteService.getNoteById(noteId);
      setNote(noteData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load note');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!note) return;
    
    try {
      await noteService.toggleFavorite(note.id);
      setNote(prev => prev ? { ...prev, isFavorite: !prev.isFavorite } : null);
    } catch (error) {
      Alert.alert('Error', 'Failed to update favorite status');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleImagePress = (index: number) => {
    setSelectedImageIndex(index);
  };

  const closeImageViewer = () => {
    setSelectedImageIndex(null);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading note...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!note) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Note not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleToggleFavorite} style={styles.headerAction}>
            <Star
              size={24}
              color={note.isFavorite ? '#FFD700' : '#9CA3AF'}
              fill={note.isFavorite ? '#FFD700' : 'transparent'}
            />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.headerAction}>
            <Share size={24} color="#9CA3AF" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.headerAction}>
            <Edit3 size={24} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <Text style={styles.title}>{note.title || 'Untitled Note'}</Text>
        
        {/* Date */}
        <View style={styles.dateContainer}>
          <Calendar size={16} color="#6B7280" />
          <Text style={styles.date}>Created {formatDate(note.createdAt)}</Text>
        </View>
        
        {note.createdAt !== note.updatedAt && (
          <View style={styles.dateContainer}>
            <Calendar size={16} color="#6B7280" />
            <Text style={styles.date}>Updated {formatDate(note.updatedAt)}</Text>
          </View>
        )}

        {/* Content */}
        <Text style={styles.noteContent}>{note.content}</Text>

        {/* Images */}
        {note.images.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Camera size={20} color="#007AFF" />
              <Text style={styles.sectionTitle}>Images ({note.images.length})</Text>
            </View>
            
            <View style={styles.imagesGrid}>
              {note.images.map((uri, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.imageContainer}
                  onPress={() => handleImagePress(index)}
                  activeOpacity={0.8}
                >
                  <Image source={{ uri }} style={styles.image} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Audio Recordings */}
        {note.audioRecordings.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Mic size={20} color="#007AFF" />
              <Text style={styles.sectionTitle}>Audio Recordings ({note.audioRecordings.length})</Text>
            </View>
            
            {note.audioRecordings.map((uri, index) => (
              <View key={index} style={styles.audioItem}>
                <View style={styles.audioInfo}>
                  <Mic size={16} color="#007AFF" />
                  <Text style={styles.audioText}>Recording {index + 1}</Text>
                </View>
                <TouchableOpacity style={styles.playButton}>
                  <Play size={16} color="#007AFF" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Tags */}
        {note.tags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsContainer}>
              {note.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Full Screen Image Viewer */}
      {selectedImageIndex !== null && (
        <View style={styles.imageViewer}>
          <TouchableOpacity 
            style={styles.imageViewerOverlay} 
            onPress={closeImageViewer}
            activeOpacity={1}
          >
            <Image 
              source={{ uri: note.images[selectedImageIndex] }} 
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
            
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={closeImageViewer}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#EF4444',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAction: {
    marginLeft: 16,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    lineHeight: 36,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  date: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  noteContent: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginTop: 20,
    marginBottom: 32,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  imageContainer: {
    width: (screenWidth - 56) / 2, // 20 padding left + 20 padding right + 16 gap
    marginHorizontal: 4,
    marginBottom: 8,
  },
  image: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  audioItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  audioInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  audioText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 8,
  },
  playButton: {
    padding: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#EBF8FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  imageViewer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    zIndex: 1000,
  },
  imageViewerOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: screenWidth,
    height: '80%',
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});