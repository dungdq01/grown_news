# T03-49 — WO-018: cổng cho ô mô tả + nút nạp trên màn nạp (đơn vị TEST)

> `web/test/mo-ta-va-nut-nap.test.js` (MỚI). ĐỎ trước (R5).
>
> **§1 · ô mô tả.** Hai màn nạp có `tv-1l`/`vd-1l` (câu tóm tắt) nhưng **không**
> ô nào cho mô tả, và hai hàm gửi đặt `body: motCau` — tức thân bài LẶP LẠI câu
> tóm tắt. Phép kiểm đòi: có ô mô tả, và hàm gửi lấy thân bài TỪ ô đó.
>
> Ca âm: nếu ô có mà hàm gửi vẫn dùng `motCau` thì §1 "có ô" vẫn xanh trong khi
> giá trị người dùng gõ không đi đâu — cùng bệnh WO-016 đã trúng với ô nhãn.
>
> **§2 · ô nhãn nhìn thấy được.** `tv-cat`/`vd-cat` đã có (WO-016) nhưng nằm
> trong khối mang `hidden`. "Có trong DOM" là markup; "người mở màn thấy nó" là
> thứ khác. Phép kiểm đòi hai ô KHÔNG nằm trong khối `hidden` nào.
>
> **§3 · nút nạp trên màn nạp.** `nutNap` giải ra chính màn đang đứng: trên
> `/tai-lieu/nap/` nó trả `data-nav="naptailieu"`. Nút chết. Phép kiểm đòi: trên
> mỗi màn nạp, header mời các lối **khác**, và lối đang mở được đánh dấu chứ
> không phải là đích của một nút.
>
> **§4 · dòng liệt kê nơi phát KHÔNG gõ tay.** Dải lối video ghi
> `youtube · tiktok · douyin · bilibili` còn whitelist có **hai** host — chữ trên
> màn nói dối. Phép kiểm so dòng đó với `media-mime.json` và đòi chúng khớp.

phạm_vi_ghi:
  - web/test/mo-ta-va-nut-nap.test.js
  - web/test/WORKLOG.md
  - web/package.json

verifiability: hard
tiêu_chí:
  - AC1: cổng ĐỎ trên code hiện tại, nói ra màn nào thiếu gì
    cmd: cd web && node test/mo-ta-va-nut-nap.test.js; test $? -ne 0
  - AC2: sau T03-50 XANH, và có trong `npm test`
    cmd: cd web && npm test
