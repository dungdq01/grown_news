# M04_ci — diagram flow

```mermaid
flowchart TB
    PR[/"PR hoặc push<br/>chạm core/ kb/ web/"/] --> SETUP

    subgraph JOB["job: test + validate · ubuntu-latest"]
        SETUP["setup-python 3.11<br/>PIN CỨNG · ADR-02"] --> DEPS["python -m pip install -e core[dev]"]
        DEPS --> T1["pytest core/tests -q<br/>19 test"]
        T1 --> T2["check_ci_teeth.py<br/>CI có đỏ được không"]
        T2 --> T3["check_version_pin.py<br/>3.11 khớp pyproject"]
        T3 --> T4["validate.py kb/<br/>8 cổng format"]
    end

    T4 -->|"exit 0"| XANH(["XANH<br/>nhịp ④ có evidence"])
    T1 -->|"exit != 0"| DO(["ĐỎ<br/>gác PR"])
    T2 -->|"exit != 0"| DO
    T3 -->|"exit != 0"| DO
    T4 -->|"exit != 0"| DO

    DO --> SUA["sửa, đẩy lại"]
    SUA --> PR

    style DO fill:#fee,stroke:#c00,stroke-width:2px
    style XANH fill:#efe,stroke:#0a0,stroke-width:2px
```

## Vì sao S3 và S4 là hai bề mặt

```mermaid
flowchart LR
    COMMIT["git commit"] --> HOOK{"pre-commit hook<br/>S4"}
    HOOK -->|"chặn"| STOP(["dừng ở máy"])
    HOOK -->|"--no-verify<br/>BỎ QUA trong 1 giây"| PUSH["push"]
    PUSH --> CI{"CI chạy LẠI validate<br/>S3"}
    CI -->|"đỏ"| GAC(["gác PR — không bỏ qua được"])

    style GAC fill:#fee,stroke:#c00,stroke-width:2px
```

Hook nhanh nhưng bỏ qua được. CI chậm nhưng ở chỗ agent không với tới. Chạy hai
lần không phải thừa — là hai bề mặt khác nhau của cùng một luật.
