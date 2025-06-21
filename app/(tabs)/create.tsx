import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Image,
  Modal,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  Save,
  Camera,
  Image as ImageIcon,
  Mic,
  MicOff,
  Play,
  Pause,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { MediaPicker } from '@/components/MediaPicker';
import { AudioRecorder } from '@/components/AudioRecorder';
import { noteService } from '@/services/noteService';
import { Note } from '@/types/note';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function CreateScreen() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [audioRecordings, setAudioRecordings] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Image viewer states
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);

  const titleInputRef = useRef<TextInput>(null);
  const contentInputRef = useRef<TextInput>(null);

  const handleSave = async () => {
    if (!title.trim() && !content.trim()) {
      Alert.alert('Error', 'Please add a title or content to save the note.');
      return;
    }

    setIsSaving(true);
    
    try {
      const newNote: Omit<Note, 'id' | 'createdAt' | 'updatedAt'> = {
        title: title.trim() || 'Untitled Note',
        content: content.trim(),
        images,
        audioRecordings,
        isFavorite: false,
        tags: [],
      };

      await noteService.createNote(newNote);
      
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      Alert.alert(
        'Success',
        'Note saved successfully!',
        [
          {
            text: 'Create Another',
            onPress: () => {
              setTitle('');
              setContent('');
              setImages([]);
              setAudioRecordings([]);
              titleInputRef.current?.focus();
            },
          },
          {
            text: 'View Notes',
            onPress: () => router.replace('/(tabs)/notes'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to save note. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImagePicked = (imageUri: string) => {
    setImages(prev => [...prev, imageUri]);
  };

  const handleAudioRecorded = (audioUri: string) => {
    setAudioRecordings(prev => [...prev, audioUri]);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeAudio = (index: number) => {
    setAudioRecordings(prev => prev.filter((_, i) => i !== index));
  };

  // Image viewer functions
  const handleImagePress = (index: number) => {
    setSelectedImageIndex(index);
    setIsImageViewerVisible(true);
  };

  const closeImageViewer = () => {
    setIsImageViewerVisible(false);
    setSelectedImageIndex(0);
  };

  const goToPreviousImage = () => {
    if (!images.length) return;
    setSelectedImageIndex(prevIndex => 
      prevIndex > 0 ? prevIndex - 1 : images.length - 1
    );
  };

  const goToNextImage = () => {
    if (!images.length) return;
    setSelectedImageIndex(prevIndex => 
      prevIndex < images.length - 1 ? prevIndex + 1 : 0
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Create Note</Text>
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Save size={20} color="#FFFFFF" />
          <Text style={styles.saveButtonText}>
            {isSaving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <TextInput
          ref={titleInputRef}
          style={styles.titleInput}
          placeholder="Note title..."
          value={title}
          onChangeText={setTitle}
          multiline
          autoFocus
        />

        <TextInput
          ref={contentInputRef}
          style={styles.contentInput}
          placeholder="Start writing your note..."
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
        />

        <View style={styles.mediaSection}>
          <Text style={styles.sectionTitle}>Media</Text>
          
          <MediaPicker onImagePicked={handleImagePicked} />
          
          {images.length > 0 && (
            <View style={styles.imageContainer}>
              <Text style={styles.mediaLabel}>Images ({images.length})</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.imageScrollView}
              >
                {images.map((uri, index) => (
                  <View key={index} style={styles.imageWrapper}>
                    <TouchableOpacity
                      onPress={() => handleImagePress(index)}
                      activeOpacity={0.8}
                    >
                      <Image source={{ uri }} style={styles.imagePreview} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeImage(index)}
                    >
                      <X size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          <AudioRecorder
            onAudioRecorded={handleAudioRecorded}
            isRecording={isRecording}
            onRecordingStateChange={setIsRecording}
          />

          {audioRecordings.length > 0 && (
            <View style={styles.audioContainer}>
              <Text style={styles.mediaLabel}>Audio Recordings ({audioRecordings.length})</Text>
              {audioRecordings.map((uri, index) => (
                <View key={index} style={styles.audioItem}>
                  <View style={styles.audioInfo}>
                    <Mic size={16} color="#007AFF" />
                    <Text style={styles.audioText}>
                      Audio Recording {index + 1}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeAudioButton}
                    onPress={() => removeAudio(index)}
                  >
                    <Trash2 size={16} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Full Screen Image Viewer Modal */}
      {isImageViewerVisible && images.length > 0 && (
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
                {selectedImageIndex + 1} / {images.length}
              </Text>
            </View>

            {/* Main Image Display */}
            <TouchableOpacity 
              style={styles.imageViewerContent}
              activeOpacity={1}
              onPress={closeImageViewer}
            >
              <Image 
                source={{ uri: images[selectedImageIndex] }} 
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
            </TouchableOpacity>

            {/* Navigation Controls - Only show if more than 1 image */}
            {images.length > 1 && (
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
            {images.length > 1 && (
              <View style={styles.imageIndicators}>
                {images.map((_, index) => (
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  contentInput: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    minHeight: 200,
    marginBottom: 24,
  },
  mediaSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  imageContainer: {
    marginVertical: 16,
  },
  mediaLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  imageScrollView: {
    marginTop: 8,
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  audioContainer: {
    marginTop: 16,
  },
  audioItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  audioInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  audioText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
  },
  removeAudioButton: {
    padding: 4,
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