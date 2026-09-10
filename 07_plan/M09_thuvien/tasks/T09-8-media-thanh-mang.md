# T09-8 — `frontmatter.media` thành MẢNG (`FR-052` cách 1)

> `FR-052` chốt **cách 1**: một bản ghi giữ được **nhiều** hiện vật, vì `M16`
> sinh slide + giọng đọc + video cho **một** bài mà `media` là **một object**.
>
> Không phải *"không truy vấn được"* — là **"không LƯU được"**. Và nó làm
> `M16-R1` yếu: với một object, **ghi đè là đường mặc định**, thứ xảy ra khi làm
> **đúng** theo schema.

## Đo lại — HAI con số trong `FR-052` SAI

| `FR-052` ghi | đo được |
|---|---|
| *"di trú rẻ vì kho nhỏ"* | ✅ đúng cho **DỮ LIỆU**: 1/3 bản ghi có `media` |
| *(không ghi)* | ⚠️ **23 chỗ đọc** `media` trong **7 file** — đây là chi phí thật |
| *"`gn.js` dư 86 byte"* *(ghi ở plan cũ)* | ❌ **dư 19.918** (82482/102400) — không phải ràng buộc |

⚠️ **`articles.mjs:67` đang CHỦ ĐỘNG chặn mảng**:

```js
media: (fm.media && typeof fm.media === "object" && !Array.isArray(fm.media))
  ? fm.media : null,
```

Đổi schema mà không sửa dòng này ⇒ `media` thành **`null` im lặng** trên mọi bản
ghi. Không lỗi, không cảnh báo — chỉ là hiện vật biến mất khỏi API.

## Phạm vi — chẻ theo module chủ (`M09` là module NGANG)

`M09_thuvien` không sở hữu file mã nào, nên đơn vị này khai theo boundary của
module chủ:

phạm_vi_ghi:
  - 07_plan/M09_thuvien/tasks/T09-8-media-thanh-mang.md   # chính nó — đơn vị ĐIỀU PHỐI
# QUYẾT PM 2026-09-05 (từ 9 lỗi boundary check_g6b): task chạm 4 đất ⇒ đây là
# BUILD-hình-dạng, KHÔNG một PATCH. T09-8 giữ vai GIẤY (phân tích + quyết a-d
# + thứ tự); mã tách theo module chủ, mỗi con trỏ về đây làm căn cứ:
#   T01-46 (M01): validate.py · dung_lai_db · xuat_kho — $.media[*] (vế Z3 chết
#                 người, LÀM ĐẦU TIÊN); frontmatter.schema.json ĐÃ áp FR-052+ký.
#   T08-31 (M08): articles.mjs (4 — có :67 chặn-mảng→null im lặng) ·
#                 dungchung.mjs (3) · cong-module.mjs (1).
#   T03-114 (M03): render/data.mjs · trang.mjs · multiwindow.inline.ts.
# Thứ tự: T01-46 → T08-31 → T03-114 (đường reap chết người đi trước đường đọc).
**Không** chạm: `web/test/**` (đơn vị TEST `T09-8b` — `R1`) ·
`multiwindow.inline.js` (bản build, sinh từ `.ts`).

## Quyết định

**a · MẢNG THUẦN, không `media` + `media_them`.**
Hình dạng lai nghe rẻ hơn (0/23 chỗ vỡ) nhưng nó tạo câu hỏi *"cái nào là
chính?"* — và đó là **hai nơi khai một sự thật** theo một cách tinh vi hơn:
cùng một loại dữ liệu, phân biệt bằng **vị trí**. Dự án đã trúng lớp lỗi này
bốn lần (`bốn builder hình dạng bản ghi`, `LOAI` bốn nơi, hai bản schema, hai
bản `chuan_hoa`).

**b · `minItems: 1` khi có mặt.** `media: []` là một trạng thái vô nghĩa — hồ sơ
`thu-vien` đòi **có** hiện vật. Mảng rỗng phải là **không khai `media`**.

**c · Di trú tại chỗ, một chiều, có đo trước/sau.**
`{...}` → `[{...}]`. Đếm + hash **trước và sau**; lệch ⇒ dừng.

**d · `Z3` là vế chết người, kiểm TRƯỚC khi sửa reap.**
`xuat_kho.py` xoá byte không có trong `tham_chieu_media`. View đó SELECT
`frontmatter` thô nên **không đổi**, nhưng phép **quét JSON** trong luật mồ côi
đọc `$.media.sha256` — với mảng thì đường đó thành `$.media[*].sha256`. Bỏ sót
⇒ **mỗi DELETE phá byte vĩnh viễn**.

## Tiêu chí

verifiability: hard
tiêu_chí:
  - AC1 (Z1): một bản ghi giữ **≥2** hiện vật; hiện vật thứ nhất **không mất**
    cmd: cd web && node test/media-mang.test.js
  - AC2 (Z4): `mime`/`ten_goc`/`so_byte` vẫn chỉ ở **một** nơi
    cmd: cd web && node test/media-mang.test.js
  - AC3 (Z3): luật mồ côi thấy **mọi** `sha256` trong mảng
    cmd: python core/tests/check_media_dan_xuat.py
  - AC4 (Z5): di trú không mất bản ghi — đếm + hash trước/sau khớp
    cmd: python core/tests/check_export_dan_xuat.py
  - AC5: `media: []` bị validate từ chối
    cmd: PYTHONIOENCODING=utf-8 python -m pytest core/tests -q
  - AC6: `articles.mjs` KHÔNG còn `!Array.isArray` chặn mảng
    cmd: cd web && node test/media-mang.test.js
  - AC7: không hồi quy
    cmd: cd web && npm test

## Đỏ TRƯỚC

`R5`: `T09-8b` viết `test/media-mang.test.js` **trước**; nó phải ĐỎ vì schema
còn là object.

## Ký lại `FROZEN.lock`

`core/assets/frontmatter.schema.json` là FROZEN. `FR-052` **đã duyệt** ⇒ ký lại
**sau** khi mọi cổng xanh, và **người** ký.

phụ_thuộc: FR-052 (đã chốt)
