# Các bảng đang chạy — khoá chính & đang lưu gì (sau khi M12 chốt)

**Đo lúc**: 2026-09-08 · **agent**: kiểm soát dữ liệu · **chỉ đọc, chỉ báo cáo**
**Trả lời trực tiếp**: bảng nào đang chạy · khoá chính là gì · mỗi bảng giữ gì.

> Lần này **không chạy một lệnh ghi nào**. Mọi kết nối mở bằng `file:…?mode=ro`.
> *(Báo cáo 09-05 tôi đã lỡ chạy `dung_lai_db.py` — không lặp lại.)*

---

## 0 · Ba file DB đang tồn tại

| file | kích thước | sửa lần cuối | loại | sống? |
|---|---:|---|---|---|
| `kb/_kho.sqlite` | 3.219.456 B | 2026-09-08 05:43 | **dẫn xuất** — dựng lại được từ `kb/` | ✅ đang chạy |
| `web/_loi.sqlite` | 319.488 B | 2026-09-08 05:42 | **gốc** — KHÔNG dựng lại được | ✅ đang chạy |
| `kb/_index.sqlite` | 53.248 B | **2026-08-26** | RETIRED (`FR-034`) | ⚰️ **chết** — không code nào đọc |

---

## 1 · `kb/_kho.sqlite` — 11 bảng + 3 view · **14/14 khớp DDL** ✅

```bash
core/assets/kho.schema.sql: khai 14 / thật 14 | THỪA: — | THIẾU: —
```

### 1.1 · Ba bảng NỘI DUNG — cùng một hình dạng, tách theo module (`FR-038`)

| bảng | **khoá chính** | hàng | đang lưu gì |
|---|---|---:|---|
| `bai_viet` | **(`source_type`, `slug`)** | **2** | Bản phân tích nguồn CHỮ — `repo`·`paper`·`article`·`docs`·`announcement` |
| `tai_lieu` | **(`source_type`, `slug`)** | **2** | Tài liệu NGƯỜI TẢI LÊN — pdf/ppt/word |
| `video` | **(`source_type`, `slug`)** | **5** | Bản ghi video — **ĐĂNG KÝ URL**, không giữ byte video |

**Cột thật chỉ có 6** — `source_type`, `slug`, `frontmatter`, `than`, `version`,
`etag`. Chân lý là **hai cột**: `frontmatter` (JSON nguyên văn) + `than`
(markdown). Bảy cột còn lại (`id`, `review_status`, `title`, `one_liner`,
`analyzed_at`, `url_normalized`, `word_count`) là **GENERATED ALWAYS … VIRTUAL**
rút từ JSON — bảng là **ảnh chiếu** của frontmatter, không phải một lựa chọn
trường song song.

> **Vì sao PK ghép** chứ không `slug` một mình: bài học `FR-023 GĐ 3` —
> `repo/x.md` cạnh `article/x.md` từng làm index ghi 3/5 bản, **hai bài biến mất
> im lặng**.

**Nội dung thật hôm nay — 9 bản ghi:**

```
bai_viet  article/phan-tich-cai-dat-va-thiet-lap-hermes-tren-vps   draft      1194 từ
          repo/ruflo-bo-khung-van-hanh-cho-agent                   approved   1413 từ
tai_lieu  tai-lieu/linux-foundation                                approved      9 từ
          tai-lieu/xgboost-stap-by-step                            approved     74 từ
video     video/cai-dat-va-thiet-lap-hermes-tren-vps               approved    273 từ
          video/doanh-nghiep-mot-nguoi-tai-viet-nam-…              approved     73 từ
          video/goc-nhin-gia-tri-thoi-ai                           approved      7 từ
          video/hermes-agent-zero-to-personal-ai-assistan          approved     89 từ
          video/thien-duong-chuot-tuong-lai-…                      approved     10 từ

approved ███████████████████████████████████████████░░░░░  8 / 9
draft    █████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  1 / 9
```

Mỗi bảng có **3 index**: `review_status` · `url_normalized` · `analyzed_at`.

### 1.2 · Kho hiện vật

| bảng | **khoá chính** | hàng | đang lưu gì |
|---|---|---:|---|
| `media` | **`sha256`** | **7** | **BYTE THẬT** của hiện vật — địa chỉ theo nội dung |

Cột: `sha256` · `byte` (BLOB) · `la_dan_xuat` · `kieu_moc` · `so_byte` (GENERATED).
**Không cột metadata nào** — `mime`/`ten_goc` sống trong `frontmatter.media`.

**7 object · 3.044.738 byte (2,90 MB):**

```
6714ee1908…  2.976.936 B  .pdf   ← tài liệu người tải lên
0f2305e097…     20.519 B  .vtt   ┐
ad1664eff0…     18.814 B  .vtt   │ 5 TRANSCRIPT — hiện vật dẫn xuất
7527b7bfb3…     11.861 B  .vtt   │ của 5 bản ghi video (FR-054)
2e676d806d…      8.700 B  .vtt   │
63d2c8b0ff…      4.115 B  .vtt   ┘
cd31427988…      3.793 B  .md
```

⚠️ **`la_dan_xuat = 0` và `kieu_moc = NULL` cho cả 7** — xem §3.2.

### 1.3 · Vòng đời bản ghi

| bảng | **khoá chính** | hàng | đang lưu gì |
|---|---|---:|---|
| `article_versions` | **(`source_type`, `slug`, `ban`)** | **0** | Bản lưu trữ khi re-analyze → export `<slug>.v<n>.md` |
| `recycle` | **`stt`** (AUTOINCREMENT) | **0** | Thùng rác — snapshot nguyên văn lúc xoá + `deleted_at` |

`recycle.stt` dùng AUTOINCREMENT **có lý do**: xoá cùng một slug nhiều lần thì
các bản không đè nhau.

### 1.4 · Danh mục kiểm soát

| bảng | **khoá chính** | hàng | đang lưu gì |
|---|---|---:|---|
| `concepts` | **`id`** | **5** | `talkshow` · `algorithm` · `agent` · `hermes` · `news` |
| `categories` | **`id`** | **5** | `aitalkshow` · `ml` · `hcsy` · `skill` · `business` |
| `loai_nguon` | **`id`** | **14** | bài-viết 5 · tài-liệu 6 · video 3 |

`loai_nguon` chi tiết:

```
bai-viet   repo, paper, article, docs, announcement
tai-lieu   pdf, pptx, docx, ppt, doc, bin
video      youtube, tiktok, tai-len
```

`M02-R3`: **chỉ người khai nhãn**, máy không tự sinh tên.

### 1.5 · Nhật ký & siêu dữ liệu

| bảng | **khoá chính** | hàng | đang lưu gì |
|---|---|---:|---|
| `audit_log` | **`stt`** (AUTOINCREMENT) | **13** | Ai đổi danh mục nào, khi nào — **append-only, 3 trigger** |
| `meta` | **`khoa`** | **4** | `schema_version` · `concepts_header` 483 B · `categories_header` 880 B · `nhat_ky_goc` **0 B** |

`audit_log` — 13 dòng, **100% là thao tác danh mục**, 2026-08-29 → 2026-09-07:

```
2026-08-29  THEM categories aitalkshow │ THEM concepts talkshow │ SUA categories aitalkshow
            THEM categories algorithm  │ XOA  categories algorithm │ THEM categories ml
            THEM concepts   algorithm
2026-09-04  THEM categories hcsy
2026-09-05  THEM categories skill      │ THEM concepts agent │ THEM concepts hermes
2026-09-07  THEM categories business   │ THEM concepts news
```

Ba trigger canh: `audit_chi_noi_them` (UPDATE) · `audit_khong_xoa` (DELETE) ·
`audit_khong_ghi_de` (INSERT OR REPLACE cùng `stt`).

### 1.6 · Ba VIEW — không có khoá chính, không lưu gì

| view | hàng | là gì |
|---|---:|---|
| `ban_ghi` | **9** | UNION ALL ba bảng nội dung — **mọi đường đọc-cả-kho** đi qua đây |
| `nhan` | **22** | Nhãn rút từ JSON: category 10 · concept 9 · proposed 3 |
| `tham_chieu_media` | **9** | 5 nhánh trỏ tới `media`, khai MỘT nơi — luật mồ côi đọc view này |

**`nhan` là VIEW, không phải bảng** — nên số đếm nhãn không bao giờ trôi khỏi bài.

3 khái niệm ĐỀ XUẤT chưa ai duyệt vào danh mục: `taylor-bac-hai-trong-boosting`
· `hessian-lam-do-cong` · `dieu-chuan-trong-ham-muc-tieu`.

---

## 2 · `web/_loi.sqlite` — **7 bảng thật / 5 khai** ❌

```bash
web/api/loi.schema.sql: khai 5 / thật 7 | THỪA trong DB: ['audit_loi', 'lan_thu']
```

### 2.1 · Năm bảng ĐƯỢC KHAI

| bảng | **khoá chính** | hàng | đang lưu gì |
|---|---|---:|---|
| `nguoi_dung` | **`id`** | **0** | Tài khoản: `ten` (**DLCN**), `vai` ∈ {`chu`,`dong_nghiep`}, `trang_thai`, `thu_hoi_luc` |
| `ma_moi` | **`ma`** | **0** | Mã mời — **BÍ MẬT**, một-lần + hết-hạn. Không export, không vào log |
| `dinh_danh_kenh` | ⚠️ **KHÔNG CÓ PK** | **0** | Buộc `chat_id` (**DLCN**) ↔ tài khoản. Ràng buộc là `UNIQUE(kenh, chat_id)` |
| `phien` | **`id`** | **0** | Session: `nguoi_dung_id`, `kenh`, `ngu_canh` (JSON), `het_han` |
| `nhap_chung_cat` | **`job_ulid`** | **5** | Bản nháp chưng cất của M12 |

**Khoá ngoại** (`PRAGMA foreign_keys = ON`, **không** `ON DELETE CASCADE` ở đâu cả):

```
ma_moi.nguoi_dung_id          → nguoi_dung.id
dinh_danh_kenh.nguoi_dung_id  → nguoi_dung.id
dinh_danh_kenh.ma_da_dung     → ma_moi.ma
phien.nguoi_dung_id           → nguoi_dung.id
nhap_chung_cat.nguoi_dung_id  → nguoi_dung.id
```

> ⚠️ `dinh_danh_kenh` là **bảng duy nhất trong cả hai DB không có PRIMARY KEY**.
> `UNIQUE(kenh, chat_id)` cho nó một autoindex nên hành vi hôm nay đúng, và
> `AC-3.2` được thoả. Nhưng nó cũng nghĩa là bảng có `rowid` ẩn — và một bảng
> mà bốn bảng khác trỏ vào bằng `nguoi_dung_id` thì việc **không khai PK** là một
> khác biệt nên có chủ ý, không nên là tình cờ. Xem §3.4.

**`nhap_chung_cat` — 11 cột, 5 hàng:**

```
trang_thai  ∈ {nhap, da_sua, da_duyet, tra_lai, da_bo}
nhap        █  1
da_duyet    █  1
da_bo       ███ 3   (cả 3 đều CÓ ly_do ✅)

review_status   draft  5/5   (CHECK ép cứng = 'draft')
nguoi_dung_id   NULL   5/5   ← mọi job vẫn KHÔNG CHỦ
ban_goc_ai ≠ ban_hien_tai    0/5   ← chưa bản nào bị người sửa
khang_dinh_bi_tia có giá trị 0/5
lan_gui_duyet tổng           0
tao_luc  2026-09-06 01:05 → 2026-09-07 14:05
```

### 2.2 · Hai bảng **KHÔNG ĐƯỢC KHAI** — tạo trong thân hàm

| bảng | **khoá chính** | hàng | đang lưu gì | khai ở đâu |
|---|---|---:|---|---|
| `audit_loi` | **`stt`** | **124** | Nhật ký của LÕI — append-only, 3 trigger | `dungchung.mjs` **trong hàm** |
| `lan_thu` | **`stt`** | **23** | Chống dò: `ip` + `ma_bam` (**băm**, không phải mã) | `dungchung.mjs` **trong hàm** |

**`audit_loi` — 124 dòng, `stt` liên tục 1→124, 2026-09-04 → 2026-09-07:**

```
tao-job-khong-chu           ████████████████████████████████  60   ok
tao-nhap-chung-cat          ███████████████████████           44   ok
bo-nhap                     █████                             10   ok
duyet-nhap-vao-kho          ███                                6   ok
tao-nhap-chung-cat          █                                  2   THẤT BẠI ✅
ban-chung-cat-cu-vao-rac    █                                  1   ok
tra-lai-nhap                █                                  1   ok

cột `boi` (AI ĐÃ làm)  →  NULL 124/124
```

**`lan_thu` — 23 lượt, `ma_bam` NULL 23/23** (chưa mã mời nào tồn tại để bị thử).

---

## 3 · Review — sáu điều

### 3.1 · ✅ Cổng khá lên rõ: **23 xanh / 8 đỏ** (09-05 là 18/11)

`check_g6b` từ **33 lỗi → 1 lỗi** (`T13-6`). M12 đóng đúng như bạn nói.

| cổng còn đỏ | chủ |
|---|---|
| `check_db_dung_cho` | **ĐỎ OAN** — §3.3 |
| `check_media_ddl` | trần 1 GiB — **2 ràng buộc DDL không bắn thật** *(mở từ 09-05)* |
| `check_danh_muc` · `check_loai_nguon_db` · `check_skill` · `check_running` · `check_worklog` · `check_g6b` | ngoài phạm vi DB — M13/kb-mock/tài liệu |

### 3.2 · `[chặn]` **5 transcript là hiện vật DẪN XUẤT nhưng cờ nói ngược lại**

Đo: cả 7 hàng `media` có `la_dan_xuat = 0` và `kieu_moc = NULL`.

Nhưng `core/assets/media-mime.json` khai `.vtt` là `"chi_dan_xuat": true`, và
`FR-054 §1.2` khai transcript *"vào kho làm **HIỆN VẬT DẪN XUẤT** của bản ghi
video"*. Có **5 file `.vtt`** trong `media`.

Hai cột này mang hai câu hỏi khác nhau — DDL nói rõ:

| cột | câu hỏi | giá trị hôm nay |
|---|---|---|
| `la_dan_xuat` | *"dựng lại được từ nguồn không?"* | `0` — tức **KHÔNG** |
| `kieu_moc` | *"máy phiên âm hay người đã sửa?"* | `NULL` — tức *"không phải hiện vật phiên âm"* |

DDL viết thẳng lý do `kieu_moc` phải tồn tại:

> *"`la_asr` ⇒ chữ **verified** chỉ bảo đảm quote có trong TRANSCRIPT CỦA TA,
> **không** bảo đảm người trong video đã nói thế. `nguoi_sua` ⇒ mức bảo đảm
> KHÁC, và cao hơn."*

⇒ Với 5 transcript đang `NULL`, câu hỏi *"trích dẫn này máy nghe hay người đã
soát?"* **không trả lời được** — và đó đúng là câu `AC-V7` tồn tại để bảo vệ.

**Hai khả năng, người quyết:**

- (a) Cả 5 là ASR chưa ai soát ⇒ phải là `la_dan_xuat = 1`, `kieu_moc = 'la_asr'`;
- (b) `la_dan_xuat = 0` là **cố ý** vì `xuat_kho.py:197` chỉ export dòng
  `la_dan_xuat = 0`, và transcript **cần** ra `kb/_media/` *(5 file `.vtt` có
  thật ở đó)* — nếu vậy thì `la_dan_xuat` đang gánh **hai nghĩa**: *"là dẫn
  xuất"* và *"đừng export"*, và một cột gánh hai nghĩa sẽ nói dối ở nghĩa thứ hai.

Dù (a) hay (b), `kieu_moc = NULL` cho 5 hàng ASR vẫn là một lỗ độc lập.

### 3.3 · `[chặn]` `check_db_dung_cho` vẫn ĐỎ OAN — **sang ngày thứ tư**

Cùng nguyên nhân đã báo 09-05: cổng khớp `\bma_moi\b` / `\bphien\b` trong khối
`XUAT_LOI` và bắt trúng **một dòng chú thích**:

```js
// `ma_moi` + `phien` VẪN không xuất — ADR-06 (c) giữ nguyên vế bí mật.
```

Đo lại hôm nay, vẫn không phải vi phạm thật: `_backup/` đúng **4 file**
(`nguoi-dung` · `dinh-danh-kenh` · `nhap-chung-cat` · `audit-loi`), không cái nào
là hai bảng bí mật; `ma_moi` 0 hàng; `phien` 0 hàng.

Cách sửa đã có sẵn trong repo: `boComment()` mà `api-guard.test.js:28` dùng, kèm
câu *"So code, không so lời kể"*.

### 3.4 · `[chặn]` `nhap_chung_cat` mất 18 hàng — **chưa quy được chủ**

| | 2026-09-05 | 2026-09-08 |
|---|---|---|
| `nhap_chung_cat` | **23** hàng, cũ nhất `2026-09-04 04:17` | **5** hàng, cũ nhất `2026-09-06 01:05` |
| `lan_thu` | 23 hàng, `stt` 1→23, cũ nhất `2026-09-04 04:17` | 23 hàng, **`stt` 1→23**, cũ nhất `2026-09-06 01:03` |
| `audit_loi` | 49 hàng | **124** hàng, `stt` **liên tục 1→124**, giữ 51 dòng trước 09-06 |

`audit_loi.stt` liên tục ⇒ file DB **không** bị xoá. `lan_thu.stt` **quay về 1**
⇒ bảng đó bị **xoá sạch hàng** (`stt` là `INTEGER PRIMARY KEY` không
AUTOINCREMENT nên rowid tái sử dụng). `nhap_chung_cat` mất mọi hàng trước 09-06.

**Không code nào làm việc đó.** `grep "DELETE FROM"` trong `web/api/` ra đúng
3 dòng, cả ba thuộc kho (`concepts`/`categories`, ba bảng nội dung, `recycle`) —
**không dòng nào chạm `nhap_chung_cat` hay `lan_thu`**. Và `FR-057` chốt
*"bỏ ≠ xoá — `ban_goc_ai` tốn token"*, `da_bo` là **trạng thái**, không phải xoá.

⇒ **Chưa quy được chủ.** Có thể là SQL tay, một script ngoài repo, hoặc một
lượt dọn của người. Tôi **không** phán đây là lỗi của ai.

**Nhưng đây là điều kiện làm nó xảy ra được, và nó là lỗi thật:**

> `nhap_chung_cat` **không có trigger `BEFORE DELETE`**.
> `audit_loi` có (`audit_loi_khong_xoa`). `nhap_chung_cat` chỉ có
> `nhap_chung_cat_ban_goc_bat_bien` — và nó là `BEFORE UPDATE OF ban_goc_ai`.

Tức: `ban_goc_ai` **không sửa được**, nhưng **cả hàng thì xoá được**, và mất hàng
là mất luôn `ban_goc_ai`. Bất biến *"bản gốc AI là thứ tốn token nhất"* được
cưỡng chế ở chiều UPDATE và **để hở hoàn toàn** ở chiều DELETE.

**Đề xuất**: thêm `BEFORE DELETE ON nhap_chung_cat` RAISE(ABORT) — cùng khuôn đã
có sẵn cách đó vài dòng. `FR-057` đã nói *"bỏ là một chiều"*; hôm nay câu đó
sống trong handler (`nhap-cua.mjs:181-182`), không sống trong schema.

### 3.5 · `[chặn]` VẪN MỞ từ 09-03 — hai bảng ngoài DDL, cổng đếm chưa cắm

`audit_loi` (124 hàng) + `lan_thu` (23 hàng) vẫn `CREATE TABLE IF NOT EXISTS`
trong thân hàm. `BANG_LOI` (`loidb.mjs:37`) vẫn liệt **5**, `bangLoiCoThat()`
vẫn **không cổng nào gọi**.

Và hệ quả cũ chưa đổi: ba hàm tạo `audit_loi` với **hai hình dạng khác nhau**;
`loiDemAudit`/`loiDocAudit` tạo bản **thiếu cột `boi`**, và nếu một trong hai
chạy trước trên DB mới thì mọi phép ghi audit sau đó **ném lỗi vĩnh viễn**.

⚠️ Liên quan trực tiếp: **`boi` NULL cho cả 124 dòng** hiện có. Cột đó tồn tại để
trả lời *"AI ĐÃ làm"* (`FR-051 §7b`, cổng `Y8`) và nó **chưa từng được ghi**.

### 3.6 · `[nên]` Hai test ghi vào DB **THẬT**

```bash
# test gọi cửa C1–C7 mà KHÔNG đặt LOI_DB:
web/test/ban-cu-vao-rac.test.js
web/test/chung-cat-nhap.test.js
```

`web/test/_api.mjs:314` đã cảnh báo đúng chỗ này: *"không đặt thì server dùng
`web/_loi.sqlite` **THẬT** và ghi bản lùi vào `web/_luu/` thật"*.

Đây giải thích `tao-job-khong-chu` **60 lần** và `web/_luu/` còn tồn tại. Nó
**không** giải thích §3.4 (xoá hàng), nhưng nó nghĩa là **dữ liệu thật và dữ
liệu test đang trộn trong cùng một bảng** — và không cách nào tách chúng về sau.

### 3.7 · `[nên]` Hai thứ đã chết còn nằm trên đĩa

| | trạng thái |
|---|---|
| `kb/_index.sqlite` | RETIRED `FR-034`, dữ liệu 2026-08-26, **không ai đọc**. Bước dọn C7 chưa chạy |
| `web/_luu/` | 3 file 2026-09-02, thay bởi `_backup/`. **To hơn** file thật (`nguoi-dung.yaml` 1.175 B vs 160 B) nên trông giống bản lùi có dữ liệu hơn |

---

## 4 · Một màn hình

```text
┌── 18 BẢNG + 3 VIEW ĐANG CHẠY, 2026-09-08 ─────────────────────────────────┐
│                                                                           │
│  KHO  kb/_kho.sqlite  3,2 MB   11 bảng + 3 view   ✅ 14/14 khớp DDL       │
│    bai_viet   (source_type,slug)  2 │ concepts   (id)           5         │
│    tai_lieu   (source_type,slug)  2 │ categories (id)           5         │
│    video      (source_type,slug)  5 │ loai_nguon (id)          14         │
│    media      (sha256)            7 │ audit_log  (stt)         13         │
│    article_versions (st,slug,ban) 0 │ meta       (khoa)         4         │
│    recycle    (stt)               0 │                                     │
│    view: ban_ghi 9 · nhan 22 · tham_chieu_media 9                         │
│                                                                           │
│  LÕI  web/_loi.sqlite  312 KB   7 bảng          ❌ 5 khai / 7 thật        │
│    nguoi_dung     (id)            0 │ nhap_chung_cat (job_ulid)  5        │
│    ma_moi         (ma)            0 │ audit_loi      (stt)     124 ⚠ngoài │
│    dinh_danh_kenh (KHÔNG PK)      0 │ lan_thu        (stt)      23 ⚠ngoài │
│    phien          (id)            0 │                                     │
│                                                                           │
│  CHẾT  kb/_index.sqlite (26/08) · web/_luu/ (02/09)                       │
│                                                                           │
│  DỮ LIỆU  9 bản ghi (8 approved · 1 draft) · 2,90 MB hiện vật             │
│           0 tài khoản · 5 nháp · 124 dòng audit LÕI · 13 audit kho        │
│  CỔNG     23 xanh / 8 đỏ   (1 đỏ oan · 1 của DB · 6 ngoài phạm vi)        │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## 5 · Đề nghị — người quyết

| # | việc | vì sao |
|---|---|---|
| 1 | Thêm trigger `BEFORE DELETE ON nhap_chung_cat` | 18 hàng đã mất và **không gì chặn lần sau**. `FR-057` nói *bỏ ≠ xoá* nhưng câu đó chỉ sống trong handler |
| 2 | Chốt `la_dan_xuat` + `kieu_moc` cho 5 transcript | *"trích dẫn này máy nghe hay người soát?"* đang không trả lời được |
| 3 | Sửa `check_db_dung_cho` bỏ comment trước khi grep | đỏ oan sang ngày thứ tư; cổng này canh chỗ-ở của **bí mật** |
| 4 | `audit_loi` + `lan_thu` vào `loi.schema.sql`; cắm cổng dùng `BANG_LOI` | mở từ 09-03; bảng audit vẫn có đường mất cột `boi` vĩnh viễn |
| 5 | Hai test đặt `LOI_DB` tạm | dữ liệu test đang trộn vào DB thật, không tách được về sau |
| 6 | Dọn `kb/_index.sqlite` (C7 của `FR-034`) và `web/_luu/` | hai thứ đã chết, một cái trông giống bản lùi thật |

---

*Agent kiểm soát dữ liệu · chỉ đọc (mode=ro) · không ký gate · không mở FR.*
