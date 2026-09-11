# T01-56 — đơn vị TEST: `check_running.py` không đổi một byte nào của cây đang đo (WO-100 vế A)

> Test đi ĐẦU, ĐỎ trước mã (`rule.md` mục 8). Tách khỏi `T01-58` vì **R1**, và vì luật
> gốc: **cổng chấm `check_running` không nằm cùng đơn vị với việc sửa `check_running`**.
> WO: `.factory/wo/WO-100-cong-pha-du-lieu-cua-cay-dang-do.md` vế A.
> ID rule 9: `ls 07_plan/M01_core/tasks` max 54 ⇒ dải CHẴN của dev chính ⇒ **56**.
>
> **Phải ĐỎ vì LUẬT**: hôm nay `check_running.py:50` `subprocess.run` chạy thật
> `dung_lai_db.py` và `xuat_kho.py` (`RUNNING.md:173-174`) trên `kb/` của cây đang dùng;
> hai lệnh không có cờ ghi nên nhánh "chỉ cú pháp" (`:96`) không bắt, và `GHI_KHONG_CO`
> (`:45`) chỉ có một phần tử. Ca A dưới đây phải ĐỎ vì **cây bị đổi**, không phải vì
> thiếu file.
>
> ⚠️ **Fixture là một repo GIẢ ở thư mục tạm**, có `kb/` + `RUNNING.md` riêng. Tuyệt đối
> **không** chạy ca nào trên cây thật — đó đúng là thứ WO này tố. `chup_cay()` (`:48`) đã
> có sẵn để chụp trạng thái; dùng lại nó, đừng viết bản thứ hai.

## Bốn ca

| ca | gieo | phải ra |
|---|---|---|
| A | repo giả có `kb/` đầy + `RUNNING.md` liệt `dung_lai_db.py` và `xuat_kho.py` | sau khi chạy `check_running`, **băm cây trước == băm cây sau** cho `kb/**`, `_recycle/**`, `web/_loi.sqlite*`; 0 file mất, 0 file sinh |
| B | thêm một lệnh GHI **mới** vào `RUNNING.md` giả (vd `python core/tools/xuat_kho.py --ghi`) | cổng vẫn không đổi cây; nếu nó đổi ⇒ **ĐỎ nêu đúng lệnh và đúng file bị đổi**, không chỉ "cây bẩn" |
| C | repo giả có `.vtt` với **CRLF** (mô phỏng worktree Windows) | `check_running` **không** để lại DB rỗng và **không** xoá file export — dù lệnh bên trong thất bại |
| D | `RUNNING.md` giả có một lệnh **đọc** (`validate.py kb/`) | cổng **vẫn chạy thật** lệnh đó — bản sửa không được biến mọi lệnh thành "chỉ cú pháp" |

Ca D là vế chống-sửa-quá-tay: đóng vế A bằng cách hạ mọi lệnh xuống `--help` thì cổng
mất răng, và `RUNNING.md` thành một danh sách không ai kiểm.

phạm_vi_ghi:
  - core/tests/test_gates.py
  - core/tests/fixtures/**

phụ_thuộc: —

verifiability: hard
tiêu_chí:
  - AC1: bốn ca chạy trên repo GIẢ ở `tempfile.TemporaryDirectory()`; TRƯỚC `T01-58`
      thì A·B·C ĐỎ ("cây bị đổi: <file>"), D XANH; SAU `T01-58` cả bốn xanh.
      Ghi output ĐỎ nguyên văn vào worklog cùng entry với XANH
    cmd: python -m pytest core/tests/test_gates.py -q -k running_khong_pha_cay
  - AC2: cổng tự chứng minh ĐỎ ĐƯỢC — bỏ vế bảo vệ trong fixture ⇒ ca A đỏ lại
    cmd: python -m pytest core/tests/test_gates.py -q -k running_khong_pha_cay
  - AC3: 0 ca nào đọc hay ghi `kb/` thật — grep đường dẫn tuyệt đối tới repo thật
      trong ca test ⇒ 0; chạy hai lần liên tiếp ra cùng kết quả
    cmd: python -m pytest core/tests -q
