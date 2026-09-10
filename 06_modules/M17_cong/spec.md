# M17_cong — spec

> **Vùng BIÊN.** Nhận HTTPS từ Internet → xác thực → chuyển tiếp vào `127.0.0.1`.
> Nguồn: `FR-045` (4 bảng, cổng U1–U7) · `ADR-05` `Z3` ·
> `security_baseline` §1.1, §8.1 · `cong/README.md`.
>
> ⚠️ **Mọi `cmd` dưới đây trỏ vào lệnh CHƯA TỒN TẠI** — `cong/` chỉ có README, và
> **ngôn ngữ chưa chọn** (Caddy · nginx · tự viết; s4 quyết).

## 1 · Vì sao M17 tồn tại — và nó cứu được hai thứ

Chỉ đạo 2026-08-31: **5 tài khoản, mỗi người một session**. Đặt bề mặt Internet vào
`web/` thì phải **viết lại `M08-R1`** (*"localhost LÀ toàn bộ lớp bảo vệ"*) và sửa
`api-guard.test.js`. Đặt vào đây thì **cả hai giữ nguyên văn** — vì BIÊN vốn đã là
vùng được giao việc đối mặt Internet.

Cái giá: `Z3` phải có **ngoại lệ**. Nhưng ngoại lệ **khai trong bảng**
(`nghe_ngoai: true`) thì còn **đếm được**; ngoại lệ trong đầu người thì lần thứ hai
không ai biết là lần thứ hai.

> **AC-1.1** · `cong` là dịch vụ **DUY NHẤT** khai `nghe_ngoai: true` trong
> `core/assets/dich-vu.json`. Hai dịch vụ khai, hoặc `web` khai ⇒ đỏ (**U1**).
> `hard` · `cmd: python cong/tests/check_dung_mot_nghe_ngoai.py`

> **AC-1.2** · `web` **vẫn** bind `127.0.0.1`/`::1` sau khi M17 tồn tại; `api-guard`
> **không đổi một dòng** (**U2**).
> `hard` · `cmd: cd web && node test/api-guard.test.js`

> **AC-1.3** · `M08-R1` giữ **nguyên văn** — grep câu *"localhost LÀ toàn bộ lớp bảo
> vệ"* trong `06_modules/M08_api/rules.md` phải còn.
> `hard` · `cmd: python cong/tests/check_m08r1_nguyen_van.py`

## 2 · Bốn điều KHÔNG bao giờ

| | vì sao |
|---|---|
| **không ghi `kb/`** | nó **chuyển tiếp**, không phải cửa ghi (`FR-045` §2.4) |
| **không đọc `kb/`** | `Z4` — BIÊN không chạm kho, kể cả chỉ đọc |
| **không có key model** | `can_key_model: false`; không có gì để xác thực ⇒ không gọi model được |
| **không có giao diện** | `Z7` — giao diện thuộc `web/` |

> **AC-2.1** · `cong/` **không** đọc và **không** ghi `kb/**`; grep một đường dẫn
> `kb/` hoặc một `sqlite3` trong `cong/` ⇒ đỏ.
> `hard` · `cmd: python cong/tests/check_khong_cham_kho.py`

> **AC-2.2** · Biến môi trường của tiến trình `cong` **không** chứa khoá model nào
> — cưỡng chế bằng **cấu trúc**, không bằng lời hứa.
> `hard` · `cmd: python cong/tests/check_khong_co_key_model.py`

> **AC-2.3** · `cong/` không có file `.html`/`.css`/`.js` nào.
> `hard` · `cmd: python cong/tests/check_khong_giao_dien.py`

## 3 · `ma_moi` — cổng quan trọng nhất, và LỖ đã biết

`FR-045` U3: `ma_moi` **một lần** và **hết hạn**. Đây là nơi lỗi bảo mật sống:

> Buộc `chat_id ↔ account`. **Đoán được mã là THÀNH người khác trong kho.**

> **AC-3.1** · `ma_moi` dùng **một lần**: lần thứ hai ⇒ từ chối, và bảng ghi
> `dung_luc` (**U3**).
> `hard` · `cmd: python cong/tests/check_ma_moi_mot_lan.py`

> **AC-3.2** · `ma_moi` **có `het_han`**, và quá hạn ⇒ từ chối. Mã không có
> `het_han` ⇒ đỏ ở cổng, không phải phát hiện lúc bị dùng (**U3**).
> `hard` · `cmd: python cong/tests/check_ma_moi_het_han.py`

> **AC-3.3** · Mỗi lần buộc `chat_id` ghi `audit_log` (**U4**); buộc mà không có
> dòng log ⇒ đỏ.
> `hard` · `cmd: python cong/tests/check_audit_moi_lan_buoc.py`

### 3.1 · LỖ `FR-045` KHÔNG nêu — rate limiting

`security_baseline` §8.1, tìm thấy **sau** khi FR duyệt:

> `ma_moi` là một **bí mật đoán được** đặt trên một endpoint **hướng Internet**.
> Một lần + hết hạn chặn *dùng lại* và *dùng muộn* — chúng **không** chặn **thử
> hàng nghìn lần trong cửa sổ còn hiệu lực**.

Và hậu quả không phải *"đăng nhập sai"*: đoán được mã là **thành người khác trong
kho**.

> **AC-3.4** · Rate limit theo **IP** *và* theo **mã** trên đường xác thực.
> **Đo bằng HÀNH VI, không bằng hình dạng mã**: bắn `N+1` request → request thứ
> `N+1` bị chặn, và phản hồi nêu **thời gian chờ**. Đổi ngưỡng trong cấu hình rồi
> bắn lại ⇒ điểm chặn dời theo.
> Hai chiều là **hai luật khác nhau**: chặn theo IP không chặn được nhiều IP cùng
> thử **một** mã; chặn theo mã không chặn được **một** IP thử nhiều mã.
> `hard` · `cmd: python cong/tests/check_rate_limit.py`

⚠️ **Phép đo đổi từ "grep" sang "hành vi" vì phép thử s6.** `§0` khai *ngôn ngữ
`cong/` chưa chọn — Caddy · nginx · tự viết*. Ba đường đó đặt rate limit ở **ba chỗ**
khác nhau: hai đường đầu là **cấu hình**, đường thứ ba là **mã**. Một cổng đo bằng
*"grep một số gõ cứng ⇒ đỏ"* sẽ **đỏ oan** với Caddy — ở đó số trong cấu hình
**chính là** cách nó hoạt động. Đo hành vi thì cổng đúng với cả ba đường, và nó vẫn
đúng sau khi s4 chọn.

> **AC-3.5** · `ma_moi` có entropy **≥ 128 bit**. Một mã 6 số kiểu OTP ⇒ đỏ — ở đây
> **không có kênh thứ hai** để giới hạn số lần thử.
> `hard` · `cmd: python cong/tests/check_entropy_ma_moi.py`

> **AC-3.6** · **Mỗi lần thử thất bại** ghi `audit_log`. Không có nó thì không ai
> biết đang bị dò.
> `hard` · `cmd: python cong/tests/check_log_thu_that_bai.py`

⚠️ **Ba AC trên là một LỖ trong một FR ĐÃ DUYỆT**, không phải một quyết định mới.
`FR-045` §3 gọi đúng tên chỗ này rồi **bỏ sót phép chặn**. Cần **FR bổ sung** — spec
này khai chúng để s7 không chia task M17 mà thiếu ba cổng đó.

## 4 · Phân quyền — cột `vai` CHƯA ai đọc

`FR-045` U7: **không đường nào** cho account thường đặt `approved`.

Đo được: bảng `nguoi_dung` có cột `vai`, và **chưa ai đọc nó**. Nên hôm nay *"phân
quyền"* là **một cột trống**, không phải một cơ chế.

> **AC-4.1** · Không đường nào qua M17 cho phép `review_status` đi từ payload vào
> kho (**U7**). Chủ dự án vẫn là người **duy nhất** duyệt (`B-B1` không đổi một chữ).
> `hard` · `cmd: python cong/tests/check_khong_ai_tu_duyet.py`

> **AC-4.2** *(promote `soft` → `hard` 2026-09-02, `FR-051`)* · Cột `vai` được
> **đọc** ở **đúng MỘT** chỗ — `duocLam()` trong `dungchung.mjs`. Một cột tồn tại
> mà không ai đọc là một lời hứa phân quyền không có thật; một cột đọc ở nhiều
> chỗ là một lời hứa không ai kiểm được.
> `hard` · `cmd: cd web && node test/phan-quyen.test.js`

⚠️ **AC này `soft` suốt s6 vì một lý do đúng**, và nay hết lý do đó:

| | |
|---|---|
| lúc viết spec | `vai` là **cột trống**; câu *"khi nào bật phân quyền"* là quyết định của **người**, máy không đo hộ được |
| `FR-051` chốt ma trận (2026-09-02) | chủ dự án ✅ bốn quyền · đồng nghiệp ❌ bốn quyền |
| nay | phép đo tồn tại: `Y3` đếm chỗ đọc `.vai` = **1**, và `Y4` đòi DENY mặc định |

Đây là hình dạng ngược của `T04-6`: ở đó tôi **hạ** hai rule từ `S3` xuống `S4`
vì lệnh chưa có; ở đây **nâng** một AC vì quyết định đã có. Cùng một luật `R3`
đọc theo hai chiều — nhãn phải nói **đúng trạng thái hôm nay**, không phải trạng
thái mong muốn.

## 5 · Chuyển tiếp — và giữ được `M08-R1` nghĩa là gì

```
Internet → cong:443 (HTTPS, xác thực) → 127.0.0.1 → web:8787
```

M17 **không** thêm logic nghiệp vụ. Nó xác thực rồi chuyển tiếp.

> **AC-5.1** · M17 **không** đổi thân request khi chuyển tiếp (trừ header danh
> tính); so byte body trước/sau ⇒ bằng nhau.
> `hard` · `cmd: python cong/tests/check_chuyen_tiep_nguyen_ven.py`

> **AC-5.2** · Request **chưa xác thực** không tới được `web` — chặn tại M17.
> `hard` · `cmd: python cong/tests/check_chua_xac_thuc_khong_qua.py`

> **AC-5.3** · M17 **không** tự cấp danh tính: header danh tính nó thêm phải sinh từ
> `phien` hợp lệ, không từ payload.
> `hard` · `cmd: python cong/tests/check_khong_tu_cap_danh_tinh.py`

## 6 · Cái CỐ Ý không có

| | vì sao |
|---|---|
| mật khẩu | `security_baseline` §1.1 — `ma_moi` một lần, không mật khẩu để không phải quản lý reset/hash/rò |
| logic nghiệp vụ | nó chuyển tiếp; mọi quyết định ở LÕI |
| đọc/ghi `kb/` | `Z4` · `AC-2.1` |
| key model | `AC-2.2` — cưỡng chế bằng cấu trúc |
| giao diện | `Z7` |
| phân quyền theo `vai` | cột có, **chưa ai đọc** (§4) — nói ra thay vì để nó trông như đã có |
| WAF | `security_baseline` §8: không có form nhận nội dung tuỳ ý từ người lạ |
