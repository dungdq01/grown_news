# T03-76 — WO-034: hiện vật giãn theo cửa sổ, chữ vẫn giữ độ dài dòng

> `.hv` (PDF · video · ảnh) nằm trong `<article class="doc">` nên thừa hưởng
> `max-width` của cột CHỮ — 900px kể cả khi cửa sổ 1700px. Một PDF 23 trang bị
> nhét vào cột văn xuôi thì hiện ở 28%, đọc không nổi.
>
> KHÔNG bỏ `max-width` của `.doc`: độ dài dòng là luật đọc (ui_guide §9) và
> `cua-so-doc.test.js` đang canh nó. Hiện vật phải THOÁT KHỎI cột chữ, không
> phải kéo cột chữ rộng ra.
>
> Bề rộng khả dụng = `100cqw − cột mục lục − padding`. Cột mục lục đang khai ở
> `grid-template-columns` tại BA breakpoint; nối `.hv` vào đó bằng một token
> `--toc-w` để hai bên đọc CÙNG một số — gõ lại 150/120/200 ở chỗ thứ hai là
> cách chúng lệch nhau ngay lần sửa đầu.

phạm_vi_ghi:
  - web/styles/prototype.css
  # đổi số dòng của chính file trên ⇒ con số trong WORKLOG lỗi thời và
  # check_worklog đỏ. Tài liệu của một file đi cùng đơn vị sửa file đó.
  - web/styles/WORKLOG.md
verifiability: hard
tiêu_chí:
  - AC1: `.hv` KHÔNG bị chặn bởi `max-width` của `.doc` — bề rộng nó đọc từ
      container cửa sổ, và cột mục lục khai MỘT nơi (`--toc-w`) cho cả
      `grid-template-columns` lẫn `.hv`
    cmd: node web/test/cua-so-doc.test.js
  - AC2: khung hiện vật có hình dạng ĐÚNG LOẠI — tài liệu cao theo trang, video
      16/9; không dùng chung một `aspect-ratio` cho cả hai (rộng 1600px với 4/3
      thành hộp cao 1200px, tệ hơn trước khi sửa)
    cmd: node web/test/cua-so-doc.test.js
