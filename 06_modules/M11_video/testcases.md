# M11_video — testcases

> Mỗi AC **≥1 happy + ≥1 edge**, viết **bằng lời**. Không viết mã test — `m-test`
> ở s8 là **vai riêng**, giữ nguyên quyền FR ngược về đây (R1).
>
> **Phép thử của chính s6**: *viết không nổi testcase cho một AC ⇒ AC mơ hồ ⇒
> DỪNG, sửa AC*. Kết quả ở **§cuối**.
>
> ⚠️ Module này là chỗ **lần đầu sản phẩm gọi ra mạng ngoài**. Nên `M09-R3`
> (click-to-load) là luật nặng nhất ở đây, và nó phải đo bằng **request thật**,
> không bằng markup.

## 2.1 · Bảng `video` — không byte, nên khác tài liệu ở một chỗ

**AC-2.1.1** — bảng chỉ nhận `source_type = 'video'`; bản ghi `video` thiếu **cả**
`media` **và** `url_normalized` bị chặn ở cổng validate
- *happy*: hàng `source_type: 'video'` có `url_normalized` → nhận.
- *edge*: hàng `video` (`ho_so: thu-vien`) thiếu **cả** `media` **và**
  `url_normalized` → chặn ở `validate.py:398-401`, và lỗi nói *"đó là đơn vị đếm
  nguồn độc lập"* — tức nêu **lý do**, không chỉ nêu vi phạm.
- *edge 2*: hàng `video` có `url_normalized` mà **không** `ho_so: thu-vien` →
  cổng ở `:398` **không** chạy (nó nằm trong nhánh `thu-vien`). Bản ghi qua, và
  `url_normalized` lúc đó chỉ được canh bởi **cổng 9** (khai tay = hàm tính) —
  cổng đó bắt *"khai sai"*, chưa đo được nó có bắt *"khai thiếu"*.
- *edge 3*: hàng `video` có **cả** `url_normalized` **và** `media` → qua. Đó là
  *"byte vào kho cho một bản video"*, thứ `§4` cấm. Trần 25 MB và mime enum đóng
  (5 loại tài liệu) vẫn chặn **byte video thật**, nên lỗ hẹp — nhưng nó tồn tại,
  và thứ chặn nó **không** phải cổng nào của M11.
- *edge 4*: INSERT `source_type: 'tai-lieu'` vào bảng này → CHECK từ chối.
- *edge 5*: `url_normalized` có mà **host ngoài whitelist** → phải chặn ở cổng
  **server**. ⚠️ Đo được (plan `S23`): một bản video host lạ kèm `url_normalized`
  đi qua `validate.py --strict` **sạch** — whitelist host trước FR-040 **chỉ sống
  ở FE**. `/api/video` là lần đầu luật đó có mặt phía server.
- *edge 6*: `slug` trùng ở bảng khác → nhận (khoá kép).
- *edge 7*: mọi ca chạy trên **bản sao** DB.

## 2.2 · Màn `/video/` — danh sách + CRUD tại chỗ

**AC-2.2.1** — màn chỉ hiện bản ghi `video`; gieo thêm bài viết và tài liệu thì
số đếm KHÔNG đổi
- *happy*: kho 4 video → màn hiện 4.
- *edge*: gieo thêm 5 bài viết + 3 tài liệu → màn **vẫn** 4. Phải gieo **cả hai**
  loại kia; gieo một loại thôi thì bộ lọc sai vẫn xanh.
- *edge 2*: 0 video → trạng thái rỗng, **không** hiện loại khác, **không** kẹt
  *"đang tải…"*.
- *edge 3*: kho > `NGUONG.moiTrang` video → cắt và **nói ra** phần bị cắt.
- *edge 4*: phép đếm của test cắt đúng lưới của màn này, không cắt cả trang
  (plan `S20`: ba phép đo từng lấy sai phạm vi vì đúng chuyện này).

**AC-2.2.2** — mở màn với N bản ghi ⇒ **0 request** ra host ngoài; `src` iframe
chỉ tồn tại sau khi người đọc bấm
- *happy*: mở màn với 10 video → **0** request tới `youtube.com`/`ytimg.com`/bất
  kỳ host ngoài. Đo bằng **network log**, không bằng markup.
- *edge*: `src` phải **vắng** khỏi DOM trước khi bấm — không phải `src=""`, không
  phải `data-src` rồi một script gán ngay lúc tải. Một `src` đúng đắn xuất hiện
  sau `DOMContentLoaded` vẫn là một request.
- *edge 2*: **ảnh thumbnail** cũng là request ra ngoài. Một nút play có ảnh nền
  `i.ytimg.com/...` vi phạm AC dù không có iframe nào. Phép thử phải đếm **mọi**
  host ngoài, không chỉ iframe.
- *edge 3*: `<link rel="preconnect">` hay `dns-prefetch` tới host video → cũng là
  một lần chạm mạng ngoài. Spec nói *"không gọi ra mạng ngoài"*, không nói mức nào.
- *edge 4*: bấm nút play → `src` xuất hiện, **một** request, và **chỉ** cho video
  được bấm (không tải trước video kế).
- *edge 5*: `reduced motion` / JS tắt → nút play vẫn hiện và vẫn là một liên kết
  ra ngoài **có chủ ý** (người bấm), không tự nhúng.

⚠️ Đây là AC duy nhất trong 11 module đầu mà **hành vi đúng nằm ở thứ KHÔNG xảy
ra**. Cách duy nhất đo được là đếm request thật; đọc mã và đọc markup đều xanh
được trên một trang đang rò.

## 2.3 · Màn nạp `/video/nap/` — validate URL TRƯỚC khi ghi

**AC-2.3.1** — URL host ngoài whitelist bị chặn **ở FE**; `url_normalized` do
`normalize_url()` sinh, không lấy từ client
- *happy*: dán `https://www.youtube.com/watch?v=dQw4w9WgXcQ` → hiện `✓ youtube ·
  id dQw4w9WgXcQ` ngay lúc dán, **0** request tới server.
- *edge*: dán `https://evil.example/watch?v=X` → `✕ host không nằm trong danh
  sách`, **ở FE**, không đợi `422`.
- *edge 2*: gửi `url_normalized` **bịa** trong request (bỏ qua form) → server
  **tính lại** bằng `normalize_url()` và bỏ giá trị client. Đây là vế mà FE
  **không** bảo vệ được; xem `AC-2.1.1 edge 5` — nó là lỗ đã đo.
- *edge 3*: `youtu.be/X` và `youtube.com/watch?v=X` → **cùng** `url_normalized`
  ⇒ gộp theo nguồn (M03-R5) không bị thổi số. Nếu hai bản ghi ra hai
  `url_normalized`, một video thành hai *"nguồn độc lập"*.
- *edge 4*: URL có id đúng định dạng nhưng **video không tồn tại** → không kiểm
  được mà **không** gọi ra ngoài. Nên bản ghi hợp lệ có thể trỏ một video đã xoá,
  và điều đó **phải chấp nhận được** — spec không nói.
- *edge 5*: `id_tu` rút được id nhưng `id_mau` **không** xác nhận → chặn. Hai
  bước (rút rồi xác nhận) là hai cổng; phép thử phải nói cổng nào báo.
- *edge 6*: URL **rỗng** hoặc chỉ dấu cách → chặn ở form, không tạo bản ghi
  `url_normalized: ""`.

**AC-2.3.2** — form nạp có ô chọn `category` + `concepts` từ danh mục; nhãn ngoài
danh mục bị chặn
- *happy*: chọn nhãn có trong danh mục → ghi thành công.
- *edge*: id ngoài danh mục → chặn (cổng 5/5b, áp cho **mọi** hồ sơ).
- *edge 2*: `GET /api/concepts` **thất bại** → form **nói ra**, không hiện danh
  sách rỗng như thể danh mục trống (cùng ca với M10 `AC-2.3.1 edge 2`).
- *edge 3*: bỏ trống cả hai ô → chặn ở form.

## 3 · Công thức

- *happy*: `url_normalized = normalize_url(url)` — **dùng lại M01**, không viết
  bản thứ hai (M05-R3). Phép thử: quét mã của module → có `import`/lời gọi tới
  hàm của M01, và **0** bản copy logic chuẩn hoá.
- *edge*: `priority` **luôn 0** ⇒ ra khỏi ba pane chất lượng (M09-R4). Phép thử:
  gieo một video rồi đòi nó **vắng** khỏi ba pane đó — không phải *"có priority
  0"*, mà **vắng**.
- *edge 2*: `id_tu` và `id_mau` đọc từ `media-mime.json:video_host` → thêm một
  host vào bảng khai thì module nhận host đó **không sửa dòng mã nào**. Đây là
  phép thử **hành vi** của *"bảng khai một chỗ"*.

## 4 · Điều module CẤM — mỗi dòng một phép thử

- *đọc/ghi `bai_viet` hay `tai_lieu`*: quét mã màn này → một tên bảng.
- *dựng `src` iframe từ `fm.url`*: quét → `src` chỉ dựng từ whitelist host +
  regex id (M09-R3), không từ trường tự do của frontmatter. Đây là chỗ một URL
  người nộp trở thành một request của trình duyệt người đọc.
- *nhúng video khi mở trang*: `AC-2.2.2`.
- *nhận `url_normalized` từ client*: `AC-2.3.1 edge 2`.
- *tải byte video vào kho*: ⚠️ **không cổng nào của M11 chặn** — thứ chặn byte
  video thật là trần 25 MB + mime enum đóng của M09. Xem `AC-2.1.1 edge 3`.

## Kết quả PHÉP THỬ s6 — bốn phát hiện

**1 · `§5` khai `⬜ chưa dựng`, nhưng cả ba lệnh `hard` đều XANH.**
Đo 2026-09-03: `check_ba_bang.py` · `man-video.test.js` · `no-leak.test.js` xanh;
`man-hinh.json` có `video`. Cùng ô với M10 — **một cổng còn thiếu, hai chiều**
(M04/M06 nói còn đỏ khi đã xanh; M10/M11 nói chưa dựng khi đã dựng).

**2 · HAI HỆ TÊN BẢNG trong một file.** `§2.1` viết tên **cũ** — *"khác
`documents`"*, *"cùng hình dạng cột với `articles`"* — còn `§4` viết tên **mới**:
*"không đọc/ghi bảng `bai_viet` hay `tai_lieu`"*. Bảng thật là `bai_viet` ·
`tai_lieu` · `video`. Trong M10 lỗi này xuất hiện 9 lần **thuần** tên cũ; ở đây
nó **trộn**, nên người đọc không có cách nào biết hệ nào đúng từ chính file.

**3 · `§2.1` TRỎ SAI FILE — luật đúng, chỗ khai sai.**

Spec viết: *"Schema đã khai điều đó — `frontmatter.schema.json` nhánh
`ho_so: thu-vien` là `anyOf [media | url]`"*. Đo cả bốn chỗ:

| điều được cưỡng chế | cưỡng chế Ở ĐÂU | cơ chế |
|---|---|---|
| `tai-lieu` ⇒ phải có `media` | `schema allOf[5]` | nhánh **theo loại** |
| `tai-lieu` ⇒ phải có hiện vật | `validate.py:395` | phép kiểm Python |
| `video` ⇒ phải có `url_normalized` | **`validate.py:398-401`** | phép kiểm Python |
| `url` (thô) bắt buộc | `schema required` gốc | trường toàn cục |
| `thu-vien` ⇒ `media` **hoặc** `url` | `schema allOf[6]` | `anyOf` |

⇒ **`AC-2.1.1` nói ĐÚNG** — bản ghi `video` thiếu cả hai **bị chặn**. Nhưng thứ
chặn nó là **`validate.py`**, không phải cái `anyOf` mà `§2.1` trỏ tới. Và
`anyOf` **không phải** thứ giữ vế nào: nó yếu hơn `allOf[5]` cho `tai-lieu`, và
yếu hơn `validate.py:398` cho `video`.

Ba hệ quả thật:
- **Ai đọc spec sẽ tìm luật ở sai file.** Sửa `anyOf` không đổi hành vi; sửa
  `validate.py:398` thì đổi — và không ai được cảnh báo.
- **Cổng nằm trong nhánh `ho_so: thu-vien`** ⇒ một bản `video` **không** khai
  `ho_so` thì cổng đó không chạy (`AC-2.1.1 edge 2`). `ho_so` **không** nằm trong
  `required` gốc.
- Nới `required` gốc (bỏ `url`) hoặc dời khối `thu-vien` sẽ mở một lỗ ở M11, và
  **không cổng nào nối hai chuyện lại** — cùng hình dạng với M06 `verdict.py:51`
  dựa vào `required` của `skill_candidates`. **Hai module, cùng kiểu phụ thuộc ẩn
  vào một artifact khác.**

⚠️ Tôi viết mục này **sai hai lần** trước khi đo đủ: lần đầu nói *"schema không
phân biệt hai loại"*, lần hai nói *"video có media mà không url thì qua"*. Cả hai
sai vì tôi đọc **một** nhánh `allOf` rồi phán về **cả** hệ cưỡng chế — mà hệ đó
nằm ở **hai** file. Ghi lại vì nó đúng lớp lỗi file này đang tìm: **đo một mặt
rồi phán về mặt khác.**

**4 · Whitelist host CHỈ sống ở FE, và `AC-2.3.1` khai đúng thế — nhưng đó là
một lỗ, không phải một thiết kế.** Đo được (plan `S23`): một bản video host lạ
kèm `url_normalized` đi qua `validate.py --strict` **sạch**. AC viết *"bị chặn ở
FE"*, và điều đó đúng — nhưng FE là **tiện lợi**, không phải cổng: ai gọi
`/api/...` trực tiếp thì bỏ qua nó. Và `AC-6.3` (allowlist đích) **không** bắt
được, vì `youtube.com` là một đích trông hợp lý.
⇒ Cần một vế server-side, và `/api/video` của FR-040 là chỗ nó thuộc về.

⇒ Cả bốn vào `backlog.md`. Mục 1, 2, 3 chạm `spec.md` FROZEN ⇒ **FR id**.
