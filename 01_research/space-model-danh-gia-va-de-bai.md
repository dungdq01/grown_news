# Space Model ("đa vũ trụ tri thức") — đánh giá khả thi trên HỆ NÀY + đề bài research cho team

- **ngày**: 2026-09-09 · **vai**: s1 overview · **nguồn ý tưởng**: `space-model-da-vu-tru-tri-thuc.md` (chủ dự án, bản 2)
- **chỉ đạo nguyên văn**: *"Thêm cần nghiên cứu thêm 1 module trước khi làm M13. Module này không đánh số, gọi là big update system. […] multi workspace giống macOS […] Tab cho công nghệ, tab cho xã hội, tab cho thể thao. Insight quan trọng nhất: space = lớp học = tenant. Mỗi lần đổi tab thì dữ liệu sidebar cũng đổi. […] Ý tưởng này khả thi không? và tôi nên trao đổi với team như thế nào để họ research."*
- **đường factory** (`/factory:go` câu 1): chạm ≥2 module (M01·M02·M03·M08·M13·M14·M18) và đổi hình dạng entity gốc ⇒ **BUILD**, không phải module mới: s1 (file này) → s2 (bổ sung proposal — chủ dự án chọn `proposal-3` hay mở `proposal-4`) → s3 sửa tiền đề "một vũ trụ" trong BRD/PRD → s4 **ADR-09** → FR cho từng artifact frozen → s6 từng module bị chạm.

## 0 · Kết luận một đoạn

**Khả thi, và rẻ nhất là bây giờ.** Tám điều đo được (§1) cho thấy hệ đã có sẵn phần lớn "khớp nối" cần: bảng khai màn hình, bảng khai loại nguồn, `pham_vi` facet, ba bảng + view. Cái **chưa có** là một trục dữ liệu `space` xuyên suốt. Nhưng có **một va chạm kiến trúc** phải quyết trước khi ai viết gì: hệ đang mọc **ba** cơ chế khoanh phạm vi (§2) và Space sẽ là cái thứ tư — đúng thứ tài liệu kia gọi là *"nợ kỹ thuật không trả nổi"*. Quyết định đó là của chủ dự án, không của team research.

## 1 · Tám điều đo được trên hệ này (fact, ngày 2026-09-09)

| # | Đo | Nghĩa cho Space |
|---|---|---|
| 1 | `kb/**` **14** bản ghi thật | migration = gán tất cả vào space mặc định; **rẻ hôm nay**, đắt sau 6 tháng — luận điểm §12 của tài liệu **đúng** trên hệ này |
| 2 | PK `(source_type, slug)` ở cả ba bảng (`kho.schema.sql:59`) · địa chỉ trích dẫn dùng **`slug` trần** (`dia-chi.json` 5 dạng) | thêm space ⇒ hoặc **slug duy nhất toàn hệ** (space chỉ là cột lọc), hoặc PK ba cột + địa chỉ mang tiền tố space. **Quyết định gốc** — nó lan vào mọi trích dẫn, mọi `doc_id` của M13/M14 |
| 3 | Ontology **global** ở `kb/categories.yaml` · `kb/concepts.yaml` · `kb/loai-nguon.yaml` (M02 sở hữu) | per-space ⇒ ba file này đổi hình dạng, `validate.py` (M01) đổi cách kiểm, màn Danh mục đổi. `frontmatter.schema.json` **FROZEN** ⇒ FR |
| 4 | Web: **bảy màn** khai ở `man-hinh.json`, route dẫn xuất (`VIEW_SSR`), chi tiết mở trong **cửa sổ** (`.bk`) không phải route | `/video/<space>/` **ít** rủi ro đụng route chi tiết hơn tài liệu lo (§7) — nhưng thêm một chiều URL vào bảng khai + `catNap()` + 7 test quét-mọi-trang |
| 5 | `gn.js` **82 482** / 102 400 byte · `gn.css` 91 380 / 102 400 | ~20 KB JS cho tab bar + prefetch + cache. **Đủ nếu không dùng thư viện**; View Transitions API là native, 0 byte |
| 6 | Ba vùng tin cậy LÕI/THỢ/BIÊN (ADR-05/08) | Space **không đổi** vùng nào. Không chạm egress, không chạm khoá. Tốt |
| 7 | M18 (FR-045, đã duyệt): **một `chu` + ≤5 tài khoản đọc**, 4 bảng | `space_member` role owner/editor/viewer là **mô hình quyền mới**, không nằm trong FR-045 ⇒ FR sửa FR đã duyệt |
| 8 | Kho là **DB → file** (điểm bất động, `xuat_kho.py`), `kb/<loai>/` | space nằm ở đâu trong cây file: `kb/<space>/<loai>/` hay cột frontmatter? Ảnh hưởng vòng export/import + M09-R1 |

## 1b · Module ảnh hưởng — và ảnh hưởng ra sao

| Module | Ảnh hưởng | Mức | Chạm frozen? |
|---|---|---|---|
| **M02_kb** (kho, hợp đồng) | Thêm trục `space` vào bản ghi; ba file ontology global (`categories` · `concepts` · `loai-nguon`) thành per-space; quyết PK giữ `slug` toàn hệ hay thêm cột space. **Gốc** của mọi thay đổi khác. | 🔴 cao | `frontmatter.schema.json` · `kho.schema.sql` ⇒ FR |
| **M01_core** (validate, địa chỉ) | `validate.py` kiểm concept/category theo space; nếu PK đổi thì 5 dạng địa chỉ trong `dia-chi.json` mang tiền tố space ⇒ mọi trích dẫn đổi hình dạng. | 🔴 cao | phụ thuộc R1 |
| **M08_api** (một cửa SQL) | Mọi query thêm `WHERE space`; `GET /api/index?space=`; cửa tạo/sửa/xoá space (chỉ `chu`). Một query quên lọc = rò chéo ⇒ cổng R4. | 🟠 TB | không |
| **M09/M10/M11** (ba loại nội dung) | Ba bảng + view `ban_ghi` thêm cột; `xuat_kho.py` quyết cây file `kb/<space>/<loai>/` hay cột frontmatter (R2); vòng export/import giữ điểm bất động. | 🟠 TB | DDL ⇒ FR |
| **M03_web** | Tab bar trong khối nội dung; `man-hinh.json` thêm chiều URL `/video/<space>/`; sidebar đổi số liệu theo space; 7 test quét-mọi-trang phải sửa. ~20 KB JS còn, đủ. | 🟠 TB | không |
| **M13_truyhoi** | `pham_vi` dành sẵn khoá `space`; chỉ mục thêm cột lọc; cổng "hỏi A → 0 hàng B". Chỉ mục dựng lại được ⇒ **không dừng M13**; chỉ `doc_id` chờ R1. | 🟡 thấp | `FR-072` đang mở ⇒ sửa trước khi áp |
| **M14_chatbot** | Bot phạm vi = một space (thay "bot → tập doc_id" tự do); hàm giải AC-8.4 nhận space. | 🟡 thấp | spec frozen ⇒ FR |
| **M18_nguoidung** | `space_member(owner/editor/viewer)` là mô hình quyền mới ngoài FR-045 "một chủ + 5 đọc"; cấu hình per-space (prompt, persona) đi qua `cai_dat`. | 🟠 TB | FR-045 đã duyệt ⇒ FR sửa FR |
| **M19_baihoc** (giữ chỗ) | **Bị thay** bởi Space nếu duyệt §7.1; thứ tự bài học sống bên trong space. 0 dòng mã mất. | ✅ xoá ô trống | `project_map` entity `BaiHoc` đổi chủ |
| **M12_chungcat** | Không đổi luật; bản nháp kế thừa space của nguyên liệu; prompt per-space chỉ là cấu hình. | 🟢 gần 0 | không |
| **M05 · M06 · M07** | Intake nhận space từ frontmatter; skillgen/curate lọc theo space khi quét. Cơ học. | 🟢 thấp | không |
| **M04 · M15 · M16 · M17** | Không ảnh hưởng — CI, kênh, artifact, cổng không biết space; kênh chuyển tiếp `space` như một tham số. | ⚪ 0 | không |

**Đọc nhanh:** đắt ở **M02 → M01** (dữ liệu + địa chỉ), vừa ở **M03 · M08 · M09-11 · M18**, gần 0 ở THỢ/BIÊN. Ba vùng tin cậy giữ nguyên. Điểm chặn duy nhất: **R1**.

## 2 · Va chạm lớn nhất — hệ đang có BA cơ chế khoanh phạm vi

| cơ chế | ở đâu | trạng thái |
|---|---|---|
| **`pham_vi`** = facet đang bật (cat · loai · cpt · pl · nguon) | M13 hợp đồng (`FR-072 §1.1`) · M14 `spec:216` *"bộ lọc LÚC HỎI"* | spec frozen, M13 đang lên plan (7 task) |
| **bot → tập `doc_id`** (Knowledge của một bot) | M14 `AC-8.4/8.5`, *"đúng MỘT hàm giải"* | spec frozen, chưa mã |
| **`M19_baihoc`** = *"tập nguồn có tên, có thứ tự"* (lớp học) | `project_map` entity `BaiHoc`, **giữ chỗ**, chưa thi công | M14 `spec:219`: *"bài học KHÔNG thay `pham_vi`. Hai trục đứng cạnh nhau"* |

Tài liệu Space nói: *space = lớp học = tenant = MỘT primitive*. Trên hệ này câu đó có nghĩa cụ thể: **Space chiếm chỗ của M19**. M19 đang là ô trống — thay nó **hôm nay** là 0 dòng mã. Để cả hai là bốn trục.

Nhưng có một thứ M19 có mà Space không có: **thứ tự** (bài học → khoá học → lớp học, chiều phân loại thứ tư, *"không suy được từ facet"* — `decisions.md`). Space là **container**; thứ tự là **cấu trúc bên trong** container. Hai câu này không mâu thuẫn, nhưng phải viết ra để không ai xây "lớp học" lần thứ hai.

**⇒ Câu hỏi số 1 cho chủ dự án, trước mọi research:** *Space có thay M19 không, và bot của M14 có phạm vi = một space (± `nguon[]` hẹp hơn) không?* Trả lời "có" cả hai ⇒ còn **hai** trục (space = container · `pham_vi` = lọc lúc hỏi). Đó là hình dạng sạch.

## 3 · Bốn chỗ tài liệu gốc KHÔNG áp thẳng được

1. **"RAG tách namespace, không metadata filter (dễ rò)"** — hệ này là SQLite FTS5, không vector store. Tách namespace = N bảng FTS; cột `space` + `WHERE` prefilter = một bảng. **Cái chống rò không phải cơ chế, là cổng**: *"hỏi trong space A, 0 kết quả từ space B"* đo được với cả hai. Chỉ mục là dữ liệu dẫn xuất (`M13`), dựng lại được ⇒ chọn sai đổi rẻ.
2. **"Chatbot persona / prompt chưng cất per-space"** — hệ này **người chọn model** (FR-053) và prompt chưng cất nằm trong `chungcat/assets`. Per-space prompt = cấu hình, đi qua `cai_dat` (M18) hoặc bảng khai — không phải cột tự do trong `space`.
3. **"Slug do người dùng đặt đụng `/video/{id}`"** — chi tiết mở trong cửa sổ, không có route `/video/{id}` để đụng. Vẫn cần **danh sách slug cấm** vì `man-hinh.json` có `/video/nap/` v.v.
4. **Hiệu ứng chuyển tab (§6)** — web là wrapper (chỉ đạo 2026-09-07). Làm **sau cùng**, sau khi scoping ở tầng dữ liệu đúng. Tài liệu §2.1 tự nói vậy.

## 4 · Đề bài research cho team — 6 câu, mỗi câu phải trả lời bằng fact có nguồn

Team **không** quyết kiến trúc; team đo và trình phương án. Mỗi câu: ≥2 phương án · trade-off đo được · nhãn fact/suy luận/giả định.

| # | Câu | Phải đo gì | Ra |
|---|---|---|---|
| R1 | **Slug duy nhất toàn hệ hay theo space?** | đếm chỗ dùng `slug` làm khoá: `dia-chi.json` · `doc_id` M13/M14 · `media` tham chiếu · `article_versions` · `recycle` · URL cửa sổ | bảng "N chỗ vỡ nếu PK đổi" cho mỗi phương án |
| R2 | **Space nằm ở đâu trong cây `kb/`?** | thử vòng DB→file→DB với `kb/<space>/<loai>/` và với cột frontmatter; đo điểm bất động (`bam_cay`) | phương án + số đo vòng lặp |
| R3 | **Ontology per-space: file hay bảng?** | ba file yaml hiện tại: ai đọc (grep consumer), `validate.py` kiểm thế nào; có phần **dùng chung** giữa space không (tài liệu §9.1) | phương án + danh sách consumer phải đổi |
| R4 | **Cổng chống rò chéo space** | viết **lệnh** đỏ được: gieo 2 space, hỏi space A qua M13, đòi 0 hàng space B; và qua `GET /api/index?space=` | `cmd` + `đỏ_khi` + `xanh_khi` — chưa có lệnh thì chưa gọi là chống rò |
| R5 | **Quyền theo space vs FR-045** | đối chiếu `space_member(owner/editor/viewer)` với 4 bảng + cổng U1–U7; cái gì thêm, cái gì phá | delta lên FR-045 |
| R6 | **Migration + rollback trên 14 bản ghi** | script gán space mặc định; chạy trên **bản sao** kho; đo `bam_cay` trước/sau; rollback = export cũ trong git | log chạy thật |

**KHÔNG nằm trong đề bài** (chờ quyết định §2 hoặc làm sau): hiệu ứng tab · prefetch/cache · persona chatbot · cross-post (`cross_posted_to`) — cái cuối là scope creep cho tới khi có ≥2 space có nội dung thật.

## 5 · Cách trao đổi với team — ba câu, một tài liệu, một phép thử

1. **Gửi tài liệu gốc + file này.** Tài liệu gốc nói *vì sao*; file này nói *hệ mình đang đứng đâu*.
2. **Nói đúng ba câu:** *(a)* đây là **BUILD xuyên module**, không phải màn UI — tab chỉ là công tắc; *(b)* hệ đã có ba cơ chế khoanh phạm vi, việc của research là **gộp**, không phải thêm; *(c)* deliverable là **một ADR (ADR-09) + cổng R4 chạy được**, không phải slide, không phải prototype hiệu ứng.
3. **Phép thử duyệt ADR** (giữ nguyên từ tài liệu gốc, thêm hai vế của hệ này): *"Mở lớp 12 người dùng chung tri thức — không sửa schema?"* **+** *"M13 hỏi space A trả 0 hàng space B — lệnh nào chứng minh?"* **+** *"M19 còn cần tồn tại không?"*

## 6 · Ảnh hưởng tới M13 — có phải dừng M13 chờ Space không?

**Không dừng, nhưng đặt một chốt.** Chỉ mục M13 là dữ liệu dẫn xuất, dựng lại được; cái đắt của Space nằm ở PK · địa chỉ · ontology · quyền (§1 dòng 2·3·7), không ở FTS. Điều kiện để M13 đi tiếp mà không phải làm lại:

- `FR-072 §1.1` `pham_vi` **dành sẵn khoá `space`** (giá trị mặc định = space mặc định), và cổng T7 (*"dùng đúng khoá `TANG`, 0 map tên"*) mở rộng cho khoá đó;
- `doc_id` giữ là `slug` **cho tới khi R1 trả lời** — nếu R1 chọn PK ba cột thì `doc_id` đổi thành `space/slug` bằng **một** FR, và mọi client đi qua **một** hợp đồng (đúng lý do FR-072 tồn tại).

Tức Space không chặn M13; **R1 chặn hình dạng `doc_id`**. Nên R1 là câu phải trả lời **đầu tiên**, trong tuần M13 lên plan.

## 7 · Cho chủ dự án quyết (không phải việc của team)

1. Space **thay** M19_baihoc? (đề nghị: **có** — M19 là ô trống, thứ tự bài học sống *bên trong* space)
2. Bot M14 phạm vi = **một space** (± `nguon[]` hẹp hơn)? (đề nghị: có)
3. Nhà của đề xuất: bổ sung `proposal-3` hay mở `proposal-4`? (đây đổi tiền đề G3 "một vũ trụ" ⇒ tôi nghiêng **`proposal-4`**, nhưng luật hiện là "mặc định không")
4. Ai làm spike R1–R6, time-box mấy ngày?


---

## 8 · ĐÍNH CHÍNH sau khi chủ dự án phán (2026-09-09, PM ghi)

Bốn câu ở §7 đã có lời — và câu 1 **đảo** đề nghị của bản này:

1. **Space KHÔNG thay M19 — chúng là hai TẦNG lồng nhau.** Chủ dự án: *"Space
   là đa vũ trụ, M19 là bài học trong từng vũ trụ — trong Computer Science có
   bài về database, network, AI…"*. Đúng: Space = container cấp 1 (ranh giới
   dữ liệu · ontology · quyền · tenant); M19 = cấu trúc CÓ THỨ TỰ bên trong
   một space, chọn nguồn TRONG space đó. M19 **giữ**, mang thêm `space_id`.
   Vẫn chỉ hai trục khoanh phạm vi (space = chứa · `pham_vi` = lọc lúc hỏi):
   lớp học không khoanh độc lập, nó là con của space. §2 dòng "Space chiếm chỗ
   M19" **rút lại**.
2. **Bot = MỘT NÚT trên cây, tri thức = mọi thứ dưới nút.** Bot admin → gốc
   (mọi vũ trụ) · bot vũ trụ → space · bot lớp/bài → lớp (± rule/prompt
   riêng). Một cơ chế thay "bot → tập doc_id tự do" của spec M14 (⇒ FR khi
   M14 vào s6). Nhìn xuống được, không nhìn ngang.
3. **R1 chốt lối A: slug duy nhất TOÀN HỆ, `space` là CỘT LỌC.** Mọi địa chỉ
   trích dẫn/doc_id/media/versions/recycle/URL **giữ nguyên**; giá = hai space
   không trùng slug (validator gợi tên). Khớp chốt M13 cùng ngày
   (`decisions.md` — `doc_id` slug toàn hệ, `pham_vi` dành khoá `space`).
4. **Nhà: `proposal-4` + ADR-09** (đổi tiền đề G3 "một vũ trụ").

Đề bài spike §4 giữ nguyên 6 câu, nhưng R1 đã có đáp án ⇒ spike đo **hệ quả
của lối A** (danh sách slug cấm · validator trùng · migration 14 bản ghi),
không còn so hai lối. UX chuyển tab (nhánh B) giữ: tab = vũ trụ hay dùng,
còn lại vào bộ chuyển nhanh ⌘K, space 0 bài tự ẩn — làm SAU tầng dữ liệu.
