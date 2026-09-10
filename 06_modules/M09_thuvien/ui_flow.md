# M09_thuvien — ui flow

## Màn liên quan

| Màn | Việc của M09 |
|---|---|
Nạp nguồn (`/nap/`) | **tab thứ tư** — chọn file HOẶC dán URL video |
Tất cả (`/tat-ca/`) | thẻ bản ghi thư viện nằm chung lưới, lọc chung sidebar |
cửa sổ đọc | **màn xem trước** thay chỗ thân bài |
Kho (`/kho/`) | số đếm gộp; thước đo chất lượng **không** gộp (M09-R4) |
Danh mục (`/khai-niem/`) | không việc gì — VIEW `nhan` đếm nhãn không phân biệt hồ sơ |

## Tab thứ tư — nạp thư viện

```
┌─ Nạp nguồn ─────────────────────────────────────────────────┐
│ [dán URL] [nộp .md] [viết form] [THƯ VIỆN]                  │
│                                                              │
│  Nguồn *      ┃ (•) Tải file lên    ( ) URL video           │
│               ┃ [ Chọn file… ]  bao-cao-q3.pdf · 4,8 MB     │
│               ┃ ⓘ pdf · pptx · docx · ppt · doc, tối đa 25 MB│
│  ──────────────────────────────────────────────────────────  │
│  Tiêu đề *    ┃ [ … ]                     hiện trên thẻ      │
│  Một câu *    ┃ [ … ]  0/160              phụ đề của thẻ     │
│  Chủ đề       ┃ ☐ … ☑ …                   cùng danh mục      │
│  Khái niệm    ┃ ☐ … ☑ …                   với bản phân tích  │
│                                                              │
│  [ GHI VÀO KHO ]  [ ĐÓNG ]                                  │
└──────────────────────────────────────────────────────────────┘
```

**KHÔNG có 8 ô thân bài** — hồ sơ `thu-vien` không đòi. Đây là điểm khác duy nhất về
hình so với tab "viết form", và nó phải nhìn ra ngay: một tab đòi 8 ô, một tab đòi 0 ô.

**Ba state** (luật trạm `m-fe`):

| State | Hình |
|---|---|
rỗng | chưa chọn gì ⇒ nút Ghi **disabled**; dòng nhắc *"chọn một file hoặc dán một URL"* |
đang tải | thanh tiến độ theo `content-length` — biết trước, khác POST JSON; nút Ghi `disabled` + `aria-busy` |
lỗi | 413 ⇒ *"file X MB, trần 25 MB"* · magic-byte lệch ⇒ *"file không phải &lt;mime&gt; như phần mở rộng nói"* · mạng đứt ⇒ nguyên văn vào `#f-kq` (đã có `aria-live` từ FR-036) |

## Cửa sổ đọc — ba hình dạng theo mime

```
PDF                          VIDEO                        PPT · WORD
┌────────────────────┐      ┌────────────────────┐      ┌─────────────────────┐
│ ┌────────────────┐ │      │  ▓▓▓ poster ▓▓▓    │      │  ┌───┐              │
│ │   <iframe>     │ │      │       ( ▶ )        │      │  │PPT│ bao-cao.pptx  │
│ │  viewer của    │ │      │                    │      │  └───┘ 4,8 MB       │
│ │  trình duyệt   │ │      │ ⓘ bấm để nạp từ    │      │                     │
│ └────────────────┘ │      │   youtube-nocookie │      │ <một câu one_liner> │
│ [tab mới][tải về]  │      │   — chưa request gì│      │ ☑nhãn ☑nhãn         │
└────────────────────┘      └────────────────────┘      │ [ TẢI VỀ ]          │
                                                         └─────────────────────┘
0 thư viện                   0 request trước khi bấm      KHÔNG khung trắng
```

Cột neo bên trái (`.bk-toc`) **không có mục lục** — bản ghi thư viện không có mục. Thay
bằng metadata: loại · kích cỡ · ngày · nhãn.

## Quyết định hình đã cân và LOẠI

Ghi lại để không ai bàn lại trong ba tháng:

| Đường | Vì sao loại |
|---|---|
Office / Google viewer cho ppt/word | đòi file **công khai trên internet**; máy bind 127.0.0.1 và tài liệu là nội bộ. Thoả điều kiện đó = tải tài liệu của người dùng lên bên thứ ba |
`mammoth.js` render `.docx` | lossy, và **không có bản cho `.pptx`** — nửa vấn đề, một dep mới |
`soffice --headless` ở v1 | thêm một binary ngoài vào `RUNNING.md` ⇒ **nợ**, và cột `la_dan_xuat` đã khai sẵn chỗ cho nó |
pdf.js vendor sẵn | ~350 KB, dep runtime **đầu tiên** trong `web/`, và `page-weight` phải mở ngoại lệ |
nhúng video ngay khi mở trang | gọi mạng ngoài mà người đọc chưa xin — click-to-load giữ quyền đó cho họ |
`sandbox` là **attribute** của iframe | không kèm `allow-scripts` thì viewer PDF của Chromium mất tìm-kiếm và text-layer ⇒ đặt sandbox ở **CSP header** thay vì attribute |

## Nợ hình

- **Không có trục lọc `ho_so`** ở sidebar v1. Thư viện lớn lên thì cần, nhưng thêm một
  tầng lọc thứ tư khi chưa có dữ liệu để biết nó có cần là đoán.
- **Thẻ ppt/word không có ảnh xem trước.** Trang đầu render thành thumbnail cần đúng
  bước chuyển đổi đang là nợ.
- **Thanh tiến độ tải lên** cần `XMLHttpRequest` hoặc `fetch` + `ReadableStream`;
  `fetch` thường không báo tiến độ upload. Nếu quá tay ở v1 thì hạ xuống nút disabled +
  `aria-busy` như FR-036 đã làm cho form viết bài, và **khai rõ** là hạ.
