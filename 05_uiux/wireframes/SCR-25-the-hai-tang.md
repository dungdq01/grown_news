# SCR-25 · THẺ 2 TẦNG — nền trực quan theo loại nguồn

> `T03-126` bước 1. **Trạng thái: ĐÃ DUYỆT — chủ dự án, 2026-09-08.** Bốn câu
> của §7 chốt: **(1)** ~~bài viết giữ 1 tầng~~ → **ĐẢO cùng ngày**, sau khi
> chủ dự án nhìn màn thật: *"tài liệu và bài viết chưa có"* ⇒ **MỌI loại có
> nền** · **(2)** video dùng chung
> `--c-video`, **chỉ khác icon** · **(3)** tỉ lệ **4:3** · **(4)** đồng ý
> **hoãn** vùng lưới 4 thẻ trang chủ. Bước 2 (mã) được phép chạy.
>
> Chỉ đạo chủ dự án 2026-09-08, chép nguyên văn để không rơi:
> *"giao diện menu danh sách của chúng ta quá đơn giản… Video youtube /tiktok
> /douyin cần hiển thị có nền tab. Tương tự với tài liệu doc, pdf, .md cũng cần
> có nền tương tự như vậy (có thể lấy các icon ở thesvg.org để làm nền)"*

## 0 · Ba chỗ tôi phải đính chính TRƯỚC khi bạn đọc tiếp

Cả ba đo được, và cả ba đổi việc phải làm — nên chúng đứng đầu file chứ không
nằm trong một chú thích cuối trang.

| # | task viết | đo được | hệ quả |
|---|---|---|---|
| 1 | wireframe là `SCR-23` | `SCR-23-phieu-chung-cat.md` **đã có** (07-09 20:12), `SCR-24` cũng đã có | file này là **SCR-25**; `T03-126` cần sửa một dòng `phạm_vi_ghi` |
| 2 | *"tự vẽ inline mask khuôn 8-icon-rail"* | `public/icon/` **đã có 20 `.svg`**, đủ cả 6 ca, kèm `XUAT-XU.md` ghi license từng file | **0 icon phải vẽ**; và không hotlink thesvg.org — đúng như task đã chốt |
| 3 | `media-mime.json` thêm **2** cột `mau` + `icon` | icon **đã dẫn xuất** từ chính thư mục (`ICON_CO`, `trang.mjs:1337`), và `XUAT-XU.md` khai luật *"tên file = đúng giá trị của chip"* | thêm cột `icon` là **bản thứ hai của danh sách file** — thứ chính file đó cấm. ⇒ **một cột `mau`, không hai** |

Điểm 3 là chỗ tôi đẩy lại task, và lý do đo được: hôm nay thêm một `.svg` vào
`public/icon/` là có icon mới với **0 dòng mã**. Thêm cột `icon` biến việc đó
thành *"thêm file **và** nhớ thêm một dòng bảng"* — và dòng người ta quên là
dòng thứ hai. `mau` thì thật sự chưa tồn tại (xem §3).

---

## 1 · Hình dạng — hai tầng

```
   ┌────────────────────────────┐
   │                            │  ← TẦNG NỀN, tỉ lệ 16:9
   │        (thumbnail          │     một trong bốn lớp §2
   │      hoặc icon+màu)        │
   │                            │
   ├────────────────────────────┤
   │ ▸video                     │  ← TẦNG CHỮ, y hệt thẻ hôm nay
   │ Doanh nghiệp một người…    │     (badge · tiêu đề · tin cậy · chủ đề)
   │ —              plausible   │
   │ [business]                 │
   └────────────────────────────┘
```

Tầng chữ **không đổi một chữ nào** — `the()` hôm nay đã dựng đúng bốn dòng ấy.
Việc của đợt này là **thêm một tầng lên trên**, không phải vẽ lại thẻ. Đó cũng
là lý do đợt 1 thuần FE làm được mà không chờ M12.

---

## 2 · Ưu tiên nền — BỐN lớp, rơi xuống chứ không vỡ

```
1. hiện vật thumbnail trong media[]   kieu_moc = la_thumbnail   ← T12-29 (đợt 2)
        ↓ chưa có
2. ảnh ytimg dựng từ id YouTube       i.ytimg.com/vi/<id>/hqdefault.jpg
        ↓ không phải YouTube
3. icon + màu theo loại nguồn         /i/<nguon>.svg  +  --the-mau
        ↓ loại nguồn không có icon
4. nền màu trơn                        --the-mau, không icon
```

Lớp 1 thắng lớp 2 **có chủ đích**: khi `T12-29` chạy xong, thẻ tự nâng cấp mà
FE không sửa một dòng. Và ảnh trong kho không hết hạn, không phụ thuộc một
domain ngoài — thứ `ytimg` không hứa được.

⚠️ **Lớp 3 lấy khoá từ `data-nguon` — thuộc tính THẺ ĐÃ CÓ.** `nguonCua()`
(`trang.mjs:1385`) đã trả đúng chuỗi ta cần: `youtube` · `tiktok` · `fb` ·
`douyin` · `tai-len` · `khac` cho video, và `pdf` · `docx` · `pptx` · `md` ·
`txt` · `bin` cho tài liệu. Cùng chuỗi ấy là tên file trong `public/icon/`.
⇒ Không có bảng ánh xạ mới, không có phép suy thứ hai.

---

## 3 · Màu — cột `mau` là thứ DUY NHẤT chưa tồn tại

Hôm nay `tokens.css` có `--c-repo` `--c-paper` `--c-video` `--c-article` — khoá
theo **`source_type`**. Sáu định dạng tài liệu (`pdf`/`docx`/`pptx`/`md`/`txt`)
**đều** là `source_type: tai-lieu` ⇒ chúng dùng chung một màu, và một lưới toàn
tài liệu sẽ là một mảng phẳng cùng màu. Đó là lỗ thật.

⇒ `media-mime.json` thêm **một** cột `mau`, giá trị là **tên token**, không
phải mã hex:

```jsonc
{ "mime": "application/pdf", "duoi": ".pdf", "mau": "--c-pdf", … }
```

Hai điều kèm theo, cả hai bắt buộc:

- **Token định nghĩa ở `05_uiux/tokens.css`**, giá trị hex sống đúng một chỗ —
  `AC4` (`token-only.test.js`) đã canh chuyện này và nó sẽ đỏ nếu ai gõ hex vào
  bảng khai.
- **Thiếu `mau` ⇒ rơi về `--ink-3`**, không đỏ. Bảng khai là đất M01; một dòng
  mime mới chưa kịp có màu vẫn phải render được.

⚠️ `media-mime.json` **không** khai `video_host` màu — nên `youtube`/`tiktok`/
`douyin`/`fb` lấy màu từ đâu là câu §7-2 hỏi bạn.

---

## 4 · Sáu ca — vẽ đủ

### Ca 1 · video YouTube — ảnh thật (lớp 2)

```
   ┌────────────────────────────┐
   │████████████████████████████│  hqdefault.jpg, object-fit:cover
   │███ ảnh thumbnail thật ██████│  loading="lazy"
   │████████████████████ ▶ 5:26 │  onerror ⇒ rơi thẳng ca 2
   ├────────────────────────────┤
   │ ▸video · GÓC NHÌN GIÁ TRỊ… │
   └────────────────────────────┘
```

⚠️ **Bẫy đã có tiền lệ, và nó IM LẶNG:** `WO-022` ghi lại đúng lớp lỗi này —
hạ chữ thường cả URL làm id YouTube (`dQw4w9WgXcQ` → `dqw4w9wgxcq`) **vẫn khớp**
`^[A-Za-z0-9_-]{11}$` nên không cổng nào kêu, và iframe trỏ vào một video khác.
`nguonCua()` **đang** `toLowerCase()` cả URL (`trang.mjs:1394`).
⇒ Phép rút id cho ytimg **không được** dùng lại chuỗi đã hạ. Hạ riêng phần host,
giữ nguyên phần còn lại — đúng hình dạng `normalize_url()` phía Python.
**Cổng phải có vế id hoa-thường**, không chỉ vế "có ảnh".

### Ca 2 · video TikTok/Douyin/mp4 — CHƯA có thumbnail (lớp 3)

```
   ┌────────────────────────────┐
   │                            │  nền --c-tiktok, phủ nhẹ
   │         ◆ (icon)           │  /i/tiktok.svg — mask, currentColor
   │                            │  icon ~34% bề rộng, canh giữa
   ├────────────────────────────┤
   │ ▸video · Thiên Đường Chuột │
   └────────────────────────────┘
```

**Douyin dùng glyph video chung** (`/i/video.svg`) — `XUAT-XU.md` đã khai lý do
và tôi không đảo nó: `simple-icons` không có mark Douyin, và mượn `bytedance`
(công ty mẹ) là **nói sai tên một thương hiệu**.

### Ca 3 · video ĐÃ có hiện vật thumbnail (lớp 1 — sau T12-29)

```
   ┌────────────────────────────┐
   │████████████████████████████│  /api/articles/media/<sha256>
   │███ ảnh trong KHO ██████████│  cùng markup ca 1, khác src
   │████████████████████████████│  không hết hạn, không domain ngoài
```

Thẻ **không biết** ảnh từ đâu — nó chỉ hỏi `media[]` trước, hỏi `url` sau. Đó là
điều làm đợt 2 không phải sửa FE.

### Ca 4 · tài liệu PDF

```
   ┌────────────────────────────┐
   │                            │  nền --c-pdf
   │      ▤ PDF (icon)          │  /i/pdf.svg
   │                            │  (T12-29 sẽ thay bằng ảnh trang 1)
   ├────────────────────────────┤
   │ ▸tai-lieu · xgboost-stap…  │
   └────────────────────────────┘
```

### Ca 5 · tài liệu md / docx

```
   ┌──────────────┐  ┌──────────────┐
   │      ▧ MD    │  │     ▨ DOCX   │   khác MÀU, khác GLYPH
   ├──────────────┤  ├──────────────┤   cùng một khuôn
   │ ▸tai-lieu    │  │ ▸tai-lieu    │
```

Bốn glyph `pdf`/`docx`/`pptx`/`txt` là **một hình** (tờ giấy góc gấp) khác nhau
ở **chữ** bên trong — `XUAT-XU.md` đã chốt. Nên **màu** là thứ phân biệt chúng ở
cỡ thẻ, không phải hình. Đó là lý do §3 tồn tại.

### Ca 6 · bài viết — **câu hỏi, không phải câu trả lời**

```
   (A) GIỮ GỌN — 1 tầng          (B) CŨNG 2 TẦNG
   ┌──────────────┐              ┌──────────────┐
   │ ▸article     │              │   ◈ (icon)   │
   │ phan-tich-…  │              ├──────────────┤
   │ — · draft    │              │ ▸article     │
   │ [aitalkshow] │              │ phan-tich-…  │
   └──────────────┘              └──────────────┘
```

| | được | mất |
|---|---|---|
| **(A) giữ gọn** | lưới nói thật: *có ảnh* và *không có ảnh* là hai loại khác nhau | hai chiều cao thẻ trong một lưới — nhìn lệch |
| **(B) 2 tầng hết** | lưới đều, một nhịp | một ô 16:9 chỉ để đựng icon `article` là **135px nói rất ít** |

**Tôi nghiêng (A)** — và lý do không phải thẩm mỹ: bài viết là thứ *không có
hiện vật*, mãi mãi. Cho nó một khung ảnh trống vĩnh viễn là hứa một thứ sẽ không
bao giờ tới. Nhưng lưới lệch chiều cao là thứ **bạn nhìn thấy còn tôi thì
không**, nên đây là câu §7-1.

---

## 5 · Hành vi — ba vế là `hard`

| | |
|---|---|
| **lazy** | `loading="lazy"` trên mọi `<img>` nền. 24 thẻ/trang × 1 ảnh = 24 request nếu quên |
| **onerror** | ảnh hỏng ⇒ **rơi về lớp 3**, layout **không xê một pixel**. Ô nền giữ nguyên 16:9 dù ảnh có về hay không — `aspect-ratio`, không phải chiều cao do ảnh quyết |
| **offline** | ytimg chết ⇒ danh sách **vẫn đọc được**. Nền là trang trí; chữ là nội dung |

Vế `onerror` phải đo bằng **fixture ảnh hỏng**, không bằng "có thuộc tính
onerror" — một `onerror` trỏ vào hàm không tồn tại vẫn khớp phép grep.

---

## 6 · NGÂN SÁCH — và đây là chỗ chặn thật

Đo hôm nay (`node web/test/page-weight.test.js`):

| | đo | trần | còn |
|---|---|---|---|
| `gn.css` | 104 439 | 106 496 | **2 057 byte** |
| `gn.js` | 102 625 | 104 448 | 1 823 byte |
| **trang chủ** | **61 708** | **61 440** | **−268 byte — ĐANG ĐỎ** |
| trang lớn nhất | 69 933 | 75 776 | 5 843 byte |

⚠️ **Trang chủ đã vượt trần TRƯỚC khi tôi chạm vào gì.** Quy chủ: working tree
có `web/render/trang.mjs` · `shell.html` · `prototype.css` **sửa chưa commit**
từ phiên khác (`FR-011` — bàn biên tập chung). **Không phải của đơn vị này**, và
tôi không sửa nó.

Nhưng nó chặn: `the()` được gọi ở **cả trang chủ** (`trang.mjs:506`, vùng lưới 4
thẻ) lẫn `/tat-ca/` (24 thẻ). Thêm markup vào `the()` là **thêm byte vào đúng
trang đang đỏ**.

**Ba việc, theo thứ tự:**

1. **CSS ≈ 0 byte mới.** 12 dòng mask hôm nay là `.fl-b[data-i=youtube]::before`.
   Nới selector bỏ tiền tố `.fl-b` ⇒ chip **và** thẻ dùng chung, và **tiết kiệm
   ~72 byte** thay vì tốn thêm 12 dòng mới (~560 byte). Phần còn lại (khung
   16:9, object-fit, nền) ước **~380 byte** ⇒ vẫn trong 2 057.
2. **HTML: ~70 byte/thẻ.** Trang chủ 4 thẻ = **~280 byte** — vượt thêm trên một
   trang đã vượt. `/tat-ca/` 24 thẻ = ~1.7 KB, còn dư nhiều.
3. ⇒ **Đợt này đổi `the()` cho màn DANH SÁCH; vùng lưới trang chủ giữ nguyên
   cho tới khi 268 byte kia có chủ.** Không giảm-béo giữa chừng ở một file đang
   có người khác sửa — đó là hai đơn vị tranh một file (`<scope-check>`).

Con số 1 và 2 là **ước lượng**, và tôi khai chúng là ước lượng. Số thật đo được
sau khi có mã, và nếu nó vượt thì cách xử ghi vào worklog nhận việc, không sửa
lén.

---

## 7 · Bốn câu cần bạn chốt

1. **Bài viết**: (A) giữ gọn 1 tầng — lưới lệch chiều cao nhưng nói thật · hay
   (B) 2 tầng hết cho đều? *(tôi nghiêng A)*
2. **Màu cho video host**: `youtube`/`tiktok`/`douyin`/`fb` **không** nằm trong
   `media-mime.json.loai` — chúng ở `video_host`. Thêm `mau` vào **cả hai** bảng,
   hay video dùng chung một màu `--c-video` và chỉ phân biệt bằng icon?
3. **Tỉ lệ nền**: **16:9** (khớp video, thẻ cao ~135px ở lưới 15rem) hay **4:3**
   (đầy đặn hơn cho tài liệu, thẻ cao ~180px)? Ảnh mẫu bạn gửi là 16:9.
4. **Trang chủ**: đồng ý hoãn vùng lưới 4 thẻ (§6-3) tới khi 268 byte kia có
   chủ? Hay muốn tôi truy 268 byte đó trước như một đơn vị riêng?

**Chưa duyệt ⇒ chưa code.** `AC0` của `T03-126`.
