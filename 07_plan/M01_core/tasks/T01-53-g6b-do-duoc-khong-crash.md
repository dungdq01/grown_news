# T01-53 — `check_g6b` ĐỎ nêu tên task thay vì CRASH khi thiếu `verifiability:` (WO-084)

> **Ngữ cảnh + harness cho dev: `07_plan/M13_truyhoi/BAN-GIAO-DEV.md`** — §1 harness,
> §3.2 bẫy `check_ba`, §4 bàn giao. Đơn vị này **chen lên trước `T01-52`**: nó là cổng
> mà mọi đơn vị khác dùng để tự kiểm, và hai nhánh đang mất nó.
> WO: `.factory/wo/WO-084-check-g6b-crash-thay-vi-do.md` (repro một lệnh, hai vế, hai chủ).
> ID rule 9: `ls 07_plan/M01_core/tasks` max 52 ⇒ 53.
>
> **Vế B của WO-084** — cổng CRASH thay vì ĐỎ. Vế A (hai task M03 khai sai khoá) là
> việc của chủ hai task đó, **không** thuộc đơn vị này.
>
> **ĐÃ DUYỆT** 2026-09-09 (chủ dự án: *"2. duyệt"*).
>
> 🔁 **CHỦ THI CÔNG ĐỔI 2026-09-10 — dev M12 làm đơn vị này.** Chủ dự án: *"WO 84
> dev M12 fix bug, tạm thời ko động"*. **PM M13 và dev M13 KHÔNG chạm** đơn vị này
> và `core/tests/check_g6b.py`. ID giữ nguyên (`T01-53`) vì 6 chỗ đang trỏ; chỉ đổi
> người làm. **Hết chen lên trước `T01-52`**: cổng hôm nay không còn crash (chủ M03
> đã sửa hai task lúc 16:08/16:09), nên dev M13 **không chờ** đơn vị này — hai việc
> chạy song song, khác người, khác file.
>
> ⚠️ **Vế A của WO-084 đã đóng lúc 16:08/16:09** (chủ hai task M03 tự sửa) nên cổng
> hôm nay **hết crash** — nhưng nó xanh vì **hết dữ liệu kích hoạt**, không vì đã
> chịu được giá trị vắng. Đừng đọc màu xanh đó thành "việc này xong": `:81` vẫn in
> bốn ô qua f-string, và task tiếp theo khai thiếu một trường sẽ lại khoá cổng cho
> cả hai nhánh. Xem `WO-084 §6`.
>
> Điều phải giữ nguyên: **KHÔNG nới regex** để nhận khuôn `- **Loại**: PATCH · hard`
> thành khuôn thứ hai của `verifiability`. Đo 2026-09-09: 295/297 task dùng
> `verifiability:`; hai file dùng khuôn kia đều `??` chưa commit. Hai khuôn cho một
> trường là hai chỗ sẽ lệch, và đổi khuôn là quyết định riêng phải đổi cả 297 task.

phạm_vi_ghi:
  - core/tests/check_g6b.py

phụ_thuộc: T01-54

verifiability: hard
tiêu_chí:
  - AC1: chạy trên plan THẬT hôm nay ⇒ không traceback; in FAIL cho T03-136 và
      T03-137 với lý do `verifiability=None`, và **vẫn kiểm hết** 297 task (dòng
      "N task — khai đủ ba mục bắt buộc" ra đúng 297, và phần 2·3·4·5 đều chạy)
    cmd: python core/tests/check_g6b.py
  - AC2: fixture task thiếu `verifiability:` ở thư mục TẠM ⇒ ĐỎ nêu đúng tên task,
      exit 1 vì KẾT LUẬN (không phải vì exception); thêm `verifiability: hard` vào
      fixture ⇒ XANH. Chứng minh cổng đỏ được VÀ không đỏ oan
    cmd: python core/tests/test_gates.py -k g6b_thieu_verifiability
  - AC3: mọi ô in ra chịu được giá trị vắng — gieo lần lượt `verif=None`,
      `scope=[]`, `acs=[]`, `cmds=[]` trên fixture, không ca nào traceback
    cmd: python core/tests/test_gates.py -k g6b_thieu_verifiability
  - AC4: suite core xanh (cổng này nằm trong test_gates)
    cmd: python -m pytest core/tests -q
