# T12-5 — Adapter nhà thứ nhất (Anthropic) + định tuyến gợi-ý

> Tự viết ~30 dòng/nhà qua SDK chính thức — KHÔNG LiteLLM (nghiên cứu §8:
> 2 sự cố bảo mật 2026 + hình dạng ngược luật một-cửa). Hợp đồng khoá:
> (prompt, tai_lieu) → {text, quotes[]}. NGƯỜI chọn model (FR-053); máy chỉ
> gợi ý từ bảng.

phạm_vi_ghi:
  - chungcat/src/adapter/anthropic.py
  - chungcat/src/dinh_tuyen.py          # gợi ý mặc định (tác_vụ × ngôn_ngữ máy đếm)

verifiability: hard
tiêu_chí:
  - AC1: adapter trả đúng shape {text, quotes[]} — mock ở mức httpx, 0 mạng thật
    cmd: python chungcat/tests/check_mot_hop_dong.py
  - AC2: model NGƯỜI chọn thắng gợi ý; không chọn ⇒ mặc định theo bảng; model
      ngoài bảng ⇒ từ chối tạo job
    cmd: python chungcat/tests/check_mot_hop_dong.py
  - AC3: ngôn ngữ do máy đếm tỉ lệ ký tự — không trường nào cho model tự khai
    cmd: python chungcat/tests/check_mot_hop_dong.py
  - AC4: (FR-053 AC-4.5) bốn phép chặn §1.3 xảy ra TRƯỚC lời gọi model — gieo
      cả bốn ca: 0 token tiêu, 0 dòng egress.jsonl
    cmd: python chungcat/tests/check_dinh_tuyen_ngon_ngu.py
