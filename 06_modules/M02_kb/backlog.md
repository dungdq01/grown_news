# M02_kb — backlog

> Ô `[ ]` **chết ở gate**. Ô trỏ artifact FROZEN chỉ tick bằng **FR id**.
> Mở ô **ngay lúc phát hiện**, không đợi làm xong.

## Mở

- [ ] **`AC-2.1.1`/`AC-2.1.2` đỏ oan: lệnh đo rộng hơn AC.**
  `validate.py kb/ --strict` exit **1** trên `3 file · 0 lỗi · 1 cảnh báo`
  (`validate.py:770` — `--strict` biến cảnh báo thành exit khác 0). Cảnh báo là
  *"3 khái niệm chờ duyệt danh mục"* — trạng thái **biên tập**, không phải vi
  phạm schema, mà hai AC chỉ khẳng định *parse + đạt schema*.
  ⇒ **Cần chủ dự án chọn** một trong hai: (a) đổi **lệnh** của hai AC sang vế chỉ
  đếm lỗi; (b) khai *"kho không được có khái niệm chờ duyệt"* thành **AC riêng**
  của M02 — hôm nay nó là hệ quả phụ của một cờ, không phải một luật ai đó quyết.
  Chạm `spec.md` **FROZEN** ⇒ tick bằng **FR id**.
  · object: `core/src/source_distiller/validate.py:770` · `06_modules/M02_kb/spec.md`
  · phát hiện: 2026-09-03, khi viết `testcases.md` (phép thử s6)

- [ ] **`§5` khai *"rỗng về nội dung — 0 bài"*, thực tế 3 bài.**
  Cùng lớp *tự khai* với ba con số lệch của M01. Không cổng nào canh con số trong
  artifact. Chạm `spec.md` FROZEN ⇒ **FR id**.
  · object: `06_modules/M02_kb/spec.md §5` · đo: `ls kb/*/*.md` = 3

- [ ] **Bốn AC không đủ để viết MỘT kết quả mong đợi.**
  `AC-2.1.2 edge 2` (file nằm ngay trong `kb/`) · `AC-2.2.2 edge 2`
  (`reject_reason` = 5 dấu cách) · `AC-2.2.2 edge 3` (`draft` **kèm**
  `reject_reason`) · `AC-2.4.1 edge 4` (một id ở **cả** `concepts[]` và
  `concepts_proposed[]`).
  Không chặn thi công — mã đang chạy đã chốt **một** hành vi cho mỗi ca — nhưng
  AC **không** nói hành vi nào, nên một lần viết lại sẽ chọn khác mà **mọi cổng
  vẫn xanh**. Đó là định nghĩa của AC mơ hồ ở s6.
  · object: `06_modules/M02_kb/testcases.md` (bốn ca đã liệt) ⇒ **FR id**

## Đã đóng

*(chưa có)*
