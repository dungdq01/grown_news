# FR-067 — `nguon` thành trường nhận diện thật trong `frontmatter.schema.json`

- **mở**: 2026-09-06 · **người mở**: claude-opus-5
- **trạng thái**: chủ dự án YÊU CẦU TRỰC TIẾP trong phiên, nguyên văn:
  *"b đi, tôi vẫn mong muốn có 1 trường để nhận diện bài chưng cất là của bài
  gốc nào."* — FR này là GIẤY TỜ cho một thay đổi chủ dự án vừa đặt hàng, không
  phải một đề xuất của agent. Chữ ký `FROZEN.lock` vẫn là của NGƯỜI.
- **artifact chạm**: `core/assets/frontmatter.schema.json` — **FROZEN**
- **đơn vị**: `T01-47` (`WO-056`)

## Vì sao phải mở cửa này

`nguon: [<slug gốc>]` đã được `worker._dung_nhap` ghi từ `T12-6`, nhưng schema
**không khai nó**. Nó lọt qua `validate.py --strict` chỉ vì schema cho phép
trường lạ.

Không khai ⇒ không kiểu, không khuôn, không bắt buộc. Đo được hôm nay: grep
toàn `web/api/` + `web/render/` + `web/plugins/` ra **0 nơi đọc `nguon`**. Nó là
trường ghi-rồi-bỏ suốt từ lúc sinh ra, và không cổng nào nói điều đó.

Chủ dự án cần nó làm **trường nhận diện** — tức nó phải là hợp đồng, không phải
một ghi chú.

## Đổi gì

1. Khai `nguon` trong `properties`: mảng chuỗi, khuôn **slug có tiền tố loại**
   (`article/x` · `tai-lieu/y` · `video/z`) — cùng khuôn `url_normalized`, vì đó
   là thứ định danh một bản ghi trong kho.
2. **Bắt buộc khi `origin: pipeline`**, bằng `if/then`, **không** bằng
   `required` toàn cục và **không** khoá vào `ho_so`.

   > **Bản đầu của FR này khoá vào `ho_so: phan-tich` — SAI, và phép đo bắt
   > được trước khi áp.** Kho có `kb/docs/xgboost-taylor-bac-hai.md`: `ho_so`
   > vắng (⇒ mặc định `phan-tich`), `origin: external`, `url:
   > https://aivietnam.edu.vn/`. Đó là một bản phân tích NẠP TỪ NGOÀI, không
   > chưng cất từ bản ghi nào — nó đúng khi không có `nguon`.
   >
   > `ho_so` nói *"kiểm theo hồ sơ nào"*; `origin` nói *"ai làm ra bản này"*.
   > Chỉ `origin: pipeline` mới nghĩa là MÁY sinh từ một nguồn trong kho, và
   > `worker._dung_nhap` là chỗ DUY NHẤT đặt giá trị ấy.
3. `minItems: 1` khi bắt buộc: `nguon: []` là bài mồ côi mang hình dạng hợp lệ,
   **tệ hơn** vắng trường vì nó qua được cổng.

## SIẾT hay NỚI

**Siết.** Trước: trường không tồn tại với schema, ghi gì cũng được. Sau: có kiểu,
có khuôn, và bản chưng cất không trỏ về gốc thì **không dựng được**.

Rủi ro đã cân, và đã ĐO trước khi áp: kho có **1** bài `ho_so=phan-tich` thiếu
`nguon` — chính bài `origin: external` ở trên. Khoá theo `origin: pipeline` thì
nó KHÔNG bị chạm. Số bài `origin: pipeline` trong kho hiện tại: 0 (bản duyệt lúc
test đã dọn), nên phép siết này bắt đầu từ một nền sạch.

## Xin quyết

- [x] **duyệt** — chủ dự án đặt hàng trực tiếp trong phiên; agent gõ lệnh ký thay,
      chữ ký là CỦA NGƯỜI. Áp ở `T01-47`, cổng `check_nguon_hop_dong` 10/10 xanh.
