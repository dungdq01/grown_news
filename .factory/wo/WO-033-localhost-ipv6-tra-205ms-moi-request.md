# WO-033 — `localhost` mất ~205 ms MỖI REQUEST vì server chỉ nghe IPv4

loại: chậm — người dùng THẤY được
module: **M03_web** (`web/server.mjs`)
mức: mọi thao tác trên web đều cõng thêm ~0,2 giây

## Người dùng nói

> *tối ưu tốc độ load page và trải nghiệm người dùng. hiện tại 1 số chỗ hơi lag
> và load hơi lâu 1 chút*

## Đo được — và nó KHÔNG phải chi phí dựng trang

Mười màn, mọi màn ~230 ms phía server, **đồng đều**, với kho chỉ **1 bản ghi**:

```
230 ms  31 KB  /            228 ms  31 KB  /tat-ca/     243 ms  31 KB  /kho/
228 ms  31 KB  /bai-viet/   227 ms  31 KB  /video/      231 ms  31 KB  /khai-niem/
```

Đồng đều ⇒ **chi phí cố định mỗi request**, không phụ thuộc dữ liệu. Và nó
trúng cả tài sản tĩnh — `/static/bg/index.json` **0 KB cũng mất 215 ms**.
Vậy không phải render.

Tách nhỏ đồng hồ mới thấy:

```
localhost:8787    dns 0   connect 207   ttfb 215 ms
127.0.0.1:8787    dns 0   connect   1   ttfb   8 ms
```

**~205 ms nằm trong bước CONNECT.**

## Nguyên nhân

`server.listen(CONG, "127.0.0.1")` — chỉ IPv4. Trên Windows, `localhost` phân
giải **`::1` (IPv6) trước**; kết nối đó bị từ chối, và client chờ rồi mới thử
lại IPv4. Khoảng chờ đó là ~205 ms, trả **mỗi lần mở kết nối mới**.

Ứng dụng thật ra nhanh: TTFB **8 ms**, FCP 112 ms, và **0 tác vụ dài** trong 9
giây đo.

## Kỳ vọng

Nghe trên **CẢ HAI** địa chỉ loopback — `127.0.0.1` **và** `::1`. Cả hai đều là
loopback, nên ràng buộc *"không mở ra mạng"* (BRD B-D3 · security_baseline §4)
**giữ nguyên**. Đây KHÔNG phải nới sang `0.0.0.0`.

## Hai giả thuyết đã bị PHÉP ĐO BÁC BỎ

**1 · "Ảnh nền quá nặng".** Trang chủ tải 1199 KB ảnh (87% trọng lượng), nên đây
là nghi phạm đầu. Nhưng công cụ `toi_uu_anh_nen.py` chạy thử chỉ giảm **10%**
(3615 → 3286 KB): gần như mọi ảnh đã dưới ngưỡng 400 KB.

**2 · "Giải mã ảnh to tốn thời gian, thu nhỏ đi sẽ nhanh".** Đo thẳng:

```
dark-5  2.1 MP  giải mã gốc 49 ms   thu nhỏ về 1440px:  71 ms
dark-6  4.4 MP  giải mã gốc 53 ms   thu nhỏ về 1440px: 138 ms
dark-7  3.7 MP  giải mã gốc 55 ms   thu nhỏ về 1440px: 121 ms
```

Giải mã gần như **phẳng theo số điểm ảnh**, và thu nhỏ lúc giải mã còn **chậm
hơn** — việc resize tốn hơn phần tiết kiệm được. Thu nhỏ ảnh là một bản vá tôi
suýt ship dựa trên trực giác, và phép đo bác bỏ nó.

## Còn lại, đã đo, chưa sửa

- Vòng đổi ảnh nền **không kiểm `prefers-reduced-motion`**: `hen_gio()` chỉ gác
  `treoChuot || document.hidden || bo.length < 2`. Người đã tắt hiệu ứng ở hệ
  điều hành vẫn nhận một lần crossfade + giải mã ~50 ms mỗi 5–7 giây. Đây là ô
  việc riêng, không gộp vào WO này.
- 19 phần tử `backdrop-filter` sống trong DOM. Chưa đo được nó tốn bao nhiêu;
  cuộn 12 khung hết 105 ms (~8,7 ms/khung, dưới ngưỡng 16,7) nên **chưa có bằng
  chứng nó là vấn đề**.