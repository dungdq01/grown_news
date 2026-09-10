# WO-048 — chi tiết việc dạng NỔI + hàng đợi không ai tiêu thụ

- **mở**: 2026-09-05 · **loại**: cải tiến UI (§1) + bug vận hành (§2) · **module**: M03_web + M12_chungcat
- **mức**: §1 xong, cổng xanh · §2 CHẨN XONG, cần quyết

## §1 · Chi tiết việc: khối trong luồng → panel NỔI  ✅

Chỉ đạo: *"Mục chi tiết việc hiển thị dạng hover, chứ không để như hiện tại
(không smart, mà khi dữ liệu nhiều ⇒ có vấn đề)"*.

Ba chỗ đo được là hỏng, không phải chuyện thẩm mỹ:

| bản cũ | hệ quả |
|---|---|
| `#cc-ct` nằm TRONG luồng | mở một việc là đẩy trang dài thêm, mất chỗ đang đứng |
| nó ở CUỐI lưới | nhiều việc ⇒ thẻ ở đầu trang, chi tiết dưới màn hình — không thấy cùng lúc |
| mỗi lần mở = 1 `fetch` | trả một request cho cả những lần chỉ muốn nhìn qua |

Hợp đồng mới, **hai lối cố ý khác nhau**:

```
HOVER / FOCUS  →  xem nhanh, đọc `CC_DS` đã có trong tay      ⇒ 0 request
BẤM            →  GHIM: `?job=` vào URL + đọc lại từ DỊCH VỤ  ⇒ bản có thẩm quyền
```

`focusin` đi kèm `mouseenter`, không thay thế: hover không phải một API mọi
thiết bị có — chỉ nghe hover là người dùng bàn phím và người dùng cảm ứng
KHÔNG BAO GIỜ đọc được chi tiết. `Escape` đóng bản ghim.

Listener nghe trên `document` (bắt sự kiện nổi lên), không gắn từng thẻ: lưới
vẽ lại mỗi 4 giây theo nhịp poll, và listener gắn từng thẻ rụng theo mỗi lần vẽ.

Panel gắn vào `<body>`, KHÔNG vào `#cc-goc`: `position:fixed` bị một cha có
`transform` biến thành neo mới, và `.pn` của trang này có `transform` trong hiệu
ứng `rise`. Đó là lớp lỗi chỉ ảnh chụp thấy — panel nằm đúng toạ độ tính ra,
nhưng so với một gốc khác.

**Style đặt từ CHUNK, không khai trong `prototype.css`** — và đây là số đo, không
phải sở thích: `prototype.css` đi vào `gn.css`, bundle CHUNG của MỌI trang, và
sáu dòng ấy đẩy nó lên **102524/102400**. `FR-061` cấm nới bundle chung. Panel
của MỘT màn, do chunk của màn đó tạo, thuộc về chunk đó — cùng lập luận
`T03-102` dùng cho JS theo màn. Khung + `dl` dùng lại `.gem` (đã có viền, nền
kính, bộ `dl/dt/dd` đúng hình dạng này).

**Đo:** `node web/test/chung-cat-hover.test.js` pass (14 vế, đỏ 9/9 trước khi
viết mã) · `cd web && npm test` exit 0 · `gn.css` 102383/102400 · `gn.js`
99003/102400.

### Một phép đo tôi đã BỎ, và vì sao

Vế `AC6` bản đầu cắt thân `ccDatCho` bằng đếm ngoặc rồi soi trong đó. Nó trả
`""` **trong khi cùng phép cắt chạy đúng** cho `ccXemNhanh` và `ccMoChiTiet` ở
ngay trên. Tôi không giải thích nổi vì sao, và tôi đã định nới con số cho vừa —
đó là sửa thước. Thay bằng phép đo không cần cắt: *"không chỗ nào của MÀN NÀY
animate thuộc tính layout"*, phạm vi do chính file chunk giới hạn. Một cổng đỏ
mà không ai giải thích được là cổng dạy người ta bỏ qua màu đỏ.

## §2 · Vì sao KHÔNG việc nào được xử lý — chẩn xong

Chỉ đạo: *"tại sao các bản chưng cất chưa có cái nào xử lý cả"*.

**Nguyên nhân gốc: KHÔNG có tiến trình worker nào chạy.** Đo:

```
netstat  :8787 → node server.mjs        (PID 4652)   ✅
         :8790 → chungcat/src/api.py    (PID 1768)   ✅
worker                                                ❌ KHÔNG CÓ
```

Hai cửa nhận việc sống, không ai tiêu thụ. Chứng minh bằng cách chạy một vòng:

```
$ CHUNGCAT_HANG_DOI=…/hd-e2e python chungcat/src/worker.py --mot
[worker] 251ceb82… · xong · citations_sampled 1 · citations_verified 1
```

⇒ Worker KHÔNG hỏng. Nó chỉ chưa được bật.

### Hai thứ đo thêm, cả hai đáng sửa

**(a) Hàng đợi đang dùng là thư mục TẠM.** `api.py` chạy với
`CHUNGCAT_HANG_DOI=%TEMP%/hd-e2e` (còn sót từ phiên E2E), nên:

```
%TEMP%/hd-e2e     new 1 · cur 13 · done 4   ← nơi việc THẬT đang nằm
chungcat/hang-doi new 6 · cur  0 · done 0   ← nơi ai đọc repo cũng tưởng
```

`POST /api/job` trả 201 và **không file nào xuất hiện trong repo** — đúng hình
dạng lỗi `goc_mac_dinh()` sinh ra để dẹp, chỉ lần này lệch qua ENV chứ qua mã.
Sửa: restart `api.py` mà không mang biến đó.

**(b) 13 việc BỎ RƠI trong `cur/`, và màn quản lý gọi chúng là "đang chạy".**
`cur/` là "đã lấy ra xử lý". Worker chết giữa việc thì việc ở lại đó **vĩnh
viễn**: không ai nhận lại, không ai báo. KPI đọc `new`+`cur` nên nó nói *"đang
chạy 6"* trong khi **không tiến trình nào** giữ việc nào.

Đó là một con số NÓI SAI, không phải một con số chưa đẹp. Người đọc màn này kết
luận "hệ đang làm việc" trong khi hệ đang đứng. Sửa đúng cần THỢ phân biệt
*claimed-và-còn-sống* với *claimed-rồi-bỏ-rơi* (hạn treo + đường nhận lại), tức
đổi hợp đồng `/viec` — **ngoài phạm vi WO này**, và nó cần một quyết định:
việc bỏ rơi thì tự nhận lại, hay chờ người bấm?

**(c) Vài việc ở `gửi 2/2`** — trần `M12-R6`, không reset. Chúng KHÔNG BAO GIỜ
chạy xong được; câu đúng là tạo việc mới. Panel đã nói ra điều đó.

## Việc người cần làm để hàng đợi chạy

```bash
# 1 · dừng api.py đang mang biến hàng đợi tạm, bật lại sạch
#     (nó cũng đang giữ khoá CŨ — `.env` đã đổi sau khi nó khởi động)
# 2 · bật worker
python chungcat/src/worker.py            # vòng lặp
python chungcat/src/worker.py --mot      # một việc, để thử
# 3 · restart `node server.mjs` — nó đọc asset lúc khởi động, nên panel mới
#     chỉ xuất hiện sau restart (đo: `/gn-chungcat.js` đang phục vụ bản CŨ)
```

· object: `web/plugins/chungcat/src/chungcat.inline.ts` ·
  `web/styles/prototype.css` · `web/test/chung-cat-hover.test.js` ·
  `web/package.json`
