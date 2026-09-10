# T03-83 — WO-037: form chỉ nhận văn xuôi (đơn vị CODE)

> ⛔ T03-82 phải ĐỎ trước. Đã đỏ 12 mục, chỉ đích danh ô `3.4`.
>
> **1 · Ô tinh túy thành nhóm ô con.** `dungKhung()` gặp mục `tinh_tuy: true` thì
> dựng nhóm lặp được: một ô "Tên", năm ô lấy nhãn từ `KHUNG.tinh_tuy.bullets`.
> Tối đa `tinh_tuy.toi_da`. Gợi ý của từng ô là văn xuôi, không markdown.
>
> **2 · `gomKhung()` TRẢ VỀ chuỗi**, không ghi `#f-than`. Nó sinh `#### 3.4.k Tên`
> và `- **<nhãn>** …` — nhãn suy từ bảng khai, không gõ tay.
>
> **3 · Bỏ chế độ thô**: gỡ `#f-tho-o`, `#f-than`, nút `[data-soan]`, hàm
> `doiSoan`. Nơi gửi form phải lấy thân từ `gomKhung()` trả về.
>
> **4 · Chốt an toàn thay lưới cũ.** `dienForm()` giữ `raiKhung`; không khớp thì
> **BÁO** và không điền — không im lặng, vì im lặng ở đây là ghi đè thân bài bằng
> rỗng.
>
> Đo lại trần sau `node build-fe.mjs` — `gn.js` đang 100615/102400.

phạm_vi_ghi:
  - web/plugins/multiwindow/src/scripts/multiwindow.inline.ts
  - web/plugins/multiwindow/src/scripts/multiwindow.inline.js
  - web/render/shell.html
  - web/plugins/home-pages/shell.html
  # Ba file tài liệu KHÔNG phải scope-creep: `check_worklog` đếm số ký tự của
  # shell và số file test rồi so với chữ. Đơn vị này đổi cả hai, nên để chúng
  # lệch là để lại một cổng đỏ mang tên mình. Khai trước khi chạm.
  - web/WORKLOG.md
  - web/plugins/WORKLOG.md
  - web/test/WORKLOG.md

verifiability: hard
tiêu_chí:
  - AC1: cổng T03-82 XANH, và hai bản shell còn giống nhau từng byte
    cmd: cd web && node test/form-van-xuoi.test.js && cmp render/shell.html plugins/home-pages/shell.html
  - AC2: không cổng nào khác đỏ thêm
    cmd: cd web && npm test
