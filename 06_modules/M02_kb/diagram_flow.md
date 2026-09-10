# M02_kb — diagram flow

> Chạy chay bằng mermaid (socket `diagram` trống). Vẽ từ, và khớp với, F0 của
> `04_system/diagrams/flow-tong.md`. Map đổi ⇒ sửa hình.

## Vòng đời một bản phân tích

```mermaid
stateDiagram-v2
    [*] --> draft: M01 sinh (pipeline)
    [*] --> draft: M05 nạp (external)

    draft --> rejected: người loại<br/>+ reject_reason ≥5 ký tự
    draft --> approved: NGƯỜI duyệt
    draft --> edited: người sửa nội dung
    edited --> approved: NGƯỜI duyệt

    approved --> archived: nguồn đổi ⇒ M01 re-analyze<br/>đổi tên &lt;slug&gt;.v&lt;n&gt;.md
    archived --> [*]
    rejected --> [*]

    note right of approved
        CHỈ TRẠNG THÁI NÀY LÊN WEB
        Chỉ người ghi được — M02-R1
    end note

    note right of draft
        Máy chỉ ghi được vào đây.
        Prompt injection tệ nhất
        cũng dừng ở đây (sec §6)
    end note
```

## Ai chạm vào kho

```mermaid
flowchart LR
    M01["M01_core"] -->|GHI draft| KB[("kb/**")]
    M05["M05_intake"] -->|GHI draft<br/>origin: external| KB
    HUMAN{{"NGƯỜI"}} -->|GHI approved<br/>ranh giới quyền duy nhất| KB

    KB -->|chỉ đọc| M03["M03_web"]
    KB -->|chỉ đọc| M04["M04_ci"]
    KB -->|chỉ đọc| M06["M06_skillgen"]
    KB -->|chỉ đọc| M07["M07_curate"]

    M07 -.->|ĐỀ XUẤT gộp<br/>không ghi| HUMAN
    HUMAN -.->|chốt| CON[("concepts.yaml")]

    style KB fill:#fee,stroke:#c00,stroke-width:3px
    style HUMAN fill:#ffd,stroke:#a80,stroke-width:2px
```

Hai mũi tên GHI, bốn mũi tên chỉ đọc. M07 nét đứt vì nó **đề xuất**, người ghi.
