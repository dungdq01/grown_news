# s7 — PM Plan (G6B)

> Plan là **`soft`**: 1 lượt · người duyệt bắt buộc · **DRAFT trước khi duyệt**.
> PM không tự bắn task.

## 15 task, 7 module

Thứ tự theo **3 chặng** của build order — hệ thống trước, dữ liệu thật sau.

### Chặng A · có hệ thống

| # | Task | Module | Ghi vào | hard/soft |
|---|---|---|---|---|
| 1 | `T01-3` dọn môi trường, pin 3.11 | M01_core | `core/pyproject.toml` | hard |
| 2 | `T04-2` bật CI | M04_ci | `.github/workflows/**` | hard |
| 3 | `T04-3` pre-commit hook | M04_ci | `.githooks/**` | hard · **CHỜ FR-003** |

### Chặng B · chạy với sample

| # | Task | Module | Ghi vào | hard/soft |
|---|---|---|---|---|
| 4 | `T06-1` bổ sung sample lên 4 verdict | M06_skillgen | `contracts/v3` + FR | hard |
| 5 | `T03-1` dựng Quartz, import token | M03_web | `web/**` | hard |
| 6 | `T03-2` ba custom part | M03_web | `web/quartz/plugins/**` | hard |
| 7 | `T03-3` port multi-window | M03_web | `web/quartz/components/**` | hard |
| 8 | `T03-4` bốn màn + ba state | M03_web | `web/quartz/**` | **soft** |
| 9 | `T06-2` chấm verdict 5 cổng | M06_skillgen | `06_skillgen/**` | hard |
| 10 | `T06-3` sinh nháp thân rỗng | M06_skillgen | `06_skillgen/**` | hard |

### Chặng C · dữ liệu thật

| # | Task | Module | Ghi vào | hard/soft |
|---|---|---|---|---|
| 11 | `T01-1` hàm chuẩn hoá URL | M01_core | `validate.py` | hard |
| 12 | `T01-2` test `--fix` chỉ dẫn xuất | M01_core | `core/tests/**` | hard |
| 13 | `T05-1` cổng gác cửa | M05_intake | `05_intake/**` | hard |
| 14 | `T05-2` lỗi nói được cách sửa | M05_intake | `05_intake/**` | hard |
| 15 | `T07-1` quét kho, báo cáo | M07_curate | `07_curate/**` | hard |

**Chốt chặn giữa B và C**: nạp **2 bài thật** trước khi nạp đủ 10.

## Đồ thị phụ thuộc

```
T01-3 ──> T04-2 ──> T04-3 (chờ FR-003)
T06-1 ──> T06-2 ──> T06-3
T03-1 ──> T03-2 ──> T03-3 ──> T03-4
T05-1 ──> T05-2
T01-1, T01-2, T07-1: độc lập
```

Không vòng — kiểm bằng `check_g6b.py`.

## Evidence plan — G6C cần file nào, task nào sinh

| Evidence | Task sinh ra |
|---|---|
| CI xanh trên PR | T04-2 |
| `check_version_pin` xanh | T01-3 |
| `check_ci_teeth` xanh | T04-2 |
| `test_sample_coverage` xanh | T06-1 |
| `expected-render.test.js` | T03-2 |
| `no-leak.test.js` | T03-3 |
| `test_draft_shape.py` | T06-3 |
| `test_gate.py` | T05-1, T05-2 |
| `test_curate.py` | T07-1 |
| `-k url_normalized` | T01-1 |
| `-k fix_chi_dan_xuat` | T01-2 |

AC đã xanh sẵn của M01 (19 test, `TestDemTu`, `ban_dat_chuan`) **không cần task**
— W5 đòi evidence *có thật*, không đòi làm lại thứ đang chạy.

## Ba chỗ `check_g6b.py` bắt được lỗi của PM

| Lỗi | Sửa |
|---|---|
| T02-1, T02-2, T04-1 ghi ngoài boundary module | chuyển sang M01_core (`core/**`), đổi id thành T01-* |
| `.githooks/**` không module nào sở hữu | mở **FR-003** — task chờ, không nới boundary lén |
| AC của M02 chạy từ root thì đỏ | sửa AC ghi đường đầy đủ, không sửa lệnh test |

Lỗi đầu là loại nghiêm trọng nhất: task ghi vào file module khác sở hữu ⇒ R1 mất
địa chỉ, và bên chấm sửa được thứ mình chấm.

## Một lỗi CÒN ĐỎ có chủ ý

`T04-3` — chờ FR-003 duyệt. Đây là hành vi đúng: PM **không** tự nới boundary.

`check_g6b.py` đỏ ở đúng một dòng đó là dấu hiệu plan trung thực.
