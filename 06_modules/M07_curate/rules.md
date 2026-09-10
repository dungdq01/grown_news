# M07_curate — rules

```yaml
- id: M07-R1
  vi_phạm: "M07 ghi vào kb/ — kể cả sửa concepts.yaml hay đổi review_status"
  bề_mặt: S3          # test_curate.py -k khong_ghi
  why: >
    kb/ vừa là nguồn chân lý vừa là thứ M1 đo. Module tự sửa thì người duyệt mất
    quyền kiểm soát chính thứ đang dùng để chấm dự án — và số M1 không còn nghĩa
    vì không biết phần nào do người, phần nào do máy.

- id: M07-R2
  vi_phạm: "con số ngưỡng nằm trong mã thay vì thresholds.yaml"
  bề_mặt: S3          # test_curate.py -k khong_hardcode
  why: >
    Kho đang 0 bài nên MỌI ngưỡng hiện tại là phỏng đoán và sẽ sai. Rải trong mã
    thì lúc có dữ liệu thật phải đi tìm từng chỗ — và sót một chỗ là hai luật
    chạy song song.

- id: M07-R3
  vi_phạm: "đề xuất gộp concept xuất hiện trong báo cáo tuần"
  bề_mặt: S3          # test_curate.py -k nhip
  why: >
    Nhắc quá thường thì người ta tắt thông báo — và mất luôn cả nhắc quan trọng
    (draft đọng, bài chết). Gộp concept là quyết định cần nhìn nhiều dữ liệu,
    thuộc nhịp tháng.

- id: M07-R4
  vi_phạm: "M07 tự chạy re-analyze thay vì xếp hàng chờ người bấm"
  bề_mặt: S2
  why: >
    Re-analyze ghi đè bản hiện hành và sinh bản .v<n>. Chạy tự động trên 20 bài
    cùng lúc thì mất kiểm soát cái gì vừa đổi — và nếu giao thức đang sai thì
    nó nhân cái sai lên 20 lần.
```

## Vì sao không có rule về độ chính xác của đề xuất gộp

Chuẩn hoá tên (`rag` gần `rag-pipeline`) là **gợi ý**, không phải phán quyết. Đề
xuất sai không gây hại: người đọc và bỏ qua.

Rule chỉ tồn tại cho thứ hỏng **im lặng**. Một đề xuất gộp sai thì thấy ngay.
