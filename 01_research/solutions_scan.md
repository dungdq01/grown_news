# Khảo giải pháp đang có

> Ba nhãn theo rule s1: **[fact]** có nguồn + ngày · **[suy luận]** rút ra từ fact
> · **[giả định]** chưa kiểm được. Fact không nguồn bị hạ xuống suy luận.
>
> Khảo ngày 2026-08-18. Yêu cầu gốc: link/tài liệu → `.md` → web cá nhân.

## Bốn nhóm, không phải một

Yêu cầu gốc chạm bốn thị trường tách biệt. Không có nhóm nào phủ trọn — đó là
phát hiện chính của bước này.

```
nguồn → [A] trích xuất → [B] kho .md → [C] xuất bản web
                ↑
          [D] kiểm chứng ← không nhóm nào ở A/B/C làm
```

---

## A · Trích xuất tri thức từ nguồn

### NotebookLM (Google)

- **[fact]** Phân tích PDF/bài báo đã upload, sinh tóm tắt, trả lời câu hỏi, dựng study guide; mạnh ở tổng hợp nhiều paper và theo dấu trích dẫn. Nguồn: [remi8.ai — Best AI Tools for PKM 2026](https://remi8.ai/blog/productivity-1/best-ai-tools-for-personal-knowledge-management-276)
- **[suy luận]** Output sống trong workspace Google, không phải file `.md` trong git của người dùng.
- **Thiếu so với yêu cầu**: không xuất `.md` theo format tự định nghĩa; không có kho phiên bản hoá; không có khái niệm "duyệt trước khi công bố".

### Taskade

- **[fact]** Xuất tóm tắt PDF ra markdown, giữ heading/list/table/code block; có công cụ chuyển hàng loạt PDF → markdown sạch. Nguồn: [taskade.com — 9 Best PDF to Notes AI Tools 2026](https://www.taskade.com/blog/pdf-to-notes)
- **Thiếu**: markdown là *format xuất*, không phải *hợp đồng có schema*. Không ràng buộc trường bắt buộc, không validate được bằng máy.

### GPT Researcher

- **[fact]** Agent tự trị: lập kế hoạch, chia câu hỏi con, tìm web song song, khử trùng lặp, viết báo cáo **có trích dẫn** 2K+ từ, **không có người trong vòng lặp**. Mã nguồn mở từ 2023, thuộc nhóm được fork nhiều nhất. Nguồn: [github.com/assafelovic/gpt-researcher](https://github.com/assafelovic/gpt-researcher) · [gptr.dev](https://gptr.dev/)
- **[suy luận]** Đây là đối thủ gần nhất với nửa "trích xuất" của dự án.
- **Khác biệt bản chất**: GPT Researcher **tự đi tìm nguồn** cho một *chủ đề*. Dự án này **nhận nguồn cụ thể** do người gửi. Hai bài toán ngược chiều — một cái mở rộng, một cái chắt lọc.
- **Thiếu**: "không có người trong vòng lặp" là điểm bán của họ và là điểm dự án này cố ý làm ngược (cổng `approved`).

### Stanford STORM

- **[fact]** Mô phỏng phỏng vấn chuyên gia đa góc nhìn để sinh bài dài chất lượng Wikipedia, có trích dẫn. Nguồn: [digitalapplied.com — Four Open-Source Deep Research Agents](https://www.digitalapplied.com/blog/open-source-deep-research-agents-2026-guide)
- **Thiếu**: cùng vấn đề — sinh bài *về một chủ đề*, không phải chắt lọc *một nguồn đã có*.

---

## B · Kho tri thức cá nhân

### Obsidian

- **[fact]** Markdown, local-first, liên kết hai chiều, dựng đồ thị tri thức cá nhân. Nguồn: [remi8.ai](https://remi8.ai/blog/productivity-1/best-ai-tools-for-personal-knowledge-management-276)
- **[suy luận]** Đây là thứ gần nhất với `kb/` — file `.md` local, có backlink.
- **Thiếu**: không có schema bắt buộc, không có cổng duyệt, không validate được bằng CI. Liên kết là tự do, không phải danh mục kiểm soát.

### Notion AI

- **[fact]** Tóm tắt trang, sinh nội dung, tự điền thuộc tính database. Nguồn: [remi8.ai](https://remi8.ai/blog/productivity-1/best-ai-tools-for-personal-knowledge-management-276)
- **Thiếu**: nguồn chân lý là database của Notion, không phải file trong git. Không diff được bằng mắt.

### Bối cảnh 2026

- **[fact]** Thị trường PKM 2026 chia hai hướng: *text-first* (Notion, Obsidian, Roam) và *AI-first* (bắt thông tin tự nhiên rồi để AI tổ chức/liên kết/truy hồi). Nguồn: [atlasworkspace.ai — PKM 2026 Practical Guide](https://www.atlasworkspace.ai/blog/personal-knowledge-management)
- **[suy luận]** Dự án này không nằm gọn ở hướng nào: dùng AI để *sinh*, nhưng giữ text-first làm nguồn chân lý và bắt người duyệt trước khi công bố.

---

## C · Xuất bản `.md` thành web

### Quartz v4

- **[fact]** Static site generator chuyên chuyển Obsidian vault thành website. Hỗ trợ sẵn wiki-link, tag, backlink, điều hướng thư mục. Miễn phí, thay thế Obsidian Publish. Nguồn: [github.com/tha00/digital-garden](https://github.com/tha00/digital-garden) · [ssp.sh/brain/quartz](https://www.ssp.sh/brain/quartz/)
- **[fact]** v4 viết lại từ đầu, tập trung khả năng mở rộng cho người dùng cuối. Nguồn: [eltonlabs.org — Quartz + GitHub Pages](https://eltonlabs.org/en/base/obsidian-quartz)
- **[suy luận]** Đây là ứng viên thật cho `web/`. Nó giải đúng bài toán `.md` → site tĩnh, đã có người dùng thật, miễn phí, host GitHub Pages được.
- **Thiếu so với yêu cầu**: mô hình *digital garden* (mọi ghi chú đều công khai, liên kết tự do) khác mô hình *tòa soạn* (chỉ `approved` mới lên, gộp theo `url_normalized`, sắp theo `priority`). **[giả định]** Có thể ép Quartz làm việc đó bằng filter + layout tuỳ biến, nhưng chưa kiểm.

---

## D · Kiểm chứng và chống bịa — nhóm quan trọng nhất

Đây là nhóm mà yêu cầu gốc nhấn mạnh ("nguồn không phải code phải qua thẩm định
độ tin cậy") và cũng là nhóm **không tool nào ở A/B/C làm**.

### Mức độ nghiêm trọng của vấn đề

- **[fact]** Nghiên cứu Stanford 2025: trợ lý pháp lý xây riêng, có RAG, vẫn bịa ở **17–34% truy vấn**. Nguồn: [clarityarc.com — AI Hallucination and Grounding](https://www.clarityarc.com/insights/ai-hallucination-grounding-citation)
- **[fact]** Grounding **giảm** bề mặt bịa nhưng **không loại bỏ** — model có grounding vẫn xuyên tạc bằng chứng và sinh khẳng định mà tài liệu truy hồi không hỗ trợ. Nguồn: cùng trên.
- **[suy luận]** Đây là bằng chứng mạnh nhất cho luận điểm nền của dự án: **có trích dẫn không đồng nghĩa trích dẫn đúng**. Nên spot-check trích dẫn và cổng người không phải thủ tục thừa.

### Công cụ đang có

- **[fact]** VeriTrail (Microsoft Research) truy vết đường bằng chứng từ nguồn tới output trong quy trình AI nhiều bước. Nguồn: [microsoft.com — VeriTrail](https://www.microsoft.com/en-us/research/blog/veritrail-detecting-hallucination-and-tracing-provenance-in-multi-step-ai-workflows/)
- **[fact]** GPTZero Hallucination Detector phát hiện nguồn bịa và khẳng định yếu bằng chứng. Nguồn: [gptzero.me/hallucination-detector](https://gptzero.me/hallucination-detector)
- **[fact]** INRA tra chéo PubMed, Semantic Scholar, arXiv, Unpaywall, Google Scholar để xác nhận paper có thật. Nguồn: [inra.ai/blog/citation-accuracy](https://www.inra.ai/blog/citation-accuracy)
- **[fact]** eTracer: grounding ở **mức từng khẳng định** (claim-level). Nguồn: [arxiv.org/pdf/2601.03669](https://arxiv.org/pdf/2601.03669)
- **[suy luận]** Các tool này kiểm *một output đơn lẻ*. Không cái nào tích luỹ độ tin qua nhiều nguồn theo thời gian, cũng không cái nào chặn "khẳng định yếu trở thành skill điều khiển agent".

---

## Tổng hợp — không nhóm nào phủ trọn

| | Trích xuất | Kho `.md` có schema | Xuất bản web | Kiểm chứng tích luỹ |
|---|---|---|---|---|
| NotebookLM | ✅ | ❌ | ❌ | ❌ |
| Taskade | ✅ | ⚠️ md nhưng không schema | ❌ | ❌ |
| GPT Researcher | ✅ ngược chiều | ❌ | ❌ | ⚠️ có trích dẫn, không thẩm định |
| STORM | ✅ ngược chiều | ❌ | ❌ | ⚠️ như trên |
| Obsidian | ❌ | ⚠️ md, không schema | qua Quartz | ❌ |
| Notion AI | ✅ | ❌ db không phải git | ⚠️ | ❌ |
| Quartz | ❌ | ❌ | ✅ | ❌ |
| VeriTrail/GPTZero/INRA | ❌ | ❌ | ❌ | ⚠️ một output, không tích luỹ |

**[suy luận]** Ghép Obsidian + Quartz + một prompt tóm tắt là dựng được 70% dự án
này trong một buổi chiều. Phần 30% còn lại — schema cưỡng chế, cổng duyệt, thang
kiểm chứng, hệ số kiểm chứng chéo — là phần không mua sẵn được.

## Đã tìm ở đâu — bắt buộc ghi trước khi nói "chưa ai làm"

WebSearch ngày 2026-08-18, bốn truy vấn:
1. `personal knowledge management AI summarize articles papers into markdown notes tool 2026`
2. `Obsidian digital garden publish markdown notes static site generator Quartz`
3. `GPT Researcher STORM AI deep research agent generates cited report from sources open source`
4. `AI generated summary hallucination citation verification grounding evidence claim provenance tool`

**Chưa tìm** (khoảng trống của chính bước khảo sát này):
- Tool thương mại nội bộ doanh nghiệp (không index công khai)
- Thị trường tiếng Việt/Trung
- Sản phẩm ra sau 2026-08

**[giả định]** Không có sản phẩm nào ghép đủ bốn nhóm kèm cổng người. Mức tin:
trung bình — bốn truy vấn không đủ để khẳng định mạnh, nhưng đủ để nói không có
ứng viên hiển nhiên.

---

# Đợt khảo THỨ HAI — 2026-08-29 → 08-31

> Phạm vi mới: agent chưng cất · chatbot RAG · sinh artifact · tích hợp đa kênh.
> Raw đầy đủ ở bốn file cùng thư mục — mục này chỉ chưng phần **quyết định được**:
> `llm-features-scan.md` · `notebooklm-tinh-tuy.md` ·
> `kenh-chat-va-business-agent.md` · `hermes-agent-duoi-factory.md`

## E · Hình mẫu tham chiếu — NotebookLM / Gemini Notebook

Người dùng chỉ đích danh (lượt 7). Khảo lại sâu, **không** dùng lại mục A cũ.

- **[fact]** Phạm vi truy hồi là **control hiển thị**: mỗi nguồn một checkbox
  bật/tắt, quyết định model được đọc gì. Nguồn:
  `support.google.com/notebooklm/answer/16179559` (đọc 2026-08-30)
- **[fact]** Từ chối có **phân loại lý do**: bị chặn an toàn · câu hỏi mơ hồ ·
  **không có trong nguồn**. Nguồn: `support.google.com/gemininotebook/answer/16164461`
- **[fact]** Hạn mức miễn phí: 100 notebook · 50 nguồn/notebook · 500.000
  từ/nguồn · 200MB/file · 50 chat/ngày · 3 audio/ngày. Nguồn:
  `support.google.com/notebooklm/answer/16269187`
- **[fact]** Từ **02/09/2026** đổi sang quota **theo compute**, nạp lại mỗi 5
  giờ, trần theo tuần. Nguồn: `support.google.com/gemininotebook/answer/17670842`
- **[fact]** Artifact có thật: Mind Map (click node để hỏi tiếp) · Flashcard/Quiz
  (dễ/vừa/khó, xuất CSV) · Audio Overview · Video Overview (slide có thuyết
  minh) · Reports. Nguồn: `.../16212283`, `.../16958963`, `.../16213268`
- **[fact]** "Chat View" **che hiển thị, không phải access control** — giấu
  nguồn khỏi người xem nhưng **không thu hồi quyền truy cập thật**. Nguồn:
  `support.google.com/gemininotebook/answer/16206563`
- **[fact]** Nguồn YouTube bị xoá/chuyển private **tự bị gỡ khỏi notebook trong
  30 ngày** ⇒ cùng câu hỏi, hai thời điểm, hai kết quả. Nguồn: cùng trên
- **[suy luận]** Tinh tuý tách được khỏi Google, năm điều: ① phạm vi truy hồi
  là control hiển thị ② từ chối phải phân loại lý do ③ **chi phí kiểm chứng
  phải rẻ hơn chi phí tin** ④ N preset + đúng một cửa thoát ⑤ artifact phải
  quay ngược làm input cho vòng hỏi sau.
- **Thiếu so với yêu cầu**: output sống trong workspace Google; không `.md` có
  schema; không cổng duyệt; và corpus **trôi** (điểm Grown_news đã hơn sẵn nhờ
  `_media/<sha256>`).
- **Độ tin của mục này: THẤP** — workflow 14 agent, 30 claim trích nhưng chỉ
  **3 qua phản biện đối kháng**. Phần lớn là trích nguyên văn từ trang support
  chính thức, chưa có phiếu phản bác.

## F · Kênh chat — bề mặt tích hợp

Khảo bằng `/deep-research` 24 nguồn. **Cảnh báo phương pháp: 28/106 agent chết
vì hết hạn mức**, gồm toàn bộ vòng phản biện cho Telegram/Facebook/pháp lý VN.
15 claim qua phản biện — gần như **toàn bộ là Zalo OA**.

### Câu hỏi quyết định: kênh có cho ĐẨY tin khi người dùng không vừa nhắn?

- **[fact ✅3-0]** Zalo OA: Tin Truyền thông tới follower **≤ 4 tin/tháng**, chỉ
  gửi 6h00–19h59. Nguồn: `oa.zalo.me/.../thong-bao-chinh-sach-gui-tin...`
- **[fact ✅3-0]** Messenger/IG: chỉ **24 giờ** sau tương tác của người dùng.
  Nguồn: `developers.facebook.com/documentation/business-messaging/.../policy`
- **[fact ⚠️chưa phản biện]** Sau 24h là 7 ngày **chỉ người thật gõ tay qua
  Inbox**; xa hơn chỉ Message Tags — **không có đường hợp lệ cho newsletter**.
- **[fact ⚠️chưa phản biện]** Telegram: **không có cửa sổ tin nhắn nào**.
  Nguồn: `core.telegram.org/bots/faq`

### Chi phí mở kênh

- **[fact ✅3-0]** Zalo OA: quyền dùng **Chatbot + API** nằm ở gói **trả phí**
  "Tăng trưởng"; mua gói đòi OA **xác thực** + ví **ZBS đã nạp tiền**.
- **[fact ✅3-0]** Zalo OA Tin Tư vấn: 8 tin/48h miễn phí rồi **55đ/tin**; qua
  **OpenAPI** cửa sổ chỉ **7 ngày**, qua giao diện OA Manager **365 ngày** —
  Zalo cố ý phạt đường tự động.
- **[fact ⚠️]** Telegram: `/newbot` với BotFather, **không xét duyệt, không xác
  minh, không phí**. `core.telegram.org/bots/features`
- **[fact ⚠️]** Telegram nhận update bằng **long polling HOẶC webhook**, loại
  trừ lẫn nhau ⇒ **không bắt buộc HTTPS public**.
- **[suy luận]** Đây là ranh giới quan trọng nhất của phần tích hợp: kênh nhận
  tin bằng cách **gọi RA** (Telegram, Discord) là *một tiến trình local*; kênh
  đòi **nghe VÀO** (Zalo OA, Messenger) là *một dự án hạ tầng*.

### Kéo nội dung VỀ từ kênh

- **[fact ⚠️]** FB **Groups API gỡ khỏi mọi phiên bản từ 22/04/2024**.
- **[fact ⚠️]** Graph API còn rất ít dữ liệu page (`id`/`name`/`about`/`fan_count`);
  post/group/user-level **không còn truy cập được** tính tới 2026.
- **[fact ⚠️]** Scraper FB nguồn mở lớn nhất `kevinzg/facebook-scraper` (3.157★)
  ngừng push **22/6/2024**, tự nhận *"không đáng tin cho production"*; top-10
  repo đều stale >12 tháng. Meta có **đội Anti-Scraping**, randomize class/id
  **cố ý**, login wall, kiện tụng.
- **[fact ⚠️]** Telegram Bot API **nhận `channel_post`** khi bot là thành viên
  kênh ⇒ ingest chính thức khả thi, không cần MTProto.
- **[fact ⚠️]** Bot trong **group** mặc định bật **privacy mode** — chỉ thấy lệnh
  gửi cho nó. Bot API: upload **50MB** / download **20MB** (MTProto: 2GB).
- **[fact ⚠️]** MTProto userbot đọc được mọi kênh + lịch sử, nhưng Telegram
  **gắn cờ / khoá tài khoản** tự động hoá qua tài khoản người.
- **[suy luận]** "Kéo bài về từ Facebook" không phải tính năng khó — nó là
  **tính năng không tồn tại**. Đường ingest chính thức duy nhất còn sống là
  Telegram channel mà bot là thành viên.

### Zalo — trạng thái ĐANG NGHIÊN CỨU (lượt 14)

- **[fact ⚠️]** Tồn tại **Zalo Bot API** riêng biệt với OA: SDK `python-zalo-bot`
  (MIT, **fork từ `python-telegram-bot`**), phát hành 0.0.2 ngày **01/7/2025**,
  còn bảo trì tới 0.1.9 ngày **27/1/2026**. Hỗ trợ **cả long polling lẫn webhook**.
  Nguồn: `pypi.org/project/python-zalo-bot`
- **[fact]** Trang PyPI **không nêu** điều kiện mở bot, phí, hay rate limit.
- **[giả định]** Zalo **không có API cho tài khoản cá nhân**. Cơ sở: hai đợt quét
  `developers.zalo.me` + `oa.zalo.me` chỉ ra hai bề mặt chính thức (OA + Bot API).
  **Chưa đủ để khẳng định mạnh** — chưa tìm bằng truy vấn tiếng Việt về
  `zca-js` / client không chính thức.

### Pháp lý VN — nền đã đổi

- **[fact ⚠️]** **Nghị định 13/2023 HẾT HIỆU LỰC 01/01/2026**; thay bằng **Luật
  Bảo vệ dữ liệu cá nhân 2025** + **NĐ 356/2025/NĐ-CP**, hiệu lực 01/01/2026.
  Nguồn: `thuvienphapluat.vn`
- **[fact ⚠️]** **Điều 14 NĐ 356/2025** buộc lập hồ sơ đánh giá tác động xử lý
  DLCN **và** hồ sơ đánh giá tác động **chuyển DLCN xuyên biên giới**.
- **[fact ⚠️]** NĐ 91/2020 (tin nhắn rác) chỉ nói SMS/MMS/USSD/email/cuộc gọi —
  **không nêu rõ** áp cho OTT. Nguồn: `luatvietnam.vn`
- **[suy luận]** Gửi tin chat của người dùng VN tới model nước ngoài **chính là**
  chuyển dữ liệu xuyên biên giới ⇒ chi phí pháp lý cố định xuất hiện ở **khách
  trả tiền đầu tiên**, không phải ở quy mô lớn.

## G · Hermes Agent — ứng viên cho ổ `executor` và cho gateway

Khảo riêng ở `hermes-agent-duoi-factory.md` (2026-08-30). Chưng phần quyết định:

- **[fact]** MIT, chạy Windows native, có `-z` một-phát-rồi-thoát **stdout sạch**,
  mã thoát, `--worktree`, `--usage-file` (JSON token/cost).
  Nguồn: `github.com/NousResearch/hermes-agent`
- **[fact]** Có `hermes gateway` — **Telegram/Discord/Slack**. **Không có Zalo.**
- **[suy luận]** Bộ `-z` + mã thoát + `--usage-file` đúng hình dạng một
  **executor đo được bằng máy**, không phải agent tự khai.
- **[fact — kết luận đã ghi]** Bốn khoảng trống hạng **chặn**, trong đó **G3**:
  *"`cron` + `gateway` là cò súng ngoài cổng Factory — tắt cả hai ở profile dùng
  cho dự án"*.
- **[suy luận mới, 08-31]** G3 nói về Hermes làm **executor viết mã**. Làm **cổng
  nạp nội dung** thì lần ghi vẫn qua `validate.py` + M05-R1 ép `draft` ⇒ có gate,
  chỉ là gate khác. Giải được, **với điều kiện hai profile tách bạch**:
  gateway chỉ gọi API nạp, không chạy trong repo, không worktree.

## Đã tìm ở đâu — đợt hai

- `/deep-research` 2026-08-30, 5 góc, 24 nguồn (Zalo OA · Telegram · FB ·
  Telethon/Pyrogram · pháp lý VN). **28/106 agent chết vì hết hạn mức.**
- `/deep-research` gọn 2026-08-30, 3 góc, 5 nguồn NotebookLM. 14/14 agent xong.
- Đọc mã tại chỗ: `validate.py` · `gate.py` · `frontmatter.schema.json` ·
  `kho.schema.sql` · `router.mjs` · `server.mjs` · `multiwindow.inline.ts`.

**Chưa tìm** — khoảng trống của chính đợt khảo này:

- Truy vấn tiếng Việt về client Zalo không chính thức (`zca-js`…)
- Discord Bot API — **chưa khảo bằng nguồn**, mọi phát biểu về Discord trong
  các lượt bàn là **[giả định]** dựa trên hiểu biết chung, không có nguồn+ngày
- Chi phí token thực tế cho một lần chưng cất
- Chất lượng model local (Ollama) trên tiếng Việt kỹ thuật
- Tỉ lệ hallucination/misattribution thực tế của NotebookLM — **không có số liệu
  chính thức**, và đó là chỗ mọi hệ RAG hay vỡ
