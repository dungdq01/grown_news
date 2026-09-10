# T08-24 — DDL năm bảng + DB riêng của LÕI trong `web/` (đơn vị CODE)

> `FR-047` (đã duyệt) mở bảy cửa thao tác trên **năm bảng chưa tồn tại**.
> `FR-048` (đã duyệt) giao chủ: `M18_nguoidung` giữ bốn, `M12_chungcat` giữ
> `nhap_chung_cat`. `ADR-06` quyết chỗ ở: **DB riêng trong `web/`**, KHÔNG
> `kb/_kho.sqlite`.
>
> Đây là đơn vị **đầu tiên** của `FR-047`. Bảy cửa (`T08-12`…) phụ thuộc nó.

## Vì sao KHÔNG dùng `kb/_kho.sqlite`

`core/tools/dung_lai_db.py:139-140` **xoá** file đó rồi dựng lại **từ file
`.md`/`.yaml`**. Docstring của chính nó: *"DB khong co lich su"*. Năm bảng này
là **dữ liệu gốc** — không dựng lại được từ file — nên đặt vào đó là **mất sạch
mỗi lần chạy một lệnh thường xuyên**: `_api.mjs` gọi nó trong test, `B-C1` khai
nó là đường file→DB duy nhất, và nó là bước 2 của `T02-4`.

Đã có cổng canh: `core/tests/check_db_dung_cho.py` (T08-10) đỏ nếu ai đó khai
một trong năm bảng vào `kho.schema.sql`.

## Phạm vi

phạm_vi_ghi:
  - web/api/loi.schema.sql        # MỚI
  - web/api/loidb.mjs             # MỚI — mở/dựng DB, không chứa handler nào
  - web/api/dungchung.mjs         # +1 hằng đường dẫn, KHÔNG đổi logic cũ
  - .gitignore                    # DB mới gitignore như _kho.sqlite

**Không** chạm: `core/assets/kho.schema.sql` · `core/tools/**` · `web/test/**`
(đơn vị TEST riêng — `R1`) · bất kỳ handler nào trong `router.mjs`.

## Quyết định trong đơn vị này

**a · Đường dẫn.** `web/_loi.sqlite`, override bằng `LOI_DB` — **cùng khuôn**
`KB_DIR`/`RECYCLE_DIR`/`PYTHON` đã có (`FR-010`, `FR-034`), để test trỏ được
sang thư mục tạm. Không có override thì mọi test dùng chung một DB thật, và
`AC-2.2` (hai request đồng thời) sẽ ăn vào dữ liệu thật.

**b · `journal_mode = WAL` + `busy_timeout`.** `M18-R1` đòi hai request đồng
thời cho ra **đúng một** thành công. Không có `busy_timeout`, request thứ hai
trả `SQLITE_BUSY` thay vì thua đúng cách, và test đồng thời sẽ **nhiễu** chứ
không **đỏ**.

**c · `ma_moi.het_han` NOT NULL.** `AC-2.1` đòi đỏ **ở cổng sinh**, không phải
lúc mã bị dùng. Ràng buộc ở DDL là chỗ rẻ nhất để làm điều đó.

**d · `dung_luc` mặc định NULL + `UNIQUE(kenh, chat_id)`.** Hai thứ này là
**cấu trúc** cho `M18-R1` và `AC-3.2` — không phải kỷ luật trong handler.

**e · `nguoi_dung` KHÔNG có cột mật khẩu.** Hệ này không có mật khẩu; đường vào
là mã mời + `chat_id` đã buộc. Ghi ra để không ai thêm cột đó "cho chắc".

**f · KHÔNG xoá hàng ở đâu cả.** `AC-1.2`: thu hồi đổi `trang_thai`. Không có
`ON DELETE CASCADE` nào — cascade là một đường xoá ẩn.

## Tiêu chí

verifiability: hard
tiêu_chí:
  - AC1: dựng DB mới từ số 0 tạo đủ **5** bảng, và `kb/_kho.sqlite` **không đổi**
    cmd: cd web && node --test test/loidb.test.js
  - AC2: `het_han` NULL bị DDL từ chối; `UNIQUE(kenh, chat_id)` chặn buộc trùng
    cmd: cd web && node --test test/loidb.test.js
  - AC3: cổng chỗ-ở vẫn xanh — không bảng gốc nào lọt vào `kho.schema.sql`
    cmd: python core/tests/check_db_dung_cho.py
  - AC4: không hồi quy — mọi test web cũ vẫn xanh
    cmd: cd web && npm test

⚠️ **AC1/AC2 chạy trong đơn vị TEST `T08-11b`**, không phải đơn vị này (`R1`).
Đơn vị này dừng ở chỗ DDL tồn tại và `node -e` dựng được DB.

## Đỏ TRƯỚC

`R5`: `T08-11b` viết `test/loidb.test.js` **trước**, nó phải ĐỎ vì
`web/api/loidb.mjs` chưa có.

phụ_thuộc: T08-10 (cổng chỗ-ở, đã xong)
