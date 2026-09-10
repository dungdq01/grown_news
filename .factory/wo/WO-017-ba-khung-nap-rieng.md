# WO-017 — ba đường nạp phải là ba KHUNG riêng; hai trong ba không có lối vào

loại: thiếu tính năng + lối vào chết
module: **M03_web** (`shell.html` · `trang.mjs` · FE) · M10_tailieu · M11_video
mức: người dùng THẤY được — *"các url như video/nap đang bị ẩn"*

## Người dùng nói (2026-08-28)

> - mục nạp bài / thêm video / thêm tài liệu nên cần **tách riêng khung / tab**
> - Hiện trạng chỉ thấy update cho viết bài, **chưa có form và design UI cho tài
>   liệu / video**. Và các url như `video/nap` … **đang bị ẩn**
>
> ⇒ design lại layout nạp bài, **mỗi loại 1 kiểu riêng, tab component riêng**

## Gốc, đo được

**Lối vào chết.** Cả ba URL trả **200**, nhưng rail chỉ có bảy tab
(`all` · `baiviet` · `tailieu` · `video` · `home` · `kho` · `concepts`) và
**không tab nạp nào**. Đường duy nhất vào màn nạp là nút "+ VIẾT BÀI", và nút đó
gắn cứng `data-nav="napbaiviet"` ⇒ đứng ở `/video/` bấm nó vẫn ra nạp **bài
viết**. Hai màn `/tai-lieu/nap/` và `/video/nap/` **không có lối vào nào** — dựng
xong ở C6a/C6b rồi để đó.

**Khung rỗng.** `/tai-lieu/nap/` 2004 byte · 3 ô nhập · **0** `<select>`;
`/video/nap/` 1625 byte · 3 ô · **0** `<select>`. So với `/bai-viet/nap/`:
9244 byte · 15 ô · 3 select, có dải ba lối (Dán link · Nộp file .md · Tự viết
bài) và bảng cổng. Hai màn kia không có dải lối, không có bảng cổng, không có ô
nhãn — chúng là chỗ đặt tạm, không phải khung.

## Chốt của người dùng (2026-08-28)

**Nút nạp theo ngữ cảnh màn đang đứng**, rail giữ 7 tab:

```
đứng /bai-viet/  ⇒ nút "+ VIẾT BÀI"  → /bai-viet/nap/
đứng /tai-lieu/  ⇒ nút "+ TÀI LIỆU"  → /tai-lieu/nap/
đứng /video/     ⇒ nút "+ VIDEO"     → /video/nap/
đứng /tat-ca/ · /kho/ · Dashboard · Danh mục ⇒ nút mở BA lựa chọn
```

Không thêm nhóm NẠP vào rail (rail 10 tab dài gấp rưỡi, ba icon mới, và mỗi màn
loại vốn đã có đúng một đường nạp của nó). Không gộp về một `/nap/` — đó chính là
cấu trúc FR-038 vừa tách ra, và ba URL riêng sẽ mất.

## Kỳ vọng

1. Đứng ở màn nào thì nút nạp mang chữ và đích của **màn đó** — đo bằng
   `data-nav` của nút trên từng trang, không đo sự có mặt của chuỗi
2. `/tai-lieu/nap/` có dải lối **riêng của tài liệu** (chọn file · dán link tài
   liệu), ô nhãn, bảng cổng — không dùng lại dải của bài viết
3. `/video/nap/` có dải lối **riêng của video** (dán URL · tải lên), ô nhãn,
   bảng cổng
4. Ba dải lối là ba `component` khác nhau: đổi dải của tài liệu không đổi hai dải
   kia — phép kiểm phải phá được một dải và thấy hai dải còn lại nguyên
5. Không màn nạp nào hiện trên trang không phải của nó (`catNap()` vẫn cắt đúng)

## Ràng buộc

- **`gn.js` dư 1178 byte.** Hai form mới KHÔNG vừa. Đường được phép: **tách
  bundle** — mã nạp/form là 20941 byte (23% `gn.js`) và `catNap()` đã cắt các
  view nạp khỏi 7/10 trang, nên nó là tải chết trên phần lớn trang. **Không nới
  trần** (`page-weight.test.js:85-89` có tiền lệ "SIẾT, không nới").
- Ba chữ trên nút phải qua `data-i18n`, không gõ chuỗi trong FE.
- `data-nav` chỉ `[a-z]` — `rail-trai.test.js:137,167` bắt `data-nav="[a-z]+"`,
  gạch nối làm nhãn lặng lẽ ra khỏi phép đo.
- Nút nạp ở HEADER, ngoài `.bk` ⇒ phải bắt **trước** `bam():638`
  (`const win = t.closest(".bk"); if (!win) return`).

## Thứ tự

WO-016 trước (phần lớn SSR, vừa ngân sách hiện có) → tách bundle → WO-017.
Tách bundle là **đơn vị việc riêng**, không nhập vào WO này.
