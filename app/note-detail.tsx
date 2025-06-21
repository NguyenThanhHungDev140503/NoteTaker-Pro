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
  Modal,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Star, Share, CreditCard as Edit3, Calendar, Camera, Mic, Play, X, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Note } from '@/types/note';
import { noteService } from '@/services/noteService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function NoteDetailScreen() {
  const { noteId } = useLocalSearchParams<{ noteId: string }>();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);

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
    setIsImageViewerVisible(true);
  };

  const closeImageViewer = () => {
    setIsImageViewerVisible(false);
    setSelectedImageIndex(0);
  };

  const goToPreviousImage = () => {
    if (!note?.images.length) return;
    setSelectedImageIndex(prevIndex => 
      prevIndex > 0 ? prevIndex - 1 : note.images.length - 1
    );
  };

  const goToNextImage = () => {
    if (!note?.images.length) return;
    setSelectedImageIndex(prevIndex => 
      prevIndex < note.images.length - 1 ? prevIndex + 1 : 0
    );
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
                  <Image 
                    source={{ uri }} 
                    style={styles.image} 
                    resizeMode="cover"
                  />
                  <View style={styles.imageOverlay}>
                    <Text style={styles.imageNumber}>{index + 1}</Text>
                  </View>
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

      {/* Full Screen Image Viewer Modal */}
      {isImageViewerVisible && (
        <Modal
          visible={isImageViewerVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={closeImageViewer}
          statusBarTranslucent={true}
        >
          <StatusBar hidden={true} />
          <View style={styles.imageViewer}>
            {/* Header Controls */}
            <View style={styles.imageViewerHeader}>
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={closeImageViewer}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={28} color="#FFFFFF" />
              </TouchableOpacity>
              
              <Text style={styles.imageCounter}>
                {selectedImageIndex + 1} / {note.images.length}
              </Text>
            </View>

            {/* Main Image Display */}
            <TouchableOpacity 
              style={styles.imageViewerContent}
              activeOpacity={1}
              onPress={closeImageViewer}
            >
              <Image 
                source={{ uri: note.images[selectedImageIndex] }} 
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
            </TouchableOpacity>

            {/* Navigation Controls - Only show if more than 1 image */}
            {note.images.length > 1 && (
              <>
                <TouchableOpacity 
                  style={[styles.navButton, styles.navButtonLeft]} 
                  onPress={goToPreviousImage}
                  hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                >
                  <ChevronLeft size={32} color="#FFFFFF" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.navButton, styles.navButtonRight]} 
                  onPress={goToNextImage}
                  hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                >
                  <ChevronRight size={32} color="#FFFFFF" />
                </TouchableOpacity>
              </>
            )}

            {/* Image Indicators */}
            {note.images.length > 1 && (
              <View style={styles.imageIndicators}>
                {note.images.map((_, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.indicator,
                      selectedImageIndex === index && styles.activeIndicator
                    ]}
                    onPress={() => setSelectedImageIndex(index)}
                  />
                ))}
              </View>
            )}
          </View>
        </Modal>
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
    width: (screenWidth - 56) / 2,
    marginHorizontal: 4,
    marginBottom: 8,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  imageOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  imageNumber: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
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
  // Image Viewer Styles
  imageViewer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    zIndex: 100,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  closeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageCounter: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  imageViewerContent: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: screenWidth,
    height: screenHeight,
    backgroundColor: 'transparent',
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    marginTop: -32,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 90,
  },
  navButtonLeft: {
    left: 20,
  },
  navButtonRight: {
    right: 20,
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: '#FFFFFF',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});