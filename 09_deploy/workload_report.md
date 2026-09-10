# workload_report — số đo tải (s9/G7)

> Sinh bằng `python core/tools/do_tai.py`. **Không sửa tay**: mọi số ở đây
> phải là output máy (`#tự-khai`).

Mốc tải: **1, 50, 200, 800** bản ghi · 12 lần mỗi phép, bỏ
2 lần đầu · p95, không phải trung bình.

## Vì sao đọc ĐỘ DỐC chứ không đọc mili giây

Mili giây đổi theo máy, theo tải nền, theo lần chạy — một ngưỡng ms sẽ đỏ
oan cho tới khi có người tắt nó. Thứ **không** đổi theo máy là hình dạng
tăng trưởng `t(N) ~ N^k`:

| k | nghĩa |
|---|---|
| < 0.35 | **PHẲNG** — kho lớn lên không đắt thêm |
| < 1.15 | **TUYẾN TÍNH** — đắt theo N, biết trước |
| < 1.6 | **TRÊN TUYẾN** — đắt hơn N, soi lại |
| ≥ 1.6 | **MẦM HỎNG** — hôm nay còn nhanh, N gấp mười thì không |

Một màn 40 ms ở N=1 và 40 ms ở N=800 là **khoẻ**. Một màn 40 → 900 ms là
**hỏng**, dù cả hai đều đủ nhanh hôm nay.

## Thời gian (p95)

| đường | N=1 p95 | N=50 p95 | N=200 p95 | N=800 p95 | ×bội | độ dốc k | hình dạng |
|---|---|---|---|---|---|---|---|
| `trang-chu` | 50 ms | 81 ms | 127 ms | 311 ms | ×6.2 | 0.25 | ĐẮT DẦN |
| `tat-ca` | 48 ms | 79 ms | 119 ms | 295 ms | ×6.1 | 0.24 | ĐẮT DẦN |
| `bai-viet` | 49 ms | 79 ms | 130 ms | 309 ms | ×6.3 | 0.25 | ĐẮT DẦN |
| `tai-lieu` | 47 ms | 80 ms | 126 ms | 306 ms | ×6.5 | 0.25 | ĐẮT DẦN |
| `video` | 48 ms | 78 ms | 124 ms | 294 ms | ×6.1 | 0.25 | ĐẮT DẦN |
| `kho` | 48 ms | 79 ms | 129 ms | 297 ms | ×6.3 | 0.25 | ĐẮT DẦN |
| `khai-niem` | 49 ms | 79 ms | 128 ms | 300 ms | ×6.1 | 0.25 | ĐẮT DẦN |
| `nap-bai-viet` | 49 ms | 79 ms | 125 ms | 298 ms | ×6.1 | 0.25 | ĐẮT DẦN |
| `nap-tai-lieu` | 48 ms | 80 ms | 128 ms | 290 ms | ×6.0 | 0.25 | ĐẮT DẦN |
| `nap-video` | 48 ms | 85 ms | 123 ms | 297 ms | ×6.2 | 0.25 | ĐẮT DẦN |
| `api:index` | 27 ms | 31 ms | 33 ms | 50 ms | ×1.8 | 0.07 | PHẲNG |
| `api:articles` | 28 ms | 32 ms | 32 ms | 42 ms | ×1.5 | 0.05 | PHẲNG |
| `api:concepts` | 32 ms | 31 ms | 32 ms | 43 ms | ×1.4 | 0.04 | PHẲNG |
| `tai-san:gn.js` | 16 ms | 16 ms | 16 ms | 16 ms | ×1.0 | 0.00 | PHẲNG |

## Byte

| đường | N=1 | N=50 | N=200 | N=800 | độ dốc byte |
|---|---|---|---|---|---|
| `trang-chu` | 34 KB | 82 KB | 164 KB | 487 KB | 0.37 |
| `tat-ca` | 34 KB | 69 KB | 70 KB | 70 KB | 0.11 |
| `bai-viet` | 34 KB | 82 KB | 163 KB | 487 KB | 0.37 |
| `tai-lieu` | 34 KB | 82 KB | 163 KB | 487 KB | 0.37 |
| `video` | 34 KB | 82 KB | 163 KB | 487 KB | 0.37 |
| `kho` | 34 KB | 82 KB | 164 KB | 487 KB | 0.37 |
| `khai-niem` | 34 KB | 82 KB | 164 KB | 487 KB | 0.37 |
| `nap-bai-viet` | 42 KB | 91 KB | 172 KB | 496 KB | 0.34 |
| `nap-tai-lieu` | 37 KB | 85 KB | 167 KB | 490 KB | 0.36 |
| `nap-video` | 37 KB | 85 KB | 166 KB | 490 KB | 0.36 |
| `api:index` | 1 KB | 43 KB | 174 KB | 696 KB | 1.00 |
| `api:articles` | 1 KB | 24 KB | 24 KB | 24 KB | 0.61 |
| `api:concepts` | 0 KB | 0 KB | 0 KB | 0 KB | 0.00 |
| `tai-san:gn.js` | 98 KB | 98 KB | 98 KB | 98 KB | 0.00 |

**lỗi: 0**

## Cần soi

- `trang-chu` — k=0.25 · ĐẮT DẦN
- `tat-ca` — k=0.24 · ĐẮT DẦN
- `bai-viet` — k=0.25 · ĐẮT DẦN
- `tai-lieu` — k=0.25 · ĐẮT DẦN
- `video` — k=0.25 · ĐẮT DẦN
- `kho` — k=0.25 · ĐẮT DẦN
- `khai-niem` — k=0.25 · ĐẮT DẦN
- `nap-bai-viet` — k=0.25 · ĐẮT DẦN
- `nap-tai-lieu` — k=0.25 · ĐẮT DẦN
- `nap-video` — k=0.25 · ĐẮT DẦN

