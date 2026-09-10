# WO-090 · Tab `Kết quả`: chip "tất cả" nói dối, và vẽ lại theo `SCR-26`

| | |
|---|---|
| **Loại** | bug + cải tiến UI · M03_web |
| **Mức** | `hard` — con số sai, người dùng THẤY |
| **Mở** | 2026-09-10, chủ dự án: *"Tab kết quả cũng design lại, tab này mới là nơi hiển thị tất cả bản và trạng thái nhé. (hiện tại mục Kết quả đó đang lỗi.)"* |

## Repro

Ảnh 2026-09-10, tab `Kết quả`:

```
chip:  [tất cả] nháp  đã gửi duyệt  đã duyệt  trả lại  đã bỏ      3 bản nháp
ô số:   2 nháp · 0 đã gửi duyệt · 0 trả lại · 1 đã vào kho
```

DB thật có **8** bản: `da_bo 5 · nhap 2 · da_duyet 1`.

- Chip `tất cả` hiện **3**.
- Chip `đã bỏ` hiện **0**, dù có 5.

## Gốc — FE lọc CLIENT trên một tập ĐÃ BỊ SERVER LỌC

`chungcat.inline.ts:1631` luôn gọi **một** đường, không kèm trạng thái:

```js
const r = await fetch("/api/nhap-chung-cat?n=50");
```

rồi `:687` lọc lại trong bộ nhớ:

```js
const hien = NH_LOC ? CC_NHAP.filter((v) => v.trang_thai === NH_LOC) : CC_NHAP;
```

Mà cửa mặc định **cố ý** bỏ `da_bo` — `dungchung.mjs:1607`, `T08-29`/`FR-057`,
chú thích ghi rõ: *"Danh sách này là HÀNG ĐỢI VIỆC PHẢI LÀM (`T03-94`), và một
bản đã bỏ không còn là việc."*

⇒ **Cửa không sai.** Sai là tab `Kết quả` mượn hàng-đợi-việc rồi dán nhãn
*"tất cả"*. Lọc client trên một tập đã bị lọc server thì chip `đã bỏ` không bao
giờ có gì để lọc.

## Vì sao KHÔNG đổi mặc định của cửa

Mặc định ấy đang bảo vệ hàng đợi việc của `T03-94`, và nó có lý lẽ viết sẵn.
Đổi nó là sửa đúng chỗ đang đúng để chữa một chỗ khác.

⇒ Thêm một **cờ tường minh** để bên gọi xin cả `da_bo`. Hàng đợi việc giữ
nguyên hành vi; tab `Kết quả` xin thêm.

Không nhồi vào `trang_thai=tat-ca`: `trang_thai` là một **enum trạng thái**, và
nhét một giá trị-không-phải-trạng-thái vào đó là chỗ ca thứ ba sẽ lệch.

## Kỳ vọng

### A · "tất cả" phải là tất cả

- Cửa nhận `?gom_da_bo=1` ⇒ trả **cả** `da_bo`. Không cờ ⇒ **y như cũ**.
- Tab `Kết quả` gọi kèm cờ ấy; chip `đã bỏ` hiện đúng 5, `tất cả` hiện đúng 8.
- Bốn ô số đếm trên **tập đầy đủ**, và nhãn của chúng nói đúng thứ chúng đếm.
- `tong` vẫn đếm CÙNG tập với `dong` — `dungchung.mjs` đã ghi: *"Hai câu lệnh
  đếm hai tập khác nhau là cách một badge nói dối"*.

### B · Vẽ lại theo ngôn ngữ `SCR-26`

Tab này là **lịch sử**, đối trọng của Hàng việc (chỉ bản cuối). Dùng lại đúng
bộ hình đã duyệt, không phát minh bộ thứ hai:

- gộp theo **bài gốc**, tiêu đề thật làm đầu — `ccNhom` + `tenBai` đã có.
- **mốc ngày** — `ccTheoNgay` đã có.
- **cột sống màu** + **icon loại nguồn** — `.cc-song` + `nhanNguon` đã có.
- trạng thái đọc bằng **màu chip**, không bằng một hàng nút thứ hai.

Khác Hàng việc đúng một điều: **không** gọi `ccBanCuoi` — ở đây mọi bản đều
hiện, kể cả bản đã bị thay thế. Đó chính là vai của tab này.

## Ngoài phạm vi

- Thùng rác — tab riêng, không đụng.
- Diff hai bản (`nhapDiff`) — đang chạy, giữ nguyên.
