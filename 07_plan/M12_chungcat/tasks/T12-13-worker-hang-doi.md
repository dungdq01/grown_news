# T12-13 — WORKER: nối hàng đợi → model → verify → C2 (chặn C4a done)

> Audit 2026-09-04 (ô backlog "KHÔNG CÓ WORKER"): mọi mảnh đã tồn tại như thư
> viện (`vong.py` checkpoint/retry · `egress.py` · `verify.py` · adapter ·
> `POST /api/nhap-chung-cat` C2) nhưng KHÔNG dòng nào lấy job từ `new/` chạy.
> POST /job hôm nay = job `cho` vĩnh viễn. Đơn vị này là điều kiện của cả C4a
> lẫn sinh-transcript (C4b) — mọi `loai` job đều cần worker.

## Hình dạng

- `chungcat/src/worker.py`: vòng đơn — quét `new/` (mtime cũ nhất trước),
  claim bằng rename sang `cur/` (Maildir chuẩn — hai worker không tranh),
  dispatch theo `loai` (bảng loai→hàm, dẫn xuất — thêm loai mới = 1 entry),
  dùng `ghi_nhan_gui`/`chay_lai` sẵn có, xong → POST C2 (khoá + X-Nguoi-Dung
  từ job) → `done/` (giai_doan cuối). Chạy: `python -m worker --mot` (một
  job rồi thoát — cho test/cron) và `--vong` (thường trực).
- VÁ hai ô audit trong cùng đơn vị (hệ quả trực tiếp):
  (a) AC-2.1: cửa POST /job gọi `kiem_tong_hop` cho loai tong-hop + validate
      `loai`/`slug` bắt buộc — job rác không vào hàng đợi;
  (b) AC-4.4a: `la_mac_dinh` đi vào dòng egress.jsonl (adapter truyền).
- `goc_hang_doi` đọc `CHUNGCAT_HANG_DOI` (env sẵn có) — mặc định vẫn repo cho
  chạy thật, nhưng MỌI test/smoke bắt buộc đặt env này (đóng ô hàng-đợi-repo
  cho phần test; phần dịch vụ chạy thật đợi quyết đường ngoài repo).

phạm_vi_ghi:
  - chungcat/src/worker.py             # MỚI
  - chungcat/src/api.py                # validate loai/slug + kiem_tong_hop ở cửa
  - chungcat/src/adapter/google.py     # la_mac_dinh vào egress (1 dòng)
  - chungcat/src/adapter/hop_dong.py   # nếu chữ ký cần thêm trường
  - chungcat/pyproject.toml            # entry point worker (nếu khai script)

verifiability: hard
tiêu_chí:
  - AC1: job hợp lệ trong new/ → --mot chạy trọn ①→⑧ mock: cur/ trong lúc chạy,
      done/ khi xong, nháp xuất hiện qua C2 (DB web), giai_doan đúng chuỗi
    cmd: python chungcat/tests/check_worker_mot_vong.py
    đỏ_khi: job kẹt new/, hoặc done mà C2 không có nháp
    xanh_khi: chuỗi trọn + hàng DB có ban_goc_ai
  - AC2: kill giữa chừng → chạy lại từ giai đoạn hỏng (checkpoint AC-5.4 THẬT
      trên worker, không chỉ trên thư viện); lan_gui không reset
    cmd: python chungcat/tests/check_worker_giet_giua_chung.py
  - AC3: POST /job thiếu loai/slug ⇒ 422; tong-hop 1 slug ⇒ 422 (T1 chạy ở cửa)
    cmd: python chungcat/tests/check_chi_loi_goi_tu_loi.py
  - AC4: hai worker song song một hàng đợi — mỗi job đúng MỘT lần chạy (claim
      bằng rename, thua thì bỏ qua)
    cmd: python chungcat/tests/check_worker_song_song.py
  - AC5: nền không vỡ — 21+ cổng M12 xanh
    cmd: python chungcat/tests/check_e2e_chung_cat.py --mock
