# T06-2 — chấm verdict theo 5 cổng đúng thứ tự

phạm_vi_ghi:
  - 06_skillgen/**
verifiability: hard
tiêu_chí:
  - AC1: cổng cứng thắng mọi cổng khác
    cmd: python 06_skillgen/test_verdict.py -k cong_cung
  - AC2: khớp capability qua alias, không chỉ tên chính
    cmd: python 06_skillgen/test_verdict.py -k alias
  - AC3: chỉ đọc bản approved
    cmd: python 06_skillgen/test_verdict.py -k chi_approved
  - AC4: mọi capability trong manifest có $why
    cmd: python 06_skillgen/test_manifest.py

phụ_thuộc: T06-1

## Thứ tự cổng LÀ luật, không phải chi tiết cài đặt

```
1 CỔNG CỨNG  credibility claimed|conflicted VÀ independent_sources==1 ⇒ OUT_OF_SCOPE
2 ngoài domain                                                        ⇒ OUT_OF_SCOPE
3 khớp capability (kể cả alias) và depth >= 4                         ⇒ OVERLAP
4 khớp capability và depth <= 3                                       ⇒ DEEPEN
5 không khớp, thuộc domain                                            ⇒ NEW
```

`M06-R1`: chạy cổng 2 trước cổng 1 cho ra `NEW` cho ứng viên **schema đã cấm**.

Lỗi này đã fire **một lần thật** — lúc tôi kiểm thuật toán bằng tay ở s6. Nó
không tạo lỗi kiểu, nó tạo kết quả *trông hợp lệ*.

## AC2 có lý do cụ thể

Lượt kiểm đầu bỏ sót `context-truncation-strategy` ≈ `context-management` vì khớp
đúng tên. 23 capability nay đều có `aliases` — test phải dùng một cặp alias thật.

## Rule áp vào

`M06-R1` (S3, AC1) · `M06-R3` (S3, AC3) · `M06-R5` không hạ ngưỡng (S2).
