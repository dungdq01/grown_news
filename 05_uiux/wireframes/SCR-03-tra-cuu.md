# SCR-03 · Tra cứu — wireframe

> ⚠ **Bản v1 — khung chứa đã đổi.** Wireframe này vẽ theo mô hình "một tờ giấy
> giữa màn hình". Bản dựng thật là **app shell + nhiều cửa sổ đọc** — xem
> [`SCR-00-app-shell.md`](SCR-00-app-shell.md).
>
> Phần **nội dung từng khối** dưới đây vẫn đúng và đã được dựng. Phần **khung
> chứa** (một cột căn giữa, không sidebar, không multi-window) đã thay.

> Bố cục thuần. Màu/font chốt ở nhịp 2.
>
> Điểm khác biệt của màn này: **lọc theo `concepts` là lọc chính xác**, không phải
> tìm mờ — vì danh mục được kiểm soát (BRD B-C2). Không cần embedding.

## Desktop ≥1024px

```
┌──────────────────────────────────────────────────────────────────┐
│  Grown_news                                [tra cứu] [chuyên mục] │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│   ┌────────────────────────────────────────────────────────┐     │
│   │ 🔍 idempotency                                     [×]  │     │ ← MỘT ô nhập
│   └────────────────────────────────────────────────────────┘     │   hai chế độ
│                                                                   │
│   ┌─ gợi ý khi gõ ─────────────────────────────────────────┐     │
│   │ KHÁI NIỆM (khớp chính xác)                              │     │ ← ưu tiên
│   │   ◆ idempotency — Tính lũy đẳng            5 bài        │     │   khái niệm
│   │     alias: exactly-once, dedupe, idempotency-key        │     │   lên trước
│   │ ─────────────────────────────────────────────────────── │     │
│   │ TỪ KHÓA (full-text)                                     │     │
│   │   "idempotency" trong 8 bài                             │     │
│   └─────────────────────────────────────────────────────────┘     │
│                                                                   │
│   ── bộ lọc ──                                                    │
│   loại:  [tất cả ▾]   độ tin: [tất cả ▾]   mục rữa: [tất cả ▾]  │
│                                                                   │
│   ┌────────────────────────────────────────────────────────┐     │
│   │ 5 kết quả · lọc theo khái niệm: idempotency       [×]  │     │ ← chip lọc
│   └────────────────────────────────────────────────────────┘     │   gỡ được
│                                                                   │
│   ├─ repo · application ────────────────── plausible ──┤          │
│   │  Tít bài                                            │          │
│   │  ┃ …consumer đọc từ hàng đợi có khả năng gửi trùng, │          │ ← ĐOẠN KHỚP
│   │  ┃ dedupe bằng idempotency-key ở tầng staging…      │          │   không chỉ tít
│   │  [idempotency] [staging-table-pattern]              │          │
│   ├──────────────────────────────────────────────────────┤          │
│   │  paper · §4.2 ───────────────────────── verified ──┤          │
│   │  Tít bài                                            │          │
│   │  ┃ …exactly-once delivery đạt được bằng cách…       │          │
│   │  [idempotency] [eventual-consistency]               │          │
│   ├──────────────────────────────────────────────────────┤          │
│   │  ...                                                 │          │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

**Trả kết quả kèm đoạn khớp**, không chỉ tít — người dùng thấy ngay *lý do* nó khớp.
Đây là yêu cầu rõ trong `web-spec.md`.

## Vì sao gợi ý khái niệm đứng trên từ khóa

```
gõ "dedupe"
   │
   ├─ KHÁI NIỆM: khớp alias → idempotency (5 bài)   ← chính xác, đứng trước
   │
   └─ TỪ KHÓA: chuỗi "dedupe" xuất hiện (2 bài)     ← mờ hơn, đứng sau
```

`concepts.yaml` có `aliases`, nên gõ `dedupe`, `exactly-once`, hay
`chống trùng bản ghi` đều dẫn về đúng một node `idempotency`. Đó là giá trị của
danh mục kiểm soát — thứ mà tìm full-text không cho.

## Duyệt theo khái niệm — không gõ gì

```
┌─────────────────────────────────────────────────────┐
│  ── KHÁI NIỆM TRONG KHO ──                          │
│                                                      │
│  dữ liệu & ML                                        │
│  [walk-forward-validation 3] [data-leakage 2]       │ ← cỡ chip
│  [intermittent-demand 1]                             │   theo số bài
│                                                      │
│  hệ thống & tích hợp                                 │
│  [idempotency 5] [backpressure 2] [circuit-breaker 1]│
│                                                      │
│  AI agent & LLM                                      │
│  [context-management 4] [tool-schema-design 2]      │
│                                                      │
│  ── CHỜ DUYỆT (concepts_proposed) ──                │
│  streaming-backpressure · retry-jitter               │ ← mờ, không bấm
│  ↑ 2 khái niệm chờ vào danh mục                     │   được
└─────────────────────────────────────────────────────┘
```

Khối `concepts_proposed` hiện ra ở đây là chủ ý: nó nhắc **nhịp tuần** (duyệt lô
khái niệm) mà README nói dễ bị bỏ nhất. Không bấm được vì chưa vào danh mục.

## Ba state

### empty — không có kết quả
```
┌────────────────────────────────────┐
│  Không có bài nào khớp "xyz"       │
│                                     │
│  Thử:                               │
│  • bỏ bớt bộ lọc                   │
│  • duyệt theo khái niệm ↓          │
│                                     │
│  [xem tất cả khái niệm]            │
└────────────────────────────────────┘
```

### empty — kho rỗng
Cùng nội dung với SCR-02 empty: hướng dẫn 4 bước thêm bài.

### loading
Không áp dụng — lọc client-side trên index sinh lúc build.

## Mobile <768px

```
┌──────────────────┐
│ 🔍 [          ]  │
├──────────────────┤
│ [loại▾][tin▾][…] │ ← lọc cuộn ngang
├──────────────────┤
│ 5 kết quả        │
│ ├──────────────┤ │
│ │ repo         │ │
│ │ Tít bài      │ │
│ │ ┃ đoạn khớp  │ │
│ │ [idempotency]│ │
│ ├──────────────┤ │
└──────────────────┘
```

## Quyết định bố cục — và vì sao

| Quyết định | Vì sao |
|---|---|
| Một ô nhập, hai chế độ | PRD U6 nói rõ "cùng một ô nhập" — không bắt người dùng chọn chế độ trước |
| Khái niệm đứng **trên** từ khóa | Khớp chính xác đáng tin hơn khớp chuỗi. Alias làm việc này khả thi |
| Hiện đoạn khớp | Thấy *lý do* khớp, không phải chỉ *cái gì* khớp |
| Chip lọc gỡ được | Trạng thái lọc phải nhìn thấy và tháo được |
| Duyệt theo khái niệm khi không gõ | Màn trống là cơ hội cho người lang thang, không phải màn chờ |
| Hiện `concepts_proposed` mờ | Nhắc nhịp tuần — việc dễ bỏ nhất |
| Cỡ chip theo số bài | Thấy ngay kho tích luỹ quanh khái niệm nào |
| Không có "sắp xếp theo" | Vài trăm bài, kết quả ít; thêm điều khiển là thêm phức tạp không cần |
