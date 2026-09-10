# NotebookLM — chắt tinh tuý, và nó chạm vào đâu trong Grown_news

> Khảo sát 2026-08-30 · workflow gọn 14 agent, 0 lỗi, 30 claim trích / **3 qua
> phản biện**. Tỉ lệ xác minh thấp — mọi claim dưới đây đều ghi rõ tầng tin cậy.
> Tên sản phẩm đang trôi: help center Google đã đổi tiêu đề thành **"Gemini
> Notebook"**, path `support.google.com/gemininotebook/...`. Cơ chế không đổi.

---

## 0 · Kết luận trước, vì nó ngược với kỳ vọng

Grown_news **đã làm xong nửa KHÓ** của mô hình NotebookLM và **chưa làm nửa DỄ**.

| | NotebookLM | Grown_news hôm nay |
|---|---|---|
| ép câu trả lời bám nguồn | bằng **prompt + hậu kiểm** | bằng **cổng máy** — `validate.py` §7 chặn cứng bài không có địa chỉ |
| nguồn là bản gốc, ổn định | ❌ nguồn YouTube **tự bị gỡ trong 30 ngày** nếu bị xoá/private | ✅ byte nằm trong `_media/<sha256>` — **địa chỉ theo nội dung**, không trôi |
| trích dẫn **resolve được** | ✅ hover xem nguyên văn, click nhảy tới đoạn | ❌ **locator là chuỗi mờ**, không ai phân giải |
| truy hồi | có (RAG) | ❌ **không có tầng nào** |
| artifact từ corpus | mind map, flashcard, audio/video overview | ❌ không có |

> Thứ đáng chép **không phải** giao diện chat. Đáng chép là: **làm cho việc kiểm
> chứng rẻ hơn việc tin**. Grown_news đã bắt buộc trích dẫn bằng máy, nhưng trích
> dẫn của nó **không trỏ tới đâu cả** — nên phần thắng lớn nhất của NotebookLM
> vẫn còn nguyên đó, chưa lấy.

---

## 1 · Đo được trong kho THẬT: luật chống bịa có một lỗ

`validate.py:58` — `LOCATOR_RE` là "ngoặc vuông chứa 2–80 ký tự bất kỳ". Nó khớp
**mọi** cặp ngoặc vuông. Chạy trên `kb/docs/xgboost-taylor-bac-hai.md`:

| chuỗi có thật trong bài | qua cổng §7? | nó là địa chỉ? |
|---|---|---|
| `[§II.4]` | ✅ | có |
| `[2, 1, 0.5, −0.5, −1, −2]` | ✅ | **không — một mảng số** |
| `[ l(yᵢ, ŷᵢ^(t-1)) + gᵢ·f_t(xᵢ) + ½·hᵢ·f_t(xᵢ)² ]` | ✅ | **không — một công thức** |
| `[Tôi bịa ra cái này]` | ✅ | **không** |

Và grep toàn bộ `core/tests/` + `web/test/`: mọi phép kiểm nhắc "locator" đều hỏi
*"có ngoặc vuông không"*, **không cái nào hỏi "ngoặc vuông trỏ tới đâu"**.

Trong bài XGBoost thì may — các `[§...]` thật vẫn có mặt nên cổng không xanh oan.
Nhưng **một mục mà dấu ngoặc duy nhất là công thức thì vẫn qua**. Đây đúng lớp
lỗi *cổng-không-đỏ-được* mà dự án dựng cả bộ luật để săn, và nó đang nằm trong
luật chống bịa chủ lực.

---

## 2 · Năm nguyên lý tách được khỏi Google

*(nguồn: tổng hợp workflow; các trích dẫn dưới đây ở tầng "trích từ trang support
chính thức", phần lớn **chưa qua phản biện**)*

**① Phạm vi truy hồi là control HIỂN THỊ của người dùng, không phải heuristic ẩn.**
Mỗi nguồn một checkbox: *"use the checkbox on each source to include or exclude
certain sources the model should use"*. RAG thường: top-k ẩn, người dùng không
biết cái gì lọt vào context.
→ **Grown_news đã có sẵn control này**: `TANG = ["cat","loai","cpt","pl","nguon"]`
là bộ lọc facet trên màn danh sách. Nó đang lọc **hiển thị**; chưa ai nối nó vào
một phép **truy hồi**. Chi phí port: gần bằng 0 vì cái điều khiển đã dựng rồi.

**② Từ chối là hành vi hợp lệ, và phải PHÂN LOẠI lý do.**
Ba nhãn khác nhau: nội dung bị chặn an toàn · câu hỏi mơ hồ · **không có trong
nguồn**. Gộp cả ba thành "tôi không biết" thì người dùng không biết sửa gì.
→ Trùng đúng văn hoá sẵn có: `validate.py` trả lỗi có phân loại, và luật dự án đã
ghi *"cổng phải NÓI RA khi tải thất bại"*.

**③ Chi phí kiểm chứng phải RẺ HƠN chi phí tin.**
Trích dẫn hai tầng: hover xem nguyên văn, click nhảy tới vị trí. Verify tốn một
cử động chuột.
→ **Đây là chỗ Grown_news thua đau nhất.** `[§II.4]` bắt người đọc: mở PDF, tìm
mục II.4, đọc. Vài phút. Khi verify đắt hơn tin, **không ai verify**, và grounding
thành trang trí — đúng thứ luật §7 sinh ra để chống.

**④ N preset + đúng MỘT cửa thoát.**
3 conversational style × 3 độ dài phủ hầu hết nhu cầu; Custom giữ trần năng lực.
→ Grown_news là đúng mẫu này: khung 5 mục = preset, và WO-037 vừa **bỏ** cửa
thoát trong form (chế độ thô) — nhưng không bỏ hẳn: chốt an toàn của `dienForm`
chỉ thẳng *"Sửa file .md trực tiếp"*. Cửa thoát vẫn còn, chỉ nằm ngoài form. Nhất
quán với nguyên lý này.

**⑤ Artifact là một VIEW khác của cùng corpus, và phải quay ngược làm input.**
Mind map cho click vào node để hỏi tiếp trong chat — artifact vừa là output vừa
là bộ điều hướng cho vòng truy vấn sau. Khác hẳn "sinh ra file rồi hết".

---

## 3 · Thứ KHÔNG được chép

**"Chat View" của NotebookLM là che hiển thị, không phải access control** — giấu
sources/notes khỏi người xem nhưng **không thu hồi quyền truy cập thật**. UI gợi
ý một biên giới mà backend không thực thi.

Đây chính xác là lớp lỗi mà `M08-R1` tồn tại để chặn: ở Grown_news, thứ bảo vệ là
**bind cứng `127.0.0.1`**, không phải một nút bật/tắt trên giao diện. Giữ nguyên
nguyên tắc đó.

Ba điểm yếu khác đáng ghi vì Grown_news **đã tránh sẵn**:
- corpus trôi theo thời gian (nguồn YouTube tự bị gỡ sau 30 ngày ⇒ cùng câu hỏi,
  hai thời điểm, hai kết quả) — Grown_news lưu byte theo `sha256`, không trôi.
- xoá note **vĩnh viễn**, không thùng rác — Grown_news có bảng `recycle`.
- cắt ngắn âm thầm (Sheets truncate ở 100k token, không báo) — dự án có luật
  chống đúng cái này.

---

## 4 · Con số cứng (để so, không để chép)

Miễn phí: **100 notebook · 50 nguồn/notebook · 500.000 từ/nguồn · 200MB/file · 50
chat/ngày · 3 audio/ngày**. Đo bằng **từ và byte**, không phải trang, không phải
token. Từ **02/09/2026** đổi sang quota **compute-based**, nạp lại mỗi 5 giờ,
trần theo tuần — tức chi phí thành thứ **không dự toán được trước**.
Giá VN: AI Plus ₫132.000/th · AI Pro ₫489.000/th · Ultra từ ₫2.250.000/th.

Kho Grown_news hôm nay: **3 bản ghi** (`select count(*) from ban_ghi`) + 1 PDF trong `_media/`. Mọi thứ cần "corpus đủ lớn"
đều chưa đo được.

---

## 5 · Đường áp vào, xếp theo (giá trị đo được) ÷ (rủi ro)

### ⭐ 5.1 · LOCATOR PHẢI PHÂN GIẢI ĐƯỢC — làm trước, không cần LLM

Nguyên lý ③, và nó **đồng thời vá lỗ §1**.

- tách hai khái niệm đang bị trộn: **địa chỉ** (`[nguon.md:12-31]`, `[§II.4]`,
  `[Reading.pdf:p.7]`) vs **ngoặc vuông bất kỳ** (công thức, mảng số).
- cổng mới: mỗi mục cần locator phải có **ít nhất một locator ĐÚNG DẠNG**, và
  locator trỏ tới file/`_media` thì file đó **phải tồn tại**.
- chiều ngược bắt buộc: công thức toán **không được** biến thành lỗi oan — đây là
  cổng dễ đỏ oan nhất tôi từng đề xuất trong dự án này.

**0 dòng LLM. Không đụng B-D3, không đụng `security_baseline`.** Rủi ro: đỏ oan.

### 5.2 · Bấm locator → mở đúng chỗ trong nguồn

Nguyên lý ③ phần hai. Byte đã nằm sẵn ở `_media/<sha256>`; trình duyệt mở PDF
theo `#page=N`. Cửa sổ đọc (`web/render`) render locator thành liên kết.
Sau bước này, verify tốn **một cú bấm** thay vì vài phút.

### 5.3 · Nối facet sẵn có thành PHẠM VI TRUY HỒI

Nguyên lý ①. `TANG` đã là bộ chọn nguồn; thêm ô hỏi lấy đúng tập đang lọc làm
ngữ cảnh. **Nhưng bước này cần model ⇒ phải vá lỗ "gửi RA" trong
`security_baseline.md` TRƯỚC. Đó là FR, và là quyết định của người.**

### 5.4 · Artifact (mind map khái niệm, flashcard) — HOÃN

Dữ liệu đã có (`concepts`, view `nhan`). Nhưng kho **3 bản ghi**: xây bây giờ là
xây một phép đo không có gì để đo. Cùng lập luận đã dùng để hoãn tìm-kiếm-ngữ-nghĩa
ở lần quét trước. Mốc mở lại: dùng `core/tools/do_tai.py` làm thước.

---

## 6 · Cần NGƯỜI quyết

1. **5.1 có phải việc nên làm ngay không?** Nó sửa `validate.py` (M01) và mọi bài
   đang có phải qua lại cổng mới — **có thể làm đỏ bài đã nằm trong kho**. Đó là
   di trú, và tôi không tự quyết.
2. **Cú pháp locator chuẩn là gì?** Hôm nay mỗi bài một kiểu: `[§II.4]` ·
   `[nguon.md:1-2]` · `[walk-forward-validation-k-fold.md:12-31]` · `[Reading]`.
   Không chốt cú pháp thì không viết được phép phân giải.
3. **Lỗ "gửi RA"** vẫn chưa vá — chặn 5.3 và mọi thứ có model.

---

## Nguồn

`support.google.com/notebooklm` (16179559, 16269187, 16212283) ·
`support.google.com/gemininotebook` (16164461, 16206563, 16213268, 16958963,
17670842) · `blog.google` (custom personas, video overviews) ·
`gemini.google/subscriptions`
