# FR-059 — Adapter thuộc CỬA, không thuộc NHÀ

- **mở**: 2026-09-04 · **người quyết**: chủ dự án (cung cấp `beeknoee-api-guide.md`
  + chốt default `gemini-2.5-flash-lite`) · **trạng thái**: **ĐỀ XUẤT — chờ ký**
- **artifact FROZEN chạm**: `06_modules/M12_chungcat/spec.md` (`AC-3.1` · `§4.0b`
  vế b) — NGƯỜI ký lại `FROZEN.lock`
- **artifact khác chạm**: `chungcat/src/adapter/hop_dong.py` · `dinh_tuyen.py` ·
  `chungcat/assets/model.json` · 5 cổng đọc `co_adapter`

## 0 · Vì sao — một số đo, không một ý kiến

`spec §3` giả định mô hình **N nhà, N adapter**: `co_adapter(nha_cung_cap)` hỏi
*"có file `adapter/<nhà>.py` chưa"*, và `§4.0b` vế b chặn khi chưa có.

Chủ dự án cung cấp `beeknoee-api-guide.md` 2026-09-04: dự án đi qua **một cửa
Beeknoee, OpenAI-compatible**. Guide §3 nguyên văn: *"chỉ cần một client duy
nhất, đổi tên model để chuyển provider"*.

⇒ Giả định N-nhà-N-adapter **sai với thực tế**, và cái sai đó đo được:

```
bảng khai sau đồng bộ:  112 model / 14 nhà
adapter có trên đĩa:    google.py  (+ beeknoee.py vừa thêm)
⇒ 111 / 112 model bị §4.0b vế b TỪ CHỐI
check_model_ngoai_bang.py ĐỎ: model `kimi-k2.5` CÓ trong bảng ⇒ 422
   "nhà `alibaba` chưa có adapter"
```

Bộ chọn bày 112 model mà **111 cái bấm là 422**. Đó không phải một cổng đỏ oan —
cổng nói đúng, chỗ sai là mô hình.

## 1 · Chốt

Adapter phân giải theo **CỬA**, khai ở bảng:

```json
"$adapter_mac_dinh": "beeknoee"
```

- Mỗi dòng có thể khai `adapter` riêng để đè; không khai thì dùng mặc định.
- `hop_dong.adapter_cua(dong)` trả tên adapter của một dòng — **một chỗ** quy
  đổi, cùng lý do `ten_module` tồn tại.
- `§4.0b` vế b đọc lại: *"**cửa** mà dòng này cần chưa có adapter"*. Mệnh đề giữ
  nguyên hình dạng (chặn ở cổng khai báo, trước khi tiêu token) — chỉ đổi **thứ
  được hỏi**.
- `AC-3.1` đọc lại: thêm một nhà = **1 dòng bảng khai + 0 file**. Phép đo của AC
  (*"0 dòng ở LÕI"*) vẫn đúng, và nay còn rẻ hơn.

## 2 · Vì sao KHÔNG chọn hai lối kia

| lối | vì sao không |
|---|---|
| 14 file `adapter/<nhà>.py` mỗi file `from beeknoee import goi` | 14 file nói dối rằng có 14 bề mặt riêng, trong khi có một. Và mỗi nhà mới lại một file — `AC-3.1` biến thành thuế |
| `co_adapter` trả `True` cho mọi nhà khi có `beeknoee.py` | Nó phá `check_engine_cam_rut`: *"nhà chưa có file ⇒ nói KHÔNG"*. Câu hỏi đó vẫn đúng cho ca **adapter trực tiếp**, và ta không được bỏ nó — có ngày dự án gọi thẳng một nhà, không qua gateway |

## 3 · Việc phải làm

1. `model.json`: `$adapter_mac_dinh` + cột `adapter` (đồng bộ điền).
2. `hop_dong.adapter_cua(dong)`; `dinh_tuyen` vế b hỏi nó.
3. 5 cổng đổi `co_adapter(d["nha_cung_cap"])` → `co_adapter(adapter_cua(d))`.
   Đơn vị TEST làm, cùng lượt với mã (`rule.md` mục 8).
4. `spec.md`: `AC-3.1` + `§4.0b` vế b đổi chữ **nhà** → **cửa**. FROZEN ⇒ NGƯỜI
   ký lại `FROZEN.lock`. **Agent chuẩn bị, không ký.**

## 4 · KHÔNG làm

- Không bỏ phép chặn (b). Nó vẫn phải chặn TRƯỚC khi tiêu token.
- Không bỏ `co_adapter` theo nhà — lối gọi trực tiếp vẫn phải đo được.
- Không nới `allowlist` egress: đích vẫn là host của cửa, không phải host nhà.
