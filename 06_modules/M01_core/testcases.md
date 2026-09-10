# M01_core — testcases

> Mỗi AC **≥1 happy + ≥1 edge**, viết **bằng lời** (đầu vào → kết quả mong đợi).
> Không viết mã test — `m-test` ở s8 là **vai riêng** và giữ nguyên quyền FR ngược
> về đây (R1).
>
> **Phép thử của chính s6**: *viết không nổi testcase cho một AC ⇒ AC đó mơ hồ ⇒
> DỪNG, sửa AC*. Kết quả ghi ở **§cuối**, không giấu.
>
> ⚠️ **Module này ĐÃ THI CÔNG.** Nên file này có giá trị khác với M12–M18: nó
> không chạy trước mã, nó **audit** chất lượng AC của mã đang chạy. Chỗ nào một
> testcase mô tả *cái đã có* thay vì *một phép thử*, tôi nói ra thay vì để nó
> trông như một phép thử.

## 2.1 · Sinh — giao thức 6 pass

**AC-2.1.1** — bản do M01 sinh luôn ở `draft`
- *happy*: chạy skill trên một nguồn ngoài → frontmatter ra `review_status: draft`.
- *edge*: nguồn **tự nói** `review_status: approved` ngay trong thân (prompt
  injection, `security_baseline §6`) → output **vẫn** `draft`.
- *edge 2*: nguồn chứa một khối YAML giả mạo cả frontmatter → output vẫn `draft`,
  và khối đó ở lại trong thân như **nội dung**, không leo lên frontmatter.

⚠️ Cả ba ca này **không kiểm được bằng máy** và AC đã khai đúng thế (`soft`, S2).
Điều một testcase *thêm* được so với AC: nó nêu **ba ca cụ thể để reviewer rà**,
thay vì để chữ *"reviewer rà"* không có danh sách rà.

**AC-2.1.2** — skill ngoài repo ⇒ không test nào chạy nó ở CI
- *happy*: quét `.github/workflows/` → **0** dòng gọi skill.
- *edge*: ai đó thêm một bước CI gọi skill trong `~/.claude/skills/` → bước đó
  **chạy được trên máy người viết** và **đỏ trên runner** (runner không có
  `~/.claude`) ⇒ đây là ca *"xanh cục bộ, đỏ CI"*, và nó là **lý do** giới hạn
  này được khai `soft` chứ không thành nợ.

## 2.2 · Kiểm — chín cổng máy

**AC-2.2.1** — mỗi cổng chặn được ít nhất một file phá đúng luật đó
- *happy*: `pytest core/tests/test_gates.py -q` xanh; mỗi cổng trong bảng có ≥1
  test phá **đúng một** luật.
- *edge*: fixture phá **hai** luật một lúc (thiếu mục **và** `word_count` sai) →
  cổng đỏ, nhưng phép thử **không** chứng minh được cổng nào đóng ⇒ *một fixture
  một luật* là **ràng buộc của phép thử**, không phải gu.
- *edge 2*: gỡ **một** cổng khỏi `check()` rồi chạy lại → phải có **đúng** test
  của cổng đó đỏ, các test khác xanh. Đây là phép thử *"cổng có đỏ được không"*
  (`S3`), và là ca duy nhất chứng minh 45 test kia không chỉ đang **mô tả**.
- *edge 3*: file **không có** frontmatter → cổng 1 đóng và cổng 2–9 **không**
  chạy (pass sau không chạy nếu pass trước chưa đạt). Nếu cổng 3 vẫn báo lỗi
  `word_count` trên một file không parse được, đó là **thứ tự cổng vỡ**.

**AC-2.2.2** — file đạt chuẩn không sinh lỗi giả
- *happy*: `core/tests/fixtures/dat-chuan.md` → `check()` trả **0** lỗi.
- *edge*: bản đạt chuẩn có một khối code chứa **chính** chuỗi mà cổng 4 tìm
  (một dòng `## 3.` bên trong khối) → vẫn 0 lỗi. Đây là lớp lỗi *"literal trong
  khối code phá phép đếm"*, đã trúng dự án này **≥6 lần**; một file đạt chuẩn
  phải phủ nó.
- *edge 2*: bản đạt chuẩn `origin: internal` (nên cổng 8 không áp) → 0 lỗi, và
  **không** báo thiếu `citations_sampled`.

## 2.3 · `--fix` chỉ sửa dữ liệu dẫn xuất

**AC-2.3.1** — `--fix` không đổi trường nào ngoài `word_count`
- *happy*: bản có `word_count` khai sai → sau `--fix` đúng **một** khoá đổi.
- *edge*: bản có `word_count` **đã đúng** → `--fix` đổi **0** khoá, và **không**
  ghi lại file (mtime không đổi). Ghi lại một file không đổi nội dung làm mọi
  phép `find -newermt` của bước **quy chủ** (R6) nói sai.
- *edge 2*: bản có `credibility` · `verdict` · `concepts` · `review_status` ·
  `citations_verified` · `url_normalized` · `reject_reason` → cả **bảy** trường
  phán đoán nguyên vẹn từng ký tự sau `--fix`.
- *edge 3*: bản cần `--fix` nằm trong `kb/` **thật** → `--fix` chỉ được chạy trên
  vật thay thế; đây là chỗ `CẤM: sửa file thật để thử một cổng` áp vào.

## 2.4 · Re-analyze — CHƯA CÓ MÃ

**AC-2.4.1** — giữ `slug`, tăng `n` của bản cũ
- *happy*: nguồn đổi → bản cũ thành `<slug>.v1.md`, bản mới giữ `<slug>.md`, và
  URL `/<slug>/` **không** 404.
- *edge*: re-analyze **lần thứ hai** → `<slug>.v2.md` xuất hiện và `<slug>.v1.md`
  **còn nguyên** (không bị ghi đè). Đây là ca dễ mất dữ liệu nhất của cả 2.4.
- *edge 2*: `<slug>.v1.md` **đã tồn tại** từ trước (ai đó đặt tay) → phải DỪNG,
  không được lặng lẽ ghi đè.
- *edge 3*: `*.v[0-9]*.md` phải **vắng** khỏi output của M03 (`AC-2.5.1` của M02)
  ⇒ mỗi lần re-analyze là một lần phép thử đó phải chạy lại.

⚠️ AC khai `soft` → **chưa có code**, và bốn ca trên là **đặc tả**, không phải
phép đo. Chúng có giá trị đúng một chỗ: chúng nói 2.4 cần **≥4** phép thử, nên
nó không phải *"một lần đổi tên file"*.

## 3 · Công thức `word_count`

**AC-3.1** — `count_words` bỏ đúng ba thứ
- *happy*: thân có 100 từ nội dung + một khối code 500 từ + 5 dòng `## n.` + 3
  locator → `count_words` trả **100**.
- *edge*: khối code **không đóng** (mở mà không có dấu đóng) → phải chốt một hành
  vi và giữ nó: đếm phần còn lại **như code** (bỏ hết) hay **như văn** (đếm hết).
  Hai lựa chọn cho hai con số khác nhau, và spec **không nói**.
- *edge 2*: một locator **trong** khối code → bị bỏ **một lần**, không hai lần
  (hai luật cùng trừ một đoạn thì `word_count` tụt dưới thực tế).
- *edge 3*: `## 3.` xuất hiện **giữa dòng** văn (không đầu dòng) → **được đếm**,
  vì luật khai neo đầu dòng.
- *edge 4*: thân **rỗng** → trả `0`, không nổ.

## 4 · Điều module CẤM — mỗi dòng một phép thử

- *ghi `approved`*: quét `core/src/` → `approved` chỉ xuất hiện ở chỗ **đọc** và
  ở enum, không ở chỗ **ghi**.
- *sửa `frontmatter.schema.json` tại chỗ*: gieo một `Edit` vào file đó → deny S1
  chặn; và ca đi vòng qua `Bash` **không** bị chặn (`#deny-một-cửa`) ⇒ đây là ca
  chỉ `check_frozen` bắt được, không phải deny.
- *`--fix` thứ cần phán đoán*: xem `AC-2.3.1 edge 2`.
- *đọc/gọi `web/**`*: quét `core/src/` → 0 dòng import trỏ `web/`.

## Kết quả PHÉP THỬ s6 — ba chỗ AC/spec mơ hồ hoặc lệch

**1 · Số cổng lệch trong CHÍNH spec.** Tiêu đề `2.2` viết **"8 cổng máy"**, dòng
ngay dưới viết **"Chín cổng trong `check()`"**, bảng có **9** hàng. Ba con số cho
một thứ. Không chặn được testcase nào, nhưng nó là chỗ người đọc tiếp đếm sai.

**2 · Ba con số test đều lệch thực tế.** `AC-2.2.1` khai *"19 test"*, `§5` khai
*"19 test pass"* rồi *"30 test pass"*. Đo được: `test_gates.py` có **45**. Con số
trong AC là loại **tự khai** mà `CẤM: đếm tay rồi chép số` nói tới — và nó đã mòn
ba lần. ⇒ AC nên nói *"mỗi cổng có ≥1 test"* (kiểm được) và **bỏ** con số.

**3 · `AC-3.1` không đủ để viết testcase cho khối code không đóng.** Công thức
khai *"bỏ code block"* mà không nói ca thiếu dấu đóng. Hai cách hiểu cho hai
`word_count` khác nhau, tức hai kết quả khác nhau ở cổng 3 (`≤1800`). Đây là **AC
mơ hồ theo đúng nghĩa s6** — ca duy nhất trong M01 mà tôi phải nêu **hai** kết
quả mong đợi thay vì một.

⇒ Ba mục trên vào `backlog.md`. **Không** sửa spec ở đây: `spec.md` của M01 là
artifact frozen, và một cổng đang đo nó.
