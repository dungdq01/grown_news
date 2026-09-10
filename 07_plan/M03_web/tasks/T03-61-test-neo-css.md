# T03-61 — WO-027: bỏ neo nuốt dấu `}` trong phép quét CSS (đơn vị TEST)

> Bảy chỗ ở ba file cổng dùng `(?:^|\})\s*<sel>\{([^}]*)\}`. Neo đó tiêu thụ dấu
> `}` của luật trước ⇒ `matchAll` chỉ thấy **cách một luật**: đo được 416 / 832
> trên `cssGoc` của `cac-man-con-lai`.
>
> **Nói cho đúng:** đếm theo từng selector các cổng thật sự hỏi thì hai neo cho
> CÙNG kết quả (`.top` 3·3 · `.wrap` 2·2 · `.mid` 1·1 · `.tb` 2·2 · `.view` 1·1).
> Không phép kiểm nào đang sai. Sửa vì nó đúng do **may** — vị trí chẵn/lẻ trong
> file, mà một luật không liên quan thêm vào phía trên là đổi.
>
> `[^}]*` không vượt được một `}` nên neo là **thừa**. Thay bằng `(?:^|[};])` +
> cờ `m` — thiếu `m` thì `^` chỉ có nghĩa ở đầu CHUỖI.
>
> Sau khi sửa: cả ba cổng phải còn XANH. Đỏ ở đây nghĩa là có một luật ghi đè
> trước nay vô hình, và đó là phát hiện chứ không phải hồi quy.

phạm_vi_ghi:
  - web/test/cac-man-con-lai.test.js
  - web/test/rail-trai.test.js
  - web/test/ui-ba-man.test.js
  - web/test/WORKLOG.md

verifiability: hard
tiêu_chí:
  - AC1: ba cổng còn xanh sau khi đổi neo
    cmd: cd web && node test/cac-man-con-lai.test.js && node test/rail-trai.test.js && node test/ui-ba-man.test.js
  - AC2: không cổng nào khác đỏ thêm
    cmd: cd web && npm test
