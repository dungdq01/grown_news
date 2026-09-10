# T03-39 — WO-014: cổng cho hai chiều facet (đơn vị TEST)

> `web/test/hai-chieu-facet.test.js` (MỚI). ĐỎ trước (R5).
>
> Vế nặng là **BA TẬP KHÔNG GIAO NHAU**: nếu `nguonCua()` rơi về `source_type`
> cho mọi module thì `/video/` vẫn có facet "video" và mọi phép kiểm "có facet"
> đều xanh. Chỉ *"tập loại nguồn của video KHÔNG chứa `article`, và tập của bài
> viết KHÔNG chứa `youtube`"* mới bắt được.
>
> Và **facet của màn trộn phải là PHÂN LOẠI, không phải loại nguồn** — đây chính
> là câu người dùng nói: *"không thể để chung chỗ"*.

phạm_vi_ghi:
  - web/test/hai-chieu-facet.test.js
  - web/test/filter-counts.test.js
  - web/test/WORKLOG.md
  - web/package.json

verifiability: hard
tiêu_chí:
  - AC1: cổng ĐỎ trên code hiện tại (một facet duy nhất dựng từ `source_type`)
    cmd: cd web && node test/hai-chieu-facet.test.js; test $? -ne 0
  - AC2: sau T03-38 XANH, có trong `npm test`
    cmd: cd web && npm test
phụ_thuộc: T03-37
