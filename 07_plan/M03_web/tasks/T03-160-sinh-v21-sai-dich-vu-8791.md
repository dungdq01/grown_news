# T03-160 — `sinh_v21.py` báo sai dịch vụ ở cổng 8791 (chatbot là 8788)

> Mã cho cổng `T03-158`. ID rule 9: dải CHẴN dev chính, max 158 ⇒ **160**.
>
> Sửa ở **script sinh**, rồi **sinh lại** file HTML. `app-v21.html` là output: sửa `.html`
> trước rồi chạy lại script là mất thay đổi, và mất **im lặng**.

phạm_vi_ghi:
  - 05_uiux/prototype/sinh_v21.py
  - 05_uiux/prototype/app-v21.html      # sinh lại, KHÔNG sửa tay

phụ_thuộc: T03-158

verifiability: hard
tiêu_chí:
  - AC1: cổng `T03-158` chuyển từ **ĐỎ 2 chỗ** sang **XANH 0 chỗ**
    cmd: cd web && node test/proto-ten-dich-vu-va-cong.test.js
  - AC2: `app-v21.html` được sinh lại từ script chứ không sửa tay — chạy `sinh_v21.py` xong,
      `git diff --stat 05_uiux/prototype/app-v21.html` ⇒ **0 dòng đổi**
    cmd: python 05_uiux/prototype/sinh_v21.py
    đỏ_khi: chạy script xong file còn đổi ⇒ có người đã sửa tay vào output
    xanh_khi: 0
  - AC3: prototype còn nguyên số màn — `grep -c '<section class="man"' app-v21.html`
      **trước == sau**; sửa một câu lỗi không được làm rơi một màn
    cmd: cd web && npm test

# Chỉ đổi **tên dịch vụ và số cổng** trong câu lỗi của màn M14. KHÔNG viết lại câu cho
# "hay hơn", KHÔNG đụng ba câu trạng thái khác của màn — CLAUDE.md §3 (sửa ngoại khoa).
