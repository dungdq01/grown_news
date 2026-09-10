# BẢNG DB — sổ tay sống

> **File này KHÔNG có ngày trong tên vì nó được cập nhật liên tục.**
> Mọi báo cáo khác trong `_control_db/` là ảnh chụp một ngày; file này là
> **hiện trạng**. Có bảng mới · đổi cột · đổi khoá · thêm/bớt file `.sqlite`
> ⇒ **sửa file này ngay lượt đó**, đừng để tới lần rà soát sau.

- **Đo lần cuối**: 2026-09-10 08:18
- **Cách đo lại**: §7 — một lệnh, chép dán
- **Luật nền**: `.claude/rule.md` mục **3** (không tuỳ tiện chỉnh DB) · mục **16**
  (thử trên tmp → chủ dự án chấp nhận → rồi mới bảng thật)

⚠️ **Số hàng là ảnh chụp, cấu trúc mới là thứ ổn định.** Đo 09-08 → 09-10:
`video` 5→9, `categories` 5→11, `audit_loi` 124→2, `nhap_chung_cat` 5→0.
Đọc cột "n=" như *"lúc đo có bấy nhiêu"*, không phải một sự thật bền.

---

## 1 · Vị trí — file nào ở đâu

| # | file | chủ | loại dữ liệu | DDL ở đâu | git |
|---|---|---|---|---|---|
| 1 | **`kb/_kho.sqlite`** | M02_kb | **DẪN XUẤT** — dựng lại được từ `kb/**` | `core/assets/kho.schema.sql` | gitignore |
| 2 | **`web/_loi.sqlite`** | M18_nguoidung *(4 bảng)* · M12_chungcat *(nháp)* | **GỐC** — không dựng lại được | `web/api/loi.schema.sql` | gitignore |
| 3 | `truyhoi/index.sqlite` | M13_truyhoi | DẪN XUẤT | *(chưa có)* | — |

**Luật chỗ ở** (`ADR-06 b`): *"backend của phần nào ở đâu thì `.db` nằm ở đó"*.

### Đường dữ liệu

```
kb/**/*.md ──► dung_lai_db.py ──► kb/_kho.sqlite ──► xuat_kho.py ──► kb/**/*.md
   (file)      ĐƯỜNG file→DB       (chân lý)         chỉ SELECT       (export)
                DUY NHẤT                                              + kb/_media/

web/_loi.sqlite ──► xuatLoi() ──► _backup/*.yaml
   (chân lý)        sau MỖI ghi     (bản lùi, gitignore — FR-050 cách 2)
                                    ⚠️ MẤT Ổ = MẤT TÀI KHOẢN
```

### Thư mục kèm theo

| đường | là gì | git |
|---|---|---|
| `_backup/` | bản lùi 4 bảng của DB LÕI — `nguoi-dung` · `dinh-danh-kenh` · `nhap-chung-cat` · `audit-loi` | gitignore |
| `_backup/truoc-clear-<ngày>/` | ảnh chụp thủ công trước một lần clear (rule 16) | gitignore |
| `kb/_media/` | byte hiện vật, tên file = `sha256` | gitignore |
| `_recycle/` | thùng rác export | — |

### Hai file `.sql` — **chỉ có hai, cả hai đang sống**

```
core/assets/kho.schema.sql   17.497 B   ← dung_lai_db.py:40
web/api/loi.schema.sql       10.255 B   ← loidb.mjs:22 → dungchung.mjs:1083
                                          chungcat/src/vong.py:21
                                          chungcat/tests/check_khong_tu_duyet.py:38
                                          core/tests/check_db_dung_cho.py:146
```

---

## 2 · `kb/_kho.sqlite` — 11 bảng + 3 view

**Nguyên tắc gốc** (`kho.schema.sql:4-7`): *chân lý là hai cột `frontmatter`
(JSON nguyên văn) + `than`. Mọi cột khác GENERATED từ JSON — bảng là **ảnh
chiếu** của frontmatter.*

### 2.1 · Ba bảng NỘI DUNG — cùng hình dạng, tách theo module (`FR-038`)

| bảng | PK | n= | lưu gì |
|---|---|---:|---|
| `bai_viet` | **(`source_type`, `slug`)** | 1 | bản phân tích nguồn CHỮ — `repo`·`paper`·`article`·`docs`·`announcement` |
| `tai_lieu` | **(`source_type`, `slug`)** | 2 | tài liệu NGƯỜI TẢI LÊN — pdf/pptx/docx/ppt/doc |
| `video` | **(`source_type`, `slug`)** | 9 | bản ghi video — chủ yếu **đăng ký URL** |

**6 cột thật** (giống hệt nhau ở cả ba):

| cột | kiểu | ràng buộc |
|---|---|---|
| `source_type` | TEXT | NN · PK1 · `CHECK` enum đóng |
| `slug` | TEXT | NN · PK2 |
| `frontmatter` | TEXT | NN — **JSON nguyên văn, CHÂN LÝ metadata** |
| `than` | TEXT | NN — **markdown, CHÂN LÝ nội dung** |
| `version` | INTEGER | NN · mặc định `1` |
| `etag` | TEXT | NN |

**7 cột ẢO** (`GENERATED ALWAYS … VIRTUAL`, rút từ `frontmatter`):
`id` · `review_status` · `title` · `one_liner` · `analyzed_at` ·
`url_normalized` · `word_count`

**3 index mỗi bảng**: `review_status` · `url_normalized` · `analyzed_at`

> **Vì sao PK ghép**: bài học `FR-023 GĐ 3` — `repo/x.md` cạnh `article/x.md`
> từng làm index ghi 3/5 bản, **hai bài biến mất im lặng**.

### 2.2 · Kho hiện vật

| bảng | PK | n= | lưu gì |
|---|---|---:|---|
| `media` | **`sha256`** | 6 | **BYTE THẬT** — pdf, transcript `.vtt`, `.md` |

| cột | kiểu | ghi chú |
|---|---|---|
| `sha256` | TEXT · PK | 64 hex — **MÁY tính, KHÔNG nhận từ client** |
| `byte` | BLOB · NN | nội dung |
| `la_dan_xuat` | INTEGER · NN df=0 | `CHECK IN (0,1)` — 1 = cache dựng lại được, exporter BỎ QUA |
| `kieu_moc` | TEXT | `CHECK IN ('la_asr','nguoi_sua')` — hiện vật phiên âm sinh ra thế nào (`FR-054`) |
| `so_byte` | INTEGER | GENERATED `length(byte)` |

> ⚠️ **Địa chỉ theo nội dung ⇒ space-agnostic theo cấu trúc.** Cùng một file ở
> hai nơi = **một hàng**. Đừng thêm cột `space` vào bảng này.
> **KHÔNG cột metadata** — `mime`/`ten_goc` sống trong `frontmatter.media`.

### 2.3 · Vòng đời bản ghi

| bảng | PK | n= | lưu gì |
|---|---|---:|---|
| `article_versions` | **(`source_type`, `slug`, `ban`)** | 0 | bản lưu trữ khi re-analyze → export `<slug>.v<n>.md` |
| `recycle` | **`stt`** AUTOINC | 0 | thùng rác — snapshot nguyên văn + `deleted_at` |

`recycle.stt` AUTOINCREMENT **có lý do**: xoá cùng slug nhiều lần không đè nhau.

### 2.4 · Danh mục kiểm soát

| bảng | PK | n= | cột | lưu gì |
|---|---|---:|---|---|
| `concepts` | **`id`** | 5 | `id` · `label_vi` NN · `aliases` NN df=`[]` | khái niệm kỹ thuật (mịn) |
| `categories` | **`id`** | 11 | `id` · `label_vi` NN · `gom` NN | chủ đề bài (thô) |
| `loai_nguon` | **`id`** | 14 | `id` · `module` NN · `nhan` NN · `thu_tu` NN df=0 | **định dạng** tài liệu / **nơi phát** video / **loại bài** bài viết |

> `M02-R3`: **chỉ người khai nhãn**, máy không tự sinh tên.
> ⚠️ `loai_nguon` **≠** `source_type` — DDL tự khai chúng *"trùng nhau một cách
> **tình cờ**, không phải vì cùng vai"* (`kho.schema.sql:233-236`).

### 2.5 · Nhật ký & siêu dữ liệu

| bảng | PK | n= | lưu gì |
|---|---|---:|---|
| `audit_log` | **`stt`** AUTOINC | 23 | ai đổi danh mục nào, khi nào — **APPEND-ONLY** |
| `meta` | **`khoa`** | 4 | `schema_version` · `concepts_header` · `categories_header` · `nhat_ky_goc` |

`audit_log` cột: `stt` · `khi` NN · `bang` NN · `hanh_dong` NN · `doi_tuong` NN · `chi_tiet`

**3 trigger cưỡng chế append-only**:
`audit_chi_noi_them` (UPDATE) · `audit_khong_xoa` (DELETE) ·
`audit_khong_ghi_de` (INSERT trùng `stt` — chặn `INSERT OR REPLACE`)

### 2.6 · Ba VIEW — không có PK, không lưu gì

| view | n= | là gì |
|---|---:|---|
| `ban_ghi` | 12 | UNION ALL ba bảng nội dung — **MỌI đường đọc-cả-kho** đi qua đây |
| `nhan` | 29 | nhãn rút từ JSON: `category` · `concept` · `proposed` |
| `tham_chieu_media` | 12 | 5 nhánh trỏ tới `media` — **luật mồ côi đọc view này** |

> **`nhan` là VIEW, không phải bảng** ⇒ số đếm nhãn không bao giờ trôi khỏi bài.
> ⚠️ `tham_chieu_media` **cố ý gộp mọi nguồn** — thêm bộ lọc vào đây là **xoá
> byte** đang có người khác dùng.

---

## 3 · `web/_loi.sqlite` — dữ liệu GỐC

### 3.1 · Năm bảng ĐƯỢC KHAI trong `loi.schema.sql`

| bảng | PK | n= | lưu gì |
|---|---|---:|---|
| `nguoi_dung` | **`id`** | 0 | tài khoản |
| `ma_moi` | **`ma`** | 0 | mã mời — **BÍ MẬT** |
| `dinh_danh_kenh` | ⚠️ **KHÔNG CÓ PK** | 0 | buộc `chat_id` ↔ tài khoản |
| `phien` | **`id`** | 0 | session |
| `nhap_chung_cat` | **`job_ulid`** | 0 | bản nháp chưng cất (M12) |

**`nguoi_dung`** — `id` PK · `ten` NN *(**DLCN**)* · `vai` NN df=`dong_nghiep`
`CHECK IN ('chu','dong_nghiep')` · `trang_thai` NN df=`hoat_dong`
`CHECK IN ('hoat_dong','thu_hoi')` · `tao_luc` NN · `thu_hoi_luc`
*Không có cột mật khẩu — hệ này không có mật khẩu.*

**`ma_moi`** — `ma` PK · `nguoi_dung_id` NN →`nguoi_dung.id` · `het_han` NN ·
`tao_luc` NN · `dung_luc` *(NULL = chưa dùng)*
`IX ix_ma_moi_chua_dung (dung_luc)`

**`dinh_danh_kenh`** — `kenh` NN · `chat_id` NN *(**DLCN**)* ·
`nguoi_dung_id` NN →`nguoi_dung.id` · `buoc_luc` NN · `ma_da_dung` →`ma_moi.ma`
· `UNIQUE(kenh, chat_id)`
⚠️ **Bảng duy nhất trong cả hai DB không khai PRIMARY KEY** — ràng buộc là UNIQUE.

**`phien`** — `id` PK · `nguoi_dung_id` NN →`nguoi_dung.id` · `kenh` NN ·
`ngu_canh` *(JSON — cửa C6 KHÔNG trả trường này)* · `tao_luc` · `cap_nhat_luc` ·
`het_han` NN · `IX ix_phien_nguoi (nguoi_dung_id)`

**`nhap_chung_cat`** — `job_ulid` PK · `nguoi_dung_id` →`nguoi_dung.id` ·
`ban_goc_ai` NN *(**bất biến, trigger**)* · `ban_hien_tai` NN ·
`trang_thai` NN df=`nhap` `CHECK IN ('nhap','da_sua','da_duyet','tra_lai','da_bo')` ·
`khang_dinh_bi_tia` · `ly_do` · `review_status` NN df=`draft` `CHECK = 'draft'` ·
`lan_gui_duyet` NN df=0 · `tao_luc` · `cap_nhat_luc` ·
`IX ix_nhap_nguoi (nguoi_dung_id, trang_thai)`

**Khoá ngoại** — `PRAGMA foreign_keys = ON`, **không `ON DELETE CASCADE` ở đâu cả**:

```
ma_moi.nguoi_dung_id          → nguoi_dung.id
dinh_danh_kenh.nguoi_dung_id  → nguoi_dung.id
dinh_danh_kenh.ma_da_dung     → ma_moi.ma
phien.nguoi_dung_id           → nguoi_dung.id
nhap_chung_cat.nguoi_dung_id  → nguoi_dung.id
```

### 3.2 · ⚠️ Hai bảng **MỌC NGOÀI DDL**

| bảng | PK | n= | tạo ở đâu | lưu gì |
|---|---|---:|---|---|
| `audit_loi` | **`stt`** | 2 | `dungchung.mjs` — `CREATE TABLE IF NOT EXISTS` **trong thân hàm** | nhật ký LÕI |
| `lan_thu` | **`stt`** | *(vắng)* | `dungchung.mjs` — trong `loiChoThu()` | chống dò: `ip` + `ma_bam` |

`audit_loi` cột: `stt` PK · `khi` NN df=now · `hanh_dong` NN · `doi_tuong` ·
`nguoi_dung_id` · `boi` · `ok` NN
**3 trigger** cùng khuôn `audit_log`.

`lan_thu` cột: `stt` PK · `khi` NN df=now · `ip` · `ma_bam` *(băm, KHÔNG lưu mã)*

> 🔴 **Đây là nợ đang mở.** Hai bảng không có trong `loi.schema.sql` ⇒
> `BANG_LOI` (`loidb.mjs:37`) khai **5**, DB thật có **6–7**, và
> **`lan_thu` hôm nay không tồn tại** vì DB vừa bị clear và chưa ai gọi
> `loiChoThu()`. **Sự tồn tại của một bảng đang phụ thuộc vào việc ai gọi hàm
> nào trước** — xem [09-08 §3.2](2026-09-08-bang-khoa-chinh-va-noi-dung.md).

### 3.3 · Bảng nào ra file, bảng nào không (`ADR-06 c`)

| bảng | ra `_backup/`? | vì sao |
|---|---|---|
| `nguoi_dung` | ✅ `nguoi-dung.yaml` | mất là phải dựng lại thủ công |
| `dinh_danh_kenh` | ✅ `dinh-danh-kenh.yaml` | mất là mọi người buộc lại `chat_id` |
| `nhap_chung_cat` | ✅ `nhap-chung-cat.yaml` | **tốn token model** để tạo |
| `audit_loi` | ✅ `audit-loi.yaml` | dấu vết của hai bảng không xuất |
| `ma_moi` | ⛔ | **bí mật** — khôi phục mã đã dùng = khôi phục rác |
| `phien` | ⛔ | session — khôi phục xong vẫn phải đăng nhập lại |
| `lan_thu` | ⛔ | bộ đếm cửa sổ trượt |

---

## 4 · Đã chết — không dựng lại

| | trạng thái |
|---|---|
| `kb/_index.sqlite` | RETIRED bởi `FR-034`. ⚠️ **`sinh_index.py` + `check_index_dan_xuat.py` vẫn sống, CI vẫn chạy** (`ci.yml:157`) ⇒ xoá file thì CI sinh lại. Dọn đúng là **bước C7** |
| `web/_luu/` | đích bản lùi cũ, thay bởi `_backup/` (`FR-050` cách 2) |
| `web/_loi.sqlite.hong` | DB hỏng — `integrity_check` báo *malformed* |
| `kb/_kho.sqlite.truoc-di-tru-1788906007` | 135 MB, **TRACKED trong git** (`b7f6ba9`), = 62% của `.git` (219 MB). Xoá file **không** làm nhẹ repo |

Chi tiết + lệnh xoá: [09-10 rà soát](2026-09-10-ra-soat-file-sql-va-db-rac.md).

---

## 5 · Nợ đang mở về DB

| # | nợ | mở từ | ở đâu |
|---|---|---|---|
| 1 | `audit_loi` + `lan_thu` ngoài DDL; `BANG_LOI` chưa cổng nào gọi | 09-03 | [09-08 §3.2](2026-09-08-bang-khoa-chinh-va-noi-dung.md) |
| 2 | `nhap_chung_cat` **không có trigger `BEFORE DELETE`** — `ban_goc_ai` bất biến trước UPDATE nhưng cả hàng xoá được | 09-08 | [09-08 §3.4](2026-09-08-bang-khoa-chinh-va-noi-dung.md) |
| 3 | `check_db_dung_cho` **ĐỎ OAN** — bắt trúng một dòng chú thích trong khối `XUAT_LOI` | 09-05 | [09-08 §3.3](2026-09-08-bang-khoa-chinh-va-noi-dung.md) |
| 4 | `bam_noi_dung()` **không băm `loai_nguon`** — điểm bất động mù một bảng | 09-03 | [09-03 A6](2026-09-03-db-phase1-va-phase2.md) |
| 5 | `boi` NULL cho mọi dòng `audit_loi` — cột *"AI ĐÃ làm"* chưa từng được ghi | 09-08 | [09-08 §3.5](2026-09-08-bang-khoa-chinh-va-noi-dung.md) |
| 6 | transcript `.vtt` có `la_dan_xuat=0`, `kieu_moc=NULL` | 09-08 | [09-08 §3.2](2026-09-08-bang-khoa-chinh-va-noi-dung.md) |
| 7 | 2 test ghi thẳng vào DB **thật** (không đặt `LOI_DB`) | 09-08 | [09-08 §3.6](2026-09-08-bang-khoa-chinh-va-noi-dung.md) |

---

## 6 · Sắp tới — chưa có, nhưng đã biết

| | khi nào | ghi chú |
|---|---|---|
| `truyhoi/index.sqlite` | M13 thi công | ⏰ **vẽ có cột `space` từ hàng đầu tiên** — file chưa tồn tại, cửa sổ này đóng khi M13 code |
| cột `space` trên mọi bảng nội dung | sau ADR-09 | hình dạng chờ quyết — [09-09](2026-09-09-space-model-anh-huong-database.md) §3 |
| cột `space` cho `audit_log` + `audit_loi` | ⏰ **trước khi mở space thứ hai** | append-only ⇒ **không backfill được** |
| `space` · `space_member` | sau ADR-09 | mô hình quyền mới, ngoài `FR-045` |

---

## 7 · Cách cập nhật file này

### Khi nào phải sửa

- thêm/bớt **bảng**, **view**, **trigger**, **index**
- đổi **khoá chính**, thêm/bớt **cột**, đổi **CHECK**/**FK**
- thêm/bớt một file `.sqlite` hoặc một `.sql`
- đổi đường export / đích bản lùi
- một nợ ở §5 được đóng, hoặc một nợ mới xuất hiện

### Lệnh đo lại — chép dán, chỉ đọc

```bash
cd c:/Users/Admin/Downloads/Grown_news
PYTHONIOENCODING=utf-8 py -3.13 - <<'PY'
import sqlite3, pathlib, datetime
for db in ["kb/_kho.sqlite","web/_loi.sqlite","truyhoi/index.sqlite"]:
    p = pathlib.Path(db)
    if not p.exists():
        print(f"### {db} — CHUA CO\n"); continue
    c = sqlite3.connect(f"file:{db}?mode=ro", uri=True)   # ro: KHONG bao gio ghi
    print("="*80)
    print(f"### {db}  {p.stat().st_size:,} B  {datetime.datetime.fromtimestamp(p.stat().st_mtime):%Y-%m-%d %H:%M}")
    print("="*80)
    for t, n in c.execute("SELECT type,name FROM sqlite_master WHERE type IN ('table','view')"
                          " AND name NOT LIKE 'sqlite_%' ORDER BY type DESC, name"):
        try: k = c.execute(f'SELECT count(*) FROM "{n}"').fetchone()[0]
        except Exception: k = "ERR"
        info = list(c.execute(f"PRAGMA table_info('{n}')"))
        pk = [r[1] for r in sorted([r for r in info if r[5]], key=lambda r: r[5])]
        print(f"\n[{t}] {n}   n={k}   PK=({', '.join(pk) or '—'})")
        for _, nm, ty, nn, dflt, ispk in info:
            f = ("PK" if ispk else "") + (" NN" if nn else "") + (f" df={dflt}" if dflt is not None else "")
            print(f"    {nm:18} {ty or '?':8} {f}")
        for fk in c.execute(f"PRAGMA foreign_key_list('{n}')"):
            print(f"    FK {fk[3]} -> {fk[2]}.{fk[4]}")
        for ix in c.execute(f"PRAGMA index_list('{n}')"):
            if not ix[1].startswith("sqlite_autoindex"):
                cols = [r[2] for r in c.execute(f"PRAGMA index_info('{ix[1]}')")]
                print(f"    IX {ix[1]} ({', '.join(map(str, cols))}){' UNIQUE' if ix[2] else ''}")
    print("\n-- TRIGGER --")
    for r in c.execute("SELECT name,tbl_name FROM sqlite_master WHERE type='trigger' ORDER BY tbl_name,name"):
        print(f"    {r[1]:20} {r[0]}")
    c.close(); print()
PY
```

### Kiểm DDL khai có khớp DB thật không

```bash
PYTHONIOENCODING=utf-8 py -3.13 - <<'PY'
import sqlite3, re, pathlib
def khai(p):
    s = pathlib.Path(p).read_text(encoding="utf-8")
    return {m.group(1) for m in re.finditer(
        r"CREATE\s+(?:TABLE|VIEW)\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-z_]+)", s, re.I)}
def that(db):
    c = sqlite3.connect(f"file:{db}?mode=ro", uri=True)
    r = {x[0] for x in c.execute("SELECT name FROM sqlite_master"
                                 " WHERE type IN ('table','view') AND name NOT LIKE 'sqlite_%'")}
    c.close(); return r
for d, db in [("core/assets/kho.schema.sql","kb/_kho.sqlite"),
              ("web/api/loi.schema.sql","web/_loi.sqlite")]:
    k, t = khai(d), that(db)
    print(f"{d}\n  khai {len(k)} / thật {len(t)}"
          f" | THỪA trong DB: {sorted(t-k) or '—'} | THIẾU: {sorted(k-t) or '—'}")
PY
```

⚠️ **Chỉ dùng `mode=ro`.** Không chạy `dung_lai_db.py` để đo — nó **xoá rồi dựng
lại** `kb/_kho.sqlite` (rule 3 + rule 16).

### Checklist mỗi lần sửa file này

- [ ] Cập nhật dòng **"Đo lần cuối"** ở đầu file
- [ ] Bảng mới ⇒ thêm vào §2 hoặc §3, **kèm PK và "lưu gì"**
- [ ] Bảng mới ở DB LÕI ⇒ khai luôn nó **có ra `_backup/` không** (§3.3)
- [ ] Chạy phép kiểm DDL ở trên; lệch ⇒ ghi vào §3.2 hoặc §5
- [ ] Ghi một dòng vào §8

---

## 8 · Nhật ký thay đổi của FILE NÀY

| ngày | đổi gì |
|---|---|
| 2026-09-10 | Lập file. Đo `kb/_kho.sqlite` (11 bảng + 3 view) · `web/_loi.sqlite` (6 bảng — `lan_thu` vắng vì DB vừa clear). Ghi 7 nợ đang mở, 4 thứ đã chết. |

---

*Sổ tay của agent kiểm soát dữ liệu. Chỉ mô tả hiện trạng — không phải hợp đồng.
Hợp đồng là hai file `.sql` ở §1.*
