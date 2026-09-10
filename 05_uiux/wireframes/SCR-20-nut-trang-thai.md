# SCR-20 · Hệ màu trạng thái + bộ nút phân vai — wireframe

> `T03-120` bước 1. Bước trước (`T03-119`) đã xong phần **cấu trúc**: ba cụm
> `CHÍNH · THƯỜNG · NGUY` có thật trong DOM, tách nhau bằng khoảng trống, và
> xuống hàng riêng ở màn hẹp.
> **Trạng thái: ĐÃ DUYỆT — chủ dự án, 2026-09-06. Ba câu ở cuối đã chốt,
> xem §Chốt. Bước 2 (mã) được phép chạy.**

---

## Vấn đề — hôm nay màn nói trạng thái bằng MỘT kênh, và kênh ấy là chữ nhỏ

Thẻ trong lưới có lớp `st-draft` / `st-approved` / `st-edited` / `st-rejected`
từ lâu, nhưng **không lớp nào đổi hình thức** — người phân biệt bốn trạng thái
bằng một chuỗi `· draft` cỡ nano ở góc thẻ. Bộ nút cũng vậy: bốn nút cùng một
hình, nên *Bỏ khỏi kho* trông y hệt *Sửa*.

Hai hệ quả đo được: người phải **đọc** để biết trạng thái (không **thấy**), và
cú bấm nguy hiểm không có gì cản ngoài khoảng trống.

---

## Quyết định 1 — màu là kênh THỨ HAI, không phải kênh duy nhất

Mỗi trạng thái mang **màu + một dấu hình học**. Lý do không thương lượng: ~8%
đàn ông không phân biệt được đỏ–xanh, và một hệ chỉ-màu nói với họ *"bốn thẻ
này giống nhau"*.

| Trạng thái | Màu | Dấu hình học kèm | Đọc là |
|---|---|---|---|
| `draft` | **xanh dương** | vạch trái đặc | chưa ai đọc |
| `edited` | **cam** | vạch trái đặc + chấm | có người sửa, chưa duyệt lại |
| `approved` | **xanh** | vạch trái đặc | đang trên site |
| `rejected` | **đỏ** | vạch trái **gạch đứt** + tiêu đề gạch ngang | đã đọc, không giữ |
| (thùng rác) | **xám** | vạch trái mờ + cả thẻ 55% | rời kho, khôi phục được |

Vạch trái 3px chạy dọc mép thẻ — nhìn thấy ở đuôi mắt khi lướt lưới, không
chiếm chỗ nào của nội dung.

```
  ┃ ▸ vàng          ┃ ▸ cam ●        ┃ ▸ xanh         ┋ ▸ đỏ (đứt)     ┃ ▸ xám mờ
  ┃ Tiêu đề bài     ┃ Tiêu đề bài    ┃ Tiêu đề bài    ┋ T̶i̶ê̶u̶ ̶đ̶ề̶ ̶b̶à̶i̶   ┃ Tiêu đề bài
  ┃ 8 · claimed     ┃ 8 · claimed    ┃ 8 · verified   ┋ 3 · claimed    ┃ — · claimed
  ┃ · draft         ┃ · edited       ┃                ┋ · rejected     ┃ · (rác)
    draft             edited           approved         rejected         thùng rác
```

**Sáng/tối:** mỗi màu là **một cặp token** (`--tt-draft` / `--tt-draft-nen`),
định nghĩa ở `:root` và định nghĩa lại trong khối tối — không dùng `opacity`
để giả nền, vì `opacity` kéo cả chữ xuống và đã có cổng
`opacity-khong-pha-contrast.test.js` bắt đúng chỗ đó. Mọi cặp phải qua
`contrast-audit.json` ở **cả hai** hệ.

---

## Quyết định 2 — nút có BA hình, ứng ba vai

```
CHÍNH    ┏━━━━━━━━━━━━━━━━━┓   nền đặc, chữ nghịch đảo, viền 0
         ┃ ✓ Đưa lên site… ┃   MỘT nút duy nhất trên màn
         ┗━━━━━━━━━━━━━━━━━┛

THƯỜNG   ┌─────────┐             nền trong, viền mảnh, chữ --ink-2
         │ ✎ Sửa…  │             (ghost — dùng hằng ngày, không giành mắt)
         └─────────┘

NGUY     ┌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┐      nền trong, viền ĐỎ, chữ đỏ
         ╎ 🗑 Bỏ khỏi kho… ╎      hover mới đổ nền đỏ nhạt
         └╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┘
```

Nút nguy hiểm **không** đỏ đặc lúc nghỉ: một thanh chân có hai khối màu đặc thì
mắt không biết khối nào là việc chính, và đỏ đặc còn kéo mắt MẠNH hơn nút chính.
Đỏ ở viền là đủ để nói *"cẩn thận"*, và nó chỉ đậm lên khi tay đã tới nơi.

---

## Ma trận trạng-thái × nút — trọn vẹn, năm hàng

Cột trái → phải đúng thứ tự chúng nằm trên màn.

| Trạng thái | CHÍNH | THƯỜNG (giữa) | NGUY (phải, cách khoảng) | Nhãn chân |
|---|---|---|---|---|
| **nháp** (chưa vào kho) | `✓ Duyệt vào kho…` | `✎ Sửa ở hàng nháp…` · ☐ *Duyệt xong cho hiện trên site luôn* | `↩ Trả lại…` → `🗑 Bỏ nháp…` | `BẢN NHÁP` |
| **draft** | `✓ Đưa lên site…` | `✎ Sửa…` · `↩ Xem bài gốc…` · `⬇ Tải xuống ▾` | `✕ Loại…` → `🗑 Bỏ khỏi kho…` | `KHO — chưa lên site` |
| **edited** | `✓ Đưa lên site…` | như trên | `✕ Loại…` → `🗑 Bỏ khỏi kho…` | `KHO — chưa lên site` |
| **rejected** | `✓ Đưa lên site…` | như trên | *(không có ✕ Loại)* → `🗑 Bỏ khỏi kho…` | `KHO — chưa lên site` |
| **approved** | *(không nút)* nhãn `ĐANG TRÊN SITE` | như trên | `✕ Loại…` → `🗑 Bỏ khỏi kho…` | `ĐANG TRÊN SITE` |

Ba ô cần nói rõ vì chúng dễ bị hỏi lại:

- **`rejected` vẫn có nút chính `Đưa lên site`.** Loại là một phán quyết
  **thu hồi được**; bảng chuyển ở `web/api/status.mjs:62` cho đúng một đường
  `rejected → approved`. Bày nút ấy là bày đúng đường máy cho đi.
- **`rejected` KHÔNG có `✕ Loại`.** Loại một bài đã loại là một cú bấm không
  đổi gì — một nút không làm gì là một nút nói dối.
- **`approved` không có nút chính.** Việc đã xong; chỗ ấy thành nhãn. Nếu để
  `Đưa lên site` mờ đi (disabled) thì người vẫn phải rê chuột mới biết vì sao —
  một nhãn nói thẳng rẻ hơn.

---

## Thanh chân, hai bề rộng

**Rộng (> 640px)** — cụm nguy hiểm đẩy sát phải, cách bằng `margin-left:auto`
và một vạch dọc:

```
┌────────────────────────────────────────────────────────────────────────┐
│ ┏━━━━━━━━━━━━━━━┓  ┌──────┐ ┌───────────┐ ┌─────────────┐ │ ┌───────┐ ┌──────────────┐│
│ ┃✓ Đưa lên site…┃  │✎ Sửa…│ │↩ Bài gốc… │ │⬇ Tải xuống▾ │ │ │✕ Loại…│ │🗑 Bỏ khỏi kho…││
│ ┗━━━━━━━━━━━━━━━┛  └──────┘ └───────────┘ └─────────────┘ │ └───────┘ └──────────────┘│
│                                                     ↑ vạch + khoảng trống              │
│ KHO — chưa lên site                                                                    │
└────────────────────────────────────────────────────────────────────────┘
```

**Hẹp (≤ 640px)** — cụm nguy hiểm xuống **hàng riêng**, vẫn dồn phải, ngăn bằng
đường kẻ ngang. Không bao giờ chen vào giữa cụm thường:

```
┌──────────────────────────────────┐
│ ┏━━━━━━━━━━━━━━━┓                │
│ ┃✓ Đưa lên site…┃                │
│ ┗━━━━━━━━━━━━━━━┛                │
│ ┌──────┐ ┌───────────┐ ┌───────┐ │
│ │✎ Sửa…│ │↩ Bài gốc… │ │⬇ Tải▾ │ │
│ └──────┘ └───────────┘ └───────┘ │
│ ─────────────────────────────────│
│          ┌───────┐ ┌────────────┐│
│          │✕ Loại…│ │🗑 Bỏ khỏi… ││
│          └───────┘ └────────────┘│
│ KHO — chưa lên site              │
└──────────────────────────────────┘
```

---

## Chỗ CSS sống — và vì sao

Luật mới đi theo **`TX_CSS`** (tiêm từ chunk lúc dựng thanh chân), **không** vào
`prototype.css`. `gn.css` hiện `102 382 / 102 400` — dư đúng **18 byte**, và
`FR-061` cấm nới trần. Riêng **token màu trạng thái** thì vào `tokens.css`:
thẻ trong lưới do máy dựng trang vẽ, nó không chạy qua chunk nào.

Ước lượng: 5 cặp token ≈ 380 byte vào `tokens.css` ⇒ **`gn.css` vỡ trần CHẮC CHẮN** (dư 18 byte, cần 380).
Nên bước 2 phải kèm một khoản **cắt mỡ tương đương** trong `prototype.css`
(nợ `FR-061 §4` đang mở), hoặc wireframe này phải bỏ bớt một cặp token. Nói
trước để chủ dự án chọn, không để tới lúc cổng đỏ mới báo.

---

## Chốt — chủ dự án, 2026-09-06

1. **`draft` = xanh dương · `rejected` = đỏ.** Vàng bỏ khỏi bảng trạng thái;
   `edited` giữ cam (`--warn`), `approved` giữ xanh lá (`--success`).
2. **Tiêu đề bài `rejected` gạch ngang, và gạch MÀU ĐỎ** — không phải gạch màu
   chữ. Gạch đỏ nói *"phán quyết"*, gạch xám chỉ nói *"cũ"*.
3. **Mở trần `gn.css`** ⇒ `FR-068` (nới 102400 → 104448, `gn.js` không đổi).
   Nợ giảm béo `FR-061 §4` **không tick**.

### Hệ quả kỹ thuật của chốt 1 — bốn trong năm màu ĐÃ CÓ

Ba trạng thái dùng lại token ngữ nghĩa sẵn có, không đẻ token mới:

| Trạng thái | Token |
|---|---|
| `draft` | `--tt-draft` **(MỚI — xanh dương)** |
| `edited` | `--warn` (đã có) |
| `approved` | `--success` (đã có) |
| `rejected` | `--destructive` (đã có) |
| thùng rác | `--ink-3` (đã có) |

Không đặt `draft` bằng `--c-video` (cũng xanh dương): `--c-video` là màu của
**loại nguồn**, và mượn nó cho **trạng thái** là trộn hai chiều phân loại vào
một màu — ngày ai đó đổi màu video thì mọi bản nháp đổi màu theo, không ai
hiểu vì sao.

**Chưa duyệt ⇒ chưa code** — điều kiện `AC0` đã thoả.
