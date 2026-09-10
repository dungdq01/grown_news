# T08-33 — CỬA XUẤT văn bản: md · txt · docx · srt (một cửa đọc, tải xuống)

> Chủ dự án duyệt 2026-09-06. Nguyên tắc chốt: (1) file NHỊ PHÂN tải lên
> (pdf/doc/ppt/mp4) đã tải đúng dạng gốc qua media — cửa này KHÔNG chuyển
> chéo nhị phân; (2) NỘI DUNG VĂN BẢN máy giữ (bài viết · bản chưng cất ·
> transcript) xuất đa dạng. PDF đi đường print-view (T03-117), KHÔNG render
> server. ID rule 9: max 32 ⇒ 33.

## Hình dạng

- `GET /api/xuat/<loai>/<slug>?dang=md|txt|docx` — cửa ĐỌC thuần:
  · md: thân bài nguyên văn; txt: lột markdown (heading giữ chữ, bỏ ký hiệu);
  · docx: thư viện `docx` (npm, MIT — KHAI `giay_phep` vào package cùng
    $vi_sao, bài học PyMuPDF) — map heading/đậm/nghiêng/list/blockquote đủ dùng;
  · `Content-Disposition: attachment; filename="<slug>.<duoi>"` (filename
    sạch — slug đã kebab).
- NHÁP: `GET /api/xuat-nhap/<job_ulid>?dang=...` đọc `ban_hien_tai` qua đúng
  hàm của nhap-cua; MỌI dạng xuất từ nháp đóng dấu ĐẦU FILE:
  "BẢN NHÁP — chưa duyệt · nguồn <slug> · <ngày> · chỉ dẫn: <chi_dan|—>".
- TRANSCRIPT: dang=txt lột mốc giờ; dang=srt đổi mốc `HH:MM:SS.mmm` →
  `HH:MM:SS,mmm` + đánh số cue (~20 dòng, không thư viện); .vtt gốc đã có
  qua media — không làm lại.
- Bảng khai MỚI `core/assets/xuat-dang.json` — đất M01, xin M01 một dòng
  hoặc kèm FR nhỏ nếu bị chặn boundary: {loai_ban_ghi → [dang]} — nguồn
  sự thật chung cho cửa này VÀ menu FE (hai bên cùng đọc, không hai bản).
- KHÔNG đường ghi mới (api-guard whitelist không đổi); quyền = quyền đọc bài.

phạm_vi_ghi:
  - web/api/xuat-cua.mjs           # MỚI — một file một vai (khuôn tho-cua/nhap-cua)
  - web/api/router.mjs             # đấu dây
  - web/package.json               # + thư viện docx (MIT, khai giay_phep)
  - core/assets/xuat-dang.json     # MỚI — bảng khai loại→dạng (đất M01: nhắn chủ đất/FR một dòng nếu g6b chặn)

verifiability: hard
tiêu_chí:
  - AC1: bài viết kho ⇒ md trả nguyên văn thân; txt không còn ký hiệu markdown;
      docx mở được (zip hợp lệ, chứa document.xml có heading đầu)
    cmd: node web/test/xuat-van-ban.test.js
    đỏ_khi: md lệch thân dù 1 byte, hoặc docx không phải zip hợp lệ
    xanh_khi: ba dạng đúng hình
  - AC2: nháp ⇒ mọi dạng mang dấu "BẢN NHÁP — chưa duyệt" + chi_dan ở đầu;
      bài đã duyệt KHÔNG mang dấu
    cmd: node web/test/xuat-van-ban.test.js
  - AC3: transcript ⇒ srt đúng định dạng (mốc phẩy + số cue tăng dần), txt
      không còn mốc giờ
    cmd: node web/test/xuat-van-ban.test.js
  - AC4: dang ngoài bảng khai cho loại đó ⇒ 422 nói rõ dạng nào được phép
      (đọc từ xuat-dang.json — thêm dòng bảng là 422 tự đổi, 0 mã)
    cmd: node web/test/xuat-van-ban.test.js
  - AC5: api-guard + suite web xanh (0 đường ghi mới)
    cmd: cd web && npm test
# cổng xuat-van-ban.test.js thuộc ĐƠN VỊ TEST đi kèm (khuôn 26b/110b) — R1
