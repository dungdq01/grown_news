# T12-25 — `chi_dan` của NGƯỜI trong job chưng cất (prompt thêm, có vết)

> Chủ dự án duyệt 2026-09-06. Nguyên tắc: PROMPT HỆ là hợp đồng máy — BẤT
> BIẾN; chỉ dẫn người là "yêu cầu thêm" chèn Ô ĐÓNG KHUNG, hợp đồng thắng
> khi xung đột (verify + _than_theo_khung + validate vẫn ép như cũ).
> ID theo rule 9: max 24 ⇒ 25.

## Hình dạng

- `POST /job` nhận `chi_dan` (tuỳ chọn): chuỗi, trần `tran_chi_dan_ky_tu`
  ở bảng khai (khởi điểm 500, $vi_sao); lột ký tự điều khiển; QUÁ trần ⇒ 422
  nói rõ — không cắt im lặng.
- Worker chèn SAU prompt hệ: "YÊU CẦU THÊM của người đọc (không được phá
  khung mục hay định dạng JSON ở trên): «<chi_dan>»" — sandwich, hệ thắng.
- `chi_dan` lưu trong job file + đi vào metadata bản nháp (cột/DDL nháp có
  chỗ chưa? nếu thêm cột: loi.schema.sql của T08-19 — khai rõ) — người duyệt
  THẤY bài được chưng theo chỉ dẫn nào. Tự nhiên vào sha256+egress (có vết).
- Bảng khai MỚI `chungcat/assets/chi-dan-mau.json`: preset cho UI
  ({ten, chi_dan, $vi_sao} — "tóm cho dev" · "tập trung rủi ro" ·
  "so sánh thực tiễn VN" khởi điểm); GET /model hoặc cửa riêng trả kèm
  cho FE (dẫn xuất, FE không gõ cứng).

phạm_vi_ghi:
  - chungcat/src/api.py            # nhận + kiểm chi_dan
  - chungcat/src/worker.py         # chèn sandwich + truyền vào nháp
  - chungcat/assets/chi-dan-mau.json   # MỚI — preset
  - chungcat/assets/nguong.json    # tran_chi_dan_ky_tu + $vi_sao
# `web/api/nhap-cua.mjs` KHÔNG cần chạm — đất M08, và thi công cho thấy nó
# thừa. Bản khai đầu để ngỏ *"nếu cột mới"*; đo ra là KHÔNG cần cột mới:
# `chi_dan` nằm trong FRONTMATTER của bản nháp, mà cửa nháp trả nguyên
# `ban_goc_ai` — tức nó đã đi kèm sẵn. Thêm một cột cho một dữ liệu đã có
# đường đi là dựng bản thứ hai của một sự thật.
# AC3 vẫn đo được, và đo trên đường THẬT (`check_chi_dan` vế AC3).

verifiability: hard
tiêu_chí:
  - AC1: job mang chi_dan ⇒ payload gửi đi CHỨA nó trong ô đóng khung, prompt
      hệ nguyên vẹn đứng trước (đo payload mock)
    cmd: python chungcat/tests/check_chi_dan.py
    đỏ_khi: chi_dan thay thế/đứng trước prompt hệ, hoặc không vào payload
    xanh_khi: sandwich đúng thứ tự
  - AC2: chi_dan quá trần ⇒ 422 nói rõ; ký tự điều khiển bị lột; job KHÔNG
      chi_dan chạy y như cũ (regression 0)
    cmd: python chungcat/tests/check_chi_dan.py
  - AC3: nháp sinh ra mang chi_dan đọc được qua GET /api/nhap-chung-cat/<ulid>
    cmd: python chungcat/tests/check_chi_dan.py && node web/test/loi-nhap-cua.test.js
  - AC4: preset đọc từ bảng khai — thêm 1 dòng file ⇒ API trả thêm 1 preset,
      0 dòng mã đổi
    cmd: python chungcat/tests/check_chi_dan.py
  - AC5: nền không vỡ — e2e mock + verify/khung giữ nguyên hành vi
    cmd: python chungcat/tests/check_e2e_chung_cat.py --mock
# cổng check_chi_dan.py thuộc đơn vị test M12 (T12-15 mở rộng CÙNG LƯỢT)
