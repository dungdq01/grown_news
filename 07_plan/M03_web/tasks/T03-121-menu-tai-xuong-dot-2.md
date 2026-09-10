# T03-121 — MENU TẢI XUỐNG đợt 2: sửa lỗi UI + nhãn thật + nhóm theo sản phẩm + chất lượng video — WIREFRAME TRƯỚC

> Gộp 4 yêu cầu chủ dự án 2026-09-06 (2 ảnh lỗi kèm):
> (1) LỖI UI: menu bung LỆCH GIỮA MÀN, nền trong suốt đè chữ nội dung; ảnh 2
>     menu "File gốc" tách rời nút — positioning `.tx-ds` hỏng khi ancestor
>     có transform/overflow (footer cửa sổ).
> (2) Nhãn "File gốc" khó hiểu ⇒ hiện ĐÚNG ĐỊNH DẠNG THẬT từ media-mime
>     ("PDF (.pdf) · 2.8 MB" / "Video (.mp4) · 210 MB" / "PowerPoint (.pptx)")
>     + HỘP THOẠI XÁC NHẬN của sản phẩm trước khi tải ("Tải bản PDF 2.8 MB?"
>     — khuôn FR-022, cấm confirm() trình duyệt).
> (3) MÀN VIDEO: menu tải phân NHÓM theo sản phẩm của bản ghi —
>     VIDEO (xem) · TRANSCRIPT · BẢN CHƯNG CẤT — không trộn một rổ.
> (4) Video URL: mục chất lượng 360/480/720/1080/gốc ⇒ tạo job T12-26, theo
>     dõi trong tab Chưng cất/cửa sổ việc, xong thì nút tải sáng.
> CHẶN CỨNG: sau T12-26 (backend) và LÀM SAU T03-117/119/120 — CÙNG MỘT DEV,
> nối lượt (bốn task chạm cùng multiwindow/cctab — tách dev là conflict).
> ID rule 9: max 120 ⇒ 121.

## BƯỚC 1 — WIREFRAME `05_uiux/wireframes/SCR-21-menu-tai-xuong-2.md` (NGƯỜI duyệt, CẤM code trước)

- Menu neo ĐÚNG nút (mở lên trên, phải mép nút, nền đặc token, không đè chữ);
  vẽ ca footer hẹp + cửa sổ maximize.
- Nhãn mục theo định dạng thật + kích thước; hộp thoại xác nhận (nội dung câu).
- Màn video: 3 nhóm mục + hàng chất lượng (chỉ hiện với video URL trong
  allowlist; mp4 upload hiện "Video (.mp4) · <size>" một mục).
- Trạng thái: transcript/bản chưng cất CHƯA có ⇒ mục mờ + chú "chưa sinh"
  (bấm dẫn tới nút Sinh transcript / Chưng cất) — không giấu, không mục chết.

## BƯỚC 2 — CODE (sau duyệt)

- Sửa TX_CSS positioning (menu trong container transform ⇒ dùng anchor theo
  nút, fallback xếp trên footer); nền token đặc.
- Nhãn + size từ media[0].mime tra media-mime.json (__MEDIA__ đã có ở FE) —
  KHÔNG gõ cứng; hộp thoại xác nhận khuôn FR-022 dùng lại.
- Nhóm mục dẫn xuất: media (video/xem) · hiện vật .vtt (transcript — srt/txt)
  · bài chưng cất trỏ ngược nguon (goc/md/txt/docx/in) — mỗi nhóm một tiêu đề
  nhỏ; nguồn dữ liệu là bản ghi + GET /api/nhap-chung-cat?nguon=<slug> nếu cần.
- Chất lượng ⇒ POST /api/job {loai: tai-video, chat_luong} → toast + dòng việc
  trong tab; việc xong ⇒ mục "Tải về (480p)" sáng trỏ /api/tai-video/<ulid>.

phạm_vi_ghi:
  - 05_uiux/wireframes/SCR-21-menu-tai-xuong-2.md   # MỚI — bước 1
  - web/plugins/multiwindow/src/scripts/multiwindow.inline.ts   # TX_CSS + menuTai đợt 2
  - web/plugins/cctab/src/cctab.inline.ts           # dòng việc tai-video + nút tải khi xong
# vế cổng thuộc đơn vị test đi kèm (chung-cat-ui + hien-that mở rộng CÙNG LƯỢT) — R1

verifiability: hard
tiêu_chí:
  - AC0 (soft — NGƯỜI): SCR-21 duyệt trước mọi dòng mã bước 2
  - AC1: markup menu nằm TRONG hộp neo của nút (đo toạ độ/anchor trong DOM
      test), nền dùng token đặc — hết ca đè chữ
    cmd: node web/test/chung-cat-ui.test.js
  - AC2: bản ghi media pdf ⇒ mục "PDF (.pdf) · <size>" (tra bảng, không chữ
      "File gốc"); bấm ⇒ hộp thoại sản phẩm xác nhận rồi mới tải; huỷ ⇒ 0 request
    cmd: node web/test/chung-cat-ui.test.js
  - AC3: màn video URL ⇒ menu 3 nhóm + hàng chất lượng từ bảng khai; mp4
      upload ⇒ không hàng chất lượng; sản phẩm chưa sinh ⇒ mục mờ có chú
    cmd: node web/test/chung-cat-ui.test.js
  - AC4: chọn 480p ⇒ POST /api/job loai=tai-video đúng payload; việc xong
      (mock) ⇒ mục tải sáng trỏ /api/tai-video/<ulid>
    cmd: node web/test/chung-cat-ui.test.js
  - AC5: suite web xanh + page-weight xanh
    cmd: cd web && npm test
