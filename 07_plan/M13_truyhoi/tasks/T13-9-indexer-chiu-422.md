# T13-9 — indexer lấy `than` qua `/api/articles` khi cửa xuất trả 422 (WO-099 vế A + B)

> **Ngữ cảnh + harness: `07_plan/M13_truyhoi/BAN-GIAO-DEV.md`** §1 · §4.
> Test đi trước ở `T13-8`. WO: `WO-099`. ID rule 9: T13-8 ⇒ 9.
>
> **Việc, hai vế:**
> 1. `truyhoi/src/indexer.py:259` — `GET /api/xuat/<loai>/<slug>?dang=goc` trả **422**
>    cho bản ghi không có file trong kho (video đăng ký bằng URL — hợp đồng ĐÚNG của
>    LÕI, `FR-075`). Bắt 422, lấy `than` qua `GET /api/articles/<loai>/<slug>` —
>    **cửa đã có, indexer đã gọi nó ở `:260`** cho metadata, và nó trả 200 cho đúng
>    những bản ghi 422. **0 cửa mới, 0 dep mới.**
> 2. `truyhoi/tests/check_golden_du_ca.py:121` — bọc lời gọi để mọi mã HTTP thành
>    **kết luận ĐỎ** (nêu cửa + mã + slug), không phải traceback.
>
> **Quy mô**: kho thật 16 bản ghi, **11** trả 422 ⇒ hôm nay indexer chết sớm và
> **2/3 kho không bao giờ được index**. 20 cổng vẫn xanh vì kho tạm giàu hơn thật.
>
> **KHÔNG sửa cửa xuất của LÕI** — 422 đúng hợp đồng, và `rule.md` 18 đóng băng
> phạm vi M01–M12. **KHÔNG đổi spec/rules M13** (FROZEN): `AC-1.3` nói *"đọc kho QUA
> API của LÕI"*, không nói cửa nào — đây là lỗi **cài đặt**, không phải hợp đồng.

phạm_vi_ghi:
  - truyhoi/src/indexer.py

phụ_thuộc: T13-8

verifiability: hard
tiêu_chí:
  - AC1: bốn ca của T13-8 xanh — 422 ⇒ fallback `/api/articles`, 500 ⇒ ĐỎ có câu
      chữ, kho hỗn hợp index đủ 6/6, bản ghi hỏng cả hai cửa bị bỏ **có nêu slug**
    cmd: python truyhoi/tests/check_ban_ghi_khong_file_goc.py
  - AC2: trên KHO THẬT sau restart — `reindex` chạy hết **16/16** bản ghi, 0 traceback;
      số chunk > 0; `kiem_lech` không báo mồ côi
    cmd: python truyhoi/tests/check_golden_du_ca.py
  - AC3: `AC-2.3` giữ nguyên — `line_end` ≤ số dòng thật của **thân được dùng**
      (thân từ `/api/articles` đếm dòng trên chính nó, không đếm trên bản `xuat`)
    cmd: python truyhoi/tests/check_dia_chi_phan_giai.py
  - AC4: 19 cổng M13 còn lại KHÔNG đỏ thêm cái nào
    cmd: python truyhoi/tests/check_dung_lai_duoc.py
