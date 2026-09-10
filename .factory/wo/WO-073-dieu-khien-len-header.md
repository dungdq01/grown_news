# WO-073 — Chuyển bộ điều khiển toàn app từ đáy rail lên header trang

- **Loại**: cải tiến UI (chủ dự án yêu cầu) · **Module**: M03_web · **Mức**: hard
- **FR**: `FR-076` (đảo `FR-027f`) — mở TRƯỚC, vì đây là đảo quyết định đã chốt
- **Task**: `T03-130`

## Yêu cầu nguyên văn

> *"làm thêm task chuyển bộ component thanh sidebar lên trên header đi (ảnh 1 là
> gốc, ảnh 2 là vùng tôi muốn ném nó lên) — các button Real/mock, VI/en, đổi
> sáng tối, ảnh nền ..."*

## Repro — trạng thái hiện tại

```
$ grep -n 'rail-d' web/render/shell.html
70:  <div class="rail-d">        # trong <header class="top"> = RAIL DỌC 78px
```
Năm phần tử: `#dmode` · `#lang` · `#tb` · `#bgb` · `#bgp`.

```
$ grep -n 'max-width:720px' -A6 web/styles/prototype.css | grep rail-d
2319:  .top .lg,.top .rail-d{display:none}
```
⇒ trên mobile năm nút **biến mất hoàn toàn**. Đây là bug đi kèm, FR-076 §3.1.

## Kỳ vọng

Năm điều khiển nằm trong `.ph`, nhóm `.ph-d`, bên phải, ở **mọi màn** và **mọi bề
rộng**. Rail không còn `.rail-d`.

## Ràng buộc

- Ba chỗ bind là **delegated trên `document`** (`backdrop.inline.ts:106,115` ·
  `multiwindow.inline.ts:608,613` dùng `t.closest("#…")`) ⇒ đổi chỗ trong DOM
  KHÔNG cần sửa một dòng JS nào. Kiểm bằng cổng, không bằng niềm tin.
- `#dmode` mount qua `chen(shell,"dmode",…)` (`trang.mjs:1235`) — theo TÊN, không
  theo vị trí ⇒ cũng không đổi.
- **HAI shell byte-identical** (`web/render/shell.html` và
  `web/plugins/home-pages/shell.html`, cùng 63 078 B). Sửa một cái là để lại một
  bản sao mang markup cũ — cổng phải kẹp cả hai.
- `page-weight` **đang ĐỎ trước đơn vị này** (chủ: `WO-055`). Đơn vị này phải
  byte-**âm** hoặc trung tính, không được cộng thêm vào món nợ người khác.
