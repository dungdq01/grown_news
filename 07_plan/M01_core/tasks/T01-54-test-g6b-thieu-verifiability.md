# T01-54 — đơn vị TEST: cổng cho `check_g6b` — thiếu `verifiability:` phải ĐỎ, không CRASH (WO-084)

> **Ngữ cảnh + harness cho dev: `07_plan/M13_truyhoi/BAN-GIAO-DEV.md`** — §1 harness, §4 bàn giao.
> Test đi ĐẦU, ĐỎ trước mã (`rule.md` mục 8). Tách khỏi `T01-53` vì **R1**: đơn vị
> không phải test thì không chạm file test — và `check_g6b` là thứ đang bị chấm, nên
> cổng chấm nó phải là một đơn vị riêng (*không ai được sở hữu thứ dùng để đánh giá mình*).
> ID rule 9: max T01-53 ⇒ 54.
>
> **ĐÃ DUYỆT** 2026-09-09 (chủ dự án: *"2. duyệt"*), đi trước `T01-53`.
>
> 🔁 **CHỦ THI CÔNG ĐỔI 2026-09-10 — dev M12 làm đơn vị này** (cùng `T01-53`, cùng
> WO-084). PM M13 / dev M13 **không chạm**. Thứ tự nội bộ giữ nguyên: `T01-54` (test,
> ĐỎ trước trên **fixture**) → `T01-53` (sửa cổng).
>
> ⚠️ **Cách dựng ca A đã ĐỔI so với bản đầu.** Bản đầu nói *"hôm nay chạy trên plan
> thật ra TypeError"* — điều đó **hết đúng từ 16:09**: chủ hai task M03 đã sửa
> `T03-136`/`T03-137`, nên plan thật không còn dữ liệu kích hoạt. Ca A vì thế **phải**
> dựng trên **fixture thư mục tạm** (một task giả thiếu `verifiability:`), và đó cũng
> là cách đúng ngay từ đầu — một cổng chấm `check_g6b` mà đọc plan thật thì nó đổi màu
> theo việc của người khác.
>
> **Phải ĐỎ vì LUẬT, không vì thiếu file.** Ca A trên fixture phải ra
> `TypeError: unsupported format string passed to NoneType.__format__` tại `:81` —
> tức nó đỏ vì cổng **crash trước khi in**, đúng lý do `WO-084` vế B mô tả (và đúng
> traceback mà plan thật đã sinh ra lúc 15:2x, ghi ở `WO-084 §1`). Đỏ vì `ImportError`
> hay vì thiếu file fixture thì **không tính**.
> Ghi output đỏ **nguyên văn** vào worklog cùng entry với output xanh sau khi `T01-53`
> xong (`rule.md` mục 8 — R5 đo bằng bằng chứng trong worklog, không bằng trạng thái
> suite trên cây chung).

## Bốn ca, mỗi ca một giá trị vắng

Fixture dựng ở `tempfile.TemporaryDirectory()`, cây `07_plan/<M>/tasks/T99-1-x.md`
giả + một `project_map.yaml` tối thiểu — **không** sửa file thật, và **không** đọc
`07_plan/` thật (một cổng đọc plan thật thì nó đỏ theo việc của người khác).

| ca | gieo | phải ra |
|---|---|---|
| A | task **không có** dòng `verifiability:` | ĐỎ nêu tên task + `verifiability=None`; exit 1; **0** traceback |
| B | `verifiability: hard` đủ, `phạm_vi_ghi` **rỗng** | ĐỎ `thiếu phạm_vi_ghi`, không crash |
| C | `verifiability: hard`, **0** dòng `- AC` | ĐỎ `không AC nào`, không crash |
| D | task **đủ ba mục** | XANH, exit 0 — chứng minh **không đỏ oan** |

Ca A là ca của WO-084. Ba ca kia có vì `:81` in **bốn** ô (`mod` · `verif` · `acs` ·
`cmds`) và bất kỳ ô nào vắng cũng có thể chết cùng cách — sửa một ô rồi để ba ô kia là
sửa một phần ba cái bẫy.

phạm_vi_ghi:
  - core/tests/test_gates.py
  - core/tests/fixtures/**

phụ_thuộc: —

verifiability: hard
tiêu_chí:
  - AC1: bốn ca A·B·C·D chạy trên fixture thư mục tạm; A·B·C ĐỎ nêu đúng tên task,
      D XANH. Trước T01-53 thì A ĐỎ vì traceback (ghi output vào worklog), sau T01-53
      thì A ĐỎ vì kết luận
    cmd: python core/tests/test_gates.py -k g6b_thieu_verifiability
  - AC2: cổng KHÔNG đọc 07_plan/ thật — grep đường dẫn tuyệt đối tới 07_plan trong
      ca test ⇒ 0; đổi một task thật không làm ca này đổi màu
    cmd: python core/tests/test_gates.py -k g6b_thieu_verifiability
  - AC3: suite core xanh
    cmd: python -m pytest core/tests -q
