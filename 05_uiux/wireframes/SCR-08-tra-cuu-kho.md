# SCR-08 · Tra cứu kho (M13) — mock đợt hai

> ⚠️ **SUPERSEDED BY prototype/dot-hai/ + ma-tran-module-man.md (2026-09-02).**
> Bản này vẽ "mỗi module một màn" — s6 (Z7) đã bác: dịch vụ không có màn riêng,
> UI ghép vào màn đã có. Giữ làm hồ sơ vì-sao-đổi. Bản thay: SCR-12..17.


> Contract: `contracts/truyhoi.sample.v1.json` · PRD U10 (nửa truy hồi) ·
> KHÁC SCR-03 (tra cứu BÀI đợt một): màn này trả về **ĐOẠN kèm địa chỉ**.

**Là gì**: hỏi trên kho, nhận danh sách đoạn (chunk theo heading) kèm địa chỉ
`file#anchor` + dòng, điểm BM25. Phạm vi truy hồi là **control HIỂN THỊ** —
người thấy mình đang tìm trên tập nào (nguyên lý NotebookLM ①).

## Bố cục

```
┌ ô truy vấn ──────────────────────────────── [Tìm] ┐
│ phạm vi (chip, bấm bỏ được):                       │
│ [phân loại: tài liệu ×] [trạng thái: approved ×]   │
├────────────────────────────────────────────────────┤
│ N kết quả — mỗi kết quả:                           │
│  heading_path (đậm 600)                            │
│  snippet có «highlight»                            │
│  file#anchor · dòng 84–121 · bm25 −7.41            │
│  → bấm = mở CỬA SỔ ĐỌC đúng anchor (multiwindow)   │
└────────────────────────────────────────────────────┘
```

## Thành phần

- **Chip phạm vi** tái dùng chip lọc màn Danh mục; bỏ chip = nới phạm vi ngay.
- **Kết quả**: snippet là PREVIEW (trần 64 token của FTS5) — bấm vào mới là
  bằng chứng đầy đủ; số dòng + anchor hiện rõ vì nó chính là "địa chỉ bấm được".
- Điểm bm25 hiện số ÂM thật — không quy đổi giả sang %.

## Ba state

| state | hiện |
|---|---|
| empty KHÔNG phạm vi | "0 kết quả trên TOÀN KHO cho «…»" + đếm kho hiện có |
| empty CÓ phạm vi | "0 kết quả trong [video]" + nút "tìm toàn kho" — bài có thể nằm phân loại khác |
| loading | skeleton 3 hàng, một nhịp |
| error | chỉ mục chưa dựng — nút "dựng lại chỉ mục" (index là dữ liệu dẫn xuất, dựng lại được) |

## Ca phải demo được (từ contract)

1. `vì sao khai triển bậc hai` → 2 kết quả xếp theo bm25.
2. `bac hai khong dau` → vẫn hit — chứng minh `chuan_hoa()` một hàm (đ→d, bỏ dấu).
3. `記憶體 最佳化` → 0 kết quả, state empty NÓI RÕ phạm vi (kho chưa có bài Trung).
4. `retry vô hạn` trong phạm vi [video] → empty-có-phạm-vi, gợi ý nới.
