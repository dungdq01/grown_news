# T12-0 — Áp FR-053 vào spec/rules M12 (đơn vị GIẤY, chạy TRƯỚC mọi mã)

> FR-053 ĐÃ DUYỆT 2026-09-03 nhưng spec M12 chưa ăn: còn "Citations là đường
> tắt tuỳ chọn" (đo được: 400 khi đi cùng structured output) và tiền đề
> "os.replace nguyên tử" (sai trên Windows — AC-5.2 xanh oan). Chia task code
> vào spec sai là chia vào chỗ không verify được.
> spec.md + rules.md đang TRONG FROZEN.lock ⇒ sau khi áp, NGƯỜI ký lại.

phạm_vi_ghi:
  - 06_modules/M12_chungcat/spec.md        # FROZEN — sửa theo FR-053, người ký lại lock
  - 06_modules/M12_chungcat/rules.md       # FROZEN — cùng đợt ký
  - 06_modules/M12_chungcat/model_flow.md
  - 06_modules/M12_chungcat/data_flow.md

verifiability: hard
tiêu_chí:
  - AC1: spec hết coi Citations là đường điều khiển — grep "đường tắt" quanh
      Citations ra 0; ho_tro_citations chỉ còn là cột thông tin
    cmd: python core/tests/check_g6a.py
  - AC2: AC-3.2 thành phép ĐỊNH VỊ BA TẦNG (chuẩn hoá → khớp chính xác → fuzzy
      ngưỡng-trong-bảng-khai) và testcases có CẢ HAI vế — bắt-bịa ĐỎ và
      không-đỏ-oan XANH (ligature + gạch nối cuối dòng)
    cmd: python core/tests/check_g6a.py
  - AC3: AC-5.2 đổi cách đo — "new/ không chứa JSON parse-lỗi sau N lần giết
      tiến trình" + luật tên đích ULID duy nhất; hết chữ "nguyên tử"
    cmd: python core/tests/check_g6a.py
  - AC4: NGƯỜI ký lại FROZEN.lock cho hai file frozen — check_frozen hết đỏ
      vì M12
    cmd: python core/tests/check_frozen.py
  - AC5: spec sau khi áp mọc AC-4.5/AC-4.6 (FR-053 §1.6) — hai cổng mới PHẢI
      được khai vào plan NGAY TRONG đơn vị này (T12-5 nhận AC-4.5: bốn phép
      chặn trước lời gọi, 0 token + 0 dòng egress; T12-6 nhận AC-4.6: POST
      /job model-ngoài-bảng bị từ chối, cổng gọi THẲNG :8790). Cập nhật plan
      là một phần của đơn vị giấy — xanh-của-G6B-hôm-nay không nói gì về
      xanh-sau-khi-áp, nên G6B phải chạy lại ở đây và phải SẠCH cho M12
    cmd: python core/tests/check_g6b.py
