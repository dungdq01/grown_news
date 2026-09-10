# M04_ci — model flow

## Entity vào / ra

**Không có.** M04 không đọc entity, không ghi entity. Nó chạy lệnh và trả exit code.

Nó *đọc file* trong `kb/` — nhưng qua `validate.py` của M01, không tự parse. M04
không biết `Analysis` có trường gì.

**Vì sao quan trọng**: M02 thêm trường vào schema thì M04 **không phải sửa gì**.
Nếu M04 tự parse frontmatter thì mỗi lần đổi schema là hai chỗ phải sửa, và chúng
sẽ lệch nhau.

## Gọi module khác qua contract nào

| Gọi | Qua |
|---|---|
| M01_core | chạy `pytest core/tests` và `validate.py` — **lệnh**, không import |
| M02_kb | gián tiếp, qua validate |
| M03_web | `npx quartz build` (bật ở B3a, đang comment trong template) |

Hợp đồng của M04 với mọi module là **lệnh chạy được + exit code**. Không import,
không API, không parse chung.

Đây là lý do M04 không cần biết gì về nội dung: exit 0 là đạt, khác 0 là gác.
