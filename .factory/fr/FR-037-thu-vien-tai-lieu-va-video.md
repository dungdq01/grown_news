# FR-037 — Thư viện: tài liệu (pdf/ppt/word) + video vào kho

mở_bởi: người dùng — `upgrade.md:83-99`, và trực tiếp trong phiên: *"ta có thể design theo kiểu : module Bài viết (module hiện tại đã có) , ta sẽ thêm : module tài liệu (PPT / pdf và word.), module video (gán url tiktok, youtube).... các module mới cũng sẽ có CRUD, thêm sửa nạp nguồn như module bài viết cũ. Trang dashboard lúc này sẽ tổng hợp All thay vì mỗi các bài viết nội bộ"*
tới: **M09_thuvien** (`spec.md` + `rules.md` — FROZEN, mới) · M08_api (`spec.md` FROZEN) · M03_web (`spec.md` FROZEN) · `core/assets/frontmatter.schema.json` (FROZEN) · `core/assets/kho.schema.sql` · `core/assets/media-mime.json` (mới) · `project_map.yaml` · `FROZEN.lock`
mức: thêm một LOẠI BẢN GHI và một BẢNG mới vào nguồn chân lý; mở egress ra hai host ngoài
trạng_thái: **DUYỆT 2026-08-27** — người dùng duyệt plan qua ExitPlanMode; bảy quyết định chốt qua AskUserQuestion

---

## 0 · Vì sao FR NÀY tồn tại, mở muộn, và điều đó là một lỗi

**FR-036 KHÔNG bao trùm nhánh này.** Nó nói về khung thân bài 5 mục; `grep` cho
`M09|thư viện|thu-vien` trong FR-036 ra **0 dòng**. Nhưng nhánh B đã:

- **tạo hai artifact FROZEN mới** (`M09_thuvien/spec.md` + `rules.md`) và ký chúng
  vào `FROZEN.lock` ở đơn vị B0;
- **đổi một artifact FROZEN** — `core/assets/frontmatter.schema.json` (thêm
  `ho_so`, `media`, `source_type` 6→7, `allOf` 5→7) ở B1.

Cả hai việc đó, theo `CLAUDE.md`, phải có **FR TRƯỚC mọi thứ**. Không có. FR này
mở ở **B10** — tức sau khi công việc đã xong — nên nó là một **hồ sơ truy hồi**,
không phải một giấy phép cấp trước.

Ghi ra vì đó là thứ luật gốc bảo vệ: *"không ai được sở hữu thứ dùng để đánh giá
mình"*. Tôi vừa vừa làm vừa tự ký. Người duyệt cần biết điều đó khi đọc.

**Không tự sửa lịch sử**: đóng FR này không xoá được việc nó mở muộn. Cách chặn
lần sau nằm ở `<freeze-check>` — nó bắt "file frozen đổi mà không có FR", nhưng
KHÔNG bắt "artifact frozen MỚI được ký vào lock mà không có FR". Đó là một lỗ
thật của cổng, ghi vào backlog M04_ci.

## 1 · Bảy quyết định người dùng đã chốt

| | |
|---|---|
Bản ghi tài liệu/video | **thư viện thô** — không cần thân 5 mục ⇒ hồ sơ validate thứ hai (`ho_so: thu-vien`) |
Nơi lưu byte | **trong DB** (BLOB), địa chỉ theo nội dung (sha256) |
`kb/_media/` trong git | **commit thẳng**, trần **25 MB/file** |
Nhúng video | **click-to-load** + `youtube-nocookie` + whitelist host |
PPT/Word v1 | **thẻ + tải về**; chuyển đổi để sau (`la_dan_xuat` khai từ ngày đầu) |
Dashboard | **tổng hợp All** ở SỐ ĐẾM |
Danh mục | loại mới cũng có `category`/`concepts` — cổng 5/5b giữ nguyên cho cả hai hồ sơ |

## 2 · Cái giá, nói trước

**Egress.** Nhúng video là **lần đầu** sản phẩm gọi ra mạng ngoài, và nó chỏi thế
trận đã khai: bind `127.0.0.1` · `analytics: provider: null` · `no-leak`. Người
dùng ký cho **hai host cụ thể** (`youtube-nocookie.com`, `tiktok.com`), không ký
cho *"bất cứ URL nào trong frontmatter"*. M09-R3 là răng của điều đó, và
`media-cua-so.test.js` đo nó bằng cách cấm hàm dựng xem trước truy cập `.nhung`.

**Git phồng không lùi được.** Một PPT 25 MB đã commit nằm trong history mãi; `git
gc` không thu hồi. Trần 25 MB/file là phanh duy nhất hiện có.

**Thước đo chất lượng bị pha loãng nếu trộn.** `priority` sinh từ
`skill_candidates` nên tài liệu luôn 0; `credibility_max` mô tả một bản phân tích
chứ không mô tả một file PDF. Suy từ *"tổng hợp số đếm"* ra *"trộn cả thước đo
chất lượng"* là suy quá tay ⇒ M09-R4, ba pane đứng trên `phan-tich` và **khai rõ
nền**.

**Blob bỏ dở nằm lại trong DB.** Exporter khai *CHỈ SELECT*, nên nó reap **file**
chứ không reap **dòng**. Người dùng nạp một PDF rồi bỏ form ⇒ 25 MB nằm lại,
không được export, không ai thấy. **Không mất dữ liệu**, chỉ tốn chỗ. Cần một
lệnh dọn riêng dùng **chung** phép tính mồ côi — ô backlog M08_api.

## 3 · Bốn thứ KHÔNG làm (giữ nguyên từ plan)

- **Không** nới `TRAN` 1 MB của đường JSON — nó là chặn bù của mọi lần ghi bài.
- **Không** nhận `sha256`/`so_byte` từ client — máy tính, luôn.
- **Không** dựng `src` iframe từ `fm.url` — chỉ từ whitelist + regex id.
- **Không** vendor pdf.js ở v1.

## 4 · Bề mặt cưỡng chế (S3) mà FR này để lại

| Rule | Cổng |
|---|---|
M09-R1 mồ côi ba bảng · khoá không nói dối | `core/tests/check_media_dan_xuat.py` |
M09-R2 máy cầm khoá · magic-byte | `web/test/thu-vien.test.js` |
M09-R3 src từ whitelist · click-to-load | `web/test/media-cua-so.test.js` |
M09-R4 chất lượng không trộn | `web/test/thu-vien-tong-hop.test.js` |
M09-R5 hai trần riêng | `web/test/api-guard.test.js` §7 |
DDL ràng buộc bắn thật | `core/tests/check_media_ddl.py` |
Sáu đầu đề an toàn | `web/test/media-dau-de.test.js` |

Cả bảy đều có trong `make check` hoặc `npm test`; sáu trong bảy có trong `ci.yml`
(xem ô backlog *"ci.yml liệt test bằng tay"*).
