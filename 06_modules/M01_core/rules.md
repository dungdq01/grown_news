# M01_core — rules

```yaml
- id: M01-R1
  vi_phạm: "một đường chạy nào đó của skill hoặc validate.py ghi review_status: approved"
  bề_mặt: S2
  why: >
    Lớp giảm thiểu prompt injection của toàn dự án đứng trên đúng một câu:
    "máy không bao giờ tự set approved" (security_baseline §6). Nguồn ngoài là
    untrusted input và skill ĐỌC nội dung đó. Mất luật này thì tác động của một
    trang web độc nhảy từ "một bài rác trong draft" lên "bài rác đã duyệt,
    lên web, sinh skill điều khiển agent".

- id: M01-R2
  vi_phạm: "--fix sửa một trường cần phán đoán (credibility, verdict, concepts)"
  bề_mặt: S2
  why: >
    --fix có lý do tồn tại vì word_count là PHÉP TÍNH. credibility là QUYẾT ĐỊNH.
    Sửa tự động một quyết định là bịa có hệ thống — và bịa sẽ đi thẳng qua mọi
    cổng còn lại vì nó "hợp lệ".
    NỢ: chưa có test so frontmatter trước/sau --fix (AC-2.3.1).

- id: M01-R3
  vi_phạm: "thêm cổng vào validate.py mà không có test phá đúng luật đó"
  bề_mặt: S3          # check_rule_surfaces.py — đếm cổng vs đếm test
  why: >
    Kiểu hỏng nguy hiểm nhất của module này: cổng mất hiệu lực mà không ai biết,
    mọi file vẫn báo OK trong khi kho nhiễm dần. Test không kiểm "script chạy
    được" — kiểm "luật có hiệu lực". Đây là lý do 19 test có cấu trúc
    một-test-phá-một-luật.

- id: M01-R4
  vi_phạm: "code trong core/ import hoặc đọc bất cứ thứ gì trong web/"
  bề_mặt: S4          # git diff — path nằm ngoài core/** là thấy ngay
  why: >
    Hai nhánh phát triển song song được CHỈ VÌ hợp đồng là format file .md,
    không phải interface code. Một import là đủ để chúng dính lại, và từ đó
    mọi thay đổi web phải chờ core.
```

## Ghi chú bề mặt

`M01-R1` và `M01-R2` đều là **S2 (reviewer)**, không phải S3. Lý do giống nhau:
không có lệnh nào chứng minh *điều-không-xảy-ra* trên mọi đường chạy. Test chứng
minh được "cổng này đóng", không chứng minh được "không đường nào ghi approved".
