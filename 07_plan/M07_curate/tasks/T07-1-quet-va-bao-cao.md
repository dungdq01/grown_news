# T07-1 — quét kho, báo cáo tuần và tháng

phạm_vi_ghi:
  - 07_curate/**
verifiability: hard
tiêu_chí:
  - AC1: bài decay_risk high quá ngưỡng xuất hiện trong báo cáo
    cmd: python 07_curate/test_curate.py -k bai_chet
  - AC2: draft quá ngưỡng xuất hiện trong báo cáo
    cmd: python 07_curate/test_curate.py -k draft_dong
  - AC3: kho RỖNG không lỗi, in "không có gì phải làm"
    cmd: python 07_curate/test_curate.py -k kho_rong
  - AC4: đề xuất gộp concept KHÔNG có trong báo cáo tuần
    cmd: python 07_curate/test_curate.py -k nhip
  - AC5: không con số ngưỡng nào trong mã ngoài thresholds.yaml
    cmd: python 07_curate/test_curate.py -k khong_hardcode
  - AC6: không đường ghi nào vào kb/
    cmd: python 07_curate/test_curate.py -k khong_ghi

## AC3 là đường chạy ĐẦU TIÊN, không phải ca biên

Kho đang **0 bài**. Lần chạy đầu tiên của module là trên kho rỗng.

Phải in *"đã quét và không có gì"*, khác hẳn *"chưa quét"*. Không để trống, không
chia cho 0.

## Tuổi tính từ `analyzed_at`, KHÔNG từ mtime

mtime đổi mỗi lần `git checkout`, `git clone`, copy thư mục. Dùng nó thì sau một
lần clone **mọi bài đều "mới"** — và báo cáo im lặng đúng lúc cần nhất.

## Ngưỡng đọc từ file, không hardcode

`M07-R2`. Kho 0 bài nên cả ba số hiện tại là **phỏng đoán**:
`decay_stale_days: 90` · `draft_stale_days: 14` · `concept_merge_min: 2`.

Chỉnh sau chặng C. Rải trong mã thì lúc đó phải đi tìm từng chỗ — sót một chỗ là
hai luật chạy song song.

## AC6 quan trọng hơn vẻ ngoài

`kb/` vừa là nguồn chân lý vừa là thứ **M1 đo**. Module tự sửa thì số M1 mất
nghĩa: không biết phần nào do người, phần nào do máy (`M07-R1`).
