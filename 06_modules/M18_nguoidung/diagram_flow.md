# M18_nguoidung — diagram flow

> Ba luồng: **mời một người** · **buộc một kênh** · **thu hồi**.
> Cả ba đi qua `M08_api`; không luồng nào chạm DB trực tiếp từ BIÊN (`Z4`).

## 1 · Mời một người — từ lúc sinh mã tới lúc có account dùng được

```mermaid
sequenceDiagram
    participant CD as chủ dự án
    participant W as M03_web · màn admin
    participant A as M08_api · LÕI
    participant DB as DB của LÕI (web/)
    participant AL as bảng audit_log

    CD->>W: tạo tài khoản cho một đồng nghiệp
    W->>A: POST — ten
    A->>DB: INSERT nguoi_dung (tao_luc do MÁY đặt)
    A->>DB: INSERT ma_moi (het_han BẮT BUỘC)
    A->>AL: sự kiện "cấp mã cho tài khoản N" — KHÔNG kèm mã
    A-->>W: trả mã MỘT LẦN, chỉ lần này
    CD->>CD: đưa mã cho người đó ngoài hệ thống
```

⚠️ **Mã trả về đúng một lần và không lưu lại chỗ nào đọc được.** Nếu màn admin
xem lại được mã đã cấp, thì mã thôi là bí mật một-lần — nó thành một bí mật nằm
trong một màn hình. `M18-R2` canh vế log; vế màn hình là `AC-2.1`.

## 2 · Buộc một kênh — và cả ba nhánh đều ghi audit

```mermaid
flowchart TD
    S["người gửi mã qua Telegram"] --> K["M15_kenh · BIÊN"]
    K -->|"hỏi qua API"| A["M08_api · LÕI"]
    A --> Q{"UPDATE ma_moi<br/>WHERE dung_luc IS NULL<br/>rồi đọc changes()"}

    Q -->|"changes() = 1"| OK["INSERT dinh_danh_kenh"]
    Q -->|"changes() = 0<br/>đã dùng hoặc hết hạn"| NO["từ chối"]
    Q -->|"mã không tồn tại"| NO

    OK --> AL["audit_log: buộc thành công"]
    NO --> AL2["audit_log: thử thất bại<br/>KHÔNG kèm mã đã thử"]
    NO --> MSG["thông báo KHÔNG phân biệt<br/>'lạ' với 'có nhưng chưa buộc'"]

    style Q fill:#ffd,stroke:#a80,stroke-width:3px
    style MSG fill:#fdd,stroke:#a44,stroke-width:2px
```

⚠️ **Khối vàng là chỗ dễ viết sai nhất của cả module.** Cách trực giác là
`SELECT` xem mã còn không, rồi `UPDATE`. Hai câu, và giữa hai câu có một khe —
`M18-R1`. Với 5 tài khoản khe đó gần như không bao giờ trúng, **và đó chính là
điều làm nó nguy hiểm**: nó chỉ đỏ vào đúng ngày hai người bấm cùng lúc.

⚠️ **Khối đỏ không phải chuyện lịch sự.** Hai thông báo phân biệt được biến cửa
này thành một **phép đếm tài khoản** cho người lạ (`AC-3.3`, `FR-047 V6`).

## 3 · Thu hồi — và vế người ta hay quên

```mermaid
flowchart LR
    CD["chủ dự án"] --> W["màn admin"]
    W --> A["M08_api"]
    A --> U["UPDATE nguoi_dung<br/>SET trang_thai"]
    U --> P{"phiên đang mở<br/>của người đó?"}
    P -->|"lần dùng KẾ TIẾP"| X["từ chối"]
    P -->|"nếu KHÔNG kiểm lại"| Y["vẫn đọc được kho<br/>= thu hồi VÔ TÁC DỤNG"]

    style Y fill:#fdd,stroke:#a44,stroke-width:3px
```

⚠️ **Khối đỏ là một CVE có thật, không phải một lo xa.**
`CVE-2026-44560` (Open WebUI) ghi thẳng: *"revocation is ineffective"* — quyền bị
gỡ ở bảng, nhưng **ba trong năm** đường code không kiểm lại, nên phiên đang mở
vẫn đọc được. Nên phép đo của `AC-1.3` phải là **hành vi sau khi thu hồi**, không
phải *"cột đã đổi giá trị"*.

Và `NguoiDung` là **gốc** của ba bảng kia (`model_flow §1`), nên "thu hồi" là đổi
**một cột** mà hiệu lực phải lan tới **ba** bảng. Đó là hình dạng lỗi mà một
cổng đo-cột sẽ **xanh oan**.

## 4 · Ba luồng, một chỗ nghẽn cố ý

Cả ba đều đi qua `M08_api`. Đó không phải tiện tay — nó là `Z4`: **BIÊN không
chạm dữ liệu**. `M15_kenh` và `M17_cong` đều ở BIÊN, và đường đi vòng của chúng
(đọc DB trực tiếp cho nhanh) là thứ **không cổng nào hiện có bắt được** — nên
`M17 workflow.md §4` liệt nó thành một chỗ **DỪNG** thay vì một cổng.
