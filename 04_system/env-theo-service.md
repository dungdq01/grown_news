# `.env` theo service — cách set, và cái gì KHÔNG được ở đâu

- **mở**: 2026-09-03 · **s4** · **chốt bởi**: chủ dự án
- **chỉ đạo nguyên văn**: *"tôi muốn tất cả xác thực hay api key / token …
  bảo mật gì đó đều để trong `.env`, vì sau này tích hợp thì chúng ta cần lưu
  rất nhiều thứ ở env — zalo, tele, bank, fb… file `.env` cần tạo tương ứng
  từng module / services"*
- **liên quan**: `env_plan.md` · `ADR-05` · `B-E2` · `core/assets/dich-vu.json`

---

## 0 · Trạng thái TRƯỚC quyết định này — đo được

```bash
grep -rn "dotenv|--env-file|readFileSync.*\.env" web/ core/ Makefile   # => 0 dòng
```

`env_plan.md:73,77,95` khai **ba** file — `.env.tho` · `.env.bien` · `.env.loi`
— và **không file nào được nạp**. Cả ba là **văn xuôi**, không có cơ chế.

⇒ Hệ quả thật: `KHOA_DICH_VU` và `KHOA_PHIEN` chỉ sống khi ai đó **gõ tay biến
môi trường** trước khi khởi động. Chưa ai làm, nên bảy cửa `C1`–`C7` **chưa từng
chạy ngoài test**.

⚠️ Nên quyết định này **không nới lỏng** gì. Nó **lần đầu** cho ba file đó một cơ
chế.

## 1 · `B-E2` KHÔNG cấm `.env` — tôi từng đọc quá lời nó

`B-E2` nguyên văn:

> *"Mọi lời gọi model đi qua **một** module. `web/api/**` **không bao giờ gọi ra
> Internet**."*

Đó là luật về **EGRESS**, không phải về **chỗ chứa bí mật**. Không có tài liệu
nào trong dự án cấm `.env`.

Và **yêu cầu "mỗi service một `.env`" chính là cơ chế giữ `B-E2` đúng**: nếu
`.env` của `web/` không chứa khoá model, thì câu *"`web/` không có gì để xác
thực nên không gọi model được kể cả khi ai viết nhầm một dòng `fetch`"* vẫn đúng
**nguyên văn** — chỉ là thực thi bằng **file** thay vì bằng *"gõ tay"*.

⇒ Cách này **mạnh hơn** nguyên trạng, vì nguyên trạng không có cơ chế nào.

## 2 · Cơ chế: `node --env-file`

Node ≥20 có sẵn. **Không thêm dependency** — `ADR-02` ghét thêm phụ thuộc, và
`dotenv` là một phụ thuộc cho một việc runtime đã làm được.

```bash
node --env-file=web/.env web/server.mjs
```

Python (`core/`) đọc `os.environ` như hiện tại; `Makefile` nạp file tương ứng
trước khi gọi.

⚠️ **Không** nạp `.env` từ trong mã (`readFileSync` rồi tự parse). Nạp trong mã
nghĩa là đường dẫn file thành một tham số, và một tham số đường-dẫn là một chỗ
để đọc file khác.

## 3 · Một `.env` một service — tên theo `thu_muc` trong `dich-vu.json`

| file | vùng | chứa gì | **KHÔNG** chứa |
|---|---|---|---|
| `web/.env` | **LÕI** | `KHOA_DICH_VU` · `KHOA_PHIEN` · `LOI_DB` · `KB_DIR` | ⛔ **mọi khoá gọi RA** |
| `chungcat/.env` | THỢ | khoá model | token kênh · khoá LÕI |
| `truyhoi/.env` | THỢ | khoá model (nếu cần) | — |
| `chatbot/.env` | THỢ | khoá model | ⛔ `LOI_DB` (`U6` — M14 không chạm phiên) |
| `artifact/.env` | THỢ | khoá TTS / model | — |
| `kenh/.env` | BIÊN | token **Telegram · Zalo · FB** | ⛔ khoá model · ⛔ `LOI_DB` |
| `cong/.env` | BIÊN | chứng chỉ TLS · `KHOA_DICH_VU` | ⛔ khoá model · ⛔ `LOI_DB` |
| *(sau này)* `thanhtoan/.env` | THỢ | **token bank** | — |

**Token bank**: chủ dự án chốt 2026-09-03 — *"sau này có service payment rồi bỏ
vào"*. ⇒ **Không** đặt vào `web/.env`. Lý do không phải chỗ chứa, mà là **tiến
trình nào gọi ra ngân hàng**: nếu `web/api/**` gọi thì `B-E2` vỡ — không phải vì
`.env`, mà vì `web/` có một đường egress. Một service riêng giữ nguyên `B-E2`,
và cùng lý do đã chốt cho model: **một cửa ra, một chỗ audit**.

## 4 · ~~LỖ~~ ✅ ĐÃ BỊT 2026-09-03: ranh giới tiến trình rò xuống dưới

`web/api/dungchung.mjs:432`:

```js
env: { ...process.env, PYTHONIOENCODING: "utf-8" }
```

`web/` **spawn** `validate.py` và `xuat_kho.py`, truyền **toàn bộ** `process.env`
xuống. Nên:

> **Một `.env` cho mỗi service KHÔNG ĐỦ.** Mọi bí mật của `web/` chảy vào tiến
> trình Python con — và tiến trình đó chạy mã có `--fix` ghi vào kho.

⇒ Bắt buộc kèm: **danh sách TRẮNG biến được truyền xuống con.**

```js
// ĐÚNG — liệt kê tường minh
env: {
  PYTHONIOENCODING: "utf-8",
  KB_DIR: process.env.KB_DIR,
  SCHEMA_DIR: process.env.SCHEMA_DIR,
}
```

**Allowlist, không denylist** — cùng bài học `CVE-2018-8007` (đi vòng một
blacklist). Một denylist *"trừ `KHOA_*`"* sẽ bỏ sót biến thứ hai ai đó thêm sau.

### ✅ Đã thi công 2026-09-03

`dungchung.mjs#envCon` — allowlist **14 biến**, và **ba** chỗ spread đã gỡ:
`dungchung.mjs:432` · `:482` · `server.mjs:117`. Đo được: **10** biến truyền
xuống con, **0** bí mật.

Cổng ở `web/test/loi-cua.test.js` (§ENV) — **8 ca**, và nó đo **HÀNH VI** không
đo chữ: đặt ba bí mật (`KHOA_DICH_VU` · `KHOA_PHIEN` · `BANK_TOKEN`) vào
`process.env` rồi đòi **0 lọt**; cộng một biến lạ ⇒ **vắng** trong env con.

⚠️ Ca *"không phải denylist"* bản đầu regex chữ `denylist`/`blacklist` và nó khớp
**chính bình luận của tôi** trong `envCon`. Đổi sang đo hành vi: đặt một biến
ngoài allowlist ⇒ nó **vắng**. Lần thứ sáu trong phiên một literal trong chú
thích phá một phép đếm.

## 5 · `.env.example` — commit vào git

`.gitignore:5-6` đã có `.env*` + `!.env.example`, nên cơ chế **có sẵn**.

Mỗi service một `.env.example`: **tên biến + một dòng nó là gì**, giá trị để
trống hoặc `<đặt ở đây>`. Người clone mới biết phải đặt gì mà **không có bí mật
nào trong git**.

## 6 · Bốn luật, và mỗi luật một lý do đo được

**a · Service chỉ đọc `.env` của MÌNH.** Đếm được: `web/api/**` không nhắc tên
biến nào thuộc service khác.

**b · Truyền xuống tiến trình con là ALLOWLIST** — `§4`.

**c · `KHOA_DICH_VU` ≠ `KHOA_PHIEN`.** Đã cưỡng chế trong mã
(`loiKiemKhoaDichVu` **chặn thẳng** khi hai biến bằng nhau).
`CVE-2025-41258` (LibreChat, CVSS **8.0**): dùng **cùng một** secret cho session
trình duyệt và dịch vụ nội bộ ⇒ token session đi vòng **toàn bộ ACL một lúc**,
gồm cả **GHI**.

**d · Thiếu biến ⇒ FAIL-CLOSED.** `loiKiemKhoaDichVu` trả `false` khi
`KHOA_DICH_VU` rỗng ⇒ mọi cửa máy trả **401**. Quên đặt biến thì M15/M17 **không
gọi được LÕI** — hỏng **đúng chiều**. `CVE-2026-47713` là chiều ngược
(`user ? whereWithUser(user) : where({})` — thiếu danh tính thì trả **tất cả**).

## 7 · Cái file này KHÔNG quyết

- **Không** đổi `B-E2`. Luật egress nguyên văn, và `§1` chỉ **làm rõ** phạm vi nó.
- **Không** đổi `ADR-05`. Mỗi service một thư mục/tiến trình/cổng — `.env` theo
  service là **hệ quả** của nó, không phải ngoại lệ.
- **Không** mở `thanhtoan/`. Nó là phạm vi mới ⇒ một mục trong `proposal-3`.
- **`§4` ĐÃ thi công** 2026-09-03 (vế an ninh, làm trước). `§2` (`--env-file`)
  và `§5` (`.env.example`) **chưa** — xem `§8`.

## 8 · Nợ khi thi công — HOÃN tới lúc dev code

> **Chủ dự án chốt 2026-09-03**: *"`.env` để sau đi, cái đó lúc dev code sẽ làm
> luôn"*.
>
> ⇒ Ba nợ dưới đây **không phải bỏ quên** — chúng chờ đúng lúc: cơ chế nạp
> `.env` chỉ có nghĩa khi có một service thật cần nạp, và hôm nay chỉ `web/`
> chạy. Dựng `--env-file` cho bảy service chưa tồn tại là dựng bảy chỗ để lệch.
>
> ⚠️ **Vế `§4` (allowlist env con) KHÔNG hoãn** — nó đã làm, vì nó là an ninh
> của đường đang chạy, không phải hạ tầng của đường chưa có.

| | |
|---|---|
| `--env-file` chưa đấu vào lệnh khởi động nào | `Makefile` · `RUNNING.md` · `web/package.json` |
| ~~`:432` còn `...process.env`~~ | ✅ **xong** — `envCon`, ba chỗ, cổng 8 ca |
| chưa có `.env.example` nào | bảy service |
| `env_plan:73,77,95` khai file mà chưa ai nạp | trỏ sang file này thay vì khai lại |
| chưa có cổng cho `§6a` | *"service chỉ đọc `.env` của mình"* — đếm được, chưa đếm |
