# T12-8 — đơn vị TEST: sinh đủ 17 cổng spec M12 (R1 — chỉ đơn vị này chạm tests/)

> spec M12 khai 17 lệnh cổng; G6B đòi mỗi lệnh có đơn vị SINH nó. Đơn vị này
> sở hữu toàn bộ `chungcat/tests/` + fixture; các đơn vị code KHÔNG chạm tests
> (R1). Mỗi cổng viết theo khuôn dự án: docstring VÌ SAO TỒN TẠI + ĐỎ_KHI/
> XANH_KHI, fixture ở thư mục tạm, và cổng phải ĐỎ TRƯỚC khi mã tương ứng có
> (R5) — chạy được từng cái ngay sau khi viết, đỏ vì "chưa có mã" là đúng.
> Áp bản FR-053 của `testcases.md` (2 vế: bắt-bịa ĐỎ · không-đỏ-oan XANH).

**Cổng viết SAI thì sao (chốt, theo review lượt 2):** mở lại T12-8 là ĐƯỜNG
DUY NHẤT — đơn vị code không được sửa cổng của chính AC nó thi hành (giữ luật
gốc: không ai sở hữu thước đo mình). Giá: một lần mở-lại-đơn-vị-đã-đóng; rẻ
hơn cái mất khi bên bị đo cầm bút sửa thước.

# ĐỔI CHỦ 2026-09-07 (`T12-28`, chủ dự án duyệt): năm file dưới đây —
# `check_idempotency.py` · `check_hang_doi_nguyen_tu.py` ·
# `check_hai_kieu_viec.py` · `check_checkpoint_giai_doan.py` ·
# `check_e2e_chung_cat.py` — nay do `T12-28` khai, vì `FR-071` đổi kiểu trả về
# của `vong.HangDoi.nap()` và cả năm đều gọi nó. `T12-8` KHÔNG mở lại: một
# đơn vị đã đóng mà nuốt thêm file thì `phạm_vi_ghi` của nó thành một cái giỏ,
# và `R1` mất đúng thứ địa chỉ nó cần.
# `<scope-check>` CHƯA CÀI trong dự án này ⇒ không ai báo giúp hai đơn vị cùng
# khai một file. Dòng này là phép canh duy nhất.
phạm_vi_ghi:
  - 06_modules/M12_chungcat/testcases.md   # áp FR-053 (2 vế cho AC-3.2, cách đo mới AC-5.2)
  - chungcat/tests/check_bang_khai_model.py
  - chungcat/tests/check_nhap_duyet_duoc.py      # T12-20 · nháp đủ trường để duyệt
  - chungcat/tests/check_nen_audio.py            # T12-21 · nén audio trước khi gửi cửa
  - chungcat/tests/check_cat_doan_audio.py       # T12-22 · cắt đoạn + gộp nguồn dài
  - chungcat/tests/check_worker_song_song.py     # T12-23 · N tiến trình × M luồng
  - chungcat/tests/check_worker_giet_giua_chung.py  # T12-23 AC5 · nhặt lại việc mồ côi
  - chungcat/tests/check_ke_thua_nhan.py         # T12-24 · nhãn kế thừa từ gốc
  - chungcat/tests/check_tien_do_transcript.py   # T12-19 · tiến độ transcript từng phần
  - chungcat/tests/check_checkpoint_giai_doan.py
  - chungcat/tests/check_chi_loi_goi_tu_loi.py
  - chungcat/tests/check_dia_chi_mang_ten_nguon.py
  - chungcat/tests/check_dinh_tuyen_ngon_ngu.py
  - chungcat/tests/check_du_phong_cung_khu_vuc.py
  - chungcat/tests/check_engine_cam_rut.py
  - chungcat/tests/check_hai_kieu_viec.py
  - chungcat/tests/check_hang_doi_nguyen_tu.py
  - chungcat/tests/check_idempotency.py
  - chungcat/tests/check_khong_cham_kho.py
  - chungcat/tests/check_khong_tu_duyet.py
  - chungcat/tests/check_mot_cua_egress.py
  - chungcat/tests/check_mot_hop_dong.py
  - chungcat/tests/check_nghe_loopback.py
  - chungcat/tests/check_quote_co_that.py
  - chungcat/tests/check_tran_thu_lai.py
  - chungcat/tests/fixtures/               # PDF thật + quote tay 2 vế + bảng khai hỏng

verifiability: hard
tiêu_chí:
  - AC1: đủ 17 file cổng, tên KHỚP TỪNG KÝ TỰ với cmd trong spec — so bằng máy
    cmd: python core/tests/check_g6b.py
  - AC2: mỗi cổng chạy được ngay (exit code có nghĩa), tự khai ĐỎ_KHI/XANH_KHI
      trong docstring; cổng chưa có mã đối ứng phải ĐỎ, không được skip-im-lặng
    cmd: python chungcat/tests/check_bang_khai_model.py
  - AC3: cổng quote có CẢ HAI vế — fixture bịa ⇒ ĐỎ, fixture ligature+gạch-nối
      ⇒ XANH (thiếu vế hai thì "từ chối tất cả" cũng xanh — cấm)
    cmd: python chungcat/tests/check_quote_co_that.py
  - AC4: cổng checkpoint_giai_doan dựng xong phải ĐỎ đúng lý do (việc dừng mang checkpoint; chạy lại từ giai-đoạn-hỏng không lặp giai đoạn đã xong) — đỏ vì thiếu mã,
      không phải vì lỗi cú pháp; kèm fixture tối thiểu
    cmd: python chungcat/tests/check_checkpoint_giai_doan.py
  - AC5: cổng chi_loi_goi_tu_loi dựng xong phải ĐỎ đúng lý do (M12 chỉ nhận lời gọi từ LÕI trên loopback) — đỏ vì thiếu mã,
      không phải vì lỗi cú pháp; kèm fixture tối thiểu
    cmd: python chungcat/tests/check_chi_loi_goi_tu_loi.py
  - AC6: cổng dia_chi_mang_ten_nguon dựng xong phải ĐỎ đúng lý do (bản tổng-hợp: mọi địa chỉ mang tên nguồn [slug:...]) — đỏ vì thiếu mã,
      không phải vì lỗi cú pháp; kèm fixture tối thiểu
    cmd: python chungcat/tests/check_dia_chi_mang_ten_nguon.py
  - AC7: cổng dinh_tuyen_ngon_ngu dựng xong phải ĐỎ đúng lý do (ngôn ngữ máy đếm tỉ lệ ký tự; người chọn model thắng gợi ý) — đỏ vì thiếu mã,
      không phải vì lỗi cú pháp; kèm fixture tối thiểu
    cmd: python chungcat/tests/check_dinh_tuyen_ngon_ngu.py
  - AC8: cổng du_phong_cung_khu_vuc dựng xong phải ĐỎ đúng lý do (dự phòng chỉ rơi trong cùng khu vực pháp lý) — đỏ vì thiếu mã,
      không phải vì lỗi cú pháp; kèm fixture tối thiểu
    cmd: python chungcat/tests/check_du_phong_cung_khu_vuc.py
  - AC9: cổng hai_kieu_viec dựng xong phải ĐỎ đúng lý do (một hợp đồng hai loại việc: chung-cat-mot-nguon · tong-hop-chu-de) — đỏ vì thiếu mã,
      không phải vì lỗi cú pháp; kèm fixture tối thiểu
    cmd: python chungcat/tests/check_hai_kieu_viec.py
  - AC10: cổng idempotency dựng xong phải ĐỎ đúng lý do (cùng ULID nạp hai lần ⇒ đúng một việc) — đỏ vì thiếu mã,
      không phải vì lỗi cú pháp; kèm fixture tối thiểu
    cmd: python chungcat/tests/check_idempotency.py
  - AC11: cổng khong_cham_kho dựng xong phải ĐỎ đúng lý do (M12 không mở _kho.sqlite, không ghi kb/ — chỉ qua API LÕI) — đỏ vì thiếu mã,
      không phải vì lỗi cú pháp; kèm fixture tối thiểu
    cmd: python chungcat/tests/check_khong_cham_kho.py
  - AC12: cổng khong_tu_duyet dựng xong phải ĐỎ đúng lý do (nháp ghi ra luôn ở trạng thái nháp — không đường tự duyệt) — đỏ vì thiếu mã,
      không phải vì lỗi cú pháp; kèm fixture tối thiểu
    cmd: python chungcat/tests/check_khong_tu_duyet.py
  - AC13: cổng tran_thu_lai dựng xong phải ĐỎ đúng lý do (lan_gui trần 2, không reset; log sha256 mỗi lần) — đỏ vì thiếu mã,
      không phải vì lỗi cú pháp; kèm fixture tối thiểu
    cmd: python chungcat/tests/check_tran_thu_lai.py
