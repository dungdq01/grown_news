# T01-18 — FR-038/C2: ba bảng + hai view + di trú huỷ diệt (đơn vị CODE)

> **ĐƠN VỊ QUYẾT ĐỊNH của cả FR-038.** Nếu vòng DB→file→DB không đạt điểm bất
> động sau khi tách, xét lại "tách cả bảng" **TRƯỚC** khi viết một dòng UI.
>
> Ba bảng: `bai_viet` · `tai_lieu` · `video`. **Giữ cột `source_type`** với CHECK
> hẹp — đo bằng `EXPLAIN QUERY PLAN`: giữ nó thì view **flatten** được và index
> từng bảng dùng được; bỏ nó thì view thành `CO-ROUTINE` + `SCAN`, không tỉa được
> nhánh nào, và mất `CHECK (json_extract(…'$.source_type') = source_type)`.
>
> **HAI view, không một:**
> `ban_ghi` — mọi đường đọc-cả-kho (`khoDoc` · `demSoBai` · `nhan`), liệt cột
> **tường minh** (không `SELECT *`: `*` làm thứ tự cột phụ thuộc thứ tự DDL ba
> bảng, chèn cột giữa một bảng là view lệch cột im lặng).
> `tham_chieu_media` — UNION **5** nhánh (ba bảng + `article_versions` +
> `recycle`). Tập này hiện **gõ tay hai lần** (`xuat_kho.py:168-170` và
> `dungchung.mjs:449-451`); tách bảng nâng nó từ 3 lên 5 nhánh ở hai nơi. Đưa vào
> DDL biến M09-R1 từ **kỷ luật** thành **cấu trúc**.
>
> **`article_versions` và `recycle` KHÔNG đổi một dòng.** `recycle.stt` là khoá
> TOÀN CỤC đã lộ ra API (`dungchung.mjs:619,628,648,690` · `xuat_kho.py:234` đặt
> tên file `<slug>.<stt>.md` · `dung_lai_db.py:174-186` đọc `stt` từ
> `_meta.jsonl` làm chân lý) — tách ba là ba dãy AUTOINCREMENT độc lập, `stt`
> thôi định danh duy nhất một hàng rác. Và `recycle` **cố ý** không có CHECK nào
> về `source_type` (`kho.schema.sql:112-121` giữ snapshot nguyên văn); thêm CHECK
> hẹp là **chặn khôi phục** một bài loại cũ, tức biến thùng rác thành nơi mất
> dữ liệu.

> *Đơn vị này khai ở **M01_core**, không M02_kb: `check_g6b` §2 chặn đúng —
> `core/**` thuộc boundary M01_core, còn M02_kb là `kb/**`. Tiền lệ: `T01-8`
> của FR-036/B1 làm cùng loại việc (DDL + hai công cụ) dưới M01_core.*

phạm_vi_ghi:
  - core/assets/kho.schema.sql
  - core/tools/dung_lai_db.py
  - core/tools/xuat_kho.py

verifiability: hard
tiêu_chí:
  - AC1: mỗi loại INSERT vào bảng của nó **xuất hiện trong `ban_ghi`**, và bị
      **từ chối** ở hai bảng kia. Đây là răng cho RỦI RO SỐ MỘT: `xuat_kho.py:141-146`
      lặp `for loai in LOAI` rồi xoá mọi `.md` không có trong `can_co` (dựng từ
      `ban_ghi`) — view thiếu một nhánh mà bảng khai vẫn liệt loại đó ⇒ export
      **xoá sạch loại đó**, và `banXuat()` chạy tự động sau mỗi lần ghi nên nó xảy
      ra không cần ai gõ lệnh
    cmd: python core/tests/check_ba_bang.py
  - AC2: `tham_chieu_media` phủ đúng **5** bảng — bỏ một nhánh thì cổng mồ côi ĐỎ
    cmd: python core/tests/check_ba_bang.py && python core/tests/check_media_dan_xuat.py
  - AC3: vòng DB→file→DB→file đạt **điểm bất động**; và `bam_noi_dung()` băm **ba
      bảng gốc, KHÔNG băm view** (băm view thì một hàng vào SAI bảng vẫn cùng
      hash) + một răng `sqlite_master` để "quên thêm bảng" thành một hash đổi
    cmd: python core/tests/check_export_dan_xuat.py && python core/tools/xuat_kho.py --kiem
  - AC4: kho THẬT dựng lại **không mất một bản ghi** — bằng chứng là
      `git diff --stat kb _recycle` TRỐNG, không phải hash tôi tự ghi
    cmd: python core/tools/xuat_kho.py && git diff --stat kb _recycle
  - AC5: không hồi quy — mọi cổng và cả bộ test web
    cmd: python -m pytest core/tests -q && cd web && npm test
phụ_thuộc: T01-17
