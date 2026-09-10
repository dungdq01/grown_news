# T03-59 — WO-025: `page-weight` so theo byte (đơn vị TEST)

> Bốn phép so trong `web/test/page-weight.test.js` đổi từ KB-đã-làm-tròn sang
> byte. `kb()` GIỮ NGUYÊN — câu báo cho người đọc phải là KB; chỉ phép SO đổi.
>
> Phép sắp xếp tìm trang nặng nhất cũng đổi sang byte: sắp theo KB làm tròn thì
> hai trang lệch 400 byte đổi chỗ được, và câu lỗi nêu sai tên trang.
>
> **Răng tự chứng minh** thay cho ĐỎ-trước: dựng một chuỗi dài đúng 100.499 KB
> rồi đòi *phép so cũ cho qua* **và** *phép so mới chặn*. Hai phép cho cùng kết
> quả ⇒ hoặc lỗ không tồn tại, hoặc tôi đo sai — và câu lỗi nói thẳng: đừng sửa
> mã, sửa phép đo này trước. Kèm ca âm: file ĐÚNG BẰNG trần vẫn phải qua, không
> thì đó là siết quá tay chứ không phải siết.
>
> Đo trước khi sửa để chắc không đỏ oan: gn.css 98523 · gn.js 101426 (trần
> 102400) · trang chủ 59104 (61440) · lớn nhất 67587 (75776) — cả bốn dưới trần.

phạm_vi_ghi:
  - web/test/page-weight.test.js
  - web/test/he-kinh.test.js      # cùng lỗ: Math.round(size/1024) > 500
  - web/test/sua-dung-man.test.js # chú thích nói về lỗ đã vá
  - web/test/WORKLOG.md

verifiability: hard
tiêu_chí:
  - AC1: cổng xanh, và tự in ra số byte phép so cũ từng nhường
    cmd: cd web && node test/page-weight.test.js
  - AC2: không cổng nào khác đỏ thêm
    cmd: cd web && npm test
