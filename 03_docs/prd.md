# PRD — sản phẩm làm gì

> Câu hỏi của file này: **user làm được gì?** Không phải "bị ràng gì" (BRD) hay
> "chia sao" (spec_overview).
>
> Nguồn: `01_research/research_summary.md` + `02_proposal/proposal.md`. Không nguồn khác.

## Người dùng — MỘT chủ dự án + 5 tài khoản đọc *(sửa 2026-09-01, `FR-045`)*

**Chủ dự án.** Vừa là người nạp nguồn, vừa là biên tập viên, vừa là người đọc.
**Vẫn là người DUY NHẤT duyệt** — `B-B1` không đổi một chữ.

**5 đồng nghiệp.** Có account, đọc kho, hỏi chatbot, mỗi người một session
riêng. **Không ai trong số họ được `approved`.** Họ nạp được, và mọi thứ họ
nạp dừng ở `draft` (`M05-R1`).

> Câu cũ *"không có vai thứ hai"* **hết đúng**. Nhưng cái nó bảo vệ thì còn:
> vai thứ hai là vai **ĐỌC và HỎI**, không phải vai **QUYẾT**. Cổng `U7` của
> `FR-045` canh đúng chỗ đó.

Ba mũ, ba nhu cầu khác nhau:

| Mũ | Muốn gì | Đo bằng |
|---|---|---|
| **Người nạp** | Dán link xong là quên, máy lo phần còn lại | Thao tác ≤ 2 bước tới lúc có `draft` |
| **Biên tập** | Đọc nhanh, biết chỗ nào đáng ngờ, duyệt hoặc loại | < 20 phút/bản (M1.3) |
| **Người đọc** | Tra lại thứ đã học, tìm theo khái niệm | Lọc theo `concepts` |

---

## U1 · Nạp một nguồn

**Làm được gì**: mở Claude Code trong thư mục dự án, dán một link (hoặc đưa file).
Không cần gõ lệnh, không cần chọn loại nguồn.

**Máy làm gì**:
1. Tự nhận loại nguồn (repo · paper · video · article · docs · announcement)
2. Chạy 6 pass có cổng chặn, mỗi pass sinh artifact rồi mới đi tiếp
3. Với nguồn **không phải code**: chạy thêm Pass 3.5 thẩm định độ tin cậy
4. Sinh `kb/<loại>/<slug>.md` với `review_status: draft`

**Kết quả**: một file `.md` ≤1800 từ, cấu trúc theo khung khai (`core/assets/khung-than-bai.json` — hiện 5 mục), mọi khẳng định có địa chỉ.

**Bản phân tích là mô tả, không phải bản sao**: trích dẫn để trần trong ngoặc
vuông (`[retry.py:44-71]`), không nhúng nguyên văn đoạn dài từ nguồn. Trần cứng
1800 từ tự nó chặn việc chép khối. → BRD B-D1

**Không làm**: không tự đi tìm nguồn khác; không tự duyệt; không tự cài skill.

**Khi không đủ dữ liệu** (không lấy được transcript, repo private): chạy Pass 0–1
với những gì fetch được, xuất artifact, **nêu chính xác cần gì để đi tiếp**. Không
đoán nội dung chưa đọc.

→ proposal S1 · G-1

---

## U2 · Nạp bản phân tích làm sẵn ở nơi khác

**Làm được gì**: đưa file `.md` đã phân tích bằng AI khác (Gemini, Codex).

**Máy làm gì**: không chạy lại giao thức. Chạy **cổng nạp**:
1. Phân loại mức A/B/C/D
2. Ghi nguồn gốc (`origin: external`, `origin_tool`)
3. **Spot-check ≥2 trích dẫn** — một cái sai thì loại cả bản
4. Hạ mọi đề xuất skill về chờ duyệt
5. Trả **báo cáo hợp lệ** nêu thiếu gì, đã tự bổ sung gì, cần điền gì

**Kết quả**: vào kho ở `draft`, hoặc bị từ chối kèm lý do cụ thể.

→ proposal S1 · BRD B-B3

---

## U3 · Duyệt một bản — cổng người duy nhất

**Làm được gì**: đọc bài, sửa nếu cần, đổi `review_status`.

**Bốn trạng thái**:

| Từ → tới | Nghĩa | Lên web |
|---|---|---|
| `draft` → `approved` | Đọc rồi, đáng giữ | ✅ |
| `draft` → `edited` → `approved` | Sửa rồi mới duyệt | ✅ |
| `draft` → `rejected` | Loại — **bắt buộc ghi `reject_reason`** | ❌ |

**Máy hỗ trợ gì khi duyệt**: hiện sẵn chỗ đáng ngờ — `credibility_max`,
`unverifiable_citations`, `contradicted_by` không rỗng, `concepts_proposed` chờ
duyệt.

**Máy tuyệt đối không làm**: tự đổi sang `approved`.

→ proposal S4 · BRD B-B1, B-B2 · G-4

---

## U4 · Kiểm kho bằng máy

**Làm được gì**: chạy một lệnh, biết kho có sạch không.

```
validate kb/          → 8 cổng, exit 0 hoặc danh sách lỗi tiếng Việt
validate kb/ --fix    → sửa word_count (dữ liệu dẫn xuất, không khai tay)
```

**Tự động**: pre-commit hook chạy khi `kb/` có thay đổi; sai thì **chặn commit**,
in lỗi kèm cách sửa.

**Kết quả mong đợi**: người dùng không bao giờ phải nhớ 8 luật — máy nhắc.

→ proposal S2, S6 · BRD B-A1, B-B2, B-C2

---

## U5 · Đọc trên web

**Trang bài** — thứ tự theo mức cam kết tăng dần của người đọc:
1. Tít + sapo — quyết định đọc tiếp trong 5 giây
2. Hộp metadata — độ tin, ngày, giấy phép, nguồn gốc, badge `origin`
3. **Dải cảnh báo** nếu `unverifiable_citations` hoặc `contradicted_by` không rỗng
4. Thân bài theo khung khai
5. Lộ trình tiếp thu — checklist lưu trạng thái ở localStorage
6. Tự kiểm — ẩn đáp án, bấm mới hiện
7. Hộp đề xuất skill — hiện `why_now` và `priority`

**Trang chủ** — ba khối, không hơn:
- **Tiêu điểm**: 1 bài, chọn theo `priority` cao nhất 7 ngày (KHÔNG theo ngày)
- **Dòng thời gian**: bài mới, có thời gian đọc ước tính từ `word_count`
- **Theo chuyên mục**: 6 cột theo `source_type`

**Luật hiển thị**:
- Chỉ render `approved`
- Ba bản cùng `url_normalized` → **một** bài, các bản là tab
- Bài `origin: external` có badge nêu rõ ai/công cụ nào sinh

**Cố ý bỏ**: carousel, infinite scroll, popup đăng ký. Nội dung để tra cứu, không
để giữ chân.

→ proposal S5 · G-5 · BRD B-B1, B-A3

---

## U6 · Tra cứu

**Làm được gì**: tìm theo hai chế độ, cùng một ô nhập.

| Chế độ | Cách | Vì sao đủ |
|---|---|---|
| Từ khóa | full-text trên tít, one_liner, thân bài | Nhu cầu thường gặp |
| **Khái niệm** | lọc theo `concepts` | Chính xác vì danh mục **được kiểm soát** — không cần embedding |

"Nguồn nào đã giải bài toán chống trùng bản ghi" → `concepts contains idempotency`.

→ proposal S5 · BRD B-C2

---

## U7 · Sinh skill cho agent nội bộ

**Làm được gì**: từ `skill_candidates` trong bản phân tích, sinh file
`skills/<name>/SKILL.md` cắm thẳng vào Claude Code.

**Điều kiện**: `priority ≥ 25`. Công thức:
```
priority = (relevance × frequency × durability × corroboration_factor) / cost
```

**Chặn cứng**: `credibility` là `claimed`/`conflicted` + 1 nguồn độc lập ⇒ **cấm**
verdict `NEW`/`DEEPEN`. Chỉ được lưu dạng knowledge.

**Không tự động**: máy đề xuất, người quyết định cài.

→ proposal S3 · BRD B-A2 · G-3

---

## U11 · Đổi một ô quyền mà không phải sửa mã

*(mở 2026-09-03 · `proposal-3` · nguồn `01_research/quan-ly-va-cai-dat-he-thong.md`)*

**Chủ dự án** mở màn *Quản lý và cài đặt hệ thống*, bật/tắt một ô — ví dụ
*"đồng nghiệp được xem audit"* — và nó **có hiệu lực ngay**, không deploy.

| bước | thấy gì |
|---|---|
| 1 | màn hiện danh sách ô **đã khai trong mã**, kèm giá trị hiện tại |
| 2 | bật/tắt một ô |
| 3 | vết ghi ngay: **ai đổi · ô nào · giá trị mới · lúc nào** |
| 4 | lần gọi kế tiếp của đồng nghiệp đi theo giá trị mới |

**Kết quả mong đợi**: đổi một ô quyền mất **< 30 giây** (hôm nay: sửa
`dungchung.mjs` + chạy test + restart).

### Ba thứ màn này KHÔNG cho làm — và đó là phần đáng đọc

| | vì sao |
|---|---|
| **không** ô *"cho đồng nghiệp duyệt bài"* | `B-B1` ở **mã**, không ở dữ liệu. `CVE-2024-3283`: một cửa setting đổi cờ xác thực ⇒ **tạo được admin** |
| **không** ô sửa `vai` | enum khoá bằng DDL. `CVE-2026-9796`: neo luật vào tên vai sửa được ⇒ đổi tên để thắng cuộc đua |
| **không** ô nào mở được **danh sách ô** | `CVE-2026-17601`: một ô mở ra tất cả các ô |

⚠️ **Và nó không thay `M17-R6`.** Biên vẫn **lột** `review_status` khỏi payload.
Hai lớp, hai chiều: `M17-R6` chặn theo **đường**, `duocLam` chặn theo **người**.
Bỏ một cái thì cái kia không cứu được.

### Vết phải nói AI ĐÃ ĐỔI, không chỉ ai bị đổi

`SEC 17a-4(f)(2)(i)` gọi tên trường này: *"identity of the actor"*. Và
`CVE-2026-48086` ghi đúng chỗ né được nếu thiếu nó.

Bảng vết là **append-only bằng cấu trúc** — bốn cửa ghi (`UPDATE` · `DELETE` ·
`INSERT OR REPLACE` · `INSERT OR IGNORE`) đều ném. Không phải bằng một lời khai
trong bình luận.

---

## Flow chính

```
U1/U2 nạp ──→ kb/*.md (draft) ──→ U4 máy kiểm ──→ U3 người duyệt
                                        │              │
                                   sai: chặn      approved
                                                       │
                                          U5 web ◄─────┘
                                          U6 tra cứu
                                          U7 sinh skill
```

**Một cổng người, sáu bước máy.** Đây là tỷ lệ chủ ý.

---

---

# Đợt hai — 2026-08-31 · U8–U12

> Nguồn: `02_proposal/proposal-2-ai-llm-kenh.md` (đã duyệt) · `research_summary`.
> Thứ tự dưới đây **là thứ tự thi công**, không phải thứ tự quan trọng.

## U8 · Bấm một địa chỉ, mở đúng chỗ trong nguồn

**Làm được gì**: đang đọc một bài, thấy `[§II.4]` hay `[xgboost.pdf:p.7]` —
bấm vào là mở đúng trang/đoạn trong nguồn gốc.

**Vì sao đây là U đầu tiên, không phải tính năng phụ**: hôm nay kiểm một trích
dẫn tốn vài phút (mở PDF, dò mục, đọc). Khi **kiểm đắt hơn tin**, không ai
kiểm, và mọi ràng buộc nhóm A thành trang trí.

**Kèm theo, không thấy được nhưng quan trọng hơn**: máy **từ chối** bài có địa
chỉ trỏ vào hư không, và **tự tính** `citations_verified` thay vì tin số người
gõ.

→ proposal S8·S9·S10 · BRD **B-A5, B-A6**

## U9 · Agent đọc tài liệu, viết bản nháp cho tôi duyệt

**Làm được gì**: một PDF/video đã nằm trong kho nguyên liệu → agent đọc, viết
bản phân tích 5 mục → rơi vào `_inbox/` → `gate.py` → **`draft`**.

**Không đổi gì về quyền**: `M05-R1` giữ nguyên — không đường nào để bản do máy
viết tự thành `approved`. Cái đổi là **ai gõ bản nháp đầu tiên**.

**Cái mới so với hôm nay**: máy **chấm từng địa chỉ** trong bài nó vừa viết.
Trước U8 thì đây là *"agent viết bài rồi agent tự khai đã kiểm 3 trích dẫn"* —
một vòng tròn khép kín. Sau U8 thì là *"agent viết, máy chấm"*.

**Hai kiểu, không phải một** — và kiểu thứ hai mới là lý do làm cả hệ:

| | vào | ra | hồ sơ |
|---|---|---|---|
| **9a · chưng cất một nguồn** | 1 PDF/video | *"nguồn này nói gì"* | `phan-tich` |
| **9b · tổng hợp một chủ đề** | **N** nguồn cùng chủ đề | *"mọi thứ về X nói gì"* | **`tong-hop`** (FR-044) |

9b cho ra bản ghi **không có `url` đơn nào** — đo được: `ho_so` chỉ có hai
giá trị và `url` là trường bắt buộc, nên nó **không khớp hồ sơ nào đang có**.
`FR-044` mở hồ sơ thứ ba cho đúng ca này.

→ proposal S11 · BRD B-B1, **B-A7**, **B-E1 bậc 4**, B-E2, B-E3 · **FR-044**

## U10 · Hỏi kho bằng tiếng người, nhận câu trả lời CÓ ĐỊA CHỈ

**Làm được gì**: gõ một câu hỏi trên web, nhận câu trả lời mà **mọi khẳng định**
đều kèm địa chỉ bấm được về bản ghi/trang nguồn.

| Điều | Cách |
|---|---|
| Phạm vi tìm | **bộ lọc facet đang bật** — bạn thấy nó, không phải top-k ẩn |
| Không có trong kho | **từ chối, kèm lý do phân loại** — không bịa |
| Agent tuyển theo lệnh | `/tìm <chủ đề>` — agent chọn, **bạn duyệt cái đã chọn** |

**Cố ý KHÔNG làm**: agent tự đi tìm nguồn ngoài kho khi không ai bảo.

→ proposal S12·S13 · BRD B-C2, B-A5

## U11 · Gửi một link từ điện thoại, nó vào kho

**Làm được gì**: đang ở đâu cũng được, gửi `/nap <url> | <một câu ghi chú>` cho
bot Telegram → bản ghi `tai-lieu`/`video` vào kho ở **`draft`**.

| Điều | Cách |
|---|---|
| Ai được gửi | **chỉ id trong allowlist** — nếu không, kho thành hộp thư công cộng |
| Sai định dạng | bot **trả lỗi nói rõ thiếu trường nào**, không im lặng |
| Máy tắt | không xử lý; Telegram giữ tin ~24h. Chấp nhận được cho dùng cá nhân |

**Vì sao rẻ**: hồ sơ `thu-vien` **miễn** bốn cổng hình dạng, nên nạp một link
**không cần model**. Bài phân tích 5 mục là bản ghi **khác**, viết sau (U9).

→ proposal S14 · BRD **B-B4**, B-E1 bậc 1–2, **B-E4**

## U12 · Biến bài đã duyệt thành slide · giọng đọc · video

**Làm được gì**: một bài `approved` → bản trình bày, bản đọc, bản video.

**Xếp cuối vì phụ thuộc, không vì ít giá trị**: cần corpus, cần U9 chạy tốt,
tốn nhất, và là chỗ **gửi RA** gắt nhất.

→ proposal S15 · BRD B-E1 bậc 4, B-E3

---

## Cái đợt hai CỐ Ý chưa có

| Không có | Vì sao |
|---|---|
| ~~Bot gửi thân bài cho người khác~~ | ⚠️ **đã vào phạm vi 09-01** (`FR-045`) — chỉ tới người trong `nguoi_dung`, mỗi lần ghi `audit_log` |
| Discord · Zalo · FB | Sau Telegram. Và **Discord chưa khảo bằng nguồn nào** |
| Zalo cá nhân, crawler FB | `B-E4` — không có bề mặt chính thức |
| Cron tự kéo RSS | Người dùng chốt **request-driven** |
| Đăng nhập, thanh toán | Giai đoạn 2 |

## Cố ý KHÔNG có

| Không có | Vì sao |
|---|---|
| Nút "tự động duyệt tất cả" | Phá B-B1 — cổng người là lý do hệ thống tồn tại |
| Tự động tìm nguồn mới | Bài toán ngược chiều — ⚠️ **đổi một phần 08-31**: agent tuyển **khi được ra lệnh**, vẫn không tự đi tìm. Xem U10 |
| ~~Đăng nhập~~ | ⚠️ **đã vào phạm vi 09-01** (`FR-045`) — `ma_moi` một lần, không mật khẩu. **Phân quyền thì CHƯA**: cột `vai` có sẵn, chưa ai đọc |
| Bình luận, chia sẻ mạng xã hội | Vẫn KHÔNG — `B-D3b` cho **5 account**, không cho link công khai. Khác nhau ở chỗ có bảng ghi rõ ai được |
| Realtime, collaborative | Git là cơ chế đồng bộ |
| App mobile | Web responsive đủ |

> **Đã rời bảng này (FR-011, 2026-08-19)**: *"Editor nội dung trên web"* — lý do
> cũ "nguồn chân lý là git; sửa = sửa file rồi commit" vẫn đúng một nửa: nguồn
> chân lý VẪN là file `.md` trong git. Cái đổi là cây bút: API biên tập local
> (M08) nhận thao tác người trên web rồi ghi ngược vào `.md` qua
> `validate.py --strict`. Duyệt/sửa/xoá(recycle)/tạo đều làm được trên web khi
> người chạy `npm run api`; site tĩnh deploy vẫn chỉ-đọc.
| Thông báo đẩy | Không có gì gấp |
| Xếp trang chủ thuần theo ngày | Kho tri thức ưu tiên *còn đúng*, không phải *mới* |

---

## Metric — nhắc lại từ proposal, không định nghĩa lại

Chặn: **M1** (giao thức cho ra insight thật) — 3/10 insight mới · 1/10 thành skill
· <20 phút/bản.

Còn lại: M2 cưỡng chế máy · M3 web · M4 tích luỹ. Chi tiết ở
`02_proposal/proposal.md#5`.

---

## Truy ngược — mỗi mục PRD về đâu

| PRD | Proposal | Gap | BRD |
|---|---|---|---|
| U1 nạp nguồn | S1 | G-1 | B-A1, B-A4, B-D1 |
| U2 đường tĩnh | S1 | G-3 | B-B3, B-A3 |
| U3 duyệt | S4 | G-4 | B-B1, B-B2 |
| U4 kiểm máy | S2, S6 | G-2 | B-A1, B-C2 |
| U5 web | S5 | G-5 | B-B1, B-A3, B-C3 |
| U6 tra cứu | S5 | G-2 | B-C2 |
| U7 sinh skill | S3 | G-3 | B-A2, B-D2 |
| **U8** địa chỉ bấm được | S8, S9, S10 | G-6, G-7 | B-A5, B-A6 |
| **U9** agent viết nháp | S11 | G-9 | B-B1, B-A7, B-E1, B-E2, B-E3 |
| **U10** hỏi kho | S12, S13 | G-8, G-11 | B-C2, B-A5 |
| **U11** gửi link từ xa | S14 | G-9 | B-B4, B-E1, B-E4 |
| **U12** artifact | S15 | G-12 | B-E1, B-E3 |
