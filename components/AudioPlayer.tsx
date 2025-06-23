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

  const progressValue = useSharedValue(0);
  const playbackStatusRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const loadAudio = async () => {
    try {
      setIsLoading(true);
      
      // Unload existing sound if any
      if (sound) {
        await sound.unloadAsync();
      }

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
        { shouldPlay: false },
        onPlaybackStatusUpdate
      );

      setSound(newSound);
      setIsLoaded(true);
    } catch (error) {
      console.error('Error loading audio:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    playbackStatusRef.current = status;
    
    if (status.isLoaded) {
      setDuration(status.durationMillis || 0);
      setPosition(status.positionMillis || 0);
      setIsPlaying(status.isPlaying || false);

      // Update progress animation
      if (status.durationMillis && status.durationMillis > 0) {
        const progress = (status.positionMillis || 0) / status.durationMillis;
        progressValue.value = withTiming(progress, { duration: 100 });
      }

      // Auto-stop when finished
      if (status.didJustFinish) {
        setIsPlaying(false);
        setPosition(0);
        progressValue.value = withTiming(0, { duration: 200 });
      }
    }
  };

  const handlePlayPause = async () => {
    try {
      if (!isLoaded) {
        await loadAudio();
        return;
      }

      if (!sound) return;

      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
    } catch (error) {
      console.error('Error playing/pausing audio:', error);
    }
  };

  const handleSeek = async (progress: number) => {
    if (!sound || !duration) return;

    try {
      const seekPosition = progress * duration;
      await sound.setPositionAsync(seekPosition);
      setPosition(seekPosition);
      progressValue.value = progress;
    } catch (error) {
      console.error('Error seeking audio:', error);
    }
  };

  const handleSkipBackward = async () => {
    const newPosition = Math.max(0, position - 10000); // 10 seconds back
    const progress = duration > 0 ? newPosition / duration : 0;
    await handleSeek(progress);
  };

  const handleSkipForward = async () => {
    const newPosition = Math.min(duration, position + 10000); // 10 seconds forward
    const progress = duration > 0 ? newPosition / duration : 0;
    await handleSeek(progress);
  };

  const handleDelete = () => {
    if (sound) {
      sound.unloadAsync();
    }
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
        </View>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
          <Trash2 size={16} color="#FF3B30" />
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <TouchableOpacity
          style={styles.progressBar}
          onPress={(event) => {
            const { locationX } = event.nativeEvent;
            const { width } = event.currentTarget.measure ? 
              { width: 200 } : // fallback width
              event.currentTarget;
            const progress = locationX / 200; // approximate width
            handleSeek(Math.max(0, Math.min(1, progress)));
          }}
          activeOpacity={0.8}
        >
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, progressBarStyle]} />
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
          style={styles.controlButton}
          onPress={handleSkipBackward}
          disabled={!isLoaded || isLoading}
        >
          <SkipBack size={20} color={!isLoaded || isLoading ? '#9CA3AF' : '#007AFF'} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.playButton, isLoading && styles.playButtonDisabled]}
          onPress={handlePlayPause}
          disabled={isLoading}
        >
          {isLoading ? (
            <View style={styles.loadingDot} />
          ) : isPlaying ? (
            <Pause size={24} color="#FFFFFF" />
          ) : (
            <Play size={24} color="#FFFFFF" />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={handleSkipForward}
          disabled={!isLoaded || isLoading}
        >
          <SkipForward size={20} color={!isLoaded || isLoading ? '#9CA3AF' : '#007AFF'} />
        </TouchableOpacity>
      </View>
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
  deleteButton: {
    padding: 4,
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressBar: {
    height: 32,
    justifyContent: 'center',
  },
  progressTrack: {
    height: 4,
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
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    opacity: 0.8,
  },
});