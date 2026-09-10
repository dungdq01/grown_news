# T03-20 — FR-036/B9: cổng M09-R4 (đơn vị TEST)

> Tách khỏi T03-19 vì R1. Viết TRƯỚC code, phải ĐỎ trước.
>
> Cổng dựng **hai** bộ dữ liệu và so **cùng một pane** giữa chúng — đó là cách
> duy nhất diễn đạt được `đỏ_khi`/`xanh_khi` của M09-R4. So một bộ với một con số
> gõ tay thì không phân biệt được "pane đổi vì thư viện" với "pane đổi vì tôi gõ
> sai số mong đợi".

phạm_vi_ghi:
  - web/test/thu-vien-tong-hop.test.js
  - web/package.json
  - web/test/WORKLOG.md
  - web/WORKLOG.md

verifiability: hard
tiêu_chí:
  - AC1: ba pane chất lượng (`mball` · `kf-uutien` · `bars3`) GIỐNG HỆT nhau giữa
      hai bộ dữ liệu
    cmd: cd web && node test/thu-vien-tong-hop.test.js
  - AC2: pane số đếm ĐỔI, và đổi ĐÚNG bằng số bản ghi thêm vào — không chỉ
      "khác nhau"
    cmd: cd web && node test/thu-vien-tong-hop.test.js
  - AC3: mỗi pane chất lượng có chữ khai nền; và tập pane chất lượng KHÔNG rỗng
      (phép kiểm không được tự vô hiệu)
    cmd: cd web && node test/thu-vien-tong-hop.test.js
phụ_thuộc: T03-19
