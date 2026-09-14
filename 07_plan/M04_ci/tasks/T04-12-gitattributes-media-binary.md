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
  - AC1: mọi `.vtt` trong `kb/_media/` đang track có `sha256` **nội dung** == `sha256`
      trong **tên file**, đo ngay trên cây đang đứng. Cổng chỉ **đọc**, không dựng DB
    cmd: python core/tests/check_media_sha_ten.py
    đỏ_khi: một file có sha lệch tên ⇒ in đúng tên file, sha đọc được, sha trong tên
    xanh_khi: mọi file khớp, in số file đã đo (0 file ⇒ ĐỎ, không phải xanh)
  - AC2: luật có hiệu lực và **không rộng quá chỗ cần** — `git check-attr text <file
      trong kb/_media>` in `text: unset`, và `git check-attr text RUNNING.md` **không**
      in `unset`
    cmd: python core/tests/check_media_sha_ten.py --thuoc-tinh
    đỏ_khi: media không `unset`, hoặc một file ngoài `kb/_media` bị `unset` lây
    xanh_khi: cả hai vế đúng
  - AC3: **đo được trên cây bẩn lẫn cây sạch** — `git -c core.autocrlf=true checkout-index`
      một `.vtt` vào **thư mục tạm** rồi so sha; không luật ⇒ ĐỎ, có luật ⇒ XANH
    cmd: python core/tests/check_media_sha_ten.py --ca-hai-che-do
    đỏ_khi: bản checkout ở chế độ autocrlf=true lệch byte so với blob
    xanh_khi: hai chế độ ra cùng sha

# ⚠️ PM SỬA AC 2026-09-15 — ba `cmd` cũ ĐỀU không đo được thứ AC nói, đo tại chỗ:
#   grep -c add_argument core/tools/dung_lai_db.py             ⇒ 0
#   grep -cE "unlink|INSERT|commit\(\)" core/tools/dung_lai_db.py ⇒ 17
#   grep -ciE "gitattributes|check-attr|_media" core/tests/check_ci_teeth.py ⇒ 0
# Nghĩa là `--kiem` bị NUỐT IM LẶNG và `dung_lai_db.py` chạy nhánh **GHI**; còn
# `check_ci_teeth.py` không nhắc một chữ nào về `gitattributes` nên không thể đỏ vì
# AC này. `verifiability: hard` mà không AC nào đo được là **hard trá hình**.
# PM đã tự kiểm bằng cách chạy `dung_lai_db.py --kiem` trên cây `main`: nó **dựng lại
# DB thật** (18 bản ghi). Không mất dữ liệu lần đó (0 file bị xoá, hai dịch vụ còn sống),
# nhưng đó đúng là sự cố `WO-100` vế A lặp lại — gây ra bởi chính AC này.
#
# ⚠️ `check_media_sha_ten.py` **chưa tồn tại**. Nó là đất `core/tests/**` = M01, nên
# phải là một đơn vị TEST riêng của M01 trước khi đơn vị này verify được. Xem `T01-62`.
# KHÔNG được thay bằng một `cmd` tiện tay đang có sẵn — đó là cách ba AC trên hỏng.
#
# ⚠️ Thi công xong phải kiểm trên CẢ HAI cây (`Grown_news` và `../gn-m13`) — lỗi này
# vô hình trên `main` và chỉ lộ ở worktree. Đó là lý do nó sống lâu.
#
# Vật giao ra thì ĐÚNG và đã có bằng chứng máy (`.gitattributes` `kb/_media/** -text`;
# worktree 2/8 sha lệch trước → 8/8 sau; main 10/10). Sửa AC không phải vì mã sai — mã
# đúng. Sửa vì **thước** sai, và một vật đúng đo bằng thước sai vẫn là chưa đo.
