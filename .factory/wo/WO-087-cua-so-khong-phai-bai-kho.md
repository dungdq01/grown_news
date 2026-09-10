# WO-087 · Cửa sổ transcript phát bộ nút của BÀI KHO, bấm là 404

| | |
|---|---|
| **Loại** | bug · M03_web |
| **Mức** | `hard` — người dùng THẤY |
| **Mở** | 2026-09-10, chủ dự án: *"loại, bỏ các bài chưng cất / transcript cũng lỗi luôn?"* (ảnh: hộp *Loại bài* trên cửa sổ Transcript, báo **"Không đọc được bài từ API."**) |

## Repro

1. Mở cửa sổ **Transcript** của một video.
2. Chân cửa sổ vẫn có `✕ Loại (ghi lý do)…` và `🗑 Bỏ khỏi kho…`.
3. Bấm `Loại`, ghi lý do, bấm nút → **"Không đọc được bài từ API."**

## Quy chủ — KHÔNG phải sự cố CRLF cùng ngày

Đã kiểm bằng git, không đoán:

- `HEAD` đã có `data-act="loai"` y hệt;
- `veBienTap` **chưa bao giờ** rẽ theo `kieu`;
- 99 dòng diff của tôi hôm nay **không dòng nào** chạm `veBienTap` · `bt-nguy` ·
  `data-act="loai"`.

⇒ Bug có TRƯỚC, không do sự cố dữ liệu 2026-09-10.

## Gốc — một guard viết dạng "phủ định MỘT ca"

`multiwindow.inline.ts:485`

```js
if (tuyChon?.kieu !== "nhap") void tai(id, 0);
```

`tai()` là đường của **bài trong kho**: nó `fetch /api/articles/<loai>/<slug>`
rồi phát bộ nút *Đưa lên site · Sửa · Loại · Bỏ khỏi kho*.

`T03-113` đã sửa **đúng lớp lỗi này** — chú thích ngay trên dòng ấy còn ghi:
*"Một bản NHÁP không tồn tại trong kho… Sai CỬA, không sai API."* Nhưng nó
được viết thành **danh sách loại trừ một phần tử**. Khi `T03-122` thêm cửa sổ
`kieu: "transcript"`, ca mới lọt qua guard, gọi `tai()`, nhận 404 — và bốn nút
chân cửa sổ chết đúng cùng một cách đã chết một lần.

Hôm nay có **hai** `kieu` không phải bài kho (`nhap`, `transcript`). Guard chỉ
biết một.

## Kỳ vọng

- Chỉ cửa sổ **bài kho** mới gọi `tai()` và mới có bộ nút phán quyết.
- Guard **fail-closed**: `kieu` lạ/mới ⇒ KHÔNG gọi `tai()`, KHÔNG phát nút.
  Thêm một loại cửa sổ nữa mà quên sửa guard thì hỏng theo chiều an toàn
  (thiếu nút) chứ không theo chiều 404 (nút chết).
- Cửa sổ transcript **không** có `Loại` / `Bỏ khỏi kho`. Muốn loại thì loại
  **bản ghi gốc**, không phải loại cái transcript.

## Ngoài phạm vi

- Thêm đường "mở bản ghi gốc" từ cửa sổ transcript — hữu ích, nhưng là tính
  năng, không phải cái bug này.
