# T03-107 — bố cục phiếu CHƯNG CẤT + bộ chọn NHÀ × MODEL

> Chỉ đạo chủ dự án 2026-09-04: *"xử lý luôn vụ model và provider"* +
> *"design lại prototype bố cục cho tab chưng cất sau khi click button Chưng cất"*.
> ID theo `rule.md` mục 9: `ls 07_plan/M03_web/tasks/` → max `T03-106` ⇒ 107.

## Ba việc, một đơn vị — vì chúng ở CÙNG một khối markup

### 1 · Lỗi 502 nói được vì sao

Ảnh chụp của chủ dự án: *"Không mở được bộ chọn model / không đọc được danh mục
model (502)"*. Server đã nói đúng chỗ hỏng — *"dịch vụ chưng cất không trả lời —
kiểm xem nó có đang chạy không"* (`:8790` chưa bật) — và FE **nuốt** câu đó rồi
thay bằng một mã số. Người đọc màn hình không có đường nào đi từ `502` tới
`chưa bật dịch vụ`. Cùng lớp lỗi `batServer().loi()` của `web/test/_api.mjs`.

### 2 · Bộ chọn NHÀ × MODEL

`T12-11` đồng bộ bảng khai từ danh mục gateway: **238 dòng / 15 nhà**. Một
`<select>` phẳng 238 dòng là danh sách không ai tìm được gì trong đó ⇒ hai ô:
**Nhà cung cấp** rồi **Model**, model lọc theo nhà đang chọn.

Ô **Nhà cung cấp** mở sẵn nhà của model MẶC ĐỊNH, không phải nhà đầu bảng chữ
cái: mặc định là một quyết định đã khai (`la_mac_dinh`), và mở sẵn một nhà khác
là bắt người dùng đi tìm lại thứ hệ đã chọn hộ họ.

⚠️ Kéo theo HAI CỬA: `la_mac_dinh` trước đó bị **lọc mất** ở cả `:8790 /model`
lẫn `web /api/model` (`CHO_RA`), nên FE không biết dòng nào là gợi ý — đo được:
bộ chọn mở `gemini-3.8-flash`, dòng đầu bảng. Nó KHÔNG phải bí mật: một quyết
định đã khai, và `FR-053 §1.1` cho người **thắng** gợi ý — muốn thắng thì phải
thấy gợi ý là gì.

### 3 · Bố cục — HỘP THOẠI RIÊNG, không chen vào cửa sổ đọc

Chỉ đạo chủ dự án (lượt hai, 2026-09-04): *"nên tạo popup riêng, tránh ghi đè
lên cửa sổ window của bài viết hay video"*.

Bản trước chèn một khối `.bk-phieu` vào GIỮA thân và chân cửa sổ đọc ⇒ nó **đẩy
nội dung đang đọc đi**; với PDF nhúng thì khung xem còn bị co lại. Người dùng
mất chỗ đang đọc để đổi lấy một bộ chọn model.

⇒ `<dialog>` NATIVE, dùng lại lớp `.dlg` mà `FR-022` đã dựng cho *"hộp thoại của
sản phẩm, bỏ confirm()/prompt() của trình duyệt"*: focus-trap · ESC · backdrop ·
`inert` phần còn lại — trình duyệt làm sẵn và đúng hơn mọi bản tự viết. Nút dùng
`.bt` / `.bt.pri` có sẵn (đã audit tương phản) ⇒ **0 byte CSS mới cho khung**.

Còn lại đúng một thứ `.dlg` không có: lưới nhãn-trái / ô-phải cho ba dòng chọn.

### 3b · Bố cục ba tầng

Bản đầu dùng nguyên khung `.bk-phieu` của phiếu duyệt/loại: một câu in đậm + một
select + hàng nút, tất cả cùng một dòng flex. Phiếu này chở nhiều hơn hẳn —
cảnh báo dữ liệu rời máy · chọn nhà · chọn model · **khu vực pháp lý** — nên nó
đọc thành một khối chữ không thứ bậc.

```
① CẢNH BÁO   mốc màu --warn bên trái · cái giá của cú bấm
② CHỌN       lưới nhãn-trái / ô-phải: Nhà cung cấp · Model · KHU VỰC
③ CHÚ THÍCH  cảnh báo một-gateway, `<em>` micro — KHÔNG cắt nội dung
④ HÀNH ĐỘNG  Đóng · Gửi đi chưng cất
```

**`khu_vuc` ra khỏi chuỗi `<option>`.** `FR-053 §1.4` đòi *"hiện `khu_vuc` cạnh
mỗi model — không phải chú thích cuối trang: người quyết phải THẤY mình đang
quyết gì"*. Một đuôi `— khu vực: …` bên trong một `<option>` đang đóng thì người
dùng chỉ thấy nó lúc bung danh sách. Nay nó là **ô riêng, luôn hiện**, đổi theo
model đang chọn, và in **NGUYÊN VĂN** kể cả `khong-xac-dinh`.

## Ngân sách byte — đơn vị này đã tiêu gần hết chỗ còn lại

`FR-027f`: *"SIẾT, không nới"*. Số đo sau đơn vị này:

| | còn |
|---|---|
| `gn.css` | 258 byte / 102400 |
| `gn.js` | ~1300 byte / 102400 |
| tải đầu `/chung-cat/nhap/` | **5** byte / 280576 |

Chuyển sang `<dialog>` **trả lại** phần CSS mà bản `.bk-phieu.cc` đã tiêu
(`.cc-canh`, `.bk-phieu.cc>*`, `.bk-phieu.cc .f-act`), nên `gn.css` dễ thở hơn.
Nhưng ngân sách chịu lực là **TỔNG TẢI ĐẦU của từng trang**, và nó còn **5
byte** — mọi phép gộp rẻ đã dùng hết:
`.bk-phieu input[number] + textarea + .cc-o select` · hai rule `.bk-phieu label`
· `.dlg .f-act{margin-top}` bỏ vì `.f-act` gốc đã có · `.cc-o` bỏ `margin`.

Và một phép gộp đã phải HOÀN LẠI: gộp `.dlg .f-act …` vào sáu rule của
`.bk-phieu` tốn **225 byte** để dựng lại đúng thứ hệ đã có — thay bằng lớp
`.bt` / `.bt.pri` sẵn dùng, 0 byte.

⚠️ **HẾT CHỖ THẬT.** Việc FE tiếp theo — kể cả 24 byte trả lại khoảng cách cho
`.cc-o` — sẽ đỏ `page-weight`. Đã mở ô backlog M03: cần một đợt giảm béo
(`check` đếm được **107 selector khai trùng** trong `gn.css`) hoặc một FR nới
trần. NGƯỜI quyết; tôi DỪNG ở đây thay vì cắt thêm nội dung cho vừa.

phạm_vi_ghi:
  - web/plugins/multiwindow/src/scripts/multiwindow.inline.ts
  - web/styles/prototype.css
  - web/api/tho-cua.mjs                 # `CHO_RA` + `la_mac_dinh`
  - web/test/chung-cat-ui.test.js       # mẫu `cc-gui` đỏ oan — xem ghi chú

# `chung-cat-ui.test.js` sửa CÙNG LƯỢT (rule.md mục 8): mẫu cũ
# `/act === "cc-gui"[^;]{0,120}guiChungCat/` ĐỎ OAN sau khi phiếu thành
# `<dialog>` — nhánh nay có `e.preventDefault();` ở giữa, và `[^;]` không khớp
# qua dấu `;`. Hành vi KHÔNG đổi. Mẫu mới đo đúng mệnh đề: giữa `cc-gui` và
# `guiChungCat` KHÔNG có `fetch(` nào.

verifiability: hard

tiêu_chí:
  - AC1: hợp đồng phiếu chưng cất giữ nguyên sau khi đổi bố cục
    cmd: node web/test/chung-cat-ui.test.js
    đỏ_khi: phiếu mất câu "toàn văn rời khỏi máy" · `khu_vuc` bị lọc/ẩn ·
      bấm lần một đã gửi · bundle lộ khoá hay cổng 8790
    xanh_khi: cả năm vế xanh
  - AC2: ngân sách byte KHÔNG bị nới
    cmd: node web/test/page-weight.test.js && node web/test/o-nhan-nap.test.js
    đỏ_khi: gn.css hay gn.js vượt 102400, hoặc tải đầu một trang vượt trần
    xanh_khi: mọi trang dưới trần
  - AC3: một họ chữ — không mono ngoài mã thật (FR-018)
    cmd: node web/test/markup-matches-css.test.js
    đỏ_khi: rule mới dùng `--f-mn` ngoài danh sách đóng
    xanh_khi: xanh
  - AC4: suite web xanh
    cmd: cd web && npm test

phụ_thuộc: T03-92
