# M13_truyhoi — workflow

> **KHÔNG dùng trình tự chuẩn hoàn toàn** — hai lý do ở §1.
> Phần còn lại theo `/factory:go` PATCH 10 bước.

## 1 · Hai chỗ M13 khác trình tự chuẩn

**a · Đất trắng, không có test để chạy đỏ trước.** `truyhoi/tests/` **rỗng**. Thứ
tự cho mỗi đơn vị: **viết cổng → thấy nó đỏ vì LUẬT → viết mã**. Cổng đỏ vì
`ImportError` **không tính**.

**b · Một phụ thuộc bên ngoài phải xong TRƯỚC bước 1.** `chuan_hoa()` chưa có bản
Python nào — đo 2026-09-02: `grep NFD|unicodedata|combining` trong `core/` +
`05_intake/` ⇒ **0**. Luật ASCII-fold chỉ tồn tại bằng **JavaScript**. Nên bản
Python của M13 là **bản thứ hai của một luật**, và `AC-2.2` (cổng đối chiếu hai
bản) phải dựng **cùng lúc** với hàm, không phải sau.

⚠️ Dựng hàm trước, cổng sau ⇒ có một giai đoạn hai bản trôi mà không ai biết —
đúng lớp lỗi đang làm `check_danh_muc` đỏ lúc này.

## 2 · Thứ tự trong module

```
1. chuan_hoa() + bảng khai dải Hán + cổng đối chiếu với slugGoiY   ← 0 phụ thuộc
2. parse heading → chunk (file · heading · anchor · line_start/end) ← cần 1
3. DDL chunks + chunks_fts + BA trigger _ai/_ad/_au                 ← cần 2
4. dựng chỉ mục + re-index tăng dần (mtime → sha256 → checksum)     ← cần 3
5. truy vấn: MATCH + JOIN facet + tập nguồn (MỘT câu SQL)           ← cần 4
6. bm25 w_title — ĐO, hai số (vi/en và zh)                          ← cần 5
7. golden.yaml + cổng phủ ca                                        ← cần 5
8. api.py — POST /truy-hoi                                          ← cần 5
```

**Bước 1 trước tất cả là bắt buộc, không phải sở thích.** Anchor sinh ở bước 2 dùng
hàm của bước 1; nếu bước 1 sai thì mọi địa chỉ trong chỉ mục sai, và sửa sau nghĩa
là **dựng lại toàn bộ chỉ mục** — rẻ (chỉ mục là dẫn xuất), nhưng mọi trích dẫn
chatbot đã phát ra thì **chết**.

**Bước 6 là ĐO, không phải chọn.** Đừng chép `1000/500/1` của `zk` — số đó cho
*filename-là-tiêu-đề*. Bắt đầu `w_title = 5..10` rồi chạy golden set và **đọc số**.

**Bước 7 song song được với 6**, và nên vậy: golden expect **địa chỉ**, không expect
điểm, nên nó **không đỏ** khi bước 6 chỉnh số.

## 3 · Verify sau mỗi đơn vị

```bash
python core/tests/check_g6a.py
python core/tests/check_ba.py
python core/tests/check_rule_surfaces.py
# + đúng `cmd` của AC trong đơn vị đó
```

## 4 · Chỗ DỪNG riêng của M13

- hai bản luật anchor lệch nhau ⇒ **DỪNG**, không sửa một bên cho khớp bên kia
  trước khi biết bên nào đúng
- bảng thường và `chunks_fts` lệch số hàng ⇒ DỪNG (xoá FTS sai cách là hỏng
  **im lặng**)
- một golden entry expect **điểm** thay vì địa chỉ ⇒ DỪNG, sửa golden
- định thêm vector/embedding ⇒ DỪNG: `FR-043` chưa khai bậc nào cho truy hồi,
  cần FR trước
