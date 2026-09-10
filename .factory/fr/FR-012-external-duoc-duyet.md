# FR-012 — Schema: bỏ khoá vĩnh viễn `review_status: const draft` cho origin external

mở_bởi: claude, 2026-08-19 — phát hiện khi thiết kế FR-011
tới: s6 (`core/assets/frontmatter.schema.json` — FROZEN, deny S1) · M02 spec §2.2
mức: sửa một allOf trong schema — cổng cứng của toàn hệ
trạng_thái: MỞ — thi hành theo plan người dùng đã duyệt 2026-08-19

## Vấn đề

`frontmatter.schema.json:549-563` (allOf origin external):

```json
"then": { "properties": { "citations_sampled": {"minimum": 2},
                          "review_status": {"const": "draft"} }, ... }
```

`const draft` áp **vĩnh viễn**, không phải chỉ lúc nạp. Hệ quả: mọi bài
`origin: external` — tức TOÀN BỘ hàng đi qua `_inbox/` + gate, chính là các bài
nằm ở màn Chờ duyệt — **không bao giờ approve được**, kể cả duyệt tay trong
editor: đổi sang `approved` là trượt `validate.py --strict` + trượt pre-commit
hook. Kho hiện có đúng 2 bài, đều external draft, nên mâu thuẫn chưa từng lộ.

Schema đang chỏi hai tài liệu trên nó:

- Vòng đời M02 spec §2.2: `draft ──người duyệt──> approved` — không ngoại lệ origin.
- M05-R1 nguyên văn: *"bản origin=external có review_status khác draft **khi ghi
  vào** kb/"* — luật nói về lúc VÀO KHO, schema khoá CẢ ĐỜI.

## Sửa — tối thiểu

Trong allOf external: **BỎ** `"review_status": {"const": "draft"}`. **GIỮ**
`citations_sampled >= 2` + required `[citations_sampled, citations_verified]`.
Không thêm gì khác. Bump `$comment` của allOf ghi con trỏ FR-012.

## Bất biến "external VÀO KHO ở draft" vẫn còn 3 răng

1. `gate.py:116` hardcode `moi["review_status"] = "draft"` — đường nạp duy nhất
2. `05_intake/test_gate.py -k draft_external` (AC-2.2.3) — test còn nguyên
3. M05-R1 (S3: schema allOf + pytest) — vẫn đúng theo nghĩa gốc "khi ghi vào"

Cái mất đi là khoá *vĩnh viễn* — thứ vốn dĩ sai spec. Sau sửa, external draft
→ approved đi đúng cổng người như mọi bài khác, và cổng approve còn khoá FR-001
(3 trường M1 bắt buộc).

## Kéo theo — sửa CÓ CHỦ ĐÍCH cùng đợt

- `core/tests/test_gates.py -k external`: nếu có ca assert external+approved bị
  schema chặn ⇒ đổi kỳ vọng, docstring ghi FR-012.
- Luận cứ "schema khoá const draft ⇒ không đường tới approved" trong FR-010,
  `M03_web/rules.md`, comment `server.mjs`, comment `no-write-path.test.js`
  ⇒ thay bằng luận cứ ba-răng (FR-011 §"Luận cứ FR-010 phải viết lại").
- Schema là FROZEN ⇒ sau sửa: `python core/tests/check_frozen.py --ky`.

## Nếu bác FR này

Duyệt-trên-web (FR-011) chỉ hoạt động với bài `pipeline`/`manual`; bài external
vĩnh viễn không approve được — ở đâu cũng vậy, web hay editor. Chọn có ý thức.
