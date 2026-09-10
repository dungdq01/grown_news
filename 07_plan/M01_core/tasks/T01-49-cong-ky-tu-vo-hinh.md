# T01-49 — cổng chặn ký tự điều khiển vô hình trong mã

> `WO-063`. Ba lần trong MỘT phiên, cùng một bẫy, và không lần nào cổng nào đỏ.

## Vì sao đáng một cổng riêng

Viết `\b` (ranh giới từ) qua một chuỗi KHÔNG-raw thì nó thành ký tự BACKSPACE
thật (`0x08`) nằm giữa regex. Viết `\25B8` (mũi tên ▸) trong chuỗi Python thì
`\25` là escape BÁT PHÂN ⇒ `0x15`.

Hậu quả đo được trong phiên 2026-09-06:

| chỗ | hỏng thế nào |
|---|---|
| `check_g6b` | phép kiểm "phụ thuộc treo" IM LẶNG thành mù |
| `no-write-path` | cổng AN NINH `mkdir\|rm\|unlink` **mù hoàn toàn** sau khi tôi "sửa" nó |
| `tab-theo-doi-chung-cat` | phép kiểm animation-layout mù |
| `cctab` CSS | mũi tên gấp/mở của ô chỉ dẫn thành ký tự điều khiển |

**Nhìn bằng mắt, dòng hỏng đọc Y HỆT dòng đúng.** `grep` cũng không thấy —
`repr()` hoặc `cat -A` mới lộ. Đó là lý do phép kiểm này tồn tại: nó rẻ, chạy
một giây, và bắt đúng một thứ mắt người không bắt được.

Ca `no-write-path` là ca đắt nhất: tôi *sửa* một cổng đỏ oan và biến nó thành
cổng mù, rồi báo "đã sửa". Một cổng mù tệ hơn một cổng đỏ oan — đỏ oan thì
người đi tìm, mù thì không ai biết có gì để tìm.

phạm_vi_ghi:
  - core/tests/check_ky_tu_vo_hinh.py   # MỚI — quét toàn repo
# Đây LÀ đơn vị test (phạm vi chỉ gồm một cổng), nên `R1` không vướng.

verifiability: hard
tiêu_chí:
  - AC1: quét mọi `.py/.js/.mjs/.ts/.json/.css/.html/.yaml` — 0 ký tự điều khiển
      ngoài `\t \n \f \r`
    cmd: python core/tests/check_ky_tu_vo_hinh.py
    đỏ_khi: một file mang `0x08`/`0x15`/`0x7F`
    xanh_khi: repo sạch
  - AC2: câu ĐỎ nói được CÁCH SỬA, không chỉ nói có lỗi
    cmd: python core/tests/check_ky_tu_vo_hinh.py
