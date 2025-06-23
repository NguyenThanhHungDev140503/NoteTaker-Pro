import React, { useState, useEffect, useRef } from 'react';
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
  Platform,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Star, Share, Pencil, Calendar, Camera, Mic, Play, X, ChevronLeft, ChevronRight, Save, Circle as XCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Note } from '@/types/note';
import { useNote } from '@/contexts/NotesContext';
import { AudioPlayer } from '@/components/AudioPlayer';
import { MediaPicker } from '@/components/MediaPicker';
import { AudioRecorder } from '@/components/AudioRecorder';
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

export default function NoteDetailScreen() {
  const { noteId } = useLocalSearchParams<{ noteId: string }>();
  const { note, updateNote, toggleFavorite, isFavoriteLoading } = useNote(noteId || '');
  
  const [loading, setLoading] = useState(!note);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);
  const [isGestureActive, setIsGestureActive] = useState(false);
  
  // Edit mode state - FIXED: Ensure proper initialization
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [editedImages, setEditedImages] = useState<string[]>([]);
  const [editedAudioRecordings, setEditedAudioRecordings] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  // Component mounted ref (JS thread only)
  const isMountedRef = useRef(true);
  
  // Use shared values for all animation/gesture state
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const isAnimating = useSharedValue(false);
  const gestureActive = useSharedValue(false);

  // Component cleanup
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      
      // Reset StatusBar when component unmounts
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        StatusBar.setHidden(false);
      }
      
      // Cancel any running animations
      try {
        cancelAnimation(translateX);
        cancelAnimation(scale);
        cancelAnimation(opacity);
      } catch (error) {
        console.warn('Animation cleanup error:', error);
      }
    };
  }, []);

  // FIXED: Enhanced note data initialization with proper edit state reset
  useEffect(() => {
    if (note) {
      setLoading(false);
      
      // Initialize edit state with current note data
      setEditedTitle(note.title || '');
      setEditedContent(note.content || '');
      setEditedImages([...note.images]);
      setEditedAudioRecordings([...note.audioRecordings]);
      
      // CRITICAL FIX: Ensure edit mode is always reset when note loads
      if (isEditing) {
        console.log('Resetting edit mode on note load');
        setIsEditing(false);
      }
    }
  }, [note?.id, note?.title, note?.content]); // Track specific properties for proper updates

  // FIXED: Add debug effect to track edit state
  useEffect(() => {
    console.log('Edit state changed:', { 
      isEditing, 
      isSaving, 
      noteId: note?.id,
      hasNote: !!note 
    });
  }, [isEditing, isSaving, note?.id]);
  
  // Clean up animations function
  const resetAnimations = () => {
    if (!isMountedRef.current) return;
    
    try {
      cancelAnimation(translateX);
      cancelAnimation(scale);
      cancelAnimation(opacity);
      
      translateX.value = 0;
      scale.value = 1;
      opacity.value = 1;
      isAnimating.value = false;
      gestureActive.value = false;
    } catch (error) {
      console.warn('Reset animations error:', error);
    }
  };

  // Gesture handlers
  const panGesture = Gesture.Pan()
    .onStart(() => {
      'worklet';
      if (isAnimating.value) return;
      
      gestureActive.value = true;
      runOnJS(setIsGestureActive)(true);
    })
    .onUpdate((event) => {
      'worklet';
      if (isAnimating.value || !event || !note?.images?.length || note.images.length <= 1) return;
      
      try {
        // Only handle horizontal swipes
        if (Math.abs(event.translationY) > Math.abs(event.translationX)) {
          return;
        }
        
        // Limit translation to prevent extreme values
        const limitedTranslationX = Math.max(-screenWidth, Math.min(screenWidth, event.translationX));
        translateX.value = limitedTranslationX;
        
        // Add subtle scale effect during swipe
        const progress = Math.abs(limitedTranslationX) / screenWidth;
        scale.value = interpolate(progress, [0, 0.5], [1, 0.95], 'clamp');
        opacity.value = interpolate(progress, [0, 0.3], [1, 0.8], 'clamp');
      } catch (error) {
        // Just reset on any error
        translateX.value = 0;
        scale.value = 1;
        opacity.value = 1;
      }
    })
    .onEnd((event) => {
      'worklet';
      if (isAnimating.value || !note?.images?.length || note.images.length <= 1) {
        gestureActive.value = false;
        runOnJS(setIsGestureActive)(false);
        return;
      }
      
      try {
        const shouldNavigate = Math.abs(event.translationX) > SWIPE_THRESHOLD;
        
        if (shouldNavigate) {
          isAnimating.value = true;
          if (event.translationX > 0) {
            // Swipe right - go to previous image
            runOnJS(handlePreviousImage)();
          } else {
            // Swipe left - go to next image
            runOnJS(handleNextImage)();
          }
        } else {
          // Return to original position
          translateX.value = withSpring(0);
          scale.value = withSpring(1);
          opacity.value = withSpring(1);
        }
      } catch (error) {
        console.warn('Gesture end error:', error);
        // Reset on error
        translateX.value = 0;
        scale.value = 1;
        opacity.value = 1;
      }
      
      gestureActive.value = false;
      runOnJS(setIsGestureActive)(false);
    })
    .onFinalize(() => {
      'worklet';
      // Always reset gesture state
      gestureActive.value = false;
      runOnJS(setIsGestureActive)(false);
    });

  const handleToggleFavorite = async () => {
    if (!note || isFavoriteLoading) return;
    
    try {
      await toggleFavorite();
      
      // Visual feedback
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      
    } catch (error) {
      // Error is already handled in the context
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

  // FIXED: Enhanced edit toggle with better state management
  const handleEditToggle = () => {
    console.log('Edit toggle clicked, current state:', { isEditing, isSaving });
    
    if (isSaving) {
      console.log('Cannot toggle edit mode while saving');
      return;
    }

    if (isEditing) {
      // Cancel editing - Check if there are unsaved changes
      const hasChanges = 
        editedTitle !== (note?.title || '') ||
        editedContent !== (note?.content || '') ||
        JSON.stringify(editedImages) !== JSON.stringify(note?.images || []) ||
        JSON.stringify(editedAudioRecordings) !== JSON.stringify(note?.audioRecordings || []);

      console.log('Has unsaved changes:', hasChanges);

      if (hasChanges) {
        Alert.alert(
          'Discard Changes',
          'You have unsaved changes. Are you sure you want to discard them?',
          [
            { text: 'Keep Editing', style: 'cancel' },
            { 
              text: 'Discard Changes', 
              style: 'destructive',
              onPress: () => {
                console.log('Discarding changes and exiting edit mode');
                // Reset edited data to original
                if (note) {
                  setEditedTitle(note.title || '');
                  setEditedContent(note.content || '');
                  setEditedImages([...note.images]);
                  setEditedAudioRecordings([...note.audioRecordings]);
                }
                setIsEditing(false);
              }
            },
          ]
        );
      } else {
        // No changes, safe to exit
        console.log('No changes, exiting edit mode');
        setIsEditing(false);
      }
    } else {
      // Start editing
      console.log('Starting edit mode');
      setIsEditing(true);
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };

  // FIXED: Enhanced save function with better state management
  const handleSaveChanges = async () => {
    if (!note || isSaving) {
      console.log('Cannot save:', { hasNote: !!note, isSaving });
      return;
    }

    console.log('Starting save process');

    try {
      setIsSaving(true);

      const updates = {
        title: editedTitle.trim() || 'Untitled Note',
        content: editedContent.trim(),
        images: editedImages,
        audioRecordings: editedAudioRecordings,
      };

      console.log('Saving updates:', updates);
      await updateNote(updates);
      
      console.log('Save successful, resetting edit state');
      
      // CRITICAL FIX: Reset editing state immediately after successful save
      setIsEditing(false);
      
      // Then provide feedback
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Delayed alert to ensure state update completes
      setTimeout(() => {
        if (isMountedRef.current) {
          Alert.alert('Success', 'Note updated successfully!');
        }
      }, 150);

    } catch (error) {
      console.error('Save error:', error);
      if (isMountedRef.current) {
        Alert.alert('Error', 'Failed to save changes. Please try again.');
      }
    } finally {
      console.log('Save process complete, resetting isSaving');
      if (isMountedRef.current) {
        setIsSaving(false);
      }
    }
  };

  // Safe index validation
  const safeSetSelectedImageIndex = (newIndex: number) => {
    if (!isMountedRef.current || !note?.images?.length) return;
    
    const safeIndex = Math.max(0, Math.min(newIndex, note.images.length - 1));
    setSelectedImageIndex(safeIndex);
  };

  const handleImagePress = (index: number) => {
    if (!isMountedRef.current || !note?.images?.length || index < 0 || index >= note.images.length) {
      console.warn('Invalid image index:', index);
      return;
    }
    
    safeSetSelectedImageIndex(index);
    setIsImageViewerVisible(true);
    
    // Hide status bar
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      StatusBar.setHidden(true);
    }
    
    // Reset animation values
    resetAnimations();
  };

  const closeImageViewer = () => {
    if (!isMountedRef.current || gestureActive.value) return; // Don't close during gesture
    
    setIsImageViewerVisible(false);
    
    // Restore status bar
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      StatusBar.setHidden(false);
    }
    
    // Reset animation values
    resetAnimations();
  };

  const goToPreviousImage = () => {
    if (!isMountedRef.current || !note?.images?.length) return;
    safeSetSelectedImageIndex(
      selectedImageIndex > 0 ? selectedImageIndex - 1 : note.images.length - 1
    );
  };

  const goToNextImage = () => {
    if (!isMountedRef.current || !note?.images?.length) return;
    safeSetSelectedImageIndex(
      selectedImageIndex < note.images.length - 1 ? selectedImageIndex + 1 : 0
    );
  };

  // Safer animation functions without complex callbacks
  const handlePreviousImage = () => {
    if (!isMountedRef.current || !note?.images?.length) return;
    
    // Update index directly first
    goToPreviousImage();
    
    // Then animate with simple spring
    try {
      setTimeout(() => {
        if (isMountedRef.current) {
          translateX.value = screenWidth;
          translateX.value = withSpring(0, {
            damping: 20,
            stiffness: 90
          });
          scale.value = withSpring(1);
          opacity.value = withSpring(1);
          
          // Reset animation flag after animation completes
          setTimeout(() => {
            if (isMountedRef.current) {
              isAnimating.value = false;
            }
          }, 300);
        }
      }, 50);
    } catch (error) {
      console.warn('Animation error:', error);
      isAnimating.value = false;
    }
  };

  const handleNextImage = () => {
    if (!isMountedRef.current || !note?.images?.length) return;
    
    // Update index directly first
    goToNextImage();
    
    // Then animate with simple spring
    try {
      setTimeout(() => {
        if (isMountedRef.current) {
          translateX.value = -screenWidth;
          translateX.value = withSpring(0, {
            damping: 20,
            stiffness: 90
          });
          scale.value = withSpring(1);
          opacity.value = withSpring(1);
          
          // Reset animation flag after animation completes
          setTimeout(() => {
            if (isMountedRef.current) {
              isAnimating.value = false;
            }
          }, 300);
        }
      }, 50);
    } catch (error) {
      console.warn('Animation error:', error);
      isAnimating.value = false;
    }
  };

  // Edit mode handlers
  const handleImagePicked = (imageUri: string) => {
    setEditedImages(prev => [...prev, imageUri]);
  };

  const handleAudioRecorded = (audioUri: string) => {
    setEditedAudioRecordings(prev => [...prev, audioUri]);
  };

  const removeEditedImage = (index: number) => {
    setEditedImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeEditedAudio = (index: number) => {
    setEditedAudioRecordings(prev => prev.filter((_, i) => i !== index));
  };

  // Audio delete handler based on mode
  const handleDeleteAudio = (index: number) => {
    if (isEditing) {
      removeEditedAudio(index);
    } else {
      Alert.alert(
        'Cannot Delete',
        'Audio recordings cannot be deleted from the view mode. Please edit the note to remove recordings.',
        [{ text: 'OK' }]
      );
    }
  };

  // Animated styles with error handling
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
      // Silent error but return safe defaults
      return {
        transform: [
          { translateX: 0 },
          { scale: 1 }
        ],
        opacity: 1,
      };
    }
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
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

  // DEBUGGING: Add visual indicator for edit state (remove in production)
  const debugInfo = __DEV__ ? (
    <View style={styles.debugContainer}>
      <Text style={styles.debugText}>
        Edit Mode: {isEditing ? 'ON' : 'OFF'} | Saving: {isSaving ? 'YES' : 'NO'}
      </Text>
    </View>
  ) : null;

  return (
    <SafeAreaView style={styles.container}>
      {debugInfo}
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        
        <View style={styles.headerActions}>
          <TouchableOpacity 
            onPress={handleToggleFavorite} 
            style={[styles.headerAction, isFavoriteLoading && styles.headerActionDisabled]}
            disabled={isFavoriteLoading}
          >
            {isFavoriteLoading ? (
              <ActivityIndicator size="small" color="#FFD700" />
            ) : (
              <Star
                size={24}
                color={note.isFavorite ? '#FFD700' : '#9CA3AF'}
                fill={note.isFavorite ? '#FFD700' : 'transparent'}
              />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.headerAction}>
            <Share size={24} color="#9CA3AF" />
          </TouchableOpacity>
          
          {/* UPDATED: Enhanced edit button with Pencil icon */}
          {isEditing ? (
            <View style={styles.editActions}>
              <TouchableOpacity 
                style={[styles.cancelButton, isSaving && styles.disabledButton]}
                onPress={handleEditToggle}
                disabled={isSaving}
              >
                <XCircle size={20} color="#FF3B30" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.saveButton, isSaving && styles.disabledButton]}
                onPress={handleSaveChanges}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Save size={20} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.headerAction} 
              onPress={handleEditToggle}
              testID="edit-button"
            >
              <Pencil size={24} color="#007AFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Title */}
        {isEditing ? (
          <TextInput
            style={styles.titleInput}
            value={editedTitle}
            onChangeText={setEditedTitle}
            placeholder="Note title..."
            multiline
            autoFocus={false}
          />
        ) : (
          <Text style={styles.title}>{note.title || 'Untitled Note'}</Text>
        )}
        
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
        {isEditing ? (
          <TextInput
            style={styles.contentInput}
            value={editedContent}
            onChangeText={setEditedContent}
            placeholder="Start writing your note..."
            multiline
            textAlignVertical="top"
          />
        ) : (
          <Text style={styles.noteContent}>{note.content}</Text>
        )}

        {/* Images */}
        {(isEditing ? editedImages : note.images).length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Camera size={20} color="#007AFF" />
              <Text style={styles.sectionTitle}>
                Images ({(isEditing ? editedImages : note.images).length})
              </Text>
            </View>
            
            <View style={styles.imagesGrid}>
              {(isEditing ? editedImages : note.images).map((uri, index) => (
                <View key={index} style={styles.imageContainer}>
                  <TouchableOpacity
                    style={styles.imageButton}
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
                  
                  {isEditing && (
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeEditedImage(index)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <X size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Add Image in Edit Mode */}
        {isEditing && (
          <View style={styles.section}>
            <MediaPicker onImagePicked={handleImagePicked} />
          </View>
        )}

        {/* Audio Recordings with Enhanced Player */}
        {(isEditing ? editedAudioRecordings : note.audioRecordings).length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Mic size={20} color="#007AFF" />
              <Text style={styles.sectionTitle}>
                Audio Recordings ({(isEditing ? editedAudioRecordings : note.audioRecordings).length})
              </Text>
            </View>
            
            {(isEditing ? editedAudioRecordings : note.audioRecordings).map((uri, index) => (
              <AudioPlayer
                key={`${uri}-${index}`}
                uri={uri}
                index={index}
                onDelete={handleDeleteAudio}
              />
            ))}
          </View>
        )}

        {/* Add Audio in Edit Mode */}
        {isEditing && (
          <View style={styles.section}>
            <AudioRecorder
              onAudioRecorded={handleAudioRecorded}
              isRecording={isRecording}
              onRecordingStateChange={setIsRecording}
            />
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

      {/* Full Screen Image Viewer Modal with Swipe Gesture */}
      {isImageViewerVisible && note?.images && note.images.length > 0 && selectedImageIndex >= 0 && selectedImageIndex < note.images.length && (
        <Modal
          visible={isImageViewerVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={closeImageViewer}
          statusBarTranslucent={true}
          onDismiss={resetAnimations}
        >
          <StatusBar hidden={true} />
          <View style={styles.imageViewer}>
            {/* Header Controls */}
            <View style={styles.imageViewerHeader}>
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={closeImageViewer}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                disabled={isGestureActive}
              >
                <X size={28} color="#FFFFFF" />
              </TouchableOpacity>
              
              <Text style={styles.imageCounter}>
                {selectedImageIndex + 1} / {note.images.length}
              </Text>
              
              {/* Swipe indicator */}
              {note.images.length > 1 && (
                <Text style={styles.swipeHint}>Swipe to navigate</Text>
              )}
            </View>

            {/* Main Image Display with Gesture */}
            <GestureDetector gesture={panGesture}>
              <Animated.View style={[styles.imageViewerContent, animatedImageStyle]}>
                <TouchableOpacity 
                  style={styles.imageViewerContentTouch}
                  activeOpacity={1}
                  onPress={!isGestureActive ? closeImageViewer : undefined}
                >
                  <Image 
                    source={{ uri: note.images[selectedImageIndex] }} 
                    style={styles.fullScreenImage}
                    resizeMode="contain"
                    onError={(error) => console.warn('Image load error:', error.nativeEvent?.error || 'Unknown error')}
                  />
                </TouchableOpacity>
              </Animated.View>
            </GestureDetector>

            {/* Navigation Controls - Still available as backup */}
            {note.images.length > 1 && !isGestureActive && (
              <>
                <TouchableOpacity 
                  style={[styles.navButton, styles.navButtonLeft]} 
                  onPress={handlePreviousImage}
                  hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                  disabled={isGestureActive}
                >
                  <ChevronLeft size={32} color="#FFFFFF" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.navButton, styles.navButtonRight]} 
                  onPress={handleNextImage}
                  hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                  disabled={isGestureActive}
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
                    onPress={() => !isGestureActive && safeSetSelectedImageIndex(index)}
                    disabled={isGestureActive}
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
  debugContainer: {
    backgroundColor: '#FFF3CD',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#FFEAA7',
  },
  debugText: {
    fontSize: 12,
    color: '#856404',
    textAlign: 'center',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
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
    padding: 4,
  },
  headerActionDisabled: {
    opacity: 0.6,
  },
  editActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  cancelButton: {
    padding: 8,
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: '#34C759',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
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
  titleInput: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    lineHeight: 36,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#F9FAFB',
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
  contentInput: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginTop: 20,
    marginBottom: 32,
    minHeight: 200,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#F9FAFB',
    textAlignVertical: 'top',
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
  imageButton: {
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
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
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