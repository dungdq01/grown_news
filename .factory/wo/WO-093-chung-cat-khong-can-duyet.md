# WO-093 · Chưng cất xong là LÊN KHO — bỏ vòng duyệt

| | |
|---|---|
| **Loại** | cải tiến (bỏ một bước quy trình) · M12 + M08 |
| **Mức** | `hard` |
| **Mở** | 2026-09-10, chủ dự án: *"chưng cất không có nháp gì nữa cả, giống transcript. model gen kết quả xong là lên thẳng site — ko cần duyệt. Khi có bản mới thì bản cũ sẽ bị ẩn đi (gạch đi như hiện tại). … Logic duyệt này quá ngu và rườm rà?"* |

## Đo trước: đường duyệt ĐÃ làm đủ việc

`cuaDuyetNhap` (`nhap-cua.mjs:225`) hiện làm đúng bốn thứ cần:

```
validate  →  ghi kho (ghiSauValidate)  →  trang_thai='da_duyet'  →  donBanCu()
```

và `donBanCu` chuyển bản chưng cất CŨ **cùng `nguon`** sang thùng rác — tức
*"bản mới thì bản cũ ẩn đi"* đã có sẵn.

⇒ KHÔNG đập bảng nháp, KHÔNG viết đường ghi thứ hai. Chỉ cần **worker tự bấm
nút duyệt**, và gỡ đúng một chốt chặn.

## Hai thứ thiếu

### 1 · `409` chặn lần chạy thứ hai

```js
if (docBai(type, slug)) return json(res, 409,
  { loi: `kho đã có ${type}/${slug}.md — sửa bài đó, đừng duyệt nháp thành bản thứ hai` })
```

Bản chưng cất luôn mang slug `phan-tich-<ten>`, nên chạy lại lần hai là đụng
chính nó. Với quy trình mới, "chạy lại" chính là cách người dùng nói *"tôi
không ưng, làm lại"* — nên nó phải THAY, không phải bị chặn.

**Giới hạn của phép thay:** chỉ thay khi bản đang nằm đó là
`origin: pipeline`. Một bản `manual` — người đã sửa tay — thì **409 giữ
nguyên**. Đây là vế âm nặng nhất của WO: không được để một lượt chưng cất tự
động ghi đè công người viết.

### 2 · Không ai bấm duyệt

`worker.py:313` POST bản nháp rồi dừng. Thêm một lời gọi
`POST /api/nhap-chung-cat/<ulid>/duyet` ngay sau đó.

**Trượt validate ⇒ việc HỎNG, không im lặng.** Nháp vẫn còn để soi; đó là
khác biệt giữa "không duyệt được" và "không có gì".

## Kỳ vọng

- Chưng cất xong ⇒ bản ghi có trong kho, không cần thao tác người.
- Chạy lại ⇒ bản mới vào kho, bản cũ sang thùng rác.
- Bản `manual` ở cùng slug ⇒ **409**, không bị ghi đè.
- Bảng nháp GIỮ — nó là lịch sử, và tab `Kết quả` (`WO-090`) đang hiện nó.
- Trượt validate ⇒ việc `hong`, người thấy lý do.

## Kéo theo (đã đo)

Cái này cũng chữa ô *"vào `/video/` xem bản gốc thì không thấy bản chưng cất"*:
hôm nay nó không thấy vì bản nháp chưa duyệt nên **chưa từng có** bản ghi nào
trong kho để mà thấy.
