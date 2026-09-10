# FR-008 — Bố cục trang chủ v2: bỏ panel rỗng, chuẩn hoá nhịp

mở_bởi: người dùng, 2026-08-19
tới: s5 (SCR-02 + ui_frozen v1)
mức: đụng hợp đồng UI frozen — chặn việc "thiết kế khoa học hơn"
trạng_thái: ĐÃ THI HÀNH — 2026-08-19, worklog WL-01K9H1FR008

## Vấn đề

Người dùng gửi ảnh và nói *"chưa design lại các bố cục layout à? cần thiết kế
khoa học hơn"*, kèm một ảnh cắt cận chỉ đúng lỗi:

```
┌─────────────────────────┐   ┌──────────────────────
│  KHO   xem dashboard →  │   │        xem tất cả →
│  ─────────────────────  │   │  ──────────────────
│                         │   │
└─────────────────────────┘   └──────────────────────
     ↑ panel CAO 130px mà KHÔNG CÓ GÌ bên trong
```

Ba lỗi bố cục, đo được, không phải chuyện thẩm mỹ:

| # | Lỗi | Vì sao xảy ra |
|---|---|---|
| L1 | Panel rỗng vẫn chiếm chiều cao đầy | `.pn` có `padding` cố định; mốc rỗng không có `:empty` state |
| L2 | Hai cột `.two` lệch đáy | `align-items:start` + nội dung hai bên khác chiều cao |
| L3 | Nhãn đỉnh panel lệch nhau | `.pn-h` không có chiều cao tối thiểu; có/không `.dot` đổi baseline |

L1 là lỗi người dùng thấy trước tiên, và nó **chỉ lộ khi kho rỗng** — tức đúng
trạng thái hiện tại của dự án (`gap-m1`: kb/ đang 0 bài). Wireframe SCR-02 §"Ba
state" đã ghi rõ `empty` là *"màn đầu tiên người dùng thấy"* và *"không được để
trống trơn"*. Bản dựng thật **chưa thi hành** đoạn đó.

## Vì sao phải mở FR

`project_map.modules.M03_web.ui_frozen` chốt `v1` ngày 2026-08-18, gồm
`wireframe: SCR-00-app-shell.md` và toàn bộ `tokens.css`. Đổi bố cục trang chủ là
đổi hợp đồng đó. Luật G5: *"Đổi bất kỳ giá trị nào ⇒ FR + bump version + worklog.
Drift owner: PM."*

## Phạm vi — CHỈ nhịp, KHÔNG đổi cấu trúc vùng

Điều **không** đổi (nên đây là bump minor, không phải v2 của cả hợp đồng):

- Số vùng trang chủ: vẫn 4 (nổi bật · mới phân tích + kho · kho gần đây)
- Thứ tự vùng, tỷ lệ cột `.two` (1fr 300px)
- Mọi giá trị trong `tokens.css` — không thêm, không sửa, không bỏ token nào
- Luật chọn tiêu điểm theo `priority` không theo ngày (SCR-02)

Điều đổi:

| Chỗ | Từ | Thành |
|---|---|---|
| Panel rỗng | cao đầy, trống trơn | `:empty` ⇒ ẩn; có mốc ⇒ hiện dòng gợi ý hành động |
| `.two` | `align-items:start` | hai cột thẳng đỉnh **và** đáy |
| `.pn-h` | chiều cao theo nội dung | `min-height` cố định ⇒ mọi nhãn đỉnh thẳng hàng |
| empty state | chưa có | thi hành đúng SCR-02 §"Ba state · empty" |

## Đổi thì

Nếu sau này kho có >20 bài thì `:empty` gần như không bao giờ fire, và ba luật
trên trở thành code chết không ai kiểm. Chốt chặn: test `markup-matches-css`
kiểm cả trạng thái rỗng, nên nó vẫn được chạy mỗi lần build dù kho đầy.

Nếu người dùng muốn đổi **số vùng** hoặc **tỷ lệ cột** thì đó là FR khác — phải
sửa `wireframes/SCR-02` trước, rồi mới sửa code.

## Thi hành

| Chỗ | Đổi |
|---|---|
| `web/styles/prototype.css` | `.pn:empty`, `.pn-h` min-height, `.two` align, `.empty` |
| `web/plugins/home-pages/shell.html` | mốc rỗng mang `data-empty` để CSS biết |
| `web/plugins/home-pages/index.ts` | mốc không có dữ liệu ⇒ chèn dòng gợi ý, không để trống |
| `project_map` `ui_frozen.version` | `v1` → `v1.1` |
| `05_uiux/wireframes/SCR-02-trang-chu.md` | ghi rõ empty state đã thi hành ở đâu |
