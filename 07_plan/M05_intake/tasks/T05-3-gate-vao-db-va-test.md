# T05-3 — FR-034 B5: gate INSERT vào DB (gac() không đổi một dòng) + test

phạm_vi_ghi:
  - 05_intake/gate.py
  - 05_intake/test_gate.py
verifiability: hard
tiêu_chí:
  - AC1: bản qua cổng là hàng DB với origin external + draft (hardcode gate.py giữ)
    cmd: python 05_intake/test_gate.py -k draft_external
  - AC2: kho đã có (source_type, slug) ⇒ trả lại, hàng cũ không đổi
    cmd: python 05_intake/test_gate.py -k khong_ghi_de
  - AC3: dọn _inbox — file vào kho đổi tên .da-vao-kho.md
    cmd: python 05_intake/test_gate.py -k don_inbox
phụ_thuộc: T08-4
