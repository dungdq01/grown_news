# T12-1 — Bảng khai `chungcat/assets/model.json` + phép đọc

> FR-053: NGƯỜI chọn model, máy chỉ gợi ý mặc định theo (tác_vụ × ngôn_ngữ).
> Cột theo nghiên cứu §1 §6 §7: kieu_structured · nguong_lech_schema · che_do
> (sync|batch) · thu_vien_pdf + giay_phep · khu_vuc · du_phong CÙNG khu vực.

phạm_vi_ghi:
  - chungcat/assets/model.json
  - chungcat/src/bang_khai.py          # đọc + validate 3 bảng khai lúc khởi động

verifiability: hard
tiêu_chí:
  - AC1: model.json đủ cột khai trên; mọi du_phong cùng khu_vuc với chính; thiếu
      cột ⇒ ĐỎ lúc khởi động (fixture bảng thiếu cột ở thư mục tạm)
    cmd: python chungcat/tests/check_bang_khai_model.py
  - AC2: đổi model = đổi MỘT dòng bảng, 0 dòng mã (AC-7.1) — fixture đổi rồi
      đọc lại
    cmd: python chungcat/tests/check_bang_khai_model.py
