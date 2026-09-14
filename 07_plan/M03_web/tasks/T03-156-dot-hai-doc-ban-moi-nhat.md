# T03-156 — `soDotHai()` đọc bản hợp đồng mới nhất + M13 hết `trang_thai: "chưa dựng"`

> Mã cho cổng `T03-154`. ID rule 9: dải CHẴN dev chính, max 154 ⇒ **156**.
> Nguồn: ô backlog M13 `backlog.md:19` — **hai** vế trong cùng một chỗ mã.
>
> **Vế 1 — chọn file**: `trang.mjs:1724-1725` gõ cứng `".sample.v1.json"`. Đổi thành:
> liệt `05_uiux/contracts/<tep>.sample.v*.json`, lấy **số version lớn nhất**. Không thêm
> bảng khai, không thêm tham số — một hàm đọc thư mục đã có.
>
> **Vế 2 — trạng thái**: `trang.mjs:1709` khai M13 `trang_thai: "chưa dựng"`. Đo được
> 2026-09-15: `project_map.yaml:167` khai `M13_truyhoi.status: as-built`, service sống ở
> `:8791` (`GET /health` ⇒ 200, 16 tài liệu · 111 chunk). Màn `/dot-hai/` đang nói sai về
> một thứ **đã chạy**. Đổi đúng một dòng, theo nhãn M12 đang dùng (`"đang dựng"`).
>
> ⚠️ Chỉ M13. **KHÔNG** đụng `trang_thai` của m14/m15/m16 — chúng vẫn `"chưa dựng"` thật.

phạm_vi_ghi:
  - web/render/trang.mjs

phụ_thuộc: T03-154

verifiability: hard
tiêu_chí:
  - AC1: ba ca của `T03-154` chuyển **XANH** — cả ca C (fixture rỗng vẫn NÉM)
    cmd: cd web && node test/dot-hai-hop-dong.test.js
  - AC2: `trang.mjs` **hết** chuỗi `sample.v1.json` gõ cứng — grep ⇒ 0
    cmd: cd web && npm test
    đỏ_khi: còn một literal `.sample.v1.json` trong `web/render/trang.mjs`
    xanh_khi: 0
  - AC3: dòng `ma: "m13"` **không** còn `trang_thai: "chưa dựng"`; **và** m14/m15/m16 vẫn
      còn — grep `trang_thai: "chưa dựng"` trong `trang.mjs` ⇒ đúng **3**
    cmd: cd web && npm test
    đỏ_khi: số khác 3 (0 ⇒ sửa quá tay, 4 ⇒ chưa sửa)
    xanh_khi: đúng 3
  - AC4: trang `/dot-hai/` render thật, không ném; cổng sẵn có vẫn xanh
    cmd: cd web && node test/menu-tai-dot-hai.test.js
  - AC5: trần byte của màn không vỡ
    cmd: cd web && npm test

# AC3 đếm **3** chứ không đếm **0**: đó là vế chống sửa quá tay. Nếu ai dọn hết nhãn
# "chưa dựng" cho gọn thì màn nói dối về M14/M15/M16 — đúng lớp lỗi đơn vị này đang đóng,
# chỉ đổi chiều.
