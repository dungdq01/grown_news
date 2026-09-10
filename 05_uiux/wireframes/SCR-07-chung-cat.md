# SCR-07 · Chưng cất (M12) — mock đợt hai

> ⚠️ **SUPERSEDED BY prototype/dot-hai/ + ma-tran-module-man.md (2026-09-02).**
> Bản này vẽ "mỗi module một màn" — s6 (Z7) đã bác: dịch vụ không có màn riêng,
> UI ghép vào màn đã có. Giữ làm hồ sơ vì-sao-đổi. Bản thay: SCR-12..17.


> Contract: `contracts/chungcat.sample.v1.json` · PRD U9 · vùng THỢ.
> Prototype thắng khi lệch (luật G5).

**Là gì**: người chọn nguyên liệu `thu-vien` → hệ chưng thành bản nháp 5 mục.
Màn này trả lời ba câu: *hàng đợi đang ở đâu* · *cái gì đã rời máy* · *bản nháp
trông thế nào trước khi vào `_inbox/`*.

**Vào từ**: sidebar mục THỢ · từ cửa sổ đọc một bản `thu-vien` (nút "Chưng cất").

## Bố cục

```
┌─ Nguyên liệu (trái, 1/3) ─────┬─ Hàng đợi (phải, 2/3) ───────────────┐
│ danh sách thu-vien trong kho  │ job cards theo trạng thái:           │
│ [chọn] → nút CHƯNG CẤT        │ new → processing → done | failed     │
│ chọn ≥2 → nút TỔNG HỢP        │ mỗi card: ULID · model · attempts    │
│ (FR-044, nguon >= 2)          │ · sha256 TỪNG attempt · chi phí      │
├───────────────────────────────┴──────────────────────────────────────┤
│ Xem trước bản nháp (mở khi bấm job done): 5 mục + địa chỉ [slug:p.N] │
│ + citations_sampled/verified DO MÁY — chỉ đọc · nút "→ _inbox/"      │
└──────────────────────────────────────────────────────────────────────┘
```

## Thành phần

- **Job card**: badge trạng thái (4 màu token chart-palette) · dòng attempt có
  `sha256` từng lần — vì mỗi attempt là một lần tài liệu RỜI MÁY (FR-043 bậc 4).
- **Failed card**: hiện đủ 2/2 attempts + câu "hết lượt thử, người quyết chạy
  lại" — retry cap 2 là luật, không phải nút bấm thêm.
- **Tổng hợp (FR-044)**: card mang danh sách `nguon` ≥2; bản nháp xem trước có
  địa chỉ MANG TÊN NGUỒN `[slug:p.7]`.

## Ba state

| state | hiện |
|---|---|
| empty | kho không còn `thu-vien` chưa chưng — trỏ sang màn nạp |
| loading | card `processing` với nhịp một-lần (FR-027i, không vòng lặp) |
| error | card `failed` — nêu lỗi nguyên văn + số attempt đã tốn |

## Điều mock PHẢI nói được với người xem

1. Chưng cất KHÔNG tự `approved` — đích là `_inbox/` → draft (M05-R1).
2. Mọi lần gọi model đều thấy sha256 — trả lời "tài liệu X đã rời máy chưa".
3. Chi phí hiện theo bài (~$0.02–0.17) — người thấy nó KHÔNG phải ràng buộc.
