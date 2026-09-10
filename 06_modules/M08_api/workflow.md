# M08_api — workflow

**Dùng trình tự chuẩn** (PHÂN TÍCH → PLAN → MÔ PHỎNG → CODE) — vì mỗi đơn vị việc
là *một endpoint*, *một luật của cửa ghi*, hoặc *một đầu đề*, và cả ba viết được
thành đỏ trước.

Bốn chỗ áp riêng — **không** phải bước mới:

**① PHÂN TÍCH — spec gọi bảng `articles`, bảng đó KHÔNG CÒN.** Bảng thật:
`bai_viet` · `tai_lieu` · `video` (+ VIEW `ban_ghi`, `tham_chieu_media`). Và
`dungchung.mjs` còn 6 chỗ nhắc `articles` — **cả sáu trong chú thích**, nên mã
chạy đúng và **kể sai** (`testcases.md §cuối` mục 3).

**② PLAN — `phạm_vi_ghi` gần như luôn gồm `dungchung.mjs`, và đó là chủ ý.**
`api-guard` **răng 2** đòi mọi mutation ở **đúng một file**. Khi một đơn vị việc
cần SQL ở chỗ khác, đường đúng là **dời mã vào `dungchung.mjs`** — không nới
cổng. Đã xảy ra thật trong phiên này, và nó có **lợi phụ**: buộc chỗ nghẽn thành
**cấu trúc** thay vì kỷ luật.

**③ MÔ PHỎNG — server THẬT trên kho TẠM (`_api.mjs`), không mock.** Luật bằng
chứng của dự án nói thẳng: *"unit test pass KHÔNG tính — hệ thống chạy thật mới
tính"*. Đã có bài học đúng chỗ này: `loi-cua.test.js` đo `V1` bằng **regex trên
mã handler**, và regex đó xanh **kể cả khi route chưa đấu**.

**④ CODE — thứ tự luồng ghi là một phần của hợp đồng:**

```
compose .md
  → tmp NGOÀI repo  (kèm snapshot concepts.yaml + categories.yaml SELECT từ DB, CÙNG NHỊP)
  → validate.py --fix      (word_count là phép TÍNH)
  → validate.py --strict
  → đạt mới BEGIN IMMEDIATE … COMMIT
  → banXuat() export async
Trượt ⇒ 422 kèm NGUYÊN VĂN THIẾU/SAI/SỬA — cổng nói gì hiện đúng thế (FR-010)
```

Đảo bất kỳ hai bước là mở một đường ghi không cổng. Và snapshot danh mục phải
**cùng nhịp** với validate: lấy snapshot rồi validate muộn hơn là validate trên
một danh mục đã đổi.

## Ba chỗ cổng của module này KHÔNG với tới

```
05_intake/gate.py     đường ghi THỨ BA vào kho — ngoài web/api/ ⇒ api-guard KHÔNG thấy
đường ghép chuỗi      no-write-path là whitelist LITERAL ⇒ fetch(base+path) đi qua
chú thích             literal trong comment ⇒ ĐỎ OAN (trúng 6 lần trong một phiên)
```

⚠️ Hai chỗ đầu là **giới hạn có chủ ý** của cổng, và chúng phải được khai như
vậy. Một cổng khai *"mọi ghi đi qua đúng MỘT hàm"* mà chỉ quét `web/api/**` là
cổng **nói quá** phạm vi của mình.

## `M08-R1` đã lạc hậu về AN NINH — đọc kèm FR-047

`§4` viết *"không có auth — localhost LÀ lớp bảo vệ"*. Sau FR-047/049/051:

| lớp | trạng thái |
|---|---|
bind `127.0.0.1` | còn |
bảy cửa khoá dịch vụ (`C1`–`C7`) | **thêm** |
phân quyền hai vai (`chu` / `dong_nghiep`) | **thêm** |
rate-limit hai chiều (theo IP · theo mã) | **thêm** |
audit có `boi` | **thêm** |

⇒ `localhost` là **một** lớp, không còn là **lớp duy nhất**. Câu cũ trong artifact
frozen là câu người sau dùng để quyết *"chỗ này không cần kiểm quyền"*.

## Không thuộc module này

| Việc | Đi đâu |
|---|---|
| logic kiểm nội dung | **M01** — M08 `spawn` `validate.py`, **không** viết lại bằng JS (M05-R3) |
| hợp đồng schema / DDL | **M02** — đổi ⇒ FR |
| đường nạp `_inbox/` | **M05** (`gate.py`) — và `api-guard` **không** thấy nó |
| byte hiện vật · sáu đầu đề · trần 25 MB | **M09** — M08 giữ **cửa**, M09 giữ **luật của byte** |
| màn `/tai-lieu/` · `/video/` | **M10** · **M11** |
| lệnh dọn blob bỏ dở trong DB | ô backlog của **module này** — exporter reap **file**, không reap **dòng** |
| duyệt bài | **NGƯỜI** (B-B1) — endpoint chỉ phản ứng một request người bấm, và 3 trường M1 **không có default** |
