# T03-36 — WO-013/1: sửa một bản về màn nạp CỦA MODULE đó (đơn vị CODE)

> `suaTuCua()` gọi `doiView("napbaiviet")` **không điều kiện**. Sửa một TÀI LIỆU
> hoặc một VIDEO đưa người dùng sang màn nạp **BÀI VIẾT** — đúng "gộp chung màn"
> người dùng cấm, và nhìn thấy được.
>
> Đích đọc từ `man-hinh.json` qua `module`, y khuôn `nutNap()` của WO-012: màn
> nạp của module chứa `source_type` của bản đang sửa. Không gõ ba đường.
>
> **Đơn vị này gần như MIỄN PHÍ về JS** — thay một hằng bằng một phép tra. Đó là
> lý do nó tách riêng: `gn.js` còn **5 byte**, và hai mục kia của WO-013 phải chờ
> quyết định tách bundle.
>
> Bản `tai-lieu`/`video` chưa có form sửa riêng (mục 2 của WO-013), nên tạm thời
> chúng về màn nạp của mình mà **chưa có ô hiện vật**. Đó là một bước ĐÚNG HƯỚNG
> chưa đủ, không phải một bước sai — và nó phải nói ra ở màn, không im lặng.

phạm_vi_ghi:
  - web/plugins/multiwindow/src/scripts/multiwindow.inline.ts

verifiability: hard
tiêu_chí:
  - AC1: sửa một bản `tai-lieu` ⇒ về `/tai-lieu/nap/`; `video` ⇒ `/video/nap/`;
      `paper`/`repo`/… ⇒ `/bai-viet/nap/`
    cmd: cd web && node test/sua-dung-man.test.js
  - AC2: đích DẪN XUẤT từ `man-hinh.json` — không gõ ba đường trong bundle
    cmd: cd web && node test/sua-dung-man.test.js
  - AC3: ngân sách — `gn.js` ≤ 102400 BYTE (không phải ≤ 100 KB làm tròn)
    cmd: cd web && node build-fe.mjs && node test/sua-dung-man.test.js
  - AC4: không hồi quy — cả bộ test web
    cmd: cd web && npm test
phụ_thuộc: T03-35
