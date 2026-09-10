# T01-46 — media MẢNG phía core: luật mồ côi/reap đọc `$.media[*]` (con của T09-8)

> Căn cứ + quyết a-d: `07_plan/M09_thuvien/tasks/T09-8-media-thanh-mang.md`.
> Vế Z3 CHẾT NGƯỜI đi trước mọi con khác: `xuat_kho.py` reap byte theo quét
> JSON `$.media.sha256` — với bản ghi MẢNG (schema FR-052 ĐÃ áp) đường đó mù
> ⇒ mỗi DELETE phá byte vĩnh viễn.

phạm_vi_ghi:
  - core/src/source_distiller/validate.py   # hồ sơ thu-vien đọc media mảng
  - core/tools/dung_lai_db.py               # luật mồ côi $.media[*].sha256
  - core/tools/xuat_kho.py                  # luật mồ côi + reap — vế Z3

verifiability: hard
tiêu_chí:
  - AC1 (Z3): luật mồ côi thấy MỌI sha256 trong mảng — fixture 2 hiện vật,
      0 byte bị reap oan
    cmd: python core/tests/check_media_dan_xuat.py
    đỏ_khi: sha thứ hai của mảng bị coi là mồ côi
    xanh_khi: cả hai sha được tham chiếu
  - AC2 (Z5): di trú/round-trip không mất bản ghi — đếm + hash trước/sau khớp
    cmd: python core/tests/check_export_dan_xuat.py
  - AC3: validate chấp bản ghi media mảng 2 phần tử; media: [] bị từ chối
    cmd: python core/src/source_distiller/validate.py --strict kb-mock/ ; python core/tests/check_dinh_dang_mo.py
