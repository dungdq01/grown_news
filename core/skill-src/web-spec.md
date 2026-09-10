# Lớp web — bài của bạn được đọc như thế nào

> Tài liệu này cho NGƯỜI VIẾT BÀI, không cho người dựng web. Nó trả lời đúng một
> câu: *thứ tôi ghi vào frontmatter và thân bài sẽ hiện ra ở đâu, và cái gì làm
> bài không hiện ra được.*
>
> **Đã viết lại ở FR-029/T01-8.** Bản trước mô tả một kiến trúc Next.js + Postgres
> chưa bao giờ được dựng, và mang ba lời khai nay đã sai: trường `tags`, `category`
> là enum đóng, và "nguồn chân lý luôn là file `.md` trong git". Giữ nguyên chúng
> thì skill dạy người viết một hệ thống không tồn tại.

## Nguồn chân lý — đọc kỹ, vì bản cũ nói ngược

**`kb/_kho.sqlite` là chân lý** (FR-034). File `.md` trong `kb/` là **export dẫn
xuất một chiều** DB → file, commit vào git để làm backup và để `git diff` đọc được
nội dung. Sửa file `.md` bằng tay **không** đưa thay đổi vào hệ thống — lần export
kế tiếp ghi đè nó.

Đường vào duy nhất là API. Bài của bạn đi qua `validate.py` trước MỌI lần ghi.

## Ba luật làm bài KHÔNG hiện ra

**Chỉ render `review_status: approved`.** `draft`, `edited`, `rejected` nằm ngoài
trang web hoàn toàn — kể cả trang nội bộ. Đây là ranh giới giữa kho làm việc và
nội dung công bố, và nó do NGƯỜI bật, không phải máy.

**Gộp theo `url_normalized`.** Nhiều bản phân tích cùng một nguồn hiện thành MỘT
bài, các bản khác là "cách đọc khác". Không bao giờ thành nhiều bài — làm vậy là
thổi phồng số lượng và tự đánh lừa mình.

**Nhãn `origin`.** Bài `origin: external` mang badge nêu rõ ai và công cụ nào sinh
ra. Người đọc cần biết bản này không do pipeline của kho tạo.

## Trường nào hiện ở đâu

| Chỗ trên trang | Trường |
|---|---|
| Tít | `one_liner` |
| Chuyên mục | `source_type` |
| Chuyên mục con | `archetype` — chỉ khi `source_type: repo` |
| Chủ đề | `category` |
| Nhãn kỹ thuật | `concepts` |
| Ngày đăng | `analyzed_at` |
| Nguồn gốc | `origin`, `origin_tool` |
| Độ tin | `credibility_max` — để lọc và hiển thị |
| Ưu tiên | `skill_candidates[].priority` — quyết định thứ tự lưới |
| Cảnh báo | `unverifiable_citations`, `contradicted_by` không rỗng |
| Bài liên quan | trùng `concepts` — không phải embedding toàn bài |

**Không có trường `tags`.** Bản trước liệt nó ở hàng "Thẻ"; schema chưa bao giờ có
nó. Nhãn kỹ thuật là `concepts`, và nó lấy từ danh mục kiểm soát.

**`category` KHÔNG còn là enum đóng.** Schema chỉ ép dạng kebab-case; chân lý của
danh mục chủ đề là bảng `categories` trong `kb/_kho.sqlite`, kiểm qua
`validate.py --categories`. Giá trị không có trong bảng làm validate đỏ — nhưng
thêm chủ đề mới là việc làm được trên web, không phải sửa schema. Không thuộc mảng
nào thì `category: []`; đừng nhồi một giá trị để lấp trường.

## Trang bài — thứ tự theo mức cam kết của người đọc

1. **Tít + sapo** — quyết định đọc tiếp trong 5 giây.
2. **Hộp metadata** — `author`, `published_at`, `license`, `credibility_max`,
   `decay_risk`, `analyzed_at`, `version_id`, badge `origin`. Đặt ngay dưới sapo vì
   nó lọc được nhiều người đọc.
3. **Cảnh báo** — `unverifiable_citations: true` hoặc `contradicted_by` không rỗng
   ⇒ dải cảnh báo TRƯỚC thân bài.
4. **Thân bài** — năm mục render thẳng từ Markdown. Khung khai ở
   `assets/khung-than-bai.json`; đừng gõ lại tên mục từ trí nhớ.
5. **Đề xuất skill** — từ `skill_candidates`, hộp riêng, hiện `why_now` và
   `priority`.

Mọi locator dạng `[retry.py:44-71]` render thành liên kết dựng từ `url` +
`version_id`. Dùng `version_id` chứ không dùng nhánh — link theo nhánh trỏ sai sau
vài tháng. **Viết locator sai định dạng là mất liên kết**, không phải mất thẩm mỹ.

## Tìm kiếm

Hai chế độ, một ô nhập: **từ khoá** (full-text trên `one_liner`, `title`, thân bài)
và **khái niệm** (lọc theo `concepts`).

Vì `concepts` lấy từ danh mục kiểm soát nên đây là bộ lọc chính xác, không cần
embedding — truy vấn *"nguồn nào đã giải bài toán chống trùng bản ghi"* quy về
`concepts contains idempotency`. Đó là lý do **bịa một khái niệm ngoài danh mục
làm bài mất đường tra cứu**, chứ không chỉ làm validate đỏ.

## Kỹ thuật — một đoạn, đủ để hiểu hệ quả

Trang render **lúc request** (SSR) từ `web/render/`, đọc thẳng `kb/_kho.sqlite`.
Ghi một bài xong là F5 thấy ngay; không có bước build đóng băng.

Bài đọc được qua API dưới dạng JSON: `GET /api/articles/<source_type>/<slug>`.
Đường có **cả hai** đoạn — thiếu `source_type` là 404.

> Bản trước của mục này mô tả Next.js App Router + SSG/ISR, Postgres với
> `frontmatter jsonb`, và OG image động qua `@vercel/og`. **Không phần nào được
> dựng.** Đó là thiết kế của một giai đoạn trước, giữ lại trong lịch sử FR chứ
> không giữ ở đây — tài liệu skill phải nói hệ thống ĐANG chạy.
