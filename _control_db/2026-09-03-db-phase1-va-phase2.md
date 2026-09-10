# Kiểm soát DB — 2026-09-03

**Phạm vi**: DB phase 1 (`kb/_kho.sqlite` + `web/_loi.sqlite`) và thiết kế DB của
phase 2 (M12–M19).
**Đọc**: `04_system/adr.md` ADR-06 · `.factory/fr/FR-045…053` ·
`06_modules/M18_nguoidung/**` · `core/assets/kho.schema.sql` ·
`core/tools/dung_lai_db.py` · `web/api/loi.schema.sql` · `web/api/dungchung.mjs` ·
`web/api/loi-cua.mjs` · `04_system/security_baseline.md §4b`.
**Ghi**: chỉ file này. Không chạm file của ai.

> **Cảnh báo quy chủ.** Cây đang có ≥2 agent khác làm việc. `git status` lúc bắt
> đầu phiên và lúc chạy cổng **đã khác nhau**. Mọi mục dưới đây đều kèm bằng chứng
> chạy được để người khác tái đo; mục nào chưa quy được chủ thì ghi thẳng.

---

## 0 · Trạng thái máy — đo 2026-09-03, KHÔNG chép tay

```bash
for f in core/tests/check_*.py; do PYTHONIOENCODING=utf-8 py -3.13 "$f"; done
```

| interpreter | xanh | đỏ |
|---|---|---|
| `py -3.13` (bản pin — ADR-02, `core/pyproject.toml:5`) | **23/28** | `check_danh_muc` · `check_frozen` · `check_g6b` · `check_running` · `check_skill` |
| `python` = **3.11.15** (mặc định của máy) | 20/28 | **thêm 3 đỏ oan**: `check_db_dung_cho` · `check_dia_chi` · `check_khung` |

5 đỏ trên bản pin **khớp** con số `FR-047 §6` khai lúc đóng (*"22/27 … 5 đỏ có
trước"*). **Không có hồi quy về số lượng** — nhưng nội dung một trong năm đã đổi
(xem `A12`).

---

## A · DB phase 1

### A1 · `[chặn]` `audit_loi` mất cột `boi` VĨNH VIỄN nếu đọc trước khi ghi

**Vật thể**: `web/api/dungchung.mjs:1320-1326` (khai đủ cột) vs
`web/api/dungchung.mjs:1364` và `:1372` (khai **thiếu** `boi`).

Ba hàm cùng `CREATE TABLE IF NOT EXISTS audit_loi` với **hai hình dạng khác nhau**.
Hàm nào chạy trước trên một `_loi.sqlite` mới thì hình dạng đó **thắng vĩnh viễn**.

Đo được:

```bash
LOI_DB="$TEMP/x.sqlite" node -e '
 const m = await import("file:///…/web/api/dungchung.mjs")
 m.loiDemAudit()                       // đọc TRƯỚC
 m.loiGhiAudit({hanh_dong:"thu", boi:1})
'
# → table audit_loi has no column named boi
```

Kèm theo: ba trigger append-only (`:1341-1353`) chỉ được tạo trong `loiGhiAudit`.
Nếu `loiDocAudit` tạo bảng trước và `loiGhiAudit` **không bao giờ chạy được**, bảng
audit tồn tại **không có một trigger nào** — `V5` của `FR-047` mất răng trên đúng
cái bảng nó nói về.

**Hôm nay chưa nổ trong production**: không route nào gọi `loiDemAudit`/`loiDocAudit`
(`grep` ra 0 ngoài `web/test/**`). **Nhưng M18 màn admin `xem-audit` là việc phase 2**,
và `loiDocAudit` chính là hàm nó sẽ gọi. Một `clone` mới + màn admin mở trước lần ghi
đầu tiên ⇒ audit hỏng, không tự khôi phục, và `epQuyen` (`:1044`) cũng ném theo vì nó
ghi audit khi từ chối.

**Đề xuất (người quyết)**: đưa `audit_loi` vào `web/api/loi.schema.sql` — đó là chỗ
DDL đã khai là duy nhất — rồi bỏ cả ba `CREATE TABLE IF NOT EXISTS` trong hàm.

### A2 · `[chặn]` Hai bảng mọc NGOÀI DDL, và cổng đếm bảng không tồn tại

**Vật thể**: `web/api/loi.schema.sql` khai **5** bảng ·
`web/api/loidb.mjs:37-43` `BANG_LOI` liệt **5** ·
`_loi.sqlite` thật có **6–7**.

```
đo: ['audit_loi','dinh_danh_kenh','ma_moi','nguoi_dung','nhap_chung_cat','phien']
    (+ 'lan_thu' sau lời gọi loiChoThu đầu tiên)
```

Hai bảng ngoài DDL: `audit_loi` (`dungchung.mjs:1320`) và `lan_thu`
(`dungchung.mjs:1550`). Cả hai `CREATE` trong thân hàm.

`loidb.mjs:36` tự khai `BANG_LOI` là *"nguồn cho cổng đếm"*, và
`dungchung.mjs:930-935` `bangLoiCoThat()` tự khai *"cho cổng đối chiếu"*.

```bash
grep -rn "BANG_LOI\|bangLoiCoThat" --include=*.mjs --include=*.js --include=*.py . | grep -v node_modules
# → chỉ 3 dòng: nơi định nghĩa + nơi re-export. KHÔNG test nào, KHÔNG cổng nào.
```

⇒ **Cổng "bảng nào mọc ngoài FR" đã được chuẩn bị đầy đủ nhưng chưa ai cắm.**
`check_db_dung_cho.py` không phủ chỗ này: ba vế của nó là *kho.schema.sql không khai
bảng gốc* · *`.sqlite` nằm đúng thư mục* · *ba bảng phải-xuất có đường export* — không
vế nào so **bảng thật** với **DDL đã khai**.

### A3 · `[chặn]` `audit_log` của `FR-045`/`ADR-06` KHÔNG tồn tại ở nơi ba tài liệu trỏ tới

Ba tài liệu nói về **một** bảng; mã có **hai** bảng ở **hai** DB:

| nguồn | nói gì | thực tế |
|---|---|---|
| `FR-045` U4/U5 | *"mỗi lần buộc `chat_id` ghi `audit_log`"* | mã ghi `audit_loi` |
| `ADR-06` `adr.md:455` | dấu vết `ma_moi`/`phien` sống trong `audit_log` → **`kb/_audit.jsonl`** | `audit_loi` ở `web/_loi.sqlite`, **không** ra `_audit.jsonl` |
| `M17 data_flow.md:16` | *"**ra** · bản ghi bảng `audit_log` · **LÕI**"* | không có bảng tên đó trong `_loi.sqlite` |

`audit_log` có thật, nhưng nó ở `kb/_kho.sqlite` (`core/assets/kho.schema.sql:253`) —
tức đúng cái DB mà `dung_lai_db.py:152-156` **xoá rồi dựng lại từ file**.

**Hệ quả đo được**: `XUAT_LOI` (`dungchung.mjs:1450-1460`) có **ba** mục, `audit_loi`
không nằm trong đó. Nên:

> Mất `web/_loi.sqlite` ⇒ **mất toàn bộ audit tài khoản**. Và `ADR-06 (c)` biện minh
> cho việc **không** backup `ma_moi`/`phien` bằng đúng câu *"dấu vết của chúng sống
> trong `audit_log`"*. Biện pháp bù đó **chưa được cài** — hai bảng bí mật không có
> backup, và cái đáng lẽ thay thế chúng cũng không có.

Đây là mục nghiêm trọng nhất của báo cáo: nó không phải một bug, nó là **một lập luận
kiến trúc đã ký mà vế thứ hai chưa tồn tại**.

### A4 · `[chặn]` Ba task ID TRÙNG, và một trong ba là task DDL của DB LÕI

`py -3.13 core/tests/check_g6b.py`:

```
- T08-10: ID TRÙNG — T08-10-cong-db-dung-cho.md và T08-10-spec-duong-hien-vat.md
- T08-11: ID TRÙNG — T08-11-ddl-db-loi.md      và T08-11-mot-cua-sql-ba-bang.md
- T08-12: ID TRÙNG — T08-12-loc-theo-nhom…     và T08-12-nam-cua-tai-khoan.md
  → file sau ghi đè file trước nên `phạm_vi_ghi` của MỘT trong hai KHÔNG được kiểm
```

`T08-11-ddl-db-loi` là task viết `web/api/loi.schema.sql`. `R1` (phạm vi) mất địa chỉ
trên đúng đơn vị việc dựng DB dữ liệu gốc.

### A5 · `[chặn]` `check_dinh_danh.py` — AC `hard` của M18 — không tồn tại

```
check_g6b: M18_nguoidung: AC hard `python core/tests/check_dinh_danh.py`
           không task nào sinh và chưa xanh (W5)
ls core/tests/check_dinh_danh.py  → No such file
```

`M18` khai `hard` mà không có lệnh chạy được ⇒ theo `R3` **nó là `soft`**. Bất biến
`AC-3.1` (*"đúng MỘT chỗ INSERT vào `dinh_danh_kenh`"*) hiện chỉ được giữ bằng kỷ luật
+ `api-guard` răng 2, không bằng cổng của chính nó.

### A6 · `[nên]` `bam_noi_dung()` mù nội dung bảng `loai_nguon`

**Vật thể**: `core/tools/dung_lai_db.py:358-375` liệt 10 bảng để băm —
`bai_viet · tai_lieu · video · article_versions · recycle · concepts · categories ·
audit_log · media · meta`. **Thiếu `loai_nguon`**, dù:

- `dung_lai_db.py:277-309` nạp nó,
- `xuat_kho.py:227` xuất nó,
- `FR-019` xếp nó cùng khuôn `concepts`/`categories` (DB là chân lý, file là export).

Vòng `sqlite_master` ở `:381-384` bắt được *thêm/bớt bảng*, **không** bắt được
*nội dung lệch*. ⇒ điểm bất động DB→file→DB không phủ bảng này: sửa một `nhan` ở một
chiều mà không chiều kia, hash vẫn khớp.

### A7 · `[nên]` `lan_thu` không có đường dọn — mỗi request một hàng, vĩnh viễn

**Vật thể**: `dungchung.mjs:1550-1557` `INSERT`; `grep lan_thu` toàn repo ra **0**
`DELETE`, 0 job dọn, 0 `VACUUM`.

`loiChoThu` được gọi từ `quaCong` (`loi-cua.mjs:53`) trên **mọi** request qua C1–C7.
Bảng chống-dò trở thành bảng tăng-đơn-điệu trong chính DB chứa tài khoản. Không nguy
hiểm hôm nay (5 người), nhưng nó nằm trong file mà `FR-050` khai là *"mất ổ = mất tài
khoản"* — một file càng to càng khó backup thủ công.

Cột `khi` đã có index ngầm nào chưa? Không — `loi.schema.sql:106-111` chỉ khai ba
index, không cái nào cho `lan_thu` (bảng không được khai ở đó). Truy vấn đếm
(`:1559-1561`) sẽ `SCAN` toàn bảng.

### A8 · `[nên]` `security_baseline §4` vẫn khai *"Dữ liệu nhạy cảm — không có"*

**Vật thể**: `04_system/security_baseline.md:106-108` —
*"Không PII, không dữ liệu người khác…"*

Trong khi chính DDL đánh dấu ngược lại:
`web/api/loi.schema.sql:28` `ten  TEXT NOT NULL,  -- DỮ LIỆU CÁ NHÂN (B-E5)` và
`:62` `chat_id  TEXT NOT NULL,  -- DỮ LIỆU CÁ NHÂN (B-E5)`.

`FR-050 §3` cổng **X4** khai đúng chỗ này: *"đỏ khi còn câu nào nói 'không có dữ liệu
cá nhân'"*. §1.1 đã được viết lại cho `FR-045`; §4 thì chưa. Một tài liệu an ninh nói
sai về loại dữ liệu mình đang giữ là thứ người sau đọc rồi tin.

*(Ghi rõ để không đỏ oan: `_backup/` và `web/_luu/` đều **đúng** — `git ls-files` ra
**0** dòng khớp `_backup|_loi|nguoi-dung|dinh-danh`. `FR-050` cách 2 đã thi hành đúng,
và việc **không** có `.githooks/pre-push` cùng `04_system/ho-so-du-lieu-ca-nhan.md` là
**đúng**: `FR-050 §6` bỏ cổng X1/X2/X3.)*

### A9 · `[nên]` `.gitignore` còn một câu ngược `FR-050`

**Vật thể**: `.gitignore` khối `# T08-11` —
*"Ba bảng của nó … se export ra file **va file DO thi commit** — dung co che B-C1"*.

Khối ngay dưới (`# ADR-06 (c) + FR-050 cach 2`) nói ngược lại và **hành vi hiện tại
đúng theo khối dưới**. Chỉ chữ sai. Cùng lớp với `A8`: người sau đọc khối trên rồi
tưởng git đã phủ backup.

### A10 · `[nên]` `ADR-06` "Hệ quả 4 — vòng reap của exporter, chưa giải" đã hết đúng

**Vật thể**: `adr.md:534-539` cảnh báo `xuat_kho.py:141-146` sẽ reap ba file backup mới.

Đo: `xuatLoi()` (`dungchung.mjs:1477-1502`) ghi vào `_backup/` ở **gốc repo**, còn
`xuat_kho.py` chỉ quét `kb/` + `_recycle/` (`:152-159`, `:272`, `:292`). Hai đường
không giao nhau, và `dungchung.mjs:1424-1428` đã khai thẳng *"KHÔNG có vòng reap ở
đây"*. ⇒ Rủi ro **đã giải bởi `FR-050` cách 2**, nhưng ADR còn ghi *"chưa giải"*.

### A11 · `[nên]` Ba cổng ĐỎ OAN trên interpreter mặc định của máy

`python` trên máy này là **3.11.15**; `ADR-02`/`FR-005` pin **3.13**
(`core/pyproject.toml:5`, `.github/workflows/ci.yml:33`).

| cổng | đỏ trên 3.11 vì | trên 3.13 |
|---|---|---|
| `check_khung` | `SyntaxError: f-string expression part cannot include a backslash` | xanh |
| `check_dia_chi` | `ModuleNotFoundError: pypdf` | xanh |
| `check_db_dung_cho` | `NotADirectoryError` khi đi vào `web/_quartz/.quartz/…` | xanh |

Không cổng nào tự kiểm phiên bản interpreter. Ai chạy `python core/tests/…` (đúng cách
gõ tự nhiên nhất) sẽ thấy ba cổng đỏ không liên quan tới code — và `#đỏ-oan` là cách
một bộ cổng bị bỏ qua. Ngoài ra `check_frozen` **crash** `UnicodeEncodeError` (cp1252)
đúng lúc in danh sách file lệch: nó vẫn `exit 1`, nhưng **không nói được lệch cái gì**.

### A12 · `[chặn]` `check_frozen` ĐỎ — `M18_nguoidung/spec.md` lệch baseline

```
PYTHONIOENCODING=utf-8 py -3.13 core/tests/check_frozen.py
  ĐỔI  06_modules/M18_nguoidung/spec.md
FAIL · 1 file frozen lệch baseline.     EXIT=1
```

**Quy chủ — quy được**, không phải "chưa rõ":

- `git status`: `?? 06_modules/M18_nguoidung/` (chưa vào git), `M FROZEN.lock`.
- mtime `spec.md` = **2026-09-03 00:32:07**; mtime `FROZEN.lock` = **2026-09-02 23:16:22**
  ⇒ file bị sửa **sau** lần ký gần nhất.
- `check_g6b` in ra task tự khai chính việc đó:
  `T08-16 · ghi 06_modules/M18_nguoidung/spec.md   # AC-6.1 đổi nghĩa · thêm AC §10`
  và `… rules.md  # M18-R3 đổi vai (FROZEN — ký lại sau)`.

⇒ Đây là **nợ ký còn treo của T08-16 (M08_api)**, không phải một lần ai đó lén sửa.
Người quyết cần: (a) `rules.md` khớp lock, chỉ `spec.md` lệch — kiểm lại xem sửa đã
hết chưa; (b) ký lại kèm id FR.

### A13 · `[chặn]` T08-16 và T09-8 ghi NGOÀI boundary module của chúng

`check_g6b` mục 2:

```
T08-16 (M08_api) ghi 06_modules/M18_nguoidung/spec.md + rules.md
       boundary M08_api = ['web/api/**','_recycle/**','06_modules/M08_api/**']
T09-8  (M09_thuvien) ghi 9 đường: core/assets/frontmatter.schema.json (FROZEN) ·
       core/src/…/validate.py · core/tools/dung_lai_db.py · core/tools/xuat_kho.py ·
       web/api/*.mjs · web/render/*.mjs · web/plugins/…
T08-15 (M08_api) ghi core/assets/nguong-loi.json
T03-90 (M03_web) ghi core/assets/man-hinh.json
```

Bốn task khai `phạm_vi_ghi` vượt boundary. `T09-8` đặc biệt đáng nhìn: nó đụng **cả hai
tool đường file↔DB** (`dung_lai_db.py`, `xuat_kho.py`) từ boundary `06_modules/M09_thuvien/**`.
Việc thì có thể đúng (`FR-052` đã duyệt), nhưng **boundary khai sai** ⇒ `R1` không đo
được ai được ghi vào đường file↔DB của kho.

### A14 · `[hỏi]` C7 `POST /api/ma-moi/dung` gọi đúng hàm của C4 — đường đăng nhập web ở đâu?

**Vật thể**: `web/api/loi-cua.mjs:147` — `cuaDungMaMoi` gọi
`loiBuocDinhDanh({kenh, chat_id, ma})`, **cùng hàm** `cuaBuocDinhDanh` gọi ở `:101`.
`loiBuocDinhDanh` (`dungchung.mjs:1241`) **bắt buộc** cả `kenh` lẫn `chat_id`.

Nhưng:

- `FR-047 §2` tả C7 là *"tra + đánh dấu … `UPDATE … WHERE dung_luc IS NULL` + `changes()`"* —
  một phép tiêu mã, không phải một phép buộc kênh.
- `FR-045 §1.2` + `security_baseline §1.1` khai `ma_moi` dùng **HAI** việc:
  **đăng nhập web** *và* buộc `chat_id`.

⇒ Hôm nay chỉ có lối vào **buộc kênh**. Một người ngồi trước trình duyệt, có mã mời,
**không có cửa nào** để đổi mã lấy `phien` — `loiMoPhien` (`dungchung.mjs:1270`) tồn tại
nhưng không route nào gọi.

**Câu hỏi cho người quyết**: đăng nhập web bằng `ma_moi` là (a) đã cố ý hoãn sang
phase 2 cùng `cong/`, hay (b) một cửa bị bỏ sót? Nếu (a) thì nên ghi vào `M17 backlog`;
nếu (b) thì `FR-047` thiếu một cửa và C7 hiện đang là bản sao của C4.

### A15 · `[nên]` `dungLoiDb()` đọc + `exec` toàn bộ DDL mỗi lượt gọi

**Vật thể**: `dungchung.mjs:913-928` — mỗi lời gọi mở DB, `readFileSync(LOI_SCHEMA)`,
`exec` cả file (gồm `PRAGMA journal_mode = WAL`), chạy việc, đóng.

Một request qua C4 gọi `dungLoiDb` ít nhất 4 lần (`loiChoThu` · `loiBuocDinhDanh` ·
`sauGhiLoi→xuatLoi` · `loiGhiAudit`) ⇒ 4 lần đọc file schema + 4 lần exec DDL.
Đúng luật *mở-dùng-đóng* của `FR-023 GĐ 3` (và luật đó có lý do thật trên Windows),
nhưng phần **exec DDL** thì không cần lặp — cache nội dung file là đủ, và nó không phá
bất biến nào.

---

## B · Thiết kế DB cho phase 2 (M12–M19)

### B1 · `[chặn]` G6B CHƯA ĐÓNG — sáu module phase 2 không có evidence plan

`py -3.13 core/tests/check_g6b.py` mục 4 (W5 — plan phủ AC `hard` của spec):

| module | lệnh AC `hard` trong spec | không task nào sinh |
|---|---|---|
| M12_chungcat | 17 | **17** |
| M13_truyhoi | 15 | **15** |
| M14_chatbot | 20 | **20** |
| M15_kenh | 16 | **16** |
| M16_artifact | 11 | **11** |
| M17_cong | 17 | **15** |
| M18_nguoidung | 9 (1 đã xanh sẵn) | **5** |

**99 lệnh AC hard không có task nào sinh ra.** G6A xanh (`check_g6a` OK — cả 7 module
đủ 9 artifact), nhưng s7 chưa chạy cho sáu module. Theo trình tự Factory, **s8 chưa
được bắt đầu** cho M12–M17.

Điều này quan trọng với DB vì: `FR-047 §0` khai bảy cửa được mở **để** M12/M15/M17
chia task được. Cửa đã có (`loi-cua.mjs`), **task thì chưa**.

### B2 · `[chặn]` `phien.ngu_canh` chưa có hình dạng — M14 tự khai là điều kiện nhận việc

**Vật thể**: `06_modules/M14_chatbot/data_flow.md:83` —
*"`FR-045` khai bảng `phien` có cột `ngu_canh` nhưng chưa khai **hình dạng** JSON của
nó. **Cần chốt trước khi M14 nhận**."*

DDL: `web/api/loi.schema.sql:76` `ngu_canh  TEXT,  -- JSON; C6 KHÔNG trả trường này`.
Không schema, không `CHECK (json_valid(...))`, không ai khai khoá.

Và không cửa nào trong bảy cửa **ghi** `ngu_canh`: C6 chỉ đọc và cố ý **không** trả nó
(`loi-cua.mjs:125-136`), `loiMoPhien` nhận `ngu_canh` nhưng không route nào gọi.
⇒ Session của phase 2 hiện có **chỗ ngồi mà không có đường vào**.

### B3 · `[hỏi]` M16: ba artifact tài liệu còn khai `media` có BA cột và AC-4.1 bị chặn

`FR-052` đã đóng 2026-09-02 theo **cách 1** (`media` thành **mảng** trong frontmatter),
và `core/assets/frontmatter.schema.json` đã mang `$comment: "FR-052 cach 1 …"`.
`dung_lai_db.py:78-97` `tro_media()` đã nhận cả `dict` lẫn `list`.

Nhưng ba artifact của M16 vẫn khai nợ cũ:

- `M16_artifact/data_flow.md:86` *"`PRAGMA table_info(media)` ⇒ `['sha256','byte','la_dan_xuat']`"* — **thiếu `so_byte`** (`kho.schema.sql:184`), đúng chỗ `FR-052 §0a` đã tự đính chính.
- `M16_artifact/data_flow.md:87` + `model_flow.md:103` + `spec.md:95` + `testcases.md:104`: *"bảng `media` không có cột trỏ về `slug`" ⇒ **chặn AC-4.1**, cần FR tới M09"*.

**Câu hỏi**: `FR-052` cách 1 đặt liên kết *artifact ↔ bài* vào `frontmatter.media[]`
(truy được bằng `json_extract`, đúng như `FR-052 §0b` chứng minh). Nếu vậy **AC-4.1 đã
được gỡ chặn** và bốn chỗ trên là tài liệu lỗi thời. Nếu không, thì `FR-052` chưa giải
xong nợ của M16. Hai khả năng dẫn tới hai việc rất khác nhau ở s7 — người quyết chốt.

### B4 · `[hỏi]` M12: bản AI gốc nằm ở HAI nơi

| nơi | nguồn |
|---|---|
| `nhap_chung_cat.ban_goc_ai` (LÕI, bất biến bằng trigger) | `FR-046 §1` · `loi.schema.sql:88,97-102` |
| *"Phản hồi model được **lưu cạnh job** trong Maildir"* | `M12 spec.md:248` AC-5.4 |

Hai bản của cùng một thứ đắt tiền, ở hai vùng tin cậy khác nhau (LÕI và THỢ), không
tài liệu nào nói bản nào là chân lý khi chúng lệch. Hình dạng này đúng bằng thứ
`ADR-04`/`B-C1` gọi là *"hai nguồn chân lý"*.

Có thể đúng theo thiết kế — Maildir giữ *phản hồi thô để chạy lại từ giai đoạn hỏng*
(`FR-046 §2.1` checkpoint), DB giữ *bản đã chưng cất*. Nếu vậy **nên đặt tên khác nhau**
trong hai tài liệu; hiện cả hai đều gọi là "bản/phản hồi model".

### B5 · `[nên]` `M17 data_flow.md` là tài liệu duy nhất còn trỏ vào bảng sai

Ngoài `audit_log` (xem `A3`), `M17_cong/data_flow.md:12-29` khai bốn bảng với **danh
sách cột của `FR-045`**, không phải cột của DDL đã thi công:

| khai ở M17 | DDL thật (`loi.schema.sql`) |
|---|---|
| `nguoi_dung(id, ten, vai, trang_thai, tao_luc)` | thêm `thu_hoi_luc` (`:43`) |
| `dinh_danh_kenh(kenh, chat_id, nguoi_dung_id, buoc_luc)` | thêm `ma_da_dung` (`:65`) |
| `phien(id, nguoi_dung_id, kenh, ngu_canh, cap_nhat_luc)` | thêm `tao_luc`, `het_han` (`:77,79`) |

`het_han` của `phien` không phải chi tiết vặt: `loiXemPhien` (`:1296`) lọc bằng nó, và
`M17` là module **hỏi** phiên. Cùng nhận xét cho `project_map.yaml:84-88` (khối comment
của `M17_cong`) — vẫn là danh sách cột `FR-045`.

### B6 · `[nên]` `check_map` vẫn không đọc `entities` — lỗ `FR-048 §1` chưa vá

```bash
grep -c "entities\|owner" core/tests/check_map.py   # → 0
```

`FR-048` đã sửa **triệu chứng** (gán chủ cho bốn bảng + `BaiHoc`), không sửa **lỗ**:
một entity thứ sáu không có `owner`, hoặc `owner` trỏ vào module không tồn tại, vẫn
**không cổng nào báo**. `check_map` xanh hôm nay dù `entities.BaiHoc.owner = M19_baihoc`
là một module không có thư mục — đúng thứ `FR-048` mô tả.

Với phase 2 đang thêm entity (`nhap_chung_cat`, và `BaiHoc` khi upgrade 2 khởi động),
lỗ này sẽ được dùng lại.

### B7 · `[hỏi]` M19_baihoc — người dùng hỏi "M12–M19", nhưng M19 chưa được phép thi công

Trạng thái đo được: **không có** `06_modules/M19_baihoc/`, **không có** mục trong
`modules:`, entity `BaiHoc` (`project_map.yaml:884-897`) có `storage: null`,
`schema: null`, `status: planned`.

`FR-048` khai rõ đường đi và **lý do chưa được**:

```
s1 ĐÃ phủ · s2 CHƯA (proposal đợt hai không có scope-in "gom nhóm")
                    · s3 CHƯA (prd.md không có "bài học")
⇒ FR mở rộng phạm vi → PRD + proposal → s6.  KHÔNG quay về s1.
```

⇒ **M19 không nằm trong phase 2 hiện tại.** Nếu chủ dự án muốn nó vào, việc đầu tiên
**không phải** thiết kế bảng — mà là một FR mở rộng phạm vi ở s2/s3. Thiết kế bảng
trước là đúng thứ `M14 AC-8.4` đang chờ (*"một hàm giải bot → tập `doc_id`"* mà chưa
bảng nào đứng sau), nhưng làm nó ngoài đường s2→s3 là phình phạm vi âm thầm.

*(Nhắc: `memory` của phiên trước ghi lộ trình Edu là **chiều phân loại thứ tư**, thi
công ở **upgrade 2** nhưng **giữ hình dạng mở từ đợt hai** — khớp với `FR-048`.)*

### B8 · `[nên]` Ba bảng phase 2 chưa có, và chỗ của chúng chưa được khai

Đối chiếu điều các module cần với điều `_loi.sqlite` + `kb/_kho.sqlite` có:

| cần | ai | có chưa | chỗ đúng theo `ADR-06 (b)` |
|---|---|---|---|
| chỉ mục truy hồi + `vec0` | M13 | ❌ | `truyhoi/index.sqlite` — **đã khai** trong ADR-06, chưa dựng |
| lịch sử hội thoại / `ngu_canh` | M14 | ⚠️ cột có, hình dạng chưa (`B2`) | `web/_loi.sqlite` |
| liên kết artifact ↔ bài | M16 | ⚠️ tuỳ `B3` | `frontmatter.media[]` |
| hàng đợi việc | M12/M16 | ✅ **Maildir ở THỢ, đúng luật** — không bảng job ở LÕI | `chungcat/`, `artifact/` |
| `bai_hoc` | M19 | ❌ cố ý (`B7`) | chưa quyết |

Kết luận phần này: **luật "hàng đợi = Maildir, không bảng job ở LÕI" đang được giữ
đúng** — `grep` không ra bảng job nào trong hai DDL, và `M12 diagram_flow.md:11` khai
`tmp/ → os.replace → new/` trong `chungcat/`. Đây là điểm sáng, ghi ra để không ai
"tối ưu" nó thành một bảng.

---

## C · Điều KHÔNG phải vấn đề — ghi ra để không ai đỏ oan lần sau

| | đo được |
|---|---|
| `FR-050` cách 2 thi hành **đúng** | `git ls-files \| grep -i "_backup\|_loi\|nguoi-dung\|dinh-danh"` → **0 dòng** |
| Thiếu `.githooks/pre-push` + `ho-so-du-lieu-ca-nhan.md` là **đúng** | `FR-050 §6` bỏ X1/X2/X3 khi chốt cách 2 |
| `ma_moi` entropy | `randomBytes(32).toString("base64url")` = **256 bit** ≥ 128 (`AC-7.2`) |
| `ma_moi` một-lần | `UPDATE … WHERE dung_luc IS NULL AND het_han > now` + `changes() !== 1` trong `BEGIN IMMEDIATE` (`dungchung.mjs:1243-1257`) — không phải SELECT-rồi-UPDATE |
| `ma_moi` không ra file | `XUAT_LOI` liệt cột tường minh, `ma_da_dung` **cố ý** ngoài danh sách (`:1454-1457`) |
| `lan_thu` lưu **băm** mã, không lưu mã | `:1556` |
| audit không chứa mã | `loiGhiAudit` không có tham số nhận mã; `doi_tuong: "ma:<băm>"` (`:1572`) |
| fail-closed vai | `vai NOT NULL DEFAULT 'dong_nghiep'` + enum đóng (`loi.schema.sql:38-39`); `duocLam` DENY mặc định (`:1664`) |
| chặn admin cuối | `loiDatVai:1144-1153` + `loiThuHoi:1104-1114` |
| `ban_goc_ai` bất biến | trigger DDL `:97-102`, không phải kiểm trong handler |
| SQL một cửa | `api-guard` răng 2 buộc mọi `prepare(`/`DatabaseSync` về `dungchung.mjs`; `loidb.mjs:1-14` ghi lại lần cổng đỏ đúng |
| `_kho.sqlite` vẫn thuần dẫn xuất | `check_export_dan_xuat` · `check_index_dan_xuat` · `check_ba_bang` · `check_media_*` — **tất cả xanh** |

---

## D · Đề nghị thứ tự cho người quyết

Không phải mệnh lệnh — đây là thứ tự tôi thấy rẻ nhất, người quyết.

1. **A3** trước mọi thứ. Nó không phải bug, nó là một biện pháp bù đã ký mà chưa tồn
   tại. Chốt: audit tài khoản ở đâu (`audit_loi` trong `_loi.sqlite`, hay `kb/_audit.jsonl`
   như `ADR-06:455`), rồi sửa **một** trong hai bên cho khớp.
2. **A1 + A2 cùng một lượt** — đưa `audit_loi` và `lan_thu` vào `loi.schema.sql`, rồi
   cắm cổng dùng `BANG_LOI`/`bangLoiCoThat` (đã viết sẵn, chỉ thiếu người gọi).
   Sửa A1 mà không cắm cổng A2 thì lần mọc bảng thứ ba vẫn im lặng.
3. **A12 + A13** — ký lại `FROZEN.lock` kèm id FR, và sửa `phạm_vi_ghi` của T08-16/T09-8.
4. **A4 + A5** — đổi tên ba task trùng ID; quyết `check_dinh_danh.py` viết hay hạ
   `M18 AC-3.1` xuống `soft`.
5. **B2, B3, B4** — ba câu hỏi thiết kế phải trả lời **trước** s7 của phase 2, không
   phải trong lúc code.
6. **B1** — chạy s7 cho M12–M17. Đây là việc lớn nhất và nó chặn toàn bộ phase 2.
7. Còn lại (`A6`–`A11`, `B5`, `B6`) là dọn tài liệu và siết cổng — làm rải được.

---

*Agent kiểm soát dữ liệu · chỉ đọc · không ký gate · không mở FR.*