# WO-081 — Danh sách việc sắp theo id NGẪU NHIÊN; panel transcript xong hiện sai thứ

- **Loại**: bug + cải tiến · **Module**: M12_chungcat + M03_web · **Mức**: hard
- **Task**: `T12-37` (thứ tự) · `T03-135` (panel)
- Chủ dự án 2026-09-09: *"transcript đã xong là hiển thị kết quả transcript
  luôn… button «chưng cất từ transcript» đổi sang màu Xanh Lam và để ở footer"*

## 1 · Thứ tự việc — một lý lẽ đúng cho một tiền đề SAI

`vong.liet_ke` (`:283`) sắp **ULID giảm dần**, và lập luận rất kỹ:

> *"ULID mang thời điểm trong chính nó, còn `mtime` là thứ `git checkout`, một
> lần copy thư mục, hay một lần `touch` đổi được"*

Lập luận ấy đúng — **với ULID thật**. Nhưng id ở đây là **`uuid.uuid4().hex`**
(`api.py:404`), tức **ngẫu nhiên hoàn toàn**. Chính chú thích ở `tho-cua.mjs:326`
đã ghi *"Id việc là `uuid.uuid4().hex`"* — hai chỗ, hai hiểu biết khác nhau về
cùng một trường.

⇒ Danh sách việc **xếp ngẫu nhiên**. Đo 2026-09-09: API trả **18** việc (17
`xong`), tab Kết quả vẽ 8 ô đầu — và một việc vừa chạy xong **không bao giờ lên
màn** vì id nó bắt đầu bằng `9`, xếp dưới `a…`–`d…`.

Đây là lý do tôi không mở nổi panel mình vừa sửa để nghiệm thu.

**Sửa**: ghi `tao_luc` (UTC ISO) vào việc lúc `nap()`, sắp theo nó. Đó chính là
thứ chú thích cũ muốn — một thời điểm **nằm trong file**, không phải `mtime`.
Việc cũ không có trường ⇒ rơi về id, không vỡ.

## 2 · Panel "Sinh transcript · đã xong" hiện tờ giấy chỉ đường

Bản cũ chiếm cả cửa sổ bằng đoạn *"Mở tab Transcript ở cửa sổ bản ghi để đọc"* —
bắt người đi một chặng nữa để xem thứ vừa làm xong, trong khi chỗ họ đang nhìn
thừa sức hiện nó.

**Sửa**: hiện chính transcript; câu kia rút thành **một dòng xanh lá** (nó vẫn
nói một sự thật cần biết: transcript là hiện vật của bản ghi, không vào hàng
nháp). Nút **Chưng cất từ transcript** xuống **footer** (`.bt-bt`, cùng khe với
"Duyệt vào kho"), màu **xanh lam** `--c-video` — token đã có, và đúng nghĩa: đây
là hành động trên một bản ghi video.

## Ràng buộc

- Không thêm token màu mới cho một sắc thái.
- Cửa sổ VIỆC không có `ban` trong tay, chỉ có `slug` ⇒ đọc transcript qua đúng
  hai cửa mà tab Transcript đã dùng, không mở đường đọc thứ ba.
