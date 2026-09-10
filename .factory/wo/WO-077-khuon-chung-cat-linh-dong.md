# WO-077 — Khuôn chưng cất cứng như khuôn viết bài; mở cho model linh động

- **Loại**: cải tiến · **Module**: M12_chungcat · **Mức**: hard
- **Task**: `T12-33`
- Chủ dự án 2026-09-09, kèm mẫu ChatGPT (`tom_tat_buoi_on_thi.pdf`):

> *"format chưng cất nên để linh động — hiện tại chúng ta đang set format chưng
> cất giống format viết bài (bài viết) → điều đó làm giảm tính linh động của
> model khi chưng cất. Giải pháp: có thể thêm context ở input call API chưng
> cất, ngoài prompt thì có thể thêm 1 vài ý nào đó."*

## Chẩn đoán — chủ dự án đúng, và gốc rễ đo được

`worker.py:476-477` gõ cứng `source_type: article` + **`ho_so: phan-tich`**.
`phan-tich` là hồ sơ ĐÒI KHUNG (`FR-036/B1`), nên validate bắt đủ mục
`1 · 2 · 3 (3.1–3.4) · 4 · 5`. Từ đó cả dây chuyền khoá lại:

| mắt xích | làm gì |
|---|---|
| `_PROMPT` | bắt model viết ĐÚNG 5 mục ấy |
| `_than_theo_khung` | **dựng lại** thân theo `_khung_muc()`, vứt mọi thứ ngoài khung |
| `_CHOT` | cấm `chi_dan` đổi khung mục |

Mẫu ChatGPT có **7 mục sinh từ nội dung + 3 bảng**. Khung 5 mục
(*Đầu vào · Process · Output*) là khung của một **bài phân tích kỹ thuật**; áp
lên một buổi ôn thi thì không có "đầu vào" nào để viết.

## ĐO ĐƯỢC — hợp đồng KHÔNG cấm linh động

Giả thiết ban đầu của tôi: nới khung phải sửa `core/assets/khung-than-bai.json`
— entity `Source` của M01, `used_by: [M01 M02 M03 M04 M05 M06 M07]` ⇒ **7 module**
⇒ BUILD + FR. **Sai.**

Đo 2026-09-09: chép một bản `ho_so: phan-tich` thật, **thêm `## 6.` (có bảng
Markdown) và `## 7.`**, chạy `validate.py` ⇒ **0 lỗi**.

Vì `validate` chỉ kiểm mục bắt buộc **CÓ MẶT**
(`missing = [n for n in SO_MUC if n not in secs]`) — nó **không** cấm mục thừa.

⇒ Khung 5 mục là **sàn, không phải trần**. Thứ áp trần là `_than_theo_khung`
của chính M12 — nó phát lại thân từ `_khung_muc()` và **im lặng vứt** mục 6, 7.
**Sửa gọn trong M12. Không FR, không chạm M01.**

## Kỳ vọng

1. Model được **thêm mục** ngoài 1–5 theo nội dung; `_than_theo_khung` **giữ**
   chúng, nối sau khung bắt buộc, đúng thứ tự model viết.
2. Prompt **nhắc dùng bảng** khi liệt kê ≥3 cặp — FE `md()` đã render `<table>`.
3. Payload nhận **`boi_canh`** (bối cảnh nguồn: ai nói, cho ai, hoàn cảnh) —
   tách khỏi `chi_dan` (*cách viết*). Mẫu ChatGPT có hẳn một khối "Bối cảnh".
4. `_CHOT` chỉ còn cấm **phá JSON** và **bỏ mục bắt buộc** — KHÔNG cấm thêm mục.

## Ràng buộc

- Mục `1–5` + `3.1–3.4` vẫn **bắt buộc có mặt** và đúng thứ tự — đó là hợp đồng
  `phan-tich`, và `_than_theo_khung` tồn tại vì model từng bỏ sót `3.1–3.4`.
- `[<slug>:p.N]` giữ nguyên (`M12-R2`).
- `boi_canh` đi qua `lam_sach_chi_dan` — cùng lối chống đóng-ô `«»` như `chi_dan`.
- Frontmatter nhận khoá lạ được (gốc schema không `additionalProperties: false`;
  `chi_dan` đã sống ở đó theo đúng cách này).
