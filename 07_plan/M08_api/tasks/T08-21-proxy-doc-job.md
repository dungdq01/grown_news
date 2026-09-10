# T08-21 — proxy ĐỌC việc: `GET /api/job` + `GET /api/viec/<ulid>`

> Chặn cứng của T03-93: màn /chung-cat/ qua G6B sạch trong khi nguồn dữ liệu
> KHÔNG tồn tại (check_g6b không đo lớp này). Cùng khuôn proxy dev đã dựng cho
> /api/model · /api/job (POST): web fetch 127.0.0.1:8790, FE không chạm :8790.
>
> ✅ **ĐÃ THI CÔNG 2026-09-03**, và bản thi công **lệch hai chỗ so với bản PM
> viết**. Cả hai lệch là sửa lỗi, không phải tuỳ ý — ghi ra để reviewer nhịp ⑤
> đối chiếu đúng chỗ:
>
> **1 · Mã nằm ở `tho-cua.mjs`, KHÔNG ở `loi-cua.mjs`.**
> `loi-cua.mjs` là bảy cửa của MÁY (`FR-047`), và `quaCong` của nó **đòi khoá
> dịch vụ**. Người gọi hai đường này là **trình duyệt**, không mang khoá nào —
> đặt chúng sau `quaCong` là đảm bảo 403 cho mọi lời gọi thật. `tho-cua.mjs`
> (T08-20) tồn tại đúng cho vai "LÕI gọi THỢ hộ trình duyệt", và nó đã có
> `goiTho()` + `chetTho()` + phép đọc cổng từ `dich-vu.json`.
>
> **2 · Tên trường trong AC1 sai.** `lan_thu` và `ly_do_dung` **không tồn tại**.
> Hàng đợi có `lan_gui` (số lần payload RỜI MÁY, trần 2, không reset — `M12-R6`)
> và `giai_doan`. Một AC đòi trường không có thì cổng hoặc đỏ oan, hoặc người
> thi công đẻ ra một trường để cổng hết đỏ — và trường đó sẽ không ai đọc.
>
> **3 · Thiếu một đơn vị ở thượng nguồn.** `GET /viec` (liệt kê) **cũng chưa
> tồn tại** ở THỢ — chỉ có `GET /viec/<id>`. Đã mở **`T12-10`** cho nó (đòi
> khoá · sắp theo ULID không theo mtime · `n` là trần · file JSON hỏng không
> làm sập danh sách). Không có T12-10 thì proxy này không có gì để proxy.
>
> ⚠️ Đơn vị này từng có **ID TRÙNG**: agent thi công viết `T08-21-cua-doc-viec.md`
> lúc 23:46 mà không thấy file này (22:20). File của PM có TRƯỚC nên ID thuộc
> về nó; bản kia đã gỡ, nội dung hoà vào đây. `check_g6b` bắt đúng — hai file
> cùng ID thì `phạm_vi_ghi` của một trong hai không ai kiểm.

phạm_vi_ghi:
  - web/api/tho-cua.mjs        # `cuaDsViec` + `cuaMotViec` — KHÔNG loi-cua.mjs, xem §1
  - web/api/router.mjs         # đấu dây 2 route GET

verifiability: hard
tiêu_chí:
  - AC1: GET /api/job trả danh sách việc từ :8790 nguyên hình dạng (`ulid` ·
      `giai_doan` · `lan_gui` · `payload.slug` · `payload.model`);
      GET /api/viec/<ulid> trả chi tiết; ulid không tồn tại ⇒ **404 của THỢ đi
      NGUYÊN** — dịch thành 200 rỗng làm màn chi tiết hiện một việc trống, và
      người tưởng việc của họ đã bị xoá
    cmd: node web/test/loi-tho-cua.test.js
    đỏ_khi: 404 bị dịch thành 200, hoặc thân trả về chứa khoá dịch vụ
    xanh_khi: mã đi nguyên, khoá không xuất hiện trong bất kỳ thân nào
  - AC2: :8790 chết ⇒ **502** + thân phân biệt "service tắt" với "việc không
      có" — FE dựng state error đúng nghĩa. Có timeout, không treo
    cmd: node web/test/loi-tho-cua.test.js
    đỏ_khi: trả 500 trần, hoặc request treo tới timeout của trình duyệt
    xanh_khi: 502 kèm câu đọc được
  - AC3: chỉ chuyển tiếp tham số ĐÃ KHAI (`giai_doan` · `n`) — một tham số
      không có hợp đồng KHÔNG được đi xuyên qua cửa
    cmd: node web/test/loi-tho-cua.test.js
    đỏ_khi: `?bay=1` tới được THỢ
    xanh_khi: THỢ chỉ nhận hai tham số đã khai
  - AC4: suite web xanh
    cmd: cd web && npm test

phụ_thuộc: T08-20
