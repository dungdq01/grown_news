# T05-2 — thông báo trả lại phải nói được cách sửa

phạm_vi_ghi:
  - 05_intake/**
verifiability: hard
tiêu_chí:
  - AC1: mỗi lỗi trả lại có dòng SỬA kèm hành động cụ thể
    cmd: python 05_intake/test_gate.py -k co_cach_sua

phụ_thuộc: T05-1

## Format bắt buộc

```
THIẾU: id, slug, credibility_max
SAI:   citations_sampled = 0, cần >= 2 (origin: external)
SỬA:   mở 2 link bất kỳ trong bài, xác nhận trích dẫn khớp, rồi điền
       citations_sampled và citations_verified
```

## Vì sao là task riêng

Trả lại mà chỉ ghi *"không hợp lệ"* thì người phải đoán — và đoán sai thì thả lại
file vẫn trượt, lần thứ ba thì bỏ luôn đường M05 và dán thẳng vào `kb/` bằng tay.

Cổng chặn phải kèm **cách qua cổng**, cùng nguyên tắc với `validate.py`.
