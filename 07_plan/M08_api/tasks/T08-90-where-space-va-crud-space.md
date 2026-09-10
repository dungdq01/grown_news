# [Space] T08-90 — `WHERE space` mọi query · `?space=` · CRUD space (chỉ `chu`)

> Nền: `ADR-09` (lối A — space là cột lọc) · `FR-080` (cột + view). Đây là
> nơi Space THÀNH THẬT với người dùng: một query quên lọc = rò chéo, và cổng
> R4 (`T04-91`) là thứ duy nhất bắt được.
> CHẶN CỨNG: sau `T01-90` (cột tồn tại) VÀ sau **`T08-35` merge** (checklist
> §2.2 — cùng đụng `dungchung.mjs` 700+ dòng, không rebase chồng nhau).
> phụ_thuộc: T01-90, T08-35
> ID rule 13 (dải PM-Space): T08-90.
> **RULE 16**: đơn vị này KHÔNG khai DDL (cột `space` do T01-90 tạo, CRUD space
> chỉ INSERT/UPDATE **hàng**, không ALTER **bảng**). Nếu lúc thi công phát hiện
> cần bảng `space` riêng ⇒ DỪNG, mở đơn vị DDL mới theo ba nhịp tmp/chấp
> nhận/thật, KHÔNG nới `phạm_vi_ghi` tại chỗ. Mọi test chạy trên `KB_DIR` tạm
> + cổng 8895-8899.

## Hình dạng

- **MỘT chỗ lọc, không rải**: thêm tham số `space` vào hàm dựng query dùng
  chung của `dungchung.mjs` (khuôn `khoDoc`), mặc định = space đang mở của
  phiên; mọi cửa đọc đi qua đó. Cấm mỗi endpoint tự nối `WHERE` — đó là cách
  quên một chỗ mà không ai thấy.
- `GET /api/index?space=` · các cửa bản ghi nhận `space`; **vắng tham số =
  space mặc định**, và response NÓI RÕ đang ở space nào (khuôn `tap_nguon`
  của M13 — người đọc phải biết mình đang nhìn vũ trụ nào).
- **CRUD space** (`/api/space`): tạo · sửa · đổi thứ tự tab · ẩn; **chỉ vai
  `chu`** (FR-045 giữ nguyên — ADR-09 §7, KHÔNG mở `space_member` đợt này).
  Tạo space: validate slug (kebab, không đụng **danh sách slug cấm** của
  `man-hinh.json`: `nap`, `item`, `api`… — checklist bẫy routing), sinh
  `tab_order` cuối, `is_default` chỉ một.
- Xoá space: **hỏi rõ** xoá nội dung hay chuyển về mặc định (ý tưởng gốc §8.5);
  đợt này cài **chuyển về mặc định**, xoá-nội-dung để đợt sau (không có
  đường xoá hàng loạt nào trong hệ hôm nay).

phạm_vi_ghi:
  - web/api/dungchung.mjs      # tham số space ở MỘT chỗ dựng query
  - web/api/articles.mjs       # cửa đọc/ghi nhận space
  - web/api/space-cua.mjs      # MỚI — CRUD space, một file một vai (khuôn nhap-cua)
  - web/api/router.mjs         # đấu dây

verifiability: hard
tiêu_chí:
  - AC1: gieo 2 space ⇒ `GET /api/index?space=A` trả 0 bản ghi B; vắng tham số
      ⇒ space mặc định VÀ response nói rõ space đang xem
    cmd: node web/test/space-cua.test.js
    đỏ_khi: lọt ≥1 bản ghi space khác, hoặc response không nêu space
    xanh_khi: 0 chéo + có trường space trong thân
  - AC2: MỘT chỗ lọc — grep `WHERE` trong web/api không có chỗ nào tự nối điều
      kiện space ngoài hàm dùng chung (đo AST/regex, khuôn `api-guard`)
    cmd: node web/test/space-cua.test.js
  - AC3: tạo space: slug trùng space cũ ⇒ 409; slug trong danh sách cấm
      (`nap`·`item`·`api`) ⇒ 422 nêu tên; chỉ `chu` tạo được, vai khác ⇒ 403
    cmd: node web/test/space-cua.test.js
  - AC4: xoá space có nội dung ⇒ nội dung CHUYỂN về mặc định, 0 bản ghi mất
      (đếm trước/sau)
    cmd: node web/test/space-cua.test.js
  - AC5: cổng R4 vẫn xanh sau khi cài (không tự nới)
    cmd: python core/tests/check_khong_ro_cheo_space.py
  - AC6: suite web xanh
    cmd: cd web && npm test
# cổng `web/test/space-cua.test.js` thuộc ĐƠN VỊ TEST **T03-193** (R1) —
# dời vào web/test/ + đăng ký npm test CÙNG LƯỢT với mã này.
