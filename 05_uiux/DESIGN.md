# Grown_news Design System — s5 FROZEN v1

> **Frozen sau G5.** Đổi bất kỳ giá trị nào ⇒ mở FR, bump version, ghi worklog.
> Chủ sở hữu drift: PM.
>
> Giá trị thật sống ở [`tokens.css`](tokens.css) — file này giải thích **vì sao**,
> không lặp lại **cái gì**. Lệch nhau thì `tokens.css` thắng.
>
> Bản chạy được: `prototype/app-v20.html`

## Design Read

> Editorial knowledge archive cho một kỹ sư đọc sâu — **app shell** có dashboard
> và nhiều cửa sổ đọc song song, không phải trang blog. Nền phong cảnh thật,
> nội dung nổi trên lớp kính. Đỏ dùng như mực in, không như nút bấm.

Ba dial: `VARIANCE 7` · `MOTION 3` · `DENSITY 3`.

**Vì sao không phải landing page**: đây là nơi *đọc* và *duyệt*, không phải nơi
convert. Không CTA, không social proof.

**Vì sao không phải digital garden**: có biên tập, có trạng thái duyệt, có thứ
hạng. Là toà soạn, không phải vườn.

---

## 1 · Màu

Hệ token **shadcn/ui**: mỗi bề mặt đi kèm màu chữ của chính nó
(`<surface>` / `<surface>-foreground`), nên không bao giờ đặt nhầm chữ lên nền sai.

Đỏ thương hiệu `#C81E1E` là `--primary`.

### Ba quyết định màu — đo được, không phỏng đoán

**Đỏ light và dark là hai hex khác nhau.** Không phải chọn cho đẹp:

| Màu | Trên trắng | Trên đen |
|---|---|---|
| `#C81E1E` | **5.74** ✓ | 3.45 ✗ |
| `#F87171` | 2.77 ✗ | **7.15** ✓ |

Không màu nào đạt cả hai. Dùng một hex rồi đảo nền là hỏng một trong hai theme.

**Dark cần hai token đỏ riêng.** `--primary` (#F87171) đọc tốt trên nền đen, nhưng
chữ trắng trên nó chỉ 2.77 — nút không dùng được. Nút dark dùng `#DC2626`.

**Cảnh báo tách khỏi đỏ bằng *sắc độ*, không bằng độ sáng.** Đỏ vừa là màu thương
hiệu vừa là màu ngữ nghĩa của nguy hiểm. Phép thử tương phản **không** đo được
việc này — hai màu cùng độ sáng vẫn phân biệt được bằng hue. Thêm kiểm
`hue_gap ≥ 25°`: `#92400E` lệch 22.7° → trượt; `#854D0E` lệch 31.8° → đạt.

### Nguyên tắc dùng đỏ

> **Đỏ là dấu nhấn, không phải nền. Tối đa 3 lần mỗi viewport.**

Nội dung dài mà nền đỏ thì không ai đọc hết. Chỗ nào cũng đỏ thì không chỗ nào
quan trọng.

### Kiểm chứng

**32/32 cặp tương phản pass WCAG AA**, đo trên 4 loại ảnh nền (sáng · tối · xanh ·
cỏ) vì nền là kính bán trong suốt. Thấp nhất 4.54.

Bằng chứng: [`contracts/contrast-audit.json`](contracts/contrast-audit.json)

---

## 2 · Chữ

**Inter cho MỌI màn** (FR-018) — giao diện, nội dung, nhãn, số, locator, mốc
thời gian. **JetBrains Mono chỉ cho mã thật**: `code`, `pre`, `kbd`, và output
nguyên văn của `gate.py`/`validate.py`, nơi bề rộng ký tự cố định là chức năng.
Cả hai có subset `vietnamese` — không phải font sans nào cũng có.

Nhãn tách khỏi nội dung bằng **HOA + tracking + tabular-nums**, không bằng đổi
họ chữ. Đổi họ chữ làm mỗi màn trông một kiểu.

Thang 10 bậc, chi tiết vai từng bậc: [`TYPOGRAPHY.md`](TYPOGRAPHY.md)

### Ba luật

| # | Luật | Token |
|---|---|---|
| 1 | Menu **ĐẬM + THẲNG** | `--w-head: 600`, `font-style: normal` |
| 2 | Header và nội dung **CÙNG CỠ**, khác weight | `--w-head` vs `--w-body` |
| 3 | Ghi chú / cảnh báo / lỗi **NGHIÊNG** | `--i-note: italic` |

Luật 2 là điểm đặc trưng: phân cấp bằng **weight**, không bằng cỡ. Chữ gọn, không
cần to.

### Cửa sổ đọc — clamp neo vào token

Cỡ chữ trong cửa sổ co giãn theo **chiều rộng cửa sổ** (container query `cqw`),
không theo màn hình. Nhưng **chỉ nới tối đa 1 bậc**:

```css
.doc { font-size: clamp(.9375rem, .90rem + .10cqw, 1rem) }   /* 15 → 16px */
```

Bản v14 dùng clamp tự do cho 19.3px — to hơn trang chủ 4px, lệch hệ. Giờ chênh
tối đa **0.8px**.

---

## 3 · Chất liệu

**Một blur duy nhất cho mọi bề mặt nổi**: `--blur-lift: blur(22px) saturate(1.22)`.

Bản v15 dùng ba mức khác nhau (`.top` 20px/1.3 · `.pn` 18/1.15 · `.bk` 24/1.2) ⇒
mắt đọc ra ba chất liệu trên cùng màn hình, thanh menu trông như tấm dán lên.

Điều khiển trên thanh dùng `color-mix()` để ảnh nền xuyên qua — nền đục làm menu
"dày" hơn phần dưới.

### Độ nổi — đổi ở FR-011 (2026-08-19)

Bản v1 chốt: *"**Không shadow** trừ hai chỗ: cửa sổ nổi và thẻ khi hover. Phân
tầng bằng nền và viền."*

Điều đó **không đủ trên nền ảnh phong cảnh**. Panel kính mờ có viền `--edge`
trắng 66% nằm trên ảnh núi sáng thì viền tan vào nền, và mắt không đọc ra lớp
nào trước lớp nào — người dùng nói "khối lỗ trầu", đúng.

Giờ có **thang 4 mức** trong `tokens.css`, mỗi mức **hai tầng** shadow:

| Token | Dùng ở | Vì sao mức đó |
|---|---|---|
| `--e-1` | `.cd` `.kp` lúc nghỉ | ô nằm TRONG panel ⇒ phải thấp hơn nó |
| `--e-2` | `.pn` · `.brk-*` hover | panel là lớp nền của nội dung |
| `--e-3` | `.cd` hover | nhảy **hai** mức để mắt thấy "nhấc lên", không phải "dịch chỗ" |
| `--e-4` | `.bk` cửa sổ đọc | cao nhất — tách hẳn khỏi trang |

Cộng `--e-top` (`inset 0 1px 0`) — viền sáng ở đỉnh, mô phỏng ánh sáng từ trên.
Đây là thứ làm mặt kính trông **có bề dày** mà không cần gradient.

**Hai tầng, không một.** Tầng gần (1–4px, sắc) bắt cạnh; tầng xa (8–64px, mềm)
tạo chiều sâu. Một tầng cho ra vết mờ dẹt — đúng lỗi của bản cũ
(`0 2px 16px -6px @10%`).

**Tone tối có bộ giá trị RIÊNG**: alpha cao hơn (nền tối hấp thụ bóng) và
`--e-top` mờ hơn (`.07` thay `.55`, nếu không thành vạch trắng chói).

**Không đụng** `.top` và `.dock`: chúng là thanh dính mép, cùng lớp kính với
panel — cho chúng shadow là quay lại lỗi v15 "thanh menu như tấm dán lên" (§3).

Phân tầng vẫn dùng nền và viền; shadow **cộng thêm**, không thay.

### Viền nhấn khi hover — FR-014 (2026-08-19)

Panel có viền `--edge` (trắng 66%) lúc nghỉ, đổi sang `--vien-nhan` khi hover:
`color-mix(--c-video 34%, --edge)` ở tone sáng, `52%` ở tone tối.

**Nền GIỮ NGUYÊN** `rgba(252,252,251,.9)` — nó nằm trong 50 cặp
`contrast-audit.json` đã validate. Viền không chứa chữ nên chỉ cần đạt `1.35:1`,
đó là chỗ rẻ nhất để thêm màu. Đổi nền là mọi cặp lạc hậu ⇒ FR khác.

**MỘT hue, không gradient.** Lượt đầu tôi làm gradient ba hue và nó vừa vỡ kỹ
thuật (`mask` viết tắt reset `mask-composite` ⇒ gradient tràn kín mặt panel) vừa
sai hướng — người dùng gọi đúng: *"trẻ trâu"*. Cầu vồng trên sáu panel là quá ồn
cho một tờ báo tri thức.

Chọn `--c-video` (xanh) vì nó xa `--brand` đỏ nhất trong palette nên không tranh
với dấu nhấn thương hiệu, và đã validate CVD.

Dựng bằng `box-shadow: inset 0 0 0 1px` trên `::after` — nó **vốn nằm đúng ở
viền**, không cần mask. Ít cơ chế hơn thì ít chỗ vỡ hơn.

---

## 4 · Bố cục

| | Giá trị | Vì sao |
|---|---|---|
| Spacing | thang 4px, 8 bậc `--s-3xs` → `--s-2xl` | v4 gõ tay 9 giá trị khác nhau cho cùng một vai ⇒ mất nhịp |
| Radius | `--radius: .625rem` + 3 bậc dẫn xuất | shadcn |
| Cột đọc | 600px | 60–75 ký tự |
| Trang | max 1360px | |
| Panel | cách nhau `--s-2xl` (64px) | 24px làm hai vùng trông như một khối liền |

**Trang chủ dùng 4 layout family khác nhau** — lưới bất đối xứng (nổi bật) ·
danh sách (mới) · KPI+bar (kho) · lưới thẻ (kho gần đây). Không family nào lặp.

### Vùng Nổi bật đổi trục — FR-014 (2026-08-19)

Từ *lưới bất đối xứng* sang **dải cuộn ngang** có `scroll-snap`, chỉ ở màn
≥1081px. Dưới ngưỡng đó vẫn xếp dọc như SCR-02 mobile đã quyết.

**Bất đối xứng vẫn còn, chỉ đổi trục**: thẻ lớn `min(46%,620px)`, thẻ nhỏ
`min(30%,380px)` — tỷ lệ 1.5:1 giữ đúng `1.5fr 1fr 1fr` của bản cũ. Bốn family
vẫn khác nhau, luật "không family nào lặp" còn nguyên.

### Nhịp giữa hai cột — FR-014

`.two` cách nhau `--s-md` (24px). Đó là **chính con số** bảng trên gọi là *"làm
hai vùng trông như một khối liền"* — luật áp cho panel nhưng bỏ sót cột.

Giờ `--s-lg` (32px), và cột phải **lệch xuống** một nhịp ở màn rộng: hai khối
bằng nhau về đỉnh thì mắt đọc ra một hàng, không ra hai lớp.

Lưới thẻ nới `--s-xs` → `--s-sm`: sau FR-013 thẻ có bóng, 12px làm bóng hai thẻ
cạnh nhau chồng lên.

**Mỗi vùng chỉ hiện mẫu**, có nút *xem tất cả* → chuyển màn chi tiết.

---

## 5 · Multi-window

Đặc trưng của sản phẩm: **mở nhiều bài cùng lúc**, mỗi bài một cửa sổ nổi.

| Thao tác | Cách |
|---|---|
| Mở | Bấm bài bất kỳ — cửa sổ mới lệch 28px để thấy chồng |
| Kéo | Giữ thanh tiêu đề |
| **Kéo giãn** | 8 hướng, min 340×220, không vượt viewport |
| Phóng to | Nút ▢, bấm lại trả kích cỡ cũ |
| Thu nhỏ | Nút —, xuống dock đáy |
| Đóng | Nút × hoặc **Esc** |

Mỗi cửa sổ có mục lục riêng, số trang `03 / 05` (đếm `h2` thật, không cố định), nút trước/tiếp nhảy giữa các mục.
Mục lục tự sáng theo chỗ đang đọc.

"Quyển sách" là **cách đọc** (cột hẹp, mục lục, chia mục), không phải một tờ giấy
duy nhất giữa màn hình — nên nhân được ra nhiều bản.

---

## 6 · Ảnh nền

Bộ riêng cho mỗi tone, tự chuyển **5–7 giây** (khoảng ngẫu nhiên, không cố định —
nhịp đều tăm tắp làm người đọc để ý tới chuyển cảnh).

**Tự dừng** khi: tab ẩn · rê chuột lên vùng nền · bấm tạm dừng.

### Kỹ thuật

**Không dùng `cross-fade()`** — Firefox chưa hỗ trợ tính đến 2026. Dùng hai lớp
`<div>` đảo `opacity`: chạy mọi trình duyệt và chỉ animate opacity.

**Phải `decode()` trước khi fade.** Đặt `src` rồi hiện ngay thì trình duyệt giải
mã *giữa lúc chuyển* — khung hình giật.

### Chuẩn ảnh

| Tiêu chí | Ngưỡng |
|---|---|
| Kích thước | **≥1920×1080** — dưới ngưỡng là phải phóng, phóng là vỡ |
| Tỉ lệ | 1.78 (16:9) |
| Sáng TB | ≥130 cho light, ≤110 cho dark |
| Vùng giữa | đều màu — đó là chỗ đặt panel |

Ảnh dọc phải xoay — **thử đủ 4 hướng**, chọn hướng đúng trọng lực. Bộ light-1→4
là ảnh ngang bị lưu sai hướng, xoay 270° ra đúng 16:9.

Xử lý: unsharp mask 2 lượt (trước và sau resize) · `q76 + subsampling 4:2:0` —
nhẹ hơn 34% mà độ nét chênh 0.2.

---

## 7 · Motion — intensity 3

Ba thứ, không hơn:
1. Nền trôi 0.1× tốc độ cuộn (parallax)
2. Khối fade-up khi vào viewport, stagger 60ms
3. Cửa sổ mở/lật trang có chuyển cảnh 3D nhẹ

Tất cả tắt hoàn toàn khi `prefers-reduced-motion`.

---

## 8 · Biểu đồ

Palette validate bằng `dataviz/scripts/validate_palette.js` — **chạy script, không
eyeball**.

**Light và dark có thứ tự khác nhau**, map theo *tên* chứ không theo index: đỏ
cạnh xanh lá fail CVD ở dark (ΔE 5.1).

Chi tiết: [`contracts/chart-palette.json`](contracts/chart-palette.json)

Series thứ 5 gộp vào "khác" — không sinh hue mới.

---

## 9 · Do's and Don'ts

**DO**
- Import `tokens.css`, không gõ lại giá trị
- Giữ đỏ ≤ 3 lần / viewport
- Mọi số dùng `tabular-nums`
- Mọi phần tử tương tác có `:focus-visible`
- Bảng và code block cuộn trong ô của chúng

**DON'T**
- Không đỏ làm nền khối lớn
- Không dùng đỏ cho cảnh báo — đó là vai của `--warning`
- Không thêm blur khác `--blur-lift`
- Không gõ px cho spacing hoặc font-size
- Không quá 2 họ chữ (mono không tính)
- Không carousel, infinite scroll, popup

---

## 10 · Giới hạn đã biết

| Vấn đề | Tình trạng |
|---|---|
| Nội dung mẫu dùng chung cho mọi bài | Prototype only — cần nối `kb/` thật ở s6 |
| Ảnh gốc 1308px phóng 1.47× | Cần ảnh ≥1920px mới nét hoàn toàn |
| Chưa có Dialog / Toast / Command palette | Thêm ở s6 nếu module cần |
| Chưa test trên Safari / Firefox | `backdrop-filter` và `container-query` cần kiểm |
