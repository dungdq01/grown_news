# T03-17 — FR-036/B8b: FE xem trước hiện vật (đơn vị CODE)

> Ba dạng xem trước, mỗi dạng một lý do — lấy từ `xem_truoc` đã khai trong
> `media-mime.json`, không phán ở FE:
>
> | | |
> |---|---|
> `iframe` (pdf) | trình duyệt render được ⇒ nhúng thẳng, `src` trỏ `/api/articles/media/<sha256>` |
> `the` (ppt/doc/pptx/docx) | trình duyệt **không** render được ⇒ thẻ + nút tải về. `attachment` ở server (B6) CHÍNH LÀ chính sách này, FE chỉ nói ra |
> video | **click-to-load** + `src` dựng từ **whitelist host + regex id**, KHÔNG BAO GIỜ từ `fm.url` (M09-R3) |
>
> **M09-R3 là luật nặng nhất ở đây.** Nhúng video là LẦN ĐẦU sản phẩm gọi ra
> mạng ngoài, và nó chỏi thế trận đã khai (bind 127.0.0.1 · `analytics: null` ·
> `no-leak`). Người dùng ký cho egress này — nhưng ký cho **hai host cụ thể**,
> không ký cho "bất cứ URL nào trong frontmatter". `fm.url` là **dữ liệu**; dựng
> `src` từ dữ liệu là để người nạp bài chọn máy chủ mà trình duyệt người đọc gọi.
>
> Click-to-load: không iframe nào tồn tại trong DOM đến khi người đọc bấm. Mở
> trang không gọi ra ngoài.

phạm_vi_ghi:
  - web/plugins/multiwindow/src/scripts/multiwindow.inline.ts
  - web/styles/prototype.css

verifiability: hard
tiêu_chí:
  - AC1: pdf ⇒ iframe trỏ `/api/articles/media/<sha256>`; ppt/word ⇒ thẻ + tải về;
      chọn dạng nào do `xem_truoc` trong bảng khai quyết định, không do FE đoán
    cmd: cd web && node test/media-cua-so.test.js
  - AC2: M09-R3 — `src` video dựng từ hằng host + id khớp regex đã khai; KHÔNG
      nội suy `fm.url`; và KHÔNG iframe nào trước khi người đọc bấm
    cmd: cd web && node test/media-cua-so.test.js && node test/no-leak.test.js
  - AC3: không `innerHTML` cho chuỗi của người gửi (`ten_goc`, `url`)
    cmd: cd web && node test/no-dangerous-html.test.js
  - AC4: không hồi quy — cửa sổ đọc, trang, trần trang
    cmd: cd web && npm test
phụ_thuộc: T01-14
