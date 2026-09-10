# T06-1 — bổ sung sample lên đủ 4 verdict (FR + bump v3)

phạm_vi_ghi:
  - 05_uiux/contracts/analyses.sample.v3.json
  - .factory/fr/FR-002.md
verifiability: hard
tiêu_chí:
  - AC1: sample phủ đủ 4 verdict + ≥1 ca priority < 25
    cmd: python 06_skillgen/test_sample_coverage.py
  - AC2: file frozen cũ không bị sửa tại chỗ
    cmd: python core/tests/check_frozen.py

## Vì sao task này đi TRƯỚC mọi task khác của module

`test_sample_coverage.py` **đang đỏ**:

```
verdict  {DEEPEN: 3, OUT_OF_SCOPE: 2}   thiếu NEW, OVERLAP
priority [50, 60, 65]                   không ca nào < 25
```

`NEW` là nhánh **chính** của M06 — năng lực chưa có thì sinh nháp. Thiếu nó thì
mọi task sau kiểm được đúng một nửa module.

## Đây là FR, không phải sửa file

`analyses.sample.v2.json` là **contract G5 frozen**. Ba việc bắt buộc:

1. Mở `FR-002` ghi rõ: thêm gì, vì sao, ảnh hưởng ai
2. Tạo **`v3`**, không sửa `v2` tại chỗ
3. Cập nhật `05_uiux/README.md` + `project_map.ui_frozen.contracts` trỏ v3
4. `python core/tests/check_frozen.py --ky` — **sau** khi có FR

Chủ sở hữu drift: PM.

## Cần thêm gì

| Ca | Vì sao |
|---|---|
| 1 bản `verdict: NEW` | nhánh chính, hiện không có |
| 1 bản `verdict: OVERLAP` + `reason_rejected` | nhánh loại-có-lý-do |
| 1 ca `priority < 25` | nhánh "dưới ngưỡng, không sinh" |

**Cảnh báo**: thêm bản ghi đổi `_expected_render` (số bài, số dòng). Phải tính lại
**bằng máy**, và test của M03 đọc từ đó — T03-2 sẽ đỏ nếu quên.
