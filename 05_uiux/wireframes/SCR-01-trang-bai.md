# SCR-01 · Trang bài — wireframe

> ⚠ **Bản v1 — khung chứa đã đổi.** Wireframe này vẽ theo mô hình "một tờ giấy
> giữa màn hình". Bản dựng thật là **app shell + nhiều cửa sổ đọc** — xem
> [`SCR-00-app-shell.md`](SCR-00-app-shell.md).
>
> Phần **nội dung từng khối** dưới đây vẫn đúng và đã được dựng. Phần **khung
> chứa** (một cột căn giữa, không sidebar, không multi-window) đã thay.

> **Wireframe, không phải theme.** Ở đây chỉ có: khối gì, nằm đâu, to nhỏ tương
> đối, thứ tự đọc. **Không màu, không font, không cỡ chữ** — những thứ đó chốt ở
> nhịp 2 (`design-brief` → `DESIGN.md`).
>
> Tông: **tạp chí kỹ thuật đọc sâu** — một cột, dòng chữ dài dễ đọc, nhiều
> khoảng trắng.

## Desktop ≥1024px

```
┌────────────────────────────────────────────────────────────────┐
│  Grown_news                              [tra cứu]  [chuyên mục]│ ← thanh trên, mảnh
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│         ┌─────────────────────────────────────────┐             │
│         │  paper · 14 trang · 7 phút đọc          │  ← nhãn loại│
│         │                                         │             │
│         │  TÍT BÀI — MỘT MỆNH ĐỀ MÔ TẢ            │  ← lớn nhất │
│         │  NGUỒN NÀY LÀ GÌ                        │    trên trang│
│         │                                         │             │
│         │  ┃ 60 GIÂY                              │  ← sapo,    │
│         │  ┃ Vấn đề nó giải. Cách tiếp cận đặc    │    có vạch  │
│         │  ┃ trưng. Ai nên quan tâm.              │    bên trái │
│         │                                         │             │
│         ├─────────────────────────────────────────┤             │
│         │ ┌─────────────────────────────────────┐ │             │
│         │ │ tác giả · 2025-11-03 · CC-BY-4.0    │ │ ← ❷ metadata│
│         │ │ độ tin: plausible · 2 nguồn độc lập │ │   hộp viền  │
│         │ │ phân tích: 2026-08-17 · v2          │ │   mảnh      │
│         │ │ [pipeline]                          │ │   badge     │
│         │ └─────────────────────────────────────┘ │             │
│         │                                         │             │
│         │ ┌─────────────────────────────────────┐ │             │
│         │ │ ⚠ 2 trích dẫn chưa kiểm được        │ │ ← ❸ CẢNH BÁO│
│         │ │   1 nguồn phản biện chưa giải quyết │ │   chỉ hiện  │
│         │ └─────────────────────────────────────┘ │   khi có    │
│         │                                         │             │
│         ├─────────────────────────────────────────┤             │
│         │                                         │             │
│         │  1. BỐI CẢNH                            │ ← ❹ thân bài│
│         │  ─────────────────────────────────────  │   9 mục     │
│         │  Vấn đề tồn tại trước khi có nguồn      │   một cột   │
│         │  này. Cách giải cũ và chỗ chúng đau.    │   ~680px    │
│         │                                         │             │
│         │  2. Ý TƯỞNG LỚN                         │             │
│         │  ─────────────────────────────────────  │             │
│         │  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │ ← nhấn mạnh │
│         │  ┃ Một đoạn. Nếu chỉ nhớ được một   ┃  │   cỡ chữ    │
│         │  ┃ điều thì nhớ điều này.           ┃  │   lớn hơn   │
│         │  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │             │
│         │                                         │             │
│         │  3. BẢN ĐỒ                              │             │
│         │  ─────────────────────────────────────  │             │
│         │  ┌────────┬──────────────┬───────────┐  │ ← bảng      │
│         │  │ Khối   │ Nội dung     │ Địa chỉ   │  │   tràn ngang│
│         │  ├────────┼──────────────┼───────────┤  │   thì cuộn  │
│         │  │ ...    │ ...          │ [§4.2]    │  │   trong ô   │
│         │  └────────┴──────────────┴───────────┘  │             │
│         │                                         │             │
│         │  4. TRỤC KHÁI NIỆM                      │             │
│         │  5. CƠ CHẾ            ← dài nhất        │             │
│         │  ─────────────────────────────────────  │             │
│         │  1. Bước một dựng giả thuyết [§2.1]     │ ← locator   │
│         │  2. Bước hai mô tả thí nghiệm [§4.1]    │   là chip   │
│         │  3. ...                                 │   bấm được  │
│         │                                         │             │
│         │  6. TINH TÚY          ← quan trọng nhất │             │
│         │  ─────────────────────────────────────  │             │
│         │  ┌─────────────────────────────────────┐│ ← thẻ riêng │
│         │  │ 6.1 Cố định ranh giới thời gian... ││   cho mỗi   │
│         │  │ ▸ Không hiển nhiên vì: ...         ││   tinh túy  │
│         │  │ ▸ Chuyển giao: ...                 ││   (tối đa 5)│
│         │  │ ▸ Tin cậy: plausible · 2 nguồn     ││             │
│         │  │ ▸ Bằng chứng: [§3.4] [§4.1]        ││             │
│         │  │ ▸ Loại: skill                      ││ ← nhãn      │
│         │  └─────────────────────────────────────┘│   skill/    │
│         │                                         │   knowledge │
│         │  7. DÈ CHỪNG                            │             │
│         │  8. LỘ TRÌNH TIẾP THU                   │             │
│         │  ─────────────────────────────────────  │             │
│         │  ☐ 1. Đọc §3 trước, 10 phút             │ ← ❺ checklist│
│         │  ☑ 2. Bỏ qua §2, đã biết                │   localStorage│
│         │                                         │             │
│         │  9. TỰ KIỂM                             │             │
│         │  ─────────────────────────────────────  │             │
│         │  ┌─────────────────────────────────────┐│ ← ❻ ẩn      │
│         │  │ Câu 1: ...            [hiện đáp án] ││   đáp án    │
│         │  └─────────────────────────────────────┘│             │
│         │                                         │             │
│         ├─────────────────────────────────────────┤             │
│         │ ┌─────────────────────────────────────┐ │             │
│         │ │ ĐỀ XUẤT SKILL                       │ │ ← ❼ hộp     │
│         │ │ walk-forward-cv-design   ưu tiên 65 │ │   riêng     │
│         │ │ DEEPEN → ml-engineer                │ │   nền khác  │
│         │ │ Vì sao lúc này: pipeline dự báo...  │ │             │
│         │ └─────────────────────────────────────┘ │             │
│         │                                         │             │
│         │  ── khái niệm ──                        │             │
│         │  [walk-forward-validation] [data-leak]  │ ← chip, bấm │
│         │                                         │   sang SCR-03│
│         └─────────────────────────────────────────┘             │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

**Không có sidebar.** Tông "tạp chí đọc sâu" ⇒ một cột, không phân tán mắt. Mục
lục nếu cần thì là nút nổi, không phải cột cố định.

## Khi có nhiều bản cùng nguồn

```
│  ┌──────────┬──────────┬──────────┐                │
│  │ bản này  │ bản Gemini│ bản Codex│  ← tab ở đầu  │
│  └──────────┴──────────┴──────────┘     KHÔNG phải │
│                                          nhiều trang│
```

→ BRD B-A3: ba bản cùng `url_normalized` = **một** bài.

## Mobile <768px

```
┌──────────────────┐
│ Grown_news    ☰  │
├──────────────────┤
│ paper · 7 phút   │
│                  │
│ TÍT BÀI          │ ← xuống cỡ, vẫn lớn nhất
│                  │
│ ┃ 60 giây        │
│ ┃ ...            │
│                  │
│ ┌──────────────┐ │
│ │ metadata     │ │ ← xếp dọc
│ │ gấp lại được │ │   mặc định gấp
│ └──────────────┘ │
│                  │
│ ⚠ cảnh báo       │ ← KHÔNG gấp
│                  │
│ 1. BỐI CẢNH      │
│ ...              │
│                  │
│ ┌──────────────┐ │
│ │ bảng ←cuộn→  │ │ ← cuộn ngang
│ └──────────────┘ │   trong ô
└──────────────────┘
```

**Luật**: thân bài **không bao giờ** cuộn ngang. Bảng và code block cuộn trong ô
của chúng.

## Ba state

**empty** — không áp dụng. Bài không tồn tại thì không có URL.

**loading** — không áp dụng. Site tĩnh, HTML có sẵn.

**error / 404**
```
┌────────────────────────────────┐
│                                │
│      Không tìm thấy bài này    │
│                                │
│   Có thể bài đang ở trạng thái │
│   draft và chưa được duyệt.    │
│                                │
│   [về trang chủ] [tra cứu]     │
│                                │
└────────────────────────────────┘
```

Câu thứ hai quan trọng: người dùng **là** người duyệt, nên "chưa approved" là
thông tin hành động được, không phải lỗi.

## Quyết định bố cục — và vì sao

| Quyết định | Vì sao |
|---|---|
| Một cột ~680px | Tông tạp chí đọc sâu. Dòng 60–75 ký tự là ngưỡng dễ đọc |
| Metadata ngay dưới sapo | `web-spec.md`: "lọc được nhiều người đọc" — biết sớm để bỏ sớm |
| Cảnh báo **trước** thân bài | Mục 7 đẩy lên đầu. Người đọc phải biết rủi ro trước khi tin |
| Mục 6 mỗi tinh túy một thẻ | Cả người lẫn agent đọc mục này; format cứng 5 dòng |
| Locator là chip bấm được | Neo địa chỉ là luật nền L2 — làm nó dùng được, không chỉ hiển thị |
| Đề xuất skill hộp riêng cuối | Không phải nội dung đọc, là hành động |
| Không sidebar | Tránh phân tán ở màn đọc sâu |
| Tab cho nhiều bản | Không thổi phồng số lượng bài |
