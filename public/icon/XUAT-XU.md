# Xuất xứ của icon trong thư mục này

> **Tên file = ĐÚNG giá trị của chip** (`md` không phải `markdown`, `fb`
> không phải `facebook`). Nhờ vậy tập icon là CHÍNH thư mục này — thêm một
> `.svg` là có icon mới, 0 dòng mã — và không cần một bảng ánh xạ, thứ sẽ là
> bản thứ hai của danh sách file.

## Mark CHÍNH THỨC — `simple-icons`

| file | brand | nguồn |
|---|---|---|
| `youtube.svg` | YouTube | `simple-icons@16.30.0` — `icons/youtube.svg`, copy NGUYÊN |
| `tiktok.svg` | TikTok | `simple-icons@16.30.0` — `icons/tiktok.svg`, copy NGUYÊN |
| `fb.svg` | Facebook | `simple-icons@16.30.0` — `icons/facebook.svg`, copy NGUYÊN |
| `md.svg` | Markdown | `simple-icons@16.30.0` — `icons/markdown.svg`, copy NGUYÊN |

`simple-icons` phát hành dưới **CC0-1.0** (cống hiến vào phạm vi công cộng).
Bản thân các mark vẫn là **nhãn hiệu của chủ sở hữu tương ứng**; ở đây chúng
dùng để **định danh nguồn** của một bản ghi — đúng thông lệ, và đó là lý do
`DISCLAIMER.md` của gói cho phép.

Copy **nguyên path**, chỉ thêm `fill="currentColor"`. KHÔNG vẽ lại, KHÔNG sửa
tỉ lệ: một mark bị sửa là một mark sai, và không ai kiểm được nó bằng mắt.

## Glyph TỰ VẼ — cho thứ không có mark

| file | vì sao tự vẽ |
|---|---|
| `pdf.svg` `docx.svg` `pptx.svg` `txt.svg` | Adobe và Microsoft **đã yêu cầu gỡ** mark của họ khỏi `simple-icons`, nên không có bản chính thức để copy. Và tự vẽ ở đây ĐÚNG HƠN: một file `.pdf` không nhất thiết là của Adobe — nó là một **định dạng**, không phải một sản phẩm |

Bốn glyph ấy là MỘT hình (tờ giấy góc gấp), khác nhau ở CHỮ bên trong. Chữ là
thứ người đọc thật sự cần, và nó không mượn hình của ai.

## Thứ CỐ Ý không có

- ~~**douyin**~~ — **ĐẢO 2026-09-09**, chủ dự án yêu cầu dùng mark thật. Xem
  mục *"Mark ngoài `simple-icons`"* bên dưới. Câu cũ vẫn đúng về `simple-icons`:
  tới `16.30.0` (bản mới nhất, đo 2026-09-09) nó vẫn KHÔNG có Douyin, chỉ có
  `bytedance` — công ty mẹ, không cùng một mark.
- **icon theo nhà cung cấp model** — đo 2026-09-07: bảng khai có **14** nhà,
  `simple-icons` chỉ có mark cho **6** (`google` `deepseek` `anthropic` `qwen`
  `nvidia` `minimax`). Tám nhà rơi về một glyph chung thì bộ icon nói *"tám nhà
  này giống nhau"* — sai, và tệ hơn không có icon nào. Chưa làm.


## Mark NGOÀI `simple-icons` — và vì sao nó là một hạng KHÁC

| file | brand | nguồn | giấy phép |
|---|---|---|---|
| `douyin.svg` | Douyin | `en.wikipedia.org/wiki/File:Douyin_logo.svg` | `PD-ineligible-USonly` + `Trademarked` |

⚠️ **Không cùng hạng với bốn mark trên.** `simple-icons` là **CC0-1.0** — cống
hiến vào phạm vi công cộng, toàn cầu. File Douyin thì:

- **tự do ở Mỹ** vì "hình học đơn giản, không đủ tính nguyên gốc" để có bản quyền
- **KHÔNG tự do ở Trung Quốc** tới 01-01-2067 — đó là lý do nó nằm trên
  English Wikipedia chứ không phải Wikimedia Commons
- mang thẻ `{{Trademarked}}` (bốn mark kia cũng vậy)

Dùng ở đây là **định danh nguồn** của một bản ghi — cùng thông lệ đã áp cho
YouTube/TikTok/Facebook. Rủi ro thấp nhưng **không bằng không**, và nó được ghi
ra để quyết định này nhìn thấy được và đảo lại được: glyph cũ còn trong git.

### Vì sao lấy CẢ BA lớp, không lấy riêng lớp đen

File gốc là **wordmark** 500×196 (nốt nhạc + chữ 抖音). Ta cắt lấy 7 path của
phần NỐT, giữ nguyên từng đường cong, chỉ đặt lại `viewBox` về bao của chính
chúng — không vẽ lại, không ép tỉ lệ.

Nốt ấy gồm **ba lớp lệch nhau**: cyan `#00faf0` · magenta `#ff0050` · đen
`#111111`. Hệ icon của dự án dùng CSS `mask`, mà mask bỏ màu và chỉ giữ bóng.

Đo bằng mắt ở đúng cỡ thẻ (99px), cạnh `tiktok.svg`:

- **chỉ lớp đen** → *giống hệt TikTok*. Douyin và TikTok cùng một chủ và mark
  gần như trùng nhau, nên một icon không phân biệt được hai nguồn là icon vô
  dụng đúng ở chỗ nó cần có ích.
- **hợp ba lớp** → viền lệch còn thấy được, phân biệt được với TikTok.

Nên chọn hợp ba lớp. Đây KHÔNG phải ngoại lệ của luật *"copy nguyên path"* —
cả ba lớp đều là path gốc, không đường nào bị sửa.
