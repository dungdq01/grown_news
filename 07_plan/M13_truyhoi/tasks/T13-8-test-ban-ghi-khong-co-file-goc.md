# T13-8 — đơn vị TEST: indexer chịu được bản ghi KHÔNG có file gốc (422) · cổng ĐỎ thay vì CRASH (WO-099)

> **Ngữ cảnh + harness: `07_plan/M13_truyhoi/BAN-GIAO-DEV.md`** §1 · §4.
> Test đi ĐẦU, ĐỎ trước mã (`rule.md` mục 8). Tách khỏi `T13-9` vì **R1**.
> WO: `.factory/wo/WO-099-indexer-chet-o-ban-ghi-khong-co-file-goc.md`.
> ID rule 9: `ls 07_plan/M13_truyhoi/tasks` max T13-7 ⇒ 8.
>
> **Phải ĐỎ vì LUẬT, và hôm nay nó đỏ theo cách SAI**: `check_golden_du_ca` ném
> `HTTPError 422` ra ngoài ⇒ traceback, không phải kết luận. Ca A dưới đây phải
> biến nó thành ĐỎ có câu chữ. Đỏ vì traceback **không tính là đỏ đúng lý do**.
>
> ⚠️ **Fixture phải nghèo hơn kho thật, đừng giàu hơn.** 20 cổng hiện có xanh vì
> kho tạm do chính test dựng — nơi **mọi** bản ghi đều có file gốc. Kho thật:
> 16 bản ghi, **11** trả 422. Fixture của đơn vị này phải có **cả hai loại**.

## Bốn ca

| ca | gieo | phải ra |
|---|---|---|
| A | LÕI giả trả **422** cho `GET /api/xuat/<loai>/<slug>?dang=goc` (đúng thân lỗi thật: *"không có file trong kho"*) | `reindex` **không** ném; lấy `than` qua `/api/articles/<loai>/<slug>`; bản ghi đó **có chunk** trong index |
| B | LÕI giả trả **500** cho cùng cửa | ĐỎ nêu **cửa + mã + slug**, `exit 1` vì kết luận; **0** traceback |
| C | kho hỗn hợp: 3 bản ghi có file gốc, 3 trả 422 | index đủ **6/6**; `kiem_lech` không báo mồ côi; số chunk > 0 cho cả sáu |
| D | bản ghi 422 **và** `/api/articles` cũng 404 | bản ghi bị **bỏ có nêu slug** (không nuốt im lặng), các bản ghi khác vẫn index |

Ca D là vế *"không bỏ im lặng"* — quan trọng ngang ca A: một bản ghi biến mất khỏi
chỉ mục mà không ai biết là cách `AC-1.2` (lệch kho báo được) trở thành lời nói dối.

phạm_vi_ghi:
  - truyhoi/tests/check_ban_ghi_khong_file_goc.py
  - truyhoi/tests/check_golden_du_ca.py
  - truyhoi/tests/_loi_gia.py

phụ_thuộc: —

verifiability: hard
tiêu_chí:
  - AC1: bốn ca A·B·C·D chạy trên LÕI giả ở cổng 8895–8899 (KHÔNG đụng :8787);
      TRƯỚC T13-9 thì A·C·D ĐỎ, B ĐỎ vì traceback — ghi output nguyên văn vào
      worklog; SAU T13-9 cả bốn xanh và B đỏ **vì kết luận**
    cmd: python truyhoi/tests/check_ban_ghi_khong_file_goc.py
  - AC2: `check_golden_du_ca` không traceback với bất kỳ mã HTTP nào — gieo 422 ·
      500 · 404 trên LÕI giả, cả ba ra ĐỎ có câu chữ nêu cửa + mã
    cmd: python truyhoi/tests/check_golden_du_ca.py --tu-kiem
  - AC3: cổng mới tự chứng minh ĐỎ ĐƯỢC trên fixture cố-tình-hỏng (bỏ nhánh
      fallback ⇒ ca A đỏ lại)
    cmd: python truyhoi/tests/check_ban_ghi_khong_file_goc.py --tu-kiem
