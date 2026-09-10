# M07_curate — spec

> Ba thứ hỏng dần mà **không ai báo**. Cả ba là *không có ai làm*, không phải
> *làm sai* — đó là lý do phải có module chứ không phải "nhớ làm định kỳ".

## 1 · Phạm vi

| | |
|---|---|
| **Sở hữu** | `07_curate/thresholds.yaml`, báo cáo nhịp |
| **Không sở hữu** | không entity nào. **Chỉ đọc** `kb/` |
| **Vào** | `kb/**/*.md` · `kb/concepts.yaml` — cả hai chỉ đọc |
| **Ra** | báo cáo tuần + tháng. **Không ghi vào `kb/`** |
| **Ghi được** | `07_curate/**` |

## 2 · Business logic

### 2.1 · Ba thứ hỏng dần

| Hỏng | Vì sao xảy ra | M07 làm gì |
|---|---|---|
| **Bài chết** | `decay_risk: high` nghĩa là nguồn sẽ lỗi thời — repo đổi API, paper bị rút, video xoá. Bản phân tích vẫn nằm đó **trông như còn đúng** | Quét quá ngưỡng ngày ⇒ xếp hàng chờ re-analyze |
| **Draft đọng** | Nạp 5 bài một tối, duyệt 2, ba bài nằm `draft` mãi. Màn *Chờ duyệt* hiện số nhưng **không ai đẩy** | Đếm quá ngưỡng ngày ⇒ nhắc |
| **Concepts phình** | Mỗi bài đề xuất vài `concepts_proposed`. Không gộp thì 22 mục thành 80 mục trùng nghĩa, **bộ lọc mất tác dụng** | Gom trùng nghĩa ⇒ **đề xuất** gộp, người chốt |

> **AC-2.1.1** · Bài `decay_risk: high` quá `decay_stale_days` xuất hiện trong báo cáo.
> `hard` · `cmd: python 07_curate/test_curate.py -k bai_chet`

> **AC-2.1.2** · Draft quá `draft_stale_days` xuất hiện trong báo cáo.
> `hard` · `cmd: python 07_curate/test_curate.py -k draft_dong`

> **AC-2.1.3** · Báo cáo trên kho **rỗng** không lỗi, in "không có gì phải làm".
> `hard` · `cmd: python 07_curate/test_curate.py -k kho_rong`
> Kho đang 0 bài — đây là đường chạy **đầu tiên** module gặp.

### 2.2 · Đề xuất, không tự sửa

`kb/` là nguồn chân lý **và** là thứ M1 đo. Module tự gộp concept hoặc tự đổi
trạng thái thì người duyệt mất quyền kiểm soát thứ đang được dùng để **chấm dự án**.

> **AC-2.2.1** · M07 không có đường ghi nào vào `kb/`, kể cả `concepts.yaml`.
> `hard` · `cmd: python 07_curate/test_curate.py -k khong_ghi`
> Quét mã tìm lời gọi ghi có đích trong `kb/`.

### 2.3 · Ngưỡng là tham số, không phải hằng số trong code

Kho hiện **0 bài**. Mọi ngưỡng đều là phỏng đoán và **sẽ sai**:

```yaml
# 07_curate/thresholds.yaml
decay_stale_days:  90
draft_stale_days:  14
concept_merge_min:  2
```

Sau khi nạp 10 nguồn thật (chặng C) sẽ có dữ liệu để chỉnh. Đặt tham số một chỗ
để lúc đó sửa **một dòng**, không phải sửa logic.

> **AC-2.3.1** · Không con số ngưỡng nào xuất hiện trong mã ngoài `thresholds.yaml`.
> `hard` · `cmd: python 07_curate/test_curate.py -k khong_hardcode`

### 2.4 · Nhịp — tuần và tháng khác nhau

| Nhịp | Nội dung | Vì sao tách |
|---|---|---|
| Tuần | draft đọng · bài chết mới phát hiện | việc phải làm ngay, danh sách ngắn |
| Tháng | đề xuất gộp concept · thống kê xu hướng | quyết định cần nhìn nhiều dữ liệu; nhắc hàng tuần thì thành nhiễu |

Nhắc quá thường thì người ta tắt thông báo — và mất luôn cả nhắc quan trọng.

> **AC-2.4.1** · Đề xuất gộp concept **không** xuất hiện trong báo cáo tuần.
> `hard` · `cmd: python 07_curate/test_curate.py -k nhip`

## 3 · Công thức

```
bài_chết   = analyses[decay_risk == "high" AND tuổi_ngày > decay_stale_days]
draft_đọng = analyses[review_status == "draft" AND tuổi_ngày > draft_stale_days]
```

`tuổi_ngày` tính từ `analyzed_at`, **không** từ mtime của file — mtime đổi khi
git checkout, `analyzed_at` là dữ kiện thật.

Gộp concept: đề xuất khi ≥ `concept_merge_min` mục trong `concepts_proposed` có
cùng chuẩn hoá (chữ thường, bỏ gạch nối, bỏ hậu tố số nhiều).

**Chuẩn hoá chỉ để gợi ý.** Quyết định gộp là của người — `rag` và `rag-pipeline`
chuẩn hoá gần nhau nhưng có thể là hai khái niệm khác.

## 4 · Điều module này CẤM

| Cấm | Vì |
|---|---|
| Ghi bất cứ gì vào `kb/` | không thuộc `kb_writers` |
| Sửa `concepts.yaml` | đề xuất, người chốt (M02-R3) |
| Đổi `review_status` | ranh giới quyền duy nhất (M02-R1) |
| Tự chạy re-analyze | **xếp hàng**; M01 chạy, người bấm |
| Hardcode ngưỡng | §2.3 |

## 5 · Trạng thái

✅ **as-built** — s8, 2026-08-19.

| Phần | File |
|---|---|
| Quét + báo cáo | `07_curate/curate.py` |
| Ngưỡng | `07_curate/thresholds.yaml` — **3 số, chưa kiểm chứng** |
| Test | `07_curate/test_curate.py` — 6 nhóm AC |

Ngưỡng vẫn là **phỏng đoán**. AC5 khẳng định không con số nào lọt vào mã, nên
chỉnh sau chặng C là sửa một dòng.

**Ghi chú thẳng**: tôi đã đề xuất hoãn module này (ghi nợ có điều kiện) vì kho
rỗng thì ngưỡng sẽ đoán sai. Người dùng chọn làm luôn. Cách giảm giá của việc
đoán sớm là §2.3 — tham số một chỗ, sửa một dòng.
