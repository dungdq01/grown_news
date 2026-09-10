# M07_curate — testcases

> Mỗi AC **≥1 happy + ≥1 edge**, viết **bằng lời**. Không viết mã test — `m-test`
> ở s8 là **vai riêng**, giữ nguyên quyền FR ngược về đây (R1).
>
> **Phép thử của chính s6**: *viết không nổi testcase cho một AC ⇒ AC mơ hồ ⇒
> DỪNG, sửa AC*. Kết quả ở **§cuối**.
>
> ⚠️ Module này quét thứ **M1 đang đo** rồi báo cáo. Nên `AC-2.2.1` (không đường
> ghi nào vào `kb/`) không phải một luật tiện tay — nó là **luật gốc**: nếu M07
> tự gộp concept hay tự đổi trạng thái, người duyệt mất quyền kiểm soát thứ đang
> được dùng để **chấm dự án**.

## 2.1 · Ba thứ hỏng dần

**AC-2.1.1** — bài `decay_risk: high` quá `decay_stale_days` xuất hiện trong báo cáo
- *happy*: một bài `decay_risk: high`, `analyzed_at` 100 ngày trước, ngưỡng 90 →
  có trong báo cáo.
- *edge*: bài `decay_risk: high` **đúng 90** ngày → không có (công thức là
  `> decay_stale_days`, không `>=`). Một ca biên lệch một ngày là ca sẽ xảy ra
  **mỗi ngày** với một bài nào đó.
- *edge 2*: bài `decay_risk: low` 500 ngày → **không** có. Tuổi một mình không đủ.
- *edge 3*: `analyzed_at` **vắng** → phải chốt hành vi. Không tính tuổi được thì
  bỏ qua (bài vô hình mãi mãi), hay coi là vô cùng cũ (báo mỗi tuần)? Spec không
  nói, và cả hai đều hỏng theo cách riêng.
- *edge 4*: `analyzed_at` ở **tương lai** (đồng hồ lệch, hoặc người khai tay) →
  tuổi âm ⇒ không bao giờ vào báo cáo. Ca này im lặng.
- *edge 5*: tuổi tính từ `analyzed_at`, **KHÔNG** từ mtime → `git checkout` đổi
  mtime của mọi file mà báo cáo **không đổi**. Đây là ca chứng minh lựa chọn của
  `§3`, và nó là ca duy nhất phân biệt hai cách cài đặt cùng cho kết quả đúng
  trên một cây vừa clone.

**AC-2.1.2** — draft quá `draft_stale_days` xuất hiện trong báo cáo
- *happy*: một bản `draft` 20 ngày, ngưỡng 14 → có trong báo cáo.
- *edge*: bản `edited` 20 ngày → có, hay không? `edited` **chưa** `approved`, nên
  nó cũng là việc chưa xong. `§3` chỉ viết `review_status == "draft"` ⇒ bản
  `edited` **đọng mãi mà không ai nhắc**. Cùng khoảng trống với M06 `AC-2.3.1`.
- *edge 2*: bản `rejected` 200 ngày → không có (đã quyết xong).
- *edge 3*: **mọi** bản đều đọng (50 bài) → báo cáo phải cắt hoặc phân trang; một
  danh sách 50 dòng mỗi tuần là *"nhắc quá thường ⇒ người ta tắt thông báo"*, đúng
  thứ `§2.4` sợ. Không AC nào nói ngưỡng cắt.

**AC-2.1.3** — báo cáo trên kho **rỗng** không lỗi, in "không có gì phải làm"
- *happy*: kho 0 bài → exit 0, có dòng "không có gì phải làm".
- *edge*: kho có bài nhưng **không bài nào** quá ngưỡng → cùng thông điệp. Hai
  trạng thái rất khác nhau (*"chưa có gì"* vs *"mọi thứ đang ổn"*) mà **một** câu.
- *edge 2*: `kb/` **không tồn tại** → phải chốt: lỗi, hay coi như rỗng? Kho mới
  tinh là trạng thái hợp lệ ở dự án này.

## 2.2 · Đề xuất, không tự sửa

**AC-2.2.1** — M07 không có đường ghi nào vào `kb/`, kể cả `concepts.yaml`
- *happy*: quét `07_curate/` → 0 lời gọi ghi có đích trong `kb/`.
- *edge*: đường ghi nằm sau một **biến** (`dich = base / ten; dich.write_text()`)
  → một phép quét theo chuỗi `"kb/"` **không thấy**. Đây đúng lớp lỗi mà M12
  `AC-1.1 edge 2` đã khai cho `chungcat`, và nó áp y nguyên ở đây.
- *edge 2*: một **chú thích** trong mã chứa chuỗi `kb/...write` → phép quét báo
  vi phạm **oan**. ⚠️ Lớp lỗi này đã trúng phiên làm việc này **sáu lần**; một
  cổng đếm trên mã nguồn **phải bỏ chú thích**.
- *edge 3*: M07 ghi vào `07_curate/reports/` → **hợp lệ**, không phải `kb/`. Phép
  thử phải phân biệt được hai đích, không chặn mọi lệnh ghi.

## 2.3 · Ngưỡng là tham số

**AC-2.3.1** — không con số ngưỡng nào trong mã ngoài `thresholds.yaml`
- *happy*: đổi `decay_stale_days: 90 → 30` trong YAML → báo cáo đổi theo, **0**
  dòng mã sửa. Đây là phép thử **hành vi**, mạnh hơn phép quét số.
- *edge*: một số `90` xuất hiện trong mã ở chỗ **không liên quan** (số dòng, mã
  HTTP, chỉ số mảng) → cổng phải **không** đỏ. Một cổng cấm literal số sẽ đỏ oan
  ngay khi ai đó viết `if len(x) > 2`.
- *edge 2*: `thresholds.yaml` **vắng một khoá** → phải fail-closed (báo thiếu
  khoá), không im lặng dùng mặc định trong mã — mặc định trong mã **là** cái
  `AC-2.3.1` cấm.
- *edge 3*: `thresholds.yaml` khai `decay_stale_days: "90"` (chuỗi) → phải chốt:
  ép về số, hay báo lỗi kiểu?

## 2.4 · Nhịp tuần và tháng

**AC-2.4.1** — đề xuất gộp concept **không** xuất hiện trong báo cáo tuần
- *happy*: sinh báo cáo tuần → 0 mục gộp concept; sinh báo cáo tháng → có mục đó.
- *edge*: có `concept_merge_min` đề xuất gần nghĩa **và** đang là tuần → tuần vẫn
  0 mục. Nếu phép thử chỉ chạy trên dữ liệu **không** có đề xuất nào, nó xanh mà
  chưa đo gì.
- *edge 2*: báo cáo tháng của một tháng **không có** đề xuất nào → mục gộp
  concept vắng hay có kèm "không có"? Hai output khác nhau.
- *edge 3*: `2026-W36.md` và `2026-09.md` cùng tồn tại và cùng phủ một khoảng
  ngày → một bài chết xuất hiện ở **cả hai**. Đó có phải nhiễu mà `§2.4` sợ?
  Spec tách theo **nội dung** (draft/chết vs gộp/xu hướng), không nói về trùng.

## 3 · Công thức

- *happy* (gộp concept): `["rag", "rag-pipelines"]` chuẩn hoá (chữ thường, bỏ gạch
  nối, bỏ hậu tố số nhiều) → `ragpipeline` vs `rag` ⇒ **không** gần nhau ⇒ không
  đề xuất. Còn `["rag", "RAGs"]` → cùng `rag` ⇒ đề xuất khi đủ `concept_merge_min`.
- *edge*: `rag` và `rag-pipeline` — spec nói thẳng chúng *"chuẩn hoá gần nhau
  nhưng có thể là hai khái niệm khác"*, và quyết định là **của người**. Nên một
  đề xuất **sai** không phải bug ⇒ phép thử chỉ được đo *"có đề xuất"*, không đo
  *"đề xuất đúng"*.
- *edge 2*: chuẩn hoá bỏ hậu tố số nhiều → `bias` thành `bia`? Luật *"bỏ hậu tố
  số nhiều"* áp lên một từ kết thúc bằng `s` mà không phải số nhiều là chỗ hai
  khái niệm khác nhau bị gom. Không AC nào phủ.
- *edge 3*: `concepts_proposed` **rỗng** ở mọi bài → 0 đề xuất, không nổ.

## 4 · Điều module CẤM — mỗi dòng một phép thử

- *ghi bất cứ gì vào `kb/`*: `AC-2.2.1` (và ba edge của nó — đường sau biến, chú
  thích, đích hợp lệ).
- *sửa `concepts.yaml`*: cùng phép thử, đích cụ thể.
- *đổi `review_status`*: quét `07_curate/` → 0 câu `UPDATE`/ghi trường đó.
- *tự chạy re-analyze*: M07 **xếp hàng**; quét → 0 lời gọi tới M01. Ranh giới:
  *xếp hàng* là ghi vào báo cáo, *chạy* là gọi hàm.
- *hardcode ngưỡng*: `AC-2.3.1`.

## Kết quả PHÉP THỬ s6 — bốn phát hiện

**1 · `§2.3` và `§5` khai *"kho hiện 0 bài"*, thực tế 3.** Cả hai chỗ dùng con số
đó làm **lý do** cho một quyết định (*"mọi ngưỡng đều là phỏng đoán"*). Lý do vẫn
đúng ở 3 bài, nhưng con số là con số thứ **sáu** cùng lớp *tự khai* trong sáu
module liền (M01 · M02 · M04 · M05 · M06 · M07). Sáu lần cùng một bệnh ở sáu chỗ
độc lập ⇒ **không phải sáu lỗi, là một cổng còn thiếu**.

**2 · `AC-2.1.2` bỏ trạng thái `edited`.** `§3` viết `review_status == "draft"`.
Luồng của M02 `§2.2` có `edited → approved`, nên một bản `edited` là việc **chưa
xong** mà **không ai nhắc** — nó đọng mãi. Cùng khoảng trống với M06 `AC-2.3.1`
(bản `edited` sinh nháp hay không): **hai module, cùng một trạng thái bị bỏ
quên**, và cả hai vì cùng lý do — `edited` được thêm vào luồng của M02 mà hai
module tiêu thụ nó không cập nhật.

**3 · `AC-2.1.3` gộp hai trạng thái rất khác nhau vào một câu.** *"Không có gì
phải làm"* nói cả *"kho rỗng"* lẫn *"kho ổn"*. Với kho 3 bài, người đọc báo cáo
**không phân biệt được** module đang chạy đúng hay đang không thấy kho.

**4 · Sáu AC/công thức không đủ để viết MỘT kết quả mong đợi:**
`AC-2.1.1 edge 3` (`analyzed_at` **vắng** — bỏ qua mãi mãi, hay báo mỗi tuần?) ·
`AC-2.1.1 edge 4` (`analyzed_at` **tương lai** ⇒ tuổi âm, im lặng) ·
`AC-2.1.2 edge 3` (50 bài đọng ⇒ ngưỡng cắt báo cáo) ·
`AC-2.3.1 edge 2` (`thresholds.yaml` thiếu khoá) ·
`AC-2.3.1 edge 3` (ngưỡng khai dạng chuỗi) ·
`§3 edge 2` (bỏ hậu tố số nhiều gom `bias`/`bia`).

⇒ Cả bốn vào `backlog.md`. Mục 1, 2, 3, 4 chạm `spec.md` FROZEN ⇒ **FR id**.
