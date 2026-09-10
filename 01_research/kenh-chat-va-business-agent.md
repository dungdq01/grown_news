# Kênh chat (Zalo · Zalo OA · Facebook · Telegram) + LLM → business agent

> Khảo sát 2026-08-30 · `/deep-research` (24 nguồn, 113 claim trích).
> **Đọc §0 trước.** Nghiên cứu này hỏng một nửa và tôi không giấu chỗ hỏng.

---

## 0 · Trạng thái nghiên cứu — cái gì đã kiểm, cái gì chưa

Workflow chạy 106 agent, **28 chết vì hết hạn mức chi tiêu**, gồm **toàn bộ** vòng
bỏ phiếu đối kháng cho Telegram, Facebook và pháp lý VN, cộng bước tổng hợp.

| loại | số | nghĩa là |
|---|---|---|
| ✅ **ĐÃ KIỂM** | 15 | qua 3 phiếu phản biện độc lập (3-0 hoặc 2-1) |
| ⚠️ **TRÍCH, CHƯA KIỂM** | ~50 | có trích dẫn nguyên văn từ nguồn **chính thức**, nhưng 0 phiếu |
| ❌ **CHẾT** | 28 phiếu | hết hạn mức |

Điều đáng nói: **15 claim sống sót gần như TOÀN BỘ là về Zalo OA**. Nghĩa là phần
tôi tin chắc nhất lại là kênh tôi sắp khuyên **không làm trước**. Phần chống lưng
cho khuyến nghị chính (Telegram) nằm ở nhóm ⚠️. Nguồn của nó là `core.telegram.org`
— nguồn chính chủ, nên tôi tin nó cao; nhưng "tin cao" không phải "đã kiểm", và
tôi ghi nhãn đúng như thế suốt tài liệu này.

---

## 1 · Sự thật quyết định TẤT CẢ: chỉ MỘT kênh cho phép đẩy bản tin

Ý tưởng "báo tri thức đẩy bản tin cho người đăng ký" sống hay chết ở đúng một câu
hỏi: **nền tảng có cho gửi tin khi người dùng KHÔNG vừa nhắn gì không?**

| kênh | được đẩy chủ động? | trần | nguồn |
|---|---|---|---|
| **Telegram** | ✅ **không có cửa sổ tin nhắn nào** | ~30 msg/s miễn phí | ⚠️ core.telegram.org/bots/faq |
| **Zalo OA** | ⚠️ có, nhưng **≤ 4 tin/follower/tháng**, chỉ 6h00–19h59 | cứng | ✅ 3-0 |
| **Messenger** | ❌ chỉ trong **24h** sau tương tác; sau đó 7 ngày **chỉ người thật gõ tay**; xa hơn chỉ Message Tags (cấm dùng cho bản tin) | không có đường hợp lệ | ✅ 3-0 (24h) + ⚠️ (7 ngày) |

> **Messenger không có đường hợp lệ nào cho newsletter.** Zalo OA có, nhưng 4
> tin/tháng thì "bản tin tuần" cũng không đủ. Telegram không có giới hạn nào.

Đây không phải chi tiết kỹ thuật — nó **loại bỏ hai trong bốn kênh** khỏi mô hình
kinh doanh chính, trước khi bàn tới dòng mã đầu tiên.

---

## 2 · Chi phí tới đồng đầu tiên — đo, không ước

| | mở kênh | hạ tầng | phí/tin | rail thu tiền |
|---|---|---|---|---|
| **Telegram** | `/newbot` với BotFather — **không xét duyệt, không xác minh** ⚠️ | **0** — long polling, không cần cổng vào ⚠️ | **0** ⚠️ | **Stars có sẵn**: hàng số, gói đăng ký, paid media ⚠️ |
| **Zalo Bot API** (mới, 7/2025) | chưa rõ | 0 — SDK hỗ trợ long polling ⚠️ | chưa rõ | không có |
| **Zalo OA** | OA **xác thực** + ví **ZBS đã nạp tiền** ✅ | VPS/tunnel **HTTPS public bắt buộc** ✅ | Tư vấn: 8 tin/48h free rồi **55đ**; Giao dịch **165đ** ✅ | không có |
| **Messenger** | app review + Page + permission ⚠️ | HTTPS public + **SLA trả lời 30s** ⚠️ | không nêu phí ⚠️ | không có |

Hai chi tiết đắt giá, cả hai ✅ đã kiểm:

- **Quyền dùng Chatbot + API trên Zalo OA nằm ở gói TRẢ PHÍ "Tăng trưởng"** — bot
  hai chiều qua OA **không có ở tier miễn phí**.
- **Cửa sổ Tin Tư vấn phụ thuộc CÔNG CỤ**: qua OpenAPI (bot tự động) chỉ **7
  ngày**; qua giao diện OA Manager (người gõ tay) **365 ngày**. Zalo cố ý phạt
  đường tự động.

---

## 3 · Ba ràng buộc của hệ hiện có, và chúng cắn vào đâu

### 3.1 · B-D3 — đây là XUNG ĐỘT, không phải chi tiết

`brd.md:174-176`: *"Web chạy local hoặc private. **Không SEO, không chia sẻ công
khai**."* Đã đóng dấu `quyết định ✅` ở `brd.md:214`.

Đẩy nội dung kho ra một kênh Telegram công khai **chính là chia sẻ công khai**.

> Không có cách kỹ thuật nào lách. Đây là **quyết định kinh doanh phải đảo một
> quyết định đã chốt** — cần FR sửa BRD, và là việc của người, không phải agent.
> Mọi thứ dưới đây giả định bạn sẵn sàng đảo nó. Nếu không, đọc thẳng §7.2.

### 3.2 · M08-R1 — webhook KHÔNG được đặt trong `web/api/**`

API biên tập bind cứng `127.0.0.1`; `api-guard.test.js` canh. Webhook của Zalo OA
và Messenger **bắt buộc** HTTPS public ⇒ chúng phải là **tiến trình riêng, module
riêng**, không nhét vào `web/api/`.

**Telegram long polling không có vấn đề này**: bot gọi RA `api.telegram.org`,
không mở cổng vào nào. Đây là lý do kỹ thuật — không phải sở thích — để Telegram
đi trước: nó là kênh duy nhất **không đụng M08-R1 một dòng nào**.

### 3.3 · Lỗ "gửi RA" — vẫn chưa vá, và giờ nó to hơn

Lần quét LLM trước đã ghi: `security_baseline` cấm **nghe vào**, `B-D3` cấm **công
bố**, nhưng **không luật nào nói về GỬI RA**. Thêm chat + LLM làm lỗ này thành ba
đường cùng lúc: nội dung kho → kênh chat; tin người dùng → model đám mây; tài liệu
người gửi → model.

Không vá trước thì mọi tính năng sau đứng trên nền không có luật.

---

## 4 · "Kéo bài về" — phần lớn đã CHẾT, và đó là tin tốt

Đây là chỗ nghiên cứu lật ngược giả định của đề bài.

| đường | trạng thái | nguồn |
|---|---|---|
| **FB Groups API** | ❌ **gỡ khỏi mọi phiên bản API từ 22/04/2024** | ⚠️ |
| **FB Graph API (page)** | ❌ còn `id`/`name`/`about`/`fan_count`; post/group/user-level **hết** tính tới 2026 | ⚠️ |
| **Crawler HTML Facebook** | ❌ vi phạm ToS; Meta có **đội Anti-Scraping**, randomize class/id, login wall, kiện tụng | ⚠️ |
| thư viện scraper FB nguồn mở | ❌ `kevinzg/facebook-scraper` (3.157★) ngừng push 22/6/2024, tự nhận *"không đáng tin cho production"*; top-10 repo đều stale >12 tháng | ⚠️ |
| **Zalo OA** | ❌ không có đường đọc nội dung của người khác | ✅ (OA API là để **vận hành OA của mình**) |
| **Telegram Bot API** | ✅ **sống** — bot là thành viên kênh thì nhận `channel_post` / `edited_channel_post` | ⚠️ |
| **Telegram MTProto (userbot)** | ⚠️ đọc được **mọi** kênh + lịch sử + danh sách thành viên — nhưng **rủi ro khoá tài khoản** | ⚠️ |

Ba giới hạn thật của đường Telegram Bot API (⚠️):

- bot trong **group** mặc định bật **privacy mode** — chỉ thấy lệnh gửi cho nó.
  Hút cả feed group cần tắt privacy hoặc quyền admin.
- **upload 50 MB / download 20 MB** (MTProto: 2 GB). PDF 2.8 MB thoải mái, video
  thì không.
- chỉ đọc được nơi bot **đã được thêm vào** — nó không phải một crawler.

> **Kết luận ngược đề bài:** "kéo bài về từ Facebook" không phải tính năng khó —
> nó là **tính năng không tồn tại**. Xây chiến lược kinh doanh trên nó là xây trên
> thứ Meta đã đóng và đang kiện. Đường ingest duy nhất vừa sạch vừa chính thức là
> **Telegram channel mà bot là thành viên**, cộng RSS/web thường. Và điều đó
> *không tệ*: nó trùng đúng kênh đã thắng ở §1.

---

## 5 · Pháp lý VN — nền đã đổi từ 01/01/2026

| | |
|---|---|
| **Nghị định 13/2023** (bảo vệ DLCN) | ⚠️ **HẾT HIỆU LỰC 01/01/2026** — mọi phân tích dựa trên nó đã lỗi thời |
| thay bằng | **Luật Bảo vệ dữ liệu cá nhân 2025** + **Nghị định 356/2025/NĐ-CP**, hiệu lực 01/01/2026 |
| **Điều 14 NĐ 356/2025** | buộc lập **hồ sơ đánh giá tác động xử lý DLCN** *và* **hồ sơ đánh giá tác động chuyển DLCN xuyên biên giới** |
| từ 2026 | phải **chỉ định bằng văn bản** nhân sự/bộ phận bảo vệ DLCN, kèm điều kiện năng lực (cao đẳng trở lên, ≥2 năm kinh nghiệm pháp chế/CNTT/ANM…) |
| **Nghị định 91/2020** (tin nhắn rác) | chỉ nói SMS/MMS/USSD/email/cuộc gọi — **không nêu rõ** áp cho OTT (Zalo/Messenger/Telegram) |

**Điều đắt nhất ở đây:** gửi tin chat của người dùng VN tới Anthropic/OpenAI
**chính là chuyển dữ liệu cá nhân xuyên biên giới**, và từ 2026 nó đòi một hồ sơ
đánh giá tác động. Đó không phải rào cản kỹ thuật — nó là **chi phí cố định xuất
hiện ngay khi có người dùng thật đầu tiên**, và nó rơi đúng vào mô hình "LLM
business agent phục vụ người Việt".

Ngược lại: luật spam VN **không** ràng buộc tần suất bot OTT. Thứ ràng buộc bạn là
**luật của nền tảng** (Zalo 4 tin/tháng, Meta 24h) — chặt hơn luật nhà nước.

---

## 6 · Tài sản thật của Grown_news không phải nội dung

Kho có **3 bản ghi** (`select count(*) from ban_ghi`). Đem 3 bản ghi đi bán là không có gì để bán.

Nhưng dự án có thứ khác, và nó hiếm: **một cỗ máy bảo đảm chất lượng đã chạy**.

- mọi khẳng định phải có **locator** (`validate.py` §7) — không địa chỉ thì đỏ
- `origin: external` đòi `citations_sampled ≥ 2` **và** `verified ≥ sampled`
- khái niệm phải lấy từ **danh mục đóng**; bịa ra thì vào `concepts_proposed` chờ người
- mọi thứ vào qua `_inbox/` **dừng ở `draft`**, vô điều kiện (M05-R1)

Thị trường "bản tin AI" đã bão hoà bằng thứ LLM viết trôi chảy và **không ai kiểm
được**. Cái Grown_news bán được không phải *nội dung*, mà là **"mỗi câu đều có địa
chỉ, và có máy chấm"** — thứ đối thủ phải xây 3.000 dòng cổng mới có.

> Sản phẩm không phải "bot tin tức AI". Sản phẩm là **bản tin có địa chỉ**.

---

## 7 · Xếp hạng đường ra tiền

### ⭐ 7.1 · Telegram bot — LÀM TRƯỚC

Kênh **duy nhất** mà cả bốn điều kiện cùng đúng: mở bot không xét duyệt · không có
cửa sổ tin nhắn nên được đẩy bản tin · có sẵn rail thu tiền (Stars, gói đăng ký) ·
chạy long polling nên **không đụng M08-R1, không cần VPS, không cần tunnel**.

Chi phí thử: gần bằng 0. Và nó trả lời được câu hỏi đắt nhất — *"có ai chịu trả
tiền không?"* — mà **chưa tốn một đồng hạ tầng nào**.

### 7.2 · Agent "gửi tài liệu → nhận bài chuẩn khung" — mô hình hợp nhất

Người dùng gửi PDF/URL vào bot, nhận lại bản phân tích 5 mục **có locator**, và
bản nháp rơi vào `_inbox/` → `gate.py` → `draft`.

Đây **không phải tính năng mới** — nó là đúng thứ đã làm tay một lần với
`xgboost-taylor-bac-hai.md`. Đường ray đã xong. Và nó **không cần đảo B-D3**: bot
trả bài cho chính người gửi, không công bố gì.

> Nếu bạn chưa muốn động vào BRD, **đây là đường duy nhất ra tiền mà không xung
> đột luật nào của dự án**.

### 7.3 · Zalo Bot API — bước hai, nếu khách là người Việt

Ra 7/2025, SDK `python-zalo-bot` (MIT) **fork từ `python-telegram-bot`** ⇒ port từ
7.1 sang gần như bằng 0 công. Hỗ trợ cả long polling. Nhưng **version < 1.0** và
trang PyPI **không nêu** điều kiện mở bot, phí, hay rate limit.

⇒ Chính vì thế Telegram đi trước: cùng kiến trúc, nhưng Telegram đã biết hết luật chơi.

### 7.4 · Zalo OA — chỉ khi đã có khách trả tiền

Chi phí thật: OA xác thực + ví ZBS nạp tiền + gói "Tăng trưởng" + VPS/tunnel HTTPS
+ 55đ/165đ mỗi tin ngoài hạn mức. Đổi lại: thương hiệu chính thức tại VN và Tin
Giao dịch (hoá đơn, xác nhận) — thứ Telegram không có.
**Newsletter qua OA thì quên đi**: 4 tin/follower/tháng.

### 7.5 · Facebook / Messenger — XẾP CUỐI, cả chat lẫn ingest

Ingest: đã chết (§4). Chat: cửa sổ 24h giết mô hình bản tin (§1). Cộng app review,
SLA 30s, và hình phạt leo thang tới mức gỡ Page. **Không có ô nào thắng.**

---

## 8 · Việc kế tiếp — và cái gì cần NGƯỜI quyết

**Cần bạn quyết trước khi viết dòng mã nào:**

1. **Có đảo B-D3 không?** Đẩy nội dung ra kênh công khai là đảo một quyết định đã
   chốt → FR sửa `brd.md`. Nếu **không** đảo: làm 7.2, bỏ phần broadcast của 7.1.
2. **Vá lỗ "gửi RA"** trong `security_baseline.md` trước mọi lời gọi model/kênh
   ngoài → FR. Đây là thứ tôi đã nêu ở lần quét trước và vẫn chưa vá.
3. **Ngách nào?** "Bản tin có địa chỉ" chỉ bán được cho một nhóm cụ thể. Kho hiện
   nghiêng về AI-engineering/ML — nhưng đó là suy đoán của tôi từ 3 bản ghi,
   không phải dữ liệu.

**Việc kỹ thuật, sau khi có 1+2:**

- module mới `M12_kenh` — tiến trình riêng, **không** nằm trong `web/api/**`
- bot Telegram long polling: `/nap <url|file>` → `_inbox/` → `gate.py` → `draft`
- cổng S3 phải canh: bot **không được** ghi thẳng `kb/`; mọi thứ qua `_inbox/`
- không bao giờ để bot tự `approved` — M05-R1 giữ nguyên

**Việc nghiên cứu còn dở:** phần Telegram/FB/pháp lý (~50 claim) **chưa qua bỏ
phiếu đối kháng** vì hết hạn mức. Chạy lại pha Verify sau khi reset dùng lại cache
của 78 agent đã xong, chỉ tốn phần phiếu.

---

## Nguồn

**Chính chủ:** `developers.zalo.me` · `oa.zalo.me` (4 trang) · `core.telegram.org`
(api, faq, features) · `developers.facebook.com` (policy, send-messages) ·
`docs.telethon.dev` · `docs.pyrogram.org` · `pypi.org/project/python-zalo-bot` ·
`luatvietnam.vn` (NĐ 91/2020)

**Thứ cấp:** `thuvienphapluat.vn` (NĐ 13 hết hiệu lực) · `sprinklr.com` (FB Groups
API deprecation) · `manychat.com` (messaging windows) · `zalo.cloud` (ZNS)

**Blog (độ tin thấp):** `thunderbit.com` (scraper FB) · `merginit.com` (tunnel) ·
`usecarly.com` (Telegram MCP)
