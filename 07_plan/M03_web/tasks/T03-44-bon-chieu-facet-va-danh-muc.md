# T03-44 — WO-016: bốn chiều facet + màn Danh mục ba component (đơn vị CODE)

> Facet **Chủ đề** (`cat`) không tồn tại trên bất cứ màn nào, dù `categories` đã
> có bảng, đã có API, và form bài viết đã có ô `f-cat`. Và `/tat-ca/` thiếu
> `nguon`. Đo bằng cách cắt HTML theo từng `v-*`:
>
> | màn | đang có | thiếu |
> |---|---|---|
> `/tat-ca/` | `pl` · `cpt` | **`nguon` · `cat`** |
> `/bai-viet/` `/tai-lieu/` `/video/` | `nguon` · `cpt` | **`cat`** |
> `/khai-niem/` | — | cả ba |
>
> **Đo cả trang thì không thấy gì**: mọi màn nằm chung một tài liệu, nên một
> phép grep trên cả HTML in ra cùng một danh sách cho năm màn. Phải cắt theo
> `v-*`.
>
> `/khai-niem/` phải liệt kê đủ **ba** loại nhãn — loại nguồn · chủ đề · khái
> niệm — mỗi mục kèm số bản ghi đang dùng. `VIEW nhan` đã mapping nhãn → bản ghi
> qua `json_each`, nên số đếm lấy từ đó, KHÔNG đếm tay trong JS.
>
> **Tầng facet khai một nơi.** `TANG` (FE) và `bangLoc` (SSR) phải đọc cùng một
> danh sách; gõ tay hai lần là tầng thứ hai lệch im lặng — đúng lỗi
> `loai-nguon.json` sinh ra để dẹp.

phạm_vi_ghi:
  - web/render/trang.mjs
  - web/render/shell.html
  - web/plugins/home-pages/shell.html
  - web/styles/prototype.css
  - web/plugins/multiwindow/src/scripts/multiwindow.inline.ts
  - web/plugins/multiwindow/src/scripts/multiwindow.inline.js

verifiability: hard
tiêu_chí:
  - AC1: `/tat-ca/` có ĐỦ bốn tầng `pl` · `nguon` · `cat` · `cpt`, đo trong
      phạm vi `v-all` — không phải trên cả trang
    cmd: cd web && node test/bon-chieu-facet.test.js
  - AC2: ba màn loại có `nguon` · `cat` · `cpt` và KHÔNG có `pl`
    cmd: cd web && node test/bon-chieu-facet.test.js
  - AC3: `/khai-niem/` liệt kê cả ba loại nhãn, mỗi mục có số bản ghi từ `nhan`
    cmd: cd web && node test/bon-chieu-facet.test.js
  - AC4: lọc theo `cat` thật sự cắt danh sách, và ô đếm của lưới nói đúng số
    cmd: cd web && node test/bon-chieu-facet.test.js
  - AC5: ngân sách không vượt — đo BYTE, không đo KB làm tròn
    cmd: cd web && node build-fe.mjs && node test/page-weight.test.js
  - AC6: cả bộ còn xanh
    cmd: cd web && npm test
phụ_thuộc: T03-45
