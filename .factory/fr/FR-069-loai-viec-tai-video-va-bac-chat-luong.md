# FR-069 — `loai` việc thứ tư `tai-video`, và bậc chất lượng

- **mở**: 2026-09-07 · **người quyết**: chủ dự án (*"backend tải video theo
  chất lượng"* — giao `T12-26`; và *"phải có tab hiển thị tiến trình tải"* —
  `T12-27`) · **trạng thái**: **CHỜ CHỦ DỰ ÁN DUYỆT**
- **artifact chạm (FROZEN)**:
  `06_modules/M12_chungcat/spec.md` · `06_modules/M12_chungcat/rules.md`
- **liên đới**: nối tiếp `FR-054` (thêm `sinh-transcript`). FR này thêm **loại
  việc thứ tư**, và một loại việc là một hợp đồng, không phải một chi tiết
  thi công.

## 0 · Vì sao FR, chứ không phải một dòng sửa

Mã đã chạy thật trên máy chủ dự án 2026-09-06/07: tải được 360p/480p/720p/
1080p/goc, tiến độ hiện tại chỗ, file tự lưu về máy. **Nhưng `spec.md` không
biết gì về nó.**

Đo 2026-09-07:

```
grep -i "tai-video"   06_modules/M12_chungcat/spec.md  ⇒ 0
grep -i "chat_luong"  06_modules/M12_chungcat/spec.md  ⇒ 0
```

Một loại việc chạy trong sản xuất mà hợp đồng không nhắc là chỗ **dễ nhầm
nhất**: người đọc spec để biết hệ làm gì sẽ đếm thiếu một loại, và người sửa
`BANG_LOAI` sẽ tưởng ba loại là đủ. Chủ dự án nói đúng chỗ này —
*"quan trọng cần vá lại các FR và spec ấy, không lại dễ nhầm lẫn"*.

## 1 · Thêm gì vào `spec.md`

### 1.1 · `loai` thứ tư

| `loai` | Vào | Ra | Tiêu tiền |
|---|---|---|---|
| `chung-cat-mot-nguon` | slug + byte | bản nháp | model |
| `sinh-transcript` | slug video | `.vtt` gắn bản ghi | ASR |
| `tong-hop` | nhiều slug | bản tổng hợp | model |
| **`tai-video`** *(MỚI)* | slug video URL + `chat_luong` | **file mp4 ở thư mục tạm NGOÀI kho** | **băng thông, 0 model** |

`tai-video` khác ba loại kia ở một điều đáng khai thành chữ: **nó không gọi
model**. Nên `M12-R2` (không tự duyệt) và trần `M12-R6` (2 lần gửi) áp cho nó
theo nghĩa *egress*, không theo nghĩa *token*.

### 1.2 · Bậc chất lượng là THẬT, không transcode

Host giữ sẵn các bậc; `yt-dlp -f` **chọn** bậc lúc tải. Ta không dựng bậc.
Dựng bậc nghĩa là transcode: tốn CPU, mất chất lượng, và cho ra một file
**không phải** thứ nguồn có — mà vẫn mang tên nguồn.

Hệ quả phải khai: **MP4 người TẢI LÊN không đi đường này.** Nó chỉ có một bản
gốc; bày một bậc cho nó là hứa một thứ không tồn tại.

### 1.3 · Kết quả KHÔNG vào kho

Một video là hàng trăm MB (đo thật: `goc` = **463 MB**, 1080p = 443 MB). Nhét
vào kho là đầy lfs sau vài lần bấm — bài học `FR-054 §9.3` đã trả giá một lần.

```
thư mục:  $CHUNGCAT_XUAT_TAM, mặc định %TEMP%/gn-xuat-tam   (NGOÀI repo)
tên:      <viec_id>-<bậc>.mp4                                (viec_id = uuid4().hex, 32 hex)
hạn:      tran_xuat_tam_gio = 72 (bảng khai) — worker dọn ĐẦU mỗi vòng
lọc dọn:  theo KHUÔN TÊN, không chỉ theo tuổi — `%TEMP%` là nhà chung
```

### 1.4 · Tiến độ

`GET /viec/<id>` trả `tien_do` cho `tai-video` **cùng khoá** với
`sinh-transcript` nhưng **khác hình dạng**: `{phan_tram, tong, toc_do,
con_lai, chat_luong}`. Bên đọc rẽ theo **hình dạng dữ liệu**, không theo tên
việc.

## 2 · Thêm gì vào `rules.md`

- **`M12-R8` (mới):** *kết quả `tai-video` KHÔNG được ghi vào `kb/`.* Bề mặt:
  `S3` — cổng `check_tai_video_chat_luong.py` vế 5b đo đường trả về nằm NGOÀI
  repo.
- **`M12-R9` (mới):** *dọn thư mục tạm phải lọc theo khuôn tên của chính hệ.*
  Bề mặt: `S3` — vế 6c dựng một file "của người khác" và đòi nó còn nguyên.

Hai rule này viết ra vì cả hai đều là chỗ một lần cẩu thả xoá dữ liệu người
khác hoặc làm phình kho — loại lỗi không tự lộ ra.

## 3 · Cửa web nằm ở M08, không ở M12

`GET /api/tai-video/<viec_id>` sống ở `web/api/**` — ngoài boundary
`chungcat/**`. Đã tách thành **`T08-34`**; `check_g6b` bắt đúng chỗ này và
việc tách là hệ quả, không phải lựa chọn.

## 4 · Đơn vị đã thi công (as-built)

| | |
|---|---|
| `T12-26` | job `tai-video`, bậc thật, thư mục tạm, dọn theo hạn |
| `T12-27` | tiến độ số + `Popen` đọc từng dòng + cửa `/viec` trả `tien_do` |
| `T08-34` | cửa stream file, tên người đọc được, 404 phân biệt *chưa xong* / *hết hạn* |
| `T03-121` | hàng bậc trong menu, tiến độ tại chỗ, tự lưu về máy |

## 5 · Bằng chứng đóng

- `python chungcat/tests/check_tai_video_chat_luong.py` — 16 vế
- `python chungcat/tests/check_tien_do_tai_video.py` — 13 vế
- chạy thật 2026-09-07: job `xong` · file 35 999 267 B · `ftyp` hợp lệ ·
  tiến độ `69.2% của 45.17MiB · 38.79MiB/s` · trình duyệt tự lưu
- `<freeze-check> --ký` sau khi FR duyệt (spec + rules M12 đang FROZEN)

## 6 · Chưa làm, nói rõ

- **`--that` của E2E chưa bật** — ô backlog riêng, không thuộc FR này.
- **`POST /api/job` nhận thân rỗng `{}` và trả 201** — nợ M08 đã mở; nó ảnh
  hưởng cả `tai-video` vì cửa không kiểm `loai` ∈ `BANG_LOAI`.
