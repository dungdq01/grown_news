# T01-38 — `check_khung` thôi canh nhãn nút chế độ (đơn vị TEST)

> **Kéo theo của WO-037.** Người dùng chốt bỏ hẳn chế độ soạn thô, nên hai nút
> `[data-soan]` — trong đó nút `8 ô` — đã gỡ khỏi cả hai `shell.html`.
> `check_khung.py:97` đòi chuỗi `>8 ô<` có mặt, nên nó ĐỎ vì một thứ không còn
> tồn tại.
>
> **Vì sao BỎ chứ không sửa số.** Phép kiểm ấy tồn tại để bắt một **bản gõ tay
> thứ hai** của số mục lá: shell viết `8 ô`, bảng khai nói 8, hai nơi trôi được.
> Gỡ nút xong thì shell **không còn nói con số đó ở đâu cả** — `dungKhung()`
> dựng ô từ bảng khai lúc chạy. Bản sao mà nó canh đã biến mất; canh tiếp là
> canh một cái bóng.
>
> **KHÔNG được rụng thêm răng nào.** `nạp khung {N} mục`, `id="f-o-muc"`, và
> phép so hai bản shell giữ nguyên — chúng canh những bản sao **vẫn còn**.
>
> Đây là việc của M01 nên nó là đơn vị riêng: WO-037 chỉ chạm `web/**`, gộp vào
> là đơn vị hai module.

phạm_vi_ghi:
  - core/tests/check_khung.py

verifiability: hard
tiêu_chí:
  - AC1: `check_khung` XANH
    cmd: python core/tests/check_khung.py
  - AC2: cổng VẪN đỏ được — bỏ chuỗi `nạp khung 5 mục` khỏi một bản shell thì đỏ
      (làm trên bản sao ở thư mục tạm, không sửa file thật)
    cmd: python core/tests/check_khung.py
