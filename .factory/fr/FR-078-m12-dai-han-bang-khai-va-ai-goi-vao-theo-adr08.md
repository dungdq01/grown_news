# FR-078 — M12: dải Hán đọc từ bảng khai `dai-han.json` · `AC-1.4`/`M12-R7` theo ADR-08 (`goi_duoc`)

- **mở**: 2026-09-09 · **người mở**: claude (PM M13) · **người quyết**: chủ dự án — *"chốt cả 4"* (duyệt mở) · **trạng thái**: **ĐÃ DUYỆT MỞ**, chờ team M12 áp
- **artifact FROZEN chạm**: `06_modules/M12_chungcat/spec.md` (§1 AC-1.4 · §4.2 mục 2) · `rules.md` (M12-R7)
- **artifact khác chạm**: `chungcat/src/dinh_tuyen.py` (`_DAI_HAN`) · `chungcat/tests/check_dinh_tuyen_ngon_ngu.py` · `chungcat/tests/check_chi_loi_goi_tu_loi.py` · `06_modules/M12_chungcat/backlog.md:631` (ô dải Hán) · `model_flow.md §5`
- **nguồn**: `ADR-08 §Đổi thì 3` (bảng artifact phải theo — dòng M12) · `FR-072 §1.2` · plan M13 `T01-51` (tạo `core/assets/dai-han.json`, FR-077)
- **phụ thuộc**: `T01-51` xong (bảng khai tồn tại) — vế dải Hán; **không** phụ thuộc gì — vế AC-1.4
- **không chặn**: M13. M13 không gọi M12; đây là nợ ADR-08 và nợ `model_flow §5` của M12 tự khai

## 0 · Vì sao phải FR — hai điều đo được, cả hai đã được chính M12 khai là nợ

```
chungcat/src/dinh_tuyen.py:25-30   _DAI_HAN = 4 dải CJK gõ cứng; ghi chú "tạm, chuyển
                                    sang bảng khai khi M13 dựng"
M12/backlog.md:631                  ô [ ] "Dải ký tự Hán đang có HAI bản tiềm tàng" ⇒ khi M13 dựng
M12/spec.md:394                     "Dùng đúng dải Hán của `chuan_hoa()` (M13): một hàm, hai chỗ dùng"
                                    ⇒ SAI về CƠ CHẾ: thứ dùng chung là BẢNG KHAI, không phải hàm
                                    (chuan_hoa của M12 là NFKC·ligature·casefold cho verify-quote;
                                    hàm của M13 là chuan_hoa_tim NFC·đ→d·chèn cách Hán cho FTS — hai
                                    mục đích, hai hàm, plan M13 T13-0 §3)
M12/spec.md:69 AC-1.4               "POST /job chỉ nhận từ LÕI; THỢ khác gọi ⇒ đỏ"
ADR-08 §Đổi thì 3                   "AC-1.4 + M12-R7 (FROZEN): 'chỉ nhận từ LÕI' → 'chỉ nhận từ cặp đã
                                    khai, mang khoá chiều đó'; L1/L2/AC-4.6 giữ; cổng giữ 6/7 phép
                                    kiểm, đổi một" ⇒ FR — CHƯA AI MỞ (đo 2026-09-09: grep AC-1.4
                                    trong .factory/fr ⇒ chỉ FR-072 nhắc, không FR nào của M12)
```

## 1 · Đổi gì

### 1.1 · Dải Hán — một bảng khai, hai bên đọc

| chỗ | trước | sau |
|---|---|---|
| `spec.md §4.2` mục 2 | *"Dùng đúng dải Hán của `chuan_hoa()` (M13): một hàm, hai chỗ dùng"* | *"Dải Hán đọc từ **`core/assets/dai-han.json`** (M01, FR-077) — **một bảng khai, hai bên đọc** (M12 đếm tỉ lệ định tuyến · M13 chèn cách khi index). Hàm chuẩn hoá mỗi bên một bản đúng mục đích; cổng đối chiếu fixture chung ở `truyhoi/tests/check_doi_chieu_chuan_hoa.py`"* |
| `dinh_tuyen.py` | `_DAI_HAN` tuple gõ cứng | đọc `dai-han.json` lúc nạp module; **0** dải gõ tay |
| `check_dinh_tuyen_ngon_ngu.py` | 10/10 ca định tuyến | + một vế: AST không còn literal dải `0x4E00…`; bảng khai thiếu ⇒ đỏ nói đúng file |
| `model_flow §5` | nợ *"M13 định nghĩa; M12 đọc"* | đóng: chủ bảng khai là **M01** (hai THỢ đọc một file ở LÕI — research M13 §8 G6) |
| `backlog.md:631` | `[ ]` | `[x]` · object: FR-078 + commit áp |

### 1.2 · Ai gọi vào — theo ADR-08, không theo "chỉ LÕI"

| chỗ | trước | sau |
|---|---|---|
| `spec.md AC-1.4` | *"`POST /job` chỉ nhận lời gọi từ LÕI. Một THỢ khác gọi được vào ⇒ đỏ"* | *"`POST /job` chỉ nhận lời gọi từ dịch vụ **có trong `goi_duoc` của `chungcat`** (`dich-vu.json`), mang khoá của **đúng chiều** đó + `x-aud: chungcat`. Ngoài bảng · sai `aud` · thiếu khoá ⇒ 403. Hôm nay `goi_duoc = ["web"]` ⇒ hành vi **y hệt** bản cũ; thêm khách = một phần tử + một khoá, không sửa mã."* |
| `rules.md M12-R7` `vi_phạm` | *"nhận lời gọi từ một THỢ khác"* | *"nhận lời gọi từ dịch vụ ngoài `goi_duoc`, hoặc không kiểm `aud`"* — `đỏ_khi`/`xanh_khi` đổi tương ứng; vế `nguoi_dung_id` **giữ** |
| `api.py _tu_loi()` | so một khoá LÕI | tổng quát `_tu_ai()` đọc `goi_duoc` + `aud` — **cùng khuôn** M13 `T13-4` dùng (`FR-072 §1.2`); hai bên chép khuôn, không import chéo (Z7) |
| `check_chi_loi_goi_tu_loi.py` | 7 phép kiểm | **giữ 6** (thiếu khoá 403 · khoá sai 403 · GET không khoá 403 · L1 · L2 · AC-4.6); **đổi 1**: *"THỢ khác ⇒ 403"* → *"dịch vụ ngoài `goi_duoc` ⇒ 403; dịch vụ trong `goi_duoc` mang đúng khoá ⇒ 2xx"* |

## 2 · Ràng buộc KHÔNG được nới

1. `AC-1.5` nguyên vẹn — `nguoi_dung_id` do LÕI gán, payload mang thì bỏ.
2. `M12-R3` nguyên vẹn — một cửa egress.
3. **Không** cho M12 tự giải quyền theo `nguon[]` (CVE-2026-44560) — chokepoint vẫn ở LÕI/M14; FR này chỉ đổi *ai được gọi vào*, không đổi *ai quyết nguồn*.
4. `T01-51` khai `chungcat.goi_duoc = ["web"]` — **giữ hiện trạng**. Thêm `chatbot`/`truyhoi` vào mảng là quyết định riêng khi có lời gọi thật, không kèm FR này.

## 3 · Cổng — đỏ được

| # | bắt gì | đỏ khi |
|---|---|---|
| D1 | `dinh_tuyen.py` không còn literal dải Hán | grep `0x4E00\|0x3400` trong `chungcat/src` ≥ 1 |
| D2 | xoá `dai-han.json` (fixture tạm) ⇒ tiến trình đỏ nói đúng file, không rơi về dải mặc định | định tuyến vẫn chạy khi bảng thiếu |
| D3 | lời gọi mang `x-aud: chungcat` từ `web` đúng khoá ⇒ 2xx; từ dịch vụ ngoài mảng ⇒ 403; `aud` ≠ `chungcat` ⇒ 403 | một ca sai màu |
| D4 | 6 phép kiểm cũ của `check_chi_loi_goi_tu_loi` vẫn xanh | một cái đỏ |

## 4 · Điều FR này KHÔNG làm

- Không tạo `dai-han.json` — đó là `T01-51` (M01).
- Không sửa `_tu_ai()` của M13 — `T13-4`.
- Không ký `FROZEN.lock` — người ký sau khi team M12 áp.
