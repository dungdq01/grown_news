# `web/` — M03_web · nhật ký công việc

> **Cách chạy**: [`README.md`](README.md) · **Cách chạy cả dự án**: [`../RUNNING.md`](../RUNNING.md)
>
> File này ghi **quyết định** và **giá đã trả**. Chi tiết từng thư mục:
> [`plugins/WORKLOG.md`](plugins/WORKLOG.md) · [`test/WORKLOG.md`](test/WORKLOG.md) ·
> [`styles/WORKLOG.md`](styles/WORKLOG.md)

---

## Module này làm gì

Đọc `kb/`, render kiểu tòa soạn, deploy **private**.

**Không thiết kế lại.** Hợp đồng UI đóng băng ở G5: 113 token, 4 wireframe,
prototype 20 bản chạy được. M03 là *nối* `05_uiux/` với `kb/`.

```
kb/**/*.md ──filter approved──> gộp url_normalized ──> shell prototype ──> site tĩnh
                   │                                          │
              M03-R1 chặn                              bê nguyên app-v20.html
              draft/rejected
```

---

## Trạng thái

| | |
|---|---|
| Trạng thái | **as-built** — s8 chặng B |
| Stack | Quartz **v5** (FR-007) |
| Plugin tự viết | 6 |
| Test | 138, tất cả xanh (`cai-dat` nay đỗ ở thư mục task theo `rule.md` mục 8) |   <!-- +loi-cua, +loi-cua-http, +rate-limit, +phan-quyen, +loi-tho-cua, +chung-cat-ui, +cat-binh-luan-js, +loi-nhap-cua, +chung-cat-quan-ly, +chung-cat-nhap, +tab-theo-doi-chung-cat, +chung-cat-hover, +sinh-transcript-ui, +hien-vat-gan, +mot-bien-mau, +man-co-chunk-phai-cat, +chunk-tu-chua, +sau-khi-ghi-video, +o-chi-dan, +viec-theo-loai, +xuat-van-ban, +nut-tai-xuong, +sau-phan-quyet,
     +mau-trang-thai, +menu-tai-dot-hai, +xuat-transcript, +mo-nhap-da-duyet,
     +header-theo-man, +ban-cu-vao-rac, +the-viec-noi-ro-loai, +mo-theo-slug,
     +cua-so-transcript, +chung-cat-sau-transcript, +o-chi-dan-hien-that,
     +nhip-sinh -->
| Build | 79 file · 9 bài từ 13 bản ghi |

---

## Bốn quyết định lớn

### 1 · Giữ Quartz thay vì tự viết (F1)

Kiểm tài liệu chính thức thay vì đoán: `emit()` nhận **toàn bộ** content array
nên gộp `url_normalized` được trong một lượt; SPA routing giữ DOM state nên
multi-window sống qua điều hướng.

Vanilla tốn thêm **~700 dòng** cho thứ Quartz cho sẵn.

### 2 · v5 chứ không phải v4 (FR-007)

ADR-01 chốt v4, nhưng `npm install @jackyzha0/quartz` trả **404** — Quartz không
phát hành qua npm, và bản hiện hành là v5.

Kiểm **cả tài liệu lẫn mã nguồn** bốn API mà F1 dựa vào: `shouldPublish`,
`emit(content[])`, `nav` event, `addCleanup` — **còn đủ**. Không khẳng định nào
của F1 gãy, nên FR-007 chỉ cập nhật số phiên bản.

### 3 · Bê nguyên HTML và CSS của prototype

`shell.html` = bản sao nguyên vẹn `<body>` của `app-v20.html` — sau các đợt
FR-011 (bàn biên tập + form viết bài), FR-013/FR-014, FR-016 (màn Nạp nguồn
theo tab) và FR-017 (nút sắp xếp) hiện là 37540 ký tự.
`prototype.css` = 828 dòng CSS bê nguyên, hiện 2453 dòng sau phần thêm của
FR-011 (form, phiếu duyệt, thùng rác), FR-013/FR-014 (độ nổi, chuyển động) và
FR-016 (nhịp tách khối, màu số thống kê, tab màn Nạp nguồn) và FR-017 (màu
header, chữ đậm thanh điều hướng, nút sắp xếp).

> **Hai lần đầu tôi làm sai**: tự viết markup rồi cố ghép CSS vào. Lần một dùng
> tên class riêng → 27/33 lệch. Lần hai đổi tiền tố CSS sang `gn-*` → HTML dùng
> tên gốc → vẫn lệch. Cả hai lần ra trang trắng trơn.
>
> **Bê nguyên nghĩa là bê cả tên.**

### 4 · Hai chế độ dữ liệu, chọn bằng cờ dòng lệnh

```bash
npm run api        # FR-034 — SSR: `/` đọc kb/_kho.sqlite, `/mock/` đọc kb-mock/
# (lịch sử: hai script dev / dev-kb thời Quartz đã nhổ ở FR-034)
npm run build      # luôn kb/ — bản phát hành
```

Không phải nút trên web: dữ liệu được quyết định lúc **build** — Quartz đọc thư
mục content rồi sinh HTML tĩnh. Nút chỉ đổi được thứ đã build sẵn.

Dùng `--kb` thay vì biến môi trường vì `GN_DATA=x cmd` không chạy trên PowerShell.

---

### 5 · Thanh menu học DeepSeek · Kho thành trang riêng

Thanh menu cũ: `[logo] [4 tab phẳng] [3 nút icon]`.
Giờ: `[logo] [ô tìm] [5 tab PILL] [đếm + 3 nút]`.

Tab pill gom thành **một vật thể** — mắt đọc ra "đây là bộ điều hướng", không
phải bốn nút rời rạc. Ô tìm và số đếm ẩn dưới 64rem để không chen chỗ.

**Kho tách khỏi trang chủ thành `/kho/`**: trang chủ chỉ giữ KPI thu gọn + nút
*xem dashboard*. Dashboard có bốn thẻ KPI, phân bố theo **loại nguồn** · **tin
cậy** · **trạng thái duyệt**, và nhắc còn thiếu bao nhiêu nguồn để đo M1.

Trang chủ giờ ba vùng: nổi bật (lưới bất đối xứng) · mới + kho (hai cột) ·
trong kho (lưới thẻ). Vẫn không family nào lặp.

### 6 · Giới hạn hiển thị — đo trước khi sửa

Người dùng hỏi *"nhiều bài là có vấn đề về UI đấy"*. Đo thật trên bản 13 bản ghi:
mỗi thẻ **~2379 byte** HTML.

| Bản ghi | Màn Tất cả |
|---|---|
| 13 | 86 KB |
| 200 | 520 KB |
| 500 | **1217 KB** — không dùng được |

Nhưng CSS 46 KB + JS 17 KB là **hằng số lặp ở mọi trang**. Tách chúng ra
`gn.css`/`gn.js`: **86 KB → 22 KB** mỗi trang, và trình duyệt cache một lần.

Màn Tất cả phân trang **24 thẻ** — sinh `/tat-ca/2/`, `/tat-ca/3/`… Kiểm thật
với 120 bản ghi: **5 trang × 60 KB** thay vì một trang 300 KB.

Bốn ngưỡng khai một chỗ trong `NGUONG` — không rải `slice(1, 3)` khắp code.
`page-weight.test.js` canh cả hai điều đó.

### 7 · Tách kho mẫu khỏi hợp đồng

Trước đó bản `/mock/` đọc thẳng `05_uiux/contracts/analyses.sample.v3.json`.
File đó có **hai vai lẫn nhau**:

| Vai | Tính chất |
|---|---|
| hợp đồng G5 | test đọc `_expected_render`, **frozen**, sửa phải qua FR |
| kho bài mẫu | web đọc để dựng `/mock/`, sửa thoải mái |

Gộp làm một nghĩa là: thêm một bài mẫu ⇒ đụng contract ⇒ mở FR.

⇒ `kb-mock/` — kho mẫu riêng, dùng **đúng định dạng `kb/`** (`.md` + frontmatter).
Cả hai kho đi qua **một** `docTuDia()`; xoá hẳn `docContract()` vì hai đường parse
sẽ lệch nhau ngay lần đầu schema đổi.

Sinh lại: `python core/tools/sinh_kb_mock.py`.

### 8 · URL hiện ra — phân biệt hoạt động với trang trí

File `/tat-ca/index.html` **có thật** — gõ thẳng vào trình duyệt ra đúng trang.
Nhưng bấm tab thì JS đổi class `.on` mà **không đổi URL**. Hai đường song song:
không bookmark được màn, không share link, F5 quay về trang chủ.

`doiView()` giờ ghi `history.pushState`, và `popstate` cho nút Back. Dùng
`pushState` chứ **không** dùng `<a href>`: tải lại trang thì mọi cửa sổ đọc bị
đóng — SPA giữ DOM state là lý do F1 chọn Quartz.

**Ba thứ từng là trang trí, giờ hoạt động:**

| | Trước | Sau |
|---|---|---|
| ô tìm `#q` | `<input>` không ai nghe | lọc theo chữ, bỏ dấu tiếng Việt |
| thẻ concept | `<div>` tĩnh — thấy số 3 mà không xem được 3 bài | `<button>` lọc, nhảy sang màn Tất cả |
| trạng thái lọc | mất khi F5 | ghi vào URL `?tim=x&cpt=y` |

Lọc dùng `replaceState` chứ không `pushState` — mỗi lần gõ một chữ mà thêm một
mục lịch sử thì nút Back thành vô dụng.

---

## Sáu luật module cưỡng chế

| Rule | Nội dung | Bề mặt |
|---|---|---|
| **M03-R1** | chỉ `approved` lên site | S3 · `only-approved.test.js` |
| **M03-R2** | không đường ghi vào `kb/` | S3 · `no-write-path.test.js` |
| **M03-R3** | không `allowDangerousHTML` | S3 · `no-dangerous-html.test.js` |
| **M03-R4** | không gõ lại giá trị token | S3 · `token-only.test.js` |
| **M03-R5** | sắp theo `priority`, không theo ngày | S3 · `expected-render.test.js` |
| **M03-R6** | deploy private | S2 · reviewer |

---

## Ba lỗi suýt gây thiệt hại

### Build ghi đè thư mục ảnh nguồn

Ban đầu output trỏ vào `public/` — đó là **ảnh nền của người dùng**, 10 file
`.jpg` commit từ s5. Quartz **xoá sạch thư mục output** trước mỗi build.

Ảnh còn nguyên (phát hiện kịp), đã đổi sang `web/site/`.

### `EBUSY: rmdir web/site`

Máy chủ đang chạy giữ khoá thư mục; Windows khoá thư mục đang mở.

(lịch sử Quartz — script dev đã nhổ ở FR-034) bản dev từng build ra **thư mục tạm**, không tranh `web/site` với
`npm run build`.

### Artifact lọt vào git

`web/_quartz/` (repo nhúng), `*.inline.js` (esbuild sinh), `test/_kho-tam/`,
`site/`. Tất cả dựng lại được, giữ trong git thì mỗi lần build là một diff rác
hàng chục file.

---

## Nợ chưa trả

| Nợ | Vì sao |
|---|---|
| Chưa test Safari/Firefox | `backdrop-filter` và `container-query` cần kiểm — nợ từ G5 |
| Ảnh gốc 1308px, phóng 1.47× | cần ảnh ≥1920px mới nét hoàn toàn |
| Chưa có Dialog / Toast / Command palette | chưa module nào cần |
| `kb/` **rỗng** | mọi số đo đang chạy trên sample — **M1 chưa đo được ngày nào** |

Nợ cuối là cái chặn: M1 là metric chặn của dự án.

---

## Dựng lại từ máy trắng

```bash
cd web
git clone --depth 1 https://github.com/jackyzha0/quartz.git _quartz
cd _quartz && npm install && cd ..
cp quartz.config.yaml _quartz/
npm run api   # (FR-034 — bản dev thời Quartz đã nhổ)
```

`_quartz/` là thượng nguồn, **không nằm trong git**. Đừng sửa mã trong đó — bản
vá sẽ âm thầm biến mất khi cập nhật.

## FR-038/C5 · bảy màn, thanh menu hai nhóm

Bốn bảng gõ tay cho cùng một sự thật giờ dẫn xuất từ `core/assets/man-hinh.json`:
`VIEW_SSR` (server.mjs) · `MAN` (render/trang.mjs) · `DUONG`
(multiwindow.inline.ts, qua `define __MAN__`) · và `MOUNT` của `nut-song`.

Ba màn loại cắt ở `NGUONG.moiTrang` — **cùng hằng số** màn Tổng hợp dùng. Bắt
buộc vì shell mang cả mọi màn trong MỌI trang: không cắt là ba lần cả kho nhân
vào từng trang (đo được: 144 thẻ thay 24). Phần bị cắt **nói ra thành chữ**, không
im lặng.

`cho-duyet` cố ý KHÔNG có trong bảng khai — nó là trang chuyển hướng, không phải
một màn: không shell, không tab, không khối `.view`.

Ngân sách sau C5: `gn.css` 92/100 · `gn.js` 95/100 · trang chủ 46/60 · trang lớn
nhất 57/74. `__NHOM__` nhúng nhưng FE chưa tham chiếu nên tốn **0 byte** —
esbuild `define` chỉ thay ở chỗ có tham chiếu, đúng như dự đoán trước khi build.
