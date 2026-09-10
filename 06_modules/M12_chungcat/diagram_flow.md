# M12_chungcat — diagram flow

> Vẽ từ, và phải khớp với, diagram tổng `04_system/` (ba vùng LÕI/THỢ/BIÊN).
> Mũi tên **ra Internet** chỉ được xuất phát từ khối THỢ — đó là `Z2` của ADR-05.

## Đường chính — một job đi hết vòng

```mermaid
flowchart TD
    U["người dùng<br/>(web, LÕI)"] -->|"POST /api/chungcat<br/>slug + loai"| W["web :8787<br/>LÕI"]
    W -->|"127.0.0.1<br/>job + ULID"| Q["tmp/ → os.replace → new/<br/>Maildir trong chungcat/"]

    Q --> R{"ULID đã có<br/>trong new/ ?"}
    R -->|"có"| SKIP["bỏ qua<br/>0 lời gọi model"]
    R -->|"chưa"| L["đọc nguyên liệu<br/>kb/_media/&lt;sha256&gt;<br/>(CHỈ ĐỌC)"]

    L --> D["đếm tỉ lệ ký tự Hán<br/>→ ngôn ngữ"]
    D --> T["tra model.json<br/>tác vụ × ngôn ngữ"]
    T --> E["MỘT cửa egress<br/>log sha256 TRƯỚC khi gửi"]

    E -->|"gọi RA · bậc 4"| API["nhà cung cấp model<br/>(khu vực khai trong bảng)"]
    API --> V["định vị lại quote<br/>re.finditer(re.escape(q))"]

    V --> C{"quote có thật<br/>trong nguồn ?"}
    C -->|"không"| REJ["từ chối khẳng định đó<br/>KHÔNG im lặng bỏ"]
    C -->|"có"| N["đếm citations_sampled<br/>+ citations_verified"]

    N --> O["ghi hàng BẢNG NHÁP qua API<br/>trang_thai: nhap · draft<br/>(FR-046)"]
    O --> NG["NGƯỜI duyệt<br/>(validate --strict pass)"]
    NG --> KB["kb/ — qua MỘT cửa ghi của LÕI"]

    E -.->|"lỗi"| RT{"đã thử 2 lần ?"}
    RT -->|"chưa"| E
    RT -->|"rồi"| STOP["dừng · job ở lại tmp/<br/>KHÔNG thử lần 3"]

    style E fill:#fdd,stroke:#a44,stroke-width:3px
    style KB fill:#dfd,stroke:#4a4,stroke-width:2px
    style REJ fill:#ffd,stroke:#a80
    style STOP fill:#ffd,stroke:#a80
```

## Ba chỗ đọc kỹ

**`E` (đỏ) — cửa egress duy nhất.** Mọi mũi tên ra Internet của cả hệ thống đi qua
đúng khối này. Log ghi **trước** khi gửi, nên một lần gửi bị timeout vẫn có dòng
log — đúng lúc cần biết nhất (`M12-R3`).

**`KB` (xanh) — M12 không có mũi tên nào trỏ thẳng vào đây.** Đường duy nhất là
bảng nháp (`FR-046`) → **người** duyệt → cửa ghi của LÕI. Vẽ một mũi tên trực
tiếp từ M12 vào `kb/` là vẽ vi phạm `M12-R1`.

⚠️ **Đổi 2026-09-02**: sơ đồ bản đầu vẽ `gate.py` trên đường của M12. Sau
`FR-046` thì **không** — `_inbox/`+`gate.py` là đường của bản **NGOÀI**. Rào thứ
hai của M12 nay là **mặc định `trang_thai: nhap`** của bảng nháp, không phải
`gate.py`. Vẽ sai chỗ này là vẽ một rào không tồn tại.

**`RT` — vòng thử lại có TRẦN, và trần đó là trần số lần dữ liệu rời máy**, không
phải trần chịu lỗi. Nhánh `STOP` để job lại `tmp/`: người chạy lại được, nhưng máy
thì không tự chạy lại.

## Chiều CẤM — vẽ ra để cổng biết đỏ vì gì

```mermaid
flowchart LR
    CC["chungcat<br/>THỢ"] -.->|"❌ M12-R1"| KB2["kb/**"]
    CC -.->|"❌ M12-R2"| AP["review_status:<br/>approved"]
    W2["web/api/**<br/>LÕI"] -.->|"❌ chiều ngược:<br/>web là CLIENT"| CC
    CC -.->|"❌ Z3: chỉ cong/ được<br/>nghe ngoài loopback"| NET["0.0.0.0:8790"]

    style KB2 fill:#fdd,stroke:#a44
    style AP fill:#fdd,stroke:#a44
    style NET fill:#fdd,stroke:#a44
```

Mũi tên thứ ba dễ đọc sai: `web` **được** gọi `chungcat` (nó là client duy nhất).
Chiều bị cấm là `chungcat` **phục vụ** một request do `web/api/**` khởi tạo theo
kiểu callback vào lại lõi — tức thợ điều khiển lõi thay vì lõi điều phối thợ.
