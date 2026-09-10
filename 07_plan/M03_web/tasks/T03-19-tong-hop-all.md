# T03-19 — FR-036/B9: tổng hợp All, thước đo chất lượng KHÔNG trộn (đơn vị CODE)

> Người dùng chốt: *"Trang dashboard lúc này sẽ tổng hợp All thay vì mỗi các bài
> viết nội bộ"*. **Số đếm** đúng là phải tổng hợp. Nhưng **thước đo chất lượng**
> thì không có nghĩa trên một bản ghi thư viện, và trộn vào là làm dashboard
> **tệ hơn trước** trong khi mọi con số vẫn "đúng" (M09-R4).
>
> Đo được: `priority` sinh từ `fm.skill_candidates` (`data.mjs`) nên tài liệu luôn
> **0** ⇒ 50 PDF đẩy histogram ưu tiên về ~100% "thấp". `credibility_max` mô tả
> một **bản phân tích**, không mô tả một file PDF.
>
> **Ba pane chất lượng** — nền `ho_so === "phan-tich"`:
> `mball` (ưu tiên, màn Tất cả) · `kf-uutien` (ưu tiên, dòng chảy kho) ·
> `bars3` (độ tin cậy).
>
> **Mọi pane còn lại giữ `tatCa`** — đó chính là "tổng hợp All": tổng bản ghi ·
> lưới thẻ · bộ lọc · bốn trạng thái · theo tháng · theo nguồn · theo loại ·
> thanh trên-site/chưa-lên/đã-loại.
>
> **Và mỗi pane phải KHAI RÕ NỀN của nó** — quy ước đã có ở `trang.mjs:699`
> (*"Cơ sở đếm: CẢ KHO (`tatCa`), khai ở nhãn từng pane"*). Hai con số cạnh nhau
> với hai nền khác nhau mà không nói ra là cách người đọc tự trừ hai số rồi tin
> vào hiệu.

phạm_vi_ghi:
  - web/render/trang.mjs

verifiability: hard
tiêu_chí:
  - AC1: M09-R4 `đỏ_khi` — gieo thêm 4 bản thư viện thì **không pane chất lượng
      nào** đổi số
    cmd: cd web && node test/thu-vien-tong-hop.test.js
  - AC2: M09-R4 `xanh_khi` — pane **số đếm** ĐỔI (đúng ý "tổng hợp All")
    cmd: cd web && node test/thu-vien-tong-hop.test.js
  - AC3: mỗi pane chất lượng khai rõ nền của nó trong chữ HIỆN RA
    cmd: cd web && node test/thu-vien-tong-hop.test.js
  - AC4: không hồi quy — số đếm và bộ lọc trên kho chỉ-phân-tích không đổi
    cmd: cd web && npm test
phụ_thuộc: T08-9
