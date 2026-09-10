# T01-47 — `nguon` thành hợp đồng, không còn là trường ghi-rồi-bỏ

> `WO-056` ①②. `nguon: [<slug gốc>]` đã được `worker._dung_nhap` ghi từ `T12-6`,
> nhưng **không khai trong `frontmatter.schema.json`**. Nó lọt qua `--strict` vì
> schema cho phép trường lạ.

## Vì sao một trường không khai là một trường không tồn tại

Không khai ⇒ không kiểu, không khuôn, không bắt buộc. Hôm nay `_dung_nhap` ghi
đúng; mai ai đó ghi `nguon: "slug"` (chuỗi thay vì mảng) hoặc thôi ghi hẳn, và
**không cổng nào báo**. Consumer đọc nó phải tự đoán hình dạng — mà đoán hình
dạng là cách hai bên đọc lệch nhau.

Chủ dự án 2026-09-06: *"tôi vẫn mong muốn có 1 trường để nhận diện bài chưng cất
là của bài gốc nào"*. Trường ấy đã có tên; việc của đơn vị này là làm nó THẬT.

## Hình dạng

- khai `nguon` trong `properties`: mảng chuỗi, khuôn **slug có tiền tố loại**
  (`article/x` · `tai-lieu/y` · `video/z`) — cùng khuôn `url_normalized` đang
  dùng, vì đó là thứ định danh một bản ghi trong kho.
- **BẮT BUỘC khi `origin: pipeline`**, bằng `if/then`, không bằng `required`
  toàn cục — và KHÔNG khoá vào `ho_so`.

  Bản đầu khoá `ho_so: phan-tich`; phép đo trước khi áp bác nó:
  `kb/docs/xgboost-taylor-bac-hai.md` có `ho_so` vắng (⇒ `phan-tich`) nhưng
  `origin: external` và một URL ngoài thật. Nó là bản phân tích NẠP TỪ NGOÀI —
  đúng khi không có `nguon`. `ho_so` nói *kiểm theo hồ sơ nào*; `origin` nói
  *ai làm ra bản này*, và chỉ `origin: pipeline` nghĩa là máy sinh từ một bản
  ghi trong kho.
- **KHÔNG rỗng** khi bắt buộc (`minItems: 1`): một bản chưng cất mang `nguon: []`
  là bài mồ côi mang hình dạng hợp lệ — tệ hơn vắng trường, vì nó qua được cổng.

phạm_vi_ghi:
  - core/assets/frontmatter.schema.json   # khai `nguon` + if/then theo `ho_so`
# Cổng `core/tests/check_nguon_hop_dong.py` thuộc ĐƠN VỊ TEST `T01-48`.

phụ_thuộc: WO-056

verifiability: hard
tiêu_chí:
  - AC1: `nguon` khai trong schema, kiểu mảng chuỗi, khuôn có tiền tố loại
    cmd: python core/tests/check_nguon_hop_dong.py
    đỏ_khi: schema không khai `nguon`, hoặc nhận chuỗi trần
  - AC2: `origin: pipeline` mà VẮNG `nguon` ⇒ schema TỪ CHỐI
    cmd: python core/tests/check_nguon_hop_dong.py
    đỏ_khi: bản chưng cất không nguồn vẫn qua
  - AC3: `origin: pipeline` với `nguon: []` ⇒ TỪ CHỐI (mồ côi hình dạng hợp lệ)
    cmd: python core/tests/check_nguon_hop_dong.py
  - AC4: `origin: external` / `manual` KHÔNG bị đòi `nguon` — không đỏ oan;
      ca thật: `kb/docs/xgboost-taylor-bac-hai.md`
    cmd: python core/tests/check_nguon_hop_dong.py
    đỏ_khi: một bài thường thiếu `nguon` mà bị từ chối
  - AC5: kho hiện tại vẫn qua `--strict`
    cmd: python core/src/source_distiller/validate.py kb/ --strict
