# [Space] T01-90 — DDL `space` + view `ban_ghi` + script di trú (áp FR-080)

> Nền: `ADR-09` (ĐÃ DUYỆT) quyết lối A — `space` là CỘT LỌC, PK
> `(source_type, slug)` GIỮ NGUYÊN, slug duy nhất toàn hệ. `FR-080` (ĐÃ DUYỆT)
> mở đường sửa `kho.schema.sql` (**FROZEN** — NGƯỜI ký lại sau khi áp).
> Spike R6 đã chạy thật trên bản sao 276 MB: `ALTER×3 + INDEX×3` = **8 ms**,
> 13 bản ghi; `view tham_chieu_media`/`nhan` KHÔNG gãy; `view ban_ghi` THIẾU
> cột ⇒ chính là lý do FR-080 tồn tại.
> ID theo rule 13 (dải PM-Space): T01-90. Nhánh `space` (worktree ../gn-space).
> **RULE 16 (chốt 2026-09-10) — BA NHỊP bắt buộc**: tmp → chủ dự án CHẤP NHẬN →
> bảng thật + xoá tmp. `kb/_kho.sqlite` là dữ liệu THẬT (13 bản ghi): cấm
> `ALTER` thử nghiệm lên nó, kể cả "chỉ 8 ms" — spike R6 đã làm đúng cách
> (bản sao), luật ghi lại thành bắt buộc.

## Hình dạng

- `kho.schema.sql`: ba bảng nội dung `+ space TEXT NOT NULL DEFAULT 'mac-dinh'`
  + index mỗi bảng; `CREATE VIEW ban_ghi` liệt **thêm** `space` — giữ nguyên
  mọi cột cũ, không đổi thứ tự (13 consumer đọc theo tên).
- `article_versions` · `recycle`: **KHÔNG** thêm cột — space suy được qua
  `(source_type, slug)` của bản ghi gốc (ADR-09 §3, không lưu hai chỗ).
- `core/tools/di_tru_space.py` (MỚI): idempotent — có cột rồi thì bỏ qua
  (khuôn `diTruLoi()` của web); chạy trong `BEGIN IMMEDIATE`; in số bản ghi
  gán space mặc định; **KHÔNG tự chạy trên `kb/` thật** (checklist §4: chỉ
  chạy sau gate, mọi test trên `KB_DIR` tạm).
- Rollback: bản sao trước di trú + export cũ trong git (ghi lệnh vào README).

phạm_vi_ghi:
  - core/assets/kho.schema.sql       # FROZEN — FR-080 đã duyệt; NGƯỜI ký lại sau khi áp
  - core/tools/di_tru_space.py       # MỚI — script di trú idempotent
  - core/tools/dung_lai_db.py        # dựng lại DB từ file phải biết cột space

verifiability: hard
tiêu_chí:
  # ═══ NHỊP 1 · TMP — mọi AC dưới đây chạy trên BẢN SAO ở KB_DIR tạm ═══
  - AC1: [nhịp TMP] dựng bản sao `kb/_kho.sqlite` sang `$KB_DIR` tạm rồi di trú ở ĐÓ;
      ba bảng có cột `space`, mọi bản ghi `mac-dinh`; chạy LẦN HAI ⇒ không đổi
      gì, exit 0 (idempotent). Kho THẬT không bị chạm — đo kích thước + mtime
      `kb/_kho.sqlite` trước/sau, phải y nguyên
    cmd: KB_DIR=$TMP/space-tmp python core/tools/di_tru_space.py --kiem
    đỏ_khi: lần hai báo lỗi · ghi đè space đang có · mtime kho thật đổi
    xanh_khi: hai lần chạy cùng trạng thái VÀ kho thật nguyên vẹn
  - AC2: [nhịp TMP] trên bản tạm — `view ban_ghi` TRẢ cột `space`; `tham_chieu_media`
      và `nhan` vẫn đúng số hàng như trước di trú
    cmd: KB_DIR=$TMP/space-tmp python core/tests/check_khung.py
  - AC3: [nhịp TMP] PK giữ nguyên — hai bản ghi cùng `(source_type, slug)` khác space
      vẫn bị CHẶN (lối A còn hiệu lực, không âm thầm thành lối B)
    cmd: KB_DIR=$TMP/space-tmp python core/tests/check_khung.py
  - AC4: [nhịp TMP] round-trip DB→file→DB trên bản tạm giữ điểm bất động: `bam_cay`
      trước/sau khớp (cây `kb/<loai>/` KHÔNG đổi — ADR-09 §4)
    cmd: KB_DIR=$TMP/space-tmp python core/tests/check_export_dan_xuat.py
  - AC5: [nhịp TMP] nền không vỡ
    cmd: python -m pytest core/tests -q

  # ═══ NHỊP 2 · CHẤP NHẬN — người xem kết quả thật ═══
  - AC6 (nhịp CHẤP NHẬN · soft — NGƯỜI): chủ dự án xem output năm AC-tmp (dán vào worklog:
      số bản ghi · cột mới · số hàng ba view · bam_cay trước/sau · mtime kho
      thật) và CHẤP NHẬN. Chưa có dòng chấp nhận ⇒ CẤM sang nhịp 3.

  # ═══ NHỊP 3 · THẬT — chỉ sau khi có chữ chấp nhận ═══
  - AC7: [nhịp THẬT] di trú `kb/_kho.sqlite` THẬT (sao lưu trước:
      `kb/_kho.sqlite.truoc-space-<epoch>`); năm phép đo của nhịp 1 lặp lại
      trên DB thật cho cùng kết quả
    cmd: python core/tools/di_tru_space.py && python core/tests/check_khung.py
    đỏ_khi: thiếu file sao lưu, hoặc bất kỳ phép đo nào lệch nhịp 1
    xanh_khi: khớp từng số + có bản sao lưu
  - AC8: [nhịp THẬT] XOÁ bản tạm (`$TMP/space-tmp`) — kho sạch, không để tmp sống qua
      đêm (rule 16); và `kho.schema.sql` được NGƯỜI ký lại
    cmd: python core/tests/check_frozen.py
    đỏ_khi: check_frozen còn lệch (chưa ai ký), hoặc thư mục tmp còn
    xanh_khi: exit 0 sau khi NGƯỜI chạy --ky
