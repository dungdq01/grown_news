# `chatbot` — M14_chatbot

> **KHUNG RỖNG.** Dựng ở s4 (2026-08-31) để `project_map` khai được và
> `check_map` kiểm được hai chiều. **Chưa có một dòng logic nào**, và đó là
> đúng: luật s4 — *"scaffold là khung, không phải code chức năng; logic
> nghiệp vụ nào xuất hiện ở đây là đi lậu qua s5–s8"*.

| | |
|---|---|
| vùng | **THO** |
| ngôn ngữ | node |
| cổng | `8788` |
| key model | **có** |

**Vai**: hỏi → đáp KÈM ĐỊA CHỈ. Không có trong kho thì từ chối, có phân loại lý do. Trả JSON, không trả trình bày.

## Luật của vùng THO — không nới

- nghe **chỉ** `127.0.0.1` / `::1` (`Z3`)
- là nơi **DUY NHẤT** được gọi ra Internet (`B-E2`)
- **không** ghi thẳng `kb/` — ghi qua cửa ghi của LÕI (`Z5`)
- **không** có giao diện: không `.html`/`.css`/template (`Z7`)
- chỉ `web/` được gọi tới (`Z8`)
- việc dài ⇒ API **bất đồng bộ**: `POST` trả `viec_id`, `GET /viec/<id>` hỏi

## Hợp đồng sống ở đâu

- bảng khai dịch vụ · `core/assets/dich-vu.json` — **số cổng đọc từ đó**
- ba vùng · `03_docs/spec_overview.md`
- ADR + cổng Z1–Z8 · `04_system/adr.md#ADR-05`
- chính sách gửi RA · `04_system/security_baseline.md` §3.1, §4b
- thứ tự dựng · `04_system/build_order.md`

## Chưa có gì

Không `package.json`, không `pyproject.toml`, không mã nguồn. Chúng sinh ở
**đơn vị việc đầu tiên** của module này (xem `build_order` đợt hai) — dựng
trước là dựng một cấu hình chưa ai biết cần gì.
