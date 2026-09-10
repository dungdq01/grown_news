# T12-7 — Nhà thứ hai — PHÉP ĐO THẬT của AC-3.1

> "Thêm một nhà = 1 dòng bảng + 1 file adapter, 0 dòng ở lõi." Đơn vị này
> tồn tại để đo mệnh đề đó, như C9 đo M8.2.

phạm_vi_ghi:
  - chungcat/src/adapter/<nha-2>.py
  - chungcat/assets/model.json          # +1 dòng

verifiability: hard
tiêu_chí:
  - AC1: git diff của đơn vị này KHÔNG chạm file nào ngoài 3 đường trên —
      chạm lõi là AC-3.1 SAI và phải mở FR nói ra
    cmd: python chungcat/tests/check_engine_cam_rut.py
  - AC2: kieu_structured của nhà 2 khai đúng; nếu chỉ json_mode thì schema
      phẳng (nghiên cứu §6)
    cmd: python chungcat/tests/check_bang_khai_model.py
