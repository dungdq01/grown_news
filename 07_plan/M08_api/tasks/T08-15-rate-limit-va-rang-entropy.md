# T08-15 — Rate limit hai chiều + răng cho entropy (`FR-049`)

> `FR-049` (đã duyệt) là **lỗ an ninh trong `FR-045` đã duyệt**:
> `ma_moi` một-lần + hết-hạn chặn *dùng lại* và *dùng muộn*, **không** chặn
> **thử hàng nghìn lần trong cửa sổ còn hiệu lực**. Hậu quả không phải *"đăng
> nhập sai"* — **đoán được mã là THÀNH người khác trong kho**.

## Đo trước: hai trong ba vế đã xong, một vế chưa được canh

| vế | trạng thái | |
|---|---|---|
| entropy | ✅ **256 bit** (`randomBytes(32)`) | nhưng **0 cổng canh** |
| log thất bại | ✅ có (`loiGhiAudit ok:false`) | có cổng rồi |
| **rate limit** | ❌ **không có gì** | — |

⚠️ Entropy là tính chất **đang đúng**, không phải **được bảo vệ**: đổi
`randomBytes(32)` → `Math.random()` thì **mọi test hiện tại vẫn xanh**. Đơn vị
này đặt răng cho nó, không chỉ dựng rate limit.

## Phạm vi

phạm_vi_ghi:
  - core/assets/nguong-loi.json   # MỚI — bảng khai ngưỡng
  - web/api/dungchung.mjs         # đếm + phép chặn (SQL sống ở đây)
  - web/api/loi-cua.mjs           # gọi phép chặn ở `quaCong`

**Không** chạm: `web/test/**` (đơn vị TEST `T08-15b` — `R1`) · `cong/**`
(ngôn ngữ chưa chọn) · `core/assets/frontmatter.schema.json` (FROZEN, vừa ký).

## Quyết định trong đơn vị này

**a · Đếm ở LÕI, không ở `cong/`.**
`M17 §0` khai ngôn ngữ `cong/` **chưa chọn** (Caddy · nginx · tự viết). Đặt
rate limit ở LÕI làm nó đúng với **cả ba** đường, và LÕI là chỗ **duy nhất**
biết một mã có tồn tại hay không.

**b · Chặn HAI CHIỀU — bỏ một chiều là bỏ một lớp.**

| chặn theo | không chặn được |
|---|---|
| **IP** | botnet nhiều IP thử **một** mã |
| **mã** | một IP thử **nhiều** mã |

**c · Bảng đếm trong DB, không trong RAM.**
RAM mất khi restart ⇒ kẻ dò chỉ cần đợi một lần khởi động lại. Và `web/` chạy
**một** tiến trình hôm nay, nhưng `ADR-05` mở đường cho nhiều — bộ đếm trong
RAM sẽ đếm **riêng từng tiến trình**, tức ngưỡng thật là `N × số tiến trình`.

**d · Đo bằng HÀNH VI, không bằng hình dạng mã.**
Bắn `N+1` → cái thứ `N+1` bị chặn. **Đổi ngưỡng → điểm chặn dời theo.**
Lý do đã ghi ở `M17 AC-3.4`: cổng `grep một số gõ cứng` **đỏ oan** với
Caddy/nginx, nơi số trong cấu hình **chính là** cách nó hoạt động.

**e · Ngưỡng ở bảng khai, cùng khuôn `07_curate/thresholds.yaml`.**
Và **kèm lý do từng số** — tiền lệ đó ghi thẳng *"CHƯA kiểm chứng"* cho cả ba
số của nó. Số phỏng đoán mà không khai là phỏng đoán thì lần sau không ai dám sửa.

**f · Chặn ⇒ ghi audit, KHÔNG kèm mã đã thử** (`M18-R2`).

**g · Cửa của NGƯỜI không bị đếm.** `POST /api/articles` là cửa của chủ dự án
trên `127.0.0.1`; đếm nó là tự khoá mình. `FR-024` đã một lần vỡ ở đúng đó.

## Tiêu chí

verifiability: hard
tiêu_chí:
  - AC1 (W1): bắn `N+1` request cùng IP ⇒ cái thứ `N+1` bị chặn
    cmd: cd web && node test/rate-limit.test.js
  - AC2 (W2): nhiều IP cùng thử MỘT mã ⇒ bị chặn theo mã
    cmd: cd web && node test/rate-limit.test.js
  - AC3 (W3): đổi ngưỡng trong bảng khai ⇒ **điểm chặn dời theo**
    cmd: cd web && node test/rate-limit.test.js
  - AC4 (W4): `randomBytes(n)` với `n ≥ 16`, và **không** `Math.random()` trong đường sinh mã
    cmd: cd web && node test/rate-limit.test.js
  - AC5 (W5): vượt ngưỡng ⇒ audit tăng; và dòng log **không chứa mã**
    cmd: cd web && node test/rate-limit.test.js
  - AC6 (g): `POST /api/articles` **không** bị đếm
    cmd: cd web && node test/rate-limit.test.js
  - AC7: không hồi quy
    cmd: cd web && npm test

⚠️ **AC3 là vế phân biệt cổng THẬT với cổng hình thức.** Một cổng chỉ bắn `N+1`
sẽ xanh trên một cài đặt **gõ cứng đúng số đó**. Đòi điểm chặn **dời theo** khi
bảng khai đổi là thứ chỉ một cài đặt đọc-từ-bảng-khai làm được.

## Đỏ TRƯỚC

`R5`: `T08-15b` viết `test/rate-limit.test.js` **trước**; nó phải ĐỎ vì
`nguong-loi.json` và phép chặn chưa tồn tại.

phụ_thuộc: T08-12 (năm cửa), T08-14 (bảy cửa) — đã xong
