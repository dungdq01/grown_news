# FR-010 — Upload `.md` qua web vào `_inbox/`, không vào `kb/`

mở_bởi: người dùng, 2026-08-19
tới: s6 (`06_modules/M03_web/rules.md` M03-R2 — FROZEN) · s3 (BRD B-C3)
mức: đụng ranh giới ghi của M03_web
trạng_thái: MỞ — chờ người duyệt

## Vấn đề

Người dùng: *"`_inbox/` nằm ở đâu? Vì tôi hiểu thì có 2 cách — 1 là thả vào
source code, 2 là thông qua web"* → chọn *"làm luôn phần qua web để upload, ở
page nạp nguồn ấy"*.

Hiện chỉ có cách 1: mở thư mục `Grown_news/_inbox/` trong file explorer, thả file,
rồi chạy `python 05_intake/gate.py`. Với người dùng kiêm admin đang làm việc trên
web thì đó là hai ngữ cảnh rời nhau.

## Điểm mấu chốt: đây KHÔNG phải "duyệt trên web"

M03-R2 (`rules.md:13-19`) nêu ba dạng vi phạm và một lý do:

> *"web_writes: [] (BRD B-C3). Cho web ghi thì hai nhánh dính nhau đúng chỗ cần
> tách, **VÀ cổng duyệt có đường vòng: duyệt trên web = web phải ghi kb/**."*

Hai mối lo trong đó, và upload chỉ chạm **một**:

| Mối lo | Upload vào `_inbox/` |
|---|---|
| *"cổng duyệt có đường vòng"* | **KHÔNG chạm.** File vào `_inbox/`, chưa vào `kb/`. `gate.py` vẫn cưỡng chế `origin: external` ⇒ schema khoá `review_status: const draft`. Không đường nào tới `approved`. |
| *"hai nhánh dính nhau"* | **Chạm.** web có một đường ghi đĩa, dù đích là `_inbox/` chứ không `kb/`. |

Nên đây là FR **hẹp hơn nhiều** so với CRUD (bước 5 của plan, sẽ cần FR riêng đảo
hẳn B-C3): nó không mở đường tới `approved`, không cho sửa/xoá bài đã có, không
cho web đọc-ghi cùng một file.

`_inbox/` **không thuộc `kb/`**. `project_map.boundaries.web_writes: []` nói về
`kb/`; `_inbox/` là thư mục trung chuyển của M05, không phải nguồn chân lý —
xoá sạch `_inbox/` không mất gì.

## Phạm vi

| Được | KHÔNG được |
|---|---|
| POST một file `.md` vào `_inbox/` | ghi bất cứ gì vào `kb/` |
| Gọi `gate.py`, trả kết quả (vào kho / trả lại + cách sửa) | đổi `review_status` |
| Xem `_inbox/` còn file nào | sửa/xoá bài đã có trong `kb/` |
| — | ghi khi `_inbox/` có file trùng tên (từ chối, không ghi đè) |

### Chặn bù — bắt buộc, không phải tuỳ chọn

1. Server **chỉ** bind `127.0.0.1`. Không `0.0.0.0` — không truy cập từ máy khác.
2. Chỉ nhận `.md`, trần **1 MB**. `word_count` trần cứng 1800 từ ⇒ 1 MB đã rất rộng.
3. Tên file **chuẩn hoá** về `[a-z0-9-]+\.md`, chặn `..` và dấu phân cách đường
   dẫn. Đây là chặn path traversal — thiếu nó thì `../../kb/x.md` ghi thẳng vào kho.
4. Đích ghi **cố định** `_inbox/`, không nhận tham số đường dẫn từ client.
5. `gate.py` chạy như tiến trình con — **không** viết lại logic cổng trong JS.
   (M05-R3 cùng lý do: hai bản kiểm sẽ lệch nhau im lặng.)

## Đổi thì

Nếu sau này cần upload vào `kb/` trực tiếp (bỏ qua `_inbox/`), đó là FR khác và
là đúng thứ M03-R2 chặn — không nới FR này.

Nếu server phải nghe ngoài `127.0.0.1` (truy cập từ máy khác), phải xem lại
BRD B-D3 trước: `security_baseline §4` nói bản phân tích có thể chứa nguồn nội bộ.

## Thi hành

| Chỗ | Đổi |
|---|---|
| `web/server.mjs` | MỚI — `POST /api/inbox` · `GET /api/inbox` · bind 127.0.0.1 |
| `web/package.json` | `nap` (gate + build) · `api` (chạy server) |
| `06_modules/M03_web/rules.md` | M03-R2: thêm ngoại lệ `_inbox/` tường minh. **FROZEN** ⇒ `--ky` |
| `web/test/no-write-path.test.js` | nới đúng chỗ: FE gọi `/api/inbox` được; `kb/` vẫn cấm tuyệt đối |
| `web/plugins/home-pages/shell.html` | màn Nạp nguồn: khu vực kéo-thả + kết quả |
| `project_map.yaml` | `web_writes: ["_inbox/**"]` — vẫn rỗng với `kb/` |
| `05_intake/gate.py` | không đổi. Web gọi nó, không thay nó. |

## Nợ đã biết

Test `no-write-path.test.js` hiện quét **một file FE hardcode**
(`multiwindow.inline.ts`) và chỉ bắt `writeFile`/`mkdir` với literal chứa `kb/`.
Nó **không** bắt `writeFileSync`, path ghép động, hay `child_process`. Sau FR này
`server.mjs` là file đầu tiên trong `web/` có quyền ghi đĩa — nên test phải được
mở rộng để canh chính nó, không chỉ miễn trừ nó.
