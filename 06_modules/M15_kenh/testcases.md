# M15_kenh — testcases

> Mỗi AC **≥1 happy + ≥1 edge**, viết **bằng lời**. `m-test` ở s8 là vai riêng và
> giữ quyền FR ngược về đây (R1).
> **Phép thử s6**: *viết không nổi testcase ⇒ AC mơ hồ ⇒ SỬA AC*. Kết quả ở §cuối.

## 1 · Không nghe gì

**AC-1.1** — 0 cổng listen
- *happy*: tiến trình chạy đủ một vòng (kéo tin → gọi LÕI → gửi lại) → `netstat` cho **0** cổng listen thuộc PID đó.
- *edge*: gieo một `app.listen(3000)` → đỏ.
- *edge 2*: một **thư viện** mở cổng debug (không có dòng nào trong mã ta nhắc tới nó) → **vẫn đỏ**. Đây là ca chỉ phát hiện được bằng **quan sát tiến trình**, không bằng `grep`.

**AC-1.2** — bảng khai giữ `cong: null`
- *happy*: `dich-vu.json` khai `kenh` với `cong: null` và `nghe_ngoai: false`.
- *edge*: đổi `cong` thành một số → đỏ.
- *edge 2*: đổi `nghe_ngoai` thành `true` → đỏ, **và** `check_dung_mot_nghe_ngoai` của M17 cũng đỏ (hai dịch vụ khai `nghe_ngoai`).

**AC-1.3** — chỉ kênh có bề mặt chính thức
- *happy*: adapter trỏ vào một API **có version + tài liệu + ngày tra** ghi trong bảng khai.
- *edge*: gieo một adapter đọc HTML bằng selector CSS → đỏ.
- *edge 2*: bảng khai thiếu `nguon_tai_lieu` hoặc `ngay_tra` cho một kênh → đỏ. (Số của nhà cung cấp đổi mà không ai báo — không ghi ngày tra thì không biết số đã cũ bao lâu.)

## 2 · Ba việc, và chỉ ba

**AC-2.1** — không đọc kho
- *happy*: chạy đủ vòng → 0 lần chạm `kb/**`.
- *edge*: gieo một `readFile(kb/...)` → đỏ, nêu file+dòng.

**AC-2.2** — lệnh từ bảng khai
- *happy*: mỗi lệnh có đúng một dòng `lenh.json` → một endpoint LÕI.
- *edge*: thêm một lệnh bằng `if (text === "/xyz")` trong mã → đỏ.
- *edge 2*: bảng khai một lệnh trỏ tới endpoint **không tồn tại** → đỏ ở **cổng khai báo**, không phải lúc người dùng gõ lệnh đó.

**AC-2.3** — trần 300 dòng/adapter
- *happy*: mỗi file adapter ≤ 300 dòng.
- *edge*: vượt → đỏ, nêu file nào.

**AC-2.4** — M8.2: kênh thứ hai ≤ 20% *(xem §cuối — AC đã sửa)*
- *happy*: sau khi Discord xong, `số dòng adapter Discord ÷ (tổng dòng kenh/ khi chỉ có Telegram)` ≤ **0,20**.
- *edge*: tỉ lệ > 0,20 → đỏ, và thông báo nêu **cả hai số**, không chỉ tỉ lệ — vì hành động sửa khác nhau tuỳ mẫu số nhỏ hay tử số lớn.
- *edge 2*: chỉ có **một** kênh (chưa có Discord) → cổng **bỏ qua**, không đỏ oan.

## 3 · Xác thực người gửi

**AC-3.1** — không tự giữ allowlist
- *happy*: mỗi tin nhắn vào → đúng **một** lời gọi LÕI hỏi `chat_id` thuộc tài khoản nào.
- *edge*: gieo một mảng/file chứa `chat_id` trong `kenh/` → đỏ.
- *edge 2*: LÕI **thu hồi** quyền một tài khoản → tin nhắn kế tiếp từ `chat_id` đó **bị từ chối ngay**, không đợi restart. (Nếu M15 cache thì ca này lộ ra.)

**AC-3.2** — chưa buộc ⇒ từ chối và NÓI RA
- *happy*: `chat_id` đã buộc → xử lý bình thường.
- *edge*: `chat_id` chưa buộc → **trả lời** người gửi rằng chat chưa được buộc; **không** im lặng bỏ tin.
- *edge 2*: `chat_id` **không tồn tại** trong bảng → trả **cùng một** thông báo với ca "có nhưng chưa buộc". Phân biệt hai ca là một phép **đếm tài khoản** cho người lạ (`FR-047 V6`).

**AC-3.3** — audit mọi tin
- *happy*: một tin hợp lệ → một dòng `audit_log` kèm `chat_id`.
- *edge*: một tin **bị từ chối** → **vẫn** một dòng. Chỉ log tin hợp lệ thì một cuộc dò để lại đúng những dòng vô hại.

## 4 · Nạp nội dung

**AC-4.1** — trả nguyên văn lỗi validate
- *happy*: nội dung hợp lệ → nạp thành công.
- *edge*: thiếu `url` → người gửi nhận **nguyên văn** dòng lỗi validate, không phải *"có lỗi xảy ra"*.
- *edge 2*: lỗi validate chứa đường dẫn file tạm nội bộ → **không** được lộ ra tin nhắn (nguyên văn lỗi ≠ lộ đường dẫn máy chủ).

**AC-4.2** — dừng ở `draft`
- *happy*: nạp qua kênh → bản ghi `review_status: draft`.
- *edge*: payload ép `approved` → vẫn `draft`.
- *edge 2*: `grep` một lời gọi `POST /api/articles` trong `kenh/` → đỏ. Đó là **cửa của người** và nó đặt `approved` vô điều kiện.

**AC-4.3** — không bịa nhãn
- *happy*: `category`/`concepts` để **trống**, và bản ghi vẫn hợp lệ (hai trường đó không nằm trong `required`).
- *edge*: bot tự điền một `category` → đỏ.

## 5 · Giới hạn kênh

**AC-5.1** — trần file theo kênh, từ bảng khai
- *happy*: gửi PDF 30 MB qua Telegram (trần 50 MB) → đi.
- *edge*: gửi cùng file qua Discord (trần 10 MiB) → **nói ra trước khi gửi**, gợi ý dùng Telegram; **không** để kênh trả lỗi.
- *edge 2*: `grep` một số trần gõ cứng trong mã → đỏ.

**AC-5.2** — mất tin sau 24h *(xem §cuối — AC đã sửa)*
- *happy*: bot offline 1h rồi dậy → nhận đủ update.
- *edge*: bot offline **>24h**, rồi dậy → ghi một dòng log nêu **khoảng thời gian đã offline** và rằng update trong khoảng đó **có thể đã mất**; không im lặng.
- *edge 2*: bot dậy sau <24h → **không** ghi dòng cảnh báo đó (chặn đỏ oan / cảnh báo nhiễu).

## 6 · Egress bậc 1–2

**AC-6.1** — chỉ gửi `approved`
- *happy*: đẩy một bài `approved` → đi.
- *edge*: gieo một bản `draft` vào đường gửi → **chặn tại M15**, và ghi log.
- *edge 2*: bài `approved` rồi bị **hạ xuống** `rejected` → lần đẩy kế tiếp **không** gửi nó.

**AC-6.2** — đích trong bảng
- *happy*: gọi host Telegram/Discord có trong bảng → qua.
- *edge*: gọi host lạ → **chặn trước khi mở socket** (đo bằng: không có kết nối TCP nào ra host đó).

---

## Kết quả phép thử s6 — hai AC mơ hồ, ĐÃ SỬA

Chạy trên 17 AC: **15 viết được ngay**. Hai cái không:

**a · `AC-2.4` (M8.2) — *"≤ 20% công kênh thứ nhất"* không nói ĐO BẰNG GÌ.**
Bản đầu viết *"đo bằng số dòng adapter mới / số dòng tổng của kênh thứ nhất"* nhưng
**"tổng" gồm những gì** — cả `kenh/` hay chỉ adapter Telegram? Nếu gồm cả hạ tầng
dùng chung (xác thực, dịch lệnh, egress) thì mẫu số phình và tỉ lệ **luôn** đạt,
tức cổng **không đỏ được**. Nếu chỉ tính adapter thì mẫu số nhỏ và một Discord bình
thường **cũng vượt**, tức **đỏ oan**.
⇒ **Đã sửa**: mẫu số = **tổng dòng `kenh/` tại thời điểm chỉ có Telegram** (một số
đã đông cứng, ghi lại được), tử số = **số dòng adapter Discord**. Và cổng phải in
**cả hai số**, vì hành động sửa khác nhau tuỳ mẫu số nhỏ hay tử số lớn.

**b · `AC-5.2` — *"tin nhắn MẤT, và điều đó được ghi log"* không nói làm sao BIẾT.**
Telegram giữ update 24h; bot dậy lại **không có cách nào biết** nó đã bỏ lỡ bao
nhiêu tin — API không nói *"bạn mất N tin"*. Nên testcase *edge* của tôi ban đầu
phải bịa ra một phép đếm không tồn tại.
⇒ **Đã sửa**: không khai *"ghi số tin đã mất"* (không đo được), mà khai *"ghi
**khoảng thời gian đã offline**, và nếu >24h thì nói rằng update trong khoảng đó
**có thể** đã mất"*. Đó là thứ **biết được**, và nó vẫn đủ để người vận hành hành động.

**Bài học chung của hai ca**: cả hai AC ban đầu khai một **con số** mà nguồn của số
đó không tồn tại. Viết testcase là chỗ rẻ nhất để phát hiện — nếu không, s8 sẽ cài
một phép đếm bịa và cổng sẽ xanh.
