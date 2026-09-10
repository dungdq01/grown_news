# FR-051 · *"Vai nào làm được gì"* — lấp một cột trống

- **mở**: 2026-09-02 · **người quyết**: chủ dự án
- **trạng thái**: **ĐÃ ĐÓNG** 2026-09-02 — ma trận đầy + thi công · **thứ tự**: **c**
- **tầng bị chạm**: s3 (`prd.md` ba mũ) · s6 (`M18-R3` đổi vai) · s8 (`web/api/**`)

---

## 0 · Trạng thái đo được: `vai` là một cột TRỐNG

`nguoi_dung.vai` tồn tại từ `FR-045` và **không một dòng mã nào đọc nó để quyết
định gì**. Cổng `M18 AC-6.1` đang **cưỡng chế điều đó**: bốn giá trị `vai` khác
nhau (kể cả `null`) cho **cùng một** kết quả trên cùng thao tác ghi.

⇒ *"Phân quyền"* hôm nay là **một cột trống cộng một cổng bảo vệ sự trống rỗng
đó**. Nghe kỳ, nhưng nó **đúng**: `M18-R3` giữ nguyên trạng cho tới khi có
quyết định thật, thay vì để ai đó tự nghĩ ra một bảng phân quyền.

## 1 · Cái gì đang chặn thật hôm nay

**Đúng một thứ**: `M17-R6` — biên **lột** `review_status` khỏi payload.

Đó là lớp **duy nhất** giữa một tài khoản thường và quyền duyệt. Nó chặn **theo
đường**, không theo **người**: không ai đặt được `approved` qua cửa của máy, kể
cả chủ dự án. `B-B1` vẫn đúng vì chủ dự án duyệt qua **cửa của người**
(`POST /api/articles`), một cửa `M17-R6` không canh.

⚠️ **Hệ quả cần nói thẳng**: nếu ngày nào cửa của người lộ ra Internet, thì
**không có lớp nào phân biệt chủ dự án với 5 đồng nghiệp**. Hôm nay nó chỉ nghe
`127.0.0.1` (`api-guard`), nên chưa nguy. Nhưng đó là *"an toàn nhờ cấu hình
mạng"*, không phải *"an toàn nhờ phân quyền"*.

## 2 · Câu chủ dự án phải trả lời

`prd.md:8` đã khai **ba mũ** và **năm tài khoản đọc**. Cái chưa khai là **ma
trận**:

| | duyệt bài | nạp nguồn | sửa bài của người khác | mời người mới | thu hồi | xem audit |
|---|---|---|---|---|---|---|
| **chủ dự án** | ✅ `B-B1` | ✅ | ? | ? | ? | ? |
| **đồng nghiệp** | ❌ `B-B1` | ✅ dừng ở `draft` | ? | ? | ? | ? |

**Sáu dấu `?`.** Hai cột đầu đã chốt bởi `B-B1` + `M05-R1` và **không mở lại**.

⚠️ **Ô đáng nghĩ nhất là *"sửa bài của người khác"***: hôm nay `PUT /api/...`
không hỏi ai sửa. Với 5 người tin nhau thì không sao; nhưng `article_versions`
ghi *cái gì đổi* mà **không ghi ai đổi**, nên ba tháng sau *"ai sửa câu này"*
không có câu trả lời.

## 3 · Quyết định về HÌNH DẠNG (không quyết nội dung)

**a · Enum ĐÓNG, không phải chuỗi tự do.** `vai` hiện là `TEXT` không `CHECK`.
FR này thêm `CHECK (vai IN (...))`. Lý do: một chuỗi tự do làm mọi phép so
sánh thành *"có khớp chuỗi này không"*, và một lỗi chính tả thành một vai mới
im lặng.

**b · `null` phải có nghĩa TƯỜNG MINH.** Hôm nay `null` = *"chưa ai đọc"*. Sau
FR này `null` phải hoặc **bị cấm** (NOT NULL + DEFAULT) hoặc **có nghĩa rõ**.
Để `null` mơ hồ là mở đúng cửa `CVE-2026-47713`: `user ? whereWithUser(user) :
where({})` — thiếu danh tính thì trả **tất cả**.

**c · Phép kiểm quyền ở ĐÚNG MỘT chỗ.** Cùng hình dạng `M14 AC-8.4` và
`M18 AC-3.1`: một chokepoint đếm được, không phải `if` rải rác.

**d · DENY là mặc định.** Vai không khai được làm gì ⇒ **không được làm**.
Fail-closed, cùng luật `loiKiemKhoaDichVu`.

**e · `M18-R3` KHÔNG bị xoá — nó ĐỔI VAI.** Từ *"cấm dùng `vai` làm cổng"*
thành *"`vai` chỉ được đọc ở đúng chokepoint ở §3c"*. Rule cũ biến mất là mất
thứ chặn `if (vai === ...)` rải rác.

## 4 · Cổng

| | vế | đỏ khi |
|---|---|---|
| **Y1** | `vai` là enum đóng | `INSERT` một `vai` ngoài danh sách mà **qua** |
| **Y2** | `null` không mơ hồ | tồn tại một hàng `vai IS NULL` sau khi FR thi công |
| **Y3** | một chokepoint | đếm chỗ đọc `vai` để quyết định ≠ 1 |
| **Y4** | DENY mặc định | một vai không khai quyền nào mà làm được một thao tác |
| **Y5** | `B-B1` nguyên vẹn | một `vai` khác chủ dự án đặt được `approved` |
| **Y6** | `M17-R6` vẫn sống | biên ngừng lột `review_status` |

⚠️ **Y5 là vế không thương lượng.** Mọi ma trận nào chủ dự án chọn ở §2, ô
*"đồng nghiệp × duyệt bài"* vẫn là **❌**.

## 5 · Điều FR này KHÔNG làm

- **Không** chọn hộ nội dung ma trận §2. Sáu dấu `?` là quyết định của chủ dự án.
- **Không** thêm cột *"ai sửa"* vào `article_versions` — đó là nợ **riêng**,
  thuộc M02/M08, và gộp vào đây là trộn hai quyết định.
- **Không** đụng `B-B1` hay `M05-R1`.
- **Không** thi công trước khi §2 có câu trả lời — thi công một bảng phân quyền
  từ giá trị chưa ai định nghĩa **là chính thứ `M18-R3` sinh ra để chặn**.

---

## 6 · CHỐT — ma trận, và một chỉ đạo MỚI làm đổi hình dạng FR

Chủ dự án chốt, nguyên văn: *"Chủ dự án cả 4 quyền, đồng nghiệp ko có cả 4"*.

### Ma trận — đã đầy

| | duyệt bài | nạp nguồn | sửa bài người khác | mời người mới | thu hồi | xem audit |
|---|---|---|---|---|---|---|
| **chủ dự án** | ✅ `B-B1` | ✅ | ✅ | ✅ | ✅ | ✅ |
| **đồng nghiệp** | ❌ `B-B1` | ✅ dừng `draft` | ❌ | ❌ | ❌ | ❌ |

Sáu dấu `?` đã hết. Hai vai, hai hàng — và **nới ra sau dễ hơn thắt lại**.

---

## 7 · Chỉ đạo mới: phân quyền thành TÍNH NĂNG on/off sửa được trên web

Nguyên văn: *"note lại là phân quyền làm tính năng on/off - setting để admin
(tôi) có thể edit ngay trên web ⇒ có thể thêm module setting nữa; nếu cần có
thể gộp với quản lý người dùng luôn ⇒ **Quản lý và cài đặt hệ thống** (nên
research thêm)"*.

### Điều này đổi HẠNG của quyết định, không chỉ thêm một màn

Ma trận ở `§6` là **mã**. Một ma trận sửa được trên web là **dữ liệu**. Đó là
hai thứ khác nhau về hạng, và khác đúng ở chỗ **luật gốc của dự án** nói tới:

> **Không ai được sở hữu thứ dùng để đánh giá mình.**

Nếu phép kiểm quyền **đọc từ DB**, và DB **sửa được từ một form web**, thì thứ
quyết định *ai làm được gì* trở thành thứ **ghi được bởi bên bị nó kiểm soát**.
Cụ thể: một phiên admin bị chiếm không chỉ làm được việc của admin — nó **viết
lại được bảng quyền**, và sau đó mọi phép kiểm đều "đúng".

⚠️ Hôm nay rủi ro đó **nhỏ**: một admin duy nhất, `web/` chỉ nghe `127.0.0.1`.
Nhưng `M17_cong` tồn tại **để** đưa hệ này ra Internet. Ngày đó tới thì bảng
quyền sửa-được-qua-web là bề mặt tấn công **đắt nhất** trong cả hệ.

### Ba ràng buộc tôi đề nghị, để tính năng này an toàn mà vẫn tiện

**a · `B-B1` KHÔNG bao giờ là một ô on/off.** *"Chỉ chủ dự án duyệt bài"* phải
ở **mã**, không ở DB. Một cờ tắt được `B-B1` là một cờ sẽ có ngày bị tắt.

**b · Đổi quyền ghi `audit_log`, và audit KHÔNG sửa được qua setting.**
Nếu người sửa quyền cũng sửa được vết của việc sửa quyền, thì không còn biên ghi.

**c · Setting đọc-hiển-thị vs setting GHI phải tách bảng khai.**
`SCR-16` (`Cấu hình`) đã khai *"KHÔNG form — một ô sửa được trên UI là một
đường ghi ngoài review"*. Chỉ đạo này **mở** một đường ghi ở đó, nên phải nói
rõ **ô nào** mở, và mọi ô khác vẫn đóng.

### Vì sao CHƯA thi công, và cần gì trước

| tầng | trạng thái |
|---|---|
| s1 research | ❌ chưa — chủ dự án đã nói *"nên research thêm"* |
| s2 proposal | ❌ *"cài đặt hệ thống"* không có trong scope-in đợt hai |
| s3 PRD | ❌ chưa có |

Cùng hình dạng `M19_baihoc`: một **mở rộng phạm vi**, nên theo luật riêng của
s2 — *"Proposal duyệt xong = phạm vi thô CHỐT. Đổi ⇒ FR, không âm thầm phình ở
s3"* — nó cần **FR mở rộng phạm vi**, không phải một task.

### Gộp với `M18` hay module riêng — CHƯA quyết, và đây là dữ kiện

| | gộp vào `M18_nguoidung` | module riêng `M20_caidat` |
|---|---|---|
| **được** | một màn admin duy nhất, đúng ý *"Quản lý và cài đặt hệ thống"* | `M18` giữ đúng một việc |
| **mất** | `M18` phình từ *"ai có account"* sang *"mọi cài đặt hệ thống"* — hai lý do đổi trong một module | hai module cho một màn; `M03` phải ghép |

⚠️ Dữ kiện đáng cân: `M18` là module **NGANG** (không sở hữu file mã nào). Một
module cài-đặt cũng NGANG. Hai module NGANG cùng đích **M03 + M08** thì ranh
giới giữa chúng là **giấy**, không phải mã — nên "gộp" và "tách" ở đây rẻ hơn
bình thường, và **quyết muộn không đắt**.

⇒ Ghi vào `no_con_lai`. Không mở module, không đặt số `M20` — đặt số cho một
module chưa qua s2 là tạo một con trỏ trỏ vào chỗ trống.

---

## 8 · Đóng — `Y1`–`Y7` chạy được

> ⚠️ **ĐỌC `§9` TRƯỚC KHI TIN MỤC NÀY.** Bảy cổng dưới đây xanh thật, nhưng chúng **không phủ hết** điều FR này hứa — và tôi đã đóng FR dựa trên chúng. Đính chính ở `§9`.

**Thi công**: `T08-16` (code) + `T08-16b` (test), 2026-09-02.
`web/test/phan-quyen.test.js` — 24 ca.

| cổng | |
|---|---|
| `Y1` enum đóng | ✅ `vai` ngoài `('chu','dong_nghiep')` bị **DDL** từ chối |
| `Y2` `null` bị cấm | ✅ `NOT NULL DEFAULT 'dong_nghiep'`; 0 hàng `vai IS NULL` |
| `Y3` một chokepoint | ✅ đúng **1** chỗ đọc `.vai`, ở `dungchung.mjs` |
| `Y4` DENY mặc định | ✅ `viec` chưa khai ⇒ **không ai** làm được, kể cả chủ dự án |
| `Y5` `B-B1` nguyên vẹn | ✅ `duyet-bai` **không** trong bảng `QUYEN` |
| `Y6` `M17-R6` vẫn sống | ✅ biên vẫn lột `review_status` |
| `Y7` đổi vai ghi audit | ✅ |

`M18`: **21 hard / 0 soft**. `M17 AC-4.2` promote `soft` → `hard` — mở được vì
FR này chốt ma trận.

### Ba thứ đặt vào CẤU TRÚC, không vào phép kiểm

**a · `vai NOT NULL DEFAULT 'dong_nghiep'` + `CHECK` enum.** Mặc định là vai
**ít quyền nhất**, và ca `vai = null` của `CVE-2026-47713` **không dựng được
nữa** — không phải "được kiểm", là **không tồn tại**.

**b · `duyet-bai` KHÔNG trong bảng `QUYEN`.** Quan trọng hơn khi `§7` (setting
on/off) thi công: lúc đó bảng đó thành **dữ liệu sửa được từ form**, và `B-B1`
**không nằm trong** thứ sửa được.

**c · DENY mặc định.** Thêm một thao tác mới mà quên khai quyền ⇒ nó **không
chạy được**, chứ không phải **ai cũng chạy được**.

### `AC-6.1` đổi nghĩa, KHÔNG bị xoá

AC cũ cưỡng chế *"`vai` không có tác dụng"* — đúng khi nó là cột trống. FR này
cho nó tác dụng ⇒ AC cũ **phải đỏ**, và nó đỏ bằng cách **NÉM**, vì `CHECK` mới
từ chối giá trị bịa mà nó gieo.

⚠️ **Sửa AC, không xoá cổng.** Xoá một cổng vì nó đỏ là cách một luật biến mất
mà **không ai quyết định gỡ nó**. Vế bản cũ giữ được — *"cùng `vai` ⇒ cùng kết
quả"* — nay là một trong năm ca của nghĩa mới.

### `§7` (setting on/off) vẫn NGUYÊN — chưa thi công

Cần `s1` research + `s2` proposal. Một agent `deep-research` đã chạy
(2026-09-02) và sẽ ghi vào `01_research/quan-ly-va-cai-dat-he-thong.md`.
Ba ràng buộc ở `§7` là **đầu vào** cho FR đó, không phải kết luận của nó.

---

## 9 · ĐÍNH CHÍNH `§8` — tôi đóng FR này bằng một phép đo SAI VẾ

**2026-09-03.** `§8` viết *"`Y1`–`Y7` chạy được"* và đó **đúng từng chữ nhưng
sai điều nó gợi ra**.

### Cái sai

`Y3` đếm **số chỗ ĐỌC `.vai`** = 1. Đúng. Nhưng đó là phép đo **sự tồn tại**
của chokepoint, **không** phải phép đo **có ai đi qua nó**.

Đo lại 2026-09-03: **0 route** gọi `duocLam`. Ma trận quyền là một hàm đúng, có
cổng canh xanh, và **không cưỡng chế gì trên bất kỳ request thật nào**.

⇒ **Cổng xanh rỗng** — đúng thứ `M17 AC-3.4` dành cả một đoạn để cảnh báo:
*"một cổng xanh rỗng tệ hơn không có cổng: nó làm người ta tin"*. Tôi viết đoạn
đó, rồi tự mắc.

⚠️ Và cái sai không nằm ở `Y3`. `Y3` đo đúng thứ nó khai. Cái sai là **tôi đóng
FR dựa trên một tập cổng không phủ hết điều FR hứa** — và không ai bắt được, vì
mỗi cổng riêng lẻ đều xanh thật.

### Ai tìm ra

Một agent `deep-research` (2026-09-02, cho module *"Quản lý và cài đặt hệ
thống"*). Nó đọc mã và báo bốn lỗi; tôi **tự đo lại cả bốn** trước khi nhận, và
**cả bốn đều thật**:

| | lỗi | nay |
|---|---|---|
| 1 | `audit_loi` **không có trigger** — bình luận của tôi là **lời khai** | ✅ 3 trigger |
| 2 | vết đổi quyền ghi **ai bị đổi**, không ghi **ai đã đổi** | ✅ cột `boi` |
| 3 | `duocLam` không route nào gọi | ✅ cắm 5 thao tác |
| 4 | hạ được **chủ dự án cuối** ⇒ hệ không tự khôi phục | ✅ chặn 2 hàm |

Cộng một lỗ tôi tự đo thêm: `INSERT OR REPLACE` **đi vòng cả hai trigger** của
`audit_log` — bảng audit của **kho**, có từ trước tôi.

### Trạng thái THẬT sau khi sửa (2026-09-03)

Chủ dự án chốt *"cắm cả 4 cửa nha"*. Đã cắm ở **tầng thao tác** — lý do và bản
đồ ở `M18 spec §6.5`.

| `viec` | ép ở | trạng thái |
|---|---|---|
| `moi-nguoi-moi` | `loiTaoNguoiDung` · `loiCapMaMoi` · `loiDatVai` | ✅ |
| `thu-hoi` | `loiThuHoi` | ✅ |
| `xem-audit` | `loiDocAudit` | ✅ |
| `sua-bai-nguoi-khac` | — | ⚠️ **CHƯA CẮM** — cửa của người chưa mang danh tính |
| `nap-nguon` | — | cả hai vai, không cần ép |

`M18`: **23 hard / 0 soft**. Cổng mới: `Y8` (audit append-only bằng cấu trúc) ·
`Y9` (vết nói *ai đã đổi*) · `Y10` (không hạ được admin cuối) · `Y11` (bốn cửa
đã cắm; câu «CHƯA CẮM» buộc gỡ khi cắm nốt) · `Y12` (tài khoản đầu là `chu`).

### Một DEADLOCK trong bản sửa của tôi — và nó chỉ lộ ra khi chạy thật

Bản đầu của phần cắm cửa luôn tạo `dong_nghiep`. Hệ quả: tài khoản **đầu tiên**
tạo được qua cửa bootstrap nhưng **không bao giờ nâng lên `chu` được** —
`loiDatVai` đòi quyền `moi-nguoi-moi`, quyền đó đòi vai `chu`, không ai có.

**Một hệ thống không ai quản được, từ dòng đầu tiên.** Và **không test nào đang
có bắt được** — nó chỉ lộ ra ở lần cài đặt thật đầu tiên.

⇒ Cửa bootstrap không chỉ phải cho **TẠO**, nó phải cho tạo **một người quản
được hệ**. Nay tài khoản đầu sinh ra với `vai = chu` (`AC-6.6`, cổng `Y12`).

### Bài học giữ lại

Ba lần trong hai ngày tôi viết một cổng đo **hình dạng** thay vì đo **luật**, và
lần này nó nặng hơn ba lần kia: hai lần trước là **đỏ oan** (thấy ngay), lần này
là **xanh oan** (không thấy gì).

**Luật cho lần sau**: trước khi đóng một FR, hỏi từng vế nó hứa — *"cổng nào
đỏ nếu vế này KHÔNG đúng?"*. Nếu câu trả lời là một cổng đo **sự tồn tại của
một cơ chế** thay vì **hiệu lực của nó**, thì vế đó **chưa có cổng**.
