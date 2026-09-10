# T01-36 — `<map-check>`: cổng đối chiếu project_map ↔ thư mục thật (đơn vị TEST)

> `core/tests/check_map.py` (MỚI). Một trong tám lệnh kiểm `CLAUDE.md` khai mà
> dự án **chưa cài** — và `CLAUDE.md` nói thẳng hệ quả: *"Chưa cài ⇒ vế gate đó
> không tồn tại và không ai báo."*
>
> **Vì sao nó là cái đáng cài nhất trong ba cái còn thiếu:** `project_map` là thứ
> `check_g6b` dùng để phán một `phạm_vi_ghi` có nằm trong boundary hay không. Map
> lệch thư mục thật ⇒ **mọi phán quyết R1 đứng trên nền sai**, và sai IM LẶNG.
>
> **HAI CHIỀU**, vì một chiều không đủ: map→đĩa bắt boundary trỏ vào hư không;
> đĩa→map bắt một thư mục module không ai khai — đúng lỗ `kb-mock/**` từng có.
>
> **Kiểm hai chiều cho từng răng** (đo được, không suy luận): bốn kiểu phá, cả
> bốn ĐỎ đúng lời — module ma · boundary trỏ hư không · spec vắng mặt · thư mục
> không ai khai. Phục hồi ⇒ `project_map.yaml` sha256 `c807f60d40931230` y hệt và
> cổng xanh lại.
>
> Kèm hai phép **tự kiểm vật liệu**: đọc được `> 0` module và thấy `> 0` thư mục.
> Một cổng đọc file rỗng rồi báo "không lệch gì" là cổng nói dối.

phạm_vi_ghi:
  - core/tests/check_map.py

verifiability: hard
tiêu_chí:
  - AC1: cổng xanh trên map hiện tại (11 module · 11 thư mục)
    cmd: PYTHONIOENCODING=utf-8 python core/tests/check_map.py
  - AC2: không cổng nào khác đỏ thêm
    cmd: PYTHONIOENCODING=utf-8 python -m pytest core/tests -q
