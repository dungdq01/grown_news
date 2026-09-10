# T12-22 — nguồn dài: cắt đoạn, gửi từng đoạn, gộp lại

> `FR-065` lối **A**, chủ dự án chốt 2026-09-05:
> *"Nguồn dài thì chia đoạn ra send xong gộp lại. Bản chất là chunk và concat
> chứ có phải gửi đi gửi lại 1 request đâu mà vi phạm."*
>
> ID: M12 dev lấy 20-29. Max dev = 21 ⇒ 22.

## Ranh giới `M12-R6` sau quyết định này

`M12-R6` là trần **THỬ LẠI**, không phải trần số mảnh của một lần thử. Căn cứ
nằm trong chính rule: `why` viết *"Một vòng retry 'cho chắc'…"* và `đỏ_khi` mô
tả *"giả lập model lỗi liên tục"* — cả hai đều nói về LẶP LẠI cùng một payload.

Đọc nó theo nghĩa "số lần ra" thì nó biến thành **trần độ dài nguồn**: một
nguồn 60 phút tự chạm trần ngay lần thử đầu tiên, chưa hỏng lần nào. Đó không
phải thứ `M12-R6` được dựng lên để chặn.

Nên:

| đếm | ai tăng | trần |
|---|---|---|
| `lan_gui` — số lần THỬ phiên âm một job | vòng ngoài, **một lần cho cả lần thử** | 2, không reset |
| dòng `egress.jsonl` | **mỗi đoạn một dòng**, `sha256` riêng | không trần — nó là sổ, không phải cổng |

`AC-6.1` không đổi một chữ: số byte rời máy vẫn đếm đúng từng byte.

## Hình dạng

- `thoi_luong()` đọc bằng `ffprobe`; `cat_doan()` cắt mỗi `GIAY_MOI_DOAN` = 10
  phút, mỗi đoạn nén sẵn mono 16 kHz mp3 32k.
- **Không chồng lấn.** Chồng lấn thì phần chồng được phiên âm hai lần và phải
  khử trùng — mà khử trùng trên văn bản model sinh là ĐOÁN, đoán sai thì xoá
  chữ thật. Không chồng lấn thì mất cùng lắm một từ vắt ngang ranh, và mất ở
  chỗ đoán trước được.
- `_phien_am_mot_doan(moc=…)` **cộng `moc`** vào mỗi cue. Đây là vế dễ sai nhất
  và sai thì không ai thấy: quên cộng thì bản 25 phút có ba lần chạy lại từ 0
  giây — file `.vtt` vẫn hợp lệ, vẫn mở được, và sai hoàn toàn.
- 10 phút chọn theo phép đo, không theo cảm giác: nguồn 19 phút không-stream
  chạy trọn (14.382 completion token), nên 10 phút nằm trong vùng đã đo được.

phạm_vi_ghi:
  - chungcat/src/asr_cua.py       # `thoi_luong` · `cat_doan` · `_phien_am_mot_doan`
# Cổng `chungcat/tests/check_cat_doan_audio.py` thuộc ĐƠN VỊ TEST `T12-8`.

verifiability: hard
tiêu_chí:
  - AC1: 25 phút / 10 phút ⇒ 3 đoạn, mốc bắt đầu 0 · 600 · 1200
    cmd: python chungcat/tests/check_cat_doan_audio.py
    đỏ_khi: sai số đoạn hoặc sai mốc
  - AC2: nguồn ngắn hơn một đoạn ⇒ 1 đoạn, không cắt vô ích
    cmd: python chungcat/tests/check_cat_doan_audio.py
  - AC3: mốc cue DỜI theo vị trí đoạn; dòng thời gian gộp lại TĂNG DẦN
    cmd: python chungcat/tests/check_cat_doan_audio.py
    đỏ_khi: đoạn thứ hai trở đi bắt đầu lại từ 0
  - AC4: mỗi đoạn đúng một lời gọi cửa
    cmd: python chungcat/tests/check_cat_doan_audio.py
  - AC5: KHÔNG đếm `lan_gui` bên trong vòng lặp đoạn — một lần THỬ là một lần
    cmd: python chungcat/tests/check_cat_doan_audio.py
    đỏ_khi: bộ đếm thử-lại tăng theo số đoạn ⇒ R6 thành trần độ dài nguồn
  - AC6: nền giữ xanh
    cmd: python -m pytest core/tests -q
