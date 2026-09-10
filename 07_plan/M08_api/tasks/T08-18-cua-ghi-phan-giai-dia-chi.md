# T08-18 — WO-040: cửa ghi phân giải địa chỉ vào kho ĐANG HOẠT ĐỘNG

> Test tái hiện **đã ĐỎ trước** và không phải tôi viết:
> `web/test/api-crud.test.js` §7 *"validate --strict cả kho tạm exit 0 sau đủ
> vòng CRUD"* — đỏ từ lúc C1 landing. Đơn vị này không chạm file test nào.

## Quyết định thiết kế, khai trước khi code

**1 · Kho phân giải là `KB`, không gõ cứng `kb/`.**
`dungchung.mjs:37` — `KB = process.env.KB_DIR ?? join(GOC, "kb")`. Gõ cứng thì
mọi test chạy trên kho tạm sẽ phân giải vào **kho THẬT của chủ dự án**.

**2 · Chỉ sửa `:654` (`ghiSauValidate`). KHÔNG chạm `:834` (`phucHoi`).**
`phucHoi` validate bản tạm rồi INSERT từ `fm` **trong bộ nhớ** — nó *không đọc
lại* file sau validate. Nên ở đó:

| thêm gì | hậu quả |
|---|---|
| `--kho` không `--fix` | restore **422** khi số cũ lệch ⇒ **chặn đường lấy lại dữ liệu** |
| `--kho --fix` không đọc lại | validate xanh trên bản tạm, bản COMMIT vẫn số cũ ⇒ **cổng xanh giả** |

Cả hai đều tệ hơn hiện trạng. `phucHoi` trả lại nội dung **đã từng qua validate
một lần**; đặt một cổng mới ở đường phục hồi là đúng chỗ dự án sợ nhất (mất dữ
liệu im lặng). Ghi thành ô backlog, không nới vào đây.

**3 · Phép kiểm nay phụ thuộc TRẠNG THÁI KHO — có chủ ý.**
Bài A trích `[slug-B]`; xoá B thì lần validate sau báo `citations_verified` lệch.
Đó **không** phải hồi quy: trích dẫn của A **thật sự đã gãy**. Dự án đã có đúng
khái niệm này ở tầng byte — `tham_chieu_media` + `M09-R1` chặn xoá byte mà bản
ghi khác đang trỏ vào. Nếu về sau việc này gây khó, đường đúng là **kiểm lúc
XOÁ** (cùng khuôn media), **không** phải bỏ cổng ở cửa ghi.

phạm_vi_ghi:
  - web/api/dungchung.mjs

verifiability: hard
tiêu_chí:
  - AC1: test đang ĐỎ chuyển XANH — kho tạm qua `validate --strict` sau đủ vòng CRUD
    cmd: node web/test/api-crud.test.js
  - AC2: bản ghi mới đi qua API ra `citations_*` do MÁY tính, không phải số client
      gửi; và bản chỉ có địa chỉ không phân giải được bị ép `unverifiable_citations`
    cmd: node web/test/api-crud.test.js
  - AC3: KHÔNG gõ cứng đường kho — grep `"kb"` trong lời gọi validate ra 0 dòng;
      test chạy trên `KB_DIR` tạm vẫn xanh (bằng chứng nó dùng kho tạm)
    cmd: node web/test/thu-vien.test.js
  - AC4: không phá gì — 80 test web chạy TỪNG CÁI, không cái nào đỏ
    cmd: node web/test/api-crud.test.js && node web/test/vong-doi-bai.test.js && node web/test/nhan-bat-buoc.test.js
  - AC5: `phucHoi` KHÔNG đổi hành vi — restore vẫn 200 cho bản ghi có số cũ
    cmd: node web/test/api-recycle.test.js
phụ_thuộc: T01-43
