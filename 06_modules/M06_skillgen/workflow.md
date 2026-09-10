# M06_skillgen — workflow

**Dùng trình tự chuẩn** (PHÂN TÍCH → PLAN → MÔ PHỎNG → CODE) — vì mỗi đơn vị việc
của M06 là *một cổng chấm* hoặc *một phần của nháp*, và cả hai viết được thành đỏ
trước.

Bốn chỗ áp riêng — **không** phải bước mới:

**① PHÂN TÍCH — đọc `frontmatter.schema.json` TRƯỚC `verdict.py`.** Cổng cứng của
M06 **dựa vào** schema để fail-closed: `verdict.py:51` không có mặc định cho
`credibility`, và thứ duy nhất ngăn nó nhận `None` là `required` của
`skill_candidates[]` (`schema:177-180`). Đọc `verdict.py` một mình sẽ thấy một
lỗ mà thực tế không tới được — và **ngược lại**, nới `required` bên schema sẽ mở
một fail-open ở `verdict.py` mà **không cổng nào nối hai chuyện lại**.

**③ MÔ PHỎNG — thứ tự cổng là thứ phải mô phỏng, không phải từng cổng.** Lượt
kiểm đầu chạy sai thứ tự (domain trước cổng cứng) và cho ra `NEW` cho ứng viên
**schema đã cấm**. Sai thứ tự **không tạo lỗi kiểu** — nó tạo kết quả *trông hợp
lệ*, và đó là lớp lỗi đắt nhất của module này.

**④ CODE — nháp sinh ra phải RỖNG thân.** `§2.2`: máy làm tốt phần **trigger**,
làm dở phần **nội dung**. Sinh đủ nội dung tạo ra thứ trông như skill mà cài vào
làm agent **tệ hơn**, và người dùng không phát hiện ngay vì output vẫn trôi chảy.

**④b `test_draft_shape.py` phải NGOÀI `phạm_vi_ghi` của đơn vị sinh nháp.**
`AC-2.2.2` chống *"chính module này phình vai"* ⇒ đây là AC duy nhất trong dự án
mà **tác giả và bị-chấm là một**, và luật gốc áp trực tiếp. Chưa được khai ở đâu
ngoài dòng này.

## Loạt `NEW` đáng ngờ: phản ứng đúng và phản ứng sai

```
M06 cho ra một loạt NEW
   ĐÚNG  → manifest THIẾU capability   ⇒ bổ sung capability
   SAI   → ngưỡng quá thấp             ⇒ hạ ngưỡng
```

`§2.4` chốt vế đúng. **Không cổng nào phân biệt được hai phản ứng** — cả hai đều
làm số `NEW` giảm, và cả hai đều để mọi test xanh. Đây là chỗ luật sống bằng chữ,
nên nó phải ở workflow chứ không chỉ ở spec.

## Không thuộc module này

| Việc | Đi đâu |
|---|---|
| ghi vào `kb/` | không thuộc `kb_writers` — M06 chỉ **đọc** bản `approved` |
| duyệt bài | **NGƯỜI** (B-B1) — M06 đọc `approved`, không tạo ra nó |
| cài skill vào agent | **NGƯỜI** (PRD U7) — máy đề xuất, người quyết định cài |
| `credibility_max` | chỉ để **lọc và hiển thị**, `schema:152` nói thẳng *"KHÔNG dùng làm cổng chặn"* ⇒ cổng khoá vào `skill_candidates[].credibility` |
| đóng gói skill (`core/skill-src/`) | **agent khác đang giữ** — không chạm |
