# T12-40 — Chưng cất xong tự vào kho; bản mới thay bản cũ

> `WO-093`.

phạm_vi_ghi:
  - 07_plan/M12_chungcat/tasks/T12-40-khong-can-duyet.md
  - web/api/nhap-cua.mjs
  - chungcat/src/worker.py
  - chungcat/tests/check_khong_can_duyet.py
  - .factory/wo/WO-093-chung-cat-khong-can-duyet.md

verifiability: hard
tiêu_chí:
  - AC1: kho đã có bản `origin: pipeline` cùng slug ⇒ duyệt THAY nó, bản cũ
      sang thùng rác
    cmd: python chungcat/tests/check_khong_can_duyet.py
    đỏ_khi: vẫn 409 ⇒ chạy lại lần hai bị chặn — vế 1/1a
  - AC2: ÂM · kho có bản `origin: manual` cùng slug ⇒ VẪN 409
    cmd: python chungcat/tests/check_khong_can_duyet.py
    đỏ_khi: ghi đè công người viết — vế 2
  - AC3: `worker` tự gọi `/duyet` sau khi tạo nháp
    cmd: python chungcat/tests/check_khong_can_duyet.py
    đỏ_khi: còn dừng ở bản nháp — vế 3
  - AC4: duyệt TRƯỢT validate ⇒ việc HỎNG, không im lặng; nháp vẫn còn
    cmd: python chungcat/tests/check_khong_can_duyet.py
    đỏ_khi: nuốt lỗi ⇒ "chưng cất xong" mà kho không có gì — vế 3a/3b
  - AC5: bộ cổng M12 + E2E mock không đỏ thêm
    cmd: python chungcat/tests/check_e2e_chung_cat.py --mock
