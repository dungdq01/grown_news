# T03-62 — cổng chạy THẬT cả ba đường nạp trong MỘT kho (đơn vị TEST)

> `web/test/ba-duong-nap-that.test.js` (MỚI).
>
> Từng mảnh đã có cổng riêng (`luong-nap-bai` · `thu-vien-nap` · `nap-video` ·
> `man-tai-lieu` · `man-video`). Thứ **chưa ai làm**: một NGƯỜI dùng làm cả ba
> việc trong MỘT phiên, rồi đọc lại bằng chính các màn họ sẽ mở.
>
> **Vì sao vế đó khác:** mỗi cổng module gieo **chỉ loại của nó**, nên câu *"màn A
> không lẫn loại khác"* ở đó xanh một cách **rỗng** — không có gì để lẫn. Chỉ khi
> cả ba cùng nằm trong một kho thì phép lọc mới bị thử thật.
>
> Đây là chỗ canh **luật thường trực** của người dùng — *"ba module tách biệt ở
> mọi tầng; chỉ Kho và Tổng hợp được gộp"* — ở tầng **dữ liệu thật**, không ở
> markup.
>
> §6 canh WO-022 đi trọn đường: id YouTube giữ nguyên chữ hoa sau khi
> `normalize_url()` của Python chạm vào nó.
>
> **Fixture sai lượt đầu, không phải hệ thống sai:** `src_khoi1` chỉ có 5 ký tự
> sau `src_` trong khi schema đòi `^src_[a-z0-9]{6,}$`, nên cả ba đường trả 422.
> Thông báo lỗi nói đúng chỗ; tôi đã suýt báo *"ba đường nạp hỏng"* trước khi đọc
> hết nó. Lý do đã ghi ngay trong file.

phạm_vi_ghi:
  - web/test/ba-duong-nap-that.test.js
  - web/test/WORKLOG.md
  - web/package.json

verifiability: hard
tiêu_chí:
  - AC1: cổng xanh — ba POST 201, ba màn tách, kho trộn đủ
    cmd: cd web && node test/ba-duong-nap-that.test.js
  - AC2: có trong `npm test`, không cổng nào khác đỏ thêm
    cmd: cd web && npm test
