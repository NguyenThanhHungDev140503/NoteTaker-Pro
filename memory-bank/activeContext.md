# Active Context - SuperNote

## Công việc hiện tại

### Storage Location Browser Issue - ✅ RESOLVED
- **Problem**: User đang gặp vấn đề với việc mở folder trong file manager trên iOS
- **Context**: File `app/(tabs)/storage.tsx` - function `openFolderInFileManager`
- **Solution**: Đã refactor thành systematic 4-stage approach:
  1. **Stage 1**: Try multiple URL schemes systematically
  2. **Stage 2**: Create and share marker file
  3. **Stage 3**: Direct folder sharing
  4. **Stage 4**: Comprehensive user guidance

### Recent Changes
- ✅ **iOS File Browser Refactor**: Complete rewrite với clean architecture
- ✅ **Helper Functions**: Tách logic thành `tryiOSURLSchemes()` và `createAndShareMarkerFile()`
- ✅ **Better Error Handling**: Comprehensive fallback strategies
- ✅ **Improved UX**: Clear stages và better user feedback
- ✅ **Code Cleanup**: Removed commented code và hardcoded test logic
- Đã implement iOS 16+ optimizations
- Thêm support cho Files app integration
- Cải thiện storage location selection UI
- Thêm iOS-specific storage options

## Technical Debt & Issues

### High Priority
1. **iOS File Browser**: 
   - URL schemes không hoạt động đáng tin cậy
   - Cần alternative approach cho Files app opening
   - Marker file approach cần improvement

2. **Storage Migration**:
   - Chưa có mechanism để migrate notes khi đổi storage location
   - Cần implement data migration service

3. **Error Handling**:
   - iOS file operations cần better error messages
   - Fallback strategies chưa comprehensive

### Medium Priority
1. **Performance**:
   - Notes list cần virtualization cho large datasets
   - Image loading cần lazy loading

2. **Testing**:
   - Chưa có unit tests
   - Cần E2E tests cho critical flows

3. **Documentation**:
   - API documentation chưa đầy đủ
   - User guide cần update

## Recent Decisions

### Architecture
- **Decision**: Sử dụng marker file approach cho iOS folder navigation
- **Rationale**: iOS security restrictions không cho phép direct folder opening
- **Trade-offs**: User experience phức tạp hơn nhưng đảm bảo security

### Technology
- **Decision**: Stick với Expo managed workflow
- **Rationale**: Faster development, easier deployment
- **Trade-offs**: Some native features limited

### UX/UI
- **Decision**: Separate storage management screen
- **Rationale**: Complex functionality cần dedicated space
- **Trade-offs**: Extra navigation step cho users

## Next Steps

### Immediate (Today/Tomorrow)
1. Fix iOS file browser functionality
2. Improve error messages cho storage operations
3. Test trên real iOS devices

### Short Term (This Week)
1. Implement storage migration service
2. Add loading states cho all async operations
3. Create user documentation

### Medium Term (This Month)
1. Add unit test coverage
2. Implement advanced search features
3. Optimize performance cho large datasets
4. Add export formats (PDF, Markdown)

## Active Experiments

### iOS Storage Access
- Testing different URL schemes
- Exploring Sharing API alternatives
- Researching iOS 17 new APIs

### Performance Optimization
- Testing virtualized list implementation
- Experimenting với image caching strategies
- Profiling memory usage

## Team Notes

### Development Environment
- Primary development on Linux
- Testing needed on actual iOS devices
- Web platform có limitations cần document

### User Feedback
- Users want simpler storage selection
- File browser integration highly requested
- Sync status visibility important

## Code Areas Under Active Development

### Files Being Modified
- `app/(tabs)/storage.tsx` - Storage management UI
- `services/iOSStorageService.ts` - iOS-specific storage logic
- `services/storageLocationService.ts` - Cross-platform storage

### Components Needing Refactor
- `NoteCard` - Performance optimization needed
- `AudioRecorder` - Error handling improvement
- `SearchBar` - Advanced search features

### Services Being Enhanced
- `noteService` - Migration functionality
- `syncService` - Conflict resolution
- `iOSStorageService` - Files app integration

## Dependencies to Update

### Security Updates Needed
- Check Supabase client version
- Review Stripe SDK updates

### Feature Updates Available
- Expo SDK 52 features to explore
- React Native 0.76 improvements

## Current Sprint Goals

1. **Fix iOS file browser** ✅ COMPLETED
2. **Improve error handling** ✅ COMPLETED  
3. **Add migration service** ⏳ Pending
4. **Update documentation** 🚧 In Progress
5. **Performance profiling** ⏳ Pending 