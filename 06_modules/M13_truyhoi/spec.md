# M13_truyhoi — spec

> **Vùng THỢ.** Chỉ mục trên kho → đoạn liên quan **kèm địa chỉ**.
> Nguồn: `spec_overview.md#M13_truyhoi` · `research_summary.md` §11 (M13), §13.1 ·
> `memory/decisions.md` 2026-09-01 · `core/assets/dia-chi.json`.
>
> ⚠️ **Mọi `cmd` dưới đây trỏ vào lệnh CHƯA TỒN TẠI** — `truyhoi/` chưa có dòng mã
> nào. `hard` nói *"AC này kiểm được bằng máy"*, không nói *"đã kiểm"*. Dựng đúng
> những lệnh đó là sản phẩm bàn giao của s8.
>
> **Áp `FR-072` + `FR-073` 2026-09-09** (chủ dự án duyệt): **một** hợp đồng API cho
> **mọi** client thay ba hình dạng đang lệch · `doc_id` = slug và `dia_chi` phân giải
> được hôm nay · `nguon[]` là khoá **bắt buộc** trong request · M13 **đọc** hiện vật
> văn bản (`.vtt` · `.srt` · `.md`) qua API của LÕI · người gọi đọc từ `goi_duoc`
> (`ADR-08` Z9) thay vì *"M14 là khách hàng duy nhất"* · dạng địa chỉ `file-anchor`
> vào `dia-chi.json`. Sáu chỗ đó trước đây làm `AC-5.3` không cài đúng được (tham số
> `nguon` mà bên nhận không khai), làm `AC-2.3` trỏ một dạng địa chỉ **bảng khai không
> biết**, và làm 2/3 loại nội dung trong kho **vô hình với truy hồi**.
>
> Ba quyết định kèm theo **không** thuộc § nào của hai FR trên, ghi nguồn đúng chỗ:
> tên hàm `chuan_hoa_tim` *(chốt PM 2026-09-09 · `research_summary` §5.2)* · `pham_vi`
> dành sẵn khoá `space` *(chốt PM 2026-09-09 · khảo Space §6)* · vế tiếng Trung của
> `AC-6.1` nhận **phồn thể hoặc giản thể** *(chủ dự án 2026-09-09 — nới một chữ của
> `FR-072` §5)*.

## 1 · Vai, và một câu quyết định cả module

Chỉ mục là **DỮ LIỆU DẪN XUẤT** — dựng lại được từ kho, không phải chân lý (cùng
nguyên tắc `B-C1`). **Mất chỉ mục không mất gì.**

Câu đó không phải lời an ủi, nó là **quyền thiết kế**: được xoá sạch và dựng lại
bất cứ lúc nào, nên không cần migration, không cần backup, và một chỉ mục lệch
kho là **bug đo được** chứ không phải "trạng thái cần hoà giải".

**Vào**: `ban_ghi` (chỉ đọc, qua API của LÕI) · **hiện vật văn bản** của bản ghi
(`.vtt` · `.srt` · `.md` · `.txt`, cũng **chỉ đọc, qua API của LÕI** — `FR-072 §1.3`)
· câu hỏi · phạm vi facet · **tập nguồn** (`nguon[]`)
**Ra**: `{ket_qua[], so_ban_ghi_trong_pham_vi, tong}` — **không** trả trình bày

### 1a · MỘT hợp đồng cho MỌI client *(FR-072 §1.1)*

⚠️ **`FR-072` §0 · hợp đồng này trước đây tồn tại ở BA chỗ, BA hình dạng.** Bản
trước của mục này viết *"danh sách `{đoạn, địa_chỉ, điểm}`"*; `model_flow §2` viết
`{doan[], so_ban_ghi_trong_pham_vi}`; `truyhoi.sample.v2` (G5) viết
`{q, ket_qua[{chunk_id, bm25, snippet}], tong}`; còn `M14/data_flow §2` đòi `doc_id`
— một chữ **không xuất hiện lần nào** trong spec này. Đo 2026-09-07: `grep doc_id`
trên `spec.md` + `model_flow.md` + `data_flow.md` ⇒ **0**. Ba hình dạng cho một cửa
nghĩa là s8 chọn một, hai bên kia **lệch im lặng**.

```
POST /truy-hoi
  { "cau_hoi": "…",                       # bắt buộc
    "pham_vi": {"pl":[…], "nguon":[…], "cat":[…], "cpt":[…], "space":"mac-dinh"},
    "nguon":   ["slug", …] | null,        # BẮT BUỘC có khoá; null = cả kho
    "k":       20 }                       # bắt buộc, không mặc định trong mã
→ 200
  { "ket_qua": [ {"doc_id", "file", "anchor", "line_start", "line_end", "dia_chi",
                  "heading_path", "body", "nguon_van_ban", "bm25"} ],
    "so_ban_ghi_trong_pham_vi": 2, "tong": 2 }
```

Hình dạng đầy đủ + giá trị mẫu: `05_uiux/contracts/truyhoi.sample.v3.json`. Bốn điều
đổi so với ba bản cũ, mỗi điều một lý do đo được:

| đổi | vì |
|---|---|
| bỏ `chunk_id` | nó là `rowid` — đổi mỗi lần dựng lại chỉ mục (chỉ mục là **dẫn xuất**). Client giữ nó là giữ một con trỏ hụt |
| thêm `doc_id` = slug | `M14/data_flow §2` đã khoá `citations[].doc_id` là slug; M13 không đổi được khách của mình |
| thêm `dia_chi` | dạng **duy nhất phân giải được hôm nay** (`file-dong` cho `than`, `slug-moc` cho cue transcript); `#anchor` chờ `FR-073` + C3 |
| `pham_vi` dùng đúng khoá `TANG` của FE | G5 sample dùng `phan_loai`, FE dùng `pl`. Hai bộ tên cho một facet là hai chỗ lệch, và một bảng đổi tên là chỗ thứ ba |

**Hai chữ `nguon`, hai trục — đọc kỹ chỗ này.** `pham_vi.nguon` là **facet loại
nguồn** (`pdf` · `youtube` · `tai-len`), lọc **lúc hỏi**. `nguon` ở **gốc** payload là
**tập nguồn Knowledge** — danh sách slug gắn vào một con bot, do **M14** giải từ `bot`
rồi truyền xuống (`M14 AC-8.4`/`AC-8.5` nguyên vẹn: M13 **không** mọc trục quyền).
Cùng kiểu dữ liệu, khác trục. `FR-072 §1.1` đã duyệt cả hai tên nên lượt này **không
đổi tên** — ô `backlog.md` mở để theo dõi.

**Khoá `space` dành sẵn** *(chốt PM 2026-09-09 · chủ dự án duyệt)*: nhận và validate
được từ ngày đầu, nhưng cột `space` trong view `ban_ghi` chỉ tồn tại sau `FR-080` ⇒
tới lúc đó mọi bản ghi coi như `mac-dinh`, và vế *"đổi space thì tập ứng viên đổi"*
**chưa đo được**. Dành sẵn để đợt Space không phải mở lại một spec đã ký.

> **AC-1.6** *(mới · `FR-072` §1.2)* · Người gọi đọc từ `goi_duoc` của `truyhoi`
> trong `core/assets/dich-vu.json`, **bên NHẬN cưỡng chế** (`ADR-08` Z9): dịch vụ
> ngoài mảng ⇒ **403** · `x-aud` khác `truyhoi` ⇒ **403** · thiếu khoá chiều ⇒ **403**.
> Hôm nay `goi_duoc = ["web", "chatbot"]`; thêm khách sau = **một phần tử** vào mảng
> + một khoá, **không** sửa mã.
> `hard` · `cmd: python truyhoi/tests/check_ai_goi_vao.py`

> **AC-1.1** · Xoá sạch `truyhoi/index.sqlite` rồi dựng lại ⇒ cùng một tập
> `(file, anchor, line_start, line_end, checksum)`, từng dòng.
> `hard` · `cmd: python truyhoi/tests/check_dung_lai_duoc.py`

> **AC-1.2** · Chỉ mục lệch kho **báo được**: sửa một bài rồi chưa re-index ⇒ cổng
> nêu đúng slug lệch, không im lặng trả kết quả cũ.
> `hard` · `cmd: python truyhoi/tests/check_lech_kho_bao_duoc.py`

> **AC-1.3** · M13 **không ghi** vào `kb/**` và không mở `kb/_kho.sqlite`.
> `hard` · `cmd: python truyhoi/tests/check_khong_cham_kho.py`

## 2 · Chunk theo heading — địa chỉ sinh ra miễn phí

Mỗi `##`/`###` là **một chunk**, mang `{file, heading_path, anchor, line_start,
line_end, facet}`. Số dòng lấy được **miễn phí lúc parse**, và nó **chính là** địa
chỉ bấm được — không phải một tầng thêm.

Bảng thường giữ TOÀN BỘ metadata; FTS chỉ index cột cần tìm (mẫu external content):

```sql
CREATE TABLE chunks(
  id INTEGER PRIMARY KEY, file TEXT, heading TEXT, anchor TEXT,
  line_start INTEGER, line_end INTEGER, title TEXT, body TEXT,
  tim TEXT,                      -- body sau chuan_hoa(), CHỈ để tìm
  checksum TEXT);
CREATE VIRTUAL TABLE chunks_fts USING fts5(
  title, tim, content=chunks, content_rowid=id,
  tokenize='unicode61 remove_diacritics 2');
```

**Bỏ `porter`** của `zk` — stemming tiếng Anh, phá tiếng Việt.

> **AC-2.1** · Anchor sinh bằng **ASCII-fold**, dùng lại đúng luật `slugGoiY()`:
> `NFD` → bỏ dấu → `đ`→`d` → `[^a-z0-9]+`→`-` → cắt 60. `## Hướng dẫn cài đặt`
> ⇒ `#huong-dan-cai-dat`.
> `hard` · `cmd: python truyhoi/tests/check_anchor_mot_luat.py`

> **AC-2.2** · Anchor của M13 **khớp từng ký tự** với `slugGoiY()` của FE
> (`multiwindow.inline.ts:1015-1021`) trên **50 heading lấy từ kho thật**. Hai bản
> lệch ⇒ đỏ, **nêu heading nào**.
> `hard` · `cmd: python truyhoi/tests/check_anchor_mot_luat.py`

⚠️ **Bản đầu của AC này KHÔNG viết nổi testcase**, và phép thử s6 bắt được:
nó nói *"khớp với anchor renderer M03 sinh"*, nhưng đo 2026-09-02 —
`grep -rn anchor web/render/ web/plugins/` ⇒ **0**, và `<h2>`/`<h3>` trong site đã
build **không có `id`**. **M03 chưa sinh anchor nào**, nên không có gì để so.
Nặng hơn: **cả sơ đồ địa chỉ `file#anchor` chưa có người tiêu thụ** — M13 sẽ sinh
anchor trỏ vào HTML không có `id` tương ứng, và đó đúng là việc **C3**.
Nên AC này nay đo thứ **tồn tại hôm nay** (hai bản luật slug); vế *khớp với anchor
M03 render ra* là **AC của C3**, ghi ở `backlog.md`.

> **AC-2.3** · `line_end` của mỗi chunk ≤ số dòng thật của file; và
> `[file:line_start-line_end]` phân giải được bằng `core/assets/dia-chi.json`.
> **Vế thêm** (`FR-072` §1.1 · `FR-073` §1): trường `dia_chi` trả về phải khớp **một
> dạng đã khai** trong bảng ấy — `file-dong` cho chunk từ `than` và từ `.md`/`.txt`,
> `slug-moc` cho chunk từ cue transcript. Dạng `file-anchor` (`FR-073`) **nhận dạng và
> phân giải trên file** được sau khi `T01-51` áp, nhưng **bấm chưa tới đâu** cho tới
> khi C3 sinh `id` trên heading — `ui_flow §4` nói đúng điều đó.
> `hard` · `cmd: python truyhoi/tests/check_dia_chi_phan_giai.py`

> **AC-2.4** · Re-index tăng dần: `mtime` khác → tính `sha256` → khác `checksum` ⇒
> **một** transaction `DELETE theo file` + `INSERT`. File không đổi ⇒ 0 ghi.
> `hard` · `cmd: python truyhoi/tests/check_reindex_tang_dan.py`

### 2a · Hiện vật văn bản cũng là nguyên liệu *(FR-072 §1.3)*

⚠️ **`FR-072` §1.3 · M13 ĐỌC hiện vật văn bản.** Bản trước của spec này chỉ index
`than`, và `data_flow §3` cấm chạm bảng `media`. Lý do cấm (*"byte không dựng lại
được"*) **đúng cho GHI, không đúng cho ĐỌC**. Đo 2026-09-07: tài liệu có `than` ≤ 400
từ (chỉ là ghi chú), PDF **không được trích text ở đâu trong hệ**, transcript `.vtt`
**có** trong `media` (`la_dan_xuat=1`) nhưng spec + `data_flow` **0 lần** nhắc tới ⇒
với kho hôm nay, truy hồi **mù 2/3 loại nội dung**.

| nguồn văn bản | lấy qua | đơn vị chunk | neo |
|---|---|---|---|
| `than` (mọi bản ghi) | `GET /api/index` (đã có) | `##`/`###` | `file:A-B` |
| transcript `text/vtt` | `GET /api/xuat/<slug>/txt` (cửa xuất `T08-33`, **đã có**) hoặc `GET /api/articles/media/<sha>` | **cue** `{tu, den, text}` | `slug:t=mm:ss` |
| `.srt` người tải | cùng cửa `media`; `srt → cue` là **một** hàm nhỏ (đảo của `vttSangSrt`) | cue | `slug:t=` |
| `.md` / `.txt` người tải | `GET /api/articles/media/<sha>` | `##`/`###` như `than` | `file:A-B` |
| **PDF** | **không** — text PDF là nợ của M12 (`FR-079`) | — | — |

Ba tính chất của lựa chọn này: **một chữ** — `xuat-cua.mjs` đã biến `.vtt` → `.txt`,
M13 đọc **đúng bản người tải xuống** nên chỉ mục và bản người thấy không lệch, không
có phép chuyển đổi thứ hai; **0 egress, 0 dep nặng** — mọi thứ là HTTP tới
`127.0.0.1:8787`, `M13-R3`/`R5` nguyên vẹn; **`nguon_van_ban` đi theo kết quả** nên
M14 và người đọc **thấy** một đoạn đến từ transcript ASR (`FR-054 §1.4`: chữ
*verified* đổi nghĩa ở đó), không phải một câu của bài viết.

> **AC-2.5** *(mới · `FR-072` §1.3)* · Chunk từ `text/vtt`/`.srt` cắt theo **cue**,
> neo `slug:t=mm:ss` nằm **trong thời lượng thật**; ba khoá neo dòng (`anchor` ·
> `line_start` · `line_end`) mang giá trị `null` **tường minh**, không phải khoá vắng
> *(chốt PM 2026-09-09 · chủ dự án duyệt — 0 khoá mới ⇒ 0 đổi hợp đồng)*. Chunk từ
> `.md`/`.txt` cắt theo `##`/`###` và **có** ba khoá đó.
> `hard` · `cmd: python truyhoi/tests/check_chunk_hien_vat.py`

> **AC-2.6** *(mới · `FR-072` §1.1)* · `nguon_van_ban` đúng cho **từng** chunk:
> `than` · `hien-vat:text/vtt` · `hien-vat:text/plain`. Một chunk lấy từ hiện vật mà
> khai `than` ⇒ đỏ. Và mọi lần đọc hiện vật là **HTTP**: 0 lần `open()` trỏ
> `kb/_media/**`.
> `hard` · `cmd: python truyhoi/tests/check_chunk_hien_vat.py`

## 3 · Ba thứ tiếng, MỘT tokenizer, MỘT hàm chuẩn hoá

`research_summary` §13.1 — đo trên máy này, không suy từ tài liệu:

| tokenizer | vi có dấu | vi không dấu | `đ` | en | zh 2 chữ | zh 3-4 chữ |
|---|---|---|---|---|---|---|
| `unicode61 remove_diacritics 2` | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| `trigram` | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ |

`unicode61` cắt câu 15 chữ Hán thành **đúng MỘT token** (`fts5vocab` đếm) ⇒ mọi
truy vấn tiếng Trung trả 0. `trigram` cứu được từ ≥3 chữ nhưng chết ở từ **2 chữ**
— độ dài phổ biến nhất — và mất fold dấu tiếng Việt.

**Cách thoát, đã đo 10/10 đúng**: một bảng, một tokenizer, và đẩy hết vào

```
chuan_hoa_tim(s):  NFC → lower → đ→d → chèn dấu cách quanh MỖI chữ Hán → gom space
```

áp cho **cả cột index lẫn query**. Một hàm, hai chỗ dùng — `đ` là loại bug âm thầm
nhất, và nó âm thầm đúng vì hai phía dùng hai hàm.

⚠️ **Tên hàm là `chuan_hoa_tim`, không phải `chuan_hoa`** *(chốt PM 2026-09-09 ·
`research_summary` §5.2)*. Bản trước của mục này gọi nó `chuan_hoa()`; đo 2026-09-07:
`chungcat/src/verify.py:55` **đã có** `def chuan_hoa(s)` với nghĩa **khác** (NFKC ·
ligature · gạch-nối-cuối-dòng · casefold — dùng để so khớp quote, không để tokenize).
Cùng tên hai nghĩa trong một repo là **đúng lớp lỗi mà `M13-R1` mô tả**, và nó sẽ đỏ
ngay ở dòng `import` đầu tiên. Hai hàm khác mục đích thì được phép có hai bản; thứ
**phải** dùng chung là **bảng khai dải Hán**, không phải hàm.

> **AC-3.1** · `chuan_hoa_tim()` là **một** hàm, gọi ở đúng hai chỗ (dựng chỉ mục và
> nhận truy vấn). Bản thứ hai của phép chuẩn hoá ⇒ đỏ. Và `truyhoi/` **không import**
> `chuan_hoa` của `chungcat/` — hai hàm khác nghĩa, import chéo là lỗi im lặng.
> `hard` · `cmd: python truyhoi/tests/check_mot_ham_chuan_hoa.py`

> **AC-3.2** · Bộ 10 truy vấn ba thứ tiếng đúng **10/10**: vi có dấu · vi không
> dấu · `đ` hai chiều · en · zh 1·2·4 chữ · câu **trộn** Việt+Trung.
> `hard` · `cmd: python truyhoi/tests/check_ba_thu_tieng.py`

> **AC-3.3** · `remove_diacritics` là **2**, không phải 1. Đặt `1` ⇒ đỏ, và thông
> báo nêu rõ nó trượt cả `hướng` lẫn `phần`, không chỉ ký tự hai dấu.
> `hard` · `cmd: python truyhoi/tests/check_ba_thu_tieng.py`

> **AC-3.4** · Dải ký tự Hán đọc từ **một bảng khai** — `core/assets/dai-han.json`,
> chủ là **M01** (`T01-51` + `FR-077`) — không gõ regex hai nơi; M12 đọc **cùng file**
> để đếm tỉ lệ định tuyến model (hôm nay nó gõ cứng ở `chungcat/src/dinh_tuyen.py:25`,
> và chính mã đó ghi *"phải chuyển sang bảng khai chung khi M13 dựng"*).
> `hard` · `cmd: python truyhoi/tests/check_mot_ham_chuan_hoa.py`

⚠️ **Chặn: `chuan_hoa()` chưa có bản Python nào.** Đo 2026-09-01: grep
`NFD|unicodedata|combining` trong `core/` + `05_intake/` ⇒ **0**. Hàm này chỉ tồn
tại bằng **JavaScript** (`multiwindow.inline.ts:1015-1021`). Bản Python của M13 sẽ
là bản **thứ hai của một luật** — đúng lớp lỗi đang làm `check_danh_muc` đỏ. Nên
`AC-2.2` và `AC-3.4` **không phải tuỳ chọn**, chúng là điều kiện để bản thứ hai
không trôi.

## 4 · Xếp hạng, và cái snippet KHÔNG dùng được

`ORDER BY bm25(chunks_fts, w_title, 1.0)` — bắt đầu `w_title = 5..10` rồi **đo**.
Đừng chép `1000/500/1` của `zk`: số đó cho *filename-là-tiêu-đề*. **Rank càng ÂM
càng khớp.**

`snippet()` có **trần 64 token** ⇒ chỉ làm **preview**. Bằng chứng trích dẫn phải
lấy `body` đầy đủ qua `rowid`.

> **AC-4.1** · Câu trả lời **không bao giờ** dùng `snippet()` làm bằng chứng trích
> dẫn; đoạn trả về là `body` đầy đủ của chunk.
> `hard` · `cmd: python truyhoi/tests/check_snippet_chi_preview.py`

> **AC-4.2** · `w_title` đọc từ cấu hình, không gõ trong SQL; và có **hai** số đo
> riêng — một cho vi/en, một cho **zh** (token một-chữ cho điểm khác hẳn).
> `hard` · `cmd: python truyhoi/tests/check_w_title_do_rieng.py`

## 5 · Phạm vi facet là control HIỂN THỊ

`B-C2` + nguyên lý ① của NotebookLM: người dùng **thấy** mình đang hỏi trên tập
nào. Faceted = **một** query FTS5 `JOIN … WHERE`, không phải hai lần truy hồi.

> **AC-5.1** · Số bản ghi trong phạm vi được trả về **cùng** kết quả, và nó khớp
> số đếm độc lập trên cùng bộ lọc.
> `hard` · `cmd: python truyhoi/tests/check_pham_vi_hien_thi.py`


> **AC-5.2** · **Không** có top-k ẩn: đổi phạm vi thì tập ứng viên đổi theo, và
> `k` là tham số **người gọi** đưa, không phải hằng trong mã.
> **Vế thêm** (`FR-072` §1.1): `pham_vi` dùng **đúng khoá `TANG`** của FE
> (`cat` · `loai` · `cpt` · `pl` · `nguon`) cộng khoá `space` dành sẵn — **0** bảng
> đổi tên trong mã. Một bảng dịch `phan_loai ↔ pl` là chỗ thứ ba để lệch.
> `hard` · `cmd: python truyhoi/tests/check_pham_vi_hien_thi.py`

> **AC-5.3** · **Tập nguồn là THAM SỐ**, M13 không giả định "cả kho" *(chỉ đạo
> 2026-09-02 — Knowledge của M14)*. Hai trục đứng cạnh nhau: `pham_vi` là bộ lọc
> **lúc hỏi**; tập nguồn là Knowledge **gắn vào bot**, do M14 giải rồi truyền xuống.
> **Vế thêm** (`FR-072` §1.1): `nguon` là **khoá bắt buộc trong payload** —
> `nguon: null` nghĩa cả kho và nó là một giá trị **KHAI**; request **thiếu khoá**
> `nguon` ⇒ **400**, không rơi về cả kho. Bản trước viết *"gọi không nêu tập nguồn ⇒
> mặc định cả kho, tường minh trong mã"*: một mặc định tường minh **trong mã** vẫn là
> một nhánh vắng **trong hợp đồng**, và đó đúng hình dạng `CVE-2026-47713` (vị từ
> WHERE biến mất khi danh tính vắng).
> `hard` · `cmd: python truyhoi/tests/check_tap_nguon_la_tham_so.py`

## 6 · Golden set — expect ĐỊA CHỈ, không expect điểm

`golden.yaml`: `{query, expect_trong_top_k: [file#anchor], k}`.

Expect **địa chỉ**, không expect điểm — điểm đổi khi `w_title` đổi, và một golden
set ghim điểm sẽ đỏ mỗi lần tinh chỉnh xếp hạng, tức nó dạy người ta bỏ qua nó.

Bộ ca dấu tiếng Việt theo 7 ca của Pagefind (có dấu ↔ không dấu **hai chiều** ·
NFC ↔ NFD · riêng ca `đ`/`Đ`), **cộng nhánh tiếng Trung** 1·2·4 chữ + một câu trộn.

> **AC-6.1** · `golden.yaml` phủ đủ **7 ca tiếng Việt**; thiếu một ca ⇒ đỏ, nêu tên
> ca thiếu. Bốn ca tiếng Trung **có trong file** nhưng vế xanh của chúng là `AC-6.3`.
> `hard` · `cmd: python truyhoi/tests/check_golden_du_ca.py`

> **AC-6.2** · Đổi `w_title` **không** làm golden set đỏ (vì nó expect địa chỉ).
> `hard` · `cmd: python truyhoi/tests/check_golden_du_ca.py`

> **AC-6.3** *(mới — tách khỏi `AC-6.1`)* · Bốn ca tiếng Trung của golden set **xanh
> trên kho thật**. Điều kiện lật là **một số**: kho có **≥ 2** bản ghi tiếng Trung
> (đếm bằng dải `core/assets/dai-han.json`), **phồn thể hoặc giản thể đều tính**
> *(chủ dự án 2026-09-09 — nới một chữ của `FR-072` §5)*. Chưa đủ số thì cổng **NÓI
> RA** *"soft — kho có N < 2 bài tiếng Trung, vế zh chưa đo được"* rồi exit 0; nó
> **không** được xanh im lặng.
> `soft` · lật sang `hard` khi số đó đạt

⚠️ **`AC-6.3` là `soft` vì thứ thiếu là NỘI DUNG KHO, không phải mã.** Đo 2026-09-09:
`kb/**` có **0** bản ghi chữ Hán. Khác `AC-2.2` (sửa được vì vế thứ hai — `slugGoiY()`
— có thật), ở đây không fixture nào thay được kho: một cổng zh xanh trên fixture tự
tạo sẽ xanh **mãi mãi** mà không bao giờ nói tiếng Trung có tìm được thật hay không.
`gap_analysis G-8` đã nói đúng chuyện này (*"truy hồi trên 3 bản ghi là xây một phép
đo không có gì để đo"*), và `FR-072 §5` chốt **không** xanh bằng fixture bịa. Đường
lấy vật liệu rẻ nhất: người chọn 2 video tiếng Trung, M12 `sinh-transcript` (`model.json`
đã có `ngon_ngu: zh`) ⇒ transcript vào kho ⇒ `AC-2.5` index được ⇒ golden zh expect
neo `slug:t=`.

## 7 · Vector — HOÃN, và điểm rẽ là tín hiệu VẬN HÀNH

`research_summary` §10-3: **không** nghiên cứu nào chứng minh vector thắng ở corpus
< 100 tài liệu; người tìm = người viết nên lệch từ vựng gần như không có. Kho hiện
có **13** bản ghi *(đếm 2026-09-09 từ `kb/_kho.sqlite`: 2 bài viết · 2 tài liệu ·
9 video; con số **3** ở bản trước đúng lúc viết 2026-09-01 và nay sai — nhân lúc spec
mở thì sửa, để một số cũ trong artifact frozen là để một câu nói dối)*.

Điểm rẽ đo bằng **tín hiệu vận hành** — truy vấn 0 kết quả, hoặc người gõ lại ≥2
lần — **không** bằng số bài. Khi rẽ: `sqlite-vec` pin `v0.1.9` + `bge-m3`.

Hợp đồng sẵn: query RRF SQL-thuần (`rrf_k=60`, weights 1/1, `FULL OUTER JOIN`).
**Điều kiện tiên quyết đã ĐẠT** — đo 2026-09-01: `sqlite_version = 3.50.4`, và
`FULL OUTER JOIN` **chạy thật**, không suy từ số phiên bản.

> **AC-7.1** · Hai tín hiệu vận hành (`truy vấn 0 kết quả`, `gõ lại ≥2 lần`) được
> **đếm và ghi**; không có số thì không ai biết đã tới điểm rẽ.
> `hard` · `cmd: python truyhoi/tests/check_tin_hieu_van_hanh.py`

> **AC-7.2** · `truyhoi/` **không** gọi embedding API nào ở giai đoạn này; thêm một
> lời gọi ⇒ đỏ (nó là egress chưa được khai ở `FR-043`).
> `hard` · `cmd: python truyhoi/tests/check_khong_embedding.py`

## 8 · Cái CỐ Ý không có

| | vì sao |
|---|---|
| vector / embedding | §7 — chưa có bằng chứng nó thắng ở cỡ kho này |
| `porter` stemming | tiếng Anh; phá tiếng Việt (`research_summary` §11 M13-1) |
| giao diện | `Z7` — thuộc `web/` |
| ghi kho | chỉ đọc; chỉ mục là dẫn xuất. *(`FR-072` §1.3 nới vế ĐỌC: hiện vật văn bản đọc được **qua API của LÕI**; vế **không GHI** nguyên vẹn — `M13-R3`)* |
| top-k ẩn | `B-C2` — phạm vi là control **hiển thị** |
| xếp hạng theo "độ mới" | kho là tri thức, không phải dòng thời gian (`B-C1` đảo) |
| trích text PDF | `FR-072` §5 — việc của **M12** (`FR-079`); M13 tự trích là thêm dep nặng vào một module 0-egress, và hai chỗ trích cùng một PDF |
| tự giải `bot → doc_id` | `M14 AC-8.4` giữ **một** chokepoint ở M14; M13 nhận `nguon[]`, **không** mọc trục quyền |
