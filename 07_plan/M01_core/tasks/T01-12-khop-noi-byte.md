# T01-12 — FR-036/B4: khớp nối export/import cho BYTE (đơn vị CODE)

> **Đây là đơn vị QUYẾT ĐỊNH của cả plan FR-036 nhánh B.** Nếu byte không đi
> trọn vòng DB → file → DB thì "lưu hiện vật trong DB" là quyết định sai, và
> phải xét lại TRƯỚC khi viết một dòng FE nào (B7/B8).
>
> Hợp đồng ở `06_modules/M09_thuvien/spec.md` §2.1 + luật **M09-R1** — rule nguy
> hiểm nhất của module: bỏ sót `recycle` khỏi tập tham chiếu thì mỗi DELETE phá
> byte vĩnh viễn, và `phucHoi()` sau đó **vẫn báo thành công** (nó chạy lại
> validate, mà validate không bao giờ thấy blob). Mất dữ liệu im lặng, test xanh.

phạm_vi_ghi:
  - core/tools/xuat_kho.py
  - core/tools/dung_lai_db.py

verifiability: hard
tiêu_chí:
  - AC1: M09-R1 — tập tham chiếu hợp UNION **BA** bảng (`articles` +
      `article_versions` + `recycle`). Bản ghi bị xoá (chỉ `recycle` còn trỏ) rồi
      export ⇒ byte **CÒN**; bỏ tham chiếu cuối rồi export ⇒ byte bị reap
    cmd: python core/tests/check_media_dan_xuat.py
  - AC2: `bam_cay()` hash cả `kb/_media` — không thì `--kiem` là cổng NÓI DỐI:
      khai "export tất định" mà bỏ qua phần lớn byte
    cmd: python core/tests/check_media_dan_xuat.py
  - AC3: `dung_lai_db.py` **exit khác 0, báo to** khi một `.md` khai
      `media.sha256` mà thiếu byte, và khi byte của một file không băm ra đúng
      tên file của nó (khoá lưu trữ không được nói dối)
    cmd: python core/tests/check_media_dan_xuat.py
  - AC4: `xuat_kho.py` vẫn CHỈ SELECT — thêm đường byte không được mở một
      đường ghi DB thứ hai; export vẫn tất định
    cmd: python core/tests/check_export_dan_xuat.py && python core/tools/xuat_kho.py --kiem
  - AC5: không hồi quy — kho thật đi trọn vòng và `bam_noi_dung` không đổi
    cmd: python core/tools/xuat_kho.py && python core/tools/dung_lai_db.py && python core/tests/check_frozen.py
phụ_thuộc: T08-6
