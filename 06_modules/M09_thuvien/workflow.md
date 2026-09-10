# M09_thuvien — workflow

**Dùng trình tự chuẩn** (PHÂN TÍCH → PLAN → MÔ PHỎNG → CODE) — vì mỗi đơn vị việc
là *một luật DDL*, *một cổng của đường nạp*, hoặc *một đầu đề trên đường phục vụ*,
và cả ba viết được thành đỏ trước.

Bốn chỗ áp riêng — **không** phải bước mới:

**① PHÂN TÍCH — `§1` của spec lập luận NGƯỢC với kiến trúc đang chạy.** Mục đó
bảo vệ *"MỘT bảng, không phải ba"* bằng số đo thật; FR-038 sau đó chốt **ba
bảng** và đã thi công. Đọc `kho.schema.sql` để biết cấu trúc, đọc `§1` để biết
**vì sao từng có** lựa chọn khác (`testcases.md §cuối` mục 1).

**③ MÔ PHỎNG — kho TẠM, luôn luôn, vì `banXuat()` tự chạy.** Export chạy **tự
động** sau mỗi lần ghi, và nó **reap** mọi file mà DB không có hàng tương ứng.
Một phép thử trên `kb/` thật với DB thiếu nhánh là mất byte **vĩnh viễn** — và
không cần ai gõ lệnh gì.

**③b Luật mồ côi phải gieo ĐỦ NĂM NHÁNH.** `bai_viet` · `tai_lieu` · `video` ·
`article_versions` · `recycle`. Gieo ba nhánh rồi xanh **không** chứng minh gì:
nhánh thiếu là nhánh mà một blob chỉ nó trỏ sẽ bị **reap**.

**④ CODE — byte đi TRƯỚC, bản ghi đi SAU.** `source_type: tai-lieu ⇒ required:
media` nghĩa là bản ghi **không thể tồn tại hợp pháp** trước blob của nó. Blob
chưa có bản ghi tham chiếu là hợp lệ đúng khoảng thời gian người dùng điền form;
bỏ form ⇒ lần `banXuat()` kế reap file. **Tự lành, không state machine, không
cron.**

## Ba hằng số là BA, không phải một

```
TRAN        = 1 MB     body JSON — chặn bù của MỌI lần ghi bài
TRAN_MEDIA  = 25 MB    riêng cho hiện vật
NGUONG.cot3D = 3       số cột khoi3D hiện được
```

`M09-R5` canh hai cái đầu là **hai hằng**. Nới `TRAN` để media qua là bỏ chặn bù
của mọi đường ghi khác — và đó là lý do nó phải là hai con số, không một.

⚠️ Con số thứ ba **không** có cổng: `khoi3D` chỉ hiện 3 cột, nên một `source_type`
thứ tám đẩy một loại ra khỏi biểu đồ **im lặng**. Spec dùng chính lý lẽ này để
quyết *"một `source_type` mới, không hai"* — tức nó là một **luật**, đang sống
bằng chữ.

## Sáu đầu đề: đủ SỐ LƯỢNG không phải đủ

```
content-type          từ ENUM ĐÓNG — không sniff tên file
nosniff
content-disposition   `inline` cho pdf · `attachment` cho ppt/doc   ← HAI giá trị
CSP                   default-src 'none'; sandbox
etag                  hợp pháp vĩnh viễn (địa chỉ theo nội dung)
cache-control         immutable
```

Một cài đặt trả `inline` cho **tất cả** vẫn có đủ "sáu đầu đề" và vẫn sai. Phép
thử phải đo **giá trị theo loại**, không đếm đầu đề.

## Không thuộc module này

| Việc | Đi đâu |
|---|---|
| màn `/tai-lieu/` · `/video/` | **M10** · **M11** — M09 là **hạ tầng**, không phải giao diện |
| `normalize_url()` | **M01** — M09 chỉ thêm ca TikTok |
| lệnh dọn blob bỏ dở trong DB | ô backlog **M08_api** — exporter reap **file**, không reap **dòng** (`§3` tự khai) |
| chuyển đổi ppt/word sang PDF | **nợ**, không phải v1 — `soffice --headless` thêm một binary vào `RUNNING.md` |
| đọc `[Content_Types].xml` để phân biệt pptx/docx | **quá tay cho v1** (`§3` tự khai) |
| ba bảng `bai_viet`/`tai_lieu`/`video` | **FR-038** — và `§1` của M09 lập luận ngược lại nó |
