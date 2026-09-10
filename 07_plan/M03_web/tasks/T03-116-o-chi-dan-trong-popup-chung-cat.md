# T03-116 — Ô "CHỈ DẪN THÊM" GỘP vào popup tạo bản chưng cất — WIREFRAME TRƯỚC

> Chủ dự án duyệt 2026-09-06, kèm HAI điều kiện nguyên văn: (1) *"phải gộp
> nó vào UI khi tạo bản chưng cất luôn"* — cùng MỘT popup, không màn riêng;
> (2) *"dev vẽ wireframe trước, tôi duyệt mới code UI"*.
> CHẶN CỨNG: sau T12-25 (backend chi_dan + preset). ID rule 9: max 115 ⇒ 116.

## BƯỚC 1 — WIREFRAME (soft gate, NGƯỜI duyệt — CẤM code trước khi duyệt)

- Vẽ wireframe popup chưng cất bản MỚI vào
  `05_uiux/wireframes/SCR-18-popup-chung-cat-chi-dan.md` (ASCII/mermaid theo
  khuôn SCR sẵn có), tối thiểu 3 trạng thái: mặc định (ô chỉ dẫn GẤP —
  một dòng "Chỉ dẫn thêm (tuỳ chọn) ▸") · mở rộng (textarea + đếm ký tự
  còn lại theo trần bảng khai + hàng CHIPS preset bấm-là-điền) · lỗi
  (quá trần — 422 hiện nguyên văn).
- Ràng buộc thừa kế: một câu cảnh báo T03-106 giữ nguyên · optgroup model
  giữ · popup vẫn GỌN (chỉ dẫn mặc định gấp — không đẩy popup thành form).
- Đưa wireframe cho chủ dự án duyệt (worklog ghi mốc duyệt) — DUYỆT rồi
  mới sang bước 2.

## BƯỚC 2 — CODE (sau duyệt wireframe)

- Popup: ô chỉ dẫn gấp/mở + chips preset (dẫn xuất từ API T12-25, cấm gõ
  cứng) + đếm ký tự; giá trị đi vào body POST /api/job (`chi_dan`).
- Nhớ chỉ dẫn dùng gần nhất mỗi tab (sessionStorage, khuôn T03-105 —
  xoá khi dùng).
- Cửa sổ kết quả/nháp HIỆN chi_dan đã dùng (một dòng meta, nếu có).

phạm_vi_ghi:
  - 05_uiux/wireframes/SCR-18-popup-chung-cat-chi-dan.md   # MỚI — bước 1
  - web/plugins/chungcat/src/chungcat.inline.ts            # popup + chips (bước 2)
  - web/plugins/cctab/src/cctab.inline.ts                  # dòng meta chi_dan ở kết quả
  - web/styles/prototype.css                               # đo trước — trần gn
# vế cổng thuộc đơn vị test đi kèm (chung-cat-ui.test.js mở rộng CÙNG LƯỢT) — R1

verifiability: hard
tiêu_chí:
  - AC0 (soft — NGƯỜI): wireframe SCR-18 được chủ dự án duyệt TRƯỚC mọi dòng
      mã bước 2; worklog mang mốc duyệt (R5 thứ tự: giấy → duyệt → code)
  - AC1: popup có ô chỉ dẫn GẤP mặc định; mở ra có textarea + chips dẫn xuất
      từ API preset (thêm preset backend ⇒ chip mọc, 0 mã FE đổi)
    cmd: node web/test/chung-cat-ui.test.js
    đỏ_khi: chips gõ cứng, hoặc ô chiếm chỗ khi chưa mở
    xanh_khi: gấp mặc định + chips dẫn xuất
  - AC2: gửi kèm chi_dan ⇒ body POST /api/job mang đúng chuỗi; không nhập ⇒
      trường VẮNG (không gửi chuỗi rỗng)
    cmd: node web/test/chung-cat-ui.test.js
  - AC3: quá trần ⇒ chặn phía FE kèm đếm ký tự, 0 request
    cmd: node web/test/chung-cat-ui.test.js
  - AC4: suite web xanh
    cmd: cd web && npm test
