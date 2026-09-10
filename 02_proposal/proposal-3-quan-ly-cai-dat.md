# Proposal 3 · Quản lý và cài đặt hệ thống

- **mở**: 2026-09-03 · **s2** · **nguồn**: `01_research/quan-ly-va-cai-dat-he-thong.md`
- **trạng thái**: **ĐÃ DUYỆT** 2026-09-03 — chủ dự án (*"ok"*)
- **tầng bị chạm**: s3 (`brd` `B-B6` · `prd` `U11`) · s4 (`ADR-07` ·
  `security_baseline §9` · `project_map` v27) · s6 (`M18 §10`)

---

## 0 · Phạm vi — và luật cho các module sau

**`M18_nguoidung` thuộc proposal này.** Chủ dự án chốt 2026-09-03:

> *"M18 thuộc Proposal 3 … các module sau này cứ bổ sung vào proposal 3 nhé,
> nếu cần tạo proposal 4 thì phải là bug update vào được tôi duyệt"*

| | |
|---|---|
| **module sau này** | **bổ sung vào file này** — không mở proposal mới |
| **`proposal-4`** | chỉ khi **chủ dự án duyệt**; mặc định là **không** |

⚠️ Đây là **quyết định của chủ dự án về hình dạng giấy tờ**, và nó lật một phân
tích của tôi. Tôi đã đo `project_map.yaml:29` (`skipped_gates: [G1, G2, G3]`) và
`proposal-2` không nhắc `M18`, rồi kết luận nên chuyển sang FR. **Kết luận đó
sai về mục đích**: chủ dự án không cần proposal để **đóng gate** — cần nó làm
**một chỗ đọc được phạm vi đợt này**, và một file đọc được có giá trị riêng
không phụ thuộc gate nào.

⇒ Nội dung ở đây; `FR-055` chỉ còn là **con trỏ**.

## 1 · Vấn đề

Hôm nay **ma trận quyền sống trong mã**. Đổi *"đồng nghiệp có được xem audit
không"* là **sửa `dungchung.mjs`, chạy test, restart**. Với một người vận hành
duy nhất và 5 đồng nghiệp, đó là một vòng lặp dài cho một câu hỏi ngắn.

Và nó không chỉ là quyền. Ba thứ khác **đang gõ cứng ở nhiều nơi** hoặc chỉ đọc:

| thứ | hôm nay | đau ở đâu |
|---|---|---|
| ma trận quyền | `QUYEN` trong `dungchung.mjs` | sửa = deploy |
| ngưỡng chặn dò | `core/assets/nguong-loi.json` | sửa được, nhưng phải vào máy |
| bảng model theo tác vụ | `SCR-16` khai **read-only, trỏ file** | *"đổi model cho tiếng Trung"* = sửa repo |
| trần & quota | rải trong `media-mime.json`, `thresholds.yaml` | ba file, ba nơi |

## 2 · Nhưng vấn đề THẬT không phải sự bất tiện

`s1` đã đo, và đây là lý do proposal này tồn tại thay vì một task:

> **Sửa được ma trận quyền từ web nghĩa là thứ quyết định *ai làm được gì* trở
> thành thứ *ghi được* bởi bên bị nó kiểm soát.**

Đó là **luật gốc của dự án** — *"Không ai được sở hữu thứ dùng để đánh giá
mình"* — áp vào đúng chỗ nó dễ vỡ nhất.

`s1` tìm ra chuẩn **không cấm** điều này:

> `OWASP ASVS 4.0.3 V4.1.2` (CWE-639, bắt buộc từ L1): *"policy information used
> by access controls cannot be manipulated by end users **unless specifically
> authorized**"*

⇒ Việc phải làm **chính là** thiết kế chữ *"specifically authorized"*. Không
phải quyết định *có nên làm không*.

## 3 · Sáu thứ `s1` đo được, đổi hẳn hình dạng đề xuất

**a · Invariant viết trong TÀI LIỆU không phải invariant.** Keycloak khai luật
*"chỉ gán được vai mình đang có"* trong docs kèm `IMPORTANT:`, rồi **vi phạm nó
trong mã** — `CVE-2025-7784`. Bản vá là đưa luật **từ văn xuôi vào mã**.

**b · Hard-code là đúng, nhưng KHÔNG được neo vào tên sửa được.** Keycloak vá
bằng cách neo luật vào **chuỗi tên vai**; 14 tháng sau ra `CVE-2026-9796`
(TOCTOU — **đổi tên** để thắng cuộc đua) **cộng** một regression phá vai `admin`
hợp pháp.
⇒ Xác nhận `FR-051 §8a` chọn đúng: enum khoá bằng **DDL `CHECK`**, không phải
tên người dùng đặt được.

**c · Cờ on/off mà không ai đọc ở điểm cưỡng chế thì TỆ HƠN không có cờ** — vì
màn hình nói ngược lại (`CVE-2026-45672`). Đây đúng là lỗi tôi vừa mắc với
`duocLam`, và nó có tên trong một CVE.

**d · "Một chokepoint" là điều kiện CẦN, không ĐỦ.** LiteLLM **có** chokepoint;
nó gác **route**, không gác **trường**.

**e · Có invariant KHÔNG diễn đạt được ở tầng dữ liệu.** Supabase: *"update
hàng của mình nhưng không cột này"* là **bất khả** trong RLS.
⇒ Nên tập ô sửa-được **phải là allowlist khai trong mã**, không phải "mọi thứ
trừ vài cái".

**f · Chính ngành feature-flag nói flag KHÔNG phải phân quyền.** GrowthBook:
*"Feature flags control visibility, not access."* Flagsmith **khuyến nghị**
gating theo trait ở một trang docs rồi **mô tả cách đi vòng nó** ở một trang
khác **không liên kết chéo**, với biện pháp chống **mặc định TẮT**.
⇒ Đây là con đường **cả ngành dẫn người ta đi vào**. Nên nó cần **cổng**, không
cần **cảnh báo** — cảnh báo là đúng thứ đã thất bại ở cả năm nhà cung cấp.

## 4 · Đề xuất

Một module **NGANG** (không thư mục, không tiến trình, không cổng — cùng hình
dạng `M09`/`M10`/`M11`/`M18`) sở hữu **một** entity: `CaiDat`.

**Ba tầng, và ranh giới giữa chúng là cả đề xuất:**

| tầng | ở đâu | ai đổi được |
|---|---|---|
| **BẤT BIẾN** | mã + DDL `CHECK` | **không ai**, kể cả `chu`, kể cả qua form |
| **SCHEMA ô** | `QUYEN` + bảng khai trong mã | **không ai qua web** — sửa = PR + review |
| **GIÁ TRỊ ô** | DB (`cai_dat`) | `chu`, qua web |

⚠️ **Tầng giữa là thứ phân biệt đề xuất này với "một form sửa DB".** DB chỉ giữ
**boolean của những ô đã được khai tồn tại trong mã**. Không có đường nào để một
form **tạo ra một ô mới**.

## 5 · Scope IN

| | |
|---|---|
| `CaiDat` | bảng `cai_dat(khoa, gia_tri, doi_luc, boi)` trong DB của LÕI |
| bảng khai `O_SUA_DUOC` | **allowlist trong mã**: khoá nào tồn tại, kiểu gì, mặc định gì |
| một cửa ghi | `(khoa, gia_tri)` — **không nhận object**, xem §6c |
| màn admin | gộp với quản lý người dùng — **một** màn, xem §8 |
| vết đổi | mọi lần đổi ghi `audit_loi` với **cả hai** danh tính |
| nhân chứng ngoài | công bố `(số_hàng, head, thời_điểm)` ra chỗ `chu` **không sở hữu** |

## 6 · Scope OUT — và đây là phần quan trọng hơn scope IN

**a · `duyet-bai` KHÔNG BAO GIỜ là một ô.** `B-B1` ở mã. Đã cưỡng chế:
`duyet-bai` **không có** trong `QUYEN`, và cổng `Y5` canh điều đó.

**b · `vai` KHÔNG là một ô.** Enum khoá bằng DDL `CHECK`. Mở nó ra là mở lại
`CVE-2026-9796`.

**c · Cửa ghi KHÔNG nhận object.** Nhận đúng `(khoa, gia_tri)`.
Lý do: `CVE-2026-31942` — LibreChat mất **API key của mọi người** vì
`{ userId: req.user.id, ...body }`. Thứ tự spread đó là cả lỗ hổng.

**d · KHÔNG một ô nào được diễn giải thành đường dẫn, lệnh, URL server gọi ra,
hay mã.** Giá nếu làm ngược: `CVE-2024-3104` (**9.8**) ·
`CVE-2024-3028/3025` (trường setting ⇒ **xoá được file SQLite**) ·
`CVE-2026-32625` (nội suy **trong tầng validate** ⇒ rò `JWT_SECRET`).
⇒ Với vế này, một lỗi bỏ sót phép kiểm vai tốn **toàn vẹn dữ liệu**; không có
nó, nó tốn **máy chủ**.

**e · `viec` sửa-setting KHÔNG sửa được DANH SÁCH ô sửa được.** Guardrail phải
tự nêu tên mình trong deny của chính nó — không thì **một ô mở ra tất cả các
ô** (`CVE-2026-17601`).

**f · KHÔNG dựng RBAC đầy đủ / ABAC / policy engine.** Hai vai, một bảng.
⚠️ Và phải khai thẳng: `s1` **tìm kỹ và KHÔNG tìm thấy** ngưỡng công bố dạng
*"dưới N người thì RBAC là thừa"* — 14 truy vấn, **9 PDF grep toàn văn** (NIST
IR 7316, ANSI INCITS 359-2004, Sandhu 1996, Zanzibar 2019…), **toàn bộ âm
tính**. Nên câu *"6 người thì RBAC là thừa"* là **suy luận**, không phải fact.

**g · KHÔNG làm `SCR-16` thành form.** Bảng model/trần/quota vẫn **read-only,
trỏ file**. Chỉ **ô quyền** mở ra ở đợt này.

## 7 · Metric — số, và cách đo

| # | metric | đo bằng |
|---|---|---|
| M3.1 | **đúng 1** cửa ghi setting | `grep` đếm chỗ `INSERT/UPDATE cai_dat` = 1 |
| M3.2 | **0** ô ngoài allowlist ghi được | gieo khoá lạ ⇒ **từ chối**, không tạo hàng |
| M3.3 | **100%** lần đổi có **cả hai** danh tính trong audit | đếm hàng `boi IS NULL` = 0 |
| M3.4 | **0** đường sửa/xoá audit | 4 cửa (`UPDATE`·`DELETE`·`OR REPLACE`·`OR IGNORE`) đều ném |
| M3.5 | `duocLam` trả **boolean đồng bộ** | `typeof === "boolean"`, không `Promise` |
| M3.6 | thời gian đổi một ô quyền | **< 30 giây** (hôm nay: sửa mã + test + restart) |
| M3.7 | cửa sổ không phát hiện được | = khoảng giữa hai lần công bố head — **khai bằng số**, không để ẩn |

⚠️ **M3.5 nghe vụn nhưng nó là một CVE.** Unleash `CVE-2026-77426`: một `await`
bị quên biến `Promise` thành truthy ⇒ **mọi** phép kiểm thành `true`. `duocLam`
hôm nay đồng bộ — nhưng **do may**, và cổng duy nhất bắt được là **kiểu trả về**.

## 8 · Gộp màn, TÁCH `viec` — và đây là kết luận ngược trực giác

`s1` tìm tiền lệ **tách** (Strapi: *"separation of concerns"*) nhưng đọc cả bài
thì lý do **không phải an ninh**. Và *"có hệ nào HỐI TIẾC vì gộp"* ⇒ **không tìm
thấy hối tiếc khai bằng chữ**.

Nhưng có **CVE**, và nó trả lời đúng câu hỏi:

> `CVE-2024-3283` → cửa `/admin/system-preferences` (**cài đặt**), trường
> `multi_user_mode` (**chế độ xác thực**), hệ quả **tạo được một admin**.
> Ba tầng khác nhau, **một cửa**.
>
> `CVE-2026-32715`, hai năm sau, **cùng cặp cửa**: hai endpoint
> system-preferences **generic** cho vai `manager`, trong khi **mọi bề mặt
> khác** chạm cùng setting đó chỉ cho `admin`.

⇒ Cái gây hại **không** phải hai thứ ở cùng một màn. Là **một endpoint generic
mang một quyền thô**.

**Quyết định**: **gộp MÀN, tách `viec`.** Một màn *"Quản lý và cài đặt hệ
thống"*; nhưng `moi-nguoi-moi` · `thu-hoi` · `xem-audit` · `sua-cai-dat` là
**bốn `viec` riêng**, mỗi cái một phép kiểm.

⇒ **Không mở module mới.** Gộp vào `M18_nguoidung`, và `M18` đổi `purpose`.
`M20` **không được đặt số** — `FR-051 §7` đã ghi lý do: hai module NGANG cùng
đích `M03`+`M08` thì ranh giới giữa chúng là **giấy**, và quyết muộn không đắt.

## 9 · Rủi ro

| # | rủi ro | chặn bằng |
|---|---|---|
| R3.1 | một ô mở ra tất cả các ô | §6e — guardrail tự nêu tên trong deny của mình |
| R3.2 | form gán được `vai` ⇒ `B-B1` chết **qua con trỏ** | §6b + bảo vệ **CON TRỎ** không chỉ **HÀNG** (Strapi §2.5) |
| R3.3 | invariant chỉ ở docs | §3a — mọi invariant phải có **cổng đỏ được** |
| R3.4 | chokepoint gác route mà không gác **trường** | §3d — chokepoint trả **ba** câu: hàng nào · trường nào · **giá trị nào** |
| R3.5 | `chu` cuối tự khoá cả hệ ra ngoài | đã chặn (`Y10`), nhưng **chưa có break-glass** — xem §10 |
| R3.6 | nhân chứng nằm trong tay `chu` | §5 — chỗ `chu` **không sở hữu**; email 6 hộp thư · git remote không force-push · `ots stamp` |

⚠️ **R3.6 sửa một lỗi của chính `s1`.** Bản nháp của nó đề nghị bắn head qua
**kênh Telegram `M18`** — sai, vì bài trong channel do admin **sở hữu** nên admin
**sửa và xoá được**. `s1` tự bắt và tự ghi ra. Giữ lại vì nó là ví dụ của đúng
lớp lỗi proposal này chống.

## 10 · Điều proposal này KHÔNG giải, và cần quyết riêng

**Break-glass.** `Y10` chặn hạ `chu` cuối — nhưng nếu `chu` duy nhất **mất
quyền truy cập** (mất máy, mất ổ backup) thì **không có đường vào**. `s1` khai
hai đường, cả hai có tiền lệ, và nói **không được thiếu cả hai**:

- **chặn** (Entra · Entra PIM · Directus · Strapi — bốn sản phẩm) ⇐ **đã có**
- **break-glass ngoài UI** ⇐ **chưa có**

Với một admin duy nhất, *"chặn"* một mình có thể chưa đủ. Đây là câu cho `s4`.

## 11 · Đóng G2 khi

| | |
|---|---|
| mỗi scope-in truy về **một** vấn đề ở §1 hoặc §2 | ✅ |
| metric có **số** + cách đo | ✅ bảy metric §7 |
| scope OUT khai **rõ hơn** scope IN | ✅ bảy vế §6, mỗi vế một CVE |
| chủ dự án duyệt | ⏳ |

---

## 12 · Bổ sung 2026-09-03 · `.env` theo service (chủ dự án chốt)

*(theo luật §0: module/tính năng sau bổ sung vào file này)*

**Chốt**: mọi bí mật — xác thực · API key · token **zalo · telegram · bank · fb**
— để trong `.env`, và **một `.env` cho mỗi module/service**.

Cách set: **`04_system/env-theo-service.md`**. Không khai lại ở đây.

### Ba điều đáng biết

**1 · Quyết định này KHÔNG nới lỏng gì.** Đo được: `env_plan` khai **ba** file
`.env` mà **không file nào được nạp** — `0` dòng `dotenv`/`--env-file` trong cả
dự án. Nó **lần đầu** cho ba file đó một cơ chế.

**2 · `B-E2` không cấm `.env`** — nó cấm `web/api/**` **gọi ra Internet**. Và
*"mỗi service một `.env`"* **chính là** cơ chế giữ `B-E2` đúng: `.env` của `web/`
không chứa khoá model, nên câu *"`web/` không có gì để xác thực"* vẫn đúng
nguyên văn — thực thi bằng **file** thay vì bằng *"gõ tay"*.

⚠️ Tôi từng đọc quá lời `B-E2` và tưởng nó cấm `.env` ở LÕI. Nó không.

**3 · ⚠️ Lỗ đo được: ranh giới tiến trình rò XUỐNG DƯỚI.**
`dungchung.mjs:432` truyền **toàn bộ** `process.env` xuống tiến trình Python
con, nên mọi bí mật của `web/` chảy vào `validate.py` — và tiến trình đó chạy
mã có `--fix` ghi vào kho.

⇒ *Một `.env` mỗi service* phải kèm **danh sách TRẮNG** biến truyền xuống con.
Allowlist, không denylist — `CVE-2018-8007` đi vòng đúng một blacklist.

### Scope IN

| | |
|---|---|
| cơ chế nạp | `node --env-file` (Node ≥20, **không thêm dependency**) |
| bảy `.env` | theo `thu_muc` trong `dich-vu.json` |
| `.env.example` | mỗi service một cái, **commit** (`.gitignore:6` đã có `!.env.example`) |
| ~~allowlist spawn~~ | ✅ **xong 2026-09-03** — `envCon`, **ba** chỗ (`:432` `:482` `server.mjs:117`), cổng 8 ca |
| cổng | *"service chỉ đọc `.env` của mình"* — đếm được |

### Scope OUT

- **Không** đổi `B-E2` / `ADR-05`. `.env` theo service là **hệ quả** của
  *"mỗi service một tiến trình"*, không phải ngoại lệ.
- **Không** mở `thanhtoan/` ở đợt này. Chủ dự án chốt: *"token bank thì sau này
  có service payment rồi bỏ vào"*.
  ⚠️ Lý do không phải chỗ chứa mà là **tiến trình nào gọi ra ngân hàng**: nếu
  `web/api/**` gọi thì `B-E2` vỡ — không vì `.env`, mà vì `web/` có một đường
  egress.
- **Không** nạp `.env` từ trong mã — đường dẫn file thành một tham số, và một
  tham số đường-dẫn là một chỗ để đọc file khác.
