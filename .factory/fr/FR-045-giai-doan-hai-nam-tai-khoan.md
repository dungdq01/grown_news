# FR-045 — Giai đoạn 2 đến sớm: 5 tài khoản, session riêng, phân quyền sau

- **mở**: 2026-08-31 · **người quyết**: chủ dự án · **trạng thái**: chờ duyệt
- **artifact chạm**: `03_docs/brd.md` (B-D3, B-B4, B-E1) ·
  `04_system/security_baseline.md` (§1, §4b) · `04_system/adr.md` (ADR-05 Z3) ·
  `core/assets/kho.schema.sql` · `core/assets/dich-vu.json`
- **thay**: `02_proposal/proposal-2-ai-llm-kenh.md` §4 Scope OUT dòng
  *"Multi-user · auth · thanh toán — giai đoạn 2"*

## 0 · Vì sao MỘT FR, không phải năm

Chỉ đạo: *"cả a và b — mỗi người 1 account, sau sẽ có phân quyền nữa, và chat với
bot độc lập theo session từng account"*. **~5 người, là đồng nghiệp.**

Câu đó làm **năm quyết định đã ký** đổ cùng một lượt:

| # | ràng buộc | đang nói gì | sau FR này |
|---|---|---|---|
| 1 | `security_baseline §1` | *"Một người dùng, chạy local. Không auth, không phân quyền, không session"* | **viết lại** |
| 2 | `M08-R1` | *"Localhost **LÀ toàn bộ lớp bảo vệ**"* | **giữ nguyên** — xem §1.1 |
| 3 | `B-E1` bậc 3 | thân bài → người thứ ba: **ĐÓNG** | **MỞ**, có điều kiện |
| 4 | `B-D3` | *"không chia sẻ công khai"*, `quyết định ✅` | **luận lại**, không bỏ |
| 5 | `B-E5` | nghĩa vụ DLCN khi có người dùng khác | **kích hoạt thật** |

Chẻ thành năm FR thì mỗi cái nói nửa sự thật: bỏ auth mà không mở bậc 3 là vô
dụng; mở bậc 3 mà không luận `B-D3` là bỏ qua cổng.

## 1 · Hình dạng chốt

### 1.1 · Web KHÔNG rời `127.0.0.1` — thêm một tiến trình BIÊN đứng trước

```text
Internet ──HTTPS──► cong/ (BIÊN)  ──127.0.0.1──►  web (LÕI, 8787)
                    xác thực            │
                                        └──► chatbot · truyhoi · … (THỢ)
```

**Vì sao thế này chứ không cho `web` tự nghe ra ngoài:**

| | web tự nghe + tự auth | cổng BIÊN đứng trước |
|---|---|---|
| `M08-R1` | **phải viết lại** | **nguyên văn** |
| `api-guard.test.js` | phải sửa | **không sửa một dòng** |
| bề mặt Internet | trong LÕI — vùng có luật *"không nói chuyện với bên ngoài"* | trong **BIÊN** — đúng vùng đã giao việc đó |
| `kenh/` và auth | hai khái niệm | **cùng vùng, cùng luật** |

Đây không phải chọn cho gọn — nó là chỗ **duy nhất** đặt bề mặt Internet mà không
phá một ràng buộc nào đã ký.

**Ngoại lệ cho `Z3`, khai TƯỜNG MINH:** `Z3` hiện là *"không service nào nghe
ngoài `127.0.0.1`"*. Sửa thành: **chỉ dịch vụ khai `nghe_ngoai: true` trong
`core/assets/dich-vu.json` được nghe ngoài loopback, và hiện có ĐÚNG MỘT.**

> Ngoại lệ nằm trong bảng khai thì cổng còn đếm được. Ngoại lệ nằm trong đầu
> người thì lần thứ hai không ai biết là lần thứ hai.

### 1.2 · Bốn bảng, và MỘT cơ chế cho cả web lẫn kênh

```
nguoi_dung(id, ten, vai, trang_thai, tao_luc)
ma_moi(ma, nguoi_dung_id, het_han, dung_luc)
dinh_danh_kenh(kenh, chat_id, nguoi_dung_id, buoc_luc)
phien(id, nguoi_dung_id, kenh, ngu_canh, cap_nhat_luc)
```

- **`vai`** có từ đầu nhưng **chưa dùng** — phân quyền là việc sau. Có cột sẵn thì
  lần thêm phân quyền không phải di trú.
- **`ma_moi` dùng cho HAI việc**: đăng nhập web **và** buộc `chat_id` vào account.
  Một cơ chế, hai lối vào.
- **`dinh_danh_kenh` THAY allowlist phẳng của `B-B4`** — hết một mảng chat-id
  trong `kenh/`; `kenh/` hỏi `web` *"chat-id này thuộc ai"*.

**Không mật khẩu.** 5 người đã biết mặt: lưu hash + luồng reset + hạ tầng email là
việc thật cho một vấn đề chưa có. `ma_moi` một lần, hết hạn, thu hồi được — đủ, và
ít bề mặt hơn hẳn.

### 1.3 · Session riêng mỗi account

`phien.ngu_canh` giữ mạch hội thoại. Hai người hỏi cùng câu trên cùng bot ⇒ hai
`phien` khác nhau, **không thấy ngữ cảnh của nhau**.

`chatbot` **không tự quản session** — nó nhận `phien_id` từ `web` và trả lời không
trạng thái. Lý do: `chatbot` thuộc THỢ, mà THỢ **không được ghi kho**; session là
dữ liệu, dữ liệu ở LÕI.

### 1.4 · `B-D3` — luận lại, KHÔNG bỏ

Câu chữ vỡ: 5 đồng nghiệp đọc là chia sẻ cho bên thứ ba.

Nhưng **lý do gốc còn nguyên**. `security_baseline §4` khai lý do thật:
*"nếu nạp nguồn nội bộ công ty, bản phân tích sẽ chứa thông tin đó → Web phải giữ
private"*.

⇒ `B-D3` viết lại thành **ràng buộc về VÒNG người**, không phải về số người:

> Kho chỉ tới **người trong `nguoi_dung`**. Không SEO, không link công khai, không
> ai đọc được mà không có account. Mở ra ngoài vòng đó ⇒ **FR mới**.

Đó là siết chặt hơn *"private"* mơ hồ: private trước đây nghĩa là *"không ai biết
URL"*; nay là *"có bảng ghi rõ ai được"*.

### 1.5 · `B-E1` bậc 3 — MỞ, có điều kiện

Bậc 3 (thân bài → người thứ ba) mở, **chỉ tới người trong `nguoi_dung`**.

Điều kiện không được bỏ: mỗi lần bậc 3 bắn phải ghi **ai nhận, bài nào, lúc nào**
vào `audit_log`. Cùng lý do `B-E3` đòi log payload gửi model: không log thì câu
*"bài X đã tới tay ai"* không trả lời được, vĩnh viễn.

## 2 · Ràng buộc KHÔNG được nới

1. **`M08-R1` nguyên văn** — `web` bind `127.0.0.1`. Cổng BIÊN chuyển tiếp.
2. **`B-B1` nguyên vẹn** — thêm account **không** thêm ai được `approved`. Chỉ chủ
   dự án duyệt; 5 người kia đọc và hỏi.
3. **`M05-R1` nguyên vẹn** — mọi thứ 5 người nạp vào dừng ở `draft`.
4. **Một cửa ghi** — cổng BIÊN **không** ghi kho, nó chuyển tiếp.
5. **THỢ không giữ session** — session là dữ liệu, ở LÕI.

## 3 · Cổng phải có

| # | Bắt gì | Đỏ khi |
|---|---|---|
| U1 | Đúng **một** dịch vụ khai `nghe_ngoai: true` | hai dịch vụ khai, hoặc `web` khai |
| U2 | `web` vẫn bind `127.0.0.1`/`::1` | `api-guard` — không đổi |
| U3 | `ma_moi` **một lần** và **hết hạn** | dùng lại được, hoặc không có `het_han` |
| U4 | Mỗi lần buộc `chat_id` ghi `audit_log` | buộc mà không có dòng log |
| U5 | Mỗi lần bậc 3 bắn ghi **ai nhận, bài nào** | gửi mà không có log |
| U6 | `chatbot` **không** đọc/ghi bảng `phien` | tham chiếu `phien` trong `chatbot/**` |
| U7 | Không đường nào cho account thường đặt `approved` | `web/api` cho phép `review_status` từ payload |

**U3 là cổng quan trọng nhất.** Buộc `chat_id ↔ account` là nơi lỗi bảo mật sống:
đoán được mã là **thành người khác** trong kho.

## 4 · Nghĩa vụ pháp lý — `B-E5` kích hoạt THẬT

5 đồng nghiệp ⇒ hệ xử lý **dữ liệu cá nhân của người khác**. Theo **Luật BVDLCN
2025 + NĐ 356/2025** (hiệu lực 01/01/2026):

- **hồ sơ đánh giá tác động xử lý DLCN** — Điều 14
- **hồ sơ đánh giá tác động chuyển DLCN xuyên biên giới** — vì tin chat của họ đi
  tới model nước ngoài (`B-E1` bậc 4)
- **chỉ định bằng văn bản** nhân sự/bộ phận bảo vệ DLCN

**FR này KHÔNG giải quyết chúng** — nó chỉ ghi ra rằng chúng đã đến. Đây là việc
giấy tờ của người, không phải của agent, và nó **không chặn thi công kỹ thuật**.

## 5 · Điều FR này KHÔNG làm

- **Không** làm phân quyền. Cột `vai` có sẵn, chưa ai đọc.
- **Không** mật khẩu, không OAuth, không email.
- **Không** cho `web` nghe ra ngoài.
- **Không** cho 5 người kia quyền `approved`.
- **Không** chọn cách chạy cổng BIÊN (Caddy · nginx · tự viết) — việc của s4.
- **Không** ký `FROZEN.lock`. Và **đo lại 2026-09-01: `kho.schema.sql` KHÔNG
  frozen** — bản đầu của FR này khai nó frozen, sai. `FROZEN.lock` chỉ giữ đúng
  một file trong `core/`: `frontmatter.schema.json`. Nên bốn bảng mới thêm được
  **không cần ký**; nợ ký hiện có là của FR-034 · FR-036 · FR-041 · FR-042.
