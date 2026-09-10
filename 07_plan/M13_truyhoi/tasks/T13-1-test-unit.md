# T13-1 — đơn vị TEST M13: 20 cổng + 6 bề mặt rule + hai cổng đối chiếu

> **Ngữ cảnh + harness cho dev: `07_plan/M13_truyhoi/BAN-GIAO-DEV.md`** — đọc nó
> TRƯỚC khi gõ dòng đầu (7 file phải đọc · 8 lệnh cổng + số baseline · 5 bẫy đã đo ·
> 12 điều KHÔNG được làm · 6 ca DỪNG).
> Bối cảnh chung plan M13 (s7 2026-09-07, sửa 2026-09-09): spec đã áp FR-072/073
> (T13-0) · service RIÊNG :8791 · ADR-08 · chỉ mục = DẪN XUẤT.
> Khuôn T12-8/T12-15 — TEST đi ĐẦU, đỏ-đúng-lý-do trước mã (rule.md mục 8).
> Đóng trạng thái CHỜ của check_rule_surfaces cho M13-R1..R6.
> 20 cổng = 16 của spec (15 + check_nghe_loopback, T13-4 AC2 — bản 09-09 đếm sót)
> + check_ai_goi_vao (AC-1.6) + check_chunk_hien_vat
> (AC-2.5/2.6) + check_doi_chieu_chuan_hoa (fixture chung M12/M13) +
> **check_hop_dong_v3** (cổng T1 của FR-072).
> `truyhoi/tests/golden.yaml` (7 ca Việt + 4 ca Trung, expect ĐỊA CHỈ) viết ở
> đây — T13-6 chỉ làm nó xanh (R1: file test thuộc đơn vị test).
> ⚠️ **DỰNG CẢ 20 CỔNG TRONG MỘT LƯỢT.** `check_rule_surfaces` xếp một rule là CHỜ
> khi thư mục cha của `lệnh` chưa có, nhưng **ĐỎ** khi thư mục đã có mà file thì
> không. Hôm nay 6 rule M13 đều CHỜ *chỉ vì* `truyhoi/tests/` chưa tồn tại ⇒ file
> ĐẦU TIÊN tạo ở đó lật 5 rule còn lại sang đỏ cùng lúc. Nhỏ giọt từng file là tự
> tạo một cửa sổ đỏ oan giữa hai commit.
> SONG SONG với nhánh Space (checklist §4): mọi cổng chạy trên kho TẠM (`KB_DIR`),
> service giả bind cổng **8895–8899**; `8787` là server thật của chủ dự án và
> `8791` là cổng thật của M13 — test không đụng hai cổng đó. Space KHÔNG đặt
> cổng R4 vào `truyhoi/tests/` (R4 sống ở `core/tests/check_khong_ro_cheo_space.py`).

phạm_vi_ghi:
  - truyhoi/tests/**

phụ_thuộc: T13-0

verifiability: hard
tiêu_chí:
  - AC1: 20 cổng theo cmd của spec chạy được ngay, đỏ nói đúng "chưa có mã";
      thiếu gói thì exit 3 (khuôn _nap.py của chungcat/tests)
    cmd: python truyhoi/tests/check_dung_lai_duoc.py
  - AC2: check_rule_surfaces hết CHỜ cho M13-R1..R6
    cmd: python core/tests/check_rule_surfaces.py
  - AC3: cổng đối chiếu chuan_hoa_tim (M13) vs chuan_hoa (M12) trên fixture
      chung (phần giao đ→d + Hán) đỏ được trên fixture cố-tình-lệch ở thư mục tạm
    cmd: python truyhoi/tests/check_doi_chieu_chuan_hoa.py
  - AC4: check_ai_goi_vao đỏ được trên ba ca (ngoài goi_duoc · aud sai · thiếu
      khoá) với một server giả trả 2xx — chứng minh cổng ĐỎ ĐƯỢC trước khi có api.py
    cmd: python truyhoi/tests/check_ai_goi_vao.py
  - AC5: check_hop_dong_v3 (cổng T1 của FR-072) đối chiếu HAI CHIỀU tập trường
      `ket_qua[]` giữa `05_uiux/contracts/truyhoi.sample.v3.json` và
      `06_modules/M13_truyhoi/model_flow.md §2`: một trường có ở sample mà thiếu ở
      model_flow ⇒ đỏ, và ngược lại. Đỏ được chứng minh trên fixture thư mục tạm
      (bỏ một trường ở MỘT phía), không sửa file thật
    cmd: python truyhoi/tests/check_hop_dong_v3.py
