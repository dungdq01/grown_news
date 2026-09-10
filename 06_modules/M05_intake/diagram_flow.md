# M05_intake — diagram flow

```mermaid
flowchart TB
    IN[/"người thả file .md<br/>_inbox/"/] --> C1

    C1{"có frontmatter?"}
    C1 -->|"không"| RET1(["TRẢ LẠI<br/>+ khung frontmatter tối thiểu"])
    C1 -->|"có"| C2

    C2{"khớp schema?<br/>dùng lại validate.py"}
    C2 -->|"thiếu trường"| RET2(["TRẢ LẠI<br/>+ danh sách thiếu<br/>KHÔNG tự điền"])
    C2 -->|"đạt"| C3

    C3{"citations_sampled >= 2<br/>và verified >= sampled?"}
    C3 -->|"không"| RET3(["TRẢ LẠI<br/>người phải mở link"])
    C3 -->|"có"| WRITE

    WRITE["ghi kb/&lt;type&gt;/&lt;slug&gt;.md<br/>origin: external<br/>review_status: draft"]
    WRITE --> KB[("kb/**")]
    KB --> HUMAN{{"NGƯỜI duyệt<br/>ngoài module này"}}

    style RET1 fill:#fee,stroke:#c00
    style RET2 fill:#fee,stroke:#c00
    style RET3 fill:#fee,stroke:#c00
    style HUMAN fill:#ffd,stroke:#a80
```

Ba đường trả lại, một đường vào. Đường vào **luôn** kết thúc ở `draft` — không có
nhánh nào tới `approved`.

## Hai đường vào kho, cùng đích

```mermaid
flowchart LR
    SRC1[/"link/file"/] --> M01["M01_core<br/>6 pass + 8 cổng"]
    SRC2[/"bản .md từ agent khác"/] --> M05["M05_intake<br/>gác cửa + spot-check"]
    M01 -->|"origin: pipeline"| KB[("kb/ · draft")]
    M05 -->|"origin: external"| KB
    KB --> HUMAN{{"NGƯỜI"}}
    HUMAN -->|"approved"| KB

    style KB fill:#fee,stroke:#c00,stroke-width:3px
```

Hai module, hai `origin` khác nhau, **cùng một trạng thái ra**: `draft`.
