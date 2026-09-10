-- kho.schema.sql — DDL DUY NHẤT của kb/_kho.sqlite (FR-034).
-- Cả dung_lai_db.py lẫn tài liệu trỏ vào đây — không có bản DDL thứ hai.
--
-- Nguyên tắc: trong bảng articles, CHÂN LÝ là hai cột frontmatter (JSON nguyên
-- văn) + than. Mọi cột khác GENERATED từ JSON — bảng là ảnh chiếu của
-- frontmatter, không phải một lựa chọn trường (cùng triết lý sinh_index.py cũ,
-- nhưng giờ cưỡng chế bằng engine thay vì kỷ luật).
--
-- Kết nối: mỗi connection phải đặt  PRAGMA busy_timeout = 5000;
--          PRAGMA foreign_keys = ON;  và mọi transaction ghi dùng
--          BEGIN IMMEDIATE (tránh deadlock nâng khoá giữa 2 process — FR-011
--          hai AI song song). journal_mode=WAL đặt một lần lúc tạo, persist.

CREATE TABLE meta (
  khoa    TEXT PRIMARY KEY,
  gia_tri TEXT NOT NULL
);
-- meta giữ: schema_version · concepts_header / categories_header (NGUYÊN VĂN
-- phần comment đầu hai file yaml — nạp lúc migrate, in lại lúc export để
-- round-trip byte-equal, không mất comment) · nhat_ky_goc (nguyên văn
-- _nhat-ky-danh-muc.md tại thời điểm migrate).

-- ═══ BA BẢNG NỘI DUNG (FR-038) ══════════════════════════════════════════════
--
-- Người dùng chốt tách CẢ BẢNG, không chỉ tách màn: *"module bài viết tách biệt
-- với video / tài liệu… ko gộp chung các màn và tính năng lại với nhau"*.
-- Bảng `articles` cũ KHÔNG còn — tách là tách, không để lại bản song sinh.
--
-- Ánh xạ loại→bảng khai ở `core/assets/loai-nguon.json`. File JSON đó là bản TRA
-- CỨU (Python/JS đọc được); ba CHECK dưới đây là bản CƯỠNG CHẾ — SQL không đọc
-- được JSON nên không tránh được bản thứ hai. `check_khai_mot_noi.py` §3 so hai
-- bản khớp nhau; lệch một giá trị là đỏ.
--
-- GIỮ cột `source_type` trong cả ba bảng, và đây là phép ĐO chứ không phải sở
-- thích (`EXPLAIN QUERY PLAN` trên SQLite 3.53):
--   giữ ⇒ view `ban_ghi` FLATTEN được, mọi vị từ đẩy xuống, index từng bảng dùng
--   bỏ  ⇒ view thành CO-ROUTINE + SCAN, không tỉa được nhánh nào
-- Và bỏ nó là mất `CHECK (json_extract(…source_type) = source_type)` cùng việc
-- `slug` một mình thành PK — đúng bài học FR-023 GĐ 3.
--
-- Ba bảng CÙNG hình dạng cột. Sáu dòng CHECK trùng nhau là giá phải trả: SQL
-- không có mixin. Khai ra là xong, và `check_ba_bang.py` chứng minh cả sáu bắn.

CREATE TABLE bai_viet (
  source_type   TEXT NOT NULL CHECK (source_type IN
                  ('repo','paper','article','docs','announcement')),
  slug          TEXT NOT NULL,
  frontmatter   TEXT NOT NULL,       -- JSON nguyen van — NGUON CHAN LY metadata
  than          TEXT NOT NULL,       -- body markdown — NGUON CHAN LY noi dung
  version       INTEGER NOT NULL DEFAULT 1,
  etag          TEXT NOT NULL,
  id            TEXT    GENERATED ALWAYS AS (json_extract(frontmatter,'$.id')) VIRTUAL,
  review_status TEXT    GENERATED ALWAYS AS (json_extract(frontmatter,'$.review_status')) VIRTUAL,
  title         TEXT    GENERATED ALWAYS AS (json_extract(frontmatter,'$.title')) VIRTUAL,
  one_liner     TEXT    GENERATED ALWAYS AS (json_extract(frontmatter,'$.one_liner')) VIRTUAL,
  analyzed_at   TEXT    GENERATED ALWAYS AS (json_extract(frontmatter,'$.analyzed_at')) VIRTUAL,
  url_normalized TEXT   GENERATED ALWAYS AS (json_extract(frontmatter,'$.url_normalized')) VIRTUAL,
  word_count    INTEGER GENERATED ALWAYS AS (json_extract(frontmatter,'$.word_count')) VIRTUAL,
  PRIMARY KEY (source_type, slug),
  CHECK (json_extract(frontmatter,'$.slug') = slug),
  CHECK (json_extract(frontmatter,'$.source_type') = source_type)
);
CREATE INDEX i_bv_trang ON bai_viet (review_status);
CREATE INDEX i_bv_url   ON bai_viet (url_normalized);
CREATE INDEX i_bv_ngay  ON bai_viet (analyzed_at);

-- `tai_lieu` — hiện vật NGƯỜI DÙNG TẢI LÊN (pdf/ppt/word). Schema frontmatter đã
-- đòi `ho_so: thu-vien` + `media` cho loại này (nhánh `allOf` của
-- frontmatter.schema.json), nên DDL không lặp lại điều đó.
CREATE TABLE tai_lieu (
  source_type   TEXT NOT NULL CHECK (source_type = 'tai-lieu'),
  slug          TEXT NOT NULL,
  frontmatter   TEXT NOT NULL,       -- JSON nguyen van — NGUON CHAN LY metadata
  than          TEXT NOT NULL,       -- body markdown — NGUON CHAN LY noi dung
  version       INTEGER NOT NULL DEFAULT 1,
  etag          TEXT NOT NULL,
  id            TEXT    GENERATED ALWAYS AS (json_extract(frontmatter,'$.id')) VIRTUAL,
  review_status TEXT    GENERATED ALWAYS AS (json_extract(frontmatter,'$.review_status')) VIRTUAL,
  title         TEXT    GENERATED ALWAYS AS (json_extract(frontmatter,'$.title')) VIRTUAL,
  one_liner     TEXT    GENERATED ALWAYS AS (json_extract(frontmatter,'$.one_liner')) VIRTUAL,
  analyzed_at   TEXT    GENERATED ALWAYS AS (json_extract(frontmatter,'$.analyzed_at')) VIRTUAL,
  url_normalized TEXT   GENERATED ALWAYS AS (json_extract(frontmatter,'$.url_normalized')) VIRTUAL,
  word_count    INTEGER GENERATED ALWAYS AS (json_extract(frontmatter,'$.word_count')) VIRTUAL,
  PRIMARY KEY (source_type, slug),
  CHECK (json_extract(frontmatter,'$.slug') = slug),
  CHECK (json_extract(frontmatter,'$.source_type') = source_type)
);
CREATE INDEX i_tl_trang ON tai_lieu (review_status);
CREATE INDEX i_tl_url   ON tai_lieu (url_normalized);
CREATE INDEX i_tl_ngay  ON tai_lieu (analyzed_at);

-- `video` — ĐĂNG KÝ URL, không byte vào kho. Trần 25 MB là phanh của git, và một
-- video vượt nó theo định nghĩa (người dùng chốt ở FR-037).
CREATE TABLE video (
  source_type   TEXT NOT NULL CHECK (source_type = 'video'),
  slug          TEXT NOT NULL,
  frontmatter   TEXT NOT NULL,       -- JSON nguyen van — NGUON CHAN LY metadata
  than          TEXT NOT NULL,       -- body markdown — NGUON CHAN LY noi dung
  version       INTEGER NOT NULL DEFAULT 1,
  etag          TEXT NOT NULL,
  id            TEXT    GENERATED ALWAYS AS (json_extract(frontmatter,'$.id')) VIRTUAL,
  review_status TEXT    GENERATED ALWAYS AS (json_extract(frontmatter,'$.review_status')) VIRTUAL,
  title         TEXT    GENERATED ALWAYS AS (json_extract(frontmatter,'$.title')) VIRTUAL,
  one_liner     TEXT    GENERATED ALWAYS AS (json_extract(frontmatter,'$.one_liner')) VIRTUAL,
  analyzed_at   TEXT    GENERATED ALWAYS AS (json_extract(frontmatter,'$.analyzed_at')) VIRTUAL,
  url_normalized TEXT   GENERATED ALWAYS AS (json_extract(frontmatter,'$.url_normalized')) VIRTUAL,
  word_count    INTEGER GENERATED ALWAYS AS (json_extract(frontmatter,'$.word_count')) VIRTUAL,
  PRIMARY KEY (source_type, slug),
  CHECK (json_extract(frontmatter,'$.slug') = slug),
  CHECK (json_extract(frontmatter,'$.source_type') = source_type)
);
CREATE INDEX i_vd_trang ON video (review_status);
CREATE INDEX i_vd_url   ON video (url_normalized);
CREATE INDEX i_vd_ngay  ON video (analyzed_at);

-- ═══ VIEW `ban_ghi` — MỌI đường đọc-cả-kho ══════════════════════════════════
--
-- `khoDoc()` · `demSoBai()` · view `nhan` · luật mồ côi đều đọc view này, nhờ đó
-- ~25-30 site tổng hợp trong `render/trang.mjs` KHÔNG đổi một dòng và `data.bans`
-- vẫn là danh sách trộn — đúng yêu cầu *"chỉ màn kho và tổng hợp để chung danh
-- sách"*.
--
-- LIỆT CỘT TƯỜNG MINH, không `SELECT *`: `*` làm thứ tự cột phụ thuộc thứ tự DDL
-- của ba bảng, và một hôm ai đó chèn cột giữa `bai_viet` là view lệch cột IM
-- LẶNG. Cột GENERATED đi qua view được (đã đo) — chỉ cần mang tên sang.
--
-- Cột `bang` cho biết hàng đến từ đâu: đường GHI nêu tên bảng thật, còn đường
-- ĐỌC đôi khi cần biết để định tuyến lần sửa kế tiếp.
CREATE VIEW ban_ghi AS
  SELECT 'bai_viet' AS bang, source_type, slug, frontmatter, than, version, etag,
         id, review_status, title, one_liner, analyzed_at, url_normalized, word_count
    FROM bai_viet
  UNION ALL
  SELECT 'tai_lieu', source_type, slug, frontmatter, than, version, etag,
         id, review_status, title, one_liner, analyzed_at, url_normalized, word_count
    FROM tai_lieu
  UNION ALL
  SELECT 'video', source_type, slug, frontmatter, than, version, etag,
         id, review_status, title, one_liner, analyzed_at, url_normalized, word_count
    FROM video;

-- ═══ VIEW `tham_chieu_media` — M09-R1 thành CẤU TRÚC ════════════════════════
--
-- MỌI bảng có thể trỏ vào `media`, khai MỘT nơi. Trước FR-038 tập này gõ tay HAI
-- lần — `xuat_kho.py:168-170` và `dungchung.mjs:449-451` — và tách bảng nâng nó
-- từ 3 nhánh lên 5 ở cả hai nơi, tức gấp đôi xác suất của đúng lỗi *"mỗi DELETE
-- phá byte vĩnh viễn"*.
--
-- `video` CÓ trong view này dù video không có byte: schema là `anyOf [media|url]`
-- nên nó KHÔNG CẤM một bản ghi video khai `media`. Bỏ nhánh đó vì "video không
-- có byte" là đúng lớp lỗi M09-R1.
CREATE VIEW tham_chieu_media AS
  SELECT frontmatter FROM bai_viet
  UNION ALL SELECT frontmatter FROM tai_lieu
  UNION ALL SELECT frontmatter FROM video
  UNION ALL SELECT frontmatter FROM article_versions
  UNION ALL SELECT frontmatter FROM recycle;

-- ═══ KHO HIỆN VẬT (FR-036/B1) ═══════════════════════════════════════════════
-- ĐỊA CHỈ THEO NỘI DUNG: `sha256` là khoá chính, và nó cho ba thứ MIỄN PHÍ —
-- export idempotent tự nhiên (tên file = hash nội dung), dedup hai bản ghi dùng
-- chung một file (`INSERT OR IGNORE`), và `etag` hợp pháp vĩnh viễn.
--
-- KHÔNG CỘT METADATA NÀO ở đây. `mime`, `ten_goc`, `so_byte` sống trong
-- `frontmatter.media` của ba bảng nội dung — cùng triết lý "mọi cột khác GENERATED từ JSON"
-- ở đầu file này. Hai nơi khai một sự thật sẽ lệch.
--
-- KHÔNG FK: cả DDL này không có FK nào. Toàn vẹn tham chiếu do LUẬT MỒ CÔI của
-- `xuat_kho.py` canh, và luật đó đọc VIEW `tham_chieu_media` — năm nhánh, khai
-- MỘT nơi (FR-038). Bỏ sót một nhánh thì mỗi DELETE phá byte vĩnh
-- viễn, và `phucHoi()` sau đó vẫn báo THÀNH CÔNG — nó chạy lại validate, mà
-- validate không bao giờ thấy blob. Mất dữ liệu im lặng với bộ test xanh.
-- Răng: `core/tests/check_media_dan_xuat.py` (M09-R1).
--
-- `la_dan_xuat` khai NGAY v1 dù chưa ai set: nó là chỗ ngồi cho bản PDF chuyển
-- đổi từ ppt/word sau này (`soffice --headless`). Thêm cột sau = một lần dựng
-- lại DB huỷ diệt nữa. Exporter BỎ QUA dòng `la_dan_xuat = 1` và `bam_noi_dung`
-- loại nó — công dân "trong DB mà không trong export" đầu tiên, hợp lệ vì nó là
-- CACHE, dựng lại được từ nguồn.
CREATE TABLE media (
  sha256      TEXT PRIMARY KEY,          -- sha256(byte), 64 hex — MÁY tính, KHÔNG nhận từ client
  byte        BLOB NOT NULL,
  la_dan_xuat INTEGER NOT NULL DEFAULT 0 CHECK (la_dan_xuat IN (0, 1)),

  -- `kieu_moc` (T01-45 · FR-054 §9) — hiện vật dẫn xuất này SINH RA THẾ NÀO.
  --   `la_asr`     máy phiên âm  ⇒ chữ "verified" chỉ bảo đảm quote có trong
  --                TRANSCRIPT CỦA TA, không bảo đảm người trong video đã nói thế
  --   `nguoi_sua`  người đã đọc và sửa  ⇒ mức bảo đảm KHÁC, và cao hơn
  --   `NULL`       không phải hiện vật phiên âm
  --
  -- Vì sao là CỘT chứ không suy từ `la_dan_xuat`: `la_dan_xuat = 1` chỉ nói
  -- "dựng lại được từ nguồn". Một PDF chuyển từ .pptx cũng thế. Nhưng chỉ hiện
  -- vật ASR mang cái BẤT ĐỊNH kia, và `AC-V7` đòi bản phân tích dẫn xuất phải
  -- mang được sự phân biệt đó. Gộp hai nghĩa vào một cột là mất câu hỏi.
  --   `la_thumbnail` ảnh bìa máy lấy về (`WO-071`) — KHÔNG mang bất định của
  --                ASR, nhưng vẫn là dẫn xuất: sinh lại được từ nguồn, và
  --                `thay_kieu_moc` của cửa gắn dùng CHÍNH cột này để biết
  --                entry nào phải nhường chỗ.
  kieu_moc    TEXT CHECK (kieu_moc IN ('la_asr', 'nguoi_sua', 'la_thumbnail')),

  so_byte     INTEGER GENERATED ALWAYS AS (length(byte)) VIRTUAL
);

-- NHÃN LÀ VIEW, không phải bảng — số đếm nhãn không bao giờ trôi khỏi bài.
CREATE VIEW nhan AS
  SELECT a.source_type, a.slug, 'category' AS loai, je.value AS gia_tri
    FROM ban_ghi a, json_each(a.frontmatter, '$.category') je
  UNION ALL
  SELECT a.source_type, a.slug, 'concept', je.value
    FROM ban_ghi a, json_each(a.frontmatter, '$.concepts') je
  UNION ALL
  SELECT a.source_type, a.slug, 'proposed', je.value
    FROM ban_ghi a, json_each(a.frontmatter, '$.concepts_proposed') je;

-- Bản lưu trữ khi re-analyze (M02 §2.5) — export ra <slug>.v<n>.md.
CREATE TABLE article_versions (
  source_type TEXT NOT NULL,
  slug        TEXT NOT NULL,
  ban         INTEGER NOT NULL,
  frontmatter TEXT NOT NULL,
  than        TEXT NOT NULL,
  PRIMARY KEY (source_type, slug, ban)
);

-- Thùng rác (M08-R4). PK autoincrement: xoá cùng slug nhiều lần không đè nhau
-- (giữ đúng hành vi hậu tố epoch của _recycle/ cũ).
CREATE TABLE recycle (
  stt         INTEGER PRIMARY KEY AUTOINCREMENT,
  source_type TEXT NOT NULL,
  slug        TEXT NOT NULL,
  frontmatter TEXT NOT NULL,       -- snapshot nguyên văn lúc xoá
  than        TEXT NOT NULL,
  deleted_at  TEXT NOT NULL
);

-- Danh mục kiểm soát (M02-R3: chỉ người khai nhãn; máy không tự sinh tên).
CREATE TABLE concepts (
  id         TEXT PRIMARY KEY,
  label_vi   TEXT NOT NULL,
  aliases    TEXT NOT NULL DEFAULT '[]'    -- JSON array
);
-- LOAI NGUON — thu NGUOI DUNG thay, nhom theo PHAN LOAI (WO-019).
--
-- Nguoi dung: *"luu cac du lieu cua muc phan loai nay vao bang DB — giong
-- concept va category ay, ko duoc hardcode"* · *"loai nguon nao ung voi phan
-- loai nao"*.
--
-- KHONG thay `loai-nguon.json`. File do giu enum `source_type` va sinh cac
-- rang buoc CHECK ben tren; no phai doc duoc KHI DB CHUA TON TAI (kho moi
-- tinh la trang thai hop le, va `coFileBai()` cung phep kiem `type` cua route
-- chay truoc khi co DB). Bang nay giu thu khac: DINH DANG cua tai lieu, NOI
-- PHAT cua video, LOAI BAI cua bai viet — ba tap khong giao nhau, va voi bai
-- viet thi no TRUNG `source_type` mot cach tinh co, khong phai vi cung vai.
CREATE TABLE loai_nguon (
  id      TEXT PRIMARY KEY,
  module  TEXT NOT NULL,      -- bai-viet | tai-lieu | video
  nhan    TEXT NOT NULL,
  thu_tu  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE categories (
  id         TEXT PRIMARY KEY,
  label_vi   TEXT NOT NULL,
  gom        TEXT NOT NULL
);
-- Ai thêm/sửa nhãn nào khi nào: audit_log gánh (chỉ-nối-thêm), không cần
-- timestamps trong bảng danh mục — hai nơi khai một sự thật sẽ lệch.

-- Nhật ký — bản DB của "appendFileSync, không có đường ghi đè".
CREATE TABLE audit_log (
  stt       INTEGER PRIMARY KEY AUTOINCREMENT,
  khi       TEXT NOT NULL,
  bang      TEXT NOT NULL,        -- concepts | categories | articles | recycle
  hanh_dong TEXT NOT NULL,        -- THEM | SUA | XOA | EP-XOA | RESTORE | STATUS
  doi_tuong TEXT NOT NULL,
  chi_tiet  TEXT                  -- JSON tự do (vd danh sách bài gay_hong)
);
CREATE TRIGGER audit_chi_noi_them BEFORE UPDATE ON audit_log
  BEGIN SELECT RAISE(ABORT, 'audit_log chi noi them'); END;
CREATE TRIGGER audit_khong_xoa BEFORE DELETE ON audit_log
  BEGIN SELECT RAISE(ABORT, 'audit_log chi noi them'); END;

-- ⚠️ CỬA THỨ TƯ, phát hiện 2026-09-03 — hai trigger trên KHÔNG phủ nó.
--
-- Đo được trên SQLite:
--   INSERT OR REPLACE INTO audit_log (stt, ...) VALUES (<stt đã có>, ...)
--   ⇒ hàng bị GHI ĐÈ, và KHÔNG trigger nào bắn. `changes()` không tăng.
--
-- Vì sao: `OR REPLACE` xoá hàng cũ bằng đường NỘI BỘ, không qua `BEFORE
-- DELETE`, trừ khi `PRAGMA recursive_triggers = ON`. Và pragma đó **không lưu
-- trong file** — đo được: mở lại DB là nó về mặc định. Một biện pháp phải nhớ
-- đặt mỗi lần kết nối thì có ngày không được đặt.
--
-- ⇒ Chặn trong SCHEMA, không bằng pragma. `INSERT` là cửa DUY NHẤT cố ý để mở
-- trên bảng này, nên nó cũng là cửa duy nhất chưa ai canh.
-- `INSERT OR IGNORE` cũng bị chặn — đó là đúng: nó im lặng bỏ hàng mới, và
-- một audit im lặng không ghi tệ hơn một audit báo lỗi.
CREATE TRIGGER audit_khong_ghi_de BEFORE INSERT ON audit_log
WHEN EXISTS (SELECT 1 FROM audit_log WHERE stt = NEW.stt)
BEGIN
  SELECT RAISE(ABORT, 'audit_log APPEND-ONLY — khong ghi de hang da co');
END;

