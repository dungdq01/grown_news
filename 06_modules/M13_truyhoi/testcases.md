# M13_truyhoi — testcases

> Mỗi AC **≥1 happy + ≥1 edge**, viết **bằng lời**. `m-test` ở s8 là vai riêng và
> giữ quyền FR ngược về đây (R1).
> **Phép thử của s6**: *viết không nổi testcase ⇒ AC mơ hồ ⇒ DỪNG*. Kết quả ở §cuối.

## 1 · Vai — chỉ mục là dẫn xuất

**AC-1.1** — dựng lại được
- *happy*: xoá `truyhoi/index.sqlite` rồi dựng lại → cùng tập `(file, anchor, line_start, line_end, checksum)`, so **từng dòng**, thứ tự sắp xếp cố định.
- *edge*: dựng lại **hai lần liên tiếp** → lần hai cũng bằng lần một (điểm bất động, không chỉ "gần giống").
- *edge 2*: dựng lại trên kho **rỗng** → 0 chunk, không lỗi. Kho mới tinh là trạng thái hợp lệ.

**AC-1.2** — lệch kho báo được
- *happy*: kho không đổi → cổng im lặng, 0 slug lệch.
- *edge*: sửa một bài rồi **chưa** re-index → cổng nêu **đúng slug** đó, không chỉ nói "có lệch".
- *edge 2*: xoá một bài khỏi kho → chunk mồ côi bị nêu (chiều ngược: index có, kho không).

**AC-1.3** — không chạm kho
- *happy*: chạy dựng + một truy vấn → 0 lần mở `kb/_kho.sqlite`; mọi lần đọc là HTTP.
- *edge*: gieo `sqlite3.connect(kb/_kho.sqlite)` vào `truyhoi/` → đỏ, nêu file+dòng.
- *edge 2* *(mới · `FR-072` §1.3)*: gieo một `open("kb/_media/<sha>.vtt")` → đỏ. Đọc hiện vật **được phép**, nhưng chỉ qua HTTP; mở file trực tiếp là đi vòng qua `M09-R1`.

**AC-1.6** *(mới · `FR-072` §1.2)* — ai gọi vào
- *happy*: lời gọi từ `web` mang khoá chiều `web→truyhoi` + `x-aud: truyhoi` → **2xx**; từ `chatbot` mang khoá chiều của nó → **2xx**. Hai dịch vụ này có trong `goi_duoc` của `truyhoi`.
- *edge*: lời gọi từ `artifact` (**không** trong `goi_duoc`) mang khoá đúng cú pháp → **403**, và thông báo nêu **tên dịch vụ** cùng đường sửa (*thêm một phần tử vào `goi_duoc`*), không nói chung chung "unauthorized".
- *edge 2*: `x-aud: chungcat` (aud của **dịch vụ khác**) → **403**. Đây là ca `CVE-2025-41258` mô tả: một khoá dùng được ở nhiều đích thì đích nào cũng nhận.
- *edge 3*: **thiếu hẳn** khoá → **403** fail-closed, không rơi về "cho qua vì đang ở loopback".
- *edge 4*: gieo một hằng danh sách người gọi **trong mã** `truyhoi/` (thay vì đọc `core/assets/dich-vu.json`) → đỏ. Bảng khai có hai bản là hai bản sẽ lệch.

## 2 · Chunk theo heading

**AC-2.1** — anchor ASCII-fold
- *happy*: `## Hướng dẫn cài đặt` → `huong-dan-cai-dat`.
- *edge*: `## Đường ống dữ liệu` → `duong-ong-du-lieu` (ca `đ`, không phải `-uong`).
- *edge 2*: heading dài 200 ký tự → anchor **cắt ở 60**.
- *edge 3*: hai heading khác nhau fold về **cùng** một anchor → phải có luật khử trùng, và luật đó phải **ổn định** (dựng lại ra cùng kết quả).

**AC-2.2** — một luật anchor, hai chỗ cài *(xem §cuối — AC đã sửa)*
- *happy*: với 50 heading lấy từ kho thật, `anchor_py()` của M13 và `slugGoiY()` của FE ra **cùng chuỗi**, từng ký tự.
- *edge*: sửa một bước ở **một** phía (bỏ `đ→d`, hoặc cắt 80 thay vì 60) → đỏ, và nêu **heading nào** lệch.
- *edge 2*: heading chỉ gồm ký tự Hán → cả hai bản ra **cùng** kết quả (kể cả khi kết quả là chuỗi rỗng — lúc đó luật khử trùng phải xử).

**AC-2.3** — địa chỉ phân giải được
- *happy*: mỗi chunk có `line_end` ≤ số dòng thật; `[file.md:12-31]` phân giải qua `dia-chi.json`.
- *edge*: gieo một chunk có `line_end` vượt số dòng file → đỏ.
- *edge 2*: file có ký tự `\r\n` → số dòng đếm giống `\n` (không lệch 1 vì newline).
- *edge 3* *(mới · `FR-072` §1.1)*: trường `dia_chi` của **mọi** chunk khớp **một dạng đã khai** trong `dia-chi.json`; gieo một `dia_chi` dạng lai (`file.md:12-31#anchor`) → đỏ. Hai neo trong một địa chỉ là hai thứ có thể lệch nhau cho cùng một chỗ.

**AC-2.5** *(mới · `FR-072` §1.3)* — chunk hiện vật văn bản
- *happy*: bản ghi video có transcript `text/vtt` → chunk cắt theo **cue**, mỗi chunk một `dia_chi` dạng `<slug>:t=mm:ss`, và mốc **nằm trong thời lượng** của transcript.
- *happy 2*: hiện vật `.md` người tải lên → chunk cắt theo `##`/`###` như `than`, và **có** `anchor` · `line_start` · `line_end` thật.
- *edge*: chunk từ cue → ba khoá neo dòng là `null` **có mặt trong JSON**, không phải khoá vắng. Gieo bản bỏ hẳn khoá → đỏ (một khoá vắng là một câu chưa nói; `null` là một câu đã nói).
- *edge 2*: mốc cue vượt thời lượng (vd `t=99:59` trên video 4 phút) → đỏ, nêu mốc và thời lượng.
- *edge 3*: `.srt` người tải → `srt → cue` ra **cùng** danh sách mốc như `.vtt` của cùng nội dung (một hàm, đảo của `vttSangSrt`; hai bản chuyển đổi là hai chỗ lệch).
- *edge 4*: bản ghi **không** có hiện vật văn bản nào → chỉ index `than`, **0 lỗi**. Không có transcript là trạng thái hợp lệ, không phải lỗi.

**AC-2.6** *(mới · `FR-072` §1.1)* — `nguon_van_ban` đúng từng chunk
- *happy*: ba chunk từ ba nguồn → `than` · `hien-vat:text/vtt` · `hien-vat:text/plain`, đúng từng cái.
- *edge*: gieo một chunk lấy từ transcript mà khai `than` → đỏ, **nêu `doc_id` nào**. Đây là chỗ hạng bằng chứng bị nói dối: `FR-054 §1.4` khai chữ *verified* đổi nghĩa với transcript ASR, nên một câu ASR đeo nhãn `than` là một câu mượn hạng của bài viết.
- *edge 2*: chạy dựng + một truy vấn có kết quả từ hiện vật → **0** lần `open()` trỏ `kb/_media/**`; mọi lần đọc là HTTP tới `127.0.0.1:8787`. Gieo một `open()` → đỏ (cùng cổng với `AC-1.3`).

**AC-2.4** — re-index tăng dần
- *happy*: sửa **một** file trong 100 file → đúng chunk của file đó bị `DELETE`+`INSERT`; 99 file kia **0 ghi**.
- *edge*: `mtime` đổi nhưng nội dung **y hệt** → `sha256` bằng nhau ⇒ **0 ghi** (không tin `mtime` một mình).
- *edge 3*: xoá khỏi FTS bằng `DELETE FROM chunks_fts` thay vì `INSERT ... VALUES('delete', old...)` → bảng thường và FTS **lệch im lặng**; cổng phải bắt bằng cách so số hàng hai bên, không bằng đọc mã.

## 3 · Ba thứ tiếng

**AC-3.1** — MỘT hàm chuẩn hoá
- *happy*: `chuan_hoa()` được gọi ở đúng hai chỗ — dựng chỉ mục và nhận truy vấn.
- *edge*: bỏ `chuan_hoa()` ở phía **query** → bộ 10 truy vấn tụt xuống dưới 10/10, và cổng nêu **truy vấn nào** trượt.
- *edge 2*: gieo một phép chuẩn hoá **thứ hai** (khác một bước) → đỏ.

**AC-3.2** — 10/10 ba thứ tiếng
- *happy*: bộ 10 truy vấn → 10/10.
- *edge*: mỗi truy vấn trong 10 cái, bỏ đi một, kiểm cổng **đỏ** — chứng minh mỗi ca đều có răng, không có ca nào thừa.
- *edge 2*: câu **trộn** Việt+Trung (`Kết hợp 資料管線 với pipeline`) tìm được bằng **cả ba** đường: `ket hop` · `資 料` · `pipeline`.

**AC-3.3** — `remove_diacritics` là 2
- *happy*: cấu hình `2` → `huong` tìm ra `hướng`, `bo` tìm ra `bộ`.
- *edge*: đặt `1` → đỏ, và thông báo nêu rõ nó trượt **cả `hướng` lẫn `phần`**, không chỉ ký tự hai dấu (đây là điều bản khảo mô tả **nhẹ hơn** thực tế).

**AC-3.4** — dải Hán từ bảng khai
- *happy*: M13 và M12 đọc **cùng một** bảng; đổi bảng → cả hai đổi theo.
- *edge*: gieo một regex Hán thứ hai trong `truyhoi/` → đỏ.
- *edge 2*: bảng khai một dải **sai** (thiếu khối mở rộng A) → một ký tự Hán hiếm không được chèn cách ⇒ bộ 10 truy vấn trượt ⇒ đỏ. (Chứng minh bảng khai **có tác dụng thật**, không phải trang trí.)

## 4 · Xếp hạng

**AC-4.1** — `snippet()` chỉ làm preview
- *happy*: đoạn trả cho M14 là `body` đầy đủ của chunk, lấy qua `rowid`.
- *edge*: chunk dài hơn 64 token → đoạn trả về **dài hơn** thứ `snippet()` cho ra (chứng minh không dùng `snippet`).
- *edge 2*: gieo cài đặt dùng `snippet()` làm đoạn → đỏ.

**AC-4.2** — `w_title` từ cấu hình, HAI số
- *happy*: `w_title` đọc từ file cấu hình; `grep` một số trong câu SQL `bm25(...)` → 0.
- *edge*: gõ cứng `bm25(chunks_fts, 5.0, 1.0)` trong SQL → đỏ.
- *edge 2*: cấu hình chỉ có **một** `w_title` (không tách vi/en và zh) → đỏ. Lý do: token một-chữ của tiếng Trung cho điểm khác hẳn token một-từ, nên một số dùng chung là một số sai cho ít nhất một thứ tiếng.

## 5 · Phạm vi

**AC-5.1** — số bản ghi trả CÙNG kết quả
- *happy*: một truy vấn → phản hồi mang `so_ban_ghi_trong_pham_vi`, và số đó bằng phép đếm độc lập trên cùng bộ lọc.
- *edge*: gọi hai lần (một cho kết quả, một cho số đếm) → **đỏ**. Hai lời gọi = hai thời điểm = số hiện trên màn có thể không phải số đã dùng để trả lời. (Tiền lệ: `#acount` từng hiện 20 khi SSR trả 16.)

**AC-5.2** — không top-k ẩn
- *happy*: `k` do người gọi đưa; đổi `k` → số kết quả đổi theo.
- *edge*: `grep` một hằng số `k` trong mã → đỏ.
- *edge 2*: đổi `pham_vi` → tập ứng viên đổi theo (không phải lọc sau khi đã lấy top-k của cả kho).

**AC-5.3** — tập nguồn là THAM SỐ
- *happy*: gọi kèm `nguon: [a, b]` → chỉ chunk của `a`,`b` được xét; đếm được bằng cách gieo một chunk khớp mạnh ở `c` và kiểm nó **không** ra.
- *edge*: gọi **không** nêu tập nguồn → mặc định cả kho, và mặc định đó phải **tường minh trong mã** (grep thấy một hằng/dòng khai, không phải một nhánh vắng).
- *edge 2*: ràng buộc tập nguồn là `AND` trong **cùng câu SQL** với `MATCH` — gieo một cài đặt lọc **sau** khi có kết quả → đỏ.

## 6 · Golden set

**AC-6.1** — phủ đủ ca
- *happy*: `golden.yaml` có đủ 7 ca Việt + 4 ca Trung.
- *edge*: bỏ một ca → đỏ, **nêu tên ca thiếu** (không chỉ đếm số).

**AC-6.3** *(mới — tách khỏi `AC-6.1`)* — bốn ca tiếng Trung xanh trên kho THẬT
- *happy*: kho có ≥2 bản ghi tiếng Trung → bốn ca zh (1 chữ · 2 chữ · 4 chữ · câu trộn) trả đúng địa chỉ mong đợi.
- *happy 2* **(ca duy nhất viết được hôm nay)**: kho có 0 bài Trung → cổng in *"soft — kho có 0 < 2 bài tiếng Trung, vế zh chưa đo được"* rồi **exit 0**. Nó **không** được im lặng xanh, và cũng **không** được đỏ (đỏ oan dạy người ta bỏ qua màu đỏ).
- *edge*: nạp **một** bài Trung rồi chạy → vẫn `soft`, và thông báo phải in **số thật** là `1`, không phải một câu chung. Số ấy là thứ nói khi nào cổng lật.
- *edge 2*: nạp 2 bài **giản thể** → cổng lật sang `hard` và chạy bốn ca *(chủ dự án 2026-09-09: phồn thể hoặc giản thể đều tính)*. Nếu ca `4 chữ` phồn thể trượt trên kho giản thể, cổng phải nói **trượt vì hệ chữ**, không nói "không tìm thấy" — đó là chỗ `fold OpenCC` sẽ được quyết.
- *edge 3*: đếm bài Trung bằng dải `core/assets/dai-han.json`, **không** bằng một regex trong `truyhoi/` → gieo một regex thứ hai thì đỏ (cùng luật `AC-3.4`).

**AC-6.2** — đổi `w_title` không làm golden đỏ
- *happy*: đổi `w_title` từ 5 → 10 → golden vẫn xanh (vì nó expect **địa chỉ**).
- *edge*: gieo một golden entry expect **điểm** thay vì địa chỉ → đỏ ở cổng khai golden (chặn ngay lúc viết, không đợi lúc chạy).

## 7 · Vector — hoãn

**AC-7.1** — tín hiệu vận hành được đếm
- *happy*: một truy vấn 0 kết quả → bộ đếm `truy_van_0_ket_qua` +1, và có dòng ghi.
- *edge*: người gõ lại ≥2 lần trong một phiên → bộ đếm `go_lai` +1.
- *edge 2*: đọc lại hai số đó sau khi khởi động lại tiến trình → **vẫn còn** (không sống trong RAM).

**AC-7.2** — không embedding API
- *happy*: `grep` lời gọi mạng trong `truyhoi/` → 0.
- *edge*: gieo một `httpx.post` → đỏ. (M13 **được** phép egress vì nó là THỢ; điều bị cấm là gọi ra theo một đường `FR-043` chưa khai bậc nào.)

---

## Kết quả phép thử s6 — MỘT AC không viết nổi testcase, đã sửa

Chạy phép thử trên 20 AC: **19 viết được ngay**. Một cái không, và lý do đo được:

**`AC-2.2` — *"anchor khớp từng ký tự với anchor renderer M03 sinh"*.**

```bash
grep -rn "anchor" web/render/ web/plugins/   # -> 0
grep -o '<h[23][^>]*>' web/site/index.html   # -> <h2 data-i18n="..."> <h3>  — KHÔNG id
```

**M03 chưa sinh heading anchor nào.** Nên không có gì để so — testcase *happy* của AC
này **không viết được**, và một cổng viết cho nó sẽ xanh **rỗng**.

Điều đó còn lộ ra một thứ lớn hơn: **cả sơ đồ địa chỉ `file#anchor` chưa có người
tiêu thụ**. M13 sẽ sinh anchor trỏ vào HTML **không có `id` tương ứng** — và đó
đúng là việc **C3** (*bấm địa chỉ → mở nguồn*) phải làm.

**Đã sửa `AC-2.2`** thành thứ đo được **hôm nay**: so `anchor_py()` của M13 với
`slugGoiY()` của FE (`multiwindow.inline.ts:1015-1021`) — **cả hai đều tồn tại**.
Vế *"khớp với anchor M03 render ra"* chuyển thành một **AC của C3**, ghi ở
`backlog.md`, vì nó không thể là AC của M13 khi phía kia chưa tồn tại.

---

## Chạy lại phép thử s6 sau khi áp `FR-072` + `FR-073` (2026-09-09)

Bốn AC mới, chạy lại đúng phép thử ấy: **ba viết được ngay, một không** — và cái
không viết được **giữ nguyên là `soft`** thay vì bị sửa cho vừa cổng.

| AC | viết được? | ghi chú |
|---|---|---|
| `AC-1.6` người gọi | ✅ 1 happy + 4 edge | ba ca 403 đều dựng được bằng một server giả; `goi_duoc` là bảng khai nên fixture chỉ là một file JSON tạm |
| `AC-2.5` chunk hiện vật | ✅ 2 happy + 4 edge | dựng được vì hai vế đều **tồn tại hôm nay**: `chungcat/src/vtt.py:doc_cue()` đã parse cue, và cửa xuất `T08-33` đã trả `.txt`/`.srt` |
| `AC-2.6` `nguon_van_ban` | ✅ 1 happy + 2 edge | — |
| `AC-6.3` bốn ca tiếng Trung | ❌ **ca happy chính không viết được** | thứ thiếu là **NỘI DUNG KHO** (0 bài chữ Hán), không phải mã |

**`AC-6.3` khác `AC-2.2` ở một điểm quyết định cách xử.** `AC-2.2` sửa được vì vế thứ
hai (`slugGoiY()`) **có thật** — chỉ cần đo đúng thứ tồn tại. `AC-6.3` thì không
fixture nào thay được kho: một cổng zh xanh trên bốn câu tiếng Trung **tự bịa** sẽ
xanh **mãi mãi** mà không bao giờ nói tiếng Trung có tìm được thật hay không. Nên
không sửa AC cho viết được; hạ **`soft` kèm lý do**, và **điều kiện lật là một số**
(≥2 bài, đếm bằng dải `core/assets/dai-han.json`). Ca *happy* duy nhất viết được hôm
nay là *"cổng NÓI RA nó chưa chạy được, nói số thật, rồi exit 0"* — `FR-072 §5` đã
chốt đúng cách xử này (*"không xanh `AC-6.1` vế tiếng Trung bằng fixture"*), lượt này
chỉ thêm **ngưỡng** *(chủ dự án 2026-09-09: phồn thể hoặc giản thể đều tính)*.

**Một vế của `AC-2.2` nay có địa chỉ.** Phép thử cũ kết luận *"sơ đồ địa chỉ
`file#anchor` chưa có người tiêu thụ"* — đo lại 2026-09-09: vẫn đúng về **C3** (M03
chưa sinh `id`), nhưng vế *bảng khai không biết dạng đó* đã có lời giải là `FR-073`
(dạng `file-anchor` vào `dia-chi.json`, dựng ở `T01-51`). Nên nợ còn lại **chỉ** là
C3, không còn là hai nợ.
