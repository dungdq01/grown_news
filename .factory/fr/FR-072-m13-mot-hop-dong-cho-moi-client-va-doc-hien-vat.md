# FR-072 — M13: MỘT hợp đồng API cho mọi client · `doc_id` · `nguon[]` · đọc hiện vật văn bản · luật người gọi

> ⚠️ **Đổi số `FR-070` → `FR-072`, 2026-09-07.** Bản này tạo lúc **02:02**; team
> M12 tạo một `FR-070` khác lúc **08:23** (6+ tiếng sau) cho việc khác
> (*chưng cất video lấy transcript làm nguyên liệu*), và bản của họ **đã duyệt +
> đã thi công**, được `M12/spec.md` (**FROZEN**) · `M12/backlog.md` · 2 task file
> dẫn. Đổi số bản **ít tham chiếu ngoài hơn** — cùng cách đã xử `FR-054`/`FR-055`.
> Nội dung không đổi.
>
> ⚠️ **Và tôi đã tự xoá file gốc trong lúc đổi số** (`f"FR-{70}-"` cho `"FR-70-"`,
> không khớp `"FR-070-"`, nên nó ghi rồi `unlink` chính nó). Bản này dựng lại từ
> nội dung tôi viết cùng phiên. Bài học: **đổi tên file thì `git mv`/`shutil.move`,
> không phải `write` rồi `unlink`** — và kiểm tên đích **khác** tên nguồn trước khi
> xoá bất cứ gì.

- **mở**: 2026-09-07 · **người quyết**: chủ dự án — *"2. ok"* (duyệt mở) · **trạng thái**: **ĐÃ DUYỆT MỞ**, chờ áp
- **artifact FROZEN chạm**: `06_modules/M13_truyhoi/spec.md` · `rules.md` ·
  `05_uiux/contracts/truyhoi.sample.v2.json` (→ `v3`)
- **artifact khác chạm**: `M13/model_flow.md` §2 §3 · `M13/data_flow.md` §3 ·
  `M14/model_flow.md` §2 (tên trường) · `core/assets/dich-vu.json` (`goi_duoc`, `can_key_model`)
- **nguồn**: `01_research/m13-truy-hoi-dich-vu-nen.md` (§3 §4 §5 §7 §8) · `ADR-08` ·
  chỉ đạo 2026-09-07 mục 1 · 3
- **phụ thuộc**: `ADR-08` (đã ghi) · `FR-073` (dạng `#anchor`) · **không** phụ thuộc M12 sinh text PDF (xem §5)
- **liên đới**: `FR-054` (transcript `.vtt` là hiện vật, `kieu_moc`) · `FR-047 §2.1` (ba luật L1–L3) · `T08-33` (cửa xuất)

## 0 · Vì sao phải FR — bốn số đo, không phải ý kiến

```
spec_overview:469              "M14 (khách hàng duy nhất)"        ⇒ G3 khai MỘT khách
M13 spec/model_flow/data_flow  grep doc_id ⇒ 0                     ⇒ M14 đòi doc_id, M13 không biết chữ đó
model_flow §2 request          {cau_hoi, pham_vi, k}               ⇒ KHÔNG có nguon[] mà AC-5.3 bắt buộc
truyhoi.sample.v2              {q, ket_qua[{chunk_id,bm25,snippet}], tong}
                                                                   ⇒ tên trường khác model_flow; chunk_id = rowid
M13 data_flow §3               "bảng media — KHÔNG chạm"           ⇒ transcript .vtt (FR-054) vô hình
```

Chỉ đạo 2026-09-07 đảo tiền đề *"một khách"*: *"M13 build services API và web
call API"* · *"M12 đã có thể sinh transcript… đọc `.vtt` `.srt` cũng là một khả
năng"*. Spec frozen đang khai ngược ba điều đó.

## 1 · Hình dạng chốt

### 1.1 · MỘT endpoint, MỘT hình dạng — thay ba bản đang lệch

```
POST /truy-hoi
  {
    "cau_hoi":  "…",                        # bắt buộc
    "pham_vi":  { "pl": [...], "nguon": [...], "cat": [...], "cpt": [...] },
                                            # facet — CÙNG khoá TANG của FE
    "nguon":    ["slug", …] | null,         # tập nguồn (Knowledge) — AC-5.3
                                            # null ⇒ cả kho, và null phải KHAI TƯỜNG MINH
    "k":        20                          # bắt buộc, không mặc định trong mã (AC-5.2)
  }
→ 200
  {
    "ket_qua": [ {
        "doc_id":      "xgboost-taylor-bac-hai",     # slug — khoá M14 đã dùng
        "file":        "kb/docs/xgboost-taylor-bac-hai.md",
        "anchor":      "vi-sao-bac-hai",              # ASCII-fold, cùng slugGoiY()
        "line_start":  84, "line_end": 121,
        "dia_chi":     "docs/xgboost-taylor-bac-hai.md:84-121",
                                                      # dạng file-dong — PHÂN GIẢI ĐƯỢC hôm nay
        "heading_path":"XGBoost Taylor bậc hai › 3.2 Vì sao bậc hai",
        "body":        "…đầy đủ, không cắt…",         # bằng chứng (M13-R4), KHÔNG snippet()
        "nguon_van_ban": "than" | "hien-vat:text/vtt" | "hien-vat:text/plain",
        "bm25":        -7.41                          # giữ trong data, UI không hiện
    } ],
    "so_ban_ghi_trong_pham_vi": 2,   # CÙNG lời gọi (AC-5.1)
    "tong": 2
  }
```

Bốn điều đổi so với ba bản cũ, mỗi điều một lý do đo được:

| đổi | vì |
|---|---|
| bỏ `chunk_id` | là `rowid` — đổi mỗi lần dựng lại chỉ mục (dữ liệu dẫn xuất). Client giữ nó là giữ con trỏ hụt |
| thêm `doc_id` = slug | `M14/data_flow §2` đã khoá `citations[].doc_id` là slug; M13 không đổi được khách |
| thêm `dia_chi` dạng `file:A-B` | dạng **duy nhất** phân giải được hôm nay (`dia-chi.json`); `#anchor` chờ `FR-073` + C3 |
| `pham_vi` dùng **đúng khoá `TANG`** của FE (`cat·loai·cpt·pl·nguon`) | G5 sample dùng `phan_loai`; FE dùng `pl`. Hai bộ tên cho một facet là hai chỗ lệch |

### 1.2 · Người gọi — theo `ADR-08`, không theo *"chỉ M14"*

`dich-vu.json` dịch vụ `truyhoi` thêm:

```json
"goi_duoc": ["web", "chatbot"],
"can_key_model": false
```

Bên nhận cưỡng chế (`_tu_ai()` — tổng quát hoá `_tu_loi()` của M12,
`chungcat/src/api.py:90-101`): lời gọi mang `x-aud: truyhoi` + khoá chiều
`<từ>→truyhoi`; `từ` không trong `goi_duoc` ⇒ **403**. Thêm khách sau
(M19 · M12 · M16) = **một phần tử** vào mảng + một khoá.

`can_key_model: false` — `M13-R5` đòi 0 lời gọi mạng; khoá model cho một tiến
trình không gọi ra là khoá không ai dùng nhưng ai cũng đọc được.

### 1.3 · Nguyên liệu: `than` + HIỆN VẬT VĂN BẢN — qua cửa đã có, 0 dep mới

`data_flow §3` hiện cấm M13 chạm `media`. Lý do (*"byte không dựng lại được"*)
đúng cho **ghi**, không đúng cho **đọc**. Sửa thành: M13 **đọc** hiện vật văn
bản **qua API của LÕI**, **không** mở `kb/_media/**`.

| nguồn văn bản | lấy qua | đơn vị chunk | neo |
|---|---|---|---|
| `than` (mọi bản ghi) | `GET /api/index` (đã có) | `##`/`###` | `file:A-B` + `#anchor` |
| transcript `text/vtt` | `GET /api/xuat/<slug>/txt` (**cửa xuất `T08-33`, đã có**) hoặc `GET /api/articles/media/<sha>` | **cue** (`{tu, den, text}`) | `slug:t=mm:ss` (dạng `slug-moc`, **đã có**) |
| `.srt` người tải | cùng cửa `media`; `srt → cue` là **một** hàm nhỏ (đảo của `vttSangSrt`, `xuat-cua.mjs:69`) | cue | `slug:t=` |
| `.md` / `.txt` người tải (`T03-111` đã cho `text/markdown` · `text/plain` vào bảng mime) | `GET /api/articles/media/<sha>` | `##`/`###` như `than` | `file:A-B` |
| **PDF** | **không** — xem §5 | — | — |

Ba tính chất của lựa chọn này:

1. **Cùng một chữ với cái người tải xuống.** `xuat-cua.mjs` đã biến `.vtt` →
   `.txt`; M13 đọc `.txt` đó ⇒ chỉ mục và bản người thấy **không lệch**. Không có
   bản chuyển đổi thứ hai.
2. **M13 vẫn 0-egress, 0 dep nặng.** Mọi thứ là HTTP tới `127.0.0.1:8787` — đúng
   `M13-R3`/`R5`.
3. **`la_dan_xuat`/`kieu_moc` đi theo vào kết quả** (`nguon_van_ban`): M14 và
   người đọc **thấy** một đoạn đến từ transcript ASR (`FR-054 §1.4`: chữ *verified*
   đổi nghĩa) — không phải một đoạn của bài viết.

### 1.4 · Web gọi M13 để TÌM — trả nợ U6, không mở scope

`PRD U6` (đợt một): *"full-text trên tít, one_liner, thân bài"*. Hôm nay `#q` lọc
thẻ trên DOM (`TIM` + `apLoc()`). Sau FR này: `web` gọi `POST /truy-hoi` cho **tìm**
(trả danh sách đoạn + `dia_chi`, **không** ghép câu trả lời), gọi M14 cho **hỏi**.
`model_flow §3` sửa mũi tên ❌ `web → M13` thành: *"❌ nếu web **ghép đoạn thành
câu trả lời**"* — cấm đúng thứ nó sợ, không cấm mũi tên.

Cửa LÕI→THỢ mới ở `tho-cua.mjs` — và **tổng quát hoá `gocTho(ten)`**: hôm nay
**cả 5 cửa gõ cứng `thu_muc === "chungcat"`**; thêm `truyhoi` là lần thứ hai cùng
một hằng — đúng thứ `Z6` cấm.

## 2 · Đổi trong spec/rules (FROZEN — người ký lại sau khi áp)

| chỗ | trước | sau |
|---|---|---|
| `spec §1 Ra` | *"danh sách `{đoạn, địa_chỉ, điểm}`"* | hình dạng §1.1 |
| `spec §1` (thêm) | — | **AC-1.6** · người gọi ngoài `goi_duoc` ⇒ 403; `aud` sai ⇒ 403 · `hard` · `cmd: python truyhoi/tests/check_ai_goi_vao.py` |
| `spec §2` (thêm) | — | **AC-2.5** · chunk theo **cue** cho `text/vtt`/`.srt`, neo `slug:t=`; **AC-2.6** · `nguon_van_ban` đúng cho từng chunk · `cmd: python truyhoi/tests/check_chunk_hien_vat.py` |
| `spec §5 AC-5.3` | *"gọi không nêu tập nguồn ⇒ mặc định cả kho, tường minh trong mã"* | giữ, **thêm**: `nguon: null` là giá trị **khai trong payload**, không phải trường vắng |
| `data_flow §3` | *"bảng `media` — KHÔNG chạm"* | *"KHÔNG **ghi**; **đọc** qua API của LÕI"* |
| `model_flow §2` | `POST /truy-hoi {cau_hoi, pham_vi, k}` · *"M03 không gọi trực tiếp"* | §1.1 · *"M03 gọi cho **tìm**; hỏi qua M14"* |
| `model_flow §3` | ❌ `web → M13` | ❌ `web ghép câu trả lời` |
| `rules.md` (thêm) | — | **M13-R6** · *"nhận lời gọi từ dịch vụ ngoài `goi_duoc`, hoặc không kiểm `aud`"* · S3 · cùng lệnh AC-1.6 |
| `truyhoi.sample.v2` | `q · ket_qua[{chunk_id…}] · tong` | **`v3`** theo §1.1; `chunks[]` thêm `nguon_van_ban` |

`M14/model_flow §2` đổi **tên trường** cho khớp (`cau_hoi` · `ket_qua`) — không
đổi nghĩa; `data_flow §2` của M14 đã đúng `doc_id`.

## 3 · Cổng phải có — mỗi cổng một câu đỏ được

| # | bắt gì | đỏ khi |
|---|---|---|
| T1 | hình dạng §1.1 — **một** schema, `truyhoi.sample.v3` là fixture | một trường của `model_flow` không có trong sample, hoặc ngược lại |
| T2 | `doc_id` mọi kết quả là slug **có trong `ban_ghi`** | một `doc_id` không phân giải |
| T3 | `dia_chi` mọi kết quả phân giải qua `dia-chi.json` (`file-dong` hôm nay; `+anchor` sau `FR-073`) | một `dia_chi` không khớp dạng nào |
| T4 | chunk từ `.vtt` có neo `slug:t=` khớp cue thật; `nguon_van_ban = hien-vat:text/vtt` | neo ngoài thời lượng, hoặc `nguon_van_ban = than` |
| T5 | M13 **không** mở `kb/_media/**` khi đọc hiện vật (mọi lần đọc là HTTP) | một `open()` trỏ `kb/_media` |
| T6 | `goi_duoc`: gọi từ dịch vụ ngoài mảng ⇒ 403; `aud` khác `truyhoi` ⇒ 403; thiếu khoá ⇒ 403 | một trong ba trả 2xx |
| T7 | `pham_vi` dùng đúng khoá `TANG` — đổi facet ở FE thì tập ứng viên đổi, **0** map tên | có một bảng đổi tên `phan_loai ↔ pl` |
| T8 | `nguon: null` **khai tường minh** trong request mẫu; request **thiếu** khoá `nguon` ⇒ 400 | thiếu khoá mà vẫn 200 |

**T6 là cổng duy nhất mới về bản chất** — nó là `Z9` của `ADR-08` cắm vào M13.
Bảy cổng kia là đo lại hợp đồng đã có với hình dạng đúng.

## 4 · Ràng buộc KHÔNG được nới

1. **`M13-R5` nguyên vẹn** — 0 lời gọi mạng. Đọc hiện vật qua `127.0.0.1:8787`
   không phải Internet.
2. **`M13-R3` nguyên vẹn về GHI** — M13 không ghi `kb/**`, không mở `_kho.sqlite`.
3. **`M13-R4` nguyên vẹn** — `body` đầy đủ, không `snippet()`.
4. **`AC-8.4`/`8.5` của M14 nguyên vẹn** — `bot → doc_id` giải ở **M14**, M13 nhận
   `nguon[]`. M13 **không** mọc trục quyền.
5. **Không thêm dạng địa chỉ ở đây** — `#anchor` là `FR-073` (M01 sở hữu `dia-chi.json`).
6. **Không vector** — `spec §7` giữ nguyên.

## 5 · Điều FR này KHÔNG làm — và nợ để hở CÓ TÊN

- **Không trích text PDF.** Đo: `chungcat/src` **0** lần gọi `pdfplumber` dù
  `pyproject.toml:31` khai. Khi M12 sinh text PDF thành hiện vật `text/plain`
  (`la_dan_xuat=1`), M13 thấy nó **qua cùng cửa §1.3, 0 dòng mã mới**. Cho tới đó
  **tài liệu PDF vẫn mù với RAG** — đó là **nợ của M12**, không phải nợ ẩn của FR này.
- **Không chọn `w_title`** — đo (`AC-4.2`).
- **Không xanh `AC-6.1` vế tiếng Trung bằng fixture.** Kho **0** bài Hán ⇒ vế zh
  khai `soft` **kèm lý do** cho tới khi có ≥2 bài phồn thể (`decisions.md` 2026-09-07 mục 4).
- **Không ký `FROZEN.lock`** — người ký.

## 6 · Đo được hôm nay — trạng thái trước FR

```
07_plan/M13_truyhoi/                          KHÔNG tồn tại
truyhoi/                                       chỉ README.md
grep doc_id 06_modules/M13_truyhoi/*.md        0
grep media|transcript M13 spec+data_flow       1 dòng — "KHÔNG chạm"
dich-vu.json truyhoi.can_key_model             true
kb/**  bài chữ Hán                             0
web/api/tho-cua.mjs  gocTho()                  thu_muc === "chungcat" (gõ cứng, 5 cửa)
xuat-cua.mjs  .vtt → .txt / .srt               ĐÃ CÓ (T08-33)
```
