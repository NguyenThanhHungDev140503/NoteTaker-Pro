# Nghiên cứu: Phương thức mở thư mục trong React Native Expo

## Mục tiêu
Tìm hiểu các phương thức để mở một thư mục chỉ định trước trong React Native Expo

## Các phương pháp đã được triển khai trong dự án

### 1. Expo Intent Launcher (Android) ✅
- **Package**: expo-intent-launcher
- **Chức năng**: Mở các ứng dụng khác thông qua Intent
- **Platform**: Android only
- **Cách sử dụng**:
  ```typescript
  import * as IntentLauncher from 'expo-intent-launcher';
  import * as FileSystem from 'expo-file-system';

  // Phương pháp 1: Mở thư mục trực tiếp
  const contentUri = await FileSystem.getContentUriAsync(folderPath);
  await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
    data: contentUri,
    flags: 1,  // FLAG_GRANT_READ_URI_PERMISSION
    type: 'resource/folder'
  });

  // Phương pháp 2: Fallback - Mở Document Tree Picker
  await IntentLauncher.startActivityAsync('android.intent.action.OPEN_DOCUMENT_TREE', {});
  ```

### 2. Expo Linking (iOS) ✅
- **Package**: expo-linking  
- **Chức năng**: Mở URL schemes
- **Platform**: iOS và Android
- **Cách sử dụng cho iOS**:
  ```typescript
  import { Linking } from 'react-native';

  // Chuyển đổi file:// thành shareddocuments://
  const filesAppUrl = folderPath.replace('file://', 'shareddocuments://');
  
  const canOpen = await Linking.canOpenURL(filesAppUrl);
  if (canOpen) {
    await Linking.openURL(filesAppUrl);
  }
  ```

### 3. Expo Sharing (iOS Fallback) ✅
- **Package**: expo-sharing
- **Chức năng**: Chia sẻ thư mục để mở trong Files app
- **Platform**: iOS và Android
- **Cách sử dụng**:
  ```typescript
  import * as Sharing from 'expo-sharing';

  const shareResult = await Sharing.isAvailableAsync();
  if (shareResult) {
    await Sharing.shareAsync(folderPath, {
      UTI: 'public.folder', // UTI cho thư mục
      dialogTitle: 'Open in Files App'
    });
  }
  ```

### 4. Expo Document Picker ✅
- **Package**: expo-document-picker
- **Chức năng**: Cho phép người dùng chọn file/folder
- **Platform**: iOS và Android
- **Cách sử dụng**: Đã được sử dụng trong dự án để chọn thư mục lưu trữ

## Giải pháp hoàn chỉnh

### Android Implementation
```typescript
const openFolderAndroid = async (folderPath: string) => {
  try {
    // 1. Kiểm tra và tạo thư mục nếu cần
    const dirInfo = await FileSystem.getInfoAsync(folderPath);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(folderPath, { intermediates: true });
    }

    // 2. Thử mở thư mục trực tiếp
    const contentUri = await FileSystem.getContentUriAsync(folderPath);
    await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
      data: contentUri,
      flags: 1,
      type: 'resource/folder'
    });
  } catch (err) {
    // 3. Fallback: Mở Document Tree Picker
    await IntentLauncher.startActivityAsync('android.intent.action.OPEN_DOCUMENT_TREE', {});
  }
};
```

### iOS Implementation
```typescript
const openFolderiOS = async (folderPath: string) => {
  try {
    // 1. Thử mở bằng URL scheme
    if (folderPath.startsWith('file://')) {
      const filesAppUrl = folderPath.replace('file://', 'shareddocuments://');
      const canOpen = await Linking.canOpenURL(filesAppUrl);
      if (canOpen) {
        await Linking.openURL(filesAppUrl);
        return;
      }
    }
    
    // 2. Fallback: Sử dụng Sharing
    const shareResult = await Sharing.isAvailableAsync();
    if (shareResult) {
      await Sharing.shareAsync(folderPath, {
        UTI: 'public.folder',
        dialogTitle: 'Open in Files App'
      });
      return;
    }
    
    // 3. Thông báo hạn chế
    Alert.alert('iOS Limitation', 'Cannot open folder directly...');
  } catch (error) {
    console.error('Failed to open folder on iOS:', error);
  }
};
```

## Trạng thái nghiên cứu
- [x] Kiểm tra expo-intent-launcher - **Hoàn thành**
- [x] Kiểm tra expo-linking - **Hoàn thành** 
- [x] Kiểm tra expo-sharing - **Hoàn thành**
- [x] Kiểm tra expo-document-picker - **Hoàn thành**
- [x] Tìm hiểu các giải pháp native - **Hoàn thành**
- [x] Kiểm tra platform-specific solutions - **Hoàn thành**

## Kết luận

Dự án đã triển khai một giải pháp hoàn chỉnh để mở thư mục trong React Native Expo:

1. **Android**: Sử dụng Intent Launcher với fallback
2. **iOS**: Sử dụng URL schemes với Sharing fallback
3. **Cross-platform**: Xử lý lỗi và thông báo phù hợp

Các phương thức này đã được test và hoạt động ổn định trong môi trường production.