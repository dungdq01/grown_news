# T03-55 — M11_video: cổng cho bốn AC của spec (đơn vị TEST)

> `web/test/man-video.test.js` (MỚI). Spec `06_modules/M11_video/spec.md` khai
> bốn AC bằng `cmd: node test/man-video.test.js` **từ C0 (FR-038)** — và file đó
> chưa từng tồn tại. Bốn dòng hợp đồng trỏ vào hư không suốt từ lúc mở module;
> `check_g6b` báo "KHÔNG ai sinh: 2" nhưng nó CẢNH BÁO chứ không đỏ.
>
> Spec đang FROZEN ⇒ không sửa spec để nó trỏ sang cổng khác. Viết cổng nó khai.
>
> **§1 · AC-2.2.1** — gieo CẢ BA module rồi đòi màn `/video/` chỉ hiện 2 thẻ
> video. Chỉ gieo video thì phép lọc không được thử. Kèm ca âm cho chính phép
> đếm: toàn trang phải nhiều thẻ hơn khối, không thì tôi đang đếm toàn trang
> (lỗi `#acount` của BUG-2).
>
> **§2 · AC-2.2.2 — vế nặng nhất, và KHÔNG cổng nào trong 71 file đang đo nó.**
> `no-leak.test.js` đo LISTENER rò, không đo REQUEST ra ngoài. Đo được lúc viết:
> màn có **0 iframe** và **0 src/href tuyệt đối ra ngoài** ⇒ cổng XANH ngay. Nên
> nó tự chứng minh mình ĐỎ ĐƯỢC: chèn một iframe youtube vào bản sao HTML rồi
> đòi cả hai vế bắt. Cộng vế thứ hai — `src` chỉ gán trong `nhungVideo`, và
> `id_mau` kiểm TRƯỚC khi gán (M09-R3), đo trên byte đã build.
>
> **§3 · AC-2.3.1** — `hostVideoHopLe` có mặt, đọc bảng khai, so theo hậu tố CÓ
> DẤU CHẤM (`includes` cho lọt `youtube.com.ke-xau.example`), và ĐƯỢC GỌI.
>
> **§4 · AC-2.3.2** — nhãn `chủ đề`/`khái niệm` trên form nạp. KHÔNG đoán tiền tố
> id: lượt đầu đo bằng `nv-` và FAIL trong khi ô có thật (`vd-`) — suýt đi sửa
> MÀN thay vì sửa PHÉP ĐO.

phạm_vi_ghi:
  - web/test/man-video.test.js
  - web/test/WORKLOG.md
  - web/package.json

verifiability: hard
tiêu_chí:
  - AC1: cổng chạy được và xanh, đúng lệnh spec khai
    cmd: cd web && node test/man-video.test.js
  - AC2: có trong `npm test`, không cổng nào khác đỏ thêm
    cmd: cd web && npm test
