# T03-135 — Panel "Sinh transcript · đã xong" hiện chính transcript

> `WO-081 §2`. Chủ dự án 2026-09-09.

phạm_vi_ghi:
  - 07_plan/M03_web/tasks/T03-135-panel-transcript-xong.md
  - web/plugins/cctab/src/cctab.inline.ts
  - web/styles/prototype.css

verifiability: hard
tiêu_chí:
  - AC1: panel hiện danh sách cue của transcript, KHÔNG hiện đoạn văn chỉ
      đường sang cửa sổ khác
    cmd: cd web && node test/chunk-tu-chua.test.js
  - AC2: câu "transcript là hiện vật, không vào hàng nháp" rút thành MỘT dòng
      xanh lá (`.vc-ok`), và ngay dưới nó là KHE CUE (`.vc-tr`)
    cmd: cd web && node test/cua-so-transcript.test.js
    đỏ_khi: bỏ `.vc-ok` · để nó dài quá 160 ký tự (đoạn văn quay lại) · bỏ
      `.vc-tr` · `.vc-ok` không có luật CSS — vế 6/6a/6b/6c
    ghi_chú: cmd này THÊM 2026-09-09 sau khi `check_g6b` bắt "4 AC / 3 cmd".
      Một AC không ai đo là một lời hứa, và `R3` hạ cả task xuống `soft`.
  - AC3: nút "Chưng cất từ transcript" nằm ở FOOTER (`.bk-f .bt-bt`), màu xanh
      lam `--c-video` — token đã có, không thêm token mới
    cmd: cd web && node test/token-only.test.js
  - AC4: chunk `cctab` vẫn TỰ CHỨA — `esc` lấy qua cầu `mw()`, không gọi trần
    cmd: cd web && node test/chunk-tu-chua.test.js
    đỏ_khi: dùng `esc` trần trong hàm mới (ĐÃ xảy ra, cổng bắt đúng)
