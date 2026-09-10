---
name: nap-bai
description: >
  Hợp đồng GIAO NỘP bài vào kho Grown_news — đường API, frontmatter tối thiểu,
  khung 5 mục, và những cổng sẽ trả bài về. Dùng khi bạn đã phân tích xong một
  nguồn và cần ĐƯA NÓ VÀO kho, hoặc khi được yêu cầu "nạp bài", "bắn qua API",
  "thêm bài vào Grown_news". KHÔNG phải giao thức phân tích — phần đó ở skill
  `source-distiller`.
---

# Nạp bài vào Grown_news

> **Phân tích** một nguồn là việc của `source-distiller` (6 pass, 8 luật nền).
> File này chỉ trả lời câu tiếp theo: **giao bài cho hệ thống bằng cách nào.**
>
> Đọc file này khi bạn đã có bài; đừng đọc nó thay cho giao thức phân tích.

---

## 0 · Ba điều SKILL `source-distiller` nói SAI ở phiên bản hiện tại

Skill đó viết trước FR-033. Ba câu này trong nó **không còn đúng**:

| Nó nói | Thực tế hôm nay |
|---|---|
*"Đặt `review_status: draft`. Chỉ người mới được đổi trường này."* | Bạn **không đặt được** trường này. Server lột nó khỏi payload (M08-R5) rồi tự áp. |
*"Cả hai đường đều vào kho với `review_status: draft`. Không có ngoại lệ."* | `POST /api/articles` vào thẳng **`approved`**. Ngoại lệ chính là đường đó. |
`references/web-spec.md` mô tả Next.js + Postgres | Thực tế: Quartz v5 + `.md` + index SQLite dẫn xuất. Đó là bản thiết kế của một giai đoạn trước. |

Phần **phân tích** của skill đó vẫn đúng nguyên vẹn. Chỉ phần giao nộp lạc hậu.

---

## 1 · Hai cửa, khác nhau ở HỆ QUẢ

```
POST /api/articles   JSON {frontmatter, body}   →  approved  · lên site NGAY
POST /api/inbox      raw .md + x-ten-file       →  draft     · origin: external
```

**Chọn cửa nào — hỏi một câu duy nhất:** nội dung này do *chủ kho* (hoặc agent
làm việc thay họ) viết ra, hay đến từ *bên ngoài*?

- **Chủ kho viết** → cửa 1. Đây là đường mặc định cho bạn.
- **Nguồn ngoài, chưa ai đọc lại** → cửa 2. Nó dừng ở `draft` vì M05-R1: *một
  file thả vào thư mục không được tự lên site*. Chủ kho mở ra, bấm **Đưa lên
  site** là xong.

Không có hàng đợi duyệt. Không có bước xác nhận. Bài cửa 1 lên site ngay.

---

## 2 · Cửa 1 — `POST /api/articles`

```bash
curl -X POST http://127.0.0.1:8787/api/articles \
  -H "content-type: application/json" \
  -d @bai.json
```

`bai.json`:

```json
{
  "frontmatter": {
    "id": "src_a1b2c3",
    "slug": "ten-duong-dan-cua-bai",
    "source_type": "article",
    "url": "https://nguon-that.example/bai",
    "protocol_version": "2.0",
    "analyzed_at": "2026-08-26",
    "one_liner": "Một câu nói bài này cho biết điều gì",
    "credibility_max": "plausible",
    "conformance": "B"
  },
  "body": "## 1. Overview\n\n…đủ 5 mục + bốn mục con của §3…"
}
```

### Trường bắt buộc, và ràng buộc của từng cái

| Trường | Ràng buộc |
|---|---|
`id` | `src_` + ≥6 ký tự `[a-z0-9]`. **Khoá ổn định** — bài trỏ vào nó, không đổi được sau. |
`slug` | `[a-z0-9]+(-[a-z0-9]+)*`. Chính là tên file và phần cuối địa chỉ trang. |
`source_type` | một trong `repo · paper · video · article · docs · announcement` |
`url` | địa chỉ nguồn thật |
`protocol_version` | `"2.0"` |
`analyzed_at` | `YYYY-MM-DD` |
`one_liner` | ≤160 ký tự |
`credibility_max` | `verified · plausible · claimed · conflicted` |
`conformance` | `A · B · C` |

### ĐỪNG gửi ba trường này — server lột hết

`review_status` · `origin` · và `id`/`slug`/`source_type` khi **PUT** (sửa).
Gửi cũng không sao, nhưng nó bị bỏ qua. Đó là M08-R5, không phải một lỗi.

### Ba trường M1 — TUỲ CHỌN, và bạn KHÔNG được tự khai

`insight_new` · `skill_installed` · `review_minutes` là **lời khai của người
đọc**. Máy điền hộ là phá B-B1/M08-R3.

Bỏ trống. Vắng mặt là sự thật *"chưa ai đọc lại"*; `false` là một lời khai không
ai đưa ra.

---

## 3 · Thân bài — 5 mục, và bốn cổng sẽ trả về

> **Khung khai ở `core/assets/khung-than-bai.json`** (FR-036). Đó là nguồn duy
> nhất; file này chỉ chép lại cho dễ đọc. Lệch nhau thì tin file khai.

Khung mẫu: `GET http://127.0.0.1:8787/mau-nap-nguon.md`

```
## 1. Overview                một câu: bài này nói cái gì mới
## 2. Bối cảnh                vấn đề gì tồn tại trước → vì sao nguồn này có
## 3. Nội dung                MỘT mục, bốn mục con:
     ### 3.1 Đầu vào
     ### 3.2 Process          mục nặng · đòi locator
     ### 3.3 Output           đòi locator
     ### 3.4 Tinh túy         mục nặng · đòi locator · `#### 3.4.x` + 5 dòng
## 4. Ý nghĩa thực tế         đòi locator — "+ ví dụ thực tế"
## 5. Rủi ro và tầm nhìn
```

`validate.py` sẽ trả bài về nếu:

| Cổng | Đòi |
|---|---|
**đủ mục** | cả 5 mục `## n.` **và** cả bốn mục con `### 3.n` — thiếu thì báo `Thiếu mục: 3.3` |
**locator** | mục `3.2` · `3.3` · `3.4` · `4` mỗi mục ≥1 địa chỉ `[nguon.py:10-40]` · `[12:04–13:30]` · `[§4.2]`. §1 · §2 · §3.1 · §5 **được miễn** |
**dẫn nhập** | §1+§2 **≤25%** tổng số từ. Đây là TRẦN, không phải sàn: viết dài phần dẫn nhập là dấu hiệu chưa đọc nguồn |
**tinh túy** | 1–5 tinh túy dạng `#### 3.4.x` (bốn dấu `#`), mỗi cái đủ 5 dòng: `Không hiển nhiên vì` · `Chuyển giao` · `Tin cậy` · `Bằng chứng` · `Loại` |
**word_count** | phải khớp máy đếm — **đừng khai tay**, `--fix` tự điền. Trần cứng 1800, cảnh báo từ 1500 |

Bài 2 mục nhận `422` kèm nguyên văn lý do. Cổng nói đúng thứ thiếu; đọc nó rồi
sửa, đừng đoán.

---

## 4 · Nhãn — danh mục hiện ĐANG RỖNG

`kb/concepts.yaml` và `kb/categories.yaml` đều **0 mục** (chủ kho xoá sạch để tự
nhập lại). Hệ quả cho bạn:

- **`concepts` bỏ trống.** Gửi một id không có trong danh mục ⇒ `422`.
- Muốn đề xuất nhãn: dùng **`concepts_proposed: ["ten-nhan"]`** — trường tự do,
  không qua danh mục. Chủ kho kết nạp sau ở màn Danh mục.
- **`category` bỏ trống.** `enum` trong schema cũng rỗng; gửi giá trị nào cũng
  trượt.
- Cần một nhãn có thật ngay: `POST /api/concepts {id, label_vi}` — vào danh mục
  **luôn**, không cần duyệt. Chủ đề thì `POST /api/categories {id, label_vi, gom}`.

⚠️ `assets/concepts.seed.yaml` trong bộ `source-distiller` **không còn khớp**
kho. Đừng lấy id từ đó.

---

## 5 · Cửa 2 — `POST /api/inbox`

```bash
curl -X POST http://127.0.0.1:8787/api/inbox \
  -H "x-ten-file: ten-bai.md" --data-binary @bai.md
```

Cửa này coi mọi thứ nộp vào là `origin: external` và đòi thêm:

```yaml
citations_sampled: 2     # BẮT BUỘC ≥2 — tự mở link, xác nhận trích dẫn khớp
citations_verified: 2    # phải ≥ sampled
```

Thiếu → `TRẢ LẠI  ten-bai.md · SAI: citations_sampled = 0, cần >= 2`

**Đọc `vao_kho`, đừng đọc mã HTTP.** Cửa này trả `200` kể cả khi cổng trả bài
về. Và `gate_ma` là exit code của **cả lô** `_inbox/` — một bản cũ còn kẹt ở đó
cũng làm nó khác 0.

---

## 6 · Sau khi ghi — không còn bước build nào

**FR-034 đã bỏ site tĩnh.** Server render từ DB **ngay lúc request** (`web/render/`),
nên sau một lần ghi qua API, mọi màn đổi ở lần tải trang kế tiếp: Trang chủ · Tất
cả · Kho · Danh mục · thùng rác · trang riêng của bài.

Không có `npm run build` trong luồng nạp bài nữa. Nếu bạn thấy tài liệu nào bảo
chạy build sau khi nạp, tài liệu đó lạc hậu.

Hai điều CÒN đúng và đáng nói:

- **Ghi xong là export xong.** `banXuat()` được `await` ngay trong request
  (~300 ms), nên HTTP 200 nghĩa là `kb/**` đã được ghi lại. DB là chân lý, file
  `.md` là export/backup — đừng sửa file rồi tưởng kho đã đổi.
- **Người dùng phải TẢI LẠI trang.** Server render đúng, nhưng tab đang mở vẫn là
  ảnh chụp của lần render trước. Nói đúng một câu: *"bài đã vào kho, tải lại
  trang là thấy."*

⚠️ `npm run build` bây giờ chỉ dịch `.inline.ts` → `.js` cho FE (`build-fe.mjs`),
và cần **restart** `npm run api` để server nạp lại bundle — không liên quan gì
tới việc bài có lên site hay không.

- Sửa bài: `PUT /api/articles/<type>/<slug>` + header `if-match: <etag>` lấy từ
  `GET`. Sửa **không** làm bài rời khỏi site.

## 7 · Đường dẫn — luôn có `<type>`

```
/api/articles/<type>/<slug>              GET · PUT · DELETE
/api/articles/<type>/<slug>/status       PATCH  {to, reject_reason?}
/api/articles/<type>/<slug>/restore      POST   {slug_moi?}
```

Thiếu đoạn `<type>` là `404` (hoặc `400 type phải thuộc…`). Đây từng là một bug
thật làm chết bốn nút trên giao diện — đừng dựng lại nó.

---

## 8 · Bảng chuyển trạng thái

```
draft     → approved · rejected
edited    → approved · rejected
approved  → rejected                 (KHÔNG có đường về draft)
rejected  → approved
```

`rejected` đòi `reject_reason` ≥5 ký tự. Chuyển khỏi `rejected` thì lý do tự
được bỏ — phán quyết thu hồi rồi thì lý do của nó không còn mô tả hiện trạng.

---

## 9 · Điều KHÔNG được làm

- **Không** ghi thẳng vào `kb/` khi API đang chạy. Mọi đường ghi phải qua
  `validate.py`; ghi tay là bỏ qua cổng.
- **Không** tự khai ba trường M1.
- **Không** đặt `review_status`/`origin` — server quyết.
- **Không** bịa locator. Không có địa chỉ thì ghi `[suy đoán]` (luật L2 của
  `source-distiller`), và cổng locator sẽ trả bài về — đó là đúng.
- **Không** khai `word_count` bằng tay.