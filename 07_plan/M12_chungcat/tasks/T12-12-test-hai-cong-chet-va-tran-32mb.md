# T12-12 — hai `cmd` CHẾT của spec + trần 32 MB không nằm ở đâu

> Đóng hai ô backlog M12 mở từ phép rà `FR-053`. Chủ dự án chốt 2026-09-04:
> lối **(a)** cho hai `cmd` chết (tạo file đúng tên, **không** sửa spec frozen),
> và **ok** cho trần 32 MB.
> ID theo `rule.md` mục 9: `ls 07_plan/M12_chungcat/tasks/` → max `T12-11` ⇒ 12.

## Việc 1 · Hai `cmd` chết — tạo file, KHÔNG sửa spec

`spec.md` khai `AC-4.5` → `check_chan_truoc_khi_goi.py` và `AC-4.6` →
`check_model_ngoai_bang.py`. **Cả hai file không tồn tại.** Ai chạy đúng lệnh
của spec thấy `No such file`: hai AC `hard` **không đo được bằng lệnh chúng
khai** — đúng thứ `<rule-surface-check>` bắt.

**Vì sao (a) chứ không (b):** backlog đề xuất *"FR một câu sửa 2 tên"*. Nhưng
**spec không sai** — hai AC là hợp đồng hợp lệ, thứ thiếu là cổng mang đúng tên
nó hứa. Sửa spec cho vừa mã đang có là để **bên bị đo chỉnh thước đo**, và spec
đang FROZEN nên lối đó còn tốn một FR. Lối (a) không cần FR nào.

⚠️ **Không phải phép đổi tên.** Đọc kỹ hai AC thì phép đo cũ **thiếu vế**:

| AC | spec đòi | phép đo cũ (`check_mot_hop_dong.py`) |
|---|---|---|
| 4.5 | gieo **BỐN** ca §4.0b | gieo **HAI** |
| 4.5 | **0 dòng** thêm vào `egress.jsonl` | **không đụng** log |
| 4.6 | gọi **THẲNG `:8790`** qua HTTP | gọi hàm **trong tiến trình** |

Vế `:8790` là vế nặng nhất: `do_POST` có thể quên gọi `quyet_dinh()` hoặc nuốt
exception, và phép đo cũ vẫn xanh — nó đo THƯ VIỆN, không đo CỬA.

## Việc 2 · Trần 32 MB (`AC-6.4`) không nằm ở đâu

Đo được: `grep 33554432 chungcat -r` = **0**. `egress.gui(tran=…)` là tham số
bắt buộc **không default**, và `goi_qua_adapter` truyền thẳng `None` xuống —
`len(...) > None` là `TypeError` **giữa job**, sau khi tài liệu đã đọc xong.
Tức trần 32 MB tồn tại trong spec và **không tồn tại trong máy**; cổng dùng
fixture `1024` rồi trỏ về một "bảng khai" chưa có.

Số vào `chungcat/assets/nguong.json` (**không** vào `model.json`: trần thuộc
**cửa egress**, không thuộc một model nào — mọi lời gọi ra Internet đi qua nó,
kể cả lối `tai_ve` không gọi model).

phạm_vi_ghi:
  - chungcat/tests/check_chan_truoc_khi_goi.py   # MỚI — AC-4.5
  - chungcat/tests/check_model_ngoai_bang.py     # MỚI — AC-4.6
  - chungcat/tests/check_mot_cua_egress.py       # + 4 vế đọc số trần THẬT
  - chungcat/assets/nguong.json                  # + tran_payload_byte
  - chungcat/src/bang_khai.py                    # + doc_tran_payload
  - chungcat/src/adapter/hop_dong.py             # + tran/allowlist/log
  - chungcat/src/adapter/google.py               # tran hết default None

# ⚠️ `chungcat/tests/**` là đất `T12-8` theo plan M12. Đơn vị này chạm BA file
# ở đó ⇒ `<scope-check>` sẽ thấy hai task tranh cùng thư mục. Không nới:
# `T12-8` đã ĐÓNG (19/19 cổng xanh), và ba file trên **không** nằm trong
# `phạm_vi_ghi` của nó — hai file MỚI, một file `T12-8` sở hữu.
# ⇒ Ô backlog mở kèm: `T12-8` phải khai lại `phạm_vi_ghi` hoặc đơn vị này nhận
#   `check_mot_cua_egress.py`. NGƯỜI chọn ở G6C.

verifiability: hard

tiêu_chí:
  - AC1: `cmd` của `AC-4.5` chạy được và XANH
    cmd: python chungcat/tests/check_chan_truoc_khi_goi.py
    đỏ_khi: một trong bốn ca §4.0b vẫn gọi model · `egress.jsonl` có thêm dòng ·
      ca (d) không sinh cảnh báo khu vực
    xanh_khi: bốn ca chặn · 0 lời gọi · 0 dòng log · đối chứng ghi đúng 1 dòng
  - AC2: `cmd` của `AC-4.6` chạy được và XANH, gọi THẲNG `:8790`
    cmd: python chungcat/tests/check_model_ngoai_bang.py
    đỏ_khi: model ngoài bảng trả 2xx · trả 4xx nhưng việc VẪN vào hàng đợi ·
      model hợp lệ cũng bị chặn
    xanh_khi: 4xx + hàng đợi không đổi; model trong bảng ⇒ 201
  - AC3: trần 32 MB là số CÓ KHAI, không gõ cứng, và tới được `egress.gui`
    cmd: python chungcat/tests/check_mot_cua_egress.py
    đỏ_khi: "`tran_payload_byte` vắng · số gõ trong `chungcat/src/**` ·
      `goi_qua_adapter` không có tham số `tran` · `google.goi` còn `tran=None`"
    xanh_khi: bốn vế trên đều đạt
  - AC4: 19 cổng M12 cũ VẪN xanh — không cổng nào bị sửa cho vừa mã
    cmd: python core/tests/check_g6b.py
    đỏ_khi: một cổng cũ đỏ, hoặc W5 còn báo hai AC M12 không ai sinh
    xanh_khi: hai dòng W5 của M12 biến mất

phụ_thuộc: T12-8
