# M15_kenh — diagram flow

> Khớp diagram tổng `04_system/`. M15 ở **BIÊN**, và nó là vùng BIÊN duy nhất
> **không nghe gì** — nó **kéo**.

## 1 · Mọi mũi tên đều đi RA — không có mũi tên nào đi vào

```mermaid
flowchart TD
    TG["Telegram API<br/>getUpdates"]
    DC["Discord Gateway<br/>WebSocket"]
    K["kenh · BIÊN<br/>0 cổng listen"]

    K -->|"1· GỌI RA lấy tin<br/>long polling"| TG
    K -->|"1· GỌI RA mở gateway"| DC
    TG -.->|"tin nhắn về trên<br/>chính kết nối đó"| K
    DC -.->|"event về trên<br/>chính kết nối đó"| K

    K -->|"2· hỏi: chat_id này<br/>thuộc tài khoản nào ?"| W["web :8787 · LÕI"]
    W --> AU{"đã buộc<br/>tài khoản ?"}
    AU -->|"chưa"| TC["từ chối + NÓI RA<br/>+ audit_log"]
    AU -->|"rồi"| LN["3· tra bảng khai lệnh"]

    LN -->|"/hoi"| CB["chatbot :8788<br/>qua LÕI"]
    LN -->|"nạp nội dung"| NAP["POST /api/nhap<br/>→ draft (M05-R1)"]
    CB --> DICH["4· dịch phản hồi<br/>→ tin nhắn"]
    NAP --> DICH
    TC --> DICH
    DICH -->|"5· GỌI RA gửi"| TG
    DICH -->|"5· GỌI RA gửi"| DC

    style K fill:#ffd,stroke:#a80,stroke-width:3px
    style TC fill:#dfd,stroke:#4a4,stroke-width:2px
```

**Nét liền = M15 chủ động gọi. Nét đứt = dữ liệu về trên chính kết nối M15 đã mở.**
Không có mũi tên nào bắt đầu từ Internet và kết thúc ở một cổng của M15 — đó là
`M15-R1`, và nó là toàn bộ lý do M15 là *một tiến trình local* thay vì *một dự án
hạ tầng*.

**Khối xanh** — từ chối phải **nói ra**, không im lặng bỏ tin. Im lặng thì người
gửi không biết mình chưa được buộc tài khoản, và họ gửi tiếp mãi.

## 2 · Bốn việc, và cái thứ năm bị cấm

```mermaid
flowchart LR
    A["1· xác thực người gửi<br/>hỏi LÕI, KHÔNG tự giữ"] --> B["2· dịch lệnh<br/>bảng khai lenh.json"]
    B --> C["3· gọi API LÕI<br/>127.0.0.1"]
    C --> D["4· dịch phản hồi<br/>→ tin nhắn"]
    D -.->|"❌ M15-R4: mỗi `if` là<br/>một chút nghiệp vụ rò ra BIÊN"| E["5· quyết định gì<br/>về nội dung"]

    style E fill:#fdd,stroke:#a44
```

Spec nói *"ba việc"*; sơ đồ vẽ **bốn khối** vì dịch-vào và dịch-ra là hai chiều của
cùng một việc dịch. Việc thứ năm là chỗ M15 dày lên, và nó dày **từng dòng một** nên
không ai thấy khoảnh khắc nó thành dày. `AC-2.3` (≤ 300 dòng/adapter) là phép đo cho
đúng chuyện đó.

## 3 · Chiều CẤM

```mermaid
flowchart LR
    K2["kenh<br/>BIÊN"] -.->|"❌ M15-R1"| P["mở cổng / webhook"]
    K2 -.->|"❌ M15-R2 · Z4"| KB["đọc kb/**"]
    K2 -.->|"❌ M15-R3 · FR-045"| AL["tự giữ allowlist"]
    K2 -.->|"❌ M15-R5 · B-D3b"| DR["gửi bản draft ra kênh"]
    K2 -.->|"❌ M15-R6"| SC["adapter dựa scraping"]

    style P fill:#fdd,stroke:#a44
    style KB fill:#fdd,stroke:#a44
    style AL fill:#fdd,stroke:#a44
    style DR fill:#fdd,stroke:#a44
    style SC fill:#fdd,stroke:#a44
```

Mũi tên thứ tư **không hoàn tác được**: tin nhắn đã gửi thì đã gửi. Một bản `draft`
ra Telegram là vượt toàn bộ vòng đời duyệt `M02 §2.2` bằng một đường khác.

## 4 · Vì sao hai kênh sau khác HẠNG, không khác độ khó

```mermaid
flowchart TD
    subgraph LO["tiến trình local — LÀM"]
        T["Telegram · long polling"]
        D["Discord · gateway WS"]
    end
    subgraph HT["dự án hạ tầng — HOÃN"]
        Z["Zalo · Bot API bot.zapps.me<br/>(gọi RA được, nhưng HOÃN theo chỉ đạo)"]
        F["Facebook · webhook<br/>+ app review"]
    end
    LO -->|"0 cổng · 0 chứng chỉ · 0 người trực"| OK["chạy trên máy chủ dự án"]
    HT -->|"cổng 443 · chứng chỉ · bề mặt tấn công"| NO["cần M17_cong hoặc hơn"]

    style LO fill:#dfd,stroke:#4a4
    style HT fill:#ffd,stroke:#a80
```

Zalo nằm ở nhóm hoãn **không** vì kỹ thuật — `research_summary` §10-6 xác nhận Bot
API chính thức đã tồn tại (`bot.zapps.me`, long-polling **giống Telegram**), tức nó
khớp mô hình chỉ-gọi-ra. Nó hoãn vì **chỉ đạo lượt 14**. Ghi rõ để lần sau không ai
đọc "hoãn" thành "không làm được".

Facebook thì khác hẳn: `research_summary` §3.3 — *"kéo bài về từ Facebook"* là
**tính năng không tồn tại**. Groups API gỡ khỏi mọi phiên bản **22/04/2024**; scraper
nguồn mở lớn nhất **tự nhận** không đáng tin cho production và ngừng push 6/2024.
