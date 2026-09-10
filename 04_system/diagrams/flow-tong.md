# Diagram — flow tổng hệ thống

> Socket `diagram` trống ⇒ chạy chay bằng mermaid, hợp lệ theo luật socket.
> Sinh từ `03_docs/spec_overview.md` + `project_map.yaml`. Map đổi ⇒ sửa hình.

## F0 · Toàn cảnh — bốn module, một chiều dữ liệu

```mermaid
flowchart LR
    subgraph nguon[" "]
        SRC[/"link · file<br/>repo·paper·video<br/>article·docs·announcement"/]
    end

    subgraph M01["M01_core · Python"]
        SKILL["skill source-distiller<br/>6 pass + 6 lăng kính"]
        VAL["validate.py<br/>8 cổng máy"]
    end

    subgraph M02["M02_kb · HỢP ĐỒNG"]
        MD[("kb/<loại>/<slug>.md<br/>nguồn chân lý")]
        CON[("concepts.yaml<br/>danh mục kiểm soát")]
    end

    subgraph M03["M03_web · Quartz"]
        FILTER["filter: approved only"]
        EMIT["emitter: gộp url_normalized"]
        SITE["site tĩnh"]
    end

    M04["M04_ci · GitHub Actions"]

    M08["M08_api · bàn biên tập<br/>127.0.0.1 (FR-011)"]

    SRC --> SKILL
    SKILL -->|"ghi<br/>draft"| MD
    MD --> VAL
    CON -.->|"kiểm concepts"| VAL
    VAL -->|"sai: CHẶN commit"| SKILL
    VAL -->|"đúng"| HUMAN{{"NGƯỜI<br/>duyệt"}}
    HUMAN -->|"approved"| MD
    HUMAN -->|"rejected<br/>+ reject_reason"| MD
    HUMAN -.->|"bấm trên web<br/>(khai 3 trường M1)"| M08
    M08 -->|"validate --strict<br/>rồi mới ghi"| MD
    MD -->|"CHỈ ĐỌC"| FILTER
    FILTER --> EMIT --> SITE
    M04 -.->|"gác PR"| VAL
    M04 -.->|"gác PR"| M01

    style HUMAN fill:#ffd,stroke:#a80,stroke-width:3px
    style MD fill:#e8f4e8,stroke:#484
    style M04 fill:#eef,stroke:#66a
    style M08 fill:#fef2e8,stroke:#a60
```

**Đọc hình**: một cổng người (ô vàng), sáu bước máy. **Bundle tĩnh** của
`M03_web` chỉ có mũi tên **vào** từ `M02_kb` — không có mũi tên ra, đó là
BRD B-C3 (bản FR-011). Đường ghi từ trình duyệt đi qua `M08_api` — tiến trình
local riêng người tự chạy, và mọi mũi tên của nó vào `kb/` đều xuyên qua ô
validate: người bấm, máy kiểm, rồi mới ghi.

---

## F1 · Ingest — link tới draft

```mermaid
sequenceDiagram
    autonumber
    actor U as Người
    participant S as skill 6 pass
    participant K as kb/
    participant H as pre-commit hook
    participant V as validate.py

    U->>S: dán link (không cần lệnh)
    S->>S: Pass 0 nhận loại + chọn lăng kính
    S->>S: Pass 0.5 chuẩn hoá về "văn bản có địa chỉ"
    S->>S: Pass 1-3 địa hình → trục → cơ chế
    alt nguồn KHÔNG phải code
        S->>S: Pass 3.5 thẩm định độ tin cậy
    end
    S->>S: Pass 4 ba cổng chắt lọc (tối đa 5)
    S->>S: Pass 4.5 gộp kho, tính hệ số chéo
    S->>K: Pass 5 ghi .md · review_status=draft
    U->>H: git commit
    H->>V: chạy 8 cổng
    alt sai format
        V-->>U: CHẶN + lỗi tiếng Việt + cách sửa
    else đúng
        V-->>H: exit 0
        H-->>U: commit thành công
    end
```

**Điểm chặn**: Pass 3.5 chỉ chạy cho nguồn phi-code — code tự làm bằng chứng cho
chính nó. Hook chặn **trước khi** file vào lịch sử git.

---

## F2 · Review — cổng người duy nhất

```mermaid
stateDiagram-v2
    [*] --> draft: skill sinh<br/>hoặc upload ngoài
    draft --> edited: người sửa
    edited --> approved: người duyệt
    draft --> approved: người duyệt
    draft --> rejected: loại
    edited --> rejected: loại
    approved --> edited: sửa lại sau
    rejected --> [*]

    note right of approved
        CHỈ trạng thái này lên web
        Chỉ NGƯỜI đổi được
    end note

    note right of rejected
        BẮT BUỘC reject_reason
        tín hiệu duy nhất
        để chỉnh cổng lọc Pass 4
    end note
```

Máy không có mũi tên nào tới `approved`. Đó là BRD B-B1. FR-011 thêm một BỀ MẶT
cho mũi tên của người (nút duyệt ở cửa sổ đọc, qua M08) — chủ thể vẫn là người:
3 trường M1 do người khai, code M08 không có default (`api-status.test.js`).

---

## F3 · Publish — approved tới web

```mermaid
flowchart TD
    PUSH["git push"] --> CI{"CI xanh?"}
    CI -->|đỏ| STOP["dừng, không deploy"]
    CI -->|xanh| BUILD["Quartz build"]
    BUILD --> T["transformer<br/>parse frontmatter"]
    T --> F{"review_status<br/>== approved?"}
    F -->|không| SKIP["bỏ qua<br/>draft·edited·rejected"]
    F -->|có| G["gộp theo url_normalized"]
    G --> N{"nhiều bản<br/>cùng nguồn?"}
    N -->|có| TAB["1 bài · các bản là tab"]
    N -->|không| ONE["1 bài"]
    TAB --> SORT["sắp theo priority<br/>KHÔNG theo ngày"]
    ONE --> SORT
    SORT --> OUT["site tĩnh"]

    style F fill:#ffd,stroke:#a80
    style N fill:#ffd,stroke:#a80
```

Hai ô vàng là hai chỗ phải viết plugin riêng — phần duy nhất Quartz không cho sẵn
(ADR-01).

---

## Phủ module — điều kiện đóng G4

| Module   | Xuất hiện ở |
| -------- | -------------- |
| M01_core | F0, F1         |
| M02_kb   | F0, F1, F2, F3 |
| M03_web  | F0, F3         |
| M04_ci   | F0, F3         |

Mọi module đều được phủ.
