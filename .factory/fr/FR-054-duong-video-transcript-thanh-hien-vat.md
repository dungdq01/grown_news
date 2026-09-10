# FR-054 — Đường VIDEO: transcript thành hiện vật, `sinh-transcript` là job riêng

- **mở**: 2026-09-03 · **người quyết**: chủ dự án · **trạng thái**: **ĐÃ DUYỆT** 2026-09-03
  (chủ dự án xác nhận lại sau khi file bị regression về "chờ duyệt")
- **artifact FROZEN chạm**: `06_modules/M12_chungcat/spec.md` + `rules.md` ·
  `06_modules/M11_video/spec.md`
- **artifact khác chạm**: `core/assets/media-mime.json` (bảng khai, không frozen) ·
  `02_proposal/proposal-2-ai-llm-kenh.md` §4 `Scope OUT` · `03_docs/brd.md` `B-E4`
  (ghi phán quyết, không sửa luật) · `chungcat/assets/` (bảng khai mới)
- **phụ thuộc CỨNG**: **`FR-052`** (`media` thành mảng — cách 1, **ĐÃ ÁP**;
  chính `§7.3` của file này đo được. Header cũ ghi "chưa áp" là lỗi thời).
- **nguồn**: `01_research/m12-ky-thuat-trien-khai.md` **PHẦN C** (§14–20) — khảo
  2026-09-03, viết lại sau Q&A với chủ dự án
- **liên đới**: `FR-053` §7 nêu đường video nhưng **không giải**; FR này giải.

## 0 · Vì sao phải FR

`spec M12 §1` khai **Vào**: *"`slug` nguyên liệu · byte ở `kb/_media/<sha256>`"*.
Đo 2026-09-02: bảng `media` có **đúng một hàng** — là PDF. `M11_video` khai
*"đăng ký URL, **không byte, không dòng `media`**"*.

⇒ **`chung-cat-mot-nguon` trên một bản ghi video không có gì để gửi.** Và chủ dự
án xác nhận 2026-09-03 rằng nguồn **chính** là video URL (YouTube · TikTok · FB),
mp4 chỉ *"đôi khi"*. Nên đây không phải một ca biên — nó là **ca chính**, và M12
hiện không phục vụ được nó.

## 1 · Hình dạng chốt

### 1.1 · Chỉ TRANSCRIPT vào kho, audio KHÔNG

Ba ràng buộc đo được khoá lối hiển nhiên:

```
media-mime.json   mime enum ĐÓNG = 5 loại (pdf·pptx·docx·ppt·doc) · tran_byte 25 MB
khung-than-bai    tran_tu_thu_vien = 400 từ
bảng media        CÓ cột `la_dan_xuat` — sẵn cho hiện vật dẫn xuất
```

- Transcript **không nằm được trong `than`**: bản ghi video là `ho_so: thu-vien`,
  trần **400 từ**; transcript 30 phút ≈ 4.000–6.000 từ. Vượt trần nghĩa là cổng
  nói *"đây là bản PHÂN TÍCH đặt sai hồ sơ"* — và nó nói **đúng**.
- **Không lưu byte video vào kho**: trần 25 MB + enum đóng, và `FR-037` đã chốt
  *"muốn video 200 MB thì câu trả lời là ĐĂNG KÝ URL, không phải nới trần"*.

⇒ **Audio sống trong Maildir của job M12 rồi bị XOÁ. Chỉ `.vtt` vào kho**, làm
hiện vật `la_dan_xuat: 1` của bản ghi video. Né được cả trần 25 MB lẫn việc mở
enum cho `video/*` — tức FR này **không** nới một trần nào.

### 1.2 · `text/vtt`, KHÔNG `application/json` — và đây là chuyện CỔNG

`media-mime.json` khai `magic` là *"LỚP THỨ SÁU của intake"* — lớp **duy nhất**
soi byte, và nó tồn tại vì năm lớp kia không lớp nào soi.

| ứng viên | magic | |
|---|---|---|
| `application/json` | **không có** — `{` là một byte (`7b`) | sẽ là **mục đầu tiên trong bảng làm yếu lớp thứ sáu** |
| **`text/vtt`** | **`5745425654`** = `WEBVTT` | magic **thật**, 6 byte, chuẩn W3C, và **mang mốc thời gian trong chính định dạng** |

⇒ một dòng vào `media-mime.json`:
`text/vtt` · `duoi: .vtt` · `magic: 5745425654` · `xem_truoc: "tai"`.

### 1.3 · `sinh-transcript` là JOB RIÊNG — `loai` thứ ba của M12

`spec M12 §2` hiện khai **hai** `loai`. Thêm thứ ba:

| `loai` | ra | egress |
|---|---|---|
| `chung-cat-mot-nguon` | `ho_so: phan-tich` | 1–2 lần gửi |
| `tong-hop-chu-de` | `ho_so: tong-hop` | 1–2 lần gửi |
| **`sinh-transcript`** *(mới)* | **hiện vật `.vtt`**, không phải bản ghi | **0 hoặc 1**, xem §1.5 |

```text
① người đăng ký video (URL)     → hàng `video`, không byte        [M11, FR-037]
② người bấm "sinh transcript"   → job `loai: sinh-transcript`
③ người ĐỌC và SỬA transcript   ← cổng NGƯỜI — xem §1.4
④ người bấm "chưng cất"         → `chung-cat-mot-nguon`, neo = mốc thời gian
```

Ba lý do chọn job riêng thay vì gộp vào ④:

1. **Đối xứng với PDF** ⇒ M12 giữ **một** đường mã (hiện vật → chưng cất), không
   mọc nhánh *"nếu là video thì…"*. `verify.py` dùng lại **y nguyên**: `dinh_vi()`
   chỉ đổi đơn vị neo (trang → mốc), và `dia-chi.json` đã khai `[t=03:15]` sẵn.
2. **`lan_gui` không lẫn.** Job transcript lối local = **0 lần gửi**; job chưng
   cất = 1–2. Gộp thì bộ đếm egress nói về hai việc khác nhau.
3. **Sinh lại transcript không tốn egress chưng cất** — đổi model ASR tốt hơn về
   sau = chạy lại ② mà không chạm ④.

Giá phải trả: **hai cú bấm thay một**, và một trạng thái mới trên bản ghi video
(*có transcript / chưa*) mà màn `/video/` phải hiện — đó là phần chạm `M11`.

### 1.4 · Nhịp ③ là lý do flow này thắng — và nó sửa một chỗ NGHĨA bị lệch

Với đường ASR, chữ *"verified"* **đổi nghĩa**:

| nguồn | `V` bảo đảm gì |
|---|---|
| PDF | quote **có trong tài liệu nguồn** |
| video qua ASR | quote **có trong TRANSCRIPT CỦA TA** — hiện vật dẫn xuất, có thể chứa lỗi ASR |

Hai mức mạnh khác nhau **đang mặc cùng một chữ**. `V` không kiểm được *"người
trong video có nói thế không"*.

⇒ Hai điều, cả hai bắt buộc:

- Hiện vật `.vtt` mang **`la_asr: true`** + **model ASR đã dùng**. Trường dẫn
  xuất, máy điền.
- **Người đọc/sửa được transcript trước ④.** Không có nhịp này thì
  `credibility_max` — thứ `M01-R2` cấm máy điền — không có cái thật để chấm.

### 1.5 · `nguon_transcript` — bảng khai, HAI lối, cùng khuôn `model.json`

Chủ dự án chốt **làm cả hai lối**, đổi bằng bảng khai:

```text
nguon_transcript:  ten · loai(file|tai_ve|dich_vu) · uu_tien
                   · dich(host | null) · khu_vuc · can_key
                   · tieu_egress(bool) · giay_phep
```

| ten | loai | dich | `tieu_egress` | `uu_tien` |
|---|---|---|---|---|
| `<cửa>-asr` | `dich_vu` | host cửa | **true** | **1** |
| `file-nguoi-tai` | `file` | — | **false** | 2 |
| `ytdlp-asr-local` | `tai_ve` | host nền tảng | **false** — tải VỀ, không gửi ĐI | 3 |

> **`uu_tien` chốt 2026-09-04** (chủ dự án: *"nên làm cả 2 và ưu tiên call dịch
> vụ llm trước"*). Cơ sở đo được: cửa Beeknoee có **23 model nhận audio** cộng
> các model `*-stt` — lối `dich_vu` không còn là lối đắt như lúc mở FR này, nó
> là lối **tiện nhất** (0 gói mới, 0 model tải về).
> Ba lối GIỮ NGUYÊN, không lối nào bị bỏ: `ytdlp-asr-local` vẫn là đường duy
> nhất khi audio **không được rời máy**, và đó là một ràng buộc pháp lý chứ
> không phải một tuỳ chọn hiệu năng.

⚠️ **`tai_ve` VẪN là lời gọi ra Internet** dù không gửi dữ liệu của ta đi. Nên nó
vẫn phải qua **cửa egress duy nhất** (`M12-R3`) và host vẫn phải trong allowlist
(`AC-6.3`) — chỉ khác là dòng log ghi `tieu_egress: false`. **Trộn hai nghĩa của
chữ *egress* vào một cột là cách con số này bắt đầu nói dối.**

ASR: **`faster-whisper`** (MIT) INT8 + **Silero VAD** (có sẵn trong gói). **Không
WhisperX, không pyannote** — `[t=03:15]` là độ phân giải **giây**, còn Whisper
mức-đoạn lệch hàng trăm ms, tức **vô hình** ở độ phân giải đó; WhisperX mua
<100 ms bằng một model wav2vec2 nữa cộng model **gated cần token HuggingFace**.
Đo: `small` INT8 ≈ 8× realtime trên CPU ⇒ video 30 phút ≈ **4 phút**, không GPU.

## 2 · Phán quyết về `B-E4` và `Scope OUT` — ghi ra, vì không cổng nào canh nó

**Đo 2026-09-03: không nền nào trong ba nền có bề mặt chính thức** cho transcript
video của người khác.

| | bề mặt chính thức | thực tế |
|---|---|---|
| YouTube | `captions.download` | đòi OAuth **chủ sở hữu video**; người khác → **403**, *by design* |
| TikTok | *không có* | **không có nút tải phụ đề** nào; mọi giải pháp là bên thứ ba |
| Facebook | Graph API `video/captions` | chỉ Page **bạn quản lý**; auto-caption chỉ trên Business Page. Meta đang siết |

⇒ Điều kiện của `B-E4` (*API có version, có tài liệu, có thông báo thay đổi*) là
**không thoả được qua API gốc**. Chỗ đó **trống**, không phải chỗ để chọn.

**Đọc đúng trục của `B-E4`.** Lý do của nó là *"cỗ máy **hỏng-im-lặng theo thiết
kế** — nó **không báo lỗi, nó trả dữ liệu sai**"*. Trục là **hỏng-im-lặng**, không
phải *không-chính-thức*. Ba lối xếp khác nhau trên trục đó:

| lối | hỏng kiểu gì | phán |
|---|---|---|
| scraper caption (`youtube-transcript-api`) | endpoint nội bộ; trả **rỗng hoặc sai** — **IM LẶNG** | **LOẠI** — đúng con máy `B-E4` nhắm |
| `ytdlp-asr-local` | **không có file** ⇒ **ỒN ÀO**; ASR sau đó tất định, tại máy | **NHẬN**, có điều kiện dưới |
| `dich_vu` | **HTTP error** ⇒ **ỒN ÀO**; API có version, có tài liệu | **NHẬN**, có điều kiện dưới |

**Ba điều kiện của phán quyết này, không được bỏ:**

1. **`Scope OUT` được ghi thêm một dòng, không xoá dòng nào.** `proposal §0` đã tự
   đặt luật khi đảo ba dòng OUT: *"đảo chúng phải nói ra ở đây chứ không lặng lẽ
   phình ở s3"*. Dòng ghi thêm phải nói: `ytdlp-asr-local` **là** crawler theo
   phân loại; nó được nhận vì **hỏng ồn ào**; và `B-E4` cưỡng chế bằng
   **`reviewer ⚠️`** (`brd.md:454`) — tức **người ký**, **không có cổng máy nào
   canh nó**.
2. **`yt-dlp` phải PIN version và có người theo dõi.** Nó đổi nhanh theo nền
   tảng; đó là bản chất của lối này, không phải một rủi ro có thể vá.
3. **Vendor lối `dich_vu` vẫn đang scrape phía sau.** Ta không xoá rủi ro, ta
   **chuyển** nó sang một bên có động cơ sửa và có bề mặt báo lỗi. Nói *"dùng
   vendor là hợp luật hoàn toàn"* là tự lừa — và `khu_vuc` của `FR-053` §1.4 áp
   cho nó y như áp cho model.

## 3 · Cổng phải có

| # | Bắt gì | Đỏ khi |
|---|---|---|
| V1 | Hiện vật `.vtt` ghi ra có `la_dan_xuat: 1` + `la_asr` + model ASR | thiếu một trong ba |
| V2 | `sinh-transcript` **không** ghi byte audio vào `kb/**`, và audio tạm **bị xoá** khi job xong | còn file audio sau khi job đóng, hoặc có byte audio trong kho |
| V3 | `egress.jsonl` ghi **lối đã dùng** + `tieu_egress` | sinh transcript mà không phân biệt được local với gửi-ra |
| V4 | `tai_ve` và `dich_vu` đều đi qua **cửa egress duy nhất**; host phải trong allowlist | một `yt_dlp.download()` hay `httpx` ngoài hàm egress |
| V5 | Thêm/bớt một dòng `nguon_transcript` đổi hành vi, **0 dòng mã** | phải sửa mã mới đổi được lối |
| V6 | Transcript ghi ra **không ghi đè** hiện vật đang có của bản ghi | `media` còn là object (⇒ `FR-052` chưa áp) mà vẫn cho ghi |
| V7 | `.vtt` không đúng magic `WEBVTT` ⇒ **từ chối** | file dán nhãn `text/vtt` mà byte mở đầu khác |

**V2 là cổng dễ quên nhất** — một job hỏng giữa chừng để lại audio, và audio là
thứ nặng nhất trong toàn hệ. `V6` là cổng **phụ thuộc**: nó phải đỏ **hôm nay**
(vì `FR-052` chưa áp), và đó là cách đúng để một phụ thuộc không bị quên.

## 4 · Ràng buộc KHÔNG được nới

1. **Không nới `tran_byte` 25 MB.** Audio không vào kho, nên không cần.
2. **Không thêm mime `video/*`.** Chỉ thêm `text/vtt`.
3. **Không nới `tran_tu_thu_vien` 400.** Transcript là hiện vật, không phải `than`.
4. **`M09-R5` nguyên vẹn** — trần body JSON **1 MB** không nới; `file-nguoi-tai`
   phải là **multipart qua `web/`**, và vì thế nó xếp **sau** hai lối URL.
5. **`M12-R1`/`M12-R2` nguyên vẹn** — `sinh-transcript` ghi hiện vật **qua API**
   của LÕI, không mở `_kho.sqlite`.
6. **`M12-R3` nguyên vẹn và mở rộng** — `tai_ve` cũng phải qua cửa egress.
7. **`FR-037` nguyên vẹn** — video vẫn **đăng ký URL**; file người tải không
   thành hiện vật kho, nó chỉ là đầu vào tạm của job.

## 5 · Điều FR này KHÔNG làm

- **Không** chọn vendor cụ thể cho `dich_vu` — chỉ khai hình dạng cột. Chọn nhà
  nào là quyết định riêng, và nó cần một dòng `khu_vuc` thật.
- **Không** áp `FR-052`. FR này **phụ thuộc** nó; áp là việc riêng.
- **Không** nhận lối scraper caption (§2) — loại có lý do ghi rõ.
- **Không** làm `M16_artifact` (sinh video). Đây là **đọc** video vào, không phải
  **sinh** video ra.
- **Không** chốt model ASR size. `small` là đề xuất cho <30 phút; đo rồi chốt.
- **Không** ký `FROZEN.lock`. Sau khi duyệt và áp, **người** ký — cùng lượt với
  `FR-053` và nợ ký của FR-034/036/041/042.

## 7 · Bổ sung 2026-09-03 — bốn chỗ ĐO ĐƯỢC mà bản chính chưa bịt

> ⚠️ **Mục này do một agent KHÁC viết**, sau `§1`–`§6`, theo chỉ đạo *"kiểm tra
> xem chức năng upload video đã có chưa… nếu chưa hãy đề xuất phương án"*.
> Không sửa một chữ nào của `§0`–`§6`. Bốn mục dưới là **đo được**, không phải ý
> kiến — và ba trong bốn **đổi thứ bạn đang duyệt**, nên chúng phải nằm trước
> chữ ký, không sau.

### 7.1 · `§4.2` KHÔNG cưỡng chế được — `FR-039` đã mở cổng nhận cho mọi mime

`§4.2` viết *"**Không thêm mime `video/*`**. Chỉ thêm `text/vtt`"*, và `§4.7` viết
*"file người tải **không thành hiện vật kho**"*. Cả hai đọc như thể cửa nhận vẫn
là một **enum đóng**.

**Nó không còn là enum đóng.** `FR-039` (đã duyệt) đổi vai bảng `media-mime.json`
từ **cổng NHẬN** sang **bảng RENDER**: định dạng lạ rơi vào hàng `mac_dinh` →
`application/octet-stream` + `xem_truoc: "tai"`. Nên **không cần thêm `video/*`**
để byte video vào được kho.

**Đo hành vi 2026-09-03**, gọi `luuHienVat` thật trên một kho tạm, byte mở đầu
`ftyp mp42`:

```
video/mp4          ok=true   201        video/x-matroska   ok=true   201
audio/mpeg         ok=true   201        video/webm         ok=true   201
video/quicktime    ok=true   201        26 214 401 byte    ok=false  413
```

Và `frontmatter.schema.json` khai `media.items.mime` là `pattern` RFC **chung**
(`^[a-z0-9][…]/[a-z0-9][…]$`) ⇒ `video/mp4` hợp lệ ở **cả** schema. Magic-byte chỉ
áp cho **5** định dạng đã khai, nên nó cũng không chặn.

⇒ **Luật *"không byte video vào kho"* của FR này đang sống bằng CHỮ, không bằng
cổng.** Một câu trong `§4` không phải một cổng, và `§3` (bảy cổng `V1`–`V7`) không
có cổng nào bắt ca này — `V2` bắt *"audio trong `kb/**` sau khi job xong"*, không
bắt *"người dùng tự tải một mp4 20 MB lên qua màn Tài liệu"*.

**Ba lối, và cả ba là quyết định của chủ dự án** — vì lối nào cũng chạm một FR đã
duyệt:

| | làm gì | giá |
|---|---|---|
| **a** | `luuHienVat` từ chối mime khớp `^(video\|audio)/`, kèm thông điệp *"video thì đăng ký URL; audio đi qua job transcript"* | **thu hẹp `FR-039`** — đảo một phần một FR đã duyệt. Và nó chặn luôn ca *"đôi khi vài mp4"* mà `§1.5` `file-nguoi-tai` định phục vụ |
| **b** | nhận, nhưng gắn cờ và **không** cho nó thành hiện vật của bản ghi `video` | giữ `FR-039` nguyên; cần một luật mới *"bản ghi `video` không được có `media` mime `video/*`"* — hẹp hơn (a), và đúng chỗ hơn |
| **c** | không làm gì, ghi rõ đây là **lỗ đã biết** | `§4.2` thành một câu không ai cưỡng chế; lần sau người đọc tin nó |

Tôi khuyên **b**. Lý do đo được: nó chặn đúng thứ FR này sợ (*byte video làm hiện
vật kho*) mà **không** đảo `FR-039`, và nó cưỡng chế được bằng một `CHECK`/một cổng
thay vì bằng một câu. Lối (a) trông sạch hơn nhưng nó **đảo một FR đã duyệt** — và
`§4` của chính FR này đặt tên mục là *"Ràng buộc KHÔNG được nới"*, tức nó tự nhận
việc **giữ** các FR cũ nguyên vẹn.

### 7.2 · Đường bàn giao file chưa có TRẦN — và 25 MB là con số sai cho nó

`§4.4` chốt `file-nguoi-tai` phải là **multipart qua `web/`** và `M09-R5` (trần
body JSON **1 MB**) không nới. Nhưng **trần của chính đường multipart thì không
nói**, và nếu nó mượn `TRAN_MEDIA` (25 MB) của kho thì con số đó sai về bản chất:

```
25 MB ≈  1–2 phút  video 1080p (~2–4 Mbps)
25 MB ≈  ~26 phút  MP3 128 kbps
25 MB ≈  ~50 phút  Opus 64 kbps
```

Hai hệ quả:

1. **Cần một hằng thứ ba** — `TRAN_NGUYEN_LIEU`. `M09-R5` đã lập tiền lệ đúng: nó
   canh `TRAN` (1 MB) và `TRAN_MEDIA` (25 MB) là **hai** hằng, vì nới cái này để
   cái kia qua là bỏ chặn bù của mọi đường ghi khác. Đầu vào tạm của một job
   **không phải nội dung kho**, nên nó là con số thứ ba, không phải con số thứ hai
   dùng lại.
2. **Cửa nên nhận AUDIO, không nhận VIDEO.** Dưới **cùng** một trần, audio chứa
   **20–40×** thời lượng, và `faster-whisper` chỉ cần audio — `§1.5` đã chọn
   `faster-whisper` nên vế này không thêm phụ thuộc nào.
   Nhận `video/*` rồi `ffmpeg -vn` tại cửa là lối khác, và nó thêm **một binary
   vào `RUNNING.md`** — đúng loại nợ mà `M09 §2.4` đã cố ý hoãn với
   `soffice --headless`. ⇒ Nếu chọn lối đó, phải khai nó là nợ, không khai là một
   dòng.

⚠️ Vế 2 **đổi hợp đồng của `§1.5`**: bảng `nguon_transcript` dòng `file-nguoi-tai`
cần một cột hoặc một câu nói **định dạng nào được nhận**. Hôm nay nó không nói.

### 7.3 · `V6` đã HẾT ĐỎ — phụ thuộc đã thoả, nên cổng mất tác dụng nó tự khai

`§3` khai `V6` là **cổng phụ thuộc** và nói *"nó phải đỏ **hôm nay** (vì `FR-052`
chưa áp), và đó là cách đúng để một phụ thuộc không bị quên"*. Cùng ý ở dòng đầu
FR: *"`FR-052` — đã quyết cách 1, **chưa áp**"*.

**Đo 2026-09-03**: `frontmatter.schema.json` khai `media.type = "array"`,
`minItems = 1` ⇒ **`FR-052` ĐÃ ÁP**. Nên:

- Dòng phụ thuộc ở đầu FR (*"chưa áp"*) **không còn đúng** — và đó là tin **tốt**:
  phụ thuộc cứng của FR này đã thoả, không còn chặn gì.
- `V6` **không đỏ được nữa** theo cách nó mô tả. Vế còn giá trị là ca *happy*:
  bản ghi video đã có 1 hiện vật → sinh transcript → **2** hiện vật, cái cũ nguyên
  vẹn **từng byte**.

Và một ca `§1.3` làm **chắc chắn xảy ra** mà FR không nói: `§1.3` lấy *"sinh lại
transcript không tốn egress chưng cất — đổi model ASR tốt hơn về sau = chạy lại ②"*
làm một trong **ba** lý do chọn job riêng. ⇒ Sinh transcript **lần thứ hai** cho
cùng bản ghi: **thay** `.vtt` cũ, hay **thêm** cái thứ hai?

Hai hành vi cho hai kết quả rất khác (bản ghi có 2 hay 3 hiện vật), và cả hai đều
"đúng" theo `media` là mảng. Cần một câu.

### 7.4 · Đã viết testcase cho `V1`–`V7`, ở chỗ không frozen

`06_modules/M12_chungcat/testcases.md` **PHẦN III** (§14–§21) viết bảy cổng của
`§3` thành testcase, mỗi cái ≥1 *happy* + ≥1 *edge*, mang nhãn **`CHỜ FR-054`**.
`testcases.md` **không** nằm trong `FROZEN.lock` (chỉ `spec.md` + `rules.md` của
M12 nằm trong đó — đúng hai file), nên việc này không cần đợi duyệt.

Lý do làm bây giờ: nó là **phép thử của chính FR này**. Ba chỗ lộ ra khi viết:

| cổng | chỗ FR chưa đủ để viết MỘT kết quả mong đợi |
|---|---|
| `V1` | transcript do **người dán** (không qua ASR) ⇒ `la_asr: false` và trường model ASR mang gì? |
| `V5` | **mọi** lối trong `nguon_transcript` thất bại ⇒ thông báo nêu **từng** lối, hay một câu chung? |
| `V7` | VTT hợp lệ có **BOM UTF-8** trước `WEBVTT` ⇒ chuẩn W3C cho phép, nhưng phép so byte thô **từ chối oan** |

Ba ca này không chặn duyệt — chúng là chỗ s8 sẽ phải chọn, và chọn khác nhau thì
cổng vẫn xanh. Ghi ra để lựa chọn đó là một **quyết định**, không phải một tình cờ.

⇒ Bốn mục `§7` này đều đã mở ô ở `06_modules/M12_chungcat/backlog.md`.

## 8 · Chỉ đạo 2026-09-03 (lượt 2) — ĐẢO `§1.1`, và hai lối ASR

> Hai quyết định của chủ dự án, hỏi và đáp trực tiếp. Mục này **đảo `§1.1`** nên
> nó phải nằm trước chữ ký, không sau. `§7` của agent khác **đứng nguyên** — và
> `§8.2` dưới đây hoà giải `§7.2` với chỉ đạo mới thay vì bỏ một bên.

### 8.1 · Chỉ đạo: *"giữ nó lại ở kho: video / audio / transcript tương ứng. Ta gọi là file gốc"*

**`§1.1` sai kể từ đây.** Nó khai *"Audio sống trong Maildir rồi bị XOÁ. Chỉ
`.vtt` vào kho"* và gọi `.vtt` là hiện vật **dẫn xuất** `la_dan_xuat: 1`.

Chỉ đạo mới đảo cả hai vế — và **vế thứ hai của tôi vốn đã tự mâu thuẫn**: xoá
audio thì `.vtt` là **bản duy nhất còn sống**, nên gắn `la_dan_xuat: 1` lên nó là
nói sai. Giữ file gốc **chữa đúng chỗ đó**: transcript dựng lại được từ audio ⇒
`la_dan_xuat: 1` **trở lại đúng sự thật**.

**Ba hiện vật một bản ghi** (`media` là mảng — `§7.3` đo được `FR-052` **đã áp**):

| hiện vật | `la_dan_xuat` | 30 phút |
|---|---|---|
| video (file gốc) | `0` | **150–400 MB** (720p) |
| audio tách ra | `0`? hoặc `1` — xem dưới | ~7 MB (opus 32k mono) |
| `.vtt` transcript | **`1`** | 50–100 KB |

⚠️ **`la_dan_xuat` của audio là một câu phải viết**: audio tách từ video **là**
dẫn xuất (`ffmpeg -vn` dựng lại được) ⇒ `1`. Nhưng audio do **người tải trực
tiếp** (không có video) là **gốc** ⇒ `0`. Cùng một mime, hai giá trị, tuỳ đường
vào. Cổng phải đọc đường vào, không đọc mime.

### 8.2 · Hoà giải với `§7.2` — HAI cửa khác nhau, không phải một

`§7.2` khuyên *"cửa nên nhận AUDIO, không nhận VIDEO"*. Chỉ đạo mới muốn giữ
video. **Không chọi nhau** — chúng nói về hai cửa:

| cửa | `§7.2` đúng ở đâu | chỉ đạo mới |
|---|---|---|
| **bàn giao nguyên liệu cho job** (`TRAN_NGUYEN_LIEU`) | job transcript chỉ cần **audio**; cùng một trần thì audio chứa 20–40× thời lượng | không đụng |
| **lưu hiện vật vào kho** | — | nhận **cả video**, nó là file gốc |

⇒ **Giải**: nhận video ở cửa kho; **job transcript đọc audio đã tách**, không đọc
video. Tách một lần bằng `ffmpeg -vn`, lưu audio thành hiện vật thứ hai. Đó chính
là *"video / audio / transcript tương ứng"*.

⚠️ **`ffmpeg` thành một binary phải khai trong `RUNNING.md`.** `§7.2` cảnh báo
đúng: đây là loại nợ mà `M09 §2.4` đã cố ý hoãn với `soffice --headless`. Khai nó
là **nợ**, không khai là một dòng.

### 8.3 · Trần: 25 MB là con số sai, và git KHÔNG giữ được video

`§7.2` đo `25 MB ≈ 1–2 phút` video 1080p. Video 30 phút cần **150–400 MB**.

**Và trần của mình không phải trần duy nhất** — đo 2026-09-03:

| | |
|---|---|
| GitHub **chặn cứng** | **> 100 MiB** trên push thường |
| cảnh báo | 50–100 MB (push vẫn qua) |
| upload qua trình duyệt | tối đa **25 MiB** |
| **git-lfs** | free **1 GB** storage + **1 GB** bandwidth/tháng · data pack **$5/tháng** = 50 GB + 50 GB · trần **5 GB**/file · **2 GB**/push |

⇒ **Một video 30 phút 720p không push được lên GitHub** bằng git thường. Giữ video
trong kho đòi **git-lfs cho `kb/_media/`**, và ba thứ phải đổi cùng lượt:

1. **`TRAN_NGUYEN_LIEU`** (hằng thứ ba của `§7.2`) cỡ **500 MB**, không phải 25.
2. **`kb/_media/` sang git-lfs.** Free tier đầy sau **~4 video**; 1 data pack
   ($5/tháng) đủ ~200 video 250 MB.
3. **`.gitignore` đúng chiều** — đo được `kb/_media/` hiện **KHÔNG** bị ignore
   (đúng, `FR-034` muốn thế); LFS giữ nguyên tính chất đó, chỉ đổi cách lưu blob.

### 8.4 · Bẫy phải nói ra: cổng `B-C1` + LFS = CI ăn hết bandwidth

`check_export_dan_xuat.py` đòi *"clone không DB → `dung_lai_db` → `xuat_kho`
byte-equal"*. Với LFS, một `git lfs pull` **tiêu bandwidth bằng toàn bộ kho
media**. 50 GB/tháng hết sau **vài chục lần chạy CI**.

⇒ Hai điều, bắt buộc, nếu không thì **cổng bảo đảm `B-C1` tự trở thành thứ đắt
nhất trong dự án**:

- CI đặt **`GIT_LFS_SKIP_SMUDGE=1`** — checkout con trỏ, không tải blob.
- Phép round-trip chạy trên **fixture ở thư mục tạm**, không trên kho thật. Đây
  đúng luật `CLAUDE.md` (*"không sửa file thật để thử một cổng — dựng fixture ở
  thư mục tạm"*), và giờ nó còn là chuyện tiền.

### 8.5 · Render video: cần cột `magic_offset`

`§7.1` đo được `FR-039` đã biến `media-mime.json` thành **bảng RENDER**, nên
`video/mp4` **vào kho được rồi** — không cần thêm dòng để *nhận*.

Nhưng để **XEM** được trong kho thì phải thêm dòng (không có dòng ⇒ rơi vào
`mac_dinh` ⇒ `application/octet-stream` + `xem_truoc: "tai"`, tức một nút tải,
không phải player). Và thêm dòng thì magic-byte **áp cho nó**:

| | magic | ở đâu |
|---|---|---|
| `video/webm` · `video/x-matroska` | `1a45dfa3` | offset **0** ✅ |
| **`video/mp4`** | `66747970` (`ftyp`) | **offset 4** ❌ |
| `audio/ogg` (opus) | `4f676753` (`OggS`) | offset **0** ✅ |
| `audio/mpeg` (mp3) | `494433` (`ID3`) **hoặc** `fffb`/`fff3` | **hai** magic |

⇒ Bảng cần thêm **`magic_offset`** (mặc định `0`). Chú thích hiện tại của
`media-mime.json` khai *"`magic` là byte **MỞ ĐẦU** phải khớp"* — **giả định đó
chết cùng mp4**, nên sửa nó ở bảng khai còn hơn để mã đặc-cách-mp4.

Và chọn **một** định dạng audio: **`audio/ogg`** (opus) — magic sạch ở offset 0,
nhỏ nhất cho tiếng nói. mp3 có hai magic mà bảng chỉ có một cột.

### 8.6 · ASR: **cả hai lối**, `uu_tien` Gemini — và ba việc kèm theo

Chỉ đạo: *"cả 2 nhưng ưu tiên gemini để ổn định, local backup và thử nghiệm vì
chưa biết chất lượng đến đâu"*.

**Sửa một chỗ tôi để mờ**: HuggingFace trong `§1.5` **không phải** nhà cung cấp
LLM — nó chỉ là nơi `faster-whisper` **tải trọng số** lần đầu (một lần, ~500 MB
cho `small`). Gateway của chủ dự án (Claude · Gemini · DeepSeek) **không thay nó
được**, vì Claude và DeepSeek **không làm speech-to-text**. Chỉ **Gemini** nhận
audio. Muốn 0 lời gọi HF: **tải trọng số một lần bằng tay**, đặt ở
`chungcat/models/`, khai đường dẫn trong bảng khai.

Ba việc bắt buộc:

**a · Xác minh gateway có nhận AUDIO.** Nhiều gateway proxy text + vision nhưng
**không** audio. Một lệnh kiểm, làm **trước** khi thiết kế lên nó — nếu không thì
`uu_tien` trỏ vào một lối không tồn tại.

**b · Hiện vật mang cờ CHẤT LƯỢNG MỐC, không chỉ `la_asr`:**

| cờ | lối | mốc từ đâu |
|---|---|---|
| `moc_do` | `faster-whisper` local | DTW/forced-align — **đo được** |
| `moc_khai` | Gemini qua gateway | model **NÓI RA** — không đo |

`V` định vị quote trong **văn bản** (mạnh, cả hai lối). Nhưng mốc nó trả về là
**thuộc tính của transcript**, nên nó **thừa hưởng** độ mạnh của cờ. ⇒ Bản
`phan-tich` sinh từ transcript `moc_khai` **phải ghi điều đó** — nếu không thì
`[t=03:15]` của hai lối trông y hệt nhau mà một cái **đo**, một cái **đoán**.
Đây là cùng lớp vấn đề `§1.4` đã mở về chữ *"verified"*, chỉ khác chỗ đứng.

**c · *"Chưa biết chất lượng"* là một phép ĐO, không phải một phỏng đoán.**
Đơn vị việc **đầu tiên** của `C4b`: chạy **cả hai** lối trên 2–3 video có sẵn,
diff transcript + diff mốc tại 10 điểm mẫu. Ra số rồi mới chốt `uu_tien` trong
bảng khai. Cùng khuôn *"đo trước, đặt trần sau"* của `M6.2` và của ngưỡng fuzzy
(`FR-053` §3).

### 8.7 · Gateway thứ ba đổi bốn thứ ở `FR-053`

Chủ dự án dùng **một gateway thứ ba** cho Claude/Gemini/DeepSeek (có quota free).
Đích egress bây giờ là **host của gateway**, không phải `api.anthropic.com` /
`generativelanguage.googleapis.com` / `api.deepseek.com`:

| | hệ quả |
|---|---|
| `AC-6.3` allowlist | **đơn giản hơn** — một host thay vì 3–4 |
| `model.json` | phải **tách** `nha_cung_cap` (ai làm model) khỏi **`dich`** (gửi tới đâu) — `FR-053` §1 để chúng lẫn |
| `khu_vuc` (`FR-053` §1.4) | **mù** — không biết gateway route đi đâu, mà `NĐ 356/2025` Điều 14 gắn với **nơi dữ liệu thật sự tới**. Khai `khong-xac-dinh`, và bộ chọn model phải **hiện đúng chữ đó** |
| **`M12-R5` MẤT RĂNG** | cổng *"dự phòng cùng `khu_vuc`"* thành **rỗng**: mọi model qua cùng gateway ⇒ mọi `khu_vuc` bằng nhau ⇒ cổng **luôn xanh mà không kiểm gì**. Cổng chết im lặng ⇒ phải khai, không để nó xanh giả |

Và một điều factual, nói **một lần**: gateway **đọc được mọi payload**. Câu
*"tài liệu X đã tới tay ai"* của `FR-043` bậc 4 giờ có thêm **một cái tên** — đó
không phải lý do để không dùng, nhưng nó phải nằm trong hồ sơ.

⇒ Bốn dòng này thuộc `FR-053`, không thuộc FR này. Ghi ở đây vì chúng phát sinh
trong cùng lượt Q&A; **`FR-053` phải được sửa kèm**, không thì hai FR nói hai
chuyện về cùng một `model.json`.

### 8.8 · Cổng thêm / sửa

| # | | |
|---|---|---|
| **V2** | ~~audio bị xoá sau job~~ → **ĐẢO**: audio **PHẢI** còn trong kho, và `.vtt` phải trỏ được về audio nó sinh ra từ đó | sửa |
| **V8** | `magic_offset` có hiệu lực: mp4 hợp lệ (`ftyp`@4) **qua**, mp4 giả (`ftyp`@0) **đỏ** | mới |
| **V9** | Hiện vật `.vtt` mang `moc_do` **hoặc** `moc_khai`; thiếu cờ ⇒ đỏ. Bản `phan-tich` sinh từ `moc_khai` **ghi lại** điều đó | mới |
| **V10** | `la_dan_xuat` của audio đúng theo **đường vào** (tách từ video ⇒ `1`; người tải trực tiếp ⇒ `0`), không theo mime | mới |
| **V11** | CI **không** tải blob LFS (`GIT_LFS_SKIP_SMUDGE=1`), và round-trip `B-C1` chạy trên fixture tạm | mới — cổng **tiền**, không phải cổng đúng/sai |

`V11` là loại cổng dự án chưa có: nó canh **chi phí**, không canh tính đúng. Nhưng
nó cùng họ với `M12-R6` (trần lần gửi) — một thứ đếm được mà nếu không đếm thì nó
lớn lên trong im lặng.

## 9 · Chỉ đạo 2026-09-03 (lượt 3) — version/history, và HAI chỗ `§8` đo sai

> Trả câu `§7.3` bỏ ngỏ. Chỉ đạo: *"thay cái thứ 2, và đánh dấu ver - history"*.
> Kèm hai phép đo làm `§8` sai — cả hai **đổi giá** của quyết định `§8.1`.

### 9.1 · Sinh transcript lần hai: THAY + `article_versions`, **0 thay đổi schema**

Dự án đã có đúng bảng, và nó **không frozen**:

```sql
CREATE TABLE article_versions (
  source_type TEXT, slug TEXT, ban INTEGER,
  frontmatter TEXT NOT NULL, than TEXT NOT NULL,
  PRIMARY KEY (source_type, slug, ban) );
```

Vòng đời một lần sinh lại:

```text
byte .vtt mới        → bảng `media`, sha256 mới
frontmatter.media[]  → THAY sha256 cũ bằng sha256 mới        ← "thay"
bump `ban`           → snapshot frontmatter CŨ → article_versions
byte .vtt cũ         → VẪN NẰM trong `media`  (M09-R1: không xoá byte)
```

⇒ **History đầy đủ mà không thêm một trường nào.**
`article_versions[ban=N].frontmatter.media[]` gọi tên sha256 cũ, và byte còn đó.
*"Hiện hành"* trả lời bằng **cấu trúc** (cái trong `ban_ghi`), *"lịch sử"* là
`article_versions`. **Không** cần cờ `luu_tru` trên media, **không** cần trường
version trên mảng — và đó là may, vì `§9.2` chứng minh thêm trường là **không
được phép**.

**Nhãn `ver` cho NGƯỜI**: `ten_goc` là trường **bắt buộc** và là chuỗi tự do ⇒
đặt `ten_goc: "<slug>.v2.vtt"`, đúng quy ước `*.v<n>.md` của `M02 §2.5`. Nói rõ
để không ai nhầm: đó là **nhãn người đọc**; chân lý máy là `article_versions`.

⚠️ **Một chỗ phải nói**: `article_versions` snapshot **cả bản ghi**, nên `ban`
đếm *"mọi lần đổi bản ghi"*, không phải *"số lần đổi transcript"*. Câu *"video
này đã có mấy bản transcript"* vẫn trả lời được (diff `media[]` giữa các `ban`)
— **suy ra**, không đọc trực tiếp. Chấp nhận: nó rẻ hơn một bảng thứ hai.

> **AC-9.1** · Sinh transcript lần hai ⇒ `ban_ghi.frontmatter.media[]` có **đúng
> một** `.vtt` (cái mới); `article_versions` có thêm **một** hàng; và byte `.vtt`
> **cũ** vẫn đọc được từ `media` theo sha256 cũ.
> `hard` · `cmd: python chungcat/tests/check_transcript_ver.py`

### 9.2 · `§8.6` SAI — cờ ASR không để được vào `frontmatter.media[]`

`§8.6` khai *"hiện vật mang cờ `la_asr` / `moc_do` / `moc_khai`"*. **Đo 2026-09-03:**

```
media.items.additionalProperties = False
media item keys = ['sha256','mime','ten_goc','so_byte']   — cả BỐN required
```

⇒ Thêm bất kỳ khoá nào vào `media[]` là **validate ĐỎ**, và sửa nó là sửa
`frontmatter.schema.json` — **FROZEN**.

**Chỗ đúng là bảng `media`**, và `kho.schema.sql` **KHÔNG frozen** (`FROZEN.lock`
giữ đúng một file trong `core/`: `frontmatter.schema.json`). Bảng đó **đã** làm
đúng loại việc này:

```sql
la_dan_xuat INTEGER NOT NULL DEFAULT 0 CHECK (la_dan_xuat IN (0,1))
```

⇒ Thêm **`kieu_moc TEXT`** (`moc_do` | `moc_khai` | `NULL` khi người dán) cạnh
`la_dan_xuat`. Đối xứng, không phát minh, và **không chạm file frozen**.

Điểm phụ đáng giá: cờ theo **BYTE** chứ theo **đính kèm** là đúng hơn — cùng một
`.vtt` gắn vào hai bản ghi thì nó vẫn là **một** cách sinh.

⚠️ Và `§8.1` cũng phải đọc lại theo đây: `la_dan_xuat` **không** nằm trong
frontmatter, nó là cột của bảng `media`. Bảng ba-hiện-vật ở `§8.1` viết
`la_dan_xuat` như thuộc tính của hiện vật trong frontmatter — sai chỗ, đúng ý.
`V10` (`§8.8`) vì thế đo trên **bảng**, không đo trên frontmatter.

### 9.3 · `§8.3` chưa đủ — trần 25 MB nằm TRONG file FROZEN

`§8.3` nói trần là một hằng phải nới. **Đo được nó là một dòng trong hợp đồng đã
đóng băng:**

```
frontmatter.schema.json → media.items.so_byte = {"maximum": 26214400}
```

`26214400` = **25 MB**, trong **`frontmatter.schema.json`** — file frozen duy
nhất của `core/`.

⇒ Giữ video trong kho tốn **năm** thứ, không phải bốn. Ba trong năm chưa nêu đủ
lúc chủ dự án chốt `§8.1`:

| # | | mới nêu? |
|---|---|---|
| 1 | sửa **`frontmatter.schema.json`** (`so_byte.maximum`) — **FROZEN**, cần **người ký** | **mới** |
| 2 | `TRAN_NGUYEN_LIEU` — hằng thứ ba cho cửa bàn giao (`§7.2`) | đã nêu |
| 3 | **git-lfs** cho `kb/_media/` — GitHub chặn cứng **>100 MiB**; free 1 GB đầy sau **~4 video**; **$5/tháng** = 50 GB | **mới** |
| 4 | CI `GIT_LFS_SKIP_SMUDGE=1` + round-trip `B-C1` trên **fixture** | **mới** |
| 5 | `magic_offset` cho `video/mp4` (`ftyp` ở offset **4**) nếu muốn **xem** | đã nêu |

Ghi ra vì `CLAUDE.md` đòi: *"artifact đã chốt hoá ra sai ⇒ mở ô backlog ngay"*, và
một quyết định ký trên bảng giá thiếu ba dòng là đúng ca đó. **Quyết định vẫn
đứng** — chủ dự án chốt giữ video, và mục này không đảo nó; nó chỉ đặt con số
đúng lên bàn trước khi ký.

> **AC-9.2** · `so_byte.maximum` sau khi nới **vẫn là một số**, không phải bỏ
> trần. Payload vượt nó ⇒ **422 tại cửa**, trước khi ghi byte nào.
> `hard` · `cmd: python chungcat/tests/check_tran_nguyen_lieu.py`

⇒ Ba ô backlog mở ở `06_modules/M12_chungcat/backlog.md`: `§9.2` (cờ sai chỗ) ·
`§9.3` (bảng giá thiếu ba dòng) · và câu `§7.3` **đã đóng** bởi `§9.1`.

## 6 · Nguồn

- Giới hạn GitHub + LFS: [GitHub Docs — LFS billing](https://docs.github.com/billing/managing-billing-for-git-large-file-storage/about-billing-for-git-large-file-storage) · [file size limit 2026](https://fast.io/resources/github-file-size-limit-guide/) · [community #163795](https://github.com/orgs/community/discussions/163795)
- YouTube: [Implementation: Captions](https://developers.google.com/youtube/v3/guides/implementation/captions) · [vì sao `captions.download` fail](https://youtube2text.org/blog/youtube-data-api-transcripts)
- TikTok: [không có nút tải phụ đề · 4 cách 2026](https://supadata.ai/blog/how-to-get-tiktok-video-transcript)
- Facebook: [Graph API · Video Caption](https://developers.facebook.com/docs/graph-api/reference/video-caption/) · [Meta siết truy cập thứ ba](https://data365.co/blog/meta-graph-api)
- Hỏng-im-lặng của scraper: [youtube-transcript-api #511](https://github.com/jdepoix/youtube-transcript-api/issues/511)
- ASR: [SYSTRAN/faster-whisper](https://github.com/SYSTRAN/faster-whisper) · [WhisperX — mốc từ <100ms](https://www.forasoft.com/learn/ai-for-video-engineering/articles-ai/whisperx-diarization-word-level-timestamps)
- Giá dịch vụ: [Supadata](https://supadata.ai/blog/best-youtube-transcript-api) · [giá STT 2026](https://www.buildmvpfast.com/api-costs/transcription)
