# SCR-06 · Ba màn nạp — HỢP ĐỒNG một format chung

> **Bản này KHÔNG vẽ trước.** Ba màn đã dựng xong (C6) rồi mới có nó, nên nó
> không phải bản thiết kế — nó là **hợp đồng ghi lại**: cái gì phải giống nhau
> giữa ba màn, cái gì được khác, và vì sao. Ghi ra vì thứ này đã trôi **hai lần**
> và cả hai lần đều chỉ lộ khi người dùng nhìn thấy:
>
> 1. **WO-021** — ba form lệch bộ trường; người dùng: *"format của viết bài và
>    nạp tài liệu / video chưa đồng bộ form input"*.
> 2. **WO-024** — WO-021 chữa **cột form** nhưng dải tab nằm ngoài phạm vi đó,
>    nên hai màn vẫn lệch trái. Chữa một nửa màn rồi đo đúng nửa đã chữa.
>
> **Con số ở đây không phải nguồn.** Bộ trường do `format-chung.test.js` §1 canh
> bằng **tập giao và tập hiệu**; bố cục do §5–§6 canh. Khi hợp đồng đổi, chỗ đỏ
> là cổng — bản vẽ này chỉ nói *vì sao*.

## Ba màn, ba đường dẫn

| màn | path | shell | tiền tố id |
|---|---|---|---|
Nạp bài viết | `/bai-viet/nap/` | `v-napbaiviet` | `f-` |
Nạp tài liệu | `/tai-lieu/nap/` | `v-naptailieu` | `tv-` |
Nạp video | `/video/nap/` | `v-napvideo` | `vd-` |

## Bố cục — MỘT cột, căn giữa

```
┌─ panel (1344px) ──────────────────────────────────────────────────────────┐
│                                                                            │
│      ┌─ .np-tw  max-width:52rem · margin-inline:auto ─────────────┐        │
│      │  ┌─ .np-tabs  grid-auto-flow:column ──────────────────┐    │        │
│      │  │ [ lối 1 ] [ lối 2 ] [ lối 3 ]                      │    │        │
│      │  └───────────────────────────────────────────────────┘    │        │
│      └──────────────────────────────────────────────────────────┘        │
│      ┌─ .np-p   max-width:52rem · margin-inline:auto ──────────────┐       │
│      │   border-top 3px  ← MÀU THEO LỐI, không theo màn            │       │
│      │                                                              │       │
│      │   .f-row   max-width:40rem                                   │       │
│      │   ┌────────────────────────────────┐                         │       │
│      │   │ nhãn                            │  ← nhãn TRÊN ô          │       │
│      │   │ [ ô nhập                      ] │                         │       │
│      │   └────────────────────────────────┘                         │       │
│      └──────────────────────────────────────────────────────────────┘       │
└────────────────────────────────────────────────────────────────────────────┘
   ≤1080px: .np-tabs → grid-auto-flow:row  (tab xếp dọc)
```

**Ba ràng buộc, mỗi cái có một lý do đã trả giá:**

- **`.np-tw` và `.np-p` cùng `max-width` và cùng `margin-inline:auto`.** Lệch nhau
  thì màn có **hai mép trái** và mắt thấy ngay. §5 canh vế này.
- **`margin-inline:auto` phải đi kèm `max-width`.** `auto` một mình không căn được
  gì — nó cần một bề rộng để chia phần dư.
- **`.np-tabs` KHÔNG đếm cứng số cột** (`grid-auto-flow:column`). Ba màn có số tab
  khác nhau (3 · 1 · 1); một `repeat(3,1fr)` làm tab đơn nhét vào 1/3 đầu và bỏ
  trống 2/3 — WO-024. Và với `auto-flow: column` thì `grid-template-columns` **vô
  hiệu**, nên truy vấn hẹp phải đổi chính `grid-auto-flow`.

**Điều KHÔNG được làm để chữa lệch trái:** kéo ô nhập rộng cả panel. `.np-p .f-row`
chặn ở `40rem`; một dòng chữ dài hơn thế thì mắt mất hàng khi xuống dòng. §5 có ca
âm cho đúng cách chữa sai này.

## Phần GIỐNG nhau — năm trường cố định

Cùng nhãn, cùng thứ tự, ở **cả ba** màn:

```
  Tiêu đề        [ ................................ ]   nên có
  Một câu tóm tắt[ ................................ ]   bắt buộc
  Mô tả          [ ................................ ]   ≤ 400 từ
                 [ ................................ ]
  Chủ đề         [ ☐ … ☐ … ] từ danh mục                nên có
  Khái niệm      [ ☐ … ☐ … ] từ danh mục                nên có
```

- **`Một câu tóm tắt` là trường duy nhất thật sự bắt buộc** — `one_liner` nằm
  trong `required` của schema. Bốn trường kia thì không.
- **Nhãn NHẮC, không CHẶN.** Người dùng chốt: *"các fields cố định thì up gì lên
  cũng nên hiển thị lên UI — ko hẳn cần require"*. Cổng module đã bỏ vế `nhanDu`;
  thiếu chủ đề/khái niệm vẫn **201**. Hệ quả đã nói ra: facet Chủ đề rỗng dần nếu
  bỏ qua thường xuyên — đó là cái giá đã biết, không phải bất ngờ.
- **Một ô ghi "bắt buộc" mà server nhận khi trống là màn NÓI SAI về luật.** §4 canh
  vế này. *Còn một chỗ chưa khớp*: `#f-title` trên màn bài viết vẫn mang thuộc tính
  `required` (ô nằm trong `<form>`, `#f-gui` là `type="submit"` ⇒ trình duyệt chặn
  thật) trong khi hai màn kia ghi *"nên có"* — ô backlog M01_core, **phụ thuộc
  WO-023**: nới trước khi có đường lùi cho tiêu đề rỗng là chủ động sinh thẻ không
  tên.

## Phần ĐƯỢC KHÁC — đúng cái đang nạp, không hơn

```
 BÀI VIẾT  3 lối          TÀI LIỆU  1 lối         VIDEO  1 lối
 ┌──────┬──────┬──────┐   ┌──────────────────┐    ┌──────────────────┐
 │ Dán  │ Nộp  │ TỰ   │   │ Chọn tệp         │    │ Dán URL          │
 │ link │ file │ VIẾT │   └──────────────────┘    └──────────────────┘
 └──────┴──────┴──────┘
   + URL nguồn            + khối HIỆN VẬT         + kiểm HOST tại chỗ dán
   + Loại nguồn             #tv-hv · -ten · -cd     ✓ youtube · id …
   + Ngày phân tích         [ thay hiện vật ]       ✕ ngoài danh sách nhận
   + Thân bài (khung 5 mục)
```

- **Khối hiện vật của tài liệu là CƠ CHẾ, không phải trang trí.** Trước nó, sửa
  một tài liệu đưa bản ghi vào form bài viết — form không có ô nào cho `media`, và
  chỉ `FM_GOC` giữ hộ. `sha256` không đổi là **kết quả**; ô trên form là **cơ chế**.
  Một kết quả đúng nhờ may thì vẫn đúng — cho tới hôm nó không.
- **Kiểm host ngay lúc dán**, không đợi `422`. Cùng lý do với `file.size` của tài
  liệu: người dùng gặp lỗi ở chỗ họ vừa gõ, không ở chỗ họ vừa bấm. Whitelist đọc
  từ `media-mime.json:video_host`, **không gõ tay tên miền**, và so theo **hậu tố
  có dấu chấm** — `includes("youtube.com")` khớp cả `youtube.com.ke-xau.example`.
- **Thân bài chỉ có ở màn bài viết**, và số ô = số mục **lá** của
  `khung-than-bai.json` (SCR-05). Tài liệu/video không có khung: nội dung của
  chúng là **file** hoặc **địa chỉ**, thân bài chỉ là ghi chú.

## Bốn trường đã GỠ — không có ô, nhưng VẪN vào payload

`Mã bài` (`id`) · `Tên đường dẫn` (`slug`) · `Tin cậy tối đa` (`credibility_max`)
· `Mức đầy đủ` (`conformance`).

Người dùng: *"Cất ở đâu trong kho / Tin cậy tối đa / Mức đầy đủ → chưa cần thiết"*.

**Vế dễ quên, và §2 canh nó:** schema đòi cả bốn. Gỡ ô mà không tự điền thì mọi
lần bấm Ghi là **422** — và cái 422 đó xuất hiện *sau khi* người dùng đã gõ xong
cả form. Nên phép kiểm đòi **hai vế**: không có ô, **và** hàm gửi có giá trị.

## Cổng canh hợp đồng này

`web/test/format-chung.test.js` — §1 bộ trường (tập giao + **tập hiệu**: thêm ô
vào một màn mà quên hai màn kia thì "màn A có tiêu đề" vẫn xanh) · §2 bốn trường
đã gỡ · §3 không chặn (đo qua **HTTP thật**, không đọc chuỗi trong
`cong-module.mjs`) · §4 nhãn "nên có" · §5 cột form căn giữa · §6 dải tab không
đếm cứng.

Riêng ba màn: `man-nap-rieng` · `nap-ba-khung` · `mo-ta-va-nut-nap` ·
`o-nhan-nap` · `nap-video` · `man-tai-lieu` · `man-video`.
