import React, { useState, useRef, useEffect, memo } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  X,
} from 'lucide-react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import * as Haptics from 'expo-haptics';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface VideoPlayerProps {
  videoUri: string;
  style?: any;
  autoPlay?: boolean;
  showControls?: boolean;
  onError?: (error: string) => void;
}

function VideoPlayerComponent({
  videoUri,
  style,
  autoPlay = false,
  showControls = true,
  onError,
}: VideoPlayerProps) {
  const player = useVideoPlayer(videoUri, (player) => {
    if (autoPlay) {
      player.play();
    }
  });
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControlsOverlay, setShowControlsOverlay] = useState(true);

  const videoRef = useRef<VideoView>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const playingSubscription = player.addListener(
      'playingChange',
      (isPlaying) => {
        setIsPlaying(isPlaying);
        if (!isPlaying) {
          setShowControlsOverlay(true);
        }
      },
    );

    const mutedSubscription = player.addListener('mutedChange', (isMuted) => {
      setIsMuted(isMuted);
    });

    const progressSubscription = player.addListener('progress', (progress) => {
      setPosition(progress.positionMillis ?? 0);
      setDuration(progress.durationMillis ?? 0);
    });

    const errorSubscription = player.addListener('error', (error) => {
      console.error('Video playback error:', error);
      onError?.('Lỗi phát video: ' + error.message);
    });

    const loadSubscription = player.addListener('load', (status) => {
      setIsLoading(false);
      if (status) {
        setDuration(status.duration ?? 0);
      }
    });

    return () => {
      playingSubscription.remove();
      mutedSubscription.remove();
      progressSubscription.remove();
      errorSubscription.remove();
      loadSubscription.remove();
    };
  }, [player, onError]);

  // StatusBar management for fullscreen
  useEffect(() => {
    if (isFullscreen) {
      StatusBar.setHidden(true, 'fade');
      console.log('[VideoRecorder] StatusBar hidden for fullscreen');
    } else {
      StatusBar.setHidden(false, 'fade');
      console.log('[VideoRecorder] StatusBar shown for normal view');
    }
  }, [isFullscreen]);

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
      if (isPlaying) {
        player.pause();
      } else {
        player.play();
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Error toggling play/pause:', error);
      onError?.('Không thể phát/dừng video');
    }
  };

  const toggleMute = async () => {
    try {
      player.setMuted(!isMuted);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Error toggling mute:', error);
    }
  };

  const seekTo = async (seekPosition: number) => {
    try {
      const seekTime = (seekPosition / 100) * duration;
      player.seek(seekTime);
    } catch (error) {
      console.error('Error seeking:', error);
    }
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) {
      console.warn('[VideoRecorder] toggleFullscreen: videoRef.current is null');
      return;
    }

    const nextState = !isFullscreen;

    try {
      if (isFullscreen) {
        videoRef.current.exitFullscreen?.();
        console.log('[VideoRecorder] exitFullscreen() called');
      } else {
        videoRef.current.enterFullscreen?.();
        console.log('[VideoRecorder] enterFullscreen() called');
      }

      console.log('[VideoRecorder] isFullscreen state will be set to', nextState);
      setIsFullscreen(nextState);

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    } catch (error) {
      console.error('[VideoRecorder] toggleFullscreen error:', error);
      // Fallback: just update state
      setIsFullscreen(nextState);
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

  return (
    <View style={videoContainerStyle}>
      <TouchableOpacity
        style={styles.videoWrapper}
        activeOpacity={1}
        onPress={showControlsTemporarily}
      >
        <VideoView
          ref={videoRef}
          style={isFullscreen ? styles.fullscreenVideo : styles.video}
          player={player}
          contentFit="contain"
          isLooping={false}
          isMuted={isMuted}
          onFullscreenExit={() => {
            try {
              console.log('[VideoRecorder] onFullscreenExit event triggered');
              setIsFullscreen(false);
              setShowControlsOverlay(true);
              console.log('[VideoRecorder] Successfully handled fullscreen exit');
            } catch (error) {
              console.error('[VideoRecorder] Error in onFullscreenExit handler:', error);
              // Fallback: ensure state is consistent
              setIsFullscreen(false);
              setShowControlsOverlay(true);
            }
          }}
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
                <Text style={styles.timeText}>{formatTime(position)}</Text>

                <View style={styles.progressBar}>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${progressPercentage}%` },
                      ]}
                    />
                  </View>
                </View>

                <Text style={styles.timeText}>{formatTime(duration)}</Text>
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

export const VideoPlayer = memo(VideoPlayerComponent);

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
    width: screenHeight, // In landscape, width becomes height
    height: screenWidth, // and height becomes width
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