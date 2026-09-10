# WO-084 · Chưng cất hỏng: phản hồi BỊ CẮT CỤT, báo sai thành "không phải JSON"

| | |
|---|---|
| **Loại** | bug · M12_chungcat |
| **Mức** | `hard` — người dùng THẤY: việc vào thùng rác, hết 2 lần gửi |
| **Mở** | 2026-09-10, chủ dự án: *"Chưng cất lỗi (request test: Mở mang tầm mắt sau khi xem chị Lauren xài AI.) … tôi check ra thì do call model lỗi (bee/gemini-3.5-flash-lite)"* |

## Repro — tái hiện 2 LẦN trên cùng bản ghi

`slug: video/mo-mang-tam-mat-sau-khi-xem-chi-lauren-xai-ai`, hỏng ở
`dang-goi-model`, cả hai lượt gửi:

```
rac/2fa9648a…json  (lan_gui 2)
  HinhDangSai: [chung-cat] phản hồi không phải JSON sau khi gỡ khung:
  '{\n  "text": "## 1. Overview\nTài liệu ghi lại buổi chia sẻ kỹ thuật … \n\n## 2. Bối cảnh\nKhi mớ'
rac/f4dce5b1…json  (lan_gui 1)  — cùng một lỗi, bản tiếng Anh
```

## Chẩn đoán — KHÔNG phải "model bọc sai vỏ"

Chủ dự án nghi model trả sai hình dạng. Đo ra thì ngược: `_boc`
(`adapter/openai.py:92`) đòi đúng `{"text": …, "quotes": […]}`, nên
`{"text": "## 1. Overview…"}` **chính là hình dạng hợp đồng**.

Và 300 ký tự đầu là JSON **hợp lệ**: sau `{` là newline thật (JSON cho phép),
còn `\n` trong giá trị là escape ĐÚNG. Chỗ vỡ nằm ở **cuối** — chuỗi bị cắt
trước khi `"` đóng và trước khi `quotes` xuất hiện.

⇒ Phản hồi **bị cắt vì hết token**, không phải sai hình dạng.

### Ba chỗ hở, cả ba đã bịt ở lối transcript mà không mang sang

| | `asr_cua.py` (transcript) | `adapter/openai.py` + `google.py` (chưng cất) |
|---|---|---|
| `max_tokens` trong request | `TRAN_CHU = 65536` (`:516`) | **không gửi** — nhận mặc định của cửa, im lặng |
| đọc `finish_reason` | có, `:574-579`, thêm 2026-09-08 cho ĐÚNG lớp lỗi này | **không đọc** |
| câu báo lỗi | *"cửa báo `finish_reason: length`"* | *"phản hồi không phải JSON"* — sai địa chỉ |

`hop_dong.py:go_khung` đã tự ghi bài học này: *"bản đầu tôi sửa MỘT chỗ ⇒ lối
transcript chết đúng cùng một `JSONDecodeError` mười phút sau. Hai bản của một
phép gỡ là hai bản sẽ lệch nhau."* Lần này lệch theo chiều ngược: transcript
được bịt, chưng cất thì không.

### Vì sao nó vỡ ĐÚNG LÚC NÀY

`WO-077` (khuôn linh động) vừa đổi `_PROMPT`: khung 5 mục thành mức **tối
thiểu**, mời model thêm `## 6.`, `## 7.` và dùng bảng Markdown. Output dài ra,
mà không ai nâng trần chữ — vì lối này **chưa bao giờ khai trần chữ**.

Ghi chú: chủ dự án viết model `bee/gemini-3.5-flash-lite`; egress log ghi
`gemini-2.5-flash-lite`. Không đụng chuyện tên model ở WO này — nó không thay
đổi chẩn đoán, và một `-lite` bất kỳ đều có trần output nhỏ.

## Kỳ vọng

- `finish_reason` là `length` ⇒ ném câu NÓI ĐÚNG SỰ THẬT: phản hồi bị cắt, dài
  bao nhiêu ký tự, và cần làm gì. **Không** nói "không phải JSON".
- `finish_reason` là `stop` mà JSON vẫn hỏng ⇒ VẪN nói "không phải JSON" (không
  phải cứ hỏng là quy cho bị cắt).
- Câu báo lỗi parse mang cả **ĐUÔI**, không chỉ 300 ký tự ĐẦU — chỗ vỡ ở cuối,
  nên cửa sổ hiện tại là cửa sổ vô dụng nhất có thể chọn.
- Trần chữ của lối chưng cất **khai ở bảng**, không gõ trong mã, và **cả hai**
  adapter cùng đọc một nguồn.

## Ngoài phạm vi

- `_hinh_dang` luôn trả `json_object` bất kể `kieu_structured` — nợ đã khai
  trong chú thích của chính nó, không phải bug này.
- Nối tiếp/chạy lại khi bị cắt (kiểu `WO-080`): mở sau, khi đo được trần mới
  vẫn không đủ.
