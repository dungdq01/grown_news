# `kb-mock/` — kho bài MẪU

Dữ liệu để xem giao diện khi `kb/` còn rỗng. **Không phải dữ liệu thật.**

| | Thư mục | Ai ghi |
|---|---|---|
| Thật | `kb/` | M01_core (skill 6 pass) · M05_intake |
| Mẫu | `kb-mock/` | sinh từ contract, hoặc viết tay |

## Vì sao tách khỏi contract

Trước đó web đọc thẳng `05_uiux/contracts/analyses.sample.v3.json`. File đó có
**hai vai lẫn nhau**:

- **hợp đồng G5** — test đọc `_expected_render` để kiểm số liệu, **frozen**, sửa phải qua FR
- **kho bài mẫu** — web đọc để dựng bản `/mock/`, sửa thoải mái

Gộp làm một nghĩa là: thêm một bài mẫu ⇒ đụng contract ⇒ mở FR. Vô lý.

## Vì sao dùng `.md` chứ không phải JSON

`kb-mock/` dùng **đúng định dạng `kb/`**: `.md` + frontmatter. Bất kỳ thứ gì đọc
được `kb/` đều đọc được `kb-mock/` mà không sửa một dòng — validator, web, quét
kho, sinh skill.

Thêm bài mẫu = viết một file `.md`, không phải sửa JSON.

## Sinh lại

```bash
python core/tools/sinh_kb_mock.py
```

Đọc contract v5, sinh 15 bản ghi + 1 bản lưu trữ `.v1.md` (để kiểm luật
"bản lưu trữ không lên site").

## Kho này KHÔNG phải nguồn chân lý

Không đo M1 trên đây. Không sinh skill từ đây. Nó chỉ để nhìn.
