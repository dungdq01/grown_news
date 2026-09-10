# T08-22 — cửa NHÁP: đọc + 4 hành động (nguồn của T03-94)

> Chặn cứng của T03-94. Bảng nháp FR-046 ở DB web/ (T08-19 đã dựng DDL + cửa
> ghi từ worker). Đơn vị này mở phần NGƯỜI DÙNG: đọc danh sách/chi tiết (kèm
> ban_goc_ai để diff) + duyệt · sửa · trả lại · xoá.

> ⚠️ **CÙNG LỖI mà T08-21 đã sửa — đọc trước khi thi công.**
> `phạm_vi_ghi` dưới khai `web/api/loi-cua.mjs`, nhưng người gọi bốn cửa này là
> **TRÌNH DUYỆT**, không mang khoá dịch vụ. `loi-cua.mjs` là bảy cửa của MÁY
> (`FR-047`) và `quaCong` của nó **đòi khoá** ⇒ mọi lời gọi thật sẽ 403.
> ⇒ Cửa cho trình duyệt đặt ở `tho-cua.mjs` (khuôn T08-20/T08-21) hoặc một file
> mới của cùng vai; `loidb.mjs` thì vẫn đúng chỗ cho hàm truy vấn.
>
> ⚠️ Cửa **Duyệt** phải giữ `AC-1.3`: `review_status` KHÔNG đến từ payload —
> DDL có `CHECK (review_status = 'draft')`, nên "duyệt" là **chuyển sang kho**,
> không phải đổi cột trong bảng nháp.

# ⛔ HAI CHỖ SỬA TRƯỚC KHI THI CÔNG — đo 2026-09-04
#
# 1 · CHỖ ĐẶT MÃ: cả `loi-cua.mjs` LẪN `tho-cua.mjs` đều SAI VAI.
#     · `loi-cua.mjs` = bảy cửa của MÁY (`FR-047`), `quaCong` **đòi khoá dịch
#       vụ**. Người gọi bốn cửa này là TRÌNH DUYỆT ⇒ 403 mọi lời gọi thật.
#     · `tho-cua.mjs` = proxy LÕI→THỢ (T08-20/21). Bốn cửa này **không proxy
#       gì**: bảng nháp nằm trong DB của chính LÕI (`loi.schema.sql`).
#     ⇒ File MỚI cùng vai: `web/api/nhap-cua.mjs` — cửa cho TRÌNH DUYỆT trên
#       bảng của chính LÕI. Task này đã tự khai lối đó ("hoặc một file mới của
#       cùng vai"); đây là chốt nó bằng một cái tên.
#
# 2 · **XOÁ HỞ HỢP ĐỒNG — cần PM/người quyết, KHÔNG thi công đoán.**
#     `T03-94` đòi bốn hành động: Duyệt · Sửa · Trả lại · **Xoá**.
#     `FR-046 §1` khai vòng đời `nhap → da_sua → da_duyet | tra_lai` — **không
#     có trạng thái nào nghĩa "đã bỏ"**, và `T08-27` vừa siết enum đúng theo FR.
#     Hai lối, mỗi lối một cái giá:
#       (a) thêm `da_bo` vào enum ⇒ sửa `FR-046` (một FR nữa), nhưng bản nháp và
#           `ban_goc_ai` CÒN — đọc lại được, đúng tinh thần "bản gốc bất biến vì
#           mất nó là mất câu 'người đã sửa những gì'".
#       (b) xoá HÀNG thật ⇒ không sửa FR, nhưng **phá `ban_goc_ai`** — thứ tốn
#           token model để tạo — và `rule.md` mục 4 cấm agent tự xoá.
#     ⇒ Lượt này thi công BA hành động (Duyệt · Sửa · Trả lại) + hai cửa ĐỌC.
#       Xoá DỪNG, ô nợ M08 ghi đầy đủ.

phạm_vi_ghi:
  - web/api/nhap-cua.mjs       # MỚI — 2 cửa ĐỌC + 3 cửa hành động cho trình duyệt
  - web/api/loidb.mjs          # hàm truy vấn/cập nhật trạng thái nháp
  - web/api/router.mjs         # đấu dây

# `articles.mjs` KHÔNG khai: cửa Duyệt dùng lại `ghiSauValidate()` của nó qua
# `import`, không sửa một dòng nào trong đó. Dựng lại đường ghi-sau-validate
# là dựng chỗ thứ hai cho một luật đã có chủ (`B-C1`: một cửa ghi).

verifiability: hard
tiêu_chí:
  - AC1: GET danh sách trả trang_thai + khang_dinh_bi_tia; GET chi tiết trả CẢ
      ban_goc_ai lẫn ban_hien_tai (diff phía FE không cần gọi thứ hai)
    cmd: node web/test/loi-cua.test.js
  - AC2: DUYỆT = validate --strict pass mới ghi FILE vào kho + dung_lai_db;
      trượt ⇒ 422 nguyên văn từng cổng đỏ, nháp GIỮ trạng thái
    cmd: node web/test/loi-cua.test.js
  - AC3: SỬA chỉ đụng ban_hien_tai — cố UPDATE ban_goc_ai ⇒ lỗi (trigger
      T08-19); TRẢ LẠI bắt kèm ly_do; không đường nào nhận review_status từ
      payload
    cmd: node web/test/loi-cua.test.js
  - AC4: suite web xanh
    cmd: cd web && npm test
