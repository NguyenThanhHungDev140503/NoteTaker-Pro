# SuperNote (NoteTaker Pro)

A comprehensive cross-platform note-taking application built with React Native and Expo, featuring rich media support, cloud synchronization, and advanced storage management.

![Platform Support](https://img.shields.io/badge/platform-iOS%20%7C%20Android%20%7C%20Web-blue)
![React Native](https://img.shields.io/badge/React%20Native-0.79.4-blue)
![Expo SDK](https://img.shields.io/badge/Expo%20SDK-53-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue)

## 📱 Project Overview

SuperNote is a modern, feature-rich note-taking application that allows users to create, manage, and synchronize notes across multiple platforms. The app supports text, audio recordings, images, and videos, making it a comprehensive solution for digital note-taking and content organization.

### Key Highlights
- **Cross-Platform**: Native iOS, Android, and Web support
- **Rich Media**: Text, audio, images, and video attachments
- **Cloud Sync**: Optional Supabase integration with offline-first approach
- **Advanced Storage**: Flexible storage location management
- **Modern UI**: Intuitive interface with gesture support and animations

## ✨ Features

### Core Functionality
- 📝 **Rich Text Notes**: Create and edit notes with full text formatting
- 🎙️ **Audio Recording**: Record and playback audio notes with professional controls
- 📷 **Image Attachments**: Capture photos or select from gallery
- 🎥 **Video Support**: Record and attach videos to notes
- ⭐ **Favorites System**: Mark important notes for quick access
- 🔍 **Search & Filter**: Find notes quickly with advanced search capabilities
- 🏷️ **Tagging System**: Organize notes with custom tags

### Advanced Features
- 📱 **Offline-First**: Full functionality without internet connection
- ☁️ **Cloud Synchronization**: Optional sync with Supabase backend
- 🔐 **Authentication**: Secure user accounts with Supabase Auth
- 💳 **Subscription Management**: Stripe integration for premium features
- 📁 **Storage Management**: Custom storage locations and file organization
- 📤 **Import/Export**: Backup and restore notes
- 🎨 **Modern UI**: Smooth animations and gesture-based interactions

### Platform-Specific Optimizations
- **iOS**: Optimized for iOS 16+ with native file browser integration
- **Android**: Direct file manager access with Intent Launcher
- **Web**: Responsive design with limited file system access

## 🚀 Installation Instructions

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn package manager
- Expo CLI (`npm install -g @expo/cli`)
- For iOS development: Xcode and iOS Simulator
- For Android development: Android Studio and Android Emulator

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd SuperNote
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Configuration** (Optional)
   Create a `.env` file in the root directory for Supabase integration:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   # or
   expo start
   ```

5. **Run on your preferred platform**
   - **iOS**: Press `i` in the terminal or scan QR code with Expo Go
   - **Android**: Press `a` in the terminal or scan QR code with Expo Go
   - **Web**: Press `w` in the terminal or visit `http://localhost:8081`

### Additional Setup for Cloud Features

If you want to use cloud synchronization and authentication:

1. **Supabase Setup**
   - Create a Supabase project at [supabase.com](https://supabase.com)
   - Run the migrations in the `supabase/migrations` folder
   - Add your Supabase URL and anon key to the `.env` file

2. **Stripe Setup** (for premium features)
   - Create a Stripe account at [stripe.com](https://stripe.com)
   - Add your publishable key to the `.env` file

## 📖 Usage Examples

### Creating a Note
```typescript
// Basic note creation
const newNote = {
  title: "Meeting Notes",
  content: "Discussion points...",
  images: [],
  audioRecordings: [],
  videos: [],
  isFavorite: false,
  tags: ["work", "meeting"]
};

await createNote(newNote);
```

### Recording Audio
```typescript
// Start audio recording
const recording = new Audio.Recording();
await recording.prepareAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
await recording.startAsync();

// Stop and save
await recording.stopAndUnloadAsync();
const uri = recording.getURI();
```

### Searching Notes
```typescript
// Search through notes
const results = searchNotes("meeting");
const favoriteNotes = getFavoriteNotes();
const recentNotes = getRecentNotes(5);
```

## 📁 Project Structure

```
SuperNote/
├── app/                          # Expo Router screens
│   ├── (tabs)/                  # Tab-based navigation
│   │   ├── index.tsx           # Home/Dashboard screen
│   │   ├── create.tsx          # Note creation screen
│   │   ├── notes.tsx           # Notes listing screen
│   │   ├── settings.tsx        # App settings
│   │   └── storage.tsx         # Storage management
│   ├── auth/                   # Authentication screens
│   ├── payment/                # Payment success screen
│   ├── _layout.tsx             # Root layout with auth logic
│   └── note-detail.tsx         # Note editing screen
├── components/                  # Reusable UI components
│   ├── AudioPlayer.tsx         # Audio playback component
│   ├── AudioRecorder.tsx       # Audio recording component
│   ├── VideoPlayer.tsx         # Video playback component
│   ├── NoteCard.tsx           # Note display card
│   ├── SearchBar.tsx          # Search functionality
│   └── MediaPicker.tsx        # Image/video selection
├── contexts/                   # React Context providers
│   └── NotesContext.tsx       # Global notes state management
├── hooks/                      # Custom React hooks
│   ├── useStorageInfo.ts      # Storage monitoring
│   ├── useIOSOptimization.ts  # iOS performance hooks
│   └── useNotesSync.ts        # Sync state management
├── services/                   # Business logic layer
│   ├── noteService.ts         # Basic CRUD operations
│   ├── enhancedNoteService.ts # Advanced storage features
│   ├── authService.ts         # Authentication logic
│   ├── storageLocationService.ts # Storage management
│   ├── syncService.ts         # Cloud synchronization
│   └── stripeService.ts       # Payment processing
├── types/                      # TypeScript definitions
│   └── note.ts               # Note interface definitions
├── supabase/                   # Supabase configuration
│   ├── functions/             # Edge functions
│   └── migrations/            # Database migrations
└── assets/                     # Images, fonts, etc.
```

## 🛠️ Technology Stack

### Frontend Framework
- **React Native**: 0.79.4 - Cross-platform mobile development
- **Expo SDK**: 53.0.13 - Development platform and tools
- **TypeScript**: 5.8.3 - Type-safe JavaScript
- **Expo Router**: 5.1.1 - File-based routing system

### UI & Interaction
- **React Native Gesture Handler**: 2.24.0 - Advanced gesture recognition
- **React Native Reanimated**: 3.17.4 - Smooth animations
- **Lucide React Native**: 0.475.0 - Modern icon library
- **Expo Linear Gradient**: 14.1.5 - UI enhancements

### Storage & Data Management
- **AsyncStorage**: Primary local storage solution
- **Expo FileSystem**: Custom storage locations and file management
- **Expo SecureStore**: Secure authentication data storage
- **Supabase**: Optional cloud backend for sync and auth

### Media & File Handling
- **Expo Camera**: 16.1.9 - Photo capture functionality
- **Expo Image Picker**: 16.1.4 - Gallery access and image selection
- **Expo AV**: 15.1.6 - Audio recording and playback
- **Expo Video**: 2.2.2 - Video recording and playback
- **Expo Document Picker**: 13.1.6 - File selection capabilities

### Backend Services
- **Supabase**: Authentication, database, and storage
- **Stripe**: Payment processing for premium features
- **Expo Secure Store**: Encrypted local storage

### Development Tools
- **ESLint**: Code linting and quality assurance
- **Prettier**: Code formatting
- **Jest**: Testing framework
- **TypeScript**: Static type checking

## 🤝 Contributing Guidelines

We welcome contributions to SuperNote! Please follow these guidelines:

### Getting Started
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes following our coding standards
4. Test your changes thoroughly
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Code Standards
- Follow TypeScript best practices
- Use meaningful variable and function names
- Add comments for complex logic
- Ensure all tests pass before submitting
- Follow the existing code style (Prettier configuration)

### Testing
```bash
# Run tests
npm test

# Run linting
npm run lint

# Type checking
npx tsc --noEmit
```

### Reporting Issues
- Use the GitHub issue tracker
- Provide detailed reproduction steps
- Include device/platform information
- Add screenshots or videos when helpful

### Feature Requests
- Check existing issues first
- Provide clear use cases
- Explain the expected behavior
- Consider implementation complexity

## 📄 License Information

This project is currently **proprietary software**. All rights reserved.

For licensing inquiries or commercial use, please contact the project maintainers.

## 📞 Support & Contact

- **Issues**: Use GitHub Issues for bug reports and feature requests
- **Documentation**: Check the `/doc` folder for detailed implementation reports
- **Development**: See `/memory-bank` for project context and patterns

## 🔧 Development Scripts

```bash
# Development
npm run dev              # Start development server
npm run dev:tunnel       # Start with tunnel for external testing
npm run dev:clear        # Start with cleared cache

# Building
npm run build:web        # Build for web platform

# Maintenance
npm run clean           # Clear Expo cache
npm run reset           # Full reset (node_modules + cache)
npm run lint            # Run ESLint
npm test               # Run Jest tests
```

## 🚀 Deployment

### Web Deployment
```bash
npm run build:web
# Deploy the generated files from dist/ folder
```

### Mobile App Stores
1. **iOS App Store**: Use EAS Build for production builds
2. **Google Play Store**: Use EAS Build for Android APK/AAB

### EAS Build Setup
```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Configure EAS
eas build:configure

# Build for production
eas build --platform all
```

## 📊 Performance Considerations

- **Offline-First**: App works fully without internet connection
- **Lazy Loading**: Components and screens load on demand
- **Memory Management**: Proper cleanup of audio/video resources
- **Storage Optimization**: Efficient file management and caching
- **iOS Optimizations**: Special handling for iOS 16+ file system restrictions

## 🔐 Security Features

- **Encrypted Storage**: Sensitive data stored securely
- **Authentication**: Optional Supabase Auth integration
- **Data Privacy**: Local-first approach with optional cloud sync
- **File Security**: Proper file permissions and access controls

---

**Built with ❤️ using React Native and Expo**
