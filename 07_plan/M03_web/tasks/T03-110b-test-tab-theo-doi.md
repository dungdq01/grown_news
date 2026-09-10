# T03-110b — đơn vị TEST đi kèm T03-110 (sở hữu 2 file cổng)

> Khuôn T08-26b. Cổng viết TRƯỚC mã (rule.md mục 8 — output đỏ tại mốc
> trước-code vào worklog), sống ở thư mục task rồi dời vào web/test/ CÙNG LƯỢT
> với mã T03-110.

phạm_vi_ghi:
  - web/test/tab-theo-doi-chung-cat.test.js   # cổng MỚI
  - web/test/sinh-transcript-ui.test.js       # T03-108 · nút + xem transcript
  - web/test/chung-cat-nhap.test.js           # T03-113 · cửa sổ nháp đúng cửa
  - web/test/chung-cat-hover.test.js          # WO-048 · chi tiết việc dạng nổi
  - web/test/mo-theo-slug.test.js             # T03-118 · bóc phong bì API
  - web/test/sau-phan-quyet.test.js           # T03-119 · toast + thẻ đổi tại chỗ
  - web/test/mau-trang-thai.test.js           # T03-120 · màu trạng thái + vai nút
  - web/test/menu-tai-dot-hai.test.js         # T03-121 · menu tải xuống đợt hai
  - web/test/the-viec-noi-ro-loai.test.js     # loại việc: chữ + màu + dấu
  - web/test/cua-so-transcript.test.js        # T03-122 · cửa sổ transcript
  - web/test/chung-cat-sau-transcript.test.js # T03-123 · cửa sổ chưng cất
  - web/test/xuat-transcript.test.js          # WO · cửa xuất transcript
  - web/test/mo-nhap-da-duyet.test.js         # WO · mở nháp đã duyệt
  - web/test/nap-video.test.js                # T03-109 · ô file mp4
  - web/test/o-media-sua.test.js              # T03-105 · ô media sửa
  - web/test/chung-cat-ui.test.js             # T03-106 · bố cục popup
  - web/test/o-chi-dan.test.js                # T03-116 · ô chỉ dẫn trong popup
  - web/test/viec-theo-loai.test.js           # WO-061 · việc theo loại · hiện vật theo vai
  - web/test/nut-tai-xuong.test.js            # T03-117 · menu tải xuống + trang in
  - web/test/chung-cat-ui.test.js             # vế "sau gửi → tab mở" thay vế ở-lại-màn (ghi lý do đổi)
  - web/test/o-chi-dan-hien-that.test.js      # WO · ô chỉ dẫn hiện thật
  - web/test/nhip-sinh.test.js                # T03-124 · dải nhịp + vòng nghĩ
  - web/test/hien-vat-lac-hau.test.js         # WO · bản ghi bộ nhớ lạc hậu
  - web/test/mot-phieu-chung-cat.test.js      # WO · một phiếu cho mọi loại
  - web/test/phieu-chung-cat-ui.test.js       # SCR-23 · phiếu gọn
  - web/test/model-value-va-mot-chu.test.js   # WO · value tách nhãn, một act một chủ
  - web/test/chen-ten-co-thuc.test.js        # WO · ${tên} phải có thực
  - web/test/mang-chop-khong-giet-cua-so.test.js  # WO · mạng chớp không giết cửa sổ
  - web/test/thu-gon-rail.test.js            # WO · thu gọn thanh bên
  - web/test/nut-header-mau.test.js          # SCR-24 · nút header gọn + màu
  - web/test/the-hai-tang.test.js             # SCR-25 · T03-126 · thẻ 2 tầng
  - web/test/ten-file-co-dau.test.js         # WO-057 · T03-127 + T08-36 · tên có dấu
  - web/test/tai-file-video.test.js         # WO-058 · FR-075 · T03-128 + T08-37
  - web/test/thung-rac-viec.test.js          # WO-070 · T03-129 · thùng rác việc
  - web/test/thumbnail-video-url.test.js     # WO-071 · T08-38 · cửa THAY + image/*
  - web/package.json                          # đăng ký cổng mới

verifiability: hard
tiêu_chí:
  - AC1: cổng mới chạy được ngay, đỏ hiện tại nói đúng "chưa có tab" (không
      phải lỗi cú pháp); có vế chống-đỏ-oan
    cmd: node web/test/tab-theo-doi-chung-cat.test.js
  - AC2: nut-song §5 nhận cổng có chủ sau khi dời
    cmd: node web/test/nut-song.test.js
