# FR-036a — Khung thân bài khai THEO LOẠI NGUỒN, không một khung cho tất cả

- **mở**: 2026-09-10 · **người quyết**: *chờ chủ dự án* · **trạng thái**: **CHỜ KÝ**
- **sửa vế của**: `FR-036` (khung 5 mục) — nó chốt *một* khung cho mọi `phan-tich`
- **artifact chạm**: `core/assets/khung-than-bai.json` (**không frozen**) ·
  `core/src/source_distiller/validate.py` (**không frozen**) ·
  `chungcat/src/worker.py` (`_PROMPT`)
- **KHÔNG chạm**: `core/assets/frontmatter.schema.json` (**FROZEN**) — xem §2

## 0 · Chỉ đạo

Chủ dự án 2026-09-10: *"xử lý vụ output chưng cất nới form — ko áp dụng form
bài viết → linh động cho model LLM chưng cất?"*

## 1 · Đo được — cái gì đang ép

`worker.py:502` gõ cứng cho **mọi** bản chưng cất, dù nguồn là video, PDF hay repo:

```
source_type: article
ho_so: phan-tich
slug: phan-tich-<ten>
```

`ho_so: phan-tich` kéo theo, ở `validate.py:441-451`:

| ép | hệ quả |
|---|---|
| **5 mục bắt buộc** + mục con | một video 20 phút và một PDF 80 trang phải cùng bộ mục |
| trần dẫn nhập §1+§2 | hợp lý, giữ |
| tinh túy · locator | hợp lý, giữ |

`WO-077` đã nới phần **thêm**: model được viết `## 6.`, `## 7.`, dùng bảng.
Cái còn cứng là **5 mục bắt buộc** — và chúng mang hình một bài viết.

## 2 · Vì sao KHÔNG đụng `frontmatter.schema.json`

Lối hiển nhiên là thêm một `ho_so` thứ ba. Nhưng:

- enum ấy nằm trong file **FROZEN**, `project_map:847` gọi là *"CHÂN LÝ, frozen"*;
- `ho_so` chỉ có hai nấc và **không nấc nào ở giữa**: `thu-vien` bỏ **mọi** phép
  kiểm thân (trần 400 từ, miễn mục/dẫn nhập/tinh túy/locator). Đó không phải
  "linh động", đó là "không kiểm";
- `FR-044` đã mở `tong-hop` cho ca **N nguồn** — khác ca này, không dùng lại được.

⇒ Giữ `ho_so: phan-tich`. Thứ đổi là **khung nào áp cho nguồn nào**, và khung
khai ở `khung-than-bai.json` — file **không frozen**.

## 3 · Hình dạng đề xuất

`khung-than-bai.json` mọc thêm một nhánh `theo_nguon`, **mặc định là bộ hôm nay**:

```jsonc
{
  "muc": [ … 5 mục như hôm nay … ],          // MẶC ĐỊNH, không đổi
  "theo_nguon": {
    "video":    { "bat_buoc": [1, 2], "goi_y": [3, 4, 5] },
    "tai-lieu": { "bat_buoc": [1, 2, 3] }
  }
}
```

- Không khai ⇒ **y như hôm nay**. Không bài nào trong kho phải sửa.
- `validate` chọn bộ theo `nguon:` của frontmatter (`nguon: [video/...]`), không
  theo `source_type` của chính bản nháp — bản nháp vẫn là `article`.
- Mục ngoài `bat_buoc` mà model có viết thì **vẫn giữ** (`WO-077` đã làm).

## 4 · Vì sao đây vẫn là quyết định của người, không phải một bug fix

**Nó nới một phép kiểm.** Hôm nay một bản chưng cất thiếu §5 bị chặn; sau FR
này, với nguồn video thì không. Đó là đánh đổi có thật:

- **được**: model không phải bịa cho đủ mục khi nguồn không có gì để nói ở mục ấy —
  và bịa cho đủ mục chính là thứ làm bản chưng cất loãng;
- **mất**: hai bản chưng cất từ hai loại nguồn không còn so sánh được theo cùng
  một bộ mục, và `AC` nào đang dựa vào "luôn có §5" sẽ phải sửa.

Cần bạn chốt **bộ mục bắt buộc cho video và cho tài liệu** — tôi không tự chọn,
vì đó là câu *"một bản chưng cất tối thiểu phải trả lời những gì"*, và đó là
câu của người dùng sản phẩm.

## 5 · Phạm vi thi công nếu duyệt

Chạm M01 (`assets` + `validate`) và M12 (`_PROMPT`) ⇒ theo `go` câu 1 là
**BUILD**, không PATCH. Ước hai đơn vị việc:

1. `khung-than-bai.json` + `validate` đọc `theo_nguon` — cổng: bài `article` cũ
   **không đổi kết quả** (vế âm nặng nhất), bài nguồn video theo bộ mới.
2. `_PROMPT` nói đúng bộ mục của nguồn đang chưng cất.

## 6 · Không duyệt thì sao

Giữ nguyên. Bản chưng cất video vẫn phải đủ 5 mục — model sẽ bịa cho đủ, và đó
là hiện trạng đã đo: `WO-084` cho thấy output dài ra tới mức vỡ trần token một
phần vì phải lấp cho đủ khung.
