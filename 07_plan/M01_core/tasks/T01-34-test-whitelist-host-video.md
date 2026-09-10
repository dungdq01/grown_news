# T01-34 — WO-019: cổng cho whitelist host video (đơn vị TEST)

> `core/tests/check_host_video.py` (MỚI). ĐỎ trước (R5) — hôm nay bảng chỉ có
> `youtube` + `tiktok`, người dùng kể bốn nơi phát.
>
> **§1 · Đủ bốn nơi phát người dùng kể**: youtube · tiktok · fb · douyin.
>
> **§2 · M09-R3 kiểm được bằng CẤU TRÚC, không bằng lời hứa.** `src` iframe
> = `nhung` (hằng trong bảng khai) + `id` (đã qua `id_mau`). Vậy phải chứng minh
> **không id hợp lệ nào thoát ra khỏi vị trí của nó**: `id_mau` phải neo hai đầu
> (`^…$`) và tập ký tự nó nhận không được chứa `/ ? # & % : . @ \` hay khoảng
> trắng. Thiếu neo thì `[0-9]{6,24}` khớp phần giữa của một chuỗi bất kỳ.
>
> Đo bằng cách **sinh chuỗi tấn công** rồi thử `id_mau` — không đọc regex bằng
> mắt. Một regex đọc-bằng-mắt là một lời khai.
>
> **§3 · `nhung` trỏ vào host nhúng đã khai, https, và KẾT THÚC ở chỗ id được
> ghép vào.** Một `nhung` gõ sai host là iframe trỏ ra ngoài whitelist — đúng thứ
> M09-R3 sinh ra để chặn.
>
> **§4 · Vòng thật: url chia sẻ → `id_tu` → `id_mau` → `nhung`+id.** Mỗi host một
> url mẫu. `id_tu` phải có ĐÚNG MỘT nhóm bắt, và thứ nó bắt phải qua `id_mau` —
> hai regex không đối chiếu nhau là hai công thức cho một sự thật.
>
> **§5 · Ca âm:** url của host A không được cho ra id dưới luật của host B.

phạm_vi_ghi:
  - core/tests/check_host_video.py

verifiability: hard
tiêu_chí:
  - AC1: cổng ĐỎ trên bảng hiện tại, nói ra thiếu host nào
    cmd: PYTHONIOENCODING=utf-8 python core/tests/check_host_video.py; test $? -ne 0
  - AC2: sau T01-35 XANH
    cmd: PYTHONIOENCODING=utf-8 python core/tests/check_host_video.py
