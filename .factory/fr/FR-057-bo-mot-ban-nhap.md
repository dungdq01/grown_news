# FR-057 — Bỏ một bản nháp: trạng thái `da_bo`, không xoá hàng

- **mở**: 2026-09-04 · **người quyết**: chủ dự án (*"duyệt cả 2"*, lối **(a)**) ·
  **trạng thái**: đã duyệt
- **artifact chạm**: `.factory/fr/FR-046-nhap-chung-cat-luu-db.md` **§1**
  (vòng đời của `nhap_chung_cat`) · kéo theo `web/api/loi.schema.sql`
  (`CHECK` của `trang_thai`) · `web/api/dungchung.mjs` · `web/api/nhap-cua.mjs` ·
  màn triage `/chung-cat/nhap/`
- **mở khoá**: hành động thứ tư của `T03-94` (Duyệt · Sửa · Trả lại · **Xoá**) —
  nút đang có mặt trong hợp đồng màn mà **không cửa nào nhận nó**.

## 0 · Vì sao phải FR

`FR-046 §1` khai vòng đời `nhap → da_sua → da_duyet | tra_lai`. Không giá trị
nào nghĩa *"đã bỏ"*, và `T08-27` vừa siết enum đó thành `CHECK` ở DDL — đúng
theo FR. Nên **thêm một trạng thái là sửa một FR đã chốt**, không phải một chi
tiết thi công.

Backlog `06_modules/M08_api/backlog.md` mở ô này lúc phát hiện (`T08-22`) và ghi
hai lối; ô đó tick bằng **FR id này**.

## 1 · Chốt

Thêm **`da_bo`** vào vòng đời:

```
nhap → da_sua → da_duyet | tra_lai | da_bo
```

`FR-046 §1` đọc lại thành: `trang_thai: nhap → da_sua → da_duyet | tra_lai | da_bo`.

**Bỏ ≠ xoá.** Hàng CÒN, `ban_goc_ai` CÒN, `ban_hien_tai` CÒN.

Ba lý do, không phải một:

1. `ban_goc_ai` là thứ **tốn token model để tạo** và là thứ duy nhất trả lời
   *"người đã sửa những gì"* — `FR-046 §1` gọi nó **bất biến**. Xoá hàng là xoá
   nó, và không có FR nào cho phép.
2. `rule.md` mục 4 cấm agent tự xoá dữ liệu. Một cửa HTTP xoá hàng là đúng thứ
   đó, chỉ khoác áo API.
3. Vết: `audit_loi` ghi *"ai bỏ"*, nhưng một hàng đã biến mất thì dòng audit trỏ
   vào hư không. Giữ hàng thì vết còn đối tượng.

## 2 · Cửa + luật

- `POST /api/nhap-chung-cat/<ulid>/bo` — cùng khuôn ba cửa đổi trạng thái đã có
  (`T08-22`: `sua` · `tra-lai` · `duyet`), qua `loiDoiTrangThaiNhap`.
- **`ly_do` bắt buộc, ≥5 ký tự** — y như `tra-lai`. Bỏ một bản mà không nói vì
  sao là mất câu duy nhất người sau cần đọc.
- **Một chiều**: `da_bo` **không** đi tiếp sang trạng thái nào. Muốn dùng lại thì
  đó là một quyết định mới, và nó cần một FR nói ra — không phải một nút.
- **`da_duyet` KHÔNG bỏ được.** Bản đã duyệt là file đã nằm trong `kb/`; bỏ hàng
  nháp không gỡ file ra, và để hai thứ lệch nhau là dựng hai nguồn chân lý
  (`B-C1`). Gỡ một bài khỏi kho là đường khác (thùng rác của kho), không phải
  đường này.
- Mặc định **danh sách triage KHÔNG hiện** `da_bo` — nó là hàng đợi việc phải
  làm. Lọc tường minh `?trang_thai=da_bo` thì hiện.

## 3 · KHÔNG làm trong FR này

- Không thêm đường **xoá hàng** nào, cho bất kỳ vai nào.
- Không đụng `ban_goc_ai`, `B-C1`, `FR-028`, `M05-R1`.
- Không đổi ba trạng thái cũ, không đổi cửa cũ.
- Không ký `FROZEN.lock` — `loi.schema.sql` và `FR-046` đều không frozen
  (`grep -c` trên `FROZEN.lock` = 0). FR này tồn tại vì `FR-046` **đã chốt**,
  không vì file bị khoá.

## 4 · Đóng khi

- `FR-046 §1` sửa xong, có dòng trỏ về FR-057.
- `CHECK` ở `loi.schema.sql` nhận đúng **năm** giá trị; DB đang chạy đi qua
  `diTruLoi()` (di trú của `WO-044`) — `ALTER TABLE` không đổi được `CHECK`.
- Cửa `bo` có cổng ĐỎ trước, và ba ca âm: thiếu `ly_do` · `da_duyet` bỏ được
  không · `da_bo` đi tiếp được không.
- Ô backlog `XOÁ nháp` tick bằng `FR-057`.
