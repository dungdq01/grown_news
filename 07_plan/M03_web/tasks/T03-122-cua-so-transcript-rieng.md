# T03-122 — CỬA SỔ TRANSCRIPT riêng, và xem detail được từ /chung-cat/

> Chủ dự án 2026-09-07: *"Transcript → sinh text realtime và sau khi xong thì
> cửa sổ multi window hiển thị bản sinh transcript luôn (đó là cửa sổ riêng
> của transcript)"* và *"thẻ Transcript ở /chung-cat/ hiện tại nó không xem
> detail được như chưng cất"*.
> ID rule 9: max M03 = 121 ⇒ 122.

## THÊM, không sửa

Chủ dự án dặn *"chỉ làm thêm các tính năng trên, không sửa các tính năng đã
chốt từ trước"*. Nên:

- cửa sổ đọc **giữ nguyên** ba tab `Xem · Chưng cất · Transcript`
- việc này THÊM một **cửa sổ độc lập** cho transcript, mở song song

Vì sao vẫn đáng thêm dù đã có tab: tab nằm TRONG cửa sổ bản ghi, nên xem
transcript là **mất chỗ đang đọc**. Cả điểm của flow là *vừa xem video, vừa
đọc transcript, vừa duyệt bản chưng cất* — ba thứ cạnh nhau.

## Hình dạng

- `moCuaSoTranscript(slug, canh)` — cửa sổ `kieu: "transcript"`, KHÔNG chạy
  `tai()` (nó không phải một bản ghi trong kho).
- Nội dung: cue có mốc giờ, bấm một dòng nhảy tới giây ấy nếu cửa sổ video còn
  mở. Chân cửa sổ: menu Tải xuống (`srt`/`txt`/`docx`/`goc` — đã có ở
  `T03-121`).
- Việc `sinh-transcript` **xong** ⇒ tự mở cửa sổ này, đặt CẠNH cửa sổ nguồn.
- Thẻ transcript ở `/chung-cat/` và dòng trong tab ⇒ bấm là mở **cùng** cửa sổ
  ấy. Một đường, không hai.

phạm_vi_ghi:
  - web/plugins/multiwindow/src/scripts/multiwindow.inline.ts
  - web/plugins/cctab/src/cctab.inline.ts
  - web/plugins/chungcat/src/chungcat.inline.ts
# Cổng thuộc ĐƠN VỊ TEST `T03-110b` (mở rộng CÙNG LƯỢT) — `R1`.

verifiability: hard
tiêu_chí:
  - AC1: có `moCuaSoTranscript`, mở cửa sổ RIÊNG, 0 lời gọi `/api/articles/*`
    cmd: node web/test/cua-so-transcript.test.js
    đỏ_khi: mở bằng cửa sổ bài-kho generic (nó sẽ 404 như `T03-113` đã trúng)
  - AC2: thẻ transcript ở `/chung-cat/` VÀ dòng trong tab cùng mở một đường
    cmd: node web/test/cua-so-transcript.test.js
    đỏ_khi: hai màn hai đường ⇒ có ngày chúng lệch
  - AC3: việc `sinh-transcript` xong ⇒ tự mở cửa sổ, đặt cạnh cửa sổ nguồn
    cmd: node web/test/cua-so-transcript.test.js
  - AC4: chưa có transcript ⇒ KHÔNG mở cửa sổ trống, nói rõ chưa sinh
    cmd: node web/test/cua-so-transcript.test.js
  - AC5: nền web giữ xanh
    cmd: cd web && npm test
