# core

Sinh và kiểm file `.md` trong `kb/`. **Không biết gì về web.**

Ranh giới: core chỉ ghi vào `kb/`. Nếu một ngày core cần biết web render thế nào, đó là dấu hiệu hợp đồng đã rò rỉ — sửa hợp đồng, đừng thêm phụ thuộc.

## Cài

```bash
pip install -e ".[dev]"      # hoặc: pip install pyyaml jsonschema pytest
```

## Dùng

```bash
python src/source_distiller/validate.py ../kb/           # kiểm cả kho
python src/source_distiller/validate.py ../kb/ --fix     # sửa word_count
python src/source_distiller/validate.py ../kb/ --json    # cho CI
kb-validate ../kb/                                       # nếu đã pip install -e
```

## Test

```bash
pytest tests -q
```

Mỗi test phá đúng một luật và khẳng định cổng tương ứng đóng. Test ở đây không kiểm "script chạy được" mà kiểm "luật có hiệu lực" — cổng nào mất hiệu lực mà không ai biết là kiểu hỏng nguy hiểm nhất, vì mọi file vẫn báo `OK` trong khi kho nhiễm dần.

## Tám cổng

| # | Cổng | Nguồn luật |
|---|---|---|
| 1 | Frontmatter khớp schema | `assets/frontmatter.schema.json` |
| 2 | `word_count` khai đúng và dưới 1800 | `format.md` |
| 3 | Phần dẫn nhập (§1+§2) ≤25% số từ | `khung-than-bai.json` |
| 4 | `concepts` nằm trong danh mục | `format.md` |
| 5 | Mục 6 đủ 5 bullet, tối đa 5 tinh túy | `format.md` |
| 6 | Mục 4/5/6 có locator | luật nền L2 |
| 7 | File external đã spot-check ≥2 trích dẫn | `intake.md` |
| 8 | Bản bị loại có ghi lý do | `format.md` |

Cổng quan trọng nhất nằm trong schema, không nằm trong script: **ứng viên skill có `credibility` là `claimed`/`conflicted` mà chỉ 1 nguồn độc lập thì không được `NEW` hay `DEEPEN`**. Máy cưỡng chế được thì đừng trông vào việc LLM nhớ.

## Thư mục

```
src/source_distiller/   code
assets/                 schema — nguồn của mọi ràng buộc máy đọc
tests/                  13 test, mỗi test một luật
skill-src/              bản nháp dùng để cập nhật gói .skill
```

## Quan hệ với skill

Skill `source-distiller` cài ở `~/.claude/skills/` là thứ *sinh ra* file. Core là thứ *kiểm* file. Hai bên dùng chung một schema — khi sửa schema, nhớ đồng bộ cả hai:

```
core/assets/frontmatter.schema.json
~/.claude/skills/source-distiller/assets/frontmatter.schema.json
```

`skill-src/` giữ bản nháp để đóng gói lại `.skill` khi cần.
