# T13-4 — SERVICE :8791: POST /truy-hoi · xếp hạng · _tu_ai() goi_duoc/aud · /health

> Bối cảnh chung plan M13 (s7 2026-09-07, sửa 2026-09-09): spec đã áp FR-072/073
> · service RIÊNG :8791 · ADR-08 · chỉ mục = DẪN XUẤT.
> Khuôn api.py M12: stdlib ThreadingHTTPServer, bind 127.0.0.1:8791, .env nạp ở
> cửa vào tiến trình. Endpoint DUY NHẤT: `POST /truy-hoi` hình dạng FR-072 §1.1
> (hết `/tim`). Bên NHẬN cưỡng chế Z9: `_tu_ai()` đọc `goi_duoc` của `truyhoi`
> trong dich-vu.json (T01-51) + so `x-aud: truyhoi` + khoá theo chiều
> `<từ>→truyhoi`; ngoài bảng/sai aud/thiếu khoá ⇒ 403 (cổng T6 FR-072 — cổng
> duy nhất MỚI về bản chất). /health khai ĐƯỜNG CHỈ MỤC + mốc index gần nhất —
> bài học vận hành M12, cấm health trần.

phạm_vi_ghi:
  - truyhoi/src/api.py
  - truyhoi/src/rank.py
  - truyhoi/assets/nguong.json

phụ_thuộc: T13-3

verifiability: hard
tiêu_chí:
  - AC1: /truy-hoi trả ket_qua[] đủ trường §1.1 (doc_id là slug CÓ trong ban_ghi;
      dia_chi file:A-B phân giải qua dia-chi.json) — không HTML trình bày
    cmd: python truyhoi/tests/check_dia_chi_phan_giai.py
  - AC2: nghe loopback (đo đối số bind); /health khai đường chỉ mục + mốc
    cmd: python truyhoi/tests/check_nghe_loopback.py
  - AC3: w_title đổi ở nguong.json ⇒ hạng đổi, SQL không đổi; HAI số (vi/en · zh)
    cmd: python truyhoi/tests/check_w_title_do_rieng.py
  - AC4: snippet() CHỈ làm preview, body đầy đủ qua rowid là bằng chứng
    cmd: python truyhoi/tests/check_snippet_chi_preview.py
  - AC5: 0 embedding/vector, 0 lời gọi mạng ngoài 127.0.0.1:8787 (spec §7 HOÃN)
    cmd: python truyhoi/tests/check_khong_embedding.py
  - AC6: ba ca 403 — từ ngoài goi_duoc · aud ≠ truyhoi · thiếu khoá; từ `web`
      và `chatbot` mang đúng khoá chiều ⇒ 200 (AC-1.6, M13-R6)
    cmd: python truyhoi/tests/check_ai_goi_vao.py
