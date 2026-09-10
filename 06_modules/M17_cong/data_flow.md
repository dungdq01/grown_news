# M17_cong — data flow

> ⚠️ Quy ước viết: tên **bảng / file / cột** luôn có một từ chỉ loại đứng trước —
> `check_ba` đọc dòng bảng mở đầu bằng một tên lowercase trong backtick như **một
> trường frontmatter** (M12 đã vấp, `WL-01K9W3S6M12`).

## 1 · Vào / ra

| | tên | sở hữu | M17 được làm gì |
|---|---|---|---|
| **vào** | HTTPS request từ Internet | — | nhận trên **443**; dịch vụ **DUY NHẤT** được nghe ngoài |
| **vào** | bảng `phien` | **LÕI** (`FR-045`) | **hỏi qua API**, không đọc bảng |
| **vào** | bảng `ma_moi` | **LÕI** | hỏi + đánh dấu `dung_luc` **qua API** |
| **vào** | file `core/assets/dich-vu.json` | M01_core | chỉ đọc — số cổng, `nghe_ngoai` |
| **ra** | request đã xác thực → `127.0.0.1:8787` | M08_api | chuyển tiếp **nguyên vẹn** |
| **ra** | bản ghi bảng `audit_log` | **LÕI** | ghi **qua API**; mọi lần thử, kể cả thất bại |

**M17 không sở hữu một entity nào, và không sở hữu một file dữ liệu nào.** Nó là
module duy nhất trong 16 module **không có gì để mất** — và đó là thiết kế, không
phải thiếu sót.

## 2 · Bốn bảng của `FR-045` — ai sở hữu, M17 làm gì

| bảng (LÕI sở hữu tất cả) | cột chính | M17 |
|---|---|---|
| bảng `nguoi_dung` | `id`, `ten`, `vai`, `trang_thai`, `tao_luc` | không chạm; cột `vai` **chưa ai đọc** |
| bảng `ma_moi` | `ma`, `nguoi_dung_id`, `het_han`, `dung_luc` | hỏi + đánh dấu đã dùng, **qua API** |
| bảng `dinh_danh_kenh` | `kenh`, `chat_id`, `nguoi_dung_id`, `buoc_luc` | ghi khi buộc thành công, **qua API** |
| bảng `phien` | `id`, `nguoi_dung_id`, `kenh`, `ngu_canh`, `cap_nhat_luc` | hỏi để xác thực, **qua API** |

**M17 không đọc bảng nào trực tiếp** — `Z4` cấm BIÊN chạm dữ liệu. Mọi phép tra đi
qua API của LÕI.

⚠️ **Bốn bảng KHÔNG ở `kb/_kho.sqlite`** (`ADR-06`, 2026-09-02): `dung_lai_db.py`
**xoá** DB đó rồi dựng lại từ file, nên một bảng dữ liệu **gốc** nằm trong đó là
một bảng **bị xoá sạch** mỗi lần chạy lệnh — mất 5 tài khoản, mọi `chat_id` đã
buộc, mọi phiên. Chúng ở **DB riêng của LÕI trong `web/`**, theo luật *backend của
phần nào ở đâu thì `.db` nằm ở đó*.

⇒ **Nợ chặn**: `FR-045` khai **bốn bảng** nhưng **chưa khai một endpoint nào**. M17
không thi công được trước khi LÕI mở cửa tra `phien`/`ma_moi` và cửa ghi `audit_log`.

## 3 · Cái M17 KHÔNG chạm

| | vì sao |
|---|---|
| thư mục `kb/**` (cả đọc) | `M17-R2` · `Z4` — một lỗ ở tầng ngoài cùng không được thành lỗ ở tầng dữ liệu |
| file `kb/_kho.sqlite` | cùng lý do; hỏi qua API |
| khoá model trong env | `M17-R3` — prompt injection trên tiến trình **có** khoá là một hoá đơn |
| thân request khi chuyển tiếp | `AC-5.1` — chỉ thêm header danh tính |
| cột `review_status` từ payload | `M17-R6` · U7 — bị **lột** |

## 4 · Ba mức tin, và M17 là chỗ duy nhất mức tin ĐỔI

| chặng | mức tin |
|---|---|
| Internet → M17 | **untrusted** hoàn toàn |
| M17 → `web` (đã xác thực) | **danh tính** đáng tin; **nội dung** vẫn untrusted |
| trong LÕI | nội dung vẫn phải qua `gate.py` + người duyệt |

**M17 là module duy nhất nâng mức tin** — và nó chỉ nâng **một** vế: *"request này
là của tài khoản nào"*. Nó **không** nâng vế *"nội dung này đáng tin"*.

Ranh giới đó là lý do `gate.py:133` vẫn ép `draft` **vô điều kiện** kể cả cho request
đã xác thực. Một tài khoản thật vẫn có thể nạp rác.

## 5 · Nợ hợp đồng

| nợ | trạng thái |
|---|---|
| **endpoint tra `phien`** | `FR-045` khai bảng, **chưa khai endpoint** ⇒ FR tới M08 |
| **endpoint tra + đánh dấu `ma_moi`** | cùng vậy |
| **endpoint ghi `audit_log`** | U4/U5 đòi ghi; M17 không được ghi bảng trực tiếp |
| **rate limit + entropy + log-thất-bại** | ⚠️ **lỗ trong FR ĐÃ DUYỆT** (`security_baseline §8.1`) ⇒ cần **FR bổ sung** |
| **DDL bốn bảng** | ⚠️ **KHÔNG** vào `kho.schema.sql` (`ADR-06`, 2026-09-02) — `dung_lai_db.py` xoá DB đó rồi dựng lại từ file, nên bảng dữ liệu GỐC nằm trong đó là bảng bị xoá sạch. DB riêng của LÕI trong `web/` |
| **ngôn ngữ của `cong/`** | **chưa chọn** — Caddy · nginx · tự viết. s4 quyết, và nó kéo theo câu *"lộ ra Internet tới đâu"* |
| **cột `vai` chưa ai đọc** | "phân quyền" hôm nay là **một cột trống**; `M17-R6` là thứ duy nhất chặn một account thường |

⚠️ **Bảy nợ, và sáu trong bảy là hợp đồng với module khác.** M17 là module **phụ
thuộc nhiều nhất và tự làm được ít nhất** trong sáu module đợt hai. Ghi ra để s7
không xếp nó vào lịch trước khi LÕI mở cửa — nó sẽ đi vòng bằng cách đọc DB trực
tiếp, và đó là `Z4` chết trong khi mọi cổng vẫn xanh.
