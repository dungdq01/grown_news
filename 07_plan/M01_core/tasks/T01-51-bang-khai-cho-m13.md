# T01-51 — Ba bảng khai M13 cần mà đất M01 giữ: dai-han.json · dia-chi.json `file-anchor` · dich-vu.json `goi_duoc`

> **Ngữ cảnh + harness cho dev: `07_plan/M13_truyhoi/BAN-GIAO-DEV.md`** — đọc nó
> TRƯỚC khi gõ dòng đầu (7 file phải đọc · 8 lệnh cổng + số baseline · 5 bẫy đã đo ·
> 12 điều KHÔNG được làm · 6 ca DỪNG).
> Plan M13 (s7 2026-09-07, sửa 2026-09-09). Tách khỏi T13-0 cũ vì cả ba file
> nằm trong `core/**` — boundary M01; một task M13 ghi vào đó là ghi ngoài
> `phạm_vi_ghi` (R1), đúng lớp lỗi v15 của project_map. Chạy SONG SONG T13-0.
> ID rule 9: `ls 07_plan/M01_core/tasks` max 50 ⇒ 51.
>
> 1. `core/assets/dai-han.json` — NGUỒN SỰ THẬT duy nhất cho "chữ Hán là gì":
>    các dải CJK (hôm nay `chungcat/src/dinh_tuyen.py:24-33` `_DAI_HAN` gõ cứng
>    bốn dải, ghi chú "tạm, chuyển sang bảng khai khi M13 dựng") + `$vi_sao`.
>    M13 `chuan_hoa_tim` đọc để chèn space; M12 đọc lại để đếm tỉ lệ định tuyến.
>    Là bảng khai B-A5 hai THỢ cùng đọc ⇒ đi FR. **`FR-077` ĐÃ MỞ 2026-09-09**
>    (`.factory/fr/FR-077-dai-han-bang-khai.md` — **chờ chủ dự án duyệt**): nó khai
>    sẵn hình dạng file (§1.1), lý lẽ chủ là **M01 chứ không phải M13** (§1.2), năm
>    cổng H1–H5 (§2), bốn ràng buộc không được nới (§3). Task này **ÁP** FR đó,
>    không viết lại nó. Bốn dải **giữ nguyên giá trị** M12 đang chạy — dời chỗ,
>    không đổi hành vi định tuyến (đã đối chiếu từng số với `_DAI_HAN`).
>    *(FR-067 mà plan cũ trỏ là "nguon thành trường nhận diện" — số trùng, đã sửa.)*
> 2. `core/assets/dia-chi.json` thêm MỘT dòng dạng `file-anchor` theo FR-073 §1
>    (mẫu · phan_giai = luật slugGoiY · $dedup -1/-2 theo file). Cổng A1 (nhận
>    dạng, đếm vào citations_sampled) · A2 (phân giải: file tồn tại ∧ một heading
>    fold ra đúng anchor) · A4 (dedup ổn định) trong validate.py. A3 (ba bản
>    khớp) là ô C3 `M03/backlog.md:7` — không thuộc đơn vị này.
> 3. `core/assets/dich-vu.json` theo ADR-08 §Đổi thì 3: `truyhoi.goi_duoc =
>    ["web","chatbot"]` (FR-072 §1.2) · `truyhoi.can_key_model = false` (M13-R5:
>    0 lời gọi mạng) · `chungcat.goi_duoc = ["web"]` (giữ hiện trạng M12 AC-1.4,
>    FR M12 sau sẽ thêm) · `vai` của `web`: "Client DUY NHẤT của mọi dịch vụ THỢ"
>    → "wrapper — UI + chuẩn hoá output cho người".
>
> Kéo theo (báo team M12, không sửa ở đây): ô `M12/backlog.md:631` "dải Hán hai
> bản" đóng được bằng cách `dinh_tuyen` đọc `dai-han.json` — tick bằng FR-077.

phạm_vi_ghi:
  - core/assets/dai-han.json
  - core/assets/dia-chi.json
  - core/assets/dich-vu.json
  - core/src/source_distiller/validate.py
  - .factory/fr/FR-077-dai-han-bang-khai.md
# vế cổng A1/A2/A4 trong core/tests/check_dia_chi.py là đơn vị test riêng T01-52 (R1)

phụ_thuộc: T01-52
# song song với đơn vị giấy của M13 (áp FR-072/073 vào spec); FR-073 đã duyệt mở

verifiability: hard
tiêu_chí:
  - AC1: dai-han.json tồn tại, ≥4 dải, mỗi dải có $vi_sao; FR-077 đã duyệt;
      bảng khai đúng khuôn khai-một-nơi
    cmd: python core/tests/check_khai_mot_noi.py
  - AC2: `[docs/x.md#vi-sao-bac-hai]` nhận dạng được (A1); phân giải đúng khi
      heading fold ra anchor và KHÔNG tăng citations_verified khi anchor không
      thuộc heading nào (A2); hai heading trùng ⇒ -1/-2 ổn định qua hai lần (A4)
    cmd: python core/tests/check_dia_chi.py
  - AC3: dich-vu.json parse được; truyhoi có goi_duoc + can_key_model=false;
      không dịch vụ THỢ nào thiếu khoá goi_duoc; check_ba xanh
    cmd: python core/tests/check_ba.py
  - AC4: suite core xanh (validate.py đổi cách nhận dạng địa chỉ)
    cmd: python -m pytest core/tests -q
