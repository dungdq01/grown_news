# FR-011 — Bàn biên tập local: CRUD bài viết qua API, đảo B-C3 có điều kiện

mở_bởi: người dùng, 2026-08-19 (upgrade.md phase 2 + AskUserQuestion 3 câu, cả 3 đã chốt)
tới: s3 (BRD B-C3) · s6 (`06_modules/M03_web/rules.md` M03-R2, `M03_web/spec.md`, `M02_kb/rules.md` M02-R2, `M02_kb/spec.md` — đều FROZEN) · s4 (`04_system/security_baseline.md` §1/§5/§6)
mức: đảo một ràng buộc BRD — mức cao nhất từ trước tới nay
trạng_thái: MỞ — thi hành theo plan người dùng đã duyệt 2026-08-19

## Vấn đề

`upgrade.md` phase 2: *"các thao tác CRUD mới làm trên web được — ví dụ bước duyệt
bài viết thì phải duyệt trên web chứ ai mở ra rồi đổi tên trạng thái"*. Người dùng
đã chốt qua 3 câu hỏi: (1) `.md` giữ làm nguồn chân lý, API trả JSON; (2) duyệt
hướng FR — API local ghi `kb/`; (3) CRUD đủ 4, xoá = recycle, tạo bài ngay trên web.

FR-010 đã đoán trước đúng chỗ này (dòng 32-33): *"CRUD (bước 5 của plan, sẽ cần FR
riêng đảo hẳn B-C3)"*. Đây là FR đó.

## Điểm mấu chốt: B-C3 đang gộp HAI thứ, tách ra thì chỉ phải đảo MỘT

B-C3 viết *"Web không bao giờ ghi vào `kb/`"* — nhưng "web" trong câu đó gộp:

| Khái niệm | Sau FR-011 |
|---|---|
| **Bundle web tĩnh** (output `npm run build`, deploy được) | **Read-only TUYỆT ĐỐI — không đổi.** Không fetch ghi lúc build, không nhúng URL tuyệt đối, `no-write-path` khối quét plugins giữ nguyên. |
| **API biên tập local** (tiến trình `node server.mjs`, người tự chạy) | Được ghi `kb/**` + `_recycle/**` — với chặn bù bên dưới. |

Lý-do-cứng của B-C3 (*"hai chiều ghi vào cùng nguồn chân lý sinh xung đột không
giải được"*) không bị phá: người sửa bằng editor và người bấm trên web là **cùng
một người**, API tuần tự hoá mọi ghi (mutex) + ETag `If-Match` bắt lost-update —
xung đột được phát hiện, không im lặng.

**B-B1 GIỮ NGUYÊN cả chữ lẫn tinh thần**: không tiến trình *tự động* nào ghi
`approved`. Endpoint chỉ phản ứng một HTTP request người bấm; 3 trường M1
(`insight_new`, `skill_installed`, `review_minutes` — FR-001) **không có giá trị
mặc định trong code** (M08-R3), nên "máy tự duyệt" là bất khả về cấu trúc: máy
không có gì để điền vào chỗ chỉ người trả lời được.

## Phạm vi

| Được | KHÔNG được |
|---|---|
| GET danh sách/chi tiết bài dưới dạng JSON (filter category/concept/status/q) | bundle tĩnh có bất kỳ đường ghi nào (như cũ) |
| POST tạo bài — server ÁP `origin: manual`, `review_status: draft` | nhận `review_status`/`origin`/`id`/`slug`/`source_type` từ payload (M08-R5) |
| PUT sửa bài — `approved` + nội dung đổi ⇒ tự chuyển `edited` (vòng đời M02 §2.2) | ghi mà không có `validate.py --strict` đạt ngay trước (M08-R2) |
| PATCH đổi trạng thái theo bảng chuyển cứng M02 §2.2 — approve đòi 3 trường M1, reject đòi lý do ≥5 ký tự | default cho bất kỳ trường quyết định nào (M08-R3) |
| DELETE = move `kb/<type>/<slug>.md` → `_recycle/<type>/<slug>.md`, byte nguyên vẹn + restore | unlink/xoá thật (M08-R4) |
| `_inbox/` như FR-010 | nghe ngoài `127.0.0.1` (M08-R1) |

`_recycle/` không cần FR riêng: nó là ngữ nghĩa DELETE của cùng năng lực này —
cùng bề mặt, cùng người duyệt. Nó nằm NGOÀI `kb/` và ngoài input build: bài xoá
biến khỏi web ngay mà không mất dữ liệu.

### Chặn bù — bắt buộc, mỗi cái có test canh

1. Bind `127.0.0.1` — localhost là toàn bộ lớp bảo vệ vì hệ không có auth (§1).
2. Định danh tài nguyên `/:type/:slug` ánh xạ 1:1 vào đường file — `type` ∈ enum
   đóng 6 giá trị, `slug` qua `tenAnToan` whitelist `[a-z0-9-]` ⇒ traversal bị
   chặn bằng cấu trúc, không bằng lọc.
3. Mọi ghi: compose → tmp → `validate.py --fix` → `validate.py --strict` → đạt
   mới rename nguyên tử vào `kb/`. KHÔNG viết lại cổng bằng JS (M05-R3).
4. Mutex trong process + ETag `If-Match` — hai cửa sổ cùng sửa thì bên sau nhận 412.
5. Trần body 1 MB (dùng lại `docBody`), `*.v<n>.md` vô hình với mọi endpoint.
6. Site tĩnh build/deploy KHÔNG có API vẫn nguyên chức năng đọc — FE feature-detect
   `/api/health`, control ghi ẩn mặc định.

## Luận cứ FR-010 phải viết lại (hệ quả FR-012)

FR-010 và `M03-R2.ngoại_lệ_duy_nhất` đang chứng minh "không đường nào tới approved"
bằng *"schema khoá `review_status: const draft`"*. FR-012 tháo đúng cái khoá đó
(nó khoá SAI CHỖ — vĩnh viễn thay vì lúc-vào-kho). Luận cứ mới, ba răng:

1. `gate.py` hardcode `review_status = "draft"` khi nạp (test `-k draft_external` còn nguyên)
2. approve đòi 3 trường M1 do NGƯỜI khai — schema FR-001 cưỡng chế, code không default
3. chuyển trạng thái CHỈ qua `PATCH /status` — cửa riêng có bảng chuyển cứng;
   PUT/POST lột `review_status` khỏi payload

Mọi chỗ trích câu cũ (`M03_web/rules.md`, comment `server.mjs`, comment
`no-write-path.test.js`) cập nhật cùng đợt — không thì tài liệu chứng minh bằng
một cái khoá đã tháo.

## Đổi thì

Server phải nghe ngoài `127.0.0.1` ⇒ xem lại B-D3 + thêm auth trước — FR khác.
Muốn xoá thật (bỏ `_recycle/`) ⇒ đụng F4 backup, FR khác.

## Thi hành

| Chỗ | Đổi |
|---|---|
| `03_docs/brd.md` B-C3 | tách "bundle tĩnh" (cấm tuyệt đối) khỏi "API biên tập local M08" |
| `06_modules/M08_api/` | MỚI — module pack 6 artifact, 5 rule, AC hard kèm lệnh |
| `06_modules/M02_kb/rules.md` M02-R2 + `spec.md` §2.2/§4 | kb_writers += M08_api (chỉ-qua-validate). **FROZEN ⇒ --ky** |
| `06_modules/M03_web/rules.md` M03-R2 + `spec.md` §1/§2.3/§4 | ngoại lệ FR-010+FR-011; sở hữu `web/**` trừ `web/api/**`; màn Chờ duyệt có nút duyệt thật. **FROZEN ⇒ --ky** |
| `project_map.yaml` | module M08_api · `kb_writers` · `api_writes: [kb/**, _recycle/**]` |
| `web/api/*.mjs` | MỚI — router + articles + status + recycle + dungchung |
| `web/server.mjs` | mount router M08, sửa comment luận cứ |
| `web/test/api-*.test.js` ×4 | MỚI — răng của M08-R1..R5 |
| `web/test/no-write-path.test.js` | nới đúng chỗ: whitelist literal đóng 3 đường; siết chỗ mở: quét `web/api/**` |
| FE + màn nạp nguồn | feature-detect, nút CRUD, form duyệt 3 trường M1, redesign v-nap |
| `04_system/security_baseline.md` §1/§5/§6 + tài liệu nhóm G | biện luận lại trên thực tế mới |

## Nợ đã biết

- Duyệt xong, trang ĐỌC của site tĩnh vẫn là bản build cũ — màn biên tập render
  từ API (sống), sau mutation UI nhắc chạy `npm run build`. Build-trigger endpoint
  là việc khác, chưa cam kết (đụng idempotency — WL-FR010 quyết định 1).
- M02-R1/R2 vẫn là S2 với các module KHÁC (M06/M07) — FR này chỉ thêm răng S3
  cho đường M08, không giải nợ deny-rule toàn cục.
