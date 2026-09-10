# SPACE MODEL — "Đa vũ trụ tri thức"
### Bản phác thảo ý tưởng & Research Brief cho team

> **Trạng thái:** Draft để team research — chưa phải quyết định kiến trúc.
> **Deliverable mong đợi:** 1 ADR (Architecture Decision Record) + 1 prototype, sau spike 3–5 ngày.
> **Phiên bản 2** — đã thu hẹp phạm vi UI (chỉ tab menu ở khối nội dung), bổ sung yêu cầu *space do người dùng tự tạo*, và thêm chương hiệu ứng chuyển tab.

---

## 1. Bối cảnh

Hệ thống "Tổng hợp và quản lý tri thức" hiện tại là **một vũ trụ duy nhất**: toàn bộ nội dung đều xoay quanh công nghệ/AI. Sidebar (Loại nguồn / Chủ đề / Khái niệm), pipeline chưng cất, và RAG index đều ngầm định một lĩnh vực.

Khi muốn mở rộng sang Tài chính, Xã hội, Thể thao… hoặc mở lớp học cho từng nhóm, giả định "một vũ trụ" này vỡ:

- Ontology trộn lẫn → sidebar Thể thao hiện khái niệm "Hermes Agent", sidebar Công nghệ hiện "V-League".
- Prompt chưng cất dùng chung → tóm tắt một trận bóng bằng prompt viết cho paper kỹ thuật.
- RAG trả lời chéo lĩnh vực → chatbot Thể thao trích dẫn tài liệu VPS.
- Không có ranh giới quyền → không mở được lớp học, không đi B2B được.

## 2. Ý tưởng cốt lõi

Xây dựng khái niệm **Space** — một *vũ trụ tri thức độc lập*, có taxonomy riêng, nội dung riêng, agent riêng, thành viên riêng.

**Space do người dùng (admin) tự tạo và tự đặt tên, hoàn toàn từ UI, không cần deploy.** Hệ thống ship với một space mặc định; admin có thể tạo thêm "Finance", "Thể thao", "Nhân sự"… bất cứ lúc nào. Đây là yêu cầu bắt buộc, không phải nice-to-have — nếu phải sửa code để thêm space thì thiết kế sai.

### 2.1 Phạm vi UI (đã chốt)

| Thành phần | Thay đổi |
|---|---|
| Khung layout, nav rail trái (Tổng hợp/Bài viết/Video/Kho/Chưng cất…) | **Giữ nguyên** |
| Cấu trúc sidebar filter (Loại nguồn / Chủ đề / Khái niệm) | **Giữ nguyên cấu trúc**, chỉ đổi dữ liệu bên trong |
| **Tab menu ở khối nội dung** | **MỚI** — thanh tab ngang, mỗi tab là một space |
| Danh sách nội dung | Đổi theo space đang chọn |
| Hiệu ứng chuyển tab | **MỚI** — xem chương 6 |

> **Cảnh báo về cách gọi tên:** Về UI thì đây chỉ là "tab". Nhưng bản chất là **scoping dữ liệu xuyên suốt hệ thống** — mọi query, mọi RAG namespace đều phải mang `space_id`. Tab bar chỉ là công tắc; nếu team chỉ làm tab mà không làm scoping ở tầng data, hệ thống sẽ phải đập lại khi lên lớp học và tenant.
>
> Prior art đúng: Notion workspace, Slack workspace, Obsidian vault, Arc Spaces.
> Prior art sai: tab trong một trang, tab trình duyệt.

## 3. Insight quan trọng nhất — 3 bài toán, 1 primitive

Ba thứ dưới đây, về mặt kỹ thuật, **là cùng một thứ**:

| Use case | Bản chất |
|---|---|
| Vũ trụ lĩnh vực (Công nghệ / Finance / Thể thao) | Container tri thức có ontology riêng |
| Lớp học (mỗi người góp tài liệu → học chung) | Container tri thức có ontology riêng + thành viên |
| Tenant B2B / khách hàng mua sau này | Container tri thức có ontology riêng + thành viên + billing |

→ **Chỉ được có MỘT cơ chế scoping.** Nếu build "tab lĩnh vực" hôm nay, "lớp học" năm sau, "tenant" năm sau nữa — hệ thống sẽ có 3 lớp phân vùng chồng nhau, và đó là loại nợ kỹ thuật không trả nổi.

**Đây là điều quan trọng nhất cần truyền đạt cho team.**

## 4. Ví dụ minh hoạ

### 4.1 So sánh cấu hình 3 space

| | 🖥 CÔNG NGHỆ (mặc định) | 💰 FINANCE | ⚽ THỂ THAO |
|---|---|---|---|
| **Slug** | *(không có — space mặc định)* | `finance` | `sport` |
| **URL trang video** | `/video/` | `/video/finance/` | `/video/sport/` |
| **Màu accent** | Đỏ (hiện tại) | Xanh dương | Cam |
| **Loại nguồn** | tải lên, youtube, fb | báo cáo, bản tin, filing | youtube, highlight, livestream |
| **Chủ đề** | AI-talkshow, Business Strategy, Skill Agent | Vĩ mô, Chứng khoán, Tín dụng | Bóng đá, Chạy bộ, Thể hình |
| **Khái niệm** | Hermes Agent, RAG, Talkshow | Lãi suất, P/E, Dòng tiền | V-League, Pressing, VO2max |
| **Prompt chưng cất** | Kiến trúc → trade-off → cách áp dụng | Số liệu → luận điểm → rủi ro | Diễn biến → số liệu → nhận định |
| **Chatbot persona** | Kỹ sư giải thích kiến trúc | Chuyên viên phân tích | Bình luận viên |

### 4.2 Kịch bản người dùng

**Kịch bản A — Admin tạo space mới**
1. Admin vào *Cấu hình → Vũ trụ → Tạo mới*.
2. Nhập tên "Finance", hệ thống tự sinh slug `finance` (cho sửa tay).
3. Chọn icon, màu accent, quyền truy cập.
4. Khai báo ontology ban đầu (chủ đề, khái niệm, loại nguồn) — hoặc để trống, AI đề xuất sau khi có 5 tài liệu đầu.
5. Bấm Lưu → **tab "Finance" xuất hiện ngay**, `/video/finance/` sống ngay, RAG namespace `kb::finance` được tạo tự động. Không deploy, không restart.

**Kịch bản B — Chuyển vũ trụ**
1. User đang ở `/video/` (space mặc định), thấy 6 video AI.
2. Bấm tab **Thể thao** → URL đổi `/video/sport/`, nội dung trượt sang, sidebar load lại số liệu mới, accent đổi cam.
3. Bấm Back → quay lại `/video/`, animation chạy ngược hướng.
4. Quay lại tab cũ → **filter, sort, scroll, ô search giữ nguyên như lúc rời đi**.

**Kịch bản C — Nội dung liên ngành**
Video "AI trong phân tích tín dụng" thuộc space nào?
→ `primary_space = finance`, `cross_posted_to = [tech]`. Hiện ở cả hai, ontology gốc là của Finance.

**Kịch bản D — Lớp học chính là một Space**
Mở lớp "Ôn thi CSCP" → tạo space kiểu `class`, private, 12 thành viên, chatbot riêng nắm đúng bộ tri thức đó. **Không viết thêm dòng code scoping nào.**

---

## 5. WIREFRAMES

### WF-1 — Bố cục: khung giữ nguyên, chỉ thêm tab menu ở giữa

```
┌──┬─────────────────────────────────────────────────────────────────────┐
│G │  🔍 Tìm bài, khái niệm, nguồn…      6 bài·6 bản ghi  [+ ĐĂNG KÝ]     │
│  │  ┌───────────────────────────────────────────────────────────────┐   │
│📕│  │  ╔═══════════════════════════════════════════════════════════╗│   │
│📄│  │  ║ Công nghệ │ Finance │ Thể thao │ Nhân sự │  + │  ⚙️        ║│  ← TAB MENU (MỚI)
│📁│  │  ║ ▬▬▬▬▬▬▬▬▬                                                 ║│   │
│▶️│  │  ╚═══════════════════════════════════════════════════════════╝│   │
│  │  │                                                               │   │
│🏠│  │  VIDEO                    [ưu tiên][mới nhất][cũ nhất]  6 bản │   │
│📦│  │  ┌─────────────────────────────────────────────────────────┐  │   │
│⚗️│  │  │ 📊 TỰ ĐỘNG     LOẠI NGUỒN 1 │ ĐÃ DUYỆT 6 │ CÒN NHÁP 0   │  │   │
│🔗│  │  └─────────────────────────────────────────────────────────┘  │   │
│  │  │  ┌───────────┐ ┌────────┐┌────────┐┌────────┐┌────────┐      │   │
│  │  │  │ tất cả  6 │ │ [thumb]││ [thumb]││ [thumb]││ [thumb]│      │   │
│  │  │  │           │ │ Cài Đặt││ Doanh  ││ GÓC    ││ Hermes │      │   │
│  │  │  │ LOẠI NGUỒN│ │ Hermes ││ nghiệp ││ NHÌN   ││ Agent  │      │   │
│  │  │  │  tải lên 5│ └────────┘└────────┘└────────┘└────────┘      │   │
│  │  │  │  youtube 1│ ┌────────┐┌────────┐                          │   │
│  │  │  │           │ │ [thumb]││ [thumb]│                          │   │
│  │  │  │ CHỦ ĐỀ    │ │ Tương  ││ Mở mang│                          │   │
│  │  │  │  AI-talk 4│ │ Lai    ││ tầm mắt│                          │   │
│  │  │  │  Business2│ └────────┘└────────┘                          │   │
│  │  │  │  Skill Ag1│                                               │   │
│  │  │  │           │                                               │   │
│  │  │  │ KHÁI NIỆM │                                               │   │
│  │  │  │  Talkshow4│                                               │   │
│  │  │  │  Hermes  1│                                               │   │
│  │  │  │  Tin tức 1│                                               │   │
│  │  │  └───────────┘                                               │   │
│  │  └───────────────────────────────────────────────────────────────┘   │
└──┴─────────────────────────────────────────────────────────────────────┘
   ▲              ▲                    ▲                    ▲
   │              │                    │                    │
NAV RAIL     TAB MENU (MỚI)      SIDEBAR              NỘI DUNG
GIỮ NGUYÊN   space switcher      cấu trúc giữ nguyên  đổi theo space
             + nút "+" tạo mới   số liệu đổi theo     query có space_id
```

**Ghi chú:**
- Tab menu nằm **trong khối nội dung, phía trên tiêu đề module**. Không đụng vào nav rail trái.
- Nút `+` cuối dãy tab = tạo space mới (chỉ admin thấy). Icon `⚙️` = cấu hình space đang mở.
- Nhiều space thì tab bar cuộn ngang, hoặc gom vào `⌄ Khác` — quyết định khi > 6 space.

### WF-2 — Cùng một trang, hai vũ trụ khác nhau

```
        /video/  (mặc định)                  /video/sport/
┌───────────────────────────────┐   ┌───────────────────────────────┐
│ Công nghệ │Finance│Thể thao│+ │   │ Công nghệ│Finance│ Thể thao │+ │
│ ▬▬▬▬▬▬▬▬▬                    │   │                  ▬▬▬▬▬▬▬▬▬▬  │
├───────────────────────────────┤   ├───────────────────────────────┤
│ VIDEO                6 bản    │   │ VIDEO               18 bản    │
│                               │   │                               │
│ tất cả              6         │   │ tất cả             18         │
│ LOẠI NGUỒN                    │   │ LOẠI NGUỒN                    │
│   tải lên           5         │   │   youtube          11         │
│   youtube           1         │   │   highlight         5         │
│ CHỦ ĐỀ                        │   │ CHỦ ĐỀ                        │
│   AI - talkshow     4         │   │   Bóng đá          12         │
│   Business Strategy 2         │   │   Chạy bộ           4         │
│ KHÁI NIỆM                     │   │ KHÁI NIỆM                     │
│   Talkshow          4         │   │   V-League          7         │
│   Hermes Agent      1         │   │   Pressing          3         │
└───────────────────────────────┘   └───────────────────────────────┘
  Cùng component. Cùng cấu trúc sidebar. Khác space_id → khác data.
```

### WF-3 — Tạo space mới (admin, không cần deploy)

```
┌──────────────────────────────────────────────────────────────┐
│  ➕  TẠO VŨ TRỤ MỚI                                           │
├──────────────────────────────────────────────────────────────┤
│  Tên hiển thị   [ Finance                     ]              │
│  Slug (URL)     [ finance                     ]  ✓ còn trống │
│                 → /video/finance/  ·  /bai-viet/finance/     │
│                                                              │
│  Biểu tượng     [ 💰 ]      Màu accent  [ ■ xanh dương ]     │
│  Quyền          ( ) Riêng tư  (●) Nội bộ  ( ) Công khai      │
│  Kiểu           (●) Lĩnh vực  ( ) Lớp học  ( ) Khách hàng    │
│                                                              │
│  ── ONTOLOGY BAN ĐẦU (có thể bỏ trống) ──────────────────    │
│  Chủ đề     [Vĩ mô ×][Chứng khoán ×][Tín dụng ×]  [+ thêm]   │
│  Khái niệm  [Lãi suất ×][P/E ×][Dòng tiền ×]      [+ thêm]   │
│  Loại nguồn [báo cáo ×][bản tin ×][filing ×]                 │
│  [ ] Để AI đề xuất ontology sau khi có 5 tài liệu đầu tiên   │
│                                                              │
│  ── AI ──────────────────────────────────────────────────    │
│  Prompt chưng cất  ┌────────────────────────────────────┐    │
│                    │ Tóm tắt theo: số liệu → luận điểm  │    │
│                    │ → rủi ro. Giữ nguyên con số, đơn   │    │
│                    │ vị, kỳ báo cáo.                     │    │
│                    └────────────────────────────────────┘    │
│  Persona chatbot   [ Chuyên viên phân tích tài chính    ]    │
│  RAG namespace     kb::finance          (tự sinh, khoá)      │
│                                                              │
│  ── MODULE BẬT ──────────────────────────────────────────    │
│  [✓] Bài viết  [✓] Video  [✓] Tài liệu  [✓] Chưng cất       │
│  [✓] Kho       [ ] Danh mục            [✓] Chatbot           │
│                                                              │
│  Chủ sở hữu     [ @quang                      ]  ← bắt buộc  │
│                                                              │
│                              [ Huỷ ]  [ Tạo vũ trụ ]         │
└──────────────────────────────────────────────────────────────┘
```

### WF-4 — Quản lý danh sách space

```
┌──────────────────────────────────────────────────────────────┐
│  ⚙️  QUẢN LÝ VŨ TRỤ                            [+ Tạo mới]    │
├──────────────────────────────────────────────────────────────┤
│  ≡ 🖥 Công nghệ    /video/          6 bản   @quang  MẶC ĐỊNH │
│  ≡ 💰 Finance      /video/finance/  0 bản   @quang  [ẩn]     │
│  ≡ ⚽ Thể thao     /video/sport/   18 bản   @ha              │
│  ≡ 📕 Ôn thi CSCP  (lớp học)       47 bản   @minh   12 người │
│                                                              │
│  ↕ Kéo để đổi thứ tự tab · Space 0 bản sẽ tự ẩn khỏi tab bar │
└──────────────────────────────────────────────────────────────┘
```

### WF-5 — Lớp học = Space (cùng schema, chỉ khác `type`)

```
┌──────────────────────────────────────────────────────────────┐
│  📕 LỚP: Ôn thi CSCP            12 thành viên · 47 tài liệu   │
├──────────────────────────────────────────────────────────────┤
│  [Tri thức chung] [Thành viên] [Trợ giảng AI] [Cấu hình]     │
│                                                              │
│  ĐÓNG GÓP                          TRỢ GIẢNG AI              │
│   Quang    12 tài liệu  ★★★         "Tuần này lớp yếu ở      │
│   Hà        9 tài liệu  ★★          phần Inventory Model.    │
│   Minh      7 tài liệu  ★★          Tôi đã soạn 8 câu ôn."   │
│                                      [ Bắt đầu ôn ]          │
│                                                              │
│  ⚠️ Trợ giảng CHỈ đọc tri thức của lớp này (kb::class-cscp)  │
└──────────────────────────────────────────────────────────────┘
```

---

## 6. HIỆU ỨNG CHUYỂN TAB — phần quyết định cảm giác sản phẩm

### 6.1 So sánh 4 kiểu

| Kiểu | Cảm giác | Chi phí | Kết luận |
|---|---|---|---|
| **Crossfade** | An toàn, trung tính | Rẻ | Nhạt, không "ăn khách" |
| **Trượt hướng** | Não hiểu "vừa đi sang phải/trái" | Rẻ | ✅ Nền tảng nên chọn |
| **So le từng thẻ** | Sang, như chia bài | Rẻ | ✅ Ghép cùng trượt hướng |
| **Mờ phóng (blur)** | Đã mắt | `filter: blur` tốn GPU | Chỉ dùng nếu ≤ 20 thẻ |

**Đề xuất: Trượt hướng + So le nhẹ.** Hướng trượt theo vị trí tab (tab bên phải → nội dung trượt từ phải sang), độ lệch 40–45ms/thẻ.

### 6.2 Thông số tham chiếu

```
Thoát (out):   opacity 1→0, translateX ∓40px,  160ms, ease
Vào (in):      opacity 0→1, translateX ±46px→0, 300ms, cubic-bezier(.22,1,.36,1)
Stagger:       45ms mỗi thẻ (out 25ms)
Pill/underline tab: left+width, 340ms, cùng đường cong
Tổng cảm nhận: ~480ms — đừng vượt 600ms
```

### 6.3 Kỹ thuật

- **Dùng View Transitions API** (`document.startViewTransition`) thay vì tự viết timing. Trình duyệt tự chụp trạng thái trước/sau và morph, mượt hơn tay làm, code ngắn, tự fallback.
- **FLIP cho thẻ tồn tại ở cả hai tab** (nội dung cross-post) — cho nó *bay* sang vị trí mới thay vì biến mất rồi hiện lại.
- **Khoá chiều cao container** trong lúc chuyển (`min-height` = chiều cao cũ), thả sau khi xong. Tránh trang nhảy khi tab mới ít thẻ hơn.
- **Tôn trọng `prefers-reduced-motion`** — đổi thẳng, không animation. Bắt buộc, và cũng là cách QA tách logic khỏi hiệu ứng.

### 6.4 Rủi ro thật: độ trễ mạng, không phải animation

Animation ra 170ms nhưng API trả về 600ms thì user vẫn thấy giật. Ba thứ bắt buộc:

1. **Prefetch on hover** — rê chuột qua tab là gọi API ngay; bấm vào thì data đã sẵn.
2. **Cache theo space** — quay lại tab cũ phải hiện tức thì, không gọi lại.
3. **Skeleton giữ đúng chiều cao** — data chưa về thì hiện khung xám đúng số thẻ. Cấm để grid sập chiều cao rồi bung lại; đây là thứ phá cảm giác mượt nhiều nhất.

### 6.5 URL & lịch sử

- Mỗi tab một URL thật, `pushState` — không dùng state ẩn.
- Nút Back phải chạy đúng **và chạy animation ngược hướng**.
- Copy link gửi người khác phải mở đúng space.

---

## 7. Routing

**Phương án chọn: module-first, space là hậu tố.**

```
/video/                    → space mặc định
/video/finance/            → space "finance"
/video/sport/              → space "sport"
/bai-viet/finance/         → cùng space, module khác
/tai-lieu/finance/
```

**Ưu:** giữ nguyên toàn bộ URL hiện tại (space mặc định không có hậu tố → không cần redirect), tab menu nằm trong khối nội dung nên URL phản ánh đúng cấu trúc UI, share link giữ đúng bối cảnh.

⚠️ **Bẫy kỹ thuật phải xử lý ngay:** `/video/finance/` có thể đụng route chi tiết `/video/{id}` hoặc `/video/{slug-bài}`. Cách xử lý:
- Danh sách **slug bị cấm** (`new`, `edit`, `search`, `api`, số thuần…), validate ngay lúc admin tạo space.
- Kiểm tra trùng với slug space đang có và với item detail — báo lỗi tại form tạo.
- Hoặc tách rõ ràng: chi tiết là `/video/item/{id}`, space là `/video/{space}`. **Nên chọn cách này** — an toàn tuyệt đối, chỉ tốn một lần đổi route.

Kèm theo: nhớ space cuối cùng trong user profile → vào `/` thì mở lại space quen thuộc.

## 8. Data model đề xuất (để team phản biện)

```yaml
space:
  id: uuid
  slug: "finance"                # NULL/rỗng = space mặc định (URL không có hậu tố)
  name: "Finance"                # người dùng tự đặt
  type: domain | class | tenant  # 1 primitive, 3 use case
  visibility: private | internal | public
  is_default: bool               # đúng 1 space được true
  tab_order: int                 # admin kéo thả đổi thứ tự
  theme: { icon: "💰", accent: "#378ADD" }
  ontology:                      # per-space, KHÔNG còn global
    categories: [...]
    concepts: [...]
    source_types: [...]
  modules: [articles, videos, docs, chatbot]
  ai:
    distill_prompt: "..."
    chatbot_persona: "..."
    rag_namespace: "kb::finance" # tự sinh từ slug, khoá không cho sửa
  owner_id: uuid                 # BẮT BUỘC — không có owner thì không tạo được
  created_at: ...

space_member:
  space_id | user_id | role: owner|editor|viewer

# MỌI entity nội dung đều có:
item:
  primary_space_id: uuid          # NOT NULL, có index
  cross_posted_space_ids: [uuid]  # tuỳ chọn
```

**Ràng buộc kỹ thuật bắt buộc:**
1. Không query nào được bỏ sót space filter → viết **test tự động** quét mọi repository/query.
2. `primary_space_id` là `NOT NULL` + có index.
3. RAG index tách namespace theo space — không dùng metadata filter thuần (dễ rò).
4. Tạo space mới **hoàn toàn từ UI**, không deploy, không restart, không sửa file config.
5. Xoá space phải hỏi rõ: xoá luôn nội dung, hay chuyển nội dung về space mặc định.

## 9. Câu hỏi cần research (nội dung chính của spike)

1. **Ontology per-space:** `categories.yaml` / `concepts.yaml` hiện global → tách per-space thế nào? Lưu DB hay file? Có phần dùng chung (ví dụ "Tin tức") không?
2. **Slug collision:** chọn `/video/item/{id}` hay danh sách slug cấm? (đề xuất: cái đầu)
3. **Ontology cho space mới tinh:** admin khai tay hay AI đề xuất sau N tài liệu? Luồng duyệt ra sao?
4. **Pipeline phân loại tự động:** khi ingest, làm sao biết tài liệu thuộc space nào — user chọn tay, hay AI đoán rồi duyệt?
5. **Per-space UI state:** lưu ở đâu, lưu gì (filter/sort/scroll/search)?
6. **Cross-space:** Dashboard tổng nhìn thấy gì? Search có chế độ xuyên vũ trụ không? Chatbot có không? (mặc định: **không**)
7. **Migration:** gán toàn bộ dữ liệu hiện tại vào space mặc định; script backfill; rollback plan.
8. **Prior art:** Notion / Slack / Obsidian / Arc xử lý switching UX và cross-workspace search thế nào.

## 10. Rủi ro — phần lớn KHÔNG nằm ở kỹ thuật

| Rủi ro | Mức | Cách giảm |
|---|---|---|
| **Pha loãng nội dung** — space mở ra với 2 tài liệu rồi bỏ hoang → sản phẩm trông chết | 🔴 Cao | **Space 0 bản ghi tự ẩn khỏi tab bar.** Bắt buộc có owner đích danh khi tạo. Launch 1 space thật + 1 space thử nghiệm, không phải 3 space rỗng. |
| **Tạo space bừa bãi** — ai cũng tạo được thì 3 tháng sau có 20 tab | 🔴 Cao | Chỉ admin tạo được. Có màn quản lý (WF-4). Rà soát định kỳ, gộp/ẩn space chết. |
| Ontology bị bỏ đói — không ai duy trì cho space mới | 🟠 TB | Owner chịu trách nhiệm; AI đề xuất bổ sung khi phát hiện khái niệm lặp |
| Rò rỉ chéo space (query quên filter) | 🟠 TB | Test tự động + RAG tách namespace |
| Animation mượt nhưng API chậm → vẫn giật | 🟠 TB | Prefetch on hover + cache + skeleton (mục 6.4) |
| Retrofit muộn | 🟠 TB | **Làm ngay bây giờ, lúc mới 6 bản ghi thì rẻ** |
| Team hiểu nhầm thành bài toán UI thuần | 🟠 TB | Chính tài liệu này |

## 11. Cách chạy spike

**Time-box: 3–5 ngày. Chia 2 nhánh song song.**

- **Nhánh A — Data & scoping:** data model, ontology per-space, migration script, luồng tạo space từ UI. Demo: admin tạo space "Finance" và thấy tab xuất hiện ngay.
- **Nhánh B — UX & hiệu ứng:** prototype tab menu + View Transitions API + prefetch/cache/skeleton. Demo: chuyển tab mượt trên dữ liệu thật, có Back/Forward.

**Deliverable = 1 ADR, KHÔNG phải slide:**

```
ADR-00X: Space Model
1. Bối cảnh
2. Các phương án (2–3) kèm trade-off rõ ràng
3. Phương án chọn + lý do
4. Hệ quả (cái gì phải sửa, cái gì mất đi)
5. Kế hoạch migration + rollback
```

**Checklist review ADR:**

- [ ] Admin tạo space mới có cần deploy không? (Phải là **không**)
- [ ] Slug do người dùng đặt có đụng route chi tiết không? Đã chặn ở đâu?
- [ ] Lớp học và tenant B2B dùng lại được model này **mà không sửa schema** không?
- [ ] Có query nào bỏ sót space filter không? Có test chặn không?
- [ ] Chatbot space A có trích dẫn được tài liệu space B không? (Phải là **không**, trừ khi bật rõ ràng)
- [ ] Nội dung liên ngành xử lý thế nào — đã có câu trả lời cụ thể chưa?
- [ ] Chuyển tab lúc mạng chậm có bị sập chiều cao / nhảy trang không?
- [ ] Back/Forward có chạy đúng và chạy animation ngược hướng không?
- [ ] Đổi space rồi quay lại, state cũ còn nguyên không?
- [ ] Migration có rollback được không?

> **Câu hỏi chốt khi review:** *"Nếu ngày mai mở một lớp học 12 người dùng chung tri thức, model này có dùng lại được mà không sửa schema không?"*
> Trả lời được câu đó thì thiết kế đúng hướng.

---

## 12. Vì sao việc này đáng làm ngay

Space Model không chỉ giải bài toán "nhiều lĩnh vực". Nó là **hạ tầng bắt buộc** cho 3 thứ trong roadmap:

- **Lớp học** (BRD mục 6, 7) — lớp học chính là space kiểu `class`.
- **Chatbot riêng từng bộ tri thức** (BRD mục 7) — RAG namespace theo space.
- **Bán hàng / B2B / marketplace** — tenant chính là space kiểu `tenant`; không có ranh giới dữ liệu thì không bán được cho doanh nghiệp.

Làm bây giờ: sửa 6 bản ghi. Làm sau 6 tháng: migration hàng nghìn item + đập lại RAG index + sửa mọi query.
