# M15_kenh — ui flow

> **M15 KHÔNG CÓ giao diện web** (`Z7`). Nhưng nó là module duy nhất có một **giao
> diện thật mà ta không sở hữu**: cửa sổ chat của Telegram và Discord.
>
> Đó là điểm khác biệt lớn nhất so với năm module còn lại. Ta không vẽ được nó,
> không đổi CSS của nó, và không kiểm được nó bằng `markup-matches-css`. Ta chỉ
> quyết **nội dung tin nhắn**.

## 1 · Giao diện của M15 là tin nhắn — và tin nhắn là hợp đồng

| người dùng làm gì | M15 làm gì | ai vẽ |
|---|---|---|
| gõ một lệnh trong chat | tra `lenh.json` → gọi API LÕI | Telegram/Discord |
| gửi một URL / PDF | nạp → **dừng ở `draft`** | Telegram/Discord |
| hỏi một câu | `POST /hoi` → M14 | Telegram/Discord |
| nhận bản tin đẩy | chỉ nội dung **đã `approved`** | Telegram/Discord |

**Không màn nào của `web/` thuộc M15.** Nhưng `man-hinh.json` sẽ cần **một màn quản
lý kênh** ở giai đoạn sau (buộc `chat_id ↔ tài khoản`) — và màn đó thuộc **M03 +
M17**, không phải M15.

## 2 · Bốn thứ tin nhắn phải NÓI RA

**a · Chưa buộc tài khoản ⇒ từ chối, và NÓI.** Im lặng bỏ tin thì người gửi không
biết vì sao không có gì xảy ra, và họ gửi tiếp mãi. Thông báo **không được tiết lộ
gì về kho** — chỉ nói *"chat này chưa được buộc vào tài khoản nào"*.

**b · Validate trượt ⇒ trả NGUYÊN VĂN lỗi.** Chỉ đạo lượt 12: *"sai / validate fail
trả respond ngoại lệ - báo lỗi"*. Một câu *"có lỗi xảy ra"* là xoá đúng thông tin
người gửi cần để sửa.

**c · Nạp xong ⇒ nói rõ nó đang ở `draft`.** Người gửi phải biết bài **chưa** lên
kho — nếu không họ tưởng đã xong và không quay lại duyệt. Đây là cùng lớp với tiền
lệ *"Danh mục kết 'đang tải...': ở đó phải NÓI RA khi tải thất bại"* (commit
`0035fa3`).

**d · Vượt trần file ⇒ nói TRƯỚC khi gửi.** Discord 10 MiB, Telegram 50 MB. Để kênh
tự trả lỗi thì người dùng nhận một thông báo của Telegram, không phải của ta, và nó
không nói được *"dùng Telegram cho file này"*.

## 3 · Cái CỐ Ý không có

| | vì sao |
|---|---|
| màn quản trị trong `kenh/` | `Z7`; và BIÊN không được có bề mặt quản trị |
| nút bấm / inline keyboard phức tạp | mỗi nút là một trạng thái, và M15 **không giữ trạng thái** |
| render markdown của kho ra tin nhắn | web chuẩn hoá output (`dich-vu.json`, vai của `web`) |
| gửi bản `draft` để "xem trước" | `M15-R5` — gửi rồi không hoàn tác được |
| trả lời khi chưa buộc tài khoản | `AC-3.2` — từ chối, và nói ra |

## 4 · Nợ

**Màn buộc `chat_id ↔ tài khoản` chưa tồn tại.** `FR-045` khai bảng
`dinh_danh_kenh` nhưng chưa ai vẽ đường để một người **tự** buộc chat của mình. Cho
tới lúc đó, việc buộc là **thao tác tay của chủ dự án** trên DB — và điều đó phải
được nói ra, không để 5 đồng nghiệp gửi tin vào một bot im lặng.

**`man-hinh.json` KHÔNG được khai màn quản lý kênh trước khi dựng** — bài học
`S18`/C5: bảng khai chứa màn chưa dựng thì `server.mjs` dẫn xuất `VIEW_SSR` từ nó
và URL đó thành **500 thật**.
