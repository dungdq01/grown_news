# Chạy dự án

Từ máy trắng đến web chạy được. Mọi lệnh dưới đây **đã chạy thật** trên Windows +
Git Bash; chỗ nào chưa kiểm được thì ghi rõ.

> **`make` không có trên máy này**, nên lệnh trần là đường chính. Có `make` thì
> `make help` liệt kê lối tắt tương đương.

---

## 0 · Bản đồ nhanh

```
  NGUỒN                 CỔNG (validate.py)        KHO (FR-034)           WEB (Node)
  API /api/articles ─┐
  API /api/inbox ────┼─→  compose tmp → validate → kb/_kho.sqlite ──SSR──→ 127.0.0.1:8787
  _inbox/ + gate ────┘                                  │
                                                   xuat_kho.py → kb/**.md (EXPORT, commit git)
```

`kb/_kho.sqlite` là nguồn chân lý; file markdown/yaml trong `kb/` là export
dẫn xuất một chiều. Đường file→DB duy nhất: `python core/tools/dung_lai_db.py`.

---

## 1 · Cài lần đầu

### Yêu cầu

| | Bản | Kiểm |
|---|---|---|
| Python | **≥ 3.13** | `python --version` |
| Node | **≥ 22** | `node --version` |
| Git | bất kỳ | `git --version` |

Python 3.13 là bắt buộc, không phải khuyến nghị: `check_version_pin.py` sẽ đỏ
nếu `pyproject.toml` và CI lệch nhau (ADR-02 · FR-005).

### Core

```bash
python -m pip install -e "./core[dev]"
```

Cài `pyyaml`, `jsonschema`, `pytest`. Dùng `python -m pip`, **không** gọi `pip`
trần — máy có nhiều bản Python và `pip` trần dễ trỏ nhầm.

### Web

```bash
cd web && npm install        # yaml + esbuild (devDep) — FR-034 nhổ Quartz
```

Clone mới chưa có DB: chạy `python core/tools/dung_lai_db.py` một lần để dựng
`kb/_kho.sqlite` từ export trong git (kịch bản backup F4).

### Hook (bề mặt S4)

```bash
git config core.hooksPath .githooks
```

Hook chặn commit file `.md` sai format ngay tại máy. Bỏ qua được bằng
`--no-verify` — đó là **lý do** CI phải chạy lại validate, không phải lỗi.

### Kiểm cài đặt

```bash
python -m pytest core/tests -q          # 30 passed
cd web && npm test                       # 7 test
```

Hai lệnh này xanh nghĩa là cài xong.

---

## 2 · Chạy hằng ngày

### Web — xem giao diện

**Một lệnh, hai chế độ dữ liệu trên cùng một server (FR-034):**

```bash
cd web
npm run api        # http://127.0.0.1:8787 — SSR từ kb/_kho.sqlite + API biên tập
```

| Đường | Nguồn | Dùng khi |
|---|---|---|
| `/` `/tat-ca/` `/kho/`… | `kb/_kho.sqlite` (render lúc request) | làm việc thật |
| `/mock/` + 5 màn mock | `kb-mock/` (kho demo, file) | xem giao diện khi kho thật còn trống |

Không còn bước build trang: đổi dữ liệu là tải lại trang thấy ngay. Kho 0 bài
thì các màn hiện chữ gợi ý, không màn trắng (FR-031).

| Đường | Xem gì |
|---|---|
| `/` | trang chủ — 4 vùng, 4 layout family |
| `/tat-ca/` | mọi bản ghi, kể cả draft và rejected |
| `/kho/` | **dashboard + chờ duyệt** — KPI, danh sách chờ duyệt, phân bố theo loại/tin cậy/trạng thái, thùng rác |
| `/kho/#cho-duyet` | thẳng tới mục **chờ duyệt** |
| `/cho-duyet/` | đường **cũ** — chuyển hướng sang `/kho/#cho-duyet` (FR-027g) |
| `/mock/` | **bản mẫu** — kho demo `kb-mock/` |

**Hai kho, tách hẳn:**

| Kho | Là gì | Ai ghi |
|---|---|---|
| `kb/` | dữ liệu **thật** | M01_core (skill 6 pass) · M05_intake |
| `kb-mock/` | dữ liệu **mẫu** — xem giao diện khi `kb/` rỗng | `python core/tools/sinh_kb_mock.py` |

`kb-mock/` dùng **đúng định dạng `kb/`** (`.md` + frontmatter), nên mọi thứ đọc
được `kb/` đều đọc được nó — không có hai đường parse để lệch nhau.

Server render **hai bản** trên cùng cổng: `/` đọc DB thật, `/mock/` đọc
`kb-mock/`. Nút REAL/MOCK trên thanh là **link** giữa hai bản.
| bấm thẻ bất kỳ | cửa sổ nổi: kéo, giãn 8 hướng, Esc đóng |

### Core — nạp một nguồn

Nạp qua **chat với Claude Code**, không phải CLI:

```
phân tích https://arxiv.org/abs/2411.00002
```

Skill `source-distiller` chạy 6 pass và ghi `kb/<loại>/<slug>.md` ở `draft`.

Skill cài ở `~/.claude/skills/`, **ngoài repo** — nên không có lệnh nào chạy nó
ở CI. Đó là giới hạn kiến trúc đã biết, không phải nợ.

### Duyệt — cổng người duy nhất, HAI bề mặt (FR-011)

**Cách 1 — trên web** (cần API local đang chạy: `cd web && npm run api`):

1. mở màn *Kho* mục Chờ duyệt → bấm bài → **đọc** trong cửa sổ
2. chân cửa sổ có nút `✓ duyệt` / `✕ loại` — 3 trường M1 giờ TUỲ CHỌN (FR-033)
3. ghi xong là thấy NGAY — trang render lúc request từ DB (FR-034), không build

Cùng cửa sổ đó có `✎ sửa` (mở form ở màn Nạp nguồn) và `🗑 xoá` — xoá là
**recycle**: file chuyển sang `_recycle/`, khôi phục ở màn Kho, không mất gì.

**Cách 2 — trong editor** (luôn chạy được, không cần gì):

```yaml
review_status: draft   →   approved
insight_new: true          # bài này cho tôi một insight CHƯA BIẾT và SẼ làm theo
skill_installed: false     # đã sinh skill VÀ cài VÀ output agent đổi tốt hơn
review_minutes: 17         # bấm giờ, không ước
```

Ba trường sau **tuỳ chọn** từ FR-033 (bước duyệt đã bỏ — schema thôi đòi khi
`approved`). Vẫn ghi được nếu muốn; chúng là ba vế của M1, nhưng M1 không còn
đo được từ kho (FR-033 khai thẳng hệ quả này).

**Không tiến trình TỰ ĐỘNG nào được ghi `approved`.** Cả hai bề mặt trên đều là
người bấm/gõ; endpoint web không có default nào để tự điền (M08-R3). Đó là ranh
giới quyền duy nhất, và là thứ giữ cho prompt injection dừng ở `draft`
(`security_baseline` §6).

---

## 3 · Bảng lệnh đầy đủ

### Core

| Việc | Lệnh |
|---|---|
| 30 test của M01 | `python -m pytest core/tests -q` |
| Kiểm `kb/` bằng 9 cổng | `python core/src/source_distiller/validate.py kb/` — thêm `--strict` khi muốn CẢNH BÁO (khái niệm chờ duyệt, vượt trần mềm) cũng tính là lỗi |
| **Kiểm kho mẫu** | `python core/tests/check_kb_mock.py` |
| **Kiểm danh mục `category` khớp** | `python core/tests/check_danh_muc.py` |
| **Dựng lại DB từ export (FR-034)** | `python core/tools/dung_lai_db.py` |
| **Export DB ra file markdown/yaml** | `python core/tools/xuat_kho.py` |
| **Kiểm export dựng-lại-được** | `python core/tests/check_export_dan_xuat.py` |
| Tính lại `word_count` | `python core/src/source_distiller/validate.py kb/ --fix` |
| Gác cửa `_inbox/` → `kb/` | `python 05_intake/gate.py` |
| Chấm verdict ứng viên skill | `python 06_skillgen/verdict.py` |
| Sinh `SKILL.md` nháp (thử) | `python 06_skillgen/draft.py` |
| Sinh nháp **và ghi thật** | `python 06_skillgen/draft.py --ghi` |
| Báo cáo tuần | `python 07_curate/curate.py week` |
| Báo cáo tháng | `python 07_curate/curate.py month` |

`--fix` **chỉ** sửa `word_count`. Không bao giờ chạm `credibility`, `verdict`,
`concepts` — đó là quyết định, không phải phép tính (M01-R2).

`draft.py` không tự cài skill: máy đề xuất, **người quyết định** (PRD U7).

### Web

| Việc | Lệnh |
|---|---|
| **Chạy app (SSR + API biên tập)** | **`npm run api`** → http://127.0.0.1:8787 — trang render lúc request từ `kb/_kho.sqlite` (FR-034), không có bước build trang |
| Biên dịch FE sau khi sửa `*.inline.ts` | `npm run build` (esbuild → `.inline.js`, rồi restart `npm run api`) |
| **Gác cửa `_inbox/`** | **`npm run nap`** — gate INSERT vào DB rồi tự export `.md` |
| Toàn bộ test | `npm test` |
| Dựng lại kho sample | `npm run seed` |

FR-034 bỏ hẳn vòng `npm run build` kiểu Quartz: ghi qua API là thấy ngay khi
tải lại trang. Bản `/mock/` đọc `kb-mock/` (file), bản thật đọc DB.

**API biên tập** (FR-010 + FR-011): `npm run api` phục vụ trang SSR + toàn bộ
API trên **một** cổng, chỉ nghe `127.0.0.1`. Các đường:

| Đường | Việc |
|---|---|
| `POST /api/inbox` | nộp file agent sinh → `gate.py` (FR-010) |
| `GET /api/articles` · `/:type/:slug` | danh sách/chi tiết JSON, filter `?status=&category=&concept=&q=` |
| `POST /api/articles` | tạo bài tự viết — server áp `origin: manual` + `draft` |
| `PUT /:type/:slug` · `PATCH .../status` | sửa · duyệt/loại (3 trường M1 / lý do) |
| `DELETE /:type/:slug` · `.../restore` | xoá = recycle `_recycle/` · khôi phục |
| `GET /api/concepts` · `/api/recycle` | danh mục khái niệm · thùng rác |

MỌI đường ghi `kb/` chạy `validate.py --fix` + `--strict` trước khi chạm kho
(M08-R2) — trượt cổng là 422 kèm nguyên văn THIẾU/SAI/SỬA.

**Build ra `web/site/`, không phải `public/`.** `public/` là thư mục **ảnh nền
nguồn** của bạn — Quartz xoá sạch thư mục output trước mỗi lần build.

### Cổng máy — chạy trước khi push

```bash
python core/tests/check_g6a.py            # 7 module pack đủ điều kiện
python core/tests/check_g6b.py            # 15 task khai đủ, trong boundary
python core/tests/check_ba.py             # không điểm treo
python core/tests/check_frozen.py         # file frozen không đổi ngoài FR
python core/tests/check_mermaid.py        # diagram parse được
python core/tests/check_rule_surfaces.py  # MOI rule S3 co co che that (T04-6)
python core/tests/check_reject_reason.py  # cổng reject_reason
python core/tests/check_ci_teeth.py       # CI có ĐỎ ĐƯỢC không
python core/tests/check_version_pin.py    # Python pin khớp hai chỗ
python core/tests/check_db_dung_cho.py    # dữ liệu GỐC không ở kb/_kho.sqlite (ADR-06)
python 06_skillgen/test_sample_coverage.py
python 06_skillgen/test_verdict.py
python 06_skillgen/test_manifest.py
python 06_skillgen/test_draft_shape.py
python 05_intake/test_gate.py
python 07_curate/test_curate.py
```

Có `make`: `make check`.

**Tổng: 22 phép kiểm** — 30 pytest + 9 script + 6 module + 7 web.

---

## 4 · Vòng làm việc đầy đủ

```
① nạp        BA lối, cùng kết ở draft:
             a) chat với Claude Code — dán link, skill chạy 6 pass
             b) nộp file qua web    — npm run api, vào /nap/, kéo thả .md
             c) thả vào _inbox/     — rồi `npm run nap` (gate → DB → export)
② kiểm       python core/src/source_distiller/validate.py kb/ --strict
③ duyệt      trên web (FR-033: bài tự viết lên site ngay; external chờ nút Đưa lên site)
④ xem        cd web && npm run api → http://127.0.0.1:8787
⑤ sinh skill python 06_skillgen/draft.py --ghi   (rồi tự viết phần thân)
⑥ commit     hook chạy validate, sai format thì chặn
⑦ push       CI chạy lại 31 bước
```

Nhịp tuần: `python 07_curate/curate.py week` — nhắc draft đọng và bài nghi lỗi thời.

---

## 5 · Khi hỏng

| Triệu chứng | Nguyên nhân | Sửa |
|---|---|---|
| `Cannot find module ...` trong plugin | Node ESM đòi đuôi rõ ràng | import phải có `.ts`/`.js` |
| `UnicodeEncodeError` khi chạy script | Windows mặc định cp1252 | `export PYTHONIOENCODING=utf-8` |
| `check_frozen` đỏ | file frozen đổi mà chưa có FR | mở FR → bump version → `python core/tests/check_frozen.py --ky` |
| CI đỏ mà máy xanh | thường là môi trường | so `python --version` với `python-version` trong `ci.yml` |

| `kb/ có bài export nhưng chưa có kb/_kho.sqlite` | clone mới / DB bị xoá | `python core/tools/dung_lai_db.py` — đường file→DB duy nhất (FR-034) |

---

## 6 · Điều KHÔNG có, và vì sao

| Không có | Lý do |
|---|---|
| Đăng nhập, phân quyền | công cụ **một người dùng**, chạy local (BRD B-D3) |
| Database | nguồn chân lý là file `.md` + git. Xoá sạch rồi `git clone` là dựng lại được |
| Duyệt trên web | web **không bao giờ** ghi `kb/`. Duyệt trong editor |
| Deploy công khai | đổi sang công khai phải **rà lại toàn kho** trước |
| API công khai, webhook | không có bên thứ hai để gọi. Có **một** endpoint local `/api/inbox` (FR-010) để nộp file — chỉ nghe `127.0.0.1`, chỉ ghi `_inbox/` |

---

## 7 · Trạng thái hiện tại

**7/7 module `as-built`.** 22 phép kiểm xanh.

Nhưng **`kb/` vẫn rỗng** — mọi số đo đang chạy trên sample. M1 (metric chặn của
dự án) **chưa đo được ngày nào**.

Bước tiếp theo là nạp **2 bài thật** trước, xem shape có đúng không, rồi mới nạp
đủ 10 để đo M1.
