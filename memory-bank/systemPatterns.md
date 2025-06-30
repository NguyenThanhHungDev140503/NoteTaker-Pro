# System Patterns - SuperNote

## Kiến trúc tổng quan

```
┌─────────────────────────────────────────────────────────┐
│                    Client Layer                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │     iOS     │  │   Android   │  │     Web     │    │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘    │
│         └─────────────────┴─────────────────┘           │
│                           │                              │
│                    React Native/Expo                     │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────┐
│                    State Management                      │
│  ┌─────────────────────────────────────────────────┐   │
│  │            React Context API                      │   │
│  │  - NotesContext (CRUD operations)               │   │
│  │  - AuthContext (user state)                     │   │
│  │  - StorageContext (location management)         │   │
│  └─────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────┐
│                    Service Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ noteService  │  │ authService  │  │storageService│ │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤ │
│  │syncService   │  │stripeService │  │iOSStorage    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────┐
│                  Infrastructure Layer                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  FileSystem  │  │   Supabase   │  │    Stripe    │ │
│  │     API      │  │  (Auth, DB)  │  │   Payment    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Design Patterns được sử dụng

### 1. Repository Pattern
```typescript
// noteService.ts acts as repository
interface NoteRepository {
  loadNotes(): Promise<Note[]>
  saveNotes(notes: Note[]): Promise<void>
  deleteNote(id: string): Promise<void>
}
```

### 2. Service Layer Pattern
- Tách biệt business logic khỏi UI components
- Services handle data operations và external APIs
- Components chỉ focus vào presentation

### 3. Context Provider Pattern
```typescript
// Centralized state management
<NotesProvider>
  <App />
</NotesProvider>
```

### 4. Factory Pattern
```typescript
// Note creation với unique IDs
const createNote = (): Note => ({
  id: Date.now().toString(),
  title: '',
  content: '',
  createdAt: new Date(),
  // ...
})
```

### 5. Adapter Pattern
```typescript
// Platform-specific implementations
const StorageAdapter = Platform.select({
  ios: iOSStorageService,
  android: androidStorageService,
  default: defaultStorageService,
})
```

## Component Architecture

### Screen Components (Views)
- `index.tsx` - Home/Dashboard
- `create.tsx` - Note creation
- `notes.tsx` - Notes listing
- `note-detail.tsx` - Note detail view
- `settings.tsx` - App settings
- `storage.tsx` - Storage management

### Reusable Components
- `NoteCard` - Note display card
- `SearchBar` - Search functionality
- `AudioRecorder` - Voice recording
- `AudioPlayer` - Audio playback
- `MediaPicker` - Image selection
- `FilterModal` - Note filtering

### Service Architecture

#### noteService
- CRUD operations cho notes
- Local file storage với JSON
- Sync với cloud khi cần
- Import/Export functionality

#### storageService
- Abstract storage operations
- Platform-specific implementations
- Location management
- Permission handling

#### authService
- Supabase authentication
- Session management
- User profile operations
- Token refresh

#### syncService
- Background sync
- Conflict resolution
- Queue management
- Retry logic

## Data Flow

```
User Action → Component → Context → Service → Storage
     ↑                                          ↓
     └──────────── State Update ←───────────────┘
```

## Storage Strategy

### Local Storage
```
FileSystem.documentDirectory/
├── notes.json          # Main notes data
├── audio/             # Audio recordings
│   └── [noteId]_[timestamp].m4a
└── images/            # Image attachments
    └── [noteId]_[index].jpg
```

### Cloud Storage (Supabase)
```
notes_table
├── id (uuid)
├── user_id (references auth.users)
├── title (text)
├── content (text)
├── tags (text[])
├── attachments (jsonb)
├── created_at (timestamp)
└── updated_at (timestamp)
```

## Platform-Specific Patterns

### iOS Optimizations
- Security-scoped bookmarks
- Files app integration
- iCloud Drive support
- Background fetch untuk sync

### Android Patterns
- Storage Access Framework
- Content providers
- Intent filters untuk sharing
- WorkManager untuk background tasks

### Web Limitations
- No file system access
- IndexedDB untuk local storage
- Service Workers untuk offline
- Limited audio recording

## Security Patterns

### Authentication Flow
```
App Start → Check Session → Valid? → Home
                ↓
            Login Screen → Supabase Auth → Store Token
```

### Data Protection
- Encryption at rest (future)
- Secure token storage
- API key protection
- User data isolation

## Performance Patterns

### Lazy Loading
- Load notes on demand
- Pagination untuk large datasets
- Image thumbnail generation
- Audio streaming

### Caching Strategy
- In-memory cache untuk active notes
- Disk cache untuk attachments
- API response caching
- Offline queue untuk sync

### Optimization Techniques
- Debounced search
- Virtualized lists
- Image compression
- Audio format optimization

## Error Handling

### Graceful Degradation
- Offline mode fallback
- Sync error recovery
- Storage permission fallback
- Payment failure handling

### User Feedback
- Loading states
- Error messages
- Success confirmations
- Progress indicators 