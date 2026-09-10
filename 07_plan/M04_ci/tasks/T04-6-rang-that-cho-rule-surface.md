# T04-6 — `check_rule_surfaces` quét MỌI `rules.md` (đơn vị TEST)

> **Cổng này chưa bao giờ làm việc tên nó nói.** `CLAUDE.md` đặc tả
> `<rule-surface-check>` là *"exit 0 = **mọi** rule S3/S4 trong `rules.md` có
> `lệnh:` chạy được"*. Đọc mã hiện tại: nó kiểm **đúng hai rule gõ cứng**
> (`M01-R3`, `M04-R1`) và **không mở một file `rules.md` nào**.
>
> Hệ quả theo `R3` — *"`hard` mà không có lệnh chạy được ⇒ nó là `soft`"* — là
> **39 rule đang khai `S3` với một lệnh không chạy**, và không ai được báo.

## Đo trước (2026-09-02)

| bucket | số |
|---|---|
| S3 có lệnh **chạy được** | 11 |
| S3 có lệnh **không chạy** | 39 |
| S3 **không khai `lệnh:`** | 22 |

## Vấn đề thiết kế: bật răng thẳng tay là một ngày cờ

39 + 22 = **61 rule đỏ ngay lập tức**, và `check_rule_surfaces` nằm trong điều
kiện đóng `G6A`. Một cổng đỏ 61 chỗ ngày đầu tiên **không phải một cổng** — nó
là một cổng người ta sẽ tắt.

Và phần lớn con số đó **không phải nói dối**: 35 lệnh trỏ vào
`chungcat/tests/` · `truyhoi/tests/` · … — sáu dịch vụ **chưa dựng**. Đo được:
sáu thư mục đó tồn tại nhưng mỗi cái chỉ có **`README.md`**, và **không cái nào
có `tests/`**. Một rule của module chưa thi công mà chưa có cổng thì đó là
**lịch trình**, không phải một lời khai sai.

## Phân loại — bằng CƠ HỌC, không bằng `status`

`project_map.status` **không dùng được**: `M08_api` khai `planned` nhưng
`web/api/**` đã chạy thật, còn M12–M17 **không có `status`**. Nên phép phân
loại là **thư mục chứa lệnh có tồn tại không**:

| bucket | điều kiện | kết quả |
|---|---|---|
| **OK** | file lệnh tồn tại | xanh |
| **CHỜ** | thư mục cha của lệnh **chưa tồn tại** ⇒ dịch vụ chưa dựng | in ra, **không đỏ** |
| **ĐỎ** | thư mục cha **có** mà file **không** | **đỏ** |
| **GRANDFATHER** | khai `S3` không có `lệnh:`, **có tên trong danh sách đóng băng** | in ra, không đỏ |
| **ĐỎ** | khai `S3` không có `lệnh:`, **không** có trong danh sách | **đỏ** |

⇒ Đây là một **bánh cóc**: nợ cũ được nêu tên và chỉ **co lại được**; nợ MỚI
đỏ ngay. Không có cờ phải nhớ lật — đúng bài học `S18`.

## Phạm vi

phạm_vi_ghi:
  - core/tests/check_rule_surfaces.py

**Không** sửa một `rules.md` nào để cổng qua. Nếu cổng đỏ trên một rule thì đó
là **phát hiện**, đi ra backlog/FR.

## Tiêu chí

verifiability: hard
tiêu_chí:
  - AC1: cổng ĐỎ khi một rule S3 có `lệnh:` trỏ file thiếu **trong thư mục đã tồn tại**
    cmd: python core/tests/check_rule_surfaces.py --tu-kiem
  - AC2: cổng KHÔNG đỏ khi thư mục chứa lệnh chưa tồn tại — in `CHỜ`
    cmd: python core/tests/check_rule_surfaces.py --tu-kiem
  - AC3: cổng ĐỎ khi một rule S3 **mới** không khai `lệnh:` và không có trong
      danh sách đóng băng; XANH cho rule có tên trong danh sách
    cmd: python core/tests/check_rule_surfaces.py --tu-kiem
  - AC4: hai vế cũ (`M01-R3`, `M04-R1`) **không mất** — vẫn kiểm như trước
    cmd: python core/tests/check_rule_surfaces.py
  - AC5: không hồi quy
    cmd: python -m pytest core/tests -q

## Đỏ TRƯỚC

`R5`. Chạy `--tu-kiem` **trước** khi viết logic → phải ĐỎ (cờ chưa tồn tại).

## Dự đoán kết quả trên repo hiện tại

**2 ĐỎ** — `M18-R1` (`check_ma_moi.py`) và `M18-R3` (`check_vai_trong.py`): cả
hai trỏ vào `core/tests/`, một thư mục **đầy cổng đang chạy**, nên "chưa dựng"
không phải lời bào chữa. Cả hai là **của tôi**, mở trong cùng phiên.

Nếu số thực khác 2 thì **ghi lại số thực**, không sửa cho khớp dự đoán.

phụ_thuộc: T08-10 (đã xong — `check_db_dung_cho.py` là 1 trong 4 nợ cùng loại)
