# T12-20 — bản nháp phải ĐỦ TRƯỜNG để duyệt được

> Phát hiện khi nghiệm thu `T03-112 AC3` (2026-09-05): nút "Duyệt vào kho" gọi
> ĐÚNG cửa duyệt sẵn có, cửa chạy `validate.py --fix`, và cửa **từ chối 422**:
>
> ```
> ✗ schema · (gốc): 'id' is a required property
> ✗ schema · (gốc): 'url' is a required property
> ```
>
> Cửa duyệt làm đúng việc của nó. Thiếu sót ở phía TẠO: `worker._dung_nhap`
> dựng frontmatter tối thiểu (`slug` · `source_type` · `ho_so` · `nguon` ·
> `model_da_dung` · `citations_*`) và thiếu những trường `frontmatter.schema.json`
> đòi. Nên flow chốt của chủ dự án — *"bấm duyệt là xong, không phải vào đâu
> duyệt nữa"* — dừng ở đúng cú bấm cuối.
>
> ID theo `rule.md` mục 9 + quy ước chủ dự án 2026-09-05: **M12 dev lấy 20-29**,
> PM lấy 30+. Max dev hiện tại = 19 ⇒ 20.

## Vì sao là việc của M12, không phải của cửa duyệt

Cửa duyệt là **thước** (`validate.py` + schema). Nới thước để lọt một bản
thiếu trường là bỏ chính phép kiểm mà `FR-046` dựng lên — và nó sẽ lọt cho MỌI
đường nạp, không riêng chưng cất. Bên phải sửa là bên TẠO ra vật.

## Hình dạng

- `_dung_nhap` điền đủ trường bắt buộc của `frontmatter.schema.json` cho một
  bản `source_type: article` / `ho_so: phan-tich`:
  `id` · `url` · `url_normalized` · `protocol_version` · `analyzed_at` ·
  `one_liner` · `credibility_max` · `conformance` · `category` · `concepts`.
- **KHÔNG bịa giá trị đánh giá.** `credibility_max`/`conformance` của một bản
  máy vừa sinh phải là bậc THẤP NHẤT hợp lệ, không phải bậc đẹp: gán `verified`
  cho thứ chưa ai đọc là đúng loại nói dối mà `M12-R2` cấm.
- `id` dẫn xuất từ slug (khuôn `src_<slug rút gọn>`), `url` là `kho://` của
  chính bản nháp — nó chưa có URL ngoài, và bịa một URL là bịa một danh tính.
- `one_liner`: câu đầu của bản chưng cất, cắt trần. Không có thì nói rõ
  `(chưa có tóm tắt)` — trường bắt buộc không được để rỗng, và một câu tự khai
  đúng sự thật tốt hơn một câu bịa.

phạm_vi_ghi:
  - chungcat/src/worker.py                       # `_dung_nhap` đủ trường
# Cổng `chungcat/tests/check_nhap_duyet_duoc.py` thuộc ĐƠN VỊ TEST `T12-8`
# (mở rộng CÙNG LƯỢT) — cùng khuôn `T12-19` đã theo. `R1`: đơn vị không phải
# test thì không chạm file test, và `check_g6b §5` bắt đúng chỗ đó.

verifiability: hard
tiêu_chí:
  - AC1: bản nháp do `_dung_nhap` dựng ĐI QUA `validate.py --strict` (fixture ở
      thư mục tạm, 0 mạng, 0 model)
    cmd: python chungcat/tests/check_nhap_duyet_duoc.py
    đỏ_khi: thiếu bất kỳ trường schema đòi
    xanh_khi: validate xanh trên bản dựng thuần từ một `kq` giả
  - AC2: `credibility_max`/`conformance` là bậc THẤP NHẤT hợp lệ — không phải
      `verified`/`A`
    cmd: python chungcat/tests/check_nhap_duyet_duoc.py
    đỏ_khi: bản máy sinh tự khai mức tin cậy cao
  - AC3: E2E — chưng cất một bản ghi thật rồi `POST /api/nhap-chung-cat/<id>/duyet`
      trả 2xx, và bài xuất hiện trong kho
    cmd: python chungcat/tests/check_nhap_duyet_duoc.py --that
  - AC4: nền giữ xanh
    cmd: python -m pytest core/tests -q && cd web && npm test
