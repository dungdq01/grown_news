# FR-049 · Rate limit + entropy ≥128 bit + log thất bại cho `ma_moi`

- **mở**: 2026-09-02 · **người quyết**: chủ dự án (*"mở cả 4, lần lượt tuần tự a - b - c - d"*)
- **trạng thái**: **ĐÃ ĐÓNG** 2026-09-02 · **thứ tự**: **a** — xong trước ba FR còn lại
- **tầng bị chạm**: s6 (`M18` promote 3 AC từ `soft` → `hard`) · s8 (`web/api/**`)

---

## 0 · Đây là LỖ TRONG MỘT FR ĐÃ DUYỆT, không phải tính năng mới

`security_baseline §8.1` ghi lại nguyên trạng:

> `ma_moi` **một-lần** + **hết-hạn** chặn *dùng lại* và *dùng muộn*, **không**
> chặn **thử hàng nghìn lần trong cửa sổ còn hiệu lực**.

Và hậu quả **không phải** *"đăng nhập sai"*:

> **Đoán được mã là THÀNH người khác trong kho.**

`FR-045` §3 gọi đúng tên chỗ này rồi **bỏ sót phép chặn**. `FR-047 §4` và
`FR-048 §6` đều **cố ý không gộp** — gộp một lỗ an ninh vào một FR về hợp đồng
là giấu nó ở chỗ không ai xem kỹ. Đây là FR nó đáng có.

## 1 · Đo trạng thái hôm nay

| vế | hôm nay | nguồn |
|---|---|---|
| entropy | ✅ **256 bit** — `randomBytes(32).toString("base64url")` | `dungchung.mjs` `loiCapMaMoi` |
| log thất bại | ✅ **có** — `loiGhiAudit({ok:false})` ở `C4`/`C7` | `loi-cua.mjs` |
| log **không chứa mã** | ✅ có cổng | `loi-cua.test.js` |
| **rate limit** | ❌ **KHÔNG CÓ GÌ** | — |

⚠️ **Hai trong ba vế đã xong khi thi công `FR-047`** — không cố ý, mà vì cách
cài đặt đúng tự mang chúng theo. Nhưng **chưa cổng nào canh entropy**, nên nó
là một tính chất **đang đúng** chứ không phải một tính chất **được bảo vệ**:
ai đó đổi `randomBytes(32)` thành `Math.random()` thì mọi test vẫn xanh.

⇒ FR này chủ yếu làm **hai** việc: dựng rate limit (chưa có), và **đặt răng**
cho hai vế đang đúng-nhưng-không-được-canh.

## 2 · Quyết định

**a · Rate limit đo bằng HÀNH VI, không đo hình dạng mã.**
Bắn `N+1` request → cái thứ `N+1` bị chặn. Đổi ngưỡng → **điểm chặn dời theo**.

> Lý do đã ghi ở `M17 AC-3.4` (sửa ở s6): một cổng `grep một số gõ cứng` chỉ
> đúng với đường **tự viết**; với **Caddy/nginx** thì số trong cấu hình **chính
> là** cách nó hoạt động ⇒ cổng **đỏ oan**. Và `M17 §0` khai ngôn ngữ `cong/`
> **chưa chọn**, nên phép đo phải đúng với **cả ba** đường.

**b · Chặn HAI CHIỀU: theo IP và theo MÃ.**
Hai chiều khác nhau, và bỏ một chiều là bỏ một lớp:

| chặn | không chặn được |
|---|---|
| theo **IP** | botnet nhiều IP cùng thử **một** mã |
| theo **mã** | một IP thử **nhiều** mã khác nhau |

**c · Ngưỡng ở BẢNG KHAI, không gõ cứng.** Cùng khuôn `thresholds.yaml` của
M07 và `dich-vu.json`. Cổng đọc ngưỡng **từ cùng nguồn** mà mã đọc — không thì
đổi ngưỡng là đổi hai chỗ, và chúng sẽ lệch.

**d · Vượt ngưỡng ⇒ ghi `audit_log`, KHÔNG kèm mã đã thử.** `M18-R2`.

**e · Entropy có cổng riêng.** Đo `randomBytes` + độ dài, và **đỏ khi thấy
`Math.random()`** trong đường sinh mã. Đây là vế *"đang đúng mà chưa được
canh"*.

## 3 · Cổng — mỗi vế một câu đỏ được

| | vế | đỏ khi |
|---|---|---|
| **W1** | rate limit theo IP | bắn `N+1` mà cái thứ `N+1` **qua** |
| **W2** | rate limit theo mã | nhiều IP cùng thử một mã mà không bị chặn |
| **W3** | ngưỡng đọc từ bảng khai | đổi ngưỡng trong bảng mà điểm chặn **không dời** |
| **W4** | entropy ≥128 bit | `randomBytes(n)` với `n < 16`, hoặc thấy `Math.random()` |
| **W5** | vượt ngưỡng có ghi audit | bắn quá ngưỡng mà `audit` không tăng |
| **W6** | dòng log không chứa mã | tìm thấy giá trị `ma` trong audit hoặc file lùi |

## 4 · Điều FR này KHÔNG làm

- **Không** chọn ngôn ngữ `cong/` — `M17 §0` để `s4` quyết, và FR này không
  ép: rate limit ở LÕI (`web/api/**`) là đủ cho cả ba đường.
- **Không** thêm CAPTCHA hay OTP thứ hai. `M17 testcases:62` đã khai vì sao
  OTP-6-số **sai hạng** ở đây: **không có kênh thứ hai** để giới hạn số lần thử.
- **Không** đụng `frontmatter.schema.json` (FROZEN).
- **Không** promote `M18 AC-7.1/7.2/7.3` từ `soft` sang `hard` cho tới khi
  `W1`–`W6` **chạy được** — đúng bài học `T04-6`: `hard` mà không có lệnh chạy
  được **thì nó là `soft`**.

## 5 · Vì sao FR này đi TRƯỚC ba FR còn lại

Ba FR kia (`FR-050` dữ liệu cá nhân · `FR-051` phân vai · `FR-052` cột `media`)
đều là **nợ có thể chờ**: chúng chặn một lần `push`, một tính năng, một truy
vấn. FR này chặn **một người lạ trở thành đồng nghiệp của bạn trong kho**.

Và nó là lỗ **đang mở** — năm cửa `C3`–`C7` đã chạy từ hôm nay.

---

## 6 · Đóng — `W1`–`W6` chạy được, và điều đo được làm đổi trọng tâm FR

**Thi công**: `T08-15` (code) + `T08-15b` (test), 2026-09-02.

| cổng | trạng thái |
|---|---|
| `W1` chặn theo IP | ✅ bắn `N+1` ⇒ chặn ở lần `N+1` |
| `W2` chặn theo mã | ✅ mỗi lần một IP khác ⇒ vẫn chặn (chiều IP không bắt được ca này) |
| `W3` ngưỡng từ bảng khai | ✅ đổi ngưỡng ⇒ **điểm chặn dời theo** |
| `W4` entropy ≥128 bit | ✅ `randomBytes(32)` + không `Math.random` + mã thật dài 43 ký tự |
| `W5` vượt ngưỡng ghi audit | ✅ audit tăng, và **không chứa mã** |
| `W6` cửa của NGƯỜI không bị đếm | ✅ `articles.mjs` không gọi `loiChoThu` |

`M18 AC-7.1/7.2/7.3` promote `soft` → `hard`. `check_g6a`: **18 hard / 0 soft**.

### Trọng tâm FR này KHÔNG phải chỗ tôi tưởng lúc mở

`§1` đo được **hai trong ba vế đã đúng sẵn** — entropy 256 bit và log thất bại,
cả hai đến từ `FR-047` **không cố ý**. Chỉ rate limit là chưa có gì.

Nhưng **0 cổng canh** hai vế đó: đổi `randomBytes(32)` → `Math.random()` thì
mọi test cũ **vẫn xanh**.

⇒ Phần lớn giá trị của FR này không phải *dựng thêm*, mà là **đặt răng cho hai
tính chất đang đúng mà không được bảo vệ**. **Một tính chất đúng tình cờ là
một tính chất sẽ mất tình cờ** — và nó mất im lặng, vì không có gì báo.

### Ba quyết định thi công không có trong FR gốc

**a · Đếm SAU khi khoá dịch vụ qua, không trước.** Ngược lại thì một người lạ
không có khoá cũng làm cạn quota của M15/M17 — `x-forwarded-for` do họ tự khai
— tức một cổng **chống dò** trở thành một cổng **gây DoS nội bộ**.

**b · Trả `429`, không `401`.** Hai ca khác nhau: người gọi **hợp lệ** cần biết
nên **chờ**, chứ không nên đi đổi khoá. Đây là cửa của MÁY đã xác thực nên nói
rõ không rò gì cho người lạ.

**c · Bảng `lan_thu` lưu BĂM của mã, không lưu mã.** Đủ để đếm *"cùng một mã bị
thử bao nhiêu lần"* mà không giữ bí mật nào — ai đọc được DB cũng không lấy
được mã từ đó. Đây là `M18-R2` áp cho một bảng `M18-R2` chưa biết là có.

### Vế từng để hở — ĐÃ ĐÓNG cùng lượt

**`429` nay có test HTTP thật.** `loi-cua-http.test.js` bắn liên tục qua HTTP và
nhận `429` ở **lần thứ 7** — cộng 4 request đã xác thực trước đó = **11 > ngưỡng
10**, khớp `nguong-loi.json`. Ba vế:

- nhận `429` chứ không `401`
- **vẫn** `429` khi thử lại ngay (không rơi về `401`)
- `POST /api/articles` **không** bị `429` — quota của máy **không khoá người**

⚠️ Ca đó cũng đo **gián tiếp** quyết định `§6a`: nó đặt ở **cuối** file, sau 7
request `401` ở đầu. Nếu thứ tự đếm ngược lại (đếm **trước** khi kiểm khoá) thì
7 request không-khoá đó đã đủ gần ngưỡng 10, và `429` sẽ đến **sớm hơn 7**.
Con số `7` là bằng chứng người-lạ-không-làm-cạn-được-quota.
