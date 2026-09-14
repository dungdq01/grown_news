# T03-154 — đơn vị TEST (ĐỎ trước): `soDotHai()` đọc bản hợp đồng MỚI NHẤT, không gõ cứng `v1`

> Nguồn: ô backlog M13 (`06_modules/M13_truyhoi/backlog.md:19`), mở 2026-09-09 lúc áp
> FR-072/073. Nay **đã chín**: `truyhoi.sample.v3.json` tồn tại và M13 `as-built`.
> ID rule 9: dải CHẴN của dev chính; `ls 07_plan/M03_web/tasks` max chẵn hiện hành 152 ⇒ **154**
> (190+ là PM-Space, dải lẻ là dev phụ).
>
> **Đo được hôm nay** (`web/render/trang.mjs:1722-1729`): `soDotHai()` ghép tên file bằng
> `m.tep + ".sample.v1.json"` — một chuỗi gõ cứng. Lượt M13 thêm `v3.json` và **giữ nguyên**
> v1/v2 nên trang `/dot-hai/` hôm nay vẫn sống. Nhưng ai dọn `v1`, hoặc sửa shape `v1` theo
> `v3`, là trang **chết** — và chết bằng `throw`, tức cả trang, không phải một ô.
>
> **Không** đổi hành vi NÉM. Dòng chú thích `:1722-1723` khai cố ý: *"Thiếu file ⇒ NÉM,
> không rơi về 0 im lặng: một số 0 không phân biệt được với 'chưa có dữ liệu', và màn sẽ
> nói dối."* Đó là răng, giữ nguyên. Đơn vị này chỉ đổi **chọn file nào**, không đổi
> **làm gì khi không có file nào**.
>
> Đây là đơn vị TEST: viết cổng ĐỎ trước (R5), mã ở `T03-156`.

phạm_vi_ghi:
  - web/test/dot-hai-hop-dong.test.js

phụ_thuộc: —

verifiability: hard
tiêu_chí:
  - AC1: ca A — **ĐỎ trước**. Dựng fixture ở **thư mục tạm** (`mkdtemp`) chứa `truyhoi.sample.v3.json`
      và **không** có `v1`; `soDotHai({ma:"m13",tep:"truyhoi",khoa:"chunks"})` phải trả một số ≥ 1.
      Trên mã hôm nay cổng ĐỎ với `ENOENT ...sample.v1.json`
    cmd: cd web && node test/dot-hai-hop-dong.test.js
    đỏ_khi: hàm ném `ENOENT`, hoặc trả 0 khi thư mục tạm chỉ có v3
    xanh_khi: đếm được số phần tử khoá `chunks` của bản v3
  - AC2: ca B — chọn bản **cao nhất**, không phải bản đầu tiên tìm thấy. Fixture có **cả**
      `v1` (2 phần tử) lẫn `v3` (số khác 2) ⇒ hàm trả số của **v3**
    cmd: cd web && node test/dot-hai-hop-dong.test.js
    đỏ_khi: trả số của v1 khi cả hai cùng có
    xanh_khi: trả số của v3
  - AC3: ca C — **chống sửa quá tay**. Fixture **rỗng** (không bản nào) ⇒ hàm vẫn **NÉM**,
      không trả 0. Hạ `throw` xuống `return 0` để ca A xanh là làm màn nói dối
    cmd: cd web && node test/dot-hai-hop-dong.test.js
    đỏ_khi: trả 0 thay vì ném khi không có bản hợp đồng nào
    xanh_khi: ném, và thông điệp nêu tên module thiếu
  - AC4: cổng chạy trong `npm test` — grep tên file trong `web/package.json` ⇒ 1
    cmd: cd web && npm test

# Cả ba ca dựng fixture ở thư mục tạm. CẤM sửa `05_uiux/contracts/*.json` để thử — đó là
# file FROZEN, và thao tác *hoàn tác* là chỗ mất dữ liệu (CLAUDE.md §CẤM).
# AC đo **hàm này**, không đo "trang /dot-hai/ render đúng" — vế render là cổng đã có
# (`web/test/menu-tai-dot-hai.test.js`), không phải thứ đơn vị này làm ra.
