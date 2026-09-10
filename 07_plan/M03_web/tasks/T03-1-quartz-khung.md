# T03-1 — dựng Quartz, import token, render được một trang

phạm_vi_ghi:
  - web/**
verifiability: hard
tiêu_chí:
  - AC1: build chạy, ra site tĩnh
    cmd: cd web && npx quartz build
  - AC2: không giá trị px nào cho font-size/spacing ngoài tokens.css
    cmd: node web/test/token-only.test.js
  - AC3: allowDangerousHTML KHÔNG bật
    cmd: node web/test/no-dangerous-html.test.js

## Việc

Dựng Quartz v4, trỏ content vào `kb/`, import `05_uiux/tokens.css` **nguyên vẹn**.

Chưa cần custom part nào — task này chỉ chứng minh khung chạy và token vào được.

## Rule áp vào

`M03-R3` không `allowDangerousHTML` (S3, AC3) · `M03-R4` không gõ lại token (S3, AC2).

## Lưu ý

`tokens.css` là file frozen. **Import, không copy** — copy thì `check_frozen.py`
không bắt được vì bản copy nằm ngoài danh sách, và hai bản sẽ lệch nhau.
