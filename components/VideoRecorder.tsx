import React, { useState, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';
import { Video, VideoView, Circle, Square } from 'lucide-react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { VideoService } from '../services/videoService';

const { width } = Dimensions.get('window');

interface VideoRecorderProps {
  onVideoRecorded: (videoUri: string) => void;
  isRecording: boolean;
  onRecordingStateChange: (isRecording: boolean) => void;
}

export function VideoRecorder({
  onVideoRecorded,
  isRecording,
  onRecordingStateChange,
}: VideoRecorderProps) {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [recordingDuration, setRecordingDuration] = useState(0);
  const cameraRef = useRef<CameraView>(null);
  const durationInterval = useRef<number | null>(null);

  const requestPermissions = async () => {
    try {
      if (!permission?.granted) {
        const result = await requestPermission();
        return result.granted;
      }
      return true;
    } catch (error) {
      console.error('Failed to request camera permission:', error);
      return false;
    }
  };

  const startRecording = async () => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        Alert.alert('Permission Required', 'Please grant camera access to record videos');
        return;
      }

      if (!cameraRef.current) {
        Alert.alert('Error', 'Camera not ready');
        return;
      }

      const videoRecording = await cameraRef.current.recordAsync({
        maxDuration: 300, // 5 minutes max
        quality: '720p',
      });

      if (videoRecording?.uri) {
        try {
          const persistentUri = await VideoService.moveVideoToPersistentStorage(videoRecording.uri);
          onVideoRecorded(persistentUri);
        } catch (error) {
          console.error('Failed to save video:', error);
          Alert.alert('Error', 'Failed to save video recording');
          return;
        }
      }

      onRecordingStateChange(true);
      setRecordingDuration(0);

      // Start duration timer
      durationInterval.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (error) {
      console.error('Failed to start video recording:', error);
      Alert.alert('Error', 'Failed to start video recording');
    }
  };

  const stopRecording = async () => {
    try {
      if (!cameraRef.current) return;

      await cameraRef.current.stopRecording();
      
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
      console.error('Failed to stop video recording:', error);
      Alert.alert('Error', 'Failed to stop video recording');
    }
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!permission) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Camera access is required to record videos</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
          mode="video"
        >
          <View style={styles.cameraOverlay}>
            {/* Camera Controls */}
            <View style={styles.topControls}>
              <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
                <Text style={styles.flipButtonText}>Flip</Text>
              </TouchableOpacity>
              {isRecording && (
                <View style={styles.recordingIndicator}>
                  <Circle size={8} color="#FF3B30" fill="#FF3B30" />
                  <Text style={styles.recordingText}>REC {formatDuration(recordingDuration)}</Text>
                </View>
              )}
            </View>

            {/* Bottom Controls */}
            <View style={styles.bottomControls}>
              <TouchableOpacity
                style={[
                  styles.recordButton,
                  isRecording && styles.recordButtonActive,
                ]}
                onPress={isRecording ? stopRecording : startRecording}
              >
                {isRecording ? (
                  <Square size={30} color="#FFFFFF" />
                ) : (
                  <Circle size={30} color="#FFFFFF" fill="#FF3B30" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </CameraView>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          {isRecording ? 'Recording video...' : 'Tap the red button to start recording'}
        </Text>
        <Text style={styles.hintText}>
          Maximum recording time: 5 minutes
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  permissionContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginVertical: 8,
  },
  permissionText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 12,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cameraContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  camera: {
    width: width - 64,
    height: (width - 64) * 0.75, // 4:3 aspect ratio
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  flipButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  flipButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recordingText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
    fontFamily: 'monospace',
  },
  bottomControls: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  recordButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButtonActive: {
    backgroundColor: 'rgba(255, 59, 48, 0.8)',
  },
  infoContainer: {
    alignItems: 'center',
  },
  infoText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    textAlign: 'center',
  },
  hintText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
}); 