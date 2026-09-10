# `truyhoi` — M13_truyhoi

> **KHUNG RỖNG.** Dựng ở s4 (2026-08-31) để `project_map` khai được và
> `check_map` kiểm được hai chiều. **Chưa có một dòng logic nào**, và đó là
> đúng: luật s4 — *"scaffold là khung, không phải code chức năng; logic
> nghiệp vụ nào xuất hiện ở đây là đi lậu qua s5–s8"*.

| | |
|---|---|
| vùng | **THO** |
| ngôn ngữ | python |
| cổng | `8791` |
| key model | **không** — `M13-R5` đòi 0 lời gọi mạng, nên khoá model cho tiến trình này là khoá không ai dùng nhưng ai cũng đọc được (`FR-072` §1.2; `dich-vu.json` sửa ở `T01-51`) |
| ai gọi được vào | đọc từ `goi_duoc` của `truyhoi` trong `core/assets/dich-vu.json` — hôm nay `["web", "chatbot"]` (`ADR-08` Z9 · `M13-R6`) |

**Vai**: chỉ mục + truy hồi. Phạm vi truy hồi lấy từ bộ lọc facet — control HIỂN THỊ, không phải top-k ẩn.

## Luật của vùng THO — không nới

- nghe **chỉ** `127.0.0.1` / `::1` (`Z3`)
- là nơi **DUY NHẤT** được gọi ra Internet (`B-E2`) — nhưng M13 **không dùng quyền
  đó**: `M13-R5` đòi 0 lời gọi mạng, mọi phép tính chạy trên SQLite local
- **không** ghi thẳng `kb/` — ghi qua cửa ghi của LÕI (`Z5`). M13 **không ghi kho một
  lần nào**; hiện vật văn bản thì **ĐỌC** qua API của LÕI (`FR-072` §1.3)
- **không** có giao diện: không `.html`/`.css`/template (`Z7`)
- **~~chỉ `web/` được gọi tới (`Z8`)~~** → `ADR-08` (2026-09-07) đảo luật này:
  **THỢ gọi được THỢ, có bảng khai**. Mỗi cặp `(từ → tới)` khai trong `goi_duoc`, mỗi
  chiều một khoá + `aud` riêng, **bên NHẬN cưỡng chế** (`Z9` · `M13-R6`). Điều còn
  giữ của `Z8` là vế **trình bày**: chỉ `web/` biến JSON thành thứ người đọc (`Z7`)
- việc dài ⇒ API **bất đồng bộ**: `POST` trả `viec_id`, `GET /viec/<id>` hỏi. *(M13
  trả lời trong một request — truy vấn FTS5 là mili-giây, không phải phút như M16.)*

## Hợp đồng sống ở đâu

- bảng khai dịch vụ · `core/assets/dich-vu.json` — **số cổng và `goi_duoc` đọc từ đó**
- **hợp đồng API** · `06_modules/M13_truyhoi/spec.md §1a` (hình dạng) +
  `05_uiux/contracts/truyhoi.sample.v3.json` (giá trị mẫu) — **một** hợp đồng cho
  mọi client (`FR-072` §1.1)
- dạng địa chỉ · `core/assets/dia-chi.json` (`FR-073` thêm `file-anchor`)
- dải ký tự Hán · `core/assets/dai-han.json` — **chủ là M01**, M13 và M12 cùng đọc
- ba vùng · `03_docs/spec_overview.md`
- ADR + cổng Z1–Z7 · `04_system/adr.md#ADR-05`; **Z8' + Z9** · `#ADR-08`
- chính sách gửi RA · `04_system/security_baseline.md` §3.1, §4b
- thứ tự dựng · `04_system/build_order.md`

## Lệnh — hôm nay chạy được gì

`truyhoi/` **chưa có một dòng mã nào**, nên chưa lệnh nào của module này chạy được.
Ba lệnh dưới đây là **cổng GIẤY**, chạy từ gốc repo, và chúng canh hợp đồng của M13
kể cả khi chưa có mã:

```bash
python core/tests/check_g6a.py            # 6 artifact · 6 rule · AC 23 hard/1 soft
python core/tests/check_rule_surfaces.py  # M13-R1..R6: CHỜ tới khi truyhoi/tests/ dựng
python core/tests/check_frozen.py         # spec.md + rules.md khớp baseline đã ký
```

Mười tám cổng của module (`truyhoi/tests/check_*.py`) dựng ở **`T13-1`**, và dựng
**cả mười tám trong MỘT lượt**: `check_rule_surfaces` xếp một rule là CHỜ khi thư mục
cha chưa có, nhưng **ĐỎ** khi thư mục đã có mà file thì không — nên file đầu tiên tạo
ở `truyhoi/tests/` lật mọi rule còn lại sang đỏ cùng lúc.

Khi có mã, service chạy bằng: `python truyhoi/src/api.py` (bind `127.0.0.1:8791`, số
cổng **đọc từ `dich-vu.json`**, không gõ tay — `Z6`).

## Chưa có gì

Không `package.json`, không `pyproject.toml`, không mã nguồn. Chúng sinh ở
**đơn vị việc đầu tiên** của module này (`T13-2` khai `truyhoi/pyproject.toml` —
khai phụ thuộc MỘT chỗ, bài học M12) — dựng trước là dựng một cấu hình chưa ai
biết cần gì.
