# M06_skillgen — diagram flow

## Năm cổng — thứ tự là luật

```mermaid
flowchart TB
    IN[/"skill_candidates[]<br/>trong bản approved"/] --> G1

    G1{"1 · CỔNG CỨNG<br/>credibility claimed|conflicted<br/>VÀ independent_sources == 1"}
    G1 -->|"có"| OUT1(["OUT_OF_SCOPE<br/>giữ dạng knowledge"])
    G1 -->|"không"| G2

    G2{"2 · thuộc $out_of_scope?"}
    G2 -->|"có"| OUT1
    G2 -->|"không"| G3

    G3{"3 · khớp capability<br/>kể cả ALIAS?"}
    G3 -->|"không"| NEW(["NEW"])
    G3 -->|"có"| G4

    G4{"4 · depth >= 4?"}
    G4 -->|"có"| OVER(["OVERLAP<br/>+ reason_rejected"])
    G4 -->|"không"| DEEP(["DEEPEN"])

    NEW --> P{"5 · priority >= 25?"}
    DEEP --> P
    P -->|"không"| BO(["không sinh nháp"])
    P -->|"có"| DRAFT["sinh SKILL.md NHÁP"]

    style G1 fill:#fee,stroke:#c00,stroke-width:3px
    style DRAFT fill:#efe,stroke:#0a0
```

**Cổng 1 thắng mọi cổng dưới.** Chạy cổng 2 trước cổng 1 cho ra `NEW` cho ứng viên
schema đã cấm — lỗi tôi mắc ở lượt kiểm đầu.

## Nháp đi đâu

```mermaid
flowchart LR
    KB[("kb/ approved")] -->|"chỉ đọc"| M06["M06_skillgen"]
    MAN[("skill-manifest.json<br/>năng lực hiện có")] --> M06
    M06 -->|"GHI"| SK[/"~/.claude/skills/&lt;name&gt;/SKILL.md<br/>NGOÀI REPO · dạng nháp"/]
    SK --> HUMAN{{"NGƯỜI<br/>viết thân, quyết định cài"}}
    HUMAN -.->|"M1.2 đo ở đây"| M1["skill_installed: true"]
    M1 -.->|"người điền tay"| KB

    style SK fill:#ffd,stroke:#a80
    style HUMAN fill:#ffd,stroke:#a80
```

M06 **không** ghi vào `kb/`. Vòng khép lại bằng tay người: người điền
`skill_installed` sau khi cài và thấy output agent đổi.
