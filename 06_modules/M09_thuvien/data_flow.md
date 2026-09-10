# M09_thuvien — data flow

## Trường frontmatter module này đọc/ghi

| Trường | Vai | Ai khai |
|---|---|---|
| `ho_so` | `phan-tich` \| `thu-vien` — **thiếu ⇒ `phan-tich`** nên không bài cũ nào phải sửa | người nạp |
| `media.sha256` | khoá vào bảng `media`, 64 hex | **MÁY** tính từ byte |
| `media.mime` | enum ĐÓNG 5 giá trị (pdf · pptx · docx · ppt · doc) | client khai, máy kiểm magic-byte |
| `media.ten_goc` | chỉ để HIỆN, ≤200 ký tự — **không bao giờ là đường dẫn** | client |
| `media.so_byte` | ≤26214400 | **MÁY** đo |
| `url` | với video là URL thật; với tài liệu tải lên là `kho://tai-lieu/<slug>` | người nạp / máy |
| `url_normalized` | dẫn xuất từ `url` bằng `normalize_url()` | máy |
| `category` · `concepts` | nhãn — **cùng cổng danh mục với bản phân tích** | người nạp |

`url` **không** phải thành có-điều-kiện: `validate.py:162` dựng
`Draft202012Validator(schema)` **không có `format_checker`**, nên `format: uri` chưa bao
giờ được kiểm — `kho://tai-lieu/<slug>` hợp lệ ngay hôm nay, và `normalize_url()`
(`:111` strip mọi `scheme://`) xử lý được nó tất định.

## Đường đi của một hiện vật

```
byte người dùng
  │
  ├─ POST /api/articles/media ─ content-length kiểm TRƯỚC khi đọc byte (413 nếu quá)
  │                           ─ magic-byte khớp mime khai? (lớp thứ SÁU của intake)
  │                           ─ sha256 = MÁY tính
  │                           ─ giaoDich: INSERT OR IGNORE INTO media  (dedup miễn phí)
  │                           ─ banXuat()                              (api-guard răng 3)
  ▼
kb/_media/<sha256>.<ext>   byte thô, KHÔNG manifest
  │                        metadata đã ở articles.frontmatter.media,
  │                        mà dung_lai_db.py vốn đã đọc
  ▼
POST /api/articles   { frontmatter: { ho_so: "thu-vien", media: {...} } }
  │                  ─ cửa ghi kiểm CON TRỎ: sha256 có trong bảng media?
  │                                          so_byte khớp byte thật?
  ▼
articles (source_type, slug)  ─VIEW nhan─▶  đếm nhãn (không cần sửa gì)
                              ─khoDoc()─▶   ~40 chỗ filter/reduce trong trang.mjs
```

## Nơi dữ liệu có thể MẤT, và ai canh

| Chỗ | Cơ chế mất | Canh bởi |
|---|---|---|
byte mồ côi bị reap khi `recycle` còn trỏ | tập tham chiếu thiếu một bảng | **M09-R1** · `check_media_dan_xuat.py` |
`.md` khai `sha256` mà thiếu byte | `dung_lai_db.py` dựng tiếp thay vì exit≠0 | **M09-R1** |
byte trong DB mà không trong export | `xuat_kho.py` chỉ ghi `.md/.yaml/.jsonl` | `bam_cay()` phải hash cả `_media` |
`bam_noi_dung` bỏ qua `media` | round-trip xanh giả | thêm `("media","sha256","sha256")` — **hash KHOÁ**, vì `sha256` *là* hash nội dung |

## Cái KHÔNG đổi

`ghiSauValidate` · `giaoDich` · `etagCua` · `tuanTu` · `chuyenSangRac` · `phucHoi` —
một cửa ghi, và bản ghi thư viện đi qua đúng cửa đó. Byte là một **transaction riêng,
sớm hơn**, và đầu ra duy nhất của nó là một `sha256` mà bản ghi sau đó khai.
