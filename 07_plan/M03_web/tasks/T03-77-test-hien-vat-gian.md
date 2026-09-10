# T03-77 — WO-034: cổng canh hiện vật giãn theo cửa sổ (đơn vị TEST)

> Tách khỏi T03-76 vì R1 — đơn vị không phải test thì không chạm `web/test/**`.
>
> Phép kiểm phải hỏi HAI CHIỀU, vì bug này có hai cách "sửa" mà một cách phá
> thứ khác: (a) hiện vật không giãn — bug đang có; (b) ai đó bỏ `max-width` của
> `.doc` cho nhanh — hết lệch khung nhưng văn xuôi trải 1600px, phá luật độ dài
> dòng của ui_guide §9. Cổng phải đỏ ở CẢ HAI.

phạm_vi_ghi:
  - web/test/cua-so-doc.test.js
verifiability: hard
tiêu_chí:
  - AC1: `.hv` đọc bề rộng từ container cửa sổ, không bị `.doc` chặn; và cột mục
      lục khai MỘT nơi — `grid-template-columns` với `.hv` dùng cùng token
    cmd: node web/test/cua-so-doc.test.js
  - AC2: `.doc` VẪN còn chặn độ dài dòng ở cả ba bậc (chiều ngược — chống cách
      sửa nhanh phá luật đọc)
    cmd: node web/test/cua-so-doc.test.js
  - AC3: hai loại hiện vật hai hình dạng — tài liệu cao theo trang, video 16/9
    cmd: node web/test/cua-so-doc.test.js
phụ_thuộc: T03-76
