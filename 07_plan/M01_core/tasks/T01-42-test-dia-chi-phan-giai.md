# T01-42 — địa chỉ phải phân giải được, `citations_*` phải do máy đếm (đơn vị TEST)

> `build_order` C1 · vá `G-6` + `G-7` · thoả `B-A5` + `B-A6`.
> Cổng phải ĐỎ trước, và phải đỏ ở **bốn** chiều. Đây là ca dễ dựng một cổng
> trông nghiêm mà không bắt được gì — chính là bệnh nó sinh ra để chữa.
>
> **A · cổng vô nghĩa (G-6).** `LOCATOR_RE = \[[^\]]{2,80}\]` khớp MỌI ngoặc
> vuông. Đo trên `kb/docs/xgboost-taylor-bac-hai.md`: dãy số
> `[2, 1, 0.5, −0.5, −1, −2]` và một công thức Taylor đang được tính là "có địa
> chỉ". Cổng phải đỏ khi một mục chỉ có những thứ đó.
>
> **B · số tự khai (G-7).** `citations_sampled`/`citations_verified` đọc bằng
> `fm.get()`. Bản ghi thật có **15** địa chỉ mà khai `3/3`, không dòng nào đối
> chiếu. Cổng phải đỏ khi số khai ≠ số máy đếm.
>
> **C · ĐỎ OAN — chiều ngược, quan trọng ngang chiều thuận.** `B-A5` nói rõ:
> *"thứ không khớp dạng nào thì bỏ qua, KHÔNG báo lỗi"*. Một mục có
> `[§II.4]` **và** một công thức toán thì công thức phải im lặng. Cổng nào báo
> lỗi vì công thức là cổng sai, và nó sẽ khiến người viết bỏ ngoặc vuông khỏi
> công thức — hỏng bài để làm vừa lòng máy.
>
> **D · cờ không bị ép.** Bản ghi có địa chỉ nhưng **0** cái phân giải được thì
> máy phải ÉP `unverifiable_citations: true`. Không ép thì `credibility_max`
> vẫn leo lên `verified` được, và toàn bộ việc này thành trang trí.

phạm_vi_ghi:
  - core/tests/check_dia_chi.py
  # `test_gates.py` có test gọi `check(path, schema, concepts)` ba tham số. Cổng
  # mới phải TẮT khi không truyền kho — khai trước khi chạm, kể cả nếu hoá ra
  # không cần sửa dòng nào.
  - core/tests/test_gates.py
  # KHAI BỔ SUNG (cùng phiên, trước khi chạm, task chưa ai ký):
  # `check_khung.py:161` **import `LOCATOR_RE`** từ validate.py. Bỏ hằng đó
  # làm cổng khác gãy bằng ImportError — không phải luật của nó sai, mà nó
  # mượn một hằng vừa bị xoá. Tôi khai thiếu vì lúc viết task chưa grep ai
  # dùng `LOCATOR_RE`; grep trước khi khai thì đã thấy.
  - core/tests/check_khung.py
  # `kb-mock/**` (13 bài) khai `citations_*` theo lối cũ. Sau C1 chúng là số
  # máy đếm ⇒ phải chạy `--fix`. Đây là DỮ LIỆU sinh ra, không phải mã.
  - kb-mock/**

verifiability: hard
tiêu_chí:
  - AC1: mục chỉ chứa dãy số / công thức toán trong ngoặc vuông ⇒ ĐỎ
      "không có địa chỉ nào" (chiều A)
    cmd: python core/tests/check_dia_chi.py
  - AC2: `citations_sampled`/`citations_verified` khai ≠ máy đếm ⇒ ĐỎ,
      thông báo nêu CẢ hai số (chiều B)
    cmd: python core/tests/check_dia_chi.py
  - AC3: mục có 1 địa chỉ hợp dạng + 1 công thức toán ⇒ **XANH**, và không có
      cảnh báo nào nhắc tới công thức (chiều C — đỏ oan)
    cmd: python core/tests/check_dia_chi.py
  - AC4: bản ghi có ≥1 địa chỉ nhưng 0 cái phân giải ⇒ `unverifiable_citations`
      bị ÉP true; khai false ⇒ ĐỎ (chiều D)
    cmd: python core/tests/check_dia_chi.py
  - AC5: cổng TẮT khi không truyền kho — `check(path, schema, concepts)` ba
      tham số vẫn chạy đúng như trước, 42 test cũ xanh
    cmd: python -m pytest core/tests -q
