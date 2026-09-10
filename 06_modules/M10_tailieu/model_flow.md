# M10_tailieu — model flow

## Entity module này sở hữu

**`TaiLieu`** — một hàng `documents` + con trỏ vào một dòng `media`.

```
TaiLieu
  ├─ khoá          (source_type='tai-lieu', slug)     ← PK, cùng khuôn articles
  ├─ frontmatter   JSON nguyên văn — NGUỒN CHÂN LÝ metadata
  │    ├─ ho_so    'thu-vien'  (schema đòi)
  │    ├─ media    { sha256, mime, ten_goc, so_byte } ← con trỏ, KHÔNG phải byte
  │    ├─ category []  concepts []                    ← cùng danh mục với bài viết
  │    └─ url      'kho://tai-lieu/<slug>'
  ├─ than          ghi chú ngắn (≤400 từ)
  └─ version/etag  bookkeeping vòng đời (If-Match)
```

**Byte KHÔNG thuộc entity này.** Nó sống trong `media` (M09 sở hữu), địa chỉ theo
nội dung. Nhiều `TaiLieu` **được phép** trỏ cùng một `sha256` — cùng file nạp hai
lần chỉ tốn chỗ một lần, và đó là tính chất của địa chỉ-theo-nội-dung, không phải
lỗi trùng.

## Quan hệ với các entity khác

| | |
|---|---|
`media` (M09) | N:1 — nhiều `TaiLieu` có thể trỏ một `sha256` |
`concepts`/`categories` (M02) | N:N qua VIEW `nhan` — **không** bảng nối riêng |
`recycle` (M08) | 1:N — xoá đẩy snapshot sang đó, `source_type` giữ đường về |
`article_versions` (M02) | 1:N — chưa dùng cho tài liệu ở v1, nhưng khoá đã sẵn |
`BaiViet` (M03) · `Video` (M11) | **không quan hệ** — ba bảng độc lập |

## Vì sao `recycle` và `article_versions` KHÔNG tách theo module

`source_type` **đã tự phân biệt** bảng gốc: `tai-lieu`→`documents`,
`video`→`videos`, còn lại→`articles`. Tách ba là thêm sáu bảng để mã hoá một
thông tin đã có, và `chuyenSangRac()`/`phucHoi()` phải nhân ba.

Hệ quả phải nhớ: luật MỒ CÔI của `media` hợp UNION **ba** tập tham chiếu —
`ban_ghi` (view của ba bảng) + `article_versions` + `recycle`. Bỏ sót một là mỗi
DELETE phá byte vĩnh viễn, và `phucHoi()` sau đó **vẫn báo thành công** (M09-R1).

## Vòng đời

```
(chưa có) ──POST──▶ approved ──PATCH /status──▶ rejected/draft/edited
                       │
                       └──DELETE──▶ recycle ──POST /restore──▶ approved
```

`taoBai` đặt `approved` (FR-033 bỏ hàng đợi) — **một literal duy nhất**, và
`api-guard` răng 5 canh nó chỉ ở `taoBai`. Màn này **không** được có literal
trạng thái riêng.

## Bất biến

1. `media.sha256` khai mà không có byte ⇒ **không COMMIT** (kiểm ở
   `ghiSauValidate`, M09-R1).
2. `sha256`/`so_byte` **do máy tính**, tham số cùng tên gửi kèm bị bỏ qua (M09-R2).
3. Sửa `TaiLieu` **không đổi** `media.sha256` trừ khi người dùng thay file — và
   form phải **nhìn thấy** trường đó, không dựa vào `FM_GOC` (M10-R2).
4. `priority` của `TaiLieu` **luôn 0** (không có `skill_candidates`) ⇒ nó ra khỏi
   ba pane chất lượng (M09-R4).
