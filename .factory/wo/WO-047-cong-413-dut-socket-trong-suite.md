# WO-047 — cổng 413 nhận `ngat` thay vì mã, CHỈ khi chạy trong suite đầy đủ

- **mở**: 2026-09-04 · **loại**: bug (cổng, không phải sản phẩm) · **module**: M03_web
- **mức**: chặn `npm test` exit 0 — **ĐÃ ĐÓNG 2026-09-04** — tức chặn cả `R2` (*"không máy xanh thì chưa xong"*)

## Repro

```bash
cd web && node test/dinh-dang-mo.test.js     # XANH — chạy 3/3 lần
cd web && npm test                            # ĐỎ ở đúng một vế
```

Vế đỏ:

```
FAIL khai vượt trần 1024 MB ⇒ 413 (được ngat)
```

`ngat` là nhánh `rq.on("error")` của cổng — client nhận socket bị đứt thay vì
một mã HTTP.

## Đã đo, để không ai đi tìm lại

| phép thử | kết quả |
|---|---|
| chạy riêng, 3 lần | XANH 3/3 |
| chạy sau `bay-man` (test ngay trước nó trong suite) | XANH |
| chạy sau `thu-vien` + `media-cua-so` + `hai-ban-shape` + `bay-man` | XANH |
| trong `npm test` đầy đủ (vị trí **55/91**), 2 lần | **ĐỎ 2/2** |

⇒ Không phải logic của cổng, cũng không phải hai test kề nó. Nó là hàm của
**việc đã chạy 54 test trước đó** — nghi vấn đầu tiên: cạn tài nguyên (thư mục
tạm, socket, tiến trình server chưa đóng hẳn) tích lại.

## KHÔNG phải do đổi trần — nói rõ vì dễ quy sai chủ

Cùng vế này đã ĐỎ với thông điệp `khai vượt 25 MB ⇒ 413 (được ngat)` **trước**
khi `FR-054 §9` nới trần (đo cùng ngày, hai lần, rồi tự xanh lại ở lần chạy
sau). Tức flake có **trước** phép nới trần; phép nới chỉ đổi con số in ra.

Nhưng có một điều khác đi và phải ghi: trước đó nó **thỉnh thoảng** đỏ, nay
**2/2**. Chưa đủ mẫu để nói phép nới làm nó tệ hơn, và cũng chưa loại được điều
đó — `content-length: 1073741825` là một con số client khai mà không bao giờ
gửi đủ, nên cửa sổ đua giữa `413` bay ra và `req.destroy()` có thể rộng hơn.

## Nghi vấn có địa chỉ

`web/api/articles.mjs#napHienVat` cắt socket ở `res.on("finish")`:

```js
res.on("finish", () => req.destroy())
json(res, 413, { loi: ... })
```

Chú thích ngay đó đã ghi bài học cũ: *"`req.destroy()` gọi liền sau `json()`
giết socket trước khi 413 kịp bay đi"*. `res.on("finish")` là bản sửa. Giả
thuyết: dưới tải, `finish` bắn **trước khi kernel đẩy hết** response ra dây, nên
client vẫn thấy đứt.

## Kỳ vọng

`npm test` exit 0 **và** cổng vẫn đỏ được khi ai đó bỏ phép chặn trần ở cửa
header — vế đó là cả lý do nó tồn tại, nên đừng "sửa" bằng cách nới điều kiện
thành `413 || ngat`: nhận `ngat` là nhận đúng cái triệu chứng đang phải chữa.

## Chưa làm

Chưa chẩn xong ⇒ chưa mở task. Việc tiếp: bật `--trace-warnings`, đếm handle
còn mở sau 54 test, và thử `res.end()` + `setTimeout(destroy)` thay
`res.on("finish")`.


---

## ĐÃ ĐÓNG 2026-09-04 — nguyên nhân là RST, không phải thời điểm

Giả thuyết ở trên (*"`finish` bắn trước khi kernel đẩy hết"*) **đúng một nửa**.
Nửa còn lại quan trọng hơn: `req.destroy()` gửi **RST**, và RST làm phía nhận
**BỎ LUÔN** byte còn trong bộ đệm — kể cả byte của một response đã ghi xong.
Nên dời thời điểm bao nhiêu cũng không đủ; phải đổi **cách đóng**.

Sửa: `req.socket?.end()` — gửi **FIN**, nửa ghi đóng có trật tự, byte đã xếp
hàng vẫn tới đích. Thêm `req.resume()` để tiêu phần body còn tới mà không đệm
(không có nó thì Node giữ chunk trong bộ nhớ cho một request ta đã từ chối).

Mục đích cũ vẫn đạt: client không upload tiếp vô hạn — mà không đánh đổi bằng
chính câu trả lời.

**Đo:** `npm test` exit 0, **3/3 lần** · 2899 vế xanh. Trước sửa: xanh khi chạy
riêng, đỏ 2/2 trong suite đầy đủ.

· object: `web/api/articles.mjs#napHienVat`
