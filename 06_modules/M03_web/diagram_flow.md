# M03_web — diagram flow

## Build pipeline

```mermaid
flowchart TB
    KB[("kb/**/*.md<br/>10 bản ghi")] --> F1

    subgraph QUARTZ["Quartz v4 · 3 custom part"]
        F1{"filter approvedOnly<br/>review_status == approved"}
        F1 -->|"loại 4:<br/>3 draft + 1 rejected"| BIN(["không lên site"])
        F1 -->|"còn 6"| F2{"loại *.v&lt;n&gt;.md<br/>bản lưu trữ"}
        F2 --> EM["emitter mergeBySource<br/>gộp theo url_normalized"]
        EM --> SORT["sortByPriority<br/>KHÔNG theo analyzed_at"]
    end

    SORT --> OUT[/"5 bài trên site<br/>1 bài có 2 tab"/]
    TOK["05_uiux/tokens.css<br/>113 token"] -.->|"import, không gõ lại"| OUT
    IMG["public/ ảnh nền"] -.-> OUT

    style BIN fill:#fee,stroke:#c00
```

**Ba tầng số** — 10 bản ghi → 9 dòng màn *Tất cả* → 5 bài site. Không phải lệch
dữ liệu: mỗi tầng một phép lọc khác nhau.

**Thứ tự bắt buộc**: lọc `approved` **trước**, gộp **sau**. Ngược lại thì một bản
`draft` kéo bản `approved` cùng nguồn lên site.

## Điều hướng và cửa sổ đọc

```mermaid
stateDiagram-v2
    [*] --> SCR02: vào site
    SCR02: SCR-02 Trang chủ · 4 vùng
    SCR02 --> SCR00: bấm bài bất kỳ
    SCR00: SCR-00 App shell + cửa sổ nổi
    SCR00 --> SCR00: mở thêm bài<br/>lệch 28px
    SCR02 --> ALL: xem tất cả
    ALL: Màn Tất cả · 9 dòng
    SCR02 --> WAIT: xem chờ duyệt
    WAIT: Chờ duyệt · CHỈ HIỆN<br/>không ghi được kb/
    SCR02 --> SCR03: bấm concept
    SCR03: SCR-03 Tra cứu
    ALL --> SCR00
    SCR03 --> SCR00
    SCR00 --> [*]: Esc đóng cửa sổ

    note right of SCR00
        SPA routing giữ DOM state
        ⇒ cửa sổ sống qua điều hướng
        (kiểm tài liệu Quartz, F1)
    end note
```
