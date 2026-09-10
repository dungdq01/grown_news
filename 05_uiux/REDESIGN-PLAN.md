# Kế hoạch design lại — v2

> Bản v1 bị bác. Ghi lý do thất bại **trước** giải pháp, vì làm lại mà không biết
> hỏng ở đâu thì chỉ đổi màu rồi hỏng lại.
>
> Trạng thái (**2026-08-24**): tham khảo **đã có** — `ui_guide.md` +
> `trang-chu.html`. Mục 3 và 4 **đã viết lại** theo cái đã chốt. Đang ở nhịp C
> của §5: **Trang chủ dựng xong** (FR-027e), 5 màn còn lại chưa dựng — đúng luật
> *"nhịp C chỉ dựng MỘT màn"*.
>
> Việc còn nợ, ghi thẳng: **§3.3 chưa đạt** (`var(--brand)` còn 65 chỗ, ý định là
> "một khoảnh khắc mỗi màn") · **trang bài** chưa dựng lại lưới bất đối xứng.

---

## 1 · Vì sao v1 hỏng

Tôi dựng đúng **đặc tả** nhưng không dựng ra thứ **đẹp**. Wireframe và token là
ràng buộc, không phải thiết kế. Tôi coi "thoả đủ ràng buộc" là xong — đó là chỗ sai.

Đối chiếu với `design-taste-frontend` §0.D và §4, v1 mắc đúng danh sách
**AI-slop defaults** mà skill đó liệt kê:

| # | Luật bị vi phạm | v1 làm gì | Nguồn |
|---|---|---|---|
| 1 | Inter **discouraged as default** | Dùng Inter, lý do "dễ đọc đa nền tảng" — đó là lý do mặc định, không phải lựa chọn | §4.1 |
| 2 | Anti-center bias khi `VARIANCE > 4` | Mọi màn một cột căn giữa. Không một bố cục bất đối xứng nào | §4.3 |
| 3 | Card chỉ dùng khi elevation mang **hierarchy thật** | Card ở khắp nơi: metadata, tinh túy, skill, kết quả tìm | §4.4 |
| 4 | Section-Layout-Repetition Ban | Trang chủ: 3 khối đều là danh sách dọc. Không đổi layout family | §4.7 |
| 5 | Eyebrow ≤ 1 mỗi 3 section | Mọi section đều có nhãn uppercase tracking | §4.7 |
| 6 | Long list cần **component khác**, không phải list dài hơn | 9 mục thân bài đổ thành một cột chữ liên tục | §4.9 |
| 7 | Motion | Không có gì. `MOTION_INTENSITY = 0` | §5 |
| 8 | Shape consistency lock | Radius 4/6/8 dùng lẫn không có luật | §4.4 |

**Chẩn đoán một câu**: v1 là bản *trình bày dữ liệu*, không phải bản *thiết kế*.
Mọi khối đều là hộp chứa nội dung xếp dọc; không có nhịp, không có tương phản cỡ,
không có khoảnh khắc nào bắt mắt dừng lại.

### Điều v1 làm ĐÚNG — giữ lại

Không vứt hết. Ba thứ đã kiểm bằng máy và vẫn đúng:

- **Palette đỏ/trắng, 26/26 pass WCAG AA** — kể cả 3 phát hiện về đỏ light≠dark,
  nút dark cần token riêng, cảnh báo tách bằng hue. Đây là ràng buộc kỹ thuật,
  không phải thẩm mỹ.
- **Cấu trúc thông tin**: 7 khối trang bài theo mức cam kết tăng dần, 3 khối trang
  chủ, luật hiển thị (chỉ `approved`, gộp `url_normalized`, sắp theo `priority`).
- **Data contract v1** — 8 bản ghi phủ edge case, đã kiểm số.

**Cái cần làm lại là *ngôn ngữ thị giác*, không phải kiến trúc thông tin.**

---

## 2 · Design Read — theo §0.B của taste-skill

> **Reading this as:** editorial knowledge archive cho một kỹ sư đọc sâu, với
> ngôn ngữ *technical-editorial* (không phải SaaS landing, không phải digital
> garden), leaning toward bố cục báo in — lưới bất đối xứng, tương phản cỡ chữ
> mạnh, đỏ dùng như mực in chứ không như nút bấm.

**Vì sao không phải landing page**: đây là nơi **đọc**, không phải nơi convert.
Không CTA, không social proof, không pricing. Tiêu chí thành công là *đọc hết
1500 từ mà không mỏi*, không phải *bấm nút*.

**Vì sao không phải digital garden**: có biên tập, có trạng thái duyệt, có thứ
hạng. Là toà soạn, không phải vườn.

### Ba dial — §1

| Dial | v1 | v2 đề xuất | Vì sao |
|---|---|---|---|
| `DESIGN_VARIANCE` | ~3 | **7** | Editorial cho phép bất đối xứng. Preset "Editorial/Blog" là 6; đẩy lên 7 vì v1 quá phẳng |
| `MOTION_INTENSITY` | 0 | **3** | Nội dung đọc sâu — motion chỉ để định hướng, không để trình diễn |
| `VISUAL_DENSITY` | 4 | **3** | Nội dung dày chữ ⇒ layout phải thoáng để bù |

Preset gốc cho Editorial/Blog là `6 / 4 / 3`. Tôi đẩy VARIANCE lên 7 và hạ MOTION
xuống 3 — có chủ ý, không phải lệch mặc định.

---

## 3 · Việc phải làm — **đã có tham khảo, đã chốt**

> Mục này viết khi *chưa* có tham khảo nên mọi thứ để mở. Tham khảo đã tới
> (xem §4). Dưới đây là **cái đã chốt** và **bằng chứng ở đâu** — không phải
> phương án nữa.

### 3.1 · Typography — **giữ Inter, một họ duy nhất** *(FR-018)*

Chốt khác dự đoán của mục này. Bốn cặp font từng liệt kê **không dùng cái nào**:
`--f-ui: 'Inter', system-ui, …` là họ chữ duy nhất, mono chỉ còn ở **mã thật**.

Lý do: `ui_guide` không đòi đổi họ chữ; nó đòi **thang** và **giãn chữ**. Đổi font
là đổi thứ người đọc nhận ra tờ báo bằng, để lấy một thứ tham khảo không hề yêu
cầu. Cái sai đo được không phải Inter mà là **thang**:

| | Trước | Sau | FR |
|---|---|---|---|
giãn nhãn HOA `--tr-lb` | `.06em` (= 0.72px ở 12px — mắt gần như không thấy) | **`.12em`** | FR-027d |
số liệu KPI | `--fs-hero` 40px — **to hơn tít**, ngược thứ tự đọc | `--fs-h1` 32px + `line-height:1` | FR-027d |
tít nổi bật | cỡ cố định | `clamp(30px,3.1vw,44px)` | FR-027e |

**Thang chữ** (1.25, neo 17px, cột 640px) **giữ nguyên** — phần tính toán của v1
đúng, và neo không cần đổi vì họ chữ không đổi.

### 3.2 · Bố cục — **Trang chủ xong, trang bài còn nợ**

**Trang chủ — chốt theo `trang-chu.html`** (FR-027e). Xem bảng cấu trúc ở FR-027e;
điểm chính: khung nội dung tách **hai lớp** · vùng Nổi bật **bỏ panel bọc**, 2 cột
+ `perspective`, 3 thẻ **xếp chồng** · KPI **2×2** · biểu đồ 1 → **3 pane chồng**
+ khối 3D ba tầng transform.

Yêu cầu *"3 khối phải là 3 layout family khác nhau"* của §4.7 **vẫn giữ** và giờ
có răng canh: `four-screens.test.js` đòi đủ 4 họ `brk-g / nw / kpi / grid` — và
nó đếm **VÙNG**, không đếm `.pn`, vì FR-027e bỏ panel bọc ở hai vùng nên `.pn`
thành chi tiết triển khai, không còn là mốc đo được.

**Trang bài — CHƯA LÀM.** Lưới bất đối xứng (cột trái neo + cột phải đọc) vẫn là
việc mở. Có sẵn một phần: `.bk-toc` là cột mục lục dính (`position:sticky`) trong
cửa sổ đọc. Còn thiếu: thanh tiến độ đọc, và **mục 6 Tinh túy** vẫn là 5 thẻ
giống hệt nhau.

**5 màn còn lại** (`v-all`, `v-queue`, `v-kho`, `v-concepts`, `v-nap`) — chưa dựng,
đúng luật §5. `v-nap` là **249 dòng / 36 control** và `ui_guide` không có công
thức nào cho form, nên nó cần bàn riêng.

### 3.3 · Đỏ — **vẫn chưa đạt**, nói thẳng

Palette giữ nguyên như dự kiến (`#C81E1E` đã pass WCAG; ràng buộc binding ở bản
sáng chính là nó, nên `glass_alpha` sáng bị chặn ở `.8` — **không** hạ đỏ để lấy
độ trong).

Nhưng ý định *"đỏ tập trung vào một khoảnh khắc mỗi màn"* thì **chưa đạt**:
`var(--brand)` xuất hiện **65** lần trong `prototype.css`. Đo được, nên không cần
tranh luận. Có tiến bộ đúng hướng — thanh 2px đầu panel dùng **gradient mờ dần**
chứ không phải vạch đặc, vì *"màu chỉ dùng làm nét, không làm mảng"* (`ui_guide §1`)
— nhưng **tần suất** vẫn là việc chưa làm, và chưa có răng nào canh nó.

### 3.4 · Motion — **MOTION_INTENSITY 3, đã dựng**

Không phải 3 thứ như dự kiến ban đầu mà là 5, và mỗi thứ có lý do từ `ui_guide`:

| | Ở đâu |
|---|---|
parallax ảnh nền (hệ số `.07`) | FR-027d · `backdrop.inline.ts` |
reveal-on-scroll (đếm số · dựng cột) | FR-027e · `IntersectionObserver` |
2 vòng tự chuyển (6s tin · 5s biểu đồ) | FR-027e — **nới `DESIGN.md §9`**, giới hạn đóng ghi ở đó |
mục lục dính + đánh dấu mục đang đọc | `.bk-toc` |

**Chưa có**: thanh tiến độ đọc · canvas hạt (§6d/§8) · parallax `#hero`/`#tower`.

`prefers-reduced-motion` **tắt hẳn** mọi thứ trên, không giảm biên độ — `DESIGN.md
§7` nói *tắt hoàn toàn*. Ba chốt của mọi vòng có răng canh ở
`trang-chu-layout.test.js`.

### 3.5 · Shape consistency lock — **hỗn hợp, có luật ghi rõ** *(FR-027d)*

Chọn phương án thứ ba trong ba phương án của mục này. Luật là `ui_guide §4`, ánh
xạ **đo được**, không phải "cảm thấy hợp":

```
--radius-lg  20px  panel  (.pn)
--radius-md  16px  thẻ    (.cd)
--radius     11px  nút/chip (.bt, .kp)   ← --radius-sm trỏ vào chính nó
--radius-xs   6px  ô nhỏ
```

Vì sao **không** all-sharp dù "hợp báo in nhất": hệ này là **kính trên ảnh**, và
kính mềm là vì bán kính **lớn so với nội dung**. Vì sao bốn bậc phải **cách xa
nhau**: v1 có 10/10/8/6 — bốn bậc gói trong 4px, tức gần như **một** bậc, nên
panel đọc ra "hộp cứng" chứ không phải mặt kính, và mắt không đọc được thứ tự lớp
(panel bọc thẻ, thẻ bọc nút).

---

## 4 · Bản tham khảo — **đã có**

| | |
|---|---|
**Nhận ngày** | 2026-08-24 |
**Gồm** | `ui_guide.md` (công thức, 9 mục) + `trang-chu.html` (bản chạy tự chứa, 596 dòng) |
**Người dùng nói thích gì** | *"cần đảm bảo độ mượt"* · ảnh nền lấy ở `public/` · *"có thể apply thêm gradient"* |
**Phạm vi hợp đồng** | Trang chủ. Người dùng nói **hai lần**: *"tôi cần làm y chang file `trang-chu.html`"* · *"tôi muốn layout như `trang-chu.html` luôn"* |

**Chỗ KHÔNG bê theo** — bản tham khảo là bản chạy tự chứa nên nó làm nhiều thứ
hợp với một file lẻ mà sai với dự án này:

| Bản tham khảo | Vì sao không theo |
|---|---|
`style=""` **288 chỗ** + CSS/JS nhúng trong HTML | `page-weight.test.js:66` cấm; tách file là thứ đã kéo 86 KB → 22 KB mỗi trang |
Google Fonts CDN (`:8`) | **B-D3** local/private |
`blur(14px)` gõ tay | `DESIGN.md §9` — mọi blur dùng `var(--blur-lift)` |
`countUp(document)` lúc load · một cờ `hover` chung · `style-hover=""` | **ba quirk nó tự mắc** — port nguyên là port cả lỗi. Xem FR-027e |

**Nợ luật đã khai**: hai vòng tự chuyển của bản tham khảo là carousel theo nghĩa
hẹp, mà `DESIGN.md §9` cấm carousel. Người dùng đã chỉ định file này làm hợp đồng
UI ⇒ nới, nhưng **có giới hạn đóng** ghi ở FR-027e *"Nợ luật"*, không nới im lặng.

---

## 5 · Quy trình làm lại

| Nhịp | Việc | Skill | Ra |
|---|---|---|---|
| **A** | Audit v1 | `design-review` (audit-first) | Danh sách lỗi cụ thể *(mục 1 là bản nháp)* |
| **B** | Chốt hướng từ tham khảo | `design-taste-frontend` §0 | Design Read + 3 dial |
| **C** | Dựng lại 1 màn duy nhất | `frontend-design` | **Chỉ trang bài** |
| **D** | Bạn duyệt màn đó | — | Đạt/không |
| **E** | Nhân ra 2 màn còn lại | `frontend-design` | Trang chủ + tra cứu |
| **F** | Pre-flight | `web-design-guidelines` + §Pre-Flight của taste-skill | Checklist mechanical |
| **G** | Đánh bóng | `impeccable-design-polish` | Bản cuối |

**Luật của lần này: nhịp C chỉ dựng MỘT màn.**

v1 hỏng ở chỗ tôi dựng cả 4 màn rồi mới đưa xem — nên khi bạn nói "xấu", cả 4 màn
cùng vứt. Lần này đưa một màn, sai thì sửa rẻ.

Trang bài được chọn làm màn đầu vì nó là nơi nội dung sống, và vì `web-spec.md`
đã nói: *trang bài trước, trang chủ sau*.

---

## 6 · Tiêu chí đạt — kiểm được, không phải "đẹp hơn"

Lần này phải có phép thử, vì "đẹp" không tranh luận được.

**Mechanical** — đếm được, theo §Pre-Flight của taste-skill:

- [ ] Font không phải Inter, trừ khi tham khảo dùng Inter
- [ ] Số eyebrow ≤ `ceil(số section / 3)`
- [ ] Không layout family nào lặp trên cùng một trang
- [ ] Radius theo **một** hệ, hoặc có luật ghi rõ
- [ ] Đỏ ≤ 3 lần mỗi viewport
- [ ] `prefers-reduced-motion` có xử lý
- [ ] Contrast vẫn 26/26 pass (chạy lại `contrast-audit`)
- [ ] Mobile collapse khai rõ từng section

**Cảm nhận** — bạn trả lời:

- [ ] Có **một** khoảnh khắc khiến mắt dừng lại ở mỗi màn không?
- [ ] Nhìn 3 giây có biết đây là *kho tri thức có biên tập*, không phải blog?
- [ ] Đọc hết 1500 từ có mỏi không?

---

## 7 · Không đổi

Ghi để khỏi trôi lại — đây là ràng buộc, không phải thẩm mỹ:

| Giữ nguyên | Vì |
|---|---|
| Palette đỏ/trắng, 2 tone | Bạn chốt, và đã pass 26/26 WCAG |
| 3 màn: bài · chủ · tra cứu | `screen_inventory.md`, sinh từ flow P0 |
| 7 khối trang bài, thứ tự cam kết tăng dần | PRD U5 |
| Chỉ render `approved` · gộp `url_normalized` · sắp theo `priority` | BRD B-B1, B-A3 |
| Data contract v1 | Đã kiểm số, frozen sau G5 |
| Thang chữ 1.25 neo 17px, cột ~640px | Đã tính, đúng ngưỡng đọc |

**Cái làm lại là ngôn ngữ thị giác. Kiến trúc thông tin giữ nguyên.**
