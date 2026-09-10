# M18_nguoidung — workflow

> **KHÔNG dùng trình tự chuẩn hoàn toàn** — hai lý do ở §1.
> Phần còn lại theo `/factory:go` PATCH 10 bước.

## 1 · Hai chỗ M18 khác trình tự chuẩn

**a · M18 không có `phạm_vi_ghi` của riêng nó.**
Module NGANG: `be: 06_modules/M18_nguoidung/**`, `fe: null`. **Không sở hữu một
file mã nào.** Nên mọi đơn vị việc phải khai `phạm_vi_ghi` theo boundary của
**module chủ** — `web/api/**` cho DDL và bảy cửa, `web/**` cho màn admin —
và `check_g6b` kiểm điều đó (`M18-R4`).

⚠️ Khai `phạm_vi_ghi: 06_modules/M18_nguoidung/**` cho một task viết code là
**sai và im lặng**: nó trỏ vào một thư mục chỉ chứa tài liệu, nên `R1` đo ở mức
nhánh sẽ **không thấy** diff thật nằm ở đâu.

**b · Bảy trong tám contract chờ `FR-047`.**
`model_flow §2`: bốn contract với M08 (DDL + bảy cửa), ba với M17/M15/M03 — tất
cả đi qua bảy cửa mà `FR-047` mở. Trước khi có chúng, M18 **không thi công được
gì ngoài tài liệu**.

Và đường đi vòng là **đọc DB trực tiếp từ BIÊN**, tức `Z4` chết trong khi mọi
cổng vẫn xanh. Ghi ra để s7 không xếp M18 vào lịch trước `FR-047`.

## 2 · Thứ tự trong module

```
1. DDL bốn bảng trong DB của LÕI ở web/          ← ADR-06; 0 phụ thuộc khác
2. bảy cửa C1–C7 (FR-047)                        ← cần 1
3. check_db_dung_cho.py                          ← ✅ XONG (T08-10)
4. mã mời: sinh (AC-2.1) + đánh dấu nguyên tử    ← cần 2
5. buộc kênh (AC-3.x)                            ← cần 4
6. thu hồi + phiên hết hiệu lực (AC-1.3)         ← cần 2
7. màn admin                                     ← cần 2 + WIREFRAME (s5 chưa chạy)
8. rate limit + entropy + log thất bại           ← CHỜ FR bổ sung
9. phân vai                                      ← CHỜ FR "vai nào làm được gì"
```

**Bước 3 trước bước 4** — cố ý, và ngược trực giác. `check_db_dung_cho.py` là
lệnh mà **hai** rule đang trỏ tới (`M08-R6` và `M18-R2`). ✅ **Đã cài ở T08-10
(2026-09-02)** — phần *chỗ ở* xong, phần *export* còn 5 vế BỎ QUA cho tới khi
bước 1 dựng DDL. Dựng
nó ngay sau DDL nghĩa là mọi bước sau đó có một cổng canh; dựng nó cuối nghĩa là
sáu bước chạy không ai canh, rồi cổng ra đời và phải đi sửa ngược.

**Bước 6 sau bước 4/5** vì `AC-1.3` (thu hồi làm phiên hết hiệu lực) chỉ kiểm
được khi đã có phiên thật để thu hồi.

**Bước 8 và 9 KHÔNG có trong lịch** — chúng chờ quyết định của chủ dự án, không
chờ một task nào xong.

## 3 · Verify sau mỗi đơn vị

```bash
python core/tests/check_g6a.py
python core/tests/check_ba.py
python core/tests/check_rule_surfaces.py
python core/tests/check_map.py
cd web && node test/api-guard.test.js    # cửa ghi PHẢI vẫn là một
```

⚠️ `api-guard.test.js` chạy sau **mỗi** đơn vị. Bảy cửa mới của `FR-047` đi vào
`web/api/**`, tức đúng chỗ răng *"mutation chỉ ở một file"* đang canh. Nếu nó đỏ
thì câu trả lời **không** phải nới nó.

## 4 · Chỗ DỪNG riêng của M18

- định đặt bốn bảng vào `kb/_kho.sqlite` ⇒ **DỪNG** (`ADR-06`, `M08-R6`) —
  `dung_lai_db.py:139-140` xoá DB đó rồi dựng lại **từ file**
- định cho M15 hoặc M17 đọc DB trực tiếp vì cửa chưa có ⇒ **DỪNG** (`Z4`)
- định dùng cột `vai` làm cổng chặn ⇒ **DỪNG** (`M18-R3`) — cần FR trước
- định `SELECT` rồi `UPDATE` cho `ma_moi` ⇒ **DỪNG** (`M18-R1`)
- định ghi giá trị `ma` vào log hoặc vẽ lên màn ⇒ **DỪNG** (`M18-R2`, `ui_flow §2b`)
- định đặt một số `SCR` cho màn admin ⇒ **DỪNG** — s5 chưa chạy, và **hai hệ
  đánh số SCR đang lệch nhau** (`ui_flow §0`)
- định thi công `AC-7.1/7.2/7.3` trước khi có FR bổ sung ⇒ **DỪNG**
- định xoá một hàng `nguoi_dung` ⇒ **DỪNG** (`AC-1.2`) — audit thành mồ côi
- định khai `phạm_vi_ghi: 06_modules/M18_nguoidung/**` cho một task viết code ⇒
  **DỪNG** (`M18-R4`)
