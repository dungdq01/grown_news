# M09_thuvien — model flow

## Bất biến của module

| Bất biến | Bề mặt |
|---|---|
Byte chỉ vào DB qua `luuHienVat` trong `dungchung.mjs`; không handler nào tự ghi | S3 · `api-guard` răng 1 (`GHI` regex chặn `fs` write ở mọi `web/api/*.mjs` trừ `dungchung`) |
`sha256`/`so_byte` do máy tính, không nhận từ client | S3 · **M09-R2** |
Tập tham chiếu mồ côi = union **ba** bảng | S3 · **M09-R1** |
`src` iframe từ whitelist host + regex id, không từ frontmatter | S3 · **M09-R3** |
Trần JSON 1 MB không đổi; media có trần riêng | S3 · **M09-R5** |
Bản ghi thư viện không đếm vào thước đo chất lượng | S3 · **M09-R4** |

## Vòng đời một bản ghi thư viện

Dùng **nguyên** vòng đời của bản phân tích — không có trạng thái mới:

```
POST /api/articles ──▶ approved      qua taoBai, KHÔNG viết literal thứ hai
      │
      ├─ PUT ──▶ approved            sửa không đổi trạng thái (FR-033)
      ├─ PATCH /status ──▶ rejected  cần reject_reason ≥5 ký tự
      └─ DELETE ──▶ recycle          INSERT recycle + DELETE articles, một txn
                        └─ POST /restore ──▶ articles, version về 1
```

**`taoBai` là ngoại lệ được khai tên** cho literal `review_status: "approved"`.
`api-guard` răng 5 đếm số literal đó trong **mọi** `web/api/*.mjs` và đòi nó **bằng**
số trong `articles.mjs`. Viết một `tailieu.mjs` có literal riêng ⇒ `npm test` chết ở
chỗ trông như không liên quan.

## Chỗ mô hình này CÓ THỂ sai, và dấu hiệu sẽ thấy

| Nếu | Dấu hiệu | Đường ra |
|---|---|---|
người dùng muốn nạp PDF mà **không** viết `one_liner` | form bắt buộc một trường họ không có gì để điền | nới `one_liner` thành tuỳ chọn cho `thu-vien` — nhưng nó là phụ đề của thẻ, bỏ là thẻ trống |
thư viện lớn hơn phân tích nhiều lần | mọi lưới và biểu đồ do tài liệu chiếm | thêm trục lọc `ho_so` ở sidebar (chưa làm ở v1) |
cần video >25 MB | 413 | **đăng ký URL**, không nới trần — xem nợ ở `spec.md §4` |
cần xem trước ppt/word | thẻ + tải về không đủ dùng | `soffice` + `la_dan_xuat = 1` (cột đã khai sẵn ở v1) |
hai bản ghi dùng chung một file rồi một bản bị xoá | nếu luật mồ côi sai, byte mất và bản còn lại trỏ hụt | **M09-R1** — đây đúng ca `INSERT OR IGNORE` sinh ra để phục vụ |

## Quan hệ với module khác

| Module | Quan hệ |
|---|---|
**M01_core** | sở hữu `validate.py`; M09 chỉ **thêm một nhánh hồ sơ**, không sửa cổng của hồ sơ `phan-tich` |
**M02_kb** | sở hữu DDL + export/import; bảng `media` và luật mồ côi sống ở đó, M09 khai yêu cầu |
**M08_api** | sở hữu cửa ghi; `luuHienVat`/`docHienVat` nằm trong `dungchung.mjs` của M08 |
**M03_web** | sở hữu render; tab nạp thứ tư và màn xem trước nằm trong `web/` của M03 |
**M05_intake** | `_inbox/` **không** nhận hiện vật ở v1 — cửa đó chỉ `.md`, và mở nó cho binary là mở lại năm lớp hardening |

Vì M09 không sở hữu file nào của bốn module trên, mọi đơn vị việc của nó **phải khai
`phạm_vi_ghi` theo boundary của module chủ** — `check_g6b` kiểm điều đó, và nó đã bắt
đúng lỗi này một lần ở FR-036/A4 (một task M03_web định ghi `core/assets/**`).
