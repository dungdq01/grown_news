# M04_ci — testcases

> Mỗi AC **≥1 happy + ≥1 edge**, viết **bằng lời**. Không viết mã test — `m-test`
> ở s8 là **vai riêng**, giữ nguyên quyền FR ngược về đây (R1).
>
> **Phép thử của chính s6**: *viết không nổi testcase cho một AC ⇒ AC mơ hồ ⇒
> DỪNG, sửa AC*. Kết quả ở **§cuối**.
>
> ⚠️ Module này **kiểm module khác**, nên nó là chỗ luật gốc áp mạnh nhất:
> *không ai được sở hữu thứ dùng để đánh giá mình*. Mọi testcase dưới đây phải
> trả lời được câu *"cái này đo M04, hay đo module M04 đang chấm?"*

## 2.1 · CI phải đỏ được

**AC-2.1.1** — sửa fixture cho sai một luật ⇒ CI đỏ
- *happy*: `check_ci_teeth.py` xanh — phá từng luật **trong bộ nhớ**, khẳng định
  `check()` trả lỗi, rồi khôi phục.
- *edge*: phá một luật rồi **quên khôi phục** → lượt chạy sau đỏ vì trạng thái
  còn sót, không vì luật. Phép thử phải khôi phục **trong `finally`**, không ở
  cuối thân — một `assert` đỏ giữa đường bỏ qua phần khôi phục.
- *edge 2*: script phá luật bằng cách **ghi file thật** thay vì bộ nhớ → đây là
  đúng thứ `CẤM: sửa file thật để thử một cổng` nói, và thao tác **hoàn tác** là
  chỗ mất dữ liệu. Phép thử: quét script → 0 đường `open(..., "w")` vào `kb/`.
- *edge 3*: gỡ **một** cổng khỏi `check()` → `check_ci_teeth` phải **đỏ**. Nếu
  nó vẫn xanh thì nó đang phá những luật **không** trùng với dãy cổng thật, tức
  nó đo một danh sách gõ tay chứ không đo `check()`.

**AC-2.1.2** — toàn bộ test xanh trên cây sạch
- *happy*: `pytest core/tests -q` xanh.
- *edge*: cây **không sạch** (`git status` bẩn) → AC này **không** phát biểu gì.
  Đó là ca xảy ra **thường xuyên** ở dự án này (`git status` đã bẩn từ trước vì
  lý do không liên quan, plan `S17`) ⇒ *"trên cây sạch"* là một **tiền đề không
  ai kiểm**, không phải một phép đo.
- *edge 2*: một test đỏ vì **file của agent khác** → phải **quy chủ trước khi
  phán** (`git status` + `find -newermt`), không được báo là lỗi của lượt này
  (R6).

## 2.2 · Chạy lại validate, không tin hook local

**AC-2.2.1** — CI chạy `validate.py kb/` độc lập với hook
- *happy*: quét `ci.yml` → có bước gọi `validate.py kb/`, và bước đó **không**
  điều kiện theo kết quả hook.
- *edge*: bước đó có `continue-on-error: true` → cổng thành trang trí; phép thử
  phải đọc **cả** cờ đó, không chỉ sự tồn tại của bước.
- *edge 2*: kho **rỗng** → exit 0, và AC khai đúng rằng đó là **hợp lệ**. Nhưng
  một AC mà ca rỗng luôn xanh thì nó **chưa** đo gì cho tới khi kho có bài ⇒
  phép thử thật là *"kho có ≥1 bài sai ⇒ CI đỏ"*, và ca đó **không** nằm trong AC.
- *edge 3*: `validate.py kb/` chạy **không** `--strict` ở hook nhưng **có**
  `--strict` ở CI → hai bề mặt cho **hai kết quả khác nhau** trên cùng một kho
  (xem M02 `§cuối` mục 1: `--strict` đỏ trên cảnh báo). Spec không nói bề mặt nào
  dùng cờ nào.

## 2.3 · Pin phiên bản

**AC-2.3.1** — `python-version` trong workflow khớp `requires-python`
- *happy*: `check_version_pin.py` xanh — `ci.yml` pin `3.13`, `core/pyproject.toml`
  khai sàn khớp.
- *edge*: `requires-python = ">=3.9"` trong khi workflow pin `3.13` → đỏ, và lỗi
  phải **nói cả hai số** (chỉ nói "lệch" thì không sửa được).
- *edge 2*: `core/pyproject.toml` **vắng** → cổng phải nói *"không khai
  `requires-python`"* và **đỏ**, không xanh-vì-không-tìm-thấy. Fail-closed.
  ⚠️ File này **không** ở gốc repo mà ở `core/`; một phép thử tìm ở gốc sẽ
  xanh-oan bằng cách không tìm thấy gì để so.
- *edge 3*: workflow có **hai** dòng `python-version` (hai job) khác nhau → phải
  chốt: so dòng đầu, hay đòi mọi dòng khớp? Cổng hôm nay dùng `re.search` — nó
  lấy **dòng đầu** và **không** thấy dòng thứ hai.

## 2.4 · Bật CI là một quyết định

**AC-2.4.1** — khi đổi tên, cả 4 lệnh `hard` phải xanh trước đó
- *happy*: bốn lệnh xanh → rồi mới `ci.yml.template` → `ci.yml`.
- *edge*: đổi tên **trước** khi bốn lệnh xanh → CI đỏ từ commit đầu, và *"một CI
  đỏ từ commit đầu sẽ bị bỏ qua"* — đúng thứ làm S3 mất răng. Không có lệnh nào
  kiểm được **thứ tự thao tác người**, nên AC khai `soft` đúng.
- *edge 2*: `ci.yml` **đã** tồn tại (đo 2026-09-03: `.template` không còn) ⇒ AC
  này đã **tiêu thụ xong** và không còn đo được gì. Một AC đã dùng hết mà vẫn
  đứng trong spec như điều kiện tương lai là chỗ người đọc sau hiểu sai trạng thái.

## 2.5 · Hook local là bề mặt S4

**AC-2.5.1** — hook chặn commit file `.md` sai format
- *happy*: stage một `.md` sai format → hook chặn, exit khác 0.
- *edge*: stage một file **đạt chuẩn** → hook **KHÔNG** chặn. ⚠️ **Ca này đang
  ĐỎ** — xem `§cuối` mục 1.
- *edge 2*: commit **không** chạm `kb/**` → hook exit 0 **không chạy validate**
  (`pre-commit:8`). Nếu nó vẫn chạy, mọi commit trong `web/` trả giá cho một cổng
  không liên quan.
- *edge 3*: stage một file `kb/_nhap.md` (bắt đầu `_`) sai format → không chặn,
  vì `validate.py` bỏ qua file `_`. Nhưng `pre-commit:7` lọc bằng
  `grep '^kb/.*\.md$'` — nó **có** khớp `kb/_nhap.md` ⇒ hook đếm nó vào số file
  rồi chạy validate, và validate bỏ qua. Hai bộ lọc **khác nhau** cho cùng một
  câu hỏi; con số hook in ra ("validate: N file") vì thế **không** là số file
  được kiểm.

**AC-2.5.2** — `--no-verify` bỏ qua được hook, và CI vẫn bắt
- *happy*: `bash .githooks/test-hook.sh --no-verify-case` xanh (đo 2026-09-03: ✅).
- *edge*: nếu ca này **đỏ** thì nghĩa là hook **không** bỏ qua được — và đó
  không phải tin tốt: nó nghĩa là ai đó đã cài hook theo một đường mà `git` không
  kiểm soát, tức một cơ chế nằm ngoài mọi thứ khai được. AC này là **khẳng định**
  chứ không phải mong muốn, và đó là lý do CI phải chạy lại validate.

## 4 · Điều module CẤM — mỗi dòng một phép thử

- *sửa file trong `core/` hoặc `kb/`*: quét `phạm_vi_ghi` mọi task của M04 → 0
  đường trỏ `core/src/` hay `kb/`. **Đây là luật gốc**, không phải một luật tiện
  tay: M04 kiểm hai module đó.
  ⚠️ Ngoại lệ đã tồn tại: `check_ci_teeth.py` **nằm trong** `core/tests/`. Nó
  thuộc M04 về vai mà thuộc `core/` về đường dẫn ⇒ một phép thử chỉ đọc đường dẫn
  sẽ báo vi phạm oan.
- *bước tự `--fix` rồi commit*: quét `ci.yml` → 0 bước có `--fix` **và** 0 bước
  `git commit`/`git push`.
- *`continue-on-error: true` ở bước test*: quét `ci.yml` → 0 lần.
- *bật CI khi chưa dọn môi trường*: xem `AC-2.4.1`.

## Kết quả PHÉP THỬ s6 — bốn phát hiện

**1 · `AC-2.5.1` đang ĐỎ, và cái đỏ là THẬT — nhưng không phải lỗi của hook.**
Đo 2026-09-03:

```
pass · hook chặn commit file .md sai format
FAIL · hook chặn cả file ĐẠT CHUẨN — đỏ giả, người ta sẽ tắt hook
```

Tái hiện trên **bản copy** của `kb/` (không chạm kho thật): copy
`core/tests/fixtures/dat-chuan.md` vào `kb/paper/` → **4 lỗi**:
`walk-forward-validation` và `data-leakage` **không có** trong
`kb/concepts.yaml` · `citations_sampled` khai 0 mà máy đếm 8 ·
`unverifiable_citations` phải `true`.

⇒ **Fixture tên "đạt chuẩn" KHÔNG còn đạt chuẩn.** Và lý do sâu hơn tên gọi:

> *"Đạt chuẩn" không phải thuộc tính của một file. Nó là quan hệ giữa file và
> **danh mục** nó rơi vào.* `kb/concepts.yaml` co lại (704 byte, ghi 08-29) và
> mất hai id fixture dùng. Fixture không đổi; **nền** đổi.

Nên `pytest -k ban_dat_chuan` **xanh** (nó chạy trên nền của riêng nó) trong khi
`test-hook.sh` **đỏ** (nó thả fixture vào `kb/` thật). Hai phép thử cùng tên
"đạt chuẩn", **hai nền khác nhau**, hai kết quả — và không cổng nào canh chuyện
đó.

**`đỏ_do:`** — `chưa quy được chủ`. `kb/concepts.yaml` mtime **08-29 13:54**,
fixture **08-27 18:33**, `test-hook.sh` **08-19 02:11**; cả ba **trước** phiên
này (2026-09-02/03) và phiên này không chạm `.githooks/**`,
`core/tests/fixtures/**`, hay `kb/concepts.yaml`.

**2 · `§5` khai *"31 bước"*, thực tế 71.** Cùng lớp *tự khai* với M01 (ba con số)
và M02 (*"0 bài"*). Ba module, cùng một bệnh, không cổng nào canh.

**3 · `AC-2.4.1` đã tiêu thụ xong.** `ci.yml.template` không còn tồn tại; `ci.yml`
đã bật. AC vẫn viết như một điều kiện **tương lai** (*"Khi đổi tên…"*), và `§2.3`
vẫn viết *"Hiện tại KHÔNG khớp"* trong khi `§5` nói nợ đó đã trả (pin `3.13`).
Spec kể **hai** trạng thái cho cùng một thứ, ở hai mục cách nhau 60 dòng.

**4 · Hai bộ lọc khác nhau cho cùng một câu hỏi** (`AC-2.5.1 edge 3`).
`pre-commit:7` lọc `^kb/.*\.md$` và **khớp** `kb/_nhap.md`; `validate.py` **bỏ
qua** file `_`. Con số hook in ra (*"validate: N file"*) vì thế không phải số file
được kiểm. Vô hại hôm nay, và nó là chỗ một người debug sẽ mất thời gian.

⇒ Cả bốn vào `backlog.md`. Mục 1 là **bug thật đang đỏ**, không phải nợ tài liệu.
