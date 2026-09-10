# M01_core — workflow

**Dùng trình tự chuẩn** (PHÂN TÍCH → PLAN → MÔ PHỎNG → CODE) — vì M01 không có
bước nào ngoài trình tự đó: mọi đơn vị việc của nó là *một cổng trong `check()`*
hoặc *một phép tính dẫn xuất*, và cả hai đều có test-tái-hiện-đỏ-trước làm nhịp ③.

Ba chỗ trình tự chuẩn **áp riêng** cho module này — không phải bước mới:

**① PHÂN TÍCH — đọc `validate.py` TRƯỚC khi đọc spec.** Spec của M01 là
`as-built` và ba con số trong nó đã lệch thực tế (`testcases.md §cuối`). Mã là
nguồn, spec là bản mô tả — **ngược** với M12–M18 nơi spec có trước mã.

**③ MÔ PHỎNG — fixture ở `core/tests/fixtures/`, KHÔNG ở `kb/`.** Mỗi fixture phá
**đúng một** luật; một fixture phá hai luật không chứng minh được cổng nào đóng
(`testcases.md AC-2.2.1 edge`). Và phép thử *"cổng có đỏ được không"* là **gỡ một
cổng rồi chạy lại**, không phải đọc mã cổng.

**④ CODE — thêm cổng thì thêm ở CUỐI dãy.** Chín cổng chạy theo thứ tự và pass
sau không chạy nếu pass trước chưa đạt. Chèn một cổng vào giữa đổi **thứ tự lỗi
được báo** của mọi file sai nhiều luật ⇒ đổi kết quả các test đang xanh vì lý do
không liên quan gì tới cổng mới.

## Không thuộc module này

| Việc | Đi đâu |
|---|---|
| đổi `frontmatter.schema.json` · `concepts.yaml` | **FR tới M02** — deny S1 chặn `Write`/`Edit`, `Bash` thì không |
| đổi ngưỡng `tran_tu_cung` · `tran_dan_nhap` | `core/assets/khung-than-bai.json` — bảng khai, và FR nếu frozen |
| bất cứ gì trong `web/**` | M03/M08 — hợp đồng giữa hai nhánh là **format `.md`**, không phải hàm |
| skill `source-distiller` | ngoài repo (`~/.claude/skills/`) ⇒ ngoài mọi cổng CI (`AC-2.1.2`) |
