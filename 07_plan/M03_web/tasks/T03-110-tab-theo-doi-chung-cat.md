# T03-110 — TAB multiwindow "Chưng cất": theo dõi trạng thái + kết quả

> Chỉ đạo chủ dự án 2026-09-04 (kèm ảnh test thật): *"khi click Gửi chưng cất
> thì không tự switch sang màn khác — cần làm thêm 1 Tab dạng multiwindow để
> theo dõi trạng thái chưng cất và kết quả"*. Đây là mặt [N] "Sinh" của ma
> trận UI (rail cửa sổ đọc có 2 tab Hỏi/Sinh — nay cụ thể hoá tab Sinh).
> ID theo rule.md mục 9: ls max 109 ⇒ 110.

## Hình dạng

- Cửa sổ đọc (multiwindow) thêm TAB "Chưng cất": danh sách việc M12 CỦA CHÍNH
  bản ghi đang mở (lọc theo slug từ GET /api/job), mỗi dòng: mốc giờ · model ·
  chip giai_doan (enum, KHÔNG %) · lý do dừng nếu có · **THỜI GIAN**: đã chạy
  bao lâu (elapsed từ mốc nhận, cập nhật theo poll) và mốc đổi giai đoạn gần
  nhất — chỉ đạo 2026-09-05: người dùng phải biết "chạy trong bao lâu", và
  việc đứng yên quá lâu ở một giai đoạn phải NHÌN THẤY ĐƯỢC (đổi màu chip
  sau ngưỡng phút, ngưỡng ở bảng khai không gõ cứng).
- **Sau khi bấm "Gửi đi chưng cất" thành công ⇒ TỰ CHUYỂN sang tab này** —
  đổi hành vi T03-92 AC3 (ở-lại-màn + toast) thành ở-lại-CỬA-SỔ + đổi tab:
  người vẫn không rời trang, nhưng thấy ngay việc vừa xếp hàng. Toast giữ.
- Việc xong (`giai_doan: xong`): dòng mang link tới NHÁP ở /chung-cat/nhap/
  (?nhap=<ulid>) — kết quả chưng cất là bản nháp, xem/duyệt ở màn nhập.
- Nhịp ĐÔI theo ma trận: polling 3–5s CHỈ khi tab đang mở và còn việc đang
  chạy; đóng tab/hết việc chạy ⇒ dừng poll (không poll nền vô hạn).
- Nhãn qua chu-giao-dien; token-only; khối JS vào plugin chungcat (chunk/bundle
  theo chỗ trống hiện tại — T03-104 đã dọn, đo trước khi chọn).

## YÊU CẦU DESIGN (chỉ đạo chủ dự án 2026-09-04): "animation và design thật
## đẹp, hoành tráng — preview sang chảnh nhất có thể"

Đây là màn TRÌNH DIỄN của sản phẩm — đầu tư thật, nhưng trong luật nhà:

- **Pipeline stepper động** thay list phẳng: chuỗi giai đoạn (cho → gửi →
  verify → nháp) vẽ thành các nút nối nhau; giai đoạn ĐANG chạy có nhịp thở
  (pulse/glow), giai đoạn xong chuyển ✓ với transition nảy nhẹ, giai đoạn
  dừng đổi màu lỗi + rung một nhịp. Vẫn là ENUM — animation minh hoạ enum,
  không bịa %.
- **Dòng việc mới trượt vào** từ đỉnh danh sách (slide+fade một nhịp); đổi
  giai đoạn ⇒ chip morph màu mượt, không nhảy khựng.
- **Việc XONG = khoảnh khắc**: hiệu ứng hoàn thành ngắn (shimmer quét qua
  dòng / vòng ✓ vẽ nét bằng stroke-dashoffset) + link nháp nổi bật lên.
- **Sang chảnh bằng chất liệu sẵn có**: gradient/độ sâu từ TOKEN hiện hành
  (không hex mới), backdrop tinh tế đồng bộ plugin backdrop, vi-chuyển-động
  60fps CHỈ bằng transform+opacity (không animate layout).
- **Luật cứng vẫn đứng**: mọi animation một nhịp, có chốt
  `prefers-reduced-motion` (tắt hết, trạng thái vẫn đọc được tĩnh);
  byte CSS/JS đo trước-sau ghi worklog, trần gn KHÔNG nới — thiếu chỗ thì mở
  đơn vị giảm-béo, không cắt luật reduced.
- Đối chiếu thẩm mỹ: mock `05_uiux/prototype/dot-hai/xuong.html` là SÀN,
  không phải trần — được phép đẹp hơn mock.

# FR-062 (duyệt 2026-09-04) — nhà của THÂN tab là plugin `cctab`, KHÔNG phải
# `chungcat.inline.ts`: thân tab không vừa `gn.js` (đo 103555/102400) và
# `FR-061` cấm nới bundle CHUNG, nên nó thành chunk nạp-theo-yêu-cầu.
#
# Chú thích để Ở ĐÂY, TRƯỚC khoá — không phải dòng đầu tiên SAU `phạm_vi_ghi:`.
# `check_g6b` đọc khối này bằng phép cắt theo dòng, và một dòng `#` chen ngay
# sau khoá làm nó kết luận *"thiếu phạm_vi_ghi"* — tức R1 mất địa chỉ trong khi
# phạm vi vẫn nằm nguyên đó.
phạm_vi_ghi:
  - web/plugins/cctab/src/cctab.inline.ts         # thân tab: lọc theo slug + poll + render dòng việc
  - web/plugins/multiwindow/src/scripts/multiwindow.inline.ts   # đăng ký tab + nạp chunk lúc bấm
  - web/render/assets.mjs                         # khai chunk + chèn dấu phiên bản vào gn.js
  - web/styles/prototype.css
  - web/package.json
# hai file cổng thuộc ĐƠN VỊ TEST đi kèm T03-110b (khuôn T08-26b) — R1
# `web/test/page-weight.test.js` cũng của T03-110b: mệnh đề "chunk sống"
# chỉ đếm được MỘT trong hai cách nạp, nên nó tố `cctab` là mã chết (đỏ oan).

verifiability: hard
tiêu_chí:
  - AC1: bản ghi có việc M12 ⇒ tab hiện đúng SỐ việc của slug đó, không lẫn
      việc của slug khác; chip giai_doan là enum, không %
    cmd: node web/test/tab-theo-doi-chung-cat.test.js
    đỏ_khi: lẫn việc slug khác, hoặc render %
    xanh_khi: lọc đúng slug + enum
  - AC2: gửi thành công ⇒ tab Chưng cất tự mở, dòng việc mới nằm ĐẦU danh sách;
      gửi thất bại (4xx) ⇒ KHÔNG đổi tab, lỗi hiện nguyên văn thân trả về
    cmd: node web/test/tab-theo-doi-chung-cat.test.js
  - AC3: việc `xong` mang link ?nhap=<ulid> tới màn nhập; việc `dung` hiện
      lý do phân loại (khuôn màn quản lý T03-93)
    cmd: node web/test/tab-theo-doi-chung-cat.test.js
  - AC4: poll chỉ chạy khi tab mở VÀ còn việc đang chạy — đóng tab ⇒ 0 request
      tiếp theo (đo đếm request mock)
    cmd: node web/test/tab-theo-doi-chung-cat.test.js
  - AC5: suite web xanh (chung-cat-ui cập nhật vế mới cùng lượt)
    cmd: cd web && npm test
  - AC6: mọi animation của tab nằm trong khối có chốt prefers-reduced-motion
      (reduce ⇒ 0 animation, trạng thái vẫn đọc được tĩnh); keyframe/transition
      CHỈ transform+opacity+color — không animate width/height/top/left
    cmd: node web/test/tab-theo-doi-chung-cat.test.js
    đỏ_khi: có luật animation ngoài khối reduced, hoặc animate thuộc tính layout
    xanh_khi: cả hai vế đo trên CSS thật
  - AC7 (soft — NGƯỜI chấm): preview trên trình duyệt thật đạt "sang chảnh" —
      screenshot đính worklog, chủ dự án phán lúc nghiệm thu
