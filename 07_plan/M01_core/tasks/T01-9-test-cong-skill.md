# T01-9 — cổng canh skill không trôi (đơn vị TEST)

> Tách khỏi T01-8 vì R1: đơn vị không phải test thì không chạm `core/tests/**`.
>
> Cổng này canh thứ `check_khung.py` không canh: bản CÀI ở ngoài repo. Cùng
> khuôn `check_danh_muc.py` tooth 2 (ép hai bản `frontmatter.schema.json` khớp)
> — chỉ khác là bản kia nằm ngoài cây git nên không diff nào thấy.

phạm_vi_ghi:
  - core/tests/check_skill.py
verifiability: hard
tiêu_chí:
  - AC1: bản đã cài lệch nguồn ⇒ ĐỎ, nêu đích danh file nào lệch; không lệch ⇒
      XANH (chứng minh cả hai chiều, không chỉ chiều đỏ)
    cmd: python core/tests/check_skill.py --tu-kiem
  - AC2: file trong bundle không có nguồn khai ⇒ ĐỎ (chống mồ côi quay lại)
    cmd: python core/tests/check_skill.py
phụ_thuộc: T01-8
