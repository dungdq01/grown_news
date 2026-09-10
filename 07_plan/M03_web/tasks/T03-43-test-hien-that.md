# T03-43 — WO-015: cổng đo HÀNH VI cho hai bug (đơn vị TEST)

> `web/test/hien-that.test.js` (MỚI). ĐỎ trước (R5).
>
> Cả hai bug **không cổng đọc-chuỗi nào thấy được**:
>
> BUG-1 chỉ lộ khi **so trọng số** hai luật. Cổng tính trọng số của mọi luật khớp
> `.api-only[hidden]` và đòi luật `display:none` thắng — đó là phép đo THẬT của
> cascade, không phải "có luật `[hidden]` trong file".
>
> BUG-2 chỉ lộ khi so số trên nhãn với số thẻ **trong MỘT lưới cụ thể**. Cổng đọc
> thân `apLoc` và đòi phép đếm có PHẠM VI là lưới, không phải `document`.
>
> Và **ca âm cho `!important`**: chữa bằng `!important` làm AC1 xanh nhưng tắt mọi
> luật sau — cổng phải bắt được đường tắt đó.
>
> **ĐÍNH CHÍNH (2026-08-28, sau khi đo trên trình duyệt).** Vế "ca âm cho
> `!important`" ở trên **đảo chiều**. Bản sửa không dùng `!important` (thêm
> `:not([hidden])` vào ba luật `.api-only`) làm cổng xanh mà trình duyệt vẫn
> `display: grid`: luật thắng là `.np-form{display:grid}`, một luật THỨ TƯ ngoài
> tập tôi xét. Thêm `:not([hidden])` từng luật là cuộc đua không có đích.
>
> Bản đang chạy là bất biến `[hidden]{display:none !important}`. Ca âm vẫn còn
> nhưng đổi vế: `!important` **chỉ** được dùng cho bất biến đó, không rải sang
> luật `display` nào khác. AC1 dưới đây vẫn đúng nguyên văn; chỉ phương án chữa
> đổi. Lý do đầy đủ ở `prototype.css` cạnh chính luật đó và ở
> `WL-01K9NQWO015.yaml`.

phạm_vi_ghi:
  - web/test/hien-that.test.js
  - web/test/WORKLOG.md
  - web/package.json

verifiability: hard
tiêu_chí:
  - AC1: cổng ĐỎ trên code hiện tại, và nói ra trọng số nào thắng
    cmd: cd web && node test/hien-that.test.js; test $? -ne 0
  - AC2: sau T03-42 XANH, có trong `npm test`
    cmd: cd web && npm test
phụ_thuộc: T03-41
