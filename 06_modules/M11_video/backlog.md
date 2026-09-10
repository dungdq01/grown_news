# M11_video — backlog

> Ô `[ ]` **chết ở gate**. Ô trỏ artifact FROZEN chỉ tick bằng **FR id**.

## Mở

- [ ] **`§2.1` TRỎ SAI FILE — luật đúng, chỗ khai sai.**
  Spec nói cổng nằm ở `frontmatter.schema.json` nhánh `ho_so: thu-vien` là
  `anyOf [media | url]`. Đo được, cổng thật là **`validate.py:398-401`**. Và
  `anyOf` **không giữ vế nào**: nó yếu hơn `allOf[5]` cho `tai-lieu`, yếu hơn
  `validate.py:398` cho `video`.
  ⇒ Ai đọc spec sẽ **tìm luật ở sai file**: sửa `anyOf` không đổi hành vi; sửa
  `validate.py:398` thì đổi, và không ai được cảnh báo.
  Cộng: cổng đó nằm **trong nhánh `ho_so: thu-vien`**, và `ho_so` **không** thuộc
  `required` gốc ⇒ một bản `video` không khai `ho_so` thì cổng **không chạy**.
  · object: `06_modules/M11_video/spec.md §2.1` ·
  `core/src/source_distiller/validate.py:398-401` ⇒ **FR id** (spec FROZEN)

- [ ] **HAI HỆ TÊN BẢNG trong một file.**
  `§2.1` dùng tên **cũ** (*"khác `documents`"*, *"cùng hình dạng cột với
  `articles`"*); `§4` dùng tên **mới** (*"không đọc/ghi bảng `bai_viet` hay
  `tai_lieu`"*). Bảng thật: `bai_viet` · `tai_lieu` · `video`.
  Ở M10 lỗi này là 9 chỗ **thuần** tên cũ; ở đây nó **trộn**, nên người đọc không
  có cách nào biết hệ nào đúng **từ chính file**.
  · object: `06_modules/M11_video/spec.md §2.1` ⇒ **FR id** (xem ô tổng ở
  `06_modules/M10_tailieu/backlog.md`)

- [ ] **`§5` khai `⬜ chưa dựng`, cả ba lệnh `hard` đều XANH.**
  `check_ba_bang.py` · `man-video.test.js` · `no-leak.test.js` xanh (2026-09-03);
  `man-hinh.json` có `video`. Cùng ô với M10 — một cổng còn thiếu, **hai chiều**
  (M04/M06 nói còn đỏ khi đã xanh; M10/M11 nói chưa dựng khi đã dựng).
  · object: `06_modules/M11_video/spec.md §5` ⇒ **FR id**

- [ ] **Whitelist host CHỈ sống ở FE — cần một vế server.**
  Đo được (plan `S23`): bản video host lạ kèm `url_normalized` đi qua
  `validate.py --strict` **sạch**. `AC-2.3.1` khai *"bị chặn ở FE"* và điều đó
  đúng — nhưng FE là **tiện lợi**, không phải cổng: ai gọi `/api/...` trực tiếp
  bỏ qua nó. Và `AC-6.3` (allowlist đích) **không** bắt, vì `youtube.com` là một
  đích trông hợp lý.
  ⇒ `/api/video` của FR-040 là chỗ luật này thuộc về.
  · object: `06_modules/M11_video/spec.md §2.3` · `web/api/` ⇒ **FR id**

- [ ] **`AC-2.2.2` cần đếm BA loại request, spec chỉ nói iframe.**
  Ngoài `iframe src`: **ảnh thumbnail** (`i.ytimg.com/...` làm nền nút play — vi
  phạm dù không có iframe) và `preconnect`/`dns-prefetch`. Spec viết *"không gọi
  ra mạng ngoài"* mà không nói **mức** nào tính.
  · object: `06_modules/M11_video/spec.md §2.2` ⇒ **FR id**

- [ ] **Bản ghi hợp lệ có thể trỏ một video ĐÃ XOÁ, và spec không nói.**
  `AC-2.3.1` kiểm host + định dạng id, **không** kiểm video tồn tại — và không
  được kiểm, vì kiểm là **gọi ra ngoài**. Nên "hợp lệ" ở đây nghĩa hẹp hơn người
  đọc tưởng: *địa chỉ đúng dạng*, không phải *video còn đó*. Cùng lớp với giới
  hạn *"`V` bảo đảm quote có trong TRANSCRIPT CỦA TA"* mà M12 đã phải khai riêng.
  · object: `06_modules/M11_video/spec.md §2.3`

- [ ] **`project_map` không cho module này ĐƯỜNG CODE nào — nên nó không sở hữu
  được task, và công việc của nó vô hình dưới tên nó.**
  Đo `project_map.yaml` v27:
  ```
  M09_thuvien   be = ['06_modules/M09_thuvien/**']   fe = None
  M10_tailieu   be = ['06_modules/M10_tailieu/**']   fe = None
  M11_video     be = ['06_modules/M11_video/**']     fe = None
  M18_nguoidung be = ['06_modules/M18_nguoidung/**'] fe = None
  ```
  **Bốn** module chỉ trỏ vào **thư mục spec của chính mình** — không đường mã nào.
  14 module còn lại đều có ít nhất một đường thật (`core/**` · `web/api/**` ·
  `chungcat/**` · `05_intake/**` …).

  **Hệ quả đo được, và nó là thứ chủ dự án vừa hỏi**: `phạm_vi_ghi` của mọi task
  lấy từ `modules.*.be/fe` (W1). Module không có đường mã ⇒ **không task nào khai
  được phạm vi thuộc nó** ⇒ **không có `07_plan/M10_tailieu/`, không có
  `07_plan/M11_video/`**. Mã của chúng sống ở `web/` (M03) và `core/` (M01), nên
  task nằm ở đó:
  ```
  07_plan/M03_web/tasks/  T03-30 … T03-51   (nạp riêng · ba màn đầy đủ · nạp video ·
                                             sửa về đúng màn · facet · ô media …)
  07_plan/M01_core/tasks/ T01-18 T01-19 T01-20 T01-21 T01-25 T01-28 T01-33
                                            (ba bảng + hai view · bảng khai màn · loại-nguồn)
  ```
  ⚠️ **`check_map` XANH** vì đường khai (`06_modules/M10_tailieu/**`) **có tồn
  tại**. Cổng kiểm *"đường khai có thật không"*, không kiểm *"module có sở hữu mã
  không"*. Nên đây là lỗ **cổng không với tới**, không phải lỗi ai quên.
  ⇒ Chi tiết đầy đủ ở `06_modules/M10_tailieu/backlog.md` (ô cùng tên).

## Đã đóng

*(chưa có)*
