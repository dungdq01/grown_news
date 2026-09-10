# M17_cong — testcases

> Mỗi AC **≥1 happy + ≥1 edge**, viết **bằng lời**. `m-test` ở s8 là vai riêng và
> giữ quyền FR ngược về đây (R1).
> **Phép thử s6**: *viết không nổi testcase ⇒ AC mơ hồ ⇒ SỬA AC*. Kết quả ở §cuối.

## 1 · Vì sao M17 tồn tại

**AC-1.1** — DUY NHẤT `nghe_ngoai: true`
- *happy*: đếm `nghe_ngoai: true` trong `dich-vu.json` → **đúng 1**, và nó là `cong`.
- *edge*: đặt `nghe_ngoai: true` cho một dịch vụ thứ hai → đỏ, nêu **cả hai** tên.
- *edge 2*: đặt cho `web` → đỏ (ca nguy hiểm nhất: LÕI giữ kho).

**AC-1.2** — `web` vẫn bind loopback
- *happy*: M17 chạy → `web` vẫn `127.0.0.1:8787`; `api-guard.test.js` **0 dòng đổi**.
- *edge*: `git diff` chạm `web/test/api-guard.test.js` trong một đơn vị việc của M17 → đỏ (R1: M17 không được sửa cổng của module khác để mình qua).

**AC-1.3** — `M08-R1` nguyên văn
- *happy*: `grep` câu *"localhost LÀ toàn bộ lớp bảo vệ"* trong `06_modules/M08_api/rules.md` → còn.
- *edge*: sửa/xoá câu đó → đỏ. (Đây là câu M17 tồn tại để **khỏi phải sửa**.)

## 2 · Bốn điều không bao giờ

**AC-2.1** — không chạm `kb/`
- *happy*: chạy đủ vòng xác thực + chuyển tiếp → 0 lần chạm `kb/**`.
- *edge*: gieo một `sqlite3.connect` hoặc đường dẫn `kb/` → đỏ.
- *edge 2*: gieo một lời gọi API **đọc nội dung bài** (không phải xác thực) → đỏ. M17 chuyển tiếp, nó không đọc hộ.

**AC-2.2** — không có key model trong env
- *happy*: `dich-vu.json` khai `can_key_model: false`; env của tiến trình **không** chứa khoá nào.
- *edge*: đặt `can_key_model: true` → đỏ.
- *edge 2*: env thực tế có một khoá (dù bảng khai `false`) → đỏ. Đo **env thật**, không đọc bảng khai — bảng khai là ý định, env là sự thật.

**AC-2.3** — không giao diện
- *happy*: `find cong/ -name "*.html" -o -name "*.css" -o -name "*.js"` → 0.
- *edge*: thêm một trang lỗi HTML → đỏ. (Trang lỗi tự vẽ thường mang tên dịch vụ + version, tức **rò thông tin**.)

## 3 · `ma_moi`

**AC-3.1** — dùng một lần
- *happy*: mã hợp lệ, chưa dùng → buộc thành công, `dung_luc` được ghi.
- *edge*: dùng **lại** mã đó → từ chối, và `dung_luc` **không** đổi lần hai.
- *edge 2*: hai request dùng **cùng** mã **đồng thời** → đúng **một** thành công (`UPDATE … WHERE dung_luc IS NULL` + `changes()`), không phải cả hai.

**AC-3.2** — có `het_han`
- *happy*: mã còn hạn → qua.
- *edge*: mã quá hạn → từ chối.
- *edge 3*: sinh một mã **không** có `het_han` → **đỏ ở cổng sinh mã**, không phải lúc nó bị dùng.

**AC-3.3** — audit mỗi lần buộc
- *happy*: buộc thành công → một dòng `audit_log` kèm `chat_id`.
- *edge*: buộc **thất bại** → **vẫn** một dòng (xem `AC-3.6`).

**AC-3.4** — rate limit theo IP và theo mã
- *happy*: 3 lần thử trong ngưỡng → qua.
- *edge*: vượt ngưỡng theo **IP** → chặn, và thông báo nêu **thời gian chờ**.
- *edge 2*: vượt ngưỡng theo **mã** (nhiều IP cùng thử một mã) → chặn. Hai chiều khác nhau: chặn IP không chặn được botnet thử một mã; chặn mã không chặn được một IP thử nhiều mã.
- *edge 3*: ngưỡng đọc từ cấu hình; `grep` một số gõ cứng → đỏ.

**AC-3.5** — entropy ≥ 128 bit
- *happy*: mã sinh ra có ≥128 bit entropy (đo bằng độ dài × log2(bảng chữ)).
- *edge*: sinh mã 6 chữ số → đỏ. Ở đây **không có kênh thứ hai** (SMS/app) để giới hạn số lần thử, nên OTP-6-số là sai hạng.
- *edge 2*: mã dài nhưng sinh từ `random` không mã hoá → đỏ. Độ dài không thay được nguồn ngẫu nhiên.

**AC-3.6** — log MỌI lần thử thất bại
- *happy*: một lần thử sai → một dòng `audit_log`.
- *edge*: thử **100** mã sai → đếm `audit_log` ra **100** dòng. Nếu chỉ log lần thành công thì một cuộc dò 10.000 lần để lại **đúng một** dòng: dòng của lần nó thành công.
- *edge 2*: dòng log **không** chứa mã đã thử (log để phát hiện dò, không phải để lưu bí mật).

## 4 · Phân quyền

**AC-4.1** — không đường nào cho account thường đặt `approved`
- *happy*: request mang `review_status: approved` → trường bị **lột**, bản ghi ra `draft`.
- *edge*: `grep` một đường chuyển tiếp `review_status` từ payload → đỏ.
- *edge 2*: chủ dự án duyệt qua UI → **vẫn** đi đường cửa-của-người, không qua M17 (`B-B1` không đổi).

**AC-4.2** — cột `vai` *(soft)*
- *happy*: cột `vai` tồn tại trong `nguoi_dung`.
- *edge*: nếu **chưa ai đọc** nó → spec phải khai rõ *"chưa dùng"*; khai *"đã có phân quyền"* mà không ai đọc cột ⇒ đỏ.
- ⚠️ `soft`: **người** chốt khi nào bật phân quyền.

## 5 · Chuyển tiếp

**AC-5.1** — không đổi thân request
- *happy*: so **byte** body trước/sau chuyển tiếp → bằng nhau.
- *edge*: gieo một bước sửa body (chuẩn hoá JSON, thêm trường) → đỏ.
- *edge 2*: body là **binary** (upload file) → vẫn bằng nhau từng byte.

**AC-5.2** — chưa xác thực không tới `web`
- *happy*: request có `phien` hợp lệ → tới `web`.
- *edge*: request **không** xác thực → `web` **không nhận request nào** (đo ở phía `web`, không chỉ đo M17 trả 401).

**AC-5.3** — không tự cấp danh tính
- *happy*: header danh tính sinh từ `phien` hợp lệ.
- *edge*: request tự mang header danh tính → header đó bị **lột và thay**, không được tin.
- *edge 2*: `phien` hết hạn → không cấp header, request bị chặn.

---

## Kết quả phép thử s6 — MỘT AC mơ hồ, đã sửa

Chạy trên 17 AC: **16 viết được ngay**. Một cái không:

**`AC-3.4` — *"rate limit theo IP và theo mã"* không nói ĐO Ở ĐÂU, và M17 chưa chọn
ngôn ngữ.**
`spec §0` khai *"ngôn ngữ chưa chọn — Caddy · nginx · tự viết; s4 quyết"*. Ba đường
đó đặt rate limit ở **ba chỗ khác nhau**: Caddy/nginx là **cấu hình**, tự viết là
**mã**. Testcase *edge 3* của tôi (*grep một số gõ cứng → đỏ*) chỉ viết được cho
đường **tự viết** — với Caddy thì "số gõ cứng trong cấu hình" **chính là** cách nó
hoạt động, và cổng sẽ đỏ oan.
⇒ **Đã sửa `AC-3.4`**: phép đo là **HÀNH VI**, không phải hình dạng mã — bắn N+1
request và đòi request thứ N+1 bị chặn. Câu *"ngưỡng đọc từ cấu hình"* giữ lại
nhưng nói rõ **cấu hình của bất kỳ tầng nào**, và cổng đo bằng cách **đổi ngưỡng rồi
bắn lại**, không bằng `grep`.

**Ghi chú không phải lỗi AC**: `AC-3.4` · `AC-3.5` · `AC-3.6` là **lỗ trong `FR-045`
đã duyệt** (`security_baseline §8.1`), chưa có FR riêng. Chúng viết được testcase,
nhưng **chưa ai cho phép thi công** — khác với "AC mơ hồ", và ghi ở `backlog.md`.
