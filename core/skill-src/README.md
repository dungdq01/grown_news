# source-distiller

Chắt lọc nguồn kỹ thuật thành tri thức dùng được. Đầu vào là repo, bài báo, video, blog, tài liệu hoặc release note. Đầu ra là một file `.md` theo format thống nhất, dùng được cho ba việc: học, bổ sung skill cho agent nội bộ, và hiển thị trên web.

Đây không phải công cụ tóm tắt. Khác biệt nằm ở kỷ luật: mọi kết luận neo vào địa chỉ cụ thể, mọi danh sách có trần cứng, và nguồn không phải code phải qua thẩm định độ tin cậy trước khi được dùng.

## Cài đặt

**Claude Code** — cài file `source-distiller.skill`, hoặc chép cả thư mục vào `~/.claude/skills/`.

**Gemini, Codex, hoặc chat khác** — dán nội dung `SKILL.md` làm system prompt. Nạp thêm file trong `references/` khi tới pass cần.

## Dùng

Dán link vào, không cần nói gì thêm. Skill tự kích hoạt và tự chọn lăng kính theo loại nguồn.

Hai đường nạp:
- **Động** — dán link, chạy đủ 6 pass.
- **Tĩnh** — upload file `.md` đã phân tích ở nơi khác, qua cổng kiểm hợp lệ. Xem `references/intake.md`.

Cả hai đường đều vào kho với `review_status: draft`. Không có ngoại lệ.

## Cấu trúc

```
SKILL.md                        giao thức 6 pass và 8 luật nền
references/
  source-types.md               6 lăng kính theo loại nguồn — Pass 0, 0.5
  archetypes.md                 6 archetype con của repo — chỉ khi nguồn là repo
  credibility.md                thang kiểm chứng 4 mức — Pass 3.5
  format.md                     hợp đồng output — Pass 5, đọc trước khi viết
  intake.md                     cổng nạp cho file upload từ ngoài
  skill-gap.md                  đối chiếu với skill sẵn có của agent
  web-spec.md                   lớp web đọc kiểu báo điện tử
assets/
  frontmatter.schema.json       validate frontmatter, parse YAML rồi validate
  concepts.seed.yaml            danh mục khái niệm kiểm soát, 22 mục khởi đầu
scripts/
  validate.py                   kiểm tự động 9 cổng máy (đọc khung khai)
  khung.py                      khung thân bài — đường dẫn xuất Python
examples/
  mau-dat-chuan.md              file mẫu đạt chuẩn, dùng để test script
```

## Validate

**Chưa cần cho tới khi bạn qua một trong hai mốc: mở đường tĩnh, hoặc trên 5 file mỗi tuần.** Với 10 nguồn đầu đọc tay thì bạn chính là validator, và còn kiểm được thứ script không kiểm nổi — insight có thật hay không.

```bash
pip install pyyaml jsonschema
cp assets/concepts.seed.yaml kb/concepts.yaml   # bắt buộc, xem bên dưới
python3 scripts/validate.py kb/                 # kiểm cả kho
python3 scripts/validate.py kb/ --fix           # ghi lại word_count cho đúng
python3 scripts/validate.py kb/ --json          # output cho CI
```

Không có `kb/concepts.yaml` thì script **báo lỗi**, không im lặng bỏ qua — cổng chống tự sinh khái niệm mà tự tắt trong khi mọi file vẫn báo `OK` là kiểu hỏng khó phát hiện nhất. Muốn tắt thì phải tắt tường minh bằng `--no-concepts`.

`word_count` là dữ liệu dẫn xuất, đừng khai bằng tay — chạy `--fix` để script ghi đúng số.

Script kiểm 9 cổng: khớp schema · `word_count` khai đúng và dưới trần · đủ mục `## n.` và mục con `### n.m` theo khung khai · phần dẫn nhập (mục 1+2) **≤25%** tổng số từ · `concepts` và `category` nằm trong danh mục · mục 3.4 đủ 5 dòng bullet và không quá 5 tinh túy · mục 3.2/3.3/3.4/4 có locator · file external đã spot-check ≥2 trích dẫn · `url_normalized` khớp hàm tính · bản bị loại có ghi lý do.

## Sáu ý tưởng nền

**Cổng chặn giữa các pass.** Mỗi bậc bắt buộc sinh artifact trước khi đi tiếp. Chống pha loãng ngữ cảnh — đọc tuyến tính rồi tóm tắt sẽ cho ra thứ bị chi phối bởi phần lặp nhiều nhất, không phải phần giá trị nhất.

**Định tuyến theo loại nguồn.** Đọc framework bằng lăng kính library sẽ ra một danh sách API và bỏ mất điều duy nhất đáng biết.

**Ba cổng chắt lọc.** Định nghĩa vận hành của "tinh túy": không hiển nhiên, chuyển giao được, có bằng chứng. Rớt một là loại.

**Thang kiểm chứng.** Code tự làm bằng chứng cho chính nó; bài viết và video thì không. Khẳng định mức `claimed` từ một nguồn duy nhất không bao giờ được thành skill.

**Danh mục khái niệm kiểm soát.** LLM chỉ được gán vào danh mục có sẵn, không tự sinh. Thiếu luật này thì sau 50 nguồn các khái niệm đồng nghĩa thành node riêng và hệ số kiểm chứng chéo mất ý nghĩa.

**Luật quan trọng nằm trong schema.** File từ ngoài bắt buộc spot-check 2 trích dẫn và bị khóa ở `draft`. Loại bản phân tích thì bắt buộc ghi lý do. Máy cưỡng chế được thì đừng trông vào việc LLM nhớ.

## Ba nhịp vận hành

| Nhịp | Việc | Thời gian |
|---|---|---|
| Ngày | Nạp và duyệt bản mới | 20 phút mỗi bản |
| Tuần | Duyệt lô `concepts_proposed` | 15 phút |
| Tháng | Kiểm skill đã cài, gỡ cái không dùng | 30 phút |

Nhịp tháng dễ bỏ nhất vì không ai nhắc. Bỏ nó thì con số "đã sinh 12 skill" không nói lên điều gì.

## Chưa có

- Fetch thật cho spot-check — script hiện kiểm `citations_verified` khai báo, chưa tự tải nội dung về đối chiếu
- `concepts.yaml` đầy đủ — nên lớn lên từ `concepts_proposed` của 10 nguồn đầu, đừng đoán trước
- `skill-manifest.json` mô tả năng lực agent hiện có
- Lớp web

## Bước đầu tiên nên làm

Chạy trên 10 nguồn thật trước khi xây bất cứ hạ tầng gì: 3 repo, 2 paper, 2 video, 2 blog, 1 docs. Output ghi vào một git repo, hết.

Ngưỡng đạt:
- Ít nhất 3/10 cho ra một insight bạn chưa biết và sẽ hành động theo
- Ít nhất 1 sinh ra skill bạn thực sự cài vào agent, và output của agent đổi theo hướng tốt hơn
- Thời gian duyệt trung bình dưới 20 phút mỗi bản

Không đạt thì vấn đề nằm ở giao thức hoặc cổng lọc, và xây hạ tầng chỉ làm scale một thứ chưa hoạt động.
