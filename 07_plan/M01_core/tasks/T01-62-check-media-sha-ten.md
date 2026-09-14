# T01-62 — đơn vị TEST: `check_media_sha_ten.py` — cổng ĐỌC đo byte hiện vật khớp tên file

> Vì sao đơn vị này tồn tại: `T04-12` (`.gitattributes kb/_media/** -text`) giao ra một
> **vật đúng** nhưng cả ba `cmd` của nó **không đo được gì**. PM tự bắt 2026-09-15 khi
> reviewer nêu, rồi đo tại chỗ:
>
> ```
> grep -c add_argument core/tools/dung_lai_db.py                    ⇒ 0
> grep -cE "unlink|INSERT|commit\(\)" core/tools/dung_lai_db.py     ⇒ 17
> grep -ciE "gitattributes|check-attr|_media" core/tests/check_ci_teeth.py ⇒ 0
> ```
>
> Nghĩa là `dung_lai_db.py --kiem` **nuốt im lặng** cờ `--kiem` rồi chạy nhánh **GHI**.
> PM đã chạy thật một lần để chứng minh, và nó **dựng lại DB kho thật** (18 bản ghi).
> Lần ấy không mất gì (0 file bị xoá, hai dịch vụ còn sống), nhưng đó đúng là sự cố
> `WO-100` vế A lặp lại — lần này do một AC gây ra chứ không do một cổng.
>
> ⚠️ **Cổng này chỉ ĐỌC.** Đó không phải một lời hứa, nó là `AC4` dưới đây. Một cổng đo
> hiện vật mà được phép ghi lên hiện vật là đúng thứ luật gốc cấm: *không ai được sở hữu
> thứ dùng để đánh giá mình*, ở dạng công cụ.
>
> ID rule 9: `ls 07_plan/M01_core/tasks` max dải hiện hành 58 ⇒ **62** (60 để trống cho
> `WO-100` vế A nếu phải chẻ; 90+ là PM-Space).

phạm_vi_ghi:
  - core/tests/check_media_sha_ten.py

phụ_thuộc: —

verifiability: hard
tiêu_chí:
  - AC1: không cờ ⇒ với mỗi `.vtt` đang track trong `kb/_media/`, so `sha256` **nội dung**
      với `sha256` trong **tên file**. Đo được **số file đã đo** và in ra; **0 file đo ⇒ ĐỎ**,
      không phải xanh
    cmd: python core/tests/check_media_sha_ten.py
    đỏ_khi: một file lệch ⇒ in tên file · sha đọc được · sha trong tên. Hoặc đo 0 file
    xanh_khi: mọi file khớp, và số file in ra > 0
  - AC2: `--thuoc-tinh` ⇒ `git check-attr text` cho một file trong `kb/_media` phải là
      `unset`, và cho `RUNNING.md` phải **không** `unset` — luật không rộng quá chỗ cần
    cmd: python core/tests/check_media_sha_ten.py --thuoc-tinh
    đỏ_khi: media không `unset`, hoặc một file ngoài `kb/_media` bị `unset` lây
    xanh_khi: cả hai vế đúng
  - AC3: `--ca-hai-che-do` ⇒ `git -c core.autocrlf=true checkout-index` một `.vtt` vào
      **thư mục tạm** rồi so sha với blob. Đây là vế bắt được lỗi mà `main` giấu
    cmd: python core/tests/check_media_sha_ten.py --ca-hai-che-do
    đỏ_khi: bản checkout ở `autocrlf=true` lệch byte so với blob
    xanh_khi: hai chế độ ra cùng sha
  - AC4: **cổng chỉ ĐỌC** — chạy cả ba chế độ xong, `git status --porcelain` phải in
      **y hệt** trước và sau; và `grep -cE "unlink|rmtree|INSERT|commit\(\)|open\(.*[\"']w"`
      trong chính file cổng ⇒ **0** ngoài thư mục tạm
    cmd: python core/tests/check_media_sha_ten.py --tu-kiem
    đỏ_khi: cây đổi một byte sau khi chạy cổng, hoặc file cổng có lệnh ghi ngoài tmp
    xanh_khi: `git status` y hệt, 0 lệnh ghi
  - AC5: **không đỏ oan** — fixture ở thư mục tạm có một file tên đúng sha ⇒ im lặng,
      exit 0; đổi một byte nội dung ⇒ đỏ, nêu đúng file đó
    cmd: python core/tests/check_media_sha_ten.py --tu-kiem

# AC4 là vế quan trọng nhất và là lý do đơn vị này không gộp vào T04-12: một cổng đo
# hiện vật PHẢI chứng minh được nó không chạm hiện vật. `check_running.py` (WO-100 vế A)
# và `dung_lai_db.py --kiem` (ca này) là hai lần cùng một lớp lỗi trong một tuần.
#
# CẤM: KHÔNG gọi `dung_lai_db.py` hay `xuat_kho.py` từ cổng này, kể cả với cờ. Cần một
# DB để so thì dựng ở thư mục tạm bằng `KB_DIR`, đúng khuôn `do_tai.py:216`.
