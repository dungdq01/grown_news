# `truyhoi` — M13_truyhoi

> **ĐANG CHẠY** (2026-09-11). Dựng khung ở s4 (2026-08-31), có mã ở `T13-2`…`T13-9`.
> Chỉ mục là **DẪN XUẤT**: xoá `index.sqlite` rồi dựng lại bất cứ lúc nào, mất nó không
> mất gì. Đo trên kho thật: 16 tài liệu · 111 chunk · `hong []`.

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

## Lệnh — chạy gì, và hai biến dễ quên

`truyhoi/` đã có mã và đã **chạy thật** (2026-09-11): chuỗi `web → :8791` trả kết quả kèm
`dia_chi` trên kho thật — 16 tài liệu · 111 chunk.

```bash
python truyhoi/src/api.py                 # service: bind 127.0.0.1:8791, cổng ĐỌC từ dich-vu.json (Z6)
python truyhoi/src/indexer.py --day-du    # dựng lại chỉ mục từ đầu (chỉ mục là DẪN XUẤT — xoá được)
python truyhoi/src/indexer.py --kiem-lech # chỉ ĐỌC: nêu slug lệch · mồ côi · chưa index (AC-1.2)
for f in truyhoi/tests/check_*.py; do python "$f"; done          # 21 cổng
for f in truyhoi/tests/check_*.py; do python "$f" --tu-kiem; done # mỗi cổng tự chứng minh ĐỎ ĐƯỢC
```

### Hai biến, hai đường — nhầm là mất nửa buổi

**1 · `.env` chỉ đến được TIẾN TRÌNH DỊCH VỤ, và chỉ lúc KHỞI ĐỘNG.**
`KHOA_WEB_TRUYHOI` (khoá chiều `web→truyhoi`, `ADR-08` Z9) nằm ở `.env` **gốc repo**. Cả hai
bên nạp nó MỘT LẦN lúc dậy — `web/server.mjs` (`loadEnvFile`) và `api.py` (`nap_env()` trong
`chay()`). Sửa `.env` ⇒ **restart CẢ HAI**; chưa restart thì `/api/tim` trả **403** — đó là
fail-closed đúng, không phải bug. Đo 2026-09-11: `:8890` (web đã restart) trả 200; `:8787`
(site chính, dậy trước khi có khoá) vẫn 403 trên cùng một mã.

**2 · CỔNG và `indexer.py` KHÔNG đọc `.env`** — chúng là tiến trình rời, không ai gọi `nap_env()`.
Chạy tay thì `export` từng biến:

```bash
export PYTHONIOENCODING=utf-8                      # BẮT BUỘC trên Windows (console cp1252 giết dòng print)
export TRUYHOI_LOI_URL=http://127.0.0.1:8890       # LÕI nào đang có /api/kho-delta (mặc định: cổng `web` trong dich-vu.json)
export TRUYHOI_INDEX=/duong/khac/index.sqlite      # tuỳ chọn — test luôn dùng thư mục tạm (rule.md 16)
```

Còn `TRUYHOI_DAI_HAN` (bảng khai dải Hán) và `TRUYHOI_DICH_VU` (bảng khai dịch vụ) chỉ để **cổng**
trỏ sang bản TẠM mà không đụng file thật — không phải đường cấu hình cho vận hành.

## Chưa có gì — và không cần có

Không `package.json`. `pyproject.toml` có từ `T13-2` (stdlib + `pyyaml` cho `golden.yaml`; 0 dep
mạng, 0 dep vector — `M13-R5` đòi 0 lời gọi mạng, `spec §7` hoãn vector).
