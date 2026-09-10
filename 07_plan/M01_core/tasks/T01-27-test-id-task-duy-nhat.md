# T01-27 — `check_g6b` phải bắt ID task TRÙNG (đơn vị TEST)

> Sáu ID task bị trùng — `T01-8` · `T01-9` · `T03-10` (×3) · `T03-11` (×3) ·
> `T03-12` · `T03-13` · `T03-14` · `T05-2` — và **không cổng nào báo**. Tôi tự
> tạo tất cả, qua bốn lượt khác nhau, và mỗi lượt `check_g6b` đều **exit 0**.
>
> Vì sao đây là lỗ chứ không phải chuyện hình thức: G6B gom `phạm_vi_ghi` **theo
> ID**. Hai file cùng ID ⇒ phạm vi ghi của ID đó là HỢP của hai file ⇒ R1 mất
> địa chỉ, đúng thứ R1 tồn tại để giữ. Và một dòng khai phụ thuộc trỏ tới
> `T01-8` ở bốn file khác trở thành câu không trả lời được: trỏ tới file nào?
>
> (Văn xuôi ở đây CỐ Ý không viết literal của khoá khai phụ thuộc: parser của
> `check_g6b` bắt khoá đó bằng regex trên CẢ file, nên một câu văn nhắc tới nó
> thành một khai báo thật — vừa xảy ra, và nó khai một task không tồn tại.)
>
> Nó chỉ lộ ra khi hai file trùng ID tình cờ tạo một VÒNG trong đồ thị phụ thuộc
> — tức lộ vì may, không vì cổng.
>
> Lý do tôi không thấy: `ls | tail` sắp theo CHỮ, nên `T03-10` đứng trước
> `T03-4` và sáu file mới nhất không nằm ở cuối danh sách. Một phép quan sát sai
> mà không cổng nào bù.

phạm_vi_ghi:
  - core/tests/check_g6b.py

verifiability: hard
tiêu_chí:
  - AC1: ID task trùng ⇒ ĐỎ, kèm đường dẫn CẢ HAI file — một lời lỗi chỉ nêu ID
      không nói được phải sửa file nào
    cmd: python core/tests/check_g6b.py
  - AC2: ca âm — tạo một file trùng ID ở thư mục tạm rồi đòi cổng đỏ, xoá đi thì
      xanh lại
    cmd: python core/tests/check_g6b.py
  - AC3: kho hiện tại (đã đánh lại số) XANH
    cmd: python core/tests/check_g6b.py && python core/tests/check_running.py
phụ_thuộc: T01-24
