# T03-84 — bảng khai nhúng không được mang byte chết (đơn vị TEST)

> Sinh ra từ T03-83: WO-037 tốn ~2,1 KB JS trong khi trần chỉ còn 1,8 KB.
> `gn.js` = **102724 / 102400**. Trần này là tripwire đang sát ngưỡng — nới nó
> là bỏ nó (tiền lệ `page-weight.test.js:85-89` *"SIẾT, không nới"*, và plan
> FR-038 R2 nói thẳng: **siết hoặc tách bundle, không nới trần**).
>
> Đo được, ba khoản byte chết trong bundle:
>
> | khoản | byte | vì sao chết |
> |---|---|---|
> | `$magic_la` trong `media-mime.json` | 166 | chú thích cho `magic`, mà `magic` **đã** bị chiếu ra khỏi bundle |
> | `locator` trong `khung-than-bai.json` | 140 | luật của validate phía Python; FE không đọc |
> | `phien_ban` · `tran_tu_mem` · `tran_tu_thu_vien` | 56 | chỉ có mặt trong **khai báo kiểu** TS, không có phép đọc lúc chạy |
>
> `lotComment` lột `$comment*` nhưng **không** lột `$magic_la` — một khoá `$`
> khác tên thì lọt, im lặng. Đó là bản chất của lọc theo tiền tố hẹp.
>
> ## Cổng phải hỏi HAI CHIỀU
>
> Chiếu bảng khai xuống là con dao hai lưỡi, và lưỡi thứ hai mới nguy:
>
> - **chiều A — byte chết**: khoá có trong bundle mà FE không đọc ⇒ tải về vô ích.
> - **chiều B — rơi im lặng**: FE đọc một khoá mà phép chiếu vừa bỏ ⇒ `undefined`
>   lúc chạy, và **không cổng nào đỏ** vì `undefined` chỉ làm form thiếu một ô.
>
> Chiều B là chiều thật sự đắt. Cổng phải quét **phép đọc thuộc tính trong mã
> chạy**, và phải **trừ khối khai báo kiểu** ra — `interface Khung { phien_ban:
> number }` không phải một phép đọc, và tính nó là tính nhầm. Đo nhầm chỗ ở đây
> làm cổng xanh trong khi bundle vừa mất một trường.

phạm_vi_ghi:
  - web/test/bang-khai-khong-mo.test.js
  - web/package.json

verifiability: hard
tiêu_chí:
  - AC1: cổng ĐỎ trên bản hiện tại — chỉ đích danh `$magic_la` và `locator`
    cmd: cd web && node test/bang-khai-khong-mo.test.js
  - AC2: cổng cũng đỏ ở chiều ngược — bỏ một trường FE ĐANG đọc thì đỏ
    cmd: cd web && node test/bang-khai-khong-mo.test.js
