# WO-030 — màn Danh mục KHÔNG BAO GIỜ gọi API vì phép đọc bị buộc vào mốc của màn khác

loại: bug chặn — dữ liệu có thật mà màn nói "trống"
module: **M03_web** (`web/plugins/multiwindow/**`)
mức: **thêm nhãn xong không thấy nó đâu** — người dùng báo trực tiếp

## Người dùng báo (2026-08-29, kèm ảnh)

> *tại sao sau khi tạo mới khái niệm và chủ đề rồi thì ko hiển thị lên web, dù
> tôi thấy đã lưu vào DB*

Và trên **cùng một màn**, KPI hiện **KHÁI NIỆM 01 · CHỦ ĐỀ 01** trong khi danh
sách bên dưới nói *"Danh mục khái niệm đang trống."*

## Đo được — trên server THẬT của người dùng

```
GET /api/concepts    → {items:[{id:"talkshow", …}], tong:1}     ĐÚNG
GET /api/categories  → {items:[{id:"aitalkshow", …}], tong:1}   ĐÚNG
DB concepts / categories                                       1 hàng mỗi bảng
kb/concepts.yaml · kb/categories.yaml                          có cả hai mục

GET /khai-niem/      → **0** phần tử `[data-dm]`
GET /bai-viet/nap/   → **4** phần tử `[data-dm]`
```

Dữ liệu đúng ở mọi tầng. Lỗi nằm ở **FE không hỏi**.

## Nguyên nhân

```js
async function napLoaiDanhMuc(loai, moc) {
  if (!moc.length) return []                       // ← thoát TRƯỚC khi fetch
  const ds = await napMotDanhMuc(moc[0].id, …)
}
async function napMotDanhMuc(mocId, duong) {
  const o = G(mocId)
  if (!o) return null                              // ← lần thứ hai
```

`[data-dm]` chỉ tồn tại trên các **màn nạp** (ô tích chọn nhãn), và
`catNap()` (`trang.mjs:285`) **cắt các màn nạp** ra khỏi mọi trang khác để tiết
kiệm byte. Nên trên màn Danh mục không còn mốc nào, cả hai hàm thoát sớm, và
**API không được gọi lần nào**. `veDanhMuc([], [])` vẽ ra chữ "đang trống".

**Màn Danh mục cần CHÍNH DỮ LIỆU, không cần ô tích của màn nạp.** Buộc phép đọc
vào mốc của một màn khác là buộc nó vào một thứ có thể bị cắt đi — và đã bị.

Vì sao KPI vẫn đúng: nó do **SSR** dựng từ DB, đường hoàn toàn khác.

## Kỳ vọng

Fetch luôn chạy; ghi vào mốc **chỉ khi** có mốc.

## Bằng chứng — TRÌNH DUYỆT THẬT, kho tạm

Dựng một server riêng (cổng 8799, `KB_DIR` trỏ kho tạm), nạp đúng hai nhãn người
dùng đã tạo, mở `/khai-niem/` bằng Playwright:

```
#cchua    "0 bài Talkshow talkshow sửa xoá"
#catlist  "0 bài AI - talkshow aitalkshow · talkshow sửa xoá"
#cb       "Danh mục có 1 khái niệm, chưa bài nào dùng tới."
#ccount   "0/1 đang dùng"        #catcount  "1 mảng"
[data-dm] trên trang: 0          ⇒ fetch chạy KHÔNG cần mốc
```
