# WO-036 — Biểu đồ màn /kho cùng một form, lặp lại — không mời gọi được ai

loại: cải tiến UI (người dùng yêu cầu trực tiếp, kèm 3 ảnh)
module: M03_web
mở_bởi: người dùng, 2026-08-29 — *"các biểu đồ đang cùng 1 form quá - ko đa dạng
  và có gì mới mẻ ⇒ tôi cần đây phải là trang tổng hợp và visualize đủ hấp dẫn
  để mời gọi khách hàng, thêm các tính năng hay animation siêu việt vào"*

## Hiện trạng (đếm trên màn thật)

| Mốc | Dữ liệu | Hình đang dùng |
|---|---|---|
| kpi2 | 3 phần của một tổng | thanh chia đoạn + hàng KPI |
| bars2 | theo loại nguồn | bar ngang |
| bars3 | tin cậy (enum có thứ tự) | thanh chia đoạn + hàng |
| bars4 | 4 trạng thái vòng đời | bar ngang |
| kf-thang | chuỗi thời gian | cột dọc |
| kf-nguon | 3 phần của một tổng | thanh chia đoạn |
| kf-uutien | 3 mức có thứ tự | bar ngang |

**Bar ngang ×3, thanh chia đoạn ×3** — FR-031 tự đề "ba góc nhìn, ba HÌNH DẠNG"
nhưng cả màn chỉ có 3 hình cho 7 bộ dữ liệu. Ảnh người dùng gửi cho thấy đúng
điều đó: các panel đọc giống hệt nhau.

## Kỳ vọng

Mỗi bộ dữ liệu một hình dạng ĐÚNG bản chất của nó, mỗi hình xuất hiện MỘT lần
trên màn; chuyển động một-nhịp khi vào tầm nhìn (không vòng lặp — dashboard là
ảnh chụp, không phải dòng dữ liệu chảy); tôn trọng reduced-motion.

## Mức

`hard` — hình dạng và chốt animation đo được trên markup/CSS đã render.
