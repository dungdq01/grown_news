# Lời mời ký — trần `media.so_byte` 25 MB → 1 GB (`FR-054 §9`)

> **Đây là bản vá CHỜ NGƯỜI ÁP.** `core/assets/frontmatter.schema.json` là file
> FROZEN, và deny list chặn agent ghi vào nó. Agent chuẩn bị, **không ký**.
> Nguồn quyền: `FR-054` đã duyệt · quyết (3) của chủ dự án 2026-09-04
> (*"NGƯỜI sẽ ký trần 25MB→1GB khi đơn vị này mời"*).

## 1 · Đổi đúng một số

`core/assets/frontmatter.schema.json` — thuộc tính `media.items.so_byte`:

```diff
           "so_byte": {
             "type": "integer",
             "minimum": 1,
-            "maximum": 26214400
+            "maximum": 1073741824
           }
```

`26214400` = 25 MiB · `1073741824` = 1 GiB. Viết thành SỐ, không thành biểu
thức: JSON không có biểu thức, và một con số tính tay trong mã là chỗ thứ hai
để sai.

⚠️ `core/assets/media-mime.json` cũng có `tran_byte: 26214400` và nó **KHÔNG
frozen** — hai số phải đổi CÙNG LƯỢT, không thì cửa nhận media và schema nói hai
trần khác nhau, và bên nghiêm hơn thắng một cách vô hình.

## 2 · Vì sao cần — và vì sao 1 GB chứ không phải "bỏ trần"

`FR-054 §1.1` chốt **chỉ transcript vào kho, audio KHÔNG**. Nhưng đường
`sinh-transcript` phải ĐỌC ĐƯỢC nguồn qua cửa media (quyết 1a: `GET
/api/articles/media/<sha>`), và một video 30 phút vượt 25 MB dễ dàng.

Không bỏ trần vì trần là thứ duy nhất chặn một lần nạp nhầm. `M12-R9` khai ba
số: **1 GB video · 500 MB audio · 3600 s** — và trần thời lượng là cái chặn thật,
trần byte chỉ chặn ca hiển nhiên.

## 3 · Giá phải trả — SỬA 2026-09-04 theo `FR-060`

⚠️ Ba dòng giá của `FR-054 §9.3` nói về **git-lfs**, và chúng **hết đúng**:
`FR-060` chốt media **không vào git**. Giá thật nay là giá của **chỗ ở local +
Cloudflare R2**:

| | |
|---|---|
| hôm nay · local | 1 GB một video là 1 GB **ổ máy**, và `_backup/` không có bản thứ hai (`ADR-06`) |
| mốc kế · R2 | free **10 GB/tháng** lưu trữ, **egress $0** — đó là điểm bán của R2 |
| CI | **không còn** vấn đề `skip-smudge`: media không vào git thì checkout không tải gì |

⇒ Trần 1 GB **vẫn cần** — nó là trần của **cửa nhận media**, không phải của git,
nên `FR-060` không xoá lý do ký nó. Nhưng ký số này **không** nghĩa là nên nạp
video 1 GB: đường đúng cho video lớn vẫn là **đăng ký URL** (`FR-037`: *"muốn
video 200 MB thì câu trả lời là ĐĂNG KÝ URL, không phải nới trần"*), và
`T12-17` (tải từ URL, đã duyệt) là đường đó.

## 4 · Cách áp

```bash
# 1 · sửa hai số (25 MiB → 1 GiB)
#     core/assets/frontmatter.schema.json  →  media.items.so_byte.maximum
#     core/assets/media-mime.json          →  tran_byte

# 2 · kiểm trước khi ký — phải thấy ĐÚNG hai file lệch
python core/tests/check_frozen.py

# 3 · ký
python core/tests/check_frozen.py --ky

# 4 · nền phải giữ xanh
python -m pytest core/tests -q
python core/src/source_distiller/validate.py kb/ --strict
```

⚠️ Lượt ký M12 `spec.md` + `rules.md` (`FR-054` + `FR-059`) **ĐÃ XONG**
2026-09-04 — `check_frozen` báo *"mọi file frozen khớp baseline đã ký"*. Lượt
này chỉ còn **một** file: `core/assets/frontmatter.schema.json`. Chạy
`check_frozen.py` trước để thấy đúng một file lệch — nhiều hơn một thì có thứ
khác trôi vào, và **đừng ký**.
