# T03-128 — FE: nộp video ĐỌC hiện vật đã nạp, và câu lỗi nói đúng thứ thiếu

> `FR-075` (duyệt 2026-09-09) · `WO-058`. ID rule 9: max 127 ⇒ 128.

## Hình dạng

- `ghiVideo()` **đọc `hienVatVideo`**. Hôm nay biến đó khai ở dòng 331, gán ở
  392, và **không ai đọc** — cả nhánh tải file là đường chết.
- Phép kiểm đầu hàm đổi: có URL ⇒ kiểm host như cũ · không URL mà **có hiện
  vật** ⇒ đi tiếp · thiếu cả hai ⇒ báo lỗi nêu **cả hai** lối.
- Payload: có URL thì gửi `url`; có hiện vật thì gửi `media: [hienVatVideo]`.
  Có cả hai thì gửi cả hai — schema cho phép, và người tải file kèm link đang
  nói cả hai điều đó là thật.
- ⚠️ Câu lỗi hiện tại *"Nơi phát này không nằm trong danh sách nhận…"* nói với
  một người **chưa dán nơi phát nào**. Nó tả sai trạng thái, và đó là lý do
  người báo bug đi tìm sai chỗ.

phạm_vi_ghi:
  - web/plugins/napvideo/src/napvideo.inline.ts
# cổng thuộc đơn vị test T03-110b (tai-file-video.test.js) — R1

verifiability: hard
tiêu_chí:
  - AC1: `hienVatVideo` được ĐỌC trong `ghiVideo` — grep ⇒ ≥1 lần ngoài chỗ gán
    cmd: node web/test/tai-file-video.test.js
  - AC2: không URL + có hiện vật ⇒ payload mang `media`, KHÔNG mang `url` rỗng
    cmd: node web/test/tai-file-video.test.js
  - AC3: thiếu cả hai ⇒ câu lỗi nhắc CẢ `link` lẫn `tải file`
    cmd: node web/test/tai-file-video.test.js
    đỏ_khi: còn báo "nơi phát không nằm trong danh sách" khi chưa dán gì
  - AC4: có URL ⇒ vẫn kiểm host tại chỗ dán (M11-R3) như cũ
    cmd: node web/test/tai-file-video.test.js
