# Research summary — s1

> Bản chưng. **s2 chỉ đọc file này**, không đọc raw.
> Raw đợt một: `solutions_scan.md` · `gap_analysis.md` · `original_request.md`
> Raw đợt hai: bốn file cùng thư mục — `llm-features-scan.md` ·
> `notebooklm-tinh-tuy.md` · `kenh-chat-va-business-agent.md` ·
> `hermes-agent-duoi-factory.md`
>
> Cập nhật 2026-08-31. Đợt một khảo 08-18; đợt hai khảo 08-29 → 08-31.

---

## 0 · Điều s2 phải biết trước tiên: PHẠM VI ĐÃ TRÔI

`original_request.md` (bản 08-18) tự khai **ba điều không có trong yêu cầu gốc**.
Tính tới 08-31, **cả ba đều đã vào phạm vi**:

| khai 08-18 "không có" | nay | lượt |
|---|---|---|
| chia sẻ cho người khác đọc | **dạy bạn bè qua Telegram/Zalo** | 10 |
| tự động hoá việc *tìm* nguồn | **agent tuyển khi được ra lệnh** | 11 |
| kiếm tiền hay quy mô | **public + scale, subscription** | 8, 9 |

> Lượt 1–4 mô tả **một công cụ đọc cho một người**. Lượt 5–15 mô tả **một hệ thống
> dạy nhiều người, có mô hình doanh thu**. Đó không phải cùng một sản phẩm to nhỏ
> khác nhau — chúng khác nhau ở **ai chịu hậu quả khi hệ nói sai**.

s2 phải viết proposal cho cái thứ hai, và phải nói rõ nó thay cái thứ nhất ở đâu.

## 1 · Yêu cầu, đọc lại bằng năm câu (đợt hai)

1. **Grown_news là bản tin hằng ngày để HỌC**, không phải kho lưu trữ.
2. **Agent tự tổng hợp và học hộ** → rồi sinh slide/video/voice từ bài học đó.
3. **Chatbot RAG** trên chính kho, **có API riêng**.
4. **Đẩy chatbot ra nhiều kênh** để dạy bạn bè.
5. **Chat trở lại thành nguồn** — vòng khép.

Ba ràng buộc thứ tự **do người dùng đặt**, không phải tôi suy:
- **Core xong trước, integration sau** (lượt 15)
- **Nạp theo request/streaming**, không phải cron kéo RSS (lượt 11)
- **Zalo hoãn**, Telegram trước (lượt 14)

Chiến lược hai giai đoạn: **dùng riêng → public + scale, subscription** (lượt 8, 9).

## 2 · Phát hiện đợt một — vẫn đứng

Yêu cầu chạm **bốn thị trường**, không nhóm nào phủ trọn: [A] trích xuất ·
[B] kho `.md` · [C] xuất bản · **[D] kiểm chứng — không nhóm A/B/C nào làm**.

Bằng chứng nền của cả dự án:

> **Stanford 2025: trợ lý pháp lý xây riêng, có RAG, vẫn bịa ở 17–34% truy vấn.**
> Grounding *giảm* bề mặt bịa nhưng *không loại bỏ*. — `solutions_scan#D`

⇒ **Có trích dẫn ≠ trích dẫn đúng.** Đây là lý do dự án tồn tại, và đợt hai làm
nó **cấp bách hơn**, không nhẹ đi (xem §4).

## 3 · Phát hiện đợt hai — bốn điều quyết định proposal

### 3.1 · Tinh tuý NotebookLM là "làm cho kiểm chứng RẺ HƠN tin"

Năm nguyên lý tách được khỏi Google (`solutions_scan#E`). Quan trọng nhất là **③**:
trích dẫn hai tầng — hover xem nguyên văn, click nhảy tới vị trí — khiến verify
tốn **một cử động chuột**.

> Khi verify đắt hơn tin, **không ai verify**, và grounding thành trang trí.

Bốn nguyên lý còn lại: ① phạm vi truy hồi là control **hiển thị** ② từ chối phải
**phân loại lý do** ③ ④ N preset + đúng một cửa thoát ⑤ artifact phải **quay ngược
làm input**.

**Grown_news đã làm xong nửa KHÓ và chưa làm nửa DỄ**: nó ép trích dẫn bằng **cổng
máy** (mạnh hơn prompt của NotebookLM), và lưu byte theo `sha256` nên corpus
**không trôi** (NotebookLM tự gỡ nguồn YouTube sau 30 ngày). Nhưng trích dẫn của
nó **không trỏ tới đâu cả**.

### 3.2 · Chỉ MỘT kênh cho phép đẩy bản tin

| kênh | đẩy chủ động? | mở kênh | adapter |
|---|---|---|---|
| **Telegram** | ✅ không có cửa sổ nào ⚠️ | `/newbot`, không duyệt, 0 phí ⚠️ | **long polling — gọi RA** |
| **Discord** | ✅ [giả định] | bot riêng tư [giả định] | **gateway — gọi RA** [giả định] |
| **Zalo OA** | ⚠️ ≤4 tin/follower/tháng ✅3-0 | OA xác thực + ví ZBS + gói trả phí ✅3-0 | **webhook — nghe VÀO** |
| **Messenger** | ❌ chỉ 24h sau tương tác ✅3-0 | app review | **webhook — nghe VÀO** |

> **Ranh giới quan trọng nhất của phần tích hợp**: kênh nhận tin bằng cách **gọi
> RA** là *một tiến trình local* — không VPS, không tunnel, không đụng `M08-R1`.
> Kênh đòi **nghe VÀO** là *một dự án hạ tầng*.

### 3.3 · "Kéo bài về từ Facebook" là tính năng KHÔNG TỒN TẠI

Groups API gỡ khỏi mọi phiên bản **22/04/2024** · Graph API còn rất ít dữ liệu
page · scraper nguồn mở lớn nhất (3.157★) **tự nhận "không đáng tin cho
production"**, ngừng push 6/2024 · Meta có **đội Anti-Scraping**, randomize
class/id **cố ý**, kiện tụng.

⇒ Đường ingest chính thức duy nhất còn sống là **Telegram channel mà bot là thành
viên** (`channel_post`).

**Luật nhận kênh** (đề xuất s2 chốt vào `adr.md`): chỉ cắm kênh **có bề mặt chính
thức** — API có version, có tài liệu, có thông báo thay đổi. Không có ⇒ **không
làm**, không phải "làm sau". Lý do không phải khó/dễ mà là: **crawler là cỗ máy
hỏng-im-lặng theo thiết kế**, mâu thuẫn với lý do tồn tại của dự án.

### 3.4 · Pháp lý VN đã đổi nền

**NĐ 13/2023 hết hiệu lực 01/01/2026**; thay bằng **Luật BVDLCN 2025 + NĐ
356/2025**. **Điều 14** đòi hồ sơ đánh giá tác động **chuyển dữ liệu xuyên biên
giới** — gửi tin chat người VN tới model nước ngoài rơi đúng vào đó. Chi phí cố
định này kích hoạt ở **khách trả tiền đầu tiên**, không phải ở quy mô lớn.

## 4 · Bảy khoảng trống mới — mỗi cái có bằng chứng

| # | Trống | Bằng chứng | Đáng làm |
|---|---|---|---|
| **G-6** | **Địa chỉ không phân giải được** — `LOCATOR_RE` khớp mọi ngoặc vuông; `[2, 1, 0.5]` và một công thức toán đều qua cổng §7 | đo tại chỗ trên `kb/docs/xgboost-taylor-bac-hai.md` | ✅ **trước tiên** |
| **G-7** | **`citations_sampled`/`verified` là số TỰ KHAI** — `fm.get()`, không dòng nào tính | đo tại chỗ; `CLAUDE.md` cấm `#tự-khai` | ✅ |
| **G-8** | **Không tầng truy hồi nào** — không FTS5/embedding; tìm kiếm FE là lọc chuỗi trên DOM | `kho.schema.sql` · `multiwindow.inline.ts` | ✅ sau G-6/7 |
| **G-9** | **Không đường nạp từ xa** — API nạp đã có, thiếu client | `router.mjs` · `_inbox/` 1 file | ✅ sau core |
| **G-10** | **Không luật nào về dữ liệu GỬI RA** | `brd.md:174` cấm công bố; `security_baseline §4` cấm nghe vào | ✅ **BƯỚC 0** |
| **G-11** | **Chatbot chưa có** — và nếu mọc trong `web/` thì mỗi kênh là viết lại | suy luận kiến trúc | ✅ |
| **G-12** | **Artifact (slide/voice/video)** | `solutions_scan#E` | ✅ **cuối cùng** |

**G-6 + G-7 hợp lại là phát hiện đắt nhất của cả hai đợt:** đường ray chống bịa
**tự khai từ đầu đến cuối**. Một agent ghi `sampled: 5 / verified: 5` rồi rải
`[§II.4]` là qua sạch toàn bộ. Nối với §2 (17–34% bịa): **hệ hiện không có cách
nào phân biệt trích dẫn thật với trích dẫn bịa.**

⇒ Trước khi vá G-6/G-7, **mọi tính năng LLM nhân RỦI RO lên**. Sau khi vá, chúng
nhân **giá trị** lên. Đây là lý do thứ tự ở §6 không đảo được.

## 5 · Ràng buộc cứng — đã đo, s2 không được bỏ qua

| ràng buộc | ở đâu | hệ quả |
|---|---|---|
| **B-D3** *"không chia sẻ công khai"*, đóng dấu `quyết định ✅` | `brd.md:174,214` | **chặn giai đoạn dạy bạn bè** ⇒ FR khi tới đó |
| **M08-R1** API bind `127.0.0.1`, `api-guard` canh | `server.mjs` · `api-guard.test.js` | webhook **không được** nằm trong `web/api/**` |
| **M05-R1** `_inbox/` ép `review_status: draft` vô điều kiện | `gate.py:133` | mọi thứ agent nạp **dừng ở draft** |
| **`ho_so: thu-vien` miễn 4 cổng hình dạng** | `validate.py:255-257` | nạp URL/PDF **không cần LLM** — bằng chứng: `xgboost-stap-by-step.md`, 74 từ, approved |
| `category`/`concepts` **không** trong `required` | `frontmatter.schema.json` | bot bỏ trống hợp lệ — **không cần FR** |
| **Hermes G3** *"`cron` + `gateway` là cò súng ngoài cổng Factory — tắt cả hai"* | `hermes-agent-duoi-factory.md#4` | dùng gateway ⇒ **hai profile tách bạch**, gateway chỉ gọi API nạp |
| kho hiện có **3 bản ghi** | `select count(*) from ban_ghi` | mọi thứ cần "corpus đủ" chưa đo được |

## 6 · Thứ tự bắt buộc — theo phụ thuộc, không theo hứng

```text
G-6 → G-7 → bấm-địa-chỉ-mở-nguồn     ← 0 dòng LLM, 0 phụ thuộc
      ↓                                 di trú: ĐÚNG 1 bản ghi
FR "gửi RA" (viết theo BẬC)          ← G-10, chặn mọi thứ CÓ MODEL
      ↓
M12 chưng cất  ──→  corpus lớn lên     ← máy chấm từng địa chỉ
      ↓
M13 truy hồi (G-8)
      ↓
M14 chatbot — SERVICE CÓ API, không nằm trong web/  (G-11)
      ↓
web = client #1                       ═══ CORE XONG ═══
      ↓
M15 kênh: Telegram → Discord → (Zalo khi khảo xong) → FB   (G-9)
      ↓
M16 artifact (G-12)
      ↓
vòng khép: chat thành nguồn
```

Ba ghi chú thứ tự:

- **G-6/G-7 đứng TRƯỚC M12, không phải sau.** Bản nháp đầu của mục này xếp
  ngược, và nó mâu thuẫn với chính §4: chưng cất là một tính năng LLM, mà
  "trước khi vá G-6/G-7, mọi tính năng LLM nhân rủi ro lên". Chưng cất trên
  một đường ray tự khai là **tự động hoá việc bịa**.
- **G-6/G-7 nằm TRONG core, không phải hạ tầng phụ.** Chatbot trả lời *"theo bài
  X"* mà bấm vào không mở được thì nó là ChatGPT có thêm một bước.
- G-6 chỉ áp cho bản ghi `phan-tich`; nạp-qua-chat sinh `thu-vien` ⇒ **hai việc
  độc lập**, không cái nào làm cái kia đắt lên.

## 7 · Không làm — ghi để khỏi trôi lại

Crawler cho kênh không có API chính thức · tự viết SSG (đã tự viết SSR, xong) ·
tự viết engine tóm tắt · multi-user/auth **bây giờ** (giai đoạn 2) · MTProto
userbot · tự động hoá tài khoản Zalo **cá nhân**.

## 8 · Bốn câu hỏi treo cho s2 — cần NGƯỜI quyết

**Q4 — Bậc của "gửi RA".** Nội dung nào được rời máy, tới đâu, ai duyệt từng bậc?
Bốn bậc đã nhận diện: token adapter · slug/tiêu đề trong phản hồi bot · thân bài
khi dạy bạn bè · tài liệu nguồn tới model. **Chặn mọi thứ phía dưới.**

**Q5 — Cú pháp địa chỉ.** Hôm nay mỗi bài một kiểu: `[§II.4]` · `[nguon.md:1-2]` ·
`[walk-forward-validation-k-fold.md:12-31]` · `[Reading]`. **Chặn G-6.** Ràng buộc
đã biết: nếu không ép mang **vị trí máy dùng được** (`p.7`, `:12-31`) thì việc
bấm-mở-nguồn đắt gấp nhiều lần.

**Q6 — `N` và `X` của "core xong".** Đề xuất định nghĩa đo được: *hỏi một câu trên
web → mọi khẳng định trong câu trả lời đều có địa chỉ **bấm được**, trên corpus ≥
`N` bản ghi, với **% địa chỉ phân giải được ≥ `X`%**, cả hai số do máy tính.*
Không có hai số này thì "core xong" trượt mãi.

**Q2 (treo từ đợt một, chưa giải)** — kho vẫn quá nhỏ để chứng minh giá trị:
08-18 là 0 bản ghi, 08-31 là **3**; ngưỡng README đòi 10.

## 9 · Giới hạn của chính bước khảo sát này

**Độ tin không đồng đều, và chỗ yếu nằm đúng chỗ quan trọng:**

- Khảo kênh: `/deep-research` 24 nguồn, nhưng **28/106 agent chết vì hết hạn mức**,
  gồm **toàn bộ** vòng phản biện cho Telegram/Facebook/pháp lý VN. 15 claim qua
  phản biện — **gần như toàn bộ là Zalo OA**, tức kênh được khuyên *không* làm
  trước. Phần chống lưng cho Telegram là trích nguyên văn `core.telegram.org`,
  **chưa có phiếu phản bác**.
- Khảo NotebookLM: 14/14 agent xong nhưng **chỉ 3/30 claim qua phản biện**.
- **Discord chưa khảo bằng nguồn nào.** Mọi phát biểu về Discord ở trên là
  **[giả định]**, không có nguồn + ngày. s2 không được coi nó là fact.
- **Zalo cá nhân**: mệnh đề *"không có API chính thức"* mới ở mức **[giả định]** —
  chưa tìm bằng truy vấn tiếng Việt về client không chính thức.
- Chưa đo: chi phí token một lần chưng cất · chất lượng model local trên tiếng
  Việt kỹ thuật · tỉ lệ misattribution thực tế của NotebookLM (**không có số liệu
  chính thức** — và đó là chỗ mọi hệ RAG hay vỡ).

## 10 · Đợt ba (2026-09-01) — khảo chi tiết M12–M16

Raw: `m12-m16-services-scan.md` (12 agent · 148 claims · phản biện refute 5).
Đọc §0 của file đó — sáu quyết định đề xuất cho s6 + danh sách câu hỏi chỉ trả
lời được bằng thử nghiệm. Ba điều đổi so với bản trên: **R-g đã đóng** (Discord
gateway = gọi RA, nguồn chính thức — §3.2 hết [giả định]); Zalo Bot API chính
thức đã tồn tại (bot.zapps.me, long-polling — mệnh đề "không có API" ở §7 hết
đúng cho *bot*, tự động hoá tài khoản *cá nhân* vẫn cấm); chi phí chưng cất đã
ước được (~$0.05–0.17/bài Sonnet 5 — mục "chưa đo" ở §9 thu hẹp còn thinking
token + chất lượng tiếng Việt, hai thứ phải đo bằng chạy thật).

## 11 · Đợt bốn (2026-09-01) — reference implementation M13 + M14

Raw: `ref-impl-m13-m14-scan.md` (6 agent đọc MÃ thật · 33 patterns · phản biện
fetch lại file: 23/24 CONFIRMED). §0 của file đó nhập thẳng vào spec s6 được.
Ba điều đáng nhớ nhất: **`đ` không fold được bằng tokenizer nào** — phải
`normalize_vi()` tầng ứng dụng, một hàm cho cả index lẫn query; **mọi repo khảo
được đều drop-im-lặng citation hỏng** — "từ chối có phân loại" của Grown_news
KHÔNG có tiền lệ mã, tự thiết kế + tự viết AC; trần kích thước M14 có tiền lệ
~1.600 dòng/9 file. Bốn câu chờ NGƯỜI chốt ở §0 (anchor unicode vs ASCII-fold
là câu gấp nhất — đổi sau là link chết hàng loạt).

## 12 · Đã ĐO trên máy này (2026-09-01) — bốn câu §9/§11 hết treo

> Khảo sát đọc tài liệu và đọc mã người khác. Bốn mệnh đề dưới đây **chỉ máy này
> trả lời được**, và cả bốn đều được §9/§10/§11 tự khai là *chưa đo*. Chạy thật,
> fixture ở thư mục tạm, không chạm `kb/`.

**a · Điều kiện tiên quyết hybrid: ĐẠT.** `sqlite3.sqlite_version = 3.50.4`
(Python 3.13.7), và `FULL OUTER JOIN` **chạy thật** — không suy từ số phiên bản.
FTS5 có sẵn. Nghĩa là hợp đồng RRF của Alex Garcia (§11 M13-5) cắm được bất cứ
lúc nào; **không có gì phải chờ**, và ngược lại: nếu sau này nó không chạy thì
nguyên nhân là môi trường ĐỔI, không phải thiếu từ đầu.

**b · `remove_diacritics 2` đúng như khảo, và `đ` thật sự không fold.** Đo bằng
gõ-không-dấu-tìm-bản-có-dấu, 6 từ:

| tokenize | `huong`→`hướng` | `bo`→`bộ` (hai dấu) | `phan`→`phần` | `duong`→`đường` | `do`→`Đo` |
|---|---|---|---|---|---|
| `remove_diacritics 2` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `remove_diacritics 1` | ❌ | ❌ | ❌ | ❌ | ❌ |

Hai điều đọc ra: bug của `1` **không chỉ ở ký tự hai dấu** — nó trượt cả `hướng`
và `phần`, tức hầu hết tiếng Việt có dấu thanh, nặng hơn cách §10 mô tả. Và `đ`
là chữ **duy nhất** trong mẫu mà `2` cũng chịu ⇒ `normalize_vi()` tầng ứng dụng
là **bắt buộc**, không phải tuỳ chọn.
*Trigram*: cũng không fold (`huong`→`hướng` = 0 hit). Nhưng các ô `bo`/`ky`/`Đo`
của bảng trigram là **phép đo hỏng** — trigram đòi ≥3 ký tự nên 0 hit ở đó không
nói lên điều gì. Ghi ra để không ai trích ba ô đó làm bằng chứng.

**c · Kho là NFC thuần.** Quét mọi `.md` trong `kb/`: không file nào lệch
`unicodedata.normalize("NFC")`. Câu *"máy này ra NFC hay NFD"* (§10, mục chờ thử
nghiệm) — **NFC**. Vẫn cần một bước chuẩn hoá ở cổng nạp, nhưng nó là *phòng thủ
cho đầu vào tương lai*, không phải sửa chữa hiện trạng.

**d · Câu "anchor unicode hay ASCII-fold" — kho ĐÃ trả lời trên thực tế.**
`slugGoiY()` (`multiwindow.inline.ts:1015-1021`) **đã** ASCII-fold: `NFD` → bỏ
`[̀-ͯ]` → `đ`→`d` → `[^a-z0-9]+`→`-` → cắt 60. Và 0/5 tên file trong
`kb/` có ký tự ngoài ASCII. Chọn *unicode anchor* bây giờ là để **hai luật slug
khác nhau** trong một hệ — tên file một kiểu, anchor một kiểu.
Chú thích ngay trên hàm đó đã ghi sẵn *"`đ` phải xử riêng vì nó KHÔNG phân rã
được"* — tức phát hiện (b) của đợt bốn đã nằm trong repo từ trước, khảo sát chỉ
xác nhận lại.

> **Lỗ THẬT, và nó khác câu đang hỏi:** grep `NFD|unicodedata|combining` trong
> `core/` + `05_intake/` ⇒ **0 kết quả**. Hàm này chỉ tồn tại bằng **JavaScript**,
> mà M13 (indexer) là **Python**. Nên rủi ro §11 nêu — *"một hàm dùng chung
> indexer + renderer, lệch là link chết"* — không phải nguy cơ tương lai: bản
> Python sẽ là bản **thứ hai**, và đây đúng lớp lỗi hai-bản-schema đang làm
> `check_danh_muc` đỏ. Phải chốt ở s6 **cách** một hàm phục vụ hai ngôn ngữ
> (sinh từ một bảng khai · hoặc Python là bản chuẩn và JS đọc qua `define`),
> chứ không chỉ chốt *unicode hay ASCII*.

*Object*: `scratchpad/do_fts5_vi.py` — in `sqlite_version`, chạy `FULL OUTER
JOIN`, dựng 3 bảng FTS5 trong `%TEMP%/gn_fts_*`, 6 từ × 2 chiều × 3 tokenizer.


## 13 · Chỉ đạo 2026-09-01 — ba thứ tiếng + model thay được, và cái giá của chúng

Chủ dự án ra hai yêu cầu **sau** khi đợt ba/bốn đã chốt khuyến nghị. Cả hai đổi
kết luận đã có, nên ghi ở đây chứ không sửa §10/§11 (chúng là hồ sơ của một thời
điểm).

### 13.1 · Ngôn ngữ: 80% Việt có dấu · 10% Anh · 10% Trung **phồn thể**

§11 chọn `unicode61 remove_diacritics 2` sau khi chỉ nghĩ tới tiếng Việt.
**Đo trên tiếng Trung thì lựa chọn đó sập hoàn toàn:**

| tokenizer | vi có dấu | vi không dấu | `đ` | en | zh 2 chữ | zh 3-4 chữ |
|---|---|---|---|---|---|---|
| `unicode61 remove_diacritics 2` | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| `trigram` | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ |

Nguyên nhân đo được, không suy: **`unicode61` cắt câu 15 chữ Hán thành ĐÚNG MỘT
token** (`fts5vocab` xác nhận: `'機器學習模型的記憶體最佳化指南'`, 15 ký tự, 1
term). Tiếng Trung không có dấu cách nên tokenizer tách-theo-khoảng-trắng coi cả
câu là một từ ⇒ **mọi** truy vấn tiếng Trung trả 0. `trigram` cứu được từ ≥3 chữ
nhưng chết ở từ **2 chữ** — độ dài phổ biến nhất của tiếng Trung — và đánh mất
fold dấu tiếng Việt.

**Cách thoát, đã đo 10/10 đúng:** giữ **MỘT** bảng, **MỘT** tokenizer
(`unicode61 remove_diacritics 2`), và đẩy toàn bộ việc vào **MỘT hàm chuẩn hoá**
áp cho *cả cột index lẫn query*:

```
chuan_hoa(s):  NFC → lower → đ→d → chèn dấu cách quanh MỖI chữ Hán → gom space
```

`'機器學習模型'` → `'機 器 學 習 模 型'` ⇒ mỗi chữ Hán thành một token ⇒ truy vấn
`記憶` thành cụm `"記 憶"` và phrase query bắt được. Câu **trộn** Việt+Trung cũng
ra. Việt: `đường` và `duong` đều hit, vì `đ→d` chạy trước `remove_diacritics`.

> **Đây là củng cố, không phải phát sinh.** §11 đã bắt buộc phải có
> `normalize_vi()` vì `đ` không fold được. Yêu cầu tiếng Trung không thêm một
> tầng mới — nó **thêm hai dòng** vào một hàm vốn đã bắt buộc. Đổi tên thành
> `chuan_hoa()`: nó không còn chỉ phục vụ tiếng Việt.

**Giá phải trả, nói trước:**

- Chèn cách từng chữ Hán = **chỉ mục mức KÝ TỰ**. `"資 料"` cũng khớp một câu mà
  `資` và `料` tình cờ đứng cạnh nhau qua ranh giới từ. Với kho cỡ này chấp nhận
  được, nhưng nó là **mất độ chính xác có thật**, không phải không có.
- `bm25` trên token-một-chữ cho điểm khác hẳn token-một-từ ⇒ `w_title` phải đo
  lại **riêng cho tiếng Trung**, không dùng chung số với tiếng Việt.
- **Phồn thể ≠ giản thể**: `資料` sẽ KHÔNG khớp `资料`. Chỉ đạo nói phồn thể; nếu
  nguồn lẫn giản thể thì cần thêm một bước fold (OpenCC) — **chưa làm, chưa đo**.
- Golden set của §11 phải thêm nhánh tiếng Trung: từ 1 · 2 · 4 chữ, và một câu
  trộn Việt+Trung.

*Object*: `scratchpad/do_fts5_ba_thu_tieng.py` (chứng minh chỗ sập, kèm
`fts5vocab` đếm token) · `scratchpad/do_chuan_hoa_mot_ham.py` (10/10, 7 tài
liệu × 10 truy vấn, một bảng `chunks` + `content=` external content).

### 13.2 · Gọi model nào cũng được, tuỳ tác vụ

§10 chốt *"Sonnet 5 + Citations API là đường chính"* **vì** Citations là thứ duy
nhất trả `page_location` được API bảo đảm. Yêu cầu "model nào cũng được" làm
**mệnh đề đó hết đứng**: OpenAI · Gemini · DeepSeek · Kimi **không có** tính
năng tương đương.

Hệ quả không phải "mất trích dẫn" — mà là **đổi chỗ đặt bảo đảm**:

> Trước: provider bảo đảm địa chỉ, ta verify **thêm** cho chắc.
> Sau: **ta** là nơi duy nhất bảo đảm địa chỉ. Model chỉ được yêu cầu trả
> **quote nguyên văn**; vị trí do `re.finditer(re.escape(quote))` của ta tính.

Điều này **đã** nằm trong §10-2 (*"vẫn PHẢI verify máy sau model"*, citation
không ràng buộc sai 37–94%) — nên cổng verify không phải việc mới. Cái mới là nó
từ *lưới an toàn* thành *nền móng*, và Claude Citations tụt xuống **đường tắt
tuỳ chọn**, không phải điều kiện.

Kéo theo, phải chốt ở s6:

- **Hợp đồng adapter một hình dạng**: `(prompt, tài_liệu) → {text, quotes[]}`.
  Mọi thứ riêng của provider nằm **dưới** nó.
- **Bảng khai `core/assets/model.json`** — tác vụ → model, kèm `nha_cung_cap` ·
  `can_key` · giá · `ho_tro_citations`. Cùng khuôn `dich-vu.json`. Không gõ tên
  model ở tầng thứ hai.
- **Egress**: `FR-043` bậc 4 đòi log mỗi lần dữ liệu rời máy. N provider = N
  đích. Allowlist đích phải là **bảng khai**, và `can_key_model` trong
  `dich-vu.json` từ một cờ boolean thành **danh sách key** — THỢ nay giữ N khoá.
- Tiếng Trung 10% đáng cân nhắc DeepSeek/Kimi cho đúng tác vụ đó — nhưng
  **chưa đo**, và không được chốt bằng cảm giác.

### 13.3 · Luật định tuyến theo ngôn ngữ (chỉ đạo bổ sung 09-01)

> Nội dung **tiếng Trung** ⇒ gọi **Kimi** hoặc **DeepSeek**.

Hợp lý về chất lượng: hai model này huấn luyện nặng tiếng Trung, và 10% corpus là
phồn thể. Nhưng nó biến `model.json` từ một bảng tra **tác vụ → model** thành
**(tác vụ × ngôn ngữ) → model**, và kéo theo ba thứ phải chốt ở s6:

1. **Ai phát hiện ngôn ngữ, và bằng gì?** Không được để model tự khai — đó là
   thước đo của chính nó. Dùng phép đếm: tỉ lệ ký tự Hán trên tổng ký tự, cùng
   dải regex đã dùng trong `chuan_hoa()` (`[㐀-䶿一-鿿豈-﫿]`). Một hàm, hai chỗ
   dùng. Ngưỡng phải khai thành số trong bảng, không giấu trong mã.
2. **Tài liệu TRỘN thì sao?** §13.1 đã có ca thật: *"Kết hợp 資料管線 với pipeline
   tiếng Anh"*. Bài 80% Việt kèm một đoạn trích tiếng Trung **không** nên đẩy
   sang Kimi. Luật phải nói theo **tỉ lệ**, không theo *"có chữ Hán hay không"*.
3. ⚠️ **Đích gửi RA đổi khu vực pháp lý.** `FR-043` bậc 4 + `B-E5` (NĐ 356/2025
   Điều 14, **đã kích hoạt** từ khi `FR-045` thêm 5 tài khoản đồng nghiệp) đòi hồ
   sơ đánh giá tác động **chuyển dữ liệu xuyên biên giới**. DeepSeek và Kimi là
   pháp nhân Trung Quốc ⇒ đây là **một đích khác** với OpenAI/Anthropic, không
   phải "thêm một dòng vào allowlist". Không cản việc dùng — nhưng bảng khai
   phải mang cột **khu vực pháp lý**, và hồ sơ Điều 14 phải liệt đủ đích.
   Chưa làm, chưa có ai được ký.

## 12 · Đợt năm (2026-09-02) — UI hai mặt cho M12–M16

Raw: `ui-embed-matrix-scan.md` (47 patterns · 30/36 CONFIRMED). Bản chưng nằm ở
`05_uiux/ma-tran-module-man.md` — ma trận surface×năng lực + pattern từng ô.
Bốn điều chốt được: nhịp ĐÔI (tác vụ giây inline · tác vụ phút fire-and-track,
không optimistic UI); trang quản lý KHÔNG chia theo module mà theo LOẠI việc
(Xưởng · Hàng đợi duyệt · Kênh & tài khoản · Cấu hình read-only trỏ file);
nối hai mặt bằng job id bền + deep-link hai chiều + thông báo 3 tầng; ma trận
theo OOUX CTA Inventory + 3 component khai một chỗ.


## 14 · Đợt năm (2026-09-02) — chatbot có phạm vi tri thức riêng

Raw: `chatbot-pham-vi-tri-thuc.md` (106 agent · 4,93M token · phản biện 3 phiếu).
Đọc §0 của file đó. Ba điều đổi thiết kế M14, và một điều phải nói về chính bản
khảo này.

**1 · Mọi rò rỉ đã tài liệu hoá đều ở TẦNG TRUY HỒI, không cái nào ở prompt.**
Bốn CVE, bốn hệ, cùng một tầng: `CVE-2026-44560` Open WebUI (3/5 đường chạy query
không kiểm quyền, **nhận tên collection từ client** và tên đó **đoán được** ⇒ *"thu
hồi quyền VÔ HIỆU với nội dung RAG"*; bản vá bị phá lại ở `CVE-2026-54019`) ·
`CVE-2025-41258` LibreChat (**dùng chung một JWT secret** giữa session và RAG API ⇒
đi vòng ACL một lúc, và có cả **GHI**) · `CVE-2026-47713` AnythingLLM (**fail-open**:
thiếu danh tính ⇒ vị từ WHERE **biến mất**).

⇒ Điều này **xác nhận trực tiếp** câu tôi lo khi đặt câu hỏi: cưỡng chế phạm vi
bằng **system prompt** là một **lời hứa**, không phải một cổng.

**2 · Có bảng liên kết KHÔNG có nghĩa là có cách ly.** Onyx có bảng liên kết ở bốn
mức, và chú thích trong chính mã nó nói *"These are only defaults, users can select
from all if desired"* + *"**When none are set, the assistant can see everything**"*.
Vế cứng duy nhất đến từ một **biến môi trường**, không từ bảng.
⇒ `bot_document(bot_id, doc_id)` là **cần nhưng không đủ**. Tính chất cách ly nằm ở
chỗ phép lọc là **vô điều kiện** hay **tuỳ chọn**.

**3 · Mặc định của tiền lệ là mặc định SAI cho ta.** Onyx `is_public` default
**True** (persona hiện với cả tổ chức trừ khi ai đó đặt private); AnythingLLM
`chatMode` mặc định `automatic` nên **cấu hình mặc định KHÔNG từ chối** khi không có
gì trong phạm vi khớp. Cả hai phải **đảo**.

**4 · Điều phải nói về bản khảo này.** Agent dò đúng khoảng trống quan trọng nhất
(`no-vector SQLite/FTS5 scoped retrieval`) **đã CHẾT** giữa đường. Và **bốn** hệ
không được khảo — Khoj · RAGFlow · Morphik · SurfSense — mà đó *chính là* nhóm dễ có
tiền lệ **lexical/hybrid** nhất. Nên kết luận *"không có tiền lệ cho FTS5
pre-filter"* là **chưa dò xong**, không phải đã dò và không thấy. Đừng trích nó như
một sự thật đã xác lập.

**5 · Hai chỗ UNKNOWN, và chúng là UNKNOWN chứ không phải ngược lại.** Custom GPT:
**cả hai** claim bị refute 0-3, gồm claim "20 file / 512 MB" ⇒ **không được trích số
đó**. Claude Projects: **0 claim sống sót**.

## 15 · Đợt sáu (2026-09-07) — M13 là dịch vụ NỀN, không phải module một khách

Raw: `m13-truy-hoi-dich-vu-nen.md` (đo từ spec + mã, không khảo ngoài). Chỉ đạo:
*"M13 là dịch vụ… là core để xây dịch vụ sau… web call API… mỗi module M12–M19 là
một service"* (`original_request.md` 2026-09-07).

Chín kết luận đo được, ba cái đổi thiết kế:

1. **Toàn bộ G3/G5/G6A khai M13 có MỘT khách: M14** (`spec_overview:469` nguyên văn
   *"khách hàng duy nhất"*). Mệnh đề "nền + web gọi" là **đổi phạm vi G3**, cần FR.
2. **Khách duy nhất đó là THỢ→THỢ**, mà `ADR-05` luật 2 cấm bằng chữ in, và **không
   cổng nào canh** (Z8 vắng trong `check_ba.py`). M12 cấm THỢ→THỢ bằng cổng thật;
   M13 không nói; M14 giả định được. **Ba module một vùng, ba luật.** ⇒ cần ADR.
3. **Hợp đồng API ở ba chỗ, ba hình dạng** (`model_flow` · G5 `truyhoi.sample.v2` ·
   M14 `doc_id/anchor`); M13 spec **0 lần** dùng chữ `doc_id`.
4. `file#anchor` **không là một dạng** trong `dia-chi.json`; C3 chưa sinh `id`.
5. M13 chỉ index `than` ⇒ **tài liệu và video vô hình** với RAG (2/3 kho). PDF
   **không được trích text ở đâu** (dep có, mã không gọi). Transcript `.vtt` có trong
   `media` nhưng M13 cố ý không chạm.
6. `truyhoi.can_key_model: true` vs `M13-R5` 0 lời gọi mạng — bảng khai lệch.
7. **Hai `chuan_hoa()` cùng tên trong một repo** (`chungcat/src/verify.py` ≠ M13 §3).
8. PRD **U6** đã hứa full-text từ đợt một ⇒ "web gọi M13 để tìm" là **trả nợ**, không
   phải scope mới.
9. Kho **0 bài Trung** — golden 4 ca zh không có vật liệu.

Chín giả định phải chốt (G1–G9) ở `§8` của raw; **G1 (THỢ→THỢ) là ADR, quyết cả
kiến trúc**. Thứ tự đề nghị ở `§9`: việc rẻ không frozen → ADR → FR M13/M01 → dữ
liệu → s7.


## §16 · Space Model — đa vũ trụ tri thức (2026-09-09)

Chỉ đạo mới trước khi s7 M13. Khả thi và đúng lúc (kho 14 bản ghi). Va chạm chính: hệ đã có ba cơ chế khoanh phạm vi (`pham_vi` · bot→doc_id · M19 giữ chỗ); Space phải **thay** M19, không cộng thêm. Đề bài R1–R6 cho team + 4 câu chủ dự án quyết: `space-model-danh-gia-va-de-bai.md`. M13 không dừng; **R1 (slug toàn hệ hay theo space) chặn hình dạng `doc_id`**.

## §17 · Transcript + chưng cất "như ChatGPT" (2026-09-09)

Khảo: `m12-chat-luong-transcript-chung-cat.md`. Gap: G-13…G-16.

**Kết luận một câu**: khoảng cách với mẫu phần lớn **không nằm ở model** — nằm ở
ba phép hậu xử lý (gộp đoạn ~30 s · header metadata · khuôn theo thể loại) và một
máy in còn thiếu. Bốn việc đầu **không tốn một lời gọi model** nào.

| việc | sửa | gọi model | cỡ |
|---|---|---|---|
| gộp cue → đoạn ~30 s, mốc `[mm:ss]` | bản xuất + tab Transcript; `.vtt` giữ nguyên là gốc | không | nhỏ |
| header: file · thời lượng · ngôn ngữ · model · bối cảnh 3 dòng | in từ frontmatter + cue cuối + `model_asr`; bối cảnh là một mục prompt | không* | nhỏ |
| bảng khai **khuôn theo loại nội dung** (`ky-thuat` = 5 mục hiện tại · `bai-giang` · `talkshow`), mỗi khuôn giữ 2 mục neo cho verify; prompt thêm "≥3 cặp thì dùng bảng" | `_PROMPT` → bảng khai | có (đã gọi sẵn) | vừa |
| **Typst** làm máy in — một binary, gọi từ THỢ như `ffmpeg` | THỢ + nút xuất PDF | không | vừa |
| `faster-whisper large-v3-turbo` local — lối `uu_tien 3` **đã khai, `asr.py` đã có, nhưng worker chưa nối** (`_chon_loi` luôn ra `cua-asr`, không `import asr`) | nối `_chon_loi`→`asr.py` + `pip install .[asr]` + đo CPU 56 nhân | không (0 egress) | vừa–lớn, **cần đo** |

**MCP**: không phải cho runtime — ba server khảo được đều bọc TeX Live/LibreOffice;
`subprocess` trong THỢ là đúng khuôn dự án. Có chỗ cho một MCP mỏng bọc LÕI để
Claude Code thao tác kho, nhưng đó là M13/M14.

**Không làm**: bỏ `[slug:p.N]` (là `M12-R2`); đổi định dạng lưu khỏi `.vtt`.

**Ba phép đo phải làm trước khi chốt** (đều là [G] hiện tại): tốc độ faster-whisper
INT8 trên máy này · Typst render dấu tiếng Việt · WER Gemini vs Whisper trên **cùng**
audio `thay_on_bai_thi_final` đã có trong kho — mẫu ChatGPT là mốc để so.
