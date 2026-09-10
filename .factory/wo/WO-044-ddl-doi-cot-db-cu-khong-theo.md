# WO-044 — DDL thêm cột mà DB ĐANG CÓ không theo; và KHÔNG cổng nào bắt được

- **loại**: bug · **mức**: **hard** · **module**: M08_api
- **mở**: 2026-09-04 · **người mở**: agent thi công (phiên 6c7880c5)
- **quy chủ**: **mã của tôi** — `T08-27` (WO-043). `git status` →
  `?? web/api/loi.schema.sql`, `?? web/_loi.sqlite`. Không phải của ai khác.

## Repro

```
# 1 · server THẬT, DB đã tồn tại từ trước T08-27
curl -s http://127.0.0.1:8787/api/nhap-chung-cat
→ 500 {"loi":"no such column: khang_dinh_bi_tia"}

# 2 · nhưng MỌI cổng đều xanh
node web/test/loi-nhap-cua.test.js   → pass (30 ok)
node web/test/loi-cua.test.js        → pass
cd web && npm test                  → exit 0 · 2785 ok

# 3 · vì sao lệch
python -c "import sqlite3; print([r[1] for r in
  sqlite3.connect('web/_loi.sqlite').execute('PRAGMA table_info(nhap_chung_cat)')])"
→ [... 'trang_thai', 'review_status', ...]   # KHÔNG có khang_dinh_bi_tia, ly_do
```

## Bug

`loi.schema.sql` dùng `CREATE TABLE IF NOT EXISTS`. `T08-27` thêm hai cột và
siết `CHECK` — nhưng với một DB **đã tồn tại**, câu đó là **no-op**. Bảng cũ
giữ 9 cột và `CHECK` ba giá trị; mã mới `SELECT` 11 cột ⇒ 500 ngay cửa đầu.

## Vì sao đây là lỗi HARD

**Không phép kiểm nào bắt được, và lý do là cấu trúc của bộ cổng**: mỗi cổng
gọi `dungSchema()`/`LOI_DB` trỏ vào **thư mục tạm**, nên nó luôn chạy trên một
DB **mới toanh** — nơi `CREATE TABLE` chạy thật. Tức bộ cổng đo *"schema đúng
khi dựng từ đầu"*, và **không ai đo** *"schema đúng khi DB đã có"*.

Đó là hai câu khác nhau, và câu thứ hai là câu người dùng gặp. Suite xanh 2785
phép đo trong khi cửa đầu tiên trả 500 trên máy đang chạy.

⚠️ Tôi đã viết trong `T08-27`: *"bảng chưa có dữ liệu thật ⇒ 0 migration"*.
Câu đó đúng về **dữ liệu** và sai về **file**: `web/_loi.sqlite` tồn tại từ các
lượt smoke test, và một file rỗng vẫn có SCHEMA.

## Đo trạng thái DB đó — RỖNG HOÀN TOÀN

```
nhap_chung_cat = 0 hàng · nguoi_dung = 0 · phien = 0 · ma_moi = 0
dinh_danh_kenh = 0 · audit_log: no such table
```

`?? web/_loi.sqlite` (untracked, 65 KB). Không có một hàng nào để mất.

## Hai lối — CHỜ NGƯỜI, vì `rule.md` mục 3 và 4

`rule.md` mục 3: *"không được tùy tiện chỉnh sửa database"* · mục 4: *"không
được tự ý xoá file… nếu không có sự kiểm định và cho phép từ tôi"*.
Nên tôi **không** tự làm cả hai lối dưới:

**(a) Xoá `web/_loi.sqlite` (rỗng) và để nó dựng lại** — đúng nghĩa "0
migration", và hợp với việc bốn file của T08-19 còn `??`. Rẻ nhất, và mất đúng
0 hàng dữ liệu.

**(b) Viết đường DI TRÚ thật** — `ALTER TABLE ADD COLUMN` cho hai cột (idempotent,
guard bằng `PRAGMA table_info`), nhưng **`CHECK` thì `ALTER` không sửa được**:
SQLite phải dựng bảng mới + copy + đổi tên. Đắt hơn, và với 0 hàng thì nó mua
được đúng một thứ: một đường di trú tồn tại sẵn cho lần đổi schema SAU.

⇒ Khuyến nghị **(a) bây giờ + mở một đơn vị cho (b) sau**: hôm nay không có dữ
liệu, nhưng ngày có dữ liệu thì `CREATE TABLE IF NOT EXISTS` vẫn là no-op và
lỗi này quay lại — lần đó không xoá được.

## Sửa KÈM THEO, không chờ quyết: cổng phải đo được ca này

Dù chọn lối nào, **bộ cổng vẫn không đo được "DB đã có, schema đổi"**. Cần một
phép kiểm dựng DB theo schema CŨ rồi áp schema MỚI và đòi mọi cửa còn chạy.
Không có nó, lần đổi cột sau lặp lại y hệt — và lại xanh 2785 phép đo.

## tiêu_chí

- AC1: `GET /api/nhap-chung-cat` trên server THẬT trả 200
  - cmd: `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8787/api/nhap-chung-cat`
  - đỏ_khi: 500 với `no such column`
- AC2: cổng MỚI dựng DB theo schema CŨ rồi áp schema mới ⇒ mọi cửa nháp còn chạy
  - cmd: `node web/test/loi-nhap-cua.test.js`
  - đỏ_khi: cổng chỉ chạy trên DB mới toanh (không đo được ca này)
- AC3: suite web xanh
  - cmd: `cd web && npm test`
