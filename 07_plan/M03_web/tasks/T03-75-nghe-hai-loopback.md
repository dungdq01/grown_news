# T03-75 — WO-033: nghe cả `127.0.0.1` và `::1` (đơn vị CODE)

> ⛔ T03-74 phải ĐỎ trước.

> `server.listen(CONG, "127.0.0.1")` thêm một listener thứ hai trên `::1`. Cả
> hai đều là **loopback**, nên ràng buộc *"không mở ra mạng"* giữ nguyên — đây
> KHÔNG phải nới sang `0.0.0.0`.

> `api-guard` cấm chuỗi `0.0.0.0` và cấm `listen(` trong `web/api/**`; bản vá
> này nằm ở `server.mjs` và không dùng `0.0.0.0`, nên hai răng đó giữ nguyên.

phạm_vi_ghi:
  - web/server.mjs

verifiability: hard
tiêu_chí:
  - AC1: cổng T03-74 XANH — cả hai loopback nghe, không địa chỉ ngoài
    cmd: cd web && node test/nghe-hai-loopback.test.js
  - AC2: không cổng nào khác đỏ thêm
    cmd: cd web && npm test