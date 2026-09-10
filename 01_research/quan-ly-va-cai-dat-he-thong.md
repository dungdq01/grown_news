# Quản lý và cài đặt hệ thống — research `s1`

> Đầu vào: `FR-051 §7` — chỉ đạo *"phân quyền làm tính năng on/off, setting để
> admin edit ngay trên web"*. Ba ràng buộc ở `§7` là **giả thuyết cần kiểm**,
> không phải kết luận của file này.
> **Kết quả: `a` giữ · `b` phải mạnh thêm một vế · `c` đổi dạng · và một vế tôi
> tự đề nghị trong lúc soạn đã bị chính research này BÁC** (§8.1 R3).
> Ngày: 2026-09-02 · phạm vi ghi: **chỉ file này**.

**Nhãn** — `[F]` fact, có nguồn + ngày · `[Đ]` **đo được**, chạy thật, script kèm
theo · `[S]` suy luận từ `[F]`/`[Đ]` · `[G]` giả định chưa có nguồn.

**Cách xác minh CVE**: NVD REST API (`services.nvd.nist.gov/rest/json/cves/2.0`),
OSV (`api.osv.dev/v1/vulns/`), MITRE CNA (`cveawg.mitre.org/api/cve/`), GHSA.
⚠️ `[Đ]` Trang HTML `nvd.nist.gov/vuln/detail/*` là **SPA rỗng với fetcher** —
fetch `CVE-2026-47713` qua HTML trả về trang chủ NVD, không nội dung. Ai dẫn NVD
qua đường HTML rất có thể đang dẫn một trang trống. **Dùng API.**

---

## 0 · Câu trả lời ngắn

Câu hỏi *"ma trận quyền nên ở mã hay ở dữ liệu"* **đã có chuẩn trả lời**, và
chuẩn không nói "không được" — nó nói **"được, nhưng ai GHI phải bị chặn"**:

> `[F]` **OWASP ASVS 4.0.3 V4.1.2** (CWE-639, bắt buộc từ L1): *"Verify that all
> user and data attributes and **policy information used by access controls**
> cannot be manipulated by end users **unless specifically authorized**."*
> Control Objective chương V4: *"**Role and permission metadata is protected from
> replay or tampering.**"*
> — `github.com/OWASP/ASVS` blob `v4.0.3/4.0/en/0x12-V4-Access-Control.md`

⇒ `[S]` `§7` **không trái chuẩn**. Cái phải thiết kế là chữ *"specifically
authorized"*.

Sáu phát hiện đắt nhất:

1. **Invariant viết trong TÀI LIỆU không phải invariant.** `[F]` Keycloak khai
   luật *"admin có `manage-users` chỉ gán được vai mình đang có"* trong docs kèm
   `IMPORTANT:`, rồi **vi phạm nó trong mã** — `CVE-2025-7784`. Bản vá là **đưa
   luật từ văn xuôi vào mã**. §1.3.
2. **Hard-code invariant là đúng, nhưng KHÔNG được neo vào tên sửa được.**
   `[F]` Keycloak vá `CVE-2025-7784` bằng cách neo luật vào **chuỗi tên vai**;
   14 tháng sau ra `CVE-2026-9796` (TOCTOU: **đổi tên** để thắng cuộc đua) **và**
   một regression phá vai tên `admin` hợp pháp của tenant. §1.4. `[S]` Đây là ca
   **xác nhận** `FR-051 §8a` đã chọn đúng: enum khoá bằng DDL `CHECK` không phải
   tên người dùng đặt được.
3. **Một cờ on/off mà không ai đọc ở điểm cưỡng chế là cờ vô nghĩa** — và tệ hơn
   không có cờ, vì màn hình nói ngược lại. `CVE-2026-45672`. §1.6.
4. **"Một chokepoint" là điều kiện CẦN, không ĐỦ.** LiteLLM **có** chokepoint; nó
   gác **route**, không gác **trường**. §1.5.
5. **Có invariant KHÔNG diễn đạt được ở tầng dữ liệu.** `[F]` Supabase: *"update
   hàng của mình nhưng không cột này"* là **bất khả** trong RLS. §2.6.
6. **Chính ngành feature-flag nói flag KHÔNG phải phân quyền.** `[F]` GrowthBook
   (2026-05-01): *"**Feature flags control visibility, not access. They decide
   what users see — not what they're authorized to do.**"* Và `[F]` Flagsmith
   **khuyến nghị** gating theo trait `plan` ở một trang docs, rồi **mô tả đúng
   cách đi vòng nó** ở một trang khác **không có liên kết chéo**, với biện pháp
   chống **mặc định TẮT**. §1.9.
7. **Trigger `chi_noi_them` của dự án có một lỗ ĐO ĐƯỢC** (`INSERT OR REPLACE`),
   `audit_loi` ở LÕI **không có trigger nào**, và **`chu` cuối cùng tự khoá được
   cả hệ ra ngoài** — không có đường break-glass. §3.3, §7.

---

## 1 · Tiền lệ: bảng quyền / setting sửa được ở runtime làm đường leo thang

### 1.1 · Bảng ca

| CVE / nguồn | sản phẩm | công bố | CVSS | cơ chế |
|---|---|---|---|---|
| **`CVE-2025-7784`** | Keycloak `≥26.2.0 <26.2.6` | 2025-07-29 | 6.5 · CWE-269 | *"a user with `manage-users` privileges can **self-assign `realm-admin`** … missing privilege boundary checks in **role mapping** operations via the admin REST interface … **by editing their own user roles**"* ⇒ RH: *"complete administrative takeover of a realm"* |
| **`CVE-2026-9796`** | Keycloak RH 26.6 → 26.7.0 | 2026-05-28 | 6.5 · **CWE-367** | `manage-clients` **đua với `checkAdminRoles` bằng cách ĐỔI TÊN vai admin** ⇒ `realm-admin`. *"The composite role relationship persists even after the attacker's own permissions are revoked and across system reboots"* |
| `CVE-2026-9099` | Keycloak `<26.6.4` | 2026-06-26 | 7.7 · CWE-639 | `GroupResource.addChild()` thiếu kiểm: **đem một group đặc quyền làm con** của group mình quản ⇒ thừa hưởng `manage` + reset mật khẩu |
| **`CVE-2024-1442`** | Grafana 8.5–10.3.x | 2024-03-07 | 6.0 | *"we interpret an asterisk (`*`) as a wild card for all resources. Therefore, we should treat it as a **reserved value**, and not allow the creation of a resource with the UID set to an asterisk"* — chủ thể **tự chọn định danh của mình**, và chọn ký tự wildcard |
| `CVE-2023-4822` | Grafana `≤10.1.5` | 2023-10-12 | 6.7 · CWE-269 | Org Admin **sửa ĐỊNH NGHĨA** của Viewer/Editor/Admin *"in all organizations"* + *"assign or revoke any permissions they have to any user globally"* |
| `CVE-2026-21721` | Grafana nhiều nhánh | 2026-01-27 | 8.1 · CWE-639 | *"The dashboard permissions API **does not verify the target dashboard scope** and only checks the `dashboards.permissions:*` action"* |
| `CVE-2024-3283` | AnythingLLM `<1.0.0` | 2024-04-10 | 7.2 · CWE-915 | `manager` gọi `/admin/system-preferences`; *"accepting a full JSON object … without proper validation of modifiable fields"*; đổi `multi_user_mode` ⇒ **tự tạo admin** |
| `CVE-2026-32715` | AnythingLLM `≤1.11.1` | 2026-03-13 | 3.8 | **cùng cặp cửa, 2 năm sau**: *"the two generic system-preferences endpoints allow **manager** role access, while **every other surface that touches the same settings is restricted to admin only**"* |
| **`CVE-2026-47102`** | LiteLLM `<1.83.10` | 2026-05-21 | 8.8 H · CWE-863 + **915** | `/user/update` **đúng** ở *"chỉ sửa tài khoản của chính mình"*, **sai** ở *"không giới hạn trường nào"* ⇒ `user_role=proxy_admin`. `org_admin` khai thác *"without chaining any additional flaw"* |
| `CVE-2026-47101` | LiteLLM `<1.83.14` | 2026-05-21 | — | `/key/generate`: *"the `allowed_routes` field is stored **without verifying that the specified routes fall within the user's own permissions**"* |
| **`CVE-2026-48086`** | OpenReception `<1.0.2` | 2026-08-06 | **9.9 C** | `TENANT_ADMIN` → `GLOBAL_ADMIN` bằng **một PUT**. Xem §1.7 |
| `CVE-2026-17601` | Nexus Repo 3 `3.19.0`→`<3.95.0` | 2026-08-07 | 8.9 H (v4) | ai có quyền *"update privilege definitions"* **sửa wildcard privilege đang gán cho chính vai mình** ⇒ full admin, **không cần đổi vai** |
| **`CVE-2026-45672`** | Open WebUI `<0.8.12` | 2026-05-15 | — · CWE-863 | *"executes arbitrary Python … **even when the admin has set `ENABLE_CODE_EXECUTION=false`**. The feature gate is not enforced on the API endpoint — **the configuration says "disabled" but code still executes**"* |
| `CVE-2026-45395` | Open WebUI `<0.9.5` | 2026-05-15 | — · CWE-269+862 | *"the tool update endpoint is missing the `workspace.tools` permission check **that is present on the tool create endpoint**"* ⇒ thay Python của tool ⇒ thi hành |
| `CVE-2026-30820` | Flowise `<3.0.13` | 2026-03-07 | 8.8 H | *"trusts any HTTP client that sets the header `x-request-from: internal`, allowing … to **bypass all `/api/v1/**` authorization checks**"* |
| `CVE-2026-31942` | LibreChat `≤0.7.6` | 2026-06-02 | 7.1 H | *"Due to the use of the JavaScript object **spread operator after** setting the authenticated user's ID, any authenticated user can inject a `userId` parameter"* |
| `CVE-2026-25045` | Budibase | 2026-03-09 | 8.8 H | `/api/global/users` thiếu kiểm RBAC: `Creator` **thăng** App Viewer thành Tenant Admin |
| `CVE-2026-65595` | n8n `<2.29.8/2.30.1` | 2026-07-22 | 8.8 H | Token Exchange cấp **toàn bộ** scope *"regardless of the acting user's role"* ⇒ role escalation + RCE |
| `CVE-2025-24353` → **GHSA-7h45-q5jx-7r87** | Directus `<11.2.0` → `<12.2.0` | 2025-01-23 → **2026-09-02** | 5.0 → 6.5 | `directus_shares.role` là cột ghi được, nuôi danh tính phiên. Bản sau: quyền được kiểm **theo trạng thái hàng GỐC, không theo giá trị GỬI LÊN** ⇒ **đi vòng lại bản vá cũ** |
| `CVE-2024-3104` | AnythingLLM | 2024-06-06 | **9.8 C** | `POST /api/system/update-env` tiêm biến môi trường ⇒ **RCE** |
| `CVE-2024-0404` | AnythingLLM | 2024-04-16 | 9.1 C | thêm `role: admin` vào body `/api/invite/:code`; *"lack of property allowlisting and blocklisting"* |
| `CVE-2018-8007` | CouchDB `<1.7.2`, `2.0.0`–`2.1.1` | 2018-07-10 | — · CWE-20 | **đi vòng BLACKLIST setting cấm sửa qua HTTP API** ⇒ RCE dưới user OS |
| `CVE-2025-47713` | CloudStack `4.10`–`4.20` | 2025-06-10 | 8.8 H | Domain Admin **đặt lại mật khẩu** tài khoản vai Admin |
| `CVE-2026-16772` · `CVE-2026-34427` | Akaunting `≤3.1.21` · Vvveb `<1.0.8.1` | 2026-08-14 · 2026-04-20 | — | tự gán `admin role ID` / tiêm `role_id=1` vào cửa lưu profile **của chính mình** |
| `CVE-2012-2359` | Moodle `<2.0.9` | 2012-07-21 | — | `admin/roles/override.php`: giáo viên **sửa capability của chính mình** |

`[S]` **Hai mốc đáng nhìn cạnh nhau**: `CVE-2012-2359` (2012) và `CVE-2026-17601`
(2026) là **cùng một lỗi cách nhau 14 năm** trên hai hệ chín chắn; Nexus mang nó
từ `3.19.0` tới `3.94.1`. ⇒ Đây **không** phải loại lỗi review hay unit test bắt
được. Nó là **lỗi hình dạng** ⇒ chặn bằng **cấu trúc**.

`[F]` **Quy mô nền**: NVD `cpe:…:openwebui:open_webui` = **143 CVE**, trong đó
**71 (49,7%)** mang CWE access-control (CWE-862 × 31, CWE-639 × 19, CWE-863 ×
18); **~40 công bố cùng ngày 2026-05-15**. AnythingLLM: **67 CVE**, 17
access-control.
`[S]` ⇒ Bốn mươi lỗi phân quyền trong **một** lượt audit của **một** codebase.
Điều này nói *"phân quyền rải rác rò rỉ theo tỉ lệ số cửa"*, không phải *"lập
trình viên đó kém"*.

### 1.2 · Năm hình dạng lặp lại — đếm theo lời khai của chính advisory

| hình dạng | số ca | nói rõ nhất |
|---|---|---|
| **A · Kiểm có ở cửa A, thiếu ở cửa B cùng tài nguyên** | **7** | `CVE-2026-45395` (create có, update không) · `CVE-2026-32715` · `CVE-2026-54027` LibreChat *"Incomplete Fix for File Upload Authorization"* |
| **B · Đường xác thực / transport thứ hai không qua chokepoint** | **4** | `CVE-2026-70490` Open WebUI: WebSocket *"authenticates its own first-message JWT instead of going through the HTTP dependency chain"* ⇒ vai `pending` mở được **terminal** |
| **C · Mass assignment: danh tính do máy đặt bị client ghi đè** | **7** | `CVE-2026-31942` (spread sai thứ tự) · `CVE-2024-0404` · `CVE-2026-47102` |
| **D · Cờ on/off khai rồi mà KHÔNG ai đọc ở điểm cưỡng chế** | **3** | `CVE-2026-45672` · `CVE-2026-59227` (`ENABLE_IMAGE_EDIT`) · `CVE-2026-70484` |
| **E · Chokepoint CÓ, và SAI** | **5** | `CVE-2026-30820` (tin header) · `CVE-2026-59226` (`role == "user"` thay vì deny-mặc-định) · `CVE-2026-47101/47102` (gác route, không gác trường) |

`[F]` **Hình dạng A/B có bằng chứng dài hạn nhất, ngoài miền LLM**: PostgreSQL
`CVE-2016-2193` (2016-03-31, plan cache không khoá theo `current_user` ⇒ sai bộ
RLS policy) rồi `CVE-2023-2455` (2023-05-11), nguyên văn: *"While CVE-2016-2193
fixed **most** interaction between row security and user ID changes, **it missed
a scenario** involving function inlining."*
`[S]` ⇒ **Bảy năm** giữa hai lần cùng một invariant bị bỏ sót ở một code path
khác. Một invariant cưỡng chế ở N chỗ sẽ bị bỏ ở chỗ N+1.

`[F]` **Bốn ca nữa của hình dạng A/D, ngoài miền LLM — cùng một câu, bốn stack:**

| CVE | sản phẩm | ngày | luật ở đâu → **ai không đọc nó** |
|---|---|---|---|
| `CVE-2024-52871` | Flagsmith `<2.134.1` | 2024-11-17 · 7.5 | env `ALLOW_REGISTRATION_WITHOUT_INVITE` (**mặc định `True`**) kiểm inline trong `CustomUserCreateSerializer`, và **một bản sao thứ hai** ở đường OAuth. `[F]` Bản vá (PR #4454) **xoá cả hai bản sao** và rút ra **một** chokepoint `InviteLinkValidationMixin._validate_registration_invite` |
| `CVE-2023-22736` | Argo CD | 2023-01-26 · **8.5** | glob `application.namespaces` trong một **ConfigMap** → *"**When sharding is enabled** on the Application controller, **it does not enforce that list of patterns**"* |
| `CVE-2026-40099` | Kirby CMS | 2026-04-24 · 6.5 | blueprint YAML → *"**This is ensured when the page is created via the Kirby Panel. However the REST API allows to override the `isDraft` flag.**"* |
| `CVE-2026-58408` | ChurchCRM | 2026-07-13 · 6.5 | bảng cờ quyền → *"**any single non-admin permission flag is enough** to reach the CSV bulk-export endpoint"* |

`[S]` `CVE-2024-52871` là **bằng chứng gọn nhất** cho `FR-051 §3c`: một công tắc
an ninh cưỡng chế ở **N chỗ** bị đi vòng ở chỗ **N+1**, và bản vá của chính họ là
*"gộp về một chokepoint"*. Argo CD là dạng đắt nhất: cờ ở **config**, và một
**biến thể triển khai** (bật sharding) không đọc nó.

⚠️ `[F]` **Và một cái bẫy riêng của Node/JS, đáng đọc vì dự án là Node.**
Unleash `CVE-2026-77426` (2026-07-13, **high**, CWE-639+862): *"The handler
performs its own check via `this.accessService.hasPermission()`, but **omits the
`await` keyword**. Since `hasPermission()` is async (returns
`Promise<boolean>`), the variable always receives a **truthy Promise object**.
The `if (!hasFeatureStrategyPermission)` check **never triggers**."*
⇒ *"Any authenticated user can modify segment assignments on ANY strategy across
ALL projects."* (`segment-controller.ts:345`, vá ở PR #11359).
✅ `[S]` Dự án **đang an toàn** vì `duocLam` là **đồng bộ** (`dungLoiDb` sync,
trả `boolean`) — nhưng đó là may, không phải thiết kế. ⇒ **Khai thành luật:
chokepoint quyền phải trả `boolean` đồng bộ.** Một `await` bị quên là một dòng,
và cổng duy nhất bắt được nó là kiểu trả về.

### 1.3 · Invariant viết trong TÀI LIỆU không phải invariant — `CVE-2025-7784`

`[F]` Keycloak docs (`master-realm.adoc`, §*"Realm specific roles"*, mang
`IMPORTANT:`):
> *"Admins with the `manage-users` role will **only be able to assign admin roles
> to users that they themselves have**. So, if an admin has the `manage-users`
> role but doesn't have the `manage-realm` role, they will not be able to assign
> this role."*

`[F]` `CVE-2025-7784` (2025-07-29) là **đúng câu đó bị đảo**: *"a user with
`manage-users` privileges can self-assign `realm-admin` rights … **missing
privilege boundary checks** in role mapping operations."*

`[F]` Bản vá (RH build of Keycloak **26.2.6 §13.1**, *"Restrict admin role
mappings to server administrators"*):
> *"only users with the `admin` role in the `master` realm (server admins) can
> assign admin roles. This ensures that **critical permissions cannot be
> delegated by realm-level administrators**."*

`[S]` ⇒ Luật **đã đúng trong văn xuôi 100%** và vẫn mất realm. Bản vá không viết
lại luật — nó **chuyển luật từ tài liệu vào mã** và làm nó **không uỷ quyền
được**. Đây là lý do `FR-051 §7a` phải thành **mã + cổng**, không phải một dòng
trong FR: `FR-051` hôm nay đang ở đúng trạng thái Keycloak trước 26.2.6.

⚠️ `[F]` GHSA của `CVE-2025-7784` **dẫn sai** issue/PR làm bản vá (`#41137` /
`#41168` là bug đặt tên và một PR docs còn mở). **Đừng dẫn lại hai số đó.**

### 1.4 · Neo invariant vào TÊN sửa được — `CVE-2026-9796` + regression #51323

`[F]` `CVE-2026-9796` (2026-05-28, **CWE-367 TOCTOU**): `manage-clients` **đổi
tên** một vai để thắng cuộc đua với `checkAdminRoles` ⇒ `realm-admin` cho **mọi
user trong realm**; *"The composite role relationship **persists even after the
attacker's own permissions are revoked and across system reboots**."*

`[F]` Bản vá (commit `39cb8de5`) thêm:
```java
// RolePermissions.java — canManage(RoleModel role):
return root.realm().canManageRealm() && !isRealmAdminRole(role);
```
`[F]` Rồi issue **#51323** (mở 2026-07-31), *"Custom realm-level role named
`admin` cannot be updated in non-master realms after 26.7.0"*, nguyên văn:
> *"This check only verifies that the role is a realm role and that **its name is
> `admin` or `create-realm`**. It does not verify that the role belongs to the
> `master` realm."*

`[S]` **Một lựa chọn thiết kế sinh ra CẢ HAI hỏng**: neo invariant vào **chuỗi
tên** ⇒ (a) đổi tên được ⇒ TOCTOU; (b) tên trùng ⇒ chặn oan tenant vô tội. Bài
học: **hard-code invariant là ĐÚNG; neo nó vào định danh BẤT BIẾN, không vào tên
chủ thể sửa được.**

✅ `[S]` **Dự án đang ĐÚNG ở điểm này, và nên khai ra để không mất.**
`[Đ]` `web/api/loi.schema.sql:38-39`: `vai TEXT NOT NULL DEFAULT 'dong_nghiep'
CHECK (vai IN ('chu','dong_nghiep'))`. Giá trị `'chu'` **không phải tên người
dùng đặt được** — nó bị khoá bởi DDL, đổi được chỉ qua migration. Nên
`QUYEN["…"] = ["chu"]` neo vào một hằng bất biến, **không** vào chuỗi ghi được.
Đây là vế `FR-051 §8a` mua được mà `§8a` chưa nói tới, và nó **đắt hơn** vế
`vai = null` mà `§8a` có nói.
⚠️ Hệ quả cho `§7`: nếu `§7` cho phép **thêm vai từ form**, vế này **mất**, và
`CVE-2026-9796` mở lại. ⇒ *"thêm vai"* phải nằm ngoài tập sửa được.

### 1.5 · `FR-051 §3c` cần phát biểu lại — chokepoint gác ROUTE không đủ

`[F]` Kết luận của bên viết chuỗi khai thác LiteLLM (obsidiansecurity.com):
> *"The fundamental flaw was **layered authorization without field-level
> enforcement**. **The route gate served as the 'single chokepoint'**, while
> endpoint handlers blindly trusted that prior screening was sufficient."*

`[S]` ⇒ Chokepoint phải trả lời **ba** câu, không một:
1. *"ai được ghi HÀNG nào"* — `duocLam(nguoi, viec)` hôm nay trả lời câu này.
2. *"TRƯỜNG nào của hàng đó được ghi"* — **chưa gì trong dự án trả lời**
   (`CVE-2026-47102`: câu 1 đúng, câu 2 thiếu, mất toàn quyền).
3. *"được ghi GIÁ TRỊ nào"* — `CVE-2026-47101` (cấp key rộng hơn quyền mình có),
   `CVE-2024-1442` (`uid = *`), `CVE-2026-48086` (đặt được `GLOBAL_ADMIN`).

`[F]` `CVE-2026-59226` (Open WebUI `<0.10.0`) là biến thể *"chokepoint viết
sai"*: `check_model_access()` chỉ áp dụng khi `user.role == "user"`, nên vai
`pending` **rơi qua** nhánh deny.
✅ `[S]` `duocLam` hôm nay **đúng chiều này** (`cho.includes(h.vai)` + DENY khi
`viec` chưa khai) ⇒ giữ, và **khai thành luật** để không ai đổi thành
`if (vai === …)`.

`[F]` `CVE-2026-30820` (Flowise): chokepoint tin `x-request-from: internal` —
header do client đặt ⇒ *"one header, whole authz layer gone"*.
⚠️ `[S]` Đáng đọc riêng: kiến trúc LÕI/THỢ/BIÊN dựa **một phần** vào biên mạng
(`api-guard` nghe `127.0.0.1`), và `FR-051 §1` đã tự gọi đó là *"an toàn nhờ cấu
hình mạng"*. Flowise là ca đúng thứ đó vỡ khi có một proxy. Không phải lý do đổi
kiến trúc; là lý do **đừng để `§7` thêm một vế tin-vào-nguồn-gọi nữa**.

### 1.6 · Hình dạng **D** là ca đắt nhất cho `§7`, vì `§7` CHÍNH LÀ hình dạng D

`[F]` `CVE-2026-45672`, nguyên văn OSV: *"… **even when the admin has set
`ENABLE_CODE_EXECUTION=false`**. The feature gate is not enforced on the API
endpoint — **the configuration says "disabled" but code still executes**."*

`[S]` Đây là thất bại **đặc trưng của tính năng on/off**, và tệ hơn mọi ca khác
vì **màn hình nói ngược lại sự thật**. Admin thấy "tắt", tin đã tắt, không tìm
nữa. Một cờ không ai đọc **xấu hơn** một cờ không tồn tại: cờ không tồn tại thì
không ai tưởng mình an toàn.

`[F]` Tiền lệ mạnh nhất về **cách xử** hình dạng D: Grafana **xoá hẳn**
`editors_can_admin` ở 12.0, lý do nguyên văn:
> *"We're removing the settings because of the impact they would have on our new
> access engine. We're not able to support these settings with the engine. We're
> also considering these settings to be **outside of the current engine**, making
> it **unsafe** to give continued support to these settings."*
> — grafana.com/whats-new/2025-05-04-removal-of-editors_can_admin-configuration/

`[S]` ⇒ Một cờ config cấp đặc quyền **ngoài luồng** của engine phân quyền bị
đánh giá là **không đỡ được** và **xoá**. Đây đúng thứ `§7` sẽ tạo ra nếu ô
on/off không đi qua `duocLam`.

⇒ `[S]` **Cổng bắt buộc cho `§7`**: mỗi ô on/off phải có một test chứng minh
*"tắt ⇒ thao tác THẤT BẠI ở cửa thật"*. Không phải test *"cờ lưu được"*. Đúng
ngữ pháp `#cổng-không-đỏ-được`: một ô setting thiếu `đỏ_khi` là ô không cưỡng
chế được gì.

### 1.7 · Ca đáng đọc kỹ nhất: `CVE-2026-48086` (9.9)

`[F]` Nguyên văn NVD, hai câu quan trọng nhất của cả research này:

> *"No policy check enforces that **'only an existing GLOBAL_ADMIN may grant
> GLOBAL_ADMIN'**, so **the schema validation IS the authorization decision**."*

> *"A tenant admin can **promote a separate collaborator account instead of
> themselves, leaving their own audit trail clean** while the platform-wide
> breach happens through a separate identity."*

`[S]` Câu một: enum đóng là **miền giá trị**, không phải **phép uỷ quyền**. Nó
không trả lời *"ai được đặt `vai='chu'`"*. Đây là câu 3 ở §1.5.
`[S]` Câu hai: *"đổi quyền ghi audit"* **chưa đủ** nếu dòng audit không ghi **ai
đổi**. Kẻ tấn công không tự thăng — nó thăng một tài khoản khác. **§7.2: mã hiện
tại của dự án đúng lỗi này.**

### 1.8 · Một cảnh báo về việc bắt chước Open WebUI

`[F]` `docs.openwebui.com/security/vendor-dispositions/` — **26 CVE bị nhà phát
triển TỪ CHỐI**, mô hình đe doạ khai thẳng: ***"administrators are trusted actors
with full system control"*** và *"tools, functions, and pipelines execute
arbitrary code by design"*. Trong số bị từ chối: `CVE-2024-7806` (CSRF ⇒ pipeline
RCE, NVD vẫn `Analyzed`, 8.8) và `CVE-2024-7049` (token cấp cho vai `pending`, đi
vòng phê duyệt admin).

`[S]` ⇒ Đây **chính lập trường `FR-051 §7` đang đặt câu hỏi**, và hệ quả đo
được: khi *"admin ⇒ mã tuỳ ý"* thì **mọi** đường user→admin tự động thành RCE,
không còn tầng nào để mất. `CVE-2026-45395` là giá: một lỗi **bỏ sót cờ phân
quyền** ra thẳng thi hành Python.

⇒ `[S]` **Đòn rẻ nhất cho dự án 6 người không phải thắt phép kiểm vai**, mà là:
**không một trường nào admin ghi được từ form được diễn giải thành đường dẫn,
lệnh, URL để máy chủ gọi ra, hay mã.** `[F]` Giá nếu làm ngược: `CVE-2024-3104`
(9.8, `update-env` ⇒ RCE) · `CVE-2024-3028/3025` (trường `logo_filename` của cửa
`system-preferences` là một **đường dẫn** ⇒ đọc `.env`, xoá file tuỳ ý **kể cả
file SQLite**) · `CVE-2026-32625` (LibreChat: `${VAR}` trong URL MCP nội suy
**ngay trong tầng validate Zod** ⇒ rò `CREDS_KEY`, `JWT_SECRET`, `MONGO_URI`).
⚠️ Ca `logo_filename` đặc biệt đáng nhớ: dự án cũng dùng **một file SQLite**, và
cũng sẽ có một form setting.

### 1.9 · Chính ngành feature-flag nói flag KHÔNG phải phân quyền

Đây là bằng chứng ngoài **đúng đề** nhất cho câu *"phân quyền làm tính năng
on/off"*: những người bán feature-flag chuyên nghiệp đã trả lời câu hỏi này.

`[F]` **GrowthBook**, *"12 Common Feature Flag Mistakes to Avoid"*, **2026-05-01**
— sai lầm #2, tiêu đề *"Using client-side flags for security"*:
> ***"Feature flags control visibility, not access. They decide what users see —
> not what they're authorized to do."***
> *"**Keep your authorization logic server-side.** Use feature flags for UI
> presentation but enforce actual access control through your backend."*

`[F]` **LaunchDarkly**, CTO John Kodumal, **2017-10-20**: *"**Entitlements.** A
client-side feature flag alone is **not a sufficient control** for locking users
out of functionality that they shouldn't be able to access."*

⭐ `[F]` **Và triển lãm mạnh nhất — Flagsmith tự bác mình qua hai trang docs
không liên kết chéo.**
Trang *"When to use flags"*, dưới tiêu đề nguyên văn `## Personalisation and
Entitlement`: *"You can create segments of users based on their attributes (like
`plan: 'scale-up'`) and then enable or disable features for those segments."*
Trang *"Security"* (trang kia **không dẫn tới**): *"if you are setting
`plan=silver` as a trait, and then enabling/disabling features based on that
plan, **a malicious user could, with a client-side SDK, update their trait to
`plan=gold`** and unlock features they have not paid for."* … *"You can prevent
this by disabling the 'Persist traits when using client-side SDK keys' option.
**This option defaults to 'On'.**"*

`[S]` ⇒ Một nhà cung cấp **khuyến nghị** mẫu gating theo trait ở một trang,
**mô tả đúng cách đi vòng nó** ở trang khác, **không liên kết hai trang**, và
ship biện pháp chống **mặc định TẮT**. Đây là hình dạng *"cờ trở thành phân
quyền vì nó ở gần"* dưới dạng thuần khiết nhất.

`[F]` **Unleash tự mâu thuẫn theo kiểu khác**: docs *"best practices at scale"*
(cập nhật 2026-05-19) cảnh báo *"**Business logic often involves access controls
and entitlements. Using feature flags to manage these aspects can expose security
vulnerabilities** … Feature flags might be toggled accidentally or maliciously,
leading to unauthorized access"* và khuyên *"remove the flag and move the logic
into your entitlement service or backend code"* — nhưng docs khái niệm **ship một
loại flag hạng nhất tên `Permission`** với vòng đời **`Permanent`**, và **không
có liên kết chéo** giữa hai chỗ.
`[Đ]` Grep toàn bộ 204 file md/mdx của `Unleash/unleash-documentation` cho
`"not a security"`, `"security boundary"`, `"authorization mechanism"`,
`"should not be used"` ⇒ **0 hit**.

`[F]` **OpenFeature** (spec CNCF): `[Đ]` grep cả 18 file `.md` của
`open-feature/spec@main` cho `authoriz|access control|entitlement|permission`
⇒ **0 hit**. Spec **hoàn toàn im lặng** cả hai chiều. Câu chống-authz sắc nhất
tìm được lại là một **bài khách**, không có sức quy phạm (Jake Van Vorhis,
Virtru, 2023-06-29): *"**it would never be a good idea to use a flag to determine
if a user is an admin or not**, but it's easy to see how something like that
could get considered if flags are ridiculously easy to place. **Some friction is
definitely a good thing!**"*

| nhà cung cấp | docs **CẤM** flag-làm-authz? | docs **KHUYẾN NGHỊ** flag cho entitlement? |
|---|---|---|
| LaunchDarkly | **không** — chỉ blog 2017 | **có** — một guide docs riêng |
| Flagsmith | **không** — không chỗ nào | **có** — `## Personalisation and Entitlement` |
| GrowthBook | **không** — chỉ blog (2026-03, 2026-05) | không |
| Unleash | **không** | **có** — loại flag `Permission`, lifetime `Permanent` |
| OpenFeature | **không** — spec im lặng | không |

⚠️ `[S]` **Hệ quả cho `FR-051 §7`, và nó tinh tế**: bốn trên năm nhà cung cấp
**không cấm**, ba trên năm **khuyến nghị**, và cả năm **không** đặt luật vào chỗ
người ta sẽ đọc. Nên *"làm phân quyền thành tính năng on/off"* là một ý **hoàn
toàn tự nhiên** — nó là con đường mà cả ngành dẫn người ta vào. Đó là lý do `§7`
xứng đáng một FR có cổng, chứ không phải một lời cảnh báo: **cảnh báo là đúng thứ
đã được thử và đã thất bại ở cả năm nhà cung cấp.**
`[S]` Và điểm khác biệt cứu được dự án: mọi lời cảnh báo trên đều nói về
**client-side** flag. Ô on/off của `§7` sẽ được đọc ở **server**, trong
`duocLam`. Điều đó **loại bỏ** dạng tấn công Flagsmith mô tả (client sửa trait)
và để lại **đúng một** rủi ro: hình dạng D — *cờ không được đọc ở điểm cưỡng
chế* (§1.6). ⇒ Toàn bộ chi phí an ninh của `§7` dồn vào **một** cổng, và cổng đó
viết được.

---

## 2 · Cái gì PHẢI ở mã, cái gì ĐƯỢC ở dữ liệu

### 2.1 · Tên gọi trong tài liệu

| tên | nghĩa | nguồn `[F]` |
|---|---|---|
| **policy information … cannot be manipulated** | vế chuẩn của chính câu hỏi này | ASVS 4.0.3 **V4.1.2** (CWE-639) |
| **fail securely** | thiếu / lỗi ⇒ từ chối | ASVS 4.0.3 **V4.1.5** |
| **separation of duties** | tách vai quản quyền khỏi vai quản audit | NIST SP 800-53r5 **AC-5**; ASVS **V4.3.3** (CWE-732) |
| **protection of audit information** | audit chống sửa/xoá + **giới hạn ai quản audit** | NIST SP 800-53r5 **AU-9** + (1)…(7) |
| **privilege escalation prevention** / **delegate** | không ghi được quyền mình không có | k8s `ConfirmNoEscalation`; Grafana `permissions:type:delegate`; CloudStack |
| **superuser hardcode** | một danh tính đi vòng toàn bộ RBAC-trong-DB, **khai trong mã** | k8s `system:masters` |
| **shadowed by global** | giá trị ở file/env **vô hiệu hoá** đường ghi từ form | Discourse `setup_shadowed_methods` |
| **reserved value** | một giá trị chủ thể **không được** đặt | Grafana `uid = *` |
| **fixed / basic / managed role prefix** | tách **namespace** vai khai-trong-mã khỏi vai khai-trong-DB | Grafana `pkg/services/accesscontrol/roles.go` |
| **restricted management administrative unit** | *"quyền cao nhất vẫn có thứ không chạm được"* | Microsoft Entra ID, GA 2023-11 |

### 2.2 · Tiền lệ mạnh nhất, có mã đối chiếu: Kubernetes

`[F]` `kubernetes/kubernetes@master`, `pkg/registry/rbac/validation/rule.go:53`:
```go
// ConfirmNoEscalation determines if the roles for a given user in a given
// namespace encompass the provided role.
func ConfirmNoEscalation(ctx, ruleResolver, rules []rbacv1.PolicyRule) error {
	ownerRules, err := ruleResolver.RulesFor(ctx, user, namespace)
	ownerRightsCover, missingRights := validation.Covers(ownerRules, rules)
	if !ownerRightsCover { /* từ chối, liệt kê missingRights */ }
```
`[F]` `pkg/registry/rbac/escalation_check.go:32`:
```go
// EscalationAllowed checks if the user associated with the context is a superuser
func EscalationAllowed(ctx context.Context) bool {
	// system:masters is special because the API server uses it for privileged
	// loopback connections therefore we know that a member of system:masters
	// can always do anything
	for _, group := range u.GetGroups() {
		if group == user.SystemPrivilegedGroup { return true }
	}
	return false
}
```

`[F]` Luật, nguyên văn docs (`kubernetes/website` …`/rbac.md:850-851`) — và **câu
thứ hai mới là điểm quan trọng nhất của cả §2**:
> *"The RBAC API prevents users from escalating privileges by editing roles or
> role bindings. **Because this is enforced at the API level, it applies even
> when the RBAC authorizer is not in use.**"*

`[F]` **CHỖ ĐẶT là bài học, không phải nội dung luật.** Phép kiểm nằm ở **tầng
storage**, không ở middleware: `pkg/registry/rbac/role/policybased/storage.go`
(comment dòng 17: *"Package policybased implements a standard storage for Role
that **prevents privilege escalation**"*), cổng ở dòng 68 (`Create`) và 81
(`Update`); bản cho rolebinding ở `rolebinding/policybased/storage.go:70,96,102`.
Vì thế nó áp cho **kubectl, API thô, và cả controller** — và vì thế docs mới dám
nói *"applies even when the RBAC authorizer is not in use"*.

`[S]` Bốn điều đáng lấy:
1. RBAC của k8s **là dữ liệu trong etcd, sửa được ở runtime** ⇒ *"quyền ở dữ
   liệu"* tự nó **không phải** cái sai. `§7` không cần biện hộ về nguyên tắc.
2. Cái ở **mã** là **luật về việc GHI dữ liệu đó**. Đây là *invariant*, và nó
   **không có ô on/off**.
3. ⭐ **Đặt invariant vào ĐƯỜNG GHI, không vào handler.** `[S]` Với dự án: đặt nó
   trong `dungchung.mjs` (tầng chạm DB, đã là một cửa) chứ không trong
   `router.mjs`. **Mọi** ca hình dạng A/B ở §1.2 là một luật đặt **cạnh** một
   code path thay vì **dưới** tất cả: Kirby (Panel có, REST API không) ·
   Flagsmith (`CustomUserCreateSerializer` có, OAuth serializer không) · Argo CD
   (controller không-shard có, controller shard không) · Open WebUI (HTTP có,
   WebSocket không).
4. `system:masters` **hardcode trong mã, kèm lý do viết ngay tại chỗ** — và
   `[F]` k8s dùng **đúng từ**: *"`system:masters` is a **break-glass, super user
   group that bypasses the authorization layer** (for example, RBAC)"*
   (`kubeadm-certs.md:387-401`). Xem §2.8.

`[F]` **Và xoá luật khỏi DB không có tác dụng — API server gieo lại lúc khởi
động** (`rbac.md:565-576`): *"**Auto-reconciliation.** At each start-up, the API
server updates default cluster roles with any missing permissions, and updates
default cluster role bindings with any missing subjects. **This allows the cluster
to repair accidental modifications.**"*
`[S]` ⇒ Mẫu thứ ba, khác cả *"kiểm"* và *"thay setter"*: **gieo lại từ nguồn ở
mã mỗi lần khởi động.** Với dự án, đây là cách rẻ nhất để `duyet-bai` không bao
giờ biến mất khỏi mã dù DB bị sửa: `QUYEN` là nguồn, DB chỉ giữ giá trị các ô đã
khai, và mỗi lần khởi động **đối chiếu và gieo lại** các ô thiếu.

`[F]` **NĂM hệ độc lập phát minh lại cùng luật này**:

| hệ | hiện thân |
|---|---|
| Kubernetes | `ConfirmNoEscalation` + verb `escalate`/`bind` |
| Grafana | scope `permissions:type:delegate` — *"indicates that you can delegate your permissions **only, or a subset of it**"* |
| CloudStack | bản vá `CVE-2025-47713` — *"the caller must possess **all privileges** of the user they are operating on"* |
| **Unleash** | `src/lib/features/project/can-grant-project-role.ts` — `canGrantProjectRole(granterPermissions, receiverPermissions)` chỉ `true` nếu granter **đã có mọi** quyền của receiver (gọi từ `project-service.ts:895`) |
| PostgreSQL | `GRANT` — *"**it will grant only those privileges for which the user has grant options**"*; và `CREATEROLE` *"does **not** convey the ability to create `SUPERUSER` roles"* |

`[S]` ⇒ Năm lần độc lập là dấu hiệu đây là **luật đúng**, không phải sở thích.
Với dự án 2 vai, luật này rút gọn thành **một dòng**: *chỉ `chu` được đặt `vai`,
và không ai đặt được vai cao hơn vai mình.*

`[F]` **PostgreSQL còn nêu một vế mà dữ liệu KHÔNG diễn đạt được** (giống §2.6):
*"**The right to drop an object, or to alter its definition in any way, is not
treated as a grantable privilege; it is inherent in the owner, and cannot be
granted or revoked.**"* `[S]` ⇒ Có quyền mà bản chất là **thuộc về ai sở hữu**,
không phải một hàng trong bảng. `duyet-bai` của dự án là đúng loại đó, và
`FR-051 §8b` (để nó **ngoài** bảng `QUYEN`) là cùng một lựa chọn.

### 2.3 · Tiền lệ gần dự án nhất về HÌNH DẠNG: Discourse

`[Đ]` `discourse/discourse@main`, tôi tải và đếm `config/site_settings.yml`:
**4914 dòng** · `hidden: true` × **257** · `client: true` × **383**.
`[S]` ⇒ *"ô nào hiện trên UI"* là **một trường khai trong file ở repo**, không
phải quyết định của mã UI. 257 cho thấy cơ chế **dùng thật, ở quy mô**.

`[F]` `lib/site_setting_extension.rb:1416-1420` — nếu `GlobalSetting` (đọc từ
`discourse.conf` / `DISCOURSE_*`) có tên setting đó, giá trị file thành
`shadowed_val`; `:1439-1440` gọi `setup_shadowed_methods` **thay vì**
`setup_methods`. Thân hàm, `:1063`:
```ruby
def setup_shadowed_methods(name, value)
  define_singleton_method clean_name do |scoped_to = nil| value end
  define_singleton_method "#{clean_name}=" do |val|
    if value != val
      Rails.logger.warn("An attempt was to change #{clean_name} SiteSetting to
        #{val} however it is shadowed so this will be ignored!")
    end
    nil
  end
end
```

`[S]` Mẫu sạch nhất trong cả research: **đường ghi không bị KIỂM, nó bị THAY
THẾ**. Setter thành no-op. Không có `if (duocPhep)` nào để quên, đảo dấu, hay bỏ
sót ở cửa thứ hai — tức **miễn nhiễm với hình dạng A và B**, hai hình dạng chiếm
**11/26** ca. Cùng hình dạng `FR-051 §8`: *"không phải được kiểm, là không tồn
tại"*.

`[F]` Grafana cùng ý, khác cách: `pkg/services/accesscontrol/roles.go` tách
**namespace** — vai khai-trong-mã mang tiền tố `fixed:` / `basic:`, vai
khai-trong-DB mang `ManagedRolePrefix`, và `ValidateFixedRole()` **từ chối** bất
cứ gì không mang tiền tố dành riêng.

### 2.4 · ⚠️ Mẫu `protectedFields` — và bằng chứng nó KHÔNG đủ

`[Đ]` Bản vá `CVE-2024-3283` (AnythingLLM commit `52fac844`, 3 file) tách **hai
hàm**: `updateSettings()` lọc theo `supportedFields` và từ chối
`protectedFields: ["multi_user_mode"]`; `_updateSettings()` nội bộ, **không lọc**.

`[F]` Hai năm sau, `CVE-2026-32715` trên **cùng cặp cửa**; theo GHSA
`wfq3-65gm-3g2p`, `updateSettings()` *"checked `supportedFields` but **failed to
enforce `protectedFields`**"*, và `default_system_prompt` + `hub_api_key` nằm
**trong** `supportedFields`.

⚠️ `[S]` Bài học, **ngược với điều tôi định khuyến nghị ban đầu**: danh sách
`protectedFields` là một **phép KIỂM**, nên nó thừa hưởng mọi bệnh của phép kiểm
— quên gọi, gọi sai nhánh, và một `_updateSettings()` **đi vòng còn sống** trong
cùng module. Nếu bắt chước, phải kèm **hai** cổng: (a) *"không route nào gọi hàm
không-lọc"*; (b) hình dạng Discourse §2.3 — **ô đóng thì không có hàng để ghi**,
chứ không phải *"có hàng nhưng bị từ chối"*.

### 2.5 · Hai nhà cung cấp nói thẳng, và một nhà **từ chối** sửa

`[F]` **Directus khai đúng luận đề này trong tài liệu của mình**
(`directus.com/docs/guides/security/best-practices`):
> *"Write access on `directus_users`, `directus_roles`, or `directus_policies`
> **can be used to escalate privileges**."*
> *"A user with unscoped create on `directus_users` can create a new
> administrator account. A user with update on `directus_policies` can **grant
> themselves any permission**."*

`[F]` Directus **hard-code** đúng hai thứ: `validateRemainingAdminUsers` (không
xoá được admin cuối) và chặn ghi `provider`/`external_identifier`/`tfa_secret`.
**Không** hard-code *"không được tự đổi `role`"* — cái đó giao cho **văn xuôi**.
`[S]` ⇒ Cùng trạng thái Keycloak trước 26.2.6 (§1.3), và GHSA-7h45 (2026-09-02)
là hệ quả.

`[F]` **Strapi được báo, xác nhận, rồi TỪ CHỐI sửa.** Issue **#16297** *"Any role
that can create users can create Super Admin user"* (mở 2023-04-04, nhãn
`status: confirmed`, đóng 2023-04-18), nguyên văn lời đóng:
> *"confirmed this is **not a bug**, our role system is **not hierarchical**
> meaning roles can't and won't depend on each other. … by giving a user the
> ability to create others there is **some level of trust that must be given** to
> that user."*

`[S]` Hình dạng lỗ của Strapi đáng nhớ: nó hard-code bảo vệ **HÀNG** super-admin
(`SUPER_ADMIN_CODE`, *"You cannot delete the super admin role"*, quyền read-only)
nhưng **không bảo vệ CON TRỎ tới hàng đó**. **Hàng đặc quyền bất biến; phép gán
thì ai có `admin::user.create` cũng ghi được.**
⚠️ `[S]` Đây đúng thứ `§7` phải tránh: `duyet-bai` để ngoài bảng `QUYEN` là bảo
vệ **hàng**; nếu form cho gán `vai='chu'` thì **con trỏ** vẫn mở, và `B-B1` chết
qua con trỏ chứ không qua hàng.

`[F]` **Nơi Strapi làm ĐÚNG — và là câu trả lời mẫu**: v4→v5 breaking change
`register.allowedFields`. v4: *"Any new fields added to the User content type
would be accepted by the registration form **by default**"* (chỉ cảnh báo lúc
khởi động). v5: *"An **undefined `allowedFields` is treated as an empty array**,
and **no fields are accepted by default**"*; `username`/`email`/`password`
**hardcode** là ba trường luôn cho, còn lại phải allowlist tường minh hoặc 400.
Nó thay thế `CVE-2023-39345` (2023-11-03, CVSS 7.6).
`[S]` ⇒ **Deny-by-default allowlist trong MÃ, thay cho việc tin vào cờ per-field
trong schema sửa-được-ở-runtime.** Đây là hình dạng `R1` nên lấy.

### 2.6 · Có invariant **KHÔNG diễn đạt được** ở tầng dữ liệu — Supabase

`[F]` Phán quyết của maintainer (steve-chavez, Supabase/PostgREST, 2021-02-03,
`github.com/orgs/supabase/discussions/656`): *"**RLS applies to the whole row**,
so it's not possible to use it in that way."*
`[S]` `UPDATE` policy cấp phạm vi **HÀNG**, và `WITH CHECK` chỉ thấy **hàng mới
đề nghị** — không so được mới-vs-cũ. ⇒ *"anh sửa được hàng profile của anh, nhưng
KHÔNG sửa được cột `role`"* là **bất khả diễn đạt bằng policy data**. Mọi cách
chữa đều đặt rào **ngoài** ngôn ngữ policy: `GRANT UPDATE(col)`, trigger
`BEFORE UPDATE`, view, hoặc `SECURITY DEFINER`.

`[F]` Và Supabase **ship một detector cho đúng anti-pattern này**: advisor lint
`0015_rls_references_user_metadata`, tiêu đề ***"Security policy relies on
user-editable data"***, kèm ví dụ khai thác `updateUser({ data: { is_admin: true
} })`, kèm thừa nhận: *"**There is no one-size-fits-all solution** to replacing a
RLS policy that references `user_metadata`."*

`[F]` `CVE-2024-24213` (Supabase `/pg_meta/default/query` SQL injection, 9.8) bị
**Supabase tranh chấp**: cửa đó là tính năng dashboard có chủ ý — một UI được
phép nhập SQL — nên **không có bản vá, và sẽ không bao giờ có**.
`[S]` ⇒ **Cửa mà toàn bộ mục đích là cho một operator được phép viết lại policy,
grant và thân hàm ở runtime, theo phán quyết của nhà cung cấp, KHÔNG phải một lỗ
hổng.** Tính sửa-được-ở-runtime của bề mặt phân quyền là một **năng lực có chủ
ý**, nằm ngoài quy trình CVE. `[S]` Hệ quả cho dự án: `§7` sẽ không bao giờ được
"chứng nhận an toàn" bởi ai; nó chỉ được **giới hạn** bởi ba câu ở §1.5.

`[F]` Và giá của thái cực còn lại: **Lovable `CVE-2025-48757`** (9.3, CWE-863,
2025-05-30) — RLS thiếu ⇒ đọc/ghi bảng tuỳ ý **không cần xác thực**; **170/1645
app (10,3%)**, 303 endpoint. **Nhà cung cấp không ship được bản vá mã nào — chỉ
tài liệu + một scanner.**
`[S]` ⇒ Khi phân quyền **chỉ** tồn tại dưới dạng dữ liệu tuỳ chọn, fail-open,
thì phương án chữa của nhà cung cấp co lại thành *"phát hiện và khuyên"*.

### 2.7 · Điểm chia file/DB của các hệ khác **không** vì an ninh

`[F]` Gitea: tiêu chí là **khởi động** — *"only configuration options that do not
affect Gitea's startup process should be migrated to the database"* (issue
#35635, PR #33909, từ 1.18).
`[F]` Strapi tách Admin/End User *"to maintain a **separation of concerns**"*
(strapi.io/blog 2019-07-16, cập nhật 2026-05-22), ở **tầng DB và tầng UI**;
`[Đ]` tôi đọc cả bài tìm lý do an ninh: **không có**.

`[S]` ⇒ Cảnh báo: nếu chia file/DB theo tiêu chí *"cái nào tiện sửa nóng"* thì
`duyet-bai` **rơi vào phía DB** — nó chẳng liên quan khởi động, và rất tiện nếu
sửa nóng được. **Tiêu chí an ninh phải khai riêng và khai trước**; nó không suy
ra được từ tiêu chí vận hành, và **không hệ nào ở trên có nó miễn phí**.

### 2.8 · Ba mẫu nữa, mỗi mẫu bịt một lỗ dự án đang có

**(a) `sudo`-list: danh sách *"không tắt được từ UI"* dưới dạng MÃ, không văn xuôi.**
⭐ `[F]` **HashiCorp Vault**, `api/sudo_paths.go:16-67` — một
`map[string]*regexp.Regexp` **51 mục**:
```go
var sudoPaths = map[string]*regexp.Regexp{
    "/sys/audit":        regexp.MustCompile(`^/sys/audit$`),
    "/sys/audit/{path}": regexp.MustCompile(`^/sys/audit/.+$`),
    "/sys/auth/{path}":  regexp.MustCompile(`^/sys/auth/.+$`),
    "/sys/raw/{path}":   regexp.MustCompile(`^/sys/raw(?:/.+)?$`),
    "/sys/seal":         regexp.MustCompile(`^/sys/seal$`),
    … }
```
`[F]` Ngữ nghĩa (`policies.mdx:251-260`): *"`sudo` — Allows access to paths that
are _root-protected_ … For example, **modifying the audit log backends requires a
token with `sudo` privileges**."* Và: *"`deny` — Disallows access. **This always
takes precedence regardless of any other defined capabilities, including
`sudo`.**"*
`[F]` Hai policy dựng sẵn: *"The `default` policy … **cannot be removed**"*;
*"The `root` policy … **cannot be modified or removed**"*. **Mọi policy khác** là
dữ liệu trong store của Vault.
`[S]` ⇒ Đây là **hình dạng artifact tốt nhất trong cả research**: một danh sách
**máy đọc được, nằm trong mã**, thay vì một bảng trong tài liệu. Và để ý mục đầu
tiên: *"modifying the audit log backends"* — Vault đặt **AU-9(4)** vào đúng danh
sách này. `[S]` Với dự án, `QUYEN` **đã** là cái map đó; cái thiếu là một danh
sách thứ hai — **`viec` nào không bao giờ vào bảng setting** — và nó phải nằm
cạnh `QUYEN`, cùng file, đếm được bằng grep.

**(b) Guardrail phải tự nêu tên mình trong danh sách deny của chính nó.**
⭐ `[F]` AWS IAM, policy `DelegatedUserBoundary` **tự liệt kê chính nó**:
```json
{ "Sid": "NoBoundaryPolicyEdit", "Effect": "Deny",
  "Action": ["iam:CreatePolicyVersion","iam:DeletePolicy",
             "iam:DeletePolicyVersion","iam:SetDefaultPolicyVersion"],
  "Resource": ["arn:…:policy/XCompanyBoundaries",
               "arn:…:policy/DelegatedUserBoundary"] }
```
`[F]` Bình luận của AWS: *"The `NoBoundaryPolicyEdit` statement denies Zhang
access to update the `XCompanyBoundaries` policy."* Cùng ý ở Microsoft: trong
danh sách **protected actions** của Entra có một mục tên ***"Protected action
management"*** — tức **guardrail bảo vệ khả năng đổi guardrail**.
⚠️ `[S]` ⇒ Vế này `FR-051 §7` **chưa có**, và nó là lỗ hiển nhiên nhất khi `§7`
thi công: nếu có một `viec` kiểu `"sua-cai-dat"` thì nó **phải không** cho sửa
danh sách ô-sửa-được. Nếu không, một ô on/off duy nhất mở ra tất cả các ô còn lại
— đúng `CVE-2026-17601` (sửa wildcard privilege của chính vai mình).

**(c) Hai credential, không phải một vai đặc quyền — và cái thứ hai là một FILE.**
⭐ `[F]` **kubeadm 1.29** tách đúng hai thứ: `admin.conf` mang
`O = kubeadm:cluster-admins` — **buộc vào RBAC, thu hồi được bằng cách sửa dữ
liệu**; `super-admin.conf` mang `O = system:masters` — **đi vòng tầng phân
quyền, thu hồi được chỉ bằng cách XOÁ FILE**. Kèm cảnh báo: *"create least
privileged access even for people who work as administrators … for anything other
than **break-glass (emergency) access**."*
`[F]` **Google**, *Building Secure and Reliable Systems*, ch. 5 — định nghĩa
chuẩn: *"**Breakglass** … provides access to your system in an emergency
situation and **bypasses your authorization system completely**."* Bốn luật:
quyền dùng **rất hạn chế** · **mọi** lần dùng được theo dõi sát · **kiểm tra định
kỳ** để chắc nó còn chạy khi cần · và cảnh báo văn hoá: *"**Without cultural
reinforcement, audits can become rubber stamps, and breakglass use can become an
everyday occurrence, losing its sense of importance or urgency.**"*
`[F]` **Keycloak** gọi đúng tên *"bootstrap admin"* và khai bốn tính chất dùng
được ngay: tạo **chỉ khi** store còn rỗng (*"created only during the initial start
… when the master realm doesn't exist yet"*) · **đánh dấu tạm** trên UI · *"the
account **needs to be removed manually**"* · và đường phục hồi đòi **dừng tiến
trình**: *"**all the Keycloak nodes need to be stopped prior to using this
command**"*.
`[F]` **Vault** cùng luật: *"**After configured, the initial root token should be
revoked**"*, và tạo lại root đòi **đủ số** người giữ khoá unseal.

**Và invariant *"không xoá được admin cuối"* — BỐN sản phẩm công bố nó:**

| sản phẩm | nguyên văn `[F]` |
|---|---|
| Microsoft Entra | *"**Microsoft Entra ID prevents the last Global Administrator account from being deleted**"* |
| Entra PIM | *"**You can't remove the last active role assignment for Global Administrators** … **This is done to minimize risks of administrators locking themselves out of the tenant inadvertently.**"* |
| Directus | hàm `validateRemainingAdminUsers` (`api/src/permissions/modules/validate-remaining-admin/`) |
| Strapi | ném `'You must have at least one user with super admin role.'` |

`[F]` Kubernetes giải **khác**: không chặn xoá, mà **gieo lại binding
`cluster-admin` mỗi lần API server khởi động** (§2.2) + có `super-admin.conf`.
`[S]` ⇒ Hai đường, cả hai đều được: **chặn hạ vai `chu` cuối**, hoặc **có một
đường break-glass ngoài UI**. Cái **không** được là *"không có cả hai"* — và
`[Đ]` §7.4: đó đúng trạng thái dự án hôm nay.

---

## 3 · Audit của việc đổi quyền

### 3.1 · Chuẩn đã đặt tên đủ bốn mức

`[F]` NIST SP 800-53r5 **AU-9**: *"Protect audit information and audit logging
tools from unauthorized access, modification, and deletion; and **Alert
[personnel] upon detection** of unauthorized access, modification, or deletion."*

| | nguyên văn | dự án 6 người |
|---|---|---|
| AU-9(1) | *"Write audit trails to hardware-enforced, write-once media"* | thừa |
| **AU-9(2)** | *"Store audit records … in a repository that is part of a **physically different system**"* | **cần** — §3.4 |
| **AU-9(3)** | *"Implement **cryptographic mechanisms** to protect the integrity of audit information"* | rẻ |
| **AU-9(4)** | *"Authorize access to **management of audit logging functionality** to only [a subset]"* | **đúng ràng buộc `§7b`** |
| AU-9(5) | *"Enforce **dual authorization** for movement/deletion"* | `[S]` vô nghĩa khi chỉ có **một** `chu` |
| AU-9(6) | *"Authorize **read-only** access to audit information"* | `xem-audit: ["chu"]` đã có |

`[F]` NIST **AC-5** discussion: *"…ensuring that **security personnel who
administer access control functions do not also administer audit functions**."*
`[S]` ⇒ `FR-051 §7b` **chính là** AC-5 + AU-9(4), phát biểu độc lập và trùng
khớp. Không cần biện hộ thêm; cần **cài**.

⭐ `[F]` **Và cơ quan đặt ra yêu cầu WORM đã tự nới nó thành hai lựa chọn.** SEC
Release **34-96034**, thông qua **2022-10-12**, hiệu lực 2023-01-03, sửa 17 CFR
240.17a-4(f)(2)(i): hoặc *"a complete **time-stamped audit trail**"* ghi mọi sửa
/ xoá, mốc thời gian, **danh tính người thực hiện**, và đủ thông tin để *"permit
**re-creation** of the original record if it is modified or deleted"* — **hoặc**
WORM. Kèm (f)(2)(ii): **tự động** kiểm tính đầy đủ và chính xác.
`[S]` ⇒ Đây là hậu thuẫn quy phạm mạnh nhất cho hướng dự án đang đi: một vết
**đầy đủ, có danh tính người thực hiện, dựng lại được, và có bộ kiểm tự động**
là thứ được chấp nhận **thay cho** WORM. Chú ý ba chữ *"identity of the actor"* —
đúng vế §7.2 dự án đang thiếu.

### 3.2 · Giới hạn nền tảng của hash chain — nay là `[F]`, không còn `[G]`

`[F]` **RFC 9162 §1** (CT v2.0, 12/2021, **Experimental** — không phải Standards
Track):
> *"The log auditing mechanisms described in this document **can be circumvented
> by a misbehaving log that shows different, inconsistent views of itself to
> different clients**. Therefore, it is **necessary to treat each log as a
> trusted third party**."*

`[F]` **Crosby & Wallach**, *Efficient Data Structures for Tamper-Evident
Logging*, USENIX Security 2009 (chính là `[CrosbyWallach]` của RFC 6962), §1 —
và nó **gọi đúng tên kẻ tấn công của `§7`**:
> *"Malicious users, **including insiders with high-level access and the ability
> to subvert the logging system** … **While tamper-resistance for such a system
> might be impossible, tamper-detection should be guaranteed in a strong
> fashion.**"*
> *"**If an untrusted logger knows that a just-added event or returned commitment
> will not be audited, then any tampering … will be undiscovered**, and, by
> definition, the log is not tamper-evident."*

`[F]` RFC 6962 §7.3: *"**Violation of the append-only property is detected by
global gossiping**, i.e., everyone auditing logs comparing their versions of the
latest Signed Tree Heads."*
`[F]` `draft-ietf-trans-gossip-05` §2 — câu giết luôn phản biện *"nhưng bọn tôi
verify chuỗi mỗi lần đọc"*: *"**Each client would be able to verify the
append-only nature of the log but, in the extreme case, each client might see a
unique view of the log.**"*

⚠️ `[F]` Chữ *"split view"* và *"equivocation"* **không có trong cả hai RFC CT** —
đừng gán hai từ đó cho RFC 6962/9162.

⭐ `[Đ]` **Và có một demo chạy thật của đúng cuộc tấn công này** (Node v22.20.0,
SQLite 3.50.4): dựng log trung thực 4 hàng có `seq3 = 'perm.grant admin=SUPERUSER'`,
công bố head `3639cd8a…`. Admin thử `DELETE` → chặn; `UPDATE` → chặn. Admin
**`DROP` cả hai trigger, rèn lại chuỗi bỏ `seq3`, tạo lại trigger**:
```
log now: [perm.grant bob, perm.grant carol, doc.publish 42]
INTERNAL verify = {ok:true, bad:[]}     <== chuỗi TỰ NHẤT QUÁN. Không dấu vết.
new head = c8fbc4b9…  !==  published head 3639cd8a…   -> PHÁT HIỆN
```
`[S]` ⇒ Bản ghi buộc tội **biến mất**, chuỗi verify **hoàn hảo**, và **chỉ cái
head đã công bố ra ngoài** bắt được. Đây là §3.2 dưới dạng thí nghiệm.

`[F]` **Chi phí của nhân chứng là MỘT hash, không phải một bản sao**: RFC 6962 §8
(*"does not require third parties to maintain a copy of each entire log"*);
Crosby & Wallach §8 (*"only a constant amount of local state"*);
`transparency-dev/witness` (*"A Witness keeps a single Checkpoint for each log"*).
`[F]` **Chi tiết đáng cóp**: CT ký `{timestamp, tree_size, sha256_root_hash}` ⇒
công bố **`(số_hàng, head, thời_điểm)`**, không chỉ hash — nếu không thì **cắt
đuôi** (bỏ k hàng cuối) vẫn cho một chuỗi hợp lệ. Và RFC 6962 §2.1: lá và nút
trong băm với tiền tố khác nhau (`0x00`/`0x01`), *"required to give second
preimage resistance"*.

`[F]` **Tiền lệ, trạng thái 2026-09-02** — quan trọng vì mấy cái tên hay bị dẫn
như còn sống: **AWS QLDB đã NGỪNG** (*"end of support on 07/31/2025"*; docs live
404) · **Trillian**: *"Trillian is in maintenance mode"* · **Rekor**: *"Rekor v1
is in maintenance mode"* · **immudb** license `NOASSERTION`, và README tự nói
tính toàn vẹn *"will be protected by the **clients**, without the need to trust
the database"* — `[S]` tức "immutable" mô tả **mô hình dữ liệu**, không phải
chống sửa vật lý.
⭐ `[F]` Câu hay nhất của cả nhóm này, từ chính hướng dẫn digest của QLDB:
***"Save this file where you can access it in the future."*** `[S]` Một
hyperscaler kiểm soát cả storage, hashing và signing **vẫn** bảo khách giữ digest
**ở ngoài** ledger.

⚠️ `[F]` **Đừng nhầm `cksumvfs` là biện pháp an ninh**: sqlite.org/cksumvfs.html
nói nó *"intended to help detect database corruption caused by **random
bit-flips** in the mass storage device"* — checksum 8 byte, không mật mã, kẻ tấn
công tính lại miễn phí.

### 3.3 · ĐO THẬT: trigger `chi_noi_them` của SQLite vỡ ở đâu

Fixture ở thư mục tạm (`scratchpad/thu-trigger.mjs`, `thu2/3/4.mjs`), DDL
**giống hệt** `core/assets/kho.schema.sql:253-264`, **Node v22.20.0 / SQLite
3.50.4**. Kết quả dưới đây được **hai đường đo độc lập** cho cùng kết luận.

```sql
CREATE TABLE audit (stt INTEGER PRIMARY KEY, viec TEXT);
CREATE TRIGGER a_ko_sua BEFORE UPDATE ON audit BEGIN SELECT RAISE(ABORT,'chi noi them'); END;
CREATE TRIGGER a_ko_xoa BEFORE DELETE ON audit BEGIN SELECT RAISE(ABORT,'chi noi them'); END;
```

| thao tác | `[Đ]` |
|---|---|
| `UPDATE` · `DELETE` | **CHẶN** — và **chặn cả trên kết nối mới** (trigger không-TEMP nằm trong schema) |
| `UPDATE OR REPLACE` | **CHẶN** |
| `INSERT … ON CONFLICT DO UPDATE` (UPSERT) | **CHẶN** (đi qua trigger UPDATE) |
| **`INSERT OR REPLACE INTO audit (stt,viec) VALUES (1,'VO TOI')`** | ⚠️ **QUA** — hàng bị **ghi đè**, `count` vẫn 1, `THAT` → `VO TOI`, **không lỗi nào** |
| `PRAGMA writable_schema=ON` + `DELETE FROM sqlite_master WHERE type='trigger'` | **QUA** — và sau khi **đóng/mở lại file**: `sqlite_master` còn **0 trigger**, `UPDATE`/`DELETE` đều QUA, bảng về **0 hàng**. Mất trigger **vĩnh viễn** |
| `DROP TRIGGER` từ một kết nối `node:sqlite` thường | **QUA** — không cần đặc quyền gì |
| `CREATE TRIGGER … ON sqlite_master` (để trigger tự bảo vệ) | **CHẶN** — *"cannot create trigger on system table"* |

⚠️ **`INSERT OR REPLACE` là một lỗ THẬT, đang mở, trong DDL hiện tại của dự án.**
`[F]` Nguyên nhân có tài liệu — sqlite.org/lang_conflict.html (cập nhật
2025-11-22):
> *"When the REPLACE conflict resolution strategy deletes rows in order to
> satisfy a constraint, **delete triggers fire if and only if recursive triggers
> are enabled**."*
> *"The update hook is not invoked for rows that are deleted by the REPLACE
> conflict resolution strategy. **Nor does REPLACE increment the change
> counter.**"*

`[S]` Nghiệt ở chỗ `INSERT` là cửa **duy nhất** dự án **cố ý** mở trên
`audit_log` — và nó đủ để **ghi đè** một hàng đã có, không chỉ nối thêm. Thêm
nữa: change counter không tăng ⇒ `changes()` **không** báo gì.

**Hai cách bịt, và chúng KHÔNG tương đương** `[Đ]`:

| cách | chặn `INSERT OR REPLACE`? | sống qua kết nối mới? |
|---|---|---|
| `PRAGMA recursive_triggers = ON` | ✅ CHẶN | ❌ **KHÔNG** — kết nối 2 đọc lại `= 0`, lỗ **mở lại im lặng** |
| `CREATE TRIGGER … BEFORE INSERT ON audit WHEN EXISTS (SELECT 1 FROM audit WHERE stt = NEW.stt) BEGIN SELECT RAISE(ABORT,…); END;` | ✅ CHẶN | ✅ **CÓ** — nằm trong schema; `INSERT` bình thường vẫn QUA |

`[S]` ⇒ **Dùng trigger `BEFORE INSERT`, KHÔNG dùng pragma.**
`recursive_triggers` là trạng thái **mỗi kết nối**, **không lưu trong file**; một
chỗ mở kết nối mà quên đặt là **hình dạng B** ở §1.2 (đường thứ hai không qua
chokepoint) — đúng loại lỗi đã tốn PostgreSQL bảy năm. Trigger nằm trong file,
đúng luật *"đặt vào cấu trúc, không vào phép kiểm"*.
⚠️ `[Đ]` Nếu vẫn muốn thêm pragma làm lớp hai thì **phải đặt trên MỌI kết nối**,
và biết rằng `PRAGMA defensive=ON` là **no-op im lặng** trên `node:sqlite`
(SQLite không có pragma đó — chỉ có `SQLITE_DBCONFIG_DEFENSIVE` ở C API).

⚠️ `[Đ]` **Fingerprint schema lúc khởi động không cứu được**: phát hiện được
trigger **đang thiếu** (app fail-closed được), nhưng `DROP → sửa → CREATE lại y
nguyên` **phục hồi fingerprint**; và `PRAGMA schema_version` cũng đặt lại được
trên Node 22.

### 3.4 · Trigger chặn được ai, không chặn được ai — và câu chốt

`[F]` **Câu chốt của cả §3, từ chính tài liệu SQLite** —
sqlite.org/omitted.html, *"SQL Features That SQLite Does Not Implement"*:
> *"**GRANT and REVOKE** — Since SQLite reads and writes an ordinary disk file,
> **the only access permissions that can be applied are the normal file access
> permissions of the underlying operating system.** … not implemented because
> they would be meaningless for an embedded database engine."*

`[F]` Và tiện ích cũ **đã bị xoá**: SQLite 3.48.0 (2025-01-14) — *"Remove
vestigial traces of `SQLITE_USER_AUTHENTICATION`"*; `sqlite.org/userauth.html`
nay **404**. Node 22 bundle 3.50.4 ⇒ **đừng đề xuất nó**.

`[Đ]` **`node:sqlite` ở Node v22.20.0 KHÔNG có authorizer, KHÔNG có defensive
mode.** Đo bằng cách phân biệt option thật với option bị bỏ qua im lặng:
```
DatabaseSync.prototype: open, close, prepare, exec, function, location,
  aggregate, createSession, applyChangeset, enableLoadExtension, loadExtension
setAuthorizer ABSENT · enableDefensive ABSENT · serialize/deserialize ABSENT
constants = SQLITE_CHANGESET_* (8 khoá) — KHÔNG có action code của authorizer
new DatabaseSync(':memory:', { readOnly: 'CHUOI-SAI-KIEU' })
  → NÉM 'The "options.readOnly" argument must be a boolean.'  ← option THẬT, kiểm kiểu
{ authorizer | defensive | trustedSchema | xin_chao_khong_ton_tai: 'SAI' } → NHẬN
```
`[S]` Ba tên giữa được "nhận" **vì Node bỏ qua option lạ im lặng** — chứng minh
bằng đối chứng `readOnly`. `[F]` Module còn in `ExperimentalWarning`, stability
**1.1 Active development** trên v22.

⭐ `[F]` **Và đây là một quyết định kỹ thuật rẻ, có thật**: `node:sqlite` **Node
24** có `setAuthorizer` (v24.10.0), `enableDefensive` (v24.12.0), option
`defensive` (v24.14.0, mặc định `true`), và các hằng `SQLITE_DROP_TRIGGER` /
`SQLITE_PRAGMA` / `SQLITE_DENY`. Node 22 maintenance, **EOL 2027-04-30**; Node 24
Active LTS, **EOL 2028-04-30**.
`[S]` ⇒ Lên Node 24 cho phép **từ chối `DROP TRIGGER` và `PRAGMA` ngay trong tiến
trình** và **chặn hẳn `writable_schema`**. Nó **không** đổi gì với `sqlite3` hay
`rm` trên file ⇒ là **phòng thủ theo lớp**, không phải giải pháp — nhưng rẻ, và
Node 22 dù sao cũng phải rời trước 2027-04.
⚠️ `[F]` Ngay cả `SQLITE_DBCONFIG_DEFENSIVE` **không** chặn `DROP TRIGGER` — nó
chỉ chặn `writable_schema=ON`, `journal_mode=OFF`, `schema_version=N`, ghi
`sqlite_dbpage`, ghi shadow table. Muốn chặn `DROP TRIGGER` phải là **authorizer**.

`[S]` ⇒ **Ranh giới thật** của trigger `chi_noi_them`:
- **chặn được**: mọi thứ đi qua mã ứng dụng — handler mới viết sai, `UPDATE` gõ
  nhầm, cửa thứ hai bị quên. Giá trị này **thật và không nhỏ**: nó biến `§7b` từ
  lời hứa thành cấu trúc, và miễn nhiễm hình dạng A/B (11/26 ca).
- **KHÔNG chặn được**: ai chạy được SQL tuỳ ý hoặc chạm được file — tức **chính
  phiên admin bị chiếm** mà `§7` lo. `[F]` `CVE-2024-3028/3025`: một trường
  `logo_filename` trong cửa setting đủ để **xoá file SQLite**.

⇒ `[S]` **AU-9(2)** (ghi ra ngoài tiến trình) là phần **duy nhất** trigger không
làm thay được, và `omitted.html` là lý do cấu trúc: an ninh phải đến **từ ngoài
file**.

### 3.5 · ⚠️ Nhân chứng ngoài: chọn sai kênh thì bằng không

`[F]` Đối chiếu các lựa chọn rẻ, theo tài liệu:

| cách | mua được gì trước một admin có root | không mua được gì |
|---|---|---|
| `O_APPEND` | **chỉ đúng đắn về đồng thời**. Là cờ trên *fd*, không phải thuộc tính file | `truncate(2)` không có lỗi cho chế độ append; `O_TRUNC` khi mở lại, `unlink`+tạo lại, `sed -i` đều chạy |
| `chattr +a` | cưỡng chế thật ở kernel **trong lúc còn đặt**; `ioctl_iflags(2)` về `FS_APPEND_FL`: *"**This restriction applies even to the superuser**"* | `chattr -a` là **một lệnh** (cần root / `CAP_LINUX_IMMUTABLE`) |
| **`git push` sang remote admin KHÔNG kiểm soát** | tamper-evident thật; content-addressing làm **phân kỳ chứng minh được**. Bare repo host B + `receive.denyNonFastForwards` + `receive.denyDeletes`, admin không có shell | không chặn *"không gửi nữa"* ⇒ phải báo động khi **im lặng** |
| `git commit` **tại chỗ** | **không gì** — ref là file mutable admin sở hữu; reflog local, xoá được | — |
| rsyslog/TLS → host thứ hai | **mạnh nhất trong nhóm rẻ**: đổi *năng lực cần có* của kẻ tấn công sang một máy khác, credential khác | bằng chứng của **sự im lặng**, không phải nội dung |
| journald FSS (`Seal=`) | tốt nhất trong nhóm **thuần local**; forward-secure, khoá cũ bị xoá | ⚠️ cần **systemd ≥ 255** (IACR 2023/867: lỗi cho *"forge arbitrary logs for past entries"*); admin luôn là root ⇒ luôn giữ khoá hiện tại |
| **công bố head ra ngoài** (OpenTimestamps / RFC 3161 TSA) | cơ chế làm việc **viết lại quá khứ trở nên chứng minh được** | không chặn xoá sạch; **cửa sổ giữa hai lần công bố là viết lại được hoàn toàn** |

⚠️⚠️ `[F]` **Và đây là chỗ bản nháp trước của tôi SAI, nên tôi ghi lại thay vì
sửa lặng**: tôi đã đề nghị bắn đầu chuỗi qua **kênh telegram của `M18`**. Điều
đó **không dùng được**: bài trong một channel Telegram **do admin sở hữu** thì
admin **sửa và xoá được**. Một nhân chứng mà bên bị đánh giá sở hữu **không phải
nhân chứng** — đúng **luật gốc của dự án**, và tôi đã vi phạm chính nó khi đề
xuất.
`[S]` ⇒ Phương án dùng được, xếp theo độ rẻ: **(a)** email đầu chuỗi tới **cả
sáu** hộp thư (không ai xoá được hộp của người khác) · **(b)** `git push`
`_audit.jsonl` + head sang một remote mà `chu` **không** có quyền force-push ·
**(c)** `ots stamp` (OpenTimestamps, miễn phí, không cần tài khoản) trên file
head.
`[S]` Cả ba đều thoả AU-9(2) theo cùng một tính chất: **bên bị audit không sở
hữu bộ cưỡng chế.** Đó cũng là lý do S3 Object Lock chế độ *compliance* hoạt
động — `[F]` *"can't be overwritten or deleted by **any user, including the root
user in your AWS account**"* — vì **Amazon**, không phải bạn, chạy phần cưỡng chế.

---

## 4 · Quy mô 6 người: cái gì là THỪA

### 4.1 · Ngưỡng theo số người **KHÔNG TỒN TẠI dưới dạng công bố**

`[F]` **Kết quả âm tính, đã tìm kỹ**: sau tìm toàn văn NIST, ANSI/INCITS,
IEEE/ACM, OWASP, docs của các nhà cung cấp cloud và các nhà bán authorization —
**không nguồn nào** công bố phát biểu dạng *"dưới N người thì đừng làm RBAC"* hay
*"trên N người/vai thì RBAC đáng"*. 14 truy vấn; **9 PDF tải về grep toàn văn**
(Ferraiolo & Kuhn 1992, Sandhu 1996, NIST IR 7316, RTI 2002, RTI 2010,
Kuhn/Coyne/Weil 2010, ANSI INCITS 359-2004, Elliott & Knight 2015, Zanzibar
2019) cho `break-even`, `threshold`, `firm size`, `small organization`,
`per employee` — **toàn bộ âm tính**.
⇒ `[S]` **Mọi câu *"6 người thì RBAC là thừa"* (kể cả câu tôi viết dưới đây) là
`[S]`, không phải `[F]`.** Phải khai thẳng như thế trong proposal.

### 4.2 · Nhưng có một SÀN BẰNG CHỨNG, và có SỐ

⭐ `[F]` **RTI/NIST 2010, *Economic Analysis of RBAC*, chú thích 2**: *"the
**minimum firm-size threshold** included in the analysis was **500
employees**."* Và §5.3:
> *"RBAC is most likely to be used by **larger organizations** with sufficiently
> sized user bases to warrant adoption expenses … **Smaller organizations may
> indeed use RBAC; however, primary data collection and secondary research on
> usage trends among smaller organizations were insufficient** to estimate
> adoption, usage, and benefits."*

⭐ `[F]` **RTI 2010 Table 6-5** (USD 2009, lương admin $68.20/h): tiết kiệm của
RBAC so với ACL = **0,035 giờ-admin/người/năm = $2,38/người/năm**. Chi phí thi
công "naive" cho firm >500 = **$241,01/người**.

| | tỉ lệ NIST `[F]` | × 6 người `[S]` |
|---|---|---|
| thời gian admin tiết kiệm | 0,035 h/người/năm | **≈ 12,6 phút / năm** |
| giá trị | $2,38/người/năm | **≈ $14 / năm** |
| chi phí thi công | $241,01/người | **≈ $1.446** |
| hoàn vốn | — | **≈ 100 năm** (so với ~1,8 năm ở 10.000 người) |

`[S]` Và con số $1.446 còn **nói nhẹ**, vì chi phí phần lớn là **cố định**: RTI
2002 §6.4 firm nghiên cứu tình huống chi **$784.000**, trong đó ~$620.000 là
lao động role-engineering — và không ai bán cho bạn 6/10.000 của một thiết kế
policy.

`[F]` **Điều kiện kích hoạt trong bài gốc là BIẾN ĐỘNG NHÂN SỰ, không phải sĩ
số.** Ferraiolo & Kuhn 1992: *"For an organization that experiences a **large
turnover of personnel**, a role-based security policy is the only logical
choice."* Bài **không có** con số user/role/object nào. Nó cũng cảnh báo về
*"making the cost of security greater than the loss that might be expected
without the security"* — nguyên tắc tương xứng, từ chính tác giả RBAC.
`[S]` ⇒ Dự án: **6 người ổn định, không có turnover**. Điều kiện kích hoạt
**không** thoả.

`[F]` **Chuẩn tự nó là à-la-carte**: ANSI INCITS 359-2004 §2 Conformance — *"**Not
all RBAC features are appropriate for all applications**"*; **hierarchies và cả
hai loại separation-of-duty đều TUỲ CHỌN**. `[S]` ⇒ *"ANSI RBAC"* cho dự án này
nghĩa là **Core RBAC** thôi: user, role, permission, assignment — đúng cái
`QUYEN` + `duocLam` đang là.

`[F]` **Elliott & Knight, NSPW 2015** — câu duy nhất tìm được có phân theo quy
mô, §1.4: *"For **small organizations** where the number of roles remain
relatively small, **classic RBAC is often an adequate solution**."* (định tính,
không có số). Cùng bài đo được **ACME University: 351 subject / 558 role — tỉ lệ
role:subject 160%**, phản bác giả định phổ biến rằng số subject lớn hơn nhiều số
role; và ghi rằng các tổ chức *"likely have **no idea** what their current access
control systems are costing them"*.

`[F]` **NIST IR 7316 §3.4.5 *"Limitations of RBAC"***: *"**role engineering has
turned out to be a difficult task**. The challenge of RBAC is the contention
between strong security and easier administration."* Và §6, để so quy mô: *"Even
for **medium-sized** enterprises … the number of systems … can be in the
**hundreds**, and the number of resources … in the **tens of millions**."*
`[S]` Dự án: **1 hệ, <100 tài liệu** — năm tới sáu bậc độ lớn dưới sàn
*"medium"* của NIST.

### 4.3 · Cận trên: Zanzibar

`[F]` Pang et al., USENIX ATC 2019: *"more than **1.500 namespaces**"*, config
*"median near 500 lines"*, *"more than **2 nghìn tỉ** relation tuples … close to
**100 TB**"*, *"more than **10 triệu** client queries per second"*, *"more than
**10.000 servers**"*, *"fully replicated in more than **30 locations**"*,
availability *"above **99,999%**"*. §2.2 nêu **"new enemy" problem**: *"ACL checks
must respect the order in which users modify ACLs and object contents."*

⭐ `[S]` **Khung để dùng con số này cho đúng**: đóng góp kỹ thuật trung tâm của
Zanzibar (zookie, external consistency, Leopard index) giải một **hiểm hoạ sinh
ra từ việc lưu ACL nhân bản, nhất quán-cuối, đọc bởi nhiều service quản trị độc
lập**. **Một file SQLite một-người-ghi trong một tiến trình về cấu trúc KHÔNG
thể có "new enemy" problem** — SQLite tuần tự hoá ghi, nên cập nhật ACL và cập
nhật nội dung **đã** được sắp thứ tự toàn phần. `FR-051 §3c` + `M08` một-cửa-ghi
đã mua sẵn thứ Zanzibar phải phát minh.
⚠️ `[S]` Cẩn thận một chỗ dễ bị dùng ngược: median namespace của Zanzibar ~15.000
tuple, config có cái *"tens of lines"* — nên policy nhỏ **là bình thường bên
trong Google**. Nhưng đó là **tenant nhỏ của một engine ĐÃ CÓ**, hoàn toàn khác
với việc **xây** một engine.

### 4.4 · Vậy cái gì thừa, cái gì không

`[F]` Bảng quyền đầy đủ của dự án là **2 vai × 5 `viec` = 10 ô**
(`dungchung.mjs:1488`), `duyet-bai` **không** trong đó; `[Đ]` `duocLam` là **10
dòng**.

`[S]` **Thừa**, và lý do là số: policy engine riêng (OPA/Casbin/Cedar) · ABAC
(chưa có thuộc tính nào ngoài `vai` và `trang_thai`) · AU-9(1) WORM phần cứng ·
AU-9(5) dual authorization (không có người thứ hai để đồng ký) · **vai tự định
nghĩa được từ UI** (biến 10 ô thành N×M và mở lại `CVE-2026-9796` — §1.4).

`[F]` **Không thừa**, và ASVS xác nhận: ASVS gắn yêu cầu vào **độ nhạy dữ liệu
và tác động rò rỉ**, **không** vào sĩ số hay quy mô tổ chức, và **không chỗ nào
bắt buộc RBAC**. Sáu yêu cầu L1 áp vào dự án — V4.1.1 (cưỡng chế ở **trusted
service layer**), V4.1.2, V4.1.3 (least privilege), V4.1.5 (**fail securely**),
V4.2.1 (IDOR), V4.3.1 (MFA cho cửa admin) — `[S]` **cả sáu thoả được bằng điều
kiện phía server thuần, không cần policy engine**. V4.1.1 là cái **thật sự** ràng
buộc thiết kế: nó nói về **CHỖ** phép kiểm chạy, không về **sức biểu đạt**.
⚠️ `[F]` Đừng dẫn OWASP để biện hộ *"đừng làm nhiều"*: OWASP Authorization Cheat
Sheet khuyên **ngược** — *"**ABAC and ReBAC should typically be preferred**"* cho
phát triển mới, **không kèm điều kiện quy mô**. `[S]` Dẫn OWASP như bằng chứng
rằng hướng dẫn là *requirement-driven và im lặng về quy mô*, không như hậu thuẫn.

`[S]` ⇒ Chi tiêu đúng ở quy mô 6 người là **hình dạng cửa ghi** (allowlist
trường, không nhận object, chokepoint gác cả **trường** và **giá trị**) và
**vết** — không phải sức biểu đạt của policy. Bốn hệ ở §1 (AnythingLLM, Open
WebUI, LibreChat, LiteLLM) đều là phần mềm **nhóm nhỏ tự host**, và chúng chết ở
**cửa API nhận payload setting**, không ở thiếu policy engine.

### 4.5 · Phản biện phải NHẬN, không nên đấu

`[F]` **Tính kiểm-toán-được không phụ thuộc quy mô.** Sandhu et al. 1996 §2: *"A
major purpose of RBAC is to facilitate security administration **and review**."*
ANSI INCITS 359 đặt các hàm **review là BẮT BUỘC ở mức Core** (§6.1.3/§6.1.4).
NIST IR 7316 §3.1 nêu điểm yếu của ACL là điểm yếu **truy vấn**: *"it is
difficult to determine all privileges for a user … one would have to search all
of the ACLs."*
`[S]` ⇒ Nhưng để ý nó đòi **gì**: **một chỗ duy nhất, liệt kê được, chứa luật** +
**một vết của việc đổi luật**. Không đòi ngôn ngữ policy, decision point, tuple
store hay service riêng. `QUYEN` + `duocLam` + `audit_loi` **đã đúng hình dạng
đó** — thiếu đúng ba thứ ở §7.

`[F]` **Và hoãn vai vì lý do THÔNG TIN, không vì lý do công sức**: role mining
lấy phép gán quyền hiện có làm **đầu vào** và suy ra vai làm **đầu ra**. `[S]` Ở
6 người, dự án **chưa có dữ liệu** để biết vai đúng là gì; phép kiểm tường minh
theo `viec` **giữ lại** dữ liệu đó cho một lần di trú sau.

⚠️ `[F]` **Ghi nhận thiên lệch công bố, cho công bằng**: **không** tìm được nguồn
trung lập nặng ký nào **khẳng định** dùng điều kiện hard-code ở quy mô nhỏ. Quan
điểm *"chỉ cần if-statement"* được **thực hành rộng nhưng công bố mỏng** — không
ai viết bài để khuyên bạn **đừng mua gì**. Vắng hậu thuẫn ở đây là **bằng chứng
yếu**, không phải bằng chứng vắng mặt.
`[F]` Các nhà bán (Oso, Cerbos, Aserto, Axiomatics, OpenFGA, AuthZed) đều nói
*"externalize early"*; **không ai công bố ngưỡng**. `[S]` Bên có lợi ích thương
mại trực tiếp mà tập thể không công bố ngưỡng dù đó là phản đối phổ biến nhất của
người mua ⇒ khả năng cao động lực thật là **hình dạng yêu cầu** (multi-tenancy,
uỷ quyền, chia sẻ theo đối tượng, audit bị quản), **không phải sĩ số**.

---

## 5 · Gộp hay tách *"quản lý người dùng"* với *"cài đặt hệ thống"*

### 5.1 · Có tiền lệ tách, nhưng lý do **không** phải an ninh

`[F]` Strapi (2019-07-16, cập nhật 2026-05-22): *"to maintain a **separation of
concerns**"*, tách ở **tầng DB và tầng UI**. `[Đ]` Đọc cả bài tìm lý do an ninh:
**không có**.
`[S]` ⇒ *"Có hệ nào đã HỐI TIẾC vì gộp"*: **không tìm thấy hối tiếc khai bằng
chữ.** Xem §6.

### 5.2 · Nhưng có tiền lệ **CVE**, và nó trả lời đúng câu hỏi

`[F]` `CVE-2024-3283`: cửa bị lạm dụng tên **`/admin/system-preferences`** — cửa
**cài đặt hệ thống**; trường bị đổi là `multi_user_mode` — cờ **chế độ xác
thực**; hệ quả **tạo được một admin**. Ba tầng khác nhau, **một cửa**.
`[F]` `CVE-2026-32715`, 2 năm sau, cùng cặp cửa: *"the two **generic**
system-preferences endpoints allow **manager** role access, while **every other
surface** that touches the same settings is restricted to **admin** only"* ⇒ đọc
credential DB dạng thô + ghi đè `default_system_prompt`, `hub_api_key`.
`[F]` `CVE-2026-25045`: cửa là `/api/global/users` — cửa **quản lý người dùng** —
và `Creator` (vai *không* được quản người dùng) **thăng/giáng** được vai.
`[F]` `CVE-2023-4822` Grafana: Org Admin **sửa định nghĩa vai** *"in all
organizations"* — cửa "cấu hình tổ chức" mang quyền viết lại ma trận.

`[S]` ⇒ Tác hại **không** đến từ *"hai thứ ở cùng một MÀN"*. Nó đến từ *"hai thứ
ở cùng một **PHÉP UỶ QUYỀN**"*: khi `manager` được cấp *"sửa system preferences"*
như **một quyền khối**, thì trong khối đó có một ô quyết định *ai là admin*. Chữ
**"generic"** trong cả hai advisory AnythingLLM là hạt nhân của cả §5: **cửa
CHUNG cho mọi setting là thứ gom các quyền khác hạng vào một rổ.**

`[S]` ⇒ Với dự án: `FR-051` đã ghi *"`M18` là module NGANG … ranh giới giữa
chúng là **giấy**, không phải mã"*. Tôi **đồng ý, và xin thêm một dữ kiện**: thứ
phải tách **không phải module, không phải màn, mà là `viec` trong `QUYEN`**. Một
`viec` tên `"sua-cai-dat"` gộp cả hai là **tái tạo `CVE-2024-3283`** bất kể nó
nằm ở `M18` hay `M20`.

### 5.3 · Chuẩn nói gì

`[F]` NIST AC-5 đòi tách *"quản access control"* khỏi *"quản audit"*. ASVS
**V4.3.3** (L2/L3, CWE-732): *"… and / or **segregation of duties** …"*
`[S]` ⇒ Đường tách chuẩn đòi là **quyền ↔ audit**. **Không** chuẩn nào đòi tách
**người dùng ↔ cài đặt**. Dự án đang cân nhắc tách theo trục chuẩn không quan
tâm, và bỏ trục chuẩn có quan tâm.

---

## 6 · Chỗ KHÔNG có tiền lệ — và đã tìm ở đâu

`[Đ]` Đã tìm, **không thấy**:

1. **Ngưỡng theo số người / số vai cho policy engine** — §4.1: 14 truy vấn, 9
   PDF grep toàn văn (NIST, ANSI/INCITS, IEEE/ACM, OWASP, docs cloud, 6 nhà bán
   authorization). **Không một con số.** ⇒ §4.4 là `[S]`.
2. **Một hệ khai bằng chữ rằng gộp *"quản người dùng"* + *"cài đặt"* là sai.**
   Tìm: strapi.io/blog (đọc cả bài), docs.strapi.io RBAC + Users & Permissions,
   gitea #35635 + PR #33909, pgAdmin thread user-management tab, Adobe/Workfront
   admin console, WebSearch *"admin settings combined with user management design
   regret postmortem"*. Thứ tìm được là **CVE** (§5.2), không phải hồi ký thiết
   kế.
3. **Hash-chain audit-log dành riêng cho SQLite** — `[F]` GitHub repo search
   `sqlite-hashchain` trả **0 repository**; `sqlite merkle tree verifiable` → 0;
   sqlite.org site search `audit hash chain tamper` → **0 kết quả** (không có
   extension chính thức); **npm** 3 truy vấn → không gì liên quan; topic
   `audit-log` / `hash-chain` → chỉ vài dự án cá nhân **0–5 ★**.
   ⇒ `[S]` Ở đây **được phép** nói *"chưa có thứ dùng được"*, vì đã liệt kê nơi
   tìm. Dự án sẽ phải tự viết ~30 dòng.
4. **Advisory nào về *"non-admin ghi được bảng config admin của Open WebUI"*** —
   tìm NVD API, OSV, GHSA repo, `docs.openwebui.com/security/vendor-dispositions/`.
   Không có. Lỗi thật gần nhất là **bỏ qua cờ** (§1.6).
5. **Grafana**: không CVE nào lạm dụng `viewers_can_edit`/`editors_can_admin`,
   `reset_basic_roles`, hay service account (đã tìm, rỗng). `[S]` Đáng chú ý vì
   Grafana vẫn **xoá** `editors_can_admin` — vì rủi ro thiết kế, không vì đã có ca.
6. **Directus / Strapi**: không advisory nào cho *"user tự đổi `role` của mình"*
   (~75 hàng advisory Directus đã liệt kê). Với Directus đó là **hành vi mong
   đợi có tài liệu** (§2.5); với Strapi là **WONTFIX** (#16297).
7. **PostgREST, `pg_graphql`, `supabase/storage`, `supabase/supabase`**: cả bốn
   *"There aren't any published security advisories"*.
8. **Dify** (`langgenius`): 18 CVE trên NVD, sàng theo CWE + tiêu đề, không thấy
   ca admin-settings ⇒ leo thang. `[S]` *"chưa tìm thấy"*, không phải *"không
   có"* — mức sàng chưa đủ sâu.
9. `huntr.com` **không lấy nội dung được**: `/repos/mintplex-labs/anything-llm`
   trả **404**; `/bounties/<uuid>` trả vỏ JS. ⇒ Mọi ca gốc huntr trong file này
   dẫn qua NVD/OSV (CNA `security@huntr.dev`).
10. **NIST không dùng được làm nguồn cho WORM**: `[F]` CSRC glossary
    *"write once read many"* chỉ có phần giải nghĩa acronym và trỏ SP 800-98 —
    mà trong SP 800-98 (RFID) WORM là **bộ nhớ thẻ RFID**, không phải lưu trữ.
    ⇒ Dùng **SEC 34-96034** (§3.1) thay thế.
11. **Không nhà cung cấp feature-flag nào CẤM flag-làm-authz trong DOCS** —
    `[Đ]` §1.9: LaunchDarkly và GrowthBook chỉ có **blog**; Flagsmith và Unleash
    **không chỗ nào**; spec OpenFeature (18 file `.md`) grep
    `authoriz|access control|entitlement|permission` ⇒ **0 hit**.
    `[Đ]` Cũng grep toàn bộ repo `OWASP/CheatSheetSeries` + `OWASP/ASVS` cho
    `feature flag|feature toggle` ⇒ **0 hit ở ASVS, 0 ở cheatsheets đã publish**;
    một hit duy nhất ở một **draft chưa publish**, và nó **không** cấm.
    ⇒ `[S]` Chỗ trống này giải thích vì sao chỉ đạo `§7` là một ý tự nhiên.
12. **"policy-as-data" KHÔNG phải thuật ngữ của OPA/Styra/Cedar** — `[Đ]` tìm,
    không có. OPA dùng **base document** (nạp từ ngoài) vs **virtual document**
    (do policy tính), và câu đáng dẫn là: *"the location of virtual documents
    under `data` is controlled by **policies themselves** … base documents …
    controlled by **the software doing the loading**"*. ⇒ Đừng dùng
    *"policy-as-data"* trong FR như một thuật ngữ có nguồn.
13. **Casbin: 0 CVE trên OSV (Go/npm/PyPI/Maven) và 0 trên NVD** — `[Đ]` nhưng
    `[F]` repo `apache/casbin@master` **không có `SECURITY.md`**, và các lỗi
    `keyMatch2`/`keyMatch3` khớp sai đường dẫn được nộp dưới nhãn
    **`Enhancement`** (issue #199 mở 2019-01-28, #242, và tái diễn ở
    `pycasbin` #60/#87, `node-casbin` #66). ⇒ `[S]` Đọc *"0 advisory"* là
    **không có quy trình nhận báo lỗi**, không phải *"không có lỗi"*.
    ⚠️ `[F]` Và Casbin khai đúng luận đề §2 — *"**Models in Casbin are load-only**
    … **There is no API to save or update the model in storage**"* — rồi **tự phá
    nó** bằng mẫu ABAC được khuyến nghị: `m = eval(p.sub_rule)` khiến **một cột
    của bảng policy** được biên dịch và eval **mỗi request**
    (`enforcer.go:1085-1101`; ví dụ ship kèm: `examples/abac_rule_policy.csv`
    chứa `p, r.sub.Age > 18, /data1, read`). `[Đ]` Grep 72 file docs Casbin cho
    `untrusted|malicious|attack|injection` ⇒ **không một cảnh báo nào**.
    ⇒ `[S]` Luật cho dự án, hẹp hơn *"đừng eval"*: **cấu trúc eval-một-hàng không
    được tồn tại.** Nếu hàng policy bao giờ được so bằng gì hơn `===`, viết phép
    so đó thành **hàm có tên trong mã** và chỉ lưu **tham số** vào SQLite. Và
    **không bao giờ** để một hàng cấp một regex (Casbin `RegexMatch` là
    **unanchored substring**, và `regexp.MustCompile` trên dữ liệu policy
    **panic** ⇒ DoS).

`[Đ]` **Sáu số CVE trong danh sách gợi ý là SAI, bị rút, hoặc sai sản phẩm** —
ghi lại để không ai dẫn lại:

| số được gợi ý | thực tế |
|---|---|
| `CVE-2024-2000` | ⛔ **KHÔNG PHẢI Keycloak** — CNA là Wordfence, sản phẩm **Premium Addons PRO for Elementor** ≤2.9.12, stored XSS. `access.redhat.com/security/cve/CVE-2024-2000` trả **404** |
| `CVE-2019-18818` | ⛔ **KHÔNG PHẢI** "tự đặt vai lúc đăng ký" — là **xử lý sai reset mật khẩu** trong `strapi-admin/controllers/Auth.js` |
| `CVE-2024-4181` | ⛔ **sai sản phẩm** — là `llama_index` `RunGptLLM` eval injection, không phải AnythingLLM |
| `CVE-2024-37888` | ⛔ **sai sản phẩm** — là CKEditor `ckeditor-plugin-openlink` XSS, không phải LibreChat |
| `CVE-2024-7959` | **BỊ RÚT** — NVD `vulnStatus: Rejected`, CNA rút, sửa lần cuối 2026-07-16 |
| `CVE-2024-6531` | **BỊ CNA TỪ CHỐI** 2025-08-01 (*"This was not a security issue in Bootstrap"*) — và là **Bootstrap**, không phải Directus |

`[Đ]` Và năm số hay bị gán sai chủ đề: `CVE-2022-31107` (liên kết tài khoản
OAuth) · `CVE-2023-3128` (Azure AD `email` claim ⇒ **xác thực**) ·
`CVE-2021-43798` (path traversal) · `CVE-2022-39201` (rò cookie sang plugin) ·
`CVE-2023-2454` (**không phải RLS** — là `CREATE SCHEMA … schema_element` phá
`search_path`) — **không** ca nào là lỗi *dữ liệu phân quyền*.

---

## 7 · Bốn lỗ ĐO ĐƯỢC trong mã hiện tại của dự án

Cả bốn **có trước** `§7` và **không phải** hệ quả của nó — nhưng `§7` biến cả bốn
thành đường leo thang.
`[Đ]` `FROZEN.lock`: `dungchung.mjs`, `loi.schema.sql`, `kho.schema.sql`,
`SCR-16` **không frozen**; `06_modules/M18_nguoidung/spec.md` + `rules.md`
**frozen** ⇒ sửa luật `M18` cần FR.

### 7.1 · `audit_loi` KHÔNG có trigger chỉ-nối-thêm

`[Đ]` `core/assets/kho.schema.sql:261-264` — `audit_log` (DB **Kho**) **CÓ**
`audit_chi_noi_them` + `audit_khong_xoa`.
`[Đ]` `web/api/dungchung.mjs:1197-1199`, `:1210`, `:1217` — `audit_loi` (DB
**LÕI**, nơi `nguoi_dung.vai` sống) tạo bằng `CREATE TABLE IF NOT EXISTS
audit_loi (…)` **ba lần, không một trigger nào**.
`[Đ]` `web/api/loi.schema.sql` chỉ **nhắc** `audit_log` ở comment dòng 20.

`[Đ]` Và comment ở `dungchung.mjs:1052` khai:
> `// FR-051 §7b — đổi quyền PHẢI có vết. … audit_loi không có đường sửa.`

`[S]` Câu đó **đúng về mã hôm nay** và **sai về cấu trúc**. *"Không có đường
sửa"* nghĩa là *"chưa ai viết `UPDATE audit_loi`"* — theo đúng ngữ pháp
`#tự-khai`, đây là **lời khai**, không phải cổng. ⇒ Vết của việc đổi quyền —
**đúng thứ `§7b` bảo vệ** — đang ở bảng **ít răng hơn** bảng ghi việc thêm một
nhãn danh mục. Và `[Đ]` §3.3: bảng có răng **cũng** hở `INSERT OR REPLACE`.

### 7.2 · `loiDatVai` ghi **người bị đổi**, không ghi **người đổi**

`[Đ]` `web/api/dungchung.mjs:1045-1055`:
```js
export function loiDatVai(id, vai) {
  doi(id, "id")
  const _kq = dungLoiDb((db) => {
    db.prepare("UPDATE nguoi_dung SET vai = ? WHERE id = ?").run(vai, id)
    ...
  })
  // FR-051 §7b — đổi quyền PHẢI có vết. …
  loiGhiAudit({ hanh_dong: "doi-vai", doi_tuong: `nd:${id}`, nguoi_dung_id: id, ok: true })
```
`[Đ]` Chữ ký là `(id, vai)` — **không tham số nào cho người thực hiện** — nên
`nguoi_dung_id: id` **chỉ có thể là** người *bị* đổi vai. Dòng audit trả lời
*"vai của ai đã đổi"*, **không** trả lời *"ai đổi nó"*.

⚠️ `[S]` Đây **đúng** ca `CVE-2026-48086`: *"promote a separate collaborator
account instead of themselves, **leaving their own audit trail clean**"*. Và
`[F]` SEC 17a-4(f)(2)(i) gọi thẳng trường còn thiếu: *"**identity of the
actor**"*. Hôm nay tác hại nhỏ; ngày `§7` mở form thì đây là chỗ vết đứt — và nó
đứt **im lặng**, vì bảng vẫn có một dòng trông như đầy đủ.

`[Đ]` Thêm: `loiDatVai` **không kiểm gì** — không `duocLam`, không "ai gọi", và
không luật *"không đặt được vai cao hơn vai mình"* (§2.2). Nó chỉ dựa vào DDL
`CHECK` cho miền giá trị — tức đúng trạng thái `CVE-2026-48086` mô tả: *"the
schema validation IS the authorization decision"*.

### 7.3 · Chokepoint có thật nhưng **chưa nối vào cửa nào**

`[Đ]` `grep -rn "duocLam" --include=*.mjs --include=*.js` (trừ `node_modules`)
⇒ **3 nơi**: định nghĩa `dungchung.mjs:1506` + hai file test
(`web/test/loi-cua.test.js`, `web/test/phan-quyen.test.js`). **Không route nào
trong `web/api/router.mjs` gọi nó.** `loiDatVai` cũng vậy; và `QUYEN`
(`:1488`) **không có** `viec` nào tên `doi-vai`.

`[S]` `FR-051 §8` báo `Y3 ✅ đúng 1 chỗ đọc .vai` — **đúng như đã đo**, nhưng vế
đó đo *"có bao nhiêu chỗ ĐỌC"*, không đo *"có cửa nào GỌI"*. Hôm nay `QUYEN` là
**một thư viện đã test, chưa cắm điện**.
`[S]` ⇒ **Cắm chokepoint vào cửa TRƯỚC, mở form SAU.** Mở form trên một
chokepoint chưa nối là dựng bảng điều khiển cho một công tắc chưa nối dây — và
tệ hơn im lặng, vì màn hình **hiện** là có kiểm. `[F]` Đúng `CVE-2026-45672`.

### 7.4 · `chu` cuối cùng **tự khoá được cả hệ ra ngoài**, không có break-glass

`[Đ]` Không có phép kiểm *"admin cuối"* ở đâu trong mã. Hai đường tới trạng thái
**không còn một `chu` nào đang hoạt động**:
- `loiDatVai(id, 'dong_nghiep')` (`dungchung.mjs:1045`) — `UPDATE nguoi_dung SET
  vai = ?` không điều kiện;
- `loiThuHoi(id)` (`dungchung.mjs:1027`) — `UPDATE nguoi_dung SET
  trang_thai='thu_hoi' …` không điều kiện.

`[Đ]` Và `duocLam` (`:1506`) đòi **cả hai**: `trang_thai='hoat_dong'` **và**
`vai` có trong `QUYEN[viec]`. Bốn `viec` chỉ `chu` làm được là
`sua-bai-nguoi-khac`, `moi-nguoi-moi`, `thu-hoi`, `xem-audit`.

⇒ `[S]` **Không còn `chu` hoạt động ⇒ không ai còn mời được người mới, thu hồi
được ai, hay xem được audit — VĨNH VIỄN.** Và DENY-mặc-định (đúng theo `§8c`)
làm cho trạng thái đó **không tự phục hồi**: không có `viec` nào để tự thăng, và
đúng như thế mới an toàn. Đường ra duy nhất là **SQL trực tiếp trên file** — tức
đường mà §3.4 vừa chứng minh là **cùng đường kẻ tấn công dùng**.

`[S]` Đây là mặt sau của một lựa chọn **đúng**: fail-closed. Bốn sản phẩm ở §2.8
gặp đúng vấn đề này và chọn **chặn**; Kubernetes chọn **gieo lại + một file
break-glass**. Dự án hiện **không chọn gì cả**. `[F]` Entra PIM nói thẳng động
cơ: *"to minimize risks of administrators **locking themselves out** of the
tenant inadvertently."*

⚠️ `[S]` Vì sao nó thuộc research này chứ không phải một bug rời: `§7` sẽ **thêm
một đường ghi mới** vào đúng ma trận đó, từ một form. Một ô on/off gạt sai — hoặc
`loiDatVai` gọi từ form — biến khả năng này từ *"phải gọi API nội bộ"* thành
*"một cú click"*. Và `[Đ]` §7.1: vết của cú click đó nằm ở bảng không có trigger.

---

## 8 · Khuyến nghị cho dự án này

### 8.1 · Ba ràng buộc tối thiểu (R1–R3), và ba vế bổ trợ (R0, R4, R5)

**R1 · Ô mở là ALLOWLIST khai trong MÃ; chokepoint gác cả TRƯỜNG và GIÁ TRỊ.**
Giữ `§7a`, thêm sáu vế đo được:
- `[F]` `CVE-2018-8007` (đi vòng **blacklist**) ⇒ **allowlist**, không denylist.
  Cụ thể: `QUYEN` (`dungchung.mjs:1488`) giữ vai trò **schema** — khai `viec` nào
  tồn tại và `viec` nào **bật/tắt được**; DB chỉ giữ **giá trị boolean** của các
  ô đã khai. Hình dạng Discourse (§2.3) + Strapi v5 `allowedFields: []` (§2.5).
- `[F]` §1.5 ⇒ phát biểu lại `§3c`: chokepoint trả lời **ba** câu — *"ai ghi
  hàng nào"* (đã có), *"trường nào"* (chưa có), *"giá trị nào"* (chưa có).
- `[F]` `CVE-2026-31942` ⇒ với Node cụ thể: **không bao giờ**
  `{ userId: req.user.id, ...body }`. LibreChat mất API key của mọi người vì
  đúng thứ tự spread đó. Cửa ghi **không nhận object** — nhận `(viec, bat_tat)`.
- `[F]` §2.2 (k8s + Grafana `delegate` + CloudStack, ba hệ độc lập) ⇒ thêm một
  dòng: **không đặt được vai cao hơn vai mình**; và *"thêm vai"* / `duyet-bai`
  nằm **ngoài** tập sửa được (§1.4 — mất enum khoá-bằng-DDL là mở lại
  `CVE-2026-9796`).
- `[F]` §2.5 Strapi ⇒ bảo vệ **CON TRỎ**, không chỉ **HÀNG**. `duyet-bai` ngoài
  `QUYEN` bảo vệ hàng; nếu form gán được `vai='chu'` thì `B-B1` chết qua con trỏ.
- `[F]` §1.2 A+B (11/26 ca) ⇒ cổng đếm **"số cửa ghi setting" = 1**, test phủ
  **cả đường ghi hàng loạt và mọi transport**. `[F]` §2.4 ⇒ nếu bắt chước
  `protectedFields`, kèm cổng *"không route nào gọi hàm không-lọc"*.
- `[F]` §2.2 ⇒ **đặt invariant vào ĐƯỜNG GHI (`dungchung.mjs`), không vào
  handler (`router.mjs`)** — đây là lý do docs k8s dám nói *"applies even when
  the RBAC authorizer is not in use"*, và là thứ mọi ca hình dạng A/B thiếu.
- `[F]` §2.8(b) ⇒ **guardrail phải tự nêu tên mình trong deny của chính nó**:
  `viec` sửa-setting **không** được sửa **danh sách ô sửa được**. Không có vế
  này, một ô mở ra tất cả các ô — đúng `CVE-2026-17601`.
- ⚠️ `[F]` §1.2 (Unleash `CVE-2026-77426`) ⇒ **chokepoint quyền phải trả
  `boolean` ĐỒNG BỘ.** `duocLam` hôm nay đúng, nhưng do may. Một `await` bị quên
  biến `Promise` thành truthy và **mọi** phép kiểm thành `true`; cổng duy nhất
  bắt được là kiểu trả về.

**R2 · Vết đổi quyền ghi CẢ HAI danh tính, và nằm ở bảng CÓ RĂNG.**
- `[F]` `CVE-2026-48086` + SEC 17a-4(f)(2)(i) (*"identity of the actor"*) ⇒ dòng
  audit ghi **người thực hiện** và **người bị đổi**, hai trường riêng. Sửa
  `loiDatVai(id, vai)` → nhận thêm `boi` (§7.2).
- `[Đ]` §3.3 ⇒ `audit_loi` **và** `audit_log` phải có **ba** trigger:
  `BEFORE UPDATE`, `BEFORE DELETE`, **và `BEFORE INSERT … WHEN EXISTS (… stt =
  NEW.stt)`**. Vế thứ ba `kho.schema.sql` **đang thiếu**. **KHÔNG** dùng
  `PRAGMA recursive_triggers` làm vế duy nhất (đo được: không sống qua kết nối
  mới; và `PRAGMA defensive` là **no-op im lặng**).
- `[F]` AU-9(4) + AC-5 ⇒ *"quản quyền"* và *"quản audit"* không cùng một `viec`.
  Hôm nay `QUYEN` có `xem-audit: ["chu"]` (**đọc**) và **không** `viec` nào
  **ghi/xoá** audit. Trạng thái **đúng**: giữ, và **khai thành luật**.
- `[F]` SEC (f)(2)(ii) ⇒ một bộ kiểm **tự động** verify chuỗi, không phải một
  người mở ra xem.

**R3 · Nhân chứng phải là thứ `chu` KHÔNG sở hữu.** ⚠️ Vế này **sửa lỗi của
chính tôi**: bản nháp trước đề nghị bắn đầu chuỗi qua **kênh telegram `M18`** —
**sai**, vì bài trong channel do admin sở hữu thì admin **sửa và xoá được**, tức
vi phạm đúng **luật gốc của dự án**.
- `[F]` RFC 9162 §1 + Crosby & Wallach 2009 + `[Đ]` demo re-forge §3.2 ⇒ hash
  chain **một mình** không mua gì; nó chỉ có nghĩa cùng **một nhân chứng ngoài**.
- `[F]` Công bố **`(số_hàng, head, thời_điểm)`**, không chỉ hash — nếu không thì
  **cắt đuôi** vẫn cho chuỗi hợp lệ.
- `[F]` §3.5, xếp theo độ rẻ: **(a)** email head tới **cả sáu** hộp thư ·
  **(b)** `git push` `_audit.jsonl` + head sang remote mà `chu` **không** có
  force-push (`receive.denyNonFastForwards` + `denyDeletes`) · **(c)**
  `ots stamp` (OpenTimestamps, miễn phí, không cần tài khoản).
- `[F]` Khai thẳng **cửa sổ không phát hiện được = khoảng giữa hai lần công bố**.

**R0 · Vế nền, rẻ hơn cả ba vế trên** — `[S]` từ §1.8: **không một trường nào
admin ghi được từ form được diễn giải thành đường dẫn, lệnh, URL để máy chủ gọi
ra, hay mã.** `[F]` Giá nếu làm ngược: `CVE-2024-3104` (9.8) ·
`CVE-2024-3028/3025` (trường setting ⇒ **xoá được file SQLite**) ·
`CVE-2026-32625` (nội suy **trong tầng validate** ⇒ rò `JWT_SECRET`). Với vế
này, một lỗi bỏ sót phép kiểm vai tốn **toàn vẹn dữ liệu**, không tốn **máy chủ**.

**R5 · Chặn hạ vai `chu` cuối, HOẶC có một đường break-glass ngoài UI — không
được thiếu cả hai.** `[Đ]` §7.4 là lỗ này ở dạng đo được. Hai đường, cả hai có
tiền lệ, chọn một:
- `[F]` **Chặn** (Entra, Entra PIM, Directus `validateRemainingAdminUsers`,
  Strapi — **bốn** sản phẩm): `loiDatVai` và `loiThuHoi` từ chối nếu kết quả là
  **0 hàng** `vai='chu' AND trang_thai='hoat_dong'`. `[S]` Với 2 vai và 6 người,
  đây là **một `SELECT count(*)` trong cùng transaction** — rẻ nhất.
- `[F]` **Break-glass** (kubeadm 1.29 `super-admin.conf` + Keycloak
  bootstrap-admin + Google BSRS ch.5): một đường **ngoài UI**, chỉ khi bảng rỗng
  hoặc không còn `chu`, **đánh dấu tạm trên UI**, phải **xoá bằng tay**, phục hồi
  đòi **dừng tiến trình / chạm file**, và **mọi lần dùng ghi audit + báo động**.
- `[F]` Hoặc mẫu thứ ba của Kubernetes: **gieo lại từ `QUYEN` mỗi lần khởi
  động** (§2.2 auto-reconciliation) — `[S]` rẻ và hợp `SCR-16` (bảng khai trong
  repo là nguồn), nhưng **không** cứu được ca *"không còn `chu`"*, chỉ cứu ca
  *"ô setting bị sửa hỏng"*. Nên nó **bổ sung**, không thay hai vế trên.

`[S]` Khuyến nghị: **chặn** (vế 1) cho `§7`, vì nó là một dòng SQL; break-glass
để `no_con_lai` nếu chủ dự án muốn phòng cả ca mất file.

**R4 · Một quyết định hạ tầng rẻ, nên gộp vào cùng FR** — `[F]` §3.4:
`node:sqlite` **Node 24** có `setAuthorizer` (v24.10.0) + `defensive` (v24.14.0,
mặc định `true`) ⇒ **từ chối `SQLITE_DROP_TRIGGER` và `SQLITE_PRAGMA` ngay trong
tiến trình** và chặn hẳn `writable_schema`. Node 22 **EOL 2027-04-30**, Node 24
LTS **EOL 2028-04-30** ⇒ dù sao cũng phải lên. `[S]` Phòng thủ theo lớp, **không**
giải pháp (không đổi gì với `sqlite3` hay `rm`), nhưng gần như miễn phí.

### 8.2 · Gộp hay tách — một câu

**Gộp một MÀN, tách các `viec`** — và đây là dữ kiện, không phải sở thích:
`[F]` `CVE-2024-3283` + `CVE-2026-32715` bị khai thác qua **cửa "generic" mang
một quyền khối**, và `CVE-2023-4822` cho thấy cùng hình dạng ở Grafana, nên tác
hại nằm ở **độ thô của phép uỷ quyền**, không ở việc hai thứ hiện cùng một
trang; `[F]` NIST AC-5 + ASVS V4.3.3 đòi tách trục **quyền ↔ audit**, **không**
đòi tách trục **người dùng ↔ cài đặt**; `[F]` `FR-051 §7` đã đo `M18` là module
NGANG nên gộp/tách *"rẻ hơn bình thường, quyết muộn không đắt"*. `[S]` ⇒ Với 1
admin + 5 đồng nghiệp, một màn *"Quản lý và cài đặt hệ thống"* là **đúng** cho
người dùng; cái **không** được gộp là một `viec` kiểu `"sua-cai-dat"` bao cả *ai
là ai* lẫn *ai làm được gì*. Giữ chúng là hai `viec` riêng trong `QUYEN` thì việc
đặt số `M20` hay không trở thành **chuyện đặt tên** — đúng như `FR-051` đã kết
luận, và nên **hoãn tiếp**.

### 8.3 · Thứ tự thi công đề nghị

`[S]` **①** cắm `duocLam` vào các cửa thật + **R5 vế 1** (chặn `chu` cuối — một
`SELECT count(*)` trong cùng transaction; không có `§7` nào ở bước này) →
**②** R2 (vết + ba trigger + tham số `boi`) → **③** R3 (chuỗi hash + nhân chứng
ngoài) → **④** mới mở form R1, kèm cổng *"tắt ⇒ thao tác THẤT BẠI ở cửa thật"*
cho **từng** ô. R0 và R4 chạy song song, không chặn ai.
`[S]` **R5 phải ở bước ①**, không muộn hơn: bước ① là bước **bật** phân quyền,
tức cũng là bước đầu tiên mà một lần gạt sai khoá được cả hệ (§7.4).
`[S]` Mở form ở bước ① hoặc ② là mở một đường ghi vào một ma trận chưa cưỡng chế
được, **và có một màn hình nói ngược lại** — đúng `CVE-2026-45672`.

### 8.4 · `SCR-16` — luật riêng đổi thế nào

`[S]` Luật hiện tại (*"KHÔNG form — một ô sửa được trên UI là một đường ghi ngoài
review"*) **không sai và không nên xoá**; nó nên **thu hẹp phạm vi**:
- Panel **trần & ngưỡng** và **model theo tác vụ**: giữ read-only, giữ dòng
  *"sửa ở: `<file>`"*. `[F]` Đúng chỗ Gitea/Discourse để ở file (§2.7), và `[S]`
  chúng là đúng loại trường `R0` cảnh báo (đường dẫn, URL, tên model).
- Thêm **đúng một** panel ghi được: các ô on/off của `QUYEN`, mỗi ô kèm **`viec`
  đã khai trong mã**; ô nào không khai thì **không hiện** — không phải "hiện mà
  disabled". `[F]` 257 `hidden: true` của Discourse là tiền lệ.
- `[S]` Ba state của `SCR-16` cần thêm state thứ tư: **"đã lưu nhưng chưa cưỡng
  chế"** không được phép tồn tại. Ghi vào DB mà cửa chưa đọc ⇒ màn hình **phải**
  báo lỗi, **không** được vẽ dấu tick. `[F]` `CVE-2026-45672` là giá của việc vẽ
  dấu tick.
