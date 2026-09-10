# M16_artifact — workflow

> **KHÔNG dùng trình tự chuẩn hoàn toàn** — ba lý do ở §1.
> Phần còn lại theo `/factory:go` PATCH 10 bước.

## 1 · Ba chỗ M16 khác trình tự chuẩn

**a · Đất trắng.** `artifact/` chỉ có README.

**b · Module DUY NHẤT ghi vào kho hiện vật, nên fixture phải ở thư mục TẠM.**
`M16-R1` cấm xoá **và ghi đè** byte. Một cổng test chạy trên `kb/_media/` thật là
đúng thứ luật đó cấm. Mọi fixture của M16 dựng một `KB_DIR` tạm, và cổng phải
**chứng minh** nó không chạm `kb/` thật (đo `sha256` trước/sau).

**c · Engine CHƯA CHỐT — và đó là trạng thái hợp lệ.**
`research_summary` §10 tự khai M16 *"giữ mức phác"*. Spec chốt **luật**, không chốt
engine. Nên thứ tự phải là: **bảng khai + cổng trước, engine sau** — ngược với thói
quen "chạy được một cái đã rồi khai sau".

⚠️ Dựng engine trước rồi khai bảng sau thì bảng sẽ được viết **để mô tả cái đã làm**,
và cột `gioi_han` (thứ cứu người dùng khỏi *"PPTX của Marp là ảnh"*) sẽ trống — vì
lúc đó chưa ai vấp.

## 2 · Thứ tự trong module

```
1. engine.json — loai · engine · khu_vuc · du_phong · GIOI_HAN · nguon + ngay tra  ← 0 phụ thuộc
2. cổng khai báo: thiếu gioi_han ⇒ đỏ · du_phong chéo khu vực không cờ ⇒ đỏ        ← cần 1
3. hàng đợi job bất đồng bộ + idempotency (khuôn ULID của M12)                     ← cần 1
4. dựng-ở-tạm → os.replace vào _media/ + ghi media qua cửa ghi LÕI                 ← cần 3
5. MỘT engine trước (đề xuất: piper LOCAL — 0 byte rời máy, không cần khoá)        ← cần 4
6. nhúng địa chỉ vào METADATA + cổng đọc lại metadata                              ← cần 5
7. egress.py — chỉ khi thêm engine CLOUD                                           ← cần 5
8. api.py                                                                          ← cần 6
```

**Bước 5 chọn `piper` local trước là cố ý.** Nó không cần khoá, không gửi gì ra
ngoài, nên bước 4 và 6 kiểm được **trọn vẹn** trước khi có bất kỳ đường egress nào.
Làm cloud trước thì mỗi lần chạy test là một lần **toàn văn một bài rời khỏi máy**.

**Bước 7 tách riêng** vì nó đổi hạng: từ *0 byte rời máy* sang **bậc 4**. Nó xứng
đáng một đơn vị việc riêng và một lần review riêng.

## 3 · Verify sau mỗi đơn vị

```bash
python core/tests/check_g6a.py
python core/tests/check_ba.py
python core/tests/check_rule_surfaces.py
python core/tests/check_media_dan_xuat.py   # byte đi trọn vòng — M16 chạm _media/
# + đúng `cmd` của AC trong đơn vị đó
```

⚠️ `check_media_dan_xuat` **phải chạy sau mỗi đơn vị của M16**, không chỉ cuối —
đó là cổng duy nhất canh vòng đời byte, và M16 là module duy nhất ghi vào đó.

## 4 · Chỗ DỪNG riêng của M16

- một `sha256` cũ trong `media` **đổi** ⇒ DỪNG ngay; byte đã mất và không dựng lại được
- fixture trỏ vào `kb/_media/` **thật** ⇒ DỪNG, dựng `KB_DIR` tạm
- định thêm engine cloud trước khi đường local chạy trọn ⇒ DỪNG
- một dòng `engine.json` **thiếu `gioi_han`** ⇒ DỪNG; không có giới hạn nào là một
  lời khai, không phải một sự thật
- định vẽ URL vào khung hình cho "tiện" ⇒ DỪNG (`M16-R3`)
- kho < 10 bản `approved` mà vẫn muốn chạy để "thử" ⇒ mỗi lần thử cloud là một lần
  toàn văn rời máy; dùng `piper` local để thử
