# T03-50 — WO-018: ô mô tả · nút nạp mời lối khác · dòng nơi phát dẫn xuất (CODE)

> Bốn việc, không việc nào chạm `frontmatter.schema.json` (file duy nhất đang
> FROZEN trong `core/assets`):
>
> 1. Ô **mô tả** cho hai màn nạp, và hai hàm gửi lấy **thân bài** từ ô đó thay vì
>    lặp lại câu tóm tắt. Ô phải nói ra giới hạn số từ của hồ sơ `thu-vien` —
>    để người dùng biết trước, không gõ xong mới bị 422.
> 2. Ô chủ đề + khái niệm **ra khỏi khối ẩn**: chúng là thứ bắt buộc, nên chúng
>    phải hiện ngay khi mở màn.
> 3. Nút header trên màn nạp mời **các lối khác** và đánh dấu lối đang mở. Hiện
>    `nutNap` giải ra chính màn đang đứng ⇒ nút chết, không có đường sang lối kia.
> 4. Dòng liệt kê nơi phát/định dạng **dẫn xuất từ bảng khai**. Gõ tay là cách nó
>    nói dối: dải video đang ghi bốn nơi phát trong khi whitelist có hai.
>
> Và sửa hiển thị menu `+ nạp` (ảnh 4): panel dùng token nền/viền của theme, không
> để trắng trên nền sáng.

phạm_vi_ghi:
  - web/render/shell.html
  - web/plugins/home-pages/shell.html
  - web/render/trang.mjs
  - web/styles/prototype.css
  - web/plugins/multiwindow/src/scripts/multiwindow.inline.ts
  - web/plugins/multiwindow/src/scripts/multiwindow.inline.js

verifiability: hard
tiêu_chí:
  - AC1: hai màn nạp có ô mô tả, và thân bài lấy TỪ ô đó
    cmd: cd web && node test/mo-ta-va-nut-nap.test.js
  - AC2: ô nhãn không nằm trong khối ẩn; nút nạp trên màn nạp mời lối khác
    cmd: cd web && node test/mo-ta-va-nut-nap.test.js
  - AC3: dòng nơi phát khớp `media-mime.json`
    cmd: cd web && node test/mo-ta-va-nut-nap.test.js
  - AC4: ba khung nạp và bốn chiều facet còn nguyên
    cmd: cd web && node test/nap-ba-khung.test.js && node test/bon-chieu-facet.test.js
  - AC5: ngân sách đo BYTE, và cả bộ xanh
    cmd: cd web && node build-fe.mjs && npm test
phụ_thuộc: T03-49
