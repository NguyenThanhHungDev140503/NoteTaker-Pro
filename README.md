# SuperNote - NoteTaker Pro

**Ứng dụng ghi chú thông minh với tính năng đa phương tiện và đồng bộ hóa đám mây**

SuperNote (NoteTaker Pro) là một ứng dụng ghi chú hiện đại được xây dựng bằng React Native và Expo, cung cấp trải nghiệm ghi chú toàn diện với khả năng tích hợp văn bản, hình ảnh và âm thanh trong một giao diện trực quan và dễ sử dụng.

## 🚀 Tính năng chính

### 📝 Ghi chú đa phương tiện
- **Ghi chú văn bản**: Soạn thảo và chỉnh sửa ghi chú với giao diện thân thiện
- **Tích hợp hình ảnh**: Chụp ảnh trực tiếp hoặc chọn từ thư viện ảnh
- **Ghi âm**: Thu âm và phát lại các ghi chú âm thanh
- **Quản lý tags**: Phân loại ghi chú bằng hệ thống tag linh hoạt

### 🔍 Tìm kiếm và lọc
- Tìm kiếm nhanh theo tiêu đề và nội dung
- Lọc theo ngày tạo, ngày cập nhật, tiêu đề
- Sắp xếp tăng dần/giảm dần
- Hiển thị chỉ ghi chú yêu thích

### ⭐ Tính năng nâng cao
- **Yêu thích**: Đánh dấu ghi chú quan trọng
- **Đồng bộ đám mây**: Sao lưu và đồng bộ dữ liệu qua Supabase
- **Quản lý lưu trữ**: Tối ưu hóa không gian lưu trữ, đặc biệt cho iOS
- **Bảo mật**: Mã hóa dữ liệu và xác thực người dùng
- **Thanh toán**: Tích hợp Stripe cho các tính năng premium

### 📱 Đa nền tảng
- **iOS**: Hỗ trợ iPhone và iPad với tối ưu hóa riêng
- **Android**: Giao diện Material Design
- **Web**: Phiên bản web responsive

## 🛠 Yêu cầu hệ thống

### Môi trường phát triển
- **Node.js**: >= 18.0.0
- **npm**: >= 8.0.0 hoặc **yarn**: >= 1.22.0
- **Expo CLI**: >= 6.0.0
- **React Native CLI**: >= 0.72.0

### Thiết bị
- **iOS**: iOS 13.0+ (iPhone 6s trở lên)
- **Android**: Android 6.0+ (API level 23+)
- **Web**: Các trình duyệt hiện đại (Chrome, Firefox, Safari, Edge)

### Dịch vụ bên ngoài
- **Supabase**: Cơ sở dữ liệu và authentication
- **Stripe**: Xử lý thanh toán (tùy chọn)

## 📦 Cài đặt

### 1. Clone repository
```bash
git clone https://github.com/your-username/SuperNote.git
cd SuperNote
```

### 2. Cài đặt dependencies
```bash
npm install
# hoặc
yarn install
```

### 3. Cấu hình môi trường
Tạo file `.env` trong thư mục gốc:
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_key
```

### 4. Cài đặt Expo CLI (nếu chưa có)
```bash
npm install -g @expo/cli
```

### 5. Khởi chạy ứng dụng
```bash
# Chế độ phát triển
npm run dev

# Chế độ phát triển với tunnel
npm run dev:tunnel

# Xóa cache và khởi động
npm run dev:clear

# Chạy trên web
npm run start:web
```

## 🎯 Hướng dẫn sử dụng

### Khởi tạo lần đầu
1. **Đăng ký tài khoản**: Tạo tài khoản mới hoặc đăng nhập
2. **Cấp quyền**: Cho phép ứng dụng truy cập camera, microphone và thư viện ảnh
3. **Thiết lập lưu trữ**: Chọn vị trí lưu trữ phù hợp

### Tạo ghi chú mới
```typescript
// Ví dụ tạo ghi chú với API
const newNote = {
  title: "Ghi chú mẫu",
  content: "Nội dung ghi chú...",
  images: ["path/to/image.jpg"],
  audioRecordings: ["path/to/audio.m4a"],
  tags: ["công việc", "quan trọng"]
};
```

### Tính năng ghi âm
1. Nhấn nút **Ghi âm** trong màn hình tạo ghi chú
2. Cho phép quyền truy cập microphone
3. Nhấn **Bắt đầu** để ghi âm
4. Nhấn **Dừng** để kết thúc và lưu

### Quản lý hình ảnh
1. Nhấn nút **Thêm hình ảnh**
2. Chọn **Chụp ảnh** hoặc **Chọn từ thư viện**
3. Hình ảnh sẽ được tự động nén và lưu trữ

## 📁 Cấu trúc thư mục

```
SuperNote/
├── app/                          # Expo Router pages
│   ├── (tabs)/                   # Tab navigation
│   │   ├── index.tsx            # Trang chủ
│   │   ├── create.tsx           # Tạo ghi chú
│   │   ├── notes.tsx            # Danh sách ghi chú
│   │   ├── settings.tsx         # Cài đặt
│   │   └── storage.tsx          # Quản lý lưu trữ
│   ├── auth/                    # Authentication
│   │   ├── login.tsx            # Đăng nhập
│   │   └── signup.tsx           # Đăng ký
│   ├── payment/                 # Thanh toán
│   └── note-detail.tsx          # Chi tiết ghi chú
├── components/                   # React components
│   ├── AudioPlayer.tsx          # Trình phát âm thanh
│   ├── AudioRecorder.tsx        # Ghi âm
│   ├── NoteCard.tsx             # Card ghi chú
│   ├── SearchBar.tsx            # Thanh tìm kiếm
│   └── FilterModal.tsx          # Modal lọc
├── services/                     # Business logic
│   ├── noteService.ts           # Quản lý ghi chú
│   ├── authService.ts           # Xác thực
│   ├── storageService.ts        # Lưu trữ
│   ├── syncService.ts           # Đồng bộ
│   └── stripeService.ts         # Thanh toán
├── contexts/                     # React contexts
│   └── NotesContext.tsx         # Context ghi chú
├── hooks/                        # Custom hooks
│   ├── useNotesSync.ts          # Hook đồng bộ
│   └── useStorageInfo.ts        # Hook lưu trữ
├── types/                        # TypeScript types
│   └── note.ts                  # Định nghĩa Note
├── assets/                       # Tài nguyên tĩnh
│   └── images/                  # Hình ảnh
├── supabase/                     # Supabase config
│   ├── functions/               # Edge functions
│   └── migrations/              # Database migrations
└── doc/                          # Tài liệu
    └── *.md                     # Báo cáo kỹ thuật
```

## 🔧 Scripts có sẵn

```bash
# Phát triển
npm run dev              # Khởi động development server
npm run dev:tunnel       # Khởi động với tunnel (cho testing trên thiết bị thật)
npm run dev:clear        # Xóa cache và khởi động

# Production
npm run build:web        # Build cho web
npm run start           # Khởi động production server

# Maintenance
npm run lint            # Kiểm tra code style
npm run clean           # Xóa cache
npm run reset           # Reset hoàn toàn (xóa node_modules và reinstall)
```

## 🔌 API Documentation

### Note Service API

#### Tạo ghi chú mới
```typescript
import { noteService } from './services/noteService';

const note = await noteService.createNote({
  title: string,
  content: string,
  images?: string[],
  audioRecordings?: string[],
  tags?: string[]
});
```

#### Lấy danh sách ghi chú
```typescript
const notes = await noteService.getNotes({
  sortBy: 'updatedAt' | 'createdAt' | 'title',
  sortOrder: 'asc' | 'desc',
  showFavoritesOnly: boolean
});
```

#### Cập nhật ghi chú
```typescript
const updatedNote = await noteService.updateNote(noteId, {
  title?: string,
  content?: string,
  isFavorite?: boolean,
  tags?: string[]
});
```

### Storage Service API

#### Tải lên file
```typescript
import { storageService } from './services/storageService';

const fileUrl = await storageService.uploadFile(
  file: File | Blob,
  path: string,
  options?: UploadOptions
);
```

## 🤝 Hướng dẫn đóng góp

### Quy trình đóng góp
1. **Fork** repository này
2. **Clone** fork về máy local
3. Tạo **branch** mới cho tính năng: `git checkout -b feature/amazing-feature`
4. **Commit** thay đổi: `git commit -m 'Add amazing feature'`
5. **Push** lên branch: `git push origin feature/amazing-feature`
6. Tạo **Pull Request**

### Coding Standards
- Sử dụng **TypeScript** cho tất cả code mới
- Tuân thủ **ESLint** và **Prettier** configuration
- Viết **unit tests** cho các tính năng mới
- Cập nhật **documentation** khi cần thiết

### Commit Message Convention
```
type(scope): description

feat(notes): add audio recording functionality
fix(storage): resolve iOS storage optimization issue
docs(readme): update installation instructions
```

### Testing
```bash
# Chạy tests
npm test

# Chạy tests với coverage
npm run test:coverage

# Chạy tests trong watch mode
npm run test:watch
```

## 📄 License

Dự án này được phân phối dưới giấy phép **MIT License**. Xem file [LICENSE](LICENSE) để biết thêm chi tiết.

```
MIT License

Copyright (c) 2024 SuperNote Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 👥 Tác giả và Đóng góp

### Core Team
- **Lead Developer**: [Tên của bạn]
- **UI/UX Designer**: [Tên designer]
- **Backend Developer**: [Tên backend dev]

### Contributors
Cảm ơn tất cả những người đã đóng góp cho dự án này! 🙏

<!-- Danh sách contributors sẽ được tự động cập nhật -->

## 🔗 Liên kết hữu ích

- **Documentation**: [Link to docs]
- **Demo**: [Link to live demo]
- **Bug Reports**: [GitHub Issues](https://github.com/your-username/SuperNote/issues)
- **Feature Requests**: [GitHub Discussions](https://github.com/your-username/SuperNote/discussions)
- **Discord Community**: [Link to Discord]

## 📊 Thống kê dự án

![GitHub stars](https://img.shields.io/github/stars/your-username/SuperNote?style=social)
![GitHub forks](https://img.shields.io/github/forks/your-username/SuperNote?style=social)
![GitHub issues](https://img.shields.io/github/issues/your-username/SuperNote)
![GitHub license](https://img.shields.io/github/license/your-username/SuperNote)

## 🚧 Roadmap

### Version 2.0 (Q2 2024)
- [ ] Collaborative notes (chia sẻ ghi chú)
- [ ] Advanced search với AI
- [ ] Dark mode
- [ ] Export to PDF/Word

### Version 2.1 (Q3 2024)
- [ ] Offline sync
- [ ] Voice-to-text transcription
- [ ] Advanced media editing
- [ ] Plugin system

---

**Được phát triển với ❤️ bởi SuperNote Team**

*Nếu bạn thấy dự án này hữu ích, hãy cho chúng tôi một ⭐ trên GitHub!*
