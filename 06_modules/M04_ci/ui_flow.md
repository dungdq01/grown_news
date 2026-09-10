# M04_ci — ui flow

**Không có màn.** Giao diện duy nhất là GitHub check status trên PR.

| Nhìn ở đâu | Thấy gì |
|---|---|
| PR page | ✅ / ❌ mỗi bước |
| Actions tab | log nguyên văn |
| Nhịp ⑤ vòng lặp | reviewer đọc log này làm evidence |

Ghi trống có chủ ý.

## Một điểm về evidence

R2 đòi *kết quả máy xanh*, và người chấm ở nhịp ⑤ đọc **log**, không đọc lời khai
"đã chạy rồi". Đó là lý do CI phải chạy ở chỗ agent không sửa được output.
