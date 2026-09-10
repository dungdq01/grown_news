# T13-6 — GOLDEN SET (expect địa chỉ) + tín hiệu vận hành rẽ-vector

> Bối cảnh chung plan M13 (s7 2026-09-07, sửa 2026-09-09): spec đã áp FR-072/073
> · service RIÊNG :8791 · ADR-08 · chỉ mục = DẪN XUẤT.
> Vế zh: kho 0 bài Hán ⇒ AC-6.1 vế zh `soft` KÈM LÝ DO cho tới khi có ≥2 bài
> tiếng Trung THẬT — phồn thể hoặc giản thể đều được (chủ dự án 2026-09-09).
> Đường vật liệu rẻ nhất: dev chọn 2 video tiếng Trung, nạp qua M12
> `sinh-transcript` (model.json đã có ngon_ngu zh) ⇒ transcript vào kho ⇒ T13-7
> index được ⇒ golden zh expect `slug:t=`. KHÔNG xanh bằng fixture bịa.

phạm_vi_ghi:
  - truyhoi/src/api.py
  - truyhoi/src/tin_hieu.py
# golden.yaml sống ở truyhoi/tests/ — viết trong đơn vị test T13-1 (R1), đơn vị
# này chỉ làm nó XANH bằng mã

phụ_thuộc: T13-5 · T13-7

verifiability: hard
tiêu_chí:
  - AC1: golden 7 ca Việt xanh; 4 ca Trung có trong file và xanh khi kho có ≥2
      bài Trung, còn không thì cổng in "soft — kho 0 bài Hán" thay vì xanh rỗng;
      đổi w_title KHÔNG làm golden đỏ (expect địa chỉ, không expect điểm)
    cmd: python truyhoi/tests/check_golden_du_ca.py
  - AC2: hai tín hiệu (truy vấn 0-kết-quả, gõ-lại ≥2) ghi được và đọc lại
      được — điểm rẽ vector là SỐ MÁY ĐẾM
    cmd: python truyhoi/tests/check_tin_hieu_van_hanh.py
