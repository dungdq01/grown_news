# M07_curate — workflow

**Dùng trình tự chuẩn** (PHÂN TÍCH → PLAN → MÔ PHỎNG → CODE) — vì mỗi đơn vị việc
của M07 là *một phép quét* hoặc *một mục trong báo cáo*, và cả hai viết được
thành đỏ trước.

Ba chỗ áp riêng — **không** phải bước mới:

**② PLAN — `phạm_vi_ghi` chỉ được có `07_curate/**`.** M07 quét thứ **M1 đang
đo**. Một đường ghi vào `kb/` ở module này không phải một bug nhỏ: nó làm người
duyệt mất quyền kiểm soát thứ đang dùng để **chấm dự án** — luật gốc, không phải
luật tiện tay.

**③ MÔ PHỎNG — kho tạm với `analyzed_at` ĐẶT TAY, không dùng mtime.** `§3` chốt
tuổi tính từ `analyzed_at` chứ không từ mtime, và phép thử phân biệt hai cách cài
đặt là: `git checkout` đổi mtime mọi file ⇒ báo cáo **không** được đổi. Trên một
cây vừa clone hai cách cài đặt cho **cùng** kết quả, nên ca này là ca duy nhất
đo được lựa chọn đó.

**④ CODE — ngưỡng đọc từ `thresholds.yaml`, và THIẾU KHOÁ thì fail-closed.**
`AC-2.3.1` cấm số ngưỡng trong mã. Một `.get(key, 90)` **là** cái AC đó cấm — mặc
định trong mã chính là hardcode, chỉ đứng ở chỗ khác.

## Đo `AC-2.2.1` bằng HÀNH VI, không bằng chuỗi

Ba cách một phép quét mã nguồn nói sai:

```
đường ghi sau một BIẾN     dich = base / ten; dich.write_text()   → quét "kb/" KHÔNG thấy
literal trong CHÚ THÍCH    # không ghi vào kb/... write            → báo vi phạm OAN
đích HỢP LỆ                07_curate/reports/2026-W36.md           → chặn oan mọi lệnh ghi
```

⚠️ Ca thứ hai đã trúng phiên làm việc này **sáu lần** ở sáu cổng khác nhau. Luật
rút ra, và nó áp cho mọi cổng của mọi module: **phép đếm trên mã nguồn phải bỏ
chú thích**.

## Ngưỡng còn là PHỎNG ĐOÁN — và điều đó được khai, không bị giấu

`thresholds.yaml` viết thẳng `CHƯA kiểm chứng` cho cả ba số, kèm `# Vì sao 90/14/2`.
Đó là hình dạng đúng: một con số chưa kiểm chứng **có quyền** tồn tại, miễn là nó
tự khai như vậy.

⇒ Khi có dữ liệu thật, sửa **một dòng YAML**, không sửa logic. Và `AC-2.3.1 happy`
là phép thử của chính lời hứa đó: đổi YAML → báo cáo đổi → **0** dòng mã sửa.

## Không thuộc module này

| Việc | Đi đâu |
|---|---|
| gộp `concepts.yaml` | **NGƯỜI** (M02-R3) — M07 chỉ **đề xuất** |
| đổi `review_status` | **NGƯỜI** (M02-R1 · B-B1) |
| chạy re-analyze | **M01** — M07 *xếp hàng*, người bấm. Ranh giới: *xếp hàng* = ghi báo cáo, *chạy* = gọi hàm |
| trạng thái `edited` có phải "việc chưa xong" | **M02 §2.2** sở hữu luồng — M07 và M06 đều **tiêu thụ** nó và đều bỏ quên `edited` (`testcases.md §cuối` mục 2) |
| hiển thị báo cáo trên web | **M03** — M07 sinh `.md` |
