# M18_nguoidung — ui flow

## 0 · Chưa có wireframe, và M18 KHÔNG tự bịa một số SCR

`05_uiux/wireframes/` có `SCR-00` … `SCR-17`. **Không cái nào là quản lý người
dùng.** s5 chưa chạy cho màn này.

⇒ `project_map` khai `screens: []`, và ô nợ mở ở `backlog.md`. Đặt một số SCR
chưa ai vẽ là tạo một con trỏ trỏ vào chỗ trống — `check_ba` sẽ không bắt được,
và người đọc sau sẽ tưởng màn đã có hợp đồng.

> ⚠️ **Ai đặt số mới sẽ vấp ngay: hai hệ đánh số SCR đang LỆCH NHAU.**
> `project_map` khai `SCR-06`/`SCR-07` = màn Tài liệu / nạp tài liệu (M10);
> `05_uiux/wireframes/` có `SCR-06-ba-man-nap.md` và `SCR-07-chung-cat.md`.
> **Hai thứ khác hẳn cùng một số.** Không phải việc của M18 — ô nợ ở M03.

## 1 · Ba thao tác màn admin phải làm được

| thao tác | ai làm | dữ liệu ra |
|---|---|---|
| **mời** một người | chủ dự án | mã hiện **đúng một lần**, không xem lại được |
| **thu hồi** một tài khoản | chủ dự án | `trang_thai` đổi; phiên hết hiệu lực ở lần dùng kế |
| **xem** ai buộc kênh nào | chủ dự án | danh sách `dinh_danh_kenh` |

**Chỉ ba.** Không sửa tên, không đổi vai, không xoá tài khoản:

- **đổi vai** — cột `vai` chưa ai đọc (`M18-R3`). Một ô sửa vai trên UI là một
  cổng chặn dựng trên giá trị chưa ai định nghĩa.
- **xoá tài khoản** — `AC-1.2` cấm; xoá hàng làm mọi `audit_log` trỏ tới nó thành
  mồ côi.

## 2 · Luật riêng của màn này

**a · Mã hiện MỘT LẦN, và màn không có đường xem lại.**
Một màn "xem lại mã đã cấp" biến mã một-lần thành một bí mật nằm trong một màn
hình. Nếu người dùng làm mất mã ⇒ **cấp mã mới**, không phải xem lại mã cũ.

**b · Không hiện `phien.id` và không hiện `ma`.**
Cùng luật với `M18-R2` cho log: thứ không được ghi ra file thì cũng không được vẽ
lên màn. Màn hiện *"đang có 3 phiên mở"*, không hiện id của chúng.

**c · Thông báo lỗi ở màn admin ĐƯỢC phân biệt; ở cửa BUỘC KÊNH thì KHÔNG.**
Đây là chỗ dễ nhầm nhất. `AC-3.3` cấm phân biệt *"chat_id lạ"* với *"có nhưng
chưa buộc"* — nhưng đó là cửa cho **người lạ ở BIÊN**. Màn admin chỉ chủ dự án
mở được, và ở đó thông báo mơ hồ chỉ làm việc quản trị khó hơn mà không bảo vệ
ai. **Hai cửa, hai luật, và trộn chúng là hỏng một trong hai.**

**d · Màn này KHÔNG có nút duyệt bài.**
`B-B1` không đổi một chữ. M18 quản *ai có account*, không quản *ai được duyệt*.

## 3 · Ba trạng thái

| | |
|---|---|
| **empty** | chưa có tài khoản nào ngoài chủ dự án → chỉ đường tạo, không phải một bảng trống |
| **loading** | — đọc từ SSR như các màn khác |
| **error** | API không trả lời → **nói ra**, không hiện danh sách rỗng |

⚠️ **Trạng thái `error` là vế đáng canh nhất của màn này.** Một danh sách tài
khoản rỗng vì API chết trông **giống hệt** một hệ thống chưa mời ai. Ở màn Danh
mục dự án đã vấp đúng lỗi này (`0035fa3` — *"Danh mục kẹt 'đang tải…': ở đó phải
NÓI RA khi tải thất bại"*).

## 4 · Nợ

| nợ | ở đâu |
|---|---|
| **wireframe màn admin** | s5 chưa chạy — ô `[ ]` ở `backlog.md` |
| **hai hệ đánh số SCR lệch nhau** | M03 sở hữu — ô ở `06_modules/M03_web/backlog.md` |
| **quyết định "vai nào làm được gì"** | FR riêng; tới lúc đó màn mới có ô đổi vai |
