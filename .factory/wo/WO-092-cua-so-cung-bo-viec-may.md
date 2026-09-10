# WO-092 · Tab Chưng cất trong CỬA SỔ vẫn cõng việc của máy

| | |
|---|---|
| **Loại** | bug · M03_web (chunk `cctab`) |
| **Mức** | `hard` |
| **Mở** | 2026-09-10, chủ dự án: *"trong multi window vẫn còn sinh thumbnail gì đấy? bảo bỏ hết chỉ có sinh transcript và chưng cất mà? Càng sửa càng thấy ngu vậy?"* |

## Quy chủ — lỗi của tôi, và đúng loại lỗi tệ nhất

`WO-088` bỏ việc của máy khỏi đường ống **ở màn `/chung-cat/`** (`ccNapNhap`),
nhưng danh sách việc trong CỬA SỔ là **một bộ vẽ khác** (`veViecCuaBan`,
`cctab.inline.ts:1429`) và nó chỉ lọc theo `slug`:

```js
ds = (j.dong ?? []).filter((v) => (v.payload?.slug ?? v.slug) === ban.slug)
```

Một luật, hai chỗ vẽ, tôi sửa một. Đó là chính lớp lỗi `go_khung` đã ghi:
*"hai bản của một phép là hai bản sẽ lệch"* — và lần này tôi tự tạo ra nó.

## Kỳ vọng

- Danh sách việc trong cửa sổ dùng **cùng** phép lọc với màn `/chung-cat/`:
  chỉ `sinh-transcript` + `chung-cat-mot-nguon`.
- Việc của máy HỎNG vẫn nổi (cùng luật `ccVatHong`).
- Phép lọc khai **MỘT chỗ**, hai bên cùng đọc — không chép sang chunk thứ hai.

## Ngoài phạm vi

- Bản nháp đã dọn ⇒ dòng chưng cất không mở được gì — `WO-093`.
