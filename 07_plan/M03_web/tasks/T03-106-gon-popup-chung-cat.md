# T03-106 — GỌN popup xác nhận Chưng cất + bộ chọn model NHÓM THEO PROVIDER

> Chỉ đạo chủ dự án 2026-09-04 (kèm ảnh màn thật): popup hiện tại đổ NGUYÊN VĂN
> `$canh_bao_mot_gateway` (đoạn "M12-R5 ĐANG MẤT RĂNG… NĐ 356/2025…") vào mặt
> người dùng — đó là chú thích KỸ THUẬT của bảng khai, không phải chữ giao diện.
> Yêu cầu: (1) dẹp, chuyên nghiệp, KHÔNG giải thích dài dòng; (2) danh sách
> model liệt kê theo provider (GPT · Claude · Gemini · …).
> ID theo rule.md mục 9: `ls 07_plan/M03_web/tasks/` → max 105 ⇒ 106.

## Hình dạng chốt

- MỘT câu cảnh báo, giữ đúng hai ý FR-053 §1.4 bắt buộc (dữ-liệu-rời-máy + nơi
  tới): `"Toàn văn bản ghi sẽ được gửi tới <model> (khu vực: <khu_vuc>)."`
  — hết. KHÔNG đổ `$canh_bao_mot_gateway` ra UI (nó vẫn về trong JSON, FE bỏ qua;
  chỗ đúng của nó là tooltip/console cho dev nếu muốn giữ, không phải body popup).
- `<select>` dùng `<optgroup label="<nha_cung_cap>">` — nhóm dẫn xuất từ trường
  `nha_cung_cap` của `GET /api/model` (đã đi ra, tho-cua.mjs CHO_RA), KHÔNG
  gõ cứng danh sách provider trong FE — bảng khai thêm nhà nào thì nhóm tự mọc.
- `khu_vuc` vẫn HIỆN NGUYÊN VĂN cạnh model (kể cả `khong-xac-dinh`) — fact hợp
  đồng cũ giữ nguyên, chỉ bỏ đoạn văn giải thích.
- Hai nút giữ: Gửi đi chưng cất · Đóng. Bấm lần một không gửi gì (AC2 T03-92
  vẫn đứng).
- Nhãn qua cổng chu-giao-dien; token-only, khối CSS sát (gn.js đang kẹt —
  T03-104 chưa chạy thì phần JS thêm phải ≤ số byte tiết kiệm được từ việc XOÁ
  đoạn văn dài, đo trước/sau ghi worklog).

phạm_vi_ghi:
  - web/plugins/multiwindow/src/scripts/multiwindow.inline.ts   # popup + optgroup
  - web/plugins/chungcat/src/chungcat.inline.ts                 # nếu popup đã dời sang plugin này
  - web/styles/prototype.css                                    # chỉnh khối popup nếu cần
# Cổng `web/test/chung-cat-ui.test.js` thuộc ĐƠN VỊ TEST `T03-110b` (mở rộng CÙNG LƯỢT).
# `R1`: người viết mã không cầm bút viết thước chấm chính mình.
  - web/package.json                                            # chỉ nếu sinh cổng mới

verifiability: hard
tiêu_chí:
  - AC1: markup popup KHÔNG chứa chuỗi "M12-R5" / "NĐ 356" / "$canh_bao" —
      chú thích kỹ thuật hết đường ra UI
    cmd: node web/test/chung-cat-ui.test.js
    đỏ_khi: bất kỳ chuỗi nào ở trên xuất hiện trong markup popup
    xanh_khi: cổng xanh và có vế grep-âm cho ba chuỗi đó
  - AC2: select có ≥2 optgroup dẫn xuất từ nha_cung_cap (fixture 2 nhà), option
      mang cả khu_vuc nguyên văn; provider mới trong dữ liệu ⇒ nhóm mới KHÔNG
      sửa FE
    cmd: node web/test/chung-cat-ui.test.js
    đỏ_khi: optgroup gõ cứng tên nhà, hoặc khu_vuc biến mất
    xanh_khi: nhóm dẫn xuất từ dữ liệu + khu_vuc còn nguyên văn
  - AC3: bấm lần một 0 request; Gửi mới POST /api/job — hành vi T03-92 không vỡ
    cmd: node web/test/chung-cat-ui.test.js
  - AC4: suite web xanh
    cmd: cd web && npm test
