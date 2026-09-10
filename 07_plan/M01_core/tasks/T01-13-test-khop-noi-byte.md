# T01-13 — FR-036/B4: cổng khớp nối byte (đơn vị TEST)

> Tách khỏi T01-12 vì R1. Cổng viết TRƯỚC code và phải ĐỎ trước.
>
> Cổng này dựng fixture ở thư mục **tạm** — nó thử XOÁ và thử làm hỏng, và làm
> hai việc đó trên kho thật là đúng điều CẤM *"sửa file thật để thử một cổng"*.
> Thao tác *hoàn tác* là chỗ mất dữ liệu.

phạm_vi_ghi:
  - core/tests/check_media_dan_xuat.py

verifiability: hard
tiêu_chí:
  - AC1: `đỏ_khi` của M09-R1 diễn đạt được thành fixture — bản ghi chỉ còn
      `recycle` trỏ tới mà byte bị reap thì cổng ĐỎ
    cmd: python core/tests/check_media_dan_xuat.py
  - AC2: `xanh_khi` cũng diễn đạt được — bỏ tham chiếu CUỐI thì byte phải bị
      reap, và cổng KHÔNG đỏ oan ở ca đó
    cmd: python core/tests/check_media_dan_xuat.py
  - AC3: vòng tròn DB → file → DB giữ nguyên byte và nguyên `bam_noi_dung`;
      `bam_cay` ĐỔI khi một byte media đổi (chứng minh `--kiem` không nói dối)
    cmd: python core/tests/check_media_dan_xuat.py
phụ_thuộc: T01-12
