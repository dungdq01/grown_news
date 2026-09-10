# Quy chuẩn chữ — Grown_news

> Mỗi cỡ chữ có **một vai duy nhất**. Gặp chỗ mới cần cỡ chữ: tra bảng này,
> không tự gõ px. Không tìm được vai phù hợp ⇒ đó là dấu hiệu bố cục sai,
> không phải dấu hiệu thiếu cỡ chữ.
>
> Neo: `--fs-body: 15px`. Thang khớp Tailwind/shadcn.

## Font

| Vai | Font | Vì sao |
|---|---|---|
| **Mọi thứ trên mọi màn** | **Inter** | Trung tính nhất, phổ biến nhất cho giao diện. Có subset `vietnamese` nên dấu thanh đặt đúng |
| Chỉ **mã thật** — `code`, `pre`, `kbd`, output nguyên văn của `gate.py`/`validate.py` | **JetBrains Mono** | Bề rộng ký tự cố định là **chức năng** ở đây: cột thẳng hàng, phân biệt `0`/`O` và `1`/`l` |

**MỘT họ chữ cho giao diện** (FR-018). Bản trước dùng Inter cho nội dung và
JetBrains Mono cho *"số, mã, nhãn, locator"* — nghe gọn trên giấy, nhưng trên
bản chạy thật thì nút, nhãn vùng, mục lục, số đếm, mốc thời gian đều mono trong
khi tiêu đề và thân bài là sans: **mỗi màn trông một kiểu chữ khác nhau**.

Nhãn vẫn tách khỏi nội dung, chỉ là bằng cách khác — và cách này rẻ hơn:

| Trước | Sau |
|---|---|
| đổi **họ chữ** | `text-transform: uppercase` + `letter-spacing: var(--tr-lb)` |
| mono để số thẳng cột | `font-variant-numeric: tabular-nums` (Inter có sẵn) |

Mono còn đúng một vai, và vai đó có lý do kỹ thuật chứ không phải thẩm mỹ.
`markup-matches-css.test.js` canh: `--f-mn` xuất hiện ngoài luật của mã ⇒ đỏ.

---

## Thang cỡ chữ — 10 bậc

| Token | px | rem | Weight | Line-height | Tracking |
|---|---|---|---|---|---|
| `--fs-micro` | **12** | .75 | 500 | 1.45 | +.06em¹ |
| `--fs-meta` | **13** | .8125 | 400 | 1.5 | 0 |
| `--fs-small` | **14** | .875 | 400 | 1.55 | 0 |
| `--fs-body` | **15** | .9375 | 400 | 1.55 | 0 |
| `--fs-read` | **16** | 1 | 400 | 1.65 | 0 |
| `--fs-lead` | **18** | 1.125 | 400 | 1.5 | −.005em |
| `--fs-h3` | **20** | 1.25 | 600 | 1.35 | −.011em |
| `--fs-h2` | **24** | 1.5 | 600 | 1.3 | −.017em |
| `--fs-h1` | **32** | 2 | 700 | 1.15 | −.021em |
| `--fs-hero` | **40** | 2.5 | 700 | 1.05 | −.024em |

¹ Chỉ nhãn viết hoa mới giãn chữ. Chữ thường cỡ 12 giữ tracking 0.

**Luật tracking**: chữ càng lớn càng siết. Cỡ ≤16px giữ 0 — siết chữ nhỏ làm khó đọc.

---

## Bảng tra — chỗ nào dùng cỡ nào

### Header và tiêu đề

| Chỗ | Cỡ | Weight | Ghi chú |
|---|---|---|---|
| Số KPI dashboard | `hero` 40 | 700 | Chỉ dùng cho con số, không cho chữ |
| Tít bài nổi bật (trang chủ) | `h1` 32 | 700 | Tối đa 2 dòng |
| Tít trong cửa sổ đọc | `h2` 24 | 600 | Thấp hơn tít trang chủ 1 bậc — xem ghi chú dưới |
| Tiêu đề mục 1–9 | `h3` 20 | 600 | Kèm số thứ tự mono 13 |
| Tít bài phụ, tên panel dữ liệu | `h3` 20 | 600 | — |
| Tít trong danh sách "mới phân tích" | `h3` 20 | 600 | — |
| Tít trong thẻ lưới | `small` 14 | 600 | Thẻ nhỏ, cắt 2 dòng |

### Nội dung đọc

| Chỗ | Cỡ | Weight |
|---|---|---|
| Thân bài trong cửa sổ đọc | `read` 16 | 400 |
| Sapo / câu dẫn (`.ld`) | `read` 16 | 400 |
| Câu trích nhấn mạnh (`.bg`) | `read` 16 | 600 |
| Mô tả trong danh sách | `meta` 13 | 400 |
| Mô tả trong thẻ lưới | `micro` 12 | 400 |

**Vì sao thân bài 16 mà giao diện 15**: vùng đọc cần thoáng hơn vùng thao tác. Chênh một bậc là đủ thấy, không phá nhịp.

### Cửa sổ đọc thấp hơn trang chủ một bậc — 2026-08-19

Tít trong cửa sổ dùng `h2` 24, không phải `h1` 32 như tít trang chủ; tiêu đề mục
dùng `h3` 20, không phải `h2` 24.

Bảng này từng ghi 32/24 cho cả hai chỗ. Bản v19 bị bác vì "chữ vẫn to", và bản vá
đổi sang `clamp()` theo `cqw` — đo lại bằng script ở cửa sổ mặc định 880px thì ra
tít **20px** và thân bài **15.3px**: tụt 2 bậc khỏi thang, tít gần bằng thân bài
nên mất hẳn phân cấp. Tài liệu ghi 32 mà code cho 20 suốt từ đó.

Chốt trung dung: hạ đúng **một bậc** so với bảng gốc, và neo thẳng vào token thay
vì `clamp` tự do. Tỉ lệ tít/thân bài 24/16 = 1.5× — thấy rõ phân cấp mà vẫn gọn.

**Cỡ chữ trong cửa sổ không đổi theo bề rộng nữa.** Thứ co giãn theo cửa sổ là
bề rộng cột đọc và cột mục lục, không phải cỡ chữ — một cỡ chữ thay đổi khi kéo
cửa sổ là một cỡ chữ không tra được trong bảng này.

### Điều khiển

| Chỗ | Cỡ | Weight | Chiều cao |
|---|---|---|---|
| Nút (mọi biến thể) | `meta` 13 | 500 | 36px |
| Nút size `sm` | `meta` 13 | 500 | 32px |
| Tab thanh trên | `meta` 13 | 500 | 28px trong track 36px |
| Ô nhập, select | `small` 14 | 400 | 36px |
| Nút trong cửa sổ (— ×) | 12 | 400 | 24px |
| Nút ở dock | `micro` 12 | 500 | 32px |

Mọi điều khiển cùng hàng phải **cùng chiều cao 36px**. Đây là luật của shadcn và là thứ dễ sai nhất.

### Nhãn và dữ liệu

| Chỗ | Cỡ | Font | Weight | Hoa? |
|---|---|---|---|---|
| Nhãn panel ("NỔI BẬT", "MỚI PHÂN TÍCH") | `micro` 12 | mono | 400 | **HOA** + tracking .06 |
| Nhãn trường (`dt` trong tinh túy) | `micro` 12 | mono | 400 | **HOA** + tracking .06 |
| Badge loại nguồn (`paper`, `repo`) | `micro` 12 | mono | 500 | thường |
| Trạng thái (`approved`, `draft`) | `micro` 12 | mono | 400 | thường |
| Locator (`§4.2`, `retry.py:44`) | `meta` 13 | mono | 400 | thường |
| Ngày tháng | `micro` 12 | mono | 400 | thường |
| Số trang `05 / 09` | `micro` 12 | mono | 400 | thường |
| Mục lục trong cửa sổ | `meta` 13 | sans | 400 | thường |

**Mọi số phải có `font-variant-numeric: tabular-nums`** — nếu không, số nhảy cột khi đổi giá trị.

---

## Weight — chỉ dùng 4 bậc

| Weight | Dùng cho |
|---|---|
| **400** regular | Thân bài, mô tả, dữ liệu |
| **500** medium | Nút, tab, badge, nhãn micro |
| **600** semibold | h2, h3, tít thẻ |
| **700** bold | h1, hero, logo |

Không dùng 300 (mảnh quá ở cỡ nhỏ) và 800+ (nặng, không có trong bộ đã tải).

---

## Bảy luật không được phá

1. **Không gõ px trực tiếp.** Mọi cỡ chữ lấy từ `--fs-*`.
2. **Cỡ ≤16px không siết tracking.** Siết chữ nhỏ làm khó đọc.
3. **Nhãn viết HOA bắt buộc giãn chữ** `+.06em`, và bắt buộc dùng mono.
4. **Mọi số dùng `tabular-nums`.** Không có ngoại lệ.
5. **Một hàng điều khiển = một chiều cao.** 36px chuẩn, 32px cho `sm`.
6. **Không nhảy quá 2 bậc** giữa hai cấp kề nhau trong cùng một khối.
7. **Tít tối đa 2 dòng ở desktop.** Quá 2 dòng là lỗi chọn cỡ, không phải lỗi độ dài chữ.

---

## Kiểm nhanh khi review

- [ ] Có `px` nào trong `font-size` không? → phải là 0
- [ ] Nút và ô nhập cùng hàng có cùng chiều cao không?
- [ ] Nhãn HOA có dùng mono + tracking không?
- [ ] Cột số có thẳng khi đổi giá trị không?
- [ ] Tít nào tràn quá 2 dòng không?
- [ ] Có weight nào ngoài 400/500/600/700 không?
