# Space Model — ảnh hưởng tới THIẾT KẾ DATABASE

**Ngày**: 2026-09-09 · **agent**: kiểm soát dữ liệu · **chỉ đọc, chỉ báo cáo**
**Đọc**: `01_research/space-model-da-vu-tru-tri-thuc.md` (bản 2) ·
`01_research/space-model-danh-gia-va-de-bai.md` (s1 overview)
**Phạm vi file này**: **chỉ tầng dữ liệu**. UI/hiệu ứng/routing đã có ở hai tài
liệu kia; tôi không lặp lại. Tôi trả lời đúng một câu: *Space làm gì với schema
đang chạy?*

> Không chạy lệnh ghi nào. Mọi kết nối `file:…?mode=ro`.

---

## 0 · Kết luận

**Space khả thi ở tầng DB, và hôm nay là lúc rẻ nhất** — 9 bản ghi, 7 hiện vật,
**0 tài khoản**, `truyhoi/index.sqlite` **chưa tồn tại**. Nhưng có **một sự thật
kỹ thuật cứng** quyết định hình dạng, và nó chưa xuất hiện trong hai tài liệu kia:

> **SQLite KHÔNG cho cột GENERATED làm PRIMARY KEY.**
> Đo trên SQLite 3.50.4 (bản đang chạy): `generated columns cannot be part of
> the PRIMARY KEY` — với **cả** `VIRTUAL` lẫn `STORED`. `UNIQUE INDEX` trên cột
> generated thì **được**.

Cả `kho.schema.sql` dựng trên nguyên tắc *"chân lý là `frontmatter` JSON; mọi cột
khác GENERATED từ nó"*. Nên `space` **không thể** vừa *sống trong frontmatter*
vừa *nằm trong khoá*. Phải chọn một trong ba hình dạng ở §3 — và đó là quyết định
DB gốc, đứng **trước** cả R1 của đề bài research.

Và một câu hỏi phải làm rõ **trước khi ai đo gì**: tài liệu gốc §4.1 viết
*"Loại nguồn per-space"*. Trên hệ này **có hai thứ khác nhau cùng tên đó**
(§2.2) — một cái rẻ, một cái phá ba bảng. Không phân biệt thì research đo nhầm.

---

## 1 · Điểm xuất phát — schema đang chạy (đo 2026-09-09)

| DB | bảng | hàng có dữ liệu | space-ready? |
|---|---|---|---|
| `kb/_kho.sqlite` | 11 + 3 view | 9 bản ghi · 7 hiện vật · 5 cpt · 5 cat · 14 loai_nguon · 13 audit | ❌ **0 cột space** |
| `web/_loi.sqlite` | 7 | 5 nháp · 124 audit · 23 lan_thu · **0 tài khoản** | ❌ 0 cột space |
| `truyhoi/index.sqlite` | — | **chưa tồn tại** | ✅ vẽ đúng từ đầu được |

**Số 0 tài khoản là tin tốt nhất trong báo cáo này.** `space_member` là mô hình
quyền mới; thêm nó vào một bảng rỗng khác hẳn di trú 6 tài khoản đang sống.

---

## 2 · Bảy điểm va chạm ở tầng DB

### 2.1 · `[chặn]` PK ba bảng nội dung — và luật GENERATED không cho lối tắt

**Vật thể**: `kho.schema.sql:59, 84, 108` — `PRIMARY KEY (source_type, slug)` ×3
(+ `article_versions` là bộ thứ tư: `(source_type, slug, ban)`).

Nguyên tắc mở đầu file (`kho.schema.sql:4-7`):

> *"CHÂN LÝ là hai cột frontmatter (JSON nguyên văn) + than. Mọi cột khác
> GENERATED từ JSON — bảng là ảnh chiếu của frontmatter."*

Đo được, quyết định hình dạng:

```
CREATE TABLE a(fm TEXT, sp TEXT GENERATED ALWAYS AS (json_extract(fm,'$.space')) VIRTUAL,
               slug TEXT, PRIMARY KEY(sp,slug));
→ LỖI: generated columns cannot be part of the PRIMARY KEY      (VIRTUAL)
→ LỖI: generated columns cannot be part of the PRIMARY KEY      (STORED)

CREATE UNIQUE INDEX ud ON d(sp, slug);   ← trên cột VIRTUAL
→ OK
```

⇒ Ba lối, không có lối thứ tư. Xem §3.

### 2.2 · `[chặn]` *"Loại nguồn per-space"* — hệ này có HAI thứ cùng tên

Tài liệu gốc §4.1 khai Finance có loại nguồn `báo cáo · bản tin · filing`,
Thể thao có `youtube · highlight · livestream`. Trên hệ này câu đó **mơ hồ**:

| | `source_type` | bảng `loai_nguon` |
|---|---|---|
| là gì | **cột cấu trúc** | **dữ liệu người dùng sửa được** (WO-019) |
| ở đâu | cột thật + PK của 3 bảng | bảng riêng, PK `id`, 14 hàng |
| ràng buộc | `CHECK` ×3 (`kho.schema.sql:45,71,95`) + **enum ĐÓNG 7 giá trị** trong `frontmatter.schema.json` (**FROZEN**) | không CHECK, sửa qua API |
| quyết định gì | **bản ghi nằm ở BẢNG NÀO** (`FR-038`) | nhãn hiển thị + facet |
| DDL tự khai | — | *"nó TRÙNG `source_type` một cách **tình cờ**, không phải vì cùng vai"* (`kho.schema.sql:233-236`) |

**Nếu per-space nghĩa là `loai_nguon`** ⇒ **rẻ**: đổi PK `id` → `(space, id)`,
thêm `WHERE space`. Không chạm file FROZEN, không chạm ba bảng.

**Nếu per-space nghĩa là `source_type`** ⇒ **phá kiến trúc**:
`FR-038` chốt *"tách CẢ BẢNG, không chỉ tách màn"* và ánh xạ **loại → bảng** khai
ở `loai-nguon.json`. Một loại mới tên `filing` thì **nó đi vào bảng nào?** Không
bảng nào nhận — `tai_lieu` có `CHECK (source_type = 'tai-lieu')`. Muốn nhận thì
hoặc nới CHECK (mất cưỡng chế của FR-038), hoặc thêm bảng thứ tư cho mỗi space
(không khả thi).

> **⇒ Câu hỏi DB số 1 cho chủ dự án**: *"Loại nguồn per-space"* là `loai_nguon`
> (nhãn) hay `source_type` (cấu trúc)? Tôi đề nghị **`loai_nguon`** — nó đã là
> bảng, đã sửa được từ web, và ví dụ trong tài liệu (`báo cáo`, `bản tin`,
> `highlight`) đọc như **định dạng/nơi phát**, đúng vai `loai_nguon` đang giữ.

### 2.3 · `[nên]` Ontology per-space **KHÔNG** chạm file FROZEN — s1 nói hơi quá

s1 overview §1 dòng 3 khai per-space ontology ⇒ *"`frontmatter.schema.json`
FROZEN ⇒ FR"*. **Đo lại: không đúng cho `category`/`concepts`.**

```
frontmatter.schema.json  ·  category = {type: array, items: {pattern: "^[a-z0-9]+(-[a-z0-9]+)*$"}}
  $comment: "FR-034 — bo enum khoi schema. Chan ly danh muc chu de la BANG `categories`…"
                     concepts = {type: array, items: {pattern: …}}     ← cũng chỉ pattern
                     source_type = {enum: [repo, paper, video, article, docs, announcement, tai-lieu]}  ← CÒN enum
```

`FR-034` đã gỡ enum danh mục khỏi schema; chân lý nằm ở **bảng**. ⇒ per-space
`categories`/`concepts` chỉ cần đổi **PK bảng** `id` → `(space, id)` và sửa cổng
`--categories` của `validate.py`. **Không FR cho file FROZEN.**

Chỗ **thật sự** vướng file FROZEN là `source_type` — tức đúng §2.2.

### 2.4 · `[chặn]` `media` là **địa chỉ theo nội dung** ⇒ space-agnostic *theo cấu trúc*

**Vật thể**: `kho.schema.sql:180-198` — `media` PK = `sha256`, 7 hàng, 2,90 MB.

Cùng một PDF nạp vào Finance và vào Công nghệ ⇒ **cùng `sha256`** ⇒ **MỘT hàng**.
Đó là dedup đúng và không nên bỏ. Nhưng nó tạo hai hệ quả mà `WHERE space` **không
chữa được**, vì object thật sự thuộc N space:

**a · Cửa phục vụ hiện vật không có space để kiểm.**
`GET /api/articles/media/<sha>` nhận một hash. Ai biết `sha256` là tải được byte.
Thêm cột `space` vào `media` là **sai** — hàng đó thuộc nhiều space. Quyền phải
kiểm ở **tham chiếu** (bản ghi nào trỏ tới, người hỏi có space đó không), không ở
**object**. Đây là lớp kiểm **chưa tồn tại**.

**b · Luật mồ côi thành liên-space.**
`tham_chieu_media` (view, 5 nhánh, 9 hàng) là nguồn của vòng reap trong
`xuat_kho.py`. Xoá bản ghi cuối cùng trỏ tới một `sha256` **trong space A** không
được xoá byte nếu space B còn trỏ. View hiện gộp mọi space nên **hành vi đúng sẵn**
— nhưng chỉ đúng khi view **không** bị thêm `WHERE space`. Ai đó "sửa cho nhất
quán" bằng cách thêm bộ lọc space vào view này sẽ **xoá byte của space khác**.

> `FR-052` đã kể lần cơ chế này suýt **xoá sạch `kb/_media/`** vì một hàm trả tập
> rỗng. Đây là cùng cái bẫy, nhân lên số space.

**⇒ Luật phải viết ra**: `media` và `tham_chieu_media` là **hai chỗ CỐ Ý không
mang space**. Không khai thì lần refactor sau sẽ "sửa" chúng.

### 2.5 · `[chặn]` Đường export — slug per-space làm hai bản ghi **đè nhau im lặng**

**Vật thể**: `xuat_kho.py` ghi `kb/<loai>/<slug>.md`; `dung_lai_db.py:191-218`
đọc ngược, `f.parent.name` là `source_type`, `f.stem` là `slug`.

Nếu slug chỉ duy nhất **trong** space:

```
space finance · video/tong-ket-quy-3   ─┐
space tech    · video/tong-ket-quy-3   ─┴─► kb/video/tong-ket-quy-3.md   ← MỘT file
```

Bản ghi thứ hai **đè** bản thứ nhất lúc export; lần `dung_lai_db` kế tiếp kho mất
một bản. Vòng reap còn xoá nốt phần dư.

Cổng có bắt không? `bam_noi_dung()` sẽ ra hash khác ⇒ **có**, cổng round-trip đỏ.
Tốt — nhưng nó đỏ **sau khi** file đã bị đè. Và nhắc lại phát hiện 09-03:
`bam_noi_dung()` **không băm bảng `loai_nguon`**, nên vùng mù vẫn còn.

⇒ **Slug per-space bắt buộc kéo theo đổi cây file** (`kb/<space>/<loai>/<slug>.md`),
tức đổi cả hai tool đường DB↔file và điểm bất động. Đó là câu R2 của đề bài, và
câu trả lời đã bị **ràng** bởi R1 — hai câu không độc lập như bảng đề bài trình bày.

### 2.6 · `[nên]` `audit_log` + `audit_loi` **không có cột space**, và **không backfill được**

| | hàng | trigger |
|---|---:|---|
| `audit_log` (kho) | 13 | `chi_noi_them` · `khong_xoa` · `khong_ghi_de` |
| `audit_loi` (LÕI) | 124 | ba trigger cùng khuôn |

Cả hai **append-only bằng cấu trúc**. Nghĩa là sau khi có Space, câu *"ai đổi danh
mục nào **trong space nào**"* không trả lời được cho 137 dòng đã có, **vĩnh viễn** —
`UPDATE` bị trigger chặn, đúng như thiết kế.

Không nghiêm trọng hôm nay (137 dòng, một space). Nhưng nó là **hạn chót**: mỗi
ngày trôi qua là thêm dòng audit không space. Thêm cột `space` (NULL = space mặc
định) **trước** khi mở space thứ hai là rẻ; sau đó thì không sửa lại được.

### 2.7 · `[nên]` DB của LÕI — hai mô hình quyền không tương thích

| đang có | Space đòi |
|---|---|
| `nguoi_dung.vai` — **enum ĐÓNG** `{chu, dong_nghiep}` (`loi.schema.sql:38-39`) | `space_member(space, user, role)` — `owner \| editor \| viewer` |
| `QUYEN` = map tĩnh 5 việc → vai, **không có chiều space** (`dungchung.mjs`) | quyền **theo từng space** |
| `duocLam()` — **đúng MỘT chỗ** đọc `vai` | vẫn một chỗ, nhưng chữ ký đổi: `duocLam(nguoi, viec)` → `duocLam(nguoi, viec, space)` |
| `phien` — 7 cột, **không có** "space đang mở" | *"nhớ space cuối cùng"* (tài liệu §7) |
| `nhap_chung_cat` — 5 hàng, không space | nháp thuộc space của nguyên liệu |

**Tin tốt, đo được**: `nguoi_dung` **0 hàng**, `phien` **0 hàng**,
`dinh_danh_kenh` **0 hàng**. Không có gì để di trú. Và `duocLam()` là **một** chỗ
đọc `vai` — cổng `Y3` đang canh điều đó, nên chữ ký đổi ở một nơi.

**Tin xấu**: `FR-045` đã **duyệt** mô hình *"một `chu` + ≤5 tài khoản đọc"*.
`space_member` không phải bổ sung, nó là **mô hình khác** — người `chu` toàn hệ
và người `owner` của một space là hai khái niệm. Cần FR sửa một FR đã duyệt.

⚠️ Và một lỗ cũ chưa vá lại thành quan trọng hơn: **`boi` NULL cho cả 124 dòng
`audit_loi`**. Cột đó trả lời *"AI ĐÃ làm"*. Với nhiều space và nhiều owner, một
audit không biết ai làm là một audit không dùng được.

---

## 3 · Ba hình dạng cho `space` — chọn một, không có lối thứ tư

Luật SQLite ở §0 loại bỏ mọi phương án "vừa trong JSON vừa trong khoá".

### Hình dạng A — `space` là **cột THẬT**, PK ba cột

```sql
CREATE TABLE bai_viet (
  space       TEXT NOT NULL DEFAULT 'mac-dinh',   -- cột THẬT, không GENERATED
  source_type TEXT NOT NULL CHECK (...),
  slug        TEXT NOT NULL,
  frontmatter TEXT NOT NULL,
  ...
  PRIMARY KEY (space, source_type, slug),
  CHECK (json_extract(frontmatter,'$.space') = space)   -- ép hai bên khớp
);
```

| được | mất |
|---|---|
| slug **trùng được** giữa các space — đúng thứ người dùng mong | **phá nguyên tắc mở đầu file**: có một cột thật không phải GENERATED. `CHECK` bù lại (cùng khuôn `slug`/`source_type` đang làm) |
| PK cưỡng chế cách ly ở tầng engine | `dia-chi.json`: **3 trong 5 dạng** địa chỉ là `slug` **trần** (`^([a-z0-9][a-z0-9-]{1,79})$`) ⇒ **mơ hồ**, phải mang tiền tố space |
| | cây file **phải** đổi sang `kb/<space>/<loai>/` (§2.5) |
| | `doc_id` của M13/M14 đổi hình dạng ⇒ `FR-072` phải sửa **trước** khi M13 code |

### Hình dạng B — `space` trong frontmatter, **slug duy nhất TOÀN HỆ**

```sql
  -- PK GIỮ NGUYÊN (source_type, slug)
  space TEXT GENERATED ALWAYS AS (json_extract(frontmatter,'$.space')) VIRTUAL,
  ...
CREATE INDEX i_bv_space ON bai_viet (space);
```

| được | mất |
|---|---|
| **0 dòng PK đổi** · `dia-chi.json` **không đổi** · `doc_id` **không đổi** · cây file **không đổi** · điểm bất động **không đổi** | slug **duy nhất toàn hệ** — Finance và Thể thao không thể cùng có `tong-ket-quy-3` |
| giữ nguyên vẹn *"chân lý là frontmatter"* | cách ly là **kỷ luật `WHERE`**, không phải engine ⇒ cổng chống rò (R4) là thứ **duy nhất** ngăn rò |
| M13 đi tiếp **không chờ** gì | space là dữ liệu trong JSON ⇒ đổi space một bản ghi = ghi lại frontmatter (đúng khuôn hiện có) |

### Hình dạng C — cột thật + **UNIQUE INDEX**, PK giữ nguyên

```sql
  space TEXT NOT NULL DEFAULT 'mac-dinh',
  PRIMARY KEY (source_type, slug),                    -- giữ
  -- và nếu sau này muốn slug trùng giữa space:
  -- bỏ PK trên, dựng UNIQUE INDEX (space, source_type, slug)
```

Là **A trì hoãn**: hôm nay slug vẫn duy nhất toàn hệ (PK cũ), cột `space` đã có
sẵn để lọc. Ngày nào cần slug trùng thì đổi **một** chỉ mục, không đổi mọi địa chỉ.

### So sánh — đo bằng "bao nhiêu hợp đồng phải mở lại"

| | A · PK ba cột | B · slug toàn hệ | C · cột + PK cũ |
|---|---|---|---|
| `kho.schema.sql` (không frozen) | đổi | đổi | đổi |
| `frontmatter.schema.json` (**FROZEN**) | thêm `space` ⇒ **FR** | thêm `space` ⇒ **FR** | thêm `space` ⇒ **FR** |
| `dia-chi.json` 5 dạng | **3 dạng đổi** | 0 | 0 |
| `doc_id` M13/M14 (`FR-072`) | **đổi hợp đồng** | 0 | 0 |
| cây file + 2 tool DB↔file | **đổi** | 0 | 0 |
| điểm bất động `bam_noi_dung` | dựng lại | giữ | giữ |
| slug trùng giữa space | ✅ | ❌ | ❌ *(mở sau)* |
| cách ly cưỡng chế bởi | **engine** | cổng R4 | cổng R4 |

**Đề nghị của tôi: C.** Lý do là một câu đo được — **cả ba đều phải mở FR cho
`frontmatter.schema.json`, nhưng chỉ A bắt mở lại `dia-chi.json` + `FR-072` +
hai tool DB↔file, và `FR-072` đang mở còn M13 đang lên plan.** C cho đúng thứ
Space cần hôm nay (lọc theo space) mà không đụng địa chỉ; và nó **để ngỏ** đường
sang A bằng một chỉ mục nếu ngày nào slug trùng thành nhu cầu thật.

> Đây là ý kiến của một agent đọc schema, **không phải quyết định**. Nó cũng
> chính là câu R1 của đề bài — và tôi nêu ra vì R1 phải trả lời **trong tuần này**
> (M13 đang lên plan), không phải sau spike 5 ngày.

---

## 4 · Bề mặt rò chéo space — đếm được, không phải cảm tính

Nếu chọn B hoặc C, cách ly là **kỷ luật `WHERE`**. Đây là danh sách chỗ phải có
bộ lọc, đo trên mã hôm nay:

| # | chỗ | hôm nay | rủi ro nếu quên |
|---|---|---|---|
| 1 | view `ban_ghi` — **mọi đường đọc-cả-kho** | 9 hàng, không space | một dòng quên = **cả kho lộ** |
| 2 | view `nhan` — sidebar đếm nhãn | 22 hàng | sidebar Thể thao hiện "Hermes Agent" — đúng triệu chứng tài liệu gốc mở đầu |
| 3 | `GET /api/index` | không tham số space | danh sách trộn |
| 4 | 3 index `review_status`/`url_normalized`/`analyzed_at` ×3 bảng | 9 index | truy vấn chậm, **không** rò |
| 5 | `media` + `tham_chieu_media` | 7 hàng | ⚠️ **CỐ Ý không lọc** — §2.4 |
| 6 | `concepts` · `categories` · `loai_nguon` | PK `id` | ontology trộn |
| 7 | `recycle` · `article_versions` | 0 hàng | khôi phục nhầm space |
| 8 | `truyhoi/index.sqlite` | **chưa tồn tại** | ✅ vẽ đúng từ đầu |
| 9 | `nhap_chung_cat` | 5 hàng | nháp Finance hiện ở hàng đợi Công nghệ |

**Cổng R4 của đề bài đúng nhưng chưa đủ.** Nó đo *"hỏi space A → 0 hàng space B"*
qua M13 và `/api/index`. Còn thiếu: **view `nhan`** (số đếm sidebar) và
**`nhap_chung_cat`** (hàng đợi duyệt). Cả hai là đường đọc thật mà người dùng
nhìn thấy trước cả kết quả tìm kiếm.

---

## 5 · Hai đính chính cho tài liệu s1 — kèm bằng chứng

| s1 nói | đo được | hệ quả |
|---|---|---|
| §1 dòng 3: ontology per-space ⇒ *"`frontmatter.schema.json` FROZEN ⇒ FR"* | `category` và `concepts` **đã không còn enum** trong file frozen (`FR-034` gỡ, chân lý là **bảng**) | per-space ontology **không** cần FR cho file frozen. Chỗ cần FR là **`source_type`** (enum 7 giá trị còn nguyên) |
| §4 bảng đề bài xếp R1 và R2 là **hai câu độc lập** | R2 (space nằm đâu trong cây `kb/`) bị **ràng** bởi R1: slug per-space ⇒ **bắt buộc** `kb/<space>/<loai>/`, không thì hai bản ghi đè nhau khi export (§2.5) | R2 không có phương án riêng; nó là **hệ quả** của R1. Ghép hai câu, đỡ một vòng |

Ngoài hai điểm đó, phần đánh giá DB của s1 **khớp với đo đạc của tôi** — gồm cả
kết luận *"đắt ở M02 → M01, gần 0 ở THỢ/BIÊN"*.

---

## 6 · Thứ tự tôi đề nghị — rẻ trước, không-lùi-được sau

| # | việc | vì sao trước |
|---|---|---|
| 0 | Chốt §2.2 — *"loại nguồn per-space"* là `loai_nguon` hay `source_type` | một câu trả lời, và nó quyết định research đo cái gì |
| 1 | Chốt §3 — hình dạng A / B / C | mọi thứ khác dẫn xuất từ đây; và **M13 đang lên plan** |
| 2 | Thêm cột `space` vào `audit_log` + `audit_loi` (NULL = mặc định) | append-only ⇒ **không backfill được**; mỗi ngày trôi là thêm dòng mù |
| 3 | Viết luật *"`media` và `tham_chieu_media` CỐ Ý không mang space"* vào DDL | không khai thì lần refactor sau sẽ "sửa" chúng và **xoá byte của space khác** |
| 4 | Cổng R4 mở rộng: thêm view `nhan` + `nhap_chung_cat` | hai đường đọc người dùng thấy trước kết quả tìm kiếm |
| 5 | `truyhoi/index.sqlite` vẽ có `space` **từ hàng đầu tiên** | file chưa tồn tại — đây là món quà, đừng bỏ |
| 6 | Di trú 9 bản ghi + 7 hiện vật sang space mặc định | 15 phút hôm nay |

**Ba nợ cũ nay thành điều kiện của Space**, không còn là việc dọn dẹp:

- `audit_loi.boi` **NULL 124/124** — nhiều owner mà audit không biết ai làm;
- `audit_loi` + `lan_thu` **ngoài `loi.schema.sql`** — thêm cột space vào một bảng
  không khai trong DDL thì không cổng nào biết nó có đúng hình dạng;
- `bam_noi_dung()` **không băm `loai_nguon`** — bảng này sắp thành per-space, và
  điểm bất động đang mù với nó.

---

## 7 · Điều Space **KHÔNG** đụng — ghi ra để khỏi lo thừa

| | vì sao an toàn |
|---|---|
| Ba vùng tin cậy LÕI/THỢ/BIÊN | Space là trục **dữ liệu**, không phải trục **quyền hệ thống**. Không chạm egress, không chạm khoá model |
| `media` là địa chỉ theo nội dung | `sha256` không quan tâm space — dedup xuyên space là **đúng**, không phải lỗ |
| Ba trigger append-only của hai bảng audit | không đổi hành vi, chỉ thêm cột |
| `nguoi_dung`/`phien`/`dinh_danh_kenh` | **0 hàng** — không có gì để di trú |
| `_backup/` + `xuatLoi()` | cột mới đi vào danh sách `cot` tường minh; cơ chế không đổi |
| Điểm bất động DB↔file | **giữ nguyên** nếu chọn B hoặc C; chỉ A mới bắt dựng lại |

---

*Agent kiểm soát dữ liệu · chỉ đọc (mode=ro) · không ký gate · không mở FR ·
không sửa artifact của ai.*