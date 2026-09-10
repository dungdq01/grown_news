# M06_skillgen — rules

```yaml
- id: M06-R1
  vi_phạm: "chấm verdict mà chạy cổng domain trước CỔNG CỨNG credibility"
  bề_mặt: S3          # test_verdict.py -k cong_cung
  why: >
    Lượt kiểm đầu tôi chạy sai đúng thứ tự này và cho ra NEW cho hai ứng viên
    mà schema ĐÃ CẤM. Sai thứ tự không tạo lỗi kiểu — nó tạo kết quả trông hợp
    lệ, đi qua mọi cổng còn lại. Thứ tự LÀ luật, không phải chi tiết cài đặt.

- id: M06-R2
  vi_phạm: "nháp SKILL.md sinh ra có nội dung thân (khác dòng TODO)"
  bề_mặt: S3          # test_draft_shape.py
  why: >
    Sinh từ MỘT nguồn thì chỉ chép lại nguồn đó. Kết quả trông như skill, cài
    vào làm agent tệ hơn, và người dùng không phát hiện ngay vì output vẫn trôi
    chảy. Nháp thì biết rõ nó chưa xong — đó là toàn bộ giá trị của lối A.
    Rule này chống chính module này phình vai.

- id: M06-R3
  vi_phạm: "sinh nháp từ bản có review_status khác approved"
  bề_mặt: S3          # test_verdict.py -k chi_approved
  why: >
    Skill điều khiển agent. Sinh từ bản chưa ai đọc thì một bài rác trong draft
    (kể cả do prompt injection) thành công cụ agent dùng mọi lần sau — đúng
    hàng cuối của bảng security_baseline §5, ràng buộc an ninh quan trọng nhất
    của dự án.

- id: M06-R4
  vi_phạm: "tự cài skill vào agent, hoặc ghi đè SKILL.md người đã sửa"
  bề_mặt: S2
  why: >
    PRD U7: máy đề xuất, NGƯỜI quyết định cài. Ghi đè bản người sửa thì công
    biên tập mất im lặng — và mất đúng phần giá trị nhất, phần máy không làm được.

- id: M06-R5
  vi_phạm: "hạ ngưỡng priority hoặc nới depth để có thêm nháp"
  bề_mặt: S2
  why: >
    Một loạt NEW đáng ngờ là dấu hiệu MANIFEST THIẾU, không phải ngưỡng cao.
    Bổ sung capability là sửa nguyên nhân; hạ ngưỡng là làm triệu chứng biến mất
    và kho skill nhiễm dần.
    M1.2 chỉ cần >=1/10 — không có áp lực số lượng nào biện minh cho việc nới.
```

## Rule chưa fire — theo dõi

Cả 5 rule chưa fire lần nào vì module chưa có code. Theo vòng đời rule: **chưa
fire qua 2 lượt dự án ⇒ xoá**. Đánh giá lại ở s10.

`M06-R1` là ngoại lệ đáng giữ kể cả chưa fire: nó đã fire **một lần rồi**, lúc tôi
kiểm thuật toán bằng tay và ra kết quả sai.
