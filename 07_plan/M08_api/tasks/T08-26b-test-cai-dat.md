# T08-26b — đơn vị TEST: sở hữu `web/test/cai-dat.test.js` (bảng `cai_dat`, M18 §10)

> **Đơn vị này ĐÃ ĐƯỢC KHAI TÊN mà chưa từng được viết.**
> `T08-26-bang-cai-dat.md` dòng 23: *"**Không** chạm: `web/test/**` (đơn vị TEST
> `T08-17b` — `R1`)"* — T08-26 đẩy `web/test/**` sang một đơn vị có tên nhưng
> không có file. Cổng đã tồn tại (`web/test/cai-dat.test.js`, 02:57 2026-09-03,
> tự khai *"ĐƠN VỊ TEST, viết TRƯỚC code (R5)"*) và **không ai nhận nó**.
>
> Lộ ra khi `T03-100` đổi câu hỏi của `nut-song.test.js §5` từ *"có trong
> `npm test` không?"* sang *"có CHỦ không?"*. Câu cũ chỉ báo được *"KHÔNG được
> gọi: cai-dat.test.js"* — đúng hiện tượng, sai bệnh: bệnh không phải thiếu một
> dòng trong `package.json`, mà là **thiếu một đơn vị việc**.

**Là gì**: nhận sở hữu cổng đã viết, để `R1` đếm được nó. Cổng đo tầng thứ ba
của `ADR-07`: giá trị ô ở DB, `chu` đổi được qua web — hai tầng trên (bất biến
DDL · schema ô `QUYEN` trong mã) đã có. `M18-R5` và `M18-R6` **trỏ vào file
này**; trước khi nó có chủ, hai rule đó khai `S3` mà thực là `soft` (`R3`).

**KHÔNG viết lại cổng.** Nó đã tồn tại và đang ĐỎ đúng lý do (mã `cai_dat`
chưa dựng — đó là `T08-26`). Đơn vị này chỉ:
1. nhận sở hữu (dòng `phạm_vi_ghi` dưới) ⇒ `nut-song §5` xếp nó vào **CHỜ MÃ**
   thay vì **MỒ CÔI**, và in ra mỗi lần suite chạy;
2. rà lại nó theo đúng vai bên-đo (không đo ý định, đo hành vi);
3. **đăng ký vào `npm test` CÙNG LƯỢT với `T08-26`** — không trước. Đăng ký
   trước là làm suite đỏ để chờ một đơn vị khác, đúng cái vòng mà `T03-100`
   vừa tháo.

> 📍 **CỔNG ĐANG ĐỖ Ở ĐÂY**: `07_plan/M08_api/tasks/T08-26b-cai-dat.test.js`
> (dời khỏi `web/test/` 2026-09-04 theo `rule.md` mục 8). Nó ĐỎ đúng lý do —
> mã `cai_dat` chưa dựng, và đó là `T08-26`.
>
> ⇒ Khi T08-26 vào việc: dời file vào `web/test/cai-dat.test.js` **+ đăng ký
> vào `npm test`** CÙNG LƯỢT với mã. Ba việc một lần, hoặc `nut-song §5` đỏ.
> "Đỏ trước" chứng minh bằng **bằng chứng worklog** (output đỏ tại mốc
> trước-code + xanh sau, cùng entry), không bằng trạng thái suite chung.

phạm_vi_ghi:
  - 07_plan/M08_api/tasks/T08-26b-cai-dat.test.js

# HAI ĐƯỜNG ĐÃ GỠ 2026-09-04, và `check_g6b` báo ĐÚNG cả hai lần:
#   `web/test/cai-dat.test.js` · `web/package.json` — cả hai là đất **M03**
#   (`web/**`), NGOÀI boundary M08 (`web/api/**` · `_recycle/**` ·
#   `06_modules/M08_api/**`). Cùng lớp lỗi mà `T08-20` bị bắt lần đầu.
#
# ⇒ Cổng nay đỗ ở THƯ MỤC TASK (`rule.md` mục 8), nên đơn vị này khai đúng chỗ
#   nó thật sự ghi. Khi `T08-26` xong:
#     · dời file vào `web/test/cai-dat.test.js` — việc đó thuộc `T03-91`
#       (đơn vị TEST của M03, đã nhận `web/test/loi-*.test.js` + `package.json`)
#     · hoặc mở FR nới boundary M08 nếu PM muốn M08 tự sở hữu cổng của mình.
#   Chọn đường một: không FR cho một dòng.
# Chọn (a) — không FR cho một dòng. Ô nợ M08 ghi để PM chốt.

verifiability: hard
tiêu_chí:
  - AC1: cổng có chủ — `nut-song §5` xếp `cai-dat.test.js` vào CHỜ MÃ, không
      MỒ CÔI, và IN RA tên task nhận nó
    cmd: node web/test/nut-song.test.js
    đỏ_khi: §5 báo "KHÔNG ai nhận" cho file này
    xanh_khi: §5 xanh và in `cai-dat.test.js  ←  T08-26b-test-cai-dat.md`
  - AC2: cổng chạy được và ĐỎ vì THIẾU MÃ, không vì lỗi cú pháp — phân biệt
      hai ca đó là điều kiện để R5 có nghĩa
    cmd: node web/test/cai-dat.test.js
    đỏ_khi: exit vì SyntaxError/ImportError (lỗi của cổng)
    xanh_khi: chạy tới các phép đo rồi báo thiếu bảng/hàm (lỗi của MÃ CHƯA CÓ)
  - AC3: khi `T08-26` xong — cổng xanh VÀ đã vào `npm test`
    cmd: cd web && npm test
    đỏ_khi: cổng xanh mà vẫn ngoài chuỗi `npm test` (ngoại lệ thành vĩnh viễn)
    xanh_khi: suite xanh, `grep -c "test/cai-dat.test.js" web/package.json` = 1

phụ_thuộc: T03-100
