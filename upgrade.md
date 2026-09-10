
1. Ở mục bài viết cần thêm category để phân loại

Trong module - page bài viết cần thêm thanh menu bên trái để list các category và cho user filter -> redesign của UI cho phần này. (có thể conflict với "khái niệm")

1. Thiết kế web ko có Url à . sao chỉ có localhost:8080. Vậy call API như thế nào ?
2. Mục nạp nguồn, thêm skill research : -> mục đích user dùng skill đó cho các AI khác research nữa
3. Thêm CRUD cho tất cả bài viết
4. Thêm mục hình ảnh cho bài viết (not require)
5. Nghiên cứu thêm module chatbot.
   Mục đích : thay vì tra google thì user sẽ search thông tin trực tiếp thông  qua chatbot (API key)
   Yêu cầu: Nghiên cứu dsh deepseek. [gallery.dsh-market.com](https://gallery.dsh-market.com/)  , chatbot có RAG để học các file .md của hệ thống luôn.
6. Dashboard cần đa dạng loại chart.

---

phase 2
-------

1 - cần API get dữ liệu ra chứ ko để .md như vậy được
----------------------------------------------------------------

    - Tức file .md cần biến thành các file .json -> từ đó làm API cho cá phần filter category/khái niệm / trạng thái.

    - khi đó các thao tác CRUD mưới làm trên web được -> ví dụ bước duyệt bài viết thì phải duyệt trên web chứu ai mở ra rồi đổi tên trạng thái.

    -  và khi bấm vào xem detail bài viết cần API get data json đó -> như vậy mọi thao tác CRUD mới được lưu lại vào file Json>

    -> tôi đã tạo folder C:\Users\Admin\Downloads\Grown_news\web\api ->< bạn biết cần làm gì rồi đó.

2 -   màn " nạp nguồn " / cần redesign lại cho khoa học - dễ dùng . gọi skill design mà làm

---

# Phase 3

Ok, bây giờ câu chuyện sẽ upgarde lên nhé :

## Chúng ta cần database (cso thể SQlite / posgre ,...) để nâng cấp hệ thống

logic : user/agent send .md -> convert to json -> call API -> storage DB.
Ko để sau mỗi lần phari run build và api nữa
làm tương tự với tất cả trạng thái .

---

# Big update UI

Sử dụng form ->C:\Users\Admin\Downloads\Grown_news\trang-chu.html -> để thay đổi layout và cách hiển thị
hiện tại chỉ có cho trang chủ , , yêu cầu apply all page.
ddocj -> C:\Users\Admin\Downloads\Grown_news\ui_guide.md

---

# Redesign bố cụ layout

- căn lề layout giữa khung , cùng ảnh nền tương ứng
- tạo hiệu ứng nền - nền bóng như iphone, làm gọn gàng , tinh tế , thiết kế bắt mắt như các app iphone
- có các hiệu ứng 3D , chuyển động nhẹ nhàng , mượt mà, màu sắc đa dạng hoá / nhưng cần chia rõ sáng tối.
- luôn bám vào C:\Users\Admin\Downloads\Grown_news\ui_guide.md -> để hoàn thiện
- làm, lần lượt từng page - hạn chế tối đa việc thay đổi API / logic backend. Nếu thay đổi thì các logic FE cơ bản thôi.

# update chức năng

- bỏ logic duyệt bài mới và duyệt các concept / category tạo mới -> user tạo là lên chính thức luôn
  yêu cầu : check kỹ DB , logic Backend API và giao diện để thay đổi cho phù hợp .
- Kiểm tra lại tất cả các button liên quan thêm sửa xóa bài viết . Hiện tại tôi bấm nút "sửa " nó không hoạt động , cá nút khác cũng tương tự.
  *(Ba ảnh chụp lỗi này đã XOÁ 2026-09-04 theo `FR-060` — ảnh không vào git. Chúng chụp đúng bug nút "Sửa" mở form Nạp-mới rỗng, và bug đó đã đóng ở `WO-045`, nên nội dung chúng ghi lại không mất theo.)*
- Lên kế hoạch và xóa bỏ dần các dữ liệu , file cũ liên quan đến dữ liệu , tất cả thay bằng API hết và luôn lưu trữ ở DB.

# Recfactor cấu trúc bài viết

- Hiện tại cấu trúc bài viết hơi rườm rà và thiếu linh động
- tôi cần linh động cho tất cả bài viết  có thể là Technical , AI , ecommerce, bank ....
  ta cần tìm bộ khung linh động và cơ bản nhất
  Tôi đề xuất :

1. Overview
2. Bối cảnh : vấn đề gì ?-> tại sao có nó
3. Nội dung : đầu vào , process, output , tinh túy.
4. Ý nghĩa thực tế , Ví dụ thực tế.
5. Rủi ro và tầm nhìn.

## Super update

- Phát triển tính năng cho xem pdf . ppt . video (thông qua url youtube .
  User flow : 1. tải pdf + word + ppt + url video -> lưu DB. -> 2. mở tài liệu đã tải lên xem trên hệ thống.

  -> guide : Gộp luôn các file .md , tài liệu hiện tại vào mục này luôn. => bộ nguồn gồm .md , pdf, word , ppt , url video .

      => chế độ xem sẽ là preview

      => cần viết lại docs và design lại UI trước khi code

## note :

- -> ta có thể design theo kiểu : module Bài viết (module hiện tại đã có) , ta sẽ thêm : module tài liệu (PPT / pdf và word.), module video (gán url tiktok , youtube...)....
  -> các module mưới cũng sẽ có CRUD , thêm sửa nạp nguồn như module bài viết cũ.
  -> Trang dashboard lúc này sẽ tổng hợp All thay vì mỗi các bài viết nội bộ , Trang kho cũng tương tự
  -> các module mới cũng cần có danh mục :category , concept như module bài viết đã có.
