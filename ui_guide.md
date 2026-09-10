
# Grown_news — Hệ giao diện "Kính trên ảnh"

Tài liệu này mô tả cách dựng UI của `trang-chu.html` để áp cho toàn bộ app.
Bản tham chiếu đầy đủ (4 màn + cửa sổ đọc): `Grown-news-app.dc.html`.

---

## 1. Nguyên tắc

Bốn tầng chồng lên nhau, mỗi tầng một việc:

| z-index | Tầng                 | Vai trò                                       |
| ------- | --------------------- | ---------------------------------------------- |
| 0       | Ảnh phong cảnh      | Chiều sâu, trôi chậm khi cuộn             |
| 1       | Màn phủ (veil)      | Kéo tương phản chữ về mức đọc được |
| 2       | Canvas hạt 3D        | Chuyển động nền, báo "hệ đang sống"    |
| 3       | Loé sáng + vignette | Gom mắt về giữa                             |
| 5+      | Nội dung             | Panel kính, đọc trên nền tối             |
| 40      | Thanh điều hướng  | Luôn nổi trên cùng                         |

Quy tắc bất di: **ảnh không bao giờ chạm chữ trực tiếp.** Giữa hai thứ luôn có
veil và một panel kính. Nếu chữ khó đọc, tăng `--veil` chứ không đổi màu chữ.

Màu chỉ dùng làm nét, không làm mảng. Đỏ `#C81E1E` là mực in — dùng cho một
điểm nhấn mỗi vùng, không nhiều hơn.

---

## 2. Token

41 biến CSS đặt trên `#root`, chia hai bộ sáng/tối. **Không viết hex trực
tiếp trong markup** — mọi màu đi qua `var(--*)`.

```css
#root{
  /* chữ: đậm → nhạt */
  --t1:#f2f2f0; --t2:#b8b8c0; --t3:#9a9aa4; --t4:#7c7c86;
  /* mặt panel */
  --pn:rgba(20,22,25,.6);      /* panel kính lớn, có blur */
  --pn2:rgba(20,22,25,.52);    /* ô con trong panel */
  --pns:rgba(17,19,22,.86);    /* thẻ nhỏ, KHÔNG blur — xem §6 */
  --rail:rgba(14,15,17,.72);   /* thanh điều hướng */
  /* nét */
  --edge:rgba(255,255,255,.10);  /* viền panel */
  --div:rgba(255,255,255,.07);   /* gạch chia trong panel */
  --hov:rgba(255,255,255,.06);   /* nền khi rê chuột */
  /* ngữ nghĩa */
  --pri:#f87171; --ok:#4ade80; --warn:#fbbf24;
  /* đổ bóng: 3 nấc */
  --e1:…; --e2:…; --e3:…;
  --etop:inset 0 1px 0 rgba(255,255,255,.09);  /* gờ sáng mép trên */
  --gloss:linear-gradient(157deg,rgba(255,255,255,.11),rgba(255,255,255,.03) 34%,rgba(255,255,255,0) 64%);
  --veil:radial-gradient(120% 90% at 68% 8%,…);
  --rootbg:#0b0c0e;
  /* chip theo loại nguồn: p=paper, v=video, r=repo */
  --chip-p-b/-f/-e; --chip-v-b/-f/-e; --chip-r-b/-f/-e;
  /* mặt khối 3D: t=nóc, f=mặt trước, s=mặt hông */
  --b1t/-f/-s; --b2t/-f/-s; --b3t/-f/-s;
  --gridline; --planeb;
}
```

Hai bộ đầy đủ nằm trong biến `DARK` / `LIGHT` ở cuối `trang-chu.html`.

> **Bẫy đã gặp:** đặt token trong `style=""` inline thì trình duyệt lược mất.
> Token phải nằm trong một rule CSS thật (`#root{…}`).

### Đổi chế độ

```js
function applyTheme(){
  var set = light ? LIGHT : DARK;
  for (var k in set) root.style.setProperty(k, set[k]);
  bgDark.style.opacity  = light ? '0' : '1';
  bgLight.style.opacity = light ? '1' : '0';
}
```

Luôn `setProperty` cho **cả hai** chế độ. Đừng dùng `removeProperty` để về tối.
Mỗi chế độ có bộ ảnh nền riêng, đổi bằng opacity 0.6s.

---

## 3. Chữ

Inter, `font-variant-numeric: tabular-nums` đặt ở gốc (mọi con số thẳng cột).

| Vai trò        | Cỡ                        | Đậm    | Ghi chú                      |
| --------------- | -------------------------- | -------- | ----------------------------- |
| Tít nổi bật  | `clamp(30px,3.1vw,44px)` | 600      | `letter-spacing:-.025em`    |
| Tít thẻ lớn  | 20px                       | 600      | `-.015em`                   |
| Tít thẻ nhỏ  | 15.5px                     | 600      | `-.012em`                   |
| Số liệu       | 27–34px                   | 600      | `-.02em`, `line-height:1` |
| Thân           | 15–16px                   | 400      | `line-height:1.55–1.68`    |
| Nhãn vùng     | 12px                       | 600      | `letter-spacing:.13em`, HOA |
| Siêu dữ liệu | 10.5–12.5px               | 500–600 | `.09–.16em`, HOA           |

Chữ càng nhỏ giãn càng rộng. Mọi nhãn HOA phải có `white-space:nowrap`.

---

## 4. Panel kính

Công thức duy nhất, đổi bán kính theo cỡ:

```html
<div style="padding:26px 28px;border-radius:20px;
            background:var(--pn);background-image:var(--gloss);
            backdrop-filter:blur(14px);
            border:1px solid var(--edge);
            box-shadow:var(--e2),var(--etop)">
```

Bốn thứ tạo cảm giác kính iPhone, thiếu một là hỏng:

1. `--gloss` — vệt sáng chéo 157°, giả phản chiếu nguồn sáng trên cao
2. `--etop` — gờ sáng 1px mép trên, giả bề dày vật liệu
3. `--edge` — viền 1px
4. `backdrop-filter: blur()` — làm nhoè cái phía sau

Bán kính: panel lớn 20px · thẻ 16px · nút/chip 10–11px · ô nhỏ 6px.

Đầu bảng có thanh 2px chỉ loại nguồn:
`linear-gradient(90deg,#c81e1e,rgba(200,30,30,0))`.

---

## 5. Ba vòng tự chuyển

Trang chủ tự chạy, không cần chạm:

| Vòng | Chu kỳ | Cơ chế |
| ------------- | ------- | ----------------------------------------------------------------------------- |
| Tin nổi bật | 6s | 3`<article data-feat>` chồng `grid-area:1/1`, đổi opacity + translateY |
| Biểu đồ | 5s | 3`<div data-pane>` chồng, pane 0 là khối 3D, pane 1–2 là thanh ngang |
| Ảnh nền | 7s | 3`<div data-bg data-i>` mỗi chế độ, crossfade 1.4s |

Hai điều kiện dừng bắt buộc:

```js
if (!hover && !document.hidden) show(next);
```

`hover` bật khi chuột vào vùng tin nổi bật — người đang đọc thì không được
cướp nội dung khỏi tay họ. `document.hidden` chặn chạy nền khi đổi tab.

Mỗi vòng có nút bấm tay (`[data-dot]`, `[data-tab]`) gọi cùng hàm `show*(i)`.

---

## 6. Hiệu năng — bốn ràng buộc

Đây là chỗ dễ làm lag nhất. Bốn con số dưới đây đã đo và chốt:

**a. Đếm số lớp `backdrop-filter`.** Mỗi lớp bắt trình duyệt chụp lại nền phía
sau mỗi khung hình. Nền lại đang có canvas chạy → nhân lên. Chỉ panel lớn và
thanh điều hướng được dùng blur. Thẻ nhỏ (4 thẻ "Kho gần đây") dùng `--pns`
đặc hơn, **không blur** — nhìn gần như y hệt, rẻ hơn nhiều.

**b. Không `saturate()` kèm `blur()`.** Thêm một lượt xử lý nữa. Blur 14px là
đủ, không cần 24px.

**c. Không `mix-blend-mode` trên lớp phủ toàn màn.** Đặc biệt là lớp có
`animation`. Lớp loé sáng để tĩnh, `opacity:.5`.

**d. Canvas hạt: 120 hạt · DPR 1 · 30fps.**

```js
var raf, last = 0, FRAME = 1000/30;
function step(t){
  raf = requestAnimationFrame(step);
  if (document.hidden || t - last < FRAME) return;   // chốt chặn
  last = t;
  …
}
```

DPR 1 là đủ — hạt mờ, không ai soi pixel. Nối tối đa 2 hàng xóm mỗi hạt
(`j < i+3`), không phải 4.

Ngoài ra: handler cuộn throttle bằng `requestAnimationFrame` + cờ `tick`, và
thoát sớm nếu không ở màn chủ.

---

## 7. Chuyển động khi cuộn

Ba lớp, ba tốc độ — càng xa càng chậm:

```js
photo.style.transform = 'translate3d(0,' + (y*0.07) + 'px,0) scale(1.03)';
hero.style.transform  = 'perspective(1800px) rotateX(' + (p*2.6) + 'deg) translateY(' + (-y*0.028) + 'px)';
tower.style.transform = 'rotateX(' + (60-q*7) + 'deg) rotateZ(' + (-38+q*10) + 'deg)';
```

`q` là vị trí khối 3D so với tâm màn hình, khoảng `-1…1` — khối tự xoay nhẹ
theo tầm mắt.

Panel hiện dần qua `IntersectionObserver` (`threshold: 0.12`), lệch nhau 80ms.
Số đếm lên và khối 3D dựng cao chỉ chạy **một lần**, khi vùng đó vào tầm nhìn.

---

## 8. Khối 3D thuần CSS

Không WebGL. Mỗi cột là 3 mặt trong một `transform-style:preserve-3d`:

```html
<div data-bar="118" style="position:absolute;left:24px;top:44px;
     width:52px;height:52px;transform-style:preserve-3d">
  <!-- nóc -->
  <div style="position:absolute;inset:0;background:var(--b1t);
              transition:transform .9s cubic-bezier(.22,.9,.3,1)"></div>
  <!-- mặt trước -->
  <div style="position:absolute;left:0;top:0;width:52px;background:var(--b1f);
              transform-origin:top left;transform:translateY(52px) rotateX(90deg);
              transition:height .9s …"></div>
  <!-- mặt hông -->
  <div style="position:absolute;left:0;top:0;height:52px;background:var(--b1s);
              transform-origin:top left;transform:translateX(52px) rotateY(-90deg);
              transition:width .9s …"></div>
</div>
```

Mặt bằng nghiêng `rotateX(60deg) rotateZ(-38deg)`, `perspective:1500px`.
Dựng cao bằng cách đổi ba giá trị cùng lúc: nóc `translateZ(h)`, trước
`height:h`, hông `width:h`. Ba màu (nóc/trước/hông) giả một nguồn sáng cố định.

---

## 9. Áp cho màn khác

**Điều hướng.** Rail trái 78px cố định. Mục đang mở: `background:var(--hov)` +
`--gloss` + chữ `--t1`. Mục còn lại: nền trong suốt, chữ `--t3`.

**Bố cục nội dung.** `padding-left:78px` → `max-width:1280px;margin:0 auto` →
`padding:0 48px`. Cả rail lẫn khung giữa phải giữ đúng để không lệch.

**Ba màn còn lại đều là panel kính trong khung đó:**

| Màn | Cấu trúc |
| ------------- | ----------------------------------------------------------------- |
| Tất cả bài | 1 panel, lưới 3 cột thẻ, có select lọc/sắp |
| Chờ duyệt | 1 panel hẹp (`max-width:840px`), danh sách hàng + nhóm nút |
| Khái niệm | 2 panel, trái là thanh ngang, phải là danh sách chờ |

**Cửa sổ đọc.** `position:fixed`, kéo bằng header, giãn bằng 8 tay nắm quanh
mép, `z-index` tăng dần khi bấm vào. Thu nhỏ thì xuống dock góc dưới. Thân chia
`200px` mục lục + bài viết, mục lục sticky và tự sáng theo vị trí cuộn.

**Vào màn mới cần gọi lại:** `initMotion()` (dựng lại observer), `showFeat()`,
`showPane()`, và gắn lại listener cuộn cho panel mới.

---

## 10. Danh sách kiểm trước khi ship

- [ ] Token nằm trong rule CSS thật, không phải `style=""` inline
- [ ] `applyTheme()` `setProperty` cả hai chế độ
- [ ] Không có hex nào viết thẳng trong markup ngoài `#c81e1e` của logo
- [ ] Mọi nhãn HOA có `white-space:nowrap`
- [ ] Thẻ nhỏ dùng `--pns`, không `backdrop-filter`
- [ ] Canvas ≤120 hạt, DPR 1, có chốt `document.hidden` và `FRAME`
- [ ] Vòng tự chuyển dừng khi `hover` và khi `document.hidden`
- [ ] Handler cuộn throttle bằng rAF
- [ ] Không `url()` trỏ vào file chưa có (404) — để `data-src` chờ điền
- [ ] `prefers-reduced-motion` tắt mọi animation, số hiện thẳng giá trị cuối

---

## 11. Ảnh nền

Cần 6 ảnh, ≥1920×1080, đặt trong `assets/`:

```
bg-dark-1.jpg   bg-dark-2.jpg   bg-dark-3.jpg
bg-light-1.jpg  bg-light-2.jpg  bg-light-3.jpg
```

Chọn ảnh có vùng giữa đều màu, ít chi tiết vụn — chữ nằm đè lên đó. Ảnh chế độ
tối nên có độ sáng trung bình ≤110; ảnh chế độ sáng ngược lại, cần sáng và nhạt.

Hiện `trang-chu.html` mới có một ảnh (`assets/bg-light.jpg`). Năm chỗ còn lại
để `data-src` kèm chú thích — bỏ chú thích khi đã có file.
