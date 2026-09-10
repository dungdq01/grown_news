# M11_video — model flow

## Entity module này sở hữu

**`Video`** — một hàng `video`. **Không** con trỏ byte.

```
Video
  ├─ khoá            (source_type='video', slug)          ← PK, cùng khuôn
  ├─ frontmatter     JSON nguyên văn — NGUỒN CHÂN LÝ metadata
  │    ├─ ho_so      'thu-vien'
  │    ├─ url        URL người dùng dán, nguyên văn
  │    ├─ url_normalized  normalize_url(url)  ← DANH TÍNH, máy tính
  │    ├─ category []  concepts []
  │    └─ media      VẮNG (schema anyOf [media | url] — đi nhánh url)
  ├─ than            ghi chú ngắn
  └─ version/etag    bookkeeping vòng đời
```

**`url_normalized` là DANH TÍNH, không phải hiển thị.** Nó là khoá gộp theo nguồn
(M03-R5): hai URL cùng một video (`youtu.be/X` và `youtube.com/watch?v=X`) chuẩn
hoá về một, nên chúng hiện thành MỘT bài. Nhận nó từ client là để client quyết hai
video có phải một hay không.

## Quan hệ

| | |
|---|---|
`concepts`/`categories` (M02) | N:N qua VIEW `nhan` |
`recycle` (M08) | 1:N — `source_type` giữ đường về |
`media` (M09) | **không quan hệ** — video không có byte |
`video_host` (`media-mime.json`) | tra cứu: `url_normalized` → `{nhan, nhung, id}` |
`BaiViet` (M03) · `TaiLieu` (M10) | **không quan hệ** — ba bảng độc lập |

Bảng dưới là điều khác `TaiLieu` rõ nhất: `TaiLieu` có một cạnh N:1 tới `media`;
`Video` không có cạnh nào tới byte. Nên `Video` **không** xuất hiện trong
`tham_chieu_media`… **trừ khi** một bản ghi `video` khai `media` (schema cho phép
`anyOf`, không cấm cả hai). ⇒ view `tham_chieu_media` **vẫn phải gồm** nhánh
`video`, và đó là chỗ dễ bỏ sót nhất khi đọc "video không có byte".

## Vòng đời

```
[*] ──POST /api/articles──▶ approved ──PATCH /status──▶ edited / rejected
                               │
                               └──DELETE──▶ recycle ──POST /restore──▶ approved
```

Giống `TaiLieu`. Khác một điều: xoá một `Video` **không** để lại byte mồ côi nào,
nên luật mồ côi của M09 không có việc gì ở đây — miễn `tham_chieu_media` vẫn liệt
nhánh `video` (xem trên).

## Bất biến

1. `source_type` = `'video'`, máy đặt — form không có ô chọn loại.
2. `url_normalized` **do máy tính** bằng `normalize_url()`; cổng 9 của
   `validate.py` canh lời khai khớp hàm tính.
3. `src` iframe dựng từ **hằng `nhung` + id đã khớp `id_mau`**, không bao giờ từ
   `fm.url` (M09-R3).
4. Id xác nhận **hai lần** — lúc vẽ (`idVideo`) và lúc bấm (`nhungVideo`). DOM
   giữa hai thời điểm đó là thứ ai cũng sửa được.
5. `priority` **luôn 0** ⇒ ra khỏi ba pane chất lượng (M09-R4).
6. **Không byte nào của video vào kho** — trần 25 MB là phanh của git, và một
   video vượt nó theo định nghĩa.

## Điều mô hình này KHÔNG bảo đảm

**Nội dung.** Host xoá video thì kho còn metadata, mất nội dung. Đó là đánh đổi
người dùng đã chọn ở FR-037 (*"đăng ký URL, không nới trần"*), và nó là lý do
`one_liner` + `than` của một `Video` **quan trọng hơn** của một `TaiLieu`: chúng là
thứ duy nhất còn lại nếu host mất video.
