# M12_chungcat — workflow

> **KHÔNG dùng trình tự chuẩn hoàn toàn** — vì hai lý do đo được ở §1.
> Phần còn lại theo `/factory:go` PATCH 10 bước như mọi module.

## 1 · Hai chỗ M12 khác trình tự chuẩn

**a · Không có test nào để chạy đỏ trước.** `chungcat/tests/` **rỗng**. Trình tự
chuẩn giả định *test tái hiện ĐỎ trước* (R5) trên một hệ đang chạy. M12 là đất
trắng, nên với mỗi đơn vị việc thứ tự là: **viết cổng → thấy nó đỏ vì thiếu mã →
viết mã**.

⚠️ Cổng đỏ vì `ImportError` **không tính** là đỏ đúng — nó phải đỏ vì **luật**.
Nên cổng phải dựng được fixture tối thiểu **trước khi** mã tồn tại. Đây là bài học
đã trả giá ở `form-van-xuoi.test.js`: cổng đi mù ba lần vì sandbox thiếu thứ nó
cần, và mỗi lần nó vẫn "xanh".

**b · Bảy cửa của `FR-047` chưa có.** Bốn AC (`AC-1.3` · `AC-1.4` · `AC-1.5` ·
`AC-3.3`) đo **hàng ghi vào bảng nháp**, mà cửa ghi đó thuộc M08. Thứ tự **bắt
buộc**: `FR-047 C2` xong ⇒ mới thi công được bốn AC đó. Chia task trước khi cửa có
là chia vào chỗ **không verify được**.

## 2 · Thứ tự trong module — phụ thuộc THẬT, không phải sở thích

```
1. đọc bảng khai: model.json · dia-chi.json · khung-than-bai.json   ← 0 phụ thuộc
2. verify.py   — định vị lại quote                                  ← cần 1
3. adapter/    — một hợp đồng, MỘT nhà trước                        ← cần 2
4. dinh_tuyen.py — đếm tỉ lệ Hán → tra bảng                         ← cần 1
5. egress.py   — một cửa + log TRƯỚC khi gửi                        ← bọc 3
6. vong.py     — Maildir + checkpoint + lan_gui                     ← cần 5
7. api.py      — 3 endpoint                                         ← cần 6
```

**Bước 2 trước bước 3 là cố ý.** Verify quyết định chất lượng cả kho; dựng nó sau
adapter thì có một giai đoạn *chạy được nhưng chưa kiểm*, và giai đoạn đó hay dài
ra vì nó "đã hoạt động rồi".

**Bước 3 chỉ làm MỘT nhà trước.** Hợp đồng `(prompt, tài_liệu) → {text, quotes[]}`
chỉ chứng minh được là *một* hợp đồng khi có **nhà thứ hai** — và nhà thứ hai nên
là một **đơn vị việc riêng**, để `AC-3.1` (*0 dòng ở lõi*) có cái đo thật.

## 3 · Verify sau mỗi đơn vị

```bash
python core/tests/check_g6a.py           # pack còn đủ 8 artifact
python core/tests/check_ba.py            # rule S3 còn trỏ lệnh
python core/tests/check_rule_surfaces.py
# + đúng `cmd` của AC nằm trong đơn vị đó
```

## 4 · Chỗ DỪNG riêng của M12

- job chạm một slug **ngoài** `nguon` đã khai ⇒ dừng, không tự nới
- `lan_gui` chạm **2** ⇒ dừng; **không** tự tạo job mới thay người
- bảng khai model trỏ một nhà **chưa có adapter** ⇒ đỏ ở cổng khai báo, không thử chạy
- một AC đo *hàng trong bảng nháp* mà `FR-047 C2` chưa xong ⇒ **không** chia task đó
