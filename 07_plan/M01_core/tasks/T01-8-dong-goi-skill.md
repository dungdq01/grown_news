# T01-8 — skill `source-distiller` SINH RA từ repo (đơn vị CODE)

> Skill cài ở `~/.claude/skills/source-distiller/` là thứ THẬT SỰ viết bài cho
> kho này, nhưng nó là bản chép tay: không bước đóng gói, không cổng canh. Nó
> từng giữ một `validate.py` lạc hậu — bài viết ra bị cổng trả về, và lỗi hiện
> Ở CHỖ NGƯỜI DÙNG, không ở CI.
>
> Đo lúc nhận việc: 8/15 file có nguồn (7 khớp, `web-spec.md` LỆCH), **7 file
> ~40 KB không có nguồn nào trong repo** — mất là mất thật, vì gói `*.skill` ở
> root nằm ngoài git (`.gitignore:13 *.skill`).
>
> Cổng canh là đơn vị RIÊNG (T01-9) — R1.

phạm_vi_ghi:
  - core/tools/dong_goi_skill.py
  - core/skill-src/**
verifiability: hard
tiêu_chí:
  - AC1: mọi file của bundle có ĐÚNG một nguồn khai trong `BANG_NGUON`; đóng gói
      xong bản cài khớp nguồn từng byte
    cmd: python core/tools/dong_goi_skill.py --kiem
  - AC2: bản cài chạy được THẬT — validator trong bundle ăn được bài mẫu của
      chính bundle
    cmd: python core/tools/dong_goi_skill.py --tu-kiem
  - AC3: KHÔNG ghi đè im lặng bản người đã sửa (M06-R4 vế 2) — sửa tay một file
      đã cài rồi chạy lại ⇒ DỪNG, đòi `--ghi-de`
    cmd: python core/tests/check_skill.py --ca-am-ghi-de
phụ_thuộc: T01-6
