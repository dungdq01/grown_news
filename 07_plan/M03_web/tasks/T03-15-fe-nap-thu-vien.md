# T03-15 — FR-036/B7b: FE nạp thư viện — tab thứ tư (đơn vị CODE)

> Màn Nạp nguồn có ba lối (`link` · `file` · `viet`). Thư viện là lối **thứ tư**:
> chọn một file pdf/ppt/word → `POST /api/articles/media` (byte) → rồi
> `POST /api/articles` (bản ghi `tai-lieu`, `ho_so: thu-vien`).
>
> **Bài học bắt buộc mang sang từ B5** (`WL-01K9N7FR036B5`): FE **phải tự kiểm
> `file.size` TRƯỚC khi POST**. `413` không tới được client giữa lúc upload —
> undici/trình duyệt nhận ECONNRESET trên đường ghi trước khi kịp đọc phản hồi.
> Không kiểm ở client thì người dùng kéo một file 30 MB vào và chỉ thấy "mạng
> lỗi".
>
> **Bảng mime vào bundle qua `define`**, cùng đường đã mở cho `__KHUNG__`:
> `accept` của input, danh sách đuôi hiện cho người dùng, và trần byte đều phải
> đến từ `core/assets/media-mime.json` — không gõ tay lần thứ hai trong `.ts`.
>
> `fetch` phải mang **literal** `"/api/articles/media"` ngay sau `fetch(` —
> `no-write-path.test.js:50` đọc đích ở đó; ghép từ biến là làm cổng mù.

phạm_vi_ghi:
  - web/build-fe.mjs
  - web/plugins/multiwindow/src/scripts/multiwindow.inline.ts
  - web/render/shell.html
  - web/plugins/home-pages/shell.html
  - web/styles/prototype.css

verifiability: hard
tiêu_chí:
  - AC1: tab thứ tư có ở CẢ HAI `shell.html` và khối nạp của hai file giữ
      **byte-identical**; tab có nhánh xử lý (không phải nút chết)
    cmd: cd web && node test/thu-vien-nap.test.js
  - AC2: bundle mang bảng mime + trần byte từ `media-mime.json`; KHÔNG chuỗi mime
      nào gõ tay trong `.ts`; `build-fe.mjs` **throw** nếu thiếu file khai
    cmd: cd web && node build-fe.mjs && node test/thu-vien-nap.test.js
  - AC3: `file.size` được kiểm **trước** lời gọi `fetch` đầu tiên, so với trần
      lấy từ bảng khai
    cmd: cd web && node test/thu-vien-nap.test.js
  - AC4: đường ghi vẫn trong whitelist; trang không phình quá trần
    cmd: cd web && node test/no-write-path.test.js && node test/page-weight.test.js
  - AC5: không hồi quy — mọi class mới có luật CSS, mọi màn còn nguyên
    cmd: cd web && npm test
phụ_thuộc: T03-13
