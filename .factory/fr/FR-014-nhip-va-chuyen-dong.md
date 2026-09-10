# FR-014 — Nhịp bố cục + chuyển động: viền màu, tách cột, scroll ngang, bar chạy

mở_bởi: người dùng, 2026-08-19
tới: s5 (`DESIGN.md` §3 §4 · `tokens.css` · `ui_frozen`)
mức: đụng luật "4 layout family, không family nào lặp" (§4)
trạng_thái: ĐÃ THI HÀNH — 2026-08-19, worklog WL-01K9J6NHIP

## Vấn đề

Người dùng, kèm ba ảnh: *"các chỗ mà bố cục layout dính vào nhau thì tách ra tạo
xen kẽ khoảng trống… các mục nổi bật này thì cho hiệu ứng chạy scroll ngang…
màu core thì thay vì trắng tinh → đổi sang trắng be viền xanh đỏ tím… áp dụng
cho cả dark nữa… rồi vài hiệu ứng gì đó wow wow tí"*.

Bốn việc, **không cùng mức rủi ro** — nên tôi hỏi lại trước khi làm.

## Quyết định người dùng đã chốt

### 1 · Màu nền: viền màu, KHÔNG đổi nền

`contrast-audit.json` (frozen) đã validate **50/50 cặp WCAG AA, 0 fail**, đo trên
4 loại ảnh nền (`ảnh sáng #F0F5F7` · `ảnh tối #0E1216` · `ảnh xanh #4A7FA8` ·
`ảnh cỏ #7FA060`). Đổi nền panel là mọi cặp đó lạc hậu ⇒ phải đo lại 50 cặp và
bump contract.

Người dùng chọn **viền màu**, giữ nền. Lý do đúng về mặt kỹ thuật: viền **không
chứa chữ** nên chỉ cần đạt `1.35:1` của viền, không phải `4.5:1` của chữ. Đây là
chỗ rẻ nhất để thêm màu.

### 2 · Bốn hiệu ứng, chọn cả bốn

tách layout · scroll ngang vùng Nổi bật · chuyển động mịn khi hiện panel ·
bar biểu đồ chạy từ 0.

## Điều này đảo một luật §4

`DESIGN.md:156`:

> **Trang chủ dùng 4 layout family khác nhau** — lưới bất đối xứng (nổi bật) ·
> danh sách (mới) · KPI+bar (kho) · lưới thẻ (kho gần đây). **Không family nào lặp.**

Scroll ngang đổi vùng Nổi bật từ *"lưới bất đối xứng"* thành *"dải cuộn ngang"*.

**Bất đối xứng vẫn còn, chỉ đổi trục**: thẻ lớn `min(46%,620px)`, thẻ nhỏ
`min(30%,380px)` — tỷ lệ 1.5:1 giữ đúng như `grid-template-columns:1.5fr 1fr 1fr`
của bản cũ. Bốn family vẫn khác nhau, không family nào lặp.

**Chỉ ở màn ≥1081px.** Dưới ngưỡng đó `.brk-g` đã xếp dọc theo `SCR-02` mobile
("6 cột không đọc được trên mobile ⇒ chip cuộn ngang") — không đụng.

## Bốn việc, mỗi việc một lý do

| Việc | Trước | Sau | Vì sao |
|---|---|---|---|
| Viền màu | `1px solid var(--edge)` trắng 66% | + pseudo-element gradient 3 hue | trên ảnh sáng, viền trắng tan vào nền |
| Tách cột | `.two` gap `--s-md` (24px) | `--s-lg` (32px) + cột phải lệch 32px | 24px là **chính con số §4 gọi là "hai vùng trông như một khối liền"** |
| Chuyển động | `translateY(14px)`, ease tuyến tính | `+scale(.985)`, cubic-bezier có đà | panel "tiến lại" thay vì chỉ trượt |
| Bar chạy | hiện ra đã đầy | `scaleX(0→1)`, lệch nhịp 70ms | bar đầy chỉ đọc được ĐỘ DÀI; chạy từ 0 mới đọc được TỶ LỆ |

### Viền: `box-shadow` inset, MỘT màu — sửa lần 2

**Lượt đầu tôi làm sai hai lần cùng lúc**, và người dùng gửi ảnh chỉ ra:

> *"sai ý tôi rồi. Giữ màu core, còn hiệu ứng màu sáng ở viền các ô thôi. Làm
> như này trẻ trâu lắm — bỏ hiệu ứng màu cầu vồng kia đi."*

**Lỗi kỹ thuật**: dùng pseudo-element + `mask-composite:exclude`, nhưng khai
thuộc tính viết tắt `mask:` **SAU** `mask-composite:`. `mask` viết tắt **reset**
`mask-composite` về mặc định ⇒ mask không loại trừ gì ⇒ **gradient tràn kín cả
mặt panel** thay vì nằm ở viền. Đúng thứ trong ảnh.

**Lỗi thẩm mỹ**: gradient ba hue trên sáu panel là quá ồn cho một tờ báo tri
thức. "Wow" không phải "nhiều màu".

Bản đúng — ít cơ chế hơn nên ít chỗ vỡ hơn:

```css
.pn{--vien:var(--edge)}
.pn::after{box-shadow:inset 0 0 0 1px var(--vien);transition:box-shadow .28s}
.pn:hover{--vien:var(--vien-nhan)}
```

`box-shadow` inset **vốn nằm đúng ở viền** — không cần mask, không cần cắt gì.
Đổi màu qua một custom property nên hover chỉ là đổi giá trị biến.

**Một hue**: `--c-video` (xanh) — xa `--brand` đỏ nhất trong palette nên không
tranh với dấu nhấn thương hiệu, và đã validate CVD. Tone sáng 34%, tone tối 52%
(nền thẫm hấp thụ).

Vùng Nổi bật `.pn.brk` **miễn trừ**: đã có viền đỏ riêng.

## Ba bẫy gặp khi thi hành

### 1 · Bar chạy sau lớp mờ

Đo trên HTML thật: **4/5 khối `.bars` nằm TRONG `.pn.rise`**. Panel bắt đầu
`opacity:0` và mất `.55s` để hiện. Bar chạy ngay lúc đó thì diễn ra **sau lớp
mờ** — mắt bỏ mất hoàn toàn.

Sửa: mọi delay bar cộng thêm **260ms**. Panel gần xong thì bar mới bắt đầu; hai
chuyển động **nối nhau** chứ không chồng nhau.

### 2 · JS chỉ quan sát `.rise`

`.bars` cần class `.in` riêng. Thiếu vòng quan sát thứ hai thì bar **không bao
giờ** chạy — và không có gì báo lỗi.

Kèm một bẫy con: delay của bar do CSS đặt theo `:nth-child`; nếu JS đặt
`style.transitionDelay` lên `.bars` thì nó **đè** mất. Nên chỉ đặt cho `.rise`.

### 3 · `prefers-reduced-motion` để phần tử mắc trạng thái ĐẦU

CSS đã có khối tắt animation toàn cục, nhưng ba luật mới dùng `transform` ⇒ phải
trả về trạng thái **CUỐI**. Thiếu thì người bật giảm chuyển động thấy **panel vô
hình và bar rỗng vĩnh viễn**. Đây là lỗi a11y, không phải lỗi thẩm mỹ.

## Đổi thì

Nếu bỏ nền ảnh phong cảnh, viền màu thành dư — hạ `--vien-mau` về `none` ở một
chỗ là xong.

Nếu muốn **đổi nền** thật (trắng be như người dùng nêu ban đầu), đó là FR khác:
phải chạy lại script đo 50 cặp × 4 ảnh nền và bump `contrast-audit` sang v2.

## Thi hành

| Chỗ | Đổi |
|---|---|
| `05_uiux/tokens.css` | `--vien-mau` `--vien-sang`, hai bộ sáng/tối |
| `05_uiux/DESIGN.md` | §3 viền màu · §4 ghi lý do đổi family vùng Nổi bật |
| `web/styles/prototype.css` | `.pn::before` mask · khối "NHỊP + CHUYỂN ĐỘNG v1.3" ở cuối |
| `web/plugins/multiwindow/.../multiwindow.inline.ts` | `hienPanel()` quan sát thêm `.bars` |
| `web/test/motion-polish.test.js` | MỚI — canh 4 hiệu ứng + 3 bẫy |
| `project_map` `ui_frozen.version` | `v1.2` → `v1.3` |
