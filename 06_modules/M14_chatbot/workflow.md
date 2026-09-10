# M14_chatbot — workflow

> **KHÔNG dùng trình tự chuẩn hoàn toàn** — ba lý do ở §1.
> Phần còn lại theo `/factory:go` PATCH 10 bước.

## 1 · Ba chỗ M14 khác trình tự chuẩn

**a · Đất trắng.** `chatbot/tests/` rỗng. Mỗi đơn vị: **viết cổng → đỏ vì LUẬT →
viết mã**. Đỏ vì `ImportError` không tính.

**b · Hai phụ thuộc CỨNG, và thứ tự giữa chúng là bắt buộc.**
M14 không chạy được nếu **M13 chưa trả đoạn**, và không verify được nếu **M13 chưa
trả `body` đầy đủ** (`M13-R4`: `snippet()` chỉ làm preview). Nên **M13 §5 (truy vấn)
phải xong trước M14 bước 3**.

**c · Một AC là `soft` và sẽ ở `soft` một thời gian dài.** `AC-8.3` (bot hẹp không
trả lời ngoài Knowledge) chỉ dựng được ca thật khi có **hạng bot thứ hai** — mà đó
là `upgrade 2`. Đừng cố làm nó `hard` bằng một fixture giả: một cổng xanh trên
fixture giả tệ hơn một AC khai thẳng là `soft`.

## 2 · Thứ tự trong module

```
1. hợp đồng JSON + enum tu_choi (kiểu, chưa có logic)      ← 0 phụ thuộc
2. verify.py — quote-có-thật + normalize hai phía          ← cần 1
3. chokepoint: bot → tập doc_id, rồi gọi M13               ← cần M13 §5
4. prompt citation-first (đoạn TRƯỚC)                      ← cần 3
5. egress.py — một cửa + log seq TRƯỚC khi gửi             ← bọc 4
6. từ chối hai tầng (CODE trước, MODEL sau)                ← cần 2 + 3
7. api.py — POST /hoi                                       ← cần 6
```

**Bước 2 trước bước 4 là cố ý** — cùng lý do M12: dựng verify sau khi model đã chạy
được thì có một giai đoạn *trả lời được nhưng chưa kiểm*, và giai đoạn đó dài ra vì
nó "đã hoạt động rồi".

**Bước 3 là CHOKEPOINT, và nó phải là MỘT hàm ngay từ đầu.** Không dựng hai đường
rồi hợp nhất sau — Open WebUI có **năm** đường và **ba** đường quên kiểm quyền
(`CVE-2026-44560`); bản vá của họ **bị phá lại** ở `CVE-2026-54019`. Hợp nhất sau
là cách sinh ra đường thứ hai.

**Bước 6 sau bước 2** vì `khong-co-trong-kho` do **code** quyết (M13 trả 0 hàng),
còn `co-nhung-mau-thuan` cần verify địa chỉ — tức cần bước 2.

## 3 · Verify sau mỗi đơn vị

```bash
python core/tests/check_g6a.py
python core/tests/check_ba.py
python core/tests/check_rule_surfaces.py
# + đúng `cmd` của AC trong đơn vị đó
```

## 4 · Chỗ DỪNG riêng của M14

- xuất hiện **đường thứ hai** query kho ⇒ DỪNG ngay, không "hợp nhất sau"
- một block bị **bỏ** thay vì gắn cờ ⇒ DỪNG (đó là chính sách chủ dự án đã chốt)
- định đặt một **ngưỡng bm25** để quyết từ chối ⇒ DỪNG; `0 hàng` thì code biết,
  "điểm thấp" thì không ai biết ngưỡng đúng
- định cho M14 đọc bảng `phien` ⇒ DỪNG (`FR-045` U6)
- định dùng **chung** khoá service-to-service với khoá session ⇒ DỪNG,
  đó là `CVE-2025-41258` và nó cần `FR-047 L3`
