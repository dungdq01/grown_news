# [Space] T04-90 — đơn vị TEST: `check_scope` — cổng bắt HAI TASK TRANH MỘT FILE

> Checklist song song §0.1 (2026-09-09): `check_g6b` chỉ đo *ID trùng* và
> *trong boundary* — KHÔNG đo hai task khác nhánh khai cùng một path trong
> `phạm_vi_ghi`. Đây là cổng DUY NHẤT bảo vệ chế độ hai-PM-song-song, và nó
> đang vắng ⇒ vế `<scope-check>` của CLAUDE.md "không tồn tại và không ai báo".
> CHẶN CỨNG: cả hai nhánh phải có cổng này TRƯỚC khi gõ mã tuần 1.
> ID theo rule 13 (dải PM-Space): T04-90.

## Hai điểm PM-M13 nêu (2026-09-09) — đã nhận, và một chỗ chẩn khác

1. **"Cổng ngoài CI là cổng không răng" (M04-R1)** — ĐÚNG, nhận: đăng ký vào
   `.github/workflows/ci.yml` (đường CI THẬT của dự án: mỗi cổng một `run:`,
   không qua Makefile — đo `ci.yml:163,174`) + `Makefile` + một test gọi
   subprocess trong `core/tests/test_gates.py` để pytest cũng phủ.
2. **Chuẩn hoá path trước khi so** — ĐÚNG và nặng hơn ước lượng: đo được
   **330** dòng `phạm_vi_ghi` mang chú thích cùng dòng. `check_scope` phải
   `split("#",1)[0].strip()` + đổi `\` sang `/` + bỏ `/` thừa cuối trước khi so.
3. *Chẩn nguyên nhân khác một chỗ*: `check_g6b` **đã** bỏ chú thích rồi
   (`s.split("#",1)[0]`, `check_g6b.py:292` — kèm cả lời giải thích vì sao).
   T04-90 bị tố §5 vì lý do khác: nó khai thêm `Makefile` nên mất tư cách
   *"phạm vi CHỈ gồm file cổng"*; g6b nhận diện đơn vị test bằng **phạm vi**
   hoặc **tên**. Đã gỡ bằng cách đổi tên file task sang `T04-90-test-…`
   (khuôn `T12-8-test-cong-m12`), giữ nguyên quyền khai ci.yml + Makefile.

## Hình dạng

- Quét mọi `07_plan/**/tasks/*.md` **đang mở** (chưa có dòng đóng/AS-BUILT),
  đọc `phạm_vi_ghi`, dựng map path → [task].
- ĐỎ khi một path xuất hiện ở ≥2 task **mà không có quan hệ `phụ_thuộc:`**
  giữa chúng (task B khai `phụ_thuộc: T0X-YY` ⇒ hợp lệ, vì chúng tuần tự).
- Thông điệp phải nêu **cặp task + path**, không nêu chung chung.
- Bỏ qua path kết thúc `/**` trùng nhau ở cùng module (boundary, không phải file).

## Đo lúc viết (checklist §5) — cổng phải tái hiện được

Hai cặp tranh đã đo tay, cổng chạy lần đầu phải BÁO ĐÚNG chúng (hoặc báo
"không còn tranh" nếu task đã khai `phụ_thuộc`):
`core/src/source_distiller/validate.py` (**T01-51** ↔ Space **T01-91**) ·
`web/api/dungchung.mjs` (**T08-35** ↔ Space **T08-90**).
*(ID cập nhật 2026-09-10: dải PM-Space chốt ở rule 13 nên T01-53→T01-91,
T08-39→T08-90; checklist overview viết trước khi có dải.)*
Cả hai cặp ĐÃ khai `phụ_thuộc:` tường minh ⇒ cổng phải nói "ok (có
phụ_thuộc)", KHÔNG đỏ — đó chính là vế chống-đỏ-oan của AC2.

phạm_vi_ghi:
  - core/tests/check_scope.py        # MỚI (~40 dòng) — sản phẩm chính
  - .github/workflows/ci.yml         # đăng ký để cổng CÓ RĂNG (M04-R1) — CI gọi trực tiếp từng cổng
  - Makefile                         # bản người-chạy-tay của cùng danh sách
  - core/tests/test_gates.py         # một test subprocess để pytest cũng phủ

verifiability: hard
tiêu_chí:
  - AC1: chạy trên plan hiện tại ⇒ liệt đúng cặp task + path đang tranh; 0 cặp
      tranh thì exit 0 im lặng
    cmd: python core/tests/check_scope.py
    đỏ_khi: hai task mở khai cùng path mà không có phụ_thuộc
    xanh_khi: mọi path chỉ một chủ, hoặc có phụ_thuộc tường minh
  - AC2: fixture thư mục tạm — hai task giả tranh một file ⇒ ĐỎ; thêm
      `phụ_thuộc:` vào một task ⇒ XANH (chứng minh cổng đỏ được VÀ không đỏ oan)
    cmd: python core/tests/check_scope.py
  - AC3: CHUẨN HOÁ trước khi so — bỏ chú thích sau `#`, đổi `\` sang `/`,
      bỏ `/` thừa cuối; fixture có đủ ba biến thể của CÙNG một path phải được
      coi là MỘT (330 dòng phạm_vi_ghi thật đang mang chú thích cùng dòng)
    cmd: python core/tests/check_scope.py
    đỏ_khi: hai biến thể viết khác nhau của cùng path bị coi là hai path khác
    xanh_khi: gộp đúng, và vẫn bắt được cặp tranh thật
  - AC4: cổng CÓ RĂNG — có mặt trong `ci.yml` (một `run:`) và trong
      `test_gates.py` (test subprocess), không chỉ trong Makefile
    cmd: python core/tests/check_ci_teeth.py && python -m pytest core/tests -q
    đỏ_khi: cổng chỉ nằm ở Makefile (M04-R1: cổng ngoài CI là cổng không răng)
    xanh_khi: CI gọi được và pytest gọi được
