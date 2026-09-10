# M07_curate — ui flow

**Không có màn.** Ra là file markdown trong `07_curate/reports/`.

| Thao tác | Lệnh | Ra |
|---|---|---|
| Báo cáo tuần | `python -m curate week` | `reports/2026-W34.md` |
| Báo cáo tháng | `python -m curate month` | `reports/2026-08.md` |
| Xem ngưỡng | `cat 07_curate/thresholds.yaml` | 3 số |

Chọn file markdown thay vì giao diện: báo cáo cần **đọc rồi hành động**, và hành
động xảy ra trong editor (duyệt bài) hoặc terminal (re-analyze) — không phải trên
web.

## Kho rỗng thì báo cáo nói gì

Kho đang 0 bài. Đây là đường chạy **đầu tiên** module gặp, nên nó phải đúng:

```
# Tuần 34 · 2026

Không có gì phải làm.

kho: 0 bài · 0 draft · 0 bài decay_risk high
```

**Không** để trống, **không** lỗi chia cho 0. Báo cáo rỗng vẫn phải nói rõ *đã
quét và không có gì* — khác hẳn với *chưa quét*.
