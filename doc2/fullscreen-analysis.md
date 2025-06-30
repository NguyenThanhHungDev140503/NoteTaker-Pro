# Phân Tích Chế Độ Toàn Màn Hình (Fullscreen) trong VideoPlayer

Tài liệu này phân tích cách thành phần `VideoPlayer` triển khai và quản lý chế độ xem video toàn màn hình trong ứng dụng SuperNote, **dựa trên phiên bản mới sử dụng `expo-video`**.

## Tổng Quan

Chức năng trình phát video đã được tái cấu trúc để sử dụng thư viện `expo-video` hiện đại và hiệu năng cao. Thành phần tùy chỉnh `VideoPlayer.tsx` của chúng ta giờ đây sử dụng hook `useVideoPlayer` làm trung tâm, và component `VideoView` để hiển thị, cho phép chúng ta xây dựng các điều khiển tùy chỉnh và quản lý trạng thái một cách mạnh mẽ.

## Cơ Chế Hoạt Động

Cơ chế toàn màn hình dựa trên sự kết hợp giữa hook `useVideoPlayer`, các phương thức trên `VideoView` ref, lắng nghe sự kiện gốc (native events), và các thay đổi về kiểu dáng (styling) giao diện người dùng.

### 1. Các Thành Phần Chính

*   **Thư viện:** `expo-video` (thay thế cho `expo-av`)
*   **Hook Quản lý:** `useVideoPlayer`
*   **Component Hiển thị:** `VideoView`
*   **Component Tùy Chỉnh:** `VideoPlayer.tsx`
*   **State Quản lý:** `const [isFullscreen, setIsFullscreen] = useState(false);`
*   **Ref tới Video:** `const videoRef = useRef<VideoView>(null);`

### 2. Luồng Kích Hoạt và Thực Thi

```mermaid
graph TD
    A[Người dùng nhấn nút Maximize] --> B{Gọi hàm toggleFullscreen};
    B -- isFullscreen is false --> C[Gọi videoRef.current.enterFullscreen()];
    C --> D[expo-video kích hoạt chế độ Fullscreen gốc của HĐH];
    subgraph "UI & State Changes"
        D --> E[Cập nhật state: setIsFullscreen(true)];
        E --> F[Ẩn StatusBar của hệ thống];
        F --> G[Áp dụng style 'fullscreenContainer'];
        G --> H[Kích hoạt điều khiển gốc: nativeControls=true];
    end

    I[Người dùng thoát Fullscreen bằng nút gốc] --> J{Prop 'onFullscreenExit' được kích hoạt};
    J --> K{Handler cập nhật lại state: setIsFullscreen(false)};
    K --> L[Khôi phục UI ban đầu & Hiện StatusBar];

    M[Người dùng nhấn nút 'X' trong UI tùy chỉnh] --> N{Gọi hàm toggleFullscreen};
    N -- isFullscreen is true --> O[Gọi videoRef.current.exitFullscreen()];
    O --> P{Hành động này cũng sẽ kích hoạt 'onFullscreenExit'};
    P --> J;

```

### 3. Phân Tích Chi Tiết

*   **Kích hoạt Fullscreen**:
    *   Người dùng nhấn vào biểu tượng `Maximize2` trong các điều khiển tùy chỉnh.
    *   Hàm `toggleFullscreen()` được gọi.
    *   Nó kiểm tra trạng thái `isFullscreen`. Nếu là `false`, nó sẽ gọi phương thức `videoRef.current.enterFullscreen()`. Đây là một lệnh gọi không đồng bộ tới API gốc của nền tảng.
    *   Trạng thái `isFullscreen` được cập nhật ngay thành `true` để thay đổi UI.

*   **Thay Đổi Giao Diện Người Dùng (UI)**:
    *   Khi `isFullscreen` là `true`, kiểu dáng của vùng chứa video chính sẽ chuyển sang `styles.fullscreenContainer`, sử dụng `position: 'absolute'` và `zIndex` để phủ lên toàn bộ màn hình.
    *   **Thanh trạng thái (StatusBar) của hệ thống được ẩn đi** để có trải nghiệm toàn màn hình trọn vẹn.
    *   Các điều khiển tùy chỉnh của chúng ta sẽ thay đổi: nút `Maximize2` bị ẩn và nút `X` (để thoát) được hiển thị.
    *   Quan trọng nhất, thuộc tính `nativeControls` của `VideoView` được đặt thành `true`. Điều này hướng dẫn `expo-video` hiển thị các điều khiển video gốc của hệ điều hành, đảm bảo trải nghiệm quen thuộc và đầy đủ chức năng cho người dùng.

*   **Thoát Fullscreen**:
    *   Người dùng có thể thoát bằng cách nhấn vào nút `X` tùy chỉnh (gọi lại `toggleFullscreen()`, lần này sẽ thực thi `exitFullscreen()`) hoặc bằng cách sử dụng các điều khiển gốc (ví dụ: nhấn nút "Done" trên trình phát video của iOS) và cũng dùng props `onFullScreenExit()` để tiến hành cập nhật trạng thái sate `isFullScreen`.
    *   Khi một hành động gốc xảy ra, `expo-video` sẽ phát ra các sự kiện để thông báo.

*   **Đồng bộ hóa Trạng thái (Rất quan trọng)**:
    *   Để đảm bảo trạng thái `isFullscreen` trong React luôn đồng bộ với trạng thái thực của trình phát video, chúng ta **chỉ dựa vào một cơ chế duy nhất và đáng tin cậy**:
        1.  **Prop `onFullscreenExit`**: Component `VideoView` cung cấp một prop `onFullscreenExit`. Đây là trình xử lý sự kiện chính thức được kích hoạt khi người dùng thoát khỏi chế độ toàn màn hình bằng bất kỳ phương thức nào (bao gồm cả các điều khiển gốc). Bên trong hàm callback của prop này, chúng ta cập nhật trạng thái `isFullscreen` về `false`.
    *   Cách tiếp cận này giúp đơn giản hóa mã nguồn và tin tưởng vào API chính thức do `expo-video` cung cấp, tránh sự phức tạp không cần thiết.

## Kết Luận

Việc triển khai chế độ toàn màn hình đã được nâng cấp và sau đó được tinh giản hóa. Bằng cách sử dụng `expo-video` và hook `useVideoPlayer`, phiên bản hiện tại tận dụng hiệu quả các API gốc thông qua `enterFullscreen`/`exitFullscreen`. Quan trọng hơn, nó **dựa hoàn toàn vào prop `onFullscreenExit` để đồng bộ hóa trạng thái một cách đáng tin cậy**, loại bỏ các lớp logic dự phòng phức tạp. Việc quản lý `StatusBar` và chuyển giao quyền kiểm soát cho `nativeControls` khi ở chế độ toàn màn hình giúp mang lại trải nghiệm chuyên nghiệp, liền mạch và dễ bảo trì.