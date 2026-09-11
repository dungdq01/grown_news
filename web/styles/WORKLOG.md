# `web/styles/` — hai file, một nguyên tắc

> `tokens.css` **thắng mọi tài liệu**. Lệch nhau thì sửa tài liệu, không sửa token.

---

## Hai file

| File | Là gì | Sửa được không |
|---|---|---|
| `prototype.css` | 828 dòng **bê nguyên** từ `app-v20.html`; hiện 3322 dòng (+`.tim-*` của panel tìm, `T03-125` · SCR-27) (phần thêm FR-011 · FR-013 · FR-014 · FR-016 · FR-017 · FR-021 · FR-022 · FR-027a–j · FR-038 · WO-012 · WO-013 · WO-015 · WO-016 · WO-017 · WO-020 · WO-021 · FR-042 · T03-90 · T03-112 · T03-115) | **hợp đồng G5 frozen** — sửa phải qua FR |
| `custom.scss` | ánh xạ token của s5 lên biến Quartz | được |

`tokens.css` **không nằm ở đây** — nó ở `05_uiux/tokens.css` (113 token, nguồn
duy nhất). `link-plugins.mjs` chép nó vào `_quartz/quartz/styles/` lúc build.

---

## `prototype.css` — bê nguyên nghĩa là bê cả tên

Ba thứ đổi so với bản gốc, và **chỉ ba thứ đó**:

1. Khối `:root` và `[data-theme="dark"]` bỏ đi — token nạp từ `tokens.css`
2. `background-position: calc(...)` → `right/top` (xem dưới)
3. `.sky` đọc ảnh từ `/static/bg/` thay vì base64 nhúng trong file

**Tên class giữ nguyên.** Lần đầu tôi đổi tiền tố sang `gn-*` "để không đụng
Quartz" — nhưng HTML dùng tên gốc, 23 class lệch nhau, trang trắng trơn. Quartz
dùng tên khác (`.page`, `.center`, `.popover`) nên thực tế không đụng.

### Lỗi Sass — `calc()` trong CSS thuần

```css
/* Hợp lệ trong CSS, nhưng Sass báo lỗi */
background-position: calc(100% - 14px) 15px;
```

Sass coi `100%` là số phần trăm và `- 14px` là phép trừ **khác đơn vị** ⇒
`"+" and "-" must be surrounded by whitespace in calculations`.

Đổi sang `right 14px top 15px` — cùng kết quả, không cần `calc`.

### Vì sao nạp qua component, không qua `custom.scss`

`@use "./prototype.css"` làm Sass diễn giải CSS thuần **sai kiểu**. Nạp qua
`QuartzComponent.css` (nhận **chuỗi**, không qua Sass) thì không có vấn đề đó.

Xem `plugins/backdrop/index.ts`.

---

## `custom.scss` — chỉ ánh xạ, không định nghĩa

```scss
:root {
  --light: var(--background);
  --secondary: var(--brand);
  --bodyFont: var(--f-ui);
}
```

Cấu hình màu trong `quartz.config.yaml` chỉ nhận **10 tên**. Đó là ánh xạ nghèo
của một hệ **113 token** — nó không biết `--fs-body`, không biết `--blur-lift`,
không biết ba luật chữ. Nên phần nhìn thật sống ở đây.

### Ba luật chữ của s5 — điểm đặc trưng của sản phẩm

```
1 · Menu: ĐẬM (600) + THẲNG
2 · Header và nội dung CÙNG CỠ — khác nhau ở weight, không ở size
3 · Ghi chú / cảnh báo / lỗi: NGHIÊNG
```

Luật 2 là điểm đặc trưng: phân cấp bằng **weight**, chữ gọn. Bản v19 dùng
`clamp()` tự do cho cửa sổ đọc → 19.3px giữa hệ 15px → lệch cả hệ. Giờ mọi
`clamp` neo vào thang token, chênh tối đa **0.8px**.

---

## Đỏ mỗi tone một hex khác nhau

| Màu | Trên trắng | Trên đen |
|---|---|---|
| `#C81E1E` | **5.74** ✓ | 3.45 ✗ |
| `#F87171` | 2.77 ✗ | **7.15** ✓ |

Không màu nào đạt cả hai. Dùng một hex rồi đảo nền là hỏng một trong hai theme.

**Cảnh báo tách khỏi đỏ bằng *sắc độ*, không bằng độ sáng** — phép thử tương phản
không đo được việc này. Thêm kiểm `hue_gap ≥ 25°`: `#92400E` lệch 22.7° trượt,
`#854D0E` lệch 31.8° đạt.

---

## Khi sửa

| Muốn đổi | Sửa ở đâu |
|---|---|
| Giá trị token (màu, cỡ chữ, spacing) | `05_uiux/tokens.css` — **FR + bump version** |
| Ánh xạ token → biến Quartz | `custom.scss` |
| Bố cục prototype | `prototype.css` — **FR**, nó là hợp đồng G5 |
| Style riêng của một component | `plugins/<tên>/src/styles/` |

Sau khi sửa: server đọc thẳng `web/styles/` khi ghép gn.css (FR-034 — bước chép sang `_quartz/` đã nhổ); restart `npm run api`.

> `check_frozen.py` băm SHA-256 và so với `FROZEN.lock`. Sửa file frozen mà chưa
> có FR ⇒ CI đỏ. Ký lại: `python core/tests/check_frozen.py --ky` — **chỉ sau**
> khi đã mở FR.

### WO-024 · dải tab khai CỨNG ba cột, hai màn chỉ có một tab

`.np-tabs{grid-template-columns:repeat(3,1fr)}` — ba cột cứng. Đếm thật:
nap-bai-viet **3** tab · nap-tai-lieu **1** · nap-video **1**. Nên trên hai màn
sau, tab duy nhất bị nhét vào 1/3 đầu và **2/3 bỏ trống** — đúng dải trống bên
phải người dùng đã kêu.

**WO-021 không bắt được vì nó chữa nửa kia.** Nó chữa cột form
(`.np-p{max-width:52rem;margin-inline:auto}`) và `format-chung` §5 đo đúng cái
đó. Dải tab nằm **ngoài** `.np-p` nên nằm ngoài phạm vi phép đo — chữa một nửa
màn rồi đo đúng nửa đã chữa. Cùng lớp lỗi với `#acount` đếm sai phạm vi.

**Bản chữa đã có sẵn trong repo:** `.dm-tabs` từng mắc y hệt và đã đổi sang
`grid-auto-flow:column;grid-auto-columns:1fr`. `auto-flow` sinh đúng số cột bằng
số phần tử **có mặt**, nên không bao giờ lệch với markup. `repeat(N)` là con số
gõ tay ở tầng thứ hai, và lệch của nó **im lặng** vì CSS không báo gì.

**Cái bẫy thứ hai:** với `auto-flow: column` thì `grid-template-columns` **vô
hiệu**. Truy vấn hẹp cũ đổi đúng thuộc tính đã bị vô hiệu ⇒ ba tab vẫn nằm ngang
trên điện thoại, "đã sửa" trên giấy. Phải đổi chính `grid-auto-flow` sang `row`.

Kiểm hai chiều cho vế đó: phá ⇒ ĐỎ đúng lời; phục hồi ⇒ sha256
`405c005ee3aaf394` y hệt trước khi phá.
