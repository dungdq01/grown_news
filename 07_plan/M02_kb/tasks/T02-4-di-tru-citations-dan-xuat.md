# T02-4 — B-A6: `citations_*` của bài thật thành số MÁY ĐẾM

> Hệ quả trực tiếp của **C1** (`WL-01K9W1C1`). C1 biến `citations_sampled` /
> `citations_verified` từ LỜI KHAI thành DỮ LIỆU DẪN XUẤT. Bài thật còn khai số
> cũ, nên nó đỏ — và đỏ **đúng**: đó là bằng chứng G-7 đã có răng.
>
> **Vì sao là task của M02 chứ không nằm trong C1**: `kb/**` là boundary của
> `M02_kb`. `build_order:136` khai C1 `phạm_vi_ghi: core/**`, trong khi
> `build_order:157` mô tả C1 là *"di trú 1 bản ghi"* — **hai câu trong cùng một
> file nói ngược nhau**. Ô backlog M01 ghi mâu thuẫn đó; task này chọn cách đọc
> an toàn hơn: việc chạm `kb/` đứng riêng, có tiêu chí riêng.
>
> **Đây là việc CHẶN CI.** `ci.yml:43` chạy `validate.py kb/ --strict` và lệnh
> đó đang **exit 1**. Theo R2, C1 chưa xong tới khi task này xong.
>
> `kb/**` là EXPORT sau FR-034 ⇒ sửa file rồi phải đẩy vào DB, không thì
> `xuat_kho.py` (chạy tự động sau mỗi lần web ghi, chiều DB→file) lùi lại hết.
> Cùng thủ tục T02-3: sửa export → `dung_lai_db.py` → `xuat_kho.py` về fixpoint.

phạm_vi_ghi:
  - kb/docs/xgboost-taylor-bac-hai.md
verifiability: hard
tiêu_chí:
  - AC1: bài thật ra đúng số máy đếm — `citations_sampled: 15`,
      `citations_verified: 0`, `unverifiable_citations: true`; và
      `credibility_max` KHÔNG phải `verified` (schema cấm đi cùng cờ đó)
    cmd: python core/src/source_distiller/validate.py kb/ --strict
  - AC2: đúng lệnh CI ở `ci.yml:43` exit 0
    cmd: python core/src/source_distiller/validate.py kb/ --strict
  - AC3: round-trip file→DB→file đạt fixpoint (lần xuất thứ hai ghi 0 file)
    cmd: python core/tests/check_export_dan_xuat.py
  - AC4: KHÔNG mất bản ghi và KHÔNG mất byte — số bản ghi trước/sau bằng nhau,
      `kb/_media/` không file nào bị dọn (vòng reap của `xuat_kho.py`)
    cmd: python core/tests/check_media_dan_xuat.py
phụ_thuộc: T01-43

# Thủ tục người chạy (ba lệnh, theo đúng thứ tự):
#   1. python core/src/source_distiller/validate.py kb/ --fix
#   2. python core/tools/dung_lai_db.py          # file -> DB (FR-034)
#   3. python core/src/source_distiller/validate.py kb/ --strict   # phải exit 0
#
# Đã thử nguyên vòng trên BẢN SAO của kb/ (2026-09-01): `--fix` ghi đúng
# 15 / 0 / true, và bản sao đi từ 3 lỗi về 0. Không thử trên kho thật vì
# bước 2 ghi vào `kb/_kho.sqlite` — kho tri thức thật của chủ dự án.
