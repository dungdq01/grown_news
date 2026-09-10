# WO-074 — TikTok + Douyin: nền thẻ và cửa sổ xem

- **Loại**: bug · **Module**: M12_chungcat + M03_web · **Mức**: hard
- **Task**: `T12-31` (thợ + bảng khai) · `T03-131` (cửa sổ xem)
- Chủ dự án 2026-09-09 nạp hai bản ghi thật rồi báo: *"tôi thấy 2 cái đó ko xem
  được video"*, và yêu cầu **test full cases** cho cả hai.

## Hai bản ghi thật

| | slug | url |
|---|---|---|
| TikTok | `video/hoa-don-dich-vu-ocr-opensource` | `.../@60s.cong.nghe.cung.tin/video/7669845290265890069?q=OCR%20&t=…` |
| Douyin | `video/langchain-rag-with-llama-index` | `https://www.douyin.com/jingxuan/course?modal_id=7543503016624655654` |

## Đo được — bốn lỗi RIÊNG BIỆT, không phải một

### 1 · TikTok, nền thẻ — `curl_cffi` chưa cài (ĐÃ SỬA, cần khai)

```
$ .venv/Scripts/python.exe -m yt_dlp --list-impersonate-targets
Tor  -  curl_cffi>=0.11 (unavailable)
Edge -  curl_cffi        (unavailable)
$ ... -m yt_dlp --skip-download "https://www.tiktok.com/.../video/7669845290265890069"
ERROR: [TikTok] 7669845290265890069: Unexpected response from webpage request
```
Câu lỗi KHÔNG nói thiếu gói. Nó nói "báo issue lên GitHub" — dẫn thẳng người
đọc đi sai đường. Manh mối thật bị cắt cụt trong log job: *"rmation on
installing the required dependencies"* — đuôi của câu yt-dlp cảnh báo
impersonation không dùng được.

TikTok chặn client không giả dạng TLS fingerprint trình duyệt. `curl_cffi` là
gói yt-dlp dùng cho việc đó. Sau `pip install curl_cffi`:
```
Chrome-133  Macos-15  curl_cffi
$ ... --print "%(id)s|%(thumbnail)s" → 7669845290265890069|https://p16-common-sign.tiktokcdn.com/...
```
Nghiệm thu E2E: job `sinh-thumbnail` chạy lại → **xong**, `image/jpeg` 4 761
byte, thẻ `/video/` hiện ảnh thật **540×960**.

⇒ Phải khai vào `chungcat/pyproject.toml`. Cài tay trong `.venv` mà không khai
là để máy tiếp theo đỏ y hệt với cùng một câu lỗi dẫn sai đường.

### 2 · Douyin, nền thẻ — KHÔNG sửa được, và phải nói ra

`yt-dlp` CÓ extractor `[Douyin]`, nhưng:
```
$ ... "https://www.douyin.com/jingxuan/course?modal_id=…"   → ERROR: Unsupported URL
$ ... "https://www.douyin.com/video/7543170111641865522"     → ERROR: Fresh cookies (not necessarily logged in) are needed
```
Kể cả dạng URL chuẩn + có impersonation, Douyin vẫn đòi **cookie phiên**. Đưa
cookie vào là đưa một bí mật vào đường egress — quyết định của NGƯỜI, không
phải của task này. Douyin ⇒ **icon**, như docx/pptx.

### 3 · Douyin, cửa sổ xem — `id_tu` không khớp dạng URL thật

`media-mime.json` khai `"id_tu": "/video/([0-9]{6,24})"`. URL thật của chủ dự
án là `/jingxuan/course?modal_id=…` ⇒ `idVideo()` trả `null` ⇒
`xemTruocHienVat` chạy `if (!v) return ""` ⇒ **cửa sổ không hiện gì cả**,
không cả nút. Đây là lỗi của TA.

### 4 · Douyin, nhúng — 403 kể cả khi id đúng

`https://open.douyin.com/player/video?vid=7543170111641865522` mở TRỰC TIẾP
(không qua app): player React nạp, rồi `aweme/detail/?aweme_id=…` trả **403**
(`X-Bogus` + `_signature`). Cột `nhung` của douyin là một GIẢ ĐỊNH chưa ai đo.

⇒ Sửa `id_tu` xong thì nút "▶ Xem video" hiện ra rồi nhúng một khung TRỐNG —
tệ hơn hiện tại. Nên `nhung` của douyin phải thành `null`, và cửa sổ phải có
đường lùi "mở ở nguồn".

## Không phải lỗi của ta — TikTok, nhúng

Nút hiện, iframe nạp, trang nhúng vẽ đủ tác giả + caption + 251 like. Nhưng
`vx-bdp.tiktokv.com/video/tos/...` trả **403**. Đo tách bạch: mở THẲNG
`https://www.tiktok.com/embed/v2/7669845290265890069` ở tab top-level, **không
có app của ta trong đường đi** — vẫn 403 y hệt. CDN của TikTok từ chối, không
phải khung nhúng của ta sai.

Ghi lại để lần sau không ai đi sửa `referrerpolicy` hay `allow=` cho một thứ
không nằm ở phía mình.

## Kỳ vọng

1. `curl_cffi` khai trong `pyproject.toml` kèm lý do
2. `id_tu` của douyin nhận cả `modal_id=` và `/share/video/`
3. `nhung: null` ⇒ cửa sổ hiện **link mở ở nguồn**, không hiện nút nhúng
4. `idVideo` trả `null` ⇒ cửa sổ vẫn hiện link, không `return ""`
5. `chien_luoc_anh_bia` trả `None` cho douyin — không xếp job chắc chắn hỏng

## Ràng buộc

`gn.js` **103 243 / 104 448 byte** — còn **1 205 byte**. Sửa FE phải bé.

---

# WO-075 — Khung poster trong cửa sổ + hai lỗi ảnh bìa lộ ra khi làm nó

Chủ dự án 2026-09-09: *"vẫn giữ khung và nền: nếu lấy được, khi người dùng bấm
xem thì direct sang"*.

## T03-132 · Giành byte (điều kiện, không phải việc phụ)

`mock/index.html` ở **272 384/272 384** — 0 byte trống, nên T03-133 không thể
bắt đầu. Gộp 11 bản sao của `{ "content-type": "application/json" }` trong
`multiwindow.inline.ts` thành một `const HJ`. **`gn.js` 103 495 → 103 159
(−336)**.

⚠️ Cái bẫy tự gây: regex thay-thế ăn luôn CHÍNH dòng khai, thành `const HJ = HJ;`
⇒ `ReferenceError: Cannot access 'HJ' before initialization`, toàn bộ FE chết.
Không cổng nào bắt — chỉ thấy khi mở trình duyệt thật. Đây là lần thứ hai trong
hai WO liên tiếp mà **chỉ việc mở trang thật** mới lộ lỗi.

## T03-133 · Một khung, hai kết cục

Trước: hai khối markup rời — `hv vid` (nút nhúng) và `hv the ngoai` (link trơ).
Nay MỘT poster, dùng lại `.cd-n` của thẻ (0 luật CSS nền mới):

- ảnh thật nếu kho có · icon+màu nếu không
- bấm → nhúng tại chỗ (host khai `nhung`) HOẶC mở tab nguồn (`nhung: null`)

Ba lỗi hiển thị phải sửa sau khi nhìn màn thật:
1. icon ĐÈ lên ảnh — thẻ ngoài danh sách chỉ đặt `data-i` khi KHÔNG có ảnh;
   tôi đặt cả hai.
2. ảnh dọc 540×960 tràn cao 1207px trong khung 382px. `height:100%` không cứu
   được: `.cd-n` cao theo NỘI DUNG, mà nội dung là chính tấm ảnh — phần trăm
   gặp vòng tròn thì rơi về `auto`. Phải neo TUYỆT ĐỐI.
3. nhãn bị đẩy lên đỉnh: `translate(-50%,-50%)` tính theo kích thước CHÍNH NÓ,
   mà `.hv-play` vốn đã to bằng cả khung.

## T12-32 · TikTok trả ảnh TRỐNG — và bản ghi kẹt với nó

Lộ ra khi nhìn poster: một ô đen. `yt-dlp --list-thumbnails` cho thấy TikTok
công bố BA bản — `dynamicCover` · `cover` · `originCover` — và
`--write-thumbnail` lấy bản CUỐI (`originCover`), vốn là **gradient trống
4 761 byte**. Bản `cover` là ảnh thật **28 980 byte**.

Sửa: `--write-all-thumbnails` rồi chọn tệp **LỚN NHẤT**. Không gõ tên bản nào —
mỗi nền tảng đặt tên khác nhau, còn "ảnh trống nén xuống gần bằng không" thì
đúng ở mọi nền tảng.

**Và một lỗ thứ hai lộ ra ngay đó:** chạy lại bị chính luật *"đã có ảnh ⇒ thôi"*
chặn, kèm câu lỗi nghe như đang làm đúng. Bản ghi **kẹt vĩnh viễn** với ảnh
hỏng. Thêm cờ `ep` — đúng cái *"sinh lại là việc NGƯỜI bấm"* mà chú thích cũ đã
hứa nhưng chưa ai cài. Vế 11f kẹp: `ep` chỉ mở luật ấy, KHÔNG phá loại trừ
douyin hay allowlist.
