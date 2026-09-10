<!-- Chuyen tu 07_plan/M08_api/ sang day:  thuoc boundary
     M03_web ( fe: web/**). Cong duoc kiem la cua M08_api
     (T08-17), nhung don vi VIET file test thuoc module so huu thu muc. -->

# T03-48 — WO-016: cổng cho "tài liệu/video phải có chủ đề + khái niệm" (đơn vị TEST)

> `web/test/nhan-bat-buoc.test.js` (MỚI). ĐỎ trước (R5).
>
> Người dùng chốt (2026-08-28): **cổng module chặn, schema không đổi**. Không sửa
> `required` của `frontmatter.schema.json` — file đó FROZEN, và mọi bản ghi cũ
> thiếu hai trường sẽ thành không hợp lệ trên CẢ KHO.
>
> **Vì sao vế này phải có răng phía server:** đo được rằng hai đường nạp tài
> liệu/video có **0** `<select>`, nên mọi bản vào kho với `category: []`. Kết quả
> là facet Chủ đề rỗng vĩnh viễn. Một ô ở form là nhắc; chỉ cổng server là luật —
> và `validate.py --strict` hiện cho qua bản `thu-vien` không có chủ đề nào.
>
> **Ba ca âm:**
>
> 1. **Bài viết KHÔNG bị chặn.** Hồ sơ `phan-tich` có cổng riêng trong
>    `validate.py`; thêm luật nhãn cho nó ở đây là bản thứ hai của cùng một luật,
>    và nó sẽ chặn bản ghi cũ. POST một bài viết không chủ đề ⇒ vẫn **201**.
> 2. **Câu lỗi phải NÓI THIẾU GÌ.** "400 Bad Request" không cho người dùng biết
>    ô nào trống. Phép kiểm đòi câu lỗi chứa chữ chỉ ra trường thiếu.
> 3. **PUT cũng bị chặn, không chỉ POST.** Sửa một tài liệu rồi bỏ hết chủ đề là
>    cùng một lỗ; chặn POST mà bỏ PUT là chặn một nửa và tưởng đã xong.
>
> Và **ca âm cho chính cổng**: nếu tôi trả `null` cho mọi module thì mọi phép
> kiểm "201" ở trên vẫn xanh. Nên phải có ca ĐỎ khi thiếu — hai chiều.

phạm_vi_ghi:
  - web/test/nhan-bat-buoc.test.js
  - web/test/WORKLOG.md
  - web/package.json

verifiability: hard
tiêu_chí:
  - AC1: cổng ĐỎ trên code hiện tại (tài liệu/video thiếu nhãn vẫn được nhận)
    cmd: cd web && node test/nhan-bat-buoc.test.js; test $? -ne 0
  - AC2: sau T08-17 XANH, và có trong `npm test`
    cmd: cd web && npm test
