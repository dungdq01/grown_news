# FR-043 — Dữ liệu GỬI RA ngoài: bốn bậc, và bậc nào đang mở

- **mở**: 2026-08-31 · **người quyết**: chủ dự án · **trạng thái**: đã duyệt
- **artifact chạm**: `04_system/security_baseline.md` (thêm §4b) — **không** frozen,
  nhưng là artifact tầng trên nên đổi qua FR để có id cho cổng và worklog trỏ về
- **đóng**: Q4 của `02_proposal/proposal-2-ai-llm-kenh.md` · **mở khoá**: S11

> ⚠️ **BẬC 3 ĐÃ MỞ — `FR-045`, 2026-09-01.** FR này (08-31) khai bậc 3 đóng và
> nêu điều kiện mở là *"một FR riêng nhắm vào `brd.md`"*. `FR-045` chính là FR
> đó: `B-D3` được luận lại thành `B-D3b` (*vòng người, không phải số người*).
> Mọi câu "bậc 3 đóng" dưới đây là **hồ sơ của quyết định 08-31**, không phải
> luật đang hiệu lực. Luật hiện hành: `brd.md` B-E1 + B-D3b.

## 0 · Vì sao FR này tồn tại

Hai luật hiện có kẹp dự án từ hai phía, và **để hở đúng ở giữa**:

| luật | ở đâu | cấm gì |
|---|---|---|
| **B-D3** | `brd.md:174` — *"Web chạy local hoặc private. Không SEO, không chia sẻ công khai."* | cấm **CÔNG BỐ** |
| **security_baseline §4** | *"Nghe ngoài `127.0.0.1` ⇒ phải thêm auth + xem lại B-D3 trước, FR riêng."* | cấm **NGHE VÀO** |

**Không luật nào nói về GỬI RA.**

Nhưng lý do của cả hai thì nói: *bản phân tích có thể chứa nguồn nội bộ công ty*.
Gửi một PDF nội bộ tới model đám mây **chính là** đưa nội dung đó ra ngoài — chỉ
qua một cửa mà chưa luật nào đứng canh.

Đây là **lỗ hổng trong luật, không phải vi phạm luật hiện có** — nên nó phải được
lấp bằng một quyết định, không bằng một bản vá kỹ thuật.

Phạm vi đợt hai (chatbot + tích hợp đa kênh) mở lỗ này thành **bốn bậc cùng lúc**.
FR này khai từng bậc.

## 1 · Bốn bậc, và trạng thái từng bậc

| bậc | hành vi | cái gì rời khỏi máy | tới ai | trạng thái |
|---|---|---|---|---|
| **1** | adapter kéo update từ kênh | bot token · nội dung request | nhà cung cấp kênh | ✅ **MỞ** |
| **2** | bot trả phản hồi thao tác | slug · tiêu đề · thông báo lỗi | **chính chủ dự án** | ✅ **MỞ** |
| **3** | bot gửi **thân bài** cho người khác | nội dung kho | **người thứ ba** | ⛔ **ĐÓNG** |
| **4** | chưng cất bằng model | **tài liệu nguồn**, thân bài | nhà cung cấp model | ✅ **MỞ** — giai đoạn 1 |

### Bậc 1 và 2 — MỞ

Đúng phạm vi người quyết nêu: *"liên quan input tích hợp để nhận / gửi request thì
open hết"*. Bậc 2 chỉ gửi về **chính chủ dự án** qua kênh riêng của họ, nên nó
không phải công bố.

### Bậc 3 — ~~ĐÓNG~~ → **MỞ 2026-09-01 bởi `FR-045`**

> FR này (08-31) khai bậc 3 đóng, và điều kiện mở là *"một FR riêng nhắm vào
> `brd.md`"*. `FR-045` chính là FR đó. Giữ nguyên văn dưới đây làm hồ sơ của
> quyết định 08-31 — **không đọc nó như luật đang hiệu lực**.

Đây là bậc duy nhất mà nội dung kho tới **người khác**. B-D3 là quyết định **đã
đóng dấu** (`brd.md:214` — `quyết định ✅`), nên đảo nó cần một FR riêng nhắm vào
`brd.md`, không phải một dòng trong FR này.

**Không chặn gì hiện tại**: bậc 3 chỉ cần khi bắt đầu dạy bạn bè, tức sau S14.

### Bậc 4 — MỞ cho giai đoạn 1, kèm ràng buộc BẮT BUỘC

Tài liệu của chủ dự án, model do chủ dự án chọn, hệ chạy cho một người. Đó là
quyết định về dữ liệu của chính mình.

**Ràng buộc không được bỏ**: mọi lời gọi model phải **ghi log `sha256` của thứ đã
gửi**. Lý do không phải thủ tục — mà là: sau này còn biết **cái gì đã rời máy**.
Không có log thì câu hỏi "tài liệu X đã từng gửi ra chưa" là không trả lời được,
vĩnh viễn.

**Giai đoạn 2 sẽ phải xem lại bậc này**: khi có người dùng khác, tài liệu họ gửi
không phải tài liệu của chủ dự án nữa, và **NĐ 356/2025 Điều 14** đòi hồ sơ đánh
giá tác động **chuyển dữ liệu xuyên biên giới**. Ghi ở đây để giai đoạn 2 không
phát hiện muộn.

## 2 · Ràng buộc KHÔNG được nới

1. **`web/api/**` không bao giờ gọi ra Internet.** LÕI giữ nguyên tính chất
   không-nói-chuyện-với-bên-ngoài. Mọi egress nằm ở vùng THỢ.
2. **Một cửa egress.** Mọi lời gọi model đi qua **một** module. Hai cửa là hai
   chỗ phải audit, và cái thứ hai sẽ là cái không ai nhớ.
3. **BIÊN không đọc `kb/`.** Adapter kênh gọi API của LÕI, không mở file kho.
4. **M05-R1 giữ nguyên**: mọi thứ model sinh ra vào qua `_inbox/`, dừng ở `draft`.

## 3 · Cổng phải có

| # | Cổng bắt gì | Đỏ khi |
|---|---|---|
| C1 | `web/api/**` không có `fetch`/`http` ra ngoài | có một lời gọi mạng ngoài `127.0.0.1` trong `web/api/**` |
| C2 | Chỉ **một** module chứa lời gọi model | tìm thấy key/endpoint model ở module thứ hai |
| C3 | Mỗi lời gọi model ghi log có `sha256` payload | gọi model mà không có dòng log tương ứng |
| C4 | ~~Bậc 3 còn đóng~~ → **thay bởi `FR-045` U5**: mỗi lần gửi `than` ra kênh phải có dòng `audit_log` (ai nhận · bài nào) | gửi mà không có log |

C4 là cổng canh **một quyết định chưa có**, nên nó phải đỏ được ngay hôm nay —
cổng không đỏ được là cổng chưa đấu (`#cổng-không-đỏ-được`).

## 4 · Điều FR này KHÔNG làm

- **Không** đảo B-D3. Bậc 3 vẫn đóng.
- **Không** mở đường nghe vào. `M08-R1` nguyên vẹn; adapter kênh **gọi RA**, không
  mở cổng.
- **Không** quyết cho giai đoạn 2. Khi có người dùng khác, bậc 4 phải xét lại.
- **Không** chọn nhà cung cấp model — đó là việc của s4.
