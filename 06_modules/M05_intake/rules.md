# M05_intake — rules

```yaml
- id: M05-R1
  vi_phạm: "bản origin=external có review_status khác draft khi ghi vào kb/"
  bề_mặt: S3          # schema allOf + test_gates.py -k external
  why: >
    Bản không đi qua 6 pass thì không có gate nào chặn, không có spot-check nào
    tự động. Cho vào thẳng approved là mở đường vòng qua TOÀN BỘ giao thức —
    và đường vòng đó sẽ thành lối đi chính vì nó nhanh hơn.
    Đây là lý do M05 tách khỏi M01.

- id: M05-R2
  vi_phạm: "M05 tự điền một trường thiếu thay vì trả lại cho người"
  bề_mặt: S3          # test_gate.py -k tra_lai
  why: >
    id, slug, credibility, verdict đều là QUYẾT ĐỊNH, không phải phép tính.
    Tự điền là bịa có hệ thống — và bịa đi thẳng qua mọi cổng còn lại vì nó
    "hợp lệ về hình thức". Ngoại lệ duy nhất: word_count, vì nó là phép tính.

- id: M05-R3
  vi_phạm: "copy logic kiểm từ validate.py sang 05_intake/"
  bề_mặt: S2          # reviewer đọc diff
  why: >
    Hai bản kiểm sẽ lệch nhau — và lệch im lặng, vì cả hai đều "chạy được".
    M02 sửa schema thì bản copy vẫn dùng luật cũ và cho qua thứ đáng lẽ bị chặn.
    Cái làm M05 rẻ là DÙNG LẠI, không phải viết lại.

- id: M05-R4
  vi_phạm: "nhận file từ đường khác ngoài _inbox/"
  bề_mặt: S2
  why: >
    Một cửa duy nhất thì rà được. Nhiều cửa thì mỗi lần audit phải nhớ hết —
    và cửa bị quên là cửa không ai kiểm.
```

## Giới hạn khai thẳng — không giả vờ chặn

`AC-2.3.2` (*người thật đã mở link*) **không có bề mặt máy nào**. Không lệnh nào
phân biệt được người mở link thật với người gõ `citations_verified: 2`.

Đây là **giới hạn thật của module**, không phải nợ sẽ trả. Ghi ra để không ai
tưởng cổng này tự động — cùng cách `security_baseline` §6 khai về prompt injection.
