---
id: src_xgb2026aio
slug: xgboost-taylor-bac-hai
source_type: docs
url: https://aivietnam.edu.vn/
protocol_version: "2.0"
analyzed_at: "2026-08-29"
title: "XGBoost hơn Gradient Boosting ở chỗ dùng đạo hàm bậc HAI — và đó là toàn bộ câu chuyện"
one_liner: "Điểm khác duy nhất đáng nhớ giữa XGBoost và GB truyền thống là khai triển Taylor bậc hai, mọi thứ còn lại là hệ quả"
credibility_max: plausible
conformance: B
origin: external
citations_sampled: 3
citations_verified: 3
category: [ml]
concepts: []
concepts_proposed:
  - taylor-bac-hai-trong-boosting
  - hessian-lam-do-cong
  - dieu-chuan-trong-ham-muc-tieu
word_count: 980
---

## 1. Overview

Tài liệu dạy XGBoost theo lối "step-by-step", nhưng thứ đáng giữ lại không phải
danh sách tính năng — mà là **một khác biệt toán học duy nhất** sinh ra mọi ưu
thế còn lại: XGBoost xấp xỉ hàm mất mát bằng **khai triển Taylor bậc hai**, trong
khi Gradient Boosting truyền thống chỉ dùng bậc nhất.

## 2. Bối cảnh

Deep learning thống trị ảnh và ngôn ngữ, nhưng trên **dữ liệu bảng** thì không.
Tài liệu dẫn công trình của Léo Grinsztajn: trên 45 bộ dữ liệu cỡ trung (~10.000
mẫu mỗi bộ, hơn 20.000 giờ tối ưu siêu tham số), các mô hình cây Boosting vẫn
vượt MLP, ResNet và Transformer — và giữ độ ổn định ngay cả khi dữ liệu có đặc
trưng dư thừa hoặc cấu trúc bất lợi cho mạng sâu [§I].

Đó là lý do một tài liệu năm 2026 vẫn dạy một thuật toán ra đời 2016: nó chưa bị
thay thế ở chỗ nó mạnh.

## 3. Nội dung

### 3.1 Đầu vào

Tập huấn luyện `D = {(xᵢ, yᵢ)}`, một hàm mất mát `l` bất kỳ khả vi hai lần, và
bốn siêu tham số: `η` (hệ số học), `λ` (phạt độ lớn trọng số lá), `γ` (phạt số
lá), `max_depth`.

### 3.2 Process

XGBoost huấn luyện **cộng dồn**: `F_M(x) = F₀(x) + Σ η·f_t(x)` với `0 < η ≤ 1`
[§II.6.1]. Tại mỗi vòng `t`, thay vì tối ưu hàm mất mát thật, nó **xấp xỉ hàm đó
bằng một parabol** quanh dự đoán cũ:

```
L(t) ≈ Σ [ l(yᵢ, ŷᵢ^(t-1)) + gᵢ·f_t(xᵢ) + ½·hᵢ·f_t(xᵢ)² ] + Ω(f_t)
```

với `gᵢ` là gradient (đạo hàm bậc nhất) và `hᵢ` là hessian (bậc hai) [§II.6.1].

Đây là **chỗ toàn bộ khác biệt nằm**. GB truyền thống chỉ có `gᵢ` — nó biết
*hướng* đi xuống nhưng không biết hàm *cong* bao nhiêu, nên bước nhảy có thể vượt
qua cực tiểu nếu hàm cong gắt. XGBoost có thêm `hᵢ` nên ước lượng được cả độ
cong, và chọn được bước dừng hợp lý hơn [§II.4].

Tài liệu ví: GB như xuống dốc chỉ nhìn độ dốc trước mắt; XGBoost vừa nhìn dốc vừa
ước lượng độ cong [§II.4].

Hệ quả trực tiếp là hai công thức đóng — trọng số lá tối ưu và điểm lợi khi tách
nhánh — đều rút ra được **dạng đóng**, không phải dò tìm:

```
w*ⱼ = − Gⱼ / (Hⱼ + λ)
Gain = ½·( G²_L/(H_L+λ) + G²_R/(H_R+λ) − (G_L+G_R)²/(H_L+H_R+λ) ) − γ
```

với `Gⱼ = Σ gᵢ`, `Hⱼ = Σ hᵢ` trong lá `j` [§II.5].

Thành phần điều chuẩn `Ω(f) = γT + ½λ·Σwⱼ²` nằm **trong chính hàm mục tiêu**,
không phải một bước cắt tỉa hậu kỳ [§II.3]. Vì nó ở trong hàm mục tiêu nên `λ`
xuất hiện ngay dưới mẫu của cả `w*ⱼ` lẫn `Gain` — điều chuẩn tham gia vào *quyết
định tách nhánh*, không chỉ vào kết quả cuối.

### 3.3 Output

Một tổ hợp cộng dồn các cây nông. Tài liệu chạy hai ví dụ tay có thể kiểm lại:

**Hồi quy** (MSE, `λ=1`, `γ=0`, 6 điểm): `F₀ = 2.0`, gradient
`g = [2, 1, 0.5, −0.5, −1, −2]`, `hᵢ = 1`. Thử 5 ngưỡng tách, gain lần lượt
`1.3333 · 2.4000 · 3.0625 · 2.4000 · 1.3333` → ngưỡng **2.5** thắng, cho
`w*_L = −0.875` [§II.7.1].

**Phân loại nhị phân** (logistic, `η=0.5`, `λ=1`, `max_depth=1`): `pᵢ = 0.5` nên
`gᵢ = pᵢ − yᵢ = ±0.5` và `hᵢ = pᵢ(1−pᵢ) = 0.25`. Gain:
`0.1556 · 0.5833 · 1.2857 · 0.5833 · 0.1556` → cũng ngưỡng **2.5** [§II.7.2].

Phần thực hành dùng UCI Heart Disease (~303 bệnh nhân), rút gọn còn `age → chol`
trên 6 bệnh nhân [§III.1].

### 3.4 Tinh túy

#### 3.4.1 Hessian biến "hướng" thành "hướng + độ cong"

- **Không hiển nhiên vì:** danh sách tính năng XGBoost (song song hoá, xử lý dữ
  liệu thưa, cắt tỉa, subsample) khiến người đọc tưởng ưu thế đến từ kỹ thuật hệ
  thống. Thực ra chúng là tối ưu *tốc độ*; thứ đổi *chất lượng* là đạo hàm bậc hai.
- **Chuyển giao:** bất kỳ bài toán tối ưu lặp nào — nếu đang chỉ dùng gradient và
  bước nhảy hay vượt đích, hỏi xem hessian có rẻ để tính không.
- **Tin cậy:** tài liệu chỉ *khẳng định* hội tụ nhanh hơn, không đo. Con số duy
  nhất có là Hình 4 (Acc 0.91/0.90/0.92) — quá sát để kết luận.
- **Bằng chứng:** [§II.4]
- **Loại:** knowledge

#### 3.4.2 Điều chuẩn đặt TRONG hàm mục tiêu thì nó tham gia quyết định tách nhánh

- **Không hiển nhiên vì:** phần lớn tài liệu giới thiệu regularization như một
  bước chống quá khớp *sau khi* dựng cây. Ở đây `λ` và `γ` nằm ngay trong công
  thức `Gain`, nên chúng ảnh hưởng *cây được dựng ra sao*, không chỉ cây bị tỉa
  thế nào.
- **Chuyển giao:** khi thêm ràng buộc vào một mô hình, hỏi "ràng buộc này tham
  gia vào quyết định, hay chỉ dọn dẹp sau?" — hai chỗ đặt cho hai hành vi khác nhau.
- **Tin cậy:** đọc thẳng từ công thức, kiểm được bằng đại số.
- **Bằng chứng:** [§II.3]
- **Loại:** knowledge

## 4. Ý nghĩa thực tế

Dùng để **đọc log XGBoost**: khi `Gain` của mọi ngưỡng đều âm, cây dừng — và
nhìn công thức thì biết ngay `γ` đang quá lớn, chứ không phải dữ liệu hết tín
hiệu [§II.5]. Ví dụ ở §II.7.1 cho thấy với `γ=0` thì gain cao nhất là 3.0625;
đặt `γ = 3.1` là cây không tách nhánh nào cả.

## 5. Rủi ro và tầm nhìn

Tài liệu là giáo trình, không phải nghiên cứu: nó **không tái lập** con số của
Grinsztajn, chỉ dẫn lại [§I]. Hình 4 so ba thuật toán trên *một* bộ dữ liệu tổng
hợp 2 đặc trưng — chênh lệch 0.90 → 0.92 không đủ để kết luận gì.

Hai chỗ tài liệu bỏ trống: **khi nào hessian không đáng tin** (hàm mất mát không
lồi, `hᵢ` có thể âm), và **chi phí** của việc tính bậc hai trên dữ liệu lớn.
Muốn dùng thật thì phải đọc bản gốc Chen & Guestrin 2016 [§V].