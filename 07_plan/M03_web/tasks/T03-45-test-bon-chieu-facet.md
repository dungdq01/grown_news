# T03-45 — WO-016: cổng bốn chiều facet (đơn vị TEST)

> `web/test/bon-chieu-facet.test.js` (MỚI). ĐỎ trước (R5).
>
> **Phép đo phải cắt theo `v-*`.** Mọi màn nằm chung một tài liệu; một phép grep
> trên cả HTML in ra cùng danh sách cho năm màn và xanh vô căn cứ. Đây là lỗi tôi
> đã trúng bốn lần (`ui-ba-man` §4-5 · `man-nap-rieng` §2 · `page-weight:demThe`
> · và chính phép đo hiện trạng của WO-016 này).
>
> **Bốn ca âm, mỗi ca cho một cách xanh-vô-căn-cứ:**
>
> 1. `cat` có mặt nhưng **rỗng** (0 nút) ⇒ phải đỏ. Một tầng facet không có mục
>    nào là một tiêu đề, không phải một phép lọc.
> 2. `cat` trên ba màn loại nhưng lấy nhãn từ **cả kho** thay vì từ bản ghi của
>    module đó ⇒ phải đỏ. Cùng bệnh WO-014 vừa chữa cho `nguon`.
> 3. `pl` xuất hiện trên màn loại ⇒ phải đỏ. Một facet "phân loại" trong màn
>    Video là đúng một dòng, vô nghĩa — đúng câu người dùng chỉ vào ở WO-014.
> 4. Số trên ô đếm không khớp số thẻ **trong lưới của nó** sau khi lọc `cat`
>    ⇒ phải đỏ. BUG-2 của WO-015 là đúng lớp này.
>
> **Và một ca âm cho `/khai-niem/`**: liệt kê được ba tiêu đề mà số bản ghi lấy
> từ một phép đếm trong JS thay vì từ `VIEW nhan` ⇒ phải đỏ. Hai nơi đếm một sự
> thật thì có ngày chúng lệch, và cái lệch đó im lặng.

phạm_vi_ghi:
  - web/test/bon-chieu-facet.test.js
  - web/test/WORKLOG.md
  - web/package.json

verifiability: hard
tiêu_chí:
  - AC1: cổng ĐỎ trên code hiện tại, và nói ra màn nào thiếu tầng nào
    cmd: cd web && node test/bon-chieu-facet.test.js; test $? -ne 0
  - AC2: sau T03-44 XANH, và có trong `npm test`
    cmd: cd web && npm test
