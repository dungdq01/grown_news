# Proposal — Grown_news

> Đọc: `01_research/research_summary.md` (G1).
> Duyệt xong = **phạm vi thô chốt**. Đổi ⇒ mở FR, không âm thầm phình ở s3.

## 1 · Vấn đề

Nguồn kỹ thuật ngoài kia vô hạn; một người không học hết. Ba cách giải hiện có
đều hỏng ở một chỗ khác nhau:

| Cách làm | Hỏng ở đâu |
|---|---|
| Đọc rồi tự tóm tắt | Output bị chi phối bởi phần **lặp nhiều nhất** (dẫn nhập, boilerplate), không phải phần giá trị nhất |
| Để AI tóm tắt | **Stanford 2025: 17–34% truy vấn bịa, kể cả khi có RAG.** Grounding giảm chứ không loại bỏ |
| Lưu vào Obsidian/Notion | Không schema, không cổng duyệt ⇒ file thứ 50 khác file thứ 1, cả người lẫn máy đều không dùng lại được |

Gộp lại: **thứ đọng lại sau khi đọc vừa không đúng trọng tâm, vừa không kiểm được,
vừa không tái sử dụng được.**

→ `gap_analysis.md` G-1 · G-2 · G-3

## 2 · Giải pháp đề xuất

Một cái phễu ba tầng cổng, biến dòng nguồn vô hạn thành một tờ báo đã thẩm định.

```
dán link → [SKILL] 6 pass → kb/*.md (draft) → [MÁY] 8 cổng → [NGƯỜI] approved → web
```

| Tầng cổng | Ai gác | Chặn cái gì | Trỏ về |
|---|---|---|---|
| **Giao thức** | skill 6 pass | Đọc hời hợt, tóm tắt phần dẫn nhập | G-1 |
| **Máy** | schema + validate | Sai format, thiếu bằng chứng, skill từ nguồn yếu | G-2, G-3 |
| **Người** | `review_status: approved` | Thứ đúng format nhưng nhạt | G-4 |

Điểm khác biệt **không** nằm ở chất lượng tóm tắt — LLM đã làm tốt việc đó. Nằm ở
**kỷ luật quanh** việc tóm tắt: mọi kết luận neo địa chỉ cụ thể, mọi danh sách có
trần cứng, nguồn phi-code phải qua thẩm định độ tin cậy.

## 3 · Cho ai

**Một người: chủ dự án.** Không phải sản phẩm cho người khác dùng.

Hệ quả kéo theo — ghi rõ để s3 không tự thêm: không auth, không phân quyền, không
multi-user, không SEO, không onboarding, không chịu trách nhiệm pháp lý với người
đọc thứ ba.

Ba nơi tiêu thụ output, cùng một file `.md`:
1. **Người** — đọc để học, tra cứu lại
2. **Agent nội bộ** — nạp `skill_candidates` thành skill thật
3. **Web** — hiển thị kiểu báo điện tử

## 4 · Phạm vi

### Scope IN

| # | Hạng mục | Truy về vấn đề |
|---|---|---|
| S1 | Skill 6 pass sinh `.md` từ 6 loại nguồn | G-1 |
| S2 | Schema + validator + test cưỡng chế format | G-2 |
| S3 | Thang kiểm chứng + hệ số kiểm chứng chéo | G-3 |
| S4 | Cổng duyệt `draft → approved` | G-4 |
| S5 | Web đọc `kb/`, render kiểu tòa soạn | G-5 |
| S6 | CI chạy validate + test trên mỗi PR | G-2 (S3 của khung — hiện chạy tay) |

### Scope OUT — quan trọng hơn scope in

| Cố ý KHÔNG làm | Vì sao |
|---|---|
| Tự động **tìm** nguồn mới | Yêu cầu gốc chỉ nói xử lý nguồn *đã gửi*. Đây là bài toán ngược chiều (GPT Researcher/STORM đã giải) |
| Multi-user, phân quyền, auth | Phạm vi cá nhân |
| SEO, tối ưu chia sẻ công khai | Không có trong yêu cầu gốc |
| Tự viết static site generator | Quartz/Next.js đã giải xong |
| Tự viết engine tóm tắt | LLM làm tốt rồi; giá trị nằm ở kỷ luật quanh nó |
| Realtime, collaborative editing | Nguồn chân lý là git; một người dùng |
| App mobile | Web responsive đủ |
| Tự động sinh skill rồi tự cài vào agent | Cổng người là chủ ý — xem G-4 |

## 5 · Tiêu chí thành công — số, không phải tính từ

### M1 · Giao thức có cho ra insight thật

| Metric | Ngưỡng | Cách đo |
|---|---|---|
| M1.1 | ≥ **3/10** bản đầu cho ra insight chủ dự án *chưa biết và sẽ hành động theo* | Chủ dự án đánh dấu `insight_new: true` khi duyệt; đếm |
| M1.2 | ≥ **1/10** sinh ra skill thực sự cài vào agent, và output agent đổi tốt hơn | Đếm file trong `skills/` có nguồn từ `kb/` |
| M1.3 | Thời gian duyệt trung bình < **20 phút/bản** | Bấm giờ khi duyệt, ghi vào worklog |

**M1 là metric chặn.** Không đạt ⇒ vấn đề ở giao thức hoặc cổng lọc; xây thêm hạ
tầng chỉ làm scale một thứ chưa hoạt động.

### M2 · Cưỡng chế bằng máy có hiệu lực

| Metric | Ngưỡng | Cách đo |
|---|---|---|
| M2.1 | **100%** file trong `kb/` pass validate | `validate.py kb/` exit 0 |
| M2.2 | **0** file `approved` có `credibility: claimed` + 1 nguồn ở verdict NEW/DEEPEN | schema cưỡng chế; đếm vi phạm = 0 |
| M2.3 | Mọi cổng có ≥1 test chứng minh **chặn thật** | `pytest core/tests` — hiện 14 test |
| M2.4 | CI chạy trên **100%** PR chạm `kb/` hoặc `core/` | GitHub Actions log |

**Hiện trạng đo được**: M2.1 ✅ (0 file, exit 0) · M2.2 ✅ · M2.3 ✅ 14 test ·
M2.4 ❌ chưa có CI.

### M3 · Web dùng được

| Metric | Ngưỡng | Cách đo |
|---|---|---|
| M3.1 | **100%** bài `approved` render không lỗi | Build pass, đếm trang sinh ra = đếm file approved |
| M3.2 | **0** bài `draft`/`rejected` lọt lên web | Đếm trang sinh ra vs đếm file approved — phải bằng nhau |
| M3.3 | Ba bản cùng `url_normalized` hiển thị thành **1** bài | Test với 3 file cùng URL |
| M3.4 | Thời gian từ `git push` tới bài lên web < **5 phút** | Đo CI/CD |

### M4 · Kho tích luỹ giá trị

| Metric | Ngưỡng | Cách đo |
|---|---|---|
| M4.1 | ≥ **1** khẳng định đạt `corroboration_factor ≥ 1.3` (2+ nguồn độc lập) | Đếm trong frontmatter |
| M4.2 | `concepts_proposed` được duyệt lô, tồn đọng < **10** mục | Đếm |

M4 chỉ có nghĩa từ nguồn thứ 2–3 trở đi. Hiện **0 nguồn** — chưa đo được.

## 6 · Phác thảo sản phẩm

1. Mở Claude Code trong thư mục dự án, dán một link — không cần gõ lệnh.
2. Skill tự nhận loại nguồn, chạy 6 pass, sinh `kb/paper/<slug>.md` với
   `review_status: draft`.
3. `git commit` — pre-commit hook chạy validate; sai format thì **chặn**, in lỗi
   tiếng Việt kèm cách sửa.
4. Chủ dự án đọc bài, sửa, đổi thành `approved`. Đây là chỗ duy nhất cần người.
5. `git push` → CI xanh → web build lại, bài xuất hiện ở trang chủ dưới dạng tít
   + sapo + chuyên mục.
6. Trang bài: hộp metadata (độ tin, ngày, nguồn gốc), thân bài 9 mục, lộ trình
   tiếp thu dạng checklist, tự kiểm ẩn đáp án, hộp đề xuất skill.
7. Tra cứu: lọc theo `concepts` — chính xác vì danh mục được kiểm soát.

## 7 · Rủi ro

| # | Rủi ro | Mức | Giảm thiểu |
|---|---|---|---|
| R-a | **Giao thức cho ra bản nhạt** — đúng format nhưng không insight | **Cao** | M1 là metric chặn. Chạy 10 nguồn thật trước khi xây thêm. Không đạt ⇒ sửa cổng lọc Pass 4, không xây web |
| R-b | Chủ dự án không duy trì nhịp duyệt ⇒ kho đầy `draft` chết | **Cao** | M1.3 < 20 phút/bản. Nhịp tuần/tháng ghi trong README |
| R-c | Tự viết web trong khi Quartz đã đủ | Trung bình | **Q1 của s1 — kiểm trước khi viết code.** Quyết định này xoá được cả module S5 |
| R-d | Danh mục `concepts` phình hoặc mục rữa | Trung bình | Duyệt lô tuần; `concepts_proposed` không tính vào hệ số |
| R-e | Nhận output tool ngoài (đường tĩnh) với 17–34% bịa | Trung bình | Spot-check ≥2 trích dẫn, 1 sai loại cả bản. **Q3 của s1: 2 mẫu có đủ không?** |
| R-f | Skill hỏng khi Claude Code đổi format | Thấp | `protocol_version` trong frontmatter; skill là văn bản, port được sang Gemini/Codex |
| R-g | Môi trường Python phân mảnh chặn CI | Thấp | S6 (CI) ép dọn |

## 8 · Ba câu hỏi treo từ s1 — cần quyết ở s3/s4

**Q1 · Quartz hay tự viết Next.js?** ← ảnh hưởng lớn nhất, xoá được một module
**Q2 · Kho rỗng, giá trị chưa chứng minh** ← M1 chưa đo được vì 0 nguồn
**Q3 · Spot-check 2 trích dẫn có đủ với tỷ lệ bịa 17–34%?**

## 9 · Trạng thái base đã dựng

| Scope | Trạng thái | Bằng chứng máy |
|---|---|---|
| S1 skill | ✅ cài, đọc hết 13 file | — |
| S2 schema+validate | ✅ **đã kiểm chứng** | 14 test pass · 7 cổng chặn thật |
| S3 kiểm chứng | ⚠️ cưỡng chế xong, chưa chạy nguồn thật | test t1 chặn `claimed`+1 nguồn |
| S4 cổng duyệt | ⚠️ luật có, chưa có bài để duyệt | hook chặn commit sai — đã thử |
| S5 web | ❌ chỉ có luật trong README | — |
| S6 CI | ❌ chưa có | — |

**Đề nghị thứ tự**: quyết Q1 → S6 (CI, để S3-của-khung có răng) → chạy 10 nguồn
đo M1 → S5 (web). Web làm sau cùng vì M1 không đạt thì web vô nghĩa.
