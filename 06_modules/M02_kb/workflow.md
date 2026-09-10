# M02_kb — workflow

**Dùng trình tự chuẩn** (PHÂN TÍCH → PLAN → MÔ PHỎNG → CODE) — vì mọi đơn vị việc
của M02 là *một luật trên hợp đồng dữ liệu*, và luật đó luôn viết được thành một
fixture đỏ trước.

Bốn chỗ áp riêng — **không** phải bước mới, là cách nhịp ③ và ④ được thực thi ở
module giữ nguồn chân lý:

**③ MÔ PHỎNG — BẢN COPY TẠM của `kb/`, không bao giờ `kb/` thật.** Vòng
`kb/ → DB → kb′` có một bước **reap**: `xuat_kho` xoá mọi `.md` mà DB không có
hàng tương ứng. Chạy nó trên kho thật với một DB thiếu nhánh là **mất vĩnh viễn**
(plan `S12`), và nó chạy **tự động** sau mỗi lần ghi — không cần ai gõ lệnh.

**③b Thước trước/sau là `bam_cay()`, KHÔNG `bam_noi_dung()`.** Cái sau lặp **tên
bảng** nên đổi tên bảng làm hash đổi vì lý do vô hại. Và `git status --porcelain
kb _recycle` **không** dùng được làm thước ở dự án này: cây đã bẩn từ trước vì lý
do không liên quan (plan `S17`) ⇒ phải là **bản sao đóng băng + hai thước độc
lập**, một trong hai **không dùng SQL** (nếu cả hai tin schema mới thì một schema
sai làm cả hai nói cùng một câu sai).

**④ Đổi DDL ⇒ FR TRƯỚC.** `kho.schema.sql` và `frontmatter.schema.json` đều
frozen. `deny` S1 chặn `Write`/`Edit`; **`Bash` thì không** (`#deny-một-cửa`) —
nên cổng thật là `check_frozen`, không phải deny.

**④b Thêm một loại nguồn: sửa BẢNG KHAI, không sửa bốn chỗ.** `LOAI` từng gõ tay
ở bốn nơi (`kho.schema.sql` · `xuat_kho.py` · `dung_lai_db.py` ·
`dungchung.mjs`). Sau `core/assets/loai-nguon.json` cả ba bản code đọc chung một
file. Thêm loại mà vẫn gõ tay một chỗ ⇒ `check_khai_mot_noi` đỏ.

## Không thuộc module này

| Việc | Đi đâu |
|---|---|
| công thức `word_count` | **M01 §3** — map chỉ trỏ, không chép |
| công thức `priority` | **M06 §3** |
| `*.v<n>.md` không lên web | **chủ AC là M03** (`AC-2.5.1` tự khai thế) |
| đường ghi DB | M05 (`gate.py`) và M08 (`dungchung.mjs`) — M02 giữ **hợp đồng**, không giữ cửa |
| duyệt bài | **NGƯỜI** — không module nào (B-B1) |
