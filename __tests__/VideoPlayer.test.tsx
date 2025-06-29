import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { VideoPlayer } from '@/components/VideoPlayer';
import * as ScreenOrientation from 'expo-screen-orientation';

// Mock expo-video & useVideoPlayer
jest.mock('expo-video', () => {
  const mockPlayer: any = {
    play: jest.fn(),
    pause: jest.fn(),
    enterFullscreen: jest.fn(),
    exitFullscreen: jest.fn(),
    addListener: jest.fn(() => ({ remove: jest.fn() })),
    currentTime: 0,
    duration: 10,
  };
  return {
    VideoView: jest.fn(({ children }) => children || null),
    useVideoPlayer: jest.fn(() => mockPlayer),
  };
});

// Mock ScreenOrientation
jest.mock('expo-screen-orientation');
const lockAsync = jest.fn();
const unlockAsync = jest.fn();
const addOrientationChangeListener = jest.fn();
const removeOrientationChangeListener = jest.fn();
(ScreenOrientation as any).lockAsync = lockAsync;
(ScreenOrientation as any).unlockAsync = unlockAsync;
(ScreenOrientation as any).Orientation = {
  PORTRAIT_UP: 1,
  LANDSCAPE_LEFT: 3,
};
(ScreenOrientation as any).OrientationLock = {
  LANDSCAPE: 5,
};
(ScreenOrientation as any).addOrientationChangeListener = addOrientationChangeListener;
(ScreenOrientation as any).removeOrientationChangeListener = removeOrientationChangeListener;

// Helper to trigger orientation callback
function triggerOrientation(orientation: number) {
  const cb = addOrientationChangeListener.mock.calls[0][0];
  act(() => {
    cb({ orientationInfo: { orientation } });
  });
}

describe('VideoPlayer fullscreen logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should enter fullscreen and lock orientation on toggle', () => {
    const { getByTestId } = render(<VideoPlayer videoUri="mock.mp4" />);

    // Assume maximize button has testID="btn-maximize"
    const btn = getByTestId('btn-maximize');

    fireEvent.press(btn);

    expect(lockAsync).toHaveBeenCalledWith((ScreenOrientation as any).OrientationLock.LANDSCAPE);
    expect((ScreenOrientation as any).unlockAsync).not.toHaveBeenCalled();
  });

  it('should exit fullscreen on orientation portrait', () => {
    const { getByTestId, queryByText } = render(<VideoPlayer videoUri="mock.mp4" />);

    // Enter fullscreen first
    fireEvent.press(getByTestId('btn-maximize'));

    // Simulate orientation change to PORTRAIT
    triggerOrientation((ScreenOrientation as any).Orientation.PORTRAIT_UP);

    // Expect unlockAsync called
    expect(unlockAsync).toHaveBeenCalled();

    // Overlay controls should reappear (time text exists)
    expect(queryByText('0:00')).not.toBeNull();
  });
}); 