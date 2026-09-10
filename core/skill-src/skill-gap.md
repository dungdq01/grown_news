# Đối chiếu khoảng trống skill

Mục tiêu: từ tinh túy của repo, quyết định có nên bổ sung hay nâng cấp skill cho agent nội bộ không — và nếu có thì ưu tiên tới đâu.

Bước này chỉ chạy khi có `skill-manifest.json`. Không có manifest thì bỏ qua mục 10 của báo cáo, đừng đoán bừa agent đang thiếu gì.

## Đầu vào: skill manifest

Manifest mô tả năng lực *hiện có*, không phải tên file skill. Tên file không nói lên độ phủ.

```yaml
# nằm trong skill_candidates[] của frontmatter
- capability: idempotency-key-design
  verdict: NEW                    # NEW|DEEPEN|OVERLAP|OUT_OF_SCOPE
  target_skill: null              # điền khi verdict = DEEPEN
  proposed_name: idempotent-event-consumer
  credibility: plausible          # cổng chặn khóa vào trường này
  why_now: Tầng tích hợp ERP Bravo đang xử lý trùng bản ghi bằng kiểm tra thủ công
  score:
    relevance: 5
    frequency: 4
    durability: 5
    corroboration_factor: 1.3
    cost: 2
  priority: 65
  draft_trigger: Dùng khi thiết kế consumer đọc từ hàng đợi hoặc webhook có thể gửi trùng
```

`depth` từ 1 đến 5:
- 1 — chỉ biết tên khái niệm
- 2 — biết khi nào dùng
- 3 — làm được trường hợp chuẩn
- 4 — xử lý được edge case, biết các đánh đổi
- 5 — thiết kế được cách tiếp cận mới

Chấm depth trung thực. Chấm cao quá thì công cụ này vô dụng vì sẽ không bao giờ đề xuất gì.

## Phân loại

Với mỗi ứng viên skill từ Pass 4, đối chiếu manifest và gán một nhãn:

| Nhãn | Điều kiện | Hành động |
|---|---|---|
| `NEW` | Không capability nào phủ, và thuộc domain | Viết skill mới |
| `DEEPEN` | Có phủ nhưng `depth ≤ 3`, repo có tài liệu sâu hơn | Bổ sung vào skill sẵn có |
| `OVERLAP` | Đã phủ ở `depth ≥ 4` | Loại. Ghi một dòng lý do |
| `OUT_OF_SCOPE` | Không liên quan domain | Giữ dạng knowledge, không thành skill |

Nhãn `OVERLAP` và `OUT_OF_SCOPE` phải xuất hiện trong báo cáo kèm lý do. Nếu một lần phân tích cho ra toàn `NEW`, gần như chắc chắn manifest chưa đủ chi tiết hoặc cổng lọc ở Pass 4 quá lỏng.

## Chấm điểm ưu tiên

Chỉ chấm cho `NEW` và `DEEPEN`.

```
Ưu tiên = (Liên quan × Tần suất × Độ bền × Hệ số kiểm chứng) / Chi phí
```

Hệ số kiểm chứng lấy từ Pass 3.5, xem `credibility.md`. Với nguồn là `repo` thì hệ số mặc định 1.0 vì code tự làm bằng chứng. Với nguồn khác, hệ số phản ánh số nguồn độc lập cùng khẳng định một điều.

**Liên quan (1–5)** — khoảng cách tới sản phẩm thật. 5 = đụng trực tiếp vào module đang chạy production. 1 = thú vị nhưng không có đường áp dụng.

**Tần suất (1–5)** — bao lâu agent cần tới một lần. 5 = gần như mọi task trong lĩnh vực đó. 1 = mỗi quý một lần.

**Độ bền (1–5)** — hai năm nữa còn đúng không. 5 = nguyên lý nền tảng. 1 = gắn với API của một thư viện đang thay đổi nhanh. Chiều này hay bị bỏ quên và nó chính là thứ khiến knowledge base mục rữa.

**Chi phí (1–5)** — công sức viết cộng công sức duy trì. 5 = phải viết script và cập nhật thường xuyên. 1 = một trang hướng dẫn tĩnh.

Ngưỡng hành động:
- `≥ 25` — làm ngay
- `12–24` — vào hàng đợi
- `< 12` — lưu dạng knowledge, đừng biến thành skill

Skill kém mà tồn tại thì tệ hơn không có, vì nó chiếm ngân sách kích hoạt và làm loãng việc chọn skill của agent.

## Định dạng đề xuất

Mỗi đề xuất phải đủ cụ thể để người đọc quyết định được ngay, không cần mở lại repo.

```json
{
  "verdict": "NEW",
  "target_skill": null,
  "proposed_name": "idempotent-event-consumer",
  "capability": "idempotency-key-design",
  "why_now": "Tầng tích hợp ERP Bravo đang xử lý trùng bản ghi bằng cách kiểm tra thủ công",
  "evidence": ["src/consumer/dedupe.py:34-91", "docs/adr/007-exactly-once.md"],
  "score": {"relevance": 5, "frequency": 4, "durability": 5, "cost": 2},
  "priority": 50,
  "draft_trigger": "Dùng khi thiết kế consumer đọc từ hàng đợi hoặc webhook có khả năng gửi trùng"
}
```

Trường `why_now` bắt buộc với `NEW` và `DEEPEN`, và phải nối với một vấn đề có thật — schema cưỡng chế điều này, không phải chỉ quy ước. Không nối được thì điểm Liên quan không thể là 4 hay 5.

Với `OVERLAP` và `OUT_OF_SCOPE`, trường bắt buộc là `reason_rejected` thay vì `why_now`. Schema từ chối ứng viên thiếu lý do — loại mà không ghi lý do thì không học được gì từ lần loại đó.

Cổng chặn khóa vào `credibility` của **từng ứng viên**, không vào `credibility_max` của cả file. File có một khẳng định `verified` vẫn có thể chứa ứng viên rút từ khẳng định `claimed`.

## Sinh skill mới

Chỉ khi `priority ≥ 25`. Sinh đúng chuẩn Agent Skills để cắm thẳng vào Claude Code:

```
skills/<proposed_name>/SKILL.md
```

Frontmatter chỉ cần `name` (trùng tên thư mục, chữ thường và gạch nối) và `description`. Phần `description` quyết định skill có được kích hoạt hay không — viết cụm kích hoạt cụ thể mà người dùng thật sẽ nói, đừng mô tả chung chung.

Thân skill lấy từ tinh túy, nhưng phải viết lại thành thủ tục. Nguyên văn từ repo là knowledge; skill phải trả lời được "khi gặp X thì làm gì". Giữ code example nhưng chuyển thành dạng khái quát, không phụ thuộc vào tên biến hay cấu trúc thư mục của repo gốc.

Kiểm tra giấy phép trước khi copy nguyên khối code vào skill. Mô tả kỹ thuật thì không vướng, sao chép nguyên đoạn từ repo GPL/AGPL thì cần cân nhắc — trường `license` ở Pass 0 có sẵn để tra.
