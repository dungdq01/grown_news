# T12-11 — MỞ RỘNG bảng khai model: nhiều model mỗi provider

> Chỉ đạo chủ dự án 2026-09-04: bộ chọn phải liệt kê NHIỀU model theo provider
> (list GPT · list Claude · list Gemini · …). Bảng hiện có đúng 3 dòng
> (gemini-2.5-flash · deepseek-chat · claude-opus-4-1) — mỗi nhà một model.
> ID theo rule.md mục 9: max M12 = T12-10 ⇒ T12-11.

## Ràng buộc từ bảng khai (không nới)

- Mỗi dòng mới đủ CỘT bắt buộc của bảng: `nha_cung_cap` · `model` · `khu_vuc` ·
  `kieu_structured` · `giay_phep`/điều khoản · `dich` — `check_bang_khai_model`
  phải xanh trên bảng mới, KHÔNG sửa cổng cho vừa dữ liệu.
- `khu_vuc` giữ `khong-xac-dinh` khi chưa xác minh route gateway — KHÔNG điền
  đại một khu vực cho đẹp (đúng tinh thần `$canh_bao_mot_gateway`).
- Nhà mới toanh (openai/GPT chưa có adapter) ⇒ cần thêm `adapter/<nha>.py`
  (~30 dòng theo khuôn `hop_dong.py`) — đó là phép đo AC-3.1 (T12-7): thêm nhà
  = 1 dòng bảng + 1 file, 0 dòng ở LÕI. Đơn vị này ĐỒng thời khép T12-7 nếu
  làm openai.
- Model thêm vào là model NHÌN THẤY ĐƯỢC trong bộ chọn nhưng `--that` vẫn chặn
  ở gateway placeholder — ghi rõ trong `$comment` từng dòng chưa gọi thử.

phạm_vi_ghi:
  - chungcat/assets/model.json          # thêm dòng theo provider
  - chungcat/src/bang_khai.py           # `goi_y` ưu tiên `la_mac_dinh` — xem dưới
  - chungcat/tools/dong_bo_model.py     # MỚI — đồng bộ bảng từ danh mục gateway
  - chungcat/src/api.py                 # `/model` trả thêm `la_mac_dinh`
  - chungcat/src/adapter/openai.py      # MỚI nếu thêm nhà GPT (khuôn google.py)

# Cổng KHÔNG khai: `check_bang_khai_model.py` xanh nguyên trên bảng 238 dòng,
# không phải sửa vế nào. Khai một file không chạm là mở một quyền không dùng.

# `bang_khai.py` THÊM VÀO phạm vi lúc thi công (2026-09-04), có lý do:
# `goi_y()` trả DÒNG ĐẦU khớp `(tac_vu, ngon_ngu)`. Với bảng ba dòng (mỗi nhà
# một model) điều đó TÌNH CỜ đúng. Với tám dòng, "gợi ý mặc định" thành
# **chọn theo vị trí trong file** — một cú sắp xếp lại đổi mặc định mà không ai
# khai, và `la_mac_dinh` (cột có sẵn, `$la_mac_dinh` giải thích nó chi phối
# `du_phong`) trở thành trang trí. Sửa: `goi_y` ưu tiên `la_mac_dinh`.
# Đây là hệ quả TRỰC TIẾP của việc bảng lớn lên, nên nó thuộc đơn vị này.

verifiability: hard
tiêu_chí:
  - AC1: bảng có ≥2 model cho ≥2 provider; mọi dòng đủ cột bắt buộc
    cmd: python chungcat/tests/check_bang_khai_model.py
    đỏ_khi: dòng thiếu cột, hoặc tên model xuất hiện trong mã (AST)
    xanh_khi: cổng xanh trên bảng mới
  - AC2: nhà mới (nếu thêm) = 1 dòng bảng + 1 file adapter, 0 dòng đổi ở LÕI
      và 0 dòng đổi ở vong/egress/verify — đo bằng git diff
    cmd: python chungcat/tests/check_engine_cam_rut.py
  - AC3: GET /model (:8790) trả đủ dòng mới, cửa web /api/model đi nguyên
      nha_cung_cap
    cmd: python chungcat/tests/check_chi_loi_goi_tu_loi.py && node web/test/loi-tho-cua.test.js
  - AC4: gợi ý mặc định do `la_mac_dinh` quyết, KHÔNG do thứ tự dòng
    cmd: python chungcat/tests/check_dinh_tuyen_ngon_ngu.py
    đỏ_khi: đảo thứ tự hai dòng cùng `ngon_ngu` đổi được gợi ý mặc định
    xanh_khi: gợi ý bám `la_mac_dinh`

# ĐÃ THI CÔNG 2026-09-04, HAI LƯỢT:
#
# Lượt 1 — gõ tay 3 → 8 dòng. Chủ dự án bác: *"chưa đủ, cần liệt kê đầy đủ …
# có thể tham khảo trên mạng với 9router/openrouter"*.
#
# Lượt 2 — ĐỒNG BỘ TỪ DANH MỤC GATEWAY. `chungcat/tools/dong_bo_model.py` đọc
# `/models` (định dạng OpenRouter, URL ở `$nguon_danh_muc`) rồi ghi bảng khai:
#   · **238 dòng / 15 nhà** — openai 58 · qwen 50 · google 29 · mistralai 18 ·
#     anthropic 15 · z-ai 14 · deepseek 13 · moonshotai 7 · meta-llama 7 ·
#     x-ai 6 · minimax 6 · nvidia 5 · amazon 5 · cohere 4 · perplexity 1
#   · `kieu_structured` DẪN XUẤT từ `supported_parameters` của danh mục
#     (`structured_outputs`→json_schema · `tools`→tool_use ·
#     `response_format`→json_mode · không có gì ⇒ BỎ DÒNG, vì hợp đồng M12 LÀ
#     structured output) — không đoán một cột nào.
#   · CHÍNH SÁCH do NGƯỜI giữ và đồng bộ KHÔNG ghi lên: `khu_vuc` · `du_phong` ·
#     `la_mac_dinh` · `ngon_ngu` · `can_key` · `dich`.
#   · `--kiem` cho CI: trả 1 khi bảng lệch danh mục, KHÔNG tự sửa.
#
# ⚠️ BẰNG CHỨNG cho chính lập luận đó: **ba trong tám dòng gõ tay ở lượt 1
# KHÔNG TỒN TẠI** ở gateway — `claude-opus-4-1` (gateway dùng dấu CHẤM:
# `claude-opus-4.1`) · `claude-haiku-4-5` · `deepseek-reasoner` (gateway gọi
# `deepseek-r1`). Cả ba sẽ 404 GIỮA JOB, và không cổng nào cũ bắt được: cổng chỉ
# đo bảng khai TỰ NHẤT QUÁN, không đo bảng KHỚP THỰC TẾ. Công cụ đồng bộ bắt
# được ngay lượt chạy đầu.
#
# AC2 (adapter nhà mới) CHƯA thi hành: 15 nhà trong bảng mà chỉ `google` có
# adapter ⇒ mọi model của 14 nhà kia bị phép chặn (b) từ chối TRƯỚC khi tiêu
# token (`check_chan_truoc_khi_goi.py` đo đúng điều đó). Cần chủ dự án xác nhận
# gateway nói một hợp đồng chung (OpenRouter) — nếu có thì MỘT adapter dùng cho
# cả 15 nhà, không phải 15 file.
#   · 21/21 cổng M12 xanh · worklog `WL-01KA10MODELPROVIDER` + `WL-01KA12DANHMUC`
