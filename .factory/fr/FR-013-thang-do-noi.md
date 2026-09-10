# FR-013 — Thang độ nổi 4 mức, đảo luật "không shadow"

mở_bởi: người dùng, 2026-08-19
tới: s5 (`05_uiux/DESIGN.md` §3 · `tokens.css` · `ui_frozen`)
mức: đụng một luật thiết kế đã chốt ở G5
trạng_thái: ĐÃ THI HÀNH — 2026-08-19, worklog WL-01K9J5DONOI

## Vấn đề

Người dùng: *"tôi muốn tạo độ bóng 3D nhất định cho phần core — hiển thị dữ liệu"*,
và trong ảnh gửi kèm gọi các panel là **"khối lỗ trầu"**.

Từ mô tả đó tôi hỏi lại hai điều và người dùng chốt: **cả ba lớp** (panel · thẻ
bài/KPI · cửa sổ đọc), mức **elevation** (nổi rõ nhưng vẫn phẳng), không phải 3D
đậm có viền đáy và gradient.

### Điều này đảo một luật đã chốt

`05_uiux/DESIGN.md:111` (bản v1, frozen ở G5):

> **Không shadow** trừ hai chỗ: cửa sổ nổi (cần tách khỏi nền) và thẻ khi hover.
> Phân tầng bằng nền và viền.

Nên đây không phải chuyện thẩm mỹ tuỳ ý — nó là FR.

### Vì sao luật cũ không đủ

Luật đó viết cho một hệ **phân tầng bằng nền và viền**. Trên nền **ảnh phong
cảnh** thì nó thất bại theo cách đo được:

| | |
|---|---|
| Viền panel | `--edge: rgba(255,255,255,.66)` — trắng 66% |
| Nền phía sau | ảnh núi tuyết, vùng sáng gần trắng |
| Kết quả | viền tan vào nền, panel kính mờ hoà vào ảnh |

Shadow duy nhất của `.pn` là `0 2px 16px -6px rgba(0,0,0,.10)` — **một tầng,
alpha 10%**. Một tầng cho ra vết mờ dẹt, không ra khối. Mắt không đọc được lớp
nào trước lớp nào.

## Quyết

Thêm **thang 4 mức** vào `tokens.css`, mỗi mức **hai tầng** shadow.

| Token | Dùng ở | Vì sao mức đó |
|---|---|---|
| `--e-1` | `.cd` `.kp` lúc nghỉ | ô nằm TRONG panel ⇒ phải thấp hơn panel |
| `--e-2` | `.pn` · `.brk-*` hover | panel là lớp nền của nội dung |
| `--e-3` | `.cd` hover | nhảy **hai** mức, xem dưới |
| `--e-4` | `.bk` cửa sổ đọc | cao nhất — tách hẳn khỏi trang |

Cộng `--e-top` = `inset 0 1px 0` — viền sáng ở đỉnh, mô phỏng ánh sáng từ trên.
Đây là thứ làm mặt kính trông **có bề dày** mà không cần gradient, tức giữ được
mức "elevation" người dùng chọn thay vì trượt sang "3D đậm".

### Ba quyết định kỹ thuật, mỗi cái một lý do

**1 · Hai tầng, không một.** Tầng gần (1–4px, sắc) bắt cạnh; tầng xa (8–64px,
mềm) tạo chiều sâu. Bản cũ một tầng nên ra vết mờ — đúng thứ người dùng thấy.

**2 · Hover nhảy HAI mức (1→3), không một.** Nhấc `translateY(-2px)` mà bóng chỉ
đậm nhẹ thì mắt đọc ra "thẻ dịch chỗ", không phải "thẻ nhấc lên". Hai mức mới
khớp với chuyển động.

**3 · Tone tối có bộ giá trị RIÊNG.** Alpha cao hơn (nền tối hấp thụ bóng: `.06`
→ `.34`) và `--e-top` mờ hơn (`.55` → `.07`, nếu không thành vạch trắng chói).
Dùng chung một bộ thì tone tối gần như không thấy bóng.

### Không đụng gì

`.top` và `.dock` — thanh dính mép, DESIGN.md §3 chốt chúng *"cùng lớp kính với
panel"*. Cho chúng shadow là quay lại đúng lỗi v15: *"thanh menu trông như tấm
đục dán lên"*.

`.brk-m` / `.brk-s` lúc **nghỉ** cũng không có shadow: chúng chia ô bằng **viền
dọc**, không phải thẻ rời. Gắn bóng lúc nghỉ sẽ ra ba khối chồng nhau trong một
panel, phá bố cục "lưới bất đối xứng" (DESIGN.md §4). Chỉ hover mới nổi.

## Đổi thì

Nếu sau này bỏ nền ảnh phong cảnh (nền phẳng một màu), luật cũ *"phân tầng bằng
nền và viền"* lại đủ, và thang này thành dư. Lúc đó hạ `--e-*` về `none` ở một
chỗ là xong — đó là lý do khai thành token thay vì rải giá trị trong CSS.

Nếu muốn đẩy sang **3D đậm** (viền đáy tối + gradient mặt), đó là FR khác: nó đổi
tinh thần "kính mờ" của s5, không chỉ thêm chiều sâu.

## Thi hành

| Chỗ | Đổi |
|---|---|
| `05_uiux/tokens.css` | `--e-1..4` + `--e-top`, hai bộ (sáng/tối) |
| `05_uiux/DESIGN.md` §3 | viết lại mục độ nổi, ghi vì sao luật cũ không đủ |
| `web/styles/prototype.css` | 6 chỗ dùng `var(--e-*)`; bỏ 3 shadow gõ tay |
| `project_map` `ui_frozen.version` | `v1.1` → `v1.2` |

### Bẫy gặp khi thi hành — ghi để lần sau không mất thời gian

`.cd`, `.cd:hover`, `.kp` mỗi cái **khai hai lần** ở cấp cao nhất của
`prototype.css` (dòng ~273 và ~666 · ~282 và ~676 · ~237 và ~637). Bản **sau
thắng** cascade. Sửa bản đầu thì token vô hiệu và không có gì báo lỗi — tôi sửa
đúng bản đầu ở lượt một, và chỉ phát hiện khi grep hết `box-shadow` còn gõ tay.

Đây là nợ đã ghi ở FR-008: 41 selector khai trùng, 0 luật chết hoàn toàn.
Chưa có cổng máy nào canh "sửa bản không thắng cascade".
