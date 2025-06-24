# Hướng dẫn Mở Thư mục trong React Native Expo

## Tổng quan

Việc mở một thư mục chỉ định trước trong React Native Expo yêu cầu các phương pháp khác nhau tùy theo platform (Android/iOS) do các hạn chế bảo mật và kiến trúc hệ thống khác nhau.

## Dependencies cần thiết

```json
{
  "expo-intent-launcher": "~12.1.5",
  "expo-linking": "~7.1.5", 
  "expo-sharing": "~13.1.5",
  "expo-file-system": "~17.1.6",
  "expo-document-picker": "~13.1.6"
}
```

## Phương thức chính

### 1. Android - Sử dụng Intent Launcher

```typescript
import * as IntentLauncher from 'expo-intent-launcher';
import * as FileSystem from 'expo-file-system';
import { Platform, Alert } from 'react-native';

const openFolderAndroid = async (folderPath: string) => {
  try {
    // Kiểm tra và tạo thư mục nếu cần
    const dirInfo = await FileSystem.getInfoAsync(folderPath);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(folderPath, { intermediates: true });
    }

    try {
      // Chuyển đổi file:// URI thành content:// URI
      const contentUri = await FileSystem.getContentUriAsync(folderPath);
      
      // Mở thư mục trong file manager
      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: contentUri,
        flags: 1,  // FLAG_GRANT_READ_URI_PERMISSION
        type: 'resource/folder'
      });
    } catch (err) {
      // Fallback: Mở Document Tree Picker
      console.log('Falling back to ACTION_OPEN_DOCUMENT_TREE');
      await IntentLauncher.startActivityAsync('android.intent.action.OPEN_DOCUMENT_TREE', {});
    }
  } catch (error) {
    console.error('Failed to open folder on Android:', error);
    Alert.alert('Lỗi', 'Không thể mở thư mục trong trình quản lý tệp.');
  }
};
```

### 2. iOS - Sử dụng URL Schemes và Sharing

```typescript
import { Linking, Alert } from 'react-native';
import * as Sharing from 'expo-sharing';

const openFolderiOS = async (folderPath: string) => {
  try {
    // Phương pháp 1: Thử mở bằng URL scheme
    if (folderPath.startsWith('file://')) {
      const filesAppUrl = folderPath.replace('file://', 'shareddocuments://');
      
      const canOpen = await Linking.canOpenURL(filesAppUrl);
      if (canOpen) {
        await Linking.openURL(filesAppUrl);
        return;
      }
    }
    
    // Phương pháp 2: Fallback - Sử dụng Sharing
    const shareResult = await Sharing.isAvailableAsync();
    if (shareResult) {
      await Sharing.shareAsync(folderPath, {
        UTI: 'public.folder', // UTI cho thư mục
        dialogTitle: 'Mở trong Files App'
      });
      return;
    }
    
    // Phương pháp 3: Thông báo hạn chế
    Alert.alert(
      'Hạn chế iOS',
      'Không thể mở thư mục trực tiếp. Bạn có thể truy cập ghi chú thông qua Files app thủ công.'
    );
  } catch (error) {
    console.error('Failed to open folder on iOS:', error);
    Alert.alert(
      'Hạn chế iOS',
      'Mở thư mục trong Files app không được hỗ trợ trên phiên bản iOS này.'
    );
  }
};
```

### 3. Universal Function - Cross Platform

```typescript
import { Platform } from 'react-native';

const openFolderInFileManager = async (folderPath: string) => {
  if (Platform.OS === 'android') {
    await openFolderAndroid(folderPath);
  } else if (Platform.OS === 'ios') {
    await openFolderiOS(folderPath);
  } else {
    Alert.alert('Không hỗ trợ', 'Tính năng này chỉ được hỗ trợ trên thiết bị di động.');
  }
};
```

## Các URL Schemes hữu ích

### iOS URL Schemes
```typescript
// Files app
const filesAppUrl = folderPath.replace('file://', 'shareddocuments://');

// iCloud Drive
const iCloudUrl = folderPath.replace('file://', 'clouddocs://');

// Dropbox (nếu có cài đặt)
const dropboxUrl = 'dbapi-1://1/connect';
```

### Android Intents
```typescript
// Mở file manager
'android.intent.action.VIEW'

// Mở document tree picker
'android.intent.action.OPEN_DOCUMENT_TREE'

// Mở settings storage
'android.settings.INTERNAL_STORAGE_SETTINGS'
```

## Xử lý lỗi và Edge Cases

### 1. Kiểm tra quyền truy cập
```typescript
const checkFolderAccess = async (folderPath: string) => {
  try {
    const dirInfo = await FileSystem.getInfoAsync(folderPath);
    return dirInfo.exists;
  } catch (error) {
    console.error('Cannot access folder:', error);
    return false;
  }
};
```

### 2. Tạo thư mục nếu không tồn tại
```typescript
const ensureFolderExists = async (folderPath: string) => {
  try {
    const dirInfo = await FileSystem.getInfoAsync(folderPath);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(folderPath, { intermediates: true });
    }
    return true;
  } catch (error) {
    console.error('Cannot create folder:', error);
    return false;
  }
};
```

### 3. Fallback cho các trường hợp không hỗ trợ
```typescript
const showManualInstructions = (platform: string) => {
  const instructions = platform === 'ios' 
    ? 'Mở Files app > Browse > On My iPhone > [Tên App] để truy cập thư mục'
    : 'Mở File Manager > Internal Storage > [Tên App] để truy cập thư mục';
    
  Alert.alert('Hướng dẫn thủ công', instructions);
};
```

## Best Practices

### 1. Luôn kiểm tra platform
```typescript
if (Platform.OS === 'android') {
  // Android specific code
} else if (Platform.OS === 'ios') {
  // iOS specific code
}
```

### 2. Sử dụng try-catch cho mọi operation
```typescript
try {
  await openFolderInFileManager(path);
} catch (error) {
  console.error('Error:', error);
  // Fallback logic
}
```

### 3. Cung cấp feedback cho user
```typescript
// Loading state
setLoading(true);
try {
  await openFolder();
} finally {
  setLoading(false);
}
```

### 4. Test trên cả hai platform
- Android: Test với các file manager khác nhau
- iOS: Test với các phiên bản iOS khác nhau

## Hạn chế và Lưu ý

### Android
- Một số file manager có thể không hỗ trợ mở thư mục trực tiếp
- Content URI có thể không hoạt động với tất cả ứng dụng
- Cần quyền storage access cho một số trường hợp

### iOS  
- Sandbox restrictions ngăn cản truy cập trực tiếp
- URL schemes có thể thay đổi giữa các phiên bản iOS
- Sharing API có hạn chế về loại file/folder

### Cross-platform
- Behavior khác nhau giữa các platform
- Cần handle gracefully khi không thể mở thư mục
- User experience cần được thiết kế phù hợp với từng platform