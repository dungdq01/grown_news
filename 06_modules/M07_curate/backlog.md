# M07_curate — backlog

> Ô `[ ]` **chết ở gate**. Ô trỏ artifact FROZEN chỉ tick bằng **FR id**.

## Mở

- [ ] **`§2.3` và `§5` khai *"kho hiện 0 bài"*, thực tế 3.**
  Cả hai chỗ dùng con số đó làm **lý do** cho một quyết định (*"mọi ngưỡng đều là
  phỏng đoán"*). Lý do vẫn đúng ở 3 bài; con số thì không.
  ⚠️ Đây là lần thứ **sáu** cùng một lớp lỗi trong sáu module liền — M01 (ba số
  test) · M02 (*"0 bài"*) · M04 (*"31 bước"*, thực 71) · M05 (*"Bốn việc"*, bảng
  5 hàng) · M06 (ba số phiên bản sample) · M07. **Sáu lần ở sáu chỗ độc lập
  không phải sáu lỗi — là một cổng còn thiếu.**
  ⇒ **Đề xuất cần chủ dự án duyệt**: một cổng đếm-số-trong-artifact, dạng tối
  thiểu là *"mỗi con số trong `spec.md §5` phải dẫn xuất được từ một lệnh"*. Nếu
  không cài, sáu ô này sẽ mở lại lần thứ bảy ở module sau.
  · object: `06_modules/M07_curate/spec.md §2.3 §5` ⇒ **FR id** (spec FROZEN)

- [ ] **`AC-2.1.2` bỏ trạng thái `edited` — và M06 bỏ đúng trạng thái đó.**
  `§3` viết `review_status == "draft"`. Luồng M02 `§2.2` có `edited → approved`,
  nên bản `edited` là việc **chưa xong** mà **không ai nhắc** ⇒ đọng mãi.
  M06 `AC-2.3.1` có cùng khoảng trống (bản `edited` sinh nháp hay không).
  **Hai module tiêu thụ một trạng thái của M02, cả hai bỏ quên nó** — nên chủ
  của vấn đề là **M02 §2.2**, không phải M07.
  · object: `06_modules/M07_curate/spec.md §3` · `06_modules/M06_skillgen/spec.md §2.3`
  · `06_modules/M02_kb/spec.md §2.2` ⇒ **FR id**

- [ ] **`AC-2.1.3` gộp hai trạng thái rất khác nhau vào một câu.**
  *"Không có gì phải làm"* nói cả *"kho rỗng"* lẫn *"kho ổn"*. Với kho 3 bài,
  người đọc báo cáo **không phân biệt được** module đang chạy đúng hay đang
  không thấy kho. Cùng lớp với bài học *"danh mục kết 'đang tải…' — phải NÓI RA
  khi tải thất bại"* (commit `0035fa3`).
  · object: `07_curate/curate.py` · `06_modules/M07_curate/spec.md §2.1` ⇒ **FR id**

- [ ] **Sáu AC/công thức không đủ để viết MỘT kết quả mong đợi.**
  `AC-2.1.1 edge 3` (`analyzed_at` **vắng**: bỏ qua mãi mãi, hay báo mỗi tuần?) ·
  `AC-2.1.1 edge 4` (`analyzed_at` **tương lai** ⇒ tuổi âm ⇒ **im lặng vĩnh
  viễn**) · `AC-2.1.2 edge 3` (50 bài đọng ⇒ ngưỡng cắt báo cáo, và không cắt là
  đúng thứ `§2.4` sợ) · `AC-2.3.1 edge 2` (`thresholds.yaml` thiếu khoá — một
  `.get(k, 90)` **là** cái `AC-2.3.1` cấm) · `AC-2.3.1 edge 3` (ngưỡng khai dạng
  chuỗi) · `§3 edge 2` (luật *"bỏ hậu tố số nhiều"* gom `bias` với `bia`).
  · object: `06_modules/M07_curate/testcases.md` ⇒ **FR id**

- [ ] **Báo cáo tuần và tháng có thể trùng nội dung, spec không nói.**
  `2026-W36.md` và `2026-09.md` cùng tồn tại và cùng phủ một khoảng ngày ⇒ một
  bài chết xuất hiện ở **cả hai**. `§2.4` tách theo **nội dung** (draft/chết vs
  gộp/xu hướng), không nói về trùng — và *"nhắc quá thường thì người ta tắt thông
  báo"* là đúng thứ nó đang tránh.
  · object: `07_curate/reports/` · `06_modules/M07_curate/spec.md §2.4`

## Đã đóng

*(chưa có)*
