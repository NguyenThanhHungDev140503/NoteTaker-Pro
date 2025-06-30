import React, { useState, useRef, useEffect } from 'react';
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
  readonly videoUri: string;
  readonly style?: any;
  readonly autoPlay?: boolean;
  readonly showControls?: boolean;
  readonly onError?: (error: string) => void;
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
  
  const player = useVideoPlayer(videoUri, (player) => {
    // Video is preparing to load
    if (autoPlay) {
      player.play();
    }
  });
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControlsOverlay, setShowControlsOverlay] = useState(true);

  const [hasError, setHasError] = useState(false);

  const videoRef = useRef<VideoView>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Add a timeout for loading state to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      if (isLoading) {
        console.log('Video loading timeout - setting isLoading to false');
        setIsLoading(false);
      }
    }, 5000); // 5 second timeout

    const playingSubscription = player.addListener(
      'playingChange',
      (payload) => {
        console.log('Video playing state changed:', payload.isPlaying);
        setIsPlaying(payload.isPlaying);
        setIsLoading(false); // Video is ready when playing state changes

        // ✅ FIX: Reset video to start when it finishes playing
        if (!payload.isPlaying) {
          setShowControlsOverlay(true);
          // Check if the video stopped because it reached the end
          const currentTime = player.currentTime;
          const videoDuration = player.duration;
          // Add a small tolerance (e.g., 0.5s) to account for timing inaccuracies
          if (videoDuration && currentTime >= videoDuration - 0.5) {
            console.log('Video finished, resetting to beginning.');
            player.currentTime = 0; // Seek to the beginning
            setPosition(0); // Update our position state as well
          }
        }
      }
    );

    const mutedSubscription = player.addListener('mutedChange', (payload) => {
      setIsMuted(payload.muted);
    });

    const statusSubscription = player.addListener('statusChange', (payload) => {
      console.log('Video status changed:', payload.status);
      if (payload.status === 'loading') {
        setIsLoading(true);
      } else if (payload.status === 'idle') {
        setIsLoading(false);
        setHasError(false);
        // Get duration when video is ready
        if (player.duration) {
          setDuration(player.duration * 1000); // Convert to milliseconds
        }
      } else if (payload.status === 'error') {
        setIsLoading(false);
        setHasError(true);
        onError?.('Không thể tải video');
      }
    });

    // Add interval to track current time progress only
    // ✅ Removed fullscreen polling - now using onFullscreenExit event
    const progressInterval = setInterval(() => {
      if (player && !isLoading) {
        // Get current time in milliseconds
        const currentTime = player.currentTime * 1000;
        const videoDuration = player.duration * 1000;

        setPosition(currentTime);
        if (videoDuration && videoDuration !== duration) {
          setDuration(videoDuration);
        }
      }
    }, 100); // Update every 100ms for smooth progress

    return () => {
      clearTimeout(loadingTimeout);
      clearInterval(progressInterval);
      playingSubscription.remove();
      mutedSubscription.remove();
      statusSubscription.remove();
    };
  }, [player, onError, isLoading, duration]);

  const hideControlsAfterDelay = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }

    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControlsOverlay(false);
      }
    }, 3000) as any;
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

  // StatusBar management for fullscreen
  useEffect(() => {
    if (isFullscreen) {
      StatusBar.setHidden(true, 'fade');
      console.log('[VideoPlayer] StatusBar hidden for fullscreen');
    } else {
      StatusBar.setHidden(false, 'fade');
      console.log('[VideoPlayer] StatusBar shown for normal view');
    }
  }, [isFullscreen]);

  // Log bất cứ khi nào state isFullscreen hoặc showControlsOverlay thay đổi
  useEffect(() => {
    console.log('[VideoPlayer] State change', {
      isFullscreen,
      showControlsOverlay,
    });
  }, [isFullscreen, showControlsOverlay]);

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

  const toggleMute = () => {
    try {
      const newMutedState = !isMuted;
      player.muted = newMutedState;
      console.log('[VideoPlayer] Mute toggled to:', newMutedState);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } catch (error) {
      console.error('[VideoPlayer] Error toggling mute:', error);
      onError?.('Không thể thay đổi âm thanh');
    }
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) {
      console.warn('[VideoPlayer] toggleFullscreen: videoRef.current is null');
      return;
    }

    const nextState = !isFullscreen;

    try {
      if (isFullscreen) {
        videoRef.current.exitFullscreen?.();
        console.log('[VideoPlayer] exitFullscreen() called');
      } else {
        videoRef.current.enterFullscreen?.();
        console.log('[VideoPlayer] enterFullscreen() called');
      }

      console.log('[VideoPlayer] isFullscreen state will be set to', nextState);
      setIsFullscreen(nextState);

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    } catch (error) {
      console.error('[VideoPlayer] toggleFullscreen error:', error);
      // Fallback: just update state
      setIsFullscreen(nextState);
    }
  };

  const handleProgressBarPress = (event: any) => {
    try {
      if (duration > 0) {
        const { locationX } = event.nativeEvent;
        // Estimate progress bar width (we'll set a fixed width in styles)
        const progressBarWidth = 200; // This will be overridden by flex: 1
        const percentage = Math.max(0, Math.min(1, locationX / progressBarWidth));
        const newTime = (percentage * duration) / 1000; // Convert to seconds

        player.currentTime = newTime;
        setPosition(newTime * 1000);

        console.log('[VideoPlayer] Seeked to:', newTime, 'seconds');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
    } catch (error) {
      console.error('[VideoPlayer] Error seeking video:', error);
      onError?.('Không thể tua video');
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

  // Show error state if there's an error
  if (hasError) {
    return (
      <View style={[videoContainerStyle, styles.errorContainer]}>
        <View style={styles.errorContent}>
          <Text style={styles.errorText}>Không thể tải video</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              setHasError(false);
              setIsLoading(true);
              // Try to reload the player
              player.replay();
            }}
          >
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

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
          nativeControls={isFullscreen}
          onFullscreenExit={() => {
            try {
              console.log('[VideoPlayer] onFullscreenExit event triggered');
              setIsFullscreen(false);
              setShowControlsOverlay(true);
              console.log('[VideoPlayer] Successfully handled fullscreen exit');
            } catch (error) {
              console.error('[VideoPlayer] Error in onFullscreenExit handler:', error);
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

                <TouchableOpacity 
                  style={styles.progressBar}
                  onPress={handleProgressBarPress}
                  activeOpacity={0.8}
                >
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${progressPercentage}%` },
                      ]}
                    />
                  </View>
                </TouchableOpacity>

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
    paddingVertical: 8, // Add padding for easier touch
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
  progressFill: {
    height: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
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
  errorContainer: {
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContent: {
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
