# T03-109 — UPLOAD MP4 ở màn `/video/nap/` (nguồn PHỤ — quyết 4 ngày 2026-09-04)

> Chủ dự án chốt: video nguồn CHÍNH là URL, nguồn PHỤ là MP4 upload — và web
> hiện **chưa có chỗ upload mp4** (đo: plugin `napvideo` 0 tham chiếu
> file/upload/accept). Bấy lâu MP4 chỉ vào được qua ô file của TÀI LIỆU không
> lọc gì — lỗ backlog M12 "MP4 lạc bảng", nay quyết 2 đóng bằng validate.py
> (T01-45). Đơn vị này mở đường ĐÚNG: bản ghi VIDEO nhận file.
> ID theo rule.md mục 9: ls max 108 ⇒ 109.
> CHẶN CỨNG: sau T01-45 (validate nhận mime cho bản ghi video) — không thì
> upload xong validate đá về.

## Hình dạng

- Màn `/video/nap/` thêm ô file `accept="video/mp4,video/webm,audio/*"`
  (KHUÔN ô file tài liệu nhưng CÓ lọc — bài học `#up-tv-f` thiếu accept);
  URL và file: một trong hai, cả hai cũng được (URL để xem, file để ASR).
- Upload qua cửa media SẴN CÓ (`POST /api/articles/media`) — 0 đường ghi mới;
  trần 1GB/500MB hiện lỗi NGAY phía FE trước khi gửi (đọc từ GET /api/nguong
  nếu có, không thì hằng khai kèm $nguon — không gõ số mồ côi).
- Sau upload: frontmatter `media[]` gắn sha như tài liệu; nút Sinh transcript
  (T03-108) từ đó dùng byte local — giai đoạn `tai` của worker tự BỎ QUA.

phạm_vi_ghi:
  - web/plugins/napvideo/src/napvideo.inline.ts   # ô file + gọi cửa media
  - web/render/trang.mjs                          # markup ô file màn nap video
  - web/styles/prototype.css                      # nếu cần khối nhỏ
# Vế thêm vào `web/test/nap-video.test.js` thuộc ĐƠN VỊ TEST `T03-110b`
# (mở rộng CÙNG LƯỢT). `R1`: người viết mã không cầm bút viết thước chấm
# chính mình — kể cả khi chỉ *thêm một vế* vào một cổng có sẵn.
  - web/package.json                              # chỉ nếu sinh cổng mới

verifiability: hard
tiêu_chí:
  - AC1: ô file CÓ accept đúng danh sách; chọn file ngoài accept ⇒ không gửi
    cmd: node web/test/nap-video.test.js
    đỏ_khi: input thiếu accept, hoặc file .exe vẫn POST
    xanh_khi: accept đúng + 0 request cho file sai loại
  - AC2: file quá trần ⇒ chặn phía FE kèm câu nói rõ trần, 0 byte rời máy
    cmd: node web/test/nap-video.test.js
  - AC3: upload hợp lệ ⇒ đi qua ĐÚNG cửa media sẵn có (api-guard whitelist
      không đổi), bản ghi video mang media[] sha
    cmd: node web/test/nap-video.test.js && node web/test/api-guard.test.js
  - AC4: suite web xanh
    cmd: cd web && npm test
