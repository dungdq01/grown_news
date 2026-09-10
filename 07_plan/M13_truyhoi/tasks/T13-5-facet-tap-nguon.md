# T13-5 — pham_vi (khoá TANG + space) · nguon[] tường minh (hợp đồng Knowledge M14)

> Bối cảnh chung plan M13 (s7 2026-09-07, sửa 2026-09-09): spec đã áp FR-072/073
> · service RIÊNG :8791 · ADR-08 · chỉ mục = DẪN XUẤT.
> Hai trục đứng cạnh nhau: `pham_vi` = bộ lọc LÚC HỎI, dùng đúng khoá TANG của
> FE (`cat·loai·cpt·pl·nguon`) + khoá `space` dành sẵn (mặc định = space mặc
> định, 0 map tên — cổng T7); `nguon[]` = tập nguồn Knowledge gắn bot, M14 giải
> bot→doc_id rồi truyền xuống (AC-8.4/8.5 M14 nguyên vẹn). `nguon: null` phải
> KHAI trong payload; thiếu khoá ⇒ 400 (cổng T8). `k` do người gọi đưa.

phạm_vi_ghi:
  - truyhoi/src/api.py
  - truyhoi/src/db.py

phụ_thuộc: T13-4 · FR-080 (đã ÁP — cột `space` có thật trong view `ban_ghi`; cạnh xuyên nhánh #1 của `07_plan/song-song-m13-space-checklist.md` §3)
# Cho tới khi FR-080 áp: khoá `space` trong pham_vi nhận và validate được, nhưng
# mọi bản ghi coi là space mặc định — vế "đổi space ⇒ tập ứng viên đổi" của AC1
# chỉ đo được sau FR-080. KHÔNG xanh vế đó bằng fixture bịa cột.

verifiability: hard
tiêu_chí:
  - AC1: MỘT query JOIN-WHERE (không hai lần truy hồi, không top-k ẩn) — đổi
      pham_vi (kể cả `space`) thì tập ứng viên đổi; so_ban_ghi_trong_pham_vi trả
      cùng lời gọi và khớp đếm độc lập; k thiếu ⇒ 400
    cmd: python truyhoi/tests/check_pham_vi_hien_thi.py
  - AC2: nguon=null ⇒ cả kho và response NÓI RÕ đang cả-kho; nguon=[slug] ⇒ chỉ
      slug đó; thiếu khoá nguon ⇒ 400; 0 bảng đổi tên facet (phan_loai↔pl)
    cmd: python truyhoi/tests/check_tap_nguon_la_tham_so.py
