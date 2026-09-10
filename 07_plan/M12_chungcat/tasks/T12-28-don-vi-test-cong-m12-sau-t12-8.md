# T12-28 — đơn vị TEST của M12 sau khi `T12-8` đóng

> Chủ dự án duyệt 2026-09-07 (*"1, 2 và 3: OK"*) cho câu hỏi ở G6C:
> *"`T12-8` khai lại `phạm_vi_ghi`, hay cổng đổi chủ?"*
  - chungcat/tests/check_transcript_dung_byte_kho.py   # WO-065 · byte trong kho
  - chungcat/tests/check_hong_khong_mang_nhan_cho.py   # WO-066 · giai đoạn hong
  - chungcat/tests/check_sinh_thumbnail.py            # WO-071 · T12-30

## Chọn gì, và vì sao không chọn cái kia

**Chọn: một đơn vị test MỚI nhận mọi cổng `chungcat/tests/` sinh sau khi
`T12-8` đóng.** `T12-8` giữ nguyên 19 cổng của nó, không mở lại.

| lối | vì sao KHÔNG |
|---|---|
| `T12-8` khai lại `phạm_vi_ghi` | `T12-8` **đã đóng, 19/19 xanh**. Mở lại một đơn vị đã đóng để nó nuốt thêm file là biến nó thành một cái giỏ lớn mãi — và `phạm_vi_ghi` của một cái giỏ không phân biệt được ai đang ghi vào đâu, tức `R1` mất địa chỉ đúng thứ nó cần |
| cổng ở lại với đơn vị viết mã | Đó là **`R1` bị vi phạm trực tiếp**: đơn vị viết mã không được viết thước chấm chính mình. `check_g6b §5` bắt đúng chỗ này |

Đây là khuôn `T03-110b` đã dùng cho M03 — một đơn vị test riêng, danh sách cổng
lớn dần theo từng đợt. Có tiền lệ trong chính dự án này thì không đẻ hình dạng
thứ hai.

## `phạm_vi_ghi`

```
phạm_vi_ghi:
  - chungcat/tests/check_nhat_ky_mot_ben_ghi.py    # MỚI · nhật ký một bên ghi
  - chungcat/tests/check_nap_lai_tra_200.py        # MỚI · FR-071
  - chungcat/tests/check_idempotency.py            # FR-071 · nap() trả tuple
  - chungcat/tests/check_hang_doi_nguyen_tu.py     # FR-071 · nap() trả tuple
  - chungcat/tests/check_hai_kieu_viec.py          # FR-071 · nap() trả tuple
  - chungcat/tests/check_checkpoint_giai_doan.py   # FR-071 · nap() trả tuple
  - chungcat/tests/check_e2e_chung_cat.py          # FR-071 · nap() trả tuple
```

**Năm file dưới đã có chủ là `T12-8`.** Chúng vào đây vì `FR-071` đổi kiểu trả
về của `vong.HangDoi.nap()`, và mỗi file đó gọi `nap()`. Đây **không** phải
nới phạm vi để tiện: nó là một đơn vị việc có phụ thuộc thật vào một FR đã
duyệt, và nó khai ra thay vì sửa lặng lẽ.

⚠️ Sau khi đóng đơn vị này, `T12-8` **không còn** là chủ của năm file ấy — cập
nhật `phạm_vi_ghi` của `T12-8` để bỏ chúng, không để hai đơn vị cùng khai một
file. `<scope-check>` **chưa cài** trong dự án này nên không ai báo giúp; đây là
lý do dòng cảnh báo này phải nằm trong task file.

verifiability: hard
tiêu_chí:
  - AC1: nhật ký — mỗi tiến trình worker một file, và file khoá do CÙNG một hàm
      dựng tên cho cả bên ghi lẫn bên đọc
    cmd: python chungcat/tests/check_nhat_ky_mot_ben_ghi.py
    đỏ_khi: "hai `CHUNGCAT_WORKER_ID` trỏ về một file; hoặc đường bên ĐỌC không
      phải đường bên GHI tạo; hoặc guard giấu thông tin"
    xanh_khi: "hai id ⇒ hai file · `duong_khoa()` tồn tại và trỏ đúng file
      `bat()` vừa ghi · vắng id thì giữ `worker.jsonl`"
  - AC2: nạp lại một ULID đã có ⇒ `200` kèm `da_co: true`, hàng đợi vẫn đúng
      MỘT việc; hai ULID khác nhau ⇒ `201` cả hai lần
    cmd: python chungcat/tests/check_nap_lai_tra_200.py
    đỏ_khi: "lần nạp thứ hai trả `201`; hoặc `da_co` vắng; hoặc hàng đợi thành
      hai việc; hoặc hai ULID khác nhau mà lần hai trả `200` (đỏ oan ngược)"
    xanh_khi: "201 → 200 + `da_co: true` + `viec_id` CŨ, và phép nguyên tử của
      `check_hang_doi_nguyen_tu` giữ xanh"
  - AC3: năm cổng cũ vẫn xanh sau khi `nap()` đổi kiểu trả về
    cmd: python chungcat/tests/check_hang_doi_nguyen_tu.py
