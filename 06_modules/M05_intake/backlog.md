# M05_intake — backlog

> Ô `[ ]` **chết ở gate**. Ô trỏ artifact FROZEN chỉ tick bằng **FR id**.
> Mở ô **ngay lúc phát hiện**.

## Mở

- [ ] **Tiêu đề `§2.2` viết *"Bốn việc"*, bảng có NĂM hàng.**
  Việc thứ 5 (dọn `_inbox/`) thêm 2026-08-24 cùng lúc sửa bug ghi-đè; tiêu đề
  không đi theo. Con số thứ tư cùng lớp *tự khai* trong bốn module liền
  (M01 ba số · M02 *"0 bài"* · M04 *"31 bước"*) ⇒ **không** phải lỗi riêng của
  M05, là chỗ **thiếu một cổng** đếm-số-trong-artifact.
  · object: `06_modules/M05_intake/spec.md §2.2` ⇒ **FR id** (spec FROZEN)

- [ ] **Năm AC không đủ để viết MỘT kết quả mong đợi.**
  `AC-2.2.4 edge 3` (INSERT trước hay đổi-tên trước — và đảo thứ tự làm **mất
  bài im lặng** ở ca lỗi) · `AC-2.2.1 edge 2` (trường **thừa**) ·
  `AC-2.2.2 edge 2` (`word_count` **vắng** chứ không sai) · `AC-2.2.3 edge`
  (`origin: pipeline` bị ép im lặng hay trả lại) · `AC-2.4.1 edge 2` (YAML không
  parse được: *"sai frontmatter"* hay *"không có frontmatter"*).
  Cả năm là ca **thật sẽ xảy ra**. Mã đang chạy đã chốt một hành vi cho mỗi ca;
  AC **không** nói hành vi nào ⇒ một lần viết lại chọn khác mà mọi cổng vẫn xanh.
  · object: `06_modules/M05_intake/testcases.md` ⇒ **FR id** (spec FROZEN)

- [ ] **Thứ tự năm việc chưa có cổng nào canh.**
  Spec kể nó bằng một bảng. Đảo ④/⑤ ⇒ đổi tên trước, INSERT thất bại ⇒ bài
  **không** vào kho mà file **đã** đánh dấu đã-vào-kho. Bỏ ⑤ ⇒ mỗi lần chạy xử
  lý lại từ đầu, **chính là cơ chế** của bug ghi-đè 2026-08-24.
  · object: `05_intake/gate.py` · `06_modules/M05_intake/workflow.md`

- [ ] **`AC-2.3.2` khai `soft` mà bỏ mất một vế ĐO ĐƯỢC.**
  AC nói *"không lệnh nào phân biệt được"* — đúng cho *"người có mở link không"*,
  nhưng bỏ câu *"link có phân giải được không"*. Vế thứ hai là `hard` và cổng
  **có thật**: `unverifiable_citations` phải `true` khi 0/N địa chỉ phân giải
  được — nó vừa bắt `core/tests/fixtures/dat-chuan.md`
  (xem `06_modules/M04_ci/testcases.md §cuối` mục 1).
  · object: `06_modules/M05_intake/spec.md §2.3` ⇒ **FR id**

## Đã đóng

*(chưa có)*
