# WO-053 — số liệu lệch · bản nháp thành cửa sổ · kết quả tách tab

- **mở/đóng**: 2026-09-05 · **module**: M12_chungcat + M08_api + M03_web
- **trạng thái**: XONG · 31/31 cổng M12 · 49 pytest · web còn 1 vế đỏ **của đơn vị khác**

## §1 · Số liệu tổng kết LỆCH — hai lỗi, một của tôi  ✅

Ảnh chụp: KPI nói *"3 việc · đang chạy 3 · chờ 0 · xong 0"* ngay trên **ba cái
thẻ mang chip `cho`**.

**Lỗi A — tổng kết tính trên TẬP ĐÃ LỌC.** `ccNap` truyền `giai_doan` xuống
dịch vụ, `CC_DS` chỉ còn phần đã lọc, và `ccKpi` đọc chính nó. Bấm bộ lọc là
đổi luôn tổng kết. Một tổng kết đổi theo bộ lọc thì không phải tổng kết: hai
ảnh chụp cùng một hàng đợi cho hai bộ số.

Sửa: lấy TOÀN BỘ một lần, lọc ở FE. `CC_DS` = cả hàng đợi (tổng kết đọc),
`CC_HIEN` = phần đang xem (lưới đọc). Cùng một mảng nguồn ⇒ không có ca nào hai
bên lệch.

**Lỗi B — nhịp tim làm tươi lease của việc ĐÃ THẢ. Lỗi của tôi ở `WO-050`.**
`dat_giai_doan` làm tươi `nhan_luc` ở MỌI lần đổi giai đoạn, kể cả khi worker
hỏng và reset việc về `cho`. Việc bị bỏ mang lease tươi vĩnh viễn ⇒
`dang_giu: true` ⇒ KPI đếm là đang chạy, trong khi thẻ hiện chip `cho`.

### Và phép sửa đầu tiên của tôi cho lỗi B là một lỗi khác

Tôi xoá lease khi thả. `check_worker_song_song` đỏ ngay: **24 lượt chiếm cho 5
job**. Worker gặp `loai` không ai chạy được ⇒ thả về `cho` ⇒ lease bị xoá ⇒
việc thành "bỏ rơi" NGAY ⇒ vòng sau nhặt lại. Vòng lặp nóng, đốt CPU, không
tiến triển.

Đúng ra là **hai câu hỏi khác nhau dùng chung một hàm**:

```
con_giu(v)   "có ai đang GIỮ?"   → an toàn khi CHIẾM. Chỉ xét lease.
dang_lam(v)  "có ai đang LÀM?"   → con số trên màn. Đòi giai đoạn `dang-*`.
```

Một việc vừa chiếm còn ở `cho` (chưa kịp sang `dang-*`) **phải** tính là đang
giữ — không thì worker thứ hai cướp, hai lần gửi cho một việc. Nhưng nó **không
phải** đang làm. Gộp hai câu vào một hàm là chọn một trong hai để nói sai: siết
thì cổng song song đỏ, nới thì màn nói dối.

⇒ Tách hai hàm. `dat_giai_doan` **thôi làm tươi** lease ở giai đoạn không phải
`dang-*` (và **không xoá**) — lease cũ giữ nhịp `HAN_TREO` để chặn vòng lặp
nóng, còn `dang_lam` lo phần con số.

**Đo sau sửa:** `tổng 17 · đang chạy 1 · chờ 3 · xong 13`, và **0** thẻ `cho`
bị đếm là đang chạy.

## §2 · Bản nháp mở thành CỬA SỔ  ✅

*"tôi muốn bản chưng cất cũng xem dạng multi window như các bài viết"*. Bản
trước tôi đổ vào panel nổi — không kéo, không đổi cỡ, không mở song song hai
bản để so.

Nay dùng LẠI `mo()` của `multiwindow` qua cầu một chiều: kéo · đổi cỡ · thu nhỏ
· mục lục · phân trang đều có sẵn, và một bản thứ hai của cửa sổ là một bản sẽ
lệch.

Hai chỗ phải sửa thêm sau khi đo trên trình duyệt thật:
- **Cầu công bố NGAY**, không lười. Bản trước gán `__GN_MW__` bên trong hai hàm
  chỉ chạy TRONG cửa sổ đọc, nên trên `/chung-cat/` nó `undefined` và bấm một
  bản nháp không mở gì.
- **Cắt frontmatter**: bản ghi trong kho đã tách sẵn `frontmatter`/`than`; bản
  nháp là MỘT chuỗi đủ cả hai, nên dòng đầu bài đọc thành `---slug: … source_type: …`.

Trường ngữ cảnh khai TRUNG THỰC: `credibility_max: "—"`, `priority: 0`. Gán bừa
một `high` cho bản chưa ai duyệt là một lời khai sai ngay trên thanh trạng thái.

## §3 · Kết quả TÁCH TAB + phân loại trạng thái  ✅

*"màn kết quả tách riêng tab, không để lộn vào màn menu chưng cất. Cần phân
loại rõ cái nào đang nháp cái nào được duyệt"*.

Hai tab **Hàng việc** / **Kết quả**. Tab TRONG màn chứ không phải một màn
`/chung-cat/ket-qua/` riêng: màn mới cần một dòng `man-hinh.json` + markup
trong shell, mà shell đi theo MỌI trang và trần HTML trang chủ đang âm. Tab cho
cùng sự tách bạch mà không bắt bảy màn khác trả byte.

Phân loại hai tầng, vì chúng trả lời hai câu:
- **bộ lọc** `tất cả · nháp · đã gửi duyệt · đã duyệt · trả lại · đã bỏ` →
  *"cho tôi xem nhóm này"*;
- **nhãn trên MỖI dòng** → *"dòng này thuộc nhóm nào"*. Một danh sách trộn mà
  không có nhãn thì phải bấm lọc mới biết.

Enum theo đúng thứ tự VÒNG ĐỜI, không theo bảng chữ: người đọc màn này đang
theo dõi một dòng chảy, không tra từ điển. `M12-R2` — màn chỉ ĐỌC, không chạm
`trang_thai`.

## Ba lỗi tôi tự gây trên đường (ghi để không lặp)

1. **Xoá khai báo bằng cắt dải.** Viết lại `ccMoNhap` bằng `s[:i] + moi + s[j:]`
   đã nuốt luôn `NH_LOC_DS`/`NH_LOC` nằm trong khoảng đó. Đây là **lần thứ hai**
   trong phiên một phép cắt dải xoá thứ không định xoá (lần đầu: `.surface` và
   `.hv-txt` ở `WO-051`).
2. **TDZ lần thứ ba.** Khai `NH_LOC_DS` cạnh `CC_NHAP` ở cuối file trong khi
   `ccDungKhung` dùng nó lúc khởi động ⇒ `ReferenceError`, màn trắng.
3. **`[\s\S]` trong CHUỖI** (`WO-052` cũng dính): trong chuỗi JS nó là `[sS]`.

Cả ba đều bắt được vì chạy thật trên trình duyệt, không vì đọc mã.

## Vế đỏ còn lại — không phải của đơn vị này

`trang chủ 61980/61440` — hai chip `md`/`txt` của `T03-111`. Đã quy chủ bằng
phép đo và ghi backlog M03 ở `WO-051`.

· object: `chungcat/src/vong.py` · `chungcat/tests/check_viec_bo_roi.py`
  · `web/plugins/chungcat/src/chungcat.inline.ts`
  · `web/plugins/multiwindow/src/scripts/multiwindow.inline.ts`
