# FR-040 — Tách ĐƯỜNG API theo module, mỗi đường mang cổng riêng của nó

mở_bởi: người dùng, trực tiếp trong phiên 2026-08-28 — *"Mọi design UI / **FE / API** cần tách biệt và phân loại: bài viết, tài liệu, video"*, rồi chốt qua AskUserQuestion: **"Tách route riêng cho từng module"**
tới: M08_api (`spec.md` **FROZEN** — hợp đồng route · `rules.md` **FROZEN** · `web/api/router.mjs`, `articles.mjs`, `dungchung.mjs`) · M03_web (FE dựng URL ở ~6 chỗ) · M10_tailieu + M11_video (`rules.md` — cổng riêng của mỗi module cuối cùng có chỗ đứng) · `FROZEN.lock`
mức: **đổi hợp đồng bề mặt HTTP** — URL cũ phải còn sống
trạng_thái: **người dùng đã chốt 2026-08-28**

---

## 0 · Vì sao `?nhom=` chưa đủ

FR-038/C4 đã cho `/api/articles?nhom=` và `/api/index?nhom=` lọc đúng ba nhóm,
nhóm lạ ⇒ 400. **Dữ liệu** đã tách (ba bảng), **đường ghi** đã nêu tên bảng thật.

Cái còn gộp là **LUẬT**. Hôm nay cả ba loại đi qua **một** `ghiSauValidate`, và
luật riêng của từng module sống dưới dạng lệnh `if` bên trong nó:

- tài liệu đòi `media` + magic-byte + trần 25 MB
- video đòi `url` + whitelist host + regex id (M09-R3)
- bài viết đòi hồ sơ `phan-tich` — đủ cổng mục/dẫn nhập/tinh túy/locator

Ba bộ luật trong một hàm nghĩa là: thêm luật cho tài liệu là **sửa cái hàm mà bài
viết cũng đi qua**. Đó chính là *"gộp chung tính năng"* mà người dùng cấm, chỉ ở
tầng không nhìn thấy được trên màn hình.

## 1 · Hình dạng chốt

```
GET  POST         /api/bai-viet
GET  PUT  PATCH  DELETE  /api/bai-viet/:type/:slug
GET  POST         /api/tai-lieu        ← cổng hiện vật của riêng nó
GET  POST         /api/video           ← cổng URL/host của riêng nó
GET               /api/kho?nhom=       ← CHỈ đây và Tổng hợp được trộn
```

`/api/articles**` **giữ nguyên làm bí danh**, không xoá. Lý do đo được: FE dựng
URL thẳng `"/api/articles/" + ban.slug` ở **bốn** chỗ sửa đổi
(`multiwindow.inline.ts:1196·1289·1323·2249`), và FR-024 đã một lần làm vỡ đúng
chỗ này — người dùng báo *"duyệt, loại, sửa, bỏ đều không hoạt động"*. Xoá URL cũ
trong cùng lượt với tách đường là hai thay đổi rủi ro chồng lên nhau.

## 2 · Ràng buộc KHÔNG được nới

`api-guard.test.js` **răng 2**: mọi mutation SQL chỉ ở `dungchung.mjs`. Tách
route **không** có nghĩa là mỗi file route tự viết SQL — mỗi route mang **cổng**
riêng, rồi cùng gọi một đường ghi. Nới răng 2 là đánh đổi sai: nó bảo vệ thứ khác
hẳn (một cửa ghi DB), không phải thứ FR này đang tách (luật theo module).

`M08-R5` client không đặt được `review_status`/`origin` — áp ở **cả ba** đường,
không chỉ đường cũ. Một route mới quên lột trường server-quyết là một lỗ.

## 3 · Cổng phải có

- ba đường mới trả 200 và **chỉ** trả bản của module mình (chiều âm)
- `/api/articles**` **vẫn** chạy đủ CRUD — không hồi quy
- POST `/api/tai-lieu` **thiếu `media`** ⇒ 422; POST `/api/video` **thiếu `url`**
  ⇒ 422 — tức cổng riêng có thật, không phải ba tên gọi của một hàm
- POST `/api/video` với host ngoài whitelist ⇒ **chặn tại chỗ dán** (M09-R3)
- `api-guard` răng 2 **vẫn xanh** — không file route nào có `INSERT/UPDATE/DELETE`
- client đặt `review_status` ⇒ bị lột ở **cả ba** đường

## 4 · Điều FR này KHÔNG làm

Không xoá `/api/articles**` · không đổi `?nhom=` đã có · không nới `api-guard` ·
không đụng tầng SSR (`trang.mjs` đọc DB, không đi qua HTTP).
