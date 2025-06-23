import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Play, Pause, SkipBack, SkipForward, Volume2, Trash2 } from 'lucide-react-native';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  interpolate,
} from 'react-native-reanimated';

interface AudioPlayerProps {
  uri: string;
  index: number;
  onDelete: (index: number) => void;
}

export function AudioPlayer({ uri, index, onDelete }: AudioPlayerProps) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const progressValue = useSharedValue(0);
  const playbackStatusRef = useRef<any>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const isProcessingRef = useRef(false);
  const isMountedRef = useRef(true);
  const currentUriRef = useRef<string>('');

  // 🔧 FIX: Auto-load audio when component mounts or URI changes
  useEffect(() => {
    isMountedRef.current = true;
    
    if (uri && uri !== currentUriRef.current) {
      currentUriRef.current = uri;
      loadAudio();
    }
    
    return () => {
      isMountedRef.current = false;
      cleanupAudio();
    };
  }, [uri]);

  // 🔧 FIX: Proper cleanup and state reset
  const cleanupAudio = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      if (isMountedRef.current) {
        setSound(null);
        setIsLoaded(false);
        setIsPlaying(false);
        setPosition(0);
        setDuration(0);
        progressValue.value = 0;
      }
    } catch (error) {
      console.warn('Audio cleanup error:', error);
    }
  };

  const resetAudioState = () => {
    if (!isMountedRef.current) return;
    
    setIsPlaying(false);
    setIsLoading(false);
    setPosition(0);
    setDuration(0);
    setIsLoaded(false);
    setHasError(false);
    progressValue.value = 0;
    isProcessingRef.current = false;
  };

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // 🔧 FIX: Improved audio loading with better error handling
  const loadAudio = async () => {
    if (isProcessingRef.current || !isMountedRef.current || !uri) return;
    
    try {
      isProcessingRef.current = true;
      setIsLoading(true);
      setHasError(false);
      
      console.log('Loading audio:', uri);
      
      // Cleanup existing sound first
      await cleanupAudio();

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Load the sound
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri },
        { 
          shouldPlay: false,
          progressUpdateIntervalMillis: 100,
          positionMillis: 0
        },
        onPlaybackStatusUpdate
      );

      if (!isMountedRef.current) {
        await newSound.unloadAsync();
        return;
      }

      setSound(newSound);
      soundRef.current = newSound;
      setIsLoaded(true);
      
      console.log('Audio loaded successfully');

    } catch (error) {
      console.error('Error loading audio:', error);
      if (isMountedRef.current) {
        setHasError(true);
        resetAudioState();
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        isProcessingRef.current = false;
      }
    }
  };

  // 🔧 FIX: Enhanced playback status handling
  const onPlaybackStatusUpdate = (status: any) => {
    if (!isMountedRef.current) return;
    
    playbackStatusRef.current = status;
    
    if (status.isLoaded) {
      const currentDuration = status.durationMillis || 0;
      const currentPosition = status.positionMillis || 0;
      const currentPlaying = status.isPlaying || false;

      setDuration(currentDuration);
      setPosition(currentPosition);
      setIsPlaying(currentPlaying);

      // Update progress animation
      if (currentDuration > 0) {
        const progress = currentPosition / currentDuration;
        progressValue.value = withTiming(progress, { duration: 100 });
      }

      // Handle audio completion
      if (status.didJustFinish) {
        handleAudioEnded();
      }
    } else if (status.error) {
      console.error('Audio playback error:', status.error);
      if (isMountedRef.current) {
        setHasError(true);
        resetAudioState();
      }
    }
  };

  // 🔧 FIX: Improved audio end handling
  const handleAudioEnded = () => {
    if (!isMountedRef.current) return;
    
    console.log('Audio ended, resetting...');
    
    setIsPlaying(false);
    setPosition(0);
    progressValue.value = withTiming(0, { duration: 300 });
    
    // Reset audio position for next play
    if (soundRef.current) {
      soundRef.current.setPositionAsync(0).catch(error => {
        console.warn('Error resetting audio position:', error);
      });
    }
  };

  // 🔧 FIX: Simplified and more reliable play/pause
  const handlePlayPause = async () => {
    if (isProcessingRef.current || !isMountedRef.current) return;
    
    try {
      isProcessingRef.current = true;

      // If not loaded, try to load first
      if (!isLoaded || !soundRef.current) {
        console.log('Audio not loaded, loading now...');
        await loadAudio();
        
        // Wait a bit for loading to complete
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (!isLoaded || !soundRef.current) {
          console.error('Failed to load audio');
          setHasError(true);
          return;
        }
      }

      // Add haptic feedback
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      const currentStatus = playbackStatusRef.current;
      
      if (isPlaying) {
        console.log('Pausing audio...');
        await soundRef.current.pauseAsync();
      } else {
        console.log('Playing audio...');
        
        // If at end, restart from beginning
        if (currentStatus?.positionMillis >= currentStatus?.durationMillis) {
          await soundRef.current.setPositionAsync(0);
        }
        
        await soundRef.current.playAsync();
      }
    } catch (error) {
      console.error('Error playing/pausing audio:', error);
      if (isMountedRef.current) {
        setHasError(true);
        resetAudioState();
      }
    } finally {
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 300);
    }
  };

  const handleSeek = async (progress: number) => {
    if (!soundRef.current || !duration || isProcessingRef.current) return;

    try {
      const seekPosition = Math.max(0, Math.min(duration, progress * duration));
      await soundRef.current.setPositionAsync(seekPosition);
      
      if (isMountedRef.current) {
        setPosition(seekPosition);
        progressValue.value = withTiming(progress, { duration: 100 });
      }
    } catch (error) {
      console.error('Error seeking audio:', error);
    }
  };

  const handleSkipBackward = async () => {
    if (isProcessingRef.current) return;
    
    const newPosition = Math.max(0, position - 10000); // 10 seconds back
    const progress = duration > 0 ? newPosition / duration : 0;
    await handleSeek(progress);
  };

  const handleSkipForward = async () => {
    if (isProcessingRef.current) return;
    
    const newPosition = Math.min(duration, position + 10000); // 10 seconds forward
    const progress = duration > 0 ? newPosition / duration : 0;
    await handleSeek(progress);
  };

  const handleDelete = () => {
    if (isProcessingRef.current) return;
    
    cleanupAudio();
    onDelete(index);
  };

  // Animated progress bar style
  const progressBarStyle = useAnimatedStyle(() => {
    const width = interpolate(progressValue.value, [0, 1], [0, 100]);
    return {
      width: `${width}%`,
    };
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Volume2 size={16} color="#007AFF" />
          <Text style={styles.title}>Recording {index + 1}</Text>
          {hasError && (
            <Text style={styles.errorText}>(Error loading)</Text>
          )}
          {isLoading && (
            <Text style={styles.loadingText}>(Loading...)</Text>
          )}
        </View>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
          <Trash2 size={16} color="#FF3B30" />
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <TouchableOpacity
          style={styles.progressBarTouch}
          onPress={(event) => {
            if (isLoaded && duration > 0) {
              const { locationX } = event.nativeEvent;
              const progressBarWidth = 250;
              const progress = Math.max(0, Math.min(1, locationX / progressBarWidth));
              handleSeek(progress);
            }
          }}
          activeOpacity={0.8}
          disabled={!isLoaded || isLoading}
        >
          <View style={styles.progressBar}>
            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressFill, progressBarStyle]} />
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Time Display */}
      <View style={styles.timeContainer}>
        <Text style={styles.timeText}>{formatTime(position)}</Text>
        <Text style={styles.timeText}>{formatTime(duration)}</Text>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlButton, (!isLoaded || isLoading) && styles.controlButtonDisabled]}
          onPress={handleSkipBackward}
          disabled={!isLoaded || isLoading || isProcessingRef.current}
        >
          <SkipBack size={20} color={!isLoaded || isLoading ? '#9CA3AF' : '#007AFF'} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.playButton, 
            (isLoading || hasError) && styles.playButtonDisabled,
          ]}
          onPress={handlePlayPause}
          disabled={isLoading || hasError}
        >
          {isLoading ? (
            <Text style={styles.loadingIcon}>⏳</Text>
          ) : hasError ? (
            <Text style={styles.errorIcon}>⚠</Text>
          ) : isPlaying ? (
            <Pause size={24} color="#FFFFFF" />
          ) : (
            <Play size={24} color="#FFFFFF" />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, (!isLoaded || isLoading) && styles.controlButtonDisabled]}
          onPress={handleSkipForward}
          disabled={!isLoaded || isLoading || isProcessingRef.current}
        >
          <SkipForward size={20} color={!isLoaded || isLoading ? '#9CA3AF' : '#007AFF'} />
        </TouchableOpacity>
      </View>
      
      {/* Debug Info (remove in production) */}
      {__DEV__ && (
        <Text style={styles.debugText}>
          URI: {uri ? 'Valid' : 'Missing'} | 
          Loaded: {isLoaded ? 'Yes' : 'No'} | 
          Error: {hasError ? 'Yes' : 'No'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginLeft: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginLeft: 8,
    fontStyle: 'italic',
  },
  loadingText: {
    fontSize: 12,
    color: '#007AFF',
    marginLeft: 8,
    fontStyle: 'italic',
  },
  deleteButton: {
    padding: 4,
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressBarTouch: {
    height: 32,
    justifyContent: 'center',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressTrack: {
    height: '100%',
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  timeText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'monospace',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButton: {
    padding: 8,
    marginHorizontal: 8,
  },
  controlButtonDisabled: {
    opacity: 0.5,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  playButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  loadingIcon: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  errorIcon: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  debugText: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
});