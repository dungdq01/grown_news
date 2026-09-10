# M04_ci — workflow

**Dùng trình tự chuẩn** (PHÂN TÍCH → PLAN → MÔ PHỎNG → CODE) — vì mỗi đơn vị việc
của M04 là *một bước CI* hoặc *một phép thử răng của cổng*, và cả hai viết được
thành đỏ-trước.

Nhưng M04 có **một nhịp thêm** mà module khác không có, và nó không thể bỏ:

**⓪ TRƯỚC PHÂN TÍCH — trả lời *"cái này đo M04, hay đo module M04 đang chấm?"***
M04 chạy lệnh của module khác. Nên một lượt đỏ có **hai** nghĩa hoàn toàn khác:
cổng của M04 hỏng, hay luật của M01/M02 bắt được thứ nó phải bắt. Không phân biệt
trước thì mọi lượt sửa là sửa sai module.

Ba chỗ áp riêng:

**② PLAN — `phạm_vi_ghi` KHÔNG được chứa `core/src/` hay `kb/`.** Luật gốc:
M04 kiểm hai chỗ đó. ⚠️ Có một ngoại lệ **theo đường dẫn**:
`core/tests/check_*.py` thuộc M04 về **vai** mà nằm trong `core/` về **đường**.
Một phép thử chỉ đọc đường dẫn sẽ báo vi phạm oan (`testcases.md §4`).

**③ MÔ PHỎNG — phá luật TRONG BỘ NHỚ, khôi phục trong `finally`.** Phá bằng cách
ghi file thật là đúng thứ `CẤM` nói, và một `assert` đỏ giữa đường sẽ bỏ qua phần
khôi phục nếu nó không ở `finally`.

**④ CODE — thêm bước CI thì KHÔNG dùng `continue-on-error`.** Và không bước nào
được `--fix` rồi commit: CI sửa dữ liệu là CI **che** lỗi.

## Bật một cổng mới: thứ tự bắt buộc

```
① viết cổng          → nó phải ĐỎ trên trạng thái hiện tại (không thì nó chưa đo gì)
② quy chủ cái đỏ     → của ai, từ lúc nào (git status + find -newermt)
③ sửa nguyên nhân    → hoặc mở ô backlog nếu chủ là người/agent khác
④ RỒI MỚI thêm vào ci.yml
```

Bỏ ③ mà làm ④ ⇒ CI đỏ ngay commit đầu, **và người ta sẽ bỏ qua nó**. Đó là cách
S3 mất răng, và `§2.4` của spec tồn tại vì đúng chuyện đó.

⚠️ Ngưỡng đã đo: **12/29 cổng từng vắng khỏi CI** — chúng là *kỷ luật*, không
phải *răng*. Một cổng không có trong `ci.yml` thì vế gate đó **không tồn tại và
không ai báo**.

## Không thuộc module này

| Việc | Đi đâu |
|---|---|
| luật kiểm nội dung | **M01** (`validate.py`) — M04 chỉ **chạy** luật |
| hợp đồng dữ liệu / schema | **M02** |
| fixture `dat-chuan.md` còn đạt chuẩn hay không | **M01 `AC-2.2.2`** — nhưng ca *"đạt chuẩn so với danh mục NÀO"* thì chưa có chủ (`testcases.md §cuối` mục 1) |
| `pyproject.toml` | ở **`core/`**, không ở gốc repo |
