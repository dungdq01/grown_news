# SCR-10 · Kênh (M15) — mock đợt hai

> ⚠️ **SUPERSEDED BY prototype/dot-hai/ + ma-tran-module-man.md (2026-09-02).**
> Bản này vẽ "mỗi module một màn" — s6 (Z7) đã bác: dịch vụ không có màn riêng,
> UI ghép vào màn đã có. Giữ làm hồ sơ vì-sao-đổi. Bản thay: SCR-12..17.


> Contract: `contracts/kenh.sample.v1.json` · PRD U11 · vùng BIÊN — adapter chỉ
> GỌI RA, màn này là bảng điều khiển đọc-là-chính.

**Là gì**: trạng thái adapter (Telegram sống, Discord chờ C9), bảng định danh
`chat_id ↔ account` (FR-045 — thay allowlist phẳng), và dòng sự kiện: cái gì
vào, bị chặn vì sao, đã gửi gì cho ai.

## Bố cục

```
┌ Adapter ────────────────────────────────────────────┐
│ [telegram · ĐANG POLL · offset · update cuối]       │
│ [discord · TẮT — C9 · gateway gọi RA, ≤10MiB]       │
├─ Định danh kênh ────────────────────────────────────┤
│ chat_id → account · buộc lúc nào · [+ mã mời]       │
├─ Sự kiện (dòng thời gian, mới nhất trên) ───────────┤
│ 09:40 hỏi → trả lời (phiên ph-02)                   │
│ 09:40 GỬI THÂN BÀI → audit: ai nhận · bài nào       │
│ 09:38 file sai định dạng → nêu ĐÚNG trường thiếu    │
│ 09:32 chat_id lạ → TỪ CHỐI — 0 bản ghi              │
│ 09:30 link → draft (M05-R1)                         │
└──────────────────────────────────────────────────────┘
```

## Thành phần

- **Card adapter**: trạng thái + offset + ghi chú giới hạn kênh (Telegram 50MB,
  update giữ 24h khi offline; Discord 10MiB) — số từ khảo sát, không bịa.
- **Sự kiện `gui-than-bai`**: LUÔN kèm khối audit `ai_nhan · bai · luc` — bậc 3
  mở theo FR-045 nhưng mỗi lần bắn phải có log (cổng U5). Mock render khối này
  đậm để người duyệt thấy luật.
- **Sự kiện bị chặn**: hai kiểu khác nhau rõ — `tu-choi-dinh-danh` (M8.3) vs
  `loi-dinh-dang` kèm danh sách trường thiếu (M8.4).

## Ba state

| state | hiện |
|---|---|
| empty | chưa buộc chat_id nào — hướng dẫn dùng mã mời (ma_moi FR-045) |
| loading | adapter đang bắt tay — một nhịp |
| error | poll lỗi liên tiếp — hiện lỗi nguyên văn + "update còn giữ 24h" để người biết chưa mất tin |
