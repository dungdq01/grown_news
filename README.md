# Grown_news

> **Chạy dự án:** [`RUNNING.md`](RUNNING.md) — cài đặt, lệnh hằng ngày, khi hỏng.

Tờ báo tri thức kỹ thuật của riêng tôi. Nguồn ngoài kia vô hạn, thời gian thì không — đây là cái phễu.

Một link vào, một bài báo đã thẩm định ra.

## Vòng chảy

```
dán link vào Claude Code
  → skill source-distiller chạy 6 pass
  → kb/<loại>/<slug>.md            review_status: draft
  → pre-commit hook chạy validate.py, sai format thì chặn
  → tôi đọc, sửa, đổi thành approved     ← cổng người DUY NHẤT
  → git push
  → web build, chỉ render bài approved
```

Mọi bước đều tự động trừ một bước: duyệt. Đó là chủ ý — giữ quyền biên tập mà không làm việc tay chân.

## Ba vùng

```
core/  ──sinh ra──>  kb/  <──chỉ đọc──  web/
```

```text
core/           Python. Sinh và kiểm file. Không biết gì về web.
  src/source_distiller/validate.py
  assets/frontmatter.schema.json
  tests/                              13 test, mỗi test một luật
kb/             HỢP ĐỒNG — nguồn chân lý
  concepts.yaml
  repo/ paper/ video/ article/ docs/ announcement/
web/            Next.js. Chỉ đọc kb/, không bao giờ ghi. Chưa dựng.
.githooks/pre-commit
```

`kb/` **không thuộc** core cũng **không thuộc** web. Core ghi vào đó, web đọc từ đó, hai bên không gọi thẳng nhau. Nhờ vậy hai nhánh phát triển song song: đổi cách render không đụng core, đổi cách phân tích không đụng web. Chỉ khi **format** đổi thì cả hai mới phải đổi — và đó đúng là lúc cần cả hai cùng biết.

Nguồn chân lý luôn là file `.md` trong git. Database (nếu có sau này) chỉ là cache dẫn xuất, xóa đi dựng lại từ `kb/` được.

Mỗi vùng có README riêng: [core/](core/README.md) · [kb/](kb/README.md) · [web/](web/README.md)

## Cài

```bash
cd core && pip install -e ".[dev]"
cd .. && git config core.hooksPath .githooks
```

## Dùng

**Thêm nguồn** — mở Claude Code trong thư mục này, dán link. Skill tự kích hoạt, sinh file vào `kb/`.

**Kiểm tay**

```bash
python core/src/source_distiller/validate.py kb/         # kiểm cả kho
python core/src/source_distiller/validate.py kb/ --fix   # sửa word_count
pytest core/tests -q                                     # kiểm chính các cổng
```

**Duyệt** — đọc file, sửa nếu cần, đổi `review_status: draft` → `approved`. Chỉ bài `approved` mới lên web.

## Ba nhịp

| Nhịp | Việc | Thời gian |
|---|---|---|
| Ngày | Nạp và duyệt bản mới | 20 phút mỗi bản |
| Tuần | Duyệt lô `concepts_proposed` | 15 phút |
| Tháng | Kiểm skill đã cài, gỡ cái không dùng | 30 phút |

Nhịp tháng dễ bỏ nhất vì không ai nhắc. Bỏ nó thì con số "đã sinh 12 skill" không nói lên điều gì.

## Ngưỡng đạt cho 10 nguồn đầu

Chạy 10 nguồn thật trước khi xây thêm hạ tầng: 3 repo, 2 paper, 2 video, 2 blog, 1 docs.

- Ít nhất 3/10 cho ra một insight tôi chưa biết và sẽ hành động theo
- Ít nhất 1 sinh ra skill tôi thực sự cài vào agent, và output của agent đổi theo hướng tốt hơn
- Thời gian duyệt trung bình dưới 20 phút mỗi bản

Không đạt thì vấn đề nằm ở giao thức hoặc cổng lọc — xây thêm hạ tầng chỉ làm scale một thứ chưa hoạt động.

## Giao thức

Skill `source-distiller` cài ở `~/.claude/skills/source-distiller/`. Hợp đồng output nằm trong `references/format.md` của skill đó.
