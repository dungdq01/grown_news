# M11_video — module VIDEO: đăng ký URL, không tải file

> Nguồn đối chiếu: `core/assets/kho.schema.sql` (bảng `video`) ·
> `core/assets/media-mime.json` (`video_host`) · `core/assets/loai-nguon.json`

| | |
|---|---|
| **Mở bởi** | FR-038 — *"module bài viết tách biệt với video / tài liệu"*, và `upgrade.md:83-99` *"url video (tiktok, youtube)"* |
| **Sở hữu** | bảng `video` · màn `/video/` · màn nạp `/video/nap/` · CRUD tại chỗ của video |
| **Vào** | một URL YouTube/TikTok · một câu tóm tắt · nhãn `category`/`concepts` |
| **Ra** | một hàng `video` (`source_type: video`, `ho_so: thu-vien`) — **URL HOẶC byte**, đúng `anyOf [media \| url]` của schema (§2.1). Đăng ký bằng URL là đường THƯỜNG; tải file lên là đường của `FR-054 §8.1` (giữ file gốc trong kho) và của lối `file-nguoi-tai` mà M12 dùng để sinh transcript. — *sửa theo `FR-075 §2`, 2026-09-09* |
| **KHÔNG sở hữu** | whitelist host + regex id (M09 — `media-mime.json:video_host`) · nhúng iframe (M09 — `idVideo`/`nhungVideo`) · cửa ghi DB (M08) |

---

## 1 · Vì sao module này là màn LÀM MỚI, không phải màn tách ra

Đo được: **không có đường tạo video nào tồn tại**. Không tab nạp video, không hàm
nào POST `source_type: "video"`. Grep `"video"` trong `shell.html` ra đúng hai
chỗ: một `<option>` trong select 7 loại (`:610`) và một comment CSS (`:159`).

Tức đăng ký một video hôm nay = mở **form viết bài 8 ô**, chọn loại `video` trong
dropdown, rồi **viết thân bài theo khung 5 mục** cho một video mình chưa xem xong.
Cổng `phan-tich` đòi đủ mục · dẫn nhập ≤25% · tinh túy · locator ở bốn chỗ.

Phần video **đã có** chỉ là **xem**: `idVideo()` (`multiwindow.inline.ts:1170`) rút
id từ `url_normalized` theo whitelist, `nhungVideo()` (`:1219`) dựng iframe
click-to-load. Hạ tầng xem xong; đường vào thì chưa có.

## 2 · Business logic

### 2.1 · Bảng `video` — không byte, nên khác `documents` ở một chỗ

Cùng hình dạng cột với `articles`, CHECK hẹp `source_type = 'video'`.

Khác `documents` ở **thứ nó phải có**: `documents` đòi `media` (byte trong kho);
`video` đòi `url_normalized` (địa chỉ ngoài kho). Schema đã khai điều đó —
`frontmatter.schema.json` nhánh `ho_so: thu-vien` là `anyOf [media | url]`.

**Vì sao đăng ký URL chứ không tải file**: người dùng chốt ở FR-037 — *"muốn video
200 MB thì câu trả lời là ĐĂNG KÝ URL, không phải nới trần"*
(`media-mime.json:51`). Trần 25 MB là phanh của git, và một video vượt nó theo
định nghĩa.

> **AC-2.1.1** · Hàng `video` chỉ nhận `source_type = 'video'`; bản ghi `video`
> thiếu **cả** `media` **và** `url_normalized` bị chặn ở cổng validate.
> `hard` · `cmd: python core/tests/check_ba_bang.py`

### 2.2 · Màn `/video/` — danh sách + CRUD tại chỗ

Chỉ đọc bảng `video`, **không** trộn. CRUD trên chính màn này.

Thẻ video khác thẻ tài liệu ở phần **xem trước**: một nút play click-to-load, không
một khung nhúng. Mở màn **không gọi ra mạng ngoài** — đây là M09-R3, và nó là luật
nặng nhất vì nhúng video là lần đầu sản phẩm gọi ra ngoài.

> **AC-2.2.1** · Màn `/video/` chỉ hiện bản ghi `video`; gieo thêm bài viết và tài
> liệu thì số đếm của màn KHÔNG đổi.
> `hard` · `cmd: cd web && node test/man-video.test.js`

> **AC-2.2.2** · Mở màn `/video/` với N bản ghi ⇒ **0 request** ra host ngoài;
> `src` iframe chỉ tồn tại sau khi người đọc bấm.
> `hard` · `cmd: cd web && node test/man-video.test.js && node test/no-leak.test.js`

### 2.3 · Màn nạp `/video/nap/` — validate URL TRƯỚC khi ghi

```
Dán URL     [https://www.youtube.com/watch?v=____________]
            ↓ ngay khi dán
            ✓ youtube · id dQw4w9WgXcQ        ← hoặc ✕ host không nằm trong danh sách
Một câu     [_______________________________]
Chủ đề [☐ …]   Khái niệm [☐ …]
                                        [ Ghi vào kho ]
```

**Kiểm host + id ở FE ngay khi dán**, không đợi `422` từ server. Lý do cùng loại
với `file.size` của tài liệu: người dùng gặp lỗi ở chỗ họ vừa gõ, không ở chỗ họ
vừa bấm.

Và `url_normalized` **do máy tính** bằng `normalize_url()` — không nhận từ client.
Hai URL cùng một video (`youtu.be/X` và `youtube.com/watch?v=X`) chuẩn hoá về một,
nên gộp theo nguồn (M03-R5) không bị thổi số.

> **AC-2.3.1** · URL host ngoài whitelist bị chặn **ở FE** (không đợi server);
> `url_normalized` do `normalize_url()` sinh, không lấy từ client.
> `hard` · `cmd: cd web && node test/man-video.test.js`

> **AC-2.3.2** · Form nạp có ô chọn `category` + `concepts` từ danh mục; nhãn
> ngoài danh mục bị chặn.
> `hard` · `cmd: cd web && node test/man-video.test.js`

## 3 · Công thức

`url_normalized = normalize_url(url)` — dùng lại M01, không viết bản thứ hai
(M05-R3). Id nhúng rút bằng `id_tu` rồi xác nhận bằng `id_mau`, cả hai từ
`media-mime.json:video_host`.

`priority` **luôn 0** như tài liệu ⇒ ra khỏi ba pane chất lượng (M09-R4).

## 4 · Điều module này CẤM

- **Không** đọc/ghi bảng `bai_viet` hay `tai_lieu`.
- **Không** dựng `src` iframe từ `fm.url` — chỉ từ whitelist host + regex id
  (M09-R3).
- **Không** nhúng video khi mở trang — click-to-load, luôn.
- **Không** nhận `url_normalized` từ client.
- **Không** tải byte video vào kho — trần 25 MB là của tài liệu, không phải chỗ
  để lách.

## 5 · Trạng thái

⬜ **chưa dựng** — spec này là hợp đồng của C0 (FR-038). Thi hành ở C2→C7.
