---
name: source-distiller
description: Phân tích bất kỳ nguồn kỹ thuật nào — repo GitHub, bài báo khoa học, video talk, blog kỹ thuật, tài liệu sản phẩm, release note — theo giao thức 6 pass có cổng chặn, kiểm chứng độ tin cậy, chắt lọc tinh túy có bằng chứng, rồi xuất ra knowledge card và skill candidate ở định dạng JSON/Markdown cố định. Dùng skill này bất cứ khi nào người dùng dán một link kỹ thuật, khoa học hoặc AI vào, hoặc nhắc tới "phân tích repo", "tóm tắt bài báo này", "video này nói gì", "học cái này", "trích xuất tinh túy", "nên bổ sung skill gì cho agent" — kể cả khi họ chỉ dán link trần không nói gì thêm.
---

# Source Distiller

Phân tích một nguồn kỹ thuật là bài toán **chống pha loãng ngữ cảnh**, không phải bài toán tóm tắt.

Đọc tuyến tính rồi tóm tắt sẽ cho ra output bị chi phối bởi thứ xuất hiện nhiều nhất — phần mở đầu, boilerplate, đoạn dẫn nhập — chứ không phải thứ có giá trị nhất. Giao thức dưới đây ép nén lại ở mỗi bậc, và ép mọi kết luận phải neo vào một địa chỉ cụ thể.

Skill này thay thế `repo-distiller`. Repo giờ là một trong sáu loại nguồn.

## Khác biệt nền giữa code và các nguồn còn lại

Code **tự làm bằng chứng cho chính nó**. Đọc `retry.py:44` là thấy sự thật.

Bài viết, video, bài báo là **lời khẳng định về** một sự thật nằm ở nơi khác. Với chúng, thứ tác giả gọi là bằng chứng chính là thứ cần thẩm định. Đó là lý do có Pass 3.5 — chỉ chạy cho nguồn không phải code.

## Luật nền

**L1 — Không nhảy pass.** Pass sau chỉ bắt đầu khi artifact của pass trước đã viết ra. Mỗi artifact là một lần nén; bỏ một pass là mất một bậc nén.

**L2 — Mọi khẳng định phải có địa chỉ.** Định dạng đổi theo loại nguồn — `file.py:44-71`, `12:04–13:30`, `§4.2 Bảng 3`, `#anchor ¶3`. Xem `references/source-types.md`. Không có địa chỉ thì gắn tiền tố `[suy đoán]`.

**L3 — Không viết lại phần tóm tắt có sẵn.** Nếu một câu viết được chỉ bằng cách đọc README, abstract, hoặc đoạn mở đầu, xóa nó. Người đọc đã có sẵn phần đó.

**L4 — Cấm từ rỗng.** Không dùng: "được tổ chức tốt", "kiến trúc sạch", "công nghệ hiện đại", "góc nhìn sâu sắc", "rất đáng đọc", "best practice". Chúng đúng với mọi nguồn nên không mang thông tin.

**L5 — Không biết là câu trả lời hợp lệ.** Ghi `[chưa xác định]` kèm việc cần làm để xác định.

**L6 — Ngân sách đọc.** Không quá 40% cửa sổ ngữ cảnh cho nội dung thô. Chạm ngưỡng thì nén artifact hiện tại rồi xả phần thô.

**L7 — Đếm trước khi liệt kê.** Trần cứng ở mọi danh sách. Trục khái niệm tối đa 7, khối cấu trúc tối đa 12, tinh túy tối đa 5. Trần ép xếp hạng; không xếp hạng được nghĩa là chưa hiểu.

**L8 — Số liệu đi kèm điều kiện đo.** "Nhanh hơn 40%" không phải số liệu nếu thiếu baseline, phần cứng, và tải. Ghi đủ điều kiện hoặc đừng ghi.

## Pass 0 — Định vị và định tuyến

Chưa đọc sâu. Xác định loại nguồn, rồi nạp lăng kính tương ứng từ `references/source-types.md`.

| Loại | Dấu hiệu |
|---|---|
| `repo` | Host mã nguồn, có manifest phụ thuộc |
| `paper` | arXiv, DOI, có abstract và mục tham khảo |
| `video` | Nền tảng video, có thời lượng |
| `article` | Blog, newsletter, bài dài có tác giả |
| `docs` | Tài liệu sản phẩm, có điều hướng phân cấp |
| `announcement` | Release note, ra mắt, thông cáo |

Với `repo`, nạp thêm `references/archetypes.md` để chọn archetype con.

Ghi luôn `published_at` và **tốc độ mục** của lĩnh vực. Nội dung về nguyên lý phân tán năm 2015 vẫn dùng được; nội dung về prompt engineering năm 2023 thì phần lớn đã hỏng.

Artifact — khối `fingerprint`.

## Pass 0.5 — Chuẩn hóa

Đưa mọi nguồn về **văn bản có địa chỉ**, để các pass sau không cần biết nguồn gốc là gì.

Video cần thêm một bước hay bị bỏ: **trích và OCR khung hình slide**. Với talk kỹ thuật, phần giá trị nhất — kiến trúc, số liệu, biểu đồ — thường chỉ có trên slide. Bỏ bước này là mất khoảng một nửa nội dung.

Chi tiết từng loại trong `references/source-types.md`.

Artifact — nội dung đã chuẩn hóa, kèm bản đồ địa chỉ.

## Pass 1 — Địa hình

Dựng bản đồ cấu trúc, tối đa 12 khối. Repo là module; paper là mục; video là phân đoạn theo chủ đề; article là các phần theo tiêu đề.

Mỗi khối một câu trách nhiệm. Một câu là một câu.

Nhiều hơn 12 thì gom nhóm, đừng cắt bớt. Việc gom nhóm chính là hành vi phân tích.

Artifact — khối `structure_map`.

## Pass 2 — Trục khái niệm

Tìm 3–7 khái niệm mà phần còn lại xoay quanh.

Với repo: interface và lớp cơ sở được nhiều module lõi import nhất. Với paper: các đại lượng và giả định mà phương pháp đứng trên. Với video và article: những khái niệm mà bỏ đi thì lập luận sập.

Với mỗi trục trả lời ba câu: nó mô hình hóa gì, ai dùng nó, bỏ đi thì cái gì sập. Câu thứ ba quan trọng nhất — bỏ đi mà không gì sập thì đó không phải trục.

Artifact — khối `abstractions`.

## Pass 3 — Cơ chế

Truy vết 2–3 đường xuyên suốt. Không thể giả vờ ở pass này.

Ý nghĩa "đường" đổi theo loại nguồn:

- **repo** — đường đi của dữ liệu: đường chính, đường khó, đường lỗi.
- **paper** — chuỗi lập luận: giả thuyết → phương pháp → thí nghiệm → kết quả → kết luận. Tìm chỗ đứt gãy, đó là nơi kết luận vượt quá bằng chứng.
- **video** — dòng luận điểm theo thời gian. Phần Q&A cuối thường lộ giới hạn thật mà phần trình bày giấu.
- **article** — quy trình được dạy, cộng những phương án tác giả đã thử và bỏ.
- **docs** — vòng đời của khái niệm chính từ khi tạo tới khi hủy.
- **announcement** — cái gì đã ship, cái gì mới hứa, cái gì lặng lẽ bỏ.

Mỗi đường viết thành bước đánh số, mỗi bước một địa chỉ.

Artifact — khối `traces`.

## Pass 3.5 — Kiểm chứng

**Bỏ qua nếu nguồn là `repo`.** Với mọi loại còn lại, bắt buộc.

Gán mức tin cậy cho **từng khẳng định**: `verified`, `plausible`, `claimed`, `conflicted`. Đối chiếu với nguồn đã có trong kho để tính hệ số kiểm chứng chéo.

Luật cốt lõi: khẳng định mức `claimed` từ một nguồn duy nhất **không bao giờ** được thành skill. Chỉ được thành knowledge.

Chi tiết trong `references/credibility.md`.

Artifact — trường `credibility` và `corroboration` trên từng ứng viên.

## Pass 4 — Chắt lọc

Ba cổng, rớt một là loại:

**Cổng 1 — Không hiển nhiên.** Một người có chuyên môn nghĩ 10 phút có tự ra được không? "Nên viết test" — ra được, loại.

**Cổng 2 — Chuyển giao được.** Áp dụng ở bối cảnh khác được không? Quy ước nội bộ của một dự án thì không.

**Cổng 3 — Có bằng chứng.** Với code là dòng hiện thực. Với nguồn khác là địa chỉ **cộng** mức tin cậy từ Pass 3.5.

Tối đa 5. Phân loại mỗi thứ giữ lại thành `knowledge` (đổi hiểu biết) hoặc `skill` (đổi hành vi). Phép thử: nhét câu đó vào system prompt của một agent, hành vi có đổi không?

Artifact — khối `essence`.

## Pass 4.5 — Gộp vào kho

Đối chiếu với knowledge base hiện có. Nếu một khái niệm đã tồn tại từ nguồn khác, **gộp** thay vì tạo mới: giữ một node khái niệm, thêm nguồn bằng chứng, cập nhật hệ số kiểm chứng.

Đây là chỗ giá trị tích lũy. Một khẳng định được chứng minh bằng ba loại nguồn khác nhau — paper mô tả cơ chế, repo cài đặt nó, talk kể chuyện vận hành thật — mạnh hơn nhiều so với ba bài blog cùng trích lại một bài gốc. Ba bài trích lại một gốc là **một** nguồn.

Artifact — cập nhật `corroboration`, danh sách node đã gộp.

## Pass 5 — Đóng gói

Xuất **một file `.md` duy nhất**. Không có JSON đi kèm. Frontmatter YAML gánh phần máy đọc, thân bài chín mục gánh phần người đọc.

Khóa YAML tiếng Anh, mọi nội dung tiếng Việt. Trần mềm 1500 từ, trần cứng 1800.

Toàn bộ hợp đồng nằm trong `references/format.md` — đọc trước khi viết dòng đầu tiên. Chạy danh sách kiểm ở cuối file đó trước khi nộp.

Trường `concepts` chỉ được lấy từ `concepts.yaml`. Không tìm được mục phù hợp thì ghi vào `concepts_proposed`, tuyệt đối không tự sinh khái niệm mới.

Trường `category` là **chủ đề** của bài. Schema chỉ ép dạng kebab-case; chân lý của danh mục chủ đề là bảng `categories` trong `kb/_kho.sqlite`, kiểm bằng `validate.py --categories` (FR-034 đã BỎ enum khỏi schema). Giá trị không có trong bảng làm validate đỏ; **không có** đường `category_proposed`. Không thuộc mảng nào thì để `category: []` — đừng nhồi một giá trị để lấp trường. Đừng nhầm với `concepts`: `category` là *bài thuộc mảng nào*, `concepts` là *bài dạy kỹ thuật gì*. Chi tiết ở `references/format.md`.

Nếu có `skill-manifest.json`, chạy tiếp đối chiếu khoảng trống theo `references/skill-gap.md` và ghi kết quả vào `skill_candidates`. Skill thật được sinh thành file riêng ở `skills/<name>/SKILL.md`, không lồng trong bản phân tích.

Đặt `review_status: draft`. Chỉ người mới được đổi trường này.

## Template thân bài

Năm mục cố định, mục 3 có bốn mục con. **Tên mục không bao giờ đổi theo loại nguồn** — nội dung mới đổi. Mục 3.2 với repo là đường đi dữ liệu, với paper là chuỗi lập luận, với video là dòng luận điểm. Cùng chỗ, cùng tên, khác bản chất.

Khung khai ở `assets/khung-than-bai.json`; `scripts/validate.py` đọc từ đó. Đổi khung thì sửa file khai.

1. Overview · 2. Bối cảnh · 3. Nội dung (3.1 Đầu vào · 3.2 Process · 3.3 Output · 3.4 Tinh túy) · 4. Ý nghĩa thực tế · 5. Rủi ro và tầm nhìn

Ngân sách từ, format cứng của mục 6, quy ước trích dẫn và danh sách kiểm: xem `references/format.md`.

Mục 5 và 6 chiếm 42% ngân sách từ. Bản nào có mục 1–2 phình ra còn mục 5 teo lại là bản đang viết lại phần dẫn nhập thay vì đọc thật.

Mục 7, 8 và 9 là thứ biến bản phân tích từ *đọc được* thành *học được*. Đừng bỏ.

## Hai đường nạp

Skill này chạy ở cả hai đường vào.

**Động** — người dùng dán link, chạy đủ Pass 0 → 5, đặt `origin: pipeline`.

**Tĩnh** — người dùng upload file `.md` họ đã tự phân tích ở nơi khác. Không chạy lại giao thức. Thay vào đó chạy cổng nạp: phân loại mức hợp lệ A/B/C/D, ghi nguồn gốc, spot-check ít nhất 2 trích dẫn, hạ cấp mọi đề xuất skill về trạng thái chờ duyệt. Chi tiết trong `references/intake.md`.

Cả hai đường đều vào kho với `review_status: draft`. Không có ngoại lệ.

Đếm nguồn độc lập cho hệ số kiểm chứng theo `url` đã chuẩn hóa, **không** theo số bản phân tích. Ba bản về cùng một nguồn vẫn là một nguồn.

## Khi không đủ dữ liệu

Trên giao diện chat không có công cụ lấy transcript hay clone repo: chạy Pass 0 và 1 với những gì fetch được, xuất artifact, rồi nêu chính xác cần gì để đi tiếp. Đừng đoán nội dung chưa đọc.

## Tệp tham chiếu

- `references/format.md` — hợp đồng output đầy đủ. Đọc ở Pass 5, trước khi viết dòng đầu tiên.
- `references/intake.md` — cổng nạp cho file upload từ ngoài. Đọc khi đầu vào là file, không phải link.
- `references/source-types.md` — sáu lăng kính và cách chuẩn hóa. Đọc ở Pass 0 và 0.5.
- `references/credibility.md` — thang kiểm chứng bốn mức. Đọc ở Pass 3.5.
- `references/archetypes.md` — sáu archetype con của repo. Chỉ đọc khi nguồn là repo.
- `references/skill-gap.md` — đối chiếu với skill sẵn có. Đọc ở Pass 5.
- `references/web-spec.md` — lớp web đọc kiểu báo điện tử.
- `assets/frontmatter.schema.json` — validate frontmatter. Parse YAML rồi validate.
