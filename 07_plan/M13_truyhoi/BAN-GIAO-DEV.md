# Bàn giao dev M13 — ba đơn vị kế tiếp: `T01-52` → `T01-51` → `T13-1`

- **PM M13** viết, 2026-09-09 · **cho**: dev M13 · **duyệt**: chủ dự án (*"Dev M13 sẽ thi công"*)
- **KHÔNG phải task file** — task thật ở `07_plan/M01_core/tasks/T01-5{1,2}-*.md` và
  `07_plan/M13_truyhoi/tasks/T13-1-test-unit.md`. File này là **ngữ cảnh + harness**:
  những thứ đã đo mà task không có chỗ chứa, và những bẫy đã trả giá một lần rồi.
- Đọc theo thứ tự: §0 (đọc gì trước) → §1 (harness) → §2 (ba đơn vị) → §3 (năm bẫy)
  → §4 (bàn giao) → §5 (điều KHÔNG được làm).

---

## 0 · Đọc gì trước khi gõ dòng đầu — và KHÔNG đọc gì

**Đọc, theo thứ tự này:**

| # | File | Lấy gì ở đó |
|---|---|---|
| 1 | `.factory/fr/FR-077-dai-han-bang-khai.md` | **ĐÃ DUYỆT 2026-09-09**. §1.1 là hình dạng `dai-han.json` **viết sẵn** — copy, đừng thiết kế lại. §2 là năm cổng H1–H5 và **chỗ ở** của từng cổng |
| 2 | `.factory/fr/FR-073-dang-dia-chi-anchor-vao-dia-chi-json.md` | §1 là dòng `file-anchor` **viết sẵn** (mẫu regex · `phan_giai` · `$dedup`). §2 là bốn cổng A1–A4, và **A3 KHÔNG thuộc bạn** |
| 3 | `06_modules/M13_truyhoi/spec.md` §1a · §2a · §3 | Hợp đồng **vừa ký** (`FROZEN`). `AC-3.4` trỏ `dai-han.json`; `AC-2.3` trỏ dạng địa chỉ. Đây là thứ ba đơn vị dưới phải làm cho **đúng**, không phải thứ để bàn lại |
| 4 | `06_modules/M13_truyhoi/rules.md` | Sáu rule. `M13-R6` mới. Ba vế `lệnh`/`đỏ_khi`/`xanh_khi` của mỗi rule **là đặc tả cổng** — cổng bạn viết phải đỏ đúng câu `đỏ_khi` nói |
| 5 | `06_modules/M13_truyhoi/testcases.md` | Happy + edge **bằng lời** cho từng AC. Đừng bịa ca mới; nếu một ca ở đây viết không nổi bằng mã ⇒ **DỪNG**, báo PM (đó là phép thử s6, và nó đã bắt được một AC mơ hồ rồi) |
| 6 | `.factory/worklog/WL-01KB43T130KYGATE.yaml` | Baseline số của mọi cổng **trước** lượt bạn, cộng hai phát hiện chặn. Đừng đo lại |
| 7 | `07_plan/song-song-m13-space-checklist.md` §1 · §4 | Bảng phân đất hai nhánh, và kỷ luật hằng ngày |

**KHÔNG đọc để "hiểu thêm":** `01_research/**` (386 dòng khảo, đã chưng vào FR rồi) ·
`02_proposal/**` · `_backup/**`. Đọc chúng không sai, nhưng mọi kết luận cần cho ba
đơn vị này **đã** nằm trong bảy file trên. Thời gian rẻ hơn dùng để chạy cổng.

---

## 1 · Harness — chạy được trước khi sửa được

### 1.1 · Console và encoding

```bash
export PYTHONIOENCODING=utf-8      # BẮT BUỘC trên Windows
```

Chỉ `check_frozen.py` tự `reconfigure(encoding="utf-8")` (`:26-32`). Mọi cổng khác in
tiếng Việt và sẽ **chết ở dòng `print`** với `UnicodeEncodeError` trên console
`cp1252` — vỏ nhận `exit 1` và bạn sẽ đi tìm một lỗi không tồn tại. Đây là ca
`#cổng-đỏ-oan` đã trả giá 2026-09-05.

### 1.2 · Bảy cổng, và số phải ra

Chạy từ **gốc repo**. Số trong ngoặc là baseline **trước** lượt bạn — chép từ
`WL-01KB43T130KYGATE`, không đo lại:

```bash
python core/tests/check_g6a.py            # M13: 6 artifact · 6 rule · AC 23 hard/1 soft
python core/tests/check_rule_surfaces.py  # OK 25 · CHO 53 · DO 0
python core/tests/check_ba.py             # M13 "đọc 0 trường" · m-ba sạch
python core/tests/check_mermaid.py        # exit 0
python core/tests/check_frozen.py         # pass · 57 file
python core/tests/check_khai_mot_noi.py   # exit 0
python core/tests/check_g6b.py            # exit 1 vì task module KHÁC — xem đoạn dưới
python -m pytest core/tests -q            # suite M01 — T01-51 sửa validate.py nên phải chạy
```

**`check_g6b` đỏ là bình thường** và **không phải việc của bạn**. Con số đổi mỗi ngày
vì hai nhánh đang thêm task: **14 lỗi / 297 task** (2026-09-09 sáng) → **21 lỗi /
306 task** (2026-09-10). Nên đừng ghim con số — ghim **phép đếm**: điều bạn phải giữ
là **0 dòng lỗi mang mã của ĐƠN VỊ BẠN**:

```bash
python core/tests/check_g6b.py 2>&1 | grep -E "^\s+- "   | grep -cE "T13-|T01-5[1-9]|M13"      # phải ra 0
```

⚠️ **Neo cho đúng, đừng viết `T01-5`.** Bản đầu của lệnh này dùng `T01-5` và nó khớp
luôn **`T01-50`** — một task cũ của người khác đang FAIL sẵn — nên phép đếm ra `2` và
bạn sẽ đi sửa việc không phải của mình. `T01-5[1-9]` chỉ khớp `T01-51`…`T01-59`. Đây
đúng lớp lỗi `#cổng-xanh-vì-neo-sai` ở dạng nhỏ nhất: một ký tự thiếu trong một neo.

### 1.3 · Nhánh, worktree, và dải ID

Ba worktree đã dựng: `.` (main) · `../gn-m13` [m13] · `../gn-space` [space].
**Làm trong `../gn-m13`.** Lý do không phải hình thức: hai lần trong ngày 2026-09-09,
commit của team M12 (`242431f`, `f611550`) đã **gom** file của PM M13 vào commit của
họ vì cả hai bên cùng gõ trên `main` và họ `git add -A`.

- **`rule.md` mục 17 (chốt 2026-09-10)**: nhánh **`m13`** là nhánh của module, mọi commit
  vào đó; **push** lên remote khi chủ dự án mở remote (hôm nay `git remote -v` **rỗng** —
  nhánh chỉ sống local, nên đừng để commit dồn nhiều ngày). **Không** tạo nhánh thứ hai
  (`M13-gn`…) cạnh `m13`. `main` chỉ nhận merge sau CI xanh + reviewer vai khác.
- **Dải ID của bạn**: `T01-5x` · `T13-x` (dải PM M13). **T##-90+ và FR-081+ là của
  PM-Space** — đừng lấy. Trước khi tạo bất kỳ file task/FR mới: `ls` thư mục lấy
  max+1 **ngay trước đó**, và ghi tên file vào worklog **cùng lượt**. Đã va 3 lần
  tuần này (FR-070 ×2, FR-071 ×2, T04-10 ↔ T04-90).
- **Hai điểm nối KHOÁ với nhánh Space**, đổi phải qua FR **và** báo PM kia:
  `pham_vi.space` (spec §1a, đã dành sẵn) và cột `space` của `GET /api/kho-delta`
  (`T08-35` AC1). Bạn **không** chạm hai chỗ này trong ba đơn vị dưới.
- `project_map.yaml`: **PM-Space giữ bút**. Cần bump ⇒ ghi một dòng *"cần bump: …"*
  vào worklog, không `Edit` file.

### 1.4 · Cổng và dữ liệu thật

- Test chạy trên **kho tạm** (`KB_DIR`), service giả bind **8895–8899**. `8787` là
  server thật của chủ dự án đang chạy; `8791` là cổng thật của M13. Đừng bind hai số đó.
- **Không sửa file thật để thử một cổng.** Fixture ở thư mục tạm
  (`tempfile.TemporaryDirectory()`), khuôn có sẵn ở `check_rule_surfaces.py --tu-kiem`
  (`:167-224`, 8 ca A–H) và `check_khai_mot_noi.py`.
- Sửa file qua **Edit**, **không** đi vòng `Bash` heredoc. Đó là lý do tồn tại của
  `check_frozen.py`: deny list chặn tool `Write` trên file frozen, nhưng 21 file
  frozen đã từng bị ghi qua heredoc mà **không bị chặn lần nào**.

### 1.5 · Ba luật cấu trúc mới — `rule.md` 14 · 15 · 16 (chốt 2026-09-10)

| luật | áp vào đơn vị của bạn thế nào |
|---|---|
| **14** mỗi service một thư mục gốc | Mọi mã M13 ở `truyhoi/src/**` · `truyhoi/tests/**` · `truyhoi/assets/**`. Không một file nào của M13 rơi vào `web/` hay `core/`. Bảng khai dùng chung (`dai-han.json` · `dia-chi.json` · `dich-vu.json`) ở `core/assets/` — đó là `T01-51`, đất M01, không phải của `truyhoi/` |
| **15** FE mỗi module một `web/plugins/<module>/` | `T03-125` (UI tìm): logic ở `web/plugins/timkiem/src/timkiem.inline.ts`, chunk nạp riêng khi focus ô tìm. `multiwindow.inline.ts` (**4 167 dòng** lúc chốt) chỉ nhận **một dòng móc** qua cầu `__GN_MW__` — thêm logic vào đó là vi phạm |
| **16** DB ba nhịp: tmp → chủ chấp nhận → thật | `T13-2` dựng `truyhoi/index.sqlite` — mọi test dựng nó ở `KB_DIR` **tạm**, không ở cây repo. `index.sqlite` là dẫn xuất (xoá được) nên **không** cần nhịp "chủ chấp nhận", nhưng vẫn không được sinh ở `kb/`. Mọi bảng thật của LÕI (`kb/_kho.sqlite`, 3.6 MB, 13 bản ghi) **cấm** `ALTER`/`INSERT` thử nghiệm — dù chỉ 8 ms |

---

## 2 · Ba đơn vị, thứ tự BẤT DI

> 🔁 **Cập nhật 2026-09-10 — dev M13 KHÔNG chờ `WO-084`.** Có lúc `check_g6b` crash
> và PM đã định chen `T01-54`/`T01-53` lên trước. Nay **chủ dự án giao WO-084 cho
> dev M12** (*"WO 84 dev M12 fix bug, tạm thời ko động"*), và cổng **hết crash** từ
> 16:09 hôm qua (chủ M03 sửa hai task). Nên: dev M13 chạy đúng ba đơn vị dưới, **không
> chạm** `T01-53` · `T01-54` · `core/tests/check_g6b.py`. Hai việc song song, khác
> người, khác file — nhưng nhớ §3.6 dưới: cổng đang xanh **không** nghĩa là bug hết.

```
T01-52  (test đi trước, ĐỎ đúng lý do)
   ↓
T01-51  (bảng khai + validate.py — làm ba cổng của T01-52 xanh)
   ↓
T13-1   (19 cổng của M13, MỘT lượt)
```

> **+ hai đơn vị FE mở 2026-09-10** (chạy sau T13-4, trước T03-125): **T03-148** (test —
> heading render có `id` == `slugGoiY`, dedup theo bài, cổng BA bản = FR-073 A3) →
> **T03-149** (C3: `md()` sinh `id`, ≤ 8 dòng trong multiwindow theo rule 15). Không có
> hai đơn vị này thì T03-125 AC2 *"cuộn đúng anchor"* là AC treo — heading hôm nay
> không có `id` và `nhay()` chỉ nhảy theo mục khung 5 mục.

### 2.1 · `T01-52` — đơn vị TEST, đi trước

**Ra**: ba vế mới trong `core/tests/check_dia_chi.py` (A1 · A2 · A4 của `FR-073` §2)
+ fixture ở `core/tests/fixtures/**`.

**Phải ĐỎ trước, và đỏ vì LUẬT** — không phải vì `ImportError` hay vì thiếu file.
Hôm nay: `grep -c file-anchor core/assets/dia-chi.json` ⇒ **0**, nên ba vế này đỏ vì
*bảng khai chưa có dạng đó*, đúng lý do. Ghi output đỏ **nguyên văn** vào worklog
cùng entry với output xanh sau khi `T01-51` xong (`rule.md` mục 8 — R5 chứng minh
bằng bằng chứng trong worklog, không bằng trạng thái suite trên cây chung).

**A3 KHÔNG thuộc bạn.** `FR-073` §2 A3 là cổng đối chiếu **ba bản** (`anchor_py` ↔
`slugGoiY` ↔ `id` trong HTML). Bản thứ ba **chưa tồn tại** — M03 chưa sinh `id` trên
heading (đo 2026-09-02: `grep -rn anchor web/render/ web/plugins/` ⇒ 0). Ô đó ở
`06_modules/M03_web/backlog.md:7`. Viết A3 bây giờ là viết một cổng **xanh rỗng**.

### 2.2 · `T01-51` — bảng khai, đúng ba file của M01

**Ra**: `core/assets/dai-han.json` (mới) · `dia-chi.json` (+1 dạng) ·
`dich-vu.json` (`goi_duoc` + `can_key_model`) · `validate.py` (nhận dạng mới).

Ba việc, mỗi việc một nguồn **viết sẵn**:

1. **`dai-han.json`** — copy `FR-077 §1.1` nguyên văn. Bốn dải **giữ đúng giá trị**
   `_DAI_HAN` của M12 (`chungcat/src/dinh_tuyen.py:27-33`) — PM đã đối chiếu **từng
   số**, khớp. Đây là **dời chỗ, không đổi hành vi**. Ba cổng H1/H2/H4 vào
   `check_khai_mot_noi.py` **§4 mới** (cổng đó đã là nhà của *"hai tập khai một
   nơi"*; đây là tập thứ ba, cùng khuôn).
   ⚠️ **Không** sửa `chungcat/src/dinh_tuyen.py` — vế đó là `FR-078` (đã duyệt mở),
   team M12 áp. Bạn chỉ tạo bảng; ô `M12/backlog.md:631` do họ tick.
2. **`dia-chi.json`** — copy `FR-073 §1` nguyên văn (một phần tử vào mảng `dang`).
   Dedup `-1`/`-2` kiểu github-slugger, **state theo FILE, reset mỗi file**.
3. **`dich-vu.json`** — theo `ADR-08 §Đổi thì 3`: `truyhoi.goi_duoc = ["web","chatbot"]`
   (`FR-072 §1.2`) · `truyhoi.can_key_model = false` · `chungcat.goi_duoc = ["web"]`
   (**giữ hiện trạng** — thêm khách cho M12 là quyết định riêng) · `vai` của `web`:
   *"Client DUY NHẤT của mọi dịch vụ THỢ"* → *"wrapper — UI + chuẩn hoá output"*.

### 2.3 · `T13-1` — 19 cổng, MỘT lượt

**Ra**: `truyhoi/tests/**` — 19 file `check_*.py` + `golden.yaml`.

**Danh sách 19**: 15 cổng theo `cmd` của spec (`check_dung_lai_duoc` ·
`check_lech_kho_bao_duoc` · `check_khong_cham_kho` · `check_anchor_mot_luat` ·
`check_dia_chi_phan_giai` · `check_reindex_tang_dan` · `check_mot_ham_chuan_hoa` ·
`check_ba_thu_tieng` · `check_snippet_chi_preview` · `check_w_title_do_rieng` ·
`check_pham_vi_hien_thi` · `check_tap_nguon_la_tham_so` · `check_golden_du_ca` ·
`check_tin_hieu_van_hanh` · `check_khong_embedding` · `check_nghe_loopback`) cộng
**bốn cổng mới**: `check_ai_goi_vao` (AC-1.6/M13-R6) · `check_chunk_hien_vat`
(AC-2.5/2.6) · `check_doi_chieu_chuan_hoa` (fixture chung M12/M13) ·
`check_hop_dong_v3` (cổng T1 của `FR-072` — đối chiếu **hai chiều** `sample.v3` ↔
`model_flow §2`).

Mỗi cổng: **đỏ nói đúng "chưa có mã"**, thiếu gói thì `exit 3` (khuôn
`chungcat/tests/_nap.py`). Và mỗi cổng phải **chứng minh đỏ được** trên fixture
cố-tình-hỏng ở thư mục tạm — lần đầu làm phép này ở `nhip-sinh` thì **2/5 ca xanh
oan**.

---

## 3 · Năm bẫy đã đo — mỗi cái đã trả giá một lần

### 3.1 · Tạo file đầu tiên trong `truyhoi/tests/` lật 5 rule sang ĐỎ

`check_rule_surfaces.py` phân loại theo **cơ học**: rule là **CHỜ** khi thư mục cha
của `lệnh` **chưa tồn tại** (`:141-142`), nhưng là **ĐỎ** khi thư mục **đã có** mà
file thì không (`:139-140`). Hôm nay cả 6 rule M13 đều CHỜ *chỉ vì* `truyhoi/tests/`
chưa có.

⇒ **Dựng cả 19 cổng trong MỘT commit.** Nhỏ giọt từng file là tự tạo một cửa sổ đỏ
oan giữa hai commit, và `check_rule_surfaces` nằm trong điều kiện đóng G6A.

### 3.2 · Một dòng bảng mở đầu bằng backtick lowercase làm `check_ba` TREO

`check_ba.py:43-46` đọc dòng bảng bắt đầu bằng `` | `ten_lowercase` `` như **một
trường frontmatter** — và tên đó không có trong `frontmatter.schema.json` thì module
"có điểm treo" ⇒ theo skill `m-ba` là **DỪNG**. M12 đã vấp đúng đây
(`WL-01K9W3S6M12`).

⇒ Mọi dòng bảng trong `data_flow.md`/`model_flow.md` **giữ từ chỉ loại đứng trước**:
`| cột \`nguon_van_ban\` |`, không phải `| \`nguon_van_ban\` |`. M13 phải **vẫn** in
*"đọc 0 trường"* sau lượt của bạn.

### 3.3 · `check_ky_tu_vo_hinh.py` đang CHẾT trên máy này

Nó vỡ ở `R.rglob("*")` với `NotADirectoryError [WinError 267]` trên
`web/_quartz/.quartz/plugins/WORKLOG.md`. `web/_quartz` là thượng nguồn ngoài git
(`.gitignore:21`) nên **CI không thấy** — chỉ vỡ local. **Đừng dùng nó làm `cmd`**, và
đừng đi tìm nguyên nhân trong việc của bạn. Cổng thuộc M01; nợ đã ghi ở
`WL-01KB43T130KYGATE` `đỏ_do` với đề nghị cho nó bỏ qua đường ignore.

### 3.4 · `trang.mjs` hard-code `truyhoi.sample.v1.json` và khoá `chunks`

`web/render/trang.mjs:1722-1726` hàm `soDotHai()` đọc **v1** và đếm khoá `chunks`;
**thiếu file thì NÉM** và trang `/dot-hai/` chết. `v3` vừa thêm **giữ khoá `chunks`**
đúng vì lý do đó.

⇒ **Đừng dọn `v1`/`v2`, đừng đổi shape của chúng.** Ô backlog đã mở, trỏ PM M03.

### 3.5 · `check_frozen.py --ky` ghi đè TOÀN BỘ lock và không kiểm gì

`:59-63` — không kiểm có FR, không kiểm branch, không diff. **Bạn không ký.** Ba đơn
vị này **không chạm file frozen nào**: `dai-han.json`, `dia-chi.json`, `dich-vu.json`,
`validate.py`, `check_dia_chi.py`, `truyhoi/tests/**` — **không** file nào trong
`FROZEN.lock` (đo: 57 file, `grep` ba tên trên ⇒ 0). Nếu `check_frozen` đỏ sau lượt
bạn thì **có gì sai**, không phải đến lúc ký: dừng và báo PM.

---

### 3.6 · `check_g6b` xanh hôm nay KHÔNG nghĩa là nó chịu được dữ liệu xấu

Hôm qua nó **crash** (`TypeError` tại `:81`) vì hai task khai thiếu `verifiability:`,
và **306 task còn lại không được kiểm**. Chủ hai task đã sửa lúc 16:08/16:09 nên cổng
xanh trở lại — nhưng nó xanh vì **hết dữ liệu kích hoạt**, không vì đã sửa: `:81` vẫn
in bốn ô qua f-string và ô nào vắng cũng chết cùng cách.

⇒ Khi bạn tạo task mới (`T13-x`, `T01-5x`), **khai đủ ba mục** `phạm_vi_ghi` ·
`verifiability` · `tiêu_chí` **ngay từ dòng đầu**. Thiếu một mục thì hôm nay bạn không
chỉ tự làm đỏ mình — bạn **khoá cổng plan cho cả hai nhánh** cho tới khi `WO-084` xong.
Kiểm nhanh trước khi commit một task mới:

```bash
grep -c '^verifiability:' <task mới>    # phải ra 1
```

## 4 · Bàn giao — evidence, không phải lời khai

Mỗi đơn vị một entry `.factory/worklog/WL-<ULID>.yaml`, và mỗi entry phải có:

- **`object`**: đường dẫn thật (+ SHA hoặc mốc giờ). Không có `object` ⇒ reviewer FAIL.
- **`do_do`**: từng lệnh + **output thật**, không phải *"đã kiểm"*. Số chép tay không
  tính (`#tự-khai`).
- **R5 — đỏ trước, xanh sau, CÙNG entry**: output cổng ĐỎ tại mốc trước-code, và
  XANH sau. Đây là cách duy nhất R5 đo được trên cây làm việc chung (`rule.md` mục 8).
- **`đỏ_do`**: mỗi lần báo ĐỎ phải có dòng này — tên tác nhân, hoặc
  `chưa-quy-được-chủ`. Trước khi phán một đỏ là của người khác:
  `git status` + `git log --oneline -3` + `find <đường-đỏ> -newermt <mốc ghi cuối>`.
  Hai nhánh cùng máy thì đỏ của nhánh kia là **chuyện thường**.
- **`keo_theo`** hoặc ô `backlog.md` **mở NGAY lúc phát hiện**, không để cuối lượt.

Commit: một đơn vị một commit, message ghi **số đo** (cổng nào xanh, số nào đổi).
Khuôn tốt để copy: `8ccc653` (ký gate) và `4ad83f9` (T13-0).

---

## 5 · Điều KHÔNG được làm — mỗi dòng một lý do đo được

| Không | Vì |
|---|---|
| Sửa `06_modules/M13_truyhoi/spec.md` · `rules.md` | **FROZEN**, vừa ký 2026-09-09. Thấy sai ⇒ **FR**, không sửa tay. Ba đơn vị này không cần chạm |
| Ký `FROZEN.lock` | Bạn không có phép; và ba đơn vị này không chạm file frozen nào (§3.5) |
| Sửa `chungcat/src/**` | `FR-078` (đã duyệt mở) là của **team M12**. Họ đang giữ file — `chungcat/src/api.py` và `worker.py` có diff chưa commit của `WO-077`/`T12-35` |
| Sửa `web/**` | Đất M03. `T08-35` (proxy `/api/tim` + `gocTho(ten)`) là đơn vị **riêng**, không gộp vào đây |
| Viết cổng A3 của `FR-073` | Bản thứ ba (`id` trong HTML) chưa tồn tại ⇒ cổng xanh rỗng (§2.1) |
| Nhỏ giọt file trong `truyhoi/tests/` | Lật 5 rule sang đỏ (§3.1) |
| Lấy ID `T##-90+` hoặc `FR-081+` | Dải của **PM-Space** (`rule.md` mục 13) |
| `Edit` `project_map.yaml` | PM-Space giữ bút; ghi *"cần bump"* vào worklog |
| Sửa `pham_vi.space` hoặc cột `space` của `kho-delta` | Hai **điểm nối khoá** giữa hai nhánh — đổi phải qua FR **và** báo PM kia |
| Xanh vế tiếng Trung của `AC-6.3` bằng fixture | Kho có **0** bài chữ Hán. `AC-6.3` là `soft` **có chủ ý**; cổng phải NÓI RA số thật rồi `exit 0`. Xanh bằng fixture bịa là tự ký thứ mình bị chấm |
| Đổi giá trị bốn dải trong `dai-han.json` | `FR-077 §3` — dời chỗ, không đổi hành vi. Đổi tập dải cần đo lại `ti_le_han` trên kho thật |
| Sửa file thật để thử một cổng | Fixture ở thư mục tạm. Thao tác *hoàn tác* là chỗ mất dữ liệu |

---

## 6 · Khi nào DỪNG và hỏi PM

- Một ca trong `testcases.md` **viết không nổi** bằng mã ⇒ AC mơ hồ, DỪNG (phép thử s6).
- Cần ghi **ngoài `phạm_vi_ghi`** ⇒ DỪNG, xin FR về `s7`/`s4`. **Không nới tại chỗ**,
  kể cả một file.
- Đỏ lần thứ 3 với cùng một lý do (`hard`) ⇒ leo thang, đừng thử lần bốn.
- `check_frozen` đỏ ⇒ **dừng ngay** (§3.5).
- Hai bản của một luật lệch nhau (vd `anchor_py` ≠ `slugGoiY`) ⇒ **DỪNG**, đừng sửa
  một bên cho khớp bên kia **trước khi biết bên nào đúng**.
- `dai-han.json` và `_DAI_HAN` của M12 ra kết quả khác nhau trên cùng một chuỗi ⇒
  DỪNG. PM đã đối chiếu từng số và chúng khớp; lệch nghĩa là có một bản thứ ba.
