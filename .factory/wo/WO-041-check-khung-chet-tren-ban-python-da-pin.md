# WO-041 — ~~`check_khung.py` chết ở lúc PARSE trên bản Python đã pin~~ **RÚT · TIỀN ĐỀ SAI**

- **loại**: ~~bug~~ → **rút 2026-09-03, cùng ngày mở**
- **mức**: ~~hard~~ → **không phải lỗi của mã**
- **rút bởi**: chính người mở (phiên trợ lý), sau khi đọc `FR-005`

## Vì sao rút

Bản đầu khai:

> *"`check_khung.py:115` có f-string chứa backslash — cấm tới **3.11**, chỉ hợp lệ
> từ 3.12 (PEP 701). `ADR-02` **pin 3.11**. ⇒ cổng chưa từng chạy trên môi trường
> mà `ADR-02` khai là môi trường dự án."*

**Mệnh đề "`ADR-02` pin 3.11" SAI.** Đo lại 2026-09-03:

| nguồn | nói gì |
|---|---|
| `adr.md#ADR-02` dòng 3 | *"**Cập nhật FR-005 (2026-08-19)**: số cụ thể là **3.13**, không phải 3.11."* |
| `core/pyproject.toml` | `requires-python = ">=3.13"   # ADR-02 + FR-005` |
| `.github/workflows/ci.yml` | `python-version: '3.13'      # pin cứng — ADR-02 + FR-005` |

Dự án pin **3.13**. PEP 701 có hiệu lực **từ 3.12**. ⇒ f-string chứa backslash ở
`check_khung.py:115` **hợp lệ trên môi trường đã khai**. Cổng **đúng**.

`SyntaxError` tôi thấy đến từ việc **tôi chạy nó bằng sai trình thông dịch** —
`python` trên `PATH` trỏ `AppData\Local\hermes\hermes-agent\venv` (**3.11.15**),
không phải bản dự án pin.

## Lỗi phương pháp, ghi vì nó đáng hơn cái bug không có thật

`CLAUDE.md` §DỪNG có đúng một dòng cho ca này:

> *"máy đỏ mà **chưa quy được chủ** ⇒ `git status` + `find -newermt` trước khi
> phán (`#đỏ-của-người-khác`)"*

Tôi thấy đỏ và phán ngay, **không** hỏi *"đỏ này có phải của môi trường không"*.
Và tôi đã tự đi qua bằng chứng ngược: cùng lượt đo, `check_khung` chạy trên 3.14
**qua được phần parse** và chỉ báo *"Thiếu phụ thuộc: pip install pyyaml
jsonschema"* — tức đã có dấu hiệu rằng vấn đề là **trình thông dịch**, không phải
cú pháp. Tôi đọc nó như một lỗi thứ hai thay vì như phản chứng của lỗi thứ nhất.

Cùng lớp lỗi mà `workflow.md` của M12 cảnh báo theo chiều ngược lại — *"cổng đỏ vì
`ImportError` không tính là đỏ đúng"*. Ở đây là: **đỏ vì môi trường không tính là
bug của mã.**

## Cái CÒN LẠI thật — và nó không phải bug, là SETUP

Không python nào trên `PATH` khớp bản pin, nên **không `tiêu_chí.cmd` nào của plan
M12 chạy được**:

| python | phiên bản | khớp `>=3.13`? | thiếu |
|---|---|---|---|
| `python` ← đang chiếm `PATH` | 3.11.15 *(venv Hermes)* | ❌ | `pypdf` · `pytest` |
| `py -3` / `python3` | 3.14.2 *(pythoncore)* | ✅ | `pyyaml` · `jsonschema` · `pypdf` · `pytest` |

`RUNNING.md:42` đã khai đúng cách vá: `python -m pip install -e "./core[dev]"`.
⇒ Việc cần làm là **dựng môi trường theo `RUNNING.md`**, không phải sửa một dòng mã.
Đó là setup, không phải WO — nên WO này rút, không chuyển loại.

⚠️ Một chỗ **drift** đáng ghi, không phải lỗi: CI pin **đúng `'3.13'`**, máy có
**3.14.2**. `requires-python = ">=3.13"` cho qua, nhưng *"xanh trên máy"* và
*"xanh trên CI"* đang chạy hai bản khác nhau. Nếu về sau có phép kiểm nhạy phiên
bản, đây là chỗ nó lệch.

## Object

- `core/tests/check_khung.py:115` — **không sửa**, mã đúng
- `04_system/adr.md#ADR-02` dòng 3 · `.factory/fr/FR-005-pin-python-313.md`
- `core/pyproject.toml` · `.github/workflows/ci.yml` · `RUNNING.md:42`