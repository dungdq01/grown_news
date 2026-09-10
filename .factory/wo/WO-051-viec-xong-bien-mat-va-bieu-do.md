# WO-051 — việc XONG biến mất · dây chuyền có nhịp · biểu đồ thay ô số

- **mở/đóng**: 2026-09-05 · **module**: M12_chungcat + M03_web
- **trạng thái**: XONG · 31/31 cổng M12 · 49 pytest · web còn 1 vế đỏ **của đơn vị khác**

Bốn phản hồi kèm ảnh chụp của chủ dự án sau khi chưng cất một `.md`
(`linux-foundation`). Ba trong bốn có **cùng một** nguyên nhân gốc.

## §1 · NGUYÊN NHÂN GỐC — `liet_ke()` không đọc `done/`  ✅

Đo được: việc `e0431f6f…` **chạy XONG** và nằm ở `done/`. Nhưng
`vong.liet_ke()` chỉ đọc `new` + `cur`. Hệ quả là ba phản hồi khác nhau của
cùng một lỗi:

| phản hồi | thật ra là |
|---|---|
| *"tab nói chưa có việc nào cho bản ghi này"* | việc đã xong ⇒ không nằm trong `new`/`cur` |
| *"mở /chung-cat/ cũng không thấy trong danh sách"* | cùng lý do |
| ô KPI `XONG` = **0** trong khi `done/` có 20 việc | cùng lý do |

Trạng thái `xong` là trạng thái người dùng quan tâm **nhất** — nó là chỗ có kết
quả để đọc. Một màn quản lý ẩn nó đi thì không phải màn quản lý.

Sửa: `liet_ke()` đọc cả `done/`, tên giảm dần (ULID mang thời điểm ⇒ mới nhất
trước) và dừng ở `TRAN_LIET_KE * 2` — không phải đọc 10.000 file để hiện 50
dòng. Việc ở `done/` luôn `dang_giu: false` dù `nhan_luc` còn tươi; thiếu dòng
đó thì một việc vừa xong bị KPI đếm là "đang chạy" thêm 30 phút.

**Đo sau sửa:** `/api/job` trả `tổng 15 · xong 11`, và `linux-foundation` hiện
ra với thẻ `xong` xanh.

## §2 · DÂY CHUYỀN có nhịp — *"nhà máy đang làm việc"*  ✅

Chỉ đạo: *"phải hiển thị tiến trình + animation lông lẫy running chứ"*.

Bản cũ hiện MỘT chip chữ (`dang-verify`) và không nói gì về *còn bao xa*. Nay
mỗi dòng là một **dây chuyền 5 hạt** — `xếp hàng → đọc nguồn → gọi model →
đối chiếu → xong` — hạt đã qua xanh, hạt đang chạy **nảy nhịp**, kèm câu
*"Nhà máy đang chạy N việc — kết quả hiện ngay tại đây"* và một đèn thở.

**KHÔNG dùng phần trăm**: bốn chặng không cho ra một %, và một % bịa từ bốn nấc
là con số không ai đo được (cùng lý do `T03-110` chốt chip ENUM). Dây chuyền nói
đúng thứ biết được: chặng nào xong, chặng nào đang chạy.

`role="img"` + `aria-label` cho dây chuyền: nó là HÌNH, và người đọc bằng screen
reader phải nhận cùng thông tin bằng chữ.

⚠️ **Đo được và phải nói ra:** một `.md` chạy hết dây chuyền trong **~1 giây**,
nên trạng thái running gần như không kịp thấy. Ảnh tĩnh mà chủ dự án gửi KHÔNG
phải vì thiếu animation — nó là §1 (việc đã xong nhưng bị ẩn). Animation chỉ
thấy rõ ở nguồn lớn (`dang-goi-model` đo được 4.9s–19.4s).

## §3 · Toast nói tiếng người  ✅

Bản cũ: *"Đã nhận việc e0431f6f6ba24d249534892cdd18887d · model
google/gemini-2.5-flash-lite · khu vực khong-xac-dinh — mở /chung-cat/?job=…"*.
Chủ dự án đã yêu cầu bỏ **hai lần**.

Ba thứ sai trong một câu: ULID 32 ký tự không ai đọc nổi và không copy được từ
một toast tự tắt; `khong-xac-dinh` là từ vựng NỘI BỘ của `FR-053 §1.4`; và một
đường dẫn dán vào câu chữ bắt người tự ghép URL.

Nay: *"Đã xếp hàng — nhà máy đang chưng cất. Theo dõi ở tab "Chưng cất" của cửa
sổ này."* Ba dữ kiện kia vẫn còn ở panel chi tiết và nhật ký, nơi chúng dùng
được.

## §4 · BIỂU ĐỒ thay năm ô số  ✅

Chỉ đạo: *"cần là biểu đồ, animation. Không phải summary theo con số"*.

Nay: một **thanh xếp lớp** (đang chạy · chờ · cần xử lý · xong) + tổng lớn +
đèn *"nhà máy đang chạy"* + chú giải có số.

Vì sao thanh xếp lớp chứ không donut/sparkline:
- câu hỏi của màn này là *bao nhiêu phần hàng đợi đang chạy / chờ / xong* — một
  TỈ LỆ CỦA MỘT TỔNG, và thanh xếp lớp là hình đúng cho tỉ lệ của một tổng;
- donut cần nhãn dẫn ra ngoài hoặc chú giải rời, tốn chỗ ngang mà màn này đang
  cần cho lưới thẻ;
- sparkline cần CHUỖI THỜI GIAN, còn `/api/job` trả trạng thái HIỆN TẠI — vẽ một
  đường từ dữ liệu không có trục thời gian là vẽ một con số bịa.

`tong === 0` ⇒ tỉ lệ 0, không `NaN`: một `scaleX(NaN)` làm thanh biến mất và
trông y như "không có dữ liệu" — hai trạng thái khác nhau.

## Chuyển động — luật `AC6` giữ nguyên

Mọi animation nằm trong `@media (prefers-reduced-motion: no-preference)` — viết
chiều **opt-in**, không chiều tắt-sau: quên một luật ở chiều tắt-sau là một
animation lọt qua, quên ở chiều này thì chỉ là tĩnh.

Và chỉ `transform`/`opacity` — hai thuộc tính chạy trên compositor. Bề rộng đoạn
biểu đồ đặt bằng `flex-basis` (một lần, lúc render) và hiệu ứng bằng
`scaleX()`; animate `width` là reflow mỗi frame, đúng thứ `AC6` cấm.

CSS của cả hai phần nằm trong **chunk**, không trong `prototype.css`: `gn.css`
đã sát trần và `FR-061` cấm nới bundle chung (`WO-048`/`WO-050` cùng lối).

## Một lỗi tôi gây ra trên đường và đã sửa

Dời khối CSS `.cct`/`.tr` sang chunk, tôi cắt `s[:i]` — từ khối của mình **tới
hết file** — nên xoá luôn `.surface` và `.hv-txt` mà phiên khác vừa nối thêm sau
đó (`T03-111`). Cổng `markup-matches-css` bắt: *"không có luật: hv-txt"*. Lấy
lại nguyên văn từ `gn.css` mà server đang chạy còn giữ trong bộ nhớ.

Bài học ghi ngay tại chỗ: file này có **nhiều phiên cùng ghi** — phải cắt đúng
đoạn của mình (`s[:i] + s[j:]`), không bao giờ cắt tới EOF.

## Vế đỏ còn lại — KHÔNG phải của đơn vị này

`trang chủ 61981/61440`. Quy chủ bằng phép đo: bỏ `.md`+`.txt` của `T03-111` ⇒
`61433` (dư 7); bỏ 5 dòng video của `T01-45` ⇒ **không đổi**. Hai chip `md`/`txt`
của phiên khác làm vỡ một trần vốn chỉ còn 7 byte. Đã ghi hai ô backlog M03 kèm
ba lối chọn; KHÔNG tự xoá dòng của họ, KHÔNG tự nới trần (`FR-061` lập tiền lệ).

· object: `chungcat/src/vong.py` · `chungcat/tests/check_viec_bo_roi.py`
  · `web/plugins/cctab/src/cctab.inline.ts`
  · `web/plugins/chungcat/src/chungcat.inline.ts` · `web/styles/prototype.css`
  · `06_modules/M03_web/backlog.md`
