# T12-18 — cửa BEEKNOEE: nguồn danh mục thật + adapter của CỬA (FR-059)

> Chủ dự án 2026-09-04 cung cấp `beeknoee-api-guide.md` và chốt default
> `gemini-2.5-flash-lite`. ID theo `rule.md` mục 9: `ls` → max `T12-17` ⇒ 18.

## Ba việc

### 1 · Nguồn danh mục = Beeknoee, không OpenRouter

`T12-11` đồng bộ từ OpenRouter (238 dòng) — sai cửa. Cửa thật:
`https://platform.beeknoee.com/v1/models`, **không cần khoá**, trả 155 model.

Hình dạng khác OpenRouter, nên `dong_bo_model.py` đổi theo:

| | OpenRouter | Beeknoee |
|---|---|---|
| nhà | `id` trước `/` | `owned_by` |
| năng lực | `architecture.*_modalities` | `supports_pdf/audio/video/…` |
| cơ chế structured | `supported_parameters` | **không có** |

⇒ `kieu_structured` **không dẫn xuất được** — nó thành CHÍNH SÁCH theo nhà
(`$kieu_theo_nha`, mặc định `json_mode` = mẫu số chung của cửa
OpenAI-compatible). Nói ra là chính sách, không giả vờ là số đo.

Hai phép lọc mới, cả hai đo được:
- **id TRÙNG** — `gemini-3.5-flash-lite` xuất hiện 5 lần với `supports_*` khác
  nhau (5 route của một model). Giữ bản nhiều năng lực nhất.
- **`$bo_mau` là REGEX, không phải đuôi** — Beeknoee đặt tên tác vụ ở GIỮA id
  (`gpt-image-1-mini`, `gemini-3.1-flash-image-preview`, `wan-2.7-image-pro`);
  phép so đuôi lọt cả ba.

Kết quả: **112 dòng / 14 nhà**. `*-stt` cố ý bị loại khỏi bảng chưng cất — nó
thuộc `nguon_transcript` của `FR-054`.

### 2 · Default `gemini-2.5-flash-lite`

`la_mac_dinh` cho `vi`; `du_phong` → `gemini-2.5-flash` (cùng nhà).
`zh` → `deepseek/deepseek-v4-flash`, `du_phong` → `deepseek/deepseek-v4-pro`.
Ba id cũ (`gemini-2.5-flash` gõ tay, `deepseek-chat`, `deepseek-reasoner`)
**không tồn tại** ở cửa này — công cụ đồng bộ bắt ngay.

### 3 · Adapter của CỬA (FR-059)

Đo được TRƯỚC khi sửa: `check_model_ngoai_bang.py` ĐỎ — `kimi-k2.5` CÓ trong
bảng mà `POST /job` trả 422 *"nhà `alibaba` chưa có adapter"*. **111/112 model
bấm là 422.** Guide §3 nói cửa là OpenAI-compatible, một client cho mọi nhà ⇒
mô hình N-nhà-N-adapter sai với thực tế. Chi tiết + hai lối bị loại: `FR-059`.

`chungcat/src/adapter/beeknoee.py` — adapter của cửa. Cưỡng chế ba luật sampling
của guide §2 bằng cách **không gửi field sampling nào**: Claude Opus 4.7+ trả
400 nếu có `temperature`, Sonnet/Haiku 4.x chỉ nhận một trong hai — và chưng cất
cần trích nguyên văn, một `temperature` cao là chỗ quote bị viết lại.
Thiếu `BEEKNOEE_API_KEY` ⇒ ném TẠI ĐÂY, không để cửa trả 401 sau khi payload đã
dựng và log egress đã ghi một lần gửi hỏng.

phạm_vi_ghi:
  - chungcat/tools/dong_bo_model.py
  - chungcat/assets/model.json
  - chungcat/src/adapter/beeknoee.py     # MỚI
  - chungcat/src/adapter/hop_dong.py     # `adapter_cua`
  - chungcat/src/dinh_tuyen.py           # vế (b) hỏi CỬA
  - chungcat/tests/check_chan_truoc_khi_goi.py
  - chungcat/tests/check_mot_hop_dong.py
  - chungcat/tests/check_du_phong_cung_khu_vuc.py
  - chungcat/tests/check_e2e_chung_cat.py

# Bốn cổng sửa CÙNG LƯỢT với mã (`rule.md` mục 8): chúng hỏi
# `co_adapter(nha_cung_cap)`, mà `FR-059` đổi thứ được hỏi sang CỬA. Không sửa
# thì chúng đo một mệnh đề đã hết đúng và đỏ oan trên mọi dòng bảng.

verifiability: hard

tiêu_chí:
  - AC1: bảng khai khớp danh mục cửa; mọi dòng đủ cột; 0 tên model/nhà trong mã
    cmd: python chungcat/tools/dong_bo_model.py --kiem && python chungcat/tests/check_bang_khai_model.py
    đỏ_khi: bảng lệch danh mục · thiếu cột · tên cửa/nhà/model gõ trong `src/**`
    xanh_khi: "`--kiem` in `khớp.` và cổng xanh"
  - AC2: model TRONG bảng đi qua được cửa; model ngoài bảng bị từ chối
    cmd: python chungcat/tests/check_model_ngoai_bang.py
    đỏ_khi: model có trong bảng trả 422 · model lạ trả 2xx · hàng đợi thêm việc
    xanh_khi: cả ba vế đúng
  - AC3: bốn phép chặn §4.0b vẫn chặn TRƯỚC token, ca (b) nay là CỬA
    cmd: python chungcat/tests/check_chan_truoc_khi_goi.py
    đỏ_khi: ca nào gọi tới transport · `egress.jsonl` thêm dòng
    xanh_khi: 0 lời gọi · 0 dòng log · đối chứng ghi đúng 1 dòng
  - AC4: 21 cổng M12 xanh · suite web xanh
    cmd: python core/tests/check_g6b.py

# FR-059 nêu trong thân, không khai ở đây: cổng chỉ phân giải ID TASK.
phụ_thuộc: T12-11
