import React, { useState, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { Mic, MicOff, Square } from 'lucide-react-native';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system';

interface AudioRecorderProps {
  onAudioRecorded: (audioUri: string) => void;
  isRecording: boolean;
  onRecordingStateChange: (isRecording: boolean) => void;
}

export function AudioRecorder({
  onAudioRecorded,
  isRecording,
  onRecordingStateChange,
}: AudioRecorderProps) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const durationInterval = useRef<number | null>(null);

  const requestPermissions = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      return permission.status === 'granted';
    } catch (error) {
      console.error('Failed to request audio permission:', error);
      return false;
    }
  };

  const createPersistentAudioDirectory = async () => {
    const audioDir = `${FileSystem.documentDirectory}audio/`;
    const dirInfo = await FileSystem.getInfoAsync(audioDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(audioDir, { intermediates: true });
    }
    return audioDir;
  };

  const moveAudioToPersistentStorage = async (tempUri: string) => {
    try {
      const audioDir = await createPersistentAudioDirectory();
      const fileName = `audio_${Date.now()}_${Math.random().toString(36).substring(7)}.m4a`;
      const persistentUri = `${audioDir}${fileName}`;

      await FileSystem.copyAsync({
        from: tempUri,
        to: persistentUri,
      });

      return persistentUri;
    } catch (error) {
      console.error('Failed to move audio to persistent storage:', error);
      throw error;
    }
  };

  const startRecording = async () => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        Alert.alert('Permission Required', 'Please grant microphone access');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );

      setRecording(newRecording);
      onRecordingStateChange(true);
      setRecordingDuration(0);

      // Start duration timer
      durationInterval.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;

      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      const tempUri = recording.getURI();
      if (tempUri) {
        try {
          // Move audio file to persistent storage
          const persistentUri = await moveAudioToPersistentStorage(tempUri);
          onAudioRecorded(persistentUri);
        } catch (error) {
          console.error('Failed to save audio to persistent storage:', error);
          Alert.alert('Error', 'Failed to save audio recording');
          return;
        }
      }

      setRecording(null);
      onRecordingStateChange(false);
      setRecordingDuration(0);

      // Clear duration timer
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
        durationInterval.current = null;
      }

      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to stop recording');
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.recordButton, isRecording && styles.recordButtonActive]}
        onPress={isRecording ? stopRecording : startRecording}
      >
        {isRecording ? (
          <Square size={24} color="#FFFFFF" />
        ) : (
          <Mic size={24} color="#FFFFFF" />
        )}
      </TouchableOpacity>

      <View style={styles.recordingInfo}>
        <Text style={styles.recordingText}>
          {isRecording ? 'Recording...' : 'Tap to record audio'}
        </Text>
        {isRecording && (
          <Text style={styles.durationText}>
            {formatDuration(recordingDuration)}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  recordButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recordButtonActive: {
    backgroundColor: '#34C759',
  },
  recordingInfo: {
    flex: 1,
  },
  recordingText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  durationText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
    fontFamily: 'monospace',
  },
});
