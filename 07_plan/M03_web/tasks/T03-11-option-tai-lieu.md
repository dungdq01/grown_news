# T03-11 — FR-036/B1: `<option>` thứ bảy cho loại nguồn (đơn vị CODE)

> Sáu `<option>` trong shell được gõ tay — khác `#f-cat`/`#f-cpt` vốn nạp động từ
> API. Đây là một tập gõ tay, và task này chỉ thêm một giá trị; giết tập gõ tay là
> việc riêng, không gộp vào đây.

phạm_vi_ghi:
  - web/render/shell.html
  - web/plugins/home-pages/shell.html
verifiability: hard
tiêu_chí:
  - AC1: hai shell giữ byte-identical và cùng liệt đủ giá trị `source_type`; form
      nạp chọn được `tai-lieu`
    cmd: python core/tests/check_khung.py && cd web && node test/four-screens.test.js
phụ_thuộc: T01-25
