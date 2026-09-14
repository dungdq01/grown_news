# T03-158 — **HUỶ** (bản nháp của PM, không thi công)

> **Trạng thái: HUỶ — 2026-09-15, PM M13 tự bắt.** Không giao cho ai. Không có mã, không
> có cổng, không tính vào G6B.
>
> **Vì sao huỷ**: bản nháp này khai `cmd: python core/tests/check_dich_vu_cong.py` cho AC1.
> Cổng đó **không tồn tại** — đo bằng `ls core/tests/check_dich_vu_cong.py` ⇒ không có.
> Một `cmd` trỏ file vắng không bao giờ đỏ được, nên AC ấy là **xanh oan tuyệt đối**:
> dev chạy, không thấy lỗi, đánh dấu xong — trong khi chưa đo gì. Đúng lớp lỗi đã bắt ở
> `T13-0 AC2` (2026-09-09) và ở `T03-150 AC3` (2026-09-11). Lần này người viết sai AC là
> tôi, và tôi bắt được **trước khi giao**, không phải sau khi dev vấp.
>
> **Thay bằng một cặp**:
> - `T03-158-test-proto-ten-dich-vu-va-cong.md` — cổng ĐỎ trước, đặt ở `web/test/`
>   (không đặt ở `core/tests/**`: đất M01, M03 ghi vào đó là ngoài boundary)
> - `T03-160-sinh-v21-sai-dich-vu-8791.md` — mã, sửa `sinh_v21.py` rồi sinh lại HTML
>
> Nội dung việc không đổi: `05_uiux/prototype/sinh_v21.py:216` (và `app-v21.html:196`)
> ghi *"Service chatbot không chạy (cổng 8791)"*, trong khi `core/assets/dich-vu.json`
> khai **8788 = chatbot** · **8791 = truyhoi**.
>
> **Giữ file này lại chứ không xoá**: ID `T03-158` đã nằm trong dải đã cấp; xoá trắng thì
> lần sau có người cấp lại số ấy cho việc khác — đó là lần trùng ID thứ sáu. File này là
> con trỏ, không phải đơn vị việc.
