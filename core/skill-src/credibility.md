# Thang kiểm chứng

Cổng mới, chỉ áp dụng cho nguồn không phải code. Chạy giữa Pass 3 và Pass 4.

Lý do tồn tại: cổng "có bằng chứng" ở Pass 4 vốn được thiết kế cho code, nơi bằng chứng là dòng code hiện thực. Với bài viết và video, "bằng chứng" mà tác giả đưa ra chính là thứ cần được thẩm định. Bỏ qua bước này thì knowledge base sẽ đầy những con số không có điều kiện đo và những khuyến nghị không ai kiểm chứng.

## Bốn mức

Gán một mức cho **từng khẳng định**, không phải cho cả nguồn. Một bài viết tốt vẫn có thể chứa cả bốn mức.

**`verified`** — có nguồn sơ cấp, và có ít nhất một bên độc lập tái lập hoặc xác nhận. Hoặc: khẳng định về cơ chế mà bạn tự đối chiếu được với code hay tài liệu chính thức.

**`plausible`** — có nguồn sơ cấp và điều kiện đo được nêu rõ, nhưng chưa ai độc lập tái lập. Phần lớn kết quả trong paper nằm ở mức này.

**`claimed`** — chỉ có lời tác giả. Không có điều kiện đo, hoặc có số nhưng không có baseline. Đa số nội dung blog và toàn bộ release note mặc định vào đây.

**`conflicted`** — tác giả có lợi ích trực tiếp trong kết luận. Vendor viết về sản phẩm của chính họ, tác giả framework so sánh với đối thủ, benchmark do bên bán chạy.

## Năm câu hỏi để xếp mức

Chạy nhanh, không cần viết ra hết, chỉ ghi kết luận:

1. **Đây là nguồn sơ cấp hay thứ cấp?** Bài blog tóm tắt paper là thứ cấp. Đi tìm bản gốc trước khi trích. Không tìm được thì hạ một mức.

2. **Số liệu có điều kiện đo không?** "Nhanh hơn 40%" mà không nói baseline nào, phần cứng gì, tải ra sao — đó là khẳng định rỗng, không phải số liệu. Ghi số kèm điều kiện hoặc đừng ghi.

3. **Tác giả được lợi gì nếu bạn tin?** Không phải để loại bỏ, mà để gắn nhãn. Vendor blog vẫn thường là nguồn kỹ thuật tốt nhất về sản phẩm của họ — chỉ là đừng lấy phần so sánh với đối thủ.

4. **Có ai độc lập nói ngược lại không?** Một lần tìm kiếm nhanh. Tìm được phản biện thì ghi vào, đó là thông tin có giá trị cao.

5. **Nội dung này bao nhiêu tuổi, và lĩnh vực này mục nhanh cỡ nào?** Bài về nguyên lý phân tán năm 2015 vẫn dùng được. Bài về prompt engineering năm 2023 thì phần lớn đã hỏng. Ghi ngày xuất bản vào fingerprint và đối chiếu với tốc độ mục của lĩnh vực.

## Luật chuyển thành skill

Đây là chỗ thang kiểm chứng nối vào phần còn lại của hệ thống:

| Mức | Được làm gì |
|---|---|
| `verified` | Thành skill được |
| `plausible` | Thành skill được, nhưng phải ghi rõ điều kiện áp dụng trong phần trigger |
| `claimed` | Chỉ được thành knowledge. Không bao giờ thành skill từ một nguồn duy nhất |
| `conflicted` | Lưu, gắn cờ, không dùng phần so sánh cạnh tranh |

Luật quan trọng nhất nằm ở dòng thứ ba. Một khẳng định mức `claimed` từ một bài blog không được biến thành skill điều khiển hành vi agent. Nhưng nếu **ba nguồn độc lập** cùng nói một điều ở mức `claimed`, nó được nâng lên `plausible` — đó là cơ chế tích lũy ở mục dưới.

## Hệ số kiểm chứng chéo

Khi cùng một khẳng định xuất hiện ở nhiều nguồn **độc lập** — khác tác giả, khác tổ chức, không trích dẫn lẫn nhau — độ tin tăng. Điều này thay đổi công thức ưu tiên trong `skill-gap.md`:

```
Ưu tiên = (Liên quan × Tần suất × Độ bền × Hệ số kiểm chứng) / Chi phí
```

| Số nguồn độc lập | Hệ số |
|---|---|
| 1 | 1.0 |
| 2 | 1.3 |
| 3 trở lên | 1.6 |
| Có nguồn phản biện chưa giải quyết | 0.6 |

Ba bài viết cùng trích lại một bài gốc là **một** nguồn, không phải ba. Kiểm tra phần tham chiếu trước khi đếm — đây là lỗi phổ biến và nó thổi phồng độ tin một cách nguy hiểm.

Ngược lại, một khẳng định được chứng minh bằng ba loại nguồn khác nhau — paper mô tả cơ chế, repo cài đặt nó, talk kể chuyện vận hành thật — là dạng mạnh nhất. Hệ số 1.6 và gần như chắc chắn vượt ngưỡng sinh skill.

## Ghi vào schema

Bổ sung vào mỗi phần tử `essence`:

```json
{
  "statement": "...",
  "credibility": "plausible",
  "credibility_note": "Số liệu có nêu phần cứng và workload, chưa ai tái lập",
  "corroboration": {
    "independent_sources": 2,
    "factor": 1.3,
    "source_ids": ["src_a1b2", "src_c3d4"],
    "contradicted_by": []
  },
  "published_at": "2026-03-14",
  "decay_risk": "high"
}
```

Trường `contradicted_by` để rỗng phần lớn thời gian. Khi nó có nội dung, đó thường là mục đáng đọc nhất trong cả bản phân tích.
