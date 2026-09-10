# T08-23 — `check_db_dung_cho.py`: răng cho `M08-R6` (đơn vị TEST)

> **Nợ do chính tôi tạo ra trong phiên 2026-09-02.** `ADR-06` + `M08-R6` khai
> `lệnh: python core/tests/check_db_dung_cho.py` — **file đó không tồn tại**.
> Theo `R3`, một rule `hard` không có lệnh chạy được **thì nó là `soft`**. Nên
> hôm nay `M08-R6` (và `M18-R2` trỏ cùng lệnh) đang **khai sai bề mặt của
> chính nó**.
>
> Đo được: 39 rule S3 trong repo trỏ tới file không tồn tại. **35** thuộc sáu
> dịch vụ chưa dựng (`chungcat/` `truyhoi/` `chatbot/` `kenh/` `artifact/`
> `cong/`) — chờ s8, đúng hạng. **4** nằm ở `core/tests/`, và cả bốn là của tôi:
> `M08-R6` · `M18-R1` · `M18-R2` · `M18-R3`.
>
> Trong bốn cái đó, **chỉ một viết được hôm nay**: `check_db_dung_cho.py` kiểm
> *chỗ ở của dữ liệu*, tức một tính chất của **schema và cây thư mục** — cả hai
> đã tồn tại. Hai cái kia (`check_ma_moi` · `check_vai_trong`) kiểm **hành vi
> runtime của bốn bảng chưa được tạo**, nên viết bây giờ là viết một cổng rỗng.

## Vì sao là đơn vị TEST chứ không phải CODE

`R1`: đơn vị không phải `test` **không được chạm file test**. Đơn vị này ghi vào
`core/tests/`, nên nó **phải** là đơn vị test — và nó **không** được chạm
`kho.schema.sql` hay bất cứ file sản phẩm nào.

## Phạm vi

phạm_vi_ghi:
  - core/tests/check_db_dung_cho.py

**Không** chạm: `core/assets/kho.schema.sql` · `core/tools/**` · `web/**` ·
`06_modules/**`. Nếu cổng đỏ trên repo hiện tại thì đó là **phát hiện**, và nó
đi ra `backlog`/FR — **không** sửa file sản phẩm trong cùng đơn vị này.

## Cổng này kiểm gì — và KHÔNG kiểm gì

Chỉ kiểm phần `ADR-06` (a)(b)(c) **đã duyệt**:

| # | vế | nguồn |
|---|---|---|
| 1 | `kho.schema.sql` **không** khai bảng dữ liệu GỐC | `M08-R6` `đỏ_khi` vế 1 |
| 2 | mỗi `.sqlite` nằm trong thư mục của backend sở hữu nó | `M08-R6` `đỏ_khi` vế 2 |
| 3 | ba bảng phải-xuất có đường export · hai bảng không-xuất thì không | `ADR-06 (c)` |

⚠️ **Vế 3 chỉ kiểm được KHI bảng đã tồn tại.** Hôm nay chưa có bảng nào trong số
năm, nên vế 3 phải **bỏ qua có thông báo**, không phải **xanh im lặng**. Một
cổng xanh vì "chưa có gì để kiểm" mà không nói ra là đúng thứ `M17 AC-3.4` gọi
là *cổng xanh rỗng* — nó làm người ta tin.

`M18-R2` còn một vế nữa (*không ghi bí mật vào log*) — vế đó **cũng** chờ bảng
thật. Cùng cách xử lý.

## Tiêu chí

verifiability: hard
tiêu_chí:
  - AC1: cổng ĐỎ khi `kho.schema.sql` khai một bảng trong `DU_LIEU_GOC`
    cmd: python core/tests/check_db_dung_cho.py --tu-kiem
  - AC2: cổng ĐỎ khi có một `.sqlite` ngoài thư mục backend đã khai
    cmd: python core/tests/check_db_dung_cho.py --tu-kiem
  - AC3: cổng XANH trên repo hiện tại, và **in ra** vế nào bị bỏ qua vì bảng
      chưa tồn tại — không xanh im lặng
    cmd: python core/tests/check_db_dung_cho.py
  - AC4: không hồi quy — mọi cổng đang xanh vẫn xanh
    cmd: python -m pytest core/tests -q

⚠️ **AC1 và AC2 dùng fixture ở thư mục TẠM**, không sửa file thật để thử cổng
(`CLAUDE.md` CẤM). Đó là lý do có cờ `--tu-kiem`: cổng tự dựng schema giả trong
`tempfile.TemporaryDirectory()` rồi đòi chính mình đỏ trên đó.

## Đỏ TRƯỚC

`R5`. Thứ tự bắt buộc:

1. Chạy `python core/tests/check_db_dung_cho.py` → **ĐỎ** (file chưa có:
   `can't open file`). Đây là đỏ khởi điểm, ghi lại.
2. Viết `--tu-kiem` với hai ca dựng sẵn **trước** khi viết phần kiểm thật →
   `--tu-kiem` phải **ĐỎ** vì chưa có logic để bắt.
3. Viết logic → cả hai xanh.

phụ_thuộc: —  (không chờ `FR-047` hay `FR-048`; `ADR-06`/`M08-R6` đã duyệt)
