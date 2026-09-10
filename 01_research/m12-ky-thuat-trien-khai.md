# M12_chungcat — nghiên cứu kỹ thuật trước khi thi công

> Khảo 2026-09-02 · đọc từ `06_modules/M12_chungcat/**` (s6 đã đóng G6A) ·
> `.factory/fr/FR-043` `FR-044` `FR-046` `FR-047` · `04_system/adr.md#ADR-05`.
>
> **Câu hỏi của file này**: spec nói *làm gì*; file này trả lời *làm bằng gì, và
> chỗ nào spec sẽ vỡ khi gặp thư viện thật*.
>
> **PHẦN A** (§1–7) — chỗ spec vỡ khi gặp thư viện thật: **bốn chỏi spec**
> (§1 §2 §3 §4) · **hai lỗ spec** (§5 §6) · một cơ hội (§7).
> **PHẦN B** (§8–13, thêm 09-02) — build-vs-buy và hình dạng mã.
> **PHẦN C** (§14–20, thêm 09-03, viết lại sau Q&A) — đường **video**: transcript
> thành hiện vật, `sinh-transcript` là job riêng, hai lối lấy transcript.
> Mỗi mục: bằng chứng · hệ quả · đề xuất.
>
> Sửa hợp đồng đi qua **`FR-053`** (bốn chỗ sai + người chọn model) và
> **`FR-054`** (đường video). Spec/rules của M12 **frozen** — không sửa tại chỗ.

---

## 1 · `PyMuPDF` là bẫy giấy phép — dùng `pdfplumber`

**fact** · PyMuPDF + MuPDF phát hành **AGPL** hoặc thương mại. Dưới AGPL, phần mềm
dùng nó mà **triển khai công khai — gồm cả tool nội bộ, SaaS, hosted API** — phải
hoặc mở mã theo AGPL, hoặc mua giấy phép của Artifex.
`pdfplumber` là **MIT**; `pypdf` là **BSD-3**.
*(nguồn: file2markdown 2026 · nutrient.io 2026)*

**fact** · Đánh đổi tốc độ: PyMuPDF nhanh **8–12×** pdfplumber trên rút text thuần
(180 vs 18 trang/giây). pdfplumber mạnh hơn ở **bảng**, không có OCR sẵn.

**hệ quả cho dự án này**: `FR-045` vừa thêm 5 tài khoản và `M17_cong` nghe 443 —
tức hệ **sẽ** được triển khai cho người khác dùng. Đó đúng là mệnh đề kích hoạt
AGPL. Và giấy phép là thứ **không có cổng nào bắt được**: `check_*` không đỏ, CI
xanh, vấn đề nổ ba năm sau ở dạng một lá thư.

**đề xuất** · `pdfplumber` (MIT). Tốc độ **không phải ràng buộc của M12**: nó chạy
*phút* theo thiết kế (`ADR-05`), một PDF 23 trang ở 18 trang/giây là ~1.3 giây —
nhỏ hơn nhiễu của một lời gọi model. Đổi 10× tốc độ ở chỗ không ai đo để lấy một
giấy phép sạch là đổi đúng chiều.

**thêm một dòng vào bảng khai**: `thu_vien_pdf` + `giay_phep` trong
`chungcat/assets/model.json` (hoặc bảng riêng). Lý do cùng `M12-R4`: lần sau ai
đổi thư viện, giấy phép phải là thứ **đọc được**, không phải thứ nhớ ra.

---

## 2 · `re.finditer(re.escape(quote))` SẼ trượt — và đây là rủi ro số một

Spec `§3` + `model_flow §4` khai phép định vị lại là
`re.finditer(re.escape(quote))`. **Khớp nguyên văn là điều kiện quá mạnh**, và nó
trượt vì bốn nguyên nhân độc lập:

| nguyên nhân | ví dụ |
|---|---|
| **ligature** của PDF | `fi` `ffi` ra một ký tự Unicode, không phải hai chữ |
| **gạch nối cuối dòng** | `boost-\ning` — model trả `boosting`, nguồn có gạch + newline |
| **khoảng trắng** | PDF cho `\n` giữa câu, cột đôi cho khoảng trắng kép |
| **model chuẩn hoá** | nháy `"` → `"`, gạch `—` → `-`, và **model tóm lại thay vì trích** |

**fact** · Nghiên cứu về xác thực trích dẫn dùng **fuzzy** chứ không dùng khớp
tuyệt đối: `rapidfuzz` Levenshtein chuẩn hoá với **ngưỡng 0.9**, hoặc
`difflib.SequenceMatcher` tìm chuỗi con khớp dài nhất rồi tính `2M/T`.
`partial_ratio` là phép đúng cho *"tìm chuỗi này bên trong tài liệu"*.
*(nguồn: arXiv 2511.11594 TimeStampEval · arXiv 2605.27700 CiteCheck)*

**hệ quả sắc** · `AC-3.2` viết *"quote không tìm thấy nguyên văn ⇒ khẳng định bị
**từ chối**"*. Cài bằng `re.escape` thuần thì **phần lớn quote thật bị từ chối** —
đúng lớp lỗi **đỏ oan** mà `FR-046`/proposal đã trả giá một lần với `LOCATOR_RE`.
Và hệ quả tệ hơn lọt: người thi công sẽ hạ ngưỡng cho tới lúc cổng hết đỏ.

**đề xuất — ba tầng, ngưỡng trong bảng khai, không trong mã**:

```
1. chuẩn hoá cả hai vế   NFKC · gỡ ligature · nối gạch-nối-cuối-dòng
                          · nén mọi khoảng trắng về một space · casefold
2. khớp chính xác trên bản đã chuẩn hoá        ⇒ verified
3. rapidfuzz.partial_ratio_alignment ≥ nguong  ⇒ verified, kèm điểm
   dưới ngưỡng                                  ⇒ TỪ CHỐI khẳng định
```

Bước 1 làm bước 2 xử lý hầu hết ca thật; bước 3 chỉ còn gánh phần thừa.
`partial_ratio_alignment` trả **cả vị trí** — tức nó cho luôn `p.7` mà `V` cần,
không phải chạy hai phép.

**Cổng phải có HAI vế, không một** (đây là chỗ `testcases.md` nên thêm):

| vế | fixture | phải |
|---|---|---|
| **bắt được bịa** | quote không có trong PDF | ĐỎ |
| **không đỏ oan** | quote thật, nhưng nguồn có `boost-\ning` + ligature `fi` | XANH |

Thiếu vế thứ hai thì cổng *"xanh khi mọi quote khớp"* nghiệm đúng bằng cách
**từ chối tất cả** — cổng không phân biệt được *"không có khẳng định nào"* với
*"mọi khẳng định đều sai"*.

**`ngưỡng` là số phải ĐO, không đoán.** Kho có đúng 1 PDF; chạy 10 quote thật qua
ba tầng rồi mới chốt. Cùng lý do `M6.2` chưa đặt trần token.

---

## 3 · Claude Citations **KHÔNG dùng chung được** với structured output — 400

**fact** (tài liệu Anthropic, qua skill `claude-api`) · Citations bật bằng
`citations: {enabled: true}` trên **từng** document block (**tất cả hoặc không**).
Vị trí trả về: `char_location` (`start_char_index`/`end_char_index`) cho text
thuần · `page_location` (`start_page_number`/`end_page_number`, **1-indexed**) cho
PDF. **Và: `Incompatible with output_config.format (returns a 400)`.**

**hệ quả** · Spec `§3` khai hợp đồng `(prompt, tài_liệu) → {text, quotes[]}` —
tức **structured output**. Trên đường Anthropic, bật citations **cộng** ràng buộc
schema là **lỗi 400**, không phải "kém tối ưu". Nên `spec §3` gọi Citations là
*"đường tắt tuỳ chọn"* thì đúng về ý định nhưng **chưa đo**: đường tắt đó **không
cắm được vào cùng một lời gọi** với hợp đồng.

Ba lối, và tôi khuyên lối ba:

| lối | giá |
|---|---|
| a. Anthropic dùng **tool use** (`strict: true`) thay `output_config.format` | tool use là *cơ chế khác* — **chưa xác minh** citations có đi cùng nó được. Phải thử thật trước khi khai vào spec |
| b. Hai lời gọi (một lấy citations, một lấy JSON) | **gấp đôi egress** — chỏi thẳng `M12-R6` (trần 2 lần gửi) và `FR-043` bậc 4 |
| c. **Bỏ hẳn Citations API** | mất đường tắt; được **một** đường duy nhất cho mọi nhà |

**Lối c mạnh hơn nó trông.** `model_flow §4` đã tự lập luận đúng điều này: *"kể cả
khi provider trả `page_location` được API bảo đảm, ta vẫn định vị lại… nếu đường
Claude bỏ qua `V` thì `V` chỉ được chạy trên các nhà khác, và một lỗi trong `V` sẽ
không bao giờ lộ ra ở đường phổ biến nhất."* Nếu `V` **luôn** chạy và là nơi duy
nhất bảo đảm, thì Citations không mua thêm gì — nó chỉ thêm một nhánh mã, một
ngoại lệ 400, và một đường ít được kiểm.

⇒ **Đề xuất**: bỏ Citations khỏi hợp đồng. Model chỉ được yêu cầu trả **quote
nguyên văn**; `ho_tro_citations` trong `model.json` **giữ làm cột thông tin**,
không làm cột điều khiển. Sửa `spec §3` một câu.

**Giới hạn PDF phải khai** (fact): base64 **32 MB/request**, **600 trang** (100
trang với model context 200K). PDF đang có trong kho là ~2.8 MB — an toàn, nhưng
`tong-hop-chu-de` gộp N nguồn thì trần 32 MB là **trần thật** và phải có cổng, vì
vượt nó là 400 **sau khi** đã tính `sha256` và ghi `egress.jsonl` — tức log ghi
một lần gửi **không bao giờ xảy ra**.

---

## 4 · `os.replace` **không nguyên tử trên Windows** — tiền đề của AC-5.2 vỡ

**fact** · `os.replace` gọi `MoveFileEx(MOVEFILE_REPLACE_EXISTING)`. **MoveFileEx
không được bảo đảm nguyên tử**, và *"under certain and unknown circumstances it may
silently fall back to a non-atomic call to `CopyFile()`"*. `ReplaceFile` là lựa
chọn được hỗ trợ tốt hơn nhưng **có thể mất file khi OS crash**; `MoveFileEx` an
toàn hơn nhưng **giữ lock trên đích**. `MOVEFILE_WRITE_THROUGH` buộc chặn tới khi
xong, giúp độ bền.
*(nguồn: rust-atomicwrites#27 · pyosreplace · thảo luận PostgreSQL `pgrename` ·
OpenJDK nio-dev 2023 — `ATOMIC_MOVE` trượt khi tần suất cao trên Windows)*

**hệ quả** · `spec §5` trả lời câu *"thợ chết giữa chừng"* bằng: *"`os.replace`
**nguyên tử** nên không có trạng thái nửa vời để treo"*, và `AC-5.2` đo đúng câu
đó. **Máy phát triển đang là Windows 10.** Nên tiền đề của một AC `hard` là một
mệnh đề **sai trên nền tảng đang chạy**, và cổng sẽ **xanh** vì crash-lúc-đúng-chỗ
là ca hiếm — đúng kiểu hỏng im lặng.

**đề xuất** · Không sửa Maildir — sửa **cách chứng minh**:

1. **Đích không bao giờ tồn tại trước.** `new/<ULID>.json` mang tên **duy nhất**
   (ULID), nên `os.replace` chạy vào đường **rename không đè** — đó là đường ít
   rủi ro nhất của `MoveFileEx`, và fallback `CopyFile` (chỉ liên quan khi phải
   thay file đang có) hết cửa. Khai điều này thành **luật**, không để nó là tình cờ.
2. `AC-5.2` đổi cách đo: cổng phải chứng minh **`new/` không chứa JSON parse-lỗi**
   sau N lần giết tiến trình — chứ không phải khẳng định *"os.replace nguyên tử"*.
   Một tính chất đo được thay một tính chất tin tưởng.
3. Nếu về sau job có bước **đè** file trong `new/`, đó là lúc phải nhìn lại mục này.
   Ghi vào backlog M12 ngay khi bước đó xuất hiện.

---

## 5 · LỖ SPEC · nguyên liệu **video không có byte** — gửi gì cho model?

**đo tại chỗ 2026-09-02**:

```
bai_viet : 1  (xgboost-taylor-bac-hai, ho_so phan-tich)
tai_lieu : 1  (xgboost-stap-by-step — media[].sha256 → có byte PDF)
video    : 1  (thien-duong-chuot… — url: https://youtu.be/85kbC_s8Ldg)
media    : 1  hàng — ĐÚNG một, là PDF
```

`M11_video` khai *"đăng ký URL YouTube/TikTok; **không byte vào kho**"*. Nhưng
`spec M12 §1` khai **Vào**: *"`slug` nguyên liệu · byte ở `kb/_media/<sha256>`"*.

⇒ Với một bản ghi `video`, **M12 không có gì để gửi**. Và ba đường ra đều có giá:

| lối | vướng |
|---|---|
| tải video về | `Scope OUT` của proposal cấm crawler/scraper; YouTube ToS |
| lấy transcript qua API kênh | `B-E4` — *chỉ cắm kênh có bề mặt CHÍNH THỨC*; đây là **egress mới**, đích mới ⇒ phải vào allowlist `model.json` (`AC-6.3`) và có thể là **FR** |
| **người dán transcript vào `than`** khi nạp video | 0 egress mới, 0 luật mới — nhưng là **việc của người**, và `M11` chưa có ô đó |

**đề xuất** ~~Chốt phạm vi ngay ở s7: C4 chỉ làm `tai-lieu` (PDF)~~ →
**ĐÃ THAY, 2026-09-03**: chủ dự án chốt **làm cả video**. Bảng ba lối ở trên là
bản khảo **sơ**, và nó thiếu hai lối (`yt-dlp` + ASR local · dịch vụ nhận URL) —
xem **PHẦN C §18** cho bản khảo đủ, và **§19** cho flow đã chốt. Chia task:
**`C4a`** `tai-lieu` · **`C4b`** `sinh-transcript` · **`C4c`** `video` chưng cất.

⚠️ `M6.1` đo *"≥8/10 tài liệu cho ra bản nháp duyệt được"* — kho có **1** tài liệu.
Không phải lỗi của M12, nhưng nó nói: **nạp nguyên liệu phải đi trước C4**, nếu
không thì C4 xong mà không đo được gì.

---

## 6 · LỖ SPEC · trần 2 lần gửi **đụng** tỉ lệ trượt schema của DeepSeek

**fact** · Tỉ lệ lệch schema đo trên 244 model (2026): OpenAI Structured Outputs
**<0.1%** · Anthropic tool use **<0.2%** · Gemini schema **<0.3%** · OpenAI JSON
mode **2–5%** · **DeepSeek JSON 5–12%**. Anthropic làm structured output **bằng
tool use**; OpenAI/Gemini bằng constrained decoding.
*(nguồn: Requesty 2026 · Glukhov, Medium)*

**hệ quả — hai luật đúng riêng, sai khi gặp nhau**:

- `M12-R4`/`AC-4.2`: tiếng Trung → **Kimi hoặc DeepSeek**.
- `M12-R6`: **trần 2 lần GỬI**, `lan_gui` **không bao giờ reset**.

Một lần trả JSON lệch schema **phải gửi lại** — và lần gửi lại đó **là một lần
tài liệu rời khỏi máy**, nên nó **tăng `lan_gui`**. Ở 5–12%, xác suất hai lần liên
tiếp đều lệch là **0.25%–1.4%**: cỡ **1 trong 70 đến 1 trong 400 job** tiếng Trung
**chết vĩnh viễn** vì nhiễu định dạng, không vì nội dung. Người chỉ thấy *"job
lỗi, không chạy lại được"*.

**đề xuất** · Tách **hai loại thất bại**, vì chúng khác nhau về đạo lý:

| loại | có tăng `lan_gui`? |
|---|---|
| nội dung không đạt (quote bịa, địa chỉ ngoài `nguon`) | **CÓ** — phải gửi lại thật |
| **phản hồi không parse được** (JSON lệch schema) | vẫn **CÓ** — dữ liệu đã ra ngoài rồi |

Không có lối lách: một byte đã rời máy là đã rời. Nên chỗ sửa là **giảm xác suất
lệch**, không phải nới trần:

1. `model.json` thêm cột **`kieu_structured`**: `tool_use` · `json_schema` ·
   `json_mode`. Nhà nào chỉ có `json_mode` thì **schema phải đơn giản hơn** —
   `{text, quotes[]}` phẳng, không lồng.
2. `nguong_lech_schema` **đo rồi khai**: nhà nào vượt ngưỡng thì
   **không được là `du_phong`** cho tác vụ chưng cất. Đây là cổng khai báo, cùng
   khuôn `AC-4.3`.
3. Khi `lan_gui = 2` mà cả hai lần đều **lệch schema** (không phải lỗi nội dung),
   thông báo cho người phải **nói rõ điều đó** — vì hành động đúng là *tạo job mới
   với nhà khác*, không phải *sửa bài*.

---

## 7 · CƠ HỘI · Batch API giảm **50%** chi phí, và M12 đã bất đồng bộ sẵn

**fact** · Message Batches chạy bất đồng bộ ở **50% giá**. Model + giá hiện hành:
Opus 5 `claude-opus-5` **$5/$25** per MTok · Sonnet 5 `claude-sonnet-5`
**$2/$10** · Haiku 4.5 `claude-haiku-4-5` **$1/$5**. Kết quả trả về **không theo
thứ tự** — khoá bằng `custom_id`, không bằng vị trí.

**vì sao khớp M12 một cách bất thường** · `ADR-05` đã bắt M12 phải bất đồng bộ:
*"`POST` trả `viec_id` ngay, `GET /viec/<id>` hỏi tiến độ. Không giữ kết nối HTTP
5 phút."* Đó **đúng** hình dạng Batch. `custom_id` **đúng** là `job_ulid` — thứ
`AC-5.1` đã chọn làm khoá idempotency.

**cái phải cẩn thận, không bỏ qua** · `M12-R3` đòi log **TRƯỚC khi gửi**, và
`AC-6.1` đo bằng `seq`. Với Batch, *"gửi"* là **lúc submit batch**, không phải lúc
lấy kết quả. Nên: một dòng `egress.jsonl` mỗi **request trong batch**, ghi tại
thời điểm submit, `seq` cấp trước khi mở socket. Ai cài Batch mà log lúc đọc kết
quả là **đảo đúng thứ tự** `M12-R3` sinh ra để giữ — và ca thất bại (batch
`expired`/`errored`) sẽ **không có dòng nào**, tức đúng lúc cần biết nhất thì
không biết.

**đề xuất** · `model.json` thêm cột **`che_do: sync | batch`**. C4 làm `sync`
trước (vòng phản hồi ngắn khi đang dựng), bật `batch` là **đổi một dòng** — và
đó chính là phép thử `AC-7.1` (*đổi bảng khai, 0 dòng mã*) có thêm một ca thật.

---

## Tóm — sửa gì trước khi s7 chia task

| # | sửa ở đâu | hạng |
|---|---|---|
| 1 | `spec §3` + `model_flow §4`: bỏ Citations khỏi hợp đồng (§3 trên) | **chặn** — nó là 400, không phải tối ưu |
| 2 | `spec §3` + `testcases`: phép định vị **ba tầng** + ngưỡng trong bảng khai + fixture **không-đỏ-oan** (§2) | **chặn** — `AC-3.2` hiện không cài đúng được |
| 3 | `AC-5.2`: đổi cách đo, thêm luật *tên đích luôn duy nhất* (§4) | **cao** — tiền đề sai trên Windows |
| 4 | s7: **C4 chỉ `tai-lieu`**; video là đơn vị việc riêng có câu hỏi cho người (§5) | **cao** — nửa đầu vào không tồn tại |
| 5 | `model.json`: thêm `kieu_structured` · `nguong_lech_schema` · `che_do` · `thu_vien_pdf`+`giay_phep` (§1 §6 §7) | vừa |
| 6 | Cổng trần **32 MB** cho `tong-hop-chu-de` **trước** khi tính `sha256` (§3) | vừa |
| 7 | Nạp thêm nguyên liệu **trước** C4 — `M6.1` đo 10 tài liệu, kho có 1 (§5) | vừa — không phải việc của M12 |

**Không thuộc phạm vi file này**, ghi để không mất: `nguon` chưa vào schema
(`FR-044` chờ áp) và bảy cửa `FR-047` — cả hai đã khai ở `spec §nợ` và `backlog`.

---

# PHẦN B · Cách triển khai — thư viện nào, mã hình dạng gì

> Bổ sung 2026-09-02 sau chỉ đạo *"user chọn model"* + *"cái tôi quan tâm là cách
> triển khai"*. Sửa hợp đồng nằm ở `FR-053`; phần này là **cách làm**.

## 8 · Tầng adapter: TỰ VIẾT bốn file, không dùng LiteLLM

Đây là quyết định build-vs-buy đáng cân nhất của module, vì `AC-3.1` (*thêm một
nhà = 1 dòng bảng + 1 file, 0 dòng ở lõi*) **cả hai lối đều thoả**.

| | LiteLLM | any-llm (Mozilla AI) | tự viết 4 adapter |
|---|---|---|---|
| phủ nhà | 100+ | nhiều | **đúng 4** |
| giấy phép | MIT (core) | mở | — |
| cách gọi provider | **tự cài lại** giao diện, không dùng SDK chính thức | **dùng SDK chính thức**, trả Pydantic kiểu OpenAI | SDK chính thức |
| khối lượng phụ thuộc | rất lớn | vừa | **0** |

**fact · và đây là chỗ quyết định**: LiteLLM có **hai sự cố bảo mật mùa xuân
2026** — một **tấn công chuỗi cung ứng** và một **CVE SQL injection nghiêm trọng
bị khai thác trong 36 giờ**; khuyến nghị đi kèm là *"version pinning và giám sát
lỗ hổng không phải tuỳ chọn"*. Thêm: ranh giới MIT ↔ Enterprise đang mờ
(issue #34241 — *"tất cả 9 file trong `enterprise/` kiểm `premium_user` bằng cách
import nó từ vùng MIT"*).
*(nguồn: BerriAI/litellm#34241 · truefoundry 2026 · chatforest 2026)*

**Vì sao điều đó nặng ĐÚNG ở M12 chứ không ở chỗ khác**: M12 là nơi
`can_key_model: true` — nó giữ **toàn bộ** khoá model của dự án — và
`dich-vu.json` khai nó là **cửa egress duy nhất**. Một thoả hiệp chuỗi cung ứng
tại đây là *mọi khoá* cộng *mọi tài liệu đã gửi*. Và `M12-R3` đòi **đúng một**
hàm ra Internet, `AC-6.3` đòi allowlist đích **trước khi mở socket**. Một gateway
100+ nhà là **hình dạng ngược** với hai luật đó: nó tồn tại để gọi được mọi thứ,
còn M12 tồn tại để gọi được đúng bốn thứ và đếm được từng lần.

**Khối lượng thật của lối tự viết** — hợp đồng đã khoá ở `spec §3`:

```python
# chungcat/src/adapter/anthropic.py   — ~30 dòng
def goi(prompt: str, tai_lieu: bytes, cau_hinh: dict) -> dict:
    """→ {"text": str, "quotes": [str, ...]}"""
```

Bốn nhà × ~30 dòng = ~120 dòng, không phụ thuộc mới ngoài SDK của từng nhà.
Đổi lại: `AC-6.3` cài được **thật** (một `httpx.Client` của ta, allowlist kiểm
trước `connect`) — với LiteLLM, "đúng một cửa egress" thành lời khai, vì socket
mở bên trong thư viện.

**Nếu vẫn muốn mua**: `any-llm` là lựa chọn đúng hơn LiteLLM ở đây — nó **gọi qua
SDK chính thức** thay vì cài lại giao diện, nên bề mặt tự viết mỏng hơn và hành vi
không bị thư viện sửa ngầm. Nhưng nó vẫn không giải được vế *"một cửa egress đếm
được"*.

## 9 · Đọc PDF: `pdfplumber`, và số trang là CẤU TRÚC

```python
import pdfplumber
def doc_theo_trang(duong: Path) -> list[str]:
    with pdfplumber.open(duong) as pdf:
        return [t.extract_text() or "" for t in pdf.pages]   # chỉ số = trang-1
```

Ba tính chất khiến đây là hình dạng đúng cho M12:

1. **`p.7` không phải suy ra** — nó là chỉ số mảng. Mọi tool PDF→Markdown làm
   phẳng tài liệu rồi *đoán lại* biên trang, và docling tự khai markdown là lossy.
2. **Payload gửi model = list theo trang**, nên `V` định vị được quote **về đúng
   trang** mà không cần map offset toàn cục.
3. **CPU, không model, không GPU** — bốn trong năm tool PDF→Markdown cần OCR/model
   (Surya · PaddleOCR · DeepSeek OCR), tức thêm hàng GB phụ thuộc cho thứ ta không
   dùng.

## 10 · `verify.py` — bước 2 của `workflow`, và nó viết được TRƯỚC adapter

```python
# chungcat/src/verify.py
LIG = {"ﬀ":"ff","ﬁ":"fi","ﬂ":"fl","ﬃ":"ffi","ﬄ":"ffl"}

def chuan_hoa(s: str) -> str:
    s = unicodedata.normalize("NFKC", s)
    for k, v in LIG.items(): s = s.replace(k, v)
    s = re.sub(r"-\s*\n\s*", "", s)        # nối gạch-nối-cuối-dòng
    s = re.sub(r"\s+", " ", s)
    return s.casefold().strip()

def dinh_vi(quote: str, trang: list[str], nguong: float) -> dict | None:
    q = chuan_hoa(quote)
    for i, t in enumerate(trang, start=1):
        tt = chuan_hoa(t)
        if q in tt:
            return {"trang": i, "diem": 100.0, "tang": "chinh-xac"}
    tot = None
    for i, t in enumerate(trang, start=1):
        a = rapidfuzz.fuzz.partial_ratio_alignment(q, chuan_hoa(t))
        if a and a.score >= nguong and (tot is None or a.score > tot["diem"]):
            tot = {"trang": i, "diem": a.score, "tang": "fuzzy"}
    return tot          # None ⇒ TỪ CHỐI khẳng định (AC-3.2)
```

`workflow §2` đặt `verify.py` **trước** adapter, và điều đó khả thi vì hàm này
**không cần model**: fixture là một PDF thật + một list quote viết tay. Nên nó là
đơn vị việc đầu tiên có cổng đỏ-được-thật.

Tiền lệ: `LegalQuants/lq-ai` (exact tại offset + tolerant fuzzy) ·
`mwestera/quotellm` (constrained generation, chỉ cho phát ra span nguyên văn —
thu hẹp ở **đầu vào** thay vì lọc ở đầu ra; đáng thử nếu tỉ lệ từ chối cao).

## 11 · `egress.py` — một cửa, `seq` cấp trước socket

`AC-6.1` đòi log **trước khi** gửi và đo thứ tự bằng `seq`, không bằng đồng hồ:

```python
def gui(payload: dict, dich: str) -> dict:
    if host(dich) not in ALLOWLIST:            # AC-6.3 — trước khi mở socket
        raise DichKhongKhai(dich)
    if len(json.dumps(payload)) > TRAN_BYTE:   # §5.4 — trước khi băm
        raise VuotTran(...)
    seq = cap_seq()                            # số nguyên tăng dần, của TA
    payload["_seq"] = seq                      # payload MANG seq → cổng đối chiếu
    ghi_log({"seq": seq, "sha256": sha256(canon(payload)), "dich": dich,
             "model_da_chon": ..., "la_mac_dinh": ..., "khu_vuc": ...})
    fsync(LOG)                                 # dòng log sống kể cả khi request chết
    return _client.post(dich, json=payload)    # ĐÚNG một chỗ trong toàn module
```

Hai chi tiết dễ mất:

- **`fsync` trước `post`.** Không có nó thì dòng log nằm trong buffer và một
  crash giữa hai lệnh xoá đúng thứ `M12-R3` sinh ra để giữ.
- **`canon(payload)`** — băm dạng chuẩn hoá (JSON sort key, separator cố định),
  nếu không thì `AC-6.2` (*dựng lại từ log rồi băm lại ra cùng số*) trượt vì thứ
  tự khoá dict.

## 12 · Phục vụ HTTP: `http.server` của stdlib là đủ, và đó là lựa chọn có lý

Bốn endpoint (`POST /job` · `GET /viec/<id>` · `GET /model` · health), người gọi
**duy nhất** là LÕI trên loopback (`M12-R7`), không auth, không CORS, không
WebSocket, không giao diện (`Z7`).

FastAPI mua được validation + OpenAPI — nhưng nó kéo theo `pydantic` + `starlette`
+ `uvicorn`, và nó **không** giải bài nào của M12. Ngược lại, `AC-1.2` (bind đúng
`127.0.0.1:8790`, đọc số cổng từ `dich-vu.json`) dễ chứng minh hơn khi đường bind
là một dòng `HTTPServer(("127.0.0.1", cong), ...)` của chính ta.

**Đề xuất**: stdlib cho C4. Nếu về sau `POST /job` cần schema phức tạp thì thêm
`pydantic` **một mình** (không cần framework) để validate payload.

## 13 · Thứ tự thi công — khớp `workflow §2`, kèm phụ thuộc ngoài

| # | đơn vị | phụ thuộc ngoài | cổng đỏ-được-trước-khi-có-mã? |
|---|---|---|---|
| 1 | đọc ba bảng khai | — | có — fixture là file JSON |
| 2 | `verify.py` | `rapidfuzz` · `pdfplumber` | **có** — PDF thật + quote viết tay, **0 model** |
| 3 | `adapter/` **một nhà** | SDK nhà đó | có — mock ở mức `httpx` |
| 4 | `dinh_tuyen.py` (gợi ý mặc định) | — | có |
| 5 | `egress.py` | `httpx` | có — allowlist + `seq` + `fsync` kiểm được không cần mạng |
| 6 | `vong.py` Maildir + `lan_gui` | — | có |
| 7 | `api.py` 4 endpoint | — | có |
| 8 | **nhà thứ hai** | SDK nhà đó | đây là phép đo thật của `AC-3.1` |

Phụ thuộc mới, tất cả permissive: `pdfplumber` (MIT) · `rapidfuzz` (MIT) ·
`httpx` (BSD) · SDK từng nhà. **Không** `PyMuPDF` (AGPL), **không** LiteLLM.

---

# PHẦN C · Đường VIDEO — transcript thành hiện vật

> Bổ sung 2026-09-03 theo chỉ đạo *"nghiên cứu làm cho cả video, nếu cần bước
> transcript to tài liệu thì cũng nên research để xử lý"*.
> Thay `§5` (*"C4 chỉ làm `tai-lieu`"*) — đó là đề xuất **hoãn**; phần này là
> đề xuất **làm**.

## 14 · Ba ràng buộc đo được, và chúng loại bỏ lối hiển nhiên

```
media-mime.json  mime enum ĐÓNG = 5 loại: pdf · pptx · docx · ppt · doc
                 → KHÔNG video, KHÔNG audio, KHÔNG transcript
                 tran_byte = 26214400  (25 MB)
khung-than-bai   tran_tu_thu_vien = 400 từ
frontmatter      media là MỘT OBJECT (sha256·mime·ten_goc·so_byte), không phải mảng
bảng media       có cột `la_dan_xuat` — đã sẵn cho hiện vật DẪN XUẤT
```

Ba hệ quả, đọc thẳng ra:

1. **Transcript không thể nằm trong `than`.** Bản ghi video là `ho_so: thu-vien`,
   trần **400 từ**; một transcript 30 phút là ~4.000–6.000 từ. Vượt trần nghĩa là
   cổng nói *"đây là bản PHÂN TÍCH đặt sai hồ sơ"* — và nó nói đúng.
2. **Không lưu byte video vào kho.** Trần 25 MB + mime enum đóng, và `M11_video`
   đã cố ý khai *"không byte vào kho"*. Mở enum cho `video/mp4` là mở một cửa
   nhận file 25 MB+ để phục vụ lại same-origin — bán kính lớn, và **không cần**.
3. **Transcript là hiện vật DẪN XUẤT** — `la_dan_xuat: 1`, cột đã có sẵn. Đây
   đúng vai nó: xoá đi dựng lại được từ audio, mất không mất gì (cùng nguyên tắc
   `B-C1` với chỉ mục của M13).

⇒ **Hình dạng chốt**: audio **không vào kho** (nó sống trong Maildir của job rồi
bị xoá); **chỉ transcript vào kho**, làm hiện vật thứ hai của bản ghi video.
Nhờ vậy né được cả trần 25 MB lẫn việc mở enum cho video.

Cần **hai** thay đổi hợp đồng, và một trong hai đã quyết:

| | trạng thái |
|---|---|
| `media` thành **mảng** | ✅ đã quyết — `FR-052`, cách 1, đã đóng 2026-09-02 |
| thêm mime cho transcript | ❌ **chưa** — cần FR tới `media-mime.json` |

## 15 · Định dạng transcript: `text/vtt`, KHÔNG phải JSON

Nghe như chuyện gu, nhưng nó là chuyện **cổng**. `media-mime.json` khai
`$comment_magic`: `magic` là **byte mở đầu phải khớp**, và đó là *"LỚP THỨ SÁU của
intake"* — lớp duy nhất soi byte.

| ứng viên | magic | vấn đề |
|---|---|---|
| `application/json` | **không có** — bắt đầu bằng `{` (`7b`) hoặc `[` (`5b`) | một ký tự đơn, xuất hiện ở đầu vô số thứ. Đây sẽ là **mục đầu tiên trong bảng làm yếu lớp thứ sáu** |
| **`text/vtt`** | **`5745425654`** = `WEBVTT` | magic **thật**, 6 byte, chuẩn W3C |

Và VTT **mang mốc thời gian trong chính định dạng** — không phải bọc thêm:

```
WEBVTT

00:03:15.240 --> 00:03:19.800
đó là lý do thí nghiệm chuột của Calhoun vẫn được nhắc lại
```

⇒ `text/vtt` · `duoi: .vtt` · `magic: 5745425654` · `xem_truoc: "tai"`.
Một dòng vào bảng khai, và nó **không** làm yếu lớp thứ sáu.

## 16 · `verify.py` dùng LẠI y nguyên — video gần như 0 dòng mã mới ở chỗ đắt nhất

`dia-chi.json` đã khai `moc_thoi_gian` `[t=03:15]` là một dạng hợp lệ. Và
`dinh_vi()` ở §10 nhận `list[str]` (trang) rồi trả số trang. Transcript là
`list[{bat_dau, text}]` (đoạn) rồi trả mốc. **Cùng một hàm, cùng ba tầng — chỉ
đổi ĐƠN VỊ:**

```python
def dinh_vi(quote, khoi: list[dict], nguong):   # khoi[i] = {"neo": ..., "text": ...}
    ...                                          # "neo" là 7 (trang) hoặc "03:15" (mốc)
```

Đây là kết quả đáng giá nhất của phần này: **thành phần rủi ro cao nhất của M12
(§2 · §3) không phải viết lại cho video.** PDF cho `neo = trang`, transcript cho
`neo = mốc`. `AC-3.2` phủ cả hai bằng cùng một cổng, thêm một fixture.

**Và đường video dễ hơn PDF ở đúng chỗ khó**: không ligature, không gạch-nối-cuối-
dòng — vì model đọc **chính** transcript ta đưa, nên hai vế của phép so cùng một
nguồn văn bản. Tầng 2 (khớp chính xác) sẽ gánh gần hết.

## 17 · ASR **local** — `faster-whisper`, và KHÔNG cần WhisperX

**fact** · `faster-whisper` (**MIT**, SYSTRAN) chạy Whisper trên CTranslate2.
Có `word_timestamps=True` **sẵn**, và tích hợp **Silero VAD** để cắt đoạn im
lặng (giảm ảo giác + giảm WER). Đo trên i7-12700K, 8 luồng, model `small`:
FP32 **2m37s** / **INT8 1m42s** (1.477 MB RAM) — tức **CPU chạy được**, không
cần GPU.

**fact** · Whisper gốc chỉ phát mốc ở **mức đoạn** (5–30 giây) và mốc từ là
**nội suy, lệch hàng trăm ms**. WhisperX thêm forced alignment wav2vec2 để đạt
**<100 ms**.

**⇒ M12 KHÔNG cần WhisperX.** `[t=03:15]` là độ phân giải **giây**; lệch vài trăm
ms là **vô hình** ở độ phân giải đó. WhisperX mua độ chính xác ta không tiêu, và
trả bằng: một model wav2vec2 nữa, cộng `pyannote` cho diarization (**model gated,
cần token HuggingFace**) — tức thêm một phụ thuộc có cổng đăng nhập vào một
module mà `can_key_model` đã là điểm nóng.

**Điều quan trọng nhất về ASR local**: nó là **0 egress**. Toàn bộ bước
transcript chạy trên máy, không byte nào rời đi. Nên đường video ở bước này
**sạch hơn** đường PDF — PDF phải gửi tài liệu cho model (`FR-043` bậc 4),
transcript thì không.

⚠️ **Giới hạn phải khai, vì nó đổi NGHĨA của chữ "verified"**:

| nguồn | `V` bảo đảm gì |
|---|---|
| PDF | quote **có trong tài liệu nguồn** |
| video qua ASR | quote **có trong TRANSCRIPT CỦA TA** — một hiện vật dẫn xuất có thể chứa lỗi ASR |

Hai mức mạnh khác nhau **đang mặc cùng một chữ**. `V` không kiểm được *"người
trong video có nói thế không"* — nó chỉ kiểm được *"transcript có câu đó không"*.
Đây là chỗ `credibility_max` tồn tại, và `M01-R2` đã cấm máy điền nó. Nên: bản
`phan-tich` sinh từ video phải **ghi rõ nguồn là transcript ASR** (một trường
dẫn xuất trên hiện vật: `la_asr: true` + model ASR đã dùng), để người chấm
`credibility_max` thấy mình đang chấm gì.

## 18 · Lấy transcript ở đâu — và ba chỗ bản đầu của tôi viết sai

### 18.1 · Sửa lỗi của chính mục này (bản 09-03 đầu)

| chỗ sai | đúng là |
|---|---|
| tiêu đề *"luật của dự án đã loại **bốn** lối"* | luật loại **HAI**: scraper caption và `yt-dlp`. `captions.download` bị **403** loại — fact kỹ thuật, không luật nào dính. `captions.list` **không bị loại gì**; nó không trả nội dung nên nó là **cổng kiểm tra**, không phải một lối lấy transcript — tôi xếp sai loại |
| xếp Supadata · Deepgram · AssemblyAI **cùng một dòng** | **Deepgram và AssemblyAI nhận AUDIO, không nhận URL.** Chúng là giải pháp *ASR*, không phải giải pháp *URL* — dùng chúng vẫn phải `yt-dlp` lấy audio trước, tức là **lối B cộng thêm egress mà lối B không có**. Với video <30 phút, chúng không mua được gì |
| không nêu `FR-037` | `FR-037` đã chốt *"muốn video 200 MB thì câu trả lời là **ĐĂNG KÝ URL**, không phải nới trần"*. Lối "người tải file" **không chỏi** nó — file vào thư mục tạm của M12, **không** thành hiện vật kho — nhưng bản đầu không nói ra, nên hai câu đọc như đánh nhau |

**Hai luật thật**, nguyên văn:

- **`B-E4`** (`brd.md:377`): *"Kênh được cắm khi nó có API **có version, có tài liệu, có thông báo thay đổi**. Không có ⇒ **không làm** — không phải 'làm sau'."* Cưỡng chế: `reviewer ⚠️` — **người ký**, không phải máy (`brd.md:454`).
- **`Scope OUT` dòng 1** (`proposal-2 §4`): *"Crawler/scraper cho kênh không có API chính thức"*.

⚠️ **Cả hai viết về "kênh"** — chúng sinh ra cho Telegram/Discord/Zalo/FB của M15, **không nêu tên** transcript video. Chúng áp vào đây bằng **lý do**, không bằng phạm vi nguyên văn.

### 18.2 · Trục thật của `B-E4` là HỎNG-IM-LẶNG, không phải KHÔNG-CHÍNH-THỨC

Lý do của `B-E4`, nguyên văn: *"crawler/client không chính thức là **cỗ máy hỏng-im-lặng theo thiết kế** — nó **không báo lỗi, nó trả dữ liệu sai**. Dự án tồn tại để chống đúng kiểu hỏng đó."*

Đọc đúng trục đó thì ba lối xếp rất khác nhau — và bản đầu của tôi gộp chúng làm một:

| lối | chính thức? | **hỏng kiểu gì** | phán |
|---|---|---|---|
| **C** · scraper caption (`youtube-transcript-api`) | không | endpoint `timedtext` nội bộ; hỏng thì trả **rỗng hoặc sai** — **IM LẶNG** | **đúng con máy `B-E4` sinh ra để giết** |
| **B** · `yt-dlp` tải audio → ASR local | không | hỏng thì **không có file** ⇒ **ỒN ÀO**; sau đó ASR là phép tất định trên máy mình | không phải kiểu hỏng luật sợ; giá là **ToS** |
| **A** · dịch vụ thứ ba (Supadata-class) | **có** — API có version, có tài liệu | hỏng thì **HTTP error** ⇒ **ỒN ÀO** | thoả `B-E4` **theo mặt chữ ở biên của ta**; cái mờ nằm sau hợp đồng của vendor |

Về **A**: vendor vẫn đang scrape phía sau. Ta không xoá rủi ro, ta **chuyển** nó sang một bên **có động cơ sửa** và **có bề mặt báo lỗi**. Đó không phải zero giá trị — nhưng nói *"dùng A là hợp luật hoàn toàn"* thì là tự lừa.

### 18.3 · Ba nền tảng — đo 2026-09-03, không nền nào có bề mặt chính thức

| | bề mặt chính thức | thực tế |
|---|---|---|
| **YouTube** | `captions.download` | đòi OAuth **chủ sở hữu video**; video người khác → **403**. *By design*, không phải bug hay quota, **không đổi trong 2026** |
| **TikTok** | *không có* | TikTok **không có nút tải phụ đề** nào — player chỉ bật/tắt. Mọi giải pháp đều là bên thứ ba. Chỉ video **công khai** lấy được |
| **Facebook** | Graph API `video/captions` | chỉ Page **bạn quản lý**; auto-caption chỉ sinh trên **Business Page**, không trên trang cá nhân/newsfeed. Meta đang **siết** truy cập thứ ba (đã gỡ Basic Display API) |

⇒ Điều kiện của `B-E4` là **không thoả được qua API gốc, cả ba nền.** Đây không phải chỗ chọn giữa "chính thức" và "không" — chỗ đó **trống**.

Và `Scope OUT` của proposal đã dùng **đúng FB** làm bằng chứng cho `B-E4` (*"FB gỡ Groups API 22/04/2024, Meta có đội Anti-Scraping"*) — nên FB là nền **khó nhất**, không phải nền dễ.

### 18.4 · Chi phí, cho khối lượng đã xác nhận (<30 phút/video)

| | tiền | egress | hỏng |
|---|---|---|---|
| **B** `yt-dlp` + `faster-whisper` | **$0** | **0 byte** | ồn ào |
| **A** Supadata-class | free **100 credit/tháng** (~100 video **có** caption, hoặc ~50 phút AI); rồi 1 credit/video có caption · 2 credit/phút nếu phải AI | **đích mới** | ồn ào |
| ~~C~~ scraper caption | $0 | 0 | **im lặng** ⇒ loại |

`small` INT8 ≈ 8× realtime trên CPU ⇒ video 30 phút ≈ **4 phút** ASR. Không cần GPU. Nằm gọn trong *"chạy phút"* của `ADR-05`.

### 18.5 · CHỐT (chỉ đạo 2026-09-03): làm **cả A và B**, bảng khai chọn

Tôi đã nêu lo ngại *"dựng một dòng chưa ai bấm"* (`CLAUDE.md §2`) và chủ dự án chốt làm cả hai — **và lựa chọn đó có lý riêng đáng ghi**: đây là dự phòng cho **một hỏng đã biết**, không phải linh hoạt giả định. Cả A và B đều có thể chết, vì lý do **độc lập nhau**: A chết khi vendor đóng cửa hoặc đổi giá; B chết khi nền tảng đổi cách phát stream. Một lối chết thì lối kia còn.

**Hệ quả phải khai, vì hai lối có HAI hồ sơ egress khác nhau:**

| | lối B | lối A |
|---|---|---|
| byte rời máy | **0** | URL video (và, nếu vendor AI-transcribe, nội dung video) |
| `egress.jsonl` | **không dòng nào** ở bước transcript | **một dòng**, `sha256` payload |
| `khu_vuc` (§1.4) | không áp | **áp** — vendor là pháp nhân nào, ở đâu |
| `AC-6.3` allowlist | không đích nào | host vendor **phải có trong bảng khai** |

⇒ **`egress.jsonl` phải ghi lối đã dùng.** Nếu không thì báo cáo egress không phân biệt được một transcript sinh tại máy với một transcript sinh bằng cách gửi URL ra ngoài — và đó đúng là câu `FR-043` bậc 4 tồn tại để trả lời.

⇒ **Phải ghi một quyết định cho lối B.** `Scope OUT` là cam kết đã ghi, và `proposal §0` đã tự đặt luật cho chính mình khi đảo ba dòng OUT: *"đảo chúng phải nói ra ở đây chứ không lặng lẽ phình ở s3"*. Nên lối B cần một dòng ghi rõ: nó **là** crawler theo phân loại, nó được chấp nhận vì **hỏng ồn ào**, và `B-E4` cưỡng chế bằng **người ký** chứ không bằng máy — tức **không có cổng nào canh nó**, và điều đó phải nằm trong hồ sơ chứ không nằm trong trí nhớ.

### 18.6 · `nguon_transcript` — bảng khai, cùng khuôn `model.json`

```text
nguon_transcript:  ten · loai(file|tai_ve|dich_vu) · uu_tien
                   · dich(host hoặc null) · khu_vuc · can_key
                   · tieu_egress(bool) · giay_phep
```

Ba dòng đầu:

| ten | loai | dich | tieu_egress |
|---|---|---|---|
| `file-nguoi-tai` | `file` | — | **false** |
| `ytdlp-asr-local` | `tai_ve` | host nền tảng | **false** — chỉ tải về, không gửi đi |
| `<vendor>` | `dich_vu` | host vendor | **true** |

`uu_tien` quyết thứ tự thử. `tieu_egress` là cột **cổng đọc** — nó nối bảng khai vào `AC-6.3` và vào báo cáo egress, nên *"lối nào có gửi ra"* thành thứ **đếm được**, không phải thứ nhớ.

⚠️ **`tai_ve` vẫn là một lời gọi RA Internet** (tải audio về) dù nó **không gửi dữ liệu của ta** đi. Nên nó vẫn phải qua **cửa egress duy nhất** của `M12-R3`, và host nền tảng vẫn phải trong allowlist — chỉ khác là dòng log ghi `tieu_egress: false` vì **không byte nào của kho rời máy**. Trộn hai nghĩa của chữ *egress* vào một cột là cách con số này bắt đầu nói dối.

## 19 · Flow — CHỐT: `sinh-transcript` là JOB RIÊNG

Chỉ đạo 2026-09-03 chọn phương án job riêng, không gộp vào `chung-cat-mot-nguon`:

```text
① người đăng ký video (URL)     → hàng `video`, không byte      [M11, như FR-037]
② người bấm "sinh transcript"   → job M12 `loai: sinh-transcript`
     → tra `nguon_transcript` theo `uu_tien`
     → file người tải | yt-dlp tải audio | gọi vendor
     → faster-whisper INT8 + Silero VAD  (nếu chưa có transcript sẵn)
     → .vtt → hiện vật `la_dan_xuat: 1` + `la_asr: true` + model ASR đã dùng
     → audio tạm XOÁ
③ người ĐỌC và SỬA transcript   ← cổng người; xem dưới
④ người bấm "chưng cất"         → job `chung-cat-mot-nguon`, neo = mốc thời gian
```

**Nhịp ③ là lý do flow này thắng hai flow kia.** `§17` đã khai: với đường video, *"verified"* chỉ nghĩa *"quote có trong **transcript của ta**"* — một hiện vật dẫn xuất có thể chứa lỗi ASR. Nếu người **đọc và sửa được** transcript trước khi chưng cất, thì `credibility_max` (mà `M01-R2` cấm máy điền) mới có cái thật để chấm. Flow *"hỏi lúc nạp"* và flow *"hỏi lúc chưng cất"* đều **chôn** transcript vào một bước tự động, và mất đúng nhịp này.

Ba tính chất khác của job riêng:

1. **Đối xứng với PDF** ⇒ M12 có **một** đường mã: hiện vật → chưng cất. Không có nhánh *"nếu là video thì…"*.
2. **`lan_gui` không lẫn.** Job transcript lối B = **0 lần gửi**; job chưng cất = 1–2 lần. Gộp vào một job thì bộ đếm egress nói về hai việc khác nhau.
3. **Sinh lại transcript không tốn egress chưng cất.** Đổi sang model ASR tốt hơn về sau = chạy lại ② mà không chạm ④.

**Giá phải trả**: hai cú bấm thay một, và một trạng thái mới trên bản ghi video (*có transcript / chưa*) mà màn `/video/` phải hiện.

⚠️ **Đường upload file** (`file-nguoi-tai`): `M09-R5` cấm nới trần body JSON **1 MB**, nên nó phải là **multipart qua `web/`**, không phải một field JSON. Đó là việc có khối lượng thật, không phải một dòng — và nó chỉ phục vụ phần *"đôi khi vài mp4"*, nên xếp **sau** hai lối URL.

## 20 · Phụ thuộc mới của đường video

| gói | giấy phép | ghi chú |
|---|---|---|
| `faster-whisper` | **MIT** | đã kiểm repo |
| CTranslate2 | *chưa kiểm* | khai vào cột `giay_phep`, kiểm trước khi chốt — bài học `PyMuPDF` |
| model Whisper (`small` cho <30 phút) | *chưa kiểm từng model* | tải một lần, chạy offline |
| Silero VAD | có sẵn trong `faster-whisper` | — |
| `yt-dlp` | *chưa kiểm* | **phải pin version + theo dõi** — nó đổi nhanh theo nền tảng, và đó là bản chất của lối B |
| HTTP client cho vendor lối A | — | `httpx` nếu vendor có REST thuần |
| **không** WhisperX · **không** pyannote | — | `§17` — `[t=03:15]` là độ phân giải giây |

Cùng luật `§5.3`: giấy phép là thứ **không cổng nào bắt được**, nên nó nằm trong bảng khai, không nằm trong đầu người.

## Nguồn

- YouTube captions: [Google — Implementation: Captions](https://developers.google.com/youtube/v3/guides/implementation/captions) · [vì sao `captions.download` fail](https://youtube2text.org/blog/youtube-data-api-transcripts) · [quota 2026](https://www.socialcrawl.dev/blog/youtube-data-api-2026)
- Scraping/chặn IP: [jdepoix/youtube-transcript-api](https://github.com/jdepoix/youtube-transcript-api) · [issue #511 — chặn cả khi có Webshare](https://github.com/jdepoix/youtube-transcript-api/issues/511)
- ASR: [SYSTRAN/faster-whisper](https://github.com/SYSTRAN/faster-whisper) · [WhisperX — mốc từ <100ms](https://www.forasoft.com/learn/ai-for-video-engineering/articles-ai/whisperx-diarization-word-level-timestamps) · [so sánh biến thể Whisper (Modal)](https://modal.com/blog/choosing-whisper-variants)
- Dịch vụ thứ ba: [Supadata — so sánh + giá](https://supadata.ai/blog/best-youtube-transcript-api) · [giá STT 2026](https://www.buildmvpfast.com/api-costs/transcription)
- Adapter/gateway: [BerriAI/litellm#34241 — ranh giới giấy phép](https://github.com/BerriAI/litellm/issues/34241) · [truefoundry — LiteLLM Enterprise](https://www.truefoundry.com/blog/litellm-enterprise) · [chatforest — review 2026](https://chatforest.com/reviews/litellm-llm-gateway-proxy/) · [any-llm (Mozilla AI)](https://www.huggingface.co/blog/mozilla-ai/introducing-any-llm)
- Xác thực quote: [LegalQuants/lq-ai](https://github.com/LegalQuants/lq-ai) · [mwestera/quotellm](https://github.com/mwestera/quotellm) · [awesome-llm-attributions](https://github.com/HITsz-TMG/awesome-llm-attributions)
- Hàng đợi file: [avivsinai/agent-message-queue](https://github.com/avivsinai/agent-message-queue)
- Giấy phép/hiệu năng PDF: [file2markdown — PyMuPDF AGPL](https://www.file2markdown.ai/blog/is-pymupdf-free-for-commercial-use) · [nutrient.io — 7 thư viện PDF Python 2026](https://www.nutrient.io/blog/best-python-pdf-libraries/) · [pdfmux — speed vs license](https://pdfmux.com/blog/pymupdf-vs-pdfplumber/)
- Xác thực trích dẫn bằng fuzzy: [arXiv 2511.11594 · TimeStampEval](https://arxiv.org/html/2511.11594v1) · [arXiv 2605.27700 · CiteCheck](https://arxiv.org/pdf/2605.27700)
- Structured output theo nhà: [Requesty — 244 model, 2026](https://www.requesty.ai/blog/structured-outputs-across-llm-providers-the-compatibility-mess)
- `os.replace`/Windows: [rust-atomicwrites #27](https://github.com/untitaker/rust-atomicwrites/issues/27) · [pyosreplace](https://pypi.org/project/pyosreplace/) · [OpenJDK nio-dev](https://mail.openjdk.org/pipermail/nio-dev/2023-February/013252.html)
- Citations · giới hạn PDF · Batch · model/giá: tài liệu Anthropic qua skill `claude-api` (đọc 2026-09-02)