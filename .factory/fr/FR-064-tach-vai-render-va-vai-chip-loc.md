# FR-064 — bảng mime: tách vai RENDER khỏi vai CHIP LỌC

- **mở**: 2026-09-05 · **loại**: thêm một khoá bảng khai + nới `phạm_vi_ghi` của `T03-112`
- **module**: M01_core (bảng) + M03_web (ba phép dẫn xuất)
- **trạng thái**: CHỜ CHỦ DỰ ÁN — mã đã xanh, hai file nằm ngoài phạm vi khai

## Vì sao phải mở

`T03-112 AC5` đòi *"trả trần về xanh trước bàn giao"*. Trần đang âm:

```
trang chủ  61981 / 61440   (dư -541)
```

Quy chủ bằng phép đo, ba lần, cùng kết quả:

| bỏ gì | home HTML |
|---|---|
| nguyên trạng | 61981 ⇒ ĐỎ |
| bỏ `.md` + `.txt` (T03-111) | **61433** (dư 7) |
| bỏ 5 dòng video (T01-45, của tôi) | 61981 — KHÔNG đổi |

Hai chip `md`/`txt` là phần vỡ trần. Nhưng `T03-112` khai `phạm_vi_ghi` gồm bốn
file FE, KHÔNG gồm `core/assets/media-mime.json` và `web/render/trang.mjs` —
nên sửa ở đó là ghi ngoài phạm vi (`R1`).

## Vấn đề THẬT, không phải chuyện byte

Một bảng đang gánh **hai vai khác nhau**, và chúng đã tách nhau từ lâu:

```
vai RENDER     mime → content-type khi phục vụ lại · xem trước · magic-byte
vai CHIP LỌC   một nút trong facet "loại nguồn" trên MỌI trang
```

`$vi_sao` của chính `T03-111` nói rõ mục đích của hai dòng đó: *".md/.txt là
NGUYÊN LIỆU chưng cất chính của người dùng — phải XEM ĐƯỢC ngay trong cửa sổ
đọc"*. Đó là vai RENDER. Không dòng nào nói người dùng cần **lọc kho theo định
dạng `.md`**.

Bảng đã có một tiền lệ đúng hình dạng này: `chi_dan_xuat` (`.vtt`) — *"máy sinh,
không phải thứ người nạp"* ⇒ có mime, không có chip. Nhưng lý do của `.vtt` là
*ai tạo ra nó*, còn ở đây là *người có lọc theo nó không* — hai câu khác nhau,
nên một khoá thứ hai chứ không nới nghĩa khoá cũ.

## Đề xuất

Thêm `chip_loc: false` cho `.md` và `.txt`. Ba phép dẫn xuất lọc theo nó:

```
web/render/trang.mjs#laTaiLieu          chip facet + dòng "định dạng nhận"
core/tools/dung_lai_db.py#gieo_loai_nguon   gieo bảng `loai_nguon`
web/test/bon-chieu-facet.test.js        phép đo phải khớp phép dẫn xuất
```

`laTaiLieu` đã là MỘT chỗ cho hai phép dẫn xuất FE (`WO-051` gộp), nên đây là
thêm một vế vào một hàm, không phải rải điều kiện.

**Giữ nguyên mọi thứ khác của `T03-111`**: mime, `xem_truoc: van-ban`, magic
(không có, đã khai là ngoại lệ), đường xem trước trong cửa sổ đọc. Chỉ bỏ hai
cái chip.

## Đo sau khi áp

```
trang chủ  61433 / 61440   (dư 7)      ⇒ AC5 xanh
gn.css     …/102400                     không đổi
```

## Xin duyệt

1. Khoá `chip_loc` và nghĩa của nó (RENDER vs FACET là hai vai).
2. Nới `phạm_vi_ghi` của `T03-112` thêm `core/assets/media-mime.json` ·
   `web/render/trang.mjs` · `core/tools/dung_lai_db.py` ·
   `web/test/bon-chieu-facet.test.js`.
3. Xác nhận với chủ của `T03-111` rằng bỏ chip KHÔNG đụng mục đích họ khai.

**Nếu KHÔNG duyệt**: `AC5` không đạt được trong phạm vi `T03-112`, và trần trang
chủ ở lại âm cho tới khi `T03-111` tự xử hoặc có FR nới trần. Tôi sẽ hoàn nguyên
phần này và bàn giao `T03-112` với `AC5` khai ĐỎ có địa chỉ — không giấu.

· object: `core/assets/media-mime.json` · `web/render/trang.mjs`
  · `core/tools/dung_lai_db.py` · `web/test/bon-chieu-facet.test.js`
