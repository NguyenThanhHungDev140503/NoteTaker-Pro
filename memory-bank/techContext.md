# Tech Context - SuperNote

## Technology Stack

### Frontend Framework
- **React Native**: v0.76.5 - Cross-platform mobile development
- **Expo**: v52.0.17 - Development platform và tooling
- **TypeScript**: Type safety và better developer experience

### UI Components & Styling
- **React Native Core Components**: View, Text, TouchableOpacity, etc.
- **react-native-safe-area-context**: v4.12.0 - Safe area handling
- **lucide-react-native**: v0.456.0 - Icon library
- **Expo Vector Icons**: Built-in icon sets

### Navigation
- **Expo Router**: v4.0.9 - File-based routing
- **Stack Navigator**: For auth flow
- **Tab Navigator**: Main app navigation

### State Management
- **React Context API**: Native React solution
- **Custom Hooks**: useNotes, useAuth, useStorage

### Storage & Database
- **Expo FileSystem**: v18.0.6 - Local file storage
- **AsyncStorage**: Key-value storage
- **Supabase**: v2.46.2 - Backend as a Service
  - PostgreSQL database
  - Real-time subscriptions
  - Row Level Security

### Authentication
- **Supabase Auth**: Email/password authentication
- **Secure Store**: Token storage on device
- **Session management**: Auto refresh tokens

### Media Handling
- **Expo AV**: v15.0.1 - Audio recording/playback
- **Expo Image Picker**: v16.0.3 - Image selection
- **Expo Media Library**: v17.0.1 - Media access
- **Expo Document Picker**: v13.0.1 - File selection

### Payments
- **Stripe**: Payment processing
- **react-native-stripe**: v0.35.0 - Stripe SDK
- **Supabase Edge Functions**: Webhook handling

### Platform-Specific
- **iOS**:
  - expo-ios-browser-service
  - iOS 16+ optimizations
  - Files app integration
- **Android**:
  - expo-intent-launcher: v12.0.1
  - Storage Access Framework

### Development Tools
- **TypeScript**: v5.3.3
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Expo CLI**: Development server

## Project Structure

```
SuperNote/
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Tab-based screens
│   ├── auth/              # Authentication screens
│   └── payment/           # Payment screens
├── components/            # Reusable components
├── contexts/              # React Context providers
├── hooks/                 # Custom React hooks
├── services/              # Business logic services
├── types/                 # TypeScript type definitions
├── supabase/              # Supabase functions & migrations
└── assets/                # Images, fonts, etc.
```

## Environment Setup

### Required Environment Variables
```bash
# Supabase
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Stripe
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_key
STRIPE_SECRET_KEY=your_stripe_secret
```

### Development Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI
- iOS Simulator (Mac only) or Android Emulator
- Expo Go app for device testing

### Installation Steps
```bash
# Clone repository
git clone [repo-url]

# Install dependencies
npm install

# Start development server
npm start

# Run on specific platform
npm run ios
npm run android
npm run web
```

## Key Technical Decisions

### Why React Native + Expo?
- Single codebase for iOS, Android, Web
- Fast development with hot reload
- Rich ecosystem và community
- Native performance với JS flexibility

### Why Supabase?
- Open source alternative to Firebase
- PostgreSQL với full SQL support
- Built-in auth và real-time
- Self-hostable option

### Why Context API vs Redux?
- Simpler for app size này
- No additional dependencies
- Native React solution
- Sufficient cho current needs

### Why TypeScript?
- Type safety reduces bugs
- Better IDE support
- Self-documenting code
- Easier refactoring

## Performance Considerations

### Bundle Size
- Use dynamic imports
- Tree shaking enabled
- Minimize dependencies
- Lazy load screens

### Memory Management
- Cleanup audio resources
- Compress images before save
- Paginate large lists
- Clear unused cache

### Network Optimization
- Batch API calls
- Implement retry logic
- Cache responses
- Offline queue

## Security Measures

### Data Security
- HTTPS only
- JWT token validation
- Input sanitization
- SQL injection prevention

### Storage Security
- Encrypted preferences
- Secure token storage
- File access permissions
- User data isolation

### API Security
- Rate limiting
- API key rotation
- CORS configuration
- Request validation

## Deployment Configuration

### iOS
- Bundle ID: com.supernote.app
- Minimum iOS: 13.0
- Capabilities: Audio, Files

### Android
- Package name: com.supernote.app
- Min SDK: 21 (Android 5.0)
- Permissions: Storage, Audio

### Web
- PWA support
- Responsive design
- Service worker
- SEO optimization 