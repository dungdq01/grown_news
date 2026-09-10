# T08-8 — FR-036/B6: đường phục vụ byte + sáu đầu đề an toàn (đơn vị CODE)

> Hợp đồng ở `06_modules/M09_thuvien/spec.md` §2.4 + plan §"B6 — sáu header, mỗi
> cái một lý do". Đây là lần đầu byte trong DB đi RA trình duyệt, nên nó là lần
> đầu một blob do người dùng nạp được phục vụ **same-origin**.
>
> | đầu đề | vì sao |
> |---|---|
> `content-type` | từ **enum đóng** trong `media-mime.json`, KHÔNG sniff từ tên file |
> `x-content-type-options: nosniff` | không có nó, blob dán nhãn sai bị trình duyệt re-sniff thành HTML và **chạy same-origin** |
> `content-disposition` | `inline` cho pdf · **`attachment` cho ppt/doc** — attachment CHÍNH LÀ chính sách xem trước cho format không render được. Lấy từ `xem_truoc` đã khai, không gõ lại |
> `content-security-policy` | `default-src 'none'; object-src 'none'; sandbox` — đặt ở **HEADER** không ở attribute: `sandbox` attribute không kèm `allow-scripts` làm hỏng viewer PDF của Chromium |
> `etag` + `cache-control: immutable` | hợp pháp vì địa chỉ theo nội dung. Kèm `304` — etag không có nhánh 304 là etag trang trí |
>
> **Blob KHÔNG bản ghi nào trỏ tới ⇒ 404.** Byte đang staging chưa phải nội dung
> công khai; và luật này dùng CÙNG union ba bảng mà exporter dùng (M09-R1).
>
> KHÔNG `Range` ở v1.

phạm_vi_ghi:
  - web/api/router.mjs
  - web/api/articles.mjs
  - web/api/dungchung.mjs

verifiability: hard
tiêu_chí:
  - AC1: `GET /api/articles/media/<sha256>` trả đúng byte + đủ sáu đầu đề; sha256
      lệch dạng ⇒ 400/404, sha256 không có ⇒ 404
    cmd: cd web && node test/media-dau-de.test.js
  - AC2: `content-type` và `content-disposition` đến từ `media-mime.json` —
      pdf `inline`, pptx/docx `attachment`; không chuỗi mime nào gõ tay
    cmd: cd web && node test/media-dau-de.test.js && node test/api-guard.test.js
  - AC3: blob CÓ byte mà KHÔNG bản ghi nào trỏ ⇒ 404 (staging không phải công khai)
    cmd: cd web && node test/media-dau-de.test.js
  - AC4: `If-None-Match` khớp etag ⇒ 304 không thân; không khớp ⇒ 200 có thân
    cmd: cd web && node test/media-dau-de.test.js
  - AC5: không hồi quy
    cmd: cd web && npm test
phụ_thuộc: T08-7
