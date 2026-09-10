# FR-076 — ĐẢO `FR-027f`: năm điều khiển toàn app rời đáy rail lên header trang

- **Mở**: 2026-09-09 · **Người quyết**: chủ dự án · **Trạng thái**: DUYỆT (chính chủ dự án ra quyết định)
- **Artifact tầng trên bị đảo**: `FR-027f` §"ĐIỀU KHIỂN TOÀN APP xuống đáy rail"
- **Bề mặt**: `web/render/shell.html` · `web/plugins/home-pages/shell.html` ·
  `web/styles/prototype.css` · `web/test/rail-trai.test.js`
- **FROZEN**: không file nào trong phạm vi nằm trong `FROZEN.lock` (đo 2026-09-09: 0 khớp).
  FR này mở KHÔNG vì frozen mà vì `CLAUDE.md` §DỪNG: *"artifact đã chốt hoá ra sai"*.

## 1 · Quyết định cũ và vì sao nó được viết

`FR-027f` chốt: MOCK/REAL · ngôn ngữ · tone · ảnh nền **xuống đáy rail**, với lý lẽ
ghi thẳng trong `shell.html:64` và `prototype.css:2547`:

> *"Chúng là điều khiển TOÀN APP (nguồn dữ liệu, ngôn ngữ, nền), không thuộc
> trang đang xem, nên để ở `.ph` là sai vai. `.ph` giờ chỉ còn ô tìm + bộ đếm
> + nút nạp nguồn: ba thứ thuộc TRANG."*

Lý lẽ ấy **vẫn đúng về mặt nghĩa** và FR này không giả vờ ngược lại.

## 2 · Quyết định mới

Chủ dự án 2026-09-09 (kèm hai ảnh: gốc + vùng đích): chuyển cả **năm** điều khiển
— `#dmode` (REAL/MOCK) · `#lang` (VI/EN) · `#tb` (sáng/tối) · `#bgb` (đổi ảnh nền)
· `#bgp` (tạm dừng) — lên **header trang `.ph`**, nhóm `.ph-d`, bên phải.

**Vai đổi, không phải lý lẽ đổi**: `.ph` thôi là "header của TRANG" và trở thành
**thanh trên cùng của APP** — nó đã chứa ô tìm (tìm toàn kho, không phải tìm trong
trang) từ `FR-027c`, nên nó vốn đã lai vai. FR này khai rõ vai mới thay vì để hai
nghĩa cùng sống trong một phần tử.

## 3 · Hai thứ được, nói ra để lần sau không ai "sửa lại"

1. **Mobile có lại năm nút.** `prototype.css:2319` để `@media (max-width:720px)
   { .top .lg, .top .rail-d { display:none } }` — nghĩa là trên màn ≤720px người
   dùng **không đổi được** ngôn ngữ, tone, hay nguồn dữ liệu. Không ai khai đó là
   ý đồ; nó là hệ quả của việc rail nằm ngang dưới đáy trên mobile. Về `.ph` thì
   chúng sống ở mọi bề rộng.
2. **Byte giảm.** `.dmode` gốc (`prototype.css:868`) đã là `inline-flex` NGANG.
   Cả khối đè `.top .rail-d .dmode{flex-direction:column;width:44px…}` tồn tại
   chỉ vì cột 78px. Về header thì khối ấy **xoá được**.

## 4 · Cái mất

`.ph` nằm TRONG `.wrap` ⇒ nó cuộn theo nội dung, còn `.top` thì `position:fixed`.
Năm nút sẽ **trôi khỏi màn khi cuộn xuống**. Đây là cái giá thật của quyết định
này. Không xử trong FR này (không ai yêu cầu sticky); ghi vào backlog M03 để nếu
sau này thấy vướng thì đã có địa chỉ, không phải phát hiện lại.

## 5 · Cổng

`rail-trai.test.js:242` hiện đòi **mọi màn** có `class="rail-d"`. Vế đó là hiện
thân của quyết định cũ — nó phải ĐỔI CHỖ ĐO, không phải bị nới:

- cũ: rail có `.rail-d`
- mới: `.ph` có `.ph-d`, và **rail KHÔNG còn** `.rail-d` (kẹp hai phía — nới một
  phía thì một bản sao sót lại ở rail vẫn xanh)
- thêm: đủ **năm** id, và `.ph-d` đứng SAU `class="ph"` trong cùng trang

Thi công: `WO-073` · `T03-130`.
