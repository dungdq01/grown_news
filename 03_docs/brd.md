# BRD — ràng buộc nghiệp vụ

> Câu hỏi của file này: **bị ràng buộc gì?** Không phải "làm gì" (PRD) hay
> "chia sao" (spec_overview).
>
> BRD là ràng buộc **cứng**. s4–s9 chỏi BRD ⇒ mở FR, không tự dàn xếp.
> Mỗi ràng buộc phải có ≥1 chỗ tiêu thụ — điều kiện đóng G3.

## Bối cảnh nghiệp vụ

Công cụ cá nhân, chạy local. Không có khách hàng, không có SLA.

> ⚠️ **SỬA 2026-09-01 (`FR-045`)**: câu cũ nói *"một người dùng… không có dữ
> liệu người khác"*, và cả hai vế **hết đúng** — hệ nay có **5 tài khoản** là
> đồng nghiệp, tức nó **đang** xử lý dữ liệu cá nhân của người khác.
> Hệ quả: `B-E5` (nghĩa vụ DLCN) **đã kích hoạt**, không còn là dự phòng.
> Vẫn đúng: không khách hàng, không SLA, không PCI, không uptime.

Ràng buộc thật của dự án này không đến từ pháp lý mà từ **bản chất của tri thức**:
tri thức sai còn tệ hơn không có tri thức, vì nó được dùng để dạy agent.

---

## Nhóm A — Tính đúng của tri thức

### B-A1 · Không khẳng định nào được vào kho mà thiếu địa chỉ

Mọi khẳng định phải neo vào một địa chỉ cụ thể (`file.py:44-71`, `12:04–13:30`,
`§4.2 Bảng 3`). Không có địa chỉ thì bắt buộc gắn tiền tố `[suy đoán]`.

**Vì sao cứng**: đây là thứ phân biệt bản phân tích với văn bản do AI viết ra.
Không có địa chỉ thì không kiểm được, và không kiểm được thì không dùng được.

**Tiêu thụ**: `validate.py` cổng 6 (mục 4/5/6 phải có locator) · reviewer S2

### B-A2 · Khẳng định yếu không bao giờ trở thành quy tắc điều khiển agent

Khẳng định mức `claimed` hoặc `conflicted` từ **một nguồn duy nhất** không được
mang verdict `NEW` hay `DEEPEN`. Chỉ được lưu dạng knowledge.

**Vì sao cứng**: Stanford 2025 đo được **17–34% truy vấn bịa** kể cả có RAG.
Nếu khẳng định yếu thành skill, sai lầm không dừng ở một bài mà lan sang mọi
output của agent về sau.

**Tiêu thụ**: `frontmatter.schema.json` conditional `allOf` — cưỡng chế bằng máy,
không phải quy ước. Test `test_claimed_mot_nguon_khong_duoc_thanh_skill`.

### B-A3 · Đếm nguồn độc lập theo nguồn gốc, không theo số bản phân tích

Ba bản phân tích về cùng một URL là **một** nguồn. Ba bài blog cùng trích lại một
paper gốc là **một** nguồn.

**Vì sao cứng**: đây là chỗ hệ số kiểm chứng chéo bị thổi phồng dễ nhất, và thổi
phồng độ tin nguy hiểm hơn không có độ tin — nó tạo cảm giác an toàn giả.

**Tiêu thụ**: `url_normalized` trong frontmatter · web gộp khi truy vấn (M3.3)

### B-A4 · Số liệu không có điều kiện đo thì không phải số liệu

"Nhanh hơn 40%" thiếu baseline, phần cứng, tải ⇒ loại, không ghi vào kho.

**Tiêu thụ**: cổng lọc Pass 4 của skill · người duyệt (checklist G-người)

---

## Nhóm B — Quyền và trách nhiệm

### B-B1 · Chỉ người mới được đổi `review_status` sang `approved`

Máy không bao giờ tự duyệt. Mọi đường vào — động (skill sinh) lẫn tĩnh (upload) —
đều vào kho ở trạng thái `draft`, không ngoại lệ.

**Vì sao cứng**: đây là chỗ duy nhất một con người đọc thật và chịu trách nhiệm.
Bỏ nó thì hệ thống thành máy nhân bản nội dung AI chưa ai đọc.

**Tiêu thụ**: `validate.py` không bao giờ set `approved` · web chỉ render
`approved` (M3.2) · reviewer S2

### B-B6 · Thứ quyết định QUYỀN không được sửa từ chỗ bị nó kiểm soát

*(mở 2026-09-03 — hệ quả chỉ đạo "phân quyền thành setting on/off sửa trên web")*

Ba tầng, và ranh giới giữa chúng là ràng buộc:

| tầng | sửa được từ web? |
|---|---|
| **bất biến** — `B-B1`, enum `vai`, tập ô sửa-được | **KHÔNG**, kể cả `chu` |
| **schema ô** — khoá nào tồn tại, kiểu gì | **KHÔNG** — sửa = PR + review |
| **giá trị ô** — boolean của ô đã khai | `chu`, qua web |

Đây là **luật gốc** (*"không ai được sở hữu thứ dùng để đánh giá mình"*) áp vào
chỗ nó dễ vỡ nhất. `OWASP ASVS 4.0.3 V4.1.2` cho phép policy sửa được *"unless
specifically authorized"* — ba tầng trên **là** chữ đó.

⚠️ **Bốn vế không thương lượng**, mỗi vế một CVE có thật:

1. `duyet-bai` **không bao giờ** là một ô — `B-B1` ở mã (`CVE-2024-3283`: một
   cửa setting đổi `multi_user_mode` ⇒ **tạo được admin**)
2. `vai` **không** là một ô — enum khoá bằng DDL `CHECK` (`CVE-2026-9796`: neo
   luật vào **tên vai** sửa được ⇒ TOCTOU đổi tên để thắng cuộc đua)
3. cửa ghi setting **không nhận object** — nhận `(khoá, giá trị)`
   (`CVE-2026-31942`: `{ userId: req.user.id, ...body }` ⇒ mất API key mọi người)
4. `viec` sửa-setting **không** sửa được **danh sách ô sửa được**
   (`CVE-2026-17601`: một ô mở ra tất cả các ô)

Và một vế nền, rẻ hơn cả bốn: **không ô nào được diễn giải thành đường dẫn,
lệnh, URL server gọi ra, hay mã**. Giá nếu làm ngược: `CVE-2024-3104` (**9.8**)
· `CVE-2024-3028/3025` (trường setting ⇒ **xoá được file SQLite**).

**Đổi ràng buộc này** ⇒ phải xem lại `B-B1`, `M18-R3`, và toàn bộ `FR-051`.

### B-B2 · Loại một bản phân tích thì bắt buộc ghi lý do

`review_status: rejected` mà thiếu `reject_reason` là trạng thái không hợp lệ.

**Vì sao cứng**: `reject_reason` là tín hiệu **duy nhất** để chỉnh cổng lọc Pass
4. Loại mà không ghi lý do thì cùng loại rác sẽ quay lại mãi.

**Tiêu thụ**: schema conditional · `validate.py` cổng 8

### B-B3 · Bản không truy được về nguồn gốc thì không vào kho

File upload từ ngoài thiếu link nguồn gốc ⇒ mức D ⇒ từ chối.

**Vì sao cứng**: không truy được nguồn thì mọi trích dẫn trong đó không kiểm
được, và nó chỉ là văn bản do một AI nào đó viết ra. Nhận vào là làm hỏng kho.

**Tiêu thụ**: cổng nạp `intake.md` · schema bắt buộc `url` khi `conformance: C`

---

## Nhóm C — Tính toàn vẹn của kho

### B-C1 · `kb/_kho.sqlite` là nguồn chân lý; file là export dẫn xuất

*(ĐẢO theo FR-034, 2026-08-26 — bản gốc: "File `.md` trong git là nguồn chân lý
duy nhất; database, cache, index đều là dẫn xuất.")*

Bài viết và danh mục sống trong `kb/_kho.sqlite` (gitignore). File `.md/.yaml`
trong `kb/` là **export dẫn xuất một chiều DB→file**, sinh bởi
`core/tools/xuat_kho.py` sau mỗi lần ghi, và **commit vào git làm backup**.
Đường file→DB duy nhất là `core/tools/dung_lai_db.py` — người/CI/test chạy,
server không bao giờ gọi.

**AC cứng**: clone repo không có DB → `dung_lai_db.py` → `xuat_kho.py` → ra
byte-equal với export trong git; và DB→file→DB cùng hash nội dung.
`cmd: python core/tests/check_export_dan_xuat.py`

**Vì sao cứng**: hai giá trị của bản gốc được GIỮ bằng cơ chế mới — (1) khả năng
review bằng `git diff`: export .md commit liên tục nên diff nội dung vẫn đọc
được; (2) dựng-lại-được sau khi mất mọi thứ (F4): export trong git + một lệnh.
Thứ đổi là chỗ đứng của transaction: hai AI ghi song song (FR-011/B-C3) cần
BEGIN IMMEDIATE thật, không phải mutex trong một process.

**Tiêu thụ**: `project_map.yaml` boundaries · `check_export_dan_xuat.py` ·
`xuat_kho.py`/`dung_lai_db.py`

### B-C2 · Khái niệm chỉ lấy từ danh mục kiểm soát, cấm tự sinh

Trường `concepts` chỉ chứa `id` có trong bảng `concepts` của kho (FR-034 — trước
là `kb/concepts.yaml`; file đó giờ là export). Không khớp ⇒ ghi vào
`concepts_proposed`, và mục chờ duyệt **không tính** vào hệ số kiểm chứng.

**Vì sao cứng**: không có luật này, sau 50 nguồn sẽ có bốn node riêng cho cùng
một khái niệm, hệ số kiểm chứng chéo mất nghĩa vì không gì gặp được nhau.

**Tiêu thụ**: `validate.py` cổng concepts (server cấp catalog xuất từ DB cùng
nhịp validate) · audit_log chỉ-nối-thêm ghi ai thêm nhãn nào khi nào

### B-C3 · Bundle web tĩnh không bao giờ ghi vào `kb/`

*(Sửa theo FR-011, 2026-08-19 — bản gốc: "Web không bao giờ ghi vào `kb/`".)*

Câu gốc gộp hai thứ; FR-011 tách ra:

- **Bundle web tĩnh** (output build, deploy được): read-only TUYỆT ĐỐI — không đổi.
- **API biên tập local** (M08, tiến trình riêng người tự chạy, chỉ `127.0.0.1`):
  được ghi vào kho (`kb/_kho.sqlite` — FR-034) — mỗi ghi là MỘT request người
  bấm, qua `validate.py --strict` trước COMMIT, xoá là bảng recycle không mất
  dữ liệu.

**Vì sao cứng (vế bundle)**: trang nằm ngoài máy này mà ghi được vào nguồn chân
lý là mất cả một-chiều lẫn lớp giảm thiểu §6. Mối lo gốc "hai chiều ghi sinh
xung đột không giải được" xử ở API: transaction BEGIN IMMEDIATE + ETag
`If-Match` — va chạm bị PHÁT HIỆN, không im lặng; git vẫn là lịch sử vì mỗi lần
ghi DB đều export ra `.md` để commit (FR-034).

**Tiêu thụ**: `project_map.yaml` `web_writes`/`api_writes` · `no-write-path.test.js`
(bundle + whitelist) · `api-guard.test.js` (M08) · reviewer S2 rà diff

---

## Nhóm D — Pháp lý và bản quyền

### B-D1 · Không sao chép nguyên khối nội dung nguồn

Bản phân tích là **mô tả và trích dẫn có địa chỉ**, không phải bản sao. Trích dẫn
để trần trong ngoặc vuông, không nhúng nguyên văn đoạn dài.

**Vì sao cứng**: kể cả dùng cá nhân, sao chép nguyên khối làm kho mất tính chất
"bản chắt lọc" và tạo rủi ro nếu sau này công bố.

**Tiêu thụ**: trần cứng 1800 từ · quy ước trích dẫn trong `format.md`

### B-D2 · Kiểm giấy phép trước khi copy code vào skill

Mô tả kỹ thuật không vướng. Sao chép nguyên đoạn từ repo GPL/AGPL cần cân nhắc.

**Tiêu thụ**: trường `license` ghi ở Pass 0 · `skill-gap.md` mục sinh skill

### B-D3 · Phạm vi cá nhân — không công bố cho bên thứ ba

Web chạy local hoặc private. Không SEO, không chia sẻ công khai.

**Vì sao cứng**: đây là ràng buộc **giới hạn phạm vi**, giúp B-D1 và mọi rủi ro
bản quyền ở mức thấp. Đổi ràng buộc này ⇒ phải xem lại toàn bộ nhóm D.

**Tiêu thụ**: PRD scope OUT · `web/README.md` · **FR-043 bậc 3** (2026-08-31)

> **Trạng thái 2026-09-01 — ĐÃ LUẬN LẠI qua `FR-045`, xem B-D3b.** Phạm vi đợt hai có mục *"dạy bạn bè qua
> Telegram/Zalo"*, tức gửi nội dung kho tới **người thứ ba**. Đó chính là thứ
> B-D3 cấm. `FR-043` giữ **bậc 3 ĐÓNG** và ghi rõ: mở nó cần một FR riêng nhắm
> vào chính `brd.md` này. Không được dàn xếp ở s4–s9.

### B-D3b · Vòng người, không phải số người *(FR-045, 2026-09-01)*

`B-D3` viết *"không chia sẻ công khai"*. Chỉ đạo mới: **5 tài khoản, là đồng
nghiệp**. Câu chữ vỡ — 5 người đọc là chia sẻ cho bên thứ ba.

Nhưng **lý do gốc còn nguyên**. `security_baseline §4` khai lý do thật: *"nếu
nạp nguồn nội bộ công ty, bản phân tích sẽ chứa thông tin đó"*. Đồng nghiệp
**cùng công ty** đọc phân tích nội bộ thì mối lo đó không tăng.

⇒ Ràng buộc đổi từ **SỐ người** sang **VÒNG người**:

> Kho chỉ tới người có bản ghi trong `nguoi_dung`. Không SEO, không link công
> khai, không ai đọc được mà không có account. Mở ra ngoài vòng đó ⇒ **FR mới**.

**Đây là SIẾT, không phải nới.** *"Private"* của B-D3 nghĩa là *"không ai biết
URL"* — một tính chất không đo được. B-D3b nghĩa là *"có một bảng ghi rõ ai
được"* — đếm được, thu hồi được, và cổng kiểm được.

**Tiêu thụ**: bảng `nguoi_dung` · cổng `U7` của `FR-045`

---

---

# Đợt hai — 2026-08-31 · ràng buộc của phạm vi AI/LLM + kênh

> Nguồn: `02_proposal/proposal-2-ai-llm-kenh.md` (đã duyệt) · `FR-043`.
> Đánh số nối tiếp trong nhóm cũ khi cùng chủ đề; nhóm **E** là trục MỚI —
> *dữ liệu rời khỏi máy* — mà bốn nhóm A/B/C/D chưa nhóm nào phủ.

## Nhóm A (nối) — Tính đúng của tri thức

### B-A5 · Địa chỉ phải PHÂN GIẢI ĐƯỢC, không chỉ tồn tại

`B-A1` đòi mọi khẳng định có địa chỉ. Đo 2026-08-30: `LOCATOR_RE` khớp **mọi**
cặp ngoặc vuông — một mảng số `[2, 1, 0.5]` và một công thức toán đều qua cổng.
Nên `B-A1` hiện được thoả bằng cách gõ hai dấu ngoặc.

Ràng buộc mới: **mỗi mục cần locator phải có ít nhất một địa chỉ mà MÁY phân
giải được** — trỏ tới file/trang/mốc thời gian có thật.

**Vì sao cứng**: khẳng định có địa chỉ không kiểm được thì không khác khẳng
định không có địa chỉ. Đây là điều kiện để `B-A1` có nghĩa, không phải một
ràng buộc thêm cho đẹp.

**Linh động có chủ ý**: nhận **nhiều dạng** (`[§II.4]` · `[file.md:12-31]` ·
`[p.7]` · `[t=03:15]` · `[slug]`); thứ không khớp dạng nào thì **bỏ qua, không
báo lỗi**. Cổng chỉ đỏ khi một mục **không có** địa chỉ nào hiểu được — nên
công thức toán trong ngoặc vuông vẫn viết thoải mái.

**Tiêu thụ**: bảng khai dạng địa chỉ · cổng S8 · `validate.py`

### B-A6 · `citations_verified` do MÁY tính, không do người khai

Đo 2026-08-30: `citations_sampled` và `citations_verified` đọc thẳng bằng
`fm.get()`; **không dòng nào trong repo tính chúng**. `05_intake/gate.py:75`
còn phát sẵn template *"BẮT BUỘC >=2: tự mở link"*.

⇒ Một agent ghi `sampled: 5 / verified: 5` rồi rải `[§II.4]` là qua sạch toàn
bộ bộ máy chống bịa.

**Vì sao cứng**: `CLAUDE.md` cấm thẳng — *"đếm tay rồi chép số; số phải do máy
tổng hợp từ nguồn"*. Hai trường này phải vào cùng nhóm với `word_count` và
`url_normalized` — dữ liệu **dẫn xuất**, khai sai thì đỏ.

**Giới hạn phải nói ra**: máy kiểm được *địa chỉ có thật + văn tại đó chứa từ
khoá*, **không** kiểm được *văn đó có ủng hộ khẳng định*. Đừng khai quá vạch.

**Tiêu thụ**: `validate.py --fix` · cổng S9

### B-A7 · Địa chỉ của bản TỔNG HỢP phải mang tên nguồn

Ở hồ sơ `phan-tich`, câu *"địa chỉ này trỏ đâu"* có đúng một đáp án — bản
ghi có một nguồn. Ở hồ sơ `tong-hop` (FR-044) nó có **N** đáp án.

Ràng buộc: mỗi địa chỉ trong bản tổng hợp phải **phân giải về một slug
trong `nguon`** đã khai — `[xgboost-stap-by-step:p.7]`, không phải `[p.7]`.
Và **mỗi nguồn đã khai phải được nhắc ít nhất một lần**.

**Vì sao cứng**: tổng hợp là chỗ **dễ bịa nhất** — nhiều nguồn, người đọc
khó dò tay. Khai năm nguồn cho oai rồi chỉ đọc hai là một kiểu bịa riêng
của hồ sơ này, và không cổng nào của `phan-tich` bắt được nó.

**Tiêu thụ**: `FR-044` cổng T1 · T2 · T3

## Nhóm B (nối) — Quyền và trách nhiệm

### B-B4 · Chỉ người trong ALLOWLIST được ghi vào kho qua kênh

Bot Telegram nhận tin nhắn từ **bất kỳ ai** bấm Start. Không có allowlist thì
kho thành hộp thư công cộng, và `B-B1` (chỉ người duyệt mới `approved`) không
cứu được — rác vẫn nằm trong kho ở `draft`.

**Vì sao cứng**: đây là **auth tối thiểu**, và nó mâu thuẫn biểu kiến với dòng
*"không auth"* trong bảng "KHÔNG áp dụng". Mâu thuẫn đó là biểu kiến: *không
auth* đúng cho web local; adapter kênh thì **mở ra Internet theo định nghĩa**.

**Tiêu thụ**: bảng `dinh_danh_kenh` · cổng đếm bản ghi tạo từ id lạ = 0 (M8.3)

> **Sửa 2026-09-01 (`FR-045`)**: allowlist **KHÔNG** còn nằm trong `kenh/`.
> Nó là **dữ liệu trong kho** — bảng `dinh_danh_kenh(kenh, chat_id,
> nguoi_dung_id)` — và `kenh/` **hỏi** `web` *"chat-id này thuộc ai"*.
>
> Ba thứ được: `kenh/` mỏng hơn (không tự quyết) · kênh thứ hai **không phải
> copy allowlist** ⇒ giúp đúng metric `M8.2` · định danh có **một** chỗ ở thay
> vì rải ở N adapter.
>
> Điều **không** đổi: `kenh/` vẫn là thứ duy nhất đứng giữa người lạ và cửa
> ghi. Chỉ khác là nó không còn là nơi *quyết*.

## Nhóm E — Dữ liệu RỜI KHỎI MÁY *(trục mới)*

Bốn nhóm cũ phủ: tri thức đúng (A) · ai được quyết (B) · kho toàn vẹn (C) ·
pháp lý nội dung (D). **Không nhóm nào nói về dữ liệu đi ra.** `B-D3` cấm
*công bố*, `security_baseline §4` cấm *nghe vào* — ở giữa là một lỗ.

### B-E1 · Bốn bậc gửi RA — bậc 3 MỞ có điều kiện (FR-045)

| bậc | ra cái gì | tới ai | trạng thái |
|---|---|---|---|
| 1 | token, request | nhà cung cấp kênh | ✅ mở |
| 2 | slug, tiêu đề, báo lỗi | **chính chủ dự án** | ✅ mở |
| 3 | **thân bài** | **người trong `nguoi_dung`** | ✅ **MỞ** — `FR-045` |
| 4 | tài liệu nguồn | nhà cung cấp model | ✅ mở, giai đoạn 1 |

**Tiêu thụ**: `FR-043` · cổng C1–C4 · `FR-045` cổng U5

> **Bậc 3 MỞ 2026-09-01 (`FR-045`)**, và điều kiện không được bỏ: chỉ tới
> **người trong `nguoi_dung`** (B-D3b), và **mỗi lần bắn phải ghi ai nhận,
> bài nào, lúc nào** vào `audit_log`. Cùng lý do `B-E3` đòi log payload gửi
> model: không log thì câu *"bài X đã tới tay ai"* không trả lời được, vĩnh viễn.

### B-E2 · MỘT cửa egress

Mọi lời gọi model đi qua **một** module. `web/api/**` **không bao giờ** gọi ra
Internet.

**Vì sao cứng**: hai cửa là hai chỗ phải audit, và cái thứ hai sẽ là cái không
ai nhớ. Cùng nguyên tắc với *một cửa ghi* của `B-C1`.

**Tiêu thụ**: cổng C1 · C2 · `api-guard` mở rộng

### B-E3 · Ghi lại CÁI GÌ đã rời khỏi máy

Mọi lời gọi model ghi log kèm `sha256` của payload đã gửi.

**Vì sao cứng**: không có log thì câu hỏi *"tài liệu X đã từng rời máy chưa"*
là **không trả lời được, vĩnh viễn**. Đây là điều kiện để B-E1 kiểm được sau
khi việc đã xảy ra.

**Tiêu thụ**: cổng C3

### B-E4 · Chỉ cắm kênh có BỀ MẶT CHÍNH THỨC

Kênh được cắm khi nó có API **có version, có tài liệu, có thông báo thay đổi**.
Không có ⇒ **không làm** — không phải "làm sau".

**Vì sao cứng**: crawler/client không chính thức là **cỗ máy hỏng-im-lặng theo
thiết kế** — nó không báo lỗi, nó trả dữ liệu sai. Dự án tồn tại để chống đúng
kiểu hỏng đó. Bằng chứng: FB gỡ Groups API 22/04/2024, có đội Anti-Scraping,
randomize class/id **cố ý**; scraper nguồn mở lớn nhất tự nhận *"không đáng tin
cho production"*.

**Tiêu thụ**: `adr.md` · review khi thêm kênh

### B-E5 · Giai đoạn 2 kích hoạt nghĩa vụ dữ liệu cá nhân

Khi có người dùng **không phải chủ dự án**: **NĐ 356/2025/NĐ-CP Điều 14** (hiệu
lực 01/01/2026, thay NĐ 13/2023 đã hết hiệu lực) đòi **hồ sơ đánh giá tác động
xử lý DLCN** và **hồ sơ đánh giá tác động chuyển DLCN xuyên biên giới**; cộng
nghĩa vụ **chỉ định bằng văn bản** nhân sự bảo vệ DLCN.

Gửi tin chat của người dùng VN tới model nước ngoài **chính là** chuyển dữ liệu
xuyên biên giới.

**Vì sao cứng**: chi phí này kích hoạt ở **khách trả tiền đầu tiên**, không phải
ở quy mô lớn. Ghi ở đây để giai đoạn 2 không phát hiện muộn.

**Tiêu thụ**: chưa có — **nợ đã biết**

> ⚠️ **KÍCH HOẠT THẬT 2026-09-01 (`FR-045`).** Không còn là dự phòng cho giai
> đoạn 2 — 5 đồng nghiệp nghĩa là hệ **đang** xử lý dữ liệu cá nhân của người
> khác. Ba nghĩa vụ đã đến: hồ sơ đánh giá tác động xử lý DLCN (Điều 14) · hồ
> sơ đánh giá tác động **chuyển xuyên biên giới** (tin chat của họ đi tới model
> nước ngoài, `B-E1` bậc 4) · **chỉ định bằng văn bản** nhân sự bảo vệ DLCN.
>
> Đây là việc **giấy tờ của người**, không phải của agent, và nó **không chặn
> thi công kỹ thuật**. Ghi ở đây để không ai phát hiện muộn.

---

## Ràng buộc KHÔNG áp dụng — ghi để s4 không dựng thừa

| Thường gặp | Vì sao không áp dụng |
|---|---|
| ~~GDPR / dữ liệu cá nhân~~ | ⛔ **HẾT ÁP DỤNG 09-01**: 5 đồng nghiệp = dữ liệu người khác ⇒ NĐ 356/2025 Điều 14 (`B-E5`) |
| ~~Auth / phân quyền / audit log~~ | ⛔ **HẾT ÁP DỤNG** — hai nhịp: **09-01** (`FR-045`) 5 tài khoản ⇒ auth có thật (`ma_moi`), `audit_log` bắt buộc (U4, U5). **09-03** (`FR-051`) phân quyền **có thật**: hai vai enum đóng, `duocLam` một chokepoint, DENY mặc định, cắm ở năm thao tác quản trị. Câu *"cột `vai` chưa ai đọc"* **hết đúng** |
| Uptime SLA, HA, disaster recovery | Không có khách hàng; git là backup |
| PCI / thanh toán | Không có giao dịch |
| Kiểm duyệt nội dung, báo cáo lạm dụng | Không có người dùng thứ hai |
| Đa ngôn ngữ / i18n | Một người dùng, tiếng Việt |

---

## Bảng truy — mỗi ràng buộc có chỗ tiêu thụ

| Ràng buộc | Chỗ tiêu thụ | Cưỡng chế bằng |
|---|---|---|
| B-A1 địa chỉ | validate cổng 6 | máy ✅ |
| B-A2 khẳng định yếu | schema `allOf` + test | **máy ✅** |
| B-A3 đếm độc lập | `url_normalized`, web gộp | máy (M3.3) ⏳ |
| B-A4 điều kiện đo | Pass 4 + người duyệt | người ⚠️ |
| B-B1 chỉ người duyệt | web render `approved` | máy (M3.2) ⏳ |
| B-B2 lý do loại | schema + validate cổng 8 | máy ✅ |
| B-B3 truy nguồn gốc | intake + schema `conformance: C` | máy ✅ |
| B-C1 DB là chân lý, file là export (FR-034) | `check_export_dan_xuat.py` + boundaries | máy ✅ |
| B-C2 danh mục khái niệm | validate cổng 4 + deny S1 | máy ✅ |
| B-C3 web không ghi | `web_writes: []` + reviewer | reviewer ⚠️ |
| B-D1 không sao chép khối | trần từ + quy ước trích dẫn | máy (trần) + người |
| B-D2 giấy phép | trường `license` | người ⚠️ |
| B-D3 phạm vi cá nhân | PRD scope OUT · FR-043 bậc 3 | quyết định ✅ |
| **B-A5** địa chỉ phân giải được | bảng khai dạng + cổng S8 | máy ⏳ |
| **B-A6** `citations_*` do máy tính | `validate --fix` + cổng S9 | máy ⏳ |
| **B-A7** địa chỉ tổng hợp mang tên nguồn | `FR-044` T1–T3 | máy ⏳ |
| **B-B4** allowlist kênh | bảng `dinh_danh_kenh` + M8.3 | máy ⏳ |
| **B-D3b** vòng người | bảng `nguoi_dung` + U7 | máy ⏳ |
| **B-E1** bốn bậc gửi RA | FR-043 · cổng C1–C4 | máy ⏳ |
| **B-E2** một cửa egress | cổng C1 · C2 | máy ⏳ |
| **B-E3** log cái gì đã gửi | cổng C3 | máy ⏳ |
| **B-E4** kênh có bề mặt chính thức | `adr.md` + review | reviewer ⚠️ |
| **B-E5** nghĩa vụ DLCN — **đã kích hoạt** | **chưa có** (giấy tờ của người) | ❌ nợ đã biết |

**⏳ = chỗ tiêu thụ chưa tồn tại** (web chưa có). Đây là nợ đã biết, không phải
thiếu sót — ghi ra để G4/G5 soi.

**⚠️ = cưỡng chế bằng người hoặc reviewer**, không phải máy. Bốn mục này là chỗ
yếu nhất của bộ ràng buộc; nếu sau này muốn siết, đây là danh sách ưu tiên.
