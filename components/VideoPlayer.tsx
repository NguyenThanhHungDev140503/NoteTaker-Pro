import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Play, Pause, Volume2, VolumeX, Maximize2, X } from 'lucide-react-native';
import { Video } from 'expo-av';
import * as Haptics from 'expo-haptics';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface VideoPlayerProps {
  videoUri: string;
  style?: any;
  autoPlay?: boolean;
  showControls?: boolean;
  onError?: (error: string) => void;
}

export function VideoPlayer({
  videoUri,
  style,
  autoPlay = false,
  showControls = true,
  onError,
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControlsOverlay, setShowControlsOverlay] = useState(true);
  
  const videoRef = useRef<Video>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const hideControlsAfterDelay = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControlsOverlay(false);
      }
    }, 3000);
  };

  const showControlsTemporarily = () => {
    setShowControlsOverlay(true);
    hideControlsAfterDelay();
  };

  useEffect(() => {
    if (isPlaying && showControls) {
      hideControlsAfterDelay();
    } else {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      setShowControlsOverlay(true);
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying, showControls]);

  const togglePlayPause = async () => {
    try {
      if (!videoRef.current) return;

      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Error toggling play/pause:', error);
      onError?.('Không thể phát/dừng video');
    }
  };

  const toggleMute = async () => {
    try {
      if (!videoRef.current) return;

      await videoRef.current.setIsMutedAsync(!isMuted);
      setIsMuted(!isMuted);
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Error toggling mute:', error);
    }
  };

  const seekTo = async (seekPosition: number) => {
    try {
      if (!videoRef.current) return;
      
      const seekTime = (seekPosition / 100) * duration;
      await videoRef.current.setPositionAsync(seekTime);
    } catch (error) {
      console.error('Error seeking:', error);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setIsLoading(false);
      setIsPlaying(status.isPlaying);
      setDuration(status.durationMillis || 0);
      setPosition(status.positionMillis || 0);
      
      if (status.didJustFinish) {
        setIsPlaying(false);
        setShowControlsOverlay(true);
      }
    } else if (status.error) {
      console.error('Video playback error:', status.error);
      onError?.('Lỗi phát video: ' + status.error);
    }
  };

  const formatTime = (timeInMs: number) => {
    const totalSeconds = Math.floor(timeInMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (position / duration) * 100 : 0;

  const videoContainerStyle = isFullscreen
    ? styles.fullscreenContainer
    : [styles.videoContainer, style];

  const videoStyle = isFullscreen
    ? styles.fullscreenVideo
    : styles.video;

  return (
    <View style={videoContainerStyle}>
      <TouchableOpacity
        style={styles.videoWrapper}
        activeOpacity={1}
        onPress={showControlsTemporarily}
      >
        <Video
          ref={videoRef}
          style={videoStyle}
          source={{ uri: videoUri }}
          shouldPlay={isPlaying}
          isLooping={false}
          isMuted={isMuted}
          onPlaybackStatusUpdate={onPlaybackStatusUpdate}
          resizeMode="contain"
        />

        {/* Loading Indicator */}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#FFFFFF" />
          </View>
        )}

        {/* Controls Overlay */}
        {showControls && showControlsOverlay && !isLoading && (
          <View style={styles.controlsOverlay}>
            {/* Top Controls */}
            {isFullscreen && (
              <View style={styles.topControls}>
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={toggleFullscreen}
                >
                  <X size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            )}

            {/* Center Play/Pause */}
            <View style={styles.centerControls}>
              <TouchableOpacity
                style={styles.playPauseButton}
                onPress={togglePlayPause}
              >
                {isPlaying ? (
                  <Pause size={40} color="#FFFFFF" />
                ) : (
                  <Play size={40} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>

            {/* Bottom Controls */}
            <View style={styles.bottomControls}>
              {/* Progress Bar */}
              <View style={styles.progressContainer}>
                <Text style={styles.timeText}>
                  {formatTime(position)}
                </Text>
                
                <View style={styles.progressBar}>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${progressPercentage}%` }
                      ]}
                    />
                  </View>
                </View>
                
                <Text style={styles.timeText}>
                  {formatTime(duration)}
                </Text>
              </View>

              {/* Control Buttons */}
              <View style={styles.controlsRow}>
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={toggleMute}
                >
                  {isMuted ? (
                    <VolumeX size={20} color="#FFFFFF" />
                  ) : (
                    <Volume2 size={20} color="#FFFFFF" />
                  )}
                </TouchableOpacity>

                {!isFullscreen && (
                  <TouchableOpacity
                    style={styles.controlButton}
                    onPress={toggleFullscreen}
                  >
                    <Maximize2 size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  videoContainer: {
    backgroundColor: '#000000',
    borderRadius: 8,
    overflow: 'hidden',
    aspectRatio: 16 / 9,
  },
  fullscreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    zIndex: 1000,
  },
  videoWrapper: {
    flex: 1,
    position: 'relative',
  },
  video: {
    flex: 1,
  },
  fullscreenVideo: {
    width: screenWidth,
    height: screenHeight,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  controlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
  },
  centerControls: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playPauseButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControls: {
    padding: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    marginHorizontal: 12,
  },
  progressTrack: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 1.5,
  },
  progressFill: {
    height: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 1.5,
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  controlButton: {
    padding: 8,
    marginLeft: 16,
  },
}); 