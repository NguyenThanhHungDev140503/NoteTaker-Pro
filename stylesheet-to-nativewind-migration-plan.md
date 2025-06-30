# Kế hoạch Chuyển đổi React Native StyleSheet sang NativeWind

**Người lập kế hoạch:** Tech Lead/Solutions Architect
**Ngày:** 31/07/2024
**Mục tiêu:** Chuyển đổi 100% hệ thống styling từ `StyleSheet` sang `NativeWind`, đảm bảo không có lỗi hồi quy giao diện, cải thiện trải nghiệm lập trình viên và tăng tốc độ phát triển.

---

## **Giai đoạn 1: Phân tích & Chuẩn bị (Analysis & Preparation)**

Đây là giai đoạn nền tảng, quyết định sự thành công của toàn bộ quá trình. Sự chuẩn bị kỹ lưỡng sẽ giảm thiểu rủi ro và tăng tốc độ ở các giai đoạn sau.

### **1.1. Kiểm toán Hệ thống Design (Design System Audit)**

Mục tiêu là thống kê và chuẩn hóa tất cả các giá trị style đang tồn tại trong code base.

-   **Hành động:**
    1.  Tạo một file tạm thời (ví dụ: `design-tokens.json`) để ghi lại tất cả các giá trị tìm được.
    2.  Sử dụng công cụ tìm kiếm trong IDE (hoặc `grep`) để tìm tất cả các giá trị được sử dụng cho `color`, `backgroundColor`, `fontSize`, `fontWeight`, `margin`, `padding`, `fontFamily`, v.v.
    3.  Nhóm các giá trị tương tự và đặt cho chúng những cái tên có ý nghĩa. Ví dụ, `#007AFF`, `#007BFF` có thể được nhóm thành `primary-blue`.

-   **Kết quả mong đợi:** Một danh sách đầy đủ các "design token" (màu sắc, phông chữ, khoảng cách...) đang được sử dụng.

    *Ví dụ `design-tokens.json`:*
    ```json
    {
      "colors": {
        "primary": "#007AFF",
        "secondary": "#5856D6",
        "text-main": "#000000",
        "text-subtle": "#6C757D",
        "background-light": "#F8F9FA",
        "border-default": "#DEE2E6"
      },
      "spacing": {
        "xs": "4px",
        "sm": "8px",
        "md": "16px",
        "lg": "24px",
        "xl": "32px"
      },
      "fontSizes": {
        "sm": "12px",
        "base": "16px",
        "lg": "20px",
        "xl": "24px"
      }
    }
    ```

### **1.2. Xây dựng `tailwind.config.js`**

Đây là trái tim của hệ thống NativeWind. File này sẽ là "nguồn chân lý" (single source of truth) cho toàn bộ UI.

-   **Hành động:**
    1.  Dựa vào `design-tokens.json` đã tạo, định nghĩa các token này trong `tailwind.config.js`.
    2.  Sử dụng `theme.extend` để mở rộng theme mặc định của Tailwind thay vì ghi đè hoàn toàn.

-   **Kết quả mong đợi:** Một file `tailwind.config.js` hoàn chỉnh.

    *Ví dụ `tailwind.config.js`:*
    ```javascript
    module.exports = {
      content: [
        "./app/**/*.{js,jsx,ts,tsx}",
        "./components/**/*.{js,jsx,ts,tsx}",
      ],
      theme: {
        extend: {
          colors: {
            primary: "#007AFF",
            secondary: "#5856D6",
            // ... các màu khác từ design audit
          },
          spacing: {
            xs: 4,
            sm: 8,
            md: 16,
            lg: 24,
            xl: 32,
          },
          fontSize: {
            sm: '12px',
            base: '16px',
            lg: '20px',
            xl: '24px',
          }
        },
      },
      plugins: [],
    };
    ```

### **1.3. Tạo Bản đồ Ánh xạ (Mapping Guide)**

Tài liệu này giúp các lập trình viên nhanh chóng chuyển đổi từ tư duy `StyleSheet` sang `NativeWind`.

-   **Hành động:** Tạo một file `MIGRATION_GUIDE.md` trong project.

-   **Kết quả mong đợi:** Một bảng so sánh trực quan.

    *Ví dụ `MIGRATION_GUIDE.md`:*
    ```markdown
    # StyleSheet to NativeWind Mapping Guide

    | StyleSheet Object                               | NativeWind Class                               |
    | ----------------------------------------------- | ---------------------------------------------- |
    | `{ flex: 1 }`                                   | `"flex-1"`                                     |
    | `{ flexDirection: 'row' }`                      | `"flex-row"`                                   |
    | `{ justifyContent: 'center' }`                  | `"justify-center"`                             |
    | `{ alignItems: 'center' }`                      | `"items-center"`                               |
    | `{ backgroundColor: '#FFFFFF' }`                | `"bg-white"`                                   |
    | `{ padding: 16 }`                               | `"p-4"` (nếu 1 unit = 4px)                     |
    | `{ marginVertical: 8 }`                         | `"my-2"`                                       |
    | `{ fontWeight: 'bold' }`                        | `"font-bold"`                                  |
    | `{ position: 'absolute' }`                      | `"absolute"`                                   |
    ```

---

## **Giai đoạn 2: Thiết lập Môi trường & Công cụ (Environment & Tooling)**

Chuẩn bị "sân chơi" để quá trình chuyển đổi diễn ra trơn tru và nhất quán.

### **2.1. Cài đặt và Cấu hình**

-   **Hành động:**
    1.  Cài đặt các gói cần thiết:
        ```bash
        npm install nativewind
        npm install --dev tailwindcss
        ```
    2.  Chạy lệnh init của Tailwind:
        ```bash
        npx tailwindcss init
        ```
        -> Thao tác này sẽ tạo ra file `tailwind.config.js`. Hãy thay thế nội dung file này bằng file đã tạo ở Giai đoạn 1.
    3.  Cấu hình Babel: Mở `babel.config.js` và thêm plugin `nativewind/babel` vào **đầu danh sách** `presets`.
        ```javascript
        // babel.config.js
        module.exports = function(api) {
          api.cache(true);
          return {
            presets: ['nativewind/babel', 'babel-preset-expo'], // nativewind/babel phải được đặt trước
            // ...
          };
        };
        ```

### **2.2. Thiết lập ESLint & Prettier**

-   **Hành động:**
    1.  Cài đặt plugin:
        ```bash
        npm install --dev eslint-plugin-tailwindcss prettier-plugin-tailwindcss
        ```
    2.  Cấu hình ESLint (`.eslintrc.js`):
        ```javascript
        module.exports = {
          extends: [
            // ... các config khác
            "plugin:tailwindcss/recommended"
          ],
          plugins: ["tailwindcss"],
          rules: {
            "tailwindcss/no-custom-classname": "off", // Cho phép custom class nếu cần
            "tailwindcss/classnames-order": "error"
          }
        };
        ```
    3.  Cấu hình Prettier (`.prettierrc.js`): Plugin này sẽ tự động sắp xếp các class trong `className`.
        ```javascript
        module.exports = {
          // ... các config khác
          plugins: [require('prettier-plugin-tailwindcss')],
        };
        ```

### **2.3. Tạo Component Wrapper (Khuyến khích)**

-   **Hành động:** Tạo các component cơ sở đã được "styled" bằng `styled` HOC của NativeWind.
-   **Lợi ích:** Dễ dàng áp dụng style mặc định, quản lý tập trung và đơn giản hóa cú pháp.

    *Ví dụ:*
    ```typescript
    // components/base/View.tsx
    import { styled } from 'nativewind';
    import { View as RNView } from 'react-native';
    export const View = styled(RNView);

    // components/base/Text.tsx
    import { styled } from 'nativewind';
    import { Text as RNText } from 'react-native';
    // Áp dụng font chữ và màu chữ mặc định cho toàn bộ ứng dụng
    export const Text = styled(RNText, 'font-base text-text-main');
    ```

---

## **Giai đoạn 3: Lộ trình Chuyển đổi Chi tiết (Detailed Migration Roadmap)**

Đây là giai đoạn thực thi chính. Áp dụng chiến lược "chia để trị" để đảm bảo an toàn.

### **3.1. Chiến lược theo từng giai đoạn (Phased Approach)**

1.  **Bước 1: Các Component Cơ bản (Atoms):** Bắt đầu từ những component nhỏ nhất và độc lập như `Button`, `Input`, `Avatar`, `Tag`. Chúng là những khối xây dựng cơ bản và ít gây ảnh hưởng lan truyền.
2.  **Bước 2: Các Component Phức hợp (Molecules/Organisms):** Sau khi các "atoms" đã ổn định, chuyển đổi các component lớn hơn được ghép từ chúng, ví dụ: `Card`, `ListItem`, `Header`.
3.  **Bước 3: Các Màn hình (Screens/Pages):** Khi các component đã được chuyển đổi, hãy tiến hành refactor layout của toàn bộ các màn hình.
4.  **Bước 4: Quy tắc cho Tính năng Mới:** **Bắt buộc** tất cả các component hoặc tính năng mới phải được viết bằng NativeWind. Không tạo thêm `StyleSheet` mới.

### **3.2. Xử lý các Trường hợp Phức tạp**

-   **Style Động (Props hoặc State):**
    -   **Cách tiếp cận:** Sử dụng template literals hoặc thư viện `clsx`.
    -   **Ví dụ (Template Literals):**
        ```jsx
        const Button = ({ primary }) => (
          <Pressable className={`p-4 rounded-lg ${primary ? 'bg-primary' : 'bg-gray-400'}`}>
            <Text>Submit</Text>
          </Pressable>
        );
        ```
    -   **Ví dụ (`clsx` cho logic phức tạp):**
        ```bash
        npm install clsx
        ```
        ```jsx
        import clsx from 'clsx';
        const Message = ({ isOwn, isRead }) => (
          <View className={clsx(
            'p-2 rounded-lg',
            { 'bg-primary self-end': isOwn },
            { 'bg-gray-200 self-start': !isOwn },
            { 'opacity-50': !isRead && isOwn }
          )}>
            <Text>...</Text>
          </View>
        );
        ```

-   **Style theo Nền tảng (Platform-Specific):**
    -   **Cách tiếp cận:** Sử dụng các tiền tố `ios:`, `android:` của NativeWind.
    -   **Ví dụ:**
        ```jsx
        <View className="p-4 ios:shadow-lg android:elevation-4 bg-white" />
        ```

-   **Style Nội tuyến (Inline Styles):**
    -   **Chiến lược:** Loại bỏ hoàn toàn. Nếu một style chỉ dùng một lần và không đáng để thêm vào `tailwind.config.js`, hãy sử dụng cú pháp "arbitrary value" của Tailwind.
    -   **Ví dụ:**
        ```jsx
        // Thay vì style={{ top: 13 }}
        <View className="absolute top-[13px]" />
        ```

-   **Style phức tạp từ `StyleSheet.create`:**
    -   **Chiến lược:** Tách logic phức tạp ra thành các hàm tiện ích trả về chuỗi class.
    -   **Ví dụ:**
        ```javascript
        // StyleSheet cũ
        const styles = StyleSheet.create({
          getAvatarStyle: (size) => ({
            width: size,
            height: size,
            borderRadius: size / 2,
          }),
        });

        // Hàm tiện ích mới
        const getAvatarClasses = (size) => {
          return `w-[${size}px] h-[${size}px] rounded-full`;
        };

        // Sử dụng trong component
        <Image className={getAvatarClasses(50)} source={...} />
        ```

---

## **Giai đoạn 4: Kiểm thử & Đảm bảo Chất lượng (Testing & QA)**

Đảm bảo rằng quá trình chuyển đổi không phá vỡ giao diện người dùng.

### **4.1. Kiểm thử Hồi quy Giao diện (Visual Regression Testing)**

-   **Tầm quan trọng:** Đây là "lưới an toàn" quan trọng nhất. Nó tự động phát hiện các thay đổi không mong muốn về mặt giao diện.
-   **Công cụ đề xuất:**
    -   **Storybook:** Tạo các "stories" cho mỗi component ở trạng thái trước và sau khi chuyển đổi. Sử dụng addon `storybook-addon-measure` để so sánh kích thước.
    -   **Dịch vụ bên thứ ba:** `Percy` hoặc `Applitools` có thể tích hợp vào CI/CD để tự động chụp và so sánh ảnh chụp màn hình ứng dụng trên nhiều thiết bị.
-   **Quy trình:**
    1.  Trước khi refactor một component, hãy tạo một snapshot (ảnh chụp).
    2.  Sau khi refactor, chạy test để so sánh snapshot mới với snapshot gốc.
    3.  Chỉ merge Pull Request khi các khác biệt (nếu có) được xác nhận là có chủ đích.

### **4.2. Quy trình Review Code (Code Review Process)**

-   **Hành động:** Thiết lập một checklist cho các Pull Request liên quan đến việc chuyển đổi.
-   **Checklist đề xuất:**
    -   [ ] Toàn bộ `StyleSheet.create` trong file đã được loại bỏ?
    -   [ ] Không còn `style={...}` nào được sử dụng?
    -   [ ] Các giá trị "ma thuật" (magic numbers) đã được thay thế bằng token từ `tailwind.config.js` hoặc arbitrary value `[...]`?
    -   [ ] Các class đã được sắp xếp tự động bởi Prettier/ESLint?
    -   [ ] Style động/theo nền tảng có được xử lý đúng cách không?
    -   [ ] Đã kiểm tra giao diện trên cả iOS và Android chưa?

---

## **Giai đoạn 5: Tối ưu hóa & Hoàn thiện (Optimization & Finalization)**

Hoàn tất quá trình và chuẩn bị cho tương lai.

### **5.1. Dọn dẹp Code (Code Cleanup)**

-   **Hành động:** Sau khi toàn bộ dự án đã được chuyển đổi, thực hiện một lượt rà soát cuối cùng để xóa các đối tượng `StyleSheet` không còn được sử dụng.
-   **Mẹo:** Sử dụng tính năng "Find Usages" của IDE để đảm bảo một biến style không còn được tham chiếu ở đâu trước khi xóa.

### **5.2. Tài liệu hóa (Documentation)**

-   **Hành động:**
    1.  Cập nhật file `CONTRIBUTING.md` hoặc wiki của dự án.
    2.  Thêm một mục "Styling" mới, giải thích về việc sử dụng NativeWind là bắt buộc.
    3.  Liên kết đến file `tailwind.config.js` và `MIGRATION_GUIDE.md` đã tạo.
    4.  Ghi lại các quy ước chung (ví dụ: khi nào nên tạo custom class, cách đặt tên...).

### **5.3. Đào tạo Đội ngũ (Team Training)**

-   **Hành động:** Tổ chức một buổi chia sẻ kiến thức (knowledge sharing session) cho toàn bộ đội ngũ phát triển.
-   **Nội dung:**
    -   Trình bày về lý do và lợi ích của việc chuyển đổi.
    -   Hướng dẫn qua về `tailwind.config.js` và các token tùy chỉnh.
    -   Trình bày cách xử lý các trường hợp phức tạp đã nêu ở Giai đoạn 3.
    -   Q&A để giải đáp các thắc mắc. 