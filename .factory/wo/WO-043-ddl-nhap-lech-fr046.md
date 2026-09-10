# WO-043 — DDL `nhap_chung_cat` lệch `FR-046`: thiếu một cột, sai cả enum

- **loại**: bug · **mức**: **hard** · **module**: M08_api
- **mở**: 2026-09-04 · **người mở**: agent thi công (phiên 6c7880c5)
- **quy chủ**: **mã của tôi** — `T08-19` (bản dời từ `T12-3`), `web/api/loi.schema.sql`.
  `git status` → `?? web/api/loi.schema.sql` (chưa commit). Không phải của ai khác.

## Repro

```
grep -n "trang_thai IN" web/api/loi.schema.sql
→ 91:  CHECK (trang_thai IN ('nhap', 'da_gui', 'bo'))

grep -n "khang_dinh_bi_tia" web/api/loi.schema.sql
→ (rỗng)

sed -n '31,33p' .factory/fr/FR-046-nhap-chung-cat-luu-db.md
→ `nhap_chung_cat(job_ulid, ban_goc_ai, ban_hien_tai,
    khang_dinh_bi_tia, trang_thai: nhap → da_sua → da_duyet | tra_lai, sua_luc)`
```

## Ba chỗ lệch

| `FR-046 §1` (đã duyệt) | DDL đang có |
|---|---|
| cột `khang_dinh_bi_tia` | **KHÔNG CÓ** |
| `trang_thai`: `nhap` → `da_sua` → `da_duyet` \| `tra_lai` | `nhap` · `da_gui` · `bo` |
| cột `sua_luc` | có `cap_nhat_luc` (tương đương, khác tên) |

**`da_gui` và `bo` không có nguồn.** Grep toàn repo: chúng chỉ xuất hiện trong
chính DDL này và một dòng test của nó — **không spec, không FR, không
`decisions.md`**. Tức tôi tự đặt một từ vựng rồi cưỡng chế nó bằng `CHECK`.

## Vì sao đây là bug HARD, không phải chuyện đặt tên

`T08-22` (cửa nháp: đọc + **4 hành động**) **không cài được** trên DDL này:

- **Trả lại** không có trạng thái để chuyển tới (`tra_lai` không nằm trong enum),
  và không có cột `ly_do` — mà `AC3` của T08-22 đòi *"TRẢ LẠI bắt kèm `ly_do`"*.
- **Sửa** không có `da_sua` ⇒ không phân biệt được nháp chưa ai chạm với nháp
  người đã biên tập. Màn triage `T03-94` sống bằng đúng phân biệt đó.
- **`khang_dinh_bi_tia`** là thứ `AC1` của T08-22 đòi trả về, và `T03-94` đòi
  hiện *"⚠ đã tỉa N"* **TRƯỚC** nút duyệt — không hiện là **nói dối người
  duyệt**. Không có cột thì không có gì để hiện.

⇒ Chia task vào T08-22 trước khi sửa chỗ này là chia vào một nền sai.

## RẺ NGAY BÂY GIỜ, đắt sau này

Bốn file của T08-19 còn `??` (chưa commit) và bảng **chưa có dữ liệu thật** ⇒
**0 migration**. Cùng ba sửa này sau khi có dữ liệu là một FR + một đường di trú.
Đúng lập luận đã dùng cho `B1/B2/B3` (đổi tên `lan_gui` → `lan_gui_duyet`,
thêm `review_status`) — và lần đó nó đúng.

## Kỳ vọng

DDL khớp `FR-046 §1`: thêm `khang_dinh_bi_tia`, enum bốn giá trị
`nhap|da_sua|da_duyet|tra_lai`, thêm `ly_do` cho ca trả lại.
`review_status` **giữ `CHECK` hằng `= 'draft'`** — nó là chuyện khác (`AC-1.3`),
và `da_duyet` của `trang_thai` KHÔNG có nghĩa "đã vào kho": duyệt = ghi FILE
vào `kb/` + `dung_lai_db`, từ giây đó **file là chân lý** (`FR-046 §1`).

## tiêu_chí

- AC1: enum `trang_thai` đúng bốn giá trị của FR-046; `khang_dinh_bi_tia` +
  `ly_do` tồn tại; `review_status` vẫn `CHECK` hằng
  - cmd: `node web/test/loi-cua.test.js`
  - đỏ_khi: `INSERT` với `trang_thai='da_gui'` vẫn qua, hoặc `'tra_lai'` bị chặn
- AC2: trigger `ban_goc_ai` bất biến còn nguyên sau khi sửa bảng
  - cmd: `node web/test/loi-cua.test.js`
  - đỏ_khi: `UPDATE ban_goc_ai` không còn ABORT
- AC3: suite web xanh
  - cmd: `cd web && npm test`
