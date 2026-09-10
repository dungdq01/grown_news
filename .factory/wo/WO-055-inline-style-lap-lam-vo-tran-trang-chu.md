# WO-055 — inline style lặp làm vỡ trần trang chủ

loại: cải tiến (trả nợ trần — `AC5` của `T03-112`)
module: M03_web
mức: hard

## Hiện tượng

```
$ cd web && npm test
FAIL trang chủ 60 KB (61915 / 61440 byte)
```

Vượt **475 byte**. Đây là vế duy nhất còn đỏ của `npm test` (279 vế khác xanh).

## Đo (2026-09-05, trên trang chủ dựng thật)

| | |
|---|---|
| `style=` inline | **176 thuộc tính · 6531 byte** — 65 giá trị duy nhất |
| nút nav | 7 · 545 byte |
| `data-i18n` | 35 · 755 byte |
| `<svg>` | 3 · 1045 byte |
| khối `cds` (T03-90) | 1 · 45 byte — `cat_khi_khac` CÓ cắt thật, không phải thủ phạm |

Mười giá trị `style=` lặp nhiều nhất, tất cả là **màu theo loại nguồn**:

```
x12  style="background:var(--c-video,var(--ink-2))"              46b
x10  style="background:var(--c-paper,var(--ink-2))"              46b
x8   style="border-top-color:var(--c-article,var(--ink-2))"      54b
x8   style="border-top-color:var(--c-paper,var(--ink-2))"        52b
x8   style="border-top-color:var(--c-video,var(--ink-2))"        52b
…
```

Gom mười giá trị này tiết kiệm **~3043 byte** — thừa sức trả 475.

## Vì sao đây là lỗi thật, không phải "trang nặng tự nhiên"

Mỗi thẻ bài hiện phát **HAI** inline cho **MỘT** dữ kiện — `source_type`:

- `style="border-top-color:var(--c-<loai>,var(--ink-2))"` ở `<button class="cd">`
- `style="background:var(--c-<loai>,var(--ink-2))"` ở `<b>` trong huy hiệu

Cùng một sự thật viết hai lần, ở mọi thẻ, trên mọi trang. Và thẻ **đã mang**
`data-loai="<loai>"` — dữ kiện ấy đã có mặt, chỉ chưa được dùng.

## Kỳ vọng

Trần trang chủ về xanh mà **không nới trần nào** và không bỏ nội dung người
dùng yêu cầu (mục `/chung-cat/` trên menu vẫn còn).

## Ràng buộc

`gn.css` đang 102272/102400 — dư **128 byte**. Lời giải phải vừa ngần ấy CSS,
nếu không thì trả nợ trang chủ bằng cách vỡ trần bundle chung (`FR-061` cấm).
