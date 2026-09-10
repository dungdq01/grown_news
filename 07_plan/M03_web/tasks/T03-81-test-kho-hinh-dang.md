# T03-81 — FR-041: cổng canh hình dạng màn Kho (đơn vị TEST)

> Tách khỏi T03-78 vì R1. Cổng hỏi TÍNH CHẤT, không đếm chuỗi: (1) mỗi hình
> dạng xuất hiện đúng MỘT lần trên màn Kho — đó là điều FR-031 tự đề mà không
> cổng nào canh, nên nó mòn; (2) mọi lớp chuyển động mới có chốt
> reduced-motion; (3) SVG không mang hex — chỉ var(token).

phạm_vi_ghi:
  - web/test/kho-hinh-dang.test.js
  - web/test/cac-man-con-lai.test.js
  # Ba cổng dưới GHIM CÁCH VẼ cũ của đúng các vùng FR-041 đổi — đổi theo là
  # có chủ đích, mỗi chỗ chú thích trỏ FR:
  - web/test/bon-trang-thai.test.js     # đọc nhãn `.bl` của bars4 cũ
  - web/test/bay-man.test.js            # đọc loại nguồn qua nhãn `.bl` của bar cũ
  - web/test/opacity-khong-pha-contrast.test.js  # trạng thái đầu reveal mới cần miễn như .rise
  - web/package.json
  - web/test/WORKLOG.md
  - web/test/thu-vien-tong-hop.test.js
  - web/test/bay-man.test.js            # loại nguồn của Kho giờ là loại THẬT (pdf/youtube…) — phép đo nhóm đọc qua bảng khai thay vì tập source_type  # danh sách pane chất lượng 3 -> 1 (FR-041 lượt 2)              # bảng 'test nào chặn gì' phải có dòng cho cổng mới                    # nut-song §5: mọi file test phải nằm trong npm test
verifiability: hard
tiêu_chí:
  - AC1: cổng mới đỏ được (bỏ một hình ⇒ đỏ; hai vùng cùng hình ⇒ đỏ) và
      không đỏ oan trên bản đúng
    cmd: node web/test/kho-hinh-dang.test.js
  - AC2: phép kiểm cũ nào ghim CÁCH VẼ đã lật thì đổi theo FR-041 — có chú
      thích trỏ FR, không bump im lặng
    cmd: node web/test/cac-man-con-lai.test.js
phụ_thuộc: T03-80
