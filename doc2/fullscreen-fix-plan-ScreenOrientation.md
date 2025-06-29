# Kế hoạch khắc phục sự cố Fullscreen - Video Events Approach

> **Bối cảnh**
> Ứng dụng ghi chú (SuperNote) sử dụng `expo-video` để phát video. Khi người dùng thoát chế độ toàn màn hình (`enterFullscreen()` + nút **Done** / gesture), state `isFullscreen` không cập nhật chính xác. Hậu quả: video tự phát lại và quay trở lại fullscreen nhiều lần.

---

## 1. Phân tích nguyên nhân & vấn đề

| Quan sát | Giải thích |
|----------|------------|
| Sự kiện `fullscreenChange` **không** bắn trên iOS/Android | `expo-video` chưa ánh xạ sự kiện native vào JS. |
| Polling thuộc tính `player.fullscreen` cho thấy: giá trị thay đổi thành `false` sau đó rất nhanh lại thành `true` | Chu trình thoát của **AVPlayerViewController**: rời fullscreen → render inline tạm thời → layout lại → cờ `fullscreen` lập tức bật lại. |
| `playingChange → true` ngay sau thoát | AVPlayer tự động resume khi view được re-attach vào hierarchy chính. |

### ⚠️ Vấn đề với expo-screen-orientation (Approach cũ - KHÔNG khuyến nghị)
| GitHub Issue | Vấn đề | Platform |
|--------------|---------|----------|
| [#27064](https://github.com/expo/expo/issues/27064) | `addOrientationChangeListener` **KHÔNG hoạt động** trên iOS devices | iOS |
| [#20326](https://github.com/expo/expo/issues/20326) | `unlockAsync()` không unlock đúng cách | iOS/Android |
| [#15009](https://github.com/expo/expo/issues/15009) | Screen orientation không lock/trigger với EAS Build | iOS/Android |
| [#33582](https://github.com/expo/expo/issues/33582) | `expo-video` enterFullscreen không hoạt động trên iOS | iOS |

### Kết luận
- ❌ Dựa trên `player.fullscreen` là **không ổn định**
- ❌ `expo-screen-orientation` có bugs nghiêm trọng trên iOS
- ✅ Cần sử dụng **Video Events** từ expo-video component

---

## 2. Giải pháp tổng thể

### **Approach 1: Video Events (KHUYẾN NGHỊ CHÍNH)**

1. **Loại bỏ polling `player.fullscreen`** và orientation-based detection
2. **Sử dụng Video Events** từ `expo-video` component:
   - `onFullscreenPlayerWillPresent` → `setIsFullscreen(true)`
   - `onFullscreenPlayerWillDismiss` → `setIsFullscreen(false)`
3. **StatusBar Management** để cải thiện UX:
   - Hide status bar khi vào fullscreen
   - Show status bar khi thoát fullscreen
4. **Error Handling** cho các edge cases
5. **Không cần orientation locking** - tự nhiên hơn cho user

### **Approach 2: Custom Modal Fullscreen (ALTERNATIVE)**

1. **Modal-based fullscreen** thay vì native fullscreen
2. **React state control** hoàn toàn
3. **Cross-platform consistency**
4. **Support cả portrait và landscape** tự nhiên

---

## 3. Chi tiết triển khai

### 3.1 Approach 1: Video Events Implementation

#### **Dependencies (Không cần thêm packages)**
```ts
import { Video, VideoRef } from 'expo-video';
import { StatusBar } from 'expo-status-bar';
import { useState, useRef } from 'react';
```

#### **State Management**
```ts
const [isFullscreen, setIsFullscreen] = useState(false);
const [showControls, setShowControls] = useState(true);
const videoRef = useRef<VideoRef>(null);
```

#### **Event Handlers**
```ts
const handleFullscreenWillPresent = () => {
  console.log('📱 Entering fullscreen');
  setIsFullscreen(true);
  setShowControls(false);
  StatusBar.setHidden(true, 'fade');
};

const handleFullscreenWillDismiss = () => {
  console.log('📱 Exiting fullscreen');
  setIsFullscreen(false);
  setShowControls(true);
  StatusBar.setHidden(false, 'fade');
};
```

#### **Toggle Function**
```ts
const toggleFullscreen = async () => {
  if (!videoRef.current) return;

  try {
    if (!isFullscreen) {
      await videoRef.current.enterFullscreen();
    } else {
      await videoRef.current.exitFullscreen();
    }
  } catch (error) {
    console.warn('Fullscreen toggle error:', error);
    // Fallback: manual state update
    setIsFullscreen(!isFullscreen);
  }
};
```

#### **Video Component**
```ts
<Video
  ref={videoRef}
  source={{ uri: videoSource }}
  style={styles.video}
  useNativeControls={!showControls}
  onFullscreenPlayerWillPresent={handleFullscreenWillPresent}
  onFullscreenPlayerWillDismiss={handleFullscreenWillDismiss}
/>
```

### 3.2 Approach 2: Custom Modal Implementation

#### **Modal-based Fullscreen**
```ts
const [isModalFullscreen, setIsModalFullscreen] = useState(false);

return (
  <>
    <Video
      style={isModalFullscreen ? styles.hidden : styles.normal}
      source={{ uri: videoSource }}
    />

    <Modal
      visible={isModalFullscreen}
      transparent={false}
      supportedOrientations={['portrait', 'landscape']}
    >
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        onPress={() => setIsModalFullscreen(false)}
      >
        <Video
          style={StyleSheet.absoluteFill}
          source={{ uri: videoSource }}
          resizeMode="contain"
          controls={true}
        />
      </TouchableOpacity>
    </Modal>
  </>
);
```

### 3.3 Cleanup Tasks
- ❌ Remove `expo-screen-orientation` dependency
- ❌ Remove polling `player.fullscreen` trong `progressInterval`
- ❌ Remove orientation listener code
- ❌ Remove orientation locking logic
- ✅ Keep existing video controls và progress tracking

---

## 4. Kiểm thử

### 4.1 Test Cases cho Video Events Approach

1. **Luồng cơ bản**
   - Note Detail → Play → Tap fullscreen button
   - Verify: `onFullscreenPlayerWillPresent` fires → `isFullscreen = true`
   - Tap Done/Back → Verify: `onFullscreenPlayerWillDismiss` fires → `isFullscreen = false`

2. **StatusBar Management**
   - Enter fullscreen → StatusBar hidden
   - Exit fullscreen → StatusBar visible
   - No orientation locking required

3. **Error Handling**
   - Video source fails → Fullscreen button disabled
   - Network interruption → Graceful fallback

4. **Cross-platform Testing**
   - iOS real device + simulator
   - Android real device + emulator
   - Expo Go + Development build

5. **Regression Testing**
   - Progress bar functionality
   - Play/pause controls
   - Volume/mute controls
   - Video seeking

---

## 5. Phân công & ước lượng

### 5.1 Video Events Approach (KHUYẾN NGHỊ)

| Công việc | Ước lượng | Complexity |
|-----------|-----------|------------|
| Remove expo-screen-orientation code | 0.5h | Low |
| Implement video event handlers | 1h | Low |
| Add StatusBar management | 0.5h | Low |
| Error handling & fallbacks | 0.5h | Medium |
| Testing trên real devices | 1h | Low |
| **Tổng** | **3.5h** | **Low** |

### 5.2 Custom Modal Approach (ALTERNATIVE)

| Công việc | Ước lượng | Complexity |
|-----------|-----------|------------|
| Implement modal-based fullscreen | 1.5h | Medium |
| Handle orientation support | 1h | Medium |
| Custom controls integration | 1h | Medium |
| Testing & polish | 1.5h | Medium |
| **Tổng** | **5h** | **Medium** |

---

## 6. Rủi ro & biện pháp

### 6.1 Video Events Approach

| Rủi ro | Likelihood | Biện pháp |
|--------|------------|-----------|
| Video events không fire trên một số devices | Low | Implement fallback với manual state tracking |
| StatusBar conflicts với other screens | Medium | Scope StatusBar changes chỉ trong video component |
| Native fullscreen không hoạt động | Low | Fallback to custom modal approach |

### 6.2 General Considerations

| Consideration | Solution |
|---------------|----------|
| User muốn xem video portrait mode | Không force orientation - let user choose naturally |
| Performance impact | Video events có overhead thấp hơn polling |
| Maintenance burden | Ít dependencies = ít potential issues |

---

## 7. Unit Tests (Jest + @testing-library/react-native)

### 7.1 Updated Test Cases cho Video Events

File: `__tests__/VideoPlayer.test.tsx`

```ts
import { render, fireEvent } from '@testing-library/react-native';
import { VideoPlayer } from '@/components/VideoPlayer';

// Mock expo-video
jest.mock('expo-video', () => ({
  Video: 'Video',
  VideoRef: {},
}));

// Mock StatusBar
jest.mock('expo-status-bar', () => ({
  StatusBar: {
    setHidden: jest.fn(),
  },
}));

describe('VideoPlayer Fullscreen', () => {
  test('should handle fullscreen enter event', () => {
    const { getByTestId } = render(<VideoPlayer source="test.mp4" />);

    // Simulate video event
    const videoComponent = getByTestId('video-player');
    fireEvent(videoComponent, 'onFullscreenPlayerWillPresent');

    // Verify state changes
    expect(StatusBar.setHidden).toHaveBeenCalledWith(true, 'fade');
  });

  test('should handle fullscreen exit event', () => {
    const { getByTestId } = render(<VideoPlayer source="test.mp4" />);

    // Simulate video event
    const videoComponent = getByTestId('video-player');
    fireEvent(videoComponent, 'onFullscreenPlayerWillDismiss');

    // Verify state changes
    expect(StatusBar.setHidden).toHaveBeenCalledWith(false, 'fade');
  });
});
```

### 7.2 Cách chạy
```bash
npm test __tests__/VideoPlayer.test.tsx
```

### 7.3 CI/CD Integration
- Tests không phụ thuộc native APIs
- Mock all expo-video dependencies
- Suitable cho automated testing pipeline

---

## 8. Migration Checklist

### ✅ Before Implementation
- [ ] Backup current VideoPlayer component
- [ ] Document current behavior for regression testing
- [ ] Prepare test devices (iOS + Android)

### ✅ During Implementation
- [ ] Remove expo-screen-orientation imports
- [ ] Remove orientation listener code
- [ ] Add video event handlers
- [ ] Implement StatusBar management
- [ ] Add error handling

### ✅ After Implementation
- [ ] Test on real devices
- [ ] Verify no auto-replay issues
- [ ] Check StatusBar behavior
- [ ] Update documentation

---

> **Kết quả mong đợi**: Trạng thái fullscreen đồng bộ 100%, video không tự phát lại hay tái fullscreen sau khi thoát. Giao diện inline hoạt động mượt mà. Không còn phụ thuộc vào orientation locking.
> **Approach**: Video Events thay vì ScreenOrientation API
> **Người phụ trách**: _Development Team_
> **Ngày cập nhật**: 2025-01-15
> **Status**: Ready for implementation