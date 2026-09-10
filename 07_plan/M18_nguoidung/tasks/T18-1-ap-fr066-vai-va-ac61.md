# T18-1 — áp `FR-066`: `AC-6.1` đổi nghĩa · `M18-R3` đổi vai · AC §10

> Tách ra khỏi `T08-16` theo đúng tiền lệ PM vừa dùng cho `T09-8` (2026-09-05):
> một đơn vị chạm ≥2 module là **BUILD-hình-dạng, không phải PATCH**, và
> `CLAUDE.md` câu 1 phân đường như vậy.
>
> `T08-16` khai ghi `06_modules/M18_nguoidung/spec.md` + `rules.md` — đất M18,
> ngoài boundary `M08_api`. Đó là hai lỗi boundary cuối của `check_g6b`. Cách
> sửa KHÔNG phải nới boundary M08 (M08 không sở hữu giấy tờ của M18), cũng
> không phải xoá dòng khai đi cho cổng im (việc đã ghi thật thì xoá lời khai là
> sửa BIÊN GHI cho vừa cổng — đúng thứ luật gốc cấm). Cách sửa là để đất nào
> chủ nấy: phần giấy về M18.

## Trạng thái: NỘI DUNG ĐÃ ÁP, đơn vị này ghi nhận chủ quyền

Cả ba thay đổi đã nằm trong artifact và đã ký `FROZEN.lock`:

| chỗ | trạng thái |
|---|---|
| `AC-6.1` | đã đổi nghĩa — *"`vai` đọc ở ĐÚNG MỘT chokepoint (`duocLam`)"* |
| `AC-6.2` | `vai` là enum ĐÓNG (`chu` · `dong_nghiep`), `NOT NULL`, mặc định vai ÍT quyền nhất |
| `M18-R3` | `why` ghi *"ĐỔI VAI 2026-09-02 (FR-051)"*; `đỏ_khi`/`xanh_khi` đếm chỗ đọc `.vai` |
| §10 | có đủ §10.1–§10.9 |

Nên đơn vị này KHÔNG sinh thay đổi mới. Nó tồn tại để `phạm_vi_ghi` của hai
file ấy có **chủ đúng module**, và để `FR-066` có một đơn vị trỏ về.

phạm_vi_ghi:
  - 06_modules/M18_nguoidung/spec.md   # AC-6.1 đổi nghĩa · AC §10
  - 06_modules/M18_nguoidung/rules.md  # M18-R3 đổi vai theo FR-051 §3e
# `FROZEN.lock` KHÔNG khai ở đây: agent không ký. NGƯỜI chạy `check_frozen --ky`.

phụ_thuộc: FR-066 · FR-051

verifiability: hard
tiêu_chí:
  - AC1: `vai` đọc ở ĐÚNG MỘT chỗ trong `web/api/**`, và `duyet-bai` KHÔNG nằm
      trong bảng QUYEN
    cmd: cd web && node test/phan-quyen.test.js
    đỏ_khi: đếm chỗ đọc `.vai` khác 1; hoặc một `viec` chưa khai quyền mà làm được
    xanh_khi: FR-051 Y1–Y7 xanh
  - AC2: hai artifact khớp baseline đã ký — không ai sửa lén sau khi ký
    cmd: python core/tests/check_frozen.py
  - AC3: rule của M18 khai bề mặt chạy được, không rule nào mất răng
    cmd: python core/tests/check_rule_surfaces.py
    đỏ_khi: M18-R3 khai `S3` mà lệnh không chạy được
