# M15_kenh — data flow

> ⚠️ Quy ước viết: tên **bảng / file / cột** luôn có một từ chỉ loại đứng trước —
> `check_ba` đọc dòng bảng mở đầu bằng một tên lowercase trong backtick như **một
> trường frontmatter** (M12 đã vấp, `WL-01K9W3S6M12`).

## 1 · Vào / ra

| | tên | sở hữu | M15 được làm gì |
|---|---|---|---|
| **vào** | tin nhắn từ kênh | nhà cung cấp kênh | nhận trên **kết nối M15 tự mở** |
| **vào** | bảng `dinh_danh_kenh` | **LÕI** (`FR-045`) | **hỏi qua API**, không đọc bảng |
| **vào** | file `kenh/assets/lenh.json` | **M15** | sở hữu; ánh xạ lệnh → endpoint |
| **vào** | file `kenh/assets/kenh.json` | **M15** | sở hữu; host · trần file · nguồn tài liệu + ngày tra |
| **ra** | lời gọi `127.0.0.1:8787` | M08_api | dịch lệnh thành API |
| **ra** | tin nhắn về người gửi | — | dịch phản hồi |
| **ra** | bản ghi `audit_log` | **LÕI** | ghi **qua API**; mọi tin vào, kể cả tin bị từ chối |

**M15 không sở hữu một entity nào**, và **không giữ trạng thái người dùng**. Nó sở
hữu đúng hai bảng khai của chính nó.

## 2 · Cái M15 KHÔNG chạm

| | vì sao |
|---|---|
| thư mục `kb/**` (cả đọc) | `M15-R2` · `Z4` — BIÊN nhận untrusted input; đọc là bước đầu của rò rỉ |
| file `kb/_kho.sqlite` | cùng lý do |
| bảng `dinh_danh_kenh` (đọc trực tiếp) | `M15-R3` — hỏi LÕI; bản thứ hai nghĩa là thu hồi quyền ở LÕI mà kênh vẫn cho vào |
| bảng `phien` | session ở LÕI (`FR-045` U6), giống M14 |
| nội dung chưa `approved` | `M15-R5` — gửi rồi không hoàn tác được |

## 3 · Giới hạn kênh là DỮ LIỆU, không phải hằng trong mã

| thuộc tính | Telegram | Discord | ở đâu |
|---|---|---|---|
| trần gửi file | **50 MB** | **10 MiB** | bảng khai `kenh.json` |
| update giữ khi bot offline | **24h** | — | bảng khai |
| cách nhận tin | long polling | gateway WebSocket | bảng khai |
| điều kiện mở | `/newbot`, không duyệt | private < **10.000 user** + toggle `MESSAGE_CONTENT` | bảng khai + ghi chú |

⇒ **PDF và audio đi đường Telegram** — không vì Telegram tốt hơn, mà vì 10 MiB không
đủ cho một PDF kỹ thuật hay một file giọng đọc.

⚠️ Ngưỡng Discord là **10.000 USER**, **không** phải 100 server. Mọi ghi chú cũ nói
"100 server" đều sai (`research_summary` §10-6). Bảng khai phải ghi **nguồn + ngày
tra**, vì đây đúng loại số nhà cung cấp đổi mà không ai thông báo.

## 4 · Ba đường dữ liệu, ba mức tin

| đường | nội dung | mức tin |
|---|---|---|
| kênh → M15 | tin nhắn người dùng | **untrusted** — đây là lý do M15 ở BIÊN |
| M15 → LÕI | lời gọi API đã dịch | tin **cấu trúc**, không tin nội dung |
| LÕI → M15 → kênh | nội dung đã `approved` | đã qua duyệt của người |

**Mức tin không đổi khi dữ liệu đi qua M15.** M15 dịch **hình dạng**, không nâng
mức tin. Một tin nhắn thành một lời gọi API vẫn là nội dung untrusted — và đó là lý
do `gate.py` ép `draft` vô điều kiện ở đầu bên kia.

## 5 · Egress bậc 1–2 — khác M12/M14 ở chất

`FR-043`: M15 gửi RA **bậc 1–2** (metadata + nội dung **đã duyệt**), không phải bậc
4 (tài liệu nguyên liệu). Nhưng nó vẫn là egress, và đích phải khai trong bảng.

Khác biệt thực tế: bậc 4 của M12 gửi **thứ chưa ai đọc**; bậc 1–2 của M15 gửi **thứ
người đã duyệt**. Cùng là dữ liệu rời máy, khác nhau ở việc có người chịu trách
nhiệm hay chưa.

## 6 · Nợ hợp đồng

| nợ | trạng thái |
|---|---|
| **`POST /api/nhap` chưa tồn tại** | M15 cần một cửa ghi cho máy. Hiện `POST /api/articles` (`taoBai`) đặt `approved` **vô điều kiện** — M15 dùng nó là vi phạm `M05-R1`. Cần **FR tới M08** |
| **API "chat_id này thuộc tài khoản nào" chưa có** | `FR-045` khai **bảng** `dinh_danh_kenh` nhưng chưa khai **endpoint**. Cần chốt trước khi M15 hỏi |
| **`audit_log` qua API chưa có đường** | `FR-045` U4 đòi ghi mọi tin; M15 không được ghi bảng trực tiếp ⇒ cần endpoint |
| **rate-limit cho `ma_moi`** | lỗ đã ghi ở `security_baseline §8.1`; chạm M15 vì buộc `chat_id ↔ account` đi qua đây |

**Bốn nợ này đều là hợp đồng với module khác, không phải việc của M15.** Ghi ra để
s7 không chia task M15 vào chỗ chưa có cửa — nó sẽ đi vòng bằng `POST /api/articles`
và làm mất `M05-R1` một cách trông-như-hợp-lệ.
