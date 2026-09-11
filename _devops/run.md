# run — bảng lệnh chạy

> **Chỉ là bảng LỆNH.** Vì sao chạy thế, cổng nào, bẫy nào, đỏ nền nào —
> ở [`infra.md`](infra.md). Chỗ nào hai file nói khác nhau thì `infra.md` đúng.
>
> Mọi lệnh chạy từ **gốc repo**, trừ chỗ ghi rõ `cd web`.
> Python thì **luôn** `./.venv/Scripts/python.exe`, không phải `python` trần.

```bash
P=./.venv/Scripts/python.exe        # dùng lại ở mọi lệnh Python dưới đây
export PYTHONIOENCODING=utf-8
```

## 1 · Chạy hệ thống

| việc | lệnh |
| --- | --- |
| **bật tất cả** (ba tầng + hai worker, tự kill bản cũ) | `bash chay.sh` |
| chỉ LÕI | `cd web && node server.mjs` — hoặc `npm --prefix web run api` |
| chỉ THỢ | `$P chungcat/src/api.py` |
| một worker | `CHUNGCAT_WORKER_ID=w1 $P chungcat/src/worker.py --vong` |
| worker chạy **một** việc rồi thoát | `CHUNGCAT_WORKER_ID=w1 $P chungcat/src/worker.py --mot` |

`--vong` hay `--mot` là **bắt buộc**: không cờ thì `worker.py` in trợ giúp rồi
thoát ngay, và hàng đợi im lặng không ai chạy (`chay.sh:139`).

`api.py` **không có** `--help` — nó vào `serve_forever()` ngay. Đừng gõ
`--help` để dò cờ, nó treo terminal.

### Kiểm sống

```bash
curl -s -o /dev/null -w 'LOI  %{http_code}\n' http://127.0.0.1:8787/chung-cat/
curl -s -o /dev/null -w 'THO  %{http_code}\n' http://127.0.0.1:8790/health
ls log/worker-*.pid | wc -l        # phải là 2
```

`:8790` là `/health`, **không** `/khoe`. `:8787` không có đường health riêng —
gọi một trang thật.

### Dừng

```bash
for c in 8787 8790; do
  for p in $(netstat -ano | grep ":$c.*LISTENING" | awk '{print $NF}' | sort -u); do
    powershell -NoProfile -Command "Stop-Process -Id $p -Force"
  done
done
powershell -NoProfile -Command "Get-Process python -EA SilentlyContinue | Stop-Process -Force"
```

## 2 · Build

| việc | lệnh |
| --- | --- |
| build FE | `npm --prefix web run build` (= `node build-fe.mjs`) |
| gieo dữ liệu mẫu | `npm --prefix web run seed` |
| nạp bài qua cổng intake | `npm --prefix web run nap` |

**Sửa `web/plugins/**` ⇒ build XONG rồi restart LÕI.** `render/assets.mjs` ghép
`gn.js`/`gn.css` một lần lúc import module, nên không restart thì trình duyệt
vẫn nhận bản cũ. Sửa `web/api/**` hay `web/render/**` thì restart là đủ.

Kiểm bản build còn hạn không:

```bash
$P -c "
import glob,pathlib
ts=max(glob.glob('web/plugins/**/*.inline.ts',recursive=True),key=lambda p:pathlib.Path(p).stat().st_mtime)
js=max(glob.glob('web/plugins/**/*.inline.js',recursive=True),key=lambda p:pathlib.Path(p).stat().st_mtime)
print('CON HAN' if pathlib.Path(js).stat().st_mtime>=pathlib.Path(ts).stat().st_mtime else 'CU — build lai')"
```

## 3 · Chạy cổng kiểm

**Đừng `npm test`.** Nó là một chuỗi ~138 lệnh nối bằng `&&`, chết ở lệnh thứ
13 và che ~116 cổng còn lại.

```bash
# web — TỪNG FILE
cd web && ls test/*.test.js | while read f; do
  node "$f" >/dev/null 2>&1 || echo "RED $(basename $f .test.js)"
done; cd ..

# M12
for f in chungcat/tests/check_*.py; do $P "$f" >/dev/null 2>&1 || echo "RED $f"; done

# core
for f in core/tests/check_*.py;     do $P "$f" >/dev/null 2>&1 || echo "RED $f"; done

# E2E không tốn token
$P chungcat/tests/check_e2e_chung_cat.py --mock
```

Một cổng lẻ, xem cả output: `node web/test/<tên>.test.js` ·
`$P chungcat/tests/check_<tên>.py`.

Danh sách **đỏ nền đã biết** (7 web + 7 core) ở `infra.md` §3 — đỏ ngoài danh
sách ấy mới là của thay đổi vừa làm.

## 4 · Công cụ

| việc | lệnh |
| --- | --- |
| xem nhật ký gộp | `$P chungcat/tools/xem_nhat_ky.py` |
| … theo dõi liên tục | `$P chungcat/tools/xem_nhat_ky.py --theo-doi` |
| … lọc | `--loai <loại>` · `--tu <mốc>` · `--loi` |
| đồng bộ bảng model | `$P chungcat/tools/dong_bo_model.py --tu <nguồn>` |
| … chỉ kiểm, không ghi | `$P chungcat/tools/dong_bo_model.py --kiem` |
| in khung mục chuẩn | `$P core/src/source_distiller/khung.py` — ⚠️ **đang hỏng**, xem dưới |

⚠️ `khung.py` chạy thẳng thì **traceback ngay**:
`NameError: name 'TINH_TUY_O' is not defined` (dòng 111). `WO-038` gỡ tên ấy
nhưng khối `__main__` còn gọi. Đường **import** vẫn lành — mọi chỗ khác dùng
`khung.py` bình thường, chỉ lệnh trên là chết. Ô backlog M01_core đang mở.

### `validate.py` — kiểm bản ghi

```bash
$P core/src/source_distiller/validate.py <thư-mục-hoặc-file>
```

| cờ | làm gì |
| --- | --- |
| `--fix` | **ghi lại** `word_count` · `citations_*` cho đúng số máy đếm |
| `--json` | ra JSON thay vì bảng |
| `--strict` | cảnh báo ⇒ **exit 1**. Dòng tổng kết KHÔNG đổi — vẫn in `0 lỗi · 1 cảnh báo`, chỉ mã thoát khác. Đọc chữ mà kết luận là sai |
| `--kho <đường>` | gốc kho để phân giải địa chỉ; mặc định = target khi target là thư mục |
| `--no-kho` · `--no-concepts` · `--no-categories` | tắt tường minh từng cổng |
| `--schema` · `--concepts` · `--categories` | chỉ định file khai riêng |

`--fix` **ghi đè** — nó dành cho số dẫn xuất, đừng chĩa vào thư mục kho thật
khi chỉ muốn xem có lỗi gì.

## 5 · Đo trần byte

```bash
cd web && node -e 'import("./render/assets.mjs").then(m=>console.log("gn.css",m.gnCss().length,"| gn.js",m.gnJs().length))'
```

Trần ở `web/test/_tran.mjs` (`css: 104` KB · `js: 103` KB). **Nới trần phải có
FR** (`FR-061`) — vượt trần thì lấy lại byte, hoặc đưa CSS/JS của màn riêng vào
chunk của màn ấy.
