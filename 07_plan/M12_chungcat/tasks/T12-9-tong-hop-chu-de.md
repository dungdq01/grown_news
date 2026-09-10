# T12-9 — `tong-hop-chu-de`: loại việc thứ hai (hồ sơ tổng hợp N nguồn)

> Review lượt 2 bắt đúng: hai cổng tong-hop (hai_kieu_viec · dia_chi_mang_ten_
> nguon) có người SINH (T12-8) mà không ai LÀM XANH. Chặn cũ đã hết: FR-044
> từng ghi "không thi công được trước S8" — nay `core/assets/dia-chi.json` đã
> tồn tại và validate.py:92-97 đã đọc nó (đo 2026-09-03).
> Chạy SAU T12-6 (cùng đường mã: hiện vật → chưng cất, thêm loại việc).

phạm_vi_ghi:
  - chungcat/src/tong_hop.py            # đọc N nguồn, payload ghép, nhắc đủ từng nguồn
  - chungcat/src/vong.py                # +nhánh loai=tong-hop-chu-de (cùng hợp đồng job)
  - chungcat/src/verify.py              # +phép: mọi địa chỉ PHẢI mang tên nguồn [slug:...]

verifiability: hard
tiêu_chí:
  - AC1: một hợp đồng hai loại việc — POST /job nhận cả hai `loai`, cùng vòng
      đời Maildir, cùng trần lan_gui
    cmd: python chungcat/tests/check_hai_kieu_viec.py
  - AC2: nguon >= 2 slug tồn tại trong kho; < 2 hoặc slug hư không ⇒ từ chối
      tạo việc (T1 của FR-044)
    cmd: python chungcat/tests/check_hai_kieu_viec.py
  - AC3: mọi địa chỉ trong nháp tổng hợp mang TÊN NGUỒN và phân giải về một
      slug trong `nguon`; mỗi nguồn được nhắc >= 1 lần (T2+T3 FR-044)
    cmd: python chungcat/tests/check_dia_chi_mang_ten_nguon.py
  - AC4: payload N nguồn vượt trần 32MB ⇒ chặn TRƯỚC sha256/log (nghiên cứu §3)
    cmd: python chungcat/tests/check_mot_cua_egress.py
