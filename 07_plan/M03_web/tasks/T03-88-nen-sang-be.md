# T03-88 — FR-042: chế độ sáng nền be (đơn vị CODE)

> Đổi SẮC họ trung tính sáng sang be, GIỮ ĐỘ SÁNG — alpha .8 của FR-027b neo
> vào độ sáng nền, đổi độ sáng là phải đo lại cả chuỗi. Chế độ tối không đụng.

phạm_vi_ghi:
  - 05_uiux/tokens.css
  - 05_uiux/contracts/contrast-audit.json   # sinh bằng máy, không gõ tay
  # Lượt 2 của FR-042 — người dùng: "bỏ bớt độ mờ, tăng sáng + nét background":
  - web/styles/prototype.css                # flare/vign đọc token theo chế độ
  - web/styles/WORKLOG.md
verifiability: hard
tiêu_chí:
  - AC1: audit sinh lại từ tokens mới — 0 cặp trượt AA
    cmd: python core/tools/sinh_contrast_audit.py
  - AC2: các cổng màu/kính của web không đỏ
    cmd: cd web && node test/opacity-khong-pha-contrast.test.js && node test/token-only.test.js && node test/motion-polish.test.js
phụ_thuộc: T03-1
