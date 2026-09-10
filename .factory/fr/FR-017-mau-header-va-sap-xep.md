# FR-017 — Màu cho header, chữ đậm ở thanh điều hướng, sắp xếp theo ngày

mở_bởi: người dùng, 2026-08-19 — lượt rà thứ hai trên bản chạy thật
tới: s5 (`ui_frozen` — màu dùng ở đâu) · s8 (`prototype.css`, `shell.html`, emitter, script)
mức: sắc màu + độ đậm + một điều khiển mới. **Không đổi giá trị token nào.**
trạng_thái: MỞ — thi hành theo yêu cầu trực tiếp

## Bốn yêu cầu

1. *"Header có thể thêm màu sắc vào mà, nhẹ nhàng cũng được"* (màn Nạp nguồn).
2. Form viết bài: **ngày phân tích mặc định là hôm nay** nếu người dùng không đụng vào.
3. Thêm **sắp xếp theo ngày** cho danh sách bài.
4. Chữ ở **thanh menu / sidebar / mục lục** cần đậm hơn.

## Quyết định

### Màu chữ chỉ lấy từ ba màu ĐÃ ĐƯỢC AUDIT làm màu chữ

`contrast-audit.json` (frozen) có đúng ba màu đạt ngưỡng chữ 4.5:1 trên nền sáng:

| Token | Hex | Tỉ lệ | Dùng cho |
|---|---|---|---|
| `--brand` | `#C81E1E` | 5.59 | Nạp nguồn — màn có hành động GHI |
| `--success` | `#15803D` | 4.89 | Kho — toàn cảnh |
| `--warning` | `#854D0E` | 6.61 | Chờ duyệt — việc đang treo |

**Không mượn bảng màu loại nguồn** (`--c-repo`, `--c-paper`…): chúng chỉ được
audit ở vai **viền/nền**, chưa từng đo ở vai màu chữ. Dùng bừa là tự bịa bằng chứng.

Màu gắn với **ý nghĩa của màn**, không phải trang trí luân phiên: đỏ ở nơi ghi
dữ liệu, hổ phách ở nơi có việc chờ, xanh ở nơi báo tình trạng tốt.

### Thanh điều hướng lên `--ink`, nội dung giữ `--ink-2`

Menu, sidebar lọc, mục lục cửa sổ, dock là **điều khiển**, không phải chữ phụ →
`--ink` (17.43:1) + weight `--w-head` (luật 1 DESIGN.md: *"menu ĐẬM + THẲNG"*).
Thân bài và mô tả **giữ `--ink-2`** — mọi thứ cùng đậm nhất thì không còn phân cấp.

### Sắp xếp: đổi thứ tự thẻ ĐANG HIỆN, không đổi thứ tự build

M03-R5 quy định site sinh ra sắp theo `priority`, **không** theo `analyzed_at`,
vì *"analyzed_at đo khi nào tôi rảnh, priority đo cái này quan trọng thế nào"*.
Luật đó nói về **thứ tự mặc định**, và `expected-render.test.js` vẫn canh nguyên.

*"Tôi muốn xem theo ngày"* là câu hỏi khác ⇒ trả lời bằng một điều khiển
client-side đổi thứ tự DOM (`ưu tiên | mới nhất | cũ nhất`). Build không đổi,
rule không đụng, và mặc định khi mở trang vẫn là thứ tự `priority`.

Thẻ mang thêm `data-ngay` + `data-pri` để sắp được mà không phải đọc lại chỉ mục.

### Ngày mặc định là phép TÍNH, không phải quyết định

M05-R2 cấm máy tự điền **quyết định**. Đọc đồng hồ hệ thống là phép tính (cùng
loại `word_count`), và giá trị hiện rõ trong ô — người sửa được trước khi gửi.
Đặt trong `datLaiForm()` chứ không ở nút mở form: `form.reset()` xoá ô đó, nên
điền lại ngay sau reset mới đúng.

## Phạm vi

| Được | KHÔNG được |
|---|---|
| Đổi token nào dùng ở đâu | Đổi **giá trị** token |
| Ba màu đã audit làm màu chữ header | Màu loại nguồn làm màu chữ |
| Sắp xếp client-side | Đổi thứ tự emitter sinh ra (M03-R5) |
| Ngày mặc định = hôm nay | Tự điền id/slug/credibility (M05-R2) |

## Thi hành

| Chỗ | Đổi |
|---|---|
| `web/styles/prototype.css` | khối `FR-017`: nav → `--ink` + `--w-head` · header theo màn · tít tab theo màu lối · `.sortb` |
| `web/plugins/home-pages/shell.html` | nhóm nút `.sortb` ở header màn Tất cả |
| `web/plugins/home-pages/index.ts` | thẻ mang `data-ngay` + `data-pri` |
| `.../multiwindow.inline.ts` | `SAP`/`apSap()`/`doiSap()` + nhánh delegation · ngày mặc định trong `datLaiForm()` |
| `web/test/url-va-tuong-tac.test.js` | thêm `data-sap` vào danh sách "điều khiển phải có mã xử lý" |
| `project_map.yaml` | `ui_frozen` v1.5 |

## Đổi thì

Muốn thêm màu chữ thứ tư ⇒ phải có dòng tương ứng trong `contrast-audit.json`.
Không có dòng đó thì không có bằng chứng, và FR-014 đã khai: script đo 50 cặp
không nằm trong repo.
