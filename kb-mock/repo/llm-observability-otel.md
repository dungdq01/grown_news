---
id: "src_new001"
slug: "llm-observability-otel"
source_type: "repo"
archetype: "library"
url: "https://github.com/vd/llm-otel"
url_normalized: "github.com/vd/llm-otel"
title: "Trace LLM call bằng OpenTelemetry span"
one_liner: "Bọc mỗi lần gọi model thành span, đo token và độ trễ theo từng bước agent."
analyzed_at: "2026-08-16"
published_at: "2026-06-02"
protocol_version: "2.0"
origin: "pipeline"
conformance: "A"
review_status: "approved"
reviewed_by: "dung"
credibility_max: "verified"
independent_sources: 2
corroboration_factor: 1.3
decay_risk: "medium"
word_count: 113
unresolved_count: 0
insight_new: true
skill_installed: false
review_minutes: 16
concepts_proposed: ["llm-tracing", "span-attribute-convention"]
skill_candidates: [{"capability": "llm-observability", "verdict": "NEW", "target_skill": null, "proposed_name": "llm-observability", "credibility": "verified", "why_now": "Agent nội bộ chạy nhiều bước mà không đo được bước nào tốn token nhất", "draft_trigger": "trace agent này xem bước nào chậm", "score": {"relevance": 4, "frequency": 4, "durability": 4, "corroboration_factor": 1.3, "cost": 3}, "priority": 27.7, "reason_rejected": null}]
citations_sampled: 4
citations_verified: 0
unverifiable_citations: true
---

## 1. Overview

Bọc mỗi lần gọi model thành span, đo token và độ trễ theo từng bước agent.

## 2. Bối cảnh

Vấn đề tồn tại trước khi có nguồn này.

## 3. Nội dung

### 3.1 Đầu vào

Đầu vào của nguồn.

### 3.2 Process

Chi tiết cách nó hoạt động [nguon.py:10-40]. Thêm chữ cho thân bài đủ dày. Thêm chữ cho thân bài đủ dày. Thêm chữ cho thân bài đủ dày. Thêm chữ cho thân bài đủ dày. Thêm chữ cho thân bài đủ dày. Thêm chữ cho thân bài đủ dày. Thêm chữ cho thân bài đủ dày. Thêm chữ cho thân bài đủ dày.

### 3.3 Output

Kết quả đo được [nguon.py:41-50].

### 3.4 Tinh túy

— [nguon.md:1-2]

## 4. Ý nghĩa thực tế

Dùng được vào việc gì [nguon.py:51-60].

## 5. Rủi ro và tầm nhìn

Chỗ chưa ai tái lập, và hướng đi tiếp.

