# WO-098 · `_than_theo_khung` nuốt IM LẶNG mục trùng số — mất 108 chữ của bài thật

| | |
|---|---|
| **Loại** | bug (mất dữ liệu) · M12_chungcat |
| **Mức** | `hard` |
| **Mở** | 2026-09-11, lộ ra khi cổng `check_khuon_linh_dong` đỏ sau đợt clear dữ liệu |

## Repro (đo trên bài THẬT trong kho)

```
thân gốc                                   : 1008 chữ
qua `_than_theo_khung`, không thêm gì       : 1008 chữ   ← bất biến, đúng
thêm 2 mục (`## 6. X`, `## 7. Y`, +7 chữ)   : 1015 chữ mong đợi
qua `_than_theo_khung`                      :  907 chữ   ← MẤT 108
```

Mục biến mất: `## 6. Hướng dẫn tích hợp cho Lập trình viên` — **mục của chính
bài gốc**, vì bài thêm vào cũng đánh số 6.

## Nguyên nhân

`noi: dict[str, str]` và `tieu_de: dict[str, str]` **khoá theo SỐ mục**. Hai
`## 6.` ⇒ cái sau đè cái trước, cái trước mất sạch, không một dòng log. Vòng
phát lại mục ngoài khung còn có thêm `da_ra` — cũng khử trùng theo số, nên kể
cả sửa `noi` mà giữ `da_ra` thì vẫn mất.

Số mục là **do model đặt**, không có gì bảo đảm duy nhất. Lấy nó làm khoá từ
điển là giả định sai ngay từ đầu — và nó nằm đúng trong đường mà `WO-077`/
`WO-094` vừa mở ra cho model viết tự do, tức càng tự do càng dễ trùng.

## Kỳ vọng

Không mục nào biến mất. Ô khung lấy lần xuất hiện **đầu tiên** của số ấy; mọi
lần xuất hiện còn lại phát lại ở phần đuôi, đúng thứ tự model viết, giữ tên
tiêu đề riêng của nó.

## Vế đi kèm — vế 9a của cổng đang ĐỎ OAN

`check_khuon_linh_dong` vế 9a ghép thân đã sửa vào frontmatter cũ rồi chạy
`validate` thật. `word_count`/`citations_sampled` là **số dẫn xuất** tính cho
một thân khác, nên vế đỏ vì lệch số đếm chứ không vì phép cấm mục thừa — đúng
cái bẫy chú thích của chính vế ấy đã cảnh báo một lần. Phải chuẩn hoá hai
trường ấy bằng `validate.py --fix` (bộ đếm CỦA CHÍNH `validate`, không tự chế
lại) trước khi đo.
