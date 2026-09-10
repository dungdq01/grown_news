# M12_chungcat — spec

> **Vùng THỢ.** Nguyên liệu trong kho → **bản nháp trong DB** (`FR-046`).
> Nguồn: `03_docs/spec_overview.md#M12_chungcat` · `04_system/adr.md#ADR-05` ·
> `research_summary.md` §10, §13 · `memory/decisions.md` 2026-09-01 · `FR-043`, `FR-044`.
>
> **Áp `FR-053` 2026-09-03** (chủ dự án duyệt): NGƯỜI chọn model · Citations bị
> bỏ khỏi hợp đồng · định vị BA TẦNG · `os.replace` hết được coi là nguyên tử.
> Bốn chỗ đó trước đây làm `AC-3.2` và `AC-5.2` **không cài đúng được**.
>
> **Trạng thái `cmd`, đo 2026-09-03**: `chungcat/` đã có mã, **18 cổng xanh** và
> `check_e2e_chung_cat.py --mock` xanh. Câu cảnh báo cũ (*"mọi `cmd` trỏ vào
> lệnh CHƯA TỒN TẠI, module chưa có một dòng mã nào"*) **nay sai** và đã bỏ —
> để lại là để một câu nói dối trong artifact frozen.
> Còn CHƯA chứng minh: `--that` (một lời gọi model **thật**) — nó chặn ở định
> danh model mà gateway nhận, xem `chungcat/assets/model.json`
> `$vi_sao_ten_gia_dinh`. `AC-3.1` (nhà thứ hai) là `T12-7`, chưa dựng.
>
> ⚠️ **Drift với G3, ghi ra thay vì lặng lẽ chọn một bên**: `spec_overview` viết
> M12 *"Không cổng vào"*; `core/assets/dich-vu.json` khai `cong: 8790`. Spec này
> theo **bảng khai** — nó là thứ máy đọc, và `ADR-05` đã đính chính rằng luật
> thật là `M08-R1` (*không nghe NGOÀI `127.0.0.1`*), không phải *không nghe gì*.
> Câu trong `spec_overview` là bản trước đính chính. Cần s3/s4 sửa một câu.

## 1 · Vai, và bốn điều không bao giờ làm

Đọc một (hoặc N) bản ghi `thu-vien` đã trong kho → viết bản phân tích theo
`khung-than-bai.json`, kèm **địa chỉ phân giải được** (`core/assets/dia-chi.json`).

**Vào**: `slug` nguyên liệu · byte đọc **QUA API của LÕI**
`GET /api/articles/media/<sha256>` — *(quyết 1a, chủ dự án 2026-09-04)*

> ⚠️ **Không đọc `kb/_media/<sha256>` thẳng từ ổ.** Bản đầu của dòng này viết
> đường file, và nó chỏi `AC-1.1`: một tiến trình mở được `kb/**` để ĐỌC thì
> phép kiểm *"không đường nào chạm kho"* thành một lời khai về ý định. Qua API
> thì `M12-R1` (chỉ đọc, qua HTTP) đo được bằng một phép quét import.
**Ra**: một hàng trong bảng nháp (`FR-046`, ghi **qua API** của LÕI) · một dòng
log kèm `sha256` payload đã gửi RA

> ⚠️ **Đổi 2026-09-02 (`FR-046`)**: bản đầu của spec này viết *bản nháp ra
> `_inbox/`*. Chủ dự án chốt **nháp lưu DB**. `_inbox/` + `gate.py` **vẫn là
> đường của bản NGOÀI** (`M05` nguyên vẹn) — chỉ M12 rời khỏi đường đó.
> **Hệ quả phải nói ra**: trước đây M12 có **hai** rào độc lập — nó tự ghi
> `draft`, và `gate.py:133` ép `draft` **vô điều kiện** lần nữa. Nay `gate.py`
> **không còn trên đường của M12**, nên rào thứ hai phải là **mặc định của bảng
> nháp** (`trang_thai: nhap`), và rào đó phải mạnh bằng rào cũ.

Bốn điều **không bao giờ**: ghi thẳng `kb/` · tự đặt `review_status: approved` ·
nghe ngoài `127.0.0.1` · bị `web/api/**` gọi theo chiều ngược (web là client của
nó, không phải server).

> **AC-1.1** · Không đường chạy nào của `chungcat/**` mở `kb/_kho.sqlite`, và không
> đường nào ghi vào `kb/**`. Bản nháp đi **qua API** vào bảng nháp (`FR-046`).
> `hard` · `cmd: python chungcat/tests/check_khong_cham_kho.py`

> **AC-1.2** · Tiến trình bind đúng `127.0.0.1:8790` — số cổng **đọc từ**
> `core/assets/dich-vu.json`, không gõ tay. Bind `0.0.0.0` ⇒ đỏ.
> `hard` · `cmd: python chungcat/tests/check_nghe_loopback.py`

> **AC-1.3** · Hàng nháp M12 ghi luôn vào bảng nháp ở trạng thái đầu
> (`trang_thai: nhap`), **và** `review_status` của nó là `draft`. Payload có chuỗi
> `approved` cũng không đổi được — và cổng phải chứng minh điều đó bằng cách
> **gieo một payload đòi `approved`** rồi đọc lại hàng đã ghi.
> *Vì sao viết lại (`FR-046`)*: `gate.py` không còn trên đường của M12, nên AC
> này **không được** đo bằng "file ra `_inbox/` mang draft" nữa — đo thế thì cổng
> xanh một cách RỖNG (M12 không thả file nào vào đó).
> `hard` · `cmd: python chungcat/tests/check_khong_tu_duyet.py`

> **AC-1.4** · `POST /job` chỉ nhận lời gọi **từ LÕI**. Một THỢ khác (`chatbot`,
> `artifact`, `truyhoi`) gọi được vào đây ⇒ đỏ — cả bốn đều ở `127.0.0.1`, nên
> *"bind loopback"* (`AC-1.2`) **không** đủ để nói ai gọi.
> `hard` · `cmd: python chungcat/tests/check_chi_loi_goi_tu_loi.py`

> **AC-1.5** · `nguoi_dung_id` của job **do LÕI gán**, M12 không nhận trường đó từ
> payload tự do. Payload chứa `nguoi_dung_id` ⇒ trường bị **bỏ**, không được tin.
> `hard` · `cmd: python chungcat/tests/check_chi_loi_goi_tu_loi.py`

### 1.1 · Quyền đọc nguồn giải ở LÕI — MỘT chokepoint, không hai

Payload job mang `nguon: [slug…]` **do người gọi nêu**. Đó đúng hình dạng
`CVE-2026-44560` (Open WebUI): *scope identifier do client gửi, và tên đoán được*
— slug trong kho ta cũng đoán được (`xgboost-taylor-bac-hai`).

**Nhưng chỗ sửa KHÔNG phải M12.** Khảo sát 2026-09-02 rút ra luật *MỘT chokepoint*
(`M14 AC-8.4`): bắt M12 tự giải quyền là tạo chokepoint **thứ hai**, và hai chỗ
giải cùng một câu hỏi là hai chỗ **có thể lệch** — đúng lớp lỗi đang làm
`check_danh_muc` đỏ (hai bản một schema).

| ai | làm gì |
|---|---|
| **LÕI** | xác thực người dùng · giải `nguon[]` **về slug người đó được đọc** · gán `nguoi_dung_id` · tạo job |
| **M12** | nhận danh sách **đã được cấp phép**; **không** giải lại; chỉ chặn *ai được gọi vào* (`AC-1.4`) |

⚠️ **Hôm nay phép giải đó CHƯA TỒN TẠI** — cả 5 tài khoản đọc cả kho, chưa có ACL
theo tài liệu. Nên `AC-1.4`/`AC-1.5` là **hình dạng giữ sẵn**, và phép kiểm quyền
thật là **FR tới M08** khi Knowledge / bài học có (`upgrade 2`). Ghi ra để lần đó
không ai thêm nó vào M12 cho tiện.

## 2 · BA kiểu việc, một hợp đồng

*(loai thứ ba thêm 2026-09-04 · `FR-054` §1.3)*

| `loai` trong payload | ra | đòi gì | egress |
|---|---|---|---|
| `chung-cat-mot-nguon` | bản ghi `ho_so: phan-tich` | đúng **một** slug nguyên liệu | 1–2 lần gửi |
| `tong-hop-chu-de` | bản ghi `ho_so: tong-hop` | `nguon: [slug…]` **≥2** (`FR-044`) | 1–2 lần gửi |
| **`sinh-transcript`** | **hiện vật `.vtt`**, KHÔNG phải bản ghi | một slug bản ghi `video` | **0 hoặc 1**, theo lối của `nguon_transcript` |

`sinh-transcript` là job RIÊNG chứ không phải một nhánh trong `chung-cat`, và
`FR-054 §1.3` nêu ba lý do đo được: M12 giữ **một** đường mã (hiện vật → chưng
cất) thay vì mọc nhánh *"nếu là video thì…"*; `lan_gui` của hai việc không lẫn
vào nhau; và sinh lại transcript (đổi model ASR tốt hơn) **không** tiêu egress
của chưng cất.

Cùng một đường API, khác `loai`. Địa chỉ của bản `tong-hop` phải **mang tên
nguồn** (`B-A7`): `[xgboost-stap-by-step:p.7]`, không phải `[p.7]`.

> **AC-2.1** · `loai: tong-hop-chu-de` mà `nguon` chỉ có 1 slug ⇒ từ chối **trước
> khi** gọi model; không tiêu một token nào.
> `hard` · `cmd: python chungcat/tests/check_hai_kieu_viec.py`

> **AC-2.2** · Bản `tong-hop` sinh ra có **mọi** địa chỉ phân giải về một slug
> trong `nguon`. Một địa chỉ trỏ ra ngoài danh sách ⇒ bản nháp bị loại **tại M12**,
> không ghi vào bảng nháp.
> `hard` · `cmd: python chungcat/tests/check_dia_chi_mang_ten_nguon.py`

> **AC-2.3** · Mỗi slug đã khai trong `nguon` được nhắc **ít nhất một lần** trong
> thân bài (`B-A7`).
> `hard` · `cmd: python chungcat/tests/check_dia_chi_mang_ten_nguon.py`

### 2.1 · Đường VIDEO — bảy vế của `FR-054 §3`

Transcript là **hiện vật DẪN XUẤT** của bản ghi video, không phải một bản ghi
mới: `media` row với `la_dan_xuat = 1` · `kieu_moc = la_asr` · mime `text/vtt`.
Người **đọc và sửa được** nó trước khi bấm chưng cất (`FR-054 §1.4`) — không có
nhịp đó thì `credibility_max` không có cái thật để chấm.

> **AC-V1** · Hiện vật `.vtt` ghi ra mang `la_dan_xuat: 1` + `kieu_moc: la_asr`
> + **model ASR đã dùng**. Thiếu một trong ba ⇒ đỏ.
> `hard` · `cmd: python chungcat/tests/check_transcript_hien_vat.py`

> **AC-V2** · `sinh-transcript` **không** ghi byte audio vào `kb/**`, và audio
> tạm **bị xoá** khi job xong. Còn file audio sau khi job đóng ⇒ đỏ.
> *(cổng dễ quên nhất — audio là thứ nặng nhất trong toàn hệ)*
> `hard` · `cmd: python chungcat/tests/check_asr_khong_egress.py`

> **AC-V3** · `egress.jsonl` ghi **lối đã dùng** + `tieu_egress`. Sinh transcript
> mà không phân biệt được lối local với lối gửi-ra ⇒ đỏ.
> `hard` · `cmd: python chungcat/tests/check_asr_khong_egress.py`

> **AC-V4** · `tai_ve` và `dich_vu` đều đi qua **cửa egress duy nhất**, host phải
> trong allowlist. Một `yt_dlp.download()` hay `httpx` ngoài hàm egress ⇒ đỏ.
> `hard` · `cmd: python chungcat/tests/check_tai_url_allowlist.py`

> **AC-V5** · Thêm/bớt một dòng `nguon_transcript` đổi hành vi với **0 dòng mã**.
> Phải sửa mã mới đổi được lối ⇒ đỏ.
> `hard` · `cmd: python chungcat/tests/check_asr_khong_egress.py`

> **AC-V6** *(vế HAPPY — sửa 2026-09-04)* · Transcript ghi ra **không ghi đè**
> hiện vật đang có: `media[]` chỉ **thêm**, mọi hiện vật cũ giữ nguyên **từng
> byte**, và `ban` bump theo `FR-054 §9.1`.
> `hard` · `cmd: python chungcat/tests/check_transcript_hien_vat.py`

> **AC-V7** · `.vtt` không đúng magic `WEBVTT` (`5745425654`) ⇒ **từ chối**. File
> dán nhãn `text/vtt` mà byte mở đầu khác ⇒ 422 ở cửa media.
> `hard` · `cmd: python chungcat/tests/check_vtt_hop_le.py`

> ⚠️ **`AC-V6` đổi từ vế PHỦ ĐỊNH sang vế HAPPY.** `FR-054 §3` khai V6 đỏ khi
> *"`media` còn là object (⇒ `FR-052` chưa áp) mà vẫn cho ghi"* — một cổng
> **phụ thuộc**, cố ý đỏ cho tới khi `FR-052` áp. `FR-052` **đã áp**, nên vế đó
> **hết đỏ được**, và một cổng không đỏ được là một cổng đã chết. Vế mới đo
> được điều V6 thật sự bảo vệ: bản gốc nguyên từng byte.

> ⚠️ **Hai trần chưa đo được ở đây**: `M12-R9` đòi ba số (1GB video · 500MB
> audio · 3600s) đọc **từ bảng khai**, và `frontmatter.schema.json` hiện chốt
> **25 MB** — FROZEN. `T12-14` mời NGƯỜI ký bản vá 25MB→1GB; tới lúc đó
> `AC-V4`/`M12-R9` đo được nửa vế (thời lượng), không đo được vế byte.

⚠️ **Chặn cứng**: `nguon` **chưa có** trong `core/assets/frontmatter.schema.json`
(`FR-044` chờ áp; file frozen + deny chặn agent). AC-2.1→2.3 **không thi công
được** trước khi trường đó vào schema. Ghi ở đây để s7 không chia task vào chỗ
chưa có hợp đồng.

### 2.2 · Nguyên liệu của `chung-cat-mot-nguon` — rẽ theo LOẠI bản ghi

*(thêm 2026-09-07 · `FR-070`, chủ dự án duyệt)*

| bản ghi | nguyên liệu | chưa có thì |
|---|---|---|
| `article` · `docs` · `repo` · `paper` | **thân bài** (`than`) | — |
| `video` | **nội dung TRANSCRIPT** (`text/vtt` → văn xuôi) | **TỪ CHỐI**, nói rõ *"sinh transcript trước"* |

**Vì sao rẽ**: với một bản ghi video đăng ký bằng URL, `than` là phần **mô tả
người gõ tay** — vài dòng. Transcript (hàng chục nghìn chữ, chính là nội dung
video) nằm ở một chỗ khác hẳn: hiện vật `text/vtt` gắn trên bản ghi.

Chưng cất phần mô tả rồi bắt model dựng một bài đủ khung là **bắt model bịa**.
Và lỗi ấy **không tự lộ**: bản nháp vẫn ra, vẫn đủ mục, vẫn qua `validate` —
chỉ người ĐỌC mới thấy nó rỗng.

**Từ chối, KHÔNG rơi về `than`.** Rơi về mô tả là im lặng làm một việc khác
việc người bấm, và họ chỉ biết khi đọc bản nháp rỗng. Một lỗi ồn ào tốt hơn
một kết quả sai im lặng.

**Hệ quả: thứ tự việc thành một CHUỖI.**

```
sinh-transcript  →  (có .vtt)  →  chung-cat-mot-nguon
```

Nút *Chưng cất* của một bản ghi video chỉ có nghĩa **sau khi** transcript
xong. Trước đó nó phải nói ra điều kiện của mình, không được bấm rồi mới báo.

### 2.3 · Mọi việc phải ĐỂ LẠI CON TRỎ tới sản phẩm

*(thêm 2026-09-07 · `FR-070 §3`)*

| `loai` | con trỏ trong `ket_qua` |
|---|---|
| `chung-cat-mot-nguon` | `nhap_id` |
| `sinh-transcript` | `sha256` · `so_cue` · `slug` |
| `tai-video` | `tep_tam` · `thu_muc` · `so_byte` |

Một việc không để lại con trỏ tới sản phẩm của nó là một việc **không ai kiểm
được** — và thứ khác không dùng lại được. Đo 2026-09-07: `ket_qua` của mọi
việc `sinh-transcript` là `null`, nên chưng cất không tra được transcript, và
màn không mở được chi tiết. Hai lỗ, một gốc.

## 3 · Hợp đồng adapter model — bảo đảm trích dẫn thuộc VỀ TA

`decisions.md` 2026-09-01: gọi được model của **mọi nhà** (Anthropic · OpenAI ·
Gemini · DeepSeek · Kimi), adapter **nối thẳng**, N khoá trong env của THỢ.

Hệ quả then chốt: **không nhà nào** bảo đảm vị trí được cho hợp đồng này. Nên
bảo đảm địa chỉ **đổi chỗ đặt**:

> **Trước**: provider bảo đảm vị trí, ta verify thêm cho chắc.
> **Sau**: **ta** là nơi duy nhất bảo đảm. Model chỉ được yêu cầu trả **quote
> nguyên văn**; vị trí do **phép định vị ba tầng** của ta tính (§3.1).

Một hợp đồng cho mọi nhà: `(prompt, tài_liệu) → {text, quotes[]}`. Thứ riêng của
provider nằm **dưới** nó.

⚠️ **`FR-053` §2 · Citations API BỊ BỎ khỏi hợp đồng — không phải "tụt xuống
đường tắt tuỳ chọn".** Bản trước của mục này viết vậy; câu đó **đúng ý định
nhưng chưa đo**. Đo được (tài liệu Anthropic, 2026-09-02): citations
**`Incompatible with output_config.format` — trả 400**. Hợp đồng adapter LÀ
structured output ⇒ *"đường tắt"* đó **không tồn tại trong cùng một lời gọi**.

Bỏ nó còn được một thứ nữa, và lý do này đã nằm sẵn trong `model_flow §4`: phép
định vị `V` phải chạy trên **mọi** nhánh, vì nếu một đường bỏ qua `V` thì lỗi
trong `V` **không bao giờ lộ ra ở đường phổ biến nhất**. `V` đã là nơi duy nhất
bảo đảm ⇒ Citations không mua thêm gì, chỉ thêm một nhánh mã, một cửa 400, và
một đường ít được kiểm.

- `ho_tro_citations` trong `model.json`: **giữ làm cột THÔNG TIN**, thôi làm cột
  điều khiển.
- Đường **tool_use + `strict: true`** đi cùng citations *có thể* khác cơ chế —
  **CHƯA XÁC MINH**, nên không khai vào spec. Ai muốn lối đó: mở FR kèm một lời
  gọi thật.

### 3.1 · Định vị lại — BA TẦNG, ngưỡng trong bảng khai

`re.finditer(re.escape(quote))` thuần (bản trước của mục này) **trượt trên quote
THẬT** vì bốn nguyên nhân độc lập: ligature PDF (`fi`→một ký tự) · gạch nối cuối
dòng (`boost-\ning`) · khoảng trắng/newline giữa câu · model chuẩn hoá nháy và
gạch (`"`→`"`, `—`→`-`). Nó **từ chối phần lớn khẳng định ĐÚNG** — đỏ oan, và hệ
quả tệ hơn lọt: người thi công sẽ hạ ngưỡng tới lúc cổng hết đỏ.

```
1. chuẩn hoá CẢ HAI vế   NFKC · gỡ ligature · nối gạch-nối-cuối-dòng
                          · nén khoảng trắng về một space · casefold
2. khớp chính xác trên bản đã chuẩn hoá         ⇒ verified
3. rapidfuzz.partial_ratio_alignment ≥ nguong   ⇒ verified + VỊ TRÍ
   dưới ngưỡng                                   ⇒ TỪ CHỐI khẳng định
```

Tầng 1 làm tầng 2 gánh hầu hết ca thật. `partial_ratio_alignment` trả **cả vị
trí**, tức nó cho luôn `p.7` mà `V` cần — không phải chạy hai phép.

**`nguong` là số phải ĐO**, khai ở bảng khai (`M12-R4`), **không gõ trong mã**.

> **AC-3.1** *(sửa 2026-09-04 · `FR-059`)* · Với mọi dòng khai trong bảng model,
> adapter trả đúng một hình dạng.
> Adapter thuộc **CỬA**, không thuộc **NHÀ**: `chungcat/assets/cua.json` khai mỗi
> cửa kèm `phuong_ngu`, và file adapter đặt tên theo **phương ngữ**.
> ⇒ Thêm một cửa nói phương ngữ ĐÃ CÓ (gateway trung gian, hay API gốc của
> OpenAI) = **một dòng `cua.json` + 0 file**.
> ⇒ Thêm một phương ngữ MỚI (Gemini native `:generateContent`) = **một dòng +
> một file** dưới `chungcat/src/adapter/`.
> Cả hai lối: **0 dòng** ở **LÕI**.
> **LÕI = `chungcat/src/**` TRỪ `chungcat/src/adapter/**`.** (`assets/` là bảng
> khai, không phải mã, nên không tính vào cả hai vế.)
> `hard` · `cmd: python chungcat/tests/check_mot_hop_dong.py`

⚠️ **Vì sao `FR-059` đổi NHÀ → CỬA**: đo 2026-09-04 sau khi đồng bộ bảng khai từ
danh mục cửa thật — **112 model / 14 nhà, và 111/112 bị vế (b) từ chối** vì chỉ
có một file adapter. `beeknoee-api-guide.md` §3 nói cửa là OpenAI-compatible,
*"một client duy nhất, đổi tên model để chuyển provider"* ⇒ giả định
N-nhà-N-adapter **sai với thực tế**. Bản đầu của AC này biến "thêm một nhà"
thành một thứ thuế không có thật.

⚠️ **Định nghĩa LÕI viết ra vì phép thử s6 bắt được**: bản đầu chỉ nói *"0 dòng ở
lõi"* mà không nói lõi gồm file nào. Không chốt thì cổng hoặc **đỏ oan** (đụng một
file phụ), hoặc **không đỏ được** (định nghĩa lõi rộng tới mức mọi thay đổi đều
nằm ngoài). Xem `testcases.md` §cuối.

> **AC-3.2** · Mọi quote model trả về được **định vị lại bằng máy** qua ba tầng
> §3.1. Dưới `nguong` ⇒ khẳng định đó bị **từ chối**, không im lặng bỏ.
> **HAI vế, không một**: (a) quote **bịa** — không có trong PDF ⇒ cổng **ĐỎ**;
> (b) **không đỏ oan** — quote **thật** mà nguồn có `boost-\ning` + ligature
> `fi` ⇒ cổng **XANH**. Thiếu vế (b) thì *"xanh khi mọi quote khớp"* nghiệm đúng
> bằng cách **từ chối tất cả**, và cổng không phân biệt *"không có khẳng định
> nào"* với *"mọi khẳng định đều sai"*.
> `hard` · `cmd: python chungcat/tests/check_quote_co_that.py`

> **AC-3.3** · Hàng nháp ghi vào DB có `citations_sampled`/`citations_verified`
> **do máy đếm** (`B-A6`), không do model khai. Model khai số ⇒ số đó bị bỏ.
> `hard` · `cmd: python chungcat/tests/check_quote_co_that.py`

## 4 · NGƯỜI chọn model — bảng khai là DANH MỤC NĂNG LỰC, không phải bộ chọn

`chungcat/assets/model.json` (bảng khai, cùng khuôn `dich-vu.json`):
`tac_vu` × `ngon_ngu` → `nha_cung_cap` · `model` · `dich` · `khu_vuc` ·
`du_phong` · `ho_tro_citations` · `can_key` · `kieu_structured` ·
`nguong_lech_schema` · `che_do`.

**`FR-053` §1 · VAI của bảng này đã ĐỔI** (chỉ đạo chủ dự án: *"M12 này cho user
chọn model để chưng cất nội dung"*):

| | trước | sau |
|---|---|---|
| ai quyết model | **máy** — tra `tac_vu × ngon_ngu` | **người**, mỗi job |
| vai `model.json` | **bộ chọn** | **danh mục năng lực + allowlist**; hàng tra tụt xuống **GỢI Ý MẶC ĐỊNH** |
| tỉ lệ Hán do máy đếm | quyết định tuyến | **chỉ chọn cái được bày sẵn** |

### 4.0 · Ai xác thực lựa chọn — `authz` về LÕI, `năng lực` về CHỦ SỞ HỮU

`§1.1` đã rút luật **MỘT chokepoint** cho `nguon[]`. `model` **không cùng loại
câu hỏi**, và gộp chúng là sai:

| trường | câu hỏi | ai trả lời |
|---|---|---|
| `nguon[]` | *"người này có được đọc slug đó không"* → **authz** | **LÕI** (`AC-1.5`) |
| `model` | *"M12 gọi được model đó không"* → **năng lực** | **M12** — nó sở hữu `model.json`, adapter, và khoá |

LÕI không cầm `model.json`; bắt nó xác thực `model` là bắt nó đọc tài nguyên của
THỢ — đúng thứ `model_flow §2` cấm theo chiều ngược lại.

⇒ Ba nhịp, và **nhịp ba không được bỏ**:

1. `GET /model` của M12 trả danh mục **chỉ-đọc** (nhà · model · `khu_vuc` ·
   `can_key` · có adapter hay chưa). **Sinh từ bảng khai** (`M12-R4`) — nếu không
   thì bộ chọn là chỗ thứ hai tên model được gõ tay.
2. `web/` render bộ chọn từ danh mục đó (`Z7`: giao diện ở LÕI, không ở THỢ).
3. `POST /job` **xác thực lại** `model` tại M12 — client gửi gì cũng không tin.
   Bỏ nhịp 3 thì bộ chọn của `web/` **là** lớp xác thực, và một `curl` thẳng vào
   `:8790` đi qua nó.

### 4.0b · Bốn phép chặn phải xảy ra TRƯỚC khi tiêu một token

Trước đây bảng khai chặn hộ vì máy chỉ chọn thứ trong bảng. Người chọn thì bốn
phép này thành phép **thật**, cùng khuôn `AC-2.1`:

| # | chặn khi | vì sao không để lỗi lúc chạy |
|---|---|---|
| a | `model` không có trong `model.json` | tên đoán được ⇒ cùng hình dạng `CVE-2026-44560` |
| b | **cửa** mà dòng đó cần **chưa có adapter** *(`FR-059`; trước đây đọc là "nhà")* | `workflow §4`: đỏ ở cổng khai báo, không thử chạy |
| c | `can_key: true` mà **env thiếu khoá** | thử rồi lỗi là một lần payload đã dựng, và log egress ghi một lần gửi hỏng |
| d | `khu_vuc` **khác** khu vực của gợi ý mặc định | §4.0c — chỗ nặng nhất |

### 4.0c · Chọn model là chọn KHU VỰC PHÁP LÝ — phải hiện, không được im

`M12-R5` viết cho **dự phòng tự động**. Người chọn thì **chính lựa chọn** làm
việc đó: một cú bấm chọn nhà nước ngoài cho tài liệu nội bộ là **một lần chuyển
dữ liệu xuyên biên giới**, và nó không đi qua cờ nào. `NĐ 356/2025` Điều 14 đã
kích hoạt từ `FR-045`.

⇒ Hai điều, cả hai bắt buộc:

- **`web/` phải HIỆN `khu_vuc`** cạnh mỗi model trong bộ chọn — không phải chú
  thích cuối trang. Người quyết phải **thấy** mình đang quyết gì.
- **`egress.jsonl` ghi thêm**: `model_da_chon` · `la_mac_dinh: true|false` ·
  `khu_vuc`. Câu cần trả lời được sau này không phải *"gửi tới đâu"* mà **"ai đã
  chọn gửi tới đó, và đó có phải mặc định không"**.

Ba luật, cả ba từ `decisions.md` 2026-09-01:

1. **Tiếng Trung → Kimi hoặc DeepSeek**, nhưng theo **TỈ LỆ** ký tự Hán, không
   theo *"có chữ Hán hay không"*. Bài 80% Việt kèm một trích đoạn tiếng Trung
   **không** được đẩy sang Kimi. Ngưỡng là **số trong bảng**, không giấu trong mã.
2. **Ngôn ngữ do MÁY đếm**, không do model tự khai — model tự khai ngôn ngữ rồi
   tự được chọn theo lời khai đó là nó cầm bút ghi vào thứ nó bị chấm. Dùng đúng
   dải Hán của `chuan_hoa()` (M13): một hàm, hai chỗ dùng.
3. **Dự phòng chỉ rơi trong cùng `khu_vuc`**, và **chỉ khi người dùng MẶC
   ĐỊNH**. Nhà tiếng Trung là pháp nhân khác đích với nhà Mỹ; `NĐ 356/2025` Điều
   14 đã kích hoạt từ khi `FR-045` thêm 5 tài khoản. Rơi chéo khu vực phải khai
   tường minh từng dòng.

   ⚠️ **`FR-053` §1.5 · `du_phong` KHÔNG được rơi ra khỏi lựa chọn tường minh.**
   Người chọn X, X chết, rơi tự động sang Y = **âm thầm đảo quyết định của
   người**; Y khác `khu_vuc` thì đảo luôn quyết định pháp lý.
   ⇒ Chọn tường minh mà model chết ⇒ **job DỪNG, báo lý do, hỏi lại. Không rơi.**
   Đây là cái giá của *"user chọn model"* — không trả nó thì lựa chọn là trang trí.

> **AC-4.1** · Không file mã nào gõ tên model hay tên nhà cung cấp. Grep tên model
> trong `chungcat/**/*.py` (trừ `assets/`) ⇒ 0 dòng.
> `hard` · `cmd: python chungcat/tests/check_bang_khai_model.py`

> **AC-4.2** · **GỢI Ý MẶC ĐỊNH** cho tài liệu 80% Việt + 20% Hán không phải nhà
> tiếng Trung; tài liệu trên ngưỡng thì có. Đổi ngưỡng trong bảng ⇒ hành vi đổi
> theo, 0 dòng mã. *(`FR-053` §1.6 — vẫn đo bằng máy, chỉ đổi đối tượng đo từ
> **tuyến** sang **gợi ý**.)*
> `hard` · `cmd: python chungcat/tests/check_dinh_tuyen_ngon_ngu.py`

> **AC-4.3** · **Chỉ trên đường MẶC ĐỊNH**: model chết ⇒ rơi sang `du_phong`
> **cùng `khu_vuc`**; bảng khai một `du_phong` khác khu vực mà không có cờ tường
> minh ⇒ **đỏ ở cổng**, không phải một lỗi lúc chạy.
> **Vế thêm** (`FR-053` §1.5): model **do người chọn tường minh** mà chết ⇒
> **0 lần rơi**, job dừng và nói lý do.
> `hard` · `cmd: python chungcat/tests/check_du_phong_cung_khu_vuc.py`

> **AC-4.4** · Model **thật sự chạy** được ghi vào frontmatter bản nháp và vào log
> gửi RA — model đã *dùng*, không phải model được *chọn*. Dòng log mang thêm
> `la_mac_dinh` + `khu_vuc` (`FR-053` §1.4).
> `hard` · `cmd: python chungcat/tests/check_du_phong_cung_khu_vuc.py`

> **AC-4.5** *(mới · `FR-053` §1.3)* · Bốn phép chặn §4.0b xảy ra **TRƯỚC** lời gọi
> model. Gieo cả bốn ca ⇒ đếm **0 token** tiêu và **0 dòng** thêm vào
> `egress.jsonl`. Đo số, không đo lời khai: một phép chặn "có" mà payload đã dựng
> và log đã ghi thì nó chặn SAU chỗ cần chặn.
> `hard` · `cmd: python chungcat/tests/check_chan_truoc_khi_goi.py`

> **AC-4.6** *(mới · `FR-053` §1.6)* · `POST /job` mang `model` không có trong
> `model.json` ⇒ **từ chối**. Cổng phải gọi **THẲNG `:8790`**, không qua `web/` —
> qua `web/` thì nó chỉ kiểm bộ chọn của FE, và một `curl` thẳng vào THỢ đi vòng
> qua phép kiểm đó.
> `hard` · `cmd: python chungcat/tests/check_model_ngoai_bang.py`

## 5 · Hàng đợi, idempotency, trần thử lại

`research_summary` §10-2 trả lời đúng **ba câu `build_order` bỏ ngỏ**:

| câu s4 bỏ ngỏ | trả lời |
|---|---|
| job chạy hai lần thì sao | **ULID trong tên file = khoá idempotency**; đã có thì bỏ qua |
| thợ chết giữa chừng, việc treo bao lâu | Maildir `tmp/ → os.replace → new/`, và **tên đích trong `new/` LUÔN DUY NHẤT** (`<ULID>.json`) — xem §5.0 |
| giới hạn thử lại | **cap 2 lần GỬI**, và log `sha256` **MỖI LẦN** gửi |

Câu thứ ba không thuần kỹ thuật: **mỗi lần gửi là một lần tài liệu rời khỏi máy**.
Retry vô hạn = gửi vô hạn, và `FR-043` bậc 4 đòi log từng lần.

### 5.0a · MÃ TRẢ VỀ của ca idempotent — `200`, không `201`

*(thêm 2026-09-07 · `FR-071`, chủ dự án duyệt)*

```
POST /job  ·  201 Created  — việc vừa được xếp
              200 OK       — ULID này ĐÃ có việc; thân mang `da_co: true`
                             kèm `viec_id` CŨ. Hàng đợi không đổi.
```

Trước `FR-071`, cả hai đường trả `201`. Phép idempotent vẫn ĐÚNG suốt — hàng
đợi luôn đúng một việc — nhưng `201 Created` cho một lần **không tạo gì** là
một câu nói dối, và `web/` dựng màn theo mã trả về:

```
mã trả về sai → màn báo "đã tạo việc" lần hai → người bấm lại → lại 201
```

Không bước nào trong vòng đó báo lỗi. Đây là lý do một mã HTTP sai không phải
chuyện thẩm mỹ ở hệ này: cửa có **đúng một** client, và client ấy tin mã.

**KHÔNG dùng `409`.** Nạp lại không phải một xung đột, nó là một phép idempotent
**thành công**; `409` đẩy client vào nhánh lỗi cho một chuyện không sai.

`nap()` trả `(ulid, da_co)` — một giá trị đi cùng phép ghi, KHÔNG một hàm
`da_co(ulid)` tra riêng: hàm tra riêng là hai lời gọi cho một câu hỏi, và giữa
hai lời gọi có một khoảng để trạng thái đổi (`§5.0` đã chọn `_ghi_nguyen_tu`
đúng vì lớp lỗi này). Sự thật *"tôi vừa tạo hay không"* chỉ bên GHI biết chắc.

> **AC-5.5** *(mới · `FR-071`)* · nạp cùng một ULID hai lần ⇒ `201` rồi `200`,
> thân lần hai mang `da_co: true` và `viec_id` cũ, hàng đợi vẫn đúng một việc,
> payload lần một KHÔNG bị đè. Hai ULID khác nhau ⇒ `201` cả hai lần.
> `hard` · `cmd: python chungcat/tests/check_nap_lai_tra_200.py`

### 5.0b · Giai đoạn của job `sinh-transcript`

Bốn giai đoạn, checkpoint sau từng cái — `AC-5.4` đòi *"chạy lại từ giai đoạn
hỏng"*, và với ASR điều đó là **thật**: một video 60 phút mất 7-8 phút ASR, nên
chạy lại từ đầu vì gãy ở bước gắn hiện vật là đốt 8 phút cho không.

```
doc-byte       GET /api/articles/media/<sha> qua LÕI (quyết 1a)
               → audio vào Maildir của job, KHÔNG vào kb/**
asr            checkpoint theo BLOCK segment — resume không chạy lại block xong
vtt            dựng .vtt (magic WEBVTT · cue tăng dần)
gan-hien-vat   POST media .vtt + thêm vào `media[]` của bản ghi video, bump `ban`
```

Audio tạm **bị xoá** khi job đóng (`AC-V2`). Nó sống trong Maildir của job vì
đó là chỗ duy nhất có vòng đời gắn với job — để trong `/tmp` thì một lần dọn
`/tmp` giữa hai lần resume làm checkpoint thành vô nghĩa.

### 5.0 · `os.replace` KHÔNG nguyên tử trên Windows — đổi cách CHỨNG MINH

Bản trước của mục này trả lời *"thợ chết giữa chừng"* bằng *"`os.replace`
**nguyên tử** nên không có trạng thái nửa vời"*. **`FR-053` §4: mệnh đề đó SAI
trên nền tảng đang chạy.** `os.replace` gọi `MoveFileEx(MOVEFILE_REPLACE_EXISTING)`,
và MoveFileEx **không được bảo đảm nguyên tử** — *"under certain and unknown
circumstances it may silently fall back to a non-atomic `CopyFile()`"*. Máy phát
triển là Windows 10.

Một AC `hard` đứng trên một tiền đề sai sẽ **XANH**, vì crash-đúng-lúc là ca
hiếm. Đúng kiểu hỏng im lặng — và cổng canh nó thì càng im lặng hơn.

**Không đổi Maildir. Đổi cách chứng minh:**

1. **Luật mới, khai tường minh chứ không để là tình cờ**: tên đích trong `new/`
   **luôn duy nhất** (`<ULID>.json`) ⇒ `os.replace` chỉ đi đường
   **rename-không-đè**, đường ít rủi ro nhất của `MoveFileEx`, và nhánh fallback
   `CopyFile` (chỉ liên quan khi phải THAY một file đang có) **hết cửa**.
2. `AC-5.2` đo lại — một tính chất **đo được** thay một tính chất **tin tưởng**.
3. Ngày nào job có bước **ĐÈ** file trong `new/`: mở lại mục này, ghi vào backlog
   M12 **lúc bước đó xuất hiện**, không phải bây giờ.

### 5.1 · HAI bộ đếm, không một — `FR-046` §2.1 buộc tách chúng

`FR-046` §2.1 thêm: *"M12 CÓ checkpoint theo giai đoạn — 'Chạy lại' mặc định từ
**giai-đoạn-hỏng** (đỡ phí token); 'chạy lại từ đầu' là lựa chọn phụ, tường minh"*.

Điều đó **buộc tách** thứ bản đầu của spec này gộp làm một. Chỉ **MỘT** giai đoạn
tiêu egress:

| giai đoạn | chạy lại từ đây tốn egress? |
|---|---|
| `cho` · `dang-doc-nguon` | **không** — chưa gửi gì |
| `dang-goi-model` | **CÓ, đúng 1 lần** |
| `dang-verify` | **không** — *với điều kiện* phản hồi model đã được lưu |

⇒ Hai bộ đếm, hai ý nghĩa:

| | đếm gì | trần | reset khi chạy lại? |
|---|---|---|---|
| **`lan_gui`** | số lần payload **rời khỏi máy** | **2** | **KHÔNG BAO GIỜ** |
| lần chạy lại | số lần người bấm | **không có** | — |

**`lan_gui` không reset là cả luật.** Nếu chạy lại reset nó, người bấm mười lần là
tài liệu đi ra mười lần, và trần thành trang trí — đúng thứ `M12-R6` sinh ra để
chặn.

**Hệ quả sắc, phải nói ra**: *"chạy lại từ đầu"* **CÓ** gửi lại. Nên khi
`lan_gui = 2`, nút đó phải **từ chối và nói lý do**, không im lặng không làm gì.

**Và trần này KHÔNG phải quota của người.** Nó là trần cho **vòng lặp TỰ ĐỘNG**.
Người thật sự cần gửi lần thứ ba thì tạo **job mới** — ULID mới, log riêng, nên con
số egress vẫn **đúng**. Máy không được tự quyết gửi lần thứ ba; người thì được, và
hành động đó để lại dấu vết.

⚠️ **Lỗ `FR-046` không nêu**: *"đỡ phí token"* chỉ đúng nếu **phản hồi model được
lưu**. Job hỏng ở `dang-verify` mà không có bản lưu thì chạy lại **phải gọi model
lại** — tức tốn đúng cái nó hứa tiết kiệm. Theo quyết định hàng đợi (Maildir ở
THỢ), bản lưu đó nằm **cạnh job trong Maildir**, không phải ở LÕI.

> **AC-5.1** · Cùng một ULID nạp hai lần ⇒ đúng **một** bản nháp, và lần thứ hai
> **0 lời gọi model**.
> `hard` · `cmd: python chungcat/tests/check_idempotency.py`

> **AC-5.2** · *(đo lại theo `FR-053` §4 — bỏ mọi khẳng định về "nguyên tử")*
> Giết tiến trình **N lần** giữa lúc ghi ⇒ `new/` **không chứa file JSON
> parse-lỗi**, và job còn nguyên trong `tmp/` để chạy lại. Cộng luật §5.0-1:
> mọi tên trong `new/` là `<ULID>.json` duy nhất — cổng đọc thư mục và bắt được
> một cái tên trùng.
> `hard` · `cmd: python chungcat/tests/check_hang_doi_nguyen_tu.py`

> **AC-5.3** · Lần **GỬI** thứ 3 không xảy ra; `egress.jsonl` có đúng 2 dòng
> `sha256`, mỗi dòng một lần gửi — kể cả khi hai payload y hệt nhau.
> `hard` · `cmd: python chungcat/tests/check_tran_thu_lai.py`

> **AC-5.4** · Phản hồi model được **lưu cạnh job** trong Maildir. Job hỏng ở
> `dang-verify` rồi chạy lại ⇒ **0 lời gọi model**, và `lan_gui` **không tăng**.
> `hard` · `cmd: python chungcat/tests/check_checkpoint_giai_doan.py`

> **AC-5.5** · `lan_gui` **bền qua mọi lần chạy lại**: chạy lại 5 lần từ
> `dang-verify` ⇒ `lan_gui` giữ nguyên. Và *"chạy lại từ đầu"* khi `lan_gui = 2`
> ⇒ **từ chối kèm lý do**, không im lặng bỏ qua.
> `hard` · `cmd: python chungcat/tests/check_tran_thu_lai.py`

## 6 · Egress — bậc 4 của FR-043

M12 là **nơi tài liệu rời khỏi máy**. `FR-043` bậc 4 đòi mỗi lần gửi RA ghi một
dòng log kèm `sha256` của **payload đã gửi**, không phải của file nguồn.

> **AC-6.1** · Mọi lời gọi ra Internet đi qua **đúng một** hàm, và hàm đó ghi log
> **trước khi** gửi. Thêm một `fetch`/`httpx` ở chỗ khác ⇒ đỏ.
> **Đo thứ tự bằng `seq`, không bằng đồng hồ**: cửa egress cấp một số nguyên tăng
> dần `seq` cho mỗi lần gửi; dòng log mang `seq`, và **payload gửi đi cũng mang
> `seq` đó**. Cổng đọc log rồi đọc payload đã gửi — `seq` phải khớp, và dòng log
> phải **tồn tại kể cả khi request không bao giờ hoàn thành**.
> `hard` · `cmd: python chungcat/tests/check_mot_cua_egress.py`

⚠️ **Vì sao không so hai đồng hồ**: phép thử s6 bắt được chỗ này — *"log trước khi
gửi"* mà chỉ đo *"dòng log có tồn tại"* thì một cài đặt **log-SAU-khi-gửi vẫn
xanh** ở ca thành công. Và so timestamp của ta với timestamp của request là so hai
đồng hồ khác nhau. `seq` do **ta** cấp nên nó là một sự kiện, không phải một phép
đo thời gian.

> **AC-6.2** · `sha256` trong log **khớp payload đã gửi** — dựng lại payload từ log
> rồi băm lại phải ra cùng số.
> `hard` · `cmd: python chungcat/tests/check_mot_cua_egress.py`

> **AC-6.3** · Đích gửi RA phải có trong allowlist khai ở `model.json`; gọi một host
> không khai ⇒ chặn **trước khi** mở socket.
> `hard` · `cmd: python chungcat/tests/check_mot_cua_egress.py`

> **AC-6.4** *(mới · `FR-053` §5.4)* · Trần **32 MB** cho payload, kiểm **TRƯỚC**
> cửa egress. Vượt trần ⇒ chặn ở đó, **0 dòng** `egress.jsonl`.
> Vì sao trước chứ không sau: vượt 32 MB là 400 **sau khi** đã tính `sha256` và
> ghi log ⇒ log ghi **một lần gửi không bao giờ xảy ra**, và con số egress nói
> dối **theo chiều phóng đại**. Một PDF hiện có ~2.8 MB nên an toàn; nhưng
> `tong-hop-chu-de` gộp N nguồn thì 32 MB là **trần thật**.
> `hard` · `cmd: python chungcat/tests/check_mot_cua_egress.py`

## 7 · Engine cắm rút được (ADR-05)

Hợp đồng vào/ra **khoá**; engine phía sau thay theo bảng khai `chu_de → engine`.
Thêm nhóm chủ đề hay khách hàng mới = thêm **một dòng**, không sửa lõi. Đây là chỉ
đạo nguyên văn: *"ko chơi bỏ trứng vào 1 giỏ"*.

> **AC-7.1** · Đổi `chu_de → engine` trong bảng khai làm đổi engine được dùng, và
> **0 file mã** phải sửa.
> `hard` · `cmd: python chungcat/tests/check_engine_cam_rut.py`

## 8 · Cái CỐ Ý không có

| | vì sao |
|---|---|
| tự đi tìm nguồn (crawler) | nạp theo **request**, không cron kéo RSS — chỉ đạo lượt 11 |
| giao diện | `Z7` — giao diện thuộc `web/`; THỢ chỉ backend |
| ghi kho | một cửa ghi ở LÕI (`M08-R2`); M12 ghi **bảng nháp** qua API (`FR-046`) |
| chọn `credibility_max` | **quyết định**, không phải phép tính (`M01-R2`) |
| embedding / vector | M13 quyết, và giai đoạn này **không** dùng (`research_summary` §10-3) |
| prompt caching | `research_summary` §10-1: không đáng ở lưu lượng này |
