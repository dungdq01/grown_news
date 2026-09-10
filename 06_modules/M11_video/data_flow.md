# M11_video — data flow

## Bảng module này sở hữu

`video` — cùng hình dạng cột với `articles`, CHECK hẹp `source_type = 'video'`.
**Không dòng `media` nào.** Video sống ngoài kho; kho chỉ giữ **địa chỉ**.

## Trường frontmatter module này đọc/ghi

| Trường | Vai | Ai khai |
|---|---|---|
| `source_type` | luôn `video` — máy đặt, form KHÔNG cho chọn | **MÁY** |
| `ho_so` | luôn `thu-vien` | **MÁY** |
| `url` | URL người dùng dán, nguyên văn | **người** |
| `url_normalized` | `normalize_url(url)` — khoá gộp theo nguồn | **MÁY** |
| `one_liner` | câu người đọc thấy trước | **người** |
| `category` · `concepts` | nhãn — cùng cổng danh mục với bài viết | **người**, chọn từ danh mục |
| `media` | **VẮNG** — schema `anyOf [media | url]`, video đi nhánh `url` | — |

`than` **không** phải trường frontmatter — nó là **cột riêng** trong bảng, và nội dung là một ghi chú ngắn (trần 400 từ của hồ sơ `thu-vien`). Ghi ra vì `check_ba.py` bắt đúng chỗ tôi viết sai lần đầu: liệt `than` vào bảng trường frontmatter là khai một thứ schema không có.

## Đường đi của một video

```
URL người dùng dán
  │
  ├─ FE: rút host → có trong `media-mime.json:video_host`?    ← NGAY khi dán
  │      rút id bằng `id_tu` → xác nhận bằng `id_mau`
  │      sai ⇒ báo TẠI CHỖ DÁN, không đợi 422 (M11-R3)
  │
  ├─ người điền: one_liner · slug · category · concepts
  │
  └─ POST /api/articles                ← M08 sở hữu cửa ghi
         validate hồ sơ `thu-vien`
           · miễn cổng mục/dẫn nhập/tinh túy/locator
           · ÁP cổng nhãn 5/5b
           · `url_normalized` = normalize_url(url), MÁY tính (cổng 9)
         → INSERT INTO video           ← bảng của M11
         → banXuat() → kb/video/<slug>.md      (KHÔNG có byte nào)
```

**Không có bước POST byte.** Đó là khác biệt cấu trúc với M10: đường nạp video là
**một** request, đường nạp tài liệu là **hai**.

## Đường ĐỌC và đường NHÚNG

| Ai đọc | Đọc gì | Ghi chú |
|---|---|---|
Màn `/video/` | `GET /api/index?nhom=video` | server lọc |
Kho · Tổng hợp | VIEW `ban_ghi` | được trộn |
Nút play | **không đọc gì** | `src` dựng từ hằng `nhung` + id, tại thời điểm bấm |

Đường nhúng đáng nói riêng:

```
url_normalized  ──idVideo()──▶  { nhan, nhung, id }   ← chỉ khi host ∈ whitelist
                                      │
                       người bấm ─────┤
                                      ▼
                          f.src = nhung + id          ← HẰNG + id, không phải url
```

`fm.url` **không bao giờ** đi vào `src`. Nó là **dữ liệu**; dựng `src` từ dữ liệu
là để người nạp bài chọn máy chủ mà trình duyệt người đọc gọi (M09-R3).

Và id được xác nhận **hai lần**: `idVideo()` lúc vẽ, `nhungVideo()` lúc bấm. Giữa
hai thời điểm đó, `data-vid` trên DOM là thứ ai cũng sửa được bằng devtools.

## Điều module này KHÔNG đọc

Bảng `bai_viet` · bảng `tai_lieu` · bảng `media` (video không có byte) ·
`concepts`/`categories` (đọc qua API danh mục).

## Vì sao video KHÔNG dùng bảng `media`

Trần 25 MB là phanh của **git** — một PPT đã commit nằm trong history mãi. Một
video vượt trần đó theo định nghĩa. Người dùng đã chốt ở FR-037: *"muốn video
200 MB thì câu trả lời là ĐĂNG KÝ URL, không phải nới trần"*
(`media-mime.json:51`).

Hệ quả phải nói ra: **video phụ thuộc host ngoài**. Host xoá video thì kho còn
metadata, mất nội dung. Đó là đánh đổi đã chọn, không phải lỗ — và nó là lý do
`one_liner` + `than` của bản ghi video quan trọng hơn của bản ghi tài liệu: chúng
là thứ **duy nhất** còn lại nếu host mất video.
