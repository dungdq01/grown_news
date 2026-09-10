# T03-123 — nút Chưng cất chỉ MỞ SAU transcript, và mở CỬA SỔ chưng cất riêng

> Chủ dự án 2026-09-07: *"Sau khi có bản transcript rồi thì mới hiển thị
> button chưng cất, bấm vào button đó thì bản transcript mới truyền vào làm
> input, cộng với các input hiện có và prompt user nhập nữa ⇒ nó sẽ ra 1 cửa
> sổ multi window khác… Và cửa sổ chưng cất này mới hiển thị tiến trình và kết
> quả chưng cất."*
> Phụ thuộc: `T12-27` (transcript làm nguyên liệu) · `T03-122` (cửa sổ transcript).
> ID rule 9: max M03 = 122 ⇒ 123.

## Nút phải NÓI THẬT về điều kiện của nó

Nay `chung-cat-mot-nguon` trên một video **đòi** transcript (`FR-070`). Một
nút bấm vào ra 409 là một nút nói dối về việc nó làm được.

Ba trạng thái, ba câu khác nhau — gộp là bỏ mất đúng thông tin người cần:

```
chưa có transcript   ⇒ nút MỜ + "cần transcript trước — Sinh transcript →"
đang sinh transcript ⇒ nút MỜ + "đang sinh transcript…"
có transcript        ⇒ nút SÁNG "⚗ Chưng cất…"
```

## Cửa sổ chưng cất là cửa sổ THỨ BA

Bấm ⇒ hộp thoại `chi_dan` (đã có, `T03-116`) ⇒ tạo việc ⇒ mở **cửa sổ riêng**
đặt cạnh, và CHÍNH cửa sổ ấy hiện tiến trình + kết quả. Ba cửa sổ song song:
`Xem` · `Transcript` · `Chưng cất`.

Vì sao không dùng lại tab: tab nằm trong cửa sổ bản ghi, nên theo dõi tiến
trình là mất chỗ đang đọc. Cả điểm của flow là ba thứ CẠNH nhau.

## THÊM, không sửa

Tab `Chưng cất` trong cửa sổ đọc **giữ nguyên** (đã chốt). Việc này thêm một
đường thứ hai đi thẳng ra cửa sổ riêng.

phạm_vi_ghi:
  - web/plugins/multiwindow/src/scripts/multiwindow.inline.ts
  - web/plugins/cctab/src/cctab.inline.ts
# Cổng thuộc ĐƠN VỊ TEST `T03-110b` (mở rộng CÙNG LƯỢT) — `R1`.

verifiability: hard
tiêu_chí:
  - AC1: bản ghi video CHƯA transcript ⇒ nút chưng cất MỜ + câu chỉ đường,
      KHÔNG gọi `POST /api/job`
    cmd: node web/test/chung-cat-sau-transcript.test.js
    đỏ_khi: bấm được và ra 409 — nút nói dối về việc nó làm được
  - AC2: CÓ transcript ⇒ nút sáng; bấm ⇒ hộp thoại `chi_dan` ⇒ tạo việc
    cmd: node web/test/chung-cat-sau-transcript.test.js
  - AC3: tạo việc xong ⇒ mở CỬA SỔ RIÊNG, đặt cạnh cửa sổ nguồn
    cmd: node web/test/chung-cat-sau-transcript.test.js
  - AC4: tiến trình + kết quả hiện TRONG cửa sổ ấy, không ở tab
    cmd: node web/test/chung-cat-sau-transcript.test.js
  - AC5: nền web giữ xanh
    cmd: cd web && npm test
