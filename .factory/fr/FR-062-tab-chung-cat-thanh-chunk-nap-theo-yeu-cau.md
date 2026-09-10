# FR-062 — thân tab Chưng cất thành CHUNK nạp theo yêu cầu

- **mở**: 2026-09-04 · **loại**: nới `phạm_vi_ghi` của `T03-110` · **module**: M03_web
- **trạng thái**: **DUYỆT 2026-09-04** (chủ dự án: *"Tôi ký rồi, bạn cứ fix"*)
- `phạm_vi_ghi` của `T03-110` đã nới theo mục *Xin duyệt* bên dưới

## Vì sao phải mở, chứ không sửa tiếp

`T03-110` khai `phạm_vi_ghi` gồm `web/plugins/chungcat/src/chungcat.inline.ts`
làm nhà cho tab. Thi công thật thì tab **không thể** ở đó, và bản sửa cần ba
đường ghi **không có trong khai**:

| đường ghi | ngoài phạm vi | vì sao cần |
|---|---|---|
| `web/plugins/cctab/src/cctab.inline.ts` | **CÓ** (plugin mới) | nhà mới của thân tab |
| `web/render/assets.mjs` | **CÓ** | khai chunk + chèn dấu phiên bản |
| `web/test/page-weight.test.js` | **CÓ** (cổng của đơn vị khác) | mệnh đề *"chunk sống"* mới chỉ đếm được một trong hai cách nạp |

`CLAUDE.md`: *"cần ghi ngoài `phạm_vi_ghi` ⇒ FR về s7/s4, **không nới tại chỗ**
kể cả một file"*. Nên: mã có, cổng xanh, **chờ ký**.

## Đo được — con số bắt buộc phải đổi thiết kế

Viết thân tab vào `gn.js` (bundle CHUNG của mọi trang) thì **hai** cổng đỏ:

```
FAIL gn.js 103555/102400 (dư -1155)
FAIL vượt trần: mock/index.html 266786/266240
```

Cắt gọn mã tab hết mức (bỏ mảng `DANG_CHAY` → phép so tiền tố · bỏ
`cctDong` gộp vào chỗ dùng · `moTabChungCat` bấm hộ thay vì lặp lại vòng
`aria-current`) chỉ lấy lại **204 byte**. Còn thiếu **951**.

Ba lối, và vì sao hai lối bị loại:

- **nới `gn.js`** — `FR-061` từ chối tường minh: *"`gn.css` và `gn.js` giữ nguyên
  102400. Đó là bundle CHUNG — nới nó là nới cho mọi trang, kể cả trang đọc."*
- **nhét vào chunk `chungcat`** — chunk đó thuộc màn `/chung-cat/`; tab lại sống
  trong cửa sổ đọc ở `/tai-lieu/` · `/video/` · `/tat-ca/` · `/`. Nạp nó ở đó là
  kéo nguyên chunk của một màn khác.
- **chunk RIÊNG, nạp lúc bấm** ← chọn lối này.

## Lối đã làm

`web/plugins/cctab/` — thân tab (`veViecCuaBan` · `dungPoll` · `conChayGd`),
1975 byte, khai trong `CHUNK` của `assets.mjs` nhưng **không màn nào phát thẻ
`<script>`**. `multiwindow` nạp lúc người bấm tab:

```js
let hua;
const capCctab = () => (hua ??= new Promise((xong, hong) => {
  const t = document.createElement("script");
  t.src = "/gn-cctab.js?v=" + (globalThis.__V_CCTAB__ ?? "");
  t.onload = () => xong(globalThis.__GN_CCTAB__);
  t.onerror = () => { hua = null; hong(new Error("không nạp được tab chưng cất")); };
  document.head.append(t);
}));
```

Kết quả đo: `gn.js` **102260/102400** · trang chủ dưới trần · tải đầu nặng nhất
281652/300463.

**Đây KHÔNG phải lách thước đo, và đó là chỗ phải nói rõ.** Chú thích của
`assets.mjs` cảnh báo đúng điều đó: *"tách bundle KHÔNG cứu được: byte vẫn tới
trình duyệt trong cùng một lần tải"*. Khác biệt ở đây là byte **không** tới
trong lần tải đó — nó tới khi người bấm tab, và chỉ với người bấm.

**Đánh đổi phải hiện:** ai bấm tab trả thêm một lượt tải ~2 KB. Người đọc báo mà
không chưng cất trả **0**. Trước bản này thì ngược lại: mọi người trả trước.

### Dấu phiên bản — vì sao chèn vào `gn.js`

Chunk nạp từ JS không có `?v=` do `trang.mjs` phát. Đặt số ấy vào HTML thì mỗi
trang cõng thêm một thuộc tính — và trần HTML trang chủ **đã từng vỡ** vì đúng
loại byte đó (61715/61440, đợt thêm một dòng mime). Nên `assets.mjs` chèn
`globalThis.__V_CCTAB__="<hash>"` vào chính `gn.js`: sửa chunk ⇒ đổi luôn dấu của
`gn.js` ⇒ trình duyệt tải lại cả hai, **0 byte HTML** thêm.

## Cổng `page-weight` — mệnh đề cũ đỏ OAN, phải sửa

```
chunk `cctab`: 0/14 màn xin ⇒ mã chết: build ra rồi không ai tải
```

Sai. Nó là mã sống nhất trong ba chunk — chỉ không sống trên **đường tải đầu**.
Mệnh đề cũ chỉ đếm **một** cách nạp (thẻ `<script>` của một màn) trong khi có
**hai**. Bản mới nhận cả hai, và răng không mất:

```
chunk theo-yêu-cầu: phải CÓ nguồn FE nào nạp `/gn-<k>.js`   (không ⇒ mã chết thật)
                  và KHÔNG màn nào phát thẻ cho nó          (có ⇒ nó đã vào tải đầu)
```

## Xin duyệt

1. Nới `phạm_vi_ghi` của `T03-110` thêm ba đường trên — hoặc tách
   `web/test/page-weight.test.js` sang `T03-110b` (đơn vị test), tuỳ chủ dự án.
2. Đổi dòng 49 của task: nhà của tab là `web/plugins/cctab/`, không phải
   `chungcat.inline.ts`.

· object: `web/plugins/cctab/src/cctab.inline.ts` · `web/render/assets.mjs`
  · `web/test/page-weight.test.js` · `web/test/tab-theo-doi-chung-cat.test.js`
