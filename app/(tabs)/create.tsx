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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Save, Camera, Image as ImageIcon, Mic, MicOff, Play, Pause, Trash2, X, ChevronLeft, ChevronRight, CircleCheck as CheckCircle } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { MediaPicker } from '@/components/MediaPicker';
import { AudioRecorder } from '@/components/AudioRecorder';
import { useNotes } from '@/contexts/NotesContext';
import { Note } from '@/types/note';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle,
  withSpring,
  runOnJS,
  withTiming,
  interpolate,
  cancelAnimation,
} from 'react-native-reanimated';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const SWIPE_THRESHOLD = 50;

export default function CreateScreen() {
  const { createNote, operationLoading } = useNotes();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [audioRecordings, setAudioRecordings] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  // Image viewer states
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);
  const [imageLoadingStates, setImageLoadingStates] = useState<{ [key: number]: boolean }>({});
  const [isGestureActive, setIsGestureActive] = useState(false);

  // Component mounted state tracking
  const isMountedRef = useRef(true);
  const gestureInProgressRef = useRef(false);

  // Animated values for gesture
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const titleInputRef = useRef<TextInput>(null);
  const contentInputRef = useRef<TextInput>(null);

  const isSaving = operationLoading.create || false;

  // Component cleanup
  React.useEffect(() => {
    return () => {
      isMountedRef.current = false;
      try {
        cancelAnimation(translateX);
        cancelAnimation(scale);
        cancelAnimation(opacity);
      } catch (error) {
        console.warn('Cleanup error:', error);
      }
    };
  }, []);

  // Safe state update helper
  const safeSetState = (callback: () => void) => {
    if (isMountedRef.current) {
      try {
        callback();
      } catch (error) {
        console.warn('Safe state update error:', error);
      }
    }
  };

  // Clear all form fields
  const clearForm = () => {
    setTitle('');
    setContent('');
    setImages([]);
    setAudioRecordings([]);
    setImageLoadingStates({});
    setSelectedImageIndex(0);
    setIsGestureActive(false);
    gestureInProgressRef.current = false;
    
    // Reset animation values
    try {
      cancelAnimation(translateX);
      cancelAnimation(scale);
      cancelAnimation(opacity);
      
      translateX.value = 0;
      scale.value = 1;
      opacity.value = 1;
    } catch (error) {
      console.warn('Animation reset error:', error);
    }
    
    // Focus title input for next note
    setTimeout(() => {
      titleInputRef.current?.focus();
    }, 100);
  };

  // Show temporary success message
  const showSuccessNotification = () => {
    setShowSuccessMessage(true);
    
    // Auto-hide after 2 seconds
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 2000);

    // Haptic feedback
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  // Enhanced safe navigation helpers
  const safeSetSelectedImageIndex = (newIndex: number) => {
    if (!isMountedRef.current || images.length === 0) return;
    
    const safeIndex = Math.max(0, Math.min(newIndex, images.length - 1));
    safeSetState(() => setSelectedImageIndex(safeIndex));
  };

  const goToPreviousImageSafe = () => {
    if (!isMountedRef.current || images.length <= 1 || gestureInProgressRef.current) return;
    
    const newIndex = selectedImageIndex > 0 ? selectedImageIndex - 1 : images.length - 1;
    safeSetSelectedImageIndex(newIndex);
  };

  const goToNextImageSafe = () => {
    if (!isMountedRef.current || images.length <= 1 || gestureInProgressRef.current) return;
    
    const newIndex = selectedImageIndex < images.length - 1 ? selectedImageIndex + 1 : 0;
    safeSetSelectedImageIndex(newIndex);
  };

  // Simplified animation functions - avoid complex timing callbacks
  const goToPreviousImageWithAnimation = () => {
    if (!isMountedRef.current || images.length <= 1 || gestureInProgressRef.current) return;
    
    gestureInProgressRef.current = true;
    
    try {
      // Immediate navigation without complex animation callbacks
      goToPreviousImageSafe();
      
      // Simple slide animation
      translateX.value = withSpring(0, { damping: 20, stiffness: 150 }, () => {
        'worklet';
        if (isMountedRef.current) {
          runOnJS(() => {
            gestureInProgressRef.current = false;
          })();
        }
      });
      scale.value = withSpring(1, { damping: 20, stiffness: 150 });
      opacity.value = withSpring(1, { damping: 20, stiffness: 150 });
    } catch (error) {
      console.warn('Previous animation error:', error);
      gestureInProgressRef.current = false;
      goToPreviousImageSafe();
    }
  };

  const goToNextImageWithAnimation = () => {
    if (!isMountedRef.current || images.length <= 1 || gestureInProgressRef.current) return;
    
    gestureInProgressRef.current = true;
    
    try {
      // Immediate navigation without complex animation callbacks
      goToNextImageSafe();
      
      // Simple slide animation
      translateX.value = withSpring(0, { damping: 20, stiffness: 150 }, () => {
        'worklet';
        if (isMountedRef.current) {
          runOnJS(() => {
            gestureInProgressRef.current = false;
          })();
        }
      });
      scale.value = withSpring(1, { damping: 20, stiffness: 150 });
      opacity.value = withSpring(1, { damping: 20, stiffness: 150 });
    } catch (error) {
      console.warn('Next animation error:', error);
      gestureInProgressRef.current = false;
      goToNextImageSafe();
    }
  };

  // Enhanced gesture handlers with bulletproof error handling
  const panGesture = Gesture.Pan()
    .onStart(() => {
      'worklet';
      if (!isMountedRef.current || images.length <= 1 || gestureInProgressRef.current) return;
      
      try {
        runOnJS(safeSetState)(() => setIsGestureActive(true));
      } catch (error) {
        console.warn('Gesture start error:', error);
      }
    })
    .onUpdate((event) => {
      'worklet';
      if (!isMountedRef.current || images.length <= 1 || !event || gestureInProgressRef.current) return;
      
      try {
        // Only handle horizontal swipes
        if (Math.abs(event.translationY) > Math.abs(event.translationX)) {
          return;
        }
        
        // Limit translation to screen width
        const limitedTranslationX = Math.max(-screenWidth, Math.min(screenWidth, event.translationX));
        translateX.value = limitedTranslationX;
        
        // Add subtle visual feedback
        const progress = Math.abs(limitedTranslationX) / screenWidth;
        scale.value = interpolate(progress, [0, 0.5], [1, 0.95], 'clamp');
        opacity.value = interpolate(progress, [0, 0.3], [1, 0.8], 'clamp');
      } catch (error) {
        console.warn('Gesture update error:', error);
        // Reset to safe state
        translateX.value = 0;
        scale.value = 1;
        opacity.value = 1;
      }
    })
    .onEnd((event) => {
      'worklet';
      if (!isMountedRef.current || gestureInProgressRef.current) {
        // Always reset to safe state
        translateX.value = withSpring(0);
        scale.value = withSpring(1);
        opacity.value = withSpring(1);
        runOnJS(safeSetState)(() => setIsGestureActive(false));
        return;
      }

      if (images.length <= 1 || !event) {
        // Safe fallback reset
        translateX.value = withSpring(0);
        scale.value = withSpring(1);
        opacity.value = withSpring(1);
        runOnJS(safeSetState)(() => setIsGestureActive(false));
        return;
      }
      
      try {
        const shouldNavigate = Math.abs(event.translationX) > SWIPE_THRESHOLD;
        
        if (shouldNavigate) {
          if (event.translationX > 0) {
            runOnJS(goToPreviousImageWithAnimation)();
          } else {
            runOnJS(goToNextImageWithAnimation)();
          }
        } else {
          // Return to original position
          translateX.value = withSpring(0);
          scale.value = withSpring(1);
          opacity.value = withSpring(1);
        }
        
        runOnJS(safeSetState)(() => setIsGestureActive(false));
      } catch (error) {
        console.warn('Gesture end error:', error);
        // Critical fallback
        translateX.value = withSpring(0);
        scale.value = withSpring(1);
        opacity.value = withSpring(1);
        runOnJS(safeSetState)(() => setIsGestureActive(false));
      }
    })
    .onFinalize(() => {
      'worklet';
      // Ensure we ALWAYS reset gesture state
      runOnJS(safeSetState)(() => setIsGestureActive(false));
      gestureInProgressRef.current = false;
    });

  const handleSave = async () => {
    if (!title.trim() && !content.trim()) {
      Alert.alert('Error', 'Please add a title or content to save the note.');
      return;
    }

    try {
      const newNoteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'> = {
        title: title.trim() || 'Untitled Note',
        content: content.trim(),
        images,
        audioRecordings,
        isFavorite: false,
        tags: [],
      };

      await createNote(newNoteData);
      
      // Show success notification
      showSuccessNotification();
      
      // Clear form for next note
      clearForm();
      
    } catch (error) {
      Alert.alert('Error', 'Failed to save note. Please try again.');
    }
  };

  const handleImagePicked = (imageUri: string) => {
    setImages(prev => [...prev, imageUri]);
  };

  const handleAudioRecorded = (audioUri: string) => {
    setAudioRecordings(prev => [...prev, audioUri]);
  };

  const removeImage = (index: number) => {
    setImages(prev => {
      const newImages = prev.filter((_, i) => i !== index);
      
      // Adjust selected index if necessary
      if (selectedImageIndex >= newImages.length && newImages.length > 0) {
        setSelectedImageIndex(newImages.length - 1);
      } else if (newImages.length === 0) {
        setSelectedImageIndex(0);
      }
      
      return newImages;
    });
    
    // Clear loading state for removed image
    setImageLoadingStates(prev => {
      const newStates = { ...prev };
      delete newStates[index];
      return newStates;
    });
  };

  const removeAudio = (index: number) => {
    setAudioRecordings(prev => prev.filter((_, i) => i !== index));
  };

  // Enhanced image viewer functions
  const handleImagePress = (index: number) => {
    console.log('Image pressed:', index, 'URI:', images[index]);
    
    if (index < 0 || index >= images.length) {
      console.warn('Invalid image index:', index);
      return;
    }
    
    // Stop any ongoing animations
    try {
      cancelAnimation(translateX);
      cancelAnimation(scale);
      cancelAnimation(opacity);
    } catch (error) {
      console.warn('Animation cancel error:', error);
    }

    // Reset all states
    gestureInProgressRef.current = false;
    setIsGestureActive(false);
    setSelectedImageIndex(index);
    setIsImageViewerVisible(true);
    
    // Reset animation values safely
    translateX.value = 0;
    scale.value = 1;
    opacity.value = 1;
    
    // Hide status bar for iOS
    if (Platform.OS === 'ios') {
      StatusBar.setHidden(true, 'fade');
    }
  };

  const closeImageViewer = () => {
    setIsImageViewerVisible(false);
    setIsGestureActive(false);
    gestureInProgressRef.current = false;
    
    // Critical cleanup with error handling
    try {
      cancelAnimation(translateX);
      cancelAnimation(scale);
      cancelAnimation(opacity);
      
      translateX.value = 0;
      scale.value = 1;
      opacity.value = 1;
    } catch (error) {
      console.warn('Animation cleanup error:', error);
    }
    
    // Show status bar again
    if (Platform.OS === 'ios') {
      StatusBar.setHidden(false, 'fade');
    }
  };

  const goToPreviousImage = () => {
    if (images.length <= 1 || gestureInProgressRef.current) return;
    goToPreviousImageSafe();
  };

  const goToNextImage = () => {
    if (images.length <= 1 || gestureInProgressRef.current) return;
    goToNextImageSafe();
  };

  const handleImageLoadStart = (index: number) => {
    setImageLoadingStates(prev => ({ ...prev, [index]: true }));
  };

  const handleImageLoadEnd = (index: number) => {
    setImageLoadingStates(prev => ({ ...prev, [index]: false }));
  };

  const handleImageError = (index: number) => {
    console.error('Image load error for index:', index);
    setImageLoadingStates(prev => ({ ...prev, [index]: false }));
    Alert.alert('Error', 'Failed to load image');
  };

  // Safe animated styles with comprehensive error handling
  const animatedImageStyle = useAnimatedStyle(() => {
    try {
      return {
        transform: [
          { translateX: translateX.value || 0 },
          { scale: scale.value || 1 }
        ],
        opacity: opacity.value || 1,
      };
    } catch (error) {
      console.warn('Animated style error:', error);
      // Safe fallback values
      return {
        transform: [
          { translateX: 0 },
          { scale: 1 }
        ],
        opacity: 1,
      };
    }
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Success Message */}
      {showSuccessMessage && (
        <View style={styles.successMessageContainer}>
          <View style={styles.successMessage}>
            <CheckCircle size={20} color="#34C759" />
            <Text style={styles.successMessageText}>Note saved successfully!</Text>
          </View>
        </View>
      )}

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Create Note</Text>
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Save size={20} color="#FFFFFF" />
          )}
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
                contentContainerStyle={styles.imageScrollContent}
              >
                {images.map((uri, index) => (
                  <View key={`${uri}-${index}`} style={styles.imageWrapper}>
                    <TouchableOpacity
                      onPress={() => handleImagePress(index)}
                      activeOpacity={0.7}
                      style={styles.imageButton}
                    >
                      <Image 
                        source={{ uri }} 
                        style={styles.imagePreview}
                        onLoadStart={() => handleImageLoadStart(index)}
                        onLoadEnd={() => handleImageLoadEnd(index)}
                        onError={() => handleImageError(index)}
                        resizeMode="cover"
                      />
                      
                      {/* Loading Indicator */}
                      {imageLoadingStates[index] && (
                        <View style={styles.imageLoadingOverlay}>
                          <ActivityIndicator size="small" color="#007AFF" />
                        </View>
                      )}
                      
                      {/* Image Number Badge */}
                      <View style={styles.imageNumberBadge}>
                        <Text style={styles.imageNumberText}>{index + 1}</Text>
                      </View>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeImage(index)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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

      {/* Enhanced Full Screen Image Viewer Modal with Safe Rendering */}
      <Modal
        visible={isImageViewerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeImageViewer}
        statusBarTranslucent={true}
        presentationStyle="overFullScreen"
      >
        <View style={styles.imageViewer}>
          {/* Header Controls */}
          <View style={styles.imageViewerHeader}>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={closeImageViewer}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <X size={28} color="#FFFFFF" />
            </TouchableOpacity>
            
            <Text style={styles.imageCounter}>
              {selectedImageIndex + 1} / {images.length}
            </Text>
            
            {/* Swipe indicator */}
            {images.length > 1 && (
              <Text style={styles.swipeHint}>Swipe to navigate</Text>
            )}
          </View>

          {/* Main Image Display with Enhanced Safety */}
          {images.length > 0 && 
           selectedImageIndex >= 0 && 
           selectedImageIndex < images.length && 
           images[selectedImageIndex] && (
            <GestureDetector gesture={panGesture}>
              <Animated.View style={[styles.imageViewerContent, animatedImageStyle]}>
                <TouchableOpacity 
                  style={styles.imageViewerContentTouch}
                  activeOpacity={1}
                  onPress={!isGestureActive && !gestureInProgressRef.current ? closeImageViewer : undefined}
                >
                  <Image 
                    source={{ uri: images[selectedImageIndex] }} 
                    style={styles.fullScreenImage}
                    resizeMode="contain"
                    onError={(error) => {
                      console.warn('Full screen image error:', error);
                    }}
                  />
                </TouchableOpacity>
              </Animated.View>
            </GestureDetector>
          )}

          {/* Navigation Controls - Enhanced with Safety Checks */}
          {images.length > 1 && !gestureInProgressRef.current && (
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

          {/* Image Indicators with Safety Checks */}
          {images.length > 1 && (
            <View style={styles.imageIndicators}>
              {images.map((_, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.indicator,
                    selectedImageIndex === index && styles.activeIndicator
                  ]}
                  onPress={() => !gestureInProgressRef.current && safeSetSelectedImageIndex(index)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                />
              ))}
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  successMessageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: 20,
  },
  successMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  successMessageText: {
    color: '#15803D',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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
    marginBottom: 12,
  },
  imageScrollView: {
    flexGrow: 0,
  },
  imageScrollContent: {
    paddingHorizontal: 4,
  },
  imageWrapper: {
    position: 'relative',
    marginHorizontal: 6,
  },
  imageButton: {
    position: 'relative',
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  imageLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  imageNumberBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  imageNumberText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  removeImageButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FF3B30',
    borderRadius: 14,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
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
  // Enhanced Image Viewer Styles
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
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: 20,
    paddingBottom: 20,
    zIndex: 100,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  closeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  imageCounter: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  swipeHint: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '400',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  imageViewerContent: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerContentTouch: {
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
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 90,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  navButtonLeft: {
    left: 20,
  },
  navButtonRight: {
    right: 20,
  },
  imageIndicators: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 60 : 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  indicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 5,
  },
  activeIndicator: {
    backgroundColor: '#FFFFFF',
    width: 12,
    height: 12,
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
});