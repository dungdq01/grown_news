# M16_artifact — diagram flow

> Khớp diagram tổng `04_system/`. M16 ở **THỢ**, và nó là module duy nhất **GHI vào
> `kb/_media/`** — tức module duy nhất có cơ hội phá byte (`M09-R1`).

## 1 · Một job artifact, đi hết vòng

```mermaid
flowchart TD
    U["người dùng bấm<br/>'tạo slide / giọng đọc / video'"] --> W["web :8787 · LÕI"]
    W -->|"POST /artifact<br/>slug + loai"| A["artifact :8792<br/>THỢ"]
    A -->|"trả NGAY job_id<br/>< 2 giây"| W

    A --> D{"bài có<br/>approved ?"}
    D -->|"không"| TC["từ chối<br/>0 lời gọi engine"]
    D -->|"có"| E["tra engine.json<br/>loai → engine"]

    E --> L{"engine chạy<br/>LOCAL ?"}
    L -->|"local: piper + ffmpeg"| LO["0 byte rời máy<br/>0 dòng log egress"]
    L -->|"cloud: Azure / FPT.AI"| EG["MỘT cửa egress<br/>log sha256 VĂN BẢN<br/>TRƯỚC khi gửi · bậc 4"]
    EG --> API["nhà cung cấp TTS"]

    LO --> MK["dựng file ở thư mục TẠM"]
    API --> MK
    MK --> META["nhúng địa chỉ vào<br/>METADATA (không pixel)"]
    META --> MV["os.replace vào kb/_media/<br/>nguyên tử"]
    MV --> DB["ghi bảng media<br/>la_dan_xuat = 1"]

    style EG fill:#fdd,stroke:#a44,stroke-width:3px
    style MV fill:#ffd,stroke:#a80,stroke-width:2px
    style DB fill:#dfd,stroke:#4a4,stroke-width:2px
    style TC fill:#dfd,stroke:#4a4
```

**Ba chỗ đọc kỹ:**

`EG` (đỏ) — TTS cloud gửi **toàn văn một bài** ra nước ngoài. Bậc 4, cùng hạng với
M12 gửi tài liệu nguyên liệu. Nhánh `LO` phải sinh **0** dòng log, và đó là cách nó
**chứng minh** không gửi gì (`M16-R4`).

`MV` (vàng) — dựng ở thư mục **tạm** rồi `os.replace` vào `_media/`. Không có bước
này thì một job bị giết giữa lúc ghi để lại **file nửa vời** trong kho hiện vật
(`AC-1.2`).

`DB` (xanh) — `la_dan_xuat = 1` là ranh giới cứu `M09-R1`: nó phân biệt artifact
(dựng lại được) với nguyên liệu người nạp (**không** dựng lại được).

## 2 · Quay ngược làm input — link ở metadata, theo từng loại

```mermaid
flowchart LR
    B["bài approved"] --> S["slide PPTX"]
    B --> P["PDF"]
    B --> AU["audio"]
    B --> V["video"]

    S -->|"hyperlink của shape"| K["kho · bài nguồn"]
    P -->|"#page=N"| K
    AU -->|"ID3 CHAP"| K
    V -->|"sidecar<br/>timestamp → URL"| K

    V -.->|"❌ M16-R3"| PX["URL vẽ trong<br/>khung hình"]

    style PX fill:#fdd,stroke:#a44
    style K fill:#dfd,stroke:#4a4
```

Bốn mũi tên về `K` là **lý do M16 tồn tại** thay vì chỉ xuất file: artifact phải
**quay ngược làm input**. Mũi tên đứt là cách làm mất điều đó — người xem không bấm
được, không copy được, và khi URL đổi thì phải **render lại cả video**.

## 3 · Chiều CẤM

```mermaid
flowchart LR
    A2["artifact<br/>THỢ"] -.->|"❌ M16-R1 · M09-R1"| X["xoá / ghi đè<br/>byte trong _media/"]
    A2 -.->|"❌ AC-2.1"| DR["sinh từ bài draft"]
    A2 -.->|"❌ M16-R3"| PX2["URL trong pixel"]
    A2 -.->|"❌ AC-1.1"| SY["chạy trong<br/>một HTTP request"]
    A2 -.->|"❌ Z7"| UI["giao diện"]

    style X fill:#fdd,stroke:#a44
    style DR fill:#fdd,stroke:#a44
    style PX2 fill:#fdd,stroke:#a44
    style SY fill:#fdd,stroke:#a44
    style UI fill:#fdd,stroke:#a44
```

Mũi tên đầu là mũi tên **không hoàn tác được** của cả dự án. M16 là module duy nhất
ghi vào `_media/`, nên nó là module duy nhất có cơ hội phá một PDF 30 trang mà người
dùng nạp bằng tay.

## 4 · Hai đường TTS — và vì sao thứ tự là dữ liệu, không phải ý kiến

```mermaid
flowchart TD
    T["cần giọng đọc"] --> A1{"Azure vi-VN<br/>còn quota ?<br/>500K ký tự/tháng ≈ 55 bài"}
    A1 -->|"còn"| U1["dùng Azure · CLOUD · bậc 4"]
    A1 -->|"hết"| F1{"FPT.AI<br/>còn quota ?<br/>100K free"}
    F1 -->|"còn"| U2["dùng FPT.AI · CLOUD · bậc 4"]
    F1 -->|"hết"| PI["piper LOCAL<br/>0 byte rời máy"]

    A1 -.->|"❌ tránh: đắt nhất, và tiếng Việt<br/>KHÔNG có ở model tốt nhất"| EL["ElevenLabs"]

    U1 --> KV{"Azure và FPT.AI<br/>CÙNG khu vực ?"}
    U2 --> KV
    KV -->|"không"| KH["phải khai TƯỜNG MINH<br/>cho_phep_cheo_khu_vuc<br/>(cùng luật M12-R5)"]

    style PI fill:#dfd,stroke:#4a4,stroke-width:2px
    style EL fill:#fdd,stroke:#a44
    style KH fill:#ffd,stroke:#a80,stroke-width:2px
```

Khối vàng là chỗ M16 **kế thừa** luật của M12: rơi dự phòng **chỉ trong cùng khu
vực pháp lý**, rơi chéo phải khai tường minh. Azure (Microsoft) và FPT.AI (Việt
Nam) gần như chắc chắn **khác** khu vực — nên đây không phải một ca lý thuyết, nó
là ca mặc định.

Khối xanh là đường **duy nhất** không gửi gì ra ngoài. Nó xếp cuối vì chất lượng,
nhưng nó là đường phải **luôn còn dùng được** — nếu cả hai cloud hết quota mà local
không chạy thì tính năng chết hẳn.
