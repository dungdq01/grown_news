# SCR-09 · Hỏi kho (M14) — mock đợt hai

> ⚠️ **SUPERSEDED BY prototype/dot-hai/ + ma-tran-module-man.md (2026-09-02).**
> Bản này vẽ "mỗi module một màn" — s6 (Z7) đã bác: dịch vụ không có màn riêng,
> UI ghép vào màn đã có. Giữ làm hồ sơ vì-sao-đổi. Bản thay: SCR-12..17.


> Contract: `contracts/chatbot.sample.v1.json` · PRD U10 · "core xong" = màn này
> chạy thật trên web (Q6). Web là CLIENT #1 — mock phải nhìn như client gọi API,
> không như tính năng mọc trong web.

**Là gì**: chat trên kho. MỌI khẳng định kèm địa chỉ bấm được; ngoài kho thì
TỪ CHỐI có phân loại. Đây là màn mang khác biệt sản phẩm — mock phải làm 3 kiểu
từ chối và gate-gắn-cờ nhìn thấy được.

## Bố cục

```
┌ chọn phiên: [dung.dang · web] [dong.nghiep-a · telegram] ┐  ← FR-045
├──────────────────────────────────────────────────────────┤
│ dòng hội thoại:                                          │
│  người: câu hỏi                                          │
│  bot:  block text + chip citation [tên-bài#anchor]       │
│        → bấm chip = mở cửa sổ đọc đúng anchor,           │
│          highlight đúng cited_text                       │
│  bot (từ chối): hộp NGHIÊNG (luật chữ 3) + badge lý do   │
├──────────────────────────────────────────────────────────┤
│ ô nhập + gợi ý 4 câu mẫu (đủ 4 ca contract)   [xem JSON] │
└──────────────────────────────────────────────────────────┘
```

## Thành phần

- **Chip citation**: tái dùng lối chip của app; hover hiện `cited_text` nguyên
  văn (trích dẫn hai tầng — NotebookLM ③: verify tốn một cử động chuột).
- **Ba kiểu từ chối** — badge màu riêng, nội dung theo enum:
  `khong-co-trong-kho` · `co-nhung-mau-thuan` (bắt buộc kèm ≥2 địa chỉ thuộc
  2 bản ghi — decisions 09-01) · `ngoai-pham-vi` (chặn TRƯỚC retrieval — hiện
  "không gọi model, không có sha256").
- **Gate gắn-cờ**: block khẳng định có `citations: []` render kiểu CẢNH BÁO
  (nghiêng + viền đứt + nhãn "thiếu nguồn — không được tính là trả lời") — đo
  được bằng markup, khác hẳn block đã xác minh.
- **[xem JSON]**: mở raw response — chứng minh hợp đồng
  `blocks[]{text,citations[]} + tu_choi` là thật, curl được không qua web (M7.4).

## Ba state

| state | hiện |
|---|---|
| empty | chưa có hội thoại — 4 câu mẫu là lối vào |
| loading | "đang truy hồi… → đang soạn…" hai bước, một nhịp |
| error | service không chạy — nêu cổng + lệnh bật, phân biệt với "từ chối" |

**Từ chối KHÔNG phải error** — hai state khác nhau về bản chất và về màu.
