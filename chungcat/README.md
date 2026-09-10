# `chungcat` — M12_chungcat

> **KHUNG RỖNG.** Dựng ở s4 (2026-08-31) để `project_map` khai được và
> `check_map` kiểm được hai chiều. **Chưa có một dòng logic nào**, và đó là
> đúng: luật s4 — *"scaffold là khung, không phải code chức năng; logic
> nghiệp vụ nào xuất hiện ở đây là đi lậu qua s5–s8"*.

| | |
|---|---|
| vùng | **THO** |
| ngôn ngữ | python |
| cổng | `8790` |
| key model | **có** |

**Vai**: nguyên liệu → bản nháp. Hai kiểu: chưng cất một nguồn (ho_so phan-tich) và tổng hợp N nguồn (ho_so tong-hop, FR-044). Engine cắm rút được.

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

## Chạy worker SONG SONG (T12-23)

Chủ dự án chốt 2026-09-05: **2 tiến trình × 4 luồng = tối đa 8 việc cùng lúc.**
Con số nằm ở `chungcat/assets/nguong.json` khối `song_song`, không gõ trong mã.

```bash
CHUNGCAT_WORKER_ID=w1 python chungcat/src/worker.py --vong &
CHUNGCAT_WORKER_ID=w2 python chungcat/src/worker.py --vong &
```

`CHUNGCAT_WORKER_ID` **bắt buộc khác nhau**, và nó làm hai việc:

| | |
|---|---|
| khoá tiến trình | `log/worker-<id>.pid` — chặn hai bản CÙNG định danh (worker mồ côi chạy mã cũ), không chặn hai tiến trình khác định danh |
| sổ egress | `hang-doi/egress.<id>.jsonl` — mỗi tiến trình một sổ |

**Vì sao mỗi tiến trình một sổ egress, không một sổ chung có khoá:** `seq` do TA
cấp bằng cách đọc dòng cuối của sổ. N bên cùng ghi một file là cuộc đua trên
chính phép cấp số — hai bên đọc cùng "dòng cuối" rồi cùng ghi `seq` ấy, và
`AC-6.2` (*dựng lại từ log ra cùng con số*) vỡ **im lặng**. Khoá file chéo tiến
trình trên Windows thì là ổ bug, và khoá giữ qua `fsync` biến mọi lần gửi thành
hàng một. Đánh đổi: `seq` chỉ liên tục TRONG một sổ, người đọc gộp theo
`(worker_id, seq)` — `egress.doc_moi_so()` làm sẵn việc đó.

**Vì sao trần ASR tách riêng** (`tran_asr_dong_thoi: 1`): `chung-cat` chờ MẠNG
nên luồng song song ăn ngay; `sinh-transcript` lối local nghiến CPU và mỗi bản
giữ một model trong RAM. Một con số chung thì hoặc bóp nghẹt loại thứ nhất,
hoặc cho loại thứ hai làm nghẽn máy.

**Bỏ `CHUNGCAT_WORKER_ID` đi thì sao:** định danh mặc định là PID, nên mỗi lần
chạy ra một sổ egress mới và khoá không còn chặn được bản mồ côi. Chạy tay một
lần thì được; chạy thường trực thì đặt tên.

> `chay.sh` (gốc repo) hiện chỉ dựng **một** worker và **ngoài** đất M12 — sửa
> nó là việc của chủ đất. Ô nợ đã mở ở `06_modules/M12_chungcat/backlog.md`.
