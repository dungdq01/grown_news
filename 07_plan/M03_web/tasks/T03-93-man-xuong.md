# T03-93 — màn `/chung-cat/` (mặt [Q] của M12 — theo T03-97/rule 5: mỗi module một URL)

> **Ràng buộc chung đợt UI M12** (từ ma trận + bài học T03-90):
> nút/màn vào `man-hinh.json` CÙNG LƯỢT với lần dựng — không trước; token-only,
> KHÔNG hex; gn.css chỉ còn **39 byte** dư (ĐO 2026-09-03: 102361/102400 —
> `node web/test/page-weight.test.js`; con số ~150B trong bản PM đã cũ, T08-20
> phải viết sát lần BA để lấy lại 261 byte). 39 byte nghĩa là **luật CSS kế
> tiếp nào cũng vượt trần** — ba màn của đợt này KHÔNG thể thêm CSS mà không
> mở đơn vị giảm-béo TRƯỚC. Chỗ béo đã đo: 8 luật `.tb[data-nav]::before` lặp
> ~960 byte boilerplate SVG (ô nợ M03); chữ hiện ra qua cổng chu-giao-dien
> (không mã nội bộ, không đường kho, thử cụm từ trước khi chốt nhãn); hai shell
> byte-identical; animation một nhịp có chốt reduced; mock đối chiếu:
> `05_uiux/prototype/dot-hai/` — prototype thắng khi lệch.

**Là gì**: port `dot-hai/xuong.html` NHƯNG chỉ phần M12 (M16 sau này ở `/artifact/` riêng — rule 5). Mục "Cần xử lý" (job dừng, badge đếm =
badge trên rail) · bảng mọi việc (lọc trạng thái) · chi tiết mở cửa sổ nổi:
chip giai đoạn enum (KHÔNG %), timeline log theo mã việc, model-đã-dùng (dự
phòng nói rõ), nút **Chạy lại từ «giai-đoạn-hỏng»** (checkpoint — mặc định) +
Chạy lại từ đầu + Xoá. Deep-link `?job=` tô hàng + mở chi tiết. Nguồn dữ liệu:
`GET /api/job` · `GET /api/viec/<id>` của web (proxy :8790); polling 3–5s khi đang chạy. Button menu: **Chưng cất**.

phạm_vi_ghi:
  - core/assets/man-hinh.json              # +màn /chung-cat/ CÙNG LƯỢT — đất FR-056 ĐÃ DUYỆT (nhãn ≤9, data_nav [a-z], icon kèm)
  - web/render/shell.html
  - web/plugins/home-pages/shell.html
  - web/render/trang.mjs                   # builder SSR khung + view
  - web/plugins/multiwindow/src/scripts/multiwindow.inline.ts   # polling + chi tiết + hành động
  - web/styles/prototype.css

# ⛔ CHẶN — HAI CỬA NÀY CHƯA TỒN TẠI (đo 2026-09-03)
#
# Task khai nguồn dữ liệu là `GET /api/job` + `GET /api/viec/<id>` "của web
# (proxy :8790)". Đo thật trên `web/api/router.mjs`:
#
#     grep -n '"job"\|"viec"' web/api/router.mjs
#     → 65:  phan[1] === "job" && req.method === "POST"      ← CHỈ POST
#     → (không có "viec")
#
# T08-20 mở ĐÚNG HAI cửa: `GET /api/model` + `POST /api/job`. Hai cửa ĐỌC mà
# màn này sống bằng thì **không đơn vị nào khai sinh ra** — `check_g6b` không
# bắt được vì nó đo `phạm_vi_ghi`, không đo "cửa mà AC dựa vào có thật không".
#
# ⇒ Cần một đơn vị M08 trước T03-93 (tạm gọi `T08-21`): `GET /api/job` (danh
#   sách + lọc trạng thái) · `GET /api/viec/<id>` (chi tiết + timeline). Cả hai
#   proxy sang THỢ theo đúng khuôn `tho-cua.mjs` đã có.
#   KHÔNG dựng màn trước cửa: `S18` cấm render thứ gọi đường chưa có, và AC1–AC4
#   của task này sẽ đỏ vì 404 chứ không vì luật.

# Chặn thật sự là hai cửa ĐỌC ở khối ⛔ trên — KHÔNG khai T08-21 làm phụ thuộc
# vì đơn vị đó chưa tồn tại, khai vào là một phụ-thuộc-treo ĐỎ ở check_g6b
# trong khi sự thật đã ghi cho người đọc. Khi PM mở T08-21 thì thêm một dòng.
phụ_thuộc: T03-97

# CHẶN CỨNG: chạy SAU T08-21 (nguồn dữ liệu) + T03-99 (gn.css hết chỗ).
verifiability: hard
tiêu_chí:
  - AC1: /chung-cat/ + /mock/chung-cat/ trả 200 + mốc .mid — ssr-routes tự phủ (dẫn xuất bảng)
    cmd: node web/test/ssr-routes.test.js
  - AC2: job `dung` KHÔNG BAO GIỜ render như đang-chạy; kèm lý do phân loại +
      hành động tương ứng (đo markup hai trạng thái khác nhau)
    cmd: node web/test/chung-cat-quan-ly.test.js
  - AC3: nút Chạy-lại mặc định mang TÊN giai đoạn hỏng (đọc từ trạng thái job),
      từ-đầu là nút phụ
    cmd: node web/test/chung-cat-quan-ly.test.js
  - AC4: ?job=<id> tô đúng hàng + mở chi tiết; đóng tab mở lại job vẫn thấy
      (dữ liệu từ service, không từ bộ nhớ tab)
    cmd: node web/test/chung-cat-quan-ly.test.js
  - AC5: rail có tab mới đúng format + icon (rail-trai xanh) · suite web xanh
    cmd: cd web && npm run build && npm test
