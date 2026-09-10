# Environment plan

> s8 cần integration env — quyết ở đây, đừng để tới s9 mới hỏi.
>
> Dự án cá nhân chạy local ⇒ mô hình môi trường **rất mỏng**. Ghi rõ để s9 không
> dựng thừa, và để biết "chạy thật" nghĩa là gì với dự án này.

## Ba môi trường

| Env | Ở đâu | Ai chạy | Dùng để |
|---|---|---|---|
| **dev** | máy local | người | viết code, chạy test, sinh bản phân tích |
| **integration** | GitHub Actions runner | CI | chứng minh "máy xanh" độc lập với máy người |
| **prod** | GitHub Pages **private**, hoặc `npx quartz build --serve` local | CI deploy | đọc thật |

Không có staging. Với một người dùng và nội dung tĩnh, staging không thêm thông
tin gì mà integration chưa cho.

## dev

```bash
# core
cd core && pip install -e ".[dev]"
pytest tests -q
python src/source_distiller/validate.py ../kb/

# web (sau B3a)
cd web && npx quartz build --serve
```

**Vấn đề đã biết** (ADR-02): máy hiện tại có nhiều Python; bản có `jsonschema`
thiếu `pip`. Tạm thời chỉ định interpreter:

```bash
export PYTHON="C:/Users/Admin/AppData/Local/Programs/Python/Python39/python.exe"
```

Hook `.githooks/pre-commit` đã tôn trọng biến `PYTHON`. **B1 phải dọn việc này** —
pin 3.11, một interpreter duy nhất.

## dev đợt hai — SÁU tiến trình, không phải một *(2026-08-31)*

`ADR-05` chốt mỗi dịch vụ một tiến trình. Bảng khai:
`core/assets/dich-vu.json` — **đọc từ đó, đừng gõ lại số cổng ở đây**.

| vùng | dịch vụ | cổng | key model |
|---|---|---|---|
| LÕI | `web` | 8787 | **không** |
| THỢ | `chatbot` | 8788 | có |
| THỢ | `chungcat` | 8790 | có |
| THỢ | `truyhoi` | 8791 | có |
| THỢ | `artifact` | 8792 | có |
| BIÊN | `kenh` | — *không nghe* | **không** |

### Chạy — `make chay` (đề xuất), KHÔNG dùng docker-compose ở dev

```bash
make chay          # bật đủ 6 tiến trình, mỗi cái một log riêng
make chay web      # chỉ một
make dung          # tắt hết
```

**Vì sao không `docker-compose` ở dev**: dự án đang chạy Windows native, và
`ADR-02` đã ghi một bài học đắt — môi trường Python nhiều bản, mỗi bản thiếu
một thứ. Thêm một lớp ảo hoá vào giữa lúc **chưa dịch vụ nào tồn tại** là thêm
một chỗ hỏng cho một vấn đề chưa xảy ra. Khi nào có 2+ người chạy, hoặc CI cần
dựng cả cụm, lúc đó bàn lại — và lúc đó `dich-vu.json` đã có sẵn thứ để sinh
compose file.

### Biến môi trường — xem `env-theo-service.md`

> ⚠️ **Chốt 2026-09-03**: cách set `.env` sống ở **`04_system/env-theo-service.md`**.
> Đừng khai lại ở đây — hai nơi khai một sự thật sẽ lệch.
>
> Chủ dự án chốt: **mọi** bí mật (xác thực · API key · token zalo/tele/bank/fb)
> để trong `.env`, và **một `.env` cho mỗi module/service**.
>
> Ba điều đáng biết ngay:
>
> **1 ·** `env_plan` này từng khai **ba** file `.env` mà **không file nào được
> nạp** — đo được `0` dòng `dotenv`/`--env-file` trong cả dự án. Nên quyết định
> mới **không nới lỏng** gì; nó **lần đầu** cho ba file đó một cơ chế.
>
> **2 ·** `B-E2` **không cấm** `.env`. Nó cấm `web/api/**` **gọi ra Internet** —
> luật về **egress**, không về chỗ chứa bí mật. Và *"mỗi service một `.env`"*
> **chính là** cơ chế giữ `B-E2` đúng: `.env` của `web/` không có khoá model.
>
> **3 ·** ⚠️ Một `.env` mỗi service **KHÔNG ĐỦ**. `dungchung.mjs:432` truyền
> **toàn bộ** `process.env` xuống tiến trình Python con, nên bí mật của `web/`
> chảy vào `validate.py`. Phải kèm **danh sách trắng** biến truyền xuống con.

#### *(giữ lại — khối gốc, `B-E2` cưỡng chế bằng cấu trúc)*

### Biến môi trường — chỗ cưỡng chế `B-E2`

```bash
# .env.tho     ← CHỈ tiến trình THỢ nạp file này
GN_MODEL_KEY=...
GN_MODEL_URL=...

# .env.bien    ← CHỈ `kenh/` nạp
GN_TELEGRAM_TOKEN=...
GN_ALLOWLIST=123456789,987654321
```

> **`web/` không nạp file nào trong hai file trên.** Đây không phải kỷ luật —
> nó là lý do `web/` **không thể** gọi model dù có ai viết nhầm một dòng
> `fetch`: nó không có gì để xác thực. Xem `security_baseline §3.1`.

`.gitignore` đã chặn `.env*` — kiểm lại trước khi tạo hai file này.


### Khoá dịch vụ — `KHOA_DICH_VU` (T08-12, `FR-047 L3`)

Năm cửa `C3`–`C7` của LÕI là **cửa cho MÁY**, không cho người. Chúng đòi hai
header: `x-khoa-dich-vu` và `x-aud: loi`.

```bash
# .env.loi     ← CHỈ `web/` nạp
KHOA_DICH_VU=<32+ byte ngẫu nhiên mã hoá>

# .env.bien    ← `kenh/` và `cong/` nạp CÙNG giá trị đó để gọi vào LÕI
KHOA_DICH_VU=<cùng giá trị>
```

> ⚠️ **`KHOA_DICH_VU` phải KHÁC `KHOA_PHIEN`.** Nếu hai biến bằng nhau,
> `loiKiemKhoaDichVu()` **chặn thẳng** — không phải cảnh báo, là từ chối.
>
> `CVE-2025-41258` (LibreChat, CVSS **8.0**, `I:H/A:H`): dùng **cùng một** JWT
> secret cho session trình duyệt và cho dịch vụ nội bộ ⇒ một token session hợp
> lệ xác thực **thẳng** vào dịch vụ nội bộ và **đi vòng toàn bộ ACL một lúc**,
> gồm cả **GHI**. Kiểm tra ở đây là **cấu trúc**, không phải lời nhắc.

**Sinh khoá** — đừng gõ tay:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

**Chưa đặt thì sao**: `loiKiemKhoaDichVu` trả `false` khi `KHOA_DICH_VU` rỗng ⇒
cả năm cửa trả **401**. **Fail-closed, không fail-open** — `CVE-2026-47713`
(AnythingLLM) là hình dạng ngược lại: `user ? whereWithUser(user) : where({})`,
thiếu danh tính thì trả **tất cả**.

⇒ Quên đặt biến thì M15/M17 **không gọi được LÕI**, và đó là hỏng ĐÚNG chiều.

### DB của LÕI — `LOI_DB`

```bash
LOI_DB=<đường dẫn>      # mặc định web/_loi.sqlite
```

Cùng khuôn `KB_DIR`/`RECYCLE_DIR`/`PYTHON` (`FR-010`, `FR-034`) — để test trỏ
sang thư mục tạm. Không có override thì mọi test dùng chung một DB thật, và ca
*"hai request đồng thời"* của `M18-R1` sẽ ăn vào dữ liệu thật.

**Backup**: ba bảng gốc xuất ra `web/_luu/*.yaml` và **file đó được commit**
(`ADR-06 (c)`). Khác `kb/_kho.sqlite` ở chỗ DB này **không dựng lại được từ file
nào khác**, nên bản lùi đó là đường lùi **duy nhất**.

### Máy tắt thì sao

| dịch vụ | máy tắt | hậu quả |
|---|---|---|
| `web` | không truy cập được | như hôm nay |
| THỢ | việc đang chạy mất | job phải **idempotent** — chạy lại được, xem `build_order` |
| `kenh` | **không nhận tin** | Telegram giữ update ~24h rồi bỏ. Chấp nhận cho dùng cá nhân |

## integration — nơi R2 có bằng chứng

GitHub Actions, kích hoạt khi PR hoặc push chạm `core/**`, `kb/**`, `web/**`.

| Job | Lệnh | Gác gì |
|---|---|---|
| `test` | `pytest core/tests -q` | 14 test — luật có hiệu lực |
| `validate` | `python core/src/source_distiller/validate.py kb/` | 8 cổng format |
| `build` *(sau B3a)* | `npx quartz build` | web build được |

**Vì sao integration ≠ dev**: hook local bỏ qua được bằng `--no-verify`, và không
chạy khi người khác clone. CI là thứ **không bỏ qua được** → S3 có răng.

Runner: `ubuntu-latest`. Pin Python `3.11`, Node `22`.

**Lưu ý một cái bẫy đã gặp**: `validate.py` in tiếng Việt; runner Linux mặc định
UTF-8 nên không sao, nhưng nếu ai chạy trên `windows-latest` thì cần
`PYTHONIOENCODING=utf-8`. Script đã tự `reconfigure` stdout nên an toàn — đã kiểm
trên console cp1252.

## prod

**Bản đầu**: `npx quartz build --serve` trên máy local.

> ⚠️ **HẾT ĐỦ 2026-09-01 (`FR-045`)**: 5 đồng nghiệp ở xa không mở được một
> `--serve` trên máy chủ dự án. Và câu *"tránh hoàn toàn rủi ro lộ nội dung"*
> hết đúng ngay khi `cong/` nghe 443.
>
> Hình dạng mới: `cong/` (BIÊN, 443, xác thực) → `127.0.0.1` → `web` (8787).
> **Cách chạy `cong/` chưa chốt** — Caddy · nginx · tự viết; s4 quyết, và nó
> kéo theo câu *"lộ ra Internet tới đâu"* nên không phải quyết vặt.

**Khi cần truy cập từ máy khác**: GitHub Pages từ repo **private**.
→ security_baseline mục 4: web phải giữ private. Nếu đổi sang công khai, **phải
rà lại toàn kho trước** (BRD B-D3).

Deploy tự động: CI xanh → build → push lên nhánh `gh-pages`. Không deploy khi CI
đỏ (xem `build_order.md` F3).

## Secret

**Không có secret nào ở bản đầu.** Skill chạy trong phiên Claude Code của người
dùng; không API key, không token.

Nếu sau này cần token deploy: GitHub Secrets, không commit `.env`. `.gitignore`
đã chặn `.env*`.

## Dữ liệu giữa các môi trường

*(FR-034, 2026-08-26 — bản gốc: "git là toàn bộ trạng thái, clone repo là có đủ".)*

Nguồn chân lý là `kb/_kho.sqlite` (gitignore). **Backup = export `.md/.yaml`
trong git** (một chiều DB→file sau mỗi ghi). Clone repo là có đủ **cộng một
lệnh**: `python core/tools/dung_lai_db.py` — đường dựng-lại DB duy nhất được
phép; server không bao giờ tự chạy nó.

> ⚠️ **Bổ sung 2026-09-02 (`ADR-06` + `FR-050`)**: nay có **DB thứ hai** — DB
> của LÕI trong `web/`, giữ dữ liệu **gốc** (tài khoản · mã mời · định danh kênh
> · phiên · nháp chưng cất). Ba trong năm bảng của nó
> (`nguoi_dung` · `dinh_danh_kenh` · `nhap_chung_cat`) xuất ra file làm bản lùi.
> Hai bảng còn lại (`ma_moi` · `phien`) **cố ý không xuất** — mã một-lần đã hết
> hạn và session khôi phục lại thì không khôi phục được gì; dấu vết của chúng
> sống trong `audit_log` dưới dạng **sự kiện**.
>
> **`FR-050` cách 2 (chốt 2026-09-02): bản lùi đó KHÔNG vào git.** Nó ra
> `_backup/` ở gốc repo, và `_backup/` **gitignore**. Lý do: hai trong ba file
> chứa **dữ liệu cá nhân** (`ten`, `chat_id`), nên cách này **xoá** vấn đề
> `B-E5` thay vì quản nó.
>
> ⚠️ **Hai câu ở mục trên HẾT ĐÚNG cho DB của LÕI**, và đây là đánh đổi thật
> của cách 2:
>
> | câu | còn đúng cho | HẾT đúng cho |
> |---|---|---|
> | *"Backup = export `.md/.yaml` trong git"* | `kb/` | **DB của LÕI** |
> | *"clone repo là có đủ cộng một lệnh"* | `kb/` | **DB của LÕI** |
>
> Clone repo cho bạn kho, mã, và mọi thứ **dựng lại được từ file** — **không**
> cho bạn 5 tài khoản và mọi `chat_id` đã buộc.
>
> > **MẤT Ổ `_backup/` = MẤT TÀI KHOẢN.** Không có bản thứ hai ở đâu cả. Cách 1
> > (remote riêng tư) từng có git remote làm bản thứ hai; cách 2 không có.
>
> Và câu *"backup riêng: vẫn thừa"* ở mục dưới **HẾT ĐÚNG** — xem mục đó.
>
> `web/api/dungchung.mjs` có hàm `trangThaiBanLui()` phân biệt *"chưa mời ai"*
> với *"backup không ở đây"*: sau cách 2, một `clone` mới **chạy được và không
> có tài khoản nào**, và hai ca đó trông **giống hệt nhau**.

Không có migration giữa các env theo nghĩa cũ: hai env đồng bộ qua export trong
git, không copy file DB. Nếu ngày nào cần copy `.sqlite` giữa hai máy thay vì
đi qua export, đó là dấu hiệu export không còn đủ trung thực — sửa export, đừng
copy DB.

## Cái KHÔNG dựng

Docker · Kubernetes · staging · blue-green · CDN · monitoring/APM · log
aggregation · backup riêng.

Thừa với công cụ local. Ghi ra để s9 không tự thêm.

> ⚠️ **Xét lại 2026-09-01**: `monitoring` và `log aggregation` từng thừa vì
> không có gì đối mặt Internet. `cong/` (443) đổi điều đó — tối thiểu cần
> **log truy cập + log thử xác thực thất bại** (`security_baseline §8.1`).
> Không phải APM, chỉ là biết có ai đang dò.
> `Docker`/`K8s`/`staging`/`blue-green`/`CDN`: **vẫn thừa**.
>
> ⚠️ **`backup riêng`: HẾT THỪA từ 2026-09-02 (`FR-050` cách 2).** DB của LÕI
> giữ dữ liệu **gốc** không dựng lại được từ file, và bản lùi của nó **không
> vào git**. Nên `_backup/` **là** backup riêng — thứ mục này từng khai là thừa.
> Cần một đường sao `_backup/` sang ổ thứ hai; `s9` chốt cách.
