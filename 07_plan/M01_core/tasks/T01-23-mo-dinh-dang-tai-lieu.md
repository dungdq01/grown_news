# T01-23 — FR-039: bảng mime đổi VAI, schema mở `media.mime` (đơn vị CODE)

> `media-mime.json` **không bị xoá** — nó thôi làm **cổng NHẬN** và thành **bảng
> RENDER**. Ba thứ đang dẫn xuất từ nó sẽ im lặng hỏng nếu bảng biến mất:
> `content-type` phục vụ · `inline`/`attachment` từ `xem_truoc` · đuôi file trong
> `filename=` và trong `_media/<sha>.<duoi>`.
>
> Thêm khối `mac_dinh` cho định dạng lạ: `application/octet-stream` · đuôi `.bin`
> · `xem_truoc: "tai"` (⇒ `attachment`).
>
> `frontmatter.schema.json` **FROZEN** — `media.mime` từ enum-5 sang `pattern`
> dạng `type/subtype` (RFC 6838). **Bỏ enum KHÔNG phải bỏ mọi phép kiểm**: một
> `mime` chứa `\r\n`, dấu cách hay `;` đi thẳng vào `content-type` là đường tách
> đầu đề — nên đổi phép kiểm từ *"nằm trong danh sách"* sang *"đúng hình dạng"*.
>
> `xuat_kho.py:53` `DUOI_THEO_MIME` phải có nhánh mặc định, không thì mime lạ
> ném `KeyError` giữa vòng export — và export chạy tự động sau mỗi lần ghi.

phạm_vi_ghi:
  - core/assets/media-mime.json
  - core/assets/frontmatter.schema.json
  - core/tools/xuat_kho.py

verifiability: hard
tiêu_chí:
  - AC1: `media.mime` nhận `application/vnd.lạ+xyz` và TỪ CHỐI chuỗi có ký tự
      điều khiển / dấu cách / `;`
    cmd: python core/tests/check_dinh_dang_mo.py
  - AC2: bảng vẫn đủ 5 định dạng đã biết kèm `magic` + `xem_truoc`, và có khối
      `mac_dinh`
    cmd: python core/tests/check_dinh_dang_mo.py
  - AC3: export không ném với mime lạ — vòng round-trip vẫn đạt điểm bất động
    cmd: python core/tests/check_export_dan_xuat.py
  - AC4: không hồi quy cổng Python
    cmd: python core/tests/check_media_ddl.py && python core/tests/check_media_dan_xuat.py
phụ_thuộc: T01-22
