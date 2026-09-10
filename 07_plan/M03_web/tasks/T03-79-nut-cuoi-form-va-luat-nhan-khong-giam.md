# T03-79 — WO-035: nút Ghi vào kho về cuối form · luật nhãn thôi giẫm lên `.f-chon`

> §1 · Nút `#tv-gui`/`#vd-gui` ra khỏi `#tv-meta`/`#vd-meta` (khối đứng TRƯỚC
> bốn trường) và về cuối form, bọc `.f-act` — cùng hình dạng với màn bài viết,
> bản đang đúng. Ra khỏi khối `hidden` là ĐƯỢC: hai hàm gửi đã có chốt riêng
> (`"Chưa nạp tài liệu nào."` · `LOI_HOST`), cùng lối WO-018 đã đưa mô tả và hai
> ô nhãn ra ngoài khối ẩn.
>
> §2 · KHÔNG sửa `.f-chon` và KHÔNG bỏ `justify-content` khỏi `.f-row > span`:
> luật nhãn cần `space-between` để đẩy `<i class="f-opt">` sang mép phải hàng.
> Thứ sai là nó **rơi trúng một phần tử không phải nhãn**. Chữa bằng `:not(.f-chon)`
> — luật nhãn nói rõ nó nói về nhãn.
>
> Hai bản `shell.html` (`web/render/` và `web/plugins/home-pages/`) phải giống
> nhau TỪNG BYTE — có cổng canh; sửa một bản là làm đỏ cổng đó.
>
> Trần byte: `gn.css` 102400. `:not(.f-chon)` × 3 = 39 byte. SIẾT, không nới.

phạm_vi_ghi:
  - web/render/shell.html
  - web/plugins/home-pages/shell.html
  - web/styles/prototype.css
  - web/plugins/WORKLOG.md   # số ký tự shell.html — `check_worklog.py` so với file thật
verifiability: hard
tiêu_chí:
  - AC1: nút `Ghi vào kho` của cả ba màn nạp đứng SAU `title` · `cat` · `cpt`
      trong DOM và nằm trong `.f-act`
    cmd: node web/test/mo-ta-va-nut-nap.test.js
  - AC2: không luật nào khớp mốc `<span class="f-chon">` con của `.f-row` mà khai
      `display` · `flex-wrap` · `gap` · `justify-content` — ô tích xếp liền nhau
      cách `--s-md`, không dàn ra hai mép
    cmd: node web/test/mo-ta-va-nut-nap.test.js
  - AC3: hai bản `shell.html` giống nhau TỪNG BYTE
    cmd: cmp web/render/shell.html web/plugins/home-pages/shell.html
  - AC4: markup vẫn khớp CSS (mọi class có luật) và khung thân bài không đổi
    cmd: node web/test/markup-matches-css.test.js
  - AC5: `gn.css`/`gn.js` KHÔNG vượt trần 102400 byte, trang không nặng thêm
    cmd: node web/test/page-weight.test.js
  - AC6: số ký tự `shell.html` chép trong `web/plugins/WORKLOG.md` khớp file thật
    cmd: python core/tests/check_worklog.py
phụ_thuộc: T03-78
