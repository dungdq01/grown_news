# T08-38 — cửa gắn hiện vật: THAY theo `kieu_moc` + `image/*` vào bảng mime

> `WO-071` · task B. ID rule 9: max 37 ⇒ 38.

## Hình dạng

- `POST .../hien-vat` nhận `thay_kieu_moc: true` ⇒ **bỏ mọi entry `media[]` có
  cùng `kieu_moc`** (tra CỘT bảng `media`, không đọc frontmatter — `kieu_moc`
  không tồn tại trong frontmatter, `additionalProperties: false`) rồi mới thêm.
  Mặc định `false` ⇒ hành vi cũ, 0 ca gọi hiện tại đổi.
- `KIEU_MOC` + `kho.schema.sql` CHECK thêm `la_thumbnail`.
- `media-mime.json` thêm `image/jpeg` (magic `ffd8ff`) + `image/png`
  (`89504e47`), `xem_truoc: "anh"`, `chi_dan_xuat: true` (máy sinh, người không
  nạp ⇒ không thành chip lọc).
- `articles.mjs` trả **inline** cho `xem_truoc: "anh"`; `check_dinh_dang_mo.py`
  enum nhận `anh`.

⚠️ Byte thumbnail đến từ **CDN ngoài**. Không có dòng bảng thì `luuHienVat`
bỏ qua lớp magic (`if (loai)`) — tức lớp thứ sáu của intake vắng đúng lúc cần.

⚠️ ĐO 2026-09-09, mở rộng phạm vi trong CÙNG module M08: `kieu_moc` được cửa
KIỂM (`KIEU_MOC.includes`) mà **chưa bao giờ được GHI** — không một `UPDATE
media SET kieu_moc` nào trong repo. Cột có trong `kho.schema.sql`, trường có
trong payload, và nó đi vào hư không. Nên phép THAY không khoá được vào cột
cho tới khi cột ấy có thật. Hệ quả kèm theo: `AC-V1` đòi hiện vật `.vtt` mang
`kieu_moc: la_asr` — hôm nay nó KHÔNG mang, và cổng của AC ấy vẫn xanh.

phạm_vi_ghi:
  - web/api/articles.mjs
  - web/api/dungchung.mjs              # ghiKieuMoc — cột `kieu_moc` chưa ai ghi
  - core/assets/media-mime.json
  - core/assets/kho.schema.sql
  - core/tests/check_dinh_dang_mo.py
# cổng thuộc T03-110b (thumbnail-video-url.test.js) — R1

verifiability: hard
tiêu_chí:
  - AC1: gắn lần hai cùng `kieu_moc` + `thay_kieu_moc` ⇒ `media[]` còn ĐÚNG MỘT
      entry loại đó; entry loại KHÁC giữ nguyên
    cmd: node web/test/thumbnail-video-url.test.js
    đỏ_khi: media[] có hai entry cùng kieu_moc
  - AC2: KHÔNG truyền cờ ⇒ hành vi cũ (thêm) — đường transcript không đổi
    cmd: node web/test/thumbnail-video-url.test.js
  - AC3: nạp jpg/png ⇒ magic được kiểm; byte sai magic ⇒ 422
    cmd: node web/test/thumbnail-video-url.test.js
  - AC4: GET hiện vật ảnh ⇒ `content-type: image/jpeg` + `inline` + `nosniff`
    cmd: node web/test/thumbnail-video-url.test.js
