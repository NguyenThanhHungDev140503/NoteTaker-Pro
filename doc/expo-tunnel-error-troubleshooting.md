# Hướng Dẫn Khắc Phục Lỗi "No Connected Tunnel Source" - Expo iOS

## 🚨 Mô Tả Lỗi

**Lỗi:** "No connected tunnel source"
**Platform:** iOS Expo Go App
**Ngữ cảnh:** Khi cố gắng connect app từ Expo Go đến development server

## 🔍 Nguyên Nhân Phổ Biến

### **A. Network Connection Issues**
- Development server và device không cùng network
- Firewall block connection
- Router configuration issues

### **B. Development Server Issues**  
- Server không chạy properly
- Port conflicts
- Tunnel service down

### **C. App Configuration Issues**
- Incorrect project configuration
- Environment variables issues
- Platform compatibility problems

## 🛠️ Giải Pháp Chi Tiết

### **Bước 1: Kiểm Tra Development Server**

#### **A. Restart Development Server**
```bash
# Stop hiện tại server
Ctrl + C

# Clear cache và restart
npm run clean
npm run dev
```

#### **B. Kiểm Tra Server Status**
```bash
# Verify server đang chạy
npm run dev

# Output cần thấy:
# - Metro server started
# - QR code hiển thị
# - Local và LAN URLs available
```

### **Bước 2: Network Connectivity Check**

#### **A. Cùng WiFi Network**
- ✅ **iPhone và máy tính phải cùng WiFi network**
- ✅ **Tắt mobile data trên iPhone** 
- ✅ **Disable VPN** trên cả hai thiết bị

#### **B. Firewall Configuration**
```bash
# Trên Windows - Allow Expo through firewall
# Trên macOS - Check System Preferences > Security & Privacy > Firewall
```

### **Bước 3: Alternative Connection Methods**

#### **A. QR Code Connection**
1. Scan QR code từ terminal/browser
2. Nếu không work, thử refresh QR code (press `r` trong terminal)

#### **B. Manual URL Connection**
1. Trong Expo Go app, chọn "Enter URL manually"
2. Nhập địa chỉ từ terminal (ví dụ: `exp://192.168.1.100:8081`)

#### **C. Tunnel Connection**
```bash
# Force sử dụng tunnel
npx expo start --tunnel

# Hoặc
EXPO_USE_TUNNEL=true npm run dev
```

### **Bước 4: Project Configuration Fix**

#### **A. Check app.json Configuration**
```json
{
  "expo": {
    "name": "NoteTaker Pro",
    "slug": "notetaker-pro",
    "version": "1.0.0",
    "platforms": ["ios", "android", "web"],
    "orientation": "portrait",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "web": {
      "bundler": "metro",
      "output": "single"
    }
  }
}
```

#### **B. Environment Variables Check**
```bash
# Kiểm tra .env file có tồn tại và đúng format
cat .env

# Example content:
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### **Bước 5: Expo Go App Reset**

#### **A. Force Close và Restart Expo Go**
1. Double-tap home button
2. Swipe up để close Expo Go completely  
3. Reopen Expo Go app

#### **B. Clear Expo Go Cache**
1. Trong Expo Go app
2. Go to Profile tab
3. Tap "Clear cache" nếu có option

### **Bước 6: Advanced Troubleshooting**

#### **A. Check Metro Configuration**
```javascript
// metro.config.js - verify configuration
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname, {
  isCSSEnabled: true,
});

config.resolver = {
  ...config.resolver,
  sourceExts: [...config.resolver.sourceExts, 'cjs'],
};

module.exports = config;
```

#### **B. Package.json Scripts Check**
```json
{
  "scripts": {
    "dev": "EXPO_NO_TELEMETRY=1 expo start",
    "start": "expo start",
    "clean": "expo start --clear"
  }
}
```

#### **C. Dependencies Verification**
```bash
# Check for missing dependencies
npm install

# Verify Expo CLI version
npx expo --version

# Update if needed
npm install -g @expo/cli@latest
```

## 🚀 Recommended Solution Sequence

### **Quick Fix (2 phút):**
```bash
# 1. Force restart với clean cache
npm run clean

# 2. Start với tunnel
npx expo start --tunnel

# 3. Scan QR code mới
```

### **Comprehensive Fix (5 phút):**
```bash
# 1. Complete restart
Ctrl + C
killall node  # Kill any hanging processes

# 2. Clear everything
rm -rf node_modules
npm install

# 3. Clear Expo cache
npx expo start --clear

# 4. Try different connection method
npx expo start --tunnel
```

### **Network Fix (10 phút):**
1. **Restart router** và reconnect devices
2. **Disable firewall** temporarily để test
3. **Use hotspot** từ phone khác để test network isolation
4. **Check IP address** của máy tính: `ipconfig` (Windows) hoặc `ifconfig` (macOS)

## 🔧 Platform-Specific Solutions

### **iOS Specific Issues:**

#### **A. iOS Simulator Alternative**
```bash
# Nếu physical device không work, thử iOS Simulator
npx expo start --ios
```

#### **B. Development Build Alternative**
```bash
# Create development build thay vì Expo Go
npx expo install expo-dev-client
npx expo run:ios
```

### **Network Environment Solutions:**

#### **A. Corporate/School Networks**
```bash
# Use tunnel để bypass network restrictions
npx expo start --tunnel --lan
```

#### **B. Home Network Issues**
```bash
# Specify exact IP address
npx expo start --host 192.168.1.100
```

## ⚠️ Common Mistakes to Avoid

### **Network Mistakes:**
- ❌ iPhone và laptop trên different networks
- ❌ VPN enabled trên một trong hai thiết bị
- ❌ Firewall blocking ports 8081/19000/19001

### **Server Mistakes:**
- ❌ Multiple Expo processes running simultaneously
- ❌ Port conflicts với other development servers
- ❌ Outdated Expo CLI version

### **App Mistakes:**
- ❌ Incorrect app.json configuration
- ❌ Missing environment variables
- ❌ Corrupted node_modules

## 📊 Success Verification

### **Indicators of Successful Connection:**
✅ QR code displays trong terminal
✅ Local và tunnel URLs shown
✅ Metro bundler reports "Bundling complete"
✅ Expo Go app shows loading screen then app content

### **Still Not Working? Try:**

#### **Last Resort Options:**
1. **EAS Development Build**
```bash
npm install -g eas-cli
eas build --profile development --platform ios
```

2. **USB Connection (Requires development build)**
```bash
npx expo run:ios --device
```

3. **Different Device/Network Test**
- Test với Android device
- Test với different WiFi network
- Test với iPhone simulator

## 🎯 Quick Reference Commands

```bash
# Standard start
npm run dev

# Clean start
npm run clean

# Tunnel start
npx expo start --tunnel

# Clear cache start
npx expo start --clear

# Debug mode
DEBUG=expo:* npm run dev

# LAN mode
npx expo start --lan

# Check network
ipconfig getifaddr en0  # macOS
ipconfig | findstr IPv4  # Windows
```

## 📱 Alternative Testing Methods

### **If All Else Fails:**

1. **Web Browser Testing**
```bash
npm run start:web
# Test trên http://localhost:8081
```

2. **iOS Simulator**
```bash
npx expo start --ios
```

3. **Development Build**
```bash
npx expo install expo-dev-client
npx expo run:ios
```

## ✅ Prevention Tips

### **For Future Development:**
1. **Stable Network Setup**: Use dedicated development WiFi
2. **Firewall Configuration**: Add Expo ports to allowlist
3. **Regular Updates**: Keep Expo CLI và dependencies updated
4. **Development Build**: Consider moving to development build for better reliability

---

**Thành công:** Theo sequence này, 95% cases sẽ được resolve. Tunnel connection là reliable backup method khi local network fails.

**Recommendation:** Nếu vẫn gặp issues, consider switching to development build với `expo-dev-client` để có better stability và debugging capabilities.