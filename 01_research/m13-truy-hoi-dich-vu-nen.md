# M13_truyhoi — dịch vụ NỀN cho mọi module sau: khảo đo trước khi s7

> **s1 bổ sung** · 2026-09-07 · đọc **từ spec**, không từ trí nhớ. Mọi mệnh đề
> mang một trong ba nhãn: **fact** (có lệnh/dòng đối chiếu) · **suy luận** ·
> **giả định**. Fact không nguồn thì hạ xuống suy luận.
>
> Yêu cầu gốc nguyên văn: `original_request.md` mục 2026-09-07. Bốn mệnh đề:
> M13 là **dịch vụ** · là **nền** cho dịch vụ sau · **web gọi API** của nó ·
> **mỗi module M12–M19 là một service**.
>
> Câu hỏi file này trả lời: *M13 hôm nay được thiết kế cho ai, và để nó thành
> NỀN thì hợp đồng nào thiếu, luật nào chỏi, và cái nào phải chốt trước s7.*
>
> ⚠️ `spec.md` + `rules.md` của M13 **FROZEN** (`FROZEN.lock`). Mọi đề xuất dưới
> đây là **đầu vào cho FR**, không sửa tại chỗ. `07_plan/M13_truyhoi/` **chưa
> tồn tại** — s7 chưa bắt đầu, nên đây đúng lúc rẻ nhất để chốt.

---

## 0 · Kết luận trước, bằng chứng sau

| # | kết luận | nhãn | hệ quả |
|---|---|---|---|
| 1 | Toàn bộ tầng thiết kế (G3 · G5 · G6A) khai M13 có **MỘT khách: M14** — `spec_overview:469` viết nguyên văn *"M14 (khách hàng duy nhất)"*, `model_flow §3` vẽ mũi tên đứt ❌ cho `web → M13` | **fact** | mệnh đề *"M13 là nền, web gọi API"* là **đổi phạm vi G3**, không phải đọc lại spec |
| 2 | Người gọi duy nhất đó là **THỢ gọi THỢ** (`M14:8788 → M13:8791`), mà `ADR-05` luật 2 viết *"web là client DUY NHẤT của mọi service… **không ai gọi thẳng** `:8791`"* — và **không cổng nào canh** (Z8 không có trong `check_ba.py`, `core/tests/` không grep cổng nào) | **fact** | G6A của M13 **và** M14 chỏi G4, đã 6 ngày, không đỏ |
| 3 | Hợp đồng API của M13 tồn tại ở **ba chỗ, ba hình dạng khác nhau**: `model_flow` (`POST /truy-hoi {cau_hoi, pham_vi, k}`), G5 `truyhoi.sample.v2` (`q · ket_qua[] · tong`), M14 (`doc_id · anchor`) — và M13 spec **không có chữ `doc_id`** | **fact** | s8 sẽ chọn một, hai bên kia lệch im lặng |
| 4 | `file#anchor` — địa chỉ M13 sinh — **không phải một dạng địa chỉ** trong `dia-chi.json` (5 dạng: `slug` · `slug:p.N` · `slug:t=` · `file:A-B` · `§`), và C3 **chưa sinh `id`** trên heading (`md()` phát `<h2>` trần) | **fact** | M14 `citations[].anchor` *"phân giải qua `dia-chi.json`"* — **không phân giải được** |
| 5 | M13 chỉ index `than`. Tài liệu có `than` ≤ 400 từ (ghi chú); **PDF không được trích text ở đâu** (`chungcat/src` 0 lần dùng `pdfplumber` dù khai dep); transcript `.vtt` **có** trong `media` (`la_dan_xuat=1`, `kieu_moc`) nhưng M13 spec/data_flow **0 lần** nhắc `media`/transcript | **fact** | 2/3 loại nội dung (tài liệu · video) **vô hình** với RAG |
| 6 | `dich-vu.json` khai `truyhoi.can_key_model: true`; `M13-R5` đòi **0 lời gọi mạng** | **fact** | bảng khai lệch spec — THỢ không cần khoá vẫn được phát khoá |
| 7 | `chungcat/src/verify.py` **đã có** `def chuan_hoa()` (NFKC · ligature · gạch-nối · casefold) — **khác** `chuan_hoa()` M13 đặc tả (NFC · lower · `đ→d` · chèn cách Hán). **Cùng tên, hai nghĩa**, trong cùng repo | **fact** | `M13-R1` (*"bản thứ hai"*) sẽ đỏ ngay dòng `import` đầu |
| 8 | PRD **U6** hứa *"full-text trên tít, one_liner, thân bài"* từ đợt một; `gap_analysis G-8` đo FE search = `includes()` trên DOM; hôm nay `#q` vẫn là lọc thẻ | **fact** | *"web gọi M13 để tìm"* **không phải scope mới** — nó trả một nợ PRD |
| 9 | Kho có **0** bài chữ Hán (`kb/**` han=0); golden set đòi **4 ca tiếng Trung** | **fact** | `AC-6.1` xanh được chỉ bằng fixture bịa |

---

## 1 · Fact — cái đã chốt và ĐANG frozen

| artifact | chốt gì | nguồn |
|---|---|---|
| `spec_overview §M13` | Vào `ban_ghi` chỉ đọc · câu hỏi · phạm vi facet → Ra đoạn + địa chỉ + điểm. *Liên quan: M02 (nguồn) · **M14 (khách hàng duy nhất)***. PRD U10 · proposal S12 · BRD B-C2 | `03_docs/spec_overview.md:463-475` |
| `spec.md §1` | chỉ mục là **dữ liệu dẫn xuất** — xoá dựng lại được, không migration | `06_modules/M13_truyhoi/spec.md:11-21` |
| `spec.md §2` | chunk theo `##`/`###`; anchor = ASCII-fold **đúng luật `slugGoiY()`** (`NFD → bỏ dấu → đ→d → [^a-z0-9]+→- → cắt 60`); bảng `chunks` + `chunks_fts(content=chunks)` | `spec.md:34-81` |
| `spec.md §3` | **MỘT** tokenizer `unicode61 remove_diacritics 2` + **MỘT** `chuan_hoa()` cho ba thứ tiếng; dải Hán từ **bảng khai** (`AC-3.4`) | `spec.md:82-126` · `decisions.md` 2026-09-01 (4) |
| `spec.md §5` | phạm vi facet = control **hiển thị**; **tập nguồn là THAM SỐ** (`AC-5.3`) — hai trục: `pham_vi` lọc lúc hỏi, tập nguồn = Knowledge gắn bot | `spec.md:144-162` |
| `spec.md §7` | vector **HOÃN**; điểm rẽ = tín hiệu vận hành (0 kết quả · gõ lại ≥2); RRF hợp đồng sẵn; SQLite 3.50.4 + `FULL OUTER JOIN` **đã đo chạy** | `spec.md:181-201` · `research_summary §12a` |
| `rules.md` | R1 một `chuan_hoa` · R2 một luật anchor · R3 không chạm kho · R4 `snippet()` chỉ preview · R5 **0 lời gọi mạng** — 7/7 S3 đủ `lệnh/đỏ_khi/xanh_khi` | `06_modules/M13_truyhoi/rules.md` |
| G5 contract | `truyhoi.sample.v1/v2.json` — **frozen** (`FROZEN.lock`) | `05_uiux/contracts/` |
| `decisions.md` 2026-09-01 | (1) anchor ASCII-fold *"kho đã chọn rồi: 0/5 tên file ngoài ASCII"* · (4) một bảng FTS5 thay vì hai | `memory/decisions.md:446-510` |

**Đã đo trên máy** (`research_summary §12`, 2026-09-01): `đ` **không** fold bằng
tokenizer nào · `remove_diacritics 1` trượt cả `hướng` lẫn `phần` · `unicode61`
cắt 15 chữ Hán thành **một** token · chèn cách quanh Hán ⇒ **10/10**.

---

## 2 · Fact — đồ thị gọi giữa bảy service, đo từ spec

### 2.1 · Bảng dịch vụ (`core/assets/dich-vu.json`)

```
web       :8787  LÕI   key=false
chungcat  :8790  THỢ   key=true
truyhoi   :8791  THỢ   key=TRUE   ← M13-R5: "0 lời gọi mạng"  ⇒ LỆCH (§5.1)
chatbot   :8788  THỢ   key=true
artifact  :8792  THỢ   key=true
kenh      :—     BIÊN  key=false  (không nghe)
cong      :443   BIÊN  nghe_ngoai=true (duy nhất)
```

### 2.2 · Ai nhắc ai (đếm `M1x` trong `spec.md` từng module)

```
M12 → M13 ×2 (dải Hán · vector "M13 quyết")   M14 ×1
M13 → M14 ×1 (khách duy nhất)                 M12 ×1 (dải Hán)
M14 → M13 ×11 · M12 ×2 · M17 ×1
M15 → M14 ×2 · M12 ×1
M16 → M12 ×5
M17 → (không ai)
M18 → M14 ×4 · M17 ×1 · M12 ×1
```

Người gọi M13 **duy nhất** trong toàn bộ 7 spec: **M14**. Mã hôm nay: `chungcat/src`
không gọi THỢ nào khác (grep `8791|truyhoi` ⇒ 0).

### 2.3 · Luật vùng, và chỗ nó chỏi

`ADR-05` bổ sung 2026-08-31, nguyên văn:

> **2. `web/` là client DUY NHẤT của mọi service.** Trình duyệt gọi `web`; `kenh/`
> gọi `web`. **Không ai gọi thẳng `:8788` / `:8790` / `:8791` / `:8792`.**

Nhưng `M14/model_flow.md:41` khai `M14 → M13: POST /truy-hoi`, và `M13/model_flow
§3` vẽ **cùng** mũi tên. Đó là **THỢ gọi thẳng `:8791`** — đúng thứ luật 2 cấm bằng
chữ in.

Ba điều đo được quanh xung đột này:

| | |
|---|---|
| `M12 AC-1.4` | *"`POST /job` chỉ nhận từ LÕI. Một THỢ khác (`chatbot`, `artifact`, `truyhoi`) gọi vào ⇒ **đỏ**"* — M12 **cấm** THỢ→THỢ, có cổng thật (`check_chi_loi_goi_tu_loi.py`, XANH) |
| `M13 spec/rules` | **không có** luật *"ai được gọi vào"* — grep `chỉ nhận lời gọi\|từ LÕI\|THỢ khác` ⇒ 0 |
| cổng khung | `check_ba.py` **không** cưỡng chế Z8 (docstring: ba câu hỏi, không câu nào về cổng); `core/tests/*.py` grep `8791\|Z8` ⇒ **0** |

⇒ **Ba module cùng vùng THỢ, ba luật khác nhau về người gọi**: M12 cấm THỢ→THỢ
bằng cổng · M13 không nói · M14 giả định được gọi vào M13. Và **không máy nào đo**.
Đây là chỗ G4 ↔ G6A lệch mà không cổng nào đỏ — cùng lớp với `check_g6a` đo chữ
`cmd` thay vì lệnh chạy được (`M03/backlog.md` ô đầu).

**Cái làm chỗ này thành bắt buộc với mệnh đề "M13 là nền"**: nếu M16 (`@bài-khác`,
`ui-embed-matrix-scan:74`), M19 (tập nguồn có tên), hay chính M12 (gợi `nguon[]`)
về sau gọi M13, **mỗi lần là một THỢ→THỢ mới**. Không chốt luật thì mỗi lần là một
ngoại lệ **trong đầu người**.

---

## 3 · Fact — hợp đồng API của M13 ở BA chỗ, BA hình dạng

| chỗ | request | response | ai đọc |
|---|---|---|---|
| `M13/model_flow §2` | `POST /truy-hoi {cau_hoi, pham_vi, k}` | `{doan[], so_ban_ghi_trong_pham_vi}` | s8 M13 |
| G5 `truyhoi.sample.v2` (**frozen**) | `{q, pham_vi:{phan_loai}}` | `{so_ban_ghi_trong_pham_vi, ket_qua:[{chunk_id, bm25, snippet}], tong}` | web mock |
| `M14/spec §2` + `data_flow §2` | — | cần từ M13: `doc_id` (= slug) · `anchor` · `body` đầy đủ để verify `cited_text` | s8 M14 |
| `M14/spec AC-8.2` | M14 truyền **tập nguồn** xuống M13 như tham số; `AC-8.5` server giải `bot → doc_id`, không nhận từ caller | — | s8 M14 |

Lệch đo được:

- **Tên trường**: `cau_hoi` ≠ `q` · `doan[]` ≠ `ket_qua[]` · `so_ban_ghi_trong_pham_vi`
  có ở cả hai (khớp) · `tong` chỉ có ở G5.
- **`doc_id`**: M14 đòi trong mỗi citation; M13 spec · model_flow · data_flow **0 lần**
  dùng chữ này. Chunk của M13 mang `file` (`kb/docs/xgboost-taylor-bac-hai.md`), M14
  mang `doc_id: "xgboost-taylor-bac-hai"` (slug) — **hai khoá cho một bản ghi**.
- **Tập nguồn**: `AC-5.3` M13 nhận `nguon: [slug…]`; G5 sample **không có** trường
  đó; `model_flow` request **không có** trường đó. Tham số mà M14 `AC-8.2` **bắt buộc
  truyền** không xuất hiện trong hợp đồng của bên nhận.
- **`chunk_id`** (G5) là `rowid` — đổi khi dựng lại chỉ mục (dữ liệu dẫn xuất ⇒
  `rowid` không ổn định). Một client giữ `chunk_id` qua hai lần re-index là giữ một
  con trỏ hụt. Địa chỉ ổn định là `file#anchor` + `line_start-line_end`.

**Suy luận**: G5 sample viết cho **mock web** (một client); `model_flow` viết cho
**M14** (client khác); không ai viết cho **cả hai**. Khi web thành client thật, s8
phải chọn — và lựa chọn đó không có FR nào đứng sau.

---

## 4 · Fact — địa chỉ `file#anchor` chưa có người tiêu thụ, và chưa là một DẠNG

### 4.1 · `dia-chi.json` — năm dạng, không dạng nào có `#`

```
slug        [xgboost-stap-by-step]            có file kb/*/<slug>.md
slug-trang  [xgboost-stap-by-step:p.7]        media là PDF ∧ trang ≤ số trang thật
slug-moc    [thien-duong-chuot:t=03:15]       bản ghi là video (KHÔNG kiểm được mốc)
file-dong   [docs/x.md:12-31]                 số dòng cuối ≤ số dòng thật
muc         [§II.4]                           KHÔNG PHÂN GIẢI ĐƯỢC — chỉ đếm
```

M13 sinh `file#anchor`. M14 `data_flow §2`: *"`citations[].anchor` — phân giải được
qua `core/assets/dia-chi.json`"*. **Không dạng nào khớp `#anchor`** ⇒ câu đó hôm nay
**sai**, và `B-A5` (*địa chỉ phải phân giải được*) không phủ dạng này.

Dạng gần nhất là `file-dong` — và M13 **đã có** `line_start/line_end` trên mỗi chunk
(`data_flow §2`). Nên địa chỉ phân giải được **hôm nay** là `[file:line_start-line_end]`,
không phải `#anchor`. `AC-2.3` của M13 nói đúng điều đó.

### 4.2 · C3 chưa làm — heading không có `id`

```
multiwindow.inline.ts:244-248   md(): h = d.match(/^(#{1,4})\s+(.*)$/)
                                      ra.push(`<h${c}>` + inline(h[2]) + `</h${c}>`)   ← KHÔNG id
web/site/index.html             15 thẻ <h2>/<h3> · 3 có id — cả 3 là id hộp thoại
                                (dlg-tieu · hoi-tieu · dlg-sua-tieu), không phải heading bài
```

`M03/backlog.md:7` **đã có ô** *"C3 phải sinh `id` trên heading, khớp `anchor` của
M13 — cổng đối chiếu **BA bản** (`anchor_py` ↔ `slugGoiY` ↔ `id` trong HTML)"*.
Mở 2026-09-02, **chưa tick**, **chưa có task** (`07_plan/M03_web/tasks` grep
`C3\|anchor` ⇒ 0 task đúng nghĩa).

⇒ Với mệnh đề "web gọi M13": kết quả tìm trả về `file#anchor` **bấm không tới đâu**
cho tới khi C3 xong. `M13/ui_flow §4` đã nói *"cho tới lúc đó địa chỉ là **chữ**,
không phải link"*.

---

## 5 · Fact — bốn chỗ bảng khai / mã lệch spec

### 5.1 · `can_key_model: true` cho `truyhoi`

`dich-vu.json` `$comment_key_model`: *"`can_key_model` quyết định biến môi trường nào
được truyền cho tiến trình. Chỉ THỢ nhận key."* — nó quyết theo **vùng**, không theo
**nhu cầu**. `M13-R5`: *"0 lời gọi mạng; mọi phép tính chạy trên SQLite local"*.
⇒ M13 được phát khoá model mà **không có lý do dùng**. Không phải lỗ an ninh hôm nay
(tiến trình không gọi ra), nhưng nó là chỗ *"có khoá trong env"* và *"không được gọi
ra"* sống cạnh nhau — và cổng `M13-R5` đo **mã**, không đo **env**.

### 5.2 · HAI `chuan_hoa()` trong một repo

```
chungcat/src/verify.py:55    def chuan_hoa(s):  NFKC → ligature → nháy/gạch → nối gạch-cuối-dòng
                                                → nén khoảng trắng → casefold
M13 spec §3                  chuan_hoa(s):      NFC → lower → đ→d → chèn cách quanh MỖI chữ Hán → gom space
```

Cùng tên. **Khác mục đích** (so khớp quote ↔ chuẩn hoá để index). **Khác NFKC/NFC**,
khác `đ→d` (M12 không có), khác chèn cách Hán (M12 không có). `M13-R1` viết
*"`chuan_hoa()` có bản thứ hai ⇒ đỏ"* — và bản thứ hai **đã tồn tại trước**, ở module
khác, dưới đúng tên đó. Một `from chungcat.src.verify import chuan_hoa` trong `truyhoi/`
là lỗi **im lặng** kiểu đúng M13-R1 mô tả: *"hệ không báo lỗi, nó chỉ trả ít kết quả
hơn"*.

### 5.3 · Dải Hán vẫn hardcode, ở M12

```
chungcat/src/dinh_tuyen.py:24-33   _DAI_HAN = ((0x3400,0x4DBF),(0x4E00,0x9FFF),(0xF900,0xFAFF),(0x20000,0x2A6DF))
                                    # "M13 định nghĩa; M12 đọc". M13 chưa tồn tại, nên dải nằm TẠM ở đây
                                    # và phải chuyển sang bảng khai chung khi M13 dựng.
```

`M13 AC-3.4` đòi *"dải Hán đọc từ **một bảng khai**"*; `M12 spec §4.2` đòi *"dùng đúng
dải Hán của `chuan_hoa()` (M13)"*. Bảng khai đó **chưa có** (`core/assets` · `chungcat/assets`
grep `4E00|CJK` ⇒ 0 file JSON). Hôm nay M12 chạy trên bản tạm; M13 dựng xong mà không
dời thì đúng *"hai regex"* mà `model_flow §4` cảnh báo.

### 5.4 · Nguyên liệu: M13 chỉ thấy `than`

| loại | `than` | nội dung thật | M13 index được gì |
|---|---|---|---|
| bài viết (`phan-tich`) | thân theo khung 5 mục | = `than` | **đủ** |
| tài liệu (`thu-vien`) | ≤ 400 từ (`tran_tu_thu_vien`) — ghi chú | byte PDF trong `media` | **chỉ ghi chú** |
| video (`thu-vien`) | ≤ 400 từ | transcript `.vtt` trong `media` (`la_dan_xuat=1`, `kieu_moc`) | **chỉ ghi chú** |

Đo thêm:
- `chungcat/src/*.py` grep `pdfplumber|extract_text|_media` ⇒ **0** dùng thật (dep có
  trong `pyproject.toml:31`, mã không gọi). `_doc_nguon()` trả
  `[{"neo": f"{slug}:p.1", "text": than}]` — **PDF không được trích text ở đâu trong hệ**.
  Nên `slug:p.7` (dạng `slug-trang`) hôm nay không có nguồn nào sinh ra được.
- Transcript **có đường lấy**: `GET /api/articles/media/<sha>` trả byte + 6 đầu đề,
  và `GET /api/articles/<type>/<slug>` trả `frontmatter.media[]` (sha + mime `text/vtt`).
  `chungcat/src/vtt.py:doc_cue()` **đã** parse cue `{tu, den, text}`.
- `M13 spec.md` + `data_flow.md` grep `media|transcript|.vtt|PDF` ⇒ chỉ một dòng
  *"KHÔNG chạm bảng `media`"* (`data_flow §3`). Tức M13 **cố ý** không đọc hiện vật.

⇒ **Với kho hôm nay (3 bài: 1 bài viết · 1 tài liệu · 1 video), M13 index được đúng
1/3 nội dung.** Luật *"ba module tách biệt"* (`rule.md` 2) đang làm RAG **mù hai
module**.

---

## 6 · Fact — M13 hiện ở đâu trên UI, và hứa gì với người dùng

### 6.1 · Wireframe riêng đã bị bác; M13 len vào màn có sẵn

`SCR-08 · Tra cứu kho (M13)` — **SUPERSEDED** (*"dịch vụ không có màn riêng, UI ghép
vào màn đã có"*, Z7). Bản thay: `ma-tran-module-man.md` + `SCR-12`. Cột M13 của ma trận:

| màn | M13 góp gì | trạng thái mã |
|---|---|---|
| cửa sổ đọc — rail phải | kết quả hỏi kèm chip trích dẫn bấm-nhảy-về-đoạn | rail chưa dựng; prototype **hardcode** `pv-so = "1 bản ghi"` (`cua-so-doc.html:271`) |
| cửa sổ đọc — **Ctrl+F** | nâng cấp *"tìm-hoặc-hỏi"* (mẫu Arc Max), giữ nhánh tìm chữ | **chưa có** handler (`grep ctrlKey` ⇒ chỉ Ctrl+Enter ở form) |
| danh sách Bài viết · Tài liệu · Video | hover thẻ → popover tóm tắt **đã chưng sẵn** | thuộc M12 output, không phải truy hồi |
| Kho | facet = phạm vi truy hồi | facet **đã có** (`TANG = cat·loai·cpt·pl·nguon`) |
| Dashboard | đếm truy vấn 0-kết-quả (tín hiệu điểm rẽ, `AC-7.1`) | chưa |

Trang quản lý [Q]: `rule.md` 5 + `T03-97` chốt **`/hoi-kho/`** = *"M13+M14 hỏi kho:
chat + lịch sử phiên"*. `man-hinh.json` **chưa có** — đúng luật `$comment_chi_khai_man_da_dung`
(*"vào bảng cùng lượt dựng màn"*), không phải thiếu.

### 6.2 · PRD đã hứa tìm toàn văn — từ đợt MỘT

`prd.md` **U6 · Tra cứu**: *"Từ khóa | **full-text trên tít, one_liner, thân bài**"*.
`spec_overview:316-317` gán U6 cho **M02 + M03**. `gap_analysis G-8`: *"Ô tìm kiếm FE
là `boDau(the.textContent).includes(tim)` — lọc chuỗi trên DOM **đã render**, không
phải retrieval"*. Đo hôm nay: `#q` → `TIM` → `apLoc()` — vẫn lọc thẻ.

⇒ **Mệnh đề "web gọi M13 để tìm" không mở phạm vi mới. Nó trả nợ U6** — một lời hứa
PRD đợt một chưa có module nào gánh bằng cơ chế thật. Chỉ **chủ** đổi: từ M03 tự lọc
DOM sang M03 gọi M13.

### 6.3 · Hai nhịp, hai đường — và chỗ `model_flow §3` sợ

`M13/model_flow §3` vẽ ❌ `web → M13` với lý do: *"nếu web gọi thẳng M13 thì logic
**hỏi-đáp** mọc vào web"*. Lý do đó đúng cho **hỏi-đáp** (ghép đoạn thành câu trả lời
= việc của M14). Nó **không** áp cho **tìm** (trả danh sách đoạn + địa chỉ, không ghép
gì). `ma-tran §1` đã tách đúng thế: Ctrl+F *"tìm-**hoặc**-hỏi"* — hai nhánh, hai đích.

⇒ **suy luận**: web gọi M13 trực tiếp cho **tìm** (U6), gọi M14 cho **hỏi** (U10), và
M14 gọi M13. Ba mũi tên, không mũi tên nào làm logic hỏi-đáp mọc vào web. Điều thiếu
là **ADR-05 phải nói ra** web được gọi M13 — hôm nay luật 2 cho phép (web là client),
nhưng `model_flow §3` của M13 cấm. **Hai artifact G4 và G6A nói ngược nhau về cùng
một mũi tên.**

---

## 7 · Suy luận — M13 là NỀN cho ai, và mỗi người cần gì

| khách | cần từ M13 | có trong hợp đồng hôm nay? | mở ở đâu |
|---|---|---|---|
| **M14** hỏi-đáp | đoạn + `doc_id` + `anchor` + `body` đầy đủ + `so_ban_ghi` + nhận `nguon[]` | **một nửa** — thiếu `doc_id`, `nguon[]` trong request (§3) | FR M13 |
| **web** tìm toàn văn (U6) | đoạn + địa chỉ **bấm được** + số bản ghi trong phạm vi + `k` | G5 sample có, nhưng địa chỉ chưa bấm được (§4) | ADR-05 nói ra + C3 |
| **M19** bài học / khoá học | *"tập nguồn CÓ TÊN và CÓ THỨ TỰ"* (`FR-048 §4`) → M13 nhận tập đó làm `nguon[]` | `AC-5.3` **đã giữ chỗ** — đúng | không mở gì; M19 chờ FR mở phạm vi |
| **M12** `tong-hop-chu-de` | gợi `nguon[]` cho một chủ đề (*"kho có bài nào về X?"*) — hôm nay người gõ tay | không | FR M12 §2, **sau** khi M13 chạy |
| **M16** artifact | `@bài-khác` trong chat (`ui-embed-matrix:74`) — thực chất là M14 | qua M14 | không mở gì |
| **M07** gộp concept | **không** — đó là đo *tương đồng*, FTS5 không làm; và M07 spec nói *"quyết định là của người"* | — | không |
| **M05/M08** chống trùng theo nội dung | **không** — cùng lý do; `url_normalized` đủ cho đợt này | — | không |

**Ba khách đầu dùng CÙNG MỘT phép tìm** với người gọi khác — rẻ. Hai khách cuối là
**phép đo khác** (tương đồng) và đúng là *điểm rẽ vector* mà `§7` bảo chờ tín hiệu.

**Điều "M13 là nền" đổi ngay ở s7** — không phải thêm tính năng, mà là **ba tính chất
hợp đồng**:

1. **Người gọi là tham số**, không phải hằng (`X-Khoa-Loi` của M12 giả định người gọi
   = LÕI; M13 có ≥2 loại người gọi ngay lượt đầu: web và M14).
2. **Khoá nhận diện là của bảng khai** (`cua.json`-style), không của một biến gõ tay.
3. **Response mang đủ ba khoá**: `doc_id` (slug) · địa chỉ phân giải được hôm nay
   (`file:A-B`) · địa chỉ sẽ bấm được (`file#anchor`) — để client nào cũng chọn được
   thứ nó cần mà M13 không đổi.

---

## 8 · Giả định phải CHỐT trước s7 — mỗi cái một câu, và chốt sai mất gì

| # | câu | lựa chọn | tôi nghiêng | chốt sai mất gì |
|---|---|---|---|---|
| **G1** | THỢ có được gọi THỢ không? (M14→M13, và về sau M12/M16→M13) | (a) cấm — mọi lời gọi qua LÕI, M14 hỏi M13 qua `web` · (b) cho, **có luật**: THỢ→THỢ chỉ với khoá riêng chiều đó + allowlist cặp `(từ, tới)` trong `dich-vu.json` + cổng Z9 · (c) để nguyên | **(b)** — (a) làm LÕI thành proxy cho mọi truy hồi, tức LÕI gánh tải hỏi-đáp; (c) là hôm nay: luật 2 nói không, spec nói có, máy không đo | mỗi khách mới của M13 là một ngoại lệ trong đầu người |
| **G2** | Ai giải `bot → tập doc_id`? | M14 (`AC-8.4` một chokepoint **ở M14**) rồi truyền `nguon[]` xuống · hay M13 nhận `bot` và tự giải | **M14 giải, M13 nhận `nguon[]`** — đúng `AC-8.4`/`8.5` đã chốt; M13 giữ **một** trục (lọc), không mọc trục quyền | hai chỗ giải cùng câu hỏi ⇒ lệch — đúng lớp `check_danh_muc` đỏ |
| **G3** | Địa chỉ M13 trả về là gì? | `file#anchor` (chưa phân giải được) · `file:A-B` (phân giải được hôm nay) · **cả hai** | **cả hai** + thêm dạng `#anchor` vào `dia-chi.json` (FR tới M01) | M14 trích địa chỉ *"phân giải được"* mà `dia-chi.json` không biết dạng đó |
| **G4** | M13 có index hiện vật (transcript · PDF) không? | (a) không — chỉ `than`, chấp nhận RAG mù tài liệu/video · (b) **có**, đọc `.vtt` qua `GET /api/articles/media/<sha>` (cue → chunk, neo = mốc) và PDF text **do M12 sinh** thành hiện vật `la_dan_xuat` `text/plain` (M13 không tự trích) | **(b)** — và **M12 sinh text, M13 chỉ đọc**: giữ M13 0-egress, 0 dep PDF; một chỗ trích, hai chỗ dùng | với 3 bài hôm nay RAG trả lời được về **1** |
| **G5** | `chuan_hoa` — một tên hay hai? | đổi tên bản M12 (`chuan_hoa_quote`) · đổi tên bản M13 (`chuan_hoa_tim`) · để nguyên | **đổi tên bản M13** — bản M12 đã có 23 cổng xanh trỏ vào nó; và tên mới nói đúng việc | `M13-R1` đỏ ở dòng `import` đầu, hoặc tệ hơn: xanh vì import nhầm |
| **G6** | Bảng khai dải Hán ở đâu? | `core/assets/dai-han.json` (M01 sở hữu — cùng chỗ `dia-chi.json`, cả M12/M13 đọc) · `chungcat/assets/` · `truyhoi/assets/` | **`core/assets/`** — hai THỢ đọc một file ở LÕI, không THỢ nào sở hữu luật của THỢ kia | hai regex, một tài liệu index kiểu này định tuyến kiểu khác |
| **G7** | `truyhoi.can_key_model` | `false` | **`false`** — và cổng: `can_key_model: true` mà module có rule *"0 lời gọi mạng"* ⇒ đỏ | không mất gì hôm nay; là chỗ sau này ai thêm embedding API "vì khoá đã có" |
| **G8** | Golden set 4 ca Trung lấy đâu? | nạp ≥2 bài phồn thể **trước** s8 · fixture bịa | **nạp trước** — `gap_analysis G-8` đã nói *"truy hồi trên 3 bản ghi là xây một phép đo không có gì để đo"* | `AC-6.1` xanh trên fixture, đỏ lần đầu gặp bài thật |
| **G9** | Hợp đồng API: một hình dạng cho mọi client? | hợp nhất `model_flow` ↔ G5 ↔ M14 thành **một** schema; bump `truyhoi.sample.v3` | **có** — request `{cau_hoi, pham_vi, nguon[]?, k}` · response `{ket_qua:[{doc_id, file, anchor, line_start, line_end, heading_path, body, bm25}], so_ban_ghi_trong_pham_vi, tong}`; bỏ `chunk_id` (rowid không ổn định) | s8 M13 và s8 M14 chọn hai hình dạng, tích hợp đỏ lần đầu |

**G1 là câu quyết định cả kiến trúc**, và nó **không phải của M13** — nó là ADR.

---

## 9 · Gap analysis — thiếu gì để "M13 là nền" đứng được, và ai gánh

| # | thiếu | tầng | hình dạng việc |
|---|---|---|---|
| 1 | luật **THỢ→THỢ** (G1) + cổng **Z9** cưỡng chế + đính chính `ADR-05` luật 2 (*"web là client duy nhất"* → *"web là client duy nhất **từ ngoài vùng THỢ**"* hoặc cấm hẳn) | G4 | **ADR-08** (hoặc đính chính ADR-05, cùng khuôn đính chính 2026-08-31 đã có) + task cổng ở M04 |
| 2 | **một** hợp đồng API M13 (G9) — `doc_id` · `nguon[]` · bỏ `chunk_id` · thêm `GET /health` · `GET /trang-thai` (`AC-1.2` lệch kho) · `POST /chi-muc/dung-lai` (`AC-1.1` dựng lại) | G5 + G6A | **FR tới M13** (spec/model_flow frozen) + `truyhoi.sample.v3` |
| 3 | dạng địa chỉ **`file#anchor`** vào `dia-chi.json` (G3) | G6A M01 | **FR tới M01** — `dia-chi.json` **không** trong `FROZEN.lock` (đo: grep ⇒ 0), nhưng nó là **bảng khai của B-A5** mà `validate.py` + M13 + M14 cùng đọc ⇒ vẫn đi FR, không sửa tay |
| 4 | **C3** sinh `id` heading + cổng đối chiếu **ba bản** | s8 M03 | task M03 — ô đã có ở `M03/backlog.md:7`, chưa có task |
| 5 | M13 đọc **hiện vật** `.vtt` qua API; M12 sinh **text PDF** thành hiện vật dẫn xuất (G4) | G6A M13 + M12 | FR tới M13 (`data_flow §3` hiện cấm chạm `media`) + FR tới M12 (`§1 Vào`) |
| 6 | đổi tên `chuan_hoa` M13 (G5) · bảng khai dải Hán ở `core/assets/` (G6) · `can_key_model: false` (G7) | bảng khai / mã | ba việc nhỏ, **không frozen** — làm ngay lượt đầu s7 |
| 7 | web tìm toàn văn = **M03 gọi M13** (U6) — cửa LÕI→THỢ mới trong `tho-cua.mjs` (hôm nay 5 cửa, **cả 5 gõ cứng `chungcat`**: `gocTho()` tìm `thu_muc === "chungcat"`) | s8 M03/M08 | task M08: tổng quát `gocTho(ten)` — đọc cổng theo tên dịch vụ từ `dich-vu.json`, không gõ tên |
| 8 | nạp ≥2 bài **tiếng Trung phồn thể** (G8) | dữ liệu | việc của người, **trước** s8 |
| 9 | `07_plan/M13_truyhoi/` **chưa có** | s7 | s7 chỉ nên chạy **sau** 1–3 và 6 |

**Thứ tự đề nghị**: 6 (rẻ, không frozen) → 1 (ADR — mở khoá mọi thứ) → 2+3 (FR) →
8 (dữ liệu) → s7 M13 → 4+7 (M03/M08, song song s8 M13) → 5 (sau khi M13 chạy 1 đường).

---

## 10 · Cái khảo này KHÔNG kết luận

- **Không** chọn vector/hybrid — `§7` của spec đúng: chờ tín hiệu vận hành; SQLite
  3.50.4 + `FULL OUTER JOIN` đã đo chạy, không có gì phải chuẩn bị thêm.
- **Không** quyết `w_title` — phải **đo** (`AC-4.2`), hai số (vi/en · zh).
- **Không** quyết phồn/giản thể fold (OpenCC) — `research_summary §13.1` khai *"chưa
  làm, chưa đo"*; kho có 0 bài Trung nên chưa đo được.
- **Không** đề xuất M13 tự trích PDF — giữ M13 **0 dep nặng, 0 egress**; trích là
  việc của M12 (đã khai `pdfplumber`, chưa dùng).
- **Không** mở lại anchor unicode vs ASCII — `decisions.md` 2026-09-01 đã chốt bằng
  số đo (*"0/5 tên file ngoài ASCII"*).

---

## Nguồn (tất cả nội bộ, đo 2026-09-07)

`06_modules/M13_truyhoi/{spec,rules,model_flow,data_flow,ui_flow,workflow,testcases,backlog}.md` ·
`06_modules/M14_chatbot/{spec,model_flow,data_flow,ui_flow,testcases}.md` ·
`06_modules/M12_chungcat/spec.md` · `04_system/adr.md#ADR-05` (+ bổ sung 2026-08-31, đính chính) ·
`04_system/security_baseline.md §4b.1` · `04_system/build_order.md` · `03_docs/spec_overview.md` ·
`03_docs/prd.md U6 U10` · `03_docs/brd.md B-A5 B-A6 B-C2` · `02_proposal/proposal-2 §4 M7` ·
`05_uiux/contracts/truyhoi.sample.v2.json` · `chatbot.sample.v2.json` · `05_uiux/ma-tran-module-man.md` ·
`05_uiux/wireframes/SCR-08 SCR-12` · `05_uiux/prototype/dot-hai/cua-so-doc.html` ·
`core/assets/{dich-vu,dia-chi,man-hinh,loai-nguon}.json` · `core/assets/kho.schema.sql` (bảng `media`, `loai_nguon`) ·
`core/tests/check_ba.py` · `chungcat/src/{api,worker,verify,dinh_tuyen,vtt,asr_cua}.py` · `chungcat/assets/cua.json` ·
`web/api/{tho-cua,loi-cua,dungchung,articles,router}.mjs` · `web/plugins/multiwindow/src/scripts/multiwindow.inline.ts` ·
`web/site/index.html` · `memory/decisions.md` 2026-09-01 · `.factory/fr/FR-044 FR-047 FR-048 FR-054 FR-067` ·
`01_research/{research_summary §3.1 §6 §9 §10 §11 §12 §13 §14, ref-impl-m13-m14-scan, m12-m16-services-scan, chatbot-pham-vi-tri-thuc, ui-embed-matrix-scan, gap_analysis G-8}.md` ·
`07_plan/M03_web/tasks/T03-90 T03-97 T03-98 T03-110` · `.claude/rule.md` 2 5 9
