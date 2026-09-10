# WO-038 — mục Tinh túy là MỘT ô văn xuôi, như mọi ô khác

- **loại**: cải tiến (đơn giản hoá hợp đồng)
- **module**: M01_core + M03_web — **hai module**, nên chẻ làm bốn đơn vị
- **mức**: soft (không ai mất dữ liệu; nhưng đổi hợp đồng thân bài)

## Chỉ đạo người dùng

> *"Tinh túy: chúng ta chỉ cần 1 header duy nhất là tinh túy, sau đó tất cả là
> text văn bản gõ vào, giống các ô khác. Các fields như "chuyển giao", "tin
> cậy"… → bỏ hết, giữ đúng trường cha là tinh túy thôi."*

WO-037 vừa biến ô 3.4 thành nhóm ô con (Tên + 5 nhãn) để người dùng khỏi phải
gõ `####` và `- **…**`. Nó **đúng mục tiêu, sai liều lượng**: người dùng không
muốn máy gõ dấu hộ, họ muốn **không có cấu trúc đó nữa**.

## Repro

Mở form viết bài → mục `3.4 Tinh túy` hiện 6 ô: *Tên tinh túy* · *Không hiển
nhiên vì* · *Chuyển giao* · *Tin cậy* · *Bằng chứng* · *Loại*.

## Kỳ vọng

Mục `3.4 Tinh túy` là **một textarea**, gợi ý văn xuôi, y hệt `3.1`/`3.2`/`3.3`.

## Hệ quả đã ĐO, phải nói ra trước khi sửa

**1 · `validate.py` §6 phải bỏ theo, không thì kho từ chối bài của chính form.**
Luật hiện tại (`validate.py:347-357`) đòi mỗi bài có `#### 3.4.x` và mỗi mục đủ
**cả 5** dòng bullet. Giữ luật + bỏ ô = form sinh ra bài **422**. Giá phải trả:
tinh túy thôi được máy kiểm — không còn ép *Bằng chứng* hay *Loại*. Đây là đánh
đổi của yêu cầu, không phải tác dụng phụ ngoài ý muốn.

**2 · KHÔNG phải di trú.** Bài cũ có `#### 3.4.1` vẫn đọc được nguyên vẹn như
văn xuôi: `chiaKhuc()` chỉ khớp `^###\s*\d\.\d\s` và `^##\s*\d\s*\.`, mà `####`
không khớp cái nào (sau `###` là `#`, không phải khoảng trắng). Đo trên
`kb/docs/xgboost-taylor-bac-hai.md` — bài duy nhất trong kho có `####`.

**3 · `locator` của 3.4 GIỮ.** Luật §7 (*mọi khẳng định phải có địa chỉ*) là
luật khác và áp cho văn xuôi cũng được. Người dùng không nói bỏ nó.

**4 · Lợi phụ đo được: trả lại ~2 KB cho `gn.js`.** `themTinhTuy` +
`gomTinhTuy` + `raiTinhTuy` + nhánh `TT_O` biến mất. Bundle đang 102314/102400,
dư 86 byte.

## Đơn vị việc

| # | đơn vị | module | ghi vào |
|---|---|---|---|
| T01-39 | TEST | M01 | `core/tests/check_khung.py` |
| T01-40 | CODE | M01 | `khung-than-bai.json` · `khung.py` · `validate.py` |
| T03-86 | TEST | M03 | `web/test/{form-van-xuoi,khung-8-o}.test.js` |
| T03-87 | CODE | M03 | `multiwindow.inline.ts` · `.js` |

`khung-than-bai.json` **không** nằm trong `FROZEN.lock` (đã kiểm) ⇒ không cần FR.
