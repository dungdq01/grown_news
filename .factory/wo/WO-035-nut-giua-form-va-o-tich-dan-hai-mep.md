# WO-035 — Nút "Ghi vào kho" nằm GIỮA form · ô tích Chủ đề/Khái niệm dàn ra hai mép

loại: bug (người dùng THẤY được) — hai lỗi trên cùng một màn
module: M03_web
mở_bởi: người dùng, 2026-08-29 — *"button ghi vào kho để ở dưới cùng chứ"* + một
  ảnh: `aitalkshow` sát mép trái, `ml` sát mép phải, khoảng trống mênh mông ở giữa

## Repro

1. `npm run api`, mở `localhost:8787/tai-lieu/nap/` (và `/video/nap/`)
2. Nhìn thứ tự: nút **Ghi vào kho** hiện ra giữa "Một câu tóm tắt" và "Tiêu đề"
3. Nhìn hàng **Chủ đề** / **Khái niệm**: hai ô tích bị đẩy ra hai mép

## §1 · Nút ở giữa form

Đo vị trí trong DOM (offset ký tự trong vùng view):

| màn | nút | title | cat | cpt |
|---|---|---|---|---|
| `nap-tai-lieu` | tv-gui **1621** | 1739 | 2102 | 2264 |
| `nap-video` | vd-gui **1326** | 1444 | 1801 | 1963 |
| `nap-bai-viet` | f-gui 7477 | 4515 | 5760 | 6394 |

Màn bài viết là bản ĐÚNG: nút đứng cuối, bọc trong `.f-act`. Hai màn kia kẹt nút
bên trong khối `#tv-meta` / `#vd-meta` — khối này đứng TRƯỚC bốn trường, nên nút
hiện ra giữa form.

Khối đó còn mang `hidden` cho tới khi chọn file / dán link, tức nút cũng ẩn theo.
Không cần: `ghiBanGhiThuVien()` đã có chốt `"Chưa nạp tài liệu nào."` và
`ghiVideo()` có `LOI_HOST` — cùng lối WO-018 đã đưa mô tả + hai ô nhãn ra ngoài
khối ẩn.

## §2 · Ô tích dàn ra hai mép — nguyên nhân đã ĐO, không phỏng đoán

`getComputedStyle(#tv-cat)` trên Chromium, trước khi sửa:

```
display: flex · justify-content: space-between · gap: 8px
nhãn 1 `aitalkshow`  646..736
nhãn 2 `ml`         1237..1276      ⇒ cách nhau 501px
```

Mốc `.f-chon` là một **`<span>` con trực tiếp của `.f-row`**. Luật dành cho NHÃN
của hàng rơi trúng nó:

```css
.f-row > span{…display:flex;gap:var(--s-2xs);justify-content:space-between}
```

Độ cụ thể `0-1-1` (một class + một thẻ) **đè** luật của chính mốc,
`.f-chon` `0-1-0` — nên `flex-wrap:wrap` sống sót còn `gap` bị thay và
`justify-content:space-between` được thêm vào. `flex-wrap` một mình không dàn hai
mép; `justify-content` mới dàn.

Ba luật giẫm, đo bằng `document.styleSheets` + `el.matches()`:

| dòng | bộ chọn | giẫm |
|---|---|---|
| `prototype.css:1096` | `.f-row > span` | `justify-content` · `display` · `gap` |
| `prototype.css:1465` | `.f-row > span` | `display` · `gap` |
| `prototype.css:1524` | `.f-nhom .f-row > span` | `display:block` (≥1200px) |

Dòng 1524 giải thích vì sao màn **bài viết** ở màn rộng không thấy lỗi: ở đó mốc
bị ép `display:block` nên `justify-content` vô nghĩa — nhưng cũng mất luôn `gap`
của chính nó. Dưới 1200px thì màn bài viết dàn hai mép y hệt hai màn kia.

## Mức

`hard` — cả hai vế đo được: §1 bằng thứ tự trong DOM, §2 bằng cặp markup + CSS.
