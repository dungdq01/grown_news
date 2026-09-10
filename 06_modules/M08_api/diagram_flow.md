# M08_api — diagram flow

Vẽ từ, và khớp với, `04_system/diagrams/flow-tong.md` (F2 sau FR-011 có nhánh
"duyệt qua API"). Mọi mũi tên GHI đều đi qua nút validate — không có đường tắt.

```mermaid
flowchart TB
    NGUOI["người<br/>(trình duyệt, 127.0.0.1)"]
    FE["FE tĩnh<br/>web/plugins — READ-ONLY"]
    SRV["server.mjs (M03)<br/>entry + serve tĩnh"]
    API["web/api/* (M08)<br/>router + handler"]
    VAL["validate.py --fix → --strict<br/>(M01 — spawn, không viết lại)"]
    KB[("kb/&lt;type&gt;/&lt;slug&gt;.md<br/>nguồn chân lý — M02")]
    RE[("_recycle/&lt;type&gt;/&lt;slug&gt;.md<br/>thùng rác — ngoài kb/, ngoài build")]

    NGUOI -->|bấm| FE
    FE -->|"fetch literal /api/*"| SRV
    SRV --> API
    API -->|"GET: parse frontmatter → JSON view"| KB
    API -->|"POST/PUT/PATCH: compose .md → tmp"| VAL
    VAL -->|"exit 0 ⇒ rename nguyên tử"| KB
    VAL -.->|"exit ≠ 0 ⇒ 422 nguyên văn THIẾU/SAI/SỬA"| API
    API -->|"DELETE: rename, KHÔNG unlink"| RE
    RE -->|"restore (409 nếu kb đã có)"| KB
```

Ba điều diagram này cam kết:

1. **FE không chạm đĩa** — mọi thứ đi qua HTTP tới server local; bundle tĩnh
   deploy không có API vẫn nguyên chức năng đọc.
2. **Không mũi tên nào từ API thẳng vào `kb/`** cho thao tác ghi — bắt buộc ghé
   `validate.py` trước (M08-R2).
3. **Không mũi tên nào ra thùng rác vĩnh viễn** — DELETE dừng ở `_recycle/` (M08-R4).
