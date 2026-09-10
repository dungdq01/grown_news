# T08-34 — cửa `GET /api/tai-video/<ulid>`: trả file video từ thư mục tạm

> Tách khỏi `T12-26` vì `check_g6b` bắt đúng: `web/api/**` nằm NGOÀI boundary
> `chungcat/**` của M12. Một đơn vị ghi sang module khác thì `R1` mất địa chỉ
> — hỏng ở cửa web mà quy về M12 là quy sai chủ.
> ID rule 9: max M08 = 33 ⇒ 34.

## Vì sao cửa này STREAM, không đọc cả file

Job `tai-video` (`T12-26`) kéo về một file **hàng trăm MB** vào thư mục tạm
NGOÀI repo. Đọc cả file vào bộ nhớ rồi trả là cách một cửa API giết tiến trình
web bằng đúng một cú bấm.

## Vì sao đường file đến từ KẾT QUẢ JOB, không từ URL

Người gọi chỉ đưa được `ulid`, và ULID không đoán được — đó là toàn bộ phép
phân quyền ở đây (chưa có phiên đăng nhập web, `spec M12 §1.1`). Nhưng cửa
**vẫn** kiểm `basename` khớp khuôn `<26 ký tự ULID>-<bậc>p.mp4` trước khi mở:
tin thẳng vào một chuỗi do tiến trình khác trả về là không tin gì cả.

Thư mục đi **kèm** trong `ket_qua.thu_muc` chứ không để cửa web tự phân giải
`CHUNGCAT_XUAT_TAM`: hai chỗ phân giải cùng một đường bằng hai ngôn ngữ là hai
chỗ để lệch, và ngày env đổi thì chỉ một trong hai biết.

## Chưa xong KHÁC hết hạn

Hai câu 404 riêng. Người đọc cần biết mình phải **ĐỢI** hay phải **BẤM LẠI**,
và gộp hai ca vào một câu là bỏ mất đúng thông tin ấy.

phạm_vi_ghi:
  - web/api/tho-cua.mjs      # `cuaTaiVideo`
  - web/api/router.mjs       # đấu đường
# vế cổng thuộc đơn vị test của M08 (`loi-tho-cua.test.js` mở rộng CÙNG LƯỢT) — R1

verifiability: hard
tiêu_chí:
  - AC1: job `tai-video` xong ⇒ 200 stream, `content-disposition` mang tên
      `<slug>-<bậc>p.mp4` (tên NGƯỜI đọc được, không phải `<ulid>-…`)
    cmd: node web/test/loi-tho-cua.test.js
  - AC2: job chưa xong ⇒ 404 nói rõ *chưa tải xong* + giai đoạn hiện tại;
      file đã bị dọn ⇒ 404 nói rõ *quá hạn, bấm tải lại*
    cmd: node web/test/loi-tho-cua.test.js
    đỏ_khi: hai ca trả cùng một câu
  - AC3: `ulid` của một việc KHÁC loại ⇒ 404; `tep_tam` không khớp khuôn ⇒ 422
      (không mở file)
    cmd: node web/test/loi-tho-cua.test.js
  - AC4: suite web xanh
    cmd: cd web && npm test
