# Đánh giá — `.env` cho đường dẫn DB, và lỗi push git

**Ngày**: 2026-09-10 · **agent**: kiểm soát dữ liệu · **CHỈ ĐÁNH GIÁ — dev thi công**
**Đề xuất của chủ dự án**:
1. chặn push file `.db`/`.sqlite` lên git;
2. tạo `.env.example` ghi các đường dẫn, mỗi nhánh pull về thì set lại `.env`;
3. DB gọi thẳng path local — sau này đổi sang R2.

**Kết luận**: đúng hướng, nhưng **hụt một mắt xích** và **không giải được lỗi
push hiện tại**. Ba việc độc lập, đừng gộp.

---

## 1 · Chẩn đoán lỗi push — không phải `.sql`, là `.sqlite`

```bash
git remote -v
  origin  https://github.com/dungdq01/gn-m13.git

git rev-list --objects --all | git cat-file --batch-check=… | sort -rn
  135.1 MB   kb/_kho.sqlite.truoc-di-tru-1788906007      ← commit b7f6ba9

git rev-list --count b7f6ba9..HEAD   →  40
git branch -r                        →  (rỗng)
```

GitHub chặn **cứng** file > 100 MB ⇒ push đỏ.

### Sáu file DB **đã commit vào HEAD**

```
kb/_kho.sqlite.truoc-di-tru-1788906007        (+ -shm, -wal)
web/_loi.sqlite.hong                          (+ -shm, -wal)
```

⚠️ Ba file `.hong` là **DB của LÕI** — nơi `FR-050` cấm tuyệt đối dữ liệu cá
nhân vào git. Chúng **hỏng** (`integrity_check` → *malformed*) nên **không ai
kiểm chứng được** chúng có `ten`/`chat_id` hay không. Ở lượt đo 09-10 sáng chúng
còn là `??` untracked; giờ đã vào HEAD — một lần `git add .` là đủ, đúng cái bẫy
đã cảnh báo ở [báo cáo rà soát](2026-09-10-ra-soat-file-sql-va-db-rac.md).

### 🟢 Tin tốt: **chưa từng push lần nào**

`git branch -r` rỗng ⇒ **viết lại lịch sử bây giờ gần như miễn phí**. Không ai
clone; chỉ 3 worktree local (`main`, `gn-m13`, `gn-space`) phải xử lý. Chi phí
đó tăng vọt ngay sau lần push đầu tiên thành công.

### ⛔ Điều phải nói rõ

> **Chặn push từ giờ KHÔNG gỡ được blob đã nằm trong lịch sử.**
> `.gitignore` chỉ tác dụng với file **chưa** được theo dõi. Blob 135 MB ở commit
> cách HEAD 40 bước; mỗi lần push vẫn gửi lại nó. Muốn hết đỏ phải
> `git filter-repo`/BFG — **viết lại lịch sử**, không phải một dòng gitignore.

---

## 2 · Đề xuất ① — chặn `.db`/`.sqlite`: ĐÚNG, nhưng sửa sai chỗ thì vô ích

`.gitignore` hiện khai **tên chính xác**:

```gitignore
kb/_kho.sqlite          web/_loi.sqlite
kb/_kho.sqlite-wal      web/_loi.sqlite-wal
kb/_kho.sqlite-shm      web/_loi.sqlite-shm
```

**Đó chính là cách hai hậu tố lọt qua**: `.truoc-di-tru-<epoch>` và `.hong`.

Đề nghị dev đổi sang **mẫu**, và thêm một lớp thứ hai không dựa vào tên:

```gitignore
kb/*.sqlite*
web/*.sqlite*
*.db
```

+ hook `pre-commit` chặn theo **kích thước** (vd > 10 MB). Chặn theo tên chỉ bắt
được thứ đã nghĩ tới; chặn theo kích thước bắt được thứ chưa nghĩ tới.

---

## 3 · Đề xuất ② — `.env`: phần lớn ĐÃ CÓ, nhưng thiếu mắt xích quan trọng nhất

### 3.1 · `.env.example` **đã tồn tại** — và không có đường dẫn nào

Đo 2026-09-10: `.env` (204 B) và `.env.example` (541 B), cả hai từ 04/09.
`.env.example` khai đúng **bốn khoá bí mật**:

```
BEEKNOEE_API_KEY · CHUNGCAT_KHOA_LOI · KHOA_DICH_VU · KHOA_PHIEN
```

**Không một đường dẫn DB nào.** ⇒ việc cần làm là **bổ sung**, không phải tạo mới.
`.gitignore:5-6` đã đúng sẵn: `.env*` + `!.env.example`.

### 3.2 · 🔴 MẮT XÍCH HỤT — không có gì NẠP `.env`

```bash
grep -rn "dotenv|--env-file|load_dotenv"  (mã dự án, bỏ node_modules)   →  0
web/package.json  "api": "node server.mjs"                             →  không có --env-file
chungcat/src/moi_truong.py:5  →  "Không thêm phụ thuộc (python-dotenv) cho ba chục dòng"
```

> **Tạo `.env` xong thì Node lẫn Python vẫn không đọc nó.** Biến phải được
> `export` trong shell, hoặc phải thêm một loader.

Không giải chỗ này thì `.env` là **giấy tờ**, không phải cấu hình — và tệ hơn
là nó **trông giống** cấu hình, nên người sau sẽ tin nó đang có tác dụng.

Ba cách, dev chọn một:

| cách | ưu | nhược |
|---|---|---|
| `node --env-file=.env server.mjs` | native Node 20+, **0 phụ thuộc** | chỉ phủ Node; Python vẫn phải tự lo |
| `python-dotenv` | phủ Python | thêm phụ thuộc — `moi_truong.py` **cố ý từ chối** |
| script bọc (`.bat`/`.sh`) `export` rồi chạy | phủ **cả hai**, 0 phụ thuộc | phải nhớ chạy qua script |

### 3.3 · Đường dẫn nên khai — đo từ mã dự án, không phải đoán

| biến | đọc ở | mặc định | loại dữ liệu |
|---|---|---|---|
| `KB_DIR` | `core/tools/dung_lai_db.py:37` | `kb/` | dẫn xuất |
| `RECYCLE_DIR` | `core/tools/dung_lai_db.py:38` | `_recycle/` | dẫn xuất |
| **`LOI_DB`** | `web/api/loidb.mjs:33` | `web/_loi.sqlite` | **GỐC** |
| **`LOI_LUU`** | `web/api/dungchung.mjs` | `_backup/` | **GỐC — bản lùi** |
| `SCHEMA_DIR` · `INBOX_DIR` · `SITE` | handler + test harness | — | — |
| `API_PORT` | `web/server.mjs` | `8787` | — |
| `PYTHON` | spawn `validate.py` | — | — |
| `CHUNGCAT_GOC` · `CHUNGCAT_XUAT_TAM` · `CHUNGCAT_WORKER_ID` | `chungcat/` | — | — |
| `GN_DATA` · `GN_LOG_DIR` · `TYPST_BIN` | — | — | — |

⚠️ **`kho.schema.sql` và `loi.schema.sql` KHÔNG vào `.env`.** Chúng là **hợp
đồng**, đi cùng code. Cho phép trỏ DDL ra chỗ khác bằng biến môi trường là mở
đường cho hai DB cùng tên chạy hai schema khác nhau.

---

## 4 · Ba điểm phải cân nhắc — không phải chi tiết vặt

### 4.1 · Tách theo nhánh: đúng cho DẪN XUẤT, đáng nghĩ cho GỐC

| | tách theo nhánh |
|---|---|
| `KB_DIR` → `kb/_kho.sqlite` | ✅ **đúng và rẻ** — dựng lại được từ `kb/**` đang ở trong git |
| `LOI_DB` → `web/_loi.sqlite` | ⚠️ **dữ liệu GỐC**: nháp chưng cất làm ở `gn-m13` **không tồn tại** ở `gn-space` |
| `LOI_LUU` → `_backup/` | ⚠️ bản lùi **phân đôi** — mà `FR-050` khai *"mất ổ backup = mất tài khoản"* |

Có thể đúng ý (cách ly khi test). Nhưng phải là **lựa chọn**, không phải tác
dụng phụ của việc copy `.env`.

### 4.2 · `.env` không thay được việc gỡ 135 MB

Hai việc **độc lập**. Push vẫn đỏ tới khi lịch sử được viết lại.

### 4.3 · Cơ hội đóng luôn một nợ cũ

Hai test **gọi cửa C1–C7 mà không đặt `LOI_DB`**:

```
web/test/ban-cu-vao-rac.test.js
web/test/chung-cat-nhap.test.js
```

`web/test/_api.mjs:314` đã cảnh báo đúng chỗ này: *"không đặt thì server dùng
`web/_loi.sqlite` **THẬT**"*. Đây là nợ **#7** trong [BANG-DB.md](BANG-DB.md).
Nếu `.env` mặc định trỏ DB ra thư mục dev riêng thì lỗi đó **tự tắt**.

---

## 5 · Thứ tự cho dev — làm ngược lại là vô ích

| # | việc | vì sao thứ tự này | ai |
|---|---|---|---|
| **1** | Chọn cách **nạp** `.env` (§3.2) | không có bước này thì mọi bước `.env` sau đều là giấy tờ | dev |
| **2** | Bổ sung đường dẫn vào `.env.example` **đang có** (§3.3) | file đã tồn tại, chỉ thiếu phần path | dev |
| **3** | Quyết `LOI_DB`/`LOI_LUU` có tách theo nhánh không (§4.1) | đụng dữ liệu gốc | **chủ dự án** |
| **4** | `.gitignore` sang **mẫu** `*` + `pre-commit` chặn kích thước (§2) | không thì file thứ bảy lại lọt | dev |
| **5** | **Gỡ 6 file DB khỏi lịch sử** (`git filter-repo`/BFG) | ⛔ **điều kiện để push được** — không phải tuỳ chọn | **chủ dự án chọn thời điểm** |
| **6** | Push lần đầu | sau 1–5 | — |

⚠️ Bước **5** chạm cả 3 worktree và team M13 đang thi công ⇒ **chọn thời điểm**,
đừng làm giữa lúc ai đó đang commit. Nhưng cũng **đừng hoãn**: hôm nay chưa ai
push, nên nó rẻ nhất; sau lần push đầu thành công thì mọi bản clone phải re-clone.

---

## 6 · Điều đánh giá này KHÔNG kết luận

- **Không** chọn hộ cách nạp `.env` — ba cách ở §3.2 đều đứng được, tuỳ dev.
- **Không** chọn hộ `LOI_DB` tách hay không — đó là quyết định về dữ liệu gốc.
- **Không** chạy `filter-repo`, không sửa `.gitignore`, không tạo `.env.example`.
  Chủ dự án đã chốt: *"bạn không làm, chỉ đánh giá thôi, dev sẽ làm"*.
- **Không** đụng tới đường R2 — đã có [nghiên cứu riêng](2026-09-04-nghien-cuu-cloudflare-r2.md);
  `.env` đúng là bước chuẩn bị cho nó (đổi giá trị biến, không đổi code).

---

*Agent kiểm soát dữ liệu · chỉ đọc · chỉ đánh giá · không thi công.*
