# T03-126 — THẺ 2 TẦNG: thumbnail video + nền-icon tài liệu — WIREFRAME TRƯỚC

> Chủ dự án duyệt 2026-09-08 (kèm ảnh mẫu YouTube/TikTok): thẻ danh sách
> hiện quá đơn giản — cần vùng NỀN trực quan theo loại. Nghiên cứu đã chốt:
> YouTube = hotlink `i.ytimg.com/vi/<id>/hqdefault.jpg` (id đã parse sẵn ở
> `idVideo()` + bảng `video_host`); tài liệu = watermark icon + dải màu THEO
> MIME từ bảng khai; TikTok/mp4/PDF-trang-1 chờ hiện vật từ T12-29.
> SÁU LUẬT chống-sửa-lại (khuôn T03-125) áp nguyên. ID rule 9: max 125 ⇒ 126.

## BƯỚC 1 — WIREFRAME 05_uiux/wireframes/SCR-25-the-hai-tang.md — ĐÃ DUYỆT

> ⚠️ SỐ ĐỔI 23 → 25 (2026-09-08). `SCR-23-phieu-chung-cat.md` (07-09 20:12) và
> `SCR-24-nut-header-cua-so.md` (08-09 02:43) đều sinh SAU khi task này soạn.
> `rule 9` cấp id cho TASK, không nói gì về SCR — nên số đụng nhau mà không
> cổng nào kêu. Backlog M03 giữ ô cho luật còn thiếu ấy.
>
> **ĐÃ DUYỆT — chủ dự án 2026-09-08**, bốn câu chốt:
> (1) bài viết ~~1 tầng~~ → **ĐẢO cùng ngày: MỌI loại có nền** · (2) video dùng chung `--c-video`, **chỉ khác
> icon** · (3) tỉ lệ **4:3** · (4) **hoãn** vùng lưới 4 thẻ trang chủ.
>
> ⚠️ **VÒNG HAI — gọn thẻ (chủ dự án 2026-09-08, sau khi nhìn màn thật):**
> *"hạ height, tỉ lệ ảnh/text **6/4**, chữ nhỏ hơn"* + *"footer của tab chiếm
> nhiều diện tích quá"*. Cài: `.cd:has(.cd-n){height:17.375rem}` = **278px** · nền `flex:0 0
> 60%` · badge ĐÈ lên ảnh · footer MỘT dòng (chip trái / tin cậy phải, neo đáy)
> · chữ phụ `--fs-nano`. Đo máy thật: 9/9 thẻ **278px** (−11%), nền **đúng
> 60%**, 0 tràn tít. (Vòng đầu để 224px — chủ dự án bác *"hạ quá tay"*, chốt 278.) Tỉ lệ **4:3** của câu 3 nay chỉ còn là đường lùi khi
> `:has()` không hỗ trợ — chiều cao cố định thắng.

- Thẻ 2 tầng: vùng nền **4:3** phía trên (thumbnail HOẶC icon+màu) + vùng chữ
  dưới (badge loại · tiêu đề · tin cậy · chủ đề) — vẽ đủ 6 ca:
  video-YouTube (ảnh thật) · video-TikTok/mp4 CHƯA có thumbnail (nền màu +
  icon play) · video ĐÃ có hiện vật thumbnail (T12-29 về) · tài liệu pdf ·
  tài liệu md/docx · bài viết (ĐÃ QUYẾT: cũng 2 tầng).

- HÀNH VI: ảnh lazy-load; lỗi tải ⇒ onerror rơi về nền màu KHÔNG vỡ layout;
  offline vẫn đọc được danh sách.
- Grid: mật độ thẻ/hàng ở các bề rộng; thẻ 2 tầng cao hơn — vẽ trang 20 thẻ.

## BƯỚC 2 — CODE (SCR-25 đã duyệt 2026-09-08)

- `media-mime.json` thêm **MỘT** cột `mau` (tên token) cho các dòng TÀI LIỆU.
  FE DẪN XUẤT nền thẻ từ bảng, cấm gõ cứng theo đuôi file.
  ⚠️ HAI đính chính so với bản soạn (đo 2026-09-08):
  · **KHÔNG cột `icon`** — `trang.mjs:1337` dựng `ICON_CO` bằng cách ĐỌC CHÍNH
    thư mục `public/icon/`, và `XUAT-XU.md` khai luật *"tên file = đúng giá trị
    của chip… không cần một bảng ánh xạ, thứ sẽ là bản thứ hai của danh sách
    file"*. Thêm cột `icon` đảo đúng luật đó.
  · **KHÔNG phải đất M01, KHÔNG cần FR** — `project_map` **v29** đã chuyển
    `core/assets/media-mime.json` sang chủ **M03** (`modules.M03_web.fe`).
    Và không file nào trong phạm vi này nằm trong `FROZEN.lock` (đo: 0 khớp).
  · **video KHÔNG có `mau`** (chốt câu 2): `youtube`/`tiktok`/`douyin`/`fb`
    dùng chung `--c-video`, phân biệt bằng icon.
- Icon: **KHÔNG phải vẽ** — `public/icon/` đã có **20** `.svg` (đủ cả 6 ca),
  hạ tầng mask `/i/<tên>.svg` + `data-i` đã chạy cho chip bộ lọc, và
  `XUAT-XU.md` ghi license từng file. KHÔNG hotlink thesvg.org (license không
  đồng nhất + app phải chạy offline). Con số *8-icon-rail* của bản soạn đã cũ.
  T12-29) > URL ytimg dựng từ id > icon+màu theo mime > nền màu loại.
- Tỉ lệ nền **4:3** (chốt câu 3). **MỌI loại có nền** — câu 1 ĐẢO 2026-09-08
  sau khi chủ dự án nhìn màn thật (*"tài liệu và bài viết chưa có"*); lưới đều
  một nhịp thắng lý lẽ *khung trống là hứa hão*. Bài viết + video KHÔNG trả
  byte cho màu: thẻ đã mang `--c: var(--c-<source_type>)` và `.cd-n` đọc
  `var(--nm, var(--c))`. Chỉ TÀI LIỆU cần `--nm`, vì cả 5 định dạng đều
  `source_type: tai-lieu` nên `--c` không phân biệt được pdf với docx.
- **Vùng lưới 4 thẻ TRANG CHỦ (`trang.mjs:506`) HOÃN** (chốt câu 4):
  `page-weight` đo 2026-09-08 là **61 708 / 61 440 — ĐANG ĐỎ trước đơn vị này**
  (chủ: sửa chưa commit của phiên khác, `FR-011`). Thêm ~70 byte/thẻ vào đúng
  trang đang đỏ là gánh nợ của người khác. `the()` nhận cờ tắt tầng nền.
- Đo byte TRƯỚC: khối CSS thẻ mới ước lượng, còn chỗ thì bundle chung,
  chật thì khai cách xử ngay trong worklog nhận việc — không giảm-béo giữa chừng.

phạm_vi_ghi:
  - 05_uiux/wireframes/SCR-25-the-hai-tang.md
  - 05_uiux/tokens.css                    # --c-pdf/docx/pptx/md/txt · hai hệ
  - web/render/trang.mjs
  - web/plugins/multiwindow/src/scripts/multiwindow.inline.ts
  - web/styles/prototype.css
  - core/assets/media-mime.json
# vế cổng thuộc đơn vị test đi kèm (the-hai-tang.test.js mới + page-weight mở rộng) — R1

verifiability: hard
tiêu_chí:
  - AC0 (soft — NGƯỜI): SCR-25 duyệt đủ 6 ca trước mọi dòng mã bước 2 — ĐÃ DUYỆT 2026-09-08
  - AC1: thẻ video YouTube mang ảnh ytimg dựng từ id (đúng id đã parse),
      loading=lazy, CÓ onerror fallback nền màu
    cmd: node web/test/the-hai-tang.test.js
    đỏ_khi: thiếu lazy hoặc thiếu fallback, hoặc id sai chỗ
    xanh_khi: đủ ba vế
  - AC2: thẻ tài liệu lấy mau+icon TỪ BẢNG media-mime — thêm một mime vào
      bảng thì thẻ tự có nền, 0 dòng FE đổi
    cmd: node web/test/the-hai-tang.test.js
  - AC3: bản ghi có hiện vật kieu_moc=la_thumbnail ⇒ nền dùng hiện vật
      (đường /api/articles/media/<sha>), thắng ytimg
    cmd: node web/test/the-hai-tang.test.js
  - AC4: token-only (mau là token, 0 hex trần) + markup-JS có luật CSS
    cmd: node web/test/token-only.test.js
  - AC5: suite web xanh + page-weight xanh
    cmd: cd web && npm test
