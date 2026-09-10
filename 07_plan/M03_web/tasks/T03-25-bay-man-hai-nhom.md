# T03-25 — FR-038/C5: bảy màn, thanh menu hai nhóm, bốn bảng dẫn xuất (đơn vị CODE)

> Người dùng chốt: *"thanh menu cần phân biệt rõ: 1 tổng hợp, 2 bài viết,
> 3 tài liệu, 4 video (cùng với đó màn dashboard, kho, tổng hợp bài hay danh mục
> cũng cần giữ lại)"* và *"Chỉ có màn kho và tổng hợp là để chung danh sách"*.
>
> **Ba màn mới đi CÙNG LÚC với việc dẫn xuất bốn bảng, không tách hai lượt.**
> `man-hinh.json` mô tả màn CÓ THẬT (T01-21), nên dẫn xuất trước khi dựng màn là
> `/bai-viet/` → 500. Dựng màn trước rồi mới dẫn xuất là sửa bốn bảng **hai lần**.
> Một lượt là ít rủi ro hơn cả hai.
>
> **Bốn bảng gõ tay hiện phải khớp nhau bằng tay** — đây là chỗ ĐÃ trôi, không
> phải chỗ có thể trôi (bốn tên khác nhau cho cùng một màn: slug `khai-niem` ≠
> id shell `concepts` ≠ tiêu đề "Danh mục"):
>
> | bảng | ở đâu | khoá |
> |---|---|---|
> `VIEW_SSR` | `server.mjs:149` | path URL → tên view |
> `MAN` | `render/trang.mjs:901` | tên view → [id shell, tiêu đề, tiền tố] |
> `DUONG` | `multiwindow.inline.ts:1389` | id shell → path URL |
> `VIEWS` | `test/_render.mjs:71` | (đơn vị TEST — T03-12) |
>
> **Ràng buộc ĐÃ ĐO, không được đoán lại:**
>
> `data_nav` thuần `[a-z]` — `rail-trai.test.js:137/:167` bắt `data-nav="[a-z]+"`;
> tên có gạch nối làm nhãn lặng lẽ ra khỏi phép đo và `soTab >= 4` tụt rồi ĐỎ.
>
> `iconMask >= soTab` (`rail-trai.test.js:174`) — **mỗi tab phải có icon riêng**
> `.tb[data-nav="x"]::before{mask-image:url("data:image/svg…`. Ba tab mới ⇒ ba
> icon mới trong `prototype.css`. Đây là chi phí CSS bắt buộc, không phải trang trí.
>
> Vị trí chèn view **bị kẹp hai đầu, còn đúng một khe**:
> `trang-chu-layout.test.js:200` cắt `slice(indexOf('v-home'), indexOf('v-all'))`
> ⇒ không được chèn giữa home và all. `catNap()` (`trang.mjs:247`) cắt từ
> `id="v-nap"` tới `</main>` ⇒ không được đặt sau nap. ⇒ **SAU `v-all`, TRƯỚC
> `v-nap`**.
>
> Tên view `tat-ca` **GIỮ NGUYÊN** làm màn Tổng hợp — `four-screens.test.js:107`
> đòi mọi `title` của contract có mặt trên view đó; đổi là đỏ N lần cộng năm file
> khác ghim chuỗi.
>
> Hai `shell.html` phải **byte-identical** (44611 = 44611 hiện nay).
>
> **Ngân sách đo lúc bắt đầu**: `gn.css` 91/100 · `gn.js` 93/100 · trang lớn nhất
> 49/74. Không nới trần — repo có tiền lệ *"SIẾT, không nới"*.

phạm_vi_ghi:
  - web/server.mjs
  - web/render/trang.mjs
  - web/render/shell.html
  - web/plugins/home-pages/shell.html
  - web/plugins/multiwindow/src/scripts/multiwindow.inline.ts
  - web/build-fe.mjs
  - web/styles/prototype.css

verifiability: hard
tiêu_chí:
  - AC1: bảy màn có thật — mỗi màn trong `man-hinh.json` trả 200 và render đúng
      tiêu đề khai; ba màn loại chỉ chứa bản của loại mình
    cmd: cd web && node test/bay-man.test.js
  - AC2: thanh menu hai nhóm — 7 tab, nhóm NỘI DUNG 4 mục, HỆ THỐNG 3 mục, và
      MỖI tab có icon (`iconMask >= soTab`)
    cmd: cd web && node test/rail-trai.test.js && node test/bay-man.test.js
  - AC3: ba bảng view DẪN XUẤT từ `man-hinh.json` — không tầng nào gõ tay cả tám
      màn; ca âm: nhắc tên file trong bình luận KHÔNG được tính là đọc
    cmd: python core/tests/check_khai_mot_noi.py
  - AC4: ngân sách còn nguyên — `gn.css`/`gn.js` ≤ 100 KB, trang lớn nhất ≤ 74 KB
    cmd: cd web && node build-fe.mjs && node test/page-weight.test.js
  - AC5: hai `shell.html` byte-identical
    cmd: cd web && node test/four-screens.test.js
  - AC6: không hồi quy — cả bộ test web
    cmd: cd web && npm test
phụ_thuộc: T01-21
