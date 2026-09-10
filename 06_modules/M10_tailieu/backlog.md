# M10_tailieu — backlog

> Ô `[ ]` **chết ở gate**. Ô trỏ artifact FROZEN chỉ tick bằng **FR id**.

## Mở

- [ ] **Spec dùng TÊN BẢNG KHÔNG TỒN TẠI — 9 lần.**
  Spec viết bảng `documents`, và *"giữ nguyên mọi cột của `articles`"*. Bảng thật
  (`core/assets/kho.schema.sql`): `bai_viet` (:44) · `tai_lieu` (:70) ·
  `video` (:94). Không có `documents`, `articles`, `videos`.
  Tên đổi trong lúc thi công (cùng đợt `loai-nguon.json`), spec không đi theo.
  **Nặng hơn một con số lệch**: người đọc spec rồi viết `INSERT INTO documents`
  gặp lỗi **runtime**, không gặp một câu sai vô hại.
  ⚠️ `06_modules/M11_video/spec.md` có **3** lần cùng bệnh, và tệ hơn: `§2.1`
  dùng tên **cũ** (*"khác `documents`"*, *"cùng hình dạng cột với `articles`"*)
  còn `§4` dùng tên **mới** (*"không đọc/ghi bảng `bai_viet` hay `tai_lieu`"*) ⇒
  **hai hệ tên trong một file**.
  · object: `06_modules/M10_tailieu/spec.md` (9 chỗ) ·
  `06_modules/M11_video/spec.md §2.1` (3 chỗ) ⇒ **FR id** (spec FROZEN)

- [ ] **`§5` khai `⬜ chưa dựng`, nhưng module ĐÃ DỰNG.**
  Đo 2026-09-03: `check_ba_bang.py` · `man-tai-lieu.test.js` ·
  `thu-vien-nap.test.js` **cả ba xanh**; `man-hinh.json` có `tai-lieu`.
  Đây là **chiều ngược** của lỗi M04/M06 (nợ trả mà mục gốc nói còn đỏ) — ở đây
  việc đã làm mà `§5` nói chưa. **Một cổng còn thiếu, hai chiều.**
  · object: `06_modules/M10_tailieu/spec.md §5` · `06_modules/M11_video/spec.md §5`
  ⇒ **FR id**

- [ ] **`AC-2.2.2` xanh được cả khi tính năng VẮNG.**
  AC nói `media.sha256` không đổi *"và điều đó đúng vì form CÓ ô `media`"* —
  nhưng **lệnh** chỉ đo được vế đầu. Một form **không có** ô `media` (đúng trạng
  thái `#f-bai` hôm nay) vẫn cho `sha256` không đổi, vì `FM_GOC` giữ hộ.
  ⇒ **AC xanh mà tính năng vắng.** Đúng lớp lỗi `FR-051 §9`: đo sự **tồn tại**
  của một chỗ nghẽn thay vì đo có gì **đi qua** nó.
  Vế thiếu: đọc markup form của màn `/tai-lieu/` → phải có ô `media`.
  · object: `06_modules/M10_tailieu/spec.md §2.2` ⇒ **FR id**

- [ ] **`suaTuCua()` gọi `doiView("napbaiviet")` KHÔNG ĐIỀU KIỆN.**
  Sửa một **TÀI LIỆU** đưa người dùng sang màn nạp **BÀI VIẾT**. Đúng *"gộp chung
  màn"* mà chủ dự án cấm **hai lần** (*"ko gộp chung các màn và tính năng lại với
  nhau"*), và nó **nhìn thấy được**. Không AC nào phủ.
  · object: `web/plugins/.../multiwindow.inline.ts` (`suaTuCua`, ~:1884)

- [ ] **Hai ca của form nạp không có AC nào phủ.**
  `GET /api/categories` **thất bại** ⇒ form hiện danh sách rỗng như thể danh mục
  không có nhãn ⇒ người dùng ghi bài **không nhãn**. Cùng bài học commit
  `0035fa3` (*danh mục kẹt "đang tải…" — phải NÓI RA khi tải thất bại*).
  Và: danh mục **thật sự rỗng** ⇒ chặn (theo yêu cầu *"cũng gán concept và
  category như bài viết"*) sẽ làm kho mới tinh **không nạp được gì** — spec không
  nói cách thoát.
  · object: `06_modules/M10_tailieu/spec.md §2.3` ⇒ **FR id**

- [ ] **Ca biên trần 25 MB chưa chốt `>` hay `>=`.**
  `tran_byte = 26214400`. File **đúng** 26214400 byte là ca biên thật, và
  `AC-2.3.2` không nói. Cộng: file **0 byte** bị **hai** cổng cùng bắt
  (`file.size` và magic-byte) ⇒ phép thử phải nói **cổng nào** báo, không thì gỡ
  một cổng vẫn xanh.
  · object: `core/assets/media-mime.json` · `06_modules/M10_tailieu/spec.md §2.3`

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

  Hai đường ra, **cần chủ dự án chọn**:
  (a) **giữ nguyên** — chấp nhận M09/M10/M11/M18 là module **chỉ-hợp-đồng**: spec
      và AC ở đây, mã ở module khác. Thì phải **khai điều đó ra** (một trường
      `loai: hop-dong` trong map, hoặc một dòng ở `§1 Phạm vi` của mỗi spec), vì
      hôm nay nó là **im lặng** — người đọc map thấy `be` trỏ đâu đó và tưởng có mã.
  (b) **cho đường mã thật** — ví dụ `M10.fe = ['web/**/…tai-lieu…']`. Nhưng mã
      ba màn **đan vào nhau** trong cùng `multiwindow.inline.ts` và cùng
      `shell.html`, nên tách được theo file thì phải tách được theo **thư mục** —
      và nó chưa tách được. Chọn (b) là nhận một việc refactor.
  Tôi nghiêng **(a)**: nó khai đúng thứ đang xảy ra, và nó rẻ.
  · object: `project_map.yaml` (`modules.M09/M10/M11/M18.be` · `fe: None`) ·
  `07_plan/` (thiếu 4 thư mục) ⇒ **cần chủ dự án chọn**
  ⇒ Ô này **chung cho M09 · M10 · M11 · M18** — ghi đủ ở đây, ba module kia trỏ về.

## Đã đóng

*(chưa có)*
