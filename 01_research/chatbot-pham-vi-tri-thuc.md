# Khảo sát — chatbot có phạm vi tri thức riêng (raw)

> **Raw đợt năm** · 2026-09-02 · 106 agent · 4,93M token subagent · 1093 lượt tool ·
> 27 phút. Phản biện 3 phiếu/claim, cần 2/3 refute mới giết.
>
> ⚠️ **MỘT agent CHẾT, và nó là agent quan trọng nhất**:
> `search:no-vector SQLite/FTS5 scoped retrieval (gap probe)` — *"Connection lost
> mid-response"*. Nên kết luận *"không có tiền lệ cho FTS5 pre-filter"* ở §4 là
> **chưa được dò đầy đủ**, không phải đã dò và không thấy.
>
> ⚠️ **Chi phí vượt hướng dẫn phiên** (≤15 agent). Tôi đã thu hẹp câu hỏi và nó
> vẫn phình 106 agent. Lần sau phải tự viết workflow, không dùng bản mặc định.

## §0 · Bản chưng — điều nhập thẳng vào spec M14

### Ba pattern, và KHÔNG cái nào là ranh giới cưỡng chế bằng schema

| | hệ | cách mô hình hoá | ranh giới thật ở đâu |
|---|---|---|---|
| **A** | **Onyx** | bảng liên kết theo `persona_id`, **bốn** mức: `persona__document_set` · `persona__document` · `persona__hierarchy_node` · `persona__user_file` | **query layer, lúc chạy** — không phải schema |
| **B** | **AnythingLLM** | **index riêng cho từng bot** — `workspace_documents` mang một `workspaceId` FK, `docId` unique **theo workspace**; vector nằm trong namespace tên theo slug | namespace của vector store |
| **C** | **Open WebUI** | **KHÔNG có liên kết quan hệ nào** bot→knowledge — ràng buộc sống trong JSON **không tài liệu hoá**: `model.meta.knowledge` | (không có) |

**Chi tiết giết chết ảo tưởng "có bảng liên kết là có cách ly"** — chú thích trong
chính mã Onyx:

> *"These are only defaults, users can select from all if desired"*
> *"Knowledge scope: explicit knowledge attachments restrict what an assistant can
> see. **When none are set, the assistant can see everything.**"*

Vế cứng duy nhất của Onyx đến từ một **biến môi trường**
(`FORCED_DOCUMENT_SET_NAMES` → `IndexFilters.forced_document_set`), không từ bảng
liên kết. Bảng liên kết chỉ được **OR** vào query.

⇒ Với thiết kế của ta: `bot_document(bot_id, doc_id)` là **cần nhưng KHÔNG đủ**.
Tính chất cách ly nằm ở chỗ phép lọc SQL là **vô điều kiện** hay **tuỳ chọn** —
*"filter rỗng = cả kho"* là cách luật này chết.

### Bốn cơ chế RÒ, và cả bốn nằm ở TẦNG TRUY HỒI — không cái nào ở prompt

**1 · Kiểm theo từng đường chạy thay vì một chokepoint + nhận scope từ client.**
Open WebUI `get_sources_from_items` có **năm** đường chạy; **ba** đường query vector
store **không kiểm quyền gì**, và truyền thẳng tên collection **do client gửi**.
Tên collection **đoán được**: `file-<file_id>`, hoặc UUID của KB.

> Hậu quả nguyên văn: *"Access revocation is **ineffective** for RAG content — users
> who previously had access can continue extracting file and knowledge base content
> **indefinitely**."*

`CVE-2026-44560` (CVSS 6.5, CWE-862), vá ở 0.9.0 — **rồi bản vá bị phá lại** ở
`CVE-2026-54019`, nên sàn thật là **0.9.6**. Cùng họ: `CVE-2026-44557` (liệt kê KB
toàn cục), `GHSA-4g37-7p2c-38r9` (Retrieval API đi vòng ACL).

**2 · Sập ranh giới vùng vì DÙNG CHUNG bí mật** — đối chiếu thẳng với LÕI/THỢ.
LibreChat dùng **cùng một JWT secret** cho session của trình duyệt **và** cho
xác thực service-to-service của RAG API, không validate `aud`. Nên token session
của một người dùng hợp lệ **xác thực trực tiếp** vào dịch vụ truy hồi — và vì ACL
theo agent sống ở tầng app (`filterFilesByAgentAccess`), đi vòng tới RAG API là
**đi vòng toàn bộ ACL một lúc**.

> Tác động gồm cả **GHI**: *"the attacker can read, replace and delete all documents
> or upload new documents."*

`CVE-2025-41258`, CVSS **8.0** với `I:H/A:H`. Khuyến nghị của chính SBA là **kiến
trúc**: *"use a separate JWT secret for the service-level authentication"* + audience
claim.

**3 · FAIL-OPEN khi thiếu danh tính, và không thu hồi lúc di trú.**
AnythingLLM cài cách ly thành một **nhánh điều kiện** trên sự có mặt của danh tính:

```js
const user = response.locals.user ?? null;
const workspaces = user ? await Workspace.whereWithUser(user, {}) : await Workspace.where({})
//                                                                  ^^^^^^^^^^^^^^^^^^^^^^^ vị từ BIẾN MẤT
```

Device token cấp ở chế độ một-người-dùng (`userId = null`) **vẫn hợp lệ sau khi di
trú** sang nhiều-người-dùng ⇒ token cũ chạm nhánh không-scope. `CVE-2026-47713`,
vá 1.13.0. **Bản vá KHÔNG thêm lọc theo user** — nó chỉ di trú device token.

**4 · Bất kỳ công cụ nào chạm được kho đều phá scope.** Nên giới hạn tải file của
nền tảng **không phải** một ranh giới cách ly.

### Prompt và truy hồi là HAI TẦNG — và tầng prompt không cưỡng chế được gì

Cả hai hệ có tách đều tách ở **mức cột**:

| | persona / rule | ràng buộc truy hồi |
|---|---|---|
| Onyx | `system_prompt`, `task_prompt`, `replace_base_system_prompt` — cột `String` | bảng liên kết + `search_start_date` |
| AnythingLLM | `openAiPrompt` — **một** cột free-text nullable | `similarityThreshold`, `topN`, `chatMode`, `queryRefusalResponse` — có kiểu |

Ở AnythingLLM, *"từ chối khi ngoài phạm vi"* là một **early return ở tầng mã**,
**không bao giờ vào prompt**. Nhưng `chatMode` mặc định thực tế là **`automatic`**
⇒ **cấu hình mặc định KHÔNG từ chối** khi không có gì trong phạm vi khớp.

Onyx còn cảnh báo: model override của persona *"only applied on actual response
generation — **not** used for auto-detected time filters, relevance filters, etc."*

### Mô hình quyền — hai tiền lệ ở hai đầu

**Onyx** tách **SỞ HỮU** và **CHIA SẺ** thành hai trục:
- `CheckConstraint ck_persona_single_owner` — `user_id IS NULL OR owner_group_id IS NULL` (thực ra là **NAND**, nên "cả hai NULL" = admin-owned orphan, được phép)
- cả hai FK `ON DELETE SET NULL` — *"deleting a user **orphans** shared personas instead of destroying them"*
- chia sẻ = hàng trong `persona__user` / `persona__user_group`, mỗi hàng mang enum `EDITOR|VIEWER` (default `VIEWER`)
- **chuyển sở hữu** (`transfer_persona_ownership`) là **thao tác riêng** với **thu hồi** (`remove_user_from_persona_shares`)

⚠️ **Mặc định phải ĐẢO trong thiết kế mới**: Onyx `is_public` default **True** ⇒
một persona **hiện với cả tổ chức** trừ khi ai đó chủ động đặt private.

**AnythingLLM** thô: một cột `role String @default("default")` trên `users`, không
bảng role, **không ACL theo tài liệu ở đâu cả**; quyền vào bot = một hàng
`workspace_users`, Cascade **cả hai** FK, **không** `@@unique([user_id, workspace_id])`.

Điểm chung: **thu hồi = xoá một hàng.**

### KHÔNG CÓ TIỀN LỆ — bốn chỗ phải tự thiết kế

| | trạng thái |
|---|---|
| **Custom GPT** giới hạn tài liệu + cơ chế truy hồi | **UNKNOWN** — cả hai claim bị refute **0-3**, gồm cả claim "20 file / 512 MB". ⇒ **KHÔNG được** trích số đó |
| **Claude Projects** | **0 claim sống sót** — không nguồn nào được xác minh |
| **FTS5 lexical pre-filter cho scope theo bot** | **không hệ nào** trong 8 hệ được chứng minh cưỡng chế scope trong index **từ vựng**. Mọi điểm cưỡng chế đã xác minh đều là vector: YQL filter (Onyx) · namespace (AnythingLLM) · collection ACL (Open WebUI) |
| tokenize tiếng Việt / Trung phồn thể dưới scoped retrieval | **0 bằng chứng** |

⚠️ **Và bốn hệ KHÔNG được khảo**: Khoj · RAGFlow · Morphik · SurfSense — *"precisely
the candidates most likely to hold a non-vector or hybrid lexical precedent"*. Cộng
với agent gap-probe **đã chết**, nên *"không có tiền lệ"* ở dòng ba là **chưa dò
xong**, không phải đã dò và không thấy.
