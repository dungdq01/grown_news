#!/usr/bin/env bash
# BẬT CẢ BA DỊCH VỤ + nhật ký vận hành. Chỉ đạo chủ dự án 2026-09-05.
#
# Vì sao một script chứ không ba lệnh trong README: thứ tự và ENV là chỗ đã trả
# giá hai lần. Lần một `api.py` gõ cứng đường hàng đợi trong khi worker đọc env
# ⇒ `POST /job` trả 201 mà worker báo "hàng đợi rỗng". Lần hai `api.py` chạy với
# `CHUNGCAT_HANG_DOI=%TEMP%/hd-e2e` còn sót từ phiên E2E ⇒ 8 việc nằm trong thư
# mục tạm, `chungcat/hang-doi/` có 6 việc khác, và cả hai bên đều "đúng".
#
# Nên: script này KHÔNG đặt `CHUNGCAT_HANG_DOI`. Vắng biến ⇒ `goc_mac_dinh()`
# trả `chungcat/hang-doi/` trong repo, và cả ba bên cùng thấy một chỗ.
set -euo pipefail
cd "$(dirname "$0")"

P=./.venv/Scripts/python.exe
[ -x "$P" ] || P=python

# `unset` tường minh: một biến còn sót trong shell của người chạy là đúng lỗi
# lần hai, và nó im lặng.
unset CHUNGCAT_HANG_DOI || true

mkdir -p log
export GN_LOG_DIR="$(pwd)/log"   # MỘT chỗ cho cả Python và Node; `nhatky.mjs` đọc
                                 # cùng biến, nên hai bên không thể ghi lệch chỗ
export PYTHONIOENCODING=utf-8       # không có nó `print` tiếng Việt giết tiến
                                    # trình trên console cp1252 của Windows

# ── NẠP `.env` CHO CẢ BA, KHÔNG CHỈ CHO PYTHON ──────────────────────────────
#
# `api.py` và `worker.py` gọi `moi_truong.nap()` nên chúng tự đọc `.env`.
# `server.mjs` thì KHÔNG — nó chỉ đọc `process.env`. Hệ quả đo được ngay lần
# chạy đầu của script này, và nhật ký là thứ chỉ ra:
#
#   [worker] 0f21ff2f… · HỎNG · [dang-verify] LÕI trả 401: "không được phép"
#
# Worker gửi `KHOA_DICH_VU` thật (nó đọc `.env`), LÕI so với `process.env`
# rỗng ⇒ 401 ở giai đoạn CUỐI, sau khi token đã tiêu. Hai nửa của một hệ đọc
# hai nguồn cấu hình khác nhau — đúng lớp lỗi `goc_mac_dinh()` sinh ra để dẹp,
# chỉ lần này lệch giữa hai NGÔN NGỮ.
#
# Nạp ở ĐÂY, một chỗ, trước khi bật bất cứ ai. KHÔNG in giá trị.
if [ -f .env ]; then
  while IFS= read -r dong || [ -n "$dong" ]; do
    case "$dong" in
      ''|'#'*) continue ;;                      # dòng trống và chú thích
      *=*)
        ten=${dong%%=*}
        # Chỉ nhận tên biến hợp lệ: `.env` của dự án còn mang ghi chú của
        # người, và một dòng văn xuôi có dấu `=` không phải một biến.
        case "$ten" in
          [A-Za-z_][A-Za-z0-9_]*)
            gt=${dong#*=}
            gt=${gt%$'\r'}                      # CRLF của Windows
            export "$ten=$gt" ;;
        esac ;;
    esac
  done < .env
  echo "→ đã nạp .env (giá trị KHÔNG in ra)"
fi

# ── DỪNG BẢN CŨ TRƯỚC KHI BẬT BẢN MỚI ──────────────────────────────────────
#
# Không có bước này thì mỗi lần chạy script là một tầng dịch vụ nữa, và trên
# Windows nó KHÔNG báo lỗi: `HTTPServer.allow_reuse_address` + `SO_REUSEADDR`
# cho hai socket bind cùng một cổng THÀNH CÔNG (`WO-042` đã ghi). `netstat` chỉ
# hiện một listener, còn kết nối có thể vào listener CŨ — listener đọc env của
# NÓ, nên nó trả 403 cho lời gọi mang đúng khoá.
#
# Đo được 2026-09-05: SÁU `server.mjs` + SÁU `api.py` cùng sống, và
# `GET /api/job` trả 403 trong khi `POST /api/job` trả 201 — hai lời gọi cùng
# một khoá, hai listener khác nhau. Cộng thêm HAI worker cùng ăn một hàng đợi.
#
# `pkill -f` theo dòng lệnh, không theo cổng: worker KHÔNG mở cổng nào, nên lọc
# theo cổng bỏ sót đúng tiến trình gây tranh hàng đợi.
echo "→ dừng bản cũ (nếu có)"
# ① Theo FILE PID mà chính script này ghi ở lần chạy trước.
#
#    Vì sao không `pkill -f`: đo được 2026-09-05 — `pkill -f 'worker\.py'` trên
#    Git Bash/Windows **không khớp** tiến trình `python.exe` native, nên BỐN
#    worker sống sót qua ba lần chạy script và cùng ăn một hàng đợi. `pkill`
#    "thành công" (exit 0) mà không giết gì: một lệnh dọn IM LẶNG không dọn.
#
#    File PID thì đúng theo định nghĩa: nó chứa PID mà script này đã tạo, và
#    "khởi động lại" nghĩa là dừng đúng những tiến trình đó.
#    `worker-*.pid` là GLOB, không phải một tên: từ 2026-09-07 script dựng HAI
#    worker (`w1`/`w2`), mỗi bản một file PID theo `CHUNGCAT_WORKER_ID`. Vòng
#    cũ chỉ tìm `log/worker.pid` — một tên không còn ai ghi — nên nó bỏ sót
#    đúng những tiến trình mà nó có nhiệm vụ dừng, và im lặng.
for T in api-tho api-loi; do
  if [ -f "log/$T.pid" ]; then
    taskkill //PID "$(cat "log/$T.pid")" //F >/dev/null 2>&1 || true
    rm -f "log/$T.pid"
  fi
done
for F in log/worker.pid log/worker-*.pid; do
  [ -f "$F" ] || continue
  taskkill //PID "$(cat "$F")" //F >/dev/null 2>&1 || true
  rm -f "$F"
done
# ĐO LẠI — và tôi đã đếm SAI một lần, ghi ra để không ai đếm sai lần nữa:
#
# `.venv/Scripts/python.exe` là một SHIM: nó spawn trình thông dịch thật, nên
# một worker cho ra HAI `python.exe` có CÙNG dòng lệnh (cha 29480 → con 29036,
# `ParentProcessId` chứng minh). Tôi đọc hai dòng đó là "hai worker trùng" và
# tưởng phép dừng không chạy. Nó chạy: file PID chứa PID của CON (Python tự ghi
# bằng `os.getpid()`), và giết con thì cha đi theo — đo được ở hai lần chạy
# liên tiếp.
#
# ⇒ Đếm tiến trình theo dòng lệnh trên Windows phải xem `ParentProcessId`, nếu
#   không thì mọi con số gấp đôi. Lưới ① dưới đây là lưới THẬT.
#
# Một lưới `Get-CimInstance ... -match` tôi từng thêm ở đây KHÔNG chạy (không
# giết gì) và tôi đã bỏ: để lại một lưới không hoạt động tệ hơn không có lưới —
# người đọc sau sẽ tin debris đã được dọn. `pkill` ở lưới ③ cũng là no-op với
# tiến trình native của Windows; giữ nó cho Linux/macOS.

# ② Ai còn giữ cổng thì cắt theo PID — bắt cả tiến trình do người khác bật tay.
for CONG in 8787 8790; do
  for PID in $(netstat -ano 2>/dev/null | grep ":$CONG " | grep LISTENING                | awk '{print $5}' | sort -u); do
    taskkill //PID "$PID" //F >/dev/null 2>&1 || true
  done
done
# ③ `pkill` — lưới cuối, và lưới duy nhất trên Linux/macOS.
pkill -f 'chungcat/src/worker\.py' 2>/dev/null || true
pkill -f 'chungcat/src/api\.py'    2>/dev/null || true
pkill -f 'node server\.mjs'        2>/dev/null || true
sleep 2

# Đường TUYỆT ĐỐI cho mọi redirect. Bản đầu viết
#     ( cd web && node server.mjs ) > ../log/api-loi.out
# và `../log/` được shell NGOÀI phân giải — TRƯỚC khi `cd web` chạy — nên nó
# trỏ ra NGOÀI repo. LÕI không bật, và không file nào giải thích vì sao.
L="$(pwd)/log"

echo "→ THỢ  chungcat/src/api.py   :8790"
"$P" chungcat/src/api.py            > "$L/api-tho.out"  2>&1 &
echo "→ LÕI  web/server.mjs        :8787"
( cd web && exec node server.mjs )  > "$L/api-loi.out"  2>&1 &
# `--vong` BẮT BUỘC: không cờ thì `worker.py` in trợ giúp rồi thoát, và ba dòng
# trợ giúp trong `worker.out` là tất cả những gì nói rằng nó chưa chạy.
# HAI worker, đúng `nguong.json → song_song.tien_trinh: 2`. Trước 2026-09-07
# script dựng đúng MỘT, nên con số ở bảng khai chưa từng có hiệu lực khi chạy
# bằng script — bảng nói 2, hệ chạy 1, và không ai báo.
#
# `CHUNGCAT_WORKER_ID` BẮT BUỘC khác nhau (`chungcat/README.md`): nó vừa là
# khoá tiến trình (`log/worker-<id>.pid`) vừa là sổ egress riêng
# (`hang-doi/egress.<id>.jsonl`). Một sổ chung có khoá thì `seq` — số TA cấp
# bằng cách đọc dòng cuối — thành một cuộc đua trên chính phép cấp số.
for W in w1 w2; do
  echo "→ WORKER $W (vòng lặp)"
  CHUNGCAT_WORKER_ID="$W" "$P" chungcat/src/worker.py --vong \
    > "$L/worker-$W.out" 2>&1 &
done

sleep 3
echo
echo "nhật ký JSONL:  log/api-tho.jsonl · log/api-loi.jsonl · log/worker.jsonl"
echo "stdout:         log/*.out"
echo "tổng hợp:       $P chungcat/tools/xem_nhat_ky.py"
echo "theo dõi:       $P chungcat/tools/xem_nhat_ky.py --theo-doi"
