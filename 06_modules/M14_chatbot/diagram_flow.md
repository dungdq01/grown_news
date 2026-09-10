# M14_chatbot — diagram flow

> Khớp diagram tổng `04_system/`. M14 ở **THỢ** — và `spec_overview` đã đính chính
> một lần: bản đầu xếp nó vào LÕI, sai, vì luật vùng nói về **ai gọi RA ngoài**,
> không nói về ai gọi tới mình.

## 1 · Một lượt hỏi, đi hết vòng

```mermaid
flowchart TD
    C1["web · client #1"] -->|"POST /hoi"| M14["chatbot :8788<br/>THỢ"]
    C2["kenh · client #2..n"] -->|"POST /hoi"| M14

    M14 -->|"POST /truy-hoi<br/>cau_hoi + pham_vi + nguon + k<br/>(FR-072 §1.1 · khoá chiều + aud)"| M13["truyhoi :8791"]
    M13 --> R{"M13 trả<br/>bao nhiêu hàng ?"}

    R -->|"0 hàng"| TC1["CODE quyết:<br/>khong-co-trong-kho"]
    R -->|"≥1 hàng"| PR["prompt CITATION-FIRST<br/>đưa đoạn TRƯỚC, viết sau"]

    PR --> EG["MỘT cửa egress<br/>log sha256 TRƯỚC khi gửi"]
    EG -->|"gọi RA · bậc 4"| API["nhà cung cấp model"]
    API --> PA["PARSE ra blocks[]"]

    PA --> VF["VERIFY từng quote<br/>re.finditer(re.escape(q))<br/>+ normalize hai phía"]
    VF --> S{"quote tìm thấy<br/>nguyên văn ?"}
    S -->|"có"| OK["trang_thai:<br/>da-xac-minh"]
    S -->|"không"| CO["trang_thai:<br/>chua-xac-minh<br/>(GẮN CỜ, không bỏ)"]

    OK --> OUT["JSON: blocks[] + tu_choi"]
    CO --> OUT
    TC1 --> OUT
    OUT --> C1
    OUT --> C2

    style VF fill:#dfd,stroke:#4a4,stroke-width:3px
    style CO fill:#ffd,stroke:#a80,stroke-width:2px
    style EG fill:#fdd,stroke:#a44,stroke-width:2px
```

**Ba chỗ đọc kỹ:**

`VF` (xanh) — **verify nằm SAU PARSE, TRƯỚC khi trả**. Đảo thứ tự thì không có gì
để verify. Đây là cổng tự cài, và nó bắt buộc vì mô phỏng format Anthropic **không**
thừa hưởng bảo đảm *"valid pointers"* của họ.

`CO` (vàng) — nhánh này **không bao giờ dẫn tới xoá**. Mọi repo khảo được đều
drop-im-lặng ở đúng chỗ này; ta gắn cờ. Số block vào phải **bằng** số block ra
(`M14-R1`).

`EG` (đỏ) — cùng luật egress với M12: một cửa, log trước khi gửi.

## 2 · Từ chối hai tầng — ai quyết cái gì

```mermaid
flowchart LR
    Q["câu hỏi"] --> A{"M13 trả 0 hàng ?"}
    A -->|"có"| C1["CODE:<br/>khong-co-trong-kho"]
    A -->|"không"| B{"ngoài phạm vi<br/>facet đang chọn ?"}
    B -->|"có"| C2["CODE:<br/>ngoai-pham-vi"]
    B -->|"không"| MD["MODEL đọc các đoạn"]
    MD --> D{"model khai<br/>co-nhung-mau-thuan ?"}
    D -->|"không"| ANS["trả lời"]
    D -->|"có"| K{"CODE kiểm:<br/>≥2 địa chỉ · phân giải được<br/>· HAI bản ghi khác nhau ?"}
    K -->|"đủ"| C3["co-nhung-mau-thuan<br/>+ LOG mọi lần bắn"]
    K -->|"thiếu"| BO["lời khai bị BỎ<br/>→ trả lời bình thường"]

    style C1 fill:#dfd,stroke:#4a4
    style C2 fill:#dfd,stroke:#4a4
    style C3 fill:#ffd,stroke:#a80,stroke-width:2px
    style BO fill:#ffd,stroke:#a80
```

Hai nhánh xanh do **code** quyết — đo được, lặp lại được. Nhánh vàng do **model**
tự khai, và đó là chỗ **chỏi luật gốc**: model sở hữu thước đo của chính nó.

Không đảo quyết định của chủ dự án; thu hẹp bằng khối `K`. Code **không** phán được
nội dung có ngược nhau, nhưng chặn được lần từ chối **không trỏ vào đâu cả**. Nhánh
`BO` là chỗ lời khai thiếu bằng chứng bị bỏ — và nó **không** thành một lỗi, chỉ
thành một câu trả lời bình thường.

## 3 · Chiều CẤM

```mermaid
flowchart LR
    M["chatbot<br/>THỢ"] -.->|"❌ M14-R4: web là CLIENT,<br/>không phải chủ sở hữu"| W["phụ thuộc web/ để chạy"]
    M -.->|"❌ M14-R5 · FR-045 U6"| PH["bảng phien"]
    M -.->|"❌ M14-R1"| DR["bỏ im lặng<br/>block hỏng"]
    M -.->|"❌ M14-R6"| TH["ngưỡng bm25 thô"]
    M -.->|"❌ Z7"| UI["trả HTML"]

    style W fill:#fdd,stroke:#a44
    style PH fill:#fdd,stroke:#a44
    style DR fill:#fdd,stroke:#a44
    style TH fill:#fdd,stroke:#a44
    style UI fill:#fdd,stroke:#a44
```

Mũi tên đầu là cái đắt nhất. Nó không hỏng bằng một exception — nó hỏng bằng việc
**kênh thứ hai tốn gấp đôi công kênh thứ nhất**, và lúc đó đã muộn. `M8.2 ≤ 20%` là
phép đo được đặt sẵn cho đúng chuyện đó.

## 4 · Vì sao KHÔNG có mũi tên M14 → M13 lần thứ hai

```mermaid
flowchart TD
    P["prompt citation-first<br/>đoạn TRƯỚC, viết sau"] --> M["model viết"]
    M --> V["verify"]
    V -.->|"❌ AC-5.2: KHÔNG gọi M13<br/>lần hai để 'tìm chỗ đỡ'"| M13b["truyhoi"]

    style M13b fill:#fdd,stroke:#a44
```

`research_summary` §11: **57%** citation kiểu generate-then-cite là
**post-rationalization** — model viết xong rồi đi tìm chỗ đỡ. Một lời gọi M13 thứ
hai *sau khi model đã viết* chính là cài đặt của cái 57% đó. Một lượt hỏi = **một**
lời gọi M13, **một** lời gọi model.
