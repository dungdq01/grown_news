# T03-34 — C6b: màn `/video/nap/` — đường TẠO video (đơn vị CODE)

> **Đường này CHƯA HỀ TỒN TẠI.** Đo được ở plan (sự thật 6): không tab nạp video,
> không hàm nào POST `source_type: "video"`. Phần video đã có chỉ là **XEM**
> (`idVideo()` · `nhungVideo()`). Đăng ký một video hôm nay phải đi qua form viết
> bài chung — tức đúng "gộp chung" người dùng cấm.
>
> Ba lối nạp bài viết nhận một BẢN PHÂN TÍCH; màn tài liệu nhận một HIỆN VẬT;
> màn này nhận một **URL**. Ba hình dạng khác nhau ⇒ ba màn.
>
> **DÙNG LẠI máy móc đã có, không phát minh cơ chế thứ hai** — `gn.js` đang
> **95/100 KB**, còn 5 KB:
> `kqTV()` báo kết quả · `MEDIA.video_host` whitelist · `idVideo()` đã tách được
> host+id từ một URL · khuôn `ghiBanGhiThuVien()` cho phép ghi.
>
> **FE KHÔNG tự tính `url_normalized`** — T01-29 cho `--fix` điền bằng
> `normalize_url()` của Python. Viết lại phép chuẩn hoá bằng JS là bản thứ hai
> của một công thức đã có.
>
> Chặn host **tại chỗ dán** (M11-R3): người dùng biết ngay, không phải chờ 422.
> Nhưng đó là tiện lợi cho NGƯỜI — cổng cho MÁY là `/api/video` (FR-040), và cả
> hai đều phải có.

phạm_vi_ghi:
  - web/render/shell.html
  - web/plugins/home-pages/shell.html
  - web/render/trang.mjs
  - web/plugins/multiwindow/src/scripts/multiwindow.inline.ts
  - web/styles/prototype.css

verifiability: hard
tiêu_chí:
  - AC1: `/video/nap/` render được, mở đúng `v-napvideo`, và KHÔNG chứa form viết
      bài lẫn ô chọn hiện vật
    cmd: cd web && node test/nap-video.test.js && node test/man-nap-rieng.test.js
  - AC2: dán URL host TRONG whitelist ⇒ nhận; host NGOÀI ⇒ chặn tại chỗ dán, nói
      ra là HOST sai
    cmd: cd web && node test/nap-video.test.js
  - AC3: FE gọi `/api/video` (không gọi `/api/articles`), và KHÔNG tự tính
      `url_normalized`
    cmd: cd web && node test/nap-video.test.js
  - AC4: ngân sách — `gn.js` ≤ 100 KB, trang lớn nhất ≤ 74 KB; hai shell
      byte-identical
    cmd: cd web && node build-fe.mjs && node test/page-weight.test.js && node test/four-screens.test.js
  - AC5: không hồi quy — cả bộ test web
    cmd: cd web && npm test
phụ_thuộc: T01-31
