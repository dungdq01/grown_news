# Gap analysis

> Khoảng trống nào **đáng làm**. Mỗi khoảng trống trỏ về ≥1 bằng chứng trong
> `solutions_scan.md` — điều kiện đóng G1.
>
> Bước này chạy ở chế độ **thẩm định**, không phải khám phá: base đã dựng rồi.
> Nên câu hỏi thật là *"thứ đã dựng có đáng tồn tại không"*, không phải
> *"nên dựng gì"*.

## G-1 · Chắt lọc một nguồn ≠ nghiên cứu một chủ đề

**Trống**: GPT Researcher và STORM đều nhận *chủ đề* rồi tự đi tìm nguồn. Yêu cầu
gốc ngược lại: **người gửi nguồn cụ thể**, hệ thống chắt lọc.

**Bằng chứng**: `solutions_scan.md#A` — GPT Researcher "lập kế hoạch, chia câu hỏi
con, tìm web song song"; STORM "sinh bài chất lượng Wikipedia về một chủ đề".

**Vì sao đáng làm**: hai bài toán ngược chiều. Mở rộng cần khử trùng lặp và xếp
hạng độ liên quan. Chắt lọc cần trần cứng và cổng lọc. Dùng tool mở rộng cho việc
chắt lọc sẽ ra bản tóm tắt dài hơn nguồn — đúng thứ yêu cầu gốc nói *"đây không
phải công cụ tóm tắt"*.

**Đã có trong base**: giao thức 6 pass, trần cứng L7, ba cổng chắt lọc Pass 4.

---

## G-2 · Markdown có schema cưỡng chế được

**Trống**: Obsidian và Taskade cho ra `.md` **tự do**. Không trường bắt buộc,
không validate được bằng máy, không CI nào chặn được file thiếu bằng chứng.

**Bằng chứng**: `solutions_scan.md#B` — Obsidian "không có schema bắt buộc";
Taskade "markdown là format xuất, không phải hợp đồng có schema".

**Vì sao đáng làm**: đây là điều kiện cần để web render bằng một template duy
nhất, và để agent nội bộ đọc được bằng máy. Không có schema thì file thứ 50 sẽ
khác file thứ 1, và cả hai đầu tiêu thụ đều gãy.

**Đã có trong base**: `frontmatter.schema.json` + `validate.py` 8 cổng + 14 test.

---

## G-3 · Kiểm chứng tích luỹ qua nhiều nguồn — trống lớn nhất

**Trống**: VeriTrail, GPTZero, INRA kiểm **một output đơn lẻ**. Không cái nào:
- tích luỹ độ tin khi nhiều nguồn độc lập cùng khẳng định một điều
- chặn khẳng định yếu trở thành quy tắc điều khiển agent
- phân biệt "ba nguồn độc lập" với "ba bài cùng trích một gốc"

**Bằng chứng**: `solutions_scan.md#D` — bốn tool liệt kê, không tool nào có khái
niệm tích luỹ theo thời gian.

**Vì sao đáng làm — bằng chứng mạnh nhất của cả bước khảo sát**:

> Stanford 2025: trợ lý pháp lý xây riêng, có RAG, vẫn bịa ở **17–34% truy vấn**.
> Grounding *giảm* bề mặt bịa nhưng *không loại bỏ*.

Tức **có trích dẫn không đồng nghĩa trích dẫn đúng**. Mọi tool ở nhóm A đều dừng
ở "có trích dẫn". Nếu kho này nhận output của chúng mà không thẩm định, tỷ lệ bịa
17–34% sẽ chảy thẳng vào tri thức dùng để dạy agent.

**Đã có trong base**: Pass 3.5 thang 4 mức · hệ số kiểm chứng chéo · luật
`claimed` + 1 nguồn cấm thành skill (cưỡng chế bằng schema) · đếm độc lập theo
`url_normalized` · spot-check ≥2 trích dẫn ở đường tĩnh.

---

## G-4 · Cổng người giữa sinh và công bố

**Trống**: GPT Researcher bán điểm "**không có người trong vòng lặp**". Quartz
publish mọi note trong vault. Không tool nào có trạng thái "đã sinh nhưng chưa
được duyệt".

**Bằng chứng**: `solutions_scan.md#A` (GPT Researcher) và `#C` (Quartz digital
garden — mọi ghi chú công khai).

**Vì sao đáng làm**: nối thẳng vào G-3. Nếu máy bịa 17–34% mà không có cổng
người, kho sẽ nhiễm và không ai biết. Cổng `approved` là chỗ duy nhất một người
đọc thật và chịu trách nhiệm.

**Đã có trong base**: `review_status` 4 trạng thái · web chỉ render `approved` ·
mọi đường vào đều `draft` không ngoại lệ.

---

## G-5 · Mô hình tòa soạn ≠ mô hình digital garden

**Trống**: Quartz dựng *digital garden* — mọi note công khai, liên kết tự do,
không có khái niệm biên tập. Yêu cầu gốc nói *"trang thời sự news"* — tức có tít,
sapo, chuyên mục, và **biên tập viên**.

**Bằng chứng**: `solutions_scan.md#C`.

**Vì sao đáng làm**: khác biệt không nằm ở giao diện mà ở **luật hiển thị**: chỉ
`approved`, gộp theo `url_normalized` (ba bản cùng nguồn = một bài, không phải
ba), sắp theo `priority` chứ không theo ngày.

**[giả định] chưa kiểm**: có thể ép Quartz làm việc này bằng filter + layout tuỳ
biến, thay vì tự viết Next.js. **Đây là câu hỏi mở quan trọng nhất cho s2** —
xem mục "Câu hỏi treo".

**Đã có trong base**: mới là luật viết trong `web/README.md`, **chưa có code**.

---

## Khoảng trống KHÔNG đáng làm — ghi để khỏi trôi lại

> ⚠️ **BA DÒNG ĐẦU BẢNG NÀY ĐÃ ĐẢO CHIỀU** ngày 2026-08-30/31 — xem đợt hai ở
> cuối file. Giữ nguyên bảng chứ không sửa: nó là hồ sơ của quyết định 08-18,
> và biết *một quyết định đã đảo* có giá trị hơn là thấy một bảng luôn đúng.

| Trống | Vì sao bỏ |
|---|---|
| Tự động **tìm** nguồn mới | Yêu cầu gốc chỉ nói xử lý nguồn *đã gửi*. Thêm vào là mở rộng phạm vi không ai yêu cầu |
| Multi-user, phân quyền | Phạm vi chốt: cá nhân một người dùng |
| SEO, chia sẻ công khai | Không có trong yêu cầu gốc |
| Tự viết static site generator | Quartz/Next.js đã giải xong phần này |
| Tự viết engine tóm tắt | LLM đã làm tốt; giá trị của dự án nằm ở **kỷ luật quanh** việc tóm tắt |

---

## Đối chiếu base đã dựng — phần "review lại và đánh dấu"

| Khoảng trống | Đã dựng gì | Trạng thái | Bằng chứng máy |
|---|---|---|---|
| G-1 chắt lọc | skill 6 pass | ✅ cài đặt + đọc hết 13 file | — |
| G-2 schema | schema + validate + test | ✅ **đã kiểm chứng** | 14 test pass · 7 cổng chặn thật |
| G-3 kiểm chứng | Pass 3.5 + hệ số + luật schema | ⚠️ **cưỡng chế xong, chưa chạy nguồn thật** | test t1 chặn `claimed`+1 nguồn |
| G-4 cổng người | `review_status` + hook | ⚠️ luật có, **chưa có bài nào để duyệt** | hook chặn commit sai thật |
| G-5 tòa soạn | `web/README.md` | ❌ **chỉ có luật, chưa có code** | — |

**Kết luận thẩm định**: base đã dựng khớp với 4/5 khoảng trống đáng làm. Không có
phần nào phát minh lại bánh xe. Phần yếu nhất là G-5 — mới là văn bản.

---

## Ba câu hỏi treo cho s2

**Q1 — Quartz hay tự viết Next.js cho `web/`?**
Quartz đã giải xong `.md` → site tĩnh, miễn phí, có người dùng thật. Câu hỏi là
ép được luật tòa soạn vào nó không. Chưa kiểm. Đây là quyết định **có thể xoá
được một module** — đáng kiểm trước khi viết dòng code nào.

**Q2 — Kho rỗng thì giá trị chưa chứng minh được.**
Cả G-3 và G-4 mới ở mức "luật đã cưỡng chế", chưa có bài nào chạy qua. Hệ số kiểm
chứng chéo chỉ có nghĩa từ nguồn thứ 2–3 trở đi. **Ngưỡng đạt trong README dự án
đòi 10 nguồn thật** — chưa chạy nguồn nào.

**Q3 — Nhận output của tool nhóm A vào kho được không?**
Đường tĩnh (`intake.md`) đã thiết kế cho việc này. Nhưng với tỷ lệ bịa 17–34%,
câu hỏi là spot-check 2 trích dẫn có đủ không, hay cần tỷ lệ mẫu cao hơn.

---

# Đợt hai — khoảng trống của phạm vi mới (2026-08-31)

> Mỗi khoảng trống dưới đây **trỏ được về ≥1 bằng chứng** trong
> `solutions_scan.md` hoặc một phép đo tại chỗ trong repo — điều kiện đóng G1.

## Ba dòng đã đảo chiều

| Trống | Quyết 08-18 | Nay | Do lượt nào |
|---|---|---|---|
| Tự động **tìm** nguồn | bỏ | ⚠️ **một phần**: agent tuyển **khi được ra lệnh**, không tự đi tìm | 11 |
| Multi-user, phân quyền | bỏ | ⚠️ **giai đoạn 2** — chưa làm bây giờ | 8 |
| SEO, chia sẻ công khai | bỏ | ⚠️ **giai đoạn 2** — dạy bạn bè qua kênh chat | 10 |

Ba dòng còn lại (tự viết SSG, tự viết engine tóm tắt) **giữ nguyên**.

---

## G-6 · Địa chỉ không PHÂN GIẢI được — trống nguy hiểm nhất

**Đo tại chỗ 2026-08-30.** `validate.py:58` `LOCATOR_RE` = ngoặc vuông chứa
2–80 ký tự **bất kỳ**. Chạy trên `kb/docs/xgboost-taylor-bac-hai.md`:

| chuỗi có thật trong bài | qua cổng §7? |
|---|---|
| `[§II.4]` | ✅ |
| `[2, 1, 0.5, −0.5, −1, −2]` — mảng số | ✅ |
| `[ l(yᵢ, ŷᵢ^(t-1)) + gᵢ·f_t(xᵢ) + ½·hᵢ·f_t(xᵢ)² ]` — công thức | ✅ |
| `[Tôi bịa ra cái này]` | ✅ |

Và grep `core/tests/` + `web/test/`: **không phép kiểm nào hỏi "ngoặc vuông trỏ
tới đâu"** — mọi phép chỉ hỏi "có ngoặc vuông không".

**Đáng làm: CÓ, và làm trước.** Di trú chỉ **1 bản ghi** — kho có đúng một bản `phan-tich`. Nó là nguyên lý ③ của NotebookLM
(`solutions_scan#E`) — *chi phí kiểm chứng phải rẻ hơn chi phí tin* — đồng thời
vá một lỗ trong chính luật chống bịa của dự án. **0 dòng LLM.**

## G-7 · `citations_sampled` / `citations_verified` là số TỰ KHAI

**Đo tại chỗ.** Cả hai đọc thẳng bằng `fm.get(...)`; **không dòng nào trong
repo tính chúng**. `05_intake/gate.py:75` còn phát sẵn template
`citations_sampled: 0  # BẮT BUỘC >=2: tự mở link`.

⇒ Một agent ghi `sampled: 5 / verified: 5` rồi rải `[§II.4]` là **qua sạch toàn
bộ bộ máy chống bịa**. `CLAUDE.md` cấm đúng điều này: *"đếm tay rồi chép số —
số phải do máy tổng hợp từ nguồn (`#tự-khai`)"*.

**Đáng làm: CÓ.** Dự án đã có tiền lệ — `word_count` và `url_normalized` là dữ
liệu dẫn xuất do `validate --fix` tính. Hai trường này phải vào cùng nhóm.

**Giới hạn phải in lên bao bì**: máy kiểm được *địa chỉ có thật + văn tại đó
chứa từ khoá*, **không** kiểm được *văn đó có ủng hộ khẳng định*. NotebookLM
cũng đúng y vậy. Bán quá vạch đó là bịa.

## G-8 · Không có tầng TRUY HỒI nào

**Đo tại chỗ.** `kho.schema.sql`: không FTS5, không embedding, không vector.
Ô tìm kiếm FE là `boDau(the.textContent).includes(tim)` — lọc chuỗi trên DOM
**đã render**, không phải retrieval.

**Đáng làm: CÓ, nhưng SAU G-6/G-7.** Chatbot RAG trả lời *"theo bài X"* mà địa
chỉ không mở được thì nó chỉ là một con AI không kiểm được nữa — G-6 là thứ
duy nhất làm nó khác hàng chợ.

**Chặn phụ**: corpus hiện **3 bản ghi** (`select count(*) from ban_ghi`). Truy
hồi trên 3 bản ghi là xây một phép đo không có gì để đo.

## G-9 · Không có đường nạp TỪ XA

**Đo tại chỗ.** Cửa nạp **đã có** — `POST /api/articles` · `/api/tai-lieu` ·
`/api/video` · `/api/articles/media`. Thiếu là **người gõ cửa từ xa**: không
RSS, không scheduler, không cron; `_inbox/` có đúng một file đặt tay.

Người dùng chốt **request-driven, không phải cron** (lượt 11).

**Đáng làm: CÓ — nhưng SAU core** (lượt 15). Và rẻ hơn tưởng:
`ho_so: thu-vien` **miễn** bốn cổng hình dạng (`validate.py:255-257`), nên
`/nap <url> | <câu ghi chú>` → bản ghi `tai-lieu`/`video` ở `draft`, **0 dòng
LLM**. Bằng chứng sống: `kb/tai-lieu/xgboost-stap-by-step.md` — **74 từ**,
không khung, không locator, `approved`.

`category`/`concepts` **không nằm trong `required`** của schema ⇒ bot bỏ trống
là hợp lệ ngay hôm nay, **không cần FR** (schema đang FROZEN).

## G-10 · Không luật nào nói về dữ liệu GỬI RA — trống về CHÍNH SÁCH

**Đo tại chỗ.** `brd.md:174` B-D3 cấm **công bố**. `security_baseline §4` cấm
**nghe vào**. **Không luật nào nói về gửi RA.**

Phạm vi mới mở lỗ này thành **bốn bậc cùng lúc**:

| hành vi | cái gì rời khỏi máy |
|---|---|
| adapter kéo update | token + request |
| bot trả *"đã nạp: `<slug>`"* | slug, tiêu đề — **nội dung kho** |
| bot dạy bạn bè | **thân bài** — và đây là **B-D3** |
| chưng cất bằng model | **tài liệu nguồn** tới bên thứ ba |

**Đáng làm: CÓ, và nó là BƯỚC 0.** Không phải một tính năng — một **quyết định
chính sách**, phải viết theo **bậc**, và là việc của người.

Cộng ràng buộc ngoài: **NĐ 356/2025 Điều 14** đòi hồ sơ đánh giá tác động
**chuyển dữ liệu xuyên biên giới** (`solutions_scan#F`) — kích hoạt ở **khách
trả tiền đầu tiên**, không phải ở quy mô lớn.

## G-11 · Chatbot chưa tồn tại — và chỗ ĐẶT nó quyết định chi phí kênh

Không có engine hỏi-đáp nào. Nguy cơ kiến trúc: viết nó **bên trong `web/`**.

**[suy luận]** Nếu chatbot mọc trong web UI thì **mỗi kênh thêm vào là viết lại**.
Tách thành service có API thì thêm kênh chỉ là thêm adapter mỏng — đó là toàn
bộ lý do *"core xong rồi mới integration"* (lượt 15) **không tốn gì**.

**Đáng làm: CÓ.** Và ràng buộc thiết kế phải khai từ s2: **web là client #1,
không phải chủ sở hữu.**

## G-12 · Artifact từ corpus (slide · voice · video)

Không có gì. NotebookLM có Mind Map · Flashcard/Quiz · Audio/Video Overview ·
Reports (`solutions_scan#E`).

**Đáng làm: CÓ, nhưng CUỐI CÙNG.** Phụ thuộc nhiều nhất (cần corpus + chưng cất
tốt), tốn nhất (GPU/TTS, chạy phút không phải giây), và **"gửi RA" gắt nhất**.

Một nguyên lý đáng chép từ ⑤: artifact phải **quay ngược làm input** — mind map
cho click node để hỏi tiếp. Khác hẳn "sinh ra file rồi hết".

---

## Đối chiếu base — đợt hai

| Trống | Đã dựng gì | Trạng thái |
|---|---|---|
| G-6 địa chỉ phân giải | `LOCATOR_RE` (khớp mọi ngoặc) | ❌ **lỗ đã đo** |
| G-7 `citations_*` do máy | `fm.get()` | ❌ **tự khai** |
| G-8 truy hồi | không có | ❌ |
| G-9 nạp từ xa | **API nạp đã có**, `ho_so: thu-vien` đã có | ⚠️ **thiếu adapter** |
| G-10 luật gửi RA | không có | ❌ **chặn mọi thứ có model** |
| G-11 chatbot | không có | ❌ |
| G-12 artifact | không có | ❌ |

**Khác hẳn đợt một**: đợt một thẩm định một base **đã dựng 4/5**. Đợt hai khảo
một phạm vi **gần như chưa dựng gì** — trừ G-9, nơi hạ tầng đã sẵn và chỉ
thiếu một client.

## Ba câu hỏi treo đợt một — trạng thái

- **Q1 Quartz hay tự viết?** → **ĐÃ TRẢ LỜI bằng hành động**: `web/render/` là
  SSR tự viết; `web/_quartz/` còn lại là di tích. Không cần bàn lại.
- **Q2 kho rỗng nên giá trị chưa chứng minh được** → **VẪN TREO**. 08-18: 0 bản
  ghi. 08-31: **3**. Ngưỡng README đòi 10.
- **Q3 nhận output tool nhóm A vào kho?** → **VẪN TREO**, và G-6/G-7 vừa cho
  biết vì sao nó nguy hiểm hơn tưởng: spot-check hiện là **số tự khai**.

## Đợt bảy (2026-09-09) — transcript + chưng cất so với mẫu ChatGPT

Bằng chứng: `m12-chat-luong-transcript-chung-cat.md`. Đối chứng là hai PDF chủ dự
án đưa, **cùng một video đã có trong kho** (`thay_on_bai_thi_final.mp4`).

## G-13 · Transcript có ĐÚNG mà không ĐỌC được

M12 lưu `.vtt` 1–9 s/cue và **hiện y nguyên**: 213 dòng cho 13 phút, không header
(tên file · thời lượng · ngôn ngữ · model), `.txt` chỉ lột mốc giờ. Mẫu ChatGPT
gộp ~30 s/đoạn + header 4 dòng — và **cả hai phép ấy không cần model**: dữ liệu
đã nằm trong cue và frontmatter, chỉ chưa ai in ra. Trống này rẻ nhất và lộ nhất.

## G-14 · Một khuôn chưng cất cho mọi thể loại

`_PROMPT` ép **5 mục cố định** (Đầu vào · Process · Output …). Hợp tài liệu kỹ
thuật (`xgboost-taylor-bac-hai` đọc tốt); **gượng** với bài giảng/talkshow — mẫu
ChatGPT sinh 7 mục từ nội dung + 3 bảng. Lỗ không phải "bỏ khuôn" (mất
`M12-R2`/verify) mà là **thiếu bảng khai khuôn theo loại nội dung**, mỗi khuôn giữ
2 mục neo cho verify. Prompt cũng **không nhắc bảng** dù FE `md()` render được.

## G-15 · Không có đường in ra giấy

Máy không pandoc · TeX · LibreOffice · weasyprint. Xuất dừng ở `.vtt/.txt/.docx`.
Typst là một binary vài chục MB, `pandoc --pdf-engine=typst` 27× nhanh hơn xelatex
(slhck 2025-10), font nhúng New Computer Modern — cùng họ với mẫu. Gọi từ THỢ bằng
`subprocess` như `ffmpeg`. **MCP không lấp được lỗ này**: ba MCP server khảo được
đều là vỏ bọc quanh TeX Live hoặc LibreOffice.

## G-16 · Cửa ASR chập chờn, đường dự phòng đã vẽ mà chưa cài

Đo 2026-09-05: 3 gọi cùng clip, **1 thành công**; stream cắt ~175 s; retry vì
"bản cụt". `faster-whisper` là lối `ytdlp-asr-local` `uu_tien 3` — **đã khai trong
bảng, module `asr.py` đã viết, nhưng worker KHÔNG nối tới**: `_chon_loi` trả lối
`uu_tien` thấp nhất nên luôn `cua-asr`, và `worker.py` không `import asr` (đo `grep`
2026-09-09). Gói cũng chưa cài; máy 56 nhân CPU, 0 GPU — tốc độ INT8 **chưa đo**.
Lỗ này **sâu hơn tưởng**: `nguon-transcript.json` khai ba lối nhưng máy chỉ chạy
được một — bảng khai đang hứa một đường dự phòng không tồn tại. Tách khỏi G-13
(độ đọc) — sửa G-13 không cần chờ G-16.
