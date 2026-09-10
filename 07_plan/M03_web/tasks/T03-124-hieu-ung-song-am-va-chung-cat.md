# T03-124 — hiệu ứng SÓNG ÂM khi phiên âm, và nhịp chưng cất — WIREFRAME TRƯỚC

> Chủ dự án 2026-09-07: *"UI và animation lúc transcript / chưng cất phải hiệu
> ứng 3D, superpower (kiểu dải tần số, hiệu ứng âm thanh...) vào nha. now,
> it's basic"*.
> Lệ wireframe-trước giữ nguyên (khuôn `T03-116/117/120/121`).
> ID rule 9: max M03 = 123 ⇒ 124.

## BƯỚC 1 — WIREFRAME `05_uiux/wireframes/SCR-22-nhip-sinh.md` (NGƯỜI duyệt)

Phải trả lời trọn:

- **Dải tần số lúc phiên âm** — vẽ từ đâu? Không có dữ liệu audio ở FE (byte
  nằm ở thợ). Hai lối, wireframe phải chọn một và nói vì sao:
  (a) dải giả lập theo **nhịp cue thật** — trung thực, vì nó nhảy khi có chữ
      mới, đứng im khi thợ im
  (b) dải ngẫu nhiên — đẹp hơn, nhưng nó **nói dối**: chuyển động không tương
      ứng với việc gì đang xảy ra
- **Nhịp chưng cất** — chưng cất không có âm thanh; hình gì nói đúng *"model
  đang nghĩ"* mà không giả vờ biết còn bao lâu?
- **`prefers-reduced-motion`** — `AC6` của khuôn UI cấm animate thuộc tính
  LAYOUT và bắt buộc khối tắt-chuyển-động. Một hiệu ứng không tắt được là một
  trang gây chóng mặt cho người đã khai mình cần nó tắt.
- **Ngân sách byte** — `gn.css` còn **1 685 byte**. Hiệu ứng đi theo CHUNK
  (`trCss`/`KHOI_CSS`), không vào bundle chung; wireframe phải nói rõ chỗ ở.

## BƯỚC 2 — chỉ chạy SAU khi chủ dự án duyệt wireframe

phạm_vi_ghi:
  - 05_uiux/wireframes/SCR-22-nhip-sinh.md   # MỚI — bước 1
  - web/plugins/cctab/src/cctab.inline.ts
  - web/plugins/multiwindow/src/scripts/multiwindow.inline.ts
# Cổng thuộc ĐƠN VỊ TEST `T03-110b` — `R1`.

verifiability: hard
tiêu_chí:
  - AC0 (soft — NGƯỜI): SCR-22 duyệt TRƯỚC mọi dòng mã bước 2; worklog ghi mốc
  - AC1: chuyển động CHỈ dùng `transform`/`opacity` — 0 thuộc tính layout
    cmd: node web/test/motion-polish.test.js
  - AC2: có khối `prefers-reduced-motion` tắt hẳn
    cmd: node web/test/motion-polish.test.js
  - AC3: dải tần số phản ánh DỮ LIỆU THẬT (nhịp cue), không phải số ngẫu nhiên
    cmd: node web/test/nhip-sinh.test.js
    đỏ_khi: "`Math.random()` trên đường vẽ dải"
  - AC4: `gn.css` không vượt trần `FR-068`
    cmd: cd web && npm test
