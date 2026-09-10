# FR-070 — chưng cất một bản ghi VIDEO lấy TRANSCRIPT làm nguyên liệu

- **mở**: 2026-09-07 · **người quyết**: chủ dự án (*"sau khi có bản transcript
  rồi thì mới hiển thị button chưng cất, bấm vào thì bản transcript mới truyền
  vào làm input"*) · **trạng thái**: **ĐÃ DUYỆT — chủ dự án, 2026-09-07** (*"duyệt"*)
- **artifact chạm (FROZEN)**: `06_modules/M12_chungcat/spec.md`
- **liên đới**: `FR-054` (thêm `sinh-transcript`) · `FR-069` (thêm `tai-video`)

## 0 · Vì sao — một phép đo, không phải một ý thích

`_doc_nguon(slug)` đọc `than` của bản ghi qua `/api/articles/<slug>`.

Với bản ghi **video đăng ký bằng URL**, `than` là **phần mô tả người gõ tay**
— vài dòng. Transcript (hàng chục nghìn chữ, chính là nội dung video) nằm ở
một chỗ khác hẳn: hiện vật `text/vtt` gắn trên bản ghi.

⇒ Hôm nay, bấm "chưng cất" một video là **chưng cất phần mô tả**, không phải
chưng cất video. Model nhận vài dòng và được yêu cầu dựng một bài phân tích
đủ khung — nó chỉ còn cách bịa.

Đây là loại lỗi không tự lộ: bản nháp vẫn ra, vẫn đủ mục, vẫn qua `validate`.
Chỉ người ĐỌC mới thấy nó rỗng.

## 1 · Đổi gì trong `spec §1 Vào`

Thêm một dòng cho bản ghi loại `video`:

```
video có transcript   ⇒ nguyên liệu = NỘI DUNG TRANSCRIPT (`text/vtt` → text)
video CHƯA transcript ⇒ KHÔNG chưng cất được — cửa từ chối 409, nói rõ
                        "sinh transcript trước"
```

**Từ chối, không rơi về `than`.** Rơi về mô tả là im lặng làm một việc khác
việc người bấm — và họ chỉ biết khi đọc bản nháp rỗng.

## 2 · Thứ tự việc trở thành một CHUỖI, và spec phải nói ra

Trước FR này ba loại việc độc lập nhau. Nay:

```
sinh-transcript  →  (có .vtt)  →  chung-cat-mot-nguon
```

Hệ quả phải khai, vì nó đổi hình dạng màn:

- Nút **Chưng cất** của một bản ghi video chỉ có nghĩa **sau khi** transcript
  xong. Trước đó nó là một nút dẫn tới 409.
- `chung-cat-mot-nguon` cho video nay có **phụ thuộc**, và một việc có phụ
  thuộc thì hàng đợi phải nói được *"đang chờ cái gì"*.

## 3 · Việc transcript phải ĐỂ LẠI CON TRỎ

Đo 2026-09-07: `ket_qua` của mọi việc `sinh-transcript` là **`null`** —
`chay_sinh_transcript` trả `{sha256, cue, model_asr}` nhưng KHÔNG gọi
`ghi_ket_qua`, và `mot_vong` chỉ giữ khoá `citations`.

Hai thứ hỏng vì chỗ này:

1. Chưng cất **không tra được** transcript của bản ghi (không có sha để lấy).
2. Thẻ transcript ở `/chung-cat/` **không mở detail được** — chủ dự án bắt
   đúng: *"nó không xem detail được như chưng cất"*.

⇒ `chay_sinh_transcript` phải `ghi_ket_qua({sha256, so_cue, slug})`. Một việc
không để lại con trỏ tới sản phẩm của nó là một việc không ai kiểm được.

## 4 · KHÔNG đổi

- Ba loại việc giữ nguyên tên và hợp đồng payload.
- `chung-cat-mot-nguon` trên bản ghi **văn bản** (`article`/`docs`/`repo`/
  `paper`) giữ nguyên: nguyên liệu vẫn là `than`.
- `chi_dan` của người (`T12-25`) giữ nguyên vai — nó **cộng thêm** vào nguyên
  liệu, không thay nguyên liệu.
- Bộ nút vòng đời, thùng rác, dọn bản cũ: không đụng (chủ dự án dặn *"chỉ làm
  thêm, không sửa các tính năng đã chốt"*).

## 5 · Bằng chứng đóng

- `python chungcat/tests/check_chung_cat_dung_transcript.py` — nguyên liệu của
  một video CÓ transcript là nội dung `.vtt`; video CHƯA có ⇒ 409 kèm câu chỉ
  đường
- `ket_qua` của việc `sinh-transcript` mang `sha256` — đo trên một việc thật
- `<freeze-check> --ký` sau khi FR duyệt

## 6 · Chưa quyết trong FR này

Cửa sổ hiển thị (một cửa sổ ba tab hay ba cửa sổ song song) là **việc của
M03**, không phải hợp đồng của M12. FR này chỉ khai nguyên liệu và con trỏ.
