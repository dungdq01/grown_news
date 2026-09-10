# T03-53 — WO-022: cổng cho id video phân biệt hoa–thường (đơn vị TEST)

> `web/test/id-video-hoa-thuong.test.js` (MỚI). ĐỎ trước (R5).
>
> **§1 · Chạy BYTE ĐÃ BUILD, không chép tay lại hàm.** Cắt thân `idVideo` ra khỏi
> `gn.js` rồi `new Function`. Chép tay một bản thứ hai là kiểm bản chép, không
> kiểm thứ người dùng chạy — và bản chép luôn đúng vì tôi vừa viết nó.
>
> **§2 · Ca ĐỎ: id có chữ hoa phải đi qua NGUYÊN VẸN.** `dQw4w9WgXcQ` là id thật.
> Phép kiểm so **từng ký tự**, không so độ dài và không so `id_mau` — id sai vẫn
> khớp `^[A-Za-z0-9_-]{11}$`, nên `id_mau` không phân biệt được đúng với sai. Đó
> chính là lý do bug sống sót.
>
> **§3 · Host vẫn so KHÔNG phân biệt hoa–thường.** `YouTube.com/watch?v=…` phải
> nhận. Sửa §2 bằng cách bỏ luôn `.toLowerCase()` thì §3 đỏ — hai vế kẹp phép sửa
> từ hai phía.
>
> **§4 · `src` iframe dựng từ whitelist + id, đúng M09-R3.** Đo `nhung + id` chứ
> không đo `id` một mình: thứ tới trình duyệt là chuỗi ghép.
>
> **§5 · Ca âm giữ nguyên:** host lạ ⇒ `null`; id sai hình dạng ⇒ `null`.

phạm_vi_ghi:
  - web/test/id-video-hoa-thuong.test.js
  - web/test/WORKLOG.md
  - web/package.json

verifiability: hard
tiêu_chí:
  - AC1: cổng ĐỎ trên code hiện tại, nói ra id nhận được khác id kỳ vọng
    cmd: cd web && node test/id-video-hoa-thuong.test.js; test $? -ne 0
  - AC2: sau T03-54 XANH, và có trong `npm test`
    cmd: cd web && npm test
