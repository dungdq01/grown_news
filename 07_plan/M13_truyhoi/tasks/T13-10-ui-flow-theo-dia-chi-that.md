# T13-10 — `ui_flow.md` nói đúng hình dạng địa chỉ M13 thật trả về

> Nguồn: ô backlog M13 `backlog.md:38`, mở 2026-09-09. Ô ấy hẹn *"sửa ở đơn vị tiếp theo
> chạm nó (`T13-4` khi có `/health` + hình dạng trả về thật)"*. Đo 2026-09-15: `T13-4` đã
> thi công xong (commit `65c0272`) và **không** chạm `ui_flow.md` — `phạm_vi_ghi` của nó
> chỉ có `truyhoi/src/**`. Lời hẹn ấy rơi. Nên ô này cần một đơn vị của chính nó.
>
> **Bài học ghi ra đây để không lặp**: một ô backlog hẹn *"đơn vị sau sẽ làm"* mà đơn vị sau
> không khai file đó trong `phạm_vi_ghi` thì lời hẹn **không có răng**. Ô backlog là trí nhớ,
> `phạm_vi_ghi` mới là quyền ghi. Hẹn vào một đơn vị ⇒ phải sửa `phạm_vi_ghi` của đơn vị ấy
> **cùng lúc**, hoặc mở đơn vị riêng ngay.
>
> **Đo được hôm nay** — `06_modules/M13_truyhoi/ui_flow.md:16`:
>
> ```
> | mỗi đoạn trả về | `file#anchor` **bấm được** → mở đúng vị trí trong nguồn | M03_web (C3) |
> ```
>
> Sai hai vế so với thứ service thật trả:
> 1. `FR-073` + `AC-2.3` chốt trường `dia_chi` có **hai** dạng — `file-dong`
>    (`article/x.md:36-41`) và `slug-moc` (`ecomerce-skill-claude:t=00:10`). Bảng chỉ khai một.
> 2. `file#anchor` **chỉ bấm được sau C3**. C3 nay đã xong (`T03-149`, commit `8648cee`:
>    `md()` sinh id trên heading = `slugGoiY` + dedup) ⇒ câu *"bấm được"* nay đúng cho dạng
>    `file-dong`, nhưng vẫn **không** đúng cho `slug-moc` — mốc thời gian mở trình phát,
>    không mở vị trí trong văn bản.
>
> `ui_flow.md` **không** FROZEN (glob frozen chỉ phủ `spec.md` · `rules.md` · `contracts/*.json`)
> ⇒ đơn vị PATCH bình thường, không cần FR.

phạm_vi_ghi:
  - 06_modules/M13_truyhoi/ui_flow.md

phụ_thuộc: T13-4

verifiability: hard
tiêu_chí:
  - AC1: bảng §1 khai **cả hai** dạng địa chỉ, gọi đúng tên đã ký trong `spec.md AC-2.3`
      (`file-dong` · `slug-moc`) — grep từng tên trong `ui_flow.md` ⇒ mỗi tên ≥ 1
    cmd: python core/tests/check_ba.py
    đỏ_khi: chỉ một trong hai dạng có mặt
    xanh_khi: cả hai có mặt, và không thêm tên dạng thứ ba nào không có trong spec
  - AC2: `ui_flow.md` **hết** câu khai địa chỉ là `file#anchor` như dạng duy nhất — grep
      `file#anchor` ⇒ 0
    cmd: python core/tests/check_ba.py
  - AC3: bảng đối chiếu được với hợp đồng thật, không tự khai thêm trường — mọi tên trường
      `ui_flow.md` nhắc trong bảng §1/§2c đều có trong `05_uiux/contracts/truyhoi.sample.v3.json`
    cmd: python truyhoi/tests/check_hop_dong_v3.py
    đỏ_khi: một tên trường trong ui_flow không có trong hợp đồng v3
    xanh_khi: 0 tên thừa
  - AC4: `check_g6a` cho M13 **không đổi số** — vẫn `6 rule · AC 23 hard/1 soft`. Đơn vị này
      không chạm `spec.md`/`rules.md`
    cmd: python core/tests/check_g6a.py
    đỏ_khi: số rule hoặc số AC đổi ⇒ có người đụng file FROZEN
    xanh_khi: y hệt baseline

# CẤM: KHÔNG sửa `spec.md`/`rules.md` trong đơn vị này — chúng FROZEN, sửa phải qua FR.
# Nếu đọc kỹ thấy chính `spec.md` nói sai thì DỪNG, mở ô backlog, báo PM. Vế AC-2.2 của
# spec đã có ô riêng và đang chờ FR-082 — không gộp vào đây.
