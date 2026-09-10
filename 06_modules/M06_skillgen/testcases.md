# M06_skillgen — testcases

> Mỗi AC **≥1 happy + ≥1 edge**, viết **bằng lời**. Không viết mã test — `m-test`
> ở s8 là **vai riêng**, giữ nguyên quyền FR ngược về đây (R1).
>
> **Phép thử của chính s6**: *viết không nổi testcase cho một AC ⇒ AC mơ hồ ⇒
> DỪNG, sửa AC*. Kết quả ở **§cuối**.
>
> ⚠️ Module này **chấm** bản ghi rồi **sinh** thứ điều khiển agent. Nên nó có một
> lớp ca mà module khác không có: *"kết quả trông hợp lệ mà sai"* — và đó đúng là
> ca đã xảy ra thật (thứ tự cổng, `§2.1`).

## 2.1 · Chấm verdict — thứ tự cổng không đổi được

**AC-2.1.1** — cổng cứng thắng mọi cổng khác
- *happy*: `credibility: claimed`, `independent_sources: 1` → `OUT_OF_SCOPE`,
  **kể cả** khi chủ đề thuộc domain và chưa được phủ (tức cổng 5 sẽ nói `NEW`).
- *edge*: `credibility: conflicted`, `independent_sources: 1`, **và** khớp
  capability `depth 5` → vẫn `OUT_OF_SCOPE`, không `OVERLAP`. Hai cổng cùng cho
  ra một verdict *"không sinh"*, nên ca này chỉ có nghĩa nếu phép thử đọc **cổng
  nào** đã quyết, không chỉ đọc verdict.
- *edge 2*: `credibility: claimed`, `independent_sources: 2` → cổng cứng **không**
  áp (nó đòi `== 1`), đi tiếp xuống cổng 2–5.
- *edge 3*: chạy **sai thứ tự** (kiểm domain trước cổng cứng) → cho ra `NEW` cho
  ứng viên mà **schema đã cấm**. ⚠️ Đây là ca đã xảy ra thật ở lượt kiểm đầu, và
  nó **không tạo lỗi kiểu** — nó tạo kết quả trông hợp lệ. Phép thử phải khẳng
  định **thứ tự**, không chỉ khẳng định từng cổng riêng lẻ đúng.
- *edge 4*: `independent_sources` **vắng** → `verdict.py:52` mặc định **1** ⇒
  cổng cứng **VẪN** áp. Đây là **fail-closed**, và mặc định đó là lựa chọn đúng
  (thiếu dữ liệu ⇒ giả định trường hợp xấu). Nhưng nó **không** có trong spec:
  bảng `§2.1` viết `independent_sources == 1` như thể giá trị luôn tồn tại.
- *edge 5*: `credibility` **vắng** → `verdict.py:51` **không** có mặc định, nên
  `None in ("claimed","conflicted")` là `False` ⇒ cổng cứng **KHÔNG** áp và ứng
  viên đi tiếp xuống cổng 2–5, có thể ra `NEW`. Đây là **fail-open**, và nó ở
  đúng cổng cứng nhất của module. Hai trường của cùng một điều kiện, **hai chiều
  hỏng ngược nhau**.

**AC-2.1.2** — khớp capability qua **alias**, không chỉ tên chính
- *happy*: `context-truncation-strategy` khớp capability `context-management`
  qua `aliases`.
- *edge*: một alias **trùng** với tên chính của capability **khác** → khớp cái
  nào? Hai capability cho hai `depth` khác nhau ⇒ hai verdict khác nhau
  (`OVERLAP` vs `DEEPEN`). Spec không nói.
- *edge 2*: khớp **hoa/thường khác nhau** (`Context-Management`) → phải chốt: so
  khớp chính xác, hay chuẩn hoá? Lượt đầu bỏ sót vì khớp **đúng tên**; sửa bằng
  alias, nhưng vế hoa/thường vẫn không được nói.
- *edge 3*: capability **không có** `aliases` → không nổ, khớp bằng tên chính.

## 2.2 · Sinh NHÁP, không sinh đủ

**AC-2.2.1** — nháp có đủ 4 phần và thân **rỗng**
- *happy*: một ứng viên `NEW` `priority 50` → nháp có `name` + `description` +
  mục "Khi nào dùng" + con trỏ ngược (đường dẫn **kèm số dòng**) + thân rỗng có
  dấu `TODO`.
- *edge*: `draft_trigger` **vắng** → không sinh nháp (schema đòi nó cho
  `NEW`/`DEEPEN`), chứ không sinh nháp thiếu `name`.
- *edge 2*: con trỏ ngược trỏ một file **không còn tồn tại** (bản đã re-analyze
  thành `.v1.md`) → nháp thành thứ **không truy được về nguồn**, tức mất đúng
  giá trị duy nhất mà `§2.2` nói máy làm tốt. Không AC nào phủ ca này.
- *edge 3*: `draft_trigger` có ký tự không hợp cho tên file (`/`, `:`) → phải
  chốt hành vi; `name` đi vào frontmatter của skill và có thể đi vào tên file.

**AC-2.2.2** — không nháp nào có thân > 0 dòng thật
- *happy*: cả bốn nháp sinh ra có thân rỗng.
- *edge*: thân chứa **chỉ** dòng `<!-- TODO: … -->` → đó là **0 dòng thật**, phải
  qua. Nếu phép đếm tính dòng comment là dòng thật thì AC đỏ oan trên chính
  output đúng.
- *edge 2*: thân chứa một dòng **trắng** hoặc chỉ dấu cách → 0 dòng thật.
- *edge 3*: mục "Khi nào dùng" dài 5 dòng → **không** tính vào thân; ranh giới
  *"thân"* vs *"mục Khi nào dùng"* phải khai được, nếu không AC này đo một thứ
  mà mỗi người cắt một chỗ.

⚠️ AC này *"chống chính module này phình vai"* — nên nó là AC duy nhất trong dự
án mà **tác giả và bị-chấm là một**. Luật gốc nói thẳng chuyện đó, và cách giữ
nó không hỏng là: **thước đo (`test_draft_shape.py`) phải nằm ngoài quyền ghi của
đơn vị việc sinh nháp**.

## 2.3 · Ngưỡng sinh

**AC-2.3.1** — bản `draft` không sinh nháp nào
- *happy*: kho có 3 bản `draft` `priority 60` → **0** nháp.
- *edge*: bản `edited` (trạng thái giữa `approved` và `approved`) → sinh, hay
  không? `§2.3` nói *"chỉ đọc bản `approved`"*, và `edited` **không** phải
  `approved`. Nhưng luồng M02 `§2.2` cho `edited → approved`, nên một bản `edited`
  **đã từng** được duyệt. Spec không nói.
- *edge 2*: bản `rejected` `priority 90` → 0 nháp.
- *edge 3*: `priority` **đúng 25** → sinh (ngưỡng là `≥`), không phải `>`.
- *edge 4*: `priority 24.9` → không sinh. Và `priority` là một phép chia
  (`/cost`) nên nó **ra số thực**; so bằng `>=25` trên số thực là chỗ một sai số
  làm thay đổi quyết định. Không AC nào nói về làm tròn.

## 2.4 · Manifest lớn dần

**AC-2.4.1** — mọi capability có `$why` giải thích điểm `depth`
- *happy*: 23 capability, mỗi cái có `$why` không rỗng.
- *edge*: một capability có `$why` là chuỗi rỗng hoặc `"TODO"` → đỏ. `$why` tồn
  tại mà không nói gì thì `depth` lại thành con số không ai chịu trách nhiệm.
- *edge 2*: M06 cho ra **một loạt `NEW`** → theo `§2.4` đó là *"dấu hiệu manifest
  thiếu"*, và phản ứng đúng là **bổ sung capability**, không hạ ngưỡng. Không cổng
  nào phân biệt được hai phản ứng đó ⇒ đây là chỗ luật sống bằng chữ.

## 2.5 · Sample phủ đủ verdict

**AC-2.5.1** — sample phủ đủ 4 verdict + ≥1 ca `priority < 25`
- *happy*: `test_sample_coverage.py` xanh (đo 2026-09-03: ✅).
- *edge*: sample bump lên phiên bản mới mà **mất** một verdict → đỏ. Đây là ca
  bảo vệ **thật**: sample đã đi từ v2 → v5, và mỗi lần bump là một lần có thể mất.
- *edge 2*: sample có đủ 4 verdict nhưng **cả 4 đều `priority ≥ 25`** → đỏ ở vế
  thứ hai. Hai vế của AC phải đỏ **độc lập**, không thì một vế che vế kia.

## 3 · Công thức `priority`

- *happy*: `relevance 4 × frequency 4 × durability 4 × corroboration 1.3 / cost 3`
  → `27.7` ⇒ ≥25 ⇒ sinh.
- *edge*: `cost` ở **mẫu số** ⇒ `cost = 0` là **chia cho 0**. Bảng khai `cost 1-5`
  nên 0 ngoài miền, nhưng không AC nào nói cổng nào chặn 0.
- *edge 2*: `relevance` *"không nối được với vấn đề có thật ⇒ không thể ≥4"* —
  đây là một **ràng buộc** mà không lệnh nào kiểm được (nó về ý nghĩa, không về
  số). Nó nằm trong khối công thức như thể là một luật máy.
- *edge 3*: `corroboration_factor` chỉ nhận 4 giá trị `{0.6, 1.0, 1.3, 1.6}` →
  một giá trị ngoài tập (ví dụ 1.2) phải bị chặn ở schema, không im lặng nhận.

## 4 · Điều module CẤM — mỗi dòng một phép thử

- *ghi bất cứ gì vào `kb/`*: quét `06_skillgen/` → 0 đường ghi trỏ `kb/`.
- *đọc bản `draft`*: `AC-2.3.1`.
- *nới cổng cứng*: gỡ điều kiện `independent_sources == 1` → `test_verdict.py -k
  cong_cung` phải **đỏ**. Đây là phép thử *"cổng có đỏ được không"*, và `§5` khai
  đã làm (phá 4 luật mỗi bộ) — vế duy nhất trong 11 module đầu **tự khai** đã đo
  chuyện đó.
- *sinh thân skill có nội dung*: `AC-2.2.2`.
- *tự cài skill vào agent*: quét `06_skillgen/` → 0 đường ghi trỏ `~/.claude/`.
  Máy đề xuất, **người quyết định cài** (PRD U7).

## Kết quả PHÉP THỬ s6 — bốn phát hiện

**1 · `§2.5` khai *"Đang ĐỎ"*, thực tế XANH.** Đo 2026-09-03:
`test_sample_coverage.py` exit 0. `§5` nói nợ đã trả (*"sample lên v3, FR-006"*)
trong khi `§2.5` cách đó 40 dòng vẫn nói đang đỏ. **Spec kể hai trạng thái cho
cùng một AC** — y hệt M04 `§2.3` vs `§5`. Hai module, cùng hình dạng lỗi: nợ được
trả ở `§5` mà mục gốc không ai sửa.

**2 · `§5` khai sample ở *"v3"*, thực tế có tới `analyses.sample.v5.json`.** Con
số thứ năm cùng lớp *tự khai* trong năm module liền. Ở đây nó tệ hơn một chút:
`§2.5` đọc *"analyses.sample.v2.json"*, `§5` đọc *"v3"*, đĩa có **v1…v5**. Ba con
số, không cái nào đúng hiện tại.

**3 · `AC-2.2.2` là AC duy nhất mà tác giả và bị-chấm là MỘT.** Nó chống *"chính
module này phình vai"*. Luật gốc — *không ai được sở hữu thứ dùng để đánh giá
mình* — áp trực tiếp, và cách duy nhất giữ nó không hỏng là
`test_draft_shape.py` **nằm ngoài `phạm_vi_ghi`** của mọi đơn vị việc sinh nháp.
Điều đó **chưa được khai ở đâu**.

**4 · Bảy AC/công thức không đủ để viết MỘT kết quả mong đợi:**
`AC-2.1.1 edge 5` (`credibility` vắng ⇒ **fail-open**) ·
`AC-2.1.2 edge` (alias trùng tên chính của capability khác) ·
`AC-2.1.2 edge 2` (hoa/thường) · `AC-2.2.1 edge 3` (ký tự lạ trong `draft_trigger`) ·
`AC-2.2.2 edge 3` (ranh giới *"thân"*) · `AC-2.3.1 edge` (`edited`) ·
`§3 edge` (`cost = 0` ⇒ chia cho 0).

Trong đó `AC-2.1.1` có **hai trường của một điều kiện hỏng ngược chiều nhau**, đo
trên `06_skillgen/verdict.py:51-55`:

| trường vắng | mặc định | cổng cứng | chiều |
|---|---|---|---|
| `independent_sources` | `1` (dòng 52) | **VẪN áp** | fail-**closed** ✅ |
| `credibility` | không có (dòng 51) | **KHÔNG áp** | fail-**open** ⚠️ |

Vế fail-open cùng chiều với `CVE-2026-47713` mà FR-047 đã ghi (*thiếu danh tính
⇒ trả tất cả*), và nó ở **cổng cứng nhất** của module — cổng mà `CẤM: nới cổng
cứng` bảo vệ. Một bản ghi thiếu `credibility` không bị cổng cứng chặn, nên nó có
thể ra `NEW` và sinh nháp.

✅ **Đã đo, và fail-open này KHÔNG tới được.** `frontmatter.schema.json:177-180`
đòi `credibility` **bắt buộc** trong mỗi phần tử `skill_candidates[]` — và
`ung_vien` chính là một phần tử đó. Nên một bản ghi hợp lệ **luôn** có
`credibility`, và dòng 51 không bao giờ nhận `None`.

⇒ Đây là **phòng thủ nhiều lớp đang hoạt động**, không phải lỗ. Kết luận đúng:
**nợ tài liệu**, không phải FR an ninh. Hai điều cần ghi:
- cổng cứng của `verdict.py` **dựa vào** schema để fail-closed, và điều đó
  **không viết ở đâu** — ai đó nới `required` của `skill_candidates` sẽ mở một
  fail-open ở một file khác mà không cổng nào nối hai chuyện lại;
- schema:152 nói thẳng `credibility_max` *"KHÔNG dùng làm cổng chặn — cổng khoá
  vào `skill_candidates[].credibility`"*. Đúng thứ `verdict.py` làm. Hợp đồng
  này **có** được khai, chỉ khai ở phía schema chứ không ở phía spec M06.

⇒ Cả bốn vào `backlog.md`. Mục 1, 2, 4 chạm `spec.md` FROZEN ⇒ tick bằng **FR id**.
