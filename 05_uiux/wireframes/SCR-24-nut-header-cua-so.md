# SCR-24 · Ba nút ở header cửa sổ — gọn, và màu nói trạng thái

> Chủ dự án 2026-09-08: *"các button Sinh transcript / chưng cất / cần
> transcript trước cần design lại position, tránh conflict khung tab thẻ…
> để ở vị trí ngang với header, nút cần gọn gàng có màu sắc. Nếu video/bài
> viết đã chưng cất/transcript rồi thì để màu chữ vàng, nếu chưa click active
> lần nào thì màu hồng"* · chốt **lối B**: *"B đi, nhưng gọn gàng dễ dùng nha"*
>
> **ĐÃ DUYỆT** — vị trí, lối B, và cách đọc màu đều chốt trong hội thoại.

---

## 0 · Đo cái đang chen

Ba nút **đã** ở header (`.bk-t` → `.ct`, cạnh `− □ ×`). Vấn đề không phải chỗ
đặt, mà là **độ dài nhãn**:

```
┌────────────────────────────────────────────────────────────┐
│ ▪ Hermes Agent: Zero to…   Sinh transcript  ⚗ cần transcript trước  − □ × │
├────────────────────────────────────────────────────────────┤
│ Xem │ Chưng cất │ Transcript          ← dải tab bị dồn sát │
└────────────────────────────────────────────────────────────┘
```

`Sinh transcript` + `⚗ cần transcript trước` = **36 ký tự** trong một hàng
tiêu đề. `.bk-t .tt` là `flex:1` với ellipsis, nên tiêu đề bị bóp trước — và
người đọc mất thứ nói *đang xem bản ghi nào*.

## 1 · Lối B — icon + nhãn NGẮN

| nút | trước | sau |
|---|---|---|
| sinh transcript | `Sinh transcript` | `♫ Transcript` |
| chưng cất | `Chưng cất` | `⚗ Chưng cất` |
| chưa đủ điều kiện | `⚗ cần transcript trước` | `⚗ cần transcript` |

Bỏ chữ `Sinh` và `trước`: cả hai là thứ **câu title đã nói** (`title=` giữ
nguyên văn dài). Icon gánh phần nghĩa mất đi — `♫` = âm thanh→chữ, `⚗` = chưng
cất, cùng bảng ký hiệu `DAU_LOAI` mà thẻ việc đã dùng.

Không chọn lối A (chỉ icon): một nút **tiêu token thật** thì không nên là một
ký tự. Cửa sổ hẹp nhất là 380px và lối B vẫn vừa.

## 2 · MÀU — chiều HÀNH ĐỘNG, không phải chiều trạng thái bản ghi

```
   hồng  --brand    chưa làm lần nào      →  "đây là việc nên bấm"
   vàng  --warn     ĐÃ có rồi             →  "bấm nữa là tiêu token lần nữa"
   mờ    --ink-3    chưa đủ điều kiện     →  disabled, không mời bấm
```

**Vì sao hai token ấy KHÔNG phải mượn màu:**

- `--warn` đang nghĩa *cảnh báo*. Và *"đã chưng cất rồi"* **là** một cảnh báo
  thật — bấm lại là một lần gửi nữa, một lần tiêu token nữa. Nó không mượn
  nghĩa, nó dùng đúng nghĩa.
- `--brand` đang nghĩa *hành động chính · tab đang mở*. `--brand` cho *"chưa
  làm"* đúng vai call-to-action.

Và nó **không phạm** luật *"không mượn màu của chiều phân loại khác"*: `SCR-20`
khoá chiều **trạng thái bản ghi** (draft xanh dương · rejected đỏ). Đây là
chiều **hành động** — hai chiều rời nhau, hai bảng màu rời nhau.

**Trạng thái thứ ba giữ MỜ, không hồng.** Hồng nghĩa *"bấm được, chưa làm"*;
nút `cần transcript` **chưa bấm được**. Sơn hồng nó là mời một cú bấm dẫn tới
409 — đúng thứ `T03-123` sinh ra để chặn.

## 3 · Tín hiệu "ĐÃ CÓ" lấy ở đâu — hai nút, hai nguồn

| nút | biết ngay? | nguồn |
|---|---|---|
| `♫ Transcript` | **CÓ** | `coTranscript(ban)` — hiện vật `text/vtt` trên `media[]` |
| `⚗ Chưng cất` | **KHÔNG** | phải tra `/api/index` (`banChungCatCua`) — một bản ghi chưng cất được NHIỀU lần, không suy từ slug |

⇒ Nút chưng cất vẽ **hồng trước**, rồi `veNutBanChungCat` (đã có sẵn, đã fetch
đúng danh sách ấy cho nút chân cửa sổ) **sơn vàng sau** khi mạng trả lời.

Không chặn header chờ mạng: một tiêu đề trống nửa giây tệ hơn một nút đổi màu
nửa giây sau. Cùng lý lẽ `veNutBanChungCat` đã ghi cho nút chân.

## 4 · Ngân sách — chỗ hẹp nhất của cả đợt

| | |
|---|---|
| `gn.css` | 104 301 / 104 448 — còn **147 byte** |
| `gn.js` | 102 400 / 102 400 — còn **0 byte** |

⇒ CSS chỉ được **~140 byte**: hai luật màu, không hơn.
⇒ JS phải **≤ 0 byte ròng**. Nhãn ngắn lại trả về byte (`Sinh transcript` →
`♫ Transcript` tiết kiệm; `trước` bỏ đi tiết kiệm), và phần thêm là class +
một dòng sơn màu. Nếu ròng vẫn dương ⇒ **DỪNG, mở FR nới trần** — không lặng
lẽ nhét vào rồi để `page-weight` đỏ.

## 5 · Bốn AC đo được

1. nhãn ba nút đúng `♫ Transcript` · `⚗ Chưng cất` · `⚗ cần transcript`
2. `coTranscript(ban)` quyết màu nút transcript **tại lúc render**, không chờ mạng
3. nút chưng cất được sơn vàng bởi `veNutBanChungCat` khi `ds.length > 0`
4. `gn.css` và `gn.js` KHÔNG vượt trần — đo bằng `page-weight.test.js`

---

## 6 · Kết cục của §4 — điểm dừng ĐÃ nổ, và nó nổ đúng chỗ

Đo sau khi cổng xanh: `gn.js` **102 625 / 102 400** (vượt 225) · `gn.css`
**104 439 / 104 448** (còn 9). Đúng ca §4 khai trước, nên tôi DỪNG và mở
`FR-074` thay vì để `page-weight` đỏ.

Chủ dự án duyệt cùng ngày. Trần nay `{css: 104, js: 102}`, sửa MỘT chỗ
(`TRAN_KB`) vì công thức trần-mỗi-trang đã đọc cùng hằng ấy từ 2026-09-07.

Ghi lại để lần sau không phải đoán: **viết ngưỡng dừng vào wireframe TRƯỚC khi
code là thứ đã cứu lượt này.** Không có nó thì lựa chọn lúc thấy 225 byte vượt
sẽ là *"nhét thêm rồi tính sau"*.
