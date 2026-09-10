# M17_cong — ui flow

> **M17 KHÔNG CÓ giao diện** (`Z7` · `AC-2.3`) — và ở đây điều đó gắt hơn năm module
> kia: M17 là tiến trình **đối mặt Internet**, nên một trang HTML trong `cong/` là
> một bề mặt tấn công thêm cho không.
>
> Nhưng M17 quyết định **hai luồng người dùng thật**, và cả hai chưa ai vẽ.

## 1 · Hai luồng M17 quyết định, ai vẽ chúng

| luồng | người dùng làm gì | ai vẽ | trạng thái |
|---|---|---|---|
| **nhận `ma_moi` → có tài khoản** | mở link/nhập mã một lần → được buộc | **M03_web** | ⚠️ **chưa có màn nào** |
| **buộc `chat_id` với tài khoản** | từ Telegram/Discord, buộc chat của mình | **M03 + M15** | ⚠️ **chưa có màn nào** |

**M17 không vẽ pixel nào**, nhưng nó là chỗ hai luồng trên **thành công hay thất
bại**, và nó phải trả đủ dữ liệu để web nói ra sự thật.

## 2 · Bốn thứ phải NÓI RA — và một thứ phải KHÔNG nói

**a · Mã sai / hết hạn / đã dùng — ba lý do khác nhau.** Người dùng cần biết mình
nên xin mã mới (hết hạn) hay đã buộc rồi (đã dùng) hay gõ sai. Gộp thành *"mã không
hợp lệ"* là xoá thông tin họ cần.

**b · Bị rate limit ⇒ nói ra, kèm thời gian chờ.** Không im lặng bỏ request — im
lặng thì người dùng thật gõ lại liên tục và tự đẩy mình sâu hơn vào giới hạn.

**c · Đã buộc thành công ⇒ nói rõ buộc vào tài khoản nào.** Nếu không, một người
buộc nhầm vào tài khoản khác sẽ không phát hiện.

**d · Chưa buộc ⇒ nói rõ đang chưa buộc.** Đây là cùng ca `AC-3.2` của M15 — im lặng
thì 5 đồng nghiệp gửi tin vào một bot không trả lời và không biết vì sao.

> ⚠️ **Thứ phải KHÔNG nói: bất cứ gì về kho.** Thông báo lỗi của M17 không được
> tiết lộ có bao nhiêu tài khoản, tài khoản nào tồn tại, hay kho có gì. Một thông
> báo *"tài khoản này không có mã nào đang chờ"* đã là một phép **đếm tài khoản**
> cho người lạ.

## 3 · Vì sao `cong/` KHÔNG được có một trang lỗi HTML

Một trang lỗi tự vẽ trong `cong/` nghe vô hại, nhưng:

- nó là **bề mặt thêm** trên tiến trình đối mặt Internet
- nó là **bản thứ hai** của luật trình bày (`web` là gateway chuẩn hoá output)
- và nó **rò thông tin**: một trang lỗi tự vẽ thường mang tên dịch vụ, version, đôi
  khi cả stack trace

⇒ M17 trả **mã lỗi + JSON tối giản**; `web` quyết cách hiện.

## 4 · Cái CỐ Ý không có

| | vì sao |
|---|---|
| bất kỳ HTML/CSS/JS trong `cong/` | `AC-2.3` · `Z7` — và bề mặt tấn công |
| trang lỗi tự vẽ | §3 |
| màn quản trị tài khoản | thuộc `web/` (LÕI quản lý user), không thuộc BIÊN |
| form mật khẩu | `security_baseline` §1.1 — **không có mật khẩu**, chỉ `ma_moi` một lần |
| CAPTCHA | rate limit + entropy ≥128 bit là phép chặn đúng chỗ hơn; CAPTCHA thêm một nhà cung cấp bên thứ ba vào đường xác thực |
| thông báo nêu tên tài khoản khi CHƯA xác thực | §2 — đó là một phép đếm tài khoản cho người lạ |

## 5 · Nợ

**Hai màn của §1 chưa tồn tại.** Cho tới lúc đó, việc buộc `chat_id ↔ tài khoản` là
**thao tác tay của chủ dự án trên DB** — và điều đó phải được **nói ra** với 5 đồng
nghiệp, không để họ gửi tin vào một bot im lặng.

**`man-hinh.json` KHÔNG được khai hai màn đó trước khi dựng** — bài học `S18`/C5:
bảng khai chứa màn chưa dựng thì `server.mjs` dẫn xuất `VIEW_SSR` từ nó và URL đó
thành **500 thật** trên đường người dùng.

**Ngôn ngữ `cong/` chưa chọn** (Caddy · nginx · tự viết). Chọn Caddy/nginx thì "trả
JSON tối giản" là một cấu hình; tự viết thì nó là mã. Hai đường có bề mặt tấn công
khác nhau — và câu đó s4 quyết, không phải s6.
