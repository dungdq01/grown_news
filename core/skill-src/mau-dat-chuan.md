---
id: src_good01
slug: vi-du-dat-chuan
source_type: paper
url: https://arxiv.org/abs/2411.00002
version_id: v2
protocol_version: "2.0"
analyzed_at: "2026-08-17"
title: Ví dụ đạt chuẩn
one_liner: File mẫu minh họa đầy đủ ràng buộc của protocol 2.0
concepts: [walk-forward-validation, data-leakage]
concepts_proposed: []
category: [data-ml]
credibility_max: plausible
corroboration_factor: 1.3
independent_sources: 2
contradicted_by: []
origin: pipeline
origin_tool: null
origin_protocol_version: "2.0"
conformance: A
citations_sampled: 0
citations_verified: 0
unverifiable_citations: false
review_status: draft
word_count: 202
skill_candidates:
  - capability: walk-forward-cv-design
    verdict: DEEPEN
    target_skill: ml-engineer
    credibility: plausible
    why_now: Pipeline dự báo UNIS đang chia train test theo tỷ lệ ngẫu nhiên
    score: {relevance: 5, frequency: 4, durability: 5, corroboration_factor: 1.3, cost: 2}
    priority: 65
    draft_trigger: Dùng khi thiết kế cross-validation cho dữ liệu chuỗi thời gian
---

# Ví dụ đạt chuẩn

> **60 giây** — File này tồn tại để kiểm script, không phải để đọc.

## 1. Overview
Một đoạn.

## 2. Bối cảnh
Ngắn gọn.

## 3. Nội dung

### 3.1 Đầu vào
Bảng.

### 3.2 Process
Chuỗi lập luận đi từ giả thuyết tới kết luận, mỗi bước neo vào một mục cụ thể của bài báo và có thể đối chiếu lại được khi cần. Bước một dựng giả thuyết [§2.1]. Bước hai mô tả thiết kế thí nghiệm và nêu rõ điều kiện đo gồm phần cứng và kích thước dữ liệu [§4.1]. Bước ba trình bày kết quả so với baseline [§4.3 Bảng 2]. Bước bốn là chỗ kết luận vượt quá bằng chứng vì mở rộng sang miền dữ liệu chưa thử [§5.2].

### 3.3 Output
Đầu ra là bảng so sánh với baseline cùng điều kiện [§4.3].

### 3.4 Tinh túy
#### 3.4.1 Cố định ranh giới thời gian trước khi sinh đặc trưng, không phải sau
- **Không hiển nhiên vì:** rò rỉ xảy ra ở bước tính đặc trưng trượt chứ không ở bước chia tập, nên kiểm tra tỷ lệ train test không phát hiện được [§3.4]
- **Chuyển giao:** mọi pipeline dự báo có đặc trưng cửa sổ trượt
- **Tin cậy:** plausible · 2 nguồn độc lập
- **Bằng chứng:** [§3.4] [§4.1]
- **Loại:** skill

## 4. Ý nghĩa thực tế
Dùng khi thiết kế cross-validation cho mọi chuỗi thời gian [§3.1].

## 5. Rủi ro và tầm nhìn
Số liệu ở Bảng 2 chưa có ai tái lập độc lập. Ba hướng mở.
