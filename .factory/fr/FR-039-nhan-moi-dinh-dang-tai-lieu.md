# FR-039 — Nhận MỌI định dạng tài liệu, chặn theo trần dung lượng

mở_bởi: người dùng, trực tiếp trong phiên 2026-08-28 — *"Mọi design UI / FE / API cần tách biệt và phân loại: bài viết, tài liệu (pdf, docs, ppt, **khác**), video"*, rồi chốt qua AskUserQuestion: **"Nhận mọi định dạng, chỉ chặn theo trần dung lượng"**
tới: M01_core (`core/assets/frontmatter.schema.json` **FROZEN** — `media.mime` đang là enum 5 giá trị · `core/assets/media-mime.json`) · M09_thuvien (`rules.md` **FROZEN** — M09-R3) · M08_api (`web/api/dungchung.mjs`, `articles.mjs`) · M03_web (FE cổng size + `accept`) · `FROZEN.lock`
mức: **nới một hàng rào an ninh** — không phải thêm tiện ích
trạng_thái: **người dùng đã chốt 2026-08-28**, sau khi lời cảnh báo được nêu thành chữ trong chính ô chọn

---

## 0 · Điều này nới ra là gì, nói thẳng

Ô chọn người dùng bấm có ghi nguyên văn: *"việc này gỡ bỏ lớp phòng thủ
magic-byte và cho phép nạp file thực thi vào kho… đây là nới hàng rào an ninh chứ
không phải thêm tiện ích"*. Người dùng đọc và vẫn chọn. FR này ghi lại điều đó để
người duyệt sau không phải đoán là tôi đã cảnh báo hay chưa.

Cái **mất**: `magic-byte` là lớp **thứ sáu** của cổng nạp (FR-036/B5). Nó so byte
đầu file với chữ ký khai trong `media-mime.json`. Không còn enum thì không còn
chữ ký để so, nên với định dạng lạ lớp đó **không tồn tại**, không phải "yếu đi".

Cái **KHÔNG mất, và cố ý giữ** — vì người dùng yêu cầu bỏ *cửa nhận*, không yêu
cầu bỏ mọi lớp:

| lớp | còn? | vì sao giữ được |
|---|---|---|
`nosniff` | **còn** | không phụ thuộc enum |
`CSP: default-src 'none'; sandbox` | **còn** | header cố định |
`content-disposition: attachment` | **còn, và MỞ RỘNG** | mọi định dạng lạ ⇒ attachment |
trần 25 MB | **còn** | đây chính là thứ người dùng chọn làm cổng |
server chỉ nghe 127.0.0.1 | **còn** | ADR — không đổi |
sha256 do **máy** tính (M09-R2) | **còn** | không đọc gì từ client |
magic-byte cho 5 định dạng **đã biết** | **còn** | xem §1 |

## 1 · Whitelist không bị XOÁ — nó đổi VAI

Đây là điều FR này quyết, và nó không nằm trong câu hỏi đã hỏi:

> `media-mime.json` thôi làm **cổng NHẬN**, và trở thành **bảng RENDER**.

Định dạng **có** trong bảng: giữ nguyên `mime` thật · giữ `xem_truoc`
(`iframe`/`the`) · giữ magic-byte lúc nạp.
Định dạng **không** trong bảng: nhận vào · lưu · phục vụ với
`content-type: application/octet-stream` + `content-disposition: attachment`.

Vì sao không đơn giản là "bỏ bảng đi": ba thứ đang **dẫn xuất** từ nó và cả ba sẽ
im lặng hỏng nếu bảng biến mất —

1. `content-type` của endpoint phục vụ lấy từ enum. Không enum thì phải sniff từ
   tên file, mà **tên file là dữ liệu của người gửi** — đúng thứ đầu đề `nosniff`
   sinh ra để không tin.
2. `content-disposition` `inline`/`attachment` lấy từ `xem_truoc`. Mất nó thì
   hoặc mọi thứ `inline` (PDF render được, nhưng file lạ cũng thế — nguy) hoặc
   mọi thứ `attachment` (an toàn, nhưng **PDF hết xem trước được**, tức xoá một
   tính năng người dùng không xin xoá).
3. Đuôi file trong `filename=` lấy từ `duoi`. Lấy thẳng từ `ten_goc` là mở đường
   **tách đầu đề** bằng dấu ngoặc kép / newline trong tên người gửi.

⇒ Với định dạng lạ, đuôi trong `filename=` phải **lọc**: chỉ `[a-z0-9]{1,8}` lấy
từ `ten_goc`, không có thì bỏ hẳn đuôi. Không bao giờ chép thô.

## 2 · `frontmatter.schema.json` — FROZEN, và đây là chỗ nó đổi

`media.mime` hiện là `enum` 5 giá trị. Mở thành `type: string` kèm `pattern`
`^[a-z0-9][a-z0-9!#$&^_.+-]{0,126}/[a-z0-9][a-z0-9!#$&^_.+-]{0,126}$` (dạng
`type/subtype` của RFC 6838).

**Vẫn ràng buộc, không thả tự do**: một `mime` chứa `\r\n`, dấu cách hay `;` là
đường tách đầu đề khi nó đi thẳng vào `content-type`. Bỏ enum không có nghĩa là
bỏ mọi phép kiểm — có nghĩa là đổi phép kiểm từ *"nằm trong danh sách"* sang
*"đúng hình dạng và không chứa ký tự điều khiển"*.

## 3 · M09-R3 phải viết lại, không được để nguyên

M09-R3 hiện nói *"không bao giờ dựng `src` iframe từ `fm.url`; chỉ whitelist host
+ regex id"* — luật đó về **video**, không đụng FR này, **giữ nguyên**.

Luật về định dạng nằm ở cổng nạp (M09-R2 lân cận) và phải đổi thành:
*"máy tính `sha256`/`so_byte`; định dạng KHÔNG lọc ở cửa nhận, nhưng định dạng lạ
BẮT BUỘC phục vụ dưới `application/octet-stream` + `attachment`."*
Viết đúng thứ đang chạy — một rules file mô tả hàng rào đã gỡ là tệ hơn không có.

## 4 · Cổng phải có, không thì FR này là lời hứa

- định dạng lạ (vd `.xyz`) **nạp được** — chiều dương
- định dạng lạ phục vụ ra **`application/octet-stream`** và **`attachment`** —
  chiều âm, và đây là vế nặng: nạp được mà vẫn `inline` là đúng thứ nguy hiểm
- `.pdf` **vẫn** `application/pdf` + `inline` — không hồi quy tính năng
- `ten_goc` chứa `"`, newline, hoặc `../` ⇒ `filename=` **không** mang chúng
- `mime` chứa ký tự điều khiển ⇒ validate **chặn**
- file vượt 25 MB ⇒ vẫn 413

## 5 · Điều FR này KHÔNG làm

Không đổi trần 25 MB · không đổi `nosniff`/CSP · không đụng M09-R3 (video) ·
không mở whitelist **host video** — hai thứ khác nhau, và câu hỏi đã hỏi chỉ về
định dạng tài liệu.
