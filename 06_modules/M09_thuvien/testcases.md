# M09_thuvien — testcases

> Mỗi AC **≥1 happy + ≥1 edge**, viết **bằng lời**. Không viết mã test — `m-test`
> ở s8 là **vai riêng**, giữ nguyên quyền FR ngược về đây (R1).
>
> **Phép thử của chính s6**: *viết không nổi testcase cho một AC ⇒ AC mơ hồ ⇒
> DỪNG, sửa AC*. Kết quả ở **§cuối**.
>
> ⚠️ Đây là spec **chặt nhất** trong 11 module đầu: 11 AC, **12** lệnh `hard`, tất
> cả **xanh** (đo 2026-09-03), và `§3` tự khai ba điều nó **KHÔNG** bao. Nên phần
> lớn testcase dưới đây là ca **biên** — chỗ AC đã đúng mà chưa đủ.

## 2.1 · DB — bảng `media`, địa chỉ theo nội dung

**AC-2.1.1** — `sha256` là PK, `byte` BLOB NOT NULL, `so_byte` GENERATED
- *happy*: INSERT một blob → `so_byte` bằng `length(byte)`, không ai khai nó.
- *edge*: cố `INSERT` kèm `so_byte` tường minh → SQLite **từ chối** (cột
  GENERATED không nhận giá trị). Đây là vế phân biệt *"cột dẫn xuất"* với *"cột
  người ta nhớ cập nhật"*.
- *edge 2*: `byte` = `NULL` → NOT NULL từ chối. `byte` = `X''` (blob rỗng) →
  **nhận**, và `so_byte` = 0. Một hiện vật 0 byte hợp lệ ở tầng DDL; cổng chặn nó
  là magic-byte và `file.size`, không phải DDL.
- *edge 3*: INSERT **hai** blob cùng nội dung → PK từ chối bản thứ hai ⇒ **dedup
  miễn phí**. Phép thử phải khẳng định bản ghi thứ hai vẫn **trỏ được** vào blob
  đã có, không chỉ khẳng định INSERT thất bại.
- *edge 4*: `INSERT OR REPLACE` một `sha256` đã có với `byte` **khác** → hai bản
  ghi khác nhau bỗng trỏ cùng một blob **sai**. ⚠️ Và `OR REPLACE` **đi vòng**
  `BEFORE UPDATE`/`BEFORE DELETE` trigger (đã đo trên SQLite trong phiên này) ⇒
  nếu bảng có trigger bảo vệ, phép thử phải dùng `OR REPLACE`. Địa chỉ-theo-nội-
  dung làm ca này *không thể xảy ra một cách trung thực*, nhưng nó xảy ra được
  một cách **bịa**.

**AC-2.1.2** — `source_type` nhận `tai-lieu`; giá trị ngoài enum bị CHECK chặn;
hai CHECK đồng bộ `frontmatter`↔cột vẫn bắn
- *happy*: `source_type: 'tai-lieu'` → nhận.
- *edge*: `source_type: 'tai_lieu'` (gạch dưới) → CHECK chặn. Một ký tự, và nó
  là ký tự phân biệt **giá trị enum** với **tên bảng** (bảng là `tai_lieu`, giá
  trị là `tai-lieu`) — chỗ dễ lẫn nhất của cả module.
- *edge 2*: `frontmatter.source_type` lệch cột → CHECK thứ hai bắn. Phép thử phải
  làm **lệch** thật, không chỉ khai đúng rồi tin.
- *edge 3*: `article_versions` và `recycle` **không có** CHECK enum ⇒ một
  `source_type` bịa **vào được** hai bảng đó. Spec khai điều này (*"không phải
  sửa"*) như một tiện lợi; nó cũng là một lỗ, và không AC nào nói về nó.

**AC-2.1.3** — round-trip `file → DB → file → DB′` giữ byte; export lần hai ghi
**0 file** (fixpoint); luật mồ côi hợp **union ba bảng**
- *happy*: vòng chạy xong, byte hiện vật giống hệt, lần export thứ hai ghi 0 file.
- *edge*: một blob **chỉ** được `recycle` tham chiếu → **không** bị reap. Nếu
  union thiếu nhánh `recycle`, xoá một bài rồi export ⇒ **byte biến mất vĩnh
  viễn** và bài trong thùng rác không phục hồi được.
- *edge 2*: một blob **chỉ** được `article_versions` tham chiếu → không bị reap
  (bản lưu trữ vẫn cần byte của nó).
- *edge 3*: ⚠️ **union giờ là NĂM nhánh, không ba.** Spec viết *"union ba bảng
  `articles` + `article_versions` + `recycle`"*. Sau FR-038 bảng bài viết tách
  làm ba (`bai_viet` · `tai_lieu` · `video`) ⇒ tập tham chiếu là **5** nhánh, và
  `kho.schema.sql` đã có VIEW `tham_chieu_media` cho đúng chuyện đó. Xem `§cuối`
  mục 1: `AC` nói *ba*, cấu trúc nói *năm*.
- *edge 4*: blob **mồ côi thật** (không nhánh nào trỏ) → bị reap, và phải **nói
  ra đã reap gì**. Đây là chỗ mất dữ liệu vĩnh viễn; một reap im lặng là reap
  không ai kiểm được.
- *edge 5*: `banXuat()` chạy **tự động** sau mỗi lần ghi ⇒ ca reap xảy ra **không
  cần ai gõ lệnh**. Nên mọi ca trên phải chạy trên **kho tạm**, không phải `kb/`.

## 2.2 · Hồ sơ kiểm thứ hai — `thu-vien`

**AC-2.2.1** — `thu-vien` thân rỗng qua cổng; `phan-tich` thiếu mục **vẫn** bị
chặn; `thu-vien` thân >400 từ bị chặn; `tai-lieu` không `media` bị chặn
- *happy*: bản `thu-vien` thân rỗng, có `media` → qua.
- *edge*: bản `phan-tich` thiếu mục → **vẫn** chặn. ⚠️ Đây là vế quan trọng nhất
  của AC: *"nhánh mới không được nuốt cổng cũ"*. Một `if ho_so == "thu-vien"`
  viết sai chỗ sẽ tắt bốn cổng hình dạng cho **mọi** bản ghi, và mọi test cũ
  **vẫn xanh** vì chúng gieo bản đúng.
- *edge 2*: `thu-vien` thân **401** từ → chặn. Thân 400 → qua (ca biên).
- *edge 3*: `ho_so` **vắng** → mặc định `phan-tich` (*"bài cũ không phải sửa"*).
  Đây là fail-**closed** đúng chiều: thiếu khai ⇒ áp cổng **chặt hơn**.
- *edge 4*: `ho_so: "thu_vien"` (gạch dưới) hoặc `"Thu-Vien"` → không khớp
  `"thu-vien"` ⇒ rơi về `phan-tich` ⇒ chặn vì thiếu mục. Hỏng **đúng chiều**,
  nhưng thông điệp lỗi sẽ nói *"thiếu mục"* thay vì *"hồ sơ sai tên"* — người
  dùng sửa sai chỗ.
- *edge 5*: tám cổng *"giữ BẬT cho cả hai hồ sơ"* → phép thử phải gieo một bản
  `thu-vien` phá **từng** cổng trong tám, không chỉ một. Bật một cổng cho hồ sơ
  mới và quên bảy cái kia là ca sẽ xanh nếu chỉ thử một.

**AC-2.2.2** — `normalize_url` xử lý TikTok; link rút gọn `vm.tiktok.com` không
giải được offline nên trả host+path và form **phải nói ra**
- *happy*: `tiktok.com/@user/video/123` → `tiktok.com/video/123`.
- *edge*: `vm.tiktok.com/ZM123` → trả host+path, **và** form nạp nói ra rằng nó
  chưa giải được. ⚠️ Vế *"form phải nói ra"* là **UI**, mà lệnh của AC là
  `pytest -k tiktok` — một phép thử Python **không đo được** UI. Nửa AC không có
  cổng.
- *edge 2*: hai link rút gọn **khác nhau** trỏ **cùng** một video → hai
  `url_normalized` khác nhau ⇒ một video thành hai *"nguồn độc lập"*, đúng thứ
  `url_normalized` sinh ra để chặn. Không giải được offline nghĩa là **không
  chặn được**, và điều đó phải nói ra ở chỗ đếm nguồn, không chỉ ở form.

## 2.3 · Đường nạp hiện vật

**AC-2.3.1** — `sha256`/`so_byte` do **máy** tính; `media.sha256` bịa bị từ chối;
magic-byte lệch mime bị từ chối; body 26 MB trả **413** trước khi đọc hết byte
- *happy*: nạp một PDF 2 MB → `201 { sha256, so_byte, mime }`, `sha256` khớp hash
  byte thật.
- *edge*: gửi `sha256` **bịa** trong `frontmatter.media` → cửa ghi từ chối (blob
  không có trong bảng `media`).
- *edge 2*: gửi `sha256` của một blob **có thật nhưng khác** → **nhận**. Đo
  được: `docHienVat` (`dungchung.mjs:626-631`) kiểm **định dạng** rồi kiểm **tồn
  tại**, không có vế nào nối blob với lần nạp vừa rồi. Đây **không** phải leo
  thang quyền (một kho, mọi bản ghi đọc được) — nó là chuyện **toàn vẹn dữ
  liệu**: bản ghi trỏ sai hiện vật, và `sha256` khớp nên không cổng nào thấy.
  Cộng một hệ quả nhỏ: `hienVatPhucVu` cố ý trả `null` cho blob **không bản ghi
  nào trỏ** (byte đang staging không phải nội dung công khai) — trỏ một bản ghi
  vào blob đó **làm nó công khai**. Không AC nào nói về ca này.
- *edge 3*: file HTML-có-script dán nhãn `application/pdf` → magic-byte chặn
  (`%PDF-` không khớp). Đây là *"phòng thủ duy nhất"* mà `§2.3` nói tới.
- *edge 4*: `.docx` **đổi tên** thành `.pptx` → magic-byte **KHÔNG** chặn (cả hai
  là ZIP `504b0304`). `§3` tự khai điều này. Hệ quả đo được: `content-disposition`
  vẫn `attachment` cho cả hai ⇒ **vô hại**; nhưng thẻ tài liệu hiện sai icon.
- *edge 5*: body **26 MB** → `413`. ⚠️ Và `§3` khai `413` **không tới được
  client** giữa lúc upload (ECONNRESET). Nên phép thử phải đo `413` **ở server**
  (log/response), không đo *"client thấy 413"* — nếu đo phía client nó sẽ đỏ oan.
- *edge 6*: `x-ten-goc` chứa `../../etc/passwd` → chỉ để **hiện**, `esc()` rồi
  hiện; **không** dùng làm đường dẫn. Spec viết `NEVER là đường dẫn` bằng chữ in.
- *edge 7*: `content-length` khai **nhỏ** hơn byte thật → phải chặn khi đọc quá,
  không tin đầu đề. Một `content-length: 1` kèm 26 MB byte là đúng ca cổng
  *"kiểm TRƯỚC khi đọc byte"* bị đi vòng.

**AC-2.3.2** — mọi đường ghi media dưới `/api/articles/…` nên whitelist của
`no-write-path` **không cần sửa**; `luuHienVat` có `giaoDich(` thì phải có `banXuat(`
- *happy*: hai cổng xanh.
- *edge*: thêm một đường ghi ngoài tiền tố (`/api/media/...`) → `no-write-path`
  phải **đỏ**. Nếu nó xanh thì whitelist đang là *"chấp nhận mọi thứ"*.
- *edge 2*: gỡ `banXuat(` khỏi `luuHienVat` → `api-guard` răng 3 đỏ. Luật này nói
  *"ghi vào DB thì phải export"*, và bỏ nó ⇒ blob trong DB mà không có file backup
  ⇒ kịch bản F4 (dựng lại từ git) **mất hiện vật**.

## 2.4 · Giao diện — nạp và xem

**AC-2.4.1** — lối nạp thứ tư có ở **CẢ HAI** `shell.html` và có nhánh xử lý;
bảng mime tới bundle qua `__MEDIA__`; `file.size` kiểm **TRƯỚC** `fetch`;
`ho_so`+`media` có trong shape `Ban` ở **cả ba** đường dữ liệu
- *happy*: bốn vế xanh.
- *edge*: sửa **một** `shell.html` mà quên cái kia → phải đỏ. Hai file
  **byte-identical**; một phép thử chỉ đọc một file sẽ xanh trên trạng thái lệch.
- *edge 2*: gõ tay một chuỗi mime trong `.ts` → phải đỏ. Đây là phép thử *"bảng
  khai một chỗ"*, và nó đo **sự vắng mặt** của chuỗi, nên nó dễ đỏ oan vì một
  chuỗi trong **chú thích** — lớp lỗi đã trúng phiên này sáu lần.
- *edge 3*: ⚠️ **có BỐN builder `Ban`, không ba.** AC nói *"cả ba đường dữ liệu
  (`banTuDb` · `docTuDia` · `/api/index`)"*, và bản B0 của nó nói *hai*. Builder
  thứ tư là `theBai()` (`articles.mjs:20-32`), và nó **không** trả `ho_so`/`media`
  (plan sự thật 8). Xem `§cuối` mục 3.
- *edge 4*: `file.size` = trần đúng bằng 25 MB → ca biên `>` vs `>=` chưa chốt.

**AC-2.4.2** — PDF khung được; video **không** request gì trước khi bấm; ppt/word
ra thẻ + tải về; `src` không bao giờ từ `fm.url`; `ten_goc` được `esc()`
- *happy*: năm vế xanh.
- *edge*: `fm.url` chứa `javascript:` hoặc `data:text/html,...` → **không** vào
  `src` (nó không bao giờ vào `src`), và cũng không vào `href` của nút tải về.
- *edge 2*: `ten_goc` chứa `<img onerror=...>` → `esc()` rồi hiện. Phép thử phải
  đọc **DOM đã render**, không đọc chuỗi template.
- *edge 3*: mở màn với **0** video nhưng có 3 PDF → 0 request ra ngoài (PDF là
  same-origin). Ca này phân biệt *"không request vì không có video"* với *"không
  request vì click-to-load"* — hai lý do, một kết quả.
- *edge 4*: một mime **ngoài** enum lọt vào frontmatter → thẻ phải ra
  `attachment`, không ra khung trắng. `§2.4` nói thẳng *"không phải khung trắng"*.

**AC-2.4.3** — đường phục vụ byte mang đủ **sáu** đầu đề
- *happy*: sáu đầu đề có mặt, `content-type` **từ enum đóng** (không sniff tên file).
- *edge*: file `.pdf` khai mime `text/html` → `content-type` lấy từ **enum**, ra
  `application/pdf` hoặc từ chối — **không** ra `text/html`. Đây là chỗ một
  `content-type` sai biến một tải-về thành một trang chạy script.
- *edge 2*: `.pptx` → `content-disposition: attachment`, **không** `inline`. Và
  `.pdf` → `inline`. Hai giá trị cho hai loại; một cài đặt trả `inline` cho tất cả
  vẫn có đủ "sáu đầu đề".
- *edge 3*: `etag` **không đổi** giữa hai request cùng blob (địa chỉ theo nội
  dung ⇒ `etag` hợp pháp vĩnh viễn), và `cache-control: immutable`.
- *edge 4*: CSP `default-src 'none'; sandbox` → một PDF có JS nhúng **không** chạy
  được. Phép thử đọc đầu đề; ca *"JS trong PDF không chạy"* cần trình duyệt thật.

## 2.5 · Tổng hợp All — số đếm và thước đo KHÁC nhau

**AC-2.5.1** — gieo 3 phân tích + 4 thư viện: số đếm khớp tay; pane chất lượng
**không** đổi; sidebar lọc theo loại hiện `tai-lieu` với số đúng
- *happy*: ba vế xanh.
- *edge*: gieo **50** bản thư viện → pane chất lượng **vẫn** không đổi. Với 4 bản
  một cài đặt sai chỉ lệch chút; với 50 nó lệch rõ. Con số trong AC là **4**, và
  4 là số nhỏ nhất mà một lỗi làm-phẳng còn ẩn được.
- *edge 2*: gieo **0** bản phân tích + 4 thư viện → pane chất lượng hiện **trạng
  thái rỗng**, không hiện `0%` như thể đã đo. *"Chưa có gì để đo"* ≠ *"đo được 0"*.
- *edge 3*: mỗi pane phải **khai rõ nền của nó** (quy ước `trang.mjs:699`). Phép
  thử: đọc markup mỗi pane chất lượng → có nhãn nói nền là `phan-tich`. Không có
  nhãn thì người đọc thấy một con số không biết nó đếm gì.
- *edge 4*: `khoi3D` chỉ hiện **3** cột (`NGUONG.cot3D`) ⇒ thêm một loại nguồn
  thứ tám sẽ đẩy một loại ra khỏi biểu đồ **im lặng**. Spec dùng đúng lý lẽ này
  để quyết *"một `source_type` mới, không hai"* — nên ràng buộc đó là một **luật**,
  và không cổng nào canh nó.

## Kết quả PHÉP THỬ s6 — bốn phát hiện

**1 · `§1` lập luận NGƯỢC với kiến trúc đã thi công.** Cả mục 1 mang tiêu đề
*"Vì sao MỘT bảng, không phải ba"* và bảo vệ nó bằng số đo thật (`khoDoc()` là cửa
đọc duy nhất · ~40 chỗ `filter/reduce` trong `trang.mjs` · chuỗi `"articles"` không
xuất hiện lần nào ở đó). Lập luận đó **đúng lúc viết**.

Sau đó **FR-038 chốt ba bảng**, và đã thi công: `kho.schema.sql` có `bai_viet`
(:44) · `tai_lieu` (:70) · `video` (:94), cộng hai VIEW `ban_ghi` và
`tham_chieu_media`.

⇒ Một người đọc M09 hôm nay sẽ đọc một **lập luận chống lại thứ đang chạy**, kèm
số đo để tin nó. Đây **nặng hơn** mọi phát hiện ở 10 module kia: chúng lệch một
con số hoặc một tên; cái này lệch một **quyết định kiến trúc**.

Và chính **mã** cũng mang cùng vết lệch, trong một docstring:
`dungchung.mjs:637` viết *"tra trên CÙNG union **ba bảng** mà exporter dùng"*,
rồi `:649` — tám dòng dưới — viết *"**Năm nhánh** khai MỘT nơi — VIEW
`tham_chieu_media` (FR-038)"*. Mã **làm** đúng năm nhánh; câu văn trên nó nói ba.
Cùng một chỗ, hai con số, và không cổng nào đọc chú thích.

Và `AC-2.1.3` mang hệ quả kỹ thuật: nó viết *"union **ba** bảng"*; tập tham chiếu
thật là **năm** nhánh. Cổng `check_media_dan_xuat.py` **xanh**, nên nó đã theo cấu
trúc mới — tức **AC lạc hậu hơn cổng của chính nó**.

**2 · Nửa `AC-2.2.2` không có cổng.** Vế *"form nạp phải nói ra"* (link rút gọn
`vm.tiktok.com` chưa giải được) là **UI**, mà lệnh là `pytest -k tiktok` — Python
**không đo được** form. Vế Python xanh; vế UI chưa ai đo. Cùng hình dạng với M10
`AC-2.2.2` (AC xanh mà tính năng vắng) và với `FR-051 §9` của tôi.

Nặng hơn: hệ quả thật của link không giải được **không** ở form. Hai link rút gọn
khác nhau trỏ cùng một video ⇒ hai `url_normalized` ⇒ **một video thành hai
"nguồn độc lập"**, đúng thứ `url_normalized` sinh ra để chặn. Đó là chỗ nó phải
được nói ra, và AC không nói.

**3 · `AC-2.4.1` đếm BA builder `Ban`, thực tế BỐN.** AC tự sửa một lần rồi
(*"bản B0 nói hai; thực tế ba"*) và vẫn thiếu một: `theBai()`
(`web/api/articles.mjs:20-32`), builder **không** trả `ho_so`/`media`.
`hai-ban-shape.test.js` canh hai bản ⇒ builder thứ tư **không ai canh**.
Ba lần đếm sai cùng một thứ (2 → 3 → 4) ⇒ con số builder là thứ **phải dẫn xuất**,
không phải thứ đếm tay.

**4 · Bốn ca không AC nào phủ, và một trong bốn là lỗ thật:**
- **`sha256` của một blob CÓ THẬT NHƯNG KHÁC** được nhận (`AC-2.3.1 edge 2`) ⇒
  bản ghi trỏ sai hiện vật. Cổng kiểm *"blob tồn tại"*, không kiểm *"blob này là
  cái vừa nạp"*.
- `article_versions` và `recycle` **không có** CHECK enum ⇒ `source_type` bịa vào
  được hai bảng đó (`AC-2.1.2 edge 3`). Spec khai như tiện lợi; nó cũng là lỗ.
- `content-length` khai **nhỏ hơn** byte thật (`AC-2.3.1 edge 7`) — đúng ca đi
  vòng cổng *"kiểm TRƯỚC khi đọc byte"*.
- `khoi3D` chỉ 3 cột ⇒ loại nguồn thứ tám bị đẩy ra **im lặng**
  (`AC-2.5.1 edge 4`). Spec dùng chính lý lẽ này để quyết một luật, rồi không
  canh nó.

⇒ Cả bốn vào `backlog.md`. Mục 1 là **FR**, không phải nợ tài liệu.
