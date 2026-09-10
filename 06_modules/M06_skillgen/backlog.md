# M06_skillgen — backlog

> Ô `[ ]` **chết ở gate**. Ô trỏ artifact FROZEN chỉ tick bằng **FR id**.

## Mở

- [ ] **`§2.5` khai *"Đang ĐỎ"*, thực tế XANH.**
  `test_sample_coverage.py` exit 0 (đo 2026-09-03). `§5` nói nợ đã trả (FR-006)
  trong khi `§2.5` cách 40 dòng vẫn nói đang đỏ ⇒ **spec kể hai trạng thái cho
  cùng một AC**. Y hệt hình dạng `M04 §2.3` vs `§5`: nợ trả ở `§5`, mục gốc không
  ai sửa. Hai module cùng bệnh ⇒ đây là chỗ **thiếu một cổng**, không phải hai lỗi
  riêng lẻ.
  · object: `06_modules/M06_skillgen/spec.md §2.5` ⇒ **FR id** (spec FROZEN)

- [ ] **Ba con số phiên bản sample, không cái nào đúng hiện tại.**
  `§2.5` đọc `analyses.sample.v2.json` · `§5` khai *"lên v3"* · đĩa có
  **v1…v5**. Con số thứ năm cùng lớp *tự khai* trong năm module liền
  (M01 · M02 · M04 · M05 · M06).
  · object: `06_modules/M06_skillgen/spec.md §2.5 §5` ⇒ **FR id**

- [ ] **Cổng cứng của `verdict.py` dựa vào SCHEMA để fail-closed, và điều đó
  không viết ở đâu.**
  `verdict.py:51` không có mặc định cho `credibility`; thứ duy nhất ngăn nó nhận
  `None` là `required` của `skill_candidates[]` (`frontmatter.schema.json:177-180`).
  Hôm nay **an toàn** — fail-open không tới được. Nhưng nới `required` bên schema
  sẽ mở một fail-open ở `verdict.py`, và **không cổng nào nối hai chuyện lại**.
  Đối lập với `verdict.py:52`, nơi `independent_sources` có mặc định `1` ⇒ tự
  fail-closed không cần schema. **Hai trường của một điều kiện, hai cơ chế bảo vệ
  khác nhau.**
  · object: `06_skillgen/verdict.py:51-55` · `core/assets/frontmatter.schema.json:177-180`

- [ ] **`AC-2.2.2` là AC duy nhất mà tác giả và bị-chấm là MỘT.**
  Nó chống *"chính module này phình vai"*. Luật gốc áp trực tiếp, và cách duy nhất
  giữ nó không hỏng là `06_skillgen/test_draft_shape.py` **nằm ngoài
  `phạm_vi_ghi`** của mọi đơn vị việc sinh nháp. Chưa khai ở đâu ngoài
  `workflow.md`.
  · object: `06_modules/M06_skillgen/workflow.md` · mọi task file tương lai của M06

- [ ] **Bảy AC/công thức không đủ để viết MỘT kết quả mong đợi.**
  `AC-2.1.1 edge 4` (`independent_sources` vắng — hành vi **đúng** mà spec không
  nói) · `AC-2.1.2 edge` (alias trùng tên chính của capability khác) ·
  `AC-2.1.2 edge 2` (hoa/thường) · `AC-2.2.1 edge 3` (ký tự lạ trong
  `draft_trigger` đi vào `name`) · `AC-2.2.2 edge 3` (ranh giới *"thân"* vs
  *"mục Khi nào dùng"*) · `AC-2.3.1 edge` (`edited` — **đã từng** được duyệt) ·
  `§3 edge` (`cost = 0` ⇒ **chia cho 0**, và không AC nào nói cổng nào chặn).
  · object: `06_modules/M06_skillgen/testcases.md` ⇒ **FR id**

- [ ] **`AC-2.2.1` không phủ ca con-trỏ-ngược TRỎ HỤT.**
  Nháp mang con trỏ về `<slug>.md` kèm số dòng. Bản đó re-analyze thành
  `<slug>.v1.md` (M02 `§2.5`) ⇒ nháp thành thứ **không truy được về nguồn**, tức
  mất đúng giá trị duy nhất mà `§2.2` nói máy làm tốt. Không AC nào phủ.
  · object: `06_skillgen/draft.py` · `06_modules/M06_skillgen/spec.md §2.2`

## Đã đóng

*(chưa có)*
