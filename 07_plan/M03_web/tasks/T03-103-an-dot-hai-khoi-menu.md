# T03-98 — `/dot-hai/` thành trang OVERVIEW: giữ URL, ẩn khỏi menu

> **Chủ dự án duyệt 2026-09-03**: *"/dot-hai coi như overview của các module
> phase 2: note và ẩn nó đi"* — chọn lối (a) trong ô nợ M03.
>
> Đây là lối RẺ NHẤT và nó không phạm rule 5: rule 5 cấm **gom** các module
> vào một URL, không cấm **tồn tại một trang overview**. Mỗi module vẫn sẽ có
> `/chung-cat/` · `/hoi-kho/` · `/kenh/` · `/artifact/` riêng với button riêng;
> `/dot-hai/` chỉ là chỗ đọc TOÀN CẢNH, và một trang toàn cảnh không cần một
> mục nav thường trực.
>
> Vì sao KHÔNG tháo hẳn: nó đọc số liệu từ `05_uiux/contracts/*.sample.v1.json`
> — thứ duy nhất hôm nay trả lời được *"đợt hai đang đứng ở đâu"*. Tháo là bỏ
> câu trả lời đó, mà bốn màn thay thế chưa dựng (T03-93/94 còn CHẶN vì thiếu
> cửa ĐỌC — xem ô nợ M08).

**Là gì**: `menu: false` + gỡ button khỏi HAI shell + gỡ luật icon đã thành mồ
côi. URL `/dot-hai/` **giữ nguyên** và vẫn phải trả 200 — ẩn khỏi menu không
phải xoá màn.

**Được thêm 261 byte cho `gn.css`**: luật `.tb[data-nav="dothai"]::before` là
một mask SVG data-URI ~261 byte, và không tab thì không ai đọc nó. Trần đang
dư **39 byte**, nên con số này không phải phần thưởng — nó là điều kiện để
T03-93/94/95 thêm được CSS. (Vẫn không thay đơn vị giảm-béo: 8 luật icon còn
lặp ~960 byte boilerplate.)

phạm_vi_ghi:
  - core/assets/man-hinh.json              # menu: false + $vi_sao — đất M03 (FR-056)
  - web/render/shell.html                  # gỡ button rail
  - web/plugins/home-pages/shell.html      # bản thứ hai, PHẢI byte-identical
  - web/styles/prototype.css               # gỡ mask icon mồ côi
  - web/plugins/multiwindow/src/scripts/multiwindow.inline.ts   # gỡ khoá i18n `nav.dothai`
  - 05_uiux/screen_inventory.md            # note lần đổi hướng thứ NĂM

# KHÔNG chạm `web/test/**` (R1). Bốn `cmd` dưới đều là cổng ĐÃ CÓ; đơn vị này
# không cần cổng mới vì mọi tính chất nó khẳng định đều đã có cổng đo:
# URL còn sống (ssr-routes, dẫn xuất từ bảng khai) · rail còn nguyên
# (rail-trai) · byte giảm (page-weight) · không class mồ côi (markup-matches-css).

verifiability: hard
tiêu_chí:
  - AC1: `/dot-hai/` VẪN trả 200 + mốc `.mid` — ẩn khỏi menu KHÔNG phải xoá màn
    cmd: node web/test/ssr-routes.test.js
    đỏ_khi: route mất khỏi bảng khai hoặc trả 404
    xanh_khi: ssr-routes xanh, và `grep '"ten": "dot-hai"' core/assets/man-hinh.json` còn ra dòng
  - AC2: KHÔNG button `data-nav="dothai"` trong bất kỳ shell nào; rail vẫn đủ
      tab và mọi tab còn icon
    cmd: 'grep -c "data-nav=\"dothai\"" web/render/shell.html web/plugins/home-pages/shell.html; node web/test/rail-trai.test.js'
    đỏ_khi: grep ra ≥1 ở một trong hai shell, hoặc rail-trai đỏ
    xanh_khi: cả hai file ra 0 và rail-trai xanh
  - AC3: hai shell byte-identical (luật thường trực của M03)
    cmd: cmp web/render/shell.html web/plugins/home-pages/shell.html
    đỏ_khi: cmp in ra bất kỳ dòng khác biệt
    xanh_khi: cmp im lặng, exit 0
  - AC4: `gn.css` giảm ≥200 byte và không class nào trong markup mất luật
    cmd: 'cd web && npm run build && node test/page-weight.test.js && node test/markup-matches-css.test.js'
    đỏ_khi: page-weight không giảm, hoặc markup-matches-css báo class thiếu luật
    xanh_khi: cả hai xanh, gn.css ≤ 102200 byte
  - AC5: suite web không thêm đỏ nào
    cmd: cd web && npm test

phụ_thuộc: T03-97
