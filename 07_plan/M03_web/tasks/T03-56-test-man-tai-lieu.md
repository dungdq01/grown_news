# T03-56 — M10_tailieu: cổng cho ba AC của spec (đơn vị TEST)

> `web/test/man-tai-lieu.test.js` (MỚI). Cùng lỗ với T03-55: spec
> `06_modules/M10_tailieu/spec.md` khai ba AC bằng
> `cmd: node test/man-tai-lieu.test.js` từ C0 (FR-038) và file đó chưa từng tồn
> tại. Spec FROZEN ⇒ không sửa spec cho nó trỏ chỗ khác.
>
> **KHÔNG đo lại thứ đã có cổng.** `o-media-sua.test.js` §3 đã đo vế nặng của
> AC-2.2.2 (PUT không đụng file ⇒ `sha256` không đổi; nạp file mới ⇒ nó đổi).
> Chép sang đây là hai bản của một sự thật.
>
> **§1 · AC-2.2.1** — gieo cả ba module, đòi màn chỉ hiện 3 thẻ tài liệu. Một
> trong ba là ĐỊNH DẠNG LẠ (`octet-stream`): FR-039 chốt bảng mime thôi làm cổng
> nhận, nên bỏ ca này thì §1 chỉ chứng minh cho pdf/docx. Kèm hai bằng chứng
> phép đo không mù: phạm vi (toàn trang > khối) và **phân biệt được** (khối
> `v-all` có nhiều hơn một loại).
>
> **§2 · AC-2.2.2 vế CƠ CHẾ** — spec nói đích danh *"và điều đó đúng vì form CÓ ô
> `media`, không vì `FM_GOC` giữ hộ"*. `sha256` không đổi là KẾT QUẢ; ô trên form
> là CƠ CHẾ. Cộng: `suaTuCua` không gán cứng một tên màn (lỗ WO-013 —
> `doiView("napbaiviet")` không điều kiện đưa người sửa tài liệu sang màn bài viết).
>
> **§3 · AC-2.3.1** — nhãn + ô `cat`/`cpt`, không đoán tiền tố id.
>
> **§4** — spec §4 cấm trộn: đo bằng SLUG, phép đo khác hẳn §1. Số đếm đúng vẫn
> có thể là ba thẻ SAI.

phạm_vi_ghi:
  - web/test/man-tai-lieu.test.js
  - web/test/WORKLOG.md
  - web/package.json

verifiability: hard
tiêu_chí:
  - AC1: cổng chạy được và xanh, đúng lệnh spec khai
    cmd: cd web && node test/man-tai-lieu.test.js
  - AC2: có trong `npm test`, không cổng nào khác đỏ thêm
    cmd: cd web && npm test
