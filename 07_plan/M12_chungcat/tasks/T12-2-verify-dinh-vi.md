# T12-2 — `verify.py`: chuẩn hoá + định vị ba tầng (0 model — cổng đỏ được thật đầu tiên)

> Rủi ro số một của module (nghiên cứu §2). Chạy sau T12-0 (AC-3.2 mới).
> Đơn vị neo tổng quát: trang (PDF) HÔM NAY; mốc thời gian (transcript) là
> cùng hàm — nhưng fixture video CHƯA làm (chờ FR-054).

phạm_vi_ghi:
  - chungcat/src/verify.py             # chuan_hoa (NFKC·ligature·gạch nối·space·casefold) + dinh_vi 3 tầng
  - chungcat/assets/nguong.json        # ngưỡng fuzzy — ĐO trên >=10 quote thật rồi mới chốt số.
                                       # TÁCH khỏi model.json có lý do: nguong_lech_schema là CỘT
                                       # THEO NHÀ (mỗi hàng một nhà); ngưỡng fuzzy là tham số của
                                       # PHÉP ĐỊNH VỊ, không thuộc nhà nào — nhét tham số toàn cục
                                       # vào bảng theo-hàng là mầm hai-bản-một-schema.

verifiability: hard
tiêu_chí:
  - AC1: quote bịa (không có trong PDF) ⇒ ĐỎ — trả None, khẳng định bị từ chối
    cmd: python chungcat/tests/check_quote_co_that.py
  - AC2: KHÔNG đỏ oan — quote thật vướng ligature fi + gạch-nối-cuối-dòng ⇒
      XANH kèm số trang đúng
    cmd: python chungcat/tests/check_quote_co_that.py
  - AC3: ngưỡng nằm trong nguong.json, KHÔNG trong mã; file ghi kèm số đo
      10-quote làm bằng chứng chọn ngưỡng
    cmd: python chungcat/tests/check_quote_co_that.py
  - AC4: pdfplumber (MIT) — cấm PyMuPDF/AGPL; giấy phép khai trong bảng
    cmd: python chungcat/tests/check_bang_khai_model.py
