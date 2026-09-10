# T01-50 — HAI RĂNG cho check_map: owner-tồn-tại + status-không-nói-dối

> Đề nghị của dev M12 sau audit map 2026-09-08 (9 chỗ lệch mà check_map xanh
> 18/18 — cổng chỉ đo tên thư mục): status/gaps/entities.owner không cổng nào
> đọc nên "lệch bao lâu cũng im". PM đã vá 9/9 trong v31; đơn vị này mọc răng
> để lớp lệch không quay lại. ID rule 9: max 49 (dev lấy 49 song song — cổng ký tự vô hình) ⇒ 50.

## Hai vế

- (a) MỌI `entities.*.owner` phải là module CÓ trong `modules:` — NGOẠI LỆ
  tường minh: entity mang trường `giu_cho: <FR-id>` (khuôn BaiHoc/M19_baihoc
  — map đã có khối giải thích "chưa qua s2/s3 là ĐÚNG khi nó đỏ lúc thi công");
  răng phải ĐỌC marker đó, không hardcode tên M19. BaiHoc thêm trường
  `giu_cho: FR-048` cùng lượt.
- (b) module có MÃ THẬT trên đĩa (be trỏ thư mục chứa src/*.py hoặc web/**
  có *.mjs) mà `status:` vắng hoặc `planned` ⇒ ĐỎ kèm câu "map nói planned,
  đĩa nói as-built — sửa MAP" (một chiều: map chạy theo đĩa, không ngược).

phạm_vi_ghi:
  - core/tests/check_map.py        # +2 vế
  - project_map.yaml               # BaiHoc +giu_cho (một trường, cùng lượt)

verifiability: hard
tiêu_chí:
  - AC1: vế (a) đỏ trên fixture owner-ma (module bịa), XANH trên BaiHoc nhờ
      giu_cho — cả hai chiều đo ở thư mục tạm
    cmd: python core/tests/check_map.py
  - AC2: vế (b) đỏ trên fixture module-có-src-mà-planned; xanh trên map thật
      hiện tại (v31 đã sạch)
    cmd: python core/tests/check_map.py
  - AC3: 18 vế cũ giữ nguyên xanh
    cmd: python core/tests/check_map.py
