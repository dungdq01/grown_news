# M15_kenh — spec

> **Vùng BIÊN. Mỏng có chủ ý.** Gọi **RA** kênh lấy tin nhắn; dịch lệnh → API của
> LÕI; dịch phản hồi → tin nhắn.
> Nguồn: `spec_overview.md#M15_kenh` · `research_summary.md` §3.2, §10-6 ·
> `FR-045` · `BRD B-B4, B-E1 bậc 1–2, B-E4`.
>
> ⚠️ **Mọi `cmd` dưới đây trỏ vào lệnh CHƯA TỒN TẠI** — `kenh/` chỉ có README.

## 1 · Ranh giới quan trọng nhất của cả phần tích hợp

> Kênh nhận tin bằng cách **GỌI RA** là *một tiến trình local*: không VPS, không
> tunnel, không đụng `M08-R1`.
> Kênh đòi **NGHE VÀO** là *một dự án hạ tầng*.

Đó là toàn bộ lý do thứ tự kênh là **Telegram → Discord → Zalo → FB**, không phải
theo số người dùng.

| kênh | nhận tin bằng | hạng |
|---|---|---|
| **Telegram** | long polling — **gọi RA** | tiến trình local |
| **Discord** | gateway WebSocket — **gọi RA** | tiến trình local |
| Zalo | Bot API `bot.zapps.me`, long-polling — **gọi RA** | ✅ nhưng **hoãn** (chỉ đạo) |
| Facebook | webhook — **nghe VÀO** | dự án hạ tầng (`B-E4`) |

`research_summary` §10-6: **R-g đã đóng bằng nguồn chính thức** — Discord gateway
là WebSocket **gọi RA**, không mở cổng, không webhook. Bot private < **10.000
user**: bật toggle `MESSAGE_CONTENT`, không cần review (ngưỡng là **10.000 user**,
**không** phải 100 server — mọi ghi chú cũ nói 100 server đều sai).

> **AC-1.1** · `kenh/` **không bind một cổng nào**. `netstat` trong lúc tiến trình
> chạy ⇒ 0 cổng listen thuộc nó.
> `hard` · `cmd: python kenh/tests/check_khong_nghe_gi.py`

> **AC-1.2** · `dich-vu.json` khai `kenh` với `cong: null` và
> `nghe_ngoai: false`; đổi một trong hai ⇒ đỏ.
> `hard` · `cmd: python kenh/tests/check_khong_nghe_gi.py`

> **AC-1.3** · Adapter chỉ được thêm cho kênh có **bề mặt chính thức** — API có
> version, có tài liệu, có thông báo thay đổi. Thêm một adapter dựa vào scraping ⇒
> đỏ.
> `hard` · `cmd: python kenh/tests/check_be_mat_chinh_thuc.py`

## 2 · Ba việc, và chỉ ba

1. **xác thực người gửi** — tra `dinh_danh_kenh`
2. **dịch lệnh → lời gọi API** của LÕI
3. **dịch phản hồi → tin nhắn**

Không logic nghiệp vụ. Không đọc `kb/`. Không quyết định gì về nội dung.

> **AC-2.1** · `kenh/` **không** đọc `kb/**` và **không** mở `kb/_kho.sqlite`.
> `hard` · `cmd: python kenh/tests/check_khong_doc_kho.py`

> **AC-2.2** · Mỗi lệnh kênh ánh xạ tới **đúng một** endpoint của LÕI, khai trong
> một **bảng khai** `kenh/assets/lenh.json`. Xử lý một lệnh bằng `if` trong mã ⇒ đỏ.
> `hard` · `cmd: python kenh/tests/check_bang_khai_lenh.py`

> **AC-2.3** · Trần kích thước mỗi adapter: **≤ 300 dòng**. Vượt ⇒ đỏ — dấu hiệu
> logic nghiệp vụ đã rò vào BIÊN.
> `hard` · `cmd: python kenh/tests/check_tran_kich_thuoc.py`

> **AC-2.4** · Kênh thứ hai (Discord) tốn **≤ 20%** công kênh thứ nhất (**M8.2**).
> **Phép đo khai tường minh, không để suy**:
> · **tử số** = số dòng `kenh/adapter/discord*`
> · **mẫu số** = tổng dòng `kenh/**` **tại thời điểm chỉ có Telegram** — một số đã
>   ĐÔNG CỨNG, ghi vào bảng khai lúc đóng kênh thứ nhất
> · cổng in **CẢ HAI số**, không chỉ tỉ lệ
> · chỉ có **một** kênh ⇒ cổng **bỏ qua**, không đỏ oan
> `hard` · `cmd: python kenh/tests/check_m8_2.py`

⚠️ **Phép đo viết ra vì phép thử s6.** Bản đầu nói *"số dòng tổng của kênh thứ
nhất"* mà không nói **tổng gồm gì**. Gồm cả hạ tầng dùng chung (xác thực · dịch
lệnh · egress) ⇒ mẫu số phình, tỉ lệ **luôn đạt**, cổng **không đỏ được**. Chỉ tính
adapter ⇒ mẫu số nhỏ, một Discord bình thường **cũng vượt**, cổng **đỏ oan**.
Đông cứng mẫu số tại thời điểm một-kênh là cách duy nhất số này còn nghĩa sau khi
kênh thứ ba xuất hiện.

⚠️ **`AC-2.4` là phép đo KIẾN TRÚC, không phải phép đo năng suất.** Trượt nó gần
như chắc chắn nghĩa là chatbot đã mọc vào `web/` (`build_order` C9 → CX), và chỗ
sửa là **tách M14 khỏi web**, không phải viết adapter gọn hơn.

## 3 · Xác thực người gửi — bảng, không phải danh sách phẳng

`FR-045` thay allowlist phẳng của `B-B4` bằng bảng **`dinh_danh_kenh`**
`(kenh, chat_id, nguoi_dung_id, buoc_luc)`.

Khác biệt không phải hình thức: allowlist phẳng trả lời *"ai được nói với bot"*;
bảng trả lời *"tin nhắn này là của TÀI KHOẢN nào"* — và đó là thứ `FR-045` cần để
mỗi người một session.

> **AC-3.1** · `kenh/` **hỏi LÕI** *"chat_id này thuộc tài khoản nào"*, **không**
> tự giữ danh sách. Một allowlist trong `kenh/` ⇒ đỏ.
> `hard` · `cmd: python kenh/tests/check_khong_tu_giu_allowlist.py`

> **AC-3.2** · `chat_id` chưa buộc tài khoản ⇒ **từ chối, và nói ra** (không im
> lặng bỏ tin). Thông báo không tiết lộ gì về kho.
> `hard` · `cmd: python kenh/tests/check_chua_buoc_thi_tu_choi.py`

> **AC-3.3** · **Mọi** tin nhắn vào đều ghi `audit_log` kèm `chat_id`
> (`FR-045` U4), kể cả tin bị từ chối.
> `hard` · `cmd: python kenh/tests/check_audit_moi_tin.py`

## 4 · Nạp nội dung từ kênh — bot phải kén, và nói ra khi từ chối

Chỉ đạo lượt 12: *"cần thiết kế bot để nhận đúng định dạng → sai / validate fail
trả respond ngoại lệ - báo lỗi"*.

Chỉ đạo lượt 13: `category` và `concepts` là **hai trường duy nhất bot không suy
được** ⇒ **bỏ require** hai trường đó ở đường API. Đo được: chúng **không** nằm
trong `required` của schema, nên **không cần FR**.

> **AC-4.1** · Nội dung sai định dạng ⇒ trả **nguyên văn lỗi validate** cho người
> gửi, không trả một câu chung chung.
> `hard` · `cmd: python kenh/tests/check_bao_loi_nguyen_van.py`

> **AC-4.2** · Mọi thứ nạp qua kênh dừng ở **`draft`** (`M05-R1`); kênh **không**
> có đường nào đặt `approved`.
> `hard` · `cmd: python kenh/tests/check_nap_dung_o_draft.py`

> **AC-4.3** · Bot **không** tự bịa `category`/`concepts`; hai trường đó để trống
> và người gán sau.
> `hard` · `cmd: python kenh/tests/check_khong_bia_nhan.py`

## 5 · Giới hạn kênh — số thật, và chúng quyết định đường đi của file

`research_summary` §10-6:

| | Telegram | Discord |
|---|---|---|
| gửi file | **50 MB** | **10 MiB** (mặc định) |
| update giữ khi bot offline | **24h** | — |
| mở kênh | `/newbot`, không duyệt, 0 phí | bot private < 10.000 user, toggle `MESSAGE_CONTENT` |

⇒ **PDF và audio đi đường Telegram.** Không phải vì Telegram tốt hơn, mà vì
10 MiB không đủ cho một PDF kỹ thuật hay một file giọng đọc.

> **AC-5.1** · Trần kích thước file **đọc từ bảng khai** theo kênh, không gõ tay;
> vượt trần ⇒ nói ra trước khi gửi, không để kênh trả lỗi.
> `hard` · `cmd: python kenh/tests/check_tran_file_theo_kenh.py`

> **AC-5.2** · Bot dậy lại ⇒ ghi log **khoảng thời gian đã offline**; nếu khoảng đó
> **> 24h** thì nói thêm rằng update trong khoảng đó **CÓ THỂ** đã mất. Offline
> < 24h ⇒ **không** ghi dòng cảnh báo đó.
> `hard` · `cmd: python kenh/tests/check_mat_tin_24h.py`

⚠️ **Không khai "ghi SỐ TIN đã mất" — vì số đó không tồn tại.** Telegram giữ update
24h, và API **không** nói *"bạn đã mất N tin"*. Bản đầu của AC này khai *"tin nhắn
MẤT, và điều đó được ghi log"*, đọc được thành phải đếm được số tin — viết testcase
cho nó buộc tôi bịa ra một phép đếm không có nguồn. Thứ **biết được** là khoảng
thời gian offline, và nó đã đủ để người vận hành hành động.

## 6 · Egress bậc 1–2 — khác M12/M14 ở chất

`FR-043`: M15 gửi RA **bậc 1–2** (metadata + nội dung bài **đã duyệt**), không phải
bậc 4 (tài liệu nguyên liệu). Nhưng nó vẫn là egress.

> **AC-6.1** · M15 **chỉ** gửi ra kênh nội dung đã `approved`, hoặc thông báo hệ
> thống. Gửi một bản `draft` ra kênh ⇒ đỏ.
> `hard` · `cmd: python kenh/tests/check_chi_gui_approved.py`

> **AC-6.2** · Đích gửi RA (host của kênh) khai trong bảng; gọi host không khai ⇒
> chặn trước khi mở socket.
> `hard` · `cmd: python kenh/tests/check_dich_trong_bang.py`

## 7 · Cái CỐ Ý không có

| | vì sao |
|---|---|
| webhook / cổng vào | §1 — đổi hạng từ tiến trình local sang dự án hạ tầng |
| Zalo, Facebook | Zalo **hoãn** (chỉ đạo lượt 14); FB đòi webhook + app review |
| crawler / scraper | *"crawler là cỗ máy hỏng-im-lặng theo thiết kế"*, chỏi lý do dự án tồn tại (`research_summary` §3.3) |
| kéo bài từ Facebook | **tính năng không tồn tại**: Groups API gỡ 22/04/2024; scraper lớn nhất tự nhận không đáng tin |
| đọc `kb/` | `AC-2.1` — BIÊN không chạm kho |
| logic nghiệp vụ | ba việc và chỉ ba (§2) |
| giao diện | `Z7` |
