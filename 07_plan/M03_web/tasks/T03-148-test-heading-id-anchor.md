# T03-148 — đơn vị TEST: `id` trên heading render KHỚP anchor M13 — cổng đối chiếu BA bản (C3 · FR-073 A3)

> **Ngữ cảnh + harness: `07_plan/M13_truyhoi/BAN-GIAO-DEV.md`** §1 · §4.
> Đóng ô mở từ **2026-09-02** ở `06_modules/M03_web/backlog.md:7` (C3). Test đi ĐẦU,
> ĐỎ trước mã (`rule.md` mục 8); tách khỏi `T03-149` vì **R1**.
> ID rule 9: `ls 07_plan/M03_web/tasks` max trong dải hiện hành 147 ⇒ 148 (dải 190+ là PM-Space).
>
> **Vì sao đây là lỗ thật, đo 2026-09-10:**
> - `multiwindow.inline.ts:313` render `<h${c}>` + inline(h[2]) + `</h${c}>` — **không `id`**.
> - `nhay(id, j)` (`:626`) chỉ nhảy tới `G(id + "s" + j)` — mục của **khung 5 mục**,
>   không phải heading trong thân bài.
> - `T03-125` AC2 khai *"bấm kết quả ⇒ cửa sổ đọc mở đúng bài + cuộn đúng anchor"*
>   ⇒ **không thể xanh** khi heading không có `id`. Một AC đã khai mà không có đường
>   xanh là AC treo, và `T03-125` sẽ đổ lỗi cho M13 trong khi M13 sinh anchor đúng.
> - M13 spec `AC-2.2` đã hạ vế *"khớp anchor M03 render ra"* xuống chỉ so `anchor_py`
>   ↔ `slugGoiY` vì bản thứ ba **chưa tồn tại**. Đơn vị này tạo bản thứ ba.
>
> **Phải ĐỎ vì LUẬT**: chạy trên HTML render hôm nay ⇒ `<h2>`/`<h3>` không có `id`
> ⇒ ca A đỏ *"heading không có id"*, đúng lý do. Không tính đỏ vì thiếu file.

## Bốn ca

| ca | gieo | phải ra |
|---|---|---|
| A | render một bài có `## Hướng dẫn cài đặt` · `### Đường ống dữ liệu` | mỗi `<h2>`/`<h3>` có `id`, và `id` == `slugGoiY(text)` — `huong-dan-cai-dat` · `duong-ong-du-lieu` (ca `đ`) |
| B | hai heading fold về **cùng** slug trong **một** bài | `id` thứ hai = `<slug>-1`, thứ ba `-2` (github-slugger); render lại ⇒ **cùng** hậu tố (ổn định) |
| C | cùng slug ở **hai bài khác nhau** | mỗi bài đều `<slug>` không hậu tố — state dedup **theo FILE, reset mỗi bài** (FR-073 §1 `$dedup`) |
| D | **cổng BA bản** (FR-073 A3): 50 heading lấy từ kho thật ⇒ `id` HTML == `slugGoiY()` == `anchor_py()` của M13 (đọc qua `truyhoi.sample.v3.json` `chunks[].anchor` **cho tới khi** `truyhoi/src/anchor.py` tồn tại, sau đó gọi thẳng) | một heading lệch ở **bất kỳ** bản nào ⇒ đỏ, **nêu heading nào và bản nào** |

Ca D là cổng **A3 của FR-073** — *"cổng đắt nhất và không thuộc riêng M01"*. Nó sống ở
M03 vì bản thứ ba (`id` trong HTML) là thứ **người dùng bấm vào**; hai bản kia chỉ là
luật trên giấy nếu bản này lệch.

phạm_vi_ghi:
  - web/test/heading-id-anchor.test.js
  - web/test/fixtures/**

phụ_thuộc: —

verifiability: hard
tiêu_chí:
  - AC1: ca A·B·C·D chạy được; TRƯỚC T03-149 thì A·B·C ĐỎ *"heading không có id"*
      (ghi output vào worklog), D đỏ cùng lý do; SAU T03-149 cả bốn xanh
    cmd: cd web && node test/heading-id-anchor.test.js
  - AC2: cổng đỏ được trên fixture cố-tình-lệch ở thư mục tạm — gieo một `id` cắt
      80 thay vì 60, hoặc bỏ `đ→d` ở MỘT bản ⇒ ca D đỏ nêu đúng heading + bản lệch
    cmd: cd web && node test/heading-id-anchor.test.js --tu-kiem
  - AC3: suite web xanh
    cmd: cd web && npm test
