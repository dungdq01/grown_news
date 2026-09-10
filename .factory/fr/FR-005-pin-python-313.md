# FR-005 — pin Python 3.13, không phải 3.11

mở_bởi: s8 T01-3, 2026-08-19
tới: s4 (ADR-02)
mức: chặn T01-3 → T04-2 → T04-3
trạng_thái: ĐÃ DUYỆT (người dùng: "cài 3.11 trở lên")

## Vấn đề

T01-3 khai điểm dừng: *"máy có Python 3.11 không? Không có ⇒ DỪNG, leo thang."*

**Máy không có 3.11.** Có:

| Bản | Trạng thái |
|---|---|
| 3.9.x | đang dùng suốt s1–s7, **hết hỗ trợ bảo mật 10/2025** |
| **3.13.7** | có sẵn, có `pip` đầy đủ |

## Kiểm chứng trước khi đề xuất — không phỏng đoán

Cài `pip install -e "./core[dev]"` lên 3.13 rồi chạy **toàn bộ**:

```
19 test pytest        xanh
check_frozen          xanh      check_g6a             xanh
check_g6b             xanh      check_ba              xanh
check_mermaid         xanh      check_rule_surfaces   xanh
check_reject_reason   xanh      check_ci_teeth        xanh
validate.py kb/       xanh
```

9 script + 19 test, không lỗi nào.

## Quyết

Pin **3.13**, không cài thêm 3.11.

**Đây không phải đảo ADR-02** — tiêu đề của nó đã là *"Python 3.11+"*. Phần thân
ghi số cụ thể `3.11` vì lúc s4 đó là bản dự kiến. FR này làm rõ số, giữ nguyên lý do.

### Vì sao không cài thêm 3.11

ADR-02 tồn tại để chống **môi trường phân mảnh**. Máy đang có 2 bản Python; cài
thêm 3.11 thành **3 bản** — đi ngược mục đích của chính ADR đó.

Và 3.13 là bản duy nhất trên máy đã *chứng minh* chạy được toàn bộ bộ kiểm.

### Vì sao không hạ xuống 3.9

3.9 hết hỗ trợ bảo mật từ 10/2025. Pin CI vào đó là nợ phải trả lại sau. Task
T01-3 cấm việc này, và người dùng chọn "3.11 trở lên".

## Thi hành

| Chỗ | Đổi |
|---|---|
| `04_system/adr.md` ADR-02 | `3.11` → `3.13`, ghi bằng chứng đã chạy |
| `core/pyproject.toml` | `requires-python = ">=3.13"` |
| `.github/workflows/ci.yml.template` | `python-version: '3.13'` |
| `check_version_pin.py` | tự khớp — không sửa |

## Đổi thì

Hạ xuống bản thấp hơn phải chạy lại **cả 9 script + 19 test** trên bản đó trước,
không chỉ pytest. Ghi kết quả vào FR mới.
