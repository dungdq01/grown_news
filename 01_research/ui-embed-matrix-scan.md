# UI hai mặt (ngữ cảnh + quản lý) — khảo sát cho ma trận module×màn (raw)

> **Raw đợt năm** · 2026-09-02 · 9 agent (3 track × 2 góc + phản biện fetch lại
> nguồn: 36 kiểm — 30 CONFIRMED · 1 REFUTED · 5 PLAUSIBLE). Trả lời chỉ đạo:
> *"module len lỏi vào module khác… ngoài trang quản lý riêng còn button đi kèm
> khi đọc bài — như vậy mới nhanh"*. Bản chưng đổ vào
> `05_uiux/ma-tran-module-man.md`; đây là claims đầy đủ.
> Pattern REFUTED: mô tả Notion AI preview Replace/Insert dựa trang đã đổi sang
> Notion Agent — dùng bản trong track nut-ngu-canh (đã confirm qua Zapier).


## Nút/panel ngữ cảnh trong sản phẩm thật

### Góc 1 — khuyến nghị

Cho mặt (b) nút/panel ngữ cảnh của Grown_news, tổ hợp đáng làm nhất là: (1) rail phải gập được trong cửa sổ đọc theo mẫu Readwise/Comet — 2 tab 'Hỏi' (M14, chat có chip trích dẫn bấm-nhảy-về-đoạn) và 'Sinh' (tile Chưng cất M12 + Slide/Audio/Video M16); (2) toolbar nổi khi bôi đen theo mẫu Notion/Dia — đoạn chọn thành chip ngữ cảnh đính vào chat, KHÔNG có nhánh replace vì bài trong kho là chỉ-đọc; (3) một nút one-click 'Chưng cất' tách riêng khỏi nút chat trên thanh tiêu đề cửa sổ đọc theo mẫu Comet. Khớp nối sang mặt (a) trang quản lý chép nguyên NotebookLM: bấm sinh → toast 'đã xếp hàng' + badge đếm job trên sidebar rail → trang quản lý hiện hàng đợi với giai đoạn (enum giai đoạn M12 map thành progress step) → xong thì thông báo link ngược về bài. Nguyên tắc chung rút từ cả 8 nguồn: hành động AI khởi phát TẠI ngữ cảnh nhưng kết quả chậm (job phút) phải SỐNG ở nơi quản lý, còn kết quả nhanh (hỏi-đáp M13/M14) sống ngay trong panel; và mọi kết quả sinh phải qua bước duyệt-trước-khi-ghi (Insert/Keep) nếu nó ghi vào kho. Lưu ý luật 'ba module tách biệt': panel ngữ cảnh trong cửa sổ đọc của bài viết · tài liệu · video có thể dùng chung component nhưng bộ hành động phải khai theo loại (video không có 'bôi đen đoạn văn').

### Góc 1 — patterns (9)

#### Bố cục 3 panel Nguồn–Chat–Studio (NotebookLM)

Ba cột cố định trong một màn: TRÁI = danh sách nguồn (tick chọn nguồn nào tham gia trả lời), GIỮA = chat hỏi-đáp có trích dẫn dạng chip số bấm vào nhảy về đúng đoạn nguồn, PHẢI = Studio chứa các Ô (tile) sinh artifact: Audio Overview, Video Overview, Mind Map, Report, Slide, Flashcard... Mỗi tile là một nút 'sinh'; artifact sinh xong xếp chồng NGAY trong panel Studio đó (từ bản redesign 2025 một notebook chứa nhiều output cùng loại). Luồng: chọn nguồn → hỏi ở giữa hoặc bấm tile bên phải → artifact hiện trong Studio, chat vẫn dùng được trong lúc chờ.

- **nguồn**: https://atomicego.com/ai-tools/notebooklm/notebooklm-studio-pane
- **sản phẩm**: Google NotebookLM (redesign 3 cột 2025)
- **áp cho Grown**: Áp cho 'cửa sổ đọc' nổi của Grown_news: nội dung bài ở giữa, một rail phải gập được chứa 2 tab — 'Hỏi' (M14 chatbot, trích dẫn bấm được cuộn về đoạn trong bài) và 'Sinh' (tile Chưng cất M12, Slide/Audio/Video M16). Đánh đổi: cửa sổ đọc multiwindow vốn hẹp, 3 cột đầy đủ sẽ chật — nên rút thành 2 vùng (nội dung + rail phải), phần 'nguồn' đã có sẵn là chính bài đang mở.

#### Toolbar nổi khi bôi đen + menu 'Ask AI' + duyệt-trước-khi-chèn (Notion AI)

Trigger: bôi đen bất kỳ đoạn văn bản → toolbar nổi hiện ngay trên vùng chọn, có mục 'Ask AI'. Kết quả sinh ra hiện trong khung xem trước NGAY DƯỚI vùng chọn, KHÔNG tự chèn vào tài liệu; người dùng chọn tiếp: 'Insert below' (chèn dưới bản gốc), 'Replace' (thay bản gốc), hoặc gõ chỉ dẫn tiếp để sinh lại. Undo = vì chưa Keep thì chưa đụng tài liệu; sau khi chèn thì Ctrl+Z chuẩn của editor.

- **nguồn**: https://zapier.com/blog/how-to-use-notion-ai/
- **sản phẩm**: Notion AI (cũng là mẫu của Coda AI, Mem)
- **áp cho Grown**: Áp cho cửa sổ đọc bài viết/tài liệu: bôi đen đoạn văn → toolbar nổi có 'Hỏi đoạn này' (M14 — câu hỏi mang kèm đoạn chọn làm ngữ cảnh) và 'Chưng cất từ đoạn này' (M12). Vì kho Grown_news là nội dung CHỈ ĐỌC, bỏ nhánh Replace — kết quả luôn đổ vào panel/ghi chú, không sửa bài gốc. Đánh đổi: toolbar nổi cần JS selection-tracking, SSR thuần phải thêm một island tương tác.

#### AI block hai thanh: ô kết quả + ô lệnh, nút Keep (Coda AI)

Gõ '/' trên dòng mới → menu tìm kiếm → chọn 'AI block' → hiện HAI thanh: thanh trên là chỗ nội dung sẽ đổ về, thanh dưới là ô nhập chỉ dẫn. Sinh xong hiện popup cho phép chỉnh tiếp ('ngắn hơn', sửa prompt gốc); bấm 'Keep' mới chốt vào trang. Trạng thái chờ nằm ngay trong block đó. Điểm cảnh giác đã ghi nhận: sinh thẳng ra trang (không qua block) thì sau Keep không xem lại/sửa prompt được nữa.

- **nguồn**: https://zapier.com/blog/how-to-use-coda-ai/
- **sản phẩm**: Coda AI
- **áp cho Grown**: Áp cho FORM VIẾT BÀI (SCR-05) hơn là màn đọc: khi soạn/biên tập bản nháp chưng cất M12, mỗi mục do LLM sinh là một block có 'kết quả + ô chỉ dẫn + Keep', giữ được prompt để sinh lại. Đánh đổi: nặng về editor tương tác; chỉ đáng làm nếu Grown_news cho chỉnh sửa bản nháp chưng cất từng mục thay vì cả bài.

#### Preset prompt trong sidebar phải + hover-lộ-nút + phím tắt (Readwise Reader Ghostreader)

Ba đường vào cùng một bộ hành động AI trên bài đang đọc: (1) hover vào MỤC TÓM TẮT ở đầu bài trên web → lộ nút summarize tại chỗ; (2) tab Chat ở sidebar PHẢI, trong khung chat có 'Preset prompts' (tóm tắt tài liệu, tra từ, giải thích khái niệm...); (3) phím tắt Shift+G gọi Ghostreader. Trên highlight: chạm highlight → menu hiện icon con ma → hành động chạy trên đúng đoạn đó. Kết quả tóm tắt điền vào field summary của tài liệu, kết quả trên highlight thành note gắn vào highlight.

- **nguồn**: https://docs.readwise.io/reader/guides/ghostreader/overview
- **sản phẩm**: Readwise Reader (Ghostreader). Lưu ý: Omnivore đã đóng cửa, Matter không tìm được docs UI đủ chi tiết — bỏ khỏi khảo sát.
- **áp cho Grown**: Mẫu khớp nhất với cửa sổ đọc Grown_news: ô 'Tóm tắt' rỗng ở đầu bài hover-lộ nút 'Chưng cất' (M12) — kết quả điền vào đúng ô đó; sidebar phải tab Chat có preset câu hỏi tiếng Việt (M14); highlight → menu hành động. Đánh đổi: hover không tồn tại trên mobile — cần nút hiện thường trực ở viewport hẹp.

#### Hỏi-trang qua overlay tìm kiếm quen thuộc, không che nội dung (Arc Max)

Không thêm khung mới: chiếm dụng Cmd/Ctrl+F — thanh tìm kiếm nhỏ quen thuộc ở góc trên, gõ câu hỏi thay vì từ khoá → trả lời AI ngay trong thanh đó, trang vẫn hiện nguyên. Kèm '5-Second Previews': hover link + giữ Shift → hộp thoại nhỏ tóm tắt trang đích, khỏi phải bấm sang.

- **nguồn**: https://tidbits.com/2023/10/06/arc-web-browser-introduces-focused-ai-features/
- **sản phẩm**: Arc Max (Arc Browser, macOS/Windows)
- **áp cho Grown**: Áp hai chỗ: (1) trong cửa sổ đọc, Ctrl+F nâng cấp thành 'tìm hoặc hỏi bài này' (M13 truy hồi trong bài + M14 trả lời) — chi phí UI gần bằng 0 vì tận dụng cử chỉ có sẵn; (2) ở màn DANH SÁCH (Bài viết/Tài liệu/Video), hover thẻ bài → popover tóm tắt đã chưng cất sẵn từ M12, không sinh mới lúc hover. Đánh đổi: đè lên hành vi Ctrl+F gốc phải giữ được nhánh tìm-chữ thường.

#### Bôi đen rồi gõ thẳng — phím gõ tiếp theo rơi vào chat (Dia)

Sidebar chat là công dân hạng nhất của cửa sổ, tự mang ngữ cảnh các tab đang mở. Luồng đặc trưng: bôi đen văn bản trên trang → (Cmd+Shift+E hoặc gõ luôn) → đoạn bôi đen được đính làm ngữ cảnh vào chat sidebar, phím gõ tiếp theo đi thẳng vào ô chat — không phải đi tìm ô nhập, không click thêm. Trả lời hiện ở sidebar, trang giữ nguyên.

- **nguồn**: https://tidbits.com/2025/06/20/dia-browser-debuts-with-contextual-ai-chat-but-arc-users-feel-left-behind/
- **sản phẩm**: Dia (The Browser Company, 2025)
- **áp cho Grown**: Áp cho cửa sổ đọc: bôi đen đoạn trong bài → chip 'đoạn đã chọn' tự đính vào ô chat của panel M14, focus nhảy vào ô nhập. Multiwindow của Grown_news còn hợp hơn browser: mở 2 cửa sổ đọc thì panel chat có thể nhận ngữ cảnh 'các bài đang mở' kiểu chat-with-your-tabs. Đánh đổi: cướp focus bàn phím dễ gây khó chịu — nên yêu cầu một phím tắt tường minh thay vì gõ-là-vào.

#### Sidebar trợ lý gập được + một nút tóm-tắt-trang trên khung (Comet)

Icon Assistant cố định góc trên phải của khung browser → bấm mở sidebar gập được; sidebar đọc được trang hiện tại và mọi tab nhắc bằng '@'. Cạnh icon đó có riêng MỘT nút tóm tắt (ba gạch ngang, hoặc Alt+S) → mở assistant với bản tóm tắt trang hiện tại sinh sẵn, kèm citation bấm được và follow-up gợi ý. Khung trợ lý ban đầu rỗng, thành chat khi gõ.

- **nguồn**: https://comet-help.perplexity.ai/en/articles/11734688-assistant-panel
- **sản phẩm**: Perplexity Comet (2025)
- **áp cho Grown**: Áp cho THANH TIÊU ĐỀ của cửa sổ đọc nổi: 2 icon cố định — 'Hỏi bài này' (mở panel M14 rỗng) và 'Chưng cất' (M12, one-click, panel mở kèm kết quả/hàng đợi). Tách nút one-click khỏi nút chat là điểm đáng chép: hành động phổ biến nhất không bắt gõ gì. Cú pháp '@bài-khác' trong chat ăn khớp M13 truy hồi liên bài. Đánh đổi: mỗi cửa sổ nổi thêm 2 icon, thanh tiêu đề chật ở cửa sổ nhỏ.

#### Sinh nền + làm tiếp trong lúc chờ + artifact xếp vào panel (NotebookLM Audio Overview)

Bấm 'Generate' trên tile → tile chuyển trạng thái đang-sinh (báo trước 'mất vài phút'), việc sinh chạy NỀN: người dùng vẫn chat, vẫn sinh artifact khác, vẫn chuyển màn. Xong thì artifact xuất hiện trong panel Studio dưới dạng thẻ phát/mở được, nghe audio vẫn tiếp tục tra cứu nguồn song song. Đây chính là khớp nối 'bấm ở ngữ cảnh → theo dõi ở chỗ quản lý': nút bấm tại chỗ, kết quả đợi ở panel artifact.

- **nguồn**: https://support.google.com/notebooklm/answer/16212820
- **sản phẩm**: Google NotebookLM (Audio/Video Overview)
- **áp cho Grown**: Đây là pattern nối hai mặt UI theo chỉ đạo 2026-09-02: bấm 'Chưng cất' (M12) hay 'Sinh slide/audio' (M16) trong cửa sổ đọc → toast 'đã xếp hàng, ~X phút' + badge đếm job trên icon sidebar rail → trang quản lý job hiển thị hàng đợi/giai đoạn (enum giai đoạn M12 map thẳng vào progress step) → xong thì badge/toast 'sẵn sàng' link về bài. Đánh đổi: cần kênh đẩy trạng thái (SSE/polling) — SSR thuần phải thêm endpoint poll nhẹ.

#### Trích dẫn dạng chip số bấm-nhảy-về-nguồn (NotebookLM / Comet)

Mọi câu trả lời chat kèm chip số nhỏ [1][2] ngay sau mệnh đề; bấm chip → panel nguồn cuộn tới và highlight đúng đoạn được trích. Trích dẫn là đơn vị điều hướng, không phải footnote trang trí. Comet cũng dùng citation bấm được trong sidebar assistant.

- **nguồn**: https://medium.com/@shivashanker7337/notebooklm-the-complete-guide-updated-october-2025-1c9ebf5c14f6
- **sản phẩm**: Google NotebookLM; Perplexity Comet
- **áp cho Grown**: Yêu cầu cứng cho M14 (chatbot hỏi-đáp CÓ TRÍCH DẪN theo spec Z7): chip trích dẫn trong panel chat bấm vào → nếu nguồn là bài đang mở thì cuộn+highlight tại chỗ; nếu là bài khác thì mở cửa sổ đọc nổi mới đúng vị trí đoạn — multiwindow của Grown_news là lợi thế tự nhiên cho pattern này. Đánh đổi: backend M13 phải trả offset/anchor đoạn trích, không chỉ id bài.

### Góc 1 — câu hỏi mở

- Cửa sổ đọc nổi của Grown_news rộng bao nhiêu ở breakpoint hẹp nhất — rail phải gập được có còn chỗ, hay phải chuyển thành bottom-sheet như mobile của Readwise?
- M12 chưng cất ghi kết quả vào đâu: field tóm tắt của chính bài (mẫu Ghostreader điền vào summary field) hay tạo bản nháp bài mới đi qua form viết bài SCR-05 (mẫu Coda AI block + Keep)? Hai đường cho hai UI khác nhau.
- Kênh đẩy trạng thái job M12/M16 về UI: SSE, polling định kỳ, hay chỉ refresh khi mở trang quản lý? Quyết định này chặn thiết kế badge đếm job trên sidebar rail.
- M15 (Telegram/Discord) có cần mặt ngữ cảnh trong màn đọc không (nút 'đẩy bài này lên kênh'?) hay chỉ cần trang quản lý — chỉ đạo 2026-09-02 nói 'mỗi năng lực hai mặt' nhưng M15 không có ví dụ sản phẩm tham chiếu nào trong khảo sát này.
- Ctrl+F nâng cấp thành hỏi-bài (mẫu Arc Max) có xung đột với tìm kiếm trình duyệt gốc trong app SSR không — hay để phím tắt riêng?
- Bôi đen trên VIDEO không tồn tại — hành động ngữ cảnh của màn Video lấy gì làm 'đoạn chọn': timestamp range hay transcript đoạn?

### Góc 2 — khuyến nghị

Chốt cho Grown_news một bộ luật 5 điều cho mặt ngữ cảnh: (1) Mỗi cửa sổ đọc có đúng MỘT cụm entry point AI ở header (2-3 nút chữ tiếng Việt + menu 'Thêm'), tuân NN/g 2 tầng disclosure — không rải sparkle. (2) Bôi đen văn bản → menu nổi kiểu Ghostreader với preset đổi theo phạm vi (đoạn vs toàn bài), nối vào M13/M14. (3) Trước khi chạy tác vụ tốn tiền (M12/M16): popover kiểu HAX 1A+1E ghi rõ model, ước tính token/phút, dữ liệu gửi đi đâu, mẫu kết quả — bấm lần hai mới chạy. (4) Khớp nối hai mặt theo luật thời lượng: tác vụ giây (M14 hỏi-đáp) trả kết quả inline tại panel; tác vụ phút (M12/M16) → nút đổi trạng thái 'Đã xếp hàng' tại chỗ + toast có link 'Xem tiến độ' sang trang quản lý, người dùng ở nguyên bài đang đọc; trang quản lý là nguồn sự thật duy nhất về job (giai đoạn enum, retry, last updated, Cancel, kết quả + next action). (5) Không dùng optimistic UI cho job LLM — job có thể fail sau retry cap, trạng thái phải trung thực. Lưu ý ba-module-tách-biệt: menu ngữ cảnh trong cửa sổ đọc của bài viết · tài liệu · video có preset khác nhau (video không có 'bôi đen', vào từ transcript).

### Góc 2 — patterns (7)

#### Progressive disclosure hai tầng cho hành động phụ trong reading view (NN/g)

Chia hành động làm hai tầng: tầng 1 hiện sẵn CHỈ những hành động dùng thường xuyên (quyết định bằng frequency-of-use, không đoán); tầng 2 mở ra khi người dùng yêu cầu (nút '...' / menu). Luật cứng của NN/g: tối đa 2 tầng — 'designs that go beyond 2 disclosure levels typically have low usability'; nếu cần tầng 3 thì phải đơn giản hoá lại thiết kế. Trong reading view: thanh hành động gọn (3-4 nút) neo ở mép cửa sổ đọc, phần còn lại gom vào một menu overflow duy nhất.

- **nguồn**: https://www.nngroup.com/articles/progressive-disclosure/
- **sản phẩm**: Gmail (hàng nút chính + menu '...'), các reading app như Readwise Reader (toolbar tối giản, hành động phụ trong menu)
- **áp cho Grown**: Cửa sổ đọc (multiwindow): tầng 1 = 2-3 hành động chắc chắn dùng nhiều (Hỏi bài này — M14, Chưng cất — M12); tầng 2 = menu 'Thêm' chứa Sinh slide/audio (M16), Gửi ra kênh (M15). Đánh đổi: hành động ở tầng 2 sẽ ít được khám phá hơn — cần đo tần suất sau 1 tháng để hoán đổi vị trí.

#### Contextual AI menu theo selection + theo document (kiểu Ghostreader)

AI tích hợp thẳng vào màn đọc, hai phạm vi gọi: (a) bôi đen đoạn văn → menu nổi hiện preset (summarize, định nghĩa, dịch, custom prompt); (b) phím tắt / nút ở mức document (Shift+G trong Reader) → hỏi-đáp trên toàn tài liệu. Điểm mấu chốt: danh sách preset TỰ ĐỔI theo phạm vi (selection vs document) — người dùng không phải copy sang tab khác. Kết quả trả về ngay tại chỗ (inline panel), vì đây là tác vụ giây chứ không phải phút.

- **nguồn**: https://docs.readwise.io/reader/guides/ghostreader/overview
- **sản phẩm**: Readwise Reader (Ghostreader), Notion AI (menu trên selection)
- **áp cho Grown**: Cửa sổ đọc bài viết/tài liệu: bôi đen → menu nổi có 'Hỏi đoạn này' (M14 kèm trích dẫn) và 'Tìm bài liên quan' (M13); nút cố định 'Hỏi bài này' ở header cửa sổ đọc cho phạm vi document. Đánh đổi: menu selection cần JS phía client trong app SSR — giới hạn preset 4-5 mục để menu không thành tầng 3.

#### FAB menu / speed dial cho cụm hành động sinh nội dung (Material 3)

Một nút nổi duy nhất, bấm vào mở stack 3-6 hành động liên quan (M3 đã thay 'stacked mini FAB' bằng FAB Menu: panel menu nhỏ mở từ FAB); quá 6 hành động thì KHÔNG dùng FAB nữa mà chuyển sang menu/trang. Khi mở có scrim mờ nền báo hiệu phần ngoài menu tạm khoá; menu ở lại màn hình đến khi chọn một hành động hoặc bấm scrim.

- **nguồn**: https://m3.material.io/components/fab-menu
- **sản phẩm**: Google apps trên Android (Gmail compose FAB), spec Material Design 3 FAB Menu
- **áp cho Grown**: Nếu không muốn thanh toolbar chiếm chỗ trong cửa sổ đọc: một FAB góc dưới-phải của cửa sổ nổi, mở ra 3-4 hành động (Chưng cất M12, Hỏi M14, Sinh slide M16). Đánh đổi: FAB che nội dung đọc và là pattern mobile-first — với web desktop multiwindow, toolbar ở header cửa sổ thường hợp hơn; chỉ dùng FAB cho viewport hẹp.

#### Hiện khả năng AI TRƯỚC khi bấm — HAX G1 (5 pattern 1A-1E)

Guideline 1 của Microsoft HAX: 'Help the user understand what the AI system is capable of doing' — kỳ vọng mù mờ dẫn tới thất vọng và bỏ sản phẩm. 5 pattern UI cụ thể tại entry point: 1A Introductory blurb (một câu mô tả ngay tại nút/panel), 1C Expose system controls (lộ các nút chỉnh để người dùng hiểu biên), 1D Demonstrate possible system inputs (gợi ý sẵn ví dụ prompt), 1E Show a set of system outputs (cho xem mẫu kết quả). Notion áp 1D: bấm vào ô prompt là hiện danh sách use case dự kiến.

- **nguồn**: https://www.microsoft.com/en-us/haxtoolkit/guideline/make-clear-what-the-system-can-do/
- **sản phẩm**: Notion AI (được HAX dẫn làm ví dụ chính thức: https://www.microsoft.com/en-us/haxtoolkit/example/notion-g1-make-clear-what-the-system-can-do/)
- **áp cho Grown**: Panel chatbot M14 trong cửa sổ đọc: khi mở lần đầu hiện 3 câu hỏi mẫu về đúng bài đang đọc (1D) + một dòng 'Trả lời kèm trích dẫn từ kho của bạn' (1A). Nút Chưng cất M12: tooltip/popover hiện mẫu output (1E) + số giai đoạn, thời gian dự kiến. Đánh đổi: thêm một bước nhìn trước khi bấm — chấp nhận vì job M12 tốn tiền LLM.

#### Nói trước cái AI làm được/không làm được và giá phải trả (PAIR Mental Models + Apple HIG Generative AI)

PAIR: 'be up front about what your product can and can't do the first time the user interacts with it', onboard theo giai đoạn (làm được gì · không làm được gì · sẽ thay đổi ra sao). Apple HIG Generative AI: phải cho người dùng biết khi nào và ở đâu app dùng AI để họ 'knowingly choose to use an AI-powered feature'; ghi nguồn/attribution cho nội dung AI sinh ra; thiết kế đủ 3 trạng thái pre-AI / AI-active (đang chạy) / AI-resolved (kết quả + attribution). Phần 'dữ liệu rời máy': Apple tách bạch on-device vs server model trong kiến trúc Foundation Models — hàm ý UI là ghi rõ tác vụ nào gửi dữ liệu đi.

- **nguồn**: https://pair.withgoogle.com/chapter/mental-models/ và https://developer.apple.com/design/human-interface-guidelines/generative-ai
- **sản phẩm**: Apple Intelligence (Writing Tools — attribution + shimmer khi đang chạy), Google Assistant/Gemini onboarding theo PAIR
- **áp cho Grown**: Dialog xác nhận trước khi chạy M12/M16: một khối cố định ghi 'Gửi toàn văn tài liệu đến <model>, ước tính ~X token / ~Y phút, tối đa Z lần retry' — đúng yêu cầu 'giá phải trả TRƯỚC khi bấm'. Kết quả chưng cất hiển thị badge 'Bản nháp do AI' + link về tài liệu gốc (attribution). Lưu ý: chi tiết shimmer/attribution 16pt tôi lấy qua bài phân tích thứ cấp vì trang HIG render bằng JS không fetch trực tiếp được — cần đối chiếu lại trang gốc.

#### Job nền chạy PHÚT: toast-có-link + trang Jobs, KHÔNG optimistic UI

Luật chọn theo thời lượng: toast cho tác vụ nhanh không nên ngắt ('A toast works for quick tasks that shouldn't interrupt'); inline progress trong hàng bảng cho thao tác từng-item; modal chỉ khi kết quả chặn bước kế tiếp; và 'For anything longer than a minute, add a simple Jobs page (or Activity panel) so people can find work later'. UI của job dài phải có: status label + last updated, progress theo bước, Cancel an toàn, vùng kết quả có next action; khi quay lại phải khôi phục đúng trạng thái mới nhất chứ không hiện thông tin cũ (LogRocket: mất dấu job là cách nhanh nhất phá trust). Optimistic UI chỉ hợp với hành động chắc-thành-công tức thì (like, rename) — không hợp job LLM có thể fail/retry.

- **nguồn**: https://appmaster.io/blog/background-tasks-progress-ui và https://blog.logrocket.com/ux-design/ui-patterns-for-async-workflows-background-jobs-and-data-pipelines/
- **sản phẩm**: Các admin tool/data pipeline được hai bài trên khảo; kiểu 'toast có link View progress' quen thuộc ở Google Drive (nén file để tải) và GitHub Actions (push → link sang tab Actions) — hai ví dụ sau tôi nêu từ trí nhớ, chưa fetch nguồn riêng
- **áp cho Grown**: Đây chính là khớp nối hai mặt UI: bấm 'Chưng cất' (M12) hoặc 'Sinh slide' (M16) trong cửa sổ đọc → nút chuyển trạng thái 'Đã xếp hàng' ngay tại chỗ + toast 'Đang chưng cất — Xem tiến độ' link sang trang quản lý job; KHÔNG chuyển hướng người dùng khỏi bài đang đọc. Trang quản lý M12/M16 hiện hàng đợi với giai đoạn (enum sẵn có), retry count, last updated, Cancel. Riêng M14 (chatbot, trả lời giây) thì inline trong panel, không qua job page.

#### Anti-pattern: AI clutter — sparkle vô nghĩa và nút AI rải khắp nơi

Nghiên cứu NN/g (n=107): xem icon sparkle đứng một mình, 0% người tham gia nhận ra nó nghĩa là AI; 16.82% tưởng là 'favorite/save'. Khuyến nghị NN/g: icon sparkle LUÔN phải kèm label chữ + tooltip; nếu đã có icon chuẩn hoá cho hành động đó thì dùng icon chuẩn. Bài phê bình đáng đọc: Slate 'AI Tools All Use the Same Sparkly Icon' (sparkle hàm ý hoàn hảo trong khi AI hay sai) và NN/g State of UX 2026 ghi nhận fatigue với 'AI experiences that feel rushed, confusing, or disconnected from what users actually need'. Tiêu chí KHÔNG đặt nút AI: (1) không có đối tượng cụ thể tại chỗ đó để AI thao tác; (2) hành động đã có đường vào khác trong cùng màn; (3) nút chỉ để 'có AI' (defensive parity) chứ không từ nhu cầu người dùng; (4) chen vào luồng chính khiến người dùng phải né nó.

- **nguồn**: https://www.nngroup.com/articles/ai-sparkles-icon-problem/ (kèm https://slate.com/technology/2025/12/artificial-intelligence-tools-icon-google-gemini-chatgpt-design.html và https://news.designrush.com/ai-fatigue-product-teams)
- **sản phẩm**: Google từng có ~100 biến thể sparkle icon khắp sản phẩm năm 2024, tăng 37%/quý — chính Google Design thừa nhận và phải chuẩn hoá (https://design.google/library/ai-sparkle-icon-research-pozos-schmidt)
- **áp cho Grown**: Grown_news chỉ đặt entry point AI ở nơi có đối tượng cụ thể: trong cửa sổ đọc (một bài) và trên hàng danh sách khi hover/chọn (một item). KHÔNG đặt: nút AI trên Dashboard chung, sparkle cạnh từng dòng ở mọi màn, chatbot tự bung khi mở app. Mọi nút AI dùng chữ tiếng Việt ('Chưng cất', 'Hỏi bài này') — icon chỉ là phụ, không dùng sparkle trần.

### Góc 2 — câu hỏi mở

- Trang HIG Generative AI của Apple render bằng JS nên chưa đọc được nguyên văn — chi tiết attribution/shimmer lấy qua nguồn thứ cấp, cần một phiên có browser (Playwright) mở developer.apple.com để đối chiếu trước khi đưa vào spec.
- Toast 'Xem tiến độ' trong kiến trúc SSR + multiwindow: toast sống ở tầng nào — trong cửa sổ đọc hay ở shell chung — và có cần một chỉ báo job đang chạy thường trực trên sidebar rail (badge số job active) thay cho notification center không?
- Ngưỡng 'hơn một phút thì cần Jobs page' lấy từ một bài practitioner (AppMaster), chưa có nghiên cứu định lượng cấp NN/g — có chấp nhận làm ngưỡng thiết kế chính thức hay cần đo thời gian job M12 thực tế trước?
- Chi phí LLM hiện cho người dùng ở đơn vị nào (token, tiền, hay chỉ thời gian ước tính) — kho tri thức CÁ NHÂN thì người trả tiền cũng là người bấm, mức chi tiết nào là đủ mà không thành nhiễu?
- Danh sách (màn Bài viết/Tài liệu/Video) có cần bulk action 'Chưng cất N mục đã chọn' kiểu Polaris IndexTable không, hay đợt hai chỉ làm từng-item từ cửa sổ đọc?

### Phản biện (12)

| phán quyết | pattern | lý do |
|---|---|---|
| **PLAUSIBLE** | 6. Bôi đen rồi gõ thẳng — phím gõ tiếp theo rơi vào chat (Dia) | Nguồn tidbits.com/2025/06/20/... còn sống (fetch được qua UA trình duyệt) và xác nhận nửa đầu: chat sidebar công dân hạng nhất, tự mang ngữ cảnh trang hiện tại + các tab mở khác, select text → sửa → nút Insert. NHƯNG claim đặc trưng của pattern — Cmd |
| **CONFIRMED** | 1. Bố cục 3 panel Nguồn–Chat–Studio (NotebookLM) | Nội dung pattern đúng nhưng CITATION YẾU: trang atomicego.com/.../notebooklm-studio-pane còn sống (cập nhật 03/2026) song CHỈ mô tả panel Studio với các tile (Audio/Video Overview, Mind Map, Reports...) — 'Chat is for questions. Studio is for outputs |
| **CONFIRMED** | 2. Toolbar nổi khi bôi đen + 'Ask AI' + duyệt-trước-khi-chèn (Notion AI) | Nguồn zapier.com/blog/how-to-use-notion-ai/ còn sống và mô tả đúng luồng: 'you need to first highlight the text or block you want it to edit' → chọn AI action từ toolbar → 'Notion AI will generate an answer in the preview window' → chỉ chèn khi người |
| **CONFIRMED** | 3. AI block hai thanh: ô kết quả + ô lệnh, nút Keep (Coda AI) | Khớp nguyên văn với nguồn zapier.com/blog/how-to-use-coda-ai/ (còn sống): 'Type forward slash (/) on a new line, and click AI block' → 'Two bars will appear on your page: the top bar is where your content will populate, and the bottom bar is where yo |
| **CONFIRMED** | 4. Preset prompt sidebar phải + hover-lộ-nút + phím tắt (Readwise Reader Ghostreader) | Nguồn docs.readwise.io/reader/guides/ghostreader/overview còn sống, xác nhận: tab Chat sidebar phải với 'Preset prompts', phím tắt Shift+G (toàn tài liệu) và G (trên selection), menu ngữ cảnh khi bôi đen. Riêng chi tiết hover-lộ-nút KHÔNG nằm trên tr |
| **CONFIRMED** | 5. Hỏi-trang qua overlay tìm kiếm quen thuộc (Arc Max) | Nguồn tidbits.com/2023/10/06/... trả 403 cho bot nhưng 200 với UA trình duyệt — còn sống. Bài xác nhận đúng: Ask on Page 'extends the standard capability of searching for text on the page, enabling you instead to ask questions about the page content, |
| **CONFIRMED** | 7. Sidebar trợ lý gập được + một nút tóm-tắt-trang (Comet) | URL gốc comet-help.perplexity.ai/en/articles/11734688-assistant-panel bị 301 về help center mới của Perplexity (bài vẫn tồn tại, bản /help-center/comet/.../11734688-assistant-panel còn index) — nguồn sống nhưng nên cập nhật URL. Nội dung xác nhận đủ: |
| **CONFIRMED** | 8. Sinh nền + làm tiếp trong lúc chờ + artifact xếp vào panel (NotebookLM Audio Overview) | Nguồn support.google.com/notebooklm/answer/16212820 còn sống và nói đúng nguyên văn: 'The audio will be generated in the background, so you can generate other artifacts concurrently or even navigate to other screens', mất 'a couple of minutes', artif |
| **CONFIRMED** | 9. Trích dẫn dạng chip số bấm-nhảy-về-nguồn (NotebookLM / Comet) | Bài Medium của shivashanker7337 tồn tại (search xác nhận title + URL khớp, có cả bản lưu Scribd; WebFetch trực tiếp lỗi mạng cục bộ ECONNREFUSED chứ không phải trang chết). Hành vi được xác nhận chéo bởi nhiều nguồn độc lập: NotebookLM 'shows citatio |
| **CONFIRMED** | 10. Progressive disclosure hai tầng (NN/g) | Nguồn nngroup.com/articles/progressive-disclosure/ còn sống và nói đúng cả ba ý: tầng 1 chỉ hiện 'a few of the most important options' quyết định bằng dữ liệu frequency-of-use; tầng 2 'Disclose these secondary features only if a user asks for them';  |
| **CONFIRMED** | 11. Contextual AI menu theo selection + theo document (kiểu Ghostreader) | Cùng nguồn Ghostreader overview (còn sống): hai phạm vi gọi được xác nhận — (a) selection: bôi đen → context menu 'Chat about this' / phím G với preset (summarize, định nghĩa...); (b) document: Shift+G cho toàn tài liệu. Ý 'danh sách preset chỉnh đượ |
| **CONFIRMED** | 12. FAB menu / speed dial cho cụm hành động sinh nội dung (Material 3) | Trang m3.material.io/components/fab-menu tồn tại (JS-render nên fetch chỉ lấy được title, nhưng spec được mirror nguyên văn tại GitHub material-components/material-components-android docs FloatingActionButtonMenu.md): FAB menu 'opens from a FAB to sh |


## Trang quản lý job nền + nháp AI

### Góc 1 — khuyến nghị

Cho Grown_news quy mô một người: dựng MỘT trang quản lý 'Việc nền' theo khung 4 vùng (list-filter / detail-timeline / log / hành động) thay vì mỗi module một dashboard. Cụ thể: (1) List là bảng SSR, filter trạng thái + loại nguồn bằng query param, mỗi hàng hiện icon trạng thái, tên tài liệu, giai đoạn hiện tại, và với job đang retry thì 'lần x/y · thử lại lúc hh:mm' kiểu Temporal. (2) Bấm hàng → chi tiết mở trong cửa sổ đọc nổi (tận dụng multiwindow sẵn có — khớp luôn với chỉ đạo hai-mặt-UI: nút ngữ cảnh 'Chưng cất' ở màn đọc chỉ cần bắn job rồi toast kèm link mở đúng cửa sổ chi tiết này). (3) Chi tiết = timeline giai đoạn từ enum sẵn có của M12, giai đoạn lỗi tự mở log, log lưu DB theo job id để đóng tab mở lại vẫn còn (job chạy phút thì đây là yêu cầu số một, học từ Vercel/Netlify); đang chạy thì polling 3–5s là đủ, chưa cần SSE. (4) Hành động: Chạy lại · Huỷ · Xoá, cộng section 'Cần xử lý' riêng cho job hết retry cap (dead letter kiểu Sidekiq) với badge đếm trên rail. Bản chưng cất là version bất biến, 'Dùng bản trước' chỉ đổi con trỏ (học Instant Rollback). Bỏ hẳn: RBAC, analytics, đồ thị realtime, bulk ops. Lưu ý quy trình: đây là research đầu vào cho s6 spec của M12/M16 — mapping sang Grown trong các pattern là đề xuất, chưa phải quyết định; đụng tới cấu trúc job/checkpoint của M12 thì phải qua spec/FR chứ không chốt ở tầng UI.

### Góc 1 — patterns (9)

#### List run + thanh filter trạng thái (GitHub Actions / Vercel deploys)

Trang list là một bảng dọc, mỗi hàng một run/deploy: icon trạng thái (xanh/đỏ/vàng quay) đứng đầu hàng, tên run + nguồn kích hoạt (commit/branch/người bấm), thời lượng chạy, tuổi (relative time '3 phút trước'). Phía trên bảng là dãy dropdown filter: Vercel cho lọc theo Branch, Date Range, Environment, Status; GitHub Actions cho lọc theo workflow (sidebar trái), status, branch, actor, event. Bấm vào hàng → sang trang chi tiết. Hành động phụ (redeploy, delete) nằm trong menu '...' cuối hàng, không bày nút trần.

- **nguồn**: https://vercel.com/docs/deployments/managing-deployments
- **sản phẩm**: Vercel Dashboard (Deployments tab), GitHub Actions (tab Actions của repo)
- **áp cho Grown**: Màn 'Việc nền' (trang quản lý M12, dùng chung được cho M16): bảng job chưng cất/sinh media, mỗi hàng = icon trạng thái + tên tài liệu nguồn + giai đoạn hiện tại + thời lượng + tuổi; filter theo trạng thái (chờ/đang chạy/lỗi/xong) và theo loại nguồn (bài viết · tài liệu · video — khớp luật ba module tách biệt). Đánh đổi: SSR thì filter là query param + reload, không client-side — chấp nhận được vì một người dùng, list ngắn.

#### Trang chi tiết run: timeline step gập/mở + log dính theo từng step (GitHub Actions)

Trang chi tiết một run chia: sidebar trái liệt kê job, vùng chính là danh sách step tuần tự — mỗi step một dòng có icon trạng thái + tên + thời lượng riêng. Log không phải một khối liền mà GẬP THEO STEP: bấm step thì log của step đó mở ra; step FAIL được TỰ ĐỘNG MỞ SẴN khi vào trang. Góc phải trên có ô 'Search logs' (chỉ tìm trong step đang mở) và dropdown Download log archive. Bấm số dòng log → tạo permalink tới đúng dòng đó.

- **nguồn**: https://docs.github.com/en/actions/how-tos/monitor-workflows/use-workflow-run-logs
- **sản phẩm**: GitHub Actions (trang workflow run)
- **áp cho Grown**: Trang chi tiết một job M12: giai đoạn enum có sẵn của job chưng cất (tải nguồn → chunk → gọi LLM → ghép → validate) map thẳng thành step timeline — mỗi giai đoạn một dòng có thời lượng, log LLM gập bên dưới, giai đoạn lỗi tự mở sẵn. Đánh đổi: phải lưu log tách theo giai đoạn ngay từ backend (cột stage trong bảng log), không phải một blob text.

#### Re-run all / Re-run failed jobs (GitHub Actions)

Trên trang chi tiết run có nút re-run với hai mức: chạy lại TOÀN BỘ run, hoặc chỉ chạy lại CÁC JOB FAIL (giữ kết quả job đã xanh), hoặc một job cụ thể — được phép trong 30 ngày sau lần chạy đầu. Run chạy lại là attempt mới, attempt cũ vẫn xem được.

- **nguồn**: https://docs.github.com/en/actions/configuring-and-managing-workflows/managing-a-workflow-run
- **sản phẩm**: GitHub Actions
- **áp cho Grown**: Nút 'Chạy lại' trên job M12 lỗi: nếu spec M12 checkpoint theo giai đoạn thì cho 'chạy lại từ giai đoạn hỏng' (tiết kiệm token LLM đáng kể — không gọi lại các giai đoạn đã xong); nếu chưa có checkpoint thì chỉ có 'chạy lại từ đầu' và phải nói rõ trên nút. Giữ attempt cũ để so sánh. Đánh đổi: checkpoint per-stage là việc backend M12, không phải việc UI — cần FR/spec xác nhận trước khi vẽ nút.

#### Deploy summary + log lưu vĩnh viễn theo id, đóng tab mở lại vẫn còn (Vercel/Netlify)

Trang chi tiết deploy của Netlify đặt một DEPLOY SUMMARY ngay TRÊN log: nhận diện nhanh kết quả rồi mới trỏ xuống chi tiết trong log. Log build được lưu theo deploy id — mở lại trang bất kỳ lúc nào vẫn xem được toàn bộ, không phụ thuộc phiên đang mở; khi đang chạy thì log stream sống, warning tô vàng, error tô đỏ. Trạng thái deploy là enum tường minh: New → Enqueued (khi hết build capacity) → Building → Processing → Published/Failed/Canceled.

- **nguồn**: https://docs.netlify.com/deploy/deploy-overview/
- **sản phẩm**: Netlify (deploy detail page), Vercel (Build Logs — https://vercel.com/docs/deployments/logs)
- **áp cho Grown**: Job M12 chạy tính bằng phút → người dùng SẼ đóng cửa sổ đọc rồi quay lại: log và trạng thái phải lưu DB theo job id, trang chi tiết render lại từ DB (hợp SSR), đang chạy thì polling/SSE đắp thêm. Trên log đặt khối tóm tắt kết quả (xong/lỗi ở giai đoạn nào, bao nhiêu token, link bản nháp). Trạng thái enum của M12 hiển thị nguyên văn, kể cả trạng thái 'xếp hàng chờ' khi worker bận.

#### Instant Rollback — bản cũ bất biến, khôi phục = trỏ lại (Vercel)

Mọi deployment là bất biến và được giữ lại; 'rollback' không chạy lại gì cả mà chỉ trỏ production về một bản cũ, tức thời. Xoá một deployment thì mất khả năng rollback về nó — UI cảnh báo điều này. Có cả 'pin' để ghim một bản.

- **nguồn**: https://vercel.com/docs/deployments/rollback-production-deployment
- **sản phẩm**: Vercel (Instant Rollback), Netlify (publish a previous deploy)
- **áp cho Grown**: Bản chưng cất M12 nên là version bất biến: chạy lại job tạo bản mới, bản cũ giữ nguyên; nút 'Dùng bản trước' trên trang chi tiết chỉ đổi con trỏ bản-đang-hiển-thị. Cứu được ca 'bản chưng cất mới tệ hơn bản cũ' mà không chạy lại LLM. Đánh đổi: tốn chỗ lưu nhiều bản — quy mô một người thì không đáng kể; việc map từ deploy sang bản-chưng-cất là suy diễn của tôi, cần đối chiếu spec M12.

#### Tab theo tập trạng thái: Retries / Scheduled / Dead (morgue) — Sidekiq Web

Sidekiq Web UI chia tab theo TẬP job: Queues (đang chờ), Retries (job fail đang chờ thử lại — sắp theo thời điểm retry kế tiếp), Scheduled (hẹn giờ), Dead/morgue (đã hết lượt retry — phải xử lý TAY: retry now / delete / kill từng job hoặc cả trang). Job trong Dead tự huỷ sau 6 tháng nếu không ai đụng. Trang đầu là dashboard đếm số: processed/failed/busy/enqueued + đồ thị realtime. Mọi hành động trên UI đều có API tương đương.

- **nguồn**: https://www.mikeperham.com/2021/04/20/a-tour-of-the-sidekiq-api/
- **sản phẩm**: Sidekiq Web (Ruby), tham chiếu thêm: https://github.com/sidekiq/sidekiq/wiki/Error-Handling
- **áp cho Grown**: M12 có retry cap → PHẢI có chỗ hứng job hết lượt: một tab/section 'Cần xử lý' (dead letter) tách khỏi list thường, badge đếm số đỏ trên rail trái để không bị quên. Mỗi job chết có hai nút: Thử lại · Bỏ hẳn. Quy mô một người: KHÔNG cần đồ thị realtime, không cần bulk actions trăm job — chỉ cần counter + danh sách + hai nút.

#### Job card: payload + kết quả + stacktrace tại chỗ (Bull Board)

Bull Board là inspector cắm vào server: mỗi queue một trang, tab theo state (waiting/active/completed/failed/delayed), bấm vào một job mở card hiện nguyên data đầu vào (JSON), return value, progress, và stacktrace lỗi ngay tại chỗ; nút retry từng job fail (tắt được bằng allowRetries). Không cần rời trang để biết job nhận gì và chết vì gì.

- **nguồn**: https://github.com/felixmosh/bull-board
- **sản phẩm**: Bull Board (BullMQ/Bull), bài hướng dẫn: https://oneuptime.com/blog/post/2026-01-21-bullmq-bull-board/view
- **áp cho Grown**: Trang chi tiết job M12–M16 phải hiện được: đầu vào (tài liệu nào, tham số chưng cất nào), đầu ra (link bản nháp), và lỗi nguyên văn (message + giai đoạn) — không bắt người dùng mò log server. Đánh đổi: payload LLM dài → gập mặc định, chỉ mở khi bấm.

#### Attempt counter + thời điểm retry kế tiếp ngay trên timeline (Temporal)

Timeline view của Temporal mã màu trạng thái: đỏ = fail, ĐỎ NÉT ĐỨT = đang retry, tím nét đứt = pending, xanh = xong; activity đang retry hiện icon kèm SỐ LẦN THỬ hiện tại và THỜI ĐIỂM retry kế tiếp. Có filter 'Pending and Failed Events Only' để lọc nhanh chỗ hỏng; bấm một event mở toàn bộ thông tin kèm các event liên quan (Scheduled/Started/Completed); live update khi job đang chạy.

- **nguồn**: https://temporal.io/changelog/updated-event-history-timeline-view-is-now-available
- **sản phẩm**: Temporal Web UI (v2), blog: https://temporal.io/blog/lets-visualize-a-workflow
- **áp cho Grown**: Với retry cap của M12, hàng job đang retry phải nói rõ 'lần 2/3 · thử lại lúc 14:05' ngay trên list — không bắt bấm vào mới biết; trạng thái 'đang retry' phân biệt thị giác với 'đang chạy lần đầu' (vd viền đứt/màu cam). Đánh đổi: cần backend trả next_retry_at trong API job.

#### Bốn vùng chuẩn của trang quản lý job + danh sách thứ KHÔNG cần cho một người **[giả định]**

Tổng hợp từ các sản phẩm trên, trang quản lý job nền hội tụ về 4 vùng: (1) LIST-FILTER — bảng hàng trạng thái + dropdown lọc; (2) DETAIL-TIMELINE — chuỗi giai đoạn có thời lượng, chỗ hỏng tự mở; (3) LOG — gập theo giai đoạn, lưu vĩnh viễn, tô màu lỗi, có tóm tắt phía trên; (4) HÀNH ĐỘNG — chạy lại (toàn bộ/từ chỗ hỏng), huỷ, xoá, khôi phục bản cũ. Thứ các sản phẩm team-scale có mà quy mô MỘT NGƯỜI không cần: RBAC/team switcher, deployment protection, analytics throughput 90 ngày, đồ thị realtime, bulk operations kiểu 'morgue manager' của Gusto, webhook/notification matrix, audit log ai-làm-gì.

- **nguồn**: https://vercel.com/docs/deployments/managing-deployments
- **sản phẩm**: Tổng hợp: GitHub Actions + Vercel + Netlify + Sidekiq Web + Bull Board + Temporal UI
- **áp cho Grown**: Đây là khung cho spec UI trang quản lý Z7: một trang 'Việc nền' dùng chung cho M12/M16 (job có giai đoạn) với 4 vùng trên; M13/M14/M15 không phải job nền dạng hàng đợi nên KHÔNG nhét vào trang này (M14 cần trang lịch sử hội thoại, M15 cần trang cấu hình kênh — pattern khác, thuộc track khác). Đánh đổi: gộp M12+M16 một trang tiết kiệm màn nhưng phải có cột 'loại năng lực' và filter tương ứng.

### Góc 1 — câu hỏi mở

- M12 có checkpoint theo giai đoạn không — quyết định nút 'Chạy lại' là từ-đầu hay từ-giai-đoạn-hỏng (khác biệt lớn về chi phí token LLM)?
- Luật 'ba module tách biệt ở MỌI tầng' có ràng trang quản lý job không — một trang 'Việc nền' chung có filter loại nguồn có được coi là hợp lệ, hay phải tách ba?
- Bản nháp chưng cất người dùng đã sửa tay, rồi bấm chạy lại job — tạo version mới song song hay chặn chạy lại khi có sửa tay chưa lưu?
- Log LLM (prompt/response đầy đủ) lưu DB thì dung lượng và độ nhạy cảm tới đâu — lưu nguyên văn, lưu rút gọn, hay chỉ lưu metadata + lỗi?
- Job M16 (sinh slide/audio/video) có cùng cấu trúc giai đoạn enum như M12 không — điều kiện để gộp chung một trang quản lý?
- Trạng thái 'xếp hàng chờ' (queued khi worker bận) có tồn tại trong thiết kế M12 không — nếu worker đơn luồng thì list phải hiện vị trí trong hàng đợi?

### Góc 2 — khuyến nghị

Ghép năm mảnh thành một kiến trúc hai mặt thống nhất. (1) Mặt ngữ cảnh: trong cửa sổ đọc, tách hai nhịp — M14 chatbot trả lời trong giây thì dùng preview-trước-ghi kiểu Notion AI (đệm + Lưu/Bỏ/Hỏi lại) ngay tại chỗ; M12/M16 chạy phút thì fire-and-track kiểu NotebookLM: popover chọn kiểu → toast có link → job chạy nền, không modal chặn. (2) Mặt quản lý gồm ba màn tái dùng được cho cả 5 dịch vụ: [Hàng đợi] hai cột kiểu Linear Triage (list job/nháp + preview, 4 hành động: duyệt · sửa-rồi-duyệt · trả-lại · xoá), [Sản phẩm sinh per-tài-liệu] kiểu Studio list, và [Cấu hình] read-only kiểu VS Code trỏ 'sửa ở file'. (3) Khớp nối: một job id hiện ở cả hai mặt; bản chưng cất mang status enum nhap→cho_duyet→da_vao_kho theo pattern WordPress, lưu bản AI gốc bất biến để nút 'khác gì bản AI' diff được. Thứ tự làm: hợp đồng job + status trước (nó là xương sống nối hai mặt), Hàng đợi trước Studio-list (một màn phục vụ cả 5 module), phím tắt và share để sau vì app một người.

### Góc 2 — patterns (6)

#### Studio panel: hàng tile 'tạo mới' + danh sách artifact đã sinh ngay bên dưới (NotebookLM)

Panel Studio của NotebookLM đặt 4 tile tạo mới (Audio Overview, Video Overview, Mind Map, Report) cố định trên cùng; TẤT CẢ artifact đã sinh nằm trong một list ngay bên dưới. Cho phép nhiều output CÙNG LOẠI trong một notebook (nhiều bản audio khác ngôn ngữ/độ dài). Mỗi item trong list: mở lại (Load), xoá (cần quyền edit — xoá xong thì share link cũ chết), share qua link. Sinh chạy nền: bấm tạo xong có thể điều hướng sang màn khác hoặc sinh artifact khác song song; nghe audio trong khi mở Mind Map (multitask trong cùng panel).

- **nguồn**: https://blog.google/innovation-and-ai/models-and-research/google-labs/notebooklm-video-overviews-studio-upgrades/ và https://support.google.com/notebooklm/answer/16212820
- **sản phẩm**: Google NotebookLM (Studio panel, bản nâng cấp 2025)
- **áp cho Grown**: Áp cho trang quản lý M12+M16 ở mức MỘT tài liệu: tab 'Sản phẩm sinh' trong cửa sổ đọc hoặc trang chi tiết tài liệu — hàng nút 'Chưng cất · Slide · Audio · Video' trên cùng, list bản đã sinh bên dưới (mỗi dòng: loại, thời điểm, trạng thái job M12 theo giai đoạn enum, nút mở/xoá). Cho phép nhiều bản chưng cất của cùng tài liệu (chạy lại sau khi sửa prompt). Đánh đổi: list per-tài-liệu không thay được cái nhìn TOÀN CỤC hàng đợi job — vẫn cần trang quản lý riêng (pattern Triage bên dưới); và Grown_news một người dùng nên bỏ phần share/quyền edit.

#### Trạng thái nháp ba nấc + revision làm sổ kiểm toán 'đã tỉa gì' (WordPress AI-draft → human-publish)

Bản AI sinh ra KHÔNG publish thẳng: rơi vào status 'Draft' → 'Pending Review' → 'Published' (dùng chính hệ status của CMS, không kênh riêng). Người duyệt sửa trong đúng editor bình thường; checklist duyệt (fact, link, metadata) đặt ở sidebar dạng custom field. Câu hỏi 'đã sửa gì so với bản AI' trả lời bằng NATIVE REVISION HISTORY: mỗi lần lưu là một revision, xem diff giữa bản AI gốc và bản cuối — không cần UI diff riêng. Phân vai: AI = Contributor (chỉ tạo draft), người = Editor/Publisher.

- **nguồn**: https://tribulant.com/blog/wordpress/the-new-wordpress-workflow-ai-drafts-human-publishing/ và https://publishpress.com/blog/pending-review-draft/
- **sản phẩm**: WordPress (post status + revisions) trong luồng AI-draft; Jasper cũng gắn status label 'ready for review' trên document và có Pipelines brief→draft→review→publish (https://www.jasper.ai/use-cases/blog-writing)
- **áp cho Grown**: Áp cho M12: bản chưng cất là entity 'nháp' với status enum (nhap → cho_duyet → da_vao_kho), chỉ khi duyệt mới thành bài trong Kho. Lưu bản AI gốc bất biến + bản đang sửa; nút 'xem khác gì bản AI' = diff hai bản, rẻ hơn track-changes từng phím. Đánh đổi: thêm một status enum và một bảng revision vào DB (khớp chỉ đạo bỏ yaml sang DB); nếu chỉ lưu 2 bản (gốc AI + hiện tại) thì mất lịch sử trung gian nhưng đủ cho app một người.

#### Triage/Inbox hai cột: list trái + preview phải + bộ hành động số ít có phím tắt (Linear)

Hàng đợi việc-chờ-xử-lý của Linear là view riêng trong sidebar (G-then-T). Bố cục HAI CỘT: cột trái là list item, cột phải preview đầy đủ; J/K hoặc mũi tên di chuyển, item vào queue tự động từ integration/người ngoài team. Đúng 4 hành động, mỗi cái một phím: Accept (1) — nhận và chuyển vào luồng chính thức; Duplicate (2) — merge vào item có sẵn; Decline (3) — huỷ kèm comment lý do; Snooze (H/Shift+H) — ẩn khỏi queue, tự quay lại khi đến giờ HOẶC khi có hoạt động mới. Có Triage Rules (điều kiện khớp thì tự gán thuộc tính) và AI gợi ý duplicate.

- **nguồn**: https://linear.app/docs/triage và https://linear.app/docs/inbox
- **sản phẩm**: Linear (Triage queue + Inbox)
- **áp cho Grown**: Áp cho trang quản lý TOÀN CỤC của M12 (và M15 tin nhắn vào từ Telegram/Discord): màn 'Hàng đợi' hai cột — trái là list job/nháp (badge trạng thái theo giai đoạn enum, retry count/cap), phải là preview bản chưng cất. Hành động rút về 4: Duyệt vào Kho · Sửa rồi duyệt · Trả lại (chạy lại với ghi chú, tôn trọng retry cap) · Xoá. Đánh đổi: phím tắt 1/2/3/H là đầu tư đáng ngờ cho app một người ít item/ngày — làm nút bấm trước, phím tắt sau; và theo luật 'ba module tách biệt', cần quyết inbox này là MỘT màn chung hay filter theo loại nội dung.

#### Preview-trước-ghi: kết quả AI hiện ở vùng đệm với Replace/Insert/Discard/Try-again (Notion AI)

Notion AI không ghi thẳng vào trang: output hiện trong cửa preview neo tại chỗ con trỏ/vùng chọn, kèm dải hành động: 'Replace selection' (thay vùng chọn), 'Insert below' (chèn dưới, giữ nguyên bản cũ), 'Continue writing', 'Make longer', 'Try again' (sinh lại), Discard (bỏ, không dấu vết). Tài liệu chỉ thay đổi khi người dùng chọn một hành động ghi — mặc định là KHÔNG ghi.

- **nguồn**: https://www.notion.com/help/guides/notion-ai-for-docs (và https://www.notion.com/help/notion-ai-faqs)
- **sản phẩm**: Notion AI
- **áp cho Grown**: Đây là khớp nối giữa mặt (b) ngữ cảnh và mặt (a) quản lý: trong cửa sổ đọc, panel chatbot M14 trả lời kèm trích dẫn hiện ở vùng đệm với 'Lưu thành ghi chú vào Kho · Bỏ · Hỏi lại'; nút 'Chưng cất' M12 thì khác — job chạy phút nên KHÔNG chờ tại chỗ: bấm xong hiện toast 'đang chạy nền, theo dõi ở Hàng đợi' (link thẳng), kết quả về thì badge trên rail trái. Đánh đổi: hai nhịp khác nhau (M14 giây — inline preview; M12 phút — fire-and-track) đòi hai UI khác nhau, đừng ép chung một panel.

#### Settings UI là gương soi của file khai — file là nguồn sự thật, mục phức tạp trỏ 'Edit in settings.json' (VS Code)

Settings editor của VS Code chỉ là UI đọc/ghi lên settings.json — file luôn là nguồn sự thật, sửa file thì UI cập nhật và ngược lại. Setting kiểu phức tạp (object/array như Color Customizations) KHÔNG render form mà hiện link 'Edit in settings.json' mở thẳng file tại đúng khoá. Giá trị khác default có thanh màu dọc bên trái + gear icon để reset về default/copy setting ID; search hỗ trợ filter '@modified' liệt kê mọi giá trị đã đổi; tab User/Workspace tách scope.

- **nguồn**: https://code.visualstudio.com/docs/configure/settings
- **sản phẩm**: Visual Studio Code (Settings editor); Obsidian plugin settings cùng họ pattern (mỗi plugin một settings tab đọc/ghi data.json)
- **áp cho Grown**: Áp cho màn cấu hình 5 dịch vụ Z7 trong trang quản lý: một trang 'Cấu hình' mỗi module (M12..M16) render READ-ONLY từ file/DB khai cấu hình — bảng khoá/giá trị, đánh dấu dòng khác default bằng thanh màu, và thay vì form phức tạp thì một nút 'Sửa ở file <path>' (hoặc mở editor). Rẻ hơn nhiều so với dựng form validation cho từng dịch vụ, và tránh hai nguồn sự thật. Đánh đổi: sửa xong phải reload/xác nhận dịch vụ đã đọc lại config — cần hiện 'giá trị đang chạy' vs 'giá trị trong file' nếu hai cái lệch; lưu ý ví dụ Obsidian là suy từ hiểu biết chung, nguồn dẫn chỉ chống lưng cho VS Code.

#### Job sinh nền không khoá màn: bấm tạo → rời đi tự do → artifact tự xuất hiện trong list (NotebookLM)

Trong NotebookLM, Audio Overview 'generated in the background, so you can generate other artifacts concurrently or even navigate to other screens' — nút tạo không mở modal chặn, không spinner toàn màn; artifact đang sinh chiếm một dòng trạng thái trong list của Studio, xong thì dòng đó thành mở/nghe được. Trước khi sinh có panel nhỏ nhập preference (format Deep Dive/Brief/Critique/Debate, ngôn ngữ, độ dài).

- **nguồn**: https://support.google.com/notebooklm/answer/16212820
- **sản phẩm**: Google NotebookLM (Audio/Video Overview generation)
- **áp cho Grown**: Đây là hợp đồng nối hai mặt UI cho M12/M16: nút ngữ cảnh 'Chưng cất' trong cửa sổ đọc mở popover nhỏ (chọn kiểu output) → tạo job → dòng 'đang chạy: <giai đoạn enum>' xuất hiện ngay trong tab Sản phẩm sinh của tài liệu VÀ trong Hàng đợi toàn cục — cùng một job id, hai chỗ nhìn. Cửa sổ đọc multiwindow của Grown_news hợp pattern này: đóng cửa sổ không giết job. Đánh đổi: cần cơ chế đẩy trạng thái (polling/SSE) để dòng job tự cập nhật; giai đoạn enum của M12 map thẳng vào label tiến trình.

### Góc 2 — câu hỏi mở

- Bản nháp M12 và revision lưu ở đâu — theo chỉ đạo 'bỏ yaml sang DB' (upgrade.md:70, chưa thành FR, chỏi B-C1/FR-028 giữ yaml) thì hợp đồng lưu nháp phải chốt trước khi vẽ màn Hàng đợi; đây là điểm cần FR trước khi code.
- Hàng đợi duyệt là MỘT màn chung cho cả 5 dịch vụ hay phải tách theo loại nội dung (bài viết · tài liệu · video) để tuân luật 'ba module tách biệt ở mọi tầng'? Nếu tách, filter trong một màn có được tính là 'tách' không?
- Diff 'đã tỉa gì so với bản AI' cần đến mức nào: chỉ hai bản (AI gốc vs hiện tại) hay full revision history? App một người có cần audit trail không, hay chỉ cần nút xem-diff?
- Trạng thái job M12 đẩy về UI bằng polling hay SSE — SSR + multiwindow hiện tại có sẵn kênh đẩy nào chưa? Quyết định này chặn cả toast 'xong rồi' lẫn dòng job tự cập nhật.
- M15 (Telegram/Discord) có đổ tin nhắn/nội dung vào cùng Hàng đợi như nháp M12 không, hay cần inbox riêng vì bản chất là kênh vào chứ không phải artifact sinh?
- Cấu hình Z7 hiển thị read-only: khi giá trị trong file lệch giá trị dịch vụ đang chạy (chưa reload), UI hiện cả hai hay bắt reload ngay? Cần hợp đồng 'config đang hiệu lực' từ API của từng dịch vụ.

### Phản biện (12)

| phán quyết | pattern | lý do |
|---|---|---|
| **REFUTED** | 12. Preview-trước-ghi: Replace/Insert/Discard/Try-again (Notion AI) | Nguồn chính notion.com/help/guides/notion-ai-for-docs còn sống nhưng nay mô tả Notion Agent và nói NGƯỢC với headline của pattern: 'Notion AI writes directly on the page' — không còn mô tả cửa preview neo tại con trỏ với dải nút 'Replace selection /  |
| **PLAUSIBLE** | 7. Job card: payload + kết quả + stacktrace tại chỗ (Bull Board) | Repo github.com/felixmosh/bull-board có thật, còn maintain (hỗ trợ BullMQ >=5.56 và v6), đúng là 'Dashboard UI for Bull and BullMQ job queues'. Nhưng cả README lẫn bài oneuptime (có thật, 2026-01) đều KHÔNG viết thành chữ bộ chi tiết job card: data J |
| **PLAUSIBLE** | 8. Attempt counter + thời điểm retry kế tiếp trên timeline (Temporal) | Cả hai nguồn còn sống. Changelog xác nhận: 'See what the current attempt is of a Pending Activity and when the next retry will occur' và filter 'Pending and Failed Events Only' — đúng hai claim lõi. Blog xác nhận 'green for Completed and red for Fail |
| **CONFIRMED** | 1. List run + thanh filter trạng thái (Vercel/GitHub Actions) | Nguồn vercel.com/docs/deployments/managing-deployments còn sống (cập nhật 2026-08-21) và nói đúng: 'Use the dropdowns to search by Branch, Date Range, All Environments, or Status' — đúng dãy dropdown filter pattern mô tả. Chi tiết từng hàng (icon trạ |
| **CONFIRMED** | 2. Trang chi tiết run: timeline step gập/mở + log dính theo step (GitHub Actions) | docs.github.com/.../use-workflow-run-logs còn sống và xác nhận đủ: sidebar trái liệt kê workflow/job, log gập theo step, và nguyên văn 'Any failed steps are automatically expanded to display the results' — đúng cả chi tiết step FAIL tự mở. |
| **CONFIRMED** | 3. Re-run all / Re-run failed jobs (GitHub Actions) | Nguồn còn sống (URL cũ redirect về trang quản lý workflow run hiện hành) và nói nguyên văn: 're-run a workflow run, all failed jobs in a workflow run, or specific jobs in a workflow run up to 30 days after its initial run' — đúng ba mức re-run + hạn  |
| **CONFIRMED** | 4. Deploy summary + log lưu theo id (Netlify/Vercel) | docs.netlify.com/deploy/deploy-overview còn sống, nói nguyên văn: 'You can find a deploy summary on the detail page of any successful deploy, right above the deploy log. It allows you to quickly identify your deploy status and refer to the details in |
| **CONFIRMED** | 5. Instant Rollback — bản cũ bất biến, khôi phục = trỏ lại (Vercel) | vercel.com/docs/deployments/rollback-production-deployment còn sống: 'points production traffic to the deployment you specify without rebuilding. The rollback happens at the routing layer, so it takes effect within seconds' — đúng cơ chế trỏ-lại khôn |
| **CONFIRMED** | 6. Tab theo tập trạng thái: Retries / Scheduled / Dead (Sidekiq Web) | Bài mikeperham.com (tác giả Sidekiq) còn sống và nói nguyên văn: 'These sets represent the Retries, Scheduled and Dead tabs in the Web UI' và 'For Retry, the timestamp is when the job will retry next' — đúng cả chi tiết Retries sắp theo thời điểm ret |
| **CONFIRMED** | 9. Studio panel: hàng tile tạo mới + list artifact bên dưới (NotebookLM) | blog.google còn sống và nói nguyên văn: 'You'll now find four distinct tiles at the top of the Studio panel for creating Audio Overviews, Video Overviews, Mind Maps and Reports', 'All the content you create will appear conveniently in a list below th |
| **CONFIRMED** | 10. Trạng thái nháp ba nấc + revision làm sổ kiểm toán (WordPress AI-draft → human-publish) | Ghép hai nguồn được dẫn thì đủ: publishpress.com xác nhận ba status native Draft → Pending Review → Published ('When a Contributor writes a post, they only have Save Draft and Submit for Review options', Editor/Admin publish). tribulant.com (bài thật |
| **CONFIRMED** | 11. Triage/Inbox hai cột + bộ hành động số ít có phím tắt (Linear) | linear.app/docs/triage còn sống và xác nhận: 'Navigate to Triage with G then T'; đúng 4 hành động có phím tắt — Accept (1), Mark as duplicate (2/MM), Decline (3), Snooze (H); item vào Triage tự động khi 'created through an integration (e.g. Slack, Se |


## Phương pháp ma trận + nối hai mặt

### Góc 1 — khuyến nghị

Ghép 3 tầng, mỗi tầng một pattern đã có tên chuẩn: (1) TẦNG KIỂM ĐẾM — lập ma trận CRUD-style surface × năng lực (8 surface hiện có + 5 trang quản lý mới × M12..M16, ô = Kích hoạt/Xem/Quản lý) để bảo đảm không năng lực nào mồ côi và không surface nào ôm quyền quản lý; (2) TẦNG THIẾT KẾ — mượn CTA Inventory của OOUX/ORCA: mỗi entry point một hàng với cột Location ('nút này sống ở đâu, còn chỗ sáng tạo nào nên đặt thêm?'), đúng câu hỏi hai-mặt của chủ dự án, và phân loại từng entry theo taxonomy GitLab Pajamas (conversational = M14, contextual trigger = M12/M16, automated flow = M15); (3) TẦNG NHẤT QUÁN — 3 component khai một chỗ ('Nút năng lực', 'Chip trạng thái job', 'Nhãn AI sinh') theo nguyên tắc consistency-over-format của Carbon/Cloudscape/GitLab, cắm vào mọi ô của ma trận; cầu nối hai mặt dùng pattern flashbar Cloudscape: bấm ở ngữ cảnh → toast in-progress ở shell (không trong cửa sổ đọc vì multiwindow) → link sang trang quản lý. Vì bộ UI chuẩn G5 là frozen, việc thêm 3 component + file ma trận vào 05_uiux chạm ≥2 module ⇒ đi đường BUILD, mở FR trước nếu đụng file FROZEN; ma trận phải giữ Bài viết · Tài liệu · Video là ba hàng tách biệt theo luật thường trực.

### Góc 1 — patterns (7)

#### CRUD matrix / Activity–Entity matrix (bảng tiến trình × thực thể)

Bảng hai chiều gốc từ enterprise architecture: HÀNG = tiến trình/hoạt động nghiệp vụ, CỘT = thực thể dữ liệu, ô giao = phép toán C/R/U/D được phép. Dùng để phát hiện chức năng mồ côi (cột không ai Create) và màn hình ôm quá nhiều quyền ghi. Biến thể cho UI: hàng = màn hình, cột = năng lực, ô = mức truy cập (xem / kích hoạt / chỉnh sửa). Trình bày dạng bảng phẳng trong tài liệu kiến trúc, mỗi ô một mã chữ cái.

- **nguồn**: https://eapad.dk/ea3-cube/artifacts/information-artifacts/crud-matrix/
- **sản phẩm**: Artifact chuẩn trong khung EA3 Cube và tài liệu kiến trúc PBGC (pbgc.gov Enterprise Architecture Appendices); Software Ideas Modeler có công cụ vẽ CRUD matrix (softwareideas.net/en/features/crud-matrix)
- **áp cho Grown**: Là DẠNG BẢNG nền cho tài liệu 05_uiux: hàng = 8 surface (Dashboard, Tổng hợp, Bài viết, Tài liệu, Video, Kho, Danh mục, cửa sổ đọc) + 5 trang quản lý mới; cột = M12 chưng cất, M13 truy hồi, M14 chatbot, M15 kênh, M16 sinh media; ô = ký hiệu K (kích hoạt job), X (xem trạng thái), Q (quản lý/chỉnh). Đánh đổi: CRUD matrix chỉ nói CÓ/KHÔNG và mức quyền, không nói hình hài UI (nút hay panel) — phải ghép với pattern OOUX bên dưới.

#### OOUX / ORCA — CTA Matrix + CTA Inventory (Sophia Prater)

Phương pháp có tên chuẩn, đúng nhất với bài toán 'năng lực × màn xuất hiện'. ORCA = Objects, Relationships, Calls-to-action, Attributes, quy trình 15 bước. Bước CTA lập hai bảng: (1) CTA Matrix: hàng = object, cột = vai người dùng, ô = hành động vai đó được làm lên object đó — giải quyết luôn bài toán quyền; (2) CTA Inventory: spreadsheet mỗi hàng một CTA, các cột: Purpose (mục tiêu), User type (ai bấm), LOCATION — nguyên văn câu hỏi 'Where will the CTAs live? Where are the obvious places a user will trigger this interaction flow? And are there other creative places we should consider putting it?', Complexity, Priority, Discussion points. Nguyên tắc: 'bàn về cái nút trước khi thiết kế chuyện gì xảy ra khi bấm'.

- **nguồn**: https://alistapart.com/article/ooux-a-foundation-for-interaction-design/ (bài gốc, ví dụ thật app mạng đầu bếp); quy trình ORCA: https://medium.com/design-bootcamp/introducing-orca-the-third-diamond-in-your-ux-process-23a1babb0389
- **sản phẩm**: Ví dụ công khai trong bài A List Apart: app chef network với objects Chef/Recipe/Ingredient; CTA của Ingredient gồm Mark as favorite, Add to shopping list, Follow ingredient... mỗi CTA một hàng spreadsheet với cột Location
- **áp cho Grown**: Áp trực tiếp: objects của Grown_news = Bài viết, Tài liệu, Video (ba module tách biệt mọi tầng), Job chưng cất, Bản nháp, Phiên chat, Kênh. Lập CTA Inventory: hàng 'Chưng cất (M12)' × object Tài liệu → Location = cửa sổ đọc + màn Tài liệu + trang quản lý M12; hàng 'Hỏi chatbot (M14)' × mọi object → Location = cửa sổ đọc + Kho. Cột Location trả lời đúng chỉ đạo hai-mặt; cột Complexity giúp ước lượng M16. Đánh đổi: ORCA đầy đủ 15 bước là nặng — chỉ cần mượn 2 bảng CTA, bỏ phần noun foraging vì object đã chốt.

#### Service Blueprint (NN/g) — năng lực × touchpoint × tầng hậu trường

Sơ đồ nhiều làn ngang: hàng trên = hành động người dùng theo thời gian, các hàng dưới = frontstage (UI thấy được), backstage (dịch vụ nền), support processes; cột = touchpoint/kênh. Khác CRUD matrix ở chỗ có trục thời gian và tầng hậu trường — hợp khi một năng lực chạy JOB NỀN nhiều phút: làn backstage vẽ queue/retry, làn frontstage vẽ chỗ nào hiện trạng thái. NN/g: dùng cho trải nghiệm 'omnichannel, involve multiple touchpoints'.

- **nguồn**: https://www.nngroup.com/articles/service-blueprints-definition/
- **sản phẩm**: Template và ví dụ số hoá công khai của NN/g: https://www.nngroup.com/articles/service-blueprinting-template/
- **áp cho Grown**: Hợp nhất cho M12 (job nền chạy phút, giai đoạn enum, retry cap) và M15 (Telegram/Discord là kênh ngoài web — đúng nghĩa omnichannel): một blueprint cho luồng 'bấm Chưng cất ở cửa sổ đọc → job queue → retry → bản nháp → duyệt ở trang quản lý', làn backstage là 5 dịch vụ Z7 không có UI riêng. Đánh đổi: blueprint là sơ đồ theo LUỒNG, không phải bảng tổng quát toàn hệ — dùng bổ sung cho từng luồng phức tạp, không thay ma trận.

#### Ba loại entry point AI của GitLab Pajamas: conversational / contextual trigger / automated flow

GitLab Pajamas phân loại chính thức cách một năng lực AI xuất hiện: (1) Conversational — chat panel riêng, đa lượt (pattern 'GitLab Duo Chat Interface'); (2) Contextual triggers — AI gọi qua @ mention, assignment, hoặc NÚT NGỮ CẢNH đặt tại chỗ đang làm việc; (3) Automated flows — chuỗi bước tự chạy, ít can thiệp. Kèm luật bắt buộc: nội dung AI phải có nhãn 'Generated by AI' đặt NGAY DƯỚI nội dung + lời nhắc verify; nút gọi AI dùng icon AI riêng để người dùng biết trước khi bấm. Đây chính là khung 'hai mặt': mặt conversational/quản lý và mặt contextual len vào màn làm việc.

- **nguồn**: https://design.gitlab.com/patterns/ai-human-interaction/
- **sản phẩm**: GitLab Duo: Duo Chat là panel riêng, đồng thời có contextual button/@ mention trong issue và merge request
- **áp cho Grown**: Dùng làm taxonomy cho cả 5 module: M14 chatbot = conversational (panel trong cửa sổ đọc + trang chat riêng); M12/M16 = contextual trigger (nút 'Chưng cất'/'Sinh slide' trên bài đang đọc) nối sang automated flow (job nền); M15 = automated flow thuần. Áp luôn luật nhãn: bản chưng cất M12 và trích dẫn M14 phải mang nhãn 'AI sinh' + nút kiểm chứng về nguồn gốc. Đánh đổi: Pajamas tự ghi 'Documented patterns are in development' — mượn taxonomy và luật nhãn, không mượn được spec pixel.

#### One component, many entry points — component AI dùng chung + governance (IBM Carbon for AI và đồng thuận 4 design system)

Khi một năng lực xuất hiện ở N chỗ, các design system lớn hội tụ về: MỘT component khai một chỗ, cắm nhiều chỗ. IBM Carbon có 'AI label' (slug) — một component duy nhất gắn lên mọi field/vùng do AI sinh khắp sản phẩm; Cloudscape dành riêng sparkle icon + nhãn 'Generated by AI'; GitLab dùng bộ icon AI riêng cho mọi CTA gọi Duo. Bài tổng hợp designproject.io kết luận: các hệ thống ưu tiên 'consistency over format' — chat hay inline không quan trọng bằng 'shared product infrastructure' để các team không tự chế 4 kiểu. Governance: mọi thay đổi component đi qua quy trình đề xuất/duyệt/version một cửa.

- **nguồn**: https://designproject.io/blog/ai-design-system-patterns/ (đối chiếu IBM Carbon, AWS Cloudscape, Atlassian, GitLab); governance: https://www.netguru.com/blog/design-system-governance
- **sản phẩm**: IBM Carbon for AI (AI label/slug dùng khắp watsonx và sản phẩm IBM), AWS Cloudscape (generative AI patterns trong AWS Console), Atlassian Intelligence (generative border khi đang sinh)
- **áp cho Grown**: Grown_news cần đúng 3 component khai MỘT chỗ trong 05_uiux/tokens + bộ UI chuẩn (frozen theo G5): (1) 'Nút năng lực' — một button component nhận prop capability (M12/M14/M16), tự mang icon + nhãn AI, cắm vào cửa sổ đọc, hàng danh sách, Kho; (2) 'Chip trạng thái job' — hiện giai đoạn enum của M12/M16, dùng cả ở ngữ cảnh lẫn trang quản lý; (3) 'Nhãn AI sinh' gắn mọi output. Đánh đổi: thêm chi phí trừu tượng hoá ban đầu; nhưng với 5 năng lực × 8 surface thì tự chế từng chỗ chắc chắn phân mảnh — và mỗi lần sửa phải qua FR vì bộ UI chuẩn là frozen.

#### Cầu nối ngữ cảnh → trang quản lý: notification in-progress có link tới trang chi tiết (Cloudscape Flashbar / feedback mechanisms)

Pattern nối hai mặt UI: bấm hành động dài hạn tại chỗ → KHÔNG chặn màn hình — hiện notification (flashbar) ở đỉnh trang với spinner (thời lượng không đo được) hoặc progress bar (đo được), kèm LINK sang trang chi tiết/danh sách job để theo dõi tiếp; xong việc thì notification chuyển success kèm link tới kết quả. Cloudscape quy định rõ: in-progress dùng spinner/progress trong flashbar, chi tiết từng bước mở qua popover/link/expandable section. Người dùng tiếp tục đọc, trang quản lý là chỗ 'đổ về' của mọi job.

- **nguồn**: https://cloudscape.design/components/flashbar/ và https://cloudscape.design/patterns/general/user-feedback/
- **sản phẩm**: AWS Console (Cloudscape là design system của chính AWS Console): tạo resource/job dài hạn → flashbar in-progress → link sang trang chi tiết resource; GitHub Actions cũng cùng cấu trúc (nút Re-run trong PR → theo dõi ở tab Actions)
- **áp cho Grown**: Đúng lời chủ dự án 'bấm ở ngữ cảnh → theo dõi ở trang quản lý': bấm 'Chưng cất' (M12) hoặc 'Sinh slide' (M16) trong cửa sổ đọc → toast/flashbar 'Đã xếp hàng — Xem hàng đợi' link tới trang quản lý M12/M16; job xong → toast success link thẳng bản nháp. Với multiwindow của Grown_news, đặt flashbar ở shell ngoài (rail/khung chính), không đặt trong cửa sổ đọc — cửa sổ có thể bị đóng trước khi job xong. Đánh đổi: cần một notification center tối thiểu ở shell; ví dụ GitHub Actions là quan sát sản phẩm thật chưa có tài liệu design chính thức kèm theo.

#### Cách trình bày ma trận trong design doc thật: spreadsheet cột Location + template Figma/Miro công khai

Hai dạng trình bày công khai tìm được: (1) Google Spreadsheet như bài A List Apart — mỗi CTA một hàng, cột Purpose/User/Location/Complexity/Priority/Discussion, tức ma trận capability×surface duỗi phẳng thành danh sách có cột 'sống ở đâu' (dễ chuyển thẳng thành bảng markdown trong repo); (2) template cộng đồng: ORCA Object Map Template và widget Nested Object Matrix trên Figma Community, bản Miroverse — object map dạng lưới thẻ màu (object / CTA / attribute mỗi loại một màu). Không tìm thấy design doc sản phẩm lớn công khai trình bày nguyên bảng capability×screen — các hãng công bố pattern library (Pajamas, Cloudscape) chứ không công bố ma trận nội bộ.

- **nguồn**: https://alistapart.com/article/ooux-a-foundation-for-interaction-design/ (ảnh spreadsheet thật); https://www.figma.com/community/file/1184428250626254821/orca-object-map-template-ooux ; https://miro.com/miroverse/object-oriented-ux-ooux/
- **sản phẩm**: Spreadsheet CTA Inventory của Rewired (Sophia Prater) trong bài A List Apart; widget OOUX NOM trên Figma Community (figma.com/community/widget/1495496068112929366)
- **áp cho Grown**: Grown_news là repo tài-liệu-trước nên chọn dạng (1): một file markdown trong 05_uiux (vd capability_surface_matrix.md) — bảng 1: ma trận surface × M12..M16 kiểu CRUD (ô = K/X/Q); bảng 2: CTA inventory duỗi phẳng, mỗi entry point một hàng với cột Vị trí đặt / Ai bấm / Trạng thái hiện / Link sang trang quản lý nào. Nhớ luật ba module: hàng Bài viết, Tài liệu, Video tách riêng, không gộp. Đánh đổi: bảng markdown khó vẽ quan hệ — luồng phức tạp (M12) vẽ thêm mermaid trong spec module.

### Góc 1 — câu hỏi mở

- Trang quản lý là 5 trang riêng (mỗi module M12..M16 một trang) hay 1 trung tâm job hợp nhất có filter theo module? Cloudscape/GitHub nghiêng về trung tâm hợp nhất, nhưng M14 (chat) và M15 (kênh) không phải job — quản lý cấu hình khác quản lý hàng đợi.
- Chatbot M14 ở cửa sổ đọc: panel dock trong chính cửa sổ đọc (context = bài đang đọc) hay một cửa sổ nổi riêng trong hệ multiwindow? Ảnh hưởng contract truyền context bài → phiên chat.
- Toast/flashbar đặt ở shell: người dùng đóng tab/trình duyệt giữa chừng thì trạng thái job hồi lại thế nào khi quay lại — cần notification center persist (đọc từ DB job M12) hay chỉ toast phù du?
- Nhãn 'AI sinh' có áp cho bài chưng cất M12 đã được người DUYỆT qua trang quản lý không, hay duyệt xong thì gỡ nhãn? GitLab yêu cầu nhãn + verify trước khi dùng, nhưng chưa nói sau khi người đã duyệt.
- Ma trận capability×surface nên sống ở 05_uiux (tài liệu UI) hay project_map.yaml (nguồn sự thật cấu trúc)? Nếu hai nơi thì vi phạm 'trỏ con trỏ, đừng chép' — cần chốt nơi khai gốc trước khi viết.

### Góc 2 — khuyến nghị

Xương sống nối hai mặt nên là MỘT hợp đồng chung cho cả 5 module, không thiết kế lẻ từng module: (1) mỗi hành động ngữ cảnh sinh job id ngay lập tức, trạng thái sống trong DB (durable, không in-memory) và phơi qua một endpoint trạng thái duy nhất — cả panel ngữ cảnh, tray, badge, trang quản lý đều đọc từ đó; (2) hai loại deep-link bắt buộc, đối xứng: ngữ cảnh→console (link 'Chi tiết' mở trang quản lý lọc sẵn ?job=xxx) và console→ngữ cảnh (cột 'Nguồn' mở tài liệu trong cửa sổ đọc nổi ?open=doc-id — tận dụng multiwindow sẵn có, đây là lợi thế của Grown_news mà GitHub/Slack không có: mở nguồn không mất chỗ đứng); (3) phân tầng thông báo theo Carbon/NN/g: đang ở màn liên quan → inline status tự đổi, không toast; ở màn khác → toast có nút 'Xem' (bền tới khi bấm, 1 action); rời máy/quay lại sau → badge đếm trên đúng MỘT mục nav 'Xưởng' + tray liệt kê job. Với quy mô kho cá nhân, khuyên làm đợt đầu: inline status + toast + tray góc màn + hai chiều deep-link; HOÃN notification center (chống notification-blind bằng cách gộp toast khi ≥2 job xong gần nhau thay vì xây center). Ranh giới nội dung: panel ngữ cảnh chỉ giữ tóm tắt trạng thái + 1 hành động + link; chỉnh nháp, log, lịch sử, cấu hình, retry cap đều ở trang quản lý. Riêng M14 chatbot đi pattern khác các job module: panel chat là loại cửa sổ nổi thứ hai kiểu Obsidian, nhận ngữ cảnh tài liệu active và selected text, trích dẫn bấm được nhảy về đoạn nguồn — cần viết luật focus/z-order giữa cửa sổ đọc, panel chat và tray thành spec M03_web trước khi code.

### Góc 2 — patterns (9)

#### Kick off tại ngữ cảnh → deep-link sang console (kiểu GitHub PR checks)

Nút hành động nằm ngay trong ngữ cảnh (tab Checks của PR có nút 'Re-run jobs' / 'Re-run all jobs' chạy lại trên commit hiện tại, không cần rời PR). Mỗi check trong PR là một dòng có link 'Details' deep-link thẳng sang trang run trong Actions — nơi có log đầy đủ, lịch sử run, nút re-run khác. Trạng thái (queued/running/success/failed) hiện ngược lại NGAY trong PR dưới dạng dòng check có icon màu, không bắt người dùng sang Actions mới biết kết quả. Nghĩa là: ngữ cảnh giữ TÓM TẮT trạng thái + link chi tiết; console giữ log/lịch sử/cấu hình.

- **nguồn**: https://graphite.com/guides/github-rerun-pr-checks và https://docs.github.com/en/actions/managing-workflow-runs/using-workflow-run-logs
- **sản phẩm**: GitHub Pull Request ↔ GitHub Actions
- **áp cho Grown**: M12 chưng cất: trong cửa sổ đọc tài liệu, panel 'Chưng cất' hiện dòng trạng thái job (giai đoạn enum + icon màu) ngay tại chỗ, kèm link 'Chi tiết' deep-link sang trang quản lý M12 đã lọc sẵn theo job id (?job=xxx). Ngược lại mỗi dòng job ở trang quản lý có link mở lại tài liệu nguồn trong cửa sổ đọc. Đánh đổi: phải có job id + endpoint trạng thái ổn định để hai màn cùng đọc một nguồn sự thật; SSR cần polling hoặc SSE cho dòng trạng thái trong cửa sổ đọc.

#### Bot trả kết quả về đúng ngữ cảnh nguồn (kiểu Vercel preview comment)

Job chạy nơi khác (build ở Vercel) nhưng kết quả được ĐẨY NGƯỢC về ngữ cảnh phát sinh: bot comment vào PR với trạng thái 'ready' + nút 'Visit Preview' mở thẳng artifact (URL preview); đồng thời commit status/Deployment Check hiện trong PR, còn log đầy đủ nằm ở Vercel dashboard. Người dùng không phải rời PR để lấy kết quả — chỉ rời khi cần debug. Có setting tắt comment để chống ồn.

- **nguồn**: https://vercel.com/docs/git/vercel-for-github và https://vercel.com/docs/comments
- **sản phẩm**: Vercel for GitHub (bot comment preview trên PR)
- **áp cho Grown**: M12/M16: job xong thì artifact (bản chưng cất, slide, audio) tự chèn thành mục mới trong section 'Sản phẩm phát sinh' NGAY trong cửa sổ đọc của tài liệu nguồn — bấm mở xem/sửa nháp; trang quản lý chỉ để xem log, retry, cấu hình. Đánh đổi: cần quan hệ artifact→source_doc trong DB để render section này khi SSR; nếu người dùng đã đóng cửa sổ đọc thì pattern này phải đi kèm toast/badge (pattern 3, 4).

#### Toast có nút hành động — bền tới khi bấm, một action, tối đa 3 dòng

Toast trượt vào góc màn hình khi job nền xong lúc người dùng đang ở màn khác. Luật từ các design guideline: toast thường tự tắt ~5s, NHƯNG nếu có nút hành động ('Xem') thì phải Ở LẠI tới khi người dùng bấm hoặc đóng; chỉ MỘT action, nhãn ≤2 từ; nội dung ≤3 dòng; toast dành cho thông điệp không gắn với section cụ thể đang hiển thị — nếu gắn với section đang hiển thị thì dùng inline notification đặt cạnh phần tử liên quan.

- **nguồn**: https://blog.logrocket.com/ux-design/toast-notifications/ và https://www.canva.dev/docs/apps/design-guidelines/toasts/ và https://carbondesignsystem.com/patterns/notification-pattern/
- **sản phẩm**: Canva Apps (design guideline chính thức), IBM Carbon Design System
- **áp cho Grown**: Mọi module có job nền (M12, M16): job xong khi người dùng đang ở Dashboard/Bài viết → toast góc phải-dưới 'Chưng cất xong: <tên tài liệu>' + nút 'Xem' mở cửa sổ đọc bản nháp; toast có nút thì không tự tắt. Nếu người dùng đang đứng NGAY màn quản lý M12 thì không toast — dòng job tự đổi trạng thái (inline). Đánh đổi: cần một toast-manager toàn cục xếp chồng và gộp (N job xong liên tiếp → 1 toast 'N việc xong' để khỏi spam).

#### Badge chỉ báo trên nav + Notification center (phân tầng theo NN/g và Carbon)

Phân ba tầng giao tiếp: (1) indicator — tín hiệu im lặng, chấm đỏ/số đếm trên icon nav, không ngắt việc, đặt NGAY TRÊN phần tử liên quan để chỉ chỗ; (2) notification — ngắt nhẹ (toast); (3) notification center — chỗ xem lại và hành động trên các thông báo đã qua, Carbon khuyên có khi hệ thống sinh nhiều thông báo. Chống overload: không chồng nhiều indicator, thông báo kém chất lượng gây 'notification-blind' — người dùng lờ hết. Nghiên cứu cho thấy badge tăng mạnh lượt bấm vào mục có badge.

- **nguồn**: https://www.nngroup.com/articles/indicators-validations-notifications/ và https://carbondesignsystem.com/patterns/notification-pattern/
- **sản phẩm**: Chuẩn hoá trong NN/g và IBM Carbon; badge kiểu icon app mobile, GitHub notifications
- **áp cho Grown**: Sidebar rail trái: mục nav của trang quản lý (vd 'Xưởng' gom M12/M16) mang badge số đếm job vừa xong-chưa-xem; bấm vào trang quản lý thì badge clear. Chỉ badge MỘT mục nav, không rải chấm đỏ khắp rail. Notification center chỉ nên làm khi thực tế nhiều hơn ~vài thông báo/ngày — với kho cá nhân một người dùng, badge + toast có thể đủ, center là YAGNI đợt đầu. Đánh đổi: cần bảng 'đã xem/chưa xem' per-job trong DB.

#### Trang quản lý job theo vòng đời 6 trạng thái + tóm tắt lỗi từng phần

Console job phơi đủ 6 trạng thái: queued (kèm vị trí hàng đợi + giờ dự kiến chạy) · running (tiến độ cụ thể '124/500 dòng', không spinner chung chung) · success (đếm số mục đã xử lý) · canceled (tóm tắt phần đã làm) · failed (lý do + hướng xử lý) · retry (hiện số lần thử + timestamp). Lỗi từng phần tóm tắt kiểu '20 thành công, 3 lỗi, 5 bỏ qua' + nút 'retry chỉ phần lỗi'. Trạng thái phải nằm trong durable store (DB), không chỉ trong memory, vì worker crash / người dùng refresh. Fivetran vẽ timeline các lần sync theo phase extract/load; Datadog vẽ graph node màu theo bước.

- **nguồn**: https://blog.logrocket.com/ux-design/ui-patterns-for-async-workflows-background-jobs-and-data-pipelines/ và https://appmaster.io/blog/background-tasks-progress-ui
- **sản phẩm**: Fivetran (job timeline), Datadog (workflow graph)
- **áp cho Grown**: Chính là khung cho trang quản lý M12 (job chạy phút, giai đoạn enum, retry cap — khớp hoàn hảo: mỗi giai đoạn enum thành một cột trạng thái, retry cap hiện 'lần 2/3'). Microcopy tiếng Việt cụ thể: 'Đang trích ý chính (bước 3/6)' thay vì 'Đang xử lý...'. M16 dùng chung khung bảng, khác cột artifact. Đánh đổi: enum giai đoạn phải ổn định thành hợp đồng API — đổi enum là đổi UI.

#### Tray tiến độ tối thiểu hoá ở góc màn (kiểu Google Drive upload / Chrome downloads)

Panel nhỏ neo góc màn hình, sống XUYÊN các lần điều hướng trong app: liệt kê từng job đang chạy với progress riêng, thu gọn được thành một thanh/icon, bấm từng dòng mở thẳng kết quả. Google Drive đang chuyển sang progress bar có % + tổng dung lượng, neo đáy màn để 'liếc là thấy'; Chrome chuyển downloads bar đáy màn thành tray góc phải-trên. Khác toast: tray theo dõi LIÊN TỤC lúc đang chạy, toast báo MỘT LẦN lúc xong.

- **nguồn**: https://www.androidauthority.com/google-drive-uploads-3475983/ và https://tech.yahoo.com/general/articles/chrome-got-rid-downloads-bar-000636953.html
- **sản phẩm**: Google Drive (upload tray), Chrome (downloads tray)
- **áp cho Grown**: Phù hợp M12/M16 vì job 'chạy phút' — đủ lâu để người dùng muốn liếc tiến độ nhưng vẫn làm việc khác: tray góc phải-dưới liệt kê job đang chạy (tên tài liệu + giai đoạn), thu gọn thành chip đếm; job xong thì dòng đổi thành nút 'Mở'. Tray này CHÍNH LÀ cầu nối hai mặt: header tray có link 'Tất cả job →' sang trang quản lý. Đánh đổi: thêm một vùng UI toàn cục cạnh multiwindow — phải quy ước z-index/vị trí để không đè cửa sổ đọc nổi; nếu làm tray thì toast chỉ dùng khi tray đang thu gọn.

#### Hai chiều ngữ cảnh ↔ danh sách quản lý với link ngược về nguồn (kiểu Slack Remind/Later)

Slack: hover một message → menu '...' → 'Remind me about this' — kick off ngay tại ngữ cảnh, không rời cuộc hội thoại. Mọi reminder/saved item sống trong tab 'Later' ở sidebar (trang quản lý), chia 3 tab (In progress/Archived/Completed); mấu chốt là MỖI mục trong Later giữ link ngược nhảy về message gốc trong đúng conversation — hai mặt nối nhau bằng con trỏ hai chiều, và khi reminder nổ, notification cũng link về message gốc kèm ngữ cảnh.

- **nguồn**: https://slack.com/help/articles/208423427-Set-a-reminder và https://slack.com/help/articles/360042650274-Save-messages-and-files-for-later
- **sản phẩm**: Slack (Remind me about this / tab Later)
- **áp cho Grown**: Mẫu cho quy tắc chung mọi module M12–M16: mỗi bản ghi ở trang quản lý (job, câu hỏi chatbot đã lưu, tin đã đẩy Telegram) PHẢI có cột 'Nguồn' mở lại đúng tài liệu/bài viết trong cửa sổ đọc — tận dụng multiwindow: bấm từ trang quản lý mở cửa sổ đọc nổi đè lên, không mất chỗ đứng ở console. Đánh đổi: cần URL scheme cho cửa sổ đọc (?open=<doc-id>) để deep-link mở được cửa sổ nổi từ bất kỳ màn nào.

#### Panel chat/hành động ngữ cảnh trong app đa pane (kiểu Obsidian sidebar panel)

Hệ sinh thái Obsidian chuẩn hoá pattern: panel chat AI sống ở sidebar phải, ĐỌC ĐƯỢC ngữ cảnh pane đang mở — gửi selected text/note đang active vào prompt, lưu câu trả lời ngược vào note (OmniChat 'send selected text, inject vault context, save responses back'), mỗi panel giữ thread + draft riêng (Codex Panel). Forum Obsidian có nhu cầu rõ: 'chat sidebar that works with selected text/note, like Cursor IDE but for notes'. Panel là view ngang hàng với các pane nội dung, dock/undock được, không phải modal.

- **nguồn**: https://forum.obsidian.md/t/looking-for-a-plugin-chat-sidebar-that-works-with-selected-text-note-like-cursor-ide-but-for-notes/102401 và https://github.com/murashit/codex-panel
- **sản phẩm**: Obsidian (Claude Panel, Codex Panel, Cortex Chat, OmniChat)
- **áp cho Grown**: M14 chatbot: panel chat là một loại 'cửa sổ nổi' thứ hai trong hệ multiwindow sẵn có của Grown_news, neo phải, tự nhận ngữ cảnh = tài liệu đang mở trong cửa sổ đọc trên cùng ('Hỏi về bài này'); chọn đoạn text trong cửa sổ đọc → nút 'Hỏi về đoạn này' bơm quote vào chat; trích dẫn trong câu trả lời bấm được → nhảy/highlight đúng đoạn trong cửa sổ đọc. Trang quản lý M14 giữ lịch sử hội thoại, mỗi hội thoại link ngược tài liệu nguồn. Đánh đổi: panel + cửa sổ đọc + tray cùng nổi đòi hỏi luật quản lý focus/z-order thành spec riêng; state 'tài liệu đang active' phải là khái niệm hạng nhất trong FE.

#### Trạng thái tóm tắt hiện tại chỗ, KHÔNG bắt sang console mới biết sống chết **[giả định]**

Nguyên tắc rút từ GitHub checks + Carbon inline notification: khi kết quả job liên quan tới phần tử đang hiển thị, dùng inline notification/status đặt CẠNH phần tử đó (bền tới khi dismiss), không toast, không bắt điều hướng. Ngữ cảnh luôn trả lời được 3 câu: đang chạy không · tới đâu · xong thì cái gì ở đâu — còn log, lịch sử, cấu hình, retry hàng loạt mới thuộc console.

- **nguồn**: https://carbondesignsystem.com/components/notification/usage/ và https://docs.github.com/en/actions/managing-workflow-runs/using-workflow-run-logs
- **sản phẩm**: IBM Carbon (inline notification), GitHub (check row trong PR)
- **áp cho Grown**: Quy tắc phân giới cho MỌI panel ngữ cảnh M12–M16 (đây là câu trả lời cho 'nối hai mặt thế nào'): panel ngữ cảnh trong cửa sổ đọc = trạng thái tóm tắt + 1 hành động chính + 1 link 'Chi tiết' sang trang quản lý đã lọc theo đối tượng hiện tại; trang quản lý = mọi thứ còn lại. Không nhét chỉnh sửa nháp/log vào cửa sổ đọc. Đánh đổi: đôi khi người dùng muốn sửa nháp ngay tại chỗ — chấp nhận một bước nhảy có deep-link thay vì phình panel; việc chia đúng ranh giới cho từng module là quyết định per-module, không tự động.

### Góc 2 — câu hỏi mở

- Cửa sổ đọc của Grown_news là DOM nổi trong một tab SSR hay window trình duyệt riêng? Nếu là DOM nổi thì tray/toast/panel chat chỉ cần z-order; nếu là window riêng thì cần cơ chế thông điệp liên-cửa-sổ (BroadcastChannel) để toast 'Xem' mở đúng cửa sổ — quyết định này đổi hẳn kiến trúc nối hai mặt.
- Cập nhật trạng thái job trong panel ngữ cảnh dùng polling hay SSE/WebSocket? Job 'chạy phút' thì polling 5-10s có thể đủ và hợp SSR, nhưng cần chốt để viết hợp đồng M08_api.
- Trang quản lý là MỘT màn 'Xưởng' gom job của cả M12+M16 (một hàng đợi, cột 'loại') hay mỗi module một trang? Luật 'ba module tách biệt mọi tầng' trong memory áp cho bài viết·tài liệu·video — có áp cho job console không, hay job console được coi như 'Kho/Tổng hợp' được phép gộp?
- M15 (Telegram/Discord) có mặt ngữ cảnh không, hay chỉ có trang quản lý cấu hình kênh + lịch sử đẩy tin? Chiều ngược 'tin nhắn Telegram deep-link về bài trong web' có nằm trong scope đợt này không?
- Badge 'chưa xem' clear theo sự kiện nào: vào trang quản lý, hay mở từng kết quả? Cần chốt để thiết kế bảng seen/unseen trong DB.
- Người dùng có cần hủy (cancel) job M12 đang chạy từ panel ngữ cảnh không, hay cancel chỉ ở trang quản lý? Ảnh hưởng tới độ phức tạp của panel và tính idempotent của worker.

### Phản biện (12)

| phán quyết | pattern | lý do |
|---|---|---|
| **PLAUSIBLE** | 6. Cầu nối ngữ cảnh → trang quản lý: Cloudscape Flashbar / user feedback | Hai nguồn còn sống. cloudscape.design/patterns/general/user-feedback/ xác nhận phần lõi: thao tác >10s thì 'Allow the user to perform other tasks... while the operation is in progress', spinner cho thời lượng không đo được, progress bar cho đo được,  |
| **PLAUSIBLE** | 11. Badge trên nav + Notification center (NN/g + Carbon) | Hai tầng đầu xác nhận chắc: NN/g indicators-validations-notifications còn sống, indicators là tín hiệu passive gắn trên phần tử liên quan, không bắt hành động; notifications là 'general occurrences', chia action-required/passive. Carbon xác nhận badg |
| **CONFIRMED** | 1. CRUD matrix / Activity–Entity matrix | eapad.dk còn sống, xác nhận đúng: artifact D-6 'Activity/Entity Matrix' trong khung EA3 Cube, 'often called a CRUD matrix', map hoạt động nghiệp vụ × thực thể dữ liệu với phép C/R/U/D. softwareideas.net/en/features/crud-matrix còn sống, đúng là công  |
| **CONFIRMED** | 2. OOUX / ORCA — CTA Matrix + CTA Inventory (Sophia Prater) | Bài A List Apart của Sophia V. Prater còn sống và khớp chi tiết: app mạng đầu bếp với objects Chef/Recipe/Ingredient; CTA của Ingredient có nguyên văn 'Mark the ingredient as a favorite', 'Add the ingredient to a shopping list', 'Follow the ingredien |
| **CONFIRMED** | 3. Service Blueprint (NN/g) | nngroup.com/articles/service-blueprints-definition/ còn sống, xác nhận đủ các làn: Customer Actions / Frontstage / Backstage / (Support) Processes, gắn với touchpoints và hành trình khách hàng. Lưu ý: trục thời gian đúng là bản chất (hành động xếp th |
| **CONFIRMED** | 4. Ba loại entry point AI của GitLab Pajamas | design.gitlab.com/patterns/ai-human-interaction/ còn sống và nói GẦN NGUYÊN VĂN điều pattern mô tả, mục 'Interaction Type': 'Conversational: Direct chat-based interactions with agents...', 'Contextual triggers: AI invoked through @ mentions, assignme |
| **CONFIRMED** | 5. One component, many entry points (IBM Carbon for AI + 4 design system) | designproject.io/blog/ai-design-system-patterns/ còn sống, đúng là đối chiếu IBM Carbon / AWS Cloudscape / Atlassian / GitLab; xác nhận từng fact: Carbon dùng AI label khắp trải nghiệm, Cloudscape dành riêng sparkle icon + nhãn 'Generated by AI' cho  |
| **CONFIRMED** | 7. Spreadsheet cột Location + template Figma/Miro | Spreadsheet trong bài A List Apart xác nhận có đúng các cột Why/Who/Where(Location)/Complexity/Priority/Discussion — tức ma trận duỗi phẳng thành danh sách có cột 'sống ở đâu'. Miro Miroverse 'Object-Oriented UX (OOUX)' của Geoffrey Crofte còn sống.  |
| **CONFIRMED** | 8. Kick off tại ngữ cảnh → deep-link sang console (GitHub PR checks) | graphite.com/guides/github-rerun-pr-checks còn sống, xác nhận nguyên văn: tab Checks của PR → 'Re-run jobs' / 'Re-run all jobs', chạy lại trên commit hiện tại không cần push code mới. Vế 'Details' deep-link: docs GitHub chính thức (status-checks + tr |
| **CONFIRMED** | 9. Bot trả kết quả về đúng ngữ cảnh nguồn (Vercel preview comment) | vercel.com/docs/git/vercel-for-github còn sống (cập nhật 2026-08-11), xác nhận: preview URL 'will be provided through a comment on each pull request', commit status cho từng project ('indicates whether the commit successfully deployed or failed'), dù |
| **CONFIRMED** | 10. Toast có nút hành động — bền tới khi bấm, một action | Các luật lõi có nguồn nhưng KHÔNG phải từ cả ba nguồn được trích. IBM Carbon (notification usage/pattern) nói gần nguyên văn: 'If the toast includes an action button, then the notification should remain on screen until the user dismisses it' và 'Only |
| **CONFIRMED** | 12. Trang quản lý job 6 trạng thái + tóm tắt lỗi từng phần | blog.logrocket.com/ux-design/ui-patterns-for-async-workflows-background-jobs-and-data-pipelines/ còn sống và khớp chi tiết bất ngờ: queued kèm số job phía trước + estimated start time; running hiện '124 of 500 rows processed' thay vì spinner chung ch |
