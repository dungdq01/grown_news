# infra — lệnh chạy, cổng, phụ thuộc

> Ghi lại **lệnh đã chạy thật**, không phải lệnh nên chạy. Mỗi chỗ có bẫy thì
> ghi luôn cái bẫy — nguồn ở `chay.sh` và các worklog `.factory/worklog/`.

## 0 · Một lệnh cho tất cả

```bash
bash chay.sh
```

Bật **ba tầng + hai worker**, và tự kill bản cũ trước. Đây là đường đúng —
đừng bật tay từng cái.

**Vì sao một script chứ không ba lệnh:** thứ tự và ENV đã trả giá hai lần
(`chay.sh:2-9`). Lần hai, `CHUNGCAT_HANG_DOI` còn sót từ một phiên E2E khiến
`api.py` và worker nhìn hai hàng đợi khác nhau, **và cả hai đều "đúng"**.
Script `unset` biến ấy tường minh.

| tầng | tiến trình | cổng | vai |
| --- | --- | --- | --- |
| **LÕI** | `web/server.mjs` (node) | **8787** | SSR · một cửa ghi · gateway |
| **THỢ** | `chungcat/src/api.py` | **8790** | hàng đợi việc |
| **worker** | `chungcat/src/worker.py --vong` ×2 | — | `w1`, `w2` |

Cổng khai ở `core/assets/dich-vu.json` — **đừng gõ số ở chỗ khác**.
Hai worker đúng `nguong.json → song_song.tien_trinh: 2`; mỗi worker 4 luồng.
`CHUNGCAT_WORKER_ID` phải KHÁC nhau: nó vừa là khoá tiến trình
(`log/worker-<id>.pid`) vừa là sổ egress riêng (`hang-doi/egress.<id>.jsonl`).

Kiểm sống sau khi bật — **hai tầng hai đường khác nhau**, đừng đoán:

```bash
curl -s -o /dev/null -w 'LOI  %{http_code}
' http://127.0.0.1:8787/chung-cat/
curl -s -o /dev/null -w 'THO  %{http_code}
' http://127.0.0.1:8790/health
ls log/worker-*.pid | wc -l        # phải là 2
```

`:8790` KHÔNG có `/khoe` — gõ nhầm thì được 404 và tưởng THỢ chết.

Nhật ký: `log/*.out` (stdout) · `log/*.jsonl` (có cấu trúc).
Xem gộp: `./.venv/Scripts/python.exe chungcat/tools/xem_nhat_ky.py [--theo-doi]`

## 1 · Build FE — BẮT BUỘC sau khi sửa `plugins/**`

```bash
npm --prefix web run build     # 6 file .inline.ts → .js
```

Rồi **restart LÕI**. `render/assets.mjs` ghép `gn.js`/`gn.css` **một lần lúc
import module**, nên sửa FE mà không restart thì trình duyệt vẫn nhận bản cũ —
bẫy này đã ăn hai lần. Người dùng cũng cần **Ctrl+F5**, không phải F5.

Chỉ sửa `web/api/**` hay `web/render/**` ⇒ restart là đủ, không cần build.

## 2 · Restart nhanh chỉ LÕI

```bash
PID=$(netstat -ano | grep ":8787.*LISTENING" | head -1 | awk '{print $NF}')
powershell -NoProfile -Command "Stop-Process -Id $PID -Force"
sleep 2 && nohup node web/server.mjs > /tmp/gn-web.log 2>&1 &
```

Dừng **tất cả** trước khi đụng vào DB:

```bash
for c in 8787 8790; do
  for p in $(netstat -ano | grep ":$c.*LISTENING" | awk '{print $NF}' | sort -u); do
    powershell -NoProfile -Command "Stop-Process -Id $p -Force"
  done
done
powershell -NoProfile -Command "Get-Process python -EA SilentlyContinue | Stop-Process -Force"
```

## 3 · Cổng kiểm

### Python — PHẢI dùng venv + UTF-8

```bash
export PYTHONIOENCODING=utf-8
P=./.venv/Scripts/python.exe

for f in chungcat/tests/check_*.py; do $P "$f" >/dev/null 2>&1 || echo "RED $f"; done
for f in core/tests/check_*.py;     do $P "$f" >/dev/null 2>&1 || echo "RED $f"; done
$P chungcat/tests/check_e2e_chung_cat.py --mock
```

⚠️ **`python` trần cho kết quả SAI.** Nó thiếu `rapidfuzz`, và console `cp1252`
của Windows giết tiến trình khi `print` tiếng Việt — một lần đã báo nhầm
**58/58 đỏ**. Luôn `./.venv/Scripts/python.exe` + `PYTHONIOENCODING=utf-8`.

### Web — chạy TỪNG FILE, đừng `npm test`

```bash
cd web
ls test/*.test.js | while read f; do node "$f" >/dev/null 2>&1 || echo "RED $(basename $f)"; done
```

⚠️ **`npm test` che ~116 cổng.** Nó là một chuỗi 138 lệnh nối bằng `&&`, chết ở
`page-weight.test.js` (thứ 13) vốn đang đỏ vì nợ `WO-055`. Một lần đã báo "đúng
một FAIL" trong khi thật sự có bảy. Ô backlog M03 đang mở cho việc này.

### Đỏ NỀN đã biết — không phải do thay đổi mới

```text
web  : api-guard · man-tai-lieu · man-video · moc-fe-con-that
       mot-bien-mau · opacity-khong-pha-contrast · page-weight
core : check_danh_muc · check_db_dung_cho · check_g6b · check_loai_nguon_db
       check_media_ddl · check_running · check_skill
```

Thấy đỏ ngoài danh sách này ⇒ là của thay đổi vừa làm. **Quy chủ trước khi
phán** (`git status` + `git diff`), đừng báo đỏ của người khác.

## 4 · Trần byte — hai bundle đều kịch trần

```bash
cd web && node -e 'import("./render/assets.mjs").then(m=>console.log("gn.css",m.gnCss().length,"| gn.js",m.gnJs().length))'
```

Trần ở `web/test/_tran.mjs` — `css: 104` KB · `js: 103` KB (`FR-061a`).
`FR-061` cấm nới trần bundle chung; nới phải có FR.

CSS/JS **của một màn riêng** thì đưa vào chunk của màn ấy, đừng nhét vào bundle
chung — `ccCss()` trong `chungcat.inline.ts` là khuôn mẫu (`WO-088` lấy lại
2 KB bằng cách đó).

## 5 · Phụ thuộc ngoài

|  | cài | vắng thì sao |
| --- | --- | --- |
| **typst** | `winget install Typst.Typst` | `?dang=pdf` trả **503** kèm lệnh cài; `?dang=in` vẫn chạy ⇒ **phụ thuộc MỀM** |
| **ffmpeg** | có sẵn trên máy này | cắt/nén audio cho ASR hỏng |
| **yt-dlp** | qua `.venv` | tải video / ảnh bìa hỏng |

Chỉ định đường khác cho typst: đặt `TYPST_BIN=<đường>`.
`timTypst()` tìm theo thứ tự: `TYPST_BIN` → đường winget → `PATH`.

`.env` cần bốn khoá: `BEEKNOEE_API_KEY` · `CHUNGCAT_KHOA_LOI` ·
`KHOA_DICH_VU` · `KHOA_PHIEN`. `chay.sh` nạp `.env` cho **cả ba** —
`server.mjs` tự nó KHÔNG đọc `.env`, chỉ đọc `process.env`.

## 6 · Dữ liệu — chỗ nằm và cách sao lưu

|  |  |
| --- | --- |
| kho bản ghi | `kb/_kho.sqlite` (nguồn) · `kb/**/*.md` (export) |
| bản nháp + log lỗi | `web/_loi.sqlite` — bảng `nhap_chung_cat` |
| hàng đợi việc | `chungcat/hang-doi/{new,cur,done,rac,tmp}/*.json` |
| gương YAML | `_backup/*.yaml` — **đã cứu được 8 bản nháp** sau sự cố 2026-09-10 |

Sao lưu trước mọi thao tác phá huỷ:

```bash
B="_backup/truoc-<viec>-$(date +%F)"; mkdir -p "$B"
cp kb/_kho.sqlite web/_loi.sqlite "$B"/
./.venv/Scripts/python.exe -c "import shutil;shutil.make_archive(r'$B/hang-doi','zip','chungcat/hang-doi')"
```

Xoá blob hiện vật thì **phải gỡ luôn tham chiếu trong frontmatter** — bỏ sót
thì bản ghi trỏ vào hư không và cửa media trả 404. Kiểm sau khi xoá:

```bash
./.venv/Scripts/python.exe -c "
import sqlite3,json
k=sqlite3.connect('file:kb/_kho.sqlite?mode=ro',uri=True)
sha={r[0] for r in k.execute('select sha256 from media')}
treo=[(s,x.get('mime')) for t in ('video','tai_lieu','bai_viet')
      for s,f in k.execute('select slug,frontmatter from '+t)
      for x in ((lambda m: m if isinstance(m,list) else ([m] if m else []))(json.loads(f or '{}').get('media')))
      if str(x.get('sha256','')) not in sha]
print(len(treo),'tham chieu treo', treo[:3])"
```

## 7 · ⚠️ Sửa file bằng Python trên Windows

```python
io.open(p, "w", encoding="utf-8", newline="")   # newline="" BẮT BUỘC
```

Thiếu `newline=""` thì Python đổi `\n` → `\r\n`, **cộng 1 byte mỗi dòng** — đủ
làm vỡ trần bundle một cách vô lý.

Và **không bao giờ** thay byte hàng loạt mà không lọc theo đuôi file. Ngày
2026-09-10 một lượt "sửa CRLF" quét cả file nhị phân đã phá **21 PNG** (chữ ký
PNG chứa đúng `\r\n`) và **`web/_loi.sqlite`** — tức toàn bộ bản nháp. Repo này
đặt `autocrlf`: working tree là CRLF là **bình thường**, không phải lỗi cần sửa.

Kiểm nhị phân còn lành sau khi đụng vào `web/**`:

```bash
./.venv/Scripts/python.exe -c "
import glob,zlib,struct
def png(p):
    b=open(p,'rb').read()
    if not b.startswith(b'\x89PNG\r\n\x1a\n'): return 'sai chu ky'
    i=8
    while i+8<=len(b):
        n,t=struct.unpack('>I4s',b[i:i+8]); d=b[i+8:i+8+n]
        if zlib.crc32(t+d)&0xffffffff!=struct.unpack('>I',b[i+8+n:i+12+n])[0]: return 'CRC hong'
        i+=12+n
        if t==b'IEND': return 'OK'
    return 'thieu IEND'
print([(p,png(p)) for p in glob.glob('web/**/*.png',recursive=True) if png(p)!='OK'])"
```

**15 PNG hỏng còn lại là ĐÃ BIẾT và chấp nhận** — tất cả nằm ở
`web/_quartz/docs/images/`, tài liệu vendor của Quartz. Không đường nào phục vụ
thư mục ấy (`_quartz` chỉ còn xuất hiện trong **một chú thích** ở
`api/dungchung.mjs:44`), nên chúng không lên site. 6 PNG *có* phục vụ đã khôi
phục từ commit `4562dfb`. Lệnh trên in ra **đúng 15** ⇒ bình thường; in ra
**nhiều hơn 15, hoặc một đường ngoài `_quartz`** ⇒ vừa phá thứ đang dùng.
