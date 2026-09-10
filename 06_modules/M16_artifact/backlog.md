# backlog — M16_artifact (chết ở G6C)

> Nợ do một thay đổi **CỤ THỂ vừa gây ra**. Không phải TODO, không phải ý tưởng,
> và **không phải** *"thứ chưa xây"*.
> Ô `[ ]` trỏ artifact có thật; `[x]` phải kèm object (commit · PR · FR id).

## Trống — M16 chưa có mã, nên chưa có thay đổi nào gây nợ

Năm thứ M16 đang chờ **không** thuộc backlog:

| thứ đang chờ | sống ở đâu | vì sao KHÔNG phải backlog |
|---|---|---|
| engine chưa chốt | `spec §3` | `research_summary` §10 tự khai *"giữ mức phác"* — **trạng thái hợp lệ** |
| `khu_vuc` của từng nhà TTS chưa tra | `model_flow §6` | việc của s8, phải ghi **nguồn + ngày tra** |
| ngưỡng corpus 10 bản | `AC-6.1` (`soft`) | **người** chốt số |
| định dạng sidecar `timestamp → URL` | `model_flow §6` | chưa chốt hình dạng |
| năm lệnh `artifact/tests/` | `rules.md` đầu file | **việc của s8** |

## Một nợ nằm ở M09 — ô `[ ]` không đặt ở đây

**Bảng `media` không có cột trỏ về `slug`.** Đo 2026-09-02:

```bash
PRAGMA table_info(media)   # -> ['sha256', 'byte', 'la_dan_xuat']
```

Hệ quả: câu *"bài này đã có những artifact nào"* trả lời được **chỉ bằng cách mở
từng file và đọc metadata**, không bằng một truy vấn. Tức màn *"danh sách artifact
của một bài"* — thứ `ui_flow §1` khai — **chưa hiện được**.

Phép thử s6 bắt được chỗ này khi tôi viết testcase cho `AC-4.1`: ca tầng **file**
viết được, ca tầng **kho** thì không. AC đã tách hai tầng; tầng kho là **FR tới
M09** (chủ sở hữu bảng `media`), **không phải** việc M16 tự làm được.

⇒ Khi mở FR đó, ô `[ ]` đặt ở `06_modules/M09_thuvien/backlog.md`, không ở đây.
Đặt ở đây thì nó chặn G6A của M16 vì một quyết định của module khác.

## Phép thử s6 đã chạy — 16/16 AC viết được testcase

`testcases.md` §cuối: **14/16 viết được ngay**; hai cái mơ hồ và **đã sửa hợp đồng**
cùng phiên 2026-09-02. Cả hai là AC **đúng về ý** nhưng **thiếu một nửa phép đo**:

- `AC-4.1` — thiếu **tầng**: gộp tầng file và tầng kho vào một AC, mà tầng kho M16
  **không thể** làm một mình ⇒ nay tách rõ, tầng kho thành FR tới M09.
- `AC-2.2` — thiếu **đường phá thứ hai**: chỉ cấm *xoá*, nhưng **ghi đè** phá byte y
  hệt và **không có `unlink` nào để grep** ⇒ nay cấm cả hai, và phép đo là **trạng
  thái** trước/sau (mọi `sha256` cũ giữ nguyên, số file chỉ tăng), không phải một
  phép quét mã.

Không mở ô cho chúng vì **đã đóng trong cùng lượt**.
