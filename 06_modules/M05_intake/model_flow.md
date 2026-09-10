# M05_intake — model flow

## Entity vào / ra

| Chiều | Entity | Chủ | Quyền M05 |
|---|---|---|---|
| Ra | `Analysis` | M02_kb | **ghi** — chỉ `draft` + `origin: external` |
| Vào | `Concept` | M02_kb | chỉ đọc |

M05 không sở hữu entity nào — nó ghi vào entity của M02. Đây là lý do
`boundaries.kb_writers = [M01_core, M05_intake]`.

## Gọi module khác qua contract nào

| Gọi | Qua | Ghi chú |
|---|---|---|
| M01_core | **import** `validate.check()` và `count_words()` | ngoại lệ có chủ ý |
| M02_kb | ghi file `.md` | |

### Vì sao được import M01, khác các module khác

Sáu module còn lại nối nhau bằng **file**, không import. M05 là ngoại lệ:

- Nếu **copy** logic kiểm ⇒ hai bản lệch nhau, lệch im lặng (M05-R3)
- Nếu gọi qua **subprocess** ⇒ được, nhưng mất danh sách lỗi có cấu trúc
- **Import** ⇒ một nguồn luật duy nhất

Đánh đổi: M05 phụ thuộc M01. Chấp nhận được vì cả hai cùng chạy Python, cùng một
repo, và cùng chết nếu `validate.py` hỏng.

**Không** áp dụng cho M03/M06/M07 — chúng đọc dữ liệu, không kiểm luật.

## Cần trường mới thì làm gì

FR tới M02. M05 hiện **không cần** trường nào mới: `origin`, `conformance`,
`ingested_at`, `citations_sampled`, `citations_verified` đều đã có trong schema.

Schema được thiết kế sẵn cho đường này từ s3 — chỉ chưa có module nào gọi nó.
