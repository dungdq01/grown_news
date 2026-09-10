# FR-006 — sample lên v3: đủ 4 verdict + ca dưới ngưỡng

mở_bởi: s8 T06-1, 2026-08-19
tới: s5 (contract G5 frozen) · chủ sở hữu drift: PM
mức: chặn T06-2, T06-3, và một AC của T03-2
trạng_thái: ĐÃ THI HÀNH

## Vấn đề

`test_sample_coverage.py` đỏ từ s6:

```
verdict  {DEEPEN: 3, OUT_OF_SCOPE: 2}   thiếu NEW, OVERLAP
priority [50, 60, 65]                   không ca nào < 25
```

Chặng B kiểm M06 **trên sample**. Thiếu một verdict nghĩa là nhánh đó **không bao
giờ chạy** trong lúc kiểm — và lỗi ở nhánh đó chỉ lộ khi gặp dữ liệu thật.

`NEW` là nhánh **chính**: năng lực chưa có ⇒ sinh nháp. Đó là lý do M06 tồn tại.

## Verdict là KẾT QUẢ, không phải nhãn dán

Ba bản ghi mới không được gán nhãn tuỳ ý — mỗi cái là kết quả thật của 5 cổng:

| id | Dữ liệu | Cổng nào fire | Verdict |
|---|---|---|---|
| `src_new001` | capability `llm-observability` **không có** trong 23 capability, thuộc domain `agent-engineering` | 5 (chưa phủ) | `NEW` |
| `src_ovl001` | capability `skill-authoring`, **depth 4** | 3 (đã phủ sâu) | `OVERLAP` |
| `src_low001` | `cost-estimation` depth 2, `priority` 4.5 | 4 (phủ nông) | `DEEPEN` nhưng **không sinh nháp** |

`skill-authoring` là capability **duy nhất** có `depth ≥ 4` trong manifest — nên nó
là ca `OVERLAP` duy nhất thuật toán cho ra được. Không bịa thêm.

`src_low001` có `credibility: claimed` nhưng `independent_sources: 2`, nên **cổng
cứng không fire** — đúng luật. Script kiểm khẳng định điều này trước khi ghi file.

## Không sửa v2 tại chỗ

`analyses.sample.v2.json` **nguyên vẹn**. Tạo `v3` mới — `check_frozen.py` xác nhận
chỉ có file MỚI, không có file ĐỔI.

## `_expected_render` tính lại BẰNG MÁY

| | v2 | v3 |
|---|---|---|
| bản ghi | 10 | **13** |
| approved | 6 | **9** |
| bài trên site | 5 | **8** |
| nổi bật | `src_wfv001`/65 | `src_wfv001`/65 — **không đổi** |

Thêm hai khoá mới cho M06: `verdict_coverage` và `below_threshold`.

Thứ tự bắt buộc khi tính: **lọc `approved` trước, gộp sau** (spec M03 §3).

## Ảnh hưởng — nơi nào trỏ v2 phải đổi

| Chỗ | Trạng thái |
|---|---|
| `test_sample_coverage.py` | ✅ sửa để bám contract **mới nhất**, không hardcode version |
| `05_uiux/README.md` | ⏳ trỏ v3 |
| `project_map.ui_frozen.contracts` | ⏳ trỏ v3 |
| `06_modules/M03_web/spec.md` AC-2.1.2 | ⏳ số 5 → 8 |
| `07_plan/M03_web/tasks/T03-2` | ⏳ số 5 → 8 |
| `FROZEN.lock` | ⏳ ký lại sau khi xong hết |

## Đổi thì

Thêm bản ghi nữa ⇒ `_expected_render` phải tính lại bằng máy, và test của M03 đọc
thẳng từ đó nên sẽ tự bắt. **Không gõ tay số nào.**
