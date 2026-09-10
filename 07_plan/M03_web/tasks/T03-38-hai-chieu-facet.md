# T03-38 — WO-014: tách "phân loại" khỏi "loại nguồn" (đơn vị CODE)

> `bangLoc():218` dựng nhóm "loại nguồn" bằng `b.source_type` — một ô chở HAI ý.
> Hệ quả: sidebar `/video/` hiện đúng một dòng `video`, và màn Tổng hợp trộn
> `article`/`paper` (loại nguồn CỦA BÀI VIẾT) với `video`/`tai-lieu` (tên MODULE).
>
> **KHÔNG đổi schema.** Dữ liệu đã có, chỉ chưa lên mặt:
>   bài viết ⇒ `source_type` · tài liệu ⇒ `media.mime` → `ten` của bảng mime ·
>   video ⇒ `url_normalized` → `video_host[].nhan`, hoặc "tải lên" nếu có `media`.
>
> **MỘT phép suy** (`nguonCua()`), dùng cho mọi màn. Hai phép suy cho cùng một
> nhãn là hai chỗ để lệch — đúng lớp lỗi `dongBoThe`.
>
> Thẻ mang thêm `data-pl` (phân loại) và `data-nguon` (loại nguồn); `data-loai`
> GIỮ NGUYÊN nghĩa `source_type` — ba cổng đang đọc nó (`bay-man` §3-5 ·
> `nut-song` · `ui-ba-man`), đổi nghĩa là phá chúng vì một lý do không liên quan.
>
> Facet theo màn: màn TRỘN (`tron: true` trong bảng khai) ⇒ nhóm **phân loại**;
> màn loại ⇒ nhóm **loại nguồn của module đó**. Đọc từ bảng khai, không gõ tên màn.

phạm_vi_ghi:
  - web/render/trang.mjs
  - web/plugins/multiwindow/src/scripts/multiwindow.inline.ts

verifiability: hard
tiêu_chí:
  - AC1: màn Tổng hợp + Kho có facet **phân loại** với đúng ba giá trị (bài viết ·
      tài liệu · video), KHÔNG có `article`/`paper` lẫn vào
    cmd: cd web && node test/hai-chieu-facet.test.js
  - AC2: `/bai-viet/` facet loại nguồn = article·paper·repo·announcement·docs;
      `/tai-lieu/` = định dạng file; `/video/` = nơi phát — và ba tập KHÔNG giao nhau
    cmd: cd web && node test/hai-chieu-facet.test.js
  - AC3: MỘT phép suy — bundle không có bản thứ hai của phép tính nhãn nguồn
    cmd: cd web && node test/hai-chieu-facet.test.js
  - AC4: lọc chạy thật — bấm một nút facet ẩn đúng các thẻ không khớp
    cmd: cd web && node test/hai-chieu-facet.test.js
  - AC5: ngân sách BYTE + không hồi quy
    cmd: cd web && node build-fe.mjs && node test/sua-dung-man.test.js && npm test
phụ_thuộc: T03-37
