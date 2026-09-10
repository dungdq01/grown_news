# Flow đợt hai — ba vùng, sáu tiến trình

> s4 · 2026-08-31. Nguồn: `03_docs/spec_overview.md` · `04_system/adr.md#ADR-05` ·
> `core/assets/dich-vu.json`. Số cổng đọc từ bảng khai, **đừng gõ lại ở đây**.

## 1 · Ai gọi ai

```mermaid
flowchart LR
    ND(["người<br/>trình duyệt"])
    TG(["Telegram<br/>Discord"])
    MODEL(["model<br/>đám mây"])

    subgraph LOI["LÕI — không bao giờ gọi ra ngoài loopback"]
        WEB["web · 8787<br/>SSR + MỘT CỬA GHI<br/>+ chuẩn hoá output"]
        KB[("kb/<br/>_kho.sqlite<br/>_media/")]
    end

    subgraph THO["THỢ — nơi DUY NHẤT gọi ra Internet · có key model"]
        CB["chatbot · 8788"]
        TH["truyhoi · 8791"]
        CC["chungcat · 8790"]
        AF["artifact · 8792"]
    end

    subgraph BIEN["BIÊN — không nghe gì, kéo bằng long polling"]
        KE["kenh"]
    end

    ND -->|"HTTP"| WEB
    KE -->|"127.0.0.1:8787"| WEB
    TG -.->|"long polling<br/>kéo RA"| KE

    WEB --> CB
    WEB --> TH
    WEB --> CC
    WEB --> AF
    WEB <--> KB

    CB --> TH
    CC -.->|"POST /api/nhap<br/>→ draft"| WEB
    AF -.->|"POST /api/nhap"| WEB

    CB -.->|"egress"| MODEL
    CC -.->|"egress"| MODEL
    TH -.->|"egress"| MODEL
    AF -.->|"egress"| MODEL

    style LOI fill:#e8f4e8,stroke:#4a4,stroke-width:2px
    style THO fill:#fff4e0,stroke:#a80,stroke-width:2px
    style BIEN fill:#ffe8e8,stroke:#a44,stroke-width:2px
    style KB fill:#dde,stroke:#66a
```

**Ba điều đọc được từ hình:**

1. **`web` là nút duy nhất chạm cả ba phía** — người, kho, và mọi service. Đó là
   cái giá của *"chuẩn hoá output quy về web"*: một chỗ để sửa, cũng là một chỗ
   để chết.
2. **Không mũi tên nào đi thẳng từ `kenh` tới `chatbot`.** Nếu có, sẽ có **hai**
   nơi dựng output từ cùng một service, và chúng sẽ lệch.
3. **Mọi mũi tên `egress` xuất phát từ THỢ.** LÕI và BIÊN không có mũi tên nào
   tới `model` — và điều đó cưỡng chế bằng **biến môi trường**, không bằng lời
   dặn: chúng khởi động không có key (`security_baseline §3.1`).

## 2 · Một bản ghi đi vào kho bằng đường nào

```mermaid
flowchart TD
    A1["người gõ form trên web"] -->|"POST /api/articles"| G1["taoBai()"]
    G1 --> R1["review_status: approved<br/>origin: manual"]

    A2["người kéo file vào _inbox/"] --> G2["gate.py"]
    A3["máy: chungcat / artifact / kenh"] -->|"POST /api/nhap"| G2
    G2 --> R2["review_status: draft<br/>M05-R1 · vô điều kiện"]

    R1 --> V["validate.py --strict"]
    R2 --> V
    V -->|"đạt"| KHO[("kb/")]
    V -->|"trượt"| TL["trả lại + nêu ĐÚNG trường thiếu"]

    style R1 fill:#dfd,stroke:#4a4
    style R2 fill:#ffd,stroke:#a80,stroke-width:2px
    style TL fill:#fdd,stroke:#a44
```

**Chỗ dễ hiểu sai nhất của cả hệ**, đo được ở `web/api/articles.mjs:465-472`:

> `POST /api/articles` đặt `review_status = "approved"` **vô điều kiện**. Nó là
> cửa cho **người tự viết** — người viết chính là người duyệt.

Nên **máy KHÔNG được dùng cửa đó**. `POST /api/nhap` là cửa thứ hai, chạy đúng
`gate.py` và ép `draft`. Cùng một cài đặt, hai lối vào — viết hai bản là hai bản
sẽ lệch.

## 3 · Việc dài — API bất đồng bộ

```mermaid
sequenceDiagram
    participant W as web 8787
    participant C as chungcat 8790
    participant M as model

    W->>C: POST /chung-cat {nguon, chu_de}
    C-->>W: 202 {viec_id}
    Note over C,M: chạy PHÚT, không phải giây
    C->>M: gọi model (egress + log sha256)
    M-->>C: kết quả
    C->>W: POST /api/nhap → draft
    W->>C: GET /viec/<id>
    C-->>W: {trang_thai: xong, slug}
```

Ba câu **s4 chưa trả lời**, s6/s7 phải trả — xem `build_order.md`:
job chạy hai lần thì sao · thợ chết thì việc treo bao lâu · giới hạn thử lại.

Câu ba không thuần kỹ thuật: **mỗi lần thử lại là một lần tài liệu rời khỏi máy**
(`security_baseline §4b` bậc 4), và mỗi lần đều phải có log.

## 4 · Phủ module

| Module | Có trong hình |
|---|---|
| M01_core | trong `validate.py` (hình 2) |
| M02_kb | nút `kb/` |
| M03_web + M08_api | nút `web` |
| M05_intake | nút `gate.py` (hình 2) |
| M12_chungcat | `chungcat` |
| M13_truyhoi | `truyhoi` |
| M14_chatbot | `chatbot` |
| M15_kenh | `kenh` |
| M16_artifact | `artifact` |

M04_ci · M06_skillgen · M07_curate · M09–M11 không xuất hiện: chúng không phải
tiến trình chạy (CI, module ngang khai hợp đồng, công cụ chạy tay).
