# Sáu loại nguồn

Giao thức gốc được thiết kế quanh code, và code có một đặc tính mà các nguồn khác không có: **nó tự làm bằng chứng cho chính nó**. Đọc `retry.py:44` là thấy được sự thật, không cần tin ai.

Bài viết, video, bài báo thì khác. Chúng là *lời khẳng định về* một sự thật nằm ở nơi khác. Nên với các nguồn này, việc phân tích phải kèm việc kiểm chứng — xem `credibility.md`.

## Đơn vị địa chỉ

Luật L2 (mọi khẳng định phải có địa chỉ) giữ nguyên, chỉ đổi định dạng địa chỉ:

| Loại | Đơn vị địa chỉ | Ví dụ |
|---|---|---|
| `repo` | file và dòng | `src/retry.py:44-71` |
| `paper` | mục, hình, phương trình | `§4.2, Bảng 3` |
| `video` | mốc thời gian | `12:04–13:30` |
| `article` | tiêu đề mục hoặc đoạn | `#tuning-the-batch-size ¶3` |
| `docs` | trang và neo | `/guide/streaming#backpressure` |
| `announcement` | mục trong release note | `v2.4.0 § Breaking changes` |

Không có địa chỉ thì gắn `[suy đoán]` như cũ. Với video, mốc thời gian là bắt buộc — nó cũng chính là thứ khiến bản phân tích dùng lại được, vì người đọc nhảy thẳng tới đoạn cần xem.

## Pass 0.5 — Chuẩn hóa

Bước mới, chèn giữa Pass 0 và Pass 1. Mục tiêu: đưa mọi nguồn về một dạng chung là **văn bản có địa chỉ**, để Pass 1–5 không phải biết nguồn gốc là gì.

**Video** — lấy transcript kèm mốc thời gian (caption sẵn có, hoặc Whisper). Thêm một bước quan trọng: **trích khung hình slide**. Với talk kỹ thuật, phần giá trị nhất thường nằm trên slide chứ không nằm trong lời nói — kiến trúc, số liệu, biểu đồ. Phát hiện chuyển cảnh, OCR khung hình, gắn vào transcript theo mốc thời gian. Bỏ bước này là mất khoảng một nửa nội dung.

**Paper** — tách theo mục, giữ nguyên số hiệu hình và bảng. Phần Related Work đọc lướt; phần Method và Experiments là trọng tâm; phần Limitations thường ngắn nhưng đáng giá nhất.

**Article và docs** — lấy theo cấu trúc tiêu đề, giữ neo URL. Bỏ điều hướng, quảng cáo, khối bình luận. Giữ code block nguyên vẹn — chúng thường là phần duy nhất tự làm bằng chứng.

**Announcement** — tách phần đã ship khỏi phần hứa hẹn. Đây là việc phân tích, không phải việc trích xuất.

## Lăng kính theo loại

### paper — bài báo khoa học

**Truy vết (Pass 3) là chuỗi lập luận**, không phải đường đi dữ liệu: giả thuyết → phương pháp → thiết kế thí nghiệm → kết quả → kết luận. Tìm chỗ đứt gãy, đó là nơi kết luận vượt quá bằng chứng.

Trọng tâm: delta so với baseline (đóng góp thật nằm ở chênh lệch), giả định ngầm về dữ liệu và phần cứng, và mục Limitations.

Bẫy: nhầm độ mới của bài với giá trị thực tiễn. Nhiều cải tiến 2% trên benchmark không sống nổi khi ra dữ liệu thật.

### video — talk, lecture, demo

**Truy vết là dòng luận điểm theo thời gian.** Diễn giả thường nói phần hay nhất ở khoảng 60–75% thời lượng, sau khi dựng xong bối cảnh và trước khi tổng kết. Phần Q&A cuối video hay lộ ra giới hạn thật mà phần trình bày giấu đi — đừng bỏ.

Trọng tâm: demo chạy thật (bằng chứng mạnh nhất trong video), số liệu trên slide, và những câu diễn giả nói mà không có trên slide — đó thường là kinh nghiệm thật.

Bẫy: transcript làm mọi thứ nghe ngang nhau. Một câu nói lướt và một câu được nhấn mạnh có cùng trọng số trong text. Dùng slide làm tín hiệu trọng số: cái gì lên slide là cái diễn giả cho là quan trọng.

### article — blog kỹ thuật, tutorial

Trọng tâm: vấn đề thật mà tác giả gặp, cách họ thử và thất bại trước khi tìm ra, và các con số đo được kèm điều kiện đo.

Bẫy lớn nhất: bài tutorial trình bày một cách làm như thể đó là cách duy nhất. Luôn hỏi tác giả đã bỏ qua phương án nào và tại sao. Không trả lời được thì đó là knowledge, chưa đủ thành skill.

Bẫy thứ hai: blog của vendor về chính sản phẩm họ bán. Vẫn đọc được, nhưng hạ độ tin theo `credibility.md`.

### docs — tài liệu sản phẩm

Trọng tâm: mô hình khái niệm mà tài liệu áp đặt, phần "khi nào không nên dùng" (hiếm nhưng cực giá trị), và khoảng cách giữa tài liệu với hành vi thật.

Bẫy: tài liệu mô tả trạng thái lý tưởng. Đối chiếu với issue tracker hoặc changelog để thấy chỗ nó nói dối.

### announcement — release note, ra mắt sản phẩm

Trọng tâm: cái gì thực sự đã ship, breaking change, và cái gì bị lặng lẽ bỏ đi. Mục "Deprecated" nói nhiều về hướng đi hơn mục "New features".

Bẫy: gần như toàn bộ nội dung loại này có xung đột lợi ích. Mặc định gán mức tin cậy `claimed`, nâng lên chỉ khi có bên thứ ba xác nhận.

## Nguồn lai và chuỗi nguồn

Rất hay gặp: một bài blog tóm tắt một paper, kèm link tới repo cài đặt. Đây là **chuỗi nguồn**, không phải một nguồn.

Xử lý: phân tích nguồn sơ cấp (paper, repo), dùng nguồn thứ cấp (blog) làm đường dẫn và làm bối cảnh. Ghi cả chuỗi vào `provenance` để sau này truy được.

Nếu chỉ có nguồn thứ cấp và không tìm được nguồn gốc, đó là một sự kiện đáng ghi lại chứ không phải chuyện bình thường — gắn cờ và hạ độ tin.
