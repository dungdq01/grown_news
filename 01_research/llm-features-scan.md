# Quét tính năng AI/LLM cho Grown_news — s1-research

> Khảo sát 2026-08-29. Mọi con số dưới đây là **đo được**, không phải ước.
> Kết luận chính nằm ở §3 và nó **không phải** một danh sách tính năng.

---

## 1 · Sự thật bất ngờ nhất: dự án chưa có MỘT lời gọi model nào

Quét `core/src`, `core/tools`, `web/api` tìm `anthropic` · `openai` · `api_key` ·
`requests.post` · `fetch(` tới model: **0 kết quả**.

"AI" trong dự án này hôm nay là **một tác nhân bên ngoài** — một phiên agent, hoặc
skill `source-distiller` — đọc nguồn, **ghi file**, rồi `validate.py` chấm. Hệ
thống không gọi model; nó **kiểm thứ model viết ra**.

Đó không phải thiếu sót. Đó là một kiến trúc, và nó nhất quán với ba luật đã có:

| luật | nói gì |
|---|---|
| **M02-R3** | danh mục ĐÓNG — LLM chỉ được chọn id có sẵn, không được bịa |
| **B-B1 / M08-R3** | chỉ NGƯỜI khai `insight_new` · `skill_installed` · `review_minutes` |
| **M05-R1** | mọi thứ vào qua `_inbox/` dừng ở `review_status: draft`, không bao giờ `approved` |

Ba luật đó cùng nói một câu: **LLM đề xuất, người quyết.** Nên câu hỏi đúng không
phải *"thêm tính năng AI nào"* mà là:

> **LLM đứng ở đâu trong một hệ thống được dựng ra để không tin LLM với cái kho?**

---

## 2 · Ba đường ray ĐÃ CÓ SẴN cho output của LLM

Điều đáng chú ý: dự án đã xây sẵn chỗ cho LLM, chỉ là chưa có gì chảy vào.

**2.1 · `concepts_proposed`** — `validate.py:333` **cảnh báo**, không chặn:
```
"{n} khái niệm chờ duyệt danh mục"
```
Còn `concepts` (đã duyệt) thì chặn cứng: *"không có trong concepts.yaml — đưa vào
concepts_proposed"*. Đây là đường ray hoàn chỉnh: máy đề xuất vào cột chờ, người
kết nạp qua màn Danh mục. **Chi phí thêm tính năng ở đây: gần bằng không.**

**2.2 · `_inbox/` + `05_intake/gate.py`** — cửa nhận bản nháp từ ngoài. `gate.py:133`
ép `review_status = "draft"` **vô điều kiện**. Một bản do LLM viết đi qua đây được
kiểm bằng đúng bộ cổng mà bài người viết phải qua.

**2.3 · `khung-than-bai.json`** — khung 5 mục là **bảng khai duy nhất**, bốn tầng
cùng đọc nó. Một LLM sinh bài không phải đoán cấu trúc; nó đọc bảng khai.

Và `core/skill-src/source-types.md` đã ghi sẵn **phương pháp**: với video thì
*"transcript kèm mốc thời gian … trích khung hình slide … OCR"*, kèm cảnh báo
*"transcript làm mọi thứ nghe ngang nhau — dùng slide làm tín hiệu trọng số"*.
Đó là tài liệu cho NGƯỜI/AGENT, chưa phải mã.

---

## 3 · Ràng buộc quyết định kiến trúc — và nó CHƯA ĐƯỢC PHỦ

Đọc kỹ hai luật hay được viện dẫn:

- **B-D3** (`brd.md:174`): *"Web chạy local hoặc private. Không SEO, không chia sẻ
  công khai."* → cấm **công bố**.
- **security_baseline §4**: nghe ngoài `127.0.0.1` phải thêm auth + FR riêng. →
  cấm **nghe vào**.

**Không luật nào nói về GỬI RA.**

Nhưng lý do của cả hai thì nói: *bản phân tích có thể chứa nguồn nội bộ công ty*.
Gửi một PDF nội bộ tới model đám mây **chính là** đưa nội dung đó ra ngoài — chỉ
qua một cửa mà chưa luật nào đứng canh.

> **Đây là một LỖ HỔNG TRONG LUẬT, không phải vi phạm luật hiện có.** Và nó là
> phát hiện quan trọng nhất của lần quét này: thêm một lời gọi model đám mây
> **không phải một tính năng, nó là một quyết định chính sách**.

---

## 4 · Ba chỗ đặt model, và cái giá của mỗi chỗ

| | LLM ở đâu | Nội dung ra ngoài? | Mã mới | Ghi chú |
|---|---|---|---|---|
| **A** | **ngoài hệ thống** (như hôm nay): phiên agent đọc `_media/`, ghi `_inbox/` | do người quyết từng lần | **0 dòng** | chạy được **ngay hôm nay** |
| **B** | model **local** (Ollama/llama.cpp) gọi từ `core/tools/` | không | vừa | giữ trọn B-D3; tốn cài đặt, chất lượng thấp hơn |
| **C** | model **đám mây** gọi từ `web/api/**` | **có** | vừa | cần FR + sửa `security_baseline`; và `api-guard` đang cấm mọi `fetch` ra ngoài trong `web/api/**` |

**Phương án A đã hoạt động và tốn 0 dòng mã.** Đó là lý do tôi xếp nó trước: mọi
thứ ở §5 làm được bằng A ngay, và chỉ nâng lên B/C khi ma sát chứng minh là đáng.

Lưu ý về C: `api-guard.test.js` canh `web/api/**` không được `listen`/`0.0.0.0`;
thêm một `fetch` ra Internet ở đó là mở đúng bề mặt mà M08-R1 dựng ra để đóng.

---

## 5 · Tính năng, xếp theo (giá trị đo được) × (vừa với đường ray) ÷ (rủi ro)

Xếp hạng dựa trên **ma sát tôi quan sát được hôm nay**, không dựa trên cái gì
nghe hay: bạn nạp `[Reading]-XGBoost.pdf` (2.8 MB) rồi **tự gõ** tiêu đề, tóm
tắt, mô tả, và **tự tick** `ml` + `algorithm`.

### ⭐ 5.1 · Đề xuất nhãn vào `concepts_proposed` — RẺ NHẤT, LÀM TRƯỚC
Đường ray đã xong; `validate.py` đã cảnh báo thay vì chặn; màn Danh mục đã có cột
*"Đề xuất từ bài · 5 chờ"*. Chỉ thiếu thứ đổ vào. Làm bằng phương án A: agent đọc
bản ghi, ghi `concepts_proposed`, xong.
**Rủi ro:** gần bằng không — không nhãn nào vào `concepts.yaml` mà không qua bạn.

### ⭐ 5.2 · Tóm tắt hiện vật khi nạp (PDF/video → tóm tắt + mô tả + nhãn)
Đúng cái bạn vừa làm bằng tay. Byte đã nằm trong `_media/<sha256>`, địa chỉ hoá
sẵn. Kết quả đổ vào **form** làm gợi ý — bạn sửa rồi mới bấm Ghi, nên không có
đường nào để nó tự vào kho.
**Rủi ro:** thấp về dữ liệu, nhưng đây là chỗ **§3 cắn**: PDF phải đi tới đâu đó
để được đọc.

### 5.3 · Trích khung 5 mục từ tài liệu → bản nháp bài viết
`khung-than-bai.json` + `source-types.md` đã đủ để làm. Ra `_inbox/` → `gate.py`
→ `draft`. Biến một PDF 2.8 MB thành một bài **để bạn duyệt**, không phải để tin.

### 5.4 · Tìm kiếm ngữ nghĩa · 5.5 · Phát hiện mâu thuẫn giữa các bản ghi
Cả hai đều đáng cho một kho tri thức — *"bài A nói X, bài B nói ngược"* là thứ
một cái kho nên tự biết. Nhưng **kho hiện có 2 bản ghi** *(đo 08-29; **08-30: 3 bản ghi** — `select count(*) from ban_ghi`)*. Xây bây giờ là xây một
phép đo không có gì để đo. **Hoãn tới khi corpus đủ** — bộ đo tải
(`core/tools/do_tai.py`) cho biết ngưỡng nào đắt, dùng nó làm mốc.

### 5.6 · Whisper cho video
`source-types.md` đã gọi tên. Nặng (tải model, GPU), và giá trị phụ thuộc bạn có
thật sự đọc video dài hay không. Chưa đủ bằng chứng để xếp trên 5.1–5.3.

---

## 6 · Khuyến nghị

1. **Làm 5.1 ngay bằng phương án A** — 0 dòng mã, đường ray đã có, rủi ro gần
   bằng không.
2. **5.2 và 5.3 cũng bằng A trước.** Nếu ma sát vẫn còn sau vài lần dùng thật thì
   mới bàn tự động hoá — lúc đó đã có bằng chứng thay vì phỏng đoán.
3. **Trước khi viết bất kỳ lời gọi model nào từ trong hệ thống**, đóng lỗ ở §3:
   thêm một mục *"dữ liệu gửi RA ngoài"* vào `security_baseline.md`. Đó là FR, và
   là quyết định của bạn — không phải thứ agent tự quyết.
4. **Chưa xây 5.4/5.5** cho tới khi kho đủ lớn.

## 7 · Điều lần quét này KHÔNG trả lời

- Chất lượng model local (phương án B) trên tiếng Việt kỹ thuật — **chưa đo**.
- Chi phí mỗi bản ghi nếu dùng đám mây — **chưa đo**, và nó phụ thuộc §3 trước.
- Liệu bạn có muốn LLM chạm vào kho **tự động** hay chỉ khi bạn gọi — đó là câu
  hỏi về sản phẩm, và nó quyết A/B/C nhiều hơn mọi yếu tố kỹ thuật ở trên.

---

## 8 · PHỤ LỤC 2026-08-30 — thứ tự ưu tiên ở §5 đã ĐỔI

> §1–§7 giữ nguyên làm hồ sơ khảo sát ngày **29/08**. Mục này ghi cái đo được
> ngày **30/08**, và nó đảo thứ tự của §5. Không sửa §5 tại chỗ: một khảo sát
> đề ngày mà chứa phát hiện của hôm sau là một biên ghi nói dối.

### 8.1 · Đường ray chống bịa là TỰ KHAI từ đầu đến cuối

§2 khai ba đường ray đã có sẵn cho output của LLM, và điều đó đúng. Cái §2
**không hỏi** là: những đường ray ấy có răng không.

| mắt xích | đáng lẽ | đo được 30/08 |
|---|---|---|
| `LOCATOR_RE` (`validate.py:58`) | một địa chỉ | **ngoặc vuông bất kỳ** — `[2, 1, 0.5, −0.5]` và `[ l(yᵢ)+gᵢ·f(xᵢ) ]` trong `kb/docs/xgboost-taylor-bac-hai.md` đều qua cổng §7 |
| `citations_sampled` | máy đếm | `fm.get(...)` — **số người gõ** |
| `citations_verified` | máy đối chiếu | `fm.get(...)` — **số người gõ** |

`05_intake/gate.py:75` còn phát sẵn template `citations_sampled: 0  # BẮT BUỘC
\>=2: tự mở link`. **Không dòng nào trong repo tính hai số đó.** Và grep toàn
bộ `core/tests/` + `web/test/`: mọi phép kiểm nhắc `locator` đều hỏi *"có
ngoặc vuông không"*, không cái nào hỏi *"ngoặc vuông trỏ tới đâu"*.

⇒ Một agent ghi `citations_sampled: 5 / verified: 5` rồi rải `[§II.4]` là **qua
sạch toàn bộ bộ máy chống bịa**. `CLAUDE.md` cấm đúng điều này: *"đếm tay rồi
chép số — số phải do máy tổng hợp từ nguồn (`#tự-khai`)"*.

### 8.2 · Hệ quả: §5 đảo thứ tự

§5 xếp hạng tính năng LLM theo *giá trị × vừa-đường-ray ÷ rủi ro*. Phép xếp đó
giả định đường ray **có răng**. §8.1 cho thấy nó chưa có. Nên:

> **Trước khi vá §8.1, mọi tính năng LLM nhân RỦI RO lên. Sau khi vá, chúng
> nhân GIÁ TRỊ lên.**

Cụ thể với **§5.3** (trích khung 5 mục → bản nháp): hôm nay nó là *"agent viết
bài, rồi agent tự khai đã kiểm 3 trích dẫn"* — một vòng tròn khép kín, không
ai đứng ngoài chấm. Sau khi `citations_verified` thành phép tính, cùng tính
năng đó thành *"agent viết bài, máy chấm từng địa chỉ"*. Cùng một dòng lệnh,
hai thứ khác hẳn nhau.

**§5.1 và §5.2 không đổi hạng** — chúng đổ vào `concepts_proposed` và vào form,
hai chỗ mà người vẫn đứng giữa.

### 8.3 · Hai việc chèn LÊN TRƯỚC §5

Cả hai **không phải tính năng LLM**, và cả hai **0 dòng gọi model**:

| | việc | module |
|---|---|---|
| **F1** | cú pháp địa chỉ + phép phân giải — tách *địa chỉ* khỏi *ngoặc vuông bất kỳ*; địa chỉ trỏ file thì file phải tồn tại | M01 |
| **F2** | `citations_sampled`/`citations_verified` thành **dữ liệu dẫn xuất** do `validate.py` tính, cùng nhóm với `word_count` và `url_normalized` đã có | M01 |

Giới hạn phải nói thẳng: F2 kiểm được *"địa chỉ có thật, văn tại đó chứa từ
khoá"*, **không** kiểm được *"văn đó có ủng hộ khẳng định"*. NotebookLM cũng
đúng y như vậy. Nhưng nó chặn được lớp bịa phổ biến nhất: **địa chỉ không tồn
tại**.

Rủi ro của F1: **đỏ oan** trên công thức toán, và **di trú** — 3 bài đang có
phải qua lại cổng mới.

### 8.4 · Con trỏ, không chép

- `01_research/notebooklm-tinh-tuy.md` — năm nguyên lý tách được khỏi Google,
  và vì sao Grown_news **đã làm xong nửa khó** của mô hình đó. F1/F2 ở trên là
  §5.1/§5.2 của tài liệu ấy.
- `01_research/kenh-chat-va-business-agent.md` — Zalo/FB/Telegram, và ba ràng
  buộc (`B-D3` · `M08-R1` · lỗ *gửi RA*) cắn vào đâu.

### 8.5 · Lỗi của chính tôi trong ngày 30/08

Tôi ghi **"kho 5 bản ghi"** trong `notebooklm-tinh-tuy.md` vì đếm `find kb
-name "*.md"`. Hai trong năm file đó — `kb/README.md` và
`kb/_nhat-ky-danh-muc.md` — **không có frontmatter, không phải bản ghi**.
`select count(*) from ban_ghi` trả **3**.

Đếm tay rồi chép số, đúng thứ §8.1 vừa đi tố. Đã sửa ở cả hai file.

### 8.6 · §3 vẫn chưa vá

Lỗ *"gửi RA"* nêu ở §3 **vẫn nguyên**. Nó chặn mọi tính năng có model trong
hệ, và giờ chặn thêm một thứ mới: nối facet thành phạm vi truy hồi.
