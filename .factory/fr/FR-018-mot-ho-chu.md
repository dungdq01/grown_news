# FR-018 — MỘT họ chữ cho mọi màn

mở_bởi: người dùng, 2026-08-19 — *"TÔI CẦN 1 font chữ - kiểu chữ apply cho tất cả các màn, tôi đã nói rất rõ từ đầu rồi"*
tới: s5 (`tokens.css`, `TYPOGRAPHY.md`, `DESIGN.md` — hợp đồng UI) · s8 (`prototype.css`, `custom.scss`, test)
mức: đổi **giá trị token font** — thứ mọi màn đều chạm
trạng_thái: MỞ — thi hành theo yêu cầu trực tiếp

## Vấn đề

Hợp đồng G5 ghi hai họ chữ và ghi luôn *lý do*:

> `TYPOGRAPHY.md`: *"Giao diện + nội dung → **Inter**. Số, mã, nhãn, locator →
> **JetBrains Mono**. Hai họ chữ, không hơn."*
> `project_map.ui_frozen.verified`: *"typography: 0 cỡ chữ gõ tay · **2 họ chữ**"*

Nghe gọn trên giấy. Trên bản chạy thật thì **"nhãn" phình ra thành gần như mọi
thứ không phải thân bài**: nút sắp xếp, nhãn vùng, mục lục cửa sổ, số đếm, mốc
thời gian, ghi chú, tiêu đề cửa sổ, danh mục khái niệm — 59 luật CSS dùng mono.
Kết quả đúng như người dùng thấy: **mỗi màn một kiểu chữ**.

Điều tệ hơn: dòng `verified: 2 họ chữ` khiến mọi đợt sửa sau đó coi đây là tính
chất **đã nghiệm thu** và không ai hỏi lại. Yêu cầu của người dùng bị chôn dưới
một dòng hợp đồng.

## Quyết định

**Inter cho mọi màn.** Mono giữ đúng **một** vai: mã thật — `code`, `pre`, `kbd`,
và output nguyên văn của `gate.py` / `validate.py`. Ở đó bề rộng ký tự cố định
là **chức năng** (cột thẳng hàng, phân biệt `0`/`O` và `1`/`l`), không phải lựa
chọn thẩm mỹ. Đổi chỗ đó sang sans là làm hỏng thứ đang có tác dụng.

Nhãn vẫn phải tách khỏi nội dung — chỉ đổi cách, và cách mới rẻ hơn:

| Trước | Sau |
|---|---|
| đổi **họ chữ** | `text-transform: uppercase` + `letter-spacing: var(--tr-lb)` |
| mono để số thẳng cột | `font-variant-numeric: tabular-nums` (Inter có sẵn) |

Không đổi giá trị **cỡ chữ**, **weight**, **màu** nào — thang 10 bậc và
`contrast-audit.json` không bị chạm.

## Phạm vi

| Được | KHÔNG được |
|---|---|
| Mọi nhãn/số/menu/mục lục → `--f-ui` | Đổi `code`/`pre`/`kbd`/output cổng sang sans |
| Sửa `TYPOGRAPHY.md`, `DESIGN.md`, `verified` cho khớp thực tế | Giữ tài liệu nói "2 họ chữ" trong khi mã chạy 1 |
| Sửa test canh luật chữ | Xoá luật — nhãn HOA vẫn phải có tracking |

## Thi hành

| Chỗ | Đổi |
|---|---|
| `05_uiux/tokens.css` | `.lbl`/`.note` → `--f-ui`; ghi rõ ở chỗ khai `--f-mn` rằng nó chỉ còn vai mã |
| `web/styles/prototype.css` | **56 luật** → `--f-ui`; **3 luật giữ mono** (`.np-c code`, `.up-kq`, `.f-kq`) |
| `web/styles/custom.scss` | tách `code,pre,kbd` (mono) khỏi `.locator,time,.tabular` (`--f-ui` + tabular-nums) |
| `web/test/markup-matches-css.test.js` | luật nhãn HOA: `--f-mn` → `--f-ui`; **thêm phép kiểm mới**: `--f-mn` xuất hiện ngoài luật mã ⇒ đỏ |
| `05_uiux/TYPOGRAPHY.md` · `DESIGN.md` · `project_map.yaml` | bỏ "2 họ chữ", ghi luật mới + lý do |

## Đổi thì

Muốn mono quay lại vai nhãn ⇒ phải giải thích được vì sao *"mỗi màn một kiểu
chữ"* là điều mong muốn. Test mới sẽ đỏ trước khi điều đó lọt vào bản build.

## Nợ ghi nhận

Font `JetBrains Mono` vẫn được nạp (Quartz `typography.code`) vì mã thật còn
dùng. Nếu sau này bỏ hẳn mono thì gỡ được một webfont — chưa làm, vì mã thật
là chỗ nó có tác dụng.
