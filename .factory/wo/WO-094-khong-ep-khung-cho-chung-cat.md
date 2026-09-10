# WO-094 · Bản chưng cất KHÔNG bị ép khung 5 mục của bài viết

| | |
|---|---|
| **Loại** | cải tiến (nới một phép kiểm) · M01_core |
| **Mức** | `hard` |
| **FR** | `FR-036a` — chủ dự án **DUYỆT** 2026-09-10, và **thu hẹp**: *"Tôi chỉ cần ko áp phan-tich (ép 5 mục) cho chưng cất, mọi thứ để tự nhiên — người và model LLM quyết."* |

## Khác FR-036a §3 ở đâu

`FR-036a` đề xuất **khung theo loại nguồn** (`theo_nguon` trong bảng khai). Chủ
dự án chọn đơn giản hơn: **không ép khung cho bản chưng cất, chấm hết.** Nên
`khung-than-bai.json` KHÔNG đổi — đỡ một nhánh cấu hình không ai xin.

## Nhận diện "bản chưng cất" bằng gì

`origin: pipeline` — đúng sự thật và đã có sẵn: `worker.py:504` ghi nó cho mọi
bản máy sinh, và người gõ tay thì `origin` là `manual`.

KHÔNG dùng `ho_so`: enum ấy FROZEN và chỉ có hai nấc, nấc còn lại (`thu-vien`)
bỏ **cả** trần 400 từ — một bản chưng cất 6000 từ sẽ trượt ở đó.

## Bỏ gì, GIỮ gì

| phép kiểm | pipeline | vì sao |
|---|---|---|
| `Thiếu mục` (5 mục + mục con) | **BỎ** | đây là *"form bài viết"* chủ dự án bác |
| trần dẫn nhập §1+§2 | **BỎ** | nó đo tỉ lệ giữa các MỤC — không còn mục thì vô nghĩa |
| locator ở mục bắt buộc | **BỎ** | cùng lý do: nó neo vào số mục |
| trần từ (`tran_tu_cung`) | **GIỮ** | không phải hình dạng, là phanh chống bài phình |
| `concepts`/`category` trong danh mục | **GIỮ** | nhãn phải có thật, không liên quan khung |
| frontmatter schema | **GIỮ** | hợp đồng dữ liệu, không phải hình dạng văn bản |

## Vì sao đây là nới có chủ đích, không phải bỏ cổng

Một bản `origin: manual` vẫn bị ép đủ 5 mục — người viết tay vẫn theo khung.
Chỉ bản MÁY sinh được tự do, và đó đúng là thứ được yêu cầu: *"người và model
LLM quyết"*.

Đổi lại: hai bản chưng cất không còn so được theo cùng bộ mục. Chủ dự án đã
biết và chọn.

## Kỳ vọng

- `origin: pipeline` + thiếu mục ⇒ **PASS**.
- `origin: manual` + thiếu mục ⇒ **vẫn TRƯỢT** (vế âm nặng nhất).
- Trần từ, nhãn, schema vẫn chặn ở cả hai.
