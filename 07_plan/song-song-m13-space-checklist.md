# Checklist — chạy SONG SONG M13 và Space mà không đụng nhau

- **ngày**: 2026-09-09 · **vai**: overview (kiểm chéo, không phải plan của PM) · **cho**: PM M13 · PM-Space · dev hai nhánh
- **đo lúc viết**: `git worktree list` = **1** (main) · `core/tests` có **0** cổng scope · FR max = **080** · `FROZEN.lock` đang sửa chưa commit (M11 spec, 12:18) · ADR-09 **ĐỀ XUẤT**, FR-080 **CHỜ DUYỆT**, FR-077 **được trỏ 4 chỗ nhưng chưa có file**
- **nguyên tắc** (CLAUDE.md): *"Song song ⇒ mỗi đơn vị một worktree, nhánh riêng không đủ"* · `<scope-check>` bắt *"hai task tranh cùng một file"* — **chưa cài** ⇒ vế đó hôm nay không tồn tại và không ai báo

## 0 · Ba việc phải xong TRƯỚC khi hai nhánh cùng gõ mã

| # | Việc | Ai | Vì sao trước | Xanh khi |
|---|---|---|---|---|
| 0.1 | **Cài `core/tests/check_scope.py`**: đọc mọi `07_plan/**/tasks/*.md` trạng thái mở, đỏ khi hai task khác nhánh khai **cùng một path** trong `phạm_vi_ghi` | dev M04 (một đơn vị nhỏ, ~40 dòng) | `check_g6b` chỉ đo *ID trùng* và *trong boundary*, **không** đo hai task tranh một file. Đây là cổng duy nhất bảo vệ song song, và nó vắng | chạy trên plan hiện tại ⇒ báo đúng cặp **T01-51 ↔ Space/validate.py** và **T08-35 ↔ Space/dungchung.mjs** (§2) |
| 0.2 | **Hai worktree**: `../gn-m13` (nhánh `m13`) · `../gn-space` (nhánh `space`); `main` chỉ nhận merge | PM | cùng một working tree đã sinh: trùng FR ×2, file test bị xoá, `FROZEN.lock` sửa treo | `git worktree list` = 3 |
| 0.3 | **Chủ dự án ký ADR-09 + duyệt FR-080** | chủ dự án | Space không có gì để gõ trước hai chữ ký này; M13 `T13-5` lọc theo cột `space` chỉ có nghĩa khi cột tồn tại | hai dòng "ĐÃ DUYỆT" |

## 1 · Ai sở hữu file nào — bảng phân đất

| Vùng | M13 (PM M13) | Space (PM-Space) | Cấm |
|---|---|---|---|
| `truyhoi/**` | ✅ toàn bộ | ❌ | Space **không** đặt cổng R4 vào `truyhoi/tests/` (đó là `T13-1`) |
| `06_modules/M13_truyhoi/**` | ✅ (T13-0 áp FR-072/073) | ❌ | khoá `space` trong `pham_vi` **đã dành sẵn** ở T13-0 — Space không cần chạm |
| `core/assets/kho.schema.sql` · DDL ba bảng · view `ban_ghi` | ❌ | ✅ (FR-080) | — |
| `core/assets/dai-han.json` · `dia-chi.json` · `dich-vu.json` | ✅ qua `T01-51` (M01 làm hộ) | ❌ | Space không thêm dạng địa chỉ, không sửa `dich-vu` |
| `core/src/source_distiller/validate.py` | `T01-51` (dải Hán) | ontology per-space | **⚠️ tranh** — xem §2.1 |
| `web/api/dungchung.mjs` · `router.mjs` · `tho-cua.mjs` | `T08-35` (proxy tìm, cột `space` dành sẵn) | `WHERE space` mọi query · CRUD space | **⚠️ tranh** — xem §2.2 |
| `web/render/**` · `gn.js` · `man-hinh.json` | ❌ | ✅ tab bar, URL hậu tố (làm **sau** dữ liệu) | M13 không có FE |
| `kb/*.yaml` ontology · `xuat_kho.py` · `dung_lai_db.py` | ❌ | ✅ | — |
| `06_modules/M14_chatbot/spec.md` (**FROZEN**) | ❌ (model_flow non-frozen đã xong, WL-01KB41) | ❌ cho tới ADR-09 ký | **cả hai cấm**; sau ADR-09 = **một** FR "bot = nút cây", PM-Space mở, PM M13 review |
| `project_map.yaml` | bump khi G6C | bump khi thêm entity `Space`, `BaiHoc.space_id` | **⚠️ một người bump** — §2.3 |
| `FROZEN.lock` | ký lại M13 spec/rules sau T13-0 | ký lại `kho.schema.sql` sau FR-080 | **chỉ chủ dự án ký**, tuần tự, commit ngay sau ký |
| `.factory/fr/` | FR-081+ | FR-081+ | `ls` lấy **max+1 ngay lúc tạo**, ghi worklog cùng lượt — đã trùng hai lần |

## 2 · Bốn điểm tranh — cách gỡ từng điểm

### 2.1 `validate.py` — T01-51 (M13) vs ontology per-space (Space)
- **Gỡ**: T01-51 đi **trước** (đang có task, phạm vi nhỏ: đọc `dai-han.json`). Space mở task riêng `T01-53 validate theo space` **phụ_thuộc: T01-51**, không mở song song.
- **Cổng**: `check_scope` phải đỏ nếu ai mở T01-53 khi T01-51 chưa đóng.

### 2.2 `dungchung.mjs` — T08-35 (M13 proxy tìm) vs `WHERE space` (Space)
- Hai việc **khác chức năng, cùng file**. T08-35 đã dành cột `space` trong cửa kho delta (dòng 6–7, 28) ⇒ nó là **người đặt viên gạch đầu**.
- **Gỡ**: T08-35 xong và merge → Space mở `T08-39 WHERE space + CRUD space` **phụ_thuộc: T08-35, FR-080**. Không rebase chồng lên nhau trong cùng file 700+ dòng.
- **Cổng**: R4 `check_khong_ro_cheo_space.py` đặt ở **`core/tests/`** (chủ: Space, M04 boundary), gọi **hai hộp đen** `GET /api/index?space=` và `POST /truy-hoi {pham_vi:{space}}` — không import mã của bên nào. Phải **đỏ được** trên fixture bỏ-lọc (ADR-09 §8).

### 2.3 `project_map.yaml` — ba người muốn bump
- T01-50 (BaiHoc `giu_cho`) · Space (entity `Space`, `BaiHoc.space_id`, M19 lồng) · M13 (G6C).
- **Gỡ**: **PM-Space giữ bút** `project_map` cho tới khi ADR-09 áp xong (v31 một lượt gồm cả T01-50). M13 xin bump qua **một dòng trong worklog** "cần bump: …", PM-Space gộp. Không ai `Edit` file này ngoài người giữ bút.
- Đây cũng là chỗ trả 9 lệch tiến độ đã đo (WL-01KA7): `status` M08/M10/M11/M12–M17, `gaps` 6/7 lỗi thời, `enforcement` số đợt 1, `flows` thiếu đợt 2, `BaiHoc.owner` trỏ module không tồn tại.

### 2.4 `FROZEN.lock` — hai đợt ký, một file, đang sửa treo
- Hiện có diff **chưa commit** (M11 spec `fe50…` → `3b97…`, 12:18) — chưa rõ của ai. **Quy chủ trước**, rồi commit riêng một lượt "ký lại M11".
- **Gỡ**: mỗi đợt ký = một commit riêng, đúng file, đúng lúc; không để lock nằm trong working tree qua đêm.

## 3 · Thứ tự — ai chờ ai

```
tuần 1  ─ M13 ─  T13-0 (áp FR-072/073 → ký lock)  ──►  T13-1 test  ──►  T13-2/3 indexer
        ─ M01 ─  T01-51 bảng khai (dai-han · dia-chi · dich-vu · FR-077)  ──►  T01-52
        ─ Space ─ [chờ ký ADR-09 + FR-080]  ──►  DDL +space (8 ms)  ──►  T01-53 validate theo space
        ─ M08 ─  T08-35 proxy tìm (cột space dành sẵn)
                                           │
tuần 2  ─ M13 ─  T13-4/5/6 (T13-5 lọc space: CHỜ FR-080 đã áp)  ─┤
        ─ Space ─ T08-39 WHERE space + CRUD   (CHỜ T08-35 merge)  ─┤──►  core/tests/check_khong_ro_cheo_space.py (R4)
        ─ Space ─ xuat_kho / ontology yaml export
                                           │
tuần 3  ─ M13 ─  T13-7 hiện vật  ──►  G6C  ──►  bump map (qua PM-Space)
        ─ Space ─ M03 tab bar + URL hậu tố (SAU khi R4 xanh)  ──►  FR "bot = nút cây" cho M14 (một FR, hai PM)
```

Ba cạnh phụ thuộc **xuyên nhánh** (ghi vào `phụ_thuộc:` của task, để `check_g6b` thấy):
1. `T13-5` ← **FR-080 đã áp** (cột `space` có thật trong `ban_ghi`)
2. `T08-39` (Space) ← **T08-35** (M13) merge
3. `T01-53` (Space) ← **T01-51** (M13/M01) merge

## 4 · Kỷ luật hằng ngày — cho cả hai dev

- [ ] Mở task ⇒ chạy `check_scope` + `check_g6b` trước khi gõ dòng đầu; đỏ ⇒ dừng, không "làm nhanh rồi tính".
- [ ] Mọi test chạy trên **kho tạm** (`KB_DIR`), cổng **8895–8899**; `8787` là server thật của chủ dự án. Migration Space **không bao giờ** chạy trên `kb/` thật trước gate.
- [ ] Tạo FR ⇒ `ls .factory/fr | tail -1` ngay trước đó, lấy max+1, ghi worklog **cùng lượt**.
- [ ] Đỏ mà chưa quy được chủ ⇒ `git status` + `find -newermt` trước khi phán (`#đỏ-của-người-khác`) — hai nhánh cùng máy thì đỏ của người kia là chuyện thường.
- [ ] Không chạm `06_modules/*/backlog.md` của nhánh kia; nợ kéo theo ⇒ ghi vào **backlog của module sở hữu file**, kèm `object`.
- [ ] Merge vào `main` **một nhánh một lúc**, CI xanh, reviewer là **vai khác** nhánh đó (luật gốc). Nhánh sau rebase lên `main` mới rồi mới xin merge.
- [ ] Space không có thư mục module (không đánh số) ⇒ task Space **đặt trong module sở hữu file** (`T01-5x`, `T08-3x`, `T03-1xx`) với tiền tố tiêu đề `[Space]`; kế hoạch tổng chỉ là **con trỏ** ở `07_plan/space-plan.md`, không chép nội dung task.

## 5 · Đo được hôm nay — số làm mốc

```
git worktree list                         1  (cần 3)
core/tests/check_scope*.py                0  (cần 1)
FR-077 file                               0  (T01-51 sẽ tạo — 4 chỗ đang trỏ)
FROZEN.lock uncommitted                   1 dòng (M11 spec), 12:18, chưa quy chủ
07_plan/M13_truyhoi/tasks                 8 task (T13-0..7), 0 task chạm ngoài truyhoi/ + 06_modules/M13 + sample.v3
task đã dành sẵn `space`                  T13-0 · T13-5 · T08-35
file hai nhánh cùng khai                  validate.py · dungchung.mjs (đo tay — check_scope phải xác nhận)
```
