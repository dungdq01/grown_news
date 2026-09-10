# `kenh` — M15_kenh

> **KHUNG RỖNG.** Dựng ở s4 (2026-08-31) để `project_map` khai được và
> `check_map` kiểm được hai chiều. **Chưa có một dòng logic nào**, và đó là
> đúng: luật s4 — *"scaffold là khung, không phải code chức năng; logic
> nghiệp vụ nào xuất hiện ở đây là đi lậu qua s5–s8"*.

| | |
|---|---|
| vùng | **BIEN** |
| ngôn ngữ | node |
| cổng | **không nghe** |
| key model | không |

**Vai**: adapter kênh chat. Ba việc và chỉ ba: allowlist người gửi · dịch lệnh → gọi web:8787 · dịch phản hồi → tin nhắn. Không logic nghiệp vụ, không đọc kb/.

## Luật của vùng BIEN — không nới

- **không nghe gì** — kéo tin bằng long polling
- gọi **RA** kênh, gọi **VÀO** `127.0.0.1:8787`
- **không chạm `kb/`** một lần nào (`Z4`)
- **không** có key model
- **allowlist chat-id là bắt buộc** (`B-B4`) — không có nó thì kho thành hộp thư công cộng

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
