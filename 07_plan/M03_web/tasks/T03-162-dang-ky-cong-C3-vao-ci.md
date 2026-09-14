# T03-162 — cổng C3 và hai cổng vừa dời phải có răng ở **CI**, không chỉ ở máy dev

> Reviewer lần hai (2026-09-15) nêu, PM đo lại và xác nhận. ID rule 9: dải CHẴN dev chính,
> max 160 ⇒ **162**.
>
> **Ba sự thật đo được:**
>
> 1. `web/test/heading-id-anchor.test.js` — cổng của `T03-148`, canh đúng lớp lỗi
>    hỏng-im-lặng (id heading M03 ↔ anchor M13) — **không có trong `web/package.json`
>    lẫn `.github/workflows/ci.yml`**. `AC3` của `T03-148` là *"suite web xanh"*, mà
>    chính sản phẩm của nó nằm ngoài suite ⇒ AC ấy **xanh rỗng**.
> 2. `.github/workflows/ci.yml` **liệt kê từng file** (29 bước `node test/...`), **không**
>    chạy `npm test`. Nên `kho-delta.test.js` và `tim-toan-van.test.js` — hai cổng
>    `T03-150`/`T03-152` vừa đăng ký vào `package.json` — **cũng chưa có răng ở CI**.
>    Câu *"đã đăng ký cổng"* trong hai đơn vị ấy đúng với máy dev và **sai với CI**.
> 3. Đây là biến thể của *cổng xanh vì neo sai*: cổng có thật, chạy được, đang xanh — và
>    không ai chạy nó ở chỗ duy nhất có răng. Một cổng chỉ chạy khi có người nhớ thì nó
>    mục **im lặng**, vì màu xanh cuối cùng của nó vẫn nằm trong worklog.
>
> **Hai đường, chọn đường (b):** (a) thêm ba bước `node test/...` vào `ci.yml`;
> (b) đổi `ci.yml` thành **một bước `npm test`** để `package.json` là nguồn duy nhất.
> Chọn (b) vì (a) giữ nguyên lớp lỗi — mỗi cổng mới lại phải nhớ sửa hai chỗ, và lần này
> đã quên đúng ba lần. Nhưng (b) đổi hành vi CI của **cả 29 bước**, nên `AC3` bên dưới
> canh rằng không bước nào **biến mất** khỏi phạm vi chạy.

phạm_vi_ghi:
  - web/package.json

phụ_thuộc: T03-148, T03-150, T03-152

verifiability: hard
tiêu_chí:
  - AC1: `web/package.json` `scripts.test` gọi **cả ba** cổng — `heading-id-anchor` ·
      `kho-delta` · `tim-toan-van`; grep mỗi tên ⇒ 1
    cmd: cd web && npm test
    đỏ_khi: thiếu một trong ba tên
    xanh_khi: đủ ba, và `npm test` chạy hết không bỏ giữa chừng
  - AC2: **mọi** `web/test/*.test.js` đều được `scripts.test` gọi, không sót file nào
    cmd: cd web && node test/ci-phu-kin-cong.test.js
    đỏ_khi: có `.test.js` trong `web/test/` không nằm trong `scripts.test` ⇒ nêu tên
    xanh_khi: 0 file bị bỏ
  - AC3: **không cổng nào rơi** so với danh sách CI cũ — tập 29 file trong
      `git show HEAD:.github/workflows/ci.yml` phải là **tập con** của tập `npm test` chạy
    cmd: cd web && node test/ci-phu-kin-cong.test.js
    đỏ_khi: một file có trong 29 bước cũ mà `npm test` không chạy ⇒ nêu tên
    xanh_khi: 0 file rơi; in số cổng cũ và số cổng mới
  - AC4: `npm test` **đỏ được** — đổi một kỳ vọng của `heading-id-anchor.test.js` ở
      **bản sao thư mục tạm**, chạy, phải thấy đỏ. Không sửa file thật
    cmd: cd web && node test/ci-phu-kin-cong.test.js --tu-kiem

# ⚠️ PM CHẺ ĐÔI 2026-09-15: bản đầu khai thêm `.github/workflows/ci.yml` vào `phạm_vi_ghi`.
# `check_g6b` bắt ngay: *"ghi .github/workflows/ci.yml ngoài boundary M03_web"* — đất
# `.github/**` thuộc **M04**. Vế sửa `ci.yml` đã tách sang `T04-14`. Đơn vị này chỉ lo
# `package.json`, và làm được một mình: `package.json` đủ ba cổng là một cải thiện thật
# ngay cả trước khi `ci.yml` đổi.
#
# AC2/AC3/AC4 cần cổng `ci-phu-kin-cong.test.js`, chạm `web/test/**` ⇒ đơn vị TEST riêng:
# `T03-164`. KHÔNG tự viết nó ở đây.
#
# ⚠️ `npm test` hôm nay **đỏ** vì `page-weight.test.js` (trần `gn.css`, và vế "trang chủ
# 65667/61440" đỏ sẵn trên `main`). Đơn vị này KHÔNG sửa hai vế đó — chúng là việc khác,
# đang chờ chủ dự án quyết. AC1/AC2 đo *cổng có được gọi không*, không đo *cổng có xanh
# không*. Đừng gộp hai câu hỏi ấy: gộp là cách một đơn vị bị chặn bởi nợ của đơn vị khác.
