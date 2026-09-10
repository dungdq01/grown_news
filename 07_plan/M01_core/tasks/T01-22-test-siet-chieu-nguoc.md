# T01-22 — FR-038/C5: siết §4 của `check_khai_mot_noi` (đơn vị TEST)

> §4 hiện hỏi `"man-hinh.json" in text` — **tìm chuỗi trên cả file**. Một dòng
> bình luận `// bảng màn khai ở core/assets/man-hinh.json` làm nó XANH mà không ai
> đọc file nào.
>
> Đây không phải rủi ro lý thuyết: tôi sắp là người viết consumer đó, và §4 là cái
> duy nhất bảo rằng tôi đã đấu thật. Một phép kiểm không phân biệt được bình luận
> với lệnh đọc thì vô dụng **đúng lúc nó cần có tác dụng**. Cùng lớp lỗi
> `check_worklog` so số bằng `doc in o`, và lớp lỗi `#acount` tìm chuỗi trên cả
> trang.
>
> Siết: tên bảng khai phải xuất hiện trên một dòng **cũng có** `readFileSync` hoặc
> `join(` hoặc `read_text` — tức nằm trong một biểu thức đường dẫn, không phải
> trong văn xuôi.
>
> Không siết tới mức phân tích cú pháp: mục tiêu là loại bình luận, không phải
> chứng minh luồng dữ liệu. Chứng minh luồng dữ liệu là việc của §3 (không tầng
> nào được gõ tay cả tám màn) — hai vế cùng nhau mới đủ.

phạm_vi_ghi:
  - core/tests/check_khai_mot_noi.py

verifiability: hard
tiêu_chí:
  - AC1: bốn consumer `loai-nguon.json` đang XANH vẫn xanh sau khi siết — chúng đọc
      thật, không phải nhắc tên
    cmd: python core/tests/check_khai_mot_noi.py
  - AC2: ca âm — nhét tên bảng khai vào một dòng BÌNH LUẬN của `web/server.mjs` thì
      §4 vẫn CHỜ, không chuyển xanh; hoàn tác khớp byte
    cmd: python core/tests/check_khai_mot_noi.py
phụ_thuộc: T01-17
