# FR-029 — Quy ước chữ giao diện: màn hình nói việc, không nói kiến trúc

mở_bởi: người dùng, 2026-08-25 (*"truy tìm tất cả comment hay text guide trên web để xóa đi, thiếu chuyên nghiệp quá"* — kèm 4 ảnh chụp màn hình; sau đó: *"tìm được thì xóa đi, hoặc để text nhưng naming convention vào"*)
tới: FR-027f (5 dải "máy đã làm gì") · FR-027j (chuyển câu vào `title=`) · shell.html + emitter
mức: bỏ một quyết định trình bày vừa ký; KHÔNG đụng luật, không đụng đường ghi, không đụng dữ liệu.
trạng_thái: **DUYỆT** 2026-08-25 — người dùng chốt phạm vi qua AskUserQuestion: *"Cả hai nhóm — sạch hết"* và *"Xóa hết"* (ba đoạn đầu tab Nạp nguồn).

## Vấn đề

Bốn ảnh người dùng gửi:

| Trên màn | Vấn đề |
|---|---|
| `03 bản ghi trong kb/` | đường dẫn thư mục trong một ô đếm |
| *"skill `source-distiller` chạy 6 pass… đặt bài vào `kb/<loại>/<slug>.md` ở draft"* | tên công cụ nội bộ + đếm bước + đường dẫn |
| *"Server tự áp `origin: manual` và `review_status: draft`… qua đủ 9 cổng validate"* | tên trường dữ liệu + đếm cổng |
| `sẽ ghi vào kb/article/<slug>.md` | đường dẫn |

Bốn chỗ đó là **triệu chứng**. Bệnh: repo này viết tài liệu rất tốt cho người sửa
code, rồi để văn tài liệu tràn ra màn hình người dùng. Mỗi câu đều **đúng từng
chữ** và **vô dụng với người đọc báo**.

Sửa tay một lượt thì lần sau lại có câu mới — nên quy ước phải thành **cổng**,
không phải lời dặn.

## Quy ước

Chữ **hiện ra** trên trang không được chứa:

- đường dẫn trong kho — `kb/…`, `_inbox/`, `_recycle/`
- tên file nội bộ — `validate.py`, `frontmatter.schema.json`, `*.yaml`
- mã module / rule / FR — `M02-R3`, `B-B1`, `FR-011`, `05_intake`
- tên trường dữ liệu — `review_status`, `insight_new`, `origin:`…
- tên công cụ nội bộ — `source-distiller`, `gate.py`
- đếm bước kỹ thuật — "6 pass", "9 cổng"

**Ba miễn trừ, mỗi cái có lý do:**

1. `title=` / `aria-label` — FR-027j đã chốt phép này cho chú thích **ngắn**.
   Nhưng nó không phải chỗ giấu cả đoạn: cổng canh tooltip ≤ 220 ký tự.
2. `.np-cmd` — lệnh để **copy**. Đó là cơ chế của tính năng, không phải chú
   thích; xoá đi là gãy luồng "dán link". Cổng canh chiều ngược lại: các khối
   lệnh phải CÒN.
3. comment HTML/JS — viết cho người sửa file, trình duyệt không hiện.

## Cái gì mất, và vì sao chịu được

FR-027f dựng 5 dải với lập luận: *"mọi con số trên năm màn đều do MÁY tính mà
không màn nào nói ra điều đó, nên con số đọc ra như nhãn tuỳ ý."* Lập luận đó
không sai — nhưng câu trả lời của nó (giải thích kiến trúc ngay trên màn) đắt
hơn vấn đề. Người đọc báo không cần biết `priority` do công thức M06 tính.

Câu duy nhất **thật sự** quan trọng — *"máy không được điền hộ ba trường M1"* —
**không mất**, nó chuyển sang chỗ có răng hơn: phiếu duyệt phải hỏi đủ ba ô và
không tick sẵn ô nào. Đó mới là B-B1; một câu chữ trên màn chỉ là lời hứa.

## Phạm vi

### Xoá hẳn

- 3 đoạn `.np-lead` đầu ba tab Nạp nguồn
- `.f-duong` (`sẽ ghi vào kb/article/<slug>.md`) + hàm `veDuongGhi` mồ côi theo
- câu văn của cả 5 dải (`daiMay` không còn nhận tham số câu)

### Viết lại bằng chữ người dùng hiểu

5 khối `.note`, 5 dải `.api-thieu`, phụ đề 3 tab, 3 tooltip vạch tự động,
ô đếm `bản ghi trong kb/` → `bản ghi`, dải cảnh báo file hỏng, và 6 chuỗi
trong FE (thùng rác, xoá nhãn, nhật ký, khôi phục trùng tên…).

### KHÔNG đụng

- Đường ghi, API, dữ liệu, luật — 0 dòng.
- Hai khối lệnh copy ở màn Nạp nguồn (miễn trừ 2).
- Comment trong mã nguồn — chúng là thứ làm repo này đọc được.

## AC

- **AC-1** (hard) Không trang đã build nào chứa mẫu bị cấm trong chữ hiện ra.
  `cmd: node web/test/chu-giao-dien.test.js`
- **AC-2** (hard) `daiMay` chỉ nhận mảng nhãn+số; không lời gọi nào truyền chuỗi.
  `cmd: node web/test/cac-man-con-lai.test.js`
- **AC-3** (hard) Không tooltip nào quá 220 ký tự — miễn trừ `title=` không
  biến thành chỗ giấu bài văn.
  `cmd: node web/test/chu-giao-dien.test.js`
- **AC-4** (hard) Khối lệnh copy ở màn Nạp nguồn còn nguyên — dọn nhầm là gãy
  luồng.
  `cmd: node web/test/chu-giao-dien.test.js`
- **AC-5** (hard) Phiếu duyệt hỏi đủ 3 trường M1 và không tick sẵn ô nào.
  `cmd: node web/test/cac-man-con-lai.test.js`

## Nợ đã khai

Mục 2 của cổng (soi mã FE) là **heuristic**: chỉ xét dòng có dấu tiếng Việt
hoặc thẻ HTML **và** có nháy. Một câu thuần ASCII không dấu sẽ lọt. Chấp nhận,
vì hướng chặt hơn — tách chuỗi khỏi bundle bằng regex — đã thử và SAI (không
lex nổi JS bằng regex), và một phép kiểm báo động giả thì sẽ bị tắt. Lưới chính
vẫn là mục 1: quét **trang đã build**, nơi mọi thứ đã thành chữ thật.
