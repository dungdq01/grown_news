# Rà soát file `.sql` và DB rác — liệt kê, CHƯA xoá gì

**Ngày**: 2026-09-10 · **agent**: kiểm soát dữ liệu · **chỉ đọc, chỉ liệt kê**
**Luật áp dụng**: `.claude/rule.md` mục **3** (*không được tuỳ tiện chỉnh sửa
database*) và mục **16** (*THỬ TRÊN TMP → CHỦ DỰ ÁN CHẤP NHẬN → RỒI MỚI BẢNG
THẬT*, chốt 2026-09-10).

> ⛔ **Không xoá một file nào.** Chủ dự án nói *"tôi báo xoá mới được xoá"*.
> Dưới đây là danh sách + phán quyết + lệnh xoá **soạn sẵn**, chờ lệnh.

---

## 0 · Trả lời thẳng câu hỏi: **không có file `.sql` rác nào**

Toàn repo có **đúng hai** file `.sql`, và **cả hai đang chạy**:

| file | byte | ai đọc | phán quyết |
|---|---:|---|---|
| `core/assets/kho.schema.sql` | 17.497 | `core/tools/dung_lai_db.py:40` — DDL **duy nhất** của `kb/_kho.sqlite` | ✅ **SỐNG — không đụng** |
| `web/api/loi.schema.sql` | 10.255 | `web/api/loidb.mjs:22` → `dungchung.mjs:1083` · `chungcat/src/vong.py:21` · `chungcat/tests/check_khong_tu_duyet.py:38` · `core/tests/check_db_dung_cho.py:146` | ✅ **SỐNG — không đụng** |

```bash
find . -name "*.sql" -not -path "*/node_modules/*" -not -path "*/_quartz/*"
# → đúng 2 file trên
```

**Rác không nằm ở `.sql`, nằm ở `.sqlite`.** Và có một cái nặng 135 MB đã vào git.

---

## 1 · 🔴 Việc gấp nhất — 135 MB DB **đã commit vào git**

```bash
git rev-list --objects --all | git cat-file --batch-check=... | sort -rn
   135.1 MB  kb/_kho.sqlite.truoc-di-tru-1788906007      ← blob lớn nhất repo
     8.2 MB  public/light/pexels-marek-piwnicki-…jpg

du -sh .git   →  219M
```

**Một file chiếm 62% toàn bộ `.git`.**

| | |
|---|---|
| trạng thái git | **TRACKED** — đã commit ở `b7f6ba9` (*"WO-074 · T12-31 + T03-131…"*) |
| ruột | ảnh chụp kho **trước di trú**: 13 hàng `media` = **141.392.677 byte** BLOB · `bai_viet` 2 · `video` 6 · `categories` 11 · `recycle` 4 |
| vì sao lọt | `.gitignore:46-48` khai **chính xác** `kb/_kho.sqlite`, `-wal`, `-shm`. Hậu tố `.truoc-di-tru-<epoch>` **không khớp mẫu nào** |
| bạn đồng hành | `…-shm` và `…-wal` đang `??` untracked, cũng **không** được ignore |

⚠️ **Xoá file này KHÔNG làm nhẹ repo.** Byte đã nằm trong lịch sử; mọi lần
`git clone` vẫn tải 135 MB. Gỡ thật phải viết lại lịch sử
(`git filter-repo` / BFG) — **đó là một quyết định riêng**, không phải một lệnh
`rm`. Xem §4.

---

## 2 · Rác — đề nghị xoá, chờ lệnh

| # | đường dẫn | byte | git | vì sao là rác | mất gì nếu xoá |
|---|---|---:|---|---|---|
| **1** | `web/_loi.sqlite.hong` | 318.582 | `??` **KHÔNG ignore** ⚠️ | **HỎNG** — `PRAGMA integrity_check` → *"database disk image is malformed"*, không đọc nổi một bảng nào | **không gì** — không đọc được thì không phục hồi được |
| **2** | `web/_loi.sqlite.hong-shm` | 32.768 | `??` không ignore | phụ trợ của (1) | không gì |
| **3** | `web/_loi.sqlite.hong-wal` | 0 | `??` không ignore | phụ trợ của (1), rỗng | không gì |
| **4** | `kb/_kho.sqlite.truoc-di-tru-1788906007-shm` | — | `??` không ignore | phụ trợ của file 135 MB | không gì |
| **5** | `kb/_kho.sqlite.truoc-di-tru-1788906007-wal` | — | `??` không ignore | phụ trợ của file 135 MB | không gì |
| **6** | `web/_luu/` (3 file) | 2.217 | gitignore | Chết từ `FR-050` cách 2 — đích bản lùi chuyển sang `_backup/`. `loi-cua.test.js:506` khai thẳng *"đích mặc định phải là `_backup/` ở GỐC, không phải `web/_luu`"* | không gì — nội dung là **dữ liệu test** (`ten: Đồng nghiệp A`, `chat_id: "111"`), không phải người thật |
| **7** | `kb/_index.sqlite` | 53.248 | gitignore | RETIRED bởi `FR-034`; dữ liệu đóng băng **2026-08-26** | không gì — dẫn xuất, `sinh_index.py` dựng lại được |

⚠️ **Bốn file (1)–(5) đang `??` và KHÔNG được `.gitignore` phủ.** Một lần
`git add .` là chúng vào repo — và (1) là DB của LÕI, nơi `FR-050` cấm tuyệt đối
dữ liệu cá nhân vào git. Hôm nay `nguoi_dung` rỗng nên chưa có PII thật, **nhưng
file hỏng nên không ai kiểm chứng được điều đó**.

---

## 3 · Trông giống rác nhưng **KHÔNG PHẢI** — đừng xoá

| đường dẫn | vì sao giữ |
|---|---|
| `_backup/truoc-clear-2026-09-10/` (2 file, 3,9 MB) | Ảnh chụp **hôm nay 08:06–08:09**, ngay trước một lần clear. Đúng tinh thần `rule.md` mục 16. Giữ tới khi lần clear đó được xác nhận ổn — rồi mới xoá |
| `_backup/*.yaml` (4 file) | **Bản lùi đang sống** của `xuatLoi()`. `FR-050`: *"mất ổ backup = mất tài khoản"* |
| `kb/_kho.sqlite-shm` / `-wal` | WAL của DB **đang chạy**. Xoá lúc có tiến trình mở = hỏng DB |
| `core/tools/sinh_index.py` | ⚠️ Sinh ra `kb/_index.sqlite`. **Vẫn còn**, dù `FR-034` đã retire kiến trúc đó |
| `core/tests/check_index_dan_xuat.py` | ⚠️ **ĐANG CHẠY TRONG CI** — `.github/workflows/ci.yml:157` |

> **Nghịch lý phải giải, không phải xoá bừa**: `kb/_index.sqlite` là dẫn xuất của
> một kiến trúc **đã bị thay** (`FR-034`), nhưng **cả tool sinh lẫn cổng canh nó
> vẫn sống và CI vẫn chạy cổng đó**. Xoá mỗi file `.sqlite` thì CI sẽ tự sinh lại
> ở lần chạy sau — **rác mọc lại**. Dọn đúng là dọn **cụm ba** (file + tool +
> cổng + dòng CI), và `.gitignore:38` đã hẹn: *"xoá hẳn ở bước dọn **C7**"*.
> **C7 chưa bao giờ chạy.**

---

## 4 · Ba mức, ba quyết định khác nhau

### Mức A — xoá file trên đĩa · **an toàn, hoàn tác không cần**

7 mục ở §2. Lệnh soạn sẵn, **chưa chạy**:

```bash
cd c:/Users/Admin/Downloads/Grown_news
rm -f web/_loi.sqlite.hong web/_loi.sqlite.hong-shm web/_loi.sqlite.hong-wal
rm -f kb/_kho.sqlite.truoc-di-tru-1788906007-shm kb/_kho.sqlite.truoc-di-tru-1788906007-wal
rm -rf web/_luu/
rm -f kb/_index.sqlite
```

*(Không đụng `kb/_kho.sqlite`, `web/_loi.sqlite`, `_backup/`, hai file `.sql`.)*

### Mức B — bịt lỗ `.gitignore` · **nên làm cùng lượt**

Mẫu hiện tại khai **chính xác** tên file nên mọi hậu tố đều lọt. Đề nghị:

```gitignore
kb/_kho.sqlite*          # thay 3 dòng 46-48
web/_loi.sqlite*         # thay 3 dòng 53-55
web/_luu/                # đã có
```

Không có dòng này thì lần snapshot sau lại đẻ một file 135 MB lọt vào git.

### Mức C — gỡ 135 MB khỏi **lịch sử git** · ⛔ **KHÔNG tự làm**

`git rm --cached` chỉ bỏ khỏi commit mới; 135 MB vẫn nằm trong lịch sử và mọi
`clone` vẫn tải. Gỡ thật cần `git filter-repo`/BFG ⇒ **viết lại lịch sử** ⇒ mọi
worktree (`gn-m13`, `gn-space`) và mọi bản clone phải re-clone.

Có ba worktree đang mở và team M13 đang thi công ⇒ đây là việc **hẹn giờ**, cần
chủ dự án chọn thời điểm. Tôi không đề xuất làm hôm nay.

---

## 5 · Vì sao rác này sinh ra — để nó không sinh lại

| gốc | biểu hiện |
|---|---|
| `.gitignore` khai **tên chính xác**, không khai **mẫu** | file 135 MB + 4 file `??` lọt qua |
| Bước dọn **C7** của `FR-034` chưa chạy | `_index.sqlite` + `sinh_index.py` + cổng trong CI vẫn sống sau khi kiến trúc bị thay |
| `FR-050` đổi đích bản lùi nhưng **không dọn đích cũ** | `web/_luu/` sống thêm 8 ngày với dữ liệu test |
| Hai test ghi vào DB **THẬT** (báo cáo 09-08 §3.6) | `web/_luu/` có `ten`/`chat_id` giả — may là giả |
| Snapshot đặt hậu tố **ngoài mẫu ignore** | `.truoc-di-tru-<epoch>` · `.hong` |

⇒ Xoá 7 file mà không làm **Mức B** thì tháng sau danh sách này quay lại.

---

## 6 · Chờ lệnh

| | việc | rủi ro |
|---|---|---|
| ☐ | **Mức A** — xoá 7 mục ở §2 | thấp; không mục nào đọc được hoặc có người đọc |
| ☐ | **Mức B** — sửa 6 dòng `.gitignore` thành mẫu `*` | thấp; nhưng chạm `.gitignore` là chạm file chung, cần biết ai đang mở PR |
| ☐ | **Mức C** — viết lại lịch sử gỡ 135 MB | **cao** — 3 worktree + team M13 đang chạy |
| ☐ | **Dọn cụm C7** — `sinh_index.py` + `check_index_dan_xuat.py` + dòng CI 157 | trung bình; là một WO riêng, không phải một lệnh `rm` |

Nói mục nào thì tôi làm mục đó. Theo `rule.md` mục 16, nếu có thao tác nào chạm
bảng thật thì tôi thử trên `KB_DIR` tạm trước và trình kết quả, chưa động vào
`kb/_kho.sqlite` / `web/_loi.sqlite`.

---

*Agent kiểm soát dữ liệu · chỉ đọc (mode=ro) · chưa xoá gì · chờ lệnh.*
