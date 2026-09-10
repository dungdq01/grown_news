# T03-40 — WO-013/2: form sửa tài liệu có ô HIỆN VẬT (đơn vị CODE)

> Sau T03-36, sửa một bản `tai-lieu` về đúng `/tai-lieu/nap/`. Nhưng màn đó chỉ
> có lối NẠP MỚI — không có chỗ nào hiện hiện vật đang gắn, nên người dùng sửa
> một tài liệu mà **không thấy** file của nó.
>
> `media` KHÔNG mất (đo ở WL-01K9NNWO013: `{...FM_GOC}` giữ nó, và `FM_GOC = null`
> thì validate trả 422). Đây là **thiếu tính năng**, không phải mất dữ liệu — và
> WO-013 đã ghi rõ điều đó thay vì lặp lại lời cảnh báo sai của plan.
>
> Hiện: tên gốc · định dạng · kích cỡ · nút mở xem. Thay: chọn file mới ⇒ nạp
> byte ⇒ trỏ `media` sang sha mới. Byte cũ thành mồ côi và `xuat_kho` reap nó ở
> lần export kế — đó là hành vi ĐÚNG của M09-R1, không phải rò rỉ.
>
> **Ngân sách**: `gn.js` 99344/102400 — dư **3056**. Đủ, nhưng đo lại sau mỗi
> lần build.

phạm_vi_ghi:
  - web/render/shell.html
  - web/plugins/home-pages/shell.html
  - web/render/trang.mjs
  - web/plugins/multiwindow/src/scripts/multiwindow.inline.ts

verifiability: hard
tiêu_chí:
  - AC1: mở sửa một bản `tai-lieu` ⇒ màn nạp tài liệu hiện tên gốc + định dạng +
      kích cỡ của hiện vật đang gắn
    cmd: cd web && node test/o-media-sua.test.js
  - AC2: LƯU mà KHÔNG đổi file ⇒ `media.sha256` không đổi (chiều âm: đây là chỗ
      dễ mất im lặng nhất nếu form ghi đè `media` bằng rỗng)
    cmd: cd web && node test/o-media-sua.test.js
  - AC3: THAY file ⇒ `media.sha256` trỏ sha MỚI, và bản ghi vẫn qua validate
    cmd: cd web && node test/o-media-sua.test.js
  - AC4: ngân sách BYTE + không hồi quy
    cmd: cd web && node build-fe.mjs && node test/sua-dung-man.test.js && npm test
phụ_thuộc: T03-39
