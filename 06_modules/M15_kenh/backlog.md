# backlog — M15_kenh (chết ở G6C)

> Nợ do một thay đổi **CỤ THỂ vừa gây ra**. Không phải TODO, không phải ý tưởng,
> và **không phải** *"thứ chưa xây"*.
> Ô `[ ]` trỏ artifact có thật; `[x]` phải kèm object (commit · PR · FR id).

## Trống — M15 chưa có mã, nên chưa có thay đổi nào gây nợ

Năm thứ M15 đang chờ **không** thuộc backlog:

| thứ đang chờ | sống ở đâu | vì sao KHÔNG phải backlog |
|---|---|---|
| `C1` `POST /api/nhap` | `FR-047` (**đã duyệt** 2026-09-02) | **hợp đồng với M08** |
| `C3` tra `dinh_danh_kenh` | `FR-047` | cùng vậy |
| `C5` ghi `audit_log` | `FR-047` | cùng vậy |
| rate-limit `ma_moi` | `security_baseline §8.1` | **lỗ trong `FR-045` đã duyệt** ⇒ cần **FR riêng** |
| sáu lệnh `kenh/tests/` | `rules.md` đầu file | **việc của s8** |

## Một nợ nằm ở NGƯỜI, không ở module nào

**Màn buộc `chat_id ↔ tài khoản` chưa tồn tại.** `FR-045` khai bảng
`dinh_danh_kenh` nhưng chưa ai vẽ đường để một người **tự** buộc chat của mình.

Cho tới lúc đó, việc buộc là **thao tác tay của chủ dự án trên DB** — và điều đó
phải được **nói ra** với 5 đồng nghiệp, không để họ gửi tin vào một bot im lặng rồi
tự hỏi vì sao.

Không mở ô ở đây vì đó không phải nợ kỹ thuật của M15: M15 đã khai đúng hành vi
(`AC-3.2`: chưa buộc ⇒ **từ chối và nói ra**). Cái thiếu là **một màn ở M03 + M17**,
và nó đi cùng ô C3 đã mở ở `06_modules/M03_web/backlog.md`.

## Phép thử s6 đã chạy — 17/17 AC viết được testcase

`testcases.md` §cuối: **15/17 viết được ngay**; hai cái mơ hồ và **đã sửa hợp đồng**
cùng phiên 2026-09-02. **Cả hai cùng một bệnh**: AC khai một **con số** mà nguồn của
số đó **không tồn tại**.

- `AC-2.4` (M8.2) — *"≤ 20% công kênh thứ nhất"* không nói **tổng gồm gì**. Gồm cả
  hạ tầng dùng chung ⇒ mẫu số phình, tỉ lệ **luôn đạt**, cổng **không đỏ được**;
  chỉ tính adapter ⇒ **đỏ oan**. ⇒ nay **đông cứng mẫu số** tại thời điểm một-kênh,
  và cổng in **cả hai số**.
- `AC-5.2` — *"tin nhắn MẤT, và điều đó được ghi log"* đọc được thành phải **đếm
  được số tin**. Telegram giữ update 24h và API **không** nói *"bạn mất N tin"*.
  ⇒ nay khai thứ **biết được**: **khoảng thời gian offline**, và nếu >24h thì nói
  update trong khoảng đó **có thể** đã mất.

Không mở ô cho chúng vì **đã đóng trong cùng lượt**.
