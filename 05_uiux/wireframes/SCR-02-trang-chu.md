# SCR-02 · Trang chủ — wireframe

> ⚠ **Bản v1 — khung chứa đã đổi.** Wireframe này vẽ theo mô hình "một tờ giấy
> giữa màn hình". Bản dựng thật là **app shell + nhiều cửa sổ đọc** — xem
> [`SCR-00-app-shell.md`](SCR-00-app-shell.md).
>
> Phần **nội dung từng khối** dưới đây vẫn đúng và đã được dựng. Phần **khung
> chứa** (một cột căn giữa, không sidebar, không multi-window) đã thay.

> Bố cục thuần. Màu/font chốt ở nhịp 2.
>
> **Ba khối, không hơn.** Cố ý bỏ: carousel · infinite scroll · popup đăng ký.
> Nội dung để tra cứu, không để giữ chân.

## Desktop ≥1024px

```
┌──────────────────────────────────────────────────────────────────┐
│  Grown_news                                [tra cứu] [chuyên mục] │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  TIÊU ĐIỂM                                                  │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │ repo · agent · 6 phút đọc          ưu tiên 65 ▲       │  │  │
│  │  │                                                       │  │  │
│  │  │ TÍT BÀI LỚN — MỘT MỆNH ĐỀ                            │  │  │
│  │  │                                                       │  │  │
│  │  │ Sapo đầy đủ, 3-4 dòng. Vấn đề nó giải, cách tiếp     │  │  │
│  │  │ cận đặc trưng, ai nên quan tâm.                      │  │  │
│  │  │                                                       │  │  │
│  │  │ [walk-forward-validation] [data-leakage]             │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────┘  │
│         ↑ CHỌN THEO priority CAO NHẤT 7 NGÀY — KHÔNG theo ngày   │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  MỚI PHÂN TÍCH                                              │  │
│  │                                                             │  │
│  │  ├─ paper · 7 phút ─────────────────────── 2026-08-18 ──┤  │  │
│  │  │  Tít bài                                              │  │  │
│  │  │  Sapo 2 dòng, cắt ở đây...                            │  │  │
│  │  │  độ tin: plausible · 2 nguồn                          │  │  │
│  │  ├───────────────────────────────────────────────────────┤  │  │
│  │  │  video · 12 phút ────────────────────── 2026-08-17 ──┤  │  │
│  │  │  Tít bài                              [external] ⚠   │  │  │
│  │  │  Sapo 2 dòng...                                       │  │  │
│  │  ├───────────────────────────────────────────────────────┤  │  │
│  │  │  ... (danh sách, không phân trang, không cuộn vô tận) │  │  │
│  │  └───────────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  THEO CHUYÊN MỤC                                            │  │
│  │  ┌───────┬───────┬───────┬───────┬───────┬───────┐         │  │
│  │  │ repo  │ paper │ video │article│ docs  │announ.│         │  │
│  │  │  (3)  │  (2)  │  (2)  │  (2)  │  (1)  │  (0)  │         │  │
│  │  ├───────┼───────┼───────┼───────┼───────┼───────┤         │  │
│  │  │ tít 1 │ tít 1 │ tít 1 │ tít 1 │ tít 1 │   —   │         │  │
│  │  │ tít 2 │ tít 2 │ tít 2 │ tít 2 │       │       │         │  │
│  │  │ tít 3 │       │       │       │       │       │         │  │
│  │  └───────┴───────┴───────┴───────┴───────┴───────┘         │  │
│  │         ↑ 6 cột cố định, mỗi cột tối đa 4 tít               │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ─────────────────────────────────────────────────────────────   │
│  12 bài · cập nhật 2026-08-18 · [xem kho trên git]               │
└──────────────────────────────────────────────────────────────────┘
```

**Không có ảnh đại diện ở bản đầu.** `web-spec.md` gợi ý OG image sinh động, nhưng
với tông tạp chí kỹ thuật thì nhãn loại + tít + sapo đã đủ phân biệt. Thêm ảnh sau
nếu thấy thiếu — bỏ dễ hơn thêm.

## Ba state

### empty — **trạng thái hiện tại của dự án**

Kho đang rỗng, nên đây là màn đầu tiên người dùng thấy. Không được để trống trơn.

> **Đã thi hành 2026-08-19 (FR-008).** Trước đó phần này chỉ có trên giấy: mốc dữ
> liệu rỗng vẫn chiếm chiều cao đầy, cho ra panel cao 130px không chứa gì — người
> dùng chỉ đúng lỗi này. Nay:
>
> | Cơ chế | Ở đâu |
> |---|---|
> | Mốc rỗng ⇒ ẩn cả panel | `prototype.css` `[data-mount]:empty` |
> | Mốc có gợi ý ⇒ hiện một dòng `.hint` | `home-pages/index.ts` `chen(..., goiY)` |
> | Đếm `draft` trong gợi ý | `chen(shell,"brk",…)` — đúng ý "thông tin hành động được" |
>
> Cũng thi hành ở đây: **không có nút duyệt trên web** (M03-R2). Ba nút
> *Duyệt / Loại / Để sau* trong bản dựng cũ hứa một việc trang không làm được;
> đã thay bằng một dòng chỉ đường sang editor.

```
┌──────────────────────────────────────────────┐
│  Grown_news                                   │
├──────────────────────────────────────────────┤
│                                               │
│         Chưa có bài nào được duyệt            │
│                                               │
│   Kho có 3 bản ở trạng thái draft.            │
│   Duyệt một bản để nó xuất hiện ở đây.        │
│                                               │
│   ┌─────────────────────────────────────┐    │
│   │ Cách thêm bài:                       │    │
│   │ 1. Mở Claude Code, dán một link      │    │
│   │ 2. Đọc bản phân tích trong kb/       │    │
│   │ 3. Đổi review_status thành approved  │    │
│   │ 4. git push                          │    │
│   └─────────────────────────────────────┘    │
│                                               │
└──────────────────────────────────────────────┘
```

Đếm `draft` là thông tin hành động được — nói cho người dùng biết việc đang chờ họ,
chứ không chỉ báo "trống".

### loading
Không áp dụng — site tĩnh.

### error
Build lỗi thì không có site. Xử lý ở CI, không phải ở UI.

## Mobile <768px

```
┌──────────────────┐
│ Grown_news    ☰  │
├──────────────────┤
│ TIÊU ĐIỂM        │
│ ┌──────────────┐ │
│ │ repo · 6 phút│ │
│ │ TÍT LỚN      │ │
│ │ sapo...      │ │
│ └──────────────┘ │
│                  │
│ MỚI PHÂN TÍCH    │
│ ├──────────────┤ │
│ │ paper · 7'   │ │
│ │ Tít bài      │ │
│ │ sapo 2 dòng  │ │
│ ├──────────────┤ │
│ │ ...          │ │
│                  │
│ CHUYÊN MỤC       │
│ [repo 3][paper 2]│ ← chip cuộn ngang
│ [video 2][art 2] │   thay vì 6 cột
└──────────────────┘
```

6 cột không đọc được trên mobile ⇒ đổi thành hàng chip cuộn ngang, bấm vào lọc.

## Quyết định bố cục — và vì sao

| Quyết định | Vì sao |
|---|---|
| Tiêu điểm theo `priority`, **không theo ngày** | Kho tri thức ưu tiên *còn đúng*, không phải *mới*. Xếp theo ngày thì sau 6 tháng bài hay nhất chìm đáy |
| Hiện số ở mỗi chuyên mục | Thấy ngay kho lệch về loại nào |
| Thời gian đọc từ `word_count` | Giúp quyết định đọc hay không — `web-spec.md` nói rõ |
| Badge `external` + ⚠ | Người đọc cần biết bản không do pipeline sinh |
| Không phân trang, không cuộn vô tận | Vài trăm bài thì một danh sách là đủ; cuộn vô tận chống lại việc tra cứu |
| Footer có link tới git | Nguồn chân lý là git — cho người kỹ thuật đường thoát khỏi UI |
| empty state đếm `draft` | Trạng thái hiện tại thật; nói việc đang chờ người dùng |

## Chưa quyết — để nhịp 2

Khối "Vẫn còn đúng" (bài cũ `durability ≥ 4`) tôi đề xuất ở lượt trước **chưa đưa
vào** wireframe này, vì ba khối đã là trần cứng của `web-spec.md`. Cân nhắc lại
khi kho >20 bài.
