# T01-19 — FR-038/C2: cổng ba bảng (đơn vị TEST)

> Tách khỏi T02-4 vì R1. Viết TRƯỚC code, phải ĐỎ trước.
>
> **Và sửa một lỗ có sẵn**: `check_export_dan_xuat.py:48-61` gieo chỉ `repo` +
> `article` — **cả hai vào cùng bảng `bai_viet`** sau khi tách. Nghĩa là cổng đó
> sẽ **xanh trên một bản cài đặt làm 1/3 việc**. Phải thêm một `video` và một
> `tai-lieu` vào `gieo()`.

phạm_vi_ghi:
  - core/tests/check_ba_bang.py
  - core/tests/check_export_dan_xuat.py
  - core/tests/check_media_ddl.py
  - core/tests/check_media_dan_xuat.py

verifiability: hard
tiêu_chí:
  - AC1: §1 — với **mỗi** loại trong `loai-nguon.json`: INSERT vào bảng của nó
      thành công, hàng đó **xuất hiện trong `ban_ghi`**, và **bị từ chối** ở hai
      bảng kia. Chiều ÂM là quan trọng hơn: nếu ai đó nới CHECK "cho khỏi lỗi" thì
      mọi hàng vào bảng nào cũng được, `ban_ghi` vẫn trả đủ, mọi cổng vẫn xanh
    cmd: python core/tests/check_ba_bang.py
  - AC2: §2 — `tham_chieu_media` phủ đúng 5 bảng, đo bằng cách gieo một con trỏ
      `media` vào **từng** bảng rồi đòi nó xuất hiện trong view
    cmd: python core/tests/check_ba_bang.py
  - AC3: §3 — `bam_noi_dung()` đổi khi sửa một byte `frontmatter` ở **từng** bảng
      (ba ca), và đổi khi tập bảng của `sqlite_master` đổi
    cmd: python core/tests/check_ba_bang.py
  - AC4: `check_export_dan_xuat.py:gieo()` gieo **cả bốn** nhóm loại — không thì
      cổng round-trip xanh trên bản cài làm 1/3 việc
    cmd: python core/tests/check_export_dan_xuat.py
  - AC5: ba cổng cũ (`check_media_ddl` · `check_media_dan_xuat` ·
      `check_export_dan_xuat`) đổi tên bảng đích và vẫn ĐỎ được khi phá
    cmd: python core/tests/check_media_ddl.py && python core/tests/check_media_dan_xuat.py
phụ_thuộc: T01-18
