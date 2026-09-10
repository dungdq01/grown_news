# FR-034 — SQLite là nguồn chân lý; file `.md/.yaml` là export dẫn xuất

mở_bởi: người dùng — `upgrade.md:70` (*"tất cả thay bằng API hết và luôn lưu trữ ở DB"*, Phase 3 :39-42 *"cần database... send .md → convert json → API → storage DB"*), chốt "phương án B toàn bộ" 2026-08-26.
tới: `03_docs/brd.md` B-C1·B-C2·B-C3 · `04_system/adr.md` ADR-04 · `04_system/env_plan.md` · `06_modules/M02_kb/{spec,rules}.md` · `06_modules/M05_intake/spec.md` · `06_modules/M08_api/{spec,rules}.md` · `06_modules/M03_web/{spec,rules}.md` · `core/assets/frontmatter.schema.json` (+ bản `core/skill-src/`) · `project_map.yaml` boundaries · `FROZEN.lock`
mức: **đảo B-C1 — ràng buộc BRD nền nhất của kho.** Cao hơn FR-011 (đảo B-C3 có điều kiện). Toàn bộ chuỗi cổng đọc file phải đổi đối tượng.
trạng_thái: **DUYỆT 2026-08-26** — người dùng chốt "phương án B, lên plan đi" rồi duyệt plan đầy đủ (ExitPlanMode; plan lưu tại `.claude/plans/ph-ng-n-b-l-n-sorted-swan.md`). Hai nhánh chốt qua AskUserQuestion: (1) bỏ dần site tĩnh Quartz, FE 100% API; (2) gitignore DB + commit export làm backup.

## Vấn đề

B-C1 nói file `.md` là nguồn chân lý duy nhất, DB chỉ dẫn xuất (FR-023 dựng `kb/_index.sqlite` đúng khuôn đó). Nhưng chỉ đạo của chủ kho từ `upgrade.md` Phase 3 và mục "update chức năng" là ngược lại: **mọi thao tác qua API, dữ liệu sống ở DB**. Chỉ đạo này từng bị ghi nhận thiếu (WL-01K9KJXOASACHDB đọc thành "trùng hướng dọn dữ liệu") và FR-028 từng chốt "giữ yaml" — cả hai bị chỉ đạo mới hơn phủ. FR này đưa quyết định vào hệ thống thay vì để nó rải ở upgrade.md.

Cái đau kỹ thuật thật (không thổi phồng): (1) chân lý của `category` đang xé 3 file (2 schema + yaml) với giao dịch ghi không nguyên tử + rollback tay — FR-019 tự khai là chỗ yếu nhất; (2) đường ghi bài compose-validate-rename + index async tạo cửa sổ hai-trạng-thái mà ba chỗ phải "cố ý đọc đĩa" để né; (3) hai AI làm song song (FR-011) cần transaction thật, file + mutex trong-process không cho điều đó.

## Quyết định

```
NGUỒN CHÂN LÝ MỚI : kb/_kho.sqlite  (gitignore; WAL; BEGIN IMMEDIATE mọi txn ghi)
  bảng: articles (PK source_type+slug; chân lý = frontmatter JSON + than;
        cột khác GENERATED) · article_versions · recycle · concepts · categories
        · audit_log (trigger cấm sửa/xoá) · meta · view nhan (json_each)
EXPORT DẪN XUẤT   : kb/**/*.md + concepts.yaml + categories.yaml + _nhat-ky + _recycle/
                    một chiều DB→file, sinh bởi core/tools/xuat_kho.py (chỉ SELECT),
                    COMMIT VÀO GIT làm backup + giữ git-diff nội dung
ĐƯỜNG NHẬP DUY NHẤT: core/tools/dung_lai_db.py (người/CI/test chạy; server KHÔNG gọi)
CỔNG GIỮ NGUYÊN   : validate.py file-based, spawn thật trước MỌI COMMIT (M08-R2)
                    + cổng mới --categories gương cổng concepts
ENUM category     : RỜI schema (→ pattern kebab) — chết đường ghi-schema-kép
```

## Phạm vi

### Được mở

- Mọi mutation trong `web/api/**` chuyển đích từ file sang DB (một PR đọc+ghi — không ship nửa DB nửa file); `khoDoc()` vẫn là cửa đọc duy nhất.
- `gate.py` (`chay()`) INSERT vào DB thay vì ghi file; `gac()` không đổi một dòng.
- `check_index_dan_xuat.py` + `sinh_index.py` xoá, thay `check_export_dan_xuat.py` 4 răng (round-trip 2 chiều là AC hard của B-C1 đảo).
- FE thoát Quartz theo giai đoạn C của plan (SSR nhẹ từ server.mjs, kill-switch `GN_SSR=0`).

### KHÔNG được mở

- **KHÔNG** nới cổng chất lượng bài: 9 cổng validate giữ nguyên nội dung.
- **KHÔNG** viết lại validate.py bằng JS (M05-R3 nguyên).
- **KHÔNG** cho server import/spawn `dung_lai_db.py` — đường file→DB tự động là tái sinh "hai nguồn chân lý" ở chiều ngược.
- **KHÔNG** ignore `kb/**/*.md` trong git — export là backup, mất nó là mất kịch bản F4.
- **KHÔNG** đụng 3 răng draft-external: `gate.py` hardcode draft · `test_gate -k draft_external` · M05-R1 (chỉ đổi chữ "ghi vào kb/" → "INSERT vào kho" ở spec).
- **KHÔNG** sửa `05_uiux/contracts/**` — hình dạng dữ liệu render không đổi.

## Bất biến cũ → mới, và răng

| Bất biến B-C1 cũ | Bản đảo | Răng |
|---|---|---|
| Xoá index, dựng lại từ kb/ ra đúng trạng thái | Clone không DB → `dung_lai_db.py` → `xuat_kho.py` → byte-equal với export trong git; và DB→file→DB cùng hash | `check_export_dan_xuat.py` răng 1 (thay AC hard cũ) |
| Một chiều kb/→DB | Một chiều DB→file: `xuat_kho.py` chỉ SELECT; server không có đường file→DB | răng 2 (grep) |
| API ghi file chỉ qua ghiSauValidate | API không ghi file kho nào ngoài mkdtemp; mỗi COMMIT kèm `banXuat()` | răng 3 (grep dungchung.mjs) |
| git diff review được | Export .md commit liên tục — diff nội dung vẫn đọc được sau mỗi ghi | răng 4 (.gitignore đúng chiều) + mắt người |

## Kéo theo

- `kb/concepts.yaml` RỜI FROZEN.lock (một file dẫn xuất đổi liên tục không thể frozen — chính nó là lý do tồn tại `kyLaiBaseline()` sau mỗi ghi, thứ FR-019 tự nhận là lớp giảm). `ghiHopDong`/`khoVaSchemaLech`/`kyLaiBaseline` xoá theo.
- `check_danh_muc.py` thu gọn (mất vế yaml⇔enum); `check_frozen` giữ cơ chế, ký lại các file sửa trong FR này.
- Deny S1 `Write(./kb/concepts.yaml)` hết đối tượng bảo vệ (file thành dẫn xuất) — GIỮ nguyên dòng deny làm lời khai ý định, cùng lập luận FR-019.
- `env_plan.md` "git là toàn bộ trạng thái" → "git + một lệnh dựng lại DB"; backup F4 = export trong git.
- 30 pytest giữ nguyên chữ ký (`categories=None` = cổng tắt); web/test đổi theo từng đơn vị việc của plan.
- SEO: không cần (server bind 127.0.0.1, M03-R6 cấm deploy công khai) — đóng câu hỏi tại đây.

## Đánh đổi khai thẳng

- **Cửa sổ crash giữa COMMIT và export**: DB đúng, kb/ cũ một nhịp; lần ghi sau hoặc `make xuat` tự lành. Mất tối đa khi rollback khẩn: các ghi sau lần export cuối (giây). Chấp nhận.
- **node:sqlite** còn experimental: thiếu là lỗi khởi động RÕ + pin `engines.node >= 22.5`; không có fallback đọc đĩa vì fallback là nguồn chân lý thứ hai.
- Reviewer mất khả năng đọc "diff = toàn bộ sự thật" trên PR code (dữ liệu đổi ngoài git giữa hai export) — bù: audit_log chỉ-nối-thêm trong DB + export nhật ký.
