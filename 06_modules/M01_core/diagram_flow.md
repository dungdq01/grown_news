# M01_core — diagram flow

```mermaid
flowchart TB
    SRC[/"link · file<br/>người dùng đưa"/] --> P1

    subgraph SKILL["skill source-distiller · ngoài repo"]
        P1["pass 1-2<br/>nhận dạng + đọc"] --> P3["pass 3-4<br/>trích + định vị"]
        P3 --> P5["pass 5<br/>tinh túy + chuyển giao"]
        P5 --> P6["pass 6<br/>chấm skill_candidates"]
    end

    P6 --> MD["file .md<br/>review_status: draft"]
    MD --> VAL

    subgraph VAL["validate.py · 8 cổng"]
        G1["1 frontmatter parse"] --> G2["2 khớp schema"]
        G2 --> G3["3 word_count + trần 1800"]
        G3 --> G4["4 đủ mục + mục con"]
        G4 --> G5["5 dẫn nhập ≤25%"]
        G5 --> G6["6 tinh túy ≤5, đủ 5 bullet"]
        G6 --> G7["7 locator ở mục 4,5,6"]
        G7 --> G8["8 external ⇒ spot-check ≥2"]
    end

    VAL -->|"exit 1<br/>+ danh sách lỗi"| FIX["sửa rồi chạy lại"]
    FIX --> VAL
    VAL -->|"exit 0"| KB[("kb/&lt;type&gt;/&lt;slug&gt;.md<br/>DRAFT")]
    KB --> HUMAN{{"NGƯỜI duyệt<br/>ngoài module này"}}

    style KB fill:#fee,stroke:#c00
    style HUMAN fill:#ffd,stroke:#a80
```

**Cổng chặn giữa các pass**: pass sau không chạy nếu pass trước chưa đạt. Hình
trên vẽ đường thành công; đường trượt quay lại pass đang đứng, không nhảy cóc.

Mũi tên cuối ra khỏi module: M01 **không** duyệt. Nó dừng ở `draft`.
