# T01-39 — khung thôi khai cấu trúc con của tinh túy (đơn vị TEST)

> WO-038. Cổng phải ĐỎ trước, và phải đỏ ở **cả hai chiều** — vì bỏ một luật là
> việc dễ làm hỏng theo cách không ai thấy:
>
> **A · còn sót cấu trúc con.** `khung-than-bai.json` còn khoá `tinh_tuy`, hoặc
> mục 3.4 còn cờ `tinh_tuy: true`, hoặc `than_mau()` còn sinh `####` — thì FE bỏ
> ô con mà Python vẫn đòi, và mọi bài viết qua form thành **422**.
>
> **B · rụng thêm luật.** `validate.py` còn sáu luật khác canh thân bài (đủ mục ·
> dẫn nhập · locator · trần từ…). Bỏ §6 mà tiện tay bỏ luôn §7 thì mục 3.4 hết
> đòi địa chỉ — người dùng KHÔNG nói bỏ cái đó. Cổng phải đòi §7 còn răng.
>
> Và mục 3.4 vẫn phải là **mục nặng** (`nang: true`) — nó chỉ thôi có cấu trúc
> con, không hạ cấp.

phạm_vi_ghi:
  - core/tests/check_khung.py
  # `test_gates.py` có một test canh ĐÚNG luật §6 vừa bỏ. Để nó lại là để một
  # cổng đỏ vĩnh viễn mang tên đơn vị này. Khai trước khi chạm.
  - core/tests/test_gates.py

verifiability: hard
tiêu_chí:
  - AC1: bảng khai KHÔNG còn `tinh_tuy` (khoá gốc lẫn cờ trên mục), và
      `than_mau()` sinh mục 3.4 là văn xuôi — không `####`, không `- **`
    cmd: python core/tests/check_khung.py
  - AC2: chiều ngược — mục 3.4 vẫn `nang: true` + `locator: true`, và
      `validate.py` vẫn từ chối một bài thiếu locator ở 3.4
    cmd: python core/tests/check_khung.py
