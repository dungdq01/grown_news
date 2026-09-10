# T03-92 — nút Chưng cất NGỮ CẢNH (mặt [N] của M12)

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

**Là gì** *(chỉ đạo 2026-09-03: "nhúng vào TẤT CẢ multiwindow — xem tài liệu
hay video đều có nút tiện ích đó")*: cụm nút nhúng vào **component thanh tiêu
đề cửa sổ đọc DUY NHẤT** — mọi cửa sổ (bài viết · tài liệu · video) đều mang
nó; cộng nút trên thẻ thu-vien ở màn Tài liệu. HÀNH VI khai theo LOẠI từ bảng
(một component, bộ hành động theo loại — ui_kit §4, luật ba-module):

| cửa sổ đang mở | nút | bấm thì |
|---|---|---|
| tài liệu thu-vien (có byte) | **Chưng cất** | popover hỏi-trước (model từ `GET /model`, NGƯỜI chọn · ước phí · "toàn văn rời máy, có vết") → bấm lần hai → `POST /job` → nút đổi "đã xếp hàng" + toast link `/xuong/?job=<ulid>` |
| video CHƯA transcript | **Sinh transcript** — *disabled kèm lý do* cho tới khi backend C4b bật (FR-054 ②); không render nút gọi endpoint chưa có (S18) | tooltip: "cần sinh transcript trước khi chưng — đợt kế" |
| video CÓ transcript (sau C4b) | **Chưng cất** (neo = mốc thời gian) | như hàng 1 — bật CÙNG LƯỢT C4c, đổi một dòng bảng khai |
| bản phan-tich / nháp | không nút chưng cất (đã là sản phẩm) | — |

Quyết PM: sự HIỆN DIỆN của cụm nút theo chỉ đạo (mọi cửa sổ); hành vi giữ luật
"nút chỉ mời vào đường hợp lệ" — video đợt này là nút-nói-thật (disabled + vì
sao), không phải nút chết 500.

**Ba fact hợp đồng ĐÃ ĐO (2026-09-03) — FE bám đúng, không giả định:**

1. `GET /model` là nguồn bộ chọn: `nha_cung_cap · model · khu_vuc · can_key ·
   kieu_structured · che_do` (+`$canh_bao_mot_gateway`). FR-053 §1.4: hiện
   **khu_vuc cạnh từng model** — giá trị thật hôm nay là `khong-xac-dinh` và
   FE phải HIỆN ĐÚNG CHỮ ĐÓ, không để trống, không ẩn.
2. *(đổi 2026-09-03 — dev thêm proxy)*: FE gọi **`GET /api/model` + `POST
   /api/job` CỦA WEB**, không gọi thẳng :8790. Hai header `X-Khoa-Loi` (env
   server) + `X-Nguoi-Dung` (từ phiên) do **WEB gắn** — FE không cầm khoá,
   không gửi `nguoi_dung_id` trong body. `/api/model` đã lọc bỏ `dich`.
3. Mã trả về cho ca IDEMPOTENT (ULID trùng) **chưa chốt bằng FR** — FE xử theo
   lớp `2xx = đã nhận`, KHÔNG rẽ nhánh theo 201 cứng; sửa lại khi FR chốt.

phạm_vi_ghi:
  - web/render/shell.html
  - web/plugins/home-pages/shell.html      # copy byte
  - web/render/trang.mjs                   # nút hiện THEO LOẠI bản ghi (chỉ thu-vien)
  - web/plugins/multiwindow/src/scripts/multiwindow.inline.ts   # popover + POST + toast
  - web/styles/prototype.css               # khối sát ngân sách

verifiability: hard
tiêu_chí:
  - AC1: cụm nút nằm trong component thanh-tiêu-đề DÙNG CHUNG — cửa sổ tài
      liệu VÀ video đều mang nó (đo markup cả hai loại); hành vi đọc từ bảng
      khai theo loại, không if rải; bản phan-tich/nháp không có nút chưng cất
    cmd: node web/test/chung-cat-ui.test.js
  - AC1b: cửa sổ video (chưa transcript): nút hiện ở trạng thái disabled + lý
      do đọc được — KHÔNG có request nào khi bấm
    cmd: node web/test/chung-cat-ui.test.js
  - AC2: popover hỏi-trước hiện model + câu dữ-liệu-rời-máy; bấm lần MỘT không
      gửi gì (0 request)
    cmd: node web/test/chung-cat-ui.test.js
  - AC3: sau POST: nút đổi trạng thái tại chỗ + toast mang link ?job= — người
      Ở LẠI màn (không chuyển hướng)
    cmd: node web/test/chung-cat-ui.test.js
  - AC4: bộ chọn model hiện khu_vuc CẠNH từng model — kể cả `khong-xac-dinh`
      hiện nguyên văn (đo markup); FE CHỈ gọi /api/model + /api/job của web
      (grep bundle: 0 tham chiếu :8790); body không chứa nguoi_dung_id
    cmd: node web/test/chung-cat-ui.test.js
  - AC5: không phá gì — suite web xanh (kể cả page-weight, chu-giao-dien)
    cmd: cd web && npm run build && npm test
