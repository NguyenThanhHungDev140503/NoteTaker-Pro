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
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { MediaPicker } from '@/components/MediaPicker';
import { AudioRecorder } from '@/components/AudioRecorder';
import { noteService } from '@/services/noteService';
import { Note } from '@/types/note';

export default function CreateScreen() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [audioRecordings, setAudioRecordings] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
            <View style={styles.mediaGrid}>
              {images.map((uri, index) => (
                <View key={index} style={styles.mediaItem}>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeImage(index)}
                  >
                    <Trash2 size={16} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <AudioRecorder
            onAudioRecorded={handleAudioRecorded}
            isRecording={isRecording}
            onRecordingStateChange={setIsRecording}
          />

          {audioRecordings.length > 0 && (
            <View style={styles.audioList}>
              {audioRecordings.map((uri, index) => (
                <View key={index} style={styles.audioItem}>
                  <Text style={styles.audioText}>
                    Audio Recording {index + 1}
                  </Text>
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
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 12,
  },
  mediaItem: {
    position: 'relative',
    margin: 4,
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  audioList: {
    marginTop: 12,
  },
  audioItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  audioText: {
    fontSize: 14,
    color: '#374151',
  },
  removeAudioButton: {
    padding: 4,
  },
});