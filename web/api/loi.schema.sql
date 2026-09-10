-- ═══════════════════════════════════════════════════════════════════════
-- DB RIÊNG CỦA LÕI — dữ liệu GỐC, không dựng lại được từ file
-- FR-045 (bốn bảng) · FR-046 (nháp chưng cất) · FR-047 (bảy cửa) · ADR-06
-- ═══════════════════════════════════════════════════════════════════════
--
-- KHÔNG đặt vào kb/_kho.sqlite. core/tools/dung_lai_db.py:139-140 XOÁ file đó
-- rồi dựng lại TỪ FILE .md/.yaml — docstring của chính nó: "DB khong co lich
-- su". Năm bảng dưới đây là dữ liệu GỐC, nên nằm trong đó là bị xoá sạch mỗi
-- lần chạy một lệnh thường xuyên (test, T02-4 bước 2, B-C1).
-- Cổng canh: core/tests/check_db_dung_cho.py (T08-10).
--
-- Chủ (project_map.entities, FR-048):
--   nguoi_dung · ma_moi · dinh_danh_kenh · phien  → M18_nguoidung
--   nhap_chung_cat                                → M12_chungcat
--
-- KHÔNG có cột mật khẩu ở đâu cả: hệ này không có mật khẩu. Đường vào là mã
-- mời + chat_id đã buộc (FR-045). Ghi ra để không ai thêm "cho chắc".
--
-- KHÔNG có ON DELETE CASCADE ở đâu cả: cascade là một đường xoá ẩn, và AC-1.2
-- cấm xoá hàng nguoi_dung (audit_log trỏ tới nó sẽ thành mồ côi).

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- ═══ nguoi_dung — MỘT chủ dự án + 5 đồng nghiệp (prd.md:8) ═════════════
CREATE TABLE IF NOT EXISTS nguoi_dung (
  id          INTEGER PRIMARY KEY,
  ten         TEXT    NOT NULL,          -- DỮ LIỆU CÁ NHÂN (B-E5)
  -- FR-051 (chốt 2026-09-02) — enum ĐÓNG, NOT NULL, mặc định vai ÍT quyền nhất.
  --
  -- `NOT NULL DEFAULT 'dong_nghiep'` là FAIL-CLOSED bằng CẤU TRÚC: một hàng
  -- thiếu `vai` mặc định là vai ít quyền nhất, KHÔNG phải nhiều nhất. Đây là
  -- chiều ngược của CVE-2026-47713 (`user ? whereWithUser(user) : where({})` —
  -- thiếu danh tính thì trả TẤT CẢ).
  --
  -- Enum đóng chứ không phải TEXT tự do: một lỗi chính tả trong chuỗi tự do
  -- thành một vai MỚI im lặng, và mọi phép so sánh với nó trả false.
  vai         TEXT    NOT NULL DEFAULT 'dong_nghiep'
              CHECK (vai IN ('chu', 'dong_nghiep')),
  trang_thai  TEXT    NOT NULL DEFAULT 'hoat_dong'
              CHECK (trang_thai IN ('hoat_dong', 'thu_hoi')),
  tao_luc     TEXT    NOT NULL DEFAULT (datetime('now')),
  thu_hoi_luc TEXT                       -- NULL = chưa thu hồi; AC-1.3 mốc so sánh
);

-- ═══ ma_moi — MỘT LẦN + HẾT HẠN ═══════════════════════════════════════
-- het_han NOT NULL là CẤU TRÚC cho AC-2.1: "đỏ ở cổng SINH, không phải lúc
-- mã bị dùng". Một ràng buộc ở DDL rẻ hơn một phép kiểm trong handler.
CREATE TABLE IF NOT EXISTS ma_moi (
  ma            TEXT    PRIMARY KEY,     -- BÍ MẬT: không export, không vào log
  nguoi_dung_id INTEGER NOT NULL REFERENCES nguoi_dung(id),
  het_han       TEXT    NOT NULL,
  tao_luc       TEXT    NOT NULL DEFAULT (datetime('now')),
  dung_luc      TEXT                     -- NULL = chưa dùng (M18-R1)
);

-- ═══ dinh_danh_kenh — THAY allowlist phẳng của B-B4 ════════════════════
-- UNIQUE(kenh, chat_id) là CẤU TRÚC cho AC-3.2. Ràng buộc trên CẶP, không
-- trên chat_id một mình: cùng chat_id trên kênh khác là hợp lệ.
CREATE TABLE IF NOT EXISTS dinh_danh_kenh (
  kenh          TEXT    NOT NULL,
  chat_id       TEXT    NOT NULL,        -- DỮ LIỆU CÁ NHÂN (B-E5)
  nguoi_dung_id INTEGER NOT NULL REFERENCES nguoi_dung(id),
  buoc_luc      TEXT    NOT NULL DEFAULT (datetime('now')),
  ma_da_dung    TEXT    REFERENCES ma_moi(ma),   -- vết: buộc bằng mã nào
  UNIQUE (kenh, chat_id)
);

-- ═══ phien — ngữ cảnh sống ở LÕI, KHÔNG ở THỢ (FR-045 U6) ═════════════
-- M14_chatbot không đọc và không ghi bảng này. M14 ở THỢ — vùng duy nhất giữ
-- khoá model và gọi ra Internet, tức vùng phải giả định sẽ có prompt injection.
CREATE TABLE IF NOT EXISTS phien (
  id            TEXT    PRIMARY KEY,
  nguoi_dung_id INTEGER NOT NULL REFERENCES nguoi_dung(id),
  kenh          TEXT    NOT NULL,
  ngu_canh      TEXT,                    -- JSON; C6 KHÔNG trả trường này
  tao_luc       TEXT    NOT NULL DEFAULT (datetime('now')),
  cap_nhat_luc  TEXT    NOT NULL DEFAULT (datetime('now')),
  het_han       TEXT    NOT NULL
);

-- ═══ nhap_chung_cat — bản nháp AI sinh, người sửa (FR-046) ════════════
-- ban_goc_ai GHI MỘT LẦN. Trigger dưới cưỡng chế điều đó bằng CẤU TRÚC:
-- mất bản gốc là mất khả năng trả lời "người đã sửa những gì".
CREATE TABLE IF NOT EXISTS nhap_chung_cat (
  job_ulid      TEXT    PRIMARY KEY,
  nguoi_dung_id INTEGER REFERENCES nguoi_dung(id),   -- LÕI gán, KHÔNG do payload (M12 AC-1.5)
  ban_goc_ai    TEXT    NOT NULL,
  ban_hien_tai  TEXT    NOT NULL,

  -- T08-27 / WO-043 · ENUM KHOP `FR-046 §1`, khong phai tu vung tu dat.
  --
  -- Ban dau khai `nhap|da_gui|bo`. Hai gia tri `da_gui`/`bo` KHONG CO NGUON:
  -- grep toan repo chi ra chinh dong nay va mot dong test cua no — khong spec,
  -- khong FR, khong `decisions.md`. `FR-046 §1` (da duyet) khai vong doi:
  --
  --     nhap → da_sua → da_duyet | tra_lai
  --
  -- `T08-22` (bon cua hanh dong) KHONG cai duoc tren enum cu: "tra lai" khong
  -- co trang thai de chuyen toi, "sua" khong co `da_sua` nen khong phan biet
  -- duoc nhap chua ai cham voi nhap da bien tap — ma man triage `T03-94` song
  -- bang dung phan biet do.
  --
  -- ⚠️ `da_duyet` KHONG co nghia "da vao kho". Duyet = ghi FILE vao `kb/` +
  -- `dung_lai_db`, va tu giay do FILE la chan ly (`FR-046 §1` · `B-C1`). Cot
  -- nay chi noi vong doi cua BAN NHAP; `review_status` duoi la chuyen khac.
  --
  -- T08-29 / FR-057 · gia tri THU NAM `da_bo`. `T03-94` doi BON hanh dong
  -- (Duyet · Sua · Tra lai · Xoa) ma vong doi khong co gia tri nao nghia "da
  -- bo". Chu du an chot loi (a): them TRANG THAI, KHONG xoa hang — `ban_goc_ai`
  -- ton token model de tao va la thu duy nhat tra loi "nguoi da sua nhung gi".
  -- `da_bo` MOT CHIEU: khong di tiep sang trang thai nao (cuong che o cua, vi
  -- `CHECK` khong noi duoc ve CHUYEN TIEP — no chi noi ve GIA TRI).
  trang_thai    TEXT    NOT NULL DEFAULT 'nhap'
                CHECK (trang_thai IN ('nhap', 'da_sua', 'da_duyet', 'tra_lai',
                                      'da_bo')),

  -- T08-27 · `khang_dinh_bi_tia` — `FR-046 §1` khai no, DDL ban dau thieu.
  -- JSON, cho phep NULL: mot ban nhap khong bi tia gi thi NULL, khong phai `{}`
  -- — `{}` va NULL doc ra hai cau khac nhau, va "chua do" khac "do ra khong".
  --
  -- Vi sao no PHAI o day: `T03-94` doi hien "⚠ da tia N" TRUOC nut duyet.
  -- Khong hien la NOI DOI nguoi duyet — ho ky vao mot ban da bi cat bot ma
  -- khong biet. Khong co cot thi khong co gi de hien.
  khang_dinh_bi_tia TEXT,

  -- T08-27 · `ly_do` — ca TRA LAI bat kem ly do (`T08-22 AC3`).
  -- Khong `NOT NULL`: ba trang thai kia khong co ly do, va mot cot bat buoc se
  -- bi dien chuoi rong cho du — chuoi rong la mot ly do KHONG doc duoc.
  -- Rang "tra_lai thi phai co ly_do" cuong che o cua, kem mot phep kiem.
  ly_do         TEXT,

  -- M12 AC-1.3 đòi hàng nháp mang `review_status: draft`, và đòi rằng payload
  -- khai `approved` cũng KHÔNG đổi được. CHECK dưới là HẰNG, không phải enum
  -- bốn giá trị: bảng này CHỈ chứa nháp, nên một hàng ở đây mang `approved` là
  -- lỗi CẤU TRÚC, không phải một trạng thái hợp lệ.
  -- Cưỡng chế ở DDL, không ở handler — cùng khuôn trigger `ban_goc_ai` dưới.
  --
  -- Đánh đổi, nói một lần: đây là một trường của `kb/` xuất hiện ở bảng
  -- CHƯA-VÀO-KHO, trong khi FR-046 cố ý tách "nháp không phải kho". CHECK hằng
  -- giữ nó không trôi thành một vòng đời thứ hai. Ngày nào bảng nháp cần trạng
  -- thái khác `draft`, đó là dấu hiệu phải xem lại FR-046 — KHÔNG phải nới CHECK.
  review_status TEXT    NOT NULL DEFAULT 'draft'
                CHECK (review_status = 'draft'),

  -- ĐỔI TÊN 2026-09-03: `lan_gui` → `lan_gui_duyet`.
  -- `lan_gui` là tên ĐÃ CÓ CHỦ ở M12 (spec §5.1): số lần payload RỜI KHỎI MÁY,
  -- trần 2, KHÔNG BAO GIỜ reset — nó là con số egress của FR-043 bậc 4 và nó
  -- sống ở THỢ, trong Maildir của job. Cột này đếm việc khác: số lần nháp được
  -- gửi đi duyệt (`trang_thai: da_gui`).
  -- Hai số cùng tên là cách báo cáo egress bắt đầu nói dối.
  lan_gui_duyet INTEGER NOT NULL DEFAULT 0,

  tao_luc       TEXT    NOT NULL DEFAULT (datetime('now')),
  cap_nhat_luc  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TRIGGER IF NOT EXISTS nhap_chung_cat_ban_goc_bat_bien
BEFORE UPDATE OF ban_goc_ai ON nhap_chung_cat
WHEN NEW.ban_goc_ai IS NOT OLD.ban_goc_ai
BEGIN
  SELECT RAISE(ABORT, 'ban_goc_ai ghi MOT LAN — FR-046');
END;

-- ═══ INDEX — chỉ những cái có truy vấn thật ở FR-047 §2 ═══════════════
-- C3 tra theo (kenh, chat_id): UNIQUE ở trên đã là index, không thêm.
CREATE INDEX IF NOT EXISTS ix_ma_moi_chua_dung
  ON ma_moi (dung_luc) WHERE dung_luc IS NULL;      -- C7
CREATE INDEX IF NOT EXISTS ix_phien_nguoi
  ON phien (nguoi_dung_id);                          -- AC-1.3 thu hồi lan sang phiên
CREATE INDEX IF NOT EXISTS ix_nhap_nguoi
  ON nhap_chung_cat (nguoi_dung_id, trang_thai);     -- C2
