# T05-4 — FR-036/B1: `tai-lieu` trong khuôn mẫu của cổng gác cửa

> `_inbox/` KHÔNG nhận hiện vật ở v1 — cửa đó chỉ `.md`, và mở nó cho binary là mở
> lại năm lớp hardening. Task này chỉ để khuôn mẫu in ra không lạc hậu.

phạm_vi_ghi:
  - 05_intake/gate.py
verifiability: hard
tiêu_chí:
  - AC1: khuôn mẫu `KHUNG` in ra liệt đủ giá trị `source_type` hiện có, và guard
      chống mất dữ liệu vẫn nêu đúng enum
    cmd: python 05_intake/test_gate.py
phụ_thuộc: T01-25
