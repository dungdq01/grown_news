# WO-042 — `api.chay(cong=0)` bind CỔNG THẬT 8790, và cổng kiểm đo sai server

- **loại**: bug · **mức**: **hard** · **module**: M12_chungcat
- **mở**: 2026-09-03 · **người mở**: agent thi công (phiên 6c7880c5)
- **quy chủ**: mã của lượt này (`chungcat/src/api.py`, T12-6). KHÔNG phải của
  `model.json` — xem §Chẩn đoán, tôi đã đi sai hướng bốn lần trước khi đo đúng.

## Repro

```
# 1 · có một tiến trình chungcat đang nghe 8790 (phiên khác, hoặc lượt trước rò)
netstat -ano | grep LISTENING | grep :8790     # → PID 19120

# 2 · chạy cổng — nó khai `cong=0` nghĩa là "cho OS chọn cổng rảnh"
python chungcat/tests/check_chi_loi_goi_tu_loi.py
# → FAIL có khoá LÕI ⇒ 201   trả 403 · {'loi': 'chỉ LÕI được tạo việc (M12-R7)'}
```

## Bug

`chungcat/src/api.py:152`

```python
return ThreadingHTTPServer(("127.0.0.1", cong or cong_tu_bang_khai()), Cua)
```

**`0` là falsy.** `cong=0` — cách POSIX nói *"cho OS chọn một cổng rảnh"* — rơi
vào nhánh `cong_tu_bang_khai()` và **bind cổng THẬT 8790**. Mọi cổng kiểm truyền
`cong=0` đều tưởng mình cô lập, thực tế đang dựng server trên cổng sản xuất.

Cộng thêm một tính chất của Windows làm nó **im lặng**: `HTTPServer` đặt
`allow_reuse_address = 1`, và trên Windows `SO_REUSEADDR` cho **hai socket bind
cùng một cổng** thành công. Nên bind KHÔNG raise — nó thành công, `server_address`
trả 8790, và kết nối tới đó **có thể vào listener CŨ**. Listener cũ đọc
`CHUNGCAT_KHOA_LOI` từ env của **nó**, không phải khoá fixture ⇒ 403.

## Vì sao đây là lỗi nặng, không phải một lỗi nhỏ về mặc định

Cổng kiểm này **đã xanh** hôm nay và **đỏ** bây giờ, mà mã M12 không đổi một
dòng nào ở đường khoá. Kết quả của nó phụ thuộc *"có ai đang giữ 8790 không"* —
tức nó **không đo thứ nó khai đo**. Xanh của nó không nói gì, và đỏ của nó tố
sai chỗ: bốn lần chẩn đoán đầu của tôi đều đi tìm lỗi trong `model.json` và
`dinh_tuyen`, vì cổng chỉ nói *"403"*.

Đúng lớp lỗi `#cổng-đỏ-oan` **cộng** `#cổng-không-đỏ-được` trong một dòng mã.

## Chẩn đoán — ghi lại vì cách tìm mới là phần đáng giữ

Bốn hướng sai, mỗi hướng bị loại bằng một phép đo:

| hướng | phép đo loại nó |
|---|---|
| `model.json` v2 làm `quyet_dinh` ném | ném ⇒ **422**, không phải 403 |
| stale `__pycache__` | `PYTHONPYCACHEPREFIX` sang thư mục khác ⇒ vẫn 403 |
| header hoa/thường của `urllib` | socket THÔ gửi đúng `X-Khoa-Loi: K` ⇒ vẫn 403 |
| debug print không chạy ⇒ `do_POST` không được gọi | mâu thuẫn: thân 403 chỉ tồn tại TRONG `do_POST` |

Phép đo **cắt được nút**: thay `_tu_loi` thành `return True` vô điều kiện. Ca
*"KHÔNG có khoá ⇒ 403"* **vẫn xanh** — không thể xảy ra nếu server đang chạy mã
đó. ⇒ Cổng đang nói với **một server khác**.

## Sửa

`cong if cong is not None else cong_tu_bang_khai()` — `0` giữ nghĩa "OS chọn".

Không đụng `allow_reuse_address`: sửa nghĩa của `0` là đủ để cổng kiểm không bao
giờ tranh 8790 nữa, và `allow_reuse_address` vẫn cần cho lần khởi động lại dịch
vụ thật (TIME_WAIT).

## tiêu_chí

- AC1: `chay(cong=0)` trả server có `server_address[1] != 8790` và != 0
  - cmd: `python chungcat/tests/check_nghe_loopback.py`
  - đỏ_khi: cổng trả về bằng cổng khai trong `dich-vu.json`
- AC2: cổng authz xanh **khi có** một tiến trình khác giữ 8790 — đó là ca thật
  của bug này
  - cmd: `python chungcat/tests/check_chi_loi_goi_tu_loi.py`
  - đỏ_khi: 403 cho lời gọi mang đúng khoá fixture
- AC3: 19 cổng M12 xanh
  - cmd: `for g in chungcat/tests/check_*.py; do python $g; done`
