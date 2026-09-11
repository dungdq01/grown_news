# SCR-27 · TÌM TOÀN VĂN — nâng ô "Tìm bài, khái niệm, nguồn…" thành truy hồi (T03-125 · bước 1)

> **Trạng thái: CHỜ NGƯỜI DUYỆT TRỌN FLOW — chưa một dòng mã nào của bước 2 (T03-125 AC0).**
> Nộp 2026-09-11 (dev M13). Duyệt bằng một dòng ghi vào đây (khuôn SCR-26: *"ĐÃ DUYỆT — chủ dự án, <ngày>"*);
> đổi flow SAU duyệt = mở lại bước 1, không vá giữa code.
> ID: **SCR-27** — task T03-125 đã sửa từ SCR-22 (2026-09-10, `SCR-22-nhip-sinh.md` là của team M12).
> Dữ liệu thật để dựng: `GET /api/tim?q=…` (T08-35, đã merge main) → `POST truyhoi/truy-hoi` (T13-4) — đo 2026-09-11:
> `/api/tim` trên `:8787` trả 502 vì service `:8791` chưa chạy (vận hành), kho thật 16 bản ghi index 16/16.
> Luật: `rule.md` 15 — toàn bộ logic ở `web/plugins/timkiem/`, `multiwindow.inline.ts` chỉ nhận MỘT dòng móc.

## 0 · Sáu bài học M12 thành luật của màn này (T03-125)

| # | luật | thể hiện ở đâu trong bản này |
|---|---|---|
| 1 | wireframe TRỌN FLOW một lượt, người duyệt xong mới code | §1–§5 vẽ đủ 4 trạng thái + phím + 50 kết quả |
| 2 | HÀNH VI SAU HÀNH ĐỘNG đặc tả ngay | §3 bảng "gõ → gì · bấm → gì · 0 kết quả → gì · lỗi → gì" |
| 3 | BYTE đo trước: JS màn tìm đi CHUNK riêng | §6 `gn-tim.js` nạp khi focus, 0 byte trên trang chủ trước focus |
| 4 | markup sinh trong JS phải có vế cổng CSS | §6 mọi class `tim-*` khai trong `prototype.css` + test markup-matches-css |
| 5 | nút/nhãn TỰ GIẢI THÍCH qua `chu-giao-dien` | §4 bảng chữ |
| 6 | trạng thái đủ bộ NGAY đợt đầu: rỗng · đang tìm · lỗi service · 0-kết-quả (+ tín hiệu) | §2 |

## 1 · Hình dạng — panel trượt dưới ô tìm, không rời trang

```
┌─ header ──────────────────────────────────────────────────────────────────────┐
│  [🔍 Tìm bài, khái niệm, nguồn…            ]   ← ô SẴN CÓ (#q), không thêm ô  │
└───────────────────────────────────────────────────────────────────────────────┘
      ╲ gõ ≥2 ký tự, debounce 250 ms ⇒ panel trượt xuống (max-height 60vh, cuộn trong)
┌─ panel #tim-panel ─────────────────────────────────────────────────────────────┐
│  [bài viết ✓] [tài liệu ✓] [video ✓]   ·   [chủ đề ▾]     12 bản ghi trong phạm vi │  ← chips = pham_vi.pl / .cat
│───────────────────────────────────────────────────────────────────────────────│
│ ▸ Ruflo — bộ khung vận hành › 5. Rủi ro và tầm nhìn              [bài viết]   │
│   …khi harness gánh **trí nhớ** vượt phiên, **rủi ro** lớn nhất là…            │  ← highlight TỰ TÔ từ vị trí khớp (không snippet FTS)
│   repo/ruflo-bo-khung-van-hanh-cho-agent.md:170-181                           │  ← dia_chi (chữ mono, mờ)
│───────────────────────────────────────────────────────────────────────────────│
│ ▸ Thiên đường chuột › transcript                                    [video]    │
│   …lời tiên tri không nằm ở số lượng chuột…                          t=03:15   │  ← chunk cue: neo mốc thời gian
│───────────────────────────────────────────────────────────────────────────────│
│   … (tới 50 dòng, cuộn trong panel; dòng đang chọn có viền trái đậm)          │
│───────────────────────────────────────────────────────────────────────────────│
│  ↑↓ chọn · Enter mở · Esc đóng                          hiện 20/37 · [thêm 20]  │
└───────────────────────────────────────────────────────────────────────────────┘
```

- Mỗi dòng = **ba thứ M13 trả** (ui_flow §1): đoạn (`body`, cắt hiển thị ở 2 dòng, KHÔNG cắt dữ liệu),
  địa chỉ (`dia_chi`), và **số bản ghi trong phạm vi** ở đầu panel — số này đến CÙNG lời gọi (AC-5.1),
  không gọi riêng.
- Breadcrumb = `heading_path`; badge loại = phân loại từ `file` (`kb/<loai>/`) qua `loai-nguon.json`.
- Điểm `bm25` **không hiện** (ui_flow §3).

## 2 · Bốn trạng thái — đủ bộ ngay đợt đầu

```
RỖNG (chưa gõ / <2 ký tự)      ĐANG TÌM                     0 KẾT QUẢ                          LỖI SERVICE
┌───────────────────────┐      ┌──────────────────────┐    ┌────────────────────────────┐    ┌──────────────────────────────┐
│ (panel ẩn)            │      │ ⋯ đang tìm "harness" │    │ Không có trong kho.        │    │ Dịch vụ truy hồi không trả   │
│                       │      │ (thanh mỏng chạy)    │    │ 12 bản ghi trong phạm vi   │    │ lời (502). Thử lại · Báo lỗi │
│                       │      │ giữ kết quả cũ mờ    │    │ [nới phạm vi: tất cả loại] │    │ [thử lại]                    │
└───────────────────────┘      └──────────────────────┘    └────────────────────────────┘    └──────────────────────────────┘
```

- **0 kết quả TRONG PHẠM VI ≠ 0 trên toàn kho** (sample v3 `truy_van_mau[4]`): có chip đang lọc ⇒ gợi ý
  *"nới phạm vi"*; không chip ⇒ *"Không có trong kho"*. Cả hai đều **được đếm** ở M13 (AC-7.1) — FE không
  đếm lần hai.
- Lỗi service: `/api/tim` trả 502 ⇒ câu đọc được + nút thử lại; **không** ẩn panel im lặng.

## 3 · Hành vi sau hành động — đặc tả, không để đợt sau

| hành động | hệ làm gì | gọi gì |
|---|---|---|
| gõ ký tự thứ 2 | debounce 250 ms → hiện trạng thái ĐANG TÌM → gọi | `GET /api/tim?q=&k=20&pl=…&cat=…` |
| gõ tiếp trong 250 ms | huỷ lời gọi cũ (AbortController), không xếp hàng | — |
| kết quả về | vẽ ≤ 20 dòng, chọn dòng 1, cập nhật "N bản ghi trong phạm vi" | — |
| bấm / Enter trên dòng | mở CỬA SỔ ĐỌC đúng bài rồi cuộn tới `<h2/h3 id="<anchor>">` — `id` do C3 sinh (T03-148/149, cùng luật `slugGoiY` + dedup theo bài với M13, nên `anchor` M13 trả bấm TỚI đúng heading); bản ghi không có heading (chunk anchor rỗng) ⇒ cuộn đầu thân; chunk cue ⇒ mở video, seek `t=` | móc `__GN_MW__.moCuaSo(file, {anchor, line_start, t})` — **phụ thuộc T03-149 xong trước bước 2** |
| ↑ / ↓ | đổi dòng chọn, cuộn theo | — |
| Esc | đóng panel, giữ chữ trong ô | — |
| bấm chip loại/chủ đề | đổi `pham_vi` → gọi lại NGAY (không debounce) | cùng `GET /api/tim` |
| [thêm 20] | gọi lại với `k += 20` (k là tham số người gọi — AC-5.2) | `GET /api/tim?…&k=40` |
| 0 kết quả | hiện câu tương ứng; **M13 đã đếm** — FE không bắn thêm | — |
| gõ lại ≥2 lần (câu khác) | FE gửi `x-phien` (id phiên trình duyệt) để M13 đếm gõ-lại | header qua proxy |

## 4 · Chữ trên màn — qua `chu-giao-dien`, tự giải thích

| khoá | vi |
|---|---|
| `tim.dang_tim` | Đang tìm "{q}"… |
| `tim.khong_co` | Không có trong kho. |
| `tim.khong_co_trong_pham_vi` | Không có trong {n} bản ghi đang lọc — nới phạm vi? |
| `tim.trong_pham_vi` | {n} bản ghi trong phạm vi |
| `tim.loi_service` | Dịch vụ truy hồi không trả lời. Thử lại. |
| `tim.them` | Thêm {k} kết quả |
| `tim.phim` | ↑↓ chọn · Enter mở · Esc đóng |

## 5 · Cái CỐ Ý không có

| | vì sao |
|---|---|
| ô "tìm nâng cao" / cú pháp | ui_flow §3 — cú pháp FTS5 lộ ra là hợp đồng không muốn giữ |
| điểm liên quan % | bm25 âm, đổi khi w_title đổi |
| panel ghép "câu trả lời" | web KHÔNG ghép đoạn thành câu (model_flow §3) — hỏi-đáp là cửa sổ chat M14 |
| snippet() của FTS | M13-R4; FE tự tô từ `body` |

## 6 · Byte và cổng (bước 2 — SAU khi duyệt)

- `web/plugins/timkiem/src/timkiem.inline.ts` → chunk `gn-tim.js`, **nạp khi focus** ô `#q` (khuôn `cctab`);
  trang chủ trước focus: 0 byte thêm (page-weight test giữ trần).
- `multiwindow.inline.ts`: **một dòng** — `__GN_MW__.tim = (o) => import("./gn-tim.js").then(m => m.bat(o))`;
  diff > 5 dòng ⇒ reviewer FAIL (T03-125).
- CSS: token-only trong `prototype.css`; mọi class `tim-*` sinh trong JS có luật CSS (markup-matches-css).
- Test `web/test/tim-toan-van.test.js`: AC1 có dấu/không dấu cùng kết quả (mock `/api/tim`) · AC2 bấm ⇒ cửa sổ
  mở đúng bài + cuộn (đo DOM) · AC3 đủ 4 trạng thái, 0-kết-quả không bắn tín hiệu lần hai · AC4 page-weight.

## 7 · Câu hỏi cho người duyệt

1. Panel trượt dưới ô (như trên) hay mở **cửa sổ** "Kết quả tìm" trong shell multiwindow? (Bản này chọn panel: không rời trang, Esc là xong.)
2. Chip chủ đề lấy từ `categories.yaml` (đủ dài) — hiện tối đa 6 + "▾"? 
3. `k` mặc định 20 (web khai, ui_flow §2c) — đủ hay 10?
