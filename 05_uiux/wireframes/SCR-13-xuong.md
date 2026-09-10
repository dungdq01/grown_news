# SCR-13 · Xưởng — [Q] việc nền (M12 + M16)

> Contract: `chungcat/artifact.sample.v2.json` (log_mau · chay_lai_tu ·
> that_bai_enum) · ma trận §2 hàng 1 · mock: `prototype/dot-hai/xuong.html`.
> Tiền lệ: GitHub Actions/Vercel (4 vùng) + Sidekiq (dead-letter).

## Bố cục

```
+ CẦN XỬ LÝ (viền brand, badge đếm — cũng là badge trên nav) +
| job dừng: lý do phân loại + nguyên văn + [mở chi tiết]     |
+ MỌI VIỆC ---------------------------------------------------+
| lọc: [tất cả][dừng][xong][đang chạy]                        |
| bảng: mã việc · loại · việc · giai đoạn (chip+thanh) · lần  |
+ CHI TIẾT (mở như cửa sổ nổi; deep-link ?job= tô hàng) ------+
| chip giai đoạn · model đã dùng (dự phòng nói rõ)            |
| timeline log theo mã việc (bền — đóng tab còn)              |
| [Chạy lại từ «giai-đoạn-hỏng»] [Chạy lại từ đầu] [Xoá]      |
```

## Luật riêng

- Giai đoạn ĐẾM ĐƯỢC (enum 6), không % — thanh 5 nấc.
- Dừng là dừng: không bao giờ hiện như đang-chạy; 3+3 lý do (chưng cất +
  artifact), mỗi lý do một hành động — bảng enum trong contract.
- Chạy lại MẶC ĐỊNH từ checkpoint (kèm FR-046): nút mang tên giai đoạn hỏng;
  từ-đầu là nút phụ + ghi chú "mỗi lần từ-đầu = toàn văn rời máy thêm lần".
- Job xong loại chưng-cất: hành động là link sang Hàng đợi duyệt.
- Log lưu DB theo mã việc — polling 3–5s khi đang chạy, chưa cần SSE.

## Ba state

| state | hiện |
|---|---|
| empty | "sạch — không việc nào chờ bạn" (Cần xử lý) · bảng trống nói việc sinh ra từ đâu |
| loading | hàng đang chạy tự cập nhật — không skeleton toàn trang |
| error | mất kết nối service: bảng cũ GIỮ (dữ liệu bền), banner nói đang mất kết nối |
