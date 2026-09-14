# T03-164 — đơn vị TEST: `ci-phu-kin-cong.test.js` — CI không được bỏ sót cổng nào

> Cổng cho `AC3`/`AC4` của `T03-162`. ID rule 9: dải CHẴN dev chính, max 162 ⇒ **164**.
>
> **Việc nó canh**: khi `ci.yml` đổi từ 29 bước liệt tay sang một bước `npm test`, phải
> chứng minh **không cổng nào rơi**. Đây là chỗ một lần dọn dẹp dễ âm thầm bỏ mất răng:
> danh sách cũ dài, `scripts.test` ngắn hơn, và không ai đếm.
>
> Cổng này sống **sau** lần đổi ấy: về sau ai thêm một `.test.js` vào `web/test/` mà quên
> đăng ký thì nó đỏ. Đó là lý do nó không phải một lệnh `diff` chạy một lần.

phạm_vi_ghi:
  - web/test/ci-phu-kin-cong.test.js

phụ_thuộc: —

verifiability: hard
tiêu_chí:
  - AC1: đọc tập cổng CI **cũ** từ `git show <commit trước T03-162>:.github/workflows/ci.yml`
      (không đọc file đang sửa — nó là thứ đang bị đo) và tập cổng `npm test` chạy thật
      từ `web/package.json`; tập cũ phải là **tập con**. In số cổng cũ · số cổng mới ·
      tên các cổng được thêm
    cmd: cd web && node test/ci-phu-kin-cong.test.js
    đỏ_khi: một cổng trong danh sách cũ không được `npm test` chạy ⇒ nêu đúng tên
    xanh_khi: 0 cổng rơi, và số cổng cũ in ra > 0
  - AC2: **mọi** `web/test/*.test.js` đều được `npm test` gọi — quét thư mục, so với
      `scripts.test`; file nào không được gọi thì nêu tên
    cmd: cd web && node test/ci-phu-kin-cong.test.js
    đỏ_khi: có `.test.js` trong `web/test/` không nằm trong `scripts.test`
    xanh_khi: 0 file bị bỏ; hôm nay phải nêu ít nhất `heading-id-anchor.test.js`
  - AC3: **không đỏ oan** — fixture ở thư mục tạm: một `package.json` gọi đủ và một
      `ci.yml` giả với 3 bước ⇒ im lặng, exit 0. Bỏ một bước khỏi `package.json` ⇒ đỏ,
      nêu đúng tên bị bỏ
    cmd: cd web && node test/ci-phu-kin-cong.test.js --tu-kiem
  - AC4: cổng **chỉ đọc** — `git status --porcelain` y hệt trước và sau; và cổng **không**
      tự loại trừ chính nó khỏi phép đếm ở AC2
    cmd: cd web && node test/ci-phu-kin-cong.test.js --tu-kiem
    đỏ_khi: cây đổi một byte, hoặc cổng có một danh sách ngoại lệ gõ cứng
    xanh_khi: cây y hệt, 0 ngoại lệ gõ cứng

# AC4 vế "không tự loại trừ chính nó" không thừa: một cổng đếm cổng mà bỏ tên mình ra
# khỏi phép đếm là bên bị đo tự viết lại phạm vi đo. Nó phải nằm trong `scripts.test`
# như mọi cổng khác.
#
# AC1 đọc `ci.yml` qua `git show` chứ không đọc file trên đĩa: file trên đĩa là thứ
# `T03-162` đang sửa, và một cổng đọc bản đang sửa thì đo chính tay người sửa.
