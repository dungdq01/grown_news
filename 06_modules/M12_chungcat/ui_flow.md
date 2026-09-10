# M12_chungcat — ui flow

> **M12 KHÔNG CÓ giao diện, và đó là một luật, không phải một thiếu sót.**
>
> `ADR-05` `Z7` + chỉ đạo nguyên văn 2026-08-31: *"các services chatbot / artifact
> / truyhoi / chungcat ... chúng ta chỉ build backend thôi nha. phần giao diện và
> normalize output quy về web hết nhé."*
>
> File này tồn tại vì `check_g6a` đòi 6 artifact. Nội dung nó **không phải** "không
> có gì" — mà là: *giao diện của việc chưng cất sống ở màn nào của `web/`, và ai
> chịu trách nhiệm phần nào.*

## 1 · Màn nào của web phục vụ M12

| màn (`man-hinh.json`) | thao tác | ai sở hữu màn | M12 góp gì |
|---|---|---|---|
| `/tai-lieu/` · `/video/` | chọn một nguyên liệu → **"Chưng cất"** | M03_web | nhận job |
| `/tong-hop/` | chọn **≥2** bản ghi → **"Tổng hợp chủ đề"** | M03_web | nhận job `tong-hop-chu-de` |
| `/` (dashboard) | thấy job đang chạy / đã xong / đã dừng | M03_web | trạng thái job qua API |
| `/kho/` | bản nháp mới hiện ở `draft` chờ duyệt | M03_web | **không** — đó là M02 + M05 |

**M12 không vẽ một pixel nào.** Nó cung cấp **ba thứ để web vẽ**: trạng thái job,
tiến độ, và lý do dừng.

## 2 · Ba thứ web cần, và hình dạng của chúng

```
GET  /trang-thai/<ulid>   →  { ulid, giai_doan, lan_gui, model_da_dung, ly_do_dung }
POST /job                 →  { ulid }            (nhận job, trả ngay, không chờ)
GET  /job                 →  [ { ulid, giai_doan, tao_luc } ]
```

`giai_doan` là **enum**, không phải chuỗi tự do — web hiển thị theo bảng khai, nên
thêm một giai đoạn là thêm một dòng bảng, không phải một `if` trong FE:

`cho` · `dang-doc-nguon` · `dang-goi-model` · `dang-verify` · `xong` · `dung`

## 3 · Chỗ dễ vẽ sai — ba cảnh phải NÓI RA

Ba cảnh dưới đây là chỗ một UI "chạy tốt" nói dối người dùng. Chúng thuộc M03 vẽ,
nhưng **M12 phải trả đủ dữ liệu để vẽ được**, nên khai ở đây:

**a · Job dừng vì hết trần thử lại.** Không được hiện "đang chạy" mãi. `ly_do_dung`
phải phân biệt được *hết trần* với *nguyên liệu sai* với *model từ chối* — ba lý do
này dẫn tới ba hành động khác nhau của người dùng.

**b · Khẳng định bị từ chối vì quote không có thật.** Hàng nháp ghi vào DB có thể
**thiếu** vài khẳng định so với thứ model viết. Người duyệt phải thấy *đã có gì bị
bỏ*, không thì họ đọc một bài trông hoàn chỉnh mà không biết nó đã bị tỉa. M12 trả
số lượng + lý do; M03 quyết cách hiện.

**c · Model thật sự dùng ≠ model được chọn.** Khi dự phòng bắn, web phải hiện model
**đã dùng**. Đây là tiền lệ đã có trong dự án: *"Danh mục kết 'đang tải...': ở đó
phải NÓI RA khi tải thất bại"* (commit `0035fa3`).

**d · HAI nút chạy lại, và chúng KHÁC giá** (`FR-046` §2.1 + spec §5.1):

| nút | từ đâu | tốn egress? |
|---|---|---|
| **Chạy lại** *(mặc định)* | giai-đoạn-hỏng | **0** nếu hỏng sau bước gọi model |
| *Chạy lại từ đầu* *(phụ, tường minh)* | `cho` | **1 lần gửi** — trừ vào `lan_gui` |

⇒ UI phải hiện `lan_gui` (đã gửi mấy/2), và khi `lan_gui = 2` thì nút *"chạy lại từ
đầu"* phải **từ chối kèm lý do**, không im lặng không làm gì. Lý do phải nói được
đường ra: *"tài liệu đã rời máy 2 lần cho job này — tạo job mới nếu thật sự cần"*.

Đây là chỗ một UI "chạy tốt" dễ nói dối nhất: hai nút trông giống nhau, một cái
miễn phí và một cái tiêu một lần dữ liệu rời khỏi máy.

## 4 · Cái CỐ Ý không có ở M12

| | vì sao |
|---|---|
| bất kỳ HTML/CSS/JS nào | `Z7` — thêm một file `.html` vào `chungcat/` là vi phạm khai được |
| chuẩn hoá output để hiển thị | `web` là gateway chuẩn hoá (`dich-vu.json`, vai của `web`) |
| màn "cấu hình model" | `model.json` là **bảng khai trong repo**, sửa bằng sửa file + review — không phải một form ai cũng bấm được |
| thanh tiến độ theo % | không đo được thật. `giai_doan` đếm được; `%` là số bịa |

## 5 · Nợ

**`man-hinh.json` chưa có nút nào của M12.** Bảng khai màn hình chỉ được chứa màn
**đã dựng** (`S18`, bài học C5: khai trước ⇒ `/bai-viet/nap/` thành 500 thật trên
URL chưa ai làm). Nên hai nút *"Chưng cất"* / *"Tổng hợp chủ đề"* vào bảng khai
**cùng lúc** với lần dựng chúng, không trước — và đó là việc của M03, sau khi M12
có API thật.
