# M03_web — rules

```yaml
- id: M03-R1
  vi_phạm: "một đường render CÔNG BỐ/deploy chứa nội dung có review_status khác approved (FR-034 thu hẹp — trước: 'output build'; bundle build không còn tồn tại)"
  bề_mặt: S2          # only-approved.test.js retire cùng bundle; đường công bố mới (nếu có) phải mang test riêng trước khi merge
  why: >
    draft là nơi mọi thứ chưa được NGƯỜI xác nhận nằm — kể cả bài sinh ra do
    prompt injection. security_baseline §6 chấp nhận rủi ro đó CHỈ VÌ tác động
    tối đa là "một bài rác trong draft". Xuất bản ra ngoài thì câu đó sai.
    App local một-người-dùng (M03-R6 cấm deploy công khai) hiển thị đủ trạng
    thái CÓ NHÃN — đó là màn làm việc, không phải xuất bản. Rule này trói
    đường công bố, và sống lại thành S3 ngay khi đường đó xuất hiện.

- id: M03-R2
  vi_phạm: "code FE + module render (web/render/**, bundle gn.js, inline script) có đường ghi vào kho; hoặc FE fetch method ghi tới đường ngoài whitelist literal đóng (FR-034 — trước: 'BUNDLE TĨNH')"
  bề_mặt: S3          # no-write-path.test.js quét web/render/** + gn.js + whitelist FE
  why: >
    FE và module render là code chạy cho trình duyệt xem (B-D3) nên phải
    read-only TUYỆT ĐỐI với kho — trang HTML mà ghi được vào nguồn chân lý là
    mất cả B-C3 lẫn lớp giảm thiểu §6. FR-011 tách "web" làm hai: phần hiển thị
    (rule này) và API biên tập local (M08 — có rule + test riêng). FE chỉ được
    fetch ghi tới whitelist literal: /api/inbox (FR-010) · /api/articles ·
    /api/recycle (FR-011) · /api/concepts · /api/categories (FR-019/021) —
    thêm đường mới là test đỏ.
  ngoại_lệ: >
    FR-010 — `web/server.mjs` ghi `_inbox/` (trung chuyển M05, không phải nguồn
    chân lý; gate.py hardcode review_status draft khi nạp — test -k
    draft_external — nên upload không tới được approved).
    FR-011/FR-034 — handler `web/api/**` (M08_api) COMMIT vào kb/_kho.sqlite:
    mọi ghi qua validate.py --strict (M08-R2), không default trường người
    (M08-R3), localhost-only (M08-R1). Răng: api-guard/api-crud/api-status/
    api-recycle + check_export_dan_xuat.
    Chặn bù FR-010 giữ nguyên: bind 127.0.0.1 · tên whitelist [a-z0-9-] · gọi
    gate.py/validate.py làm tiến trình con thay vì viết lại cổng (M05-R3).
    Mọi đường ghi khác trong web/ vẫn là vi phạm.

- id: M03-R3
  vi_phạm: "render markdown ra DOM mà không qua đường escape-trước-dựng-thẻ của md(); hoặc chèn chuỗi từ kho vào HTML bằng innerHTML/insertAdjacentHTML không escape (FR-034 — trước: 'allowDangerousHTML bật trong config Quartz'; Quartz retire)"
  bề_mặt: S3          # cua-so-doc.test.js kiểm md() escape trước; no-write-path quét innerHTML ngoài md()
  why: >
    Nội dung bài sinh từ nguồn ngoài untrusted. Quartz từng sanitize hộ; khi
    render dời về md() tự viết thì kỷ luật "escape TRƯỚC, dựng thẻ SAU" chính
    là toàn bộ lớp sanitize — một đường render thứ hai không escape là XSS.

- id: M03-R4
  vi_phạm: "gõ lại giá trị token thay vì import tokens.css"
  bề_mặt: S3          # token-only.test.js
  why: >
    s5 mất 20 bản mới hết lệch. Bản v4 gõ tay 9 giá trị spacing cho cùng một vai
    ⇒ mất nhịp; v19 cửa sổ đọc dùng clamp tự do ⇒ chữ 19.3px giữa hệ 15px.
    Một giá trị gõ tay là một chỗ sẽ lệch khi token đổi.

- id: M03-R5
  vi_phạm: "sắp bài theo analyzed_at thay vì priority"
  bề_mặt: S3          # expected-render.test.js — featured phải là src_wfv001
  why: >
    analyzed_at đo "khi nào tôi rảnh", priority đo "cái này quan trọng thế nào".
    Sắp theo ngày thì bài quan trọng nhất chìm sau một tối nạp nhiều nguồn —
    đúng thứ hệ thống này sinh ra để chống.

- id: M03-R6
  vi_phạm: "deploy site ở chế độ công khai"
  bề_mặt: S2
  why: >
    BRD B-D3. Nếu nạp nguồn nội bộ công ty thì bản phân tích chứa thông tin đó.
    Đổi sang công khai PHẢI rà lại toàn kho trước — đây là ràng buộc cứng,
    không phải mặc định thay đổi được.
```

## Quan hệ với hợp đồng G5

`rules.md` này **không lặp lại** luật thiết kế (3 luật chữ, đỏ ≤3 lần/viewport,
một `--blur-lift`). Chúng sống ở `05_uiux/DESIGN.md` và đã frozen.

M03-R4 là cầu nối duy nhất: nó bắt buộc *dùng* token, không bắt buộc token *là gì*.
