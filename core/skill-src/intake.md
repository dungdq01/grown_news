# Cổng nạp — đường tĩnh

Hệ thống nhận hai đường vào. **Động**: người dùng dán link, giao thức 6 pass chạy và sinh file. **Tĩnh**: người dùng tự phân tích ở nơi khác bằng AI của họ, rồi upload file `.md`.

Khác biệt nền: với đường động, chất lượng được bảo đảm bằng **kiểm soát quy trình**. Với đường tĩnh, bạn không biết gì về quy trình đã sinh ra file — chỉ còn **kiểm soát cửa vào**. Vì vậy cổng này phải chặt hơn nhiều so với trực giác ban đầu.

Cả hai đường đều đổ vào kho với `review_status: draft`. Không có ngoại lệ, kể cả file mức A.

## Thang hợp lệ

Phân loại trước, xử lý sau. Đừng nhận hoặc từ chối bằng một phép kiểm nhị phân.

**Không mức nào được bỏ qua bước 3 spot-check.** Mức chỉ quyết định *lượng việc bổ sung*, không quyết định có kiểm bằng chứng hay không.

| Mức | Tình trạng | Xử lý |
|---|---|---|
| **A** | Đủ frontmatter, khớp schema, có locator | Vào `draft` **sau khi spot-check đạt** |
| **B** | Có frontmatter nhưng thiếu trường bắt buộc | Tự bổ sung phần suy ra được từ nội dung, hỏi người phần không đoán được |
| **C** | Markdown thuần, không frontmatter | Chạy pass nâng cấp. **Bắt buộc có link nguồn gốc**, không có thì xuống D |
| **D** | Không phải bản phân tích, hoặc không truy được nguồn | Từ chối, trả báo cáo nêu rõ thiếu gì |

Mức C mà thiếu link nguồn gốc thì luôn xuống D. Một bản phân tích không truy được về nguồn thì mọi trích dẫn trong đó không kiểm được, và nó chỉ là văn bản do một AI nào đó viết ra. Nhận vào kho là làm hỏng kho.

## Bốn bước ở cổng

**1. Phân loại mức.** Parse frontmatter nếu có. Đối chiếu cấu trúc thân bài với chín mục chuẩn. Gán A/B/C/D.

**2. Ghi nguồn gốc.** Bắt buộc, kể cả mức A:

```yaml
origin: external                    # pipeline|external|manual
origin_tool: gemini-2.5-pro         # null nếu không rõ
origin_protocol_version: null       # null nếu không theo giao thức này
conformance: B                      # A|B|C
ingested_at: 2026-08-17
```

Không có nhóm trường này thì sau sáu tháng kho sẽ trộn lẫn bản chất lượng cao với bản không rõ gốc, và không lọc ra được nữa.

**3. Spot-check trích dẫn.** Chọn ngẫu nhiên 2 locator, fetch và đối chiếu xem nội dung có khớp không.

```yaml
citations_sampled: 2
citations_verified: 2
unverifiable_citations: false
```

Không fetch được — repo private, video sau tường phí, link chết — thì `unverifiable_citations: true`, hạ `credibility_max` một bậc, và ghi vào mục 7 của thân bài.

Một locator sai thì loại cả bản, không sửa từng chỗ. Sai một chỗ nghĩa là quy trình sinh ra nó không kiểm bằng chứng, nên phần còn lại cũng không đáng tin.

**4. Hạ cấp đề xuất skill.** Mọi `skill_candidates` từ file `origin: external` bị ép về trạng thái chờ duyệt. Cổng lọc bên ngoài có thể lỏng hơn cổng của bạn, và bạn không có cách nào biết.

## Luật chống nhiễm hệ số kiểm chứng

Đây là rủi ro dễ bỏ sót nhất của đường tĩnh.

Nếu ba người upload ba bản phân tích về **cùng một** paper, hệ thống rất dễ đếm thành ba nguồn độc lập và đẩy hệ số lên 1.6. Thực tế vẫn là một nguồn.

**Luật: đếm độc lập theo `url` đã chuẩn hóa của nguồn gốc, không theo số bản phân tích.**

Chuẩn hóa URL trước khi so: bỏ tham số theo dõi, bỏ `www`, thống nhất giao thức, quy `youtu.be` về `youtube.com/watch?v=`, quy `arxiv.org/pdf/x` về `arxiv.org/abs/x`, bỏ `.git` cuối URL repo.

Ba bản về cùng một URL thì **hợp nhất khi truy vấn**, không phải khi lưu. Mỗi bản vẫn là một file `.md` độc lập; việc gộp là kết quả `GROUP BY url_normalized` do lớp build thực hiện. Không có trường nào trong frontmatter chứa danh sách các bản khác — frontmatter chỉ mô tả chính nó.

Phần chênh lệch giữa các bản cùng URL là thứ đáng đọc: chỗ nhiều AI đọc ra nhiều nghĩa khác nhau thường là chỗ nguồn thật sự mơ hồ, hoặc chỗ có một bản sai.

## Báo cáo hợp lệ trả cho người upload

Mọi lần upload đều trả về một báo cáo ngắn, kể cả khi nhận thành công:

```
Mức hợp lệ: B
Thiếu: published_at, license, decay_risk
Đã tự bổ sung: source_type=article, one_liner
Cần bạn điền: license
Spot-check: 2/2 locator khớp
Khái niệm chưa có trong danh mục: 1 (streaming-backpressure)
Trạng thái: draft, chờ duyệt
```

Báo cáo này không phải thủ tục. Nó là vòng phản hồi nâng chất lượng của các lần upload sau — người upload thấy mình thiếu gì thì lần sau sẽ sửa prompt của họ.

## Cách nâng chất lượng đường tĩnh rẻ nhất

Đừng chỉ canh cửa. **Phát giao thức ra ngoài.**

File `source-distiller.skill` cài được vào Claude Code của bất kỳ ai. Nội dung `SKILL.md` dán được vào Gemini hay Codex làm system prompt. Người dùng chạy đúng giao thức thì output đạt mức A ngay từ đầu, và cổng gần như không phải làm gì.

Đây là khác biệt giữa kiểm soát chất lượng bằng thanh tra và bằng tiêu chuẩn. Thanh tra thì chi phí tăng theo số lượng; tiêu chuẩn thì không.

Với người trong đội, đưa thẳng file `.skill`. Với người ngoài, đưa `SKILL.md` cộng `format.md` là đủ.
