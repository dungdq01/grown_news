# T04-12 — `.gitattributes`: `kb/_media/** -text` để git không đổi EOL của hiện vật (WO-100 vế B)

> WO: `.factory/wo/WO-100-cong-pha-du-lieu-cua-cay-dang-do.md` vế B.
> ID rule 9: `ls 07_plan/M04_ci/tasks` max 10 ⇒ dải CHẴN ⇒ **12**.
>
> **Việc**: `.gitattributes` hôm nay **rỗng nội dung** (hai dòng comment giữ đất, map v29).
> Trên Windows git checkout `.vtt` ra **CRLF** ⇒ `sha256` nội dung **≠** `sha256` trong
> **tên file** ⇒ mọi bên kiểm byte từ chối. Đó là nguyên nhân gốc của sự cố worktree
> 2026-09-11: `dung_lai_db` dừng giữa chừng để lại DB rỗng, `xuat_kho` coi 16 export là
> mồ côi và xoá.
>
> **Vì sao `-text` chứ không phải `binary`**: `-text` chỉ tắt chuyển đổi EOL; `binary`
> (= `-text -diff`) còn tắt cả diff — với `.vtt` là văn bản thật thì mất diff là mất một
> thứ hữu ích khi đọc lịch sử. Kho hiện vật cần **byte nguyên vẹn**, không cần giấu diff.
>
> **Đây cũng là họ hàng của hai ca khác**: `check_worklog` đỏ 8 vế trên worktree mà xanh
> trên `main`, và *"19 file lệch chỉ vì EOL"* lúc review nhánh m13. Một dòng
> `.gitattributes` đóng cả họ.

phạm_vi_ghi:
  - .gitattributes

phụ_thuộc: —

verifiability: hard
tiêu_chí:
  - AC1: file `.vtt` trong `kb/_media/` checkout ra **byte y hệt** bản trong git trên
      worktree Windows — `sha256` nội dung == `sha256` trong tên file, cho **cả 3** file
      media đang track
    cmd: python core/tools/dung_lai_db.py --kiem
    đỏ_khi: một file có sha lệch tên ⇒ nêu đúng tên file
    xanh_khi: 3/3 khớp trên cả `main` lẫn worktree
  - AC2: `git check-attr -a kb/_media/258f826e...vtt` in `text: unset`; và một file
      **không** thuộc `kb/_media` (vd `RUNNING.md`) **vẫn** được chuẩn hoá EOL như cũ —
      luật không rộng quá chỗ cần
    cmd: python core/tests/check_ci_teeth.py
  - AC3: sau khi thêm luật, `git status` trên worktree **không** báo file media nào
      "đã đổi" (nếu có thì phải `git add --renormalize` một lần và commit kèm)
    cmd: python core/tests/check_ci_teeth.py

# ⚠️ Thi công xong phải kiểm trên CẢ HAI cây (`Grown_news` và `../gn-m13`) — lỗi này
# vô hình trên `main` và chỉ lộ ở worktree. Đó là lý do nó sống lâu.
