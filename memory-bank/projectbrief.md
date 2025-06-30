# Project Brief - SuperNote

## Tổng quan dự án

SuperNote là một ứng dụng ghi chú đa nền tảng được xây dựng với React Native (Expo), cho phép người dùng tạo, quản lý và đồng bộ ghi chú với các tính năng phong phú.

## Mục tiêu chính

1. **Tạo ứng dụng ghi chú toàn diện**: Hỗ trợ text, âm thanh, hình ảnh
2. **Đa nền tảng**: iOS, Android và Web thông qua Expo
3. **Lưu trữ linh hoạt**: Hỗ trợ lưu trữ local và cloud
4. **Trải nghiệm người dùng mượt mà**: UI/UX hiện đại, responsive
5. **Bảo mật và riêng tư**: Dữ liệu người dùng được bảo vệ

## Phạm vi dự án

### Tính năng cốt lõi
- ✅ Tạo, sửa, xóa ghi chú
- ✅ Ghi âm và phát lại âm thanh
- ✅ Đính kèm hình ảnh
- ✅ Tìm kiếm và lọc ghi chú
- ✅ Yêu thích ghi chú
- ✅ Quản lý vị trí lưu trữ
- ✅ Import/Export ghi chú
- ✅ Xác thực người dùng (Supabase)
- ✅ Thanh toán subscription (Stripe)

### Nền tảng hỗ trợ
- iOS (đặc biệt tối ưu cho iOS 16+)
- Android
- Web (hạn chế một số tính năng)

### Công nghệ sử dụng
- Frontend: React Native với Expo
- Backend: Supabase (Auth, Database, Storage)
- Payment: Stripe
- Storage: FileSystem API, Document Picker
- State Management: React Context API

## Ràng buộc và yêu cầu

### Kỹ thuật
- Hỗ trợ offline-first
- Đồng bộ dữ liệu khi có kết nối
- Performance tối ưu cho thiết bị yếu
- File size giới hạn cho attachments

### Business
- Free tier với giới hạn số lượng ghi chú
- Premium subscription cho unlimited features
- Tuân thủ privacy regulations

## Thành công được định nghĩa như thế nào

1. **User Adoption**: 10,000+ active users trong 6 tháng
2. **Performance**: App khởi động < 3 giây, UI response < 100ms
3. **Reliability**: 99.9% uptime, zero data loss
4. **User Satisfaction**: 4.5+ rating trên app stores
5. **Revenue**: 5% conversion rate từ free sang premium

## Stakeholders

- **End Users**: Người dùng cá nhân cần ghi chú hàng ngày
- **Development Team**: Team phát triển và bảo trì
- **Product Owner**: Định hướng sản phẩm và tính năng
- **Support Team**: Hỗ trợ người dùng 