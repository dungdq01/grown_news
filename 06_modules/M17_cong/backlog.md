# backlog — M17_cong (chết ở G6C)

> Nợ do một thay đổi **CỤ THỂ vừa gây ra**. Không phải TODO, không phải ý tưởng,
> và **không phải** *"thứ chưa xây"*.
> Ô `[ ]` trỏ artifact có thật; `[x]` phải kèm object (commit · PR · FR id).

## Trống — M17 chưa có mã, nên chưa có thay đổi nào gây nợ

M17 là module **phụ thuộc nhiều nhất và tự làm được ít nhất** trong sáu. Bảy thứ nó
đang chờ, và **sáu trong bảy nằm ngoài nó**:

| thứ đang chờ | sống ở đâu | vì sao KHÔNG phải backlog |
|---|---|---|
| `C3` tra `dinh_danh_kenh` | `FR-047` (**đã duyệt**) | hợp đồng với M08 |
| `C4` ghi `dinh_danh_kenh` | `FR-047` | cùng vậy |
| `C6` tra `phien` | `FR-047` | cùng vậy |
| `C7` tra + đánh dấu `ma_moi` | `FR-047` | cùng vậy |
| DDL bốn bảng `FR-045` | **DB riêng ở `web/`** (`ADR-06`) — **không** `kho.schema.sql` | **việc của s8** |
| **ngôn ngữ `cong/`** | `spec §0` · `env_plan` | **s4 quyết** — và nó kéo theo câu *"lộ ra Internet tới đâu"* |
| sáu lệnh `cong/tests/` | `rules.md` đầu file | việc của s8 |

## Hai nợ cần FR MỚI — chưa mở, và tôi không tự mở

**a · Rate limit + entropy + log thất bại — lỗ trong `FR-045` ĐÃ DUYỆT.**
`security_baseline §8.1` ghi lại: `ma_moi` một-lần + hết-hạn chặn *dùng lại* và
*dùng muộn*, **không** chặn **thử hàng nghìn lần trong cửa sổ còn hiệu lực**. Và hậu
quả không phải *"đăng nhập sai"* — **đoán được mã là THÀNH người khác trong kho**.

`AC-3.4` · `AC-3.5` · `AC-3.6` đã khai và **viết được testcase**, nhưng chúng là một
**lỗ an ninh trong một FR đã duyệt**, không phải một quyết định mới. `FR-047 §4` cố
ý **không gộp** chúng vào — gộp là giấu một lỗ an ninh trong một FR về hợp đồng.

⇒ Cần **một FR riêng**. Không mở ô `[ ]` ở đây vì việc mở FR là **quyền của chủ dự
án**, không phải một task; ghi ra để nó không rơi vào khe.

**b · Khoá service-to-service phải RIÊNG.**
`CVE-2025-41258` (LibreChat, CVSS 8.0, `I:H/A:H`): dùng **cùng một** JWT secret cho
session trình duyệt và cho dịch vụ nội bộ ⇒ token session hợp lệ **đi vòng toàn bộ
ACL một lúc**, gồm cả **GHI**.

Đã khai thành `FR-047 L3` (đã duyệt) — nên nó **có chỗ**, chỉ chưa thi công. Không
mở ô riêng.

## Phép thử s6 đã chạy — 17/17 AC viết được testcase

`testcases.md` §cuối: **16/17 viết được ngay**; một cái mơ hồ và **đã sửa hợp đồng**
cùng phiên 2026-09-02:

- `AC-3.4` — *"rate limit … ngưỡng đọc từ cấu hình"* đo bằng `grep một số gõ cứng`
  chỉ đúng với đường **tự viết**; với **Caddy/nginx** thì số trong cấu hình **chính
  là** cách nó hoạt động ⇒ cổng **đỏ oan**. Và `§0` khai ngôn ngữ **chưa chọn**, nên
  cổng phải đúng với **cả ba** đường.
  ⇒ nay đo **HÀNH VI**: bắn `N+1` request, đòi cái thứ `N+1` bị chặn; đổi ngưỡng rồi
  bắn lại ⇒ điểm chặn dời theo.

Không mở ô vì **đã đóng trong cùng lượt**.
