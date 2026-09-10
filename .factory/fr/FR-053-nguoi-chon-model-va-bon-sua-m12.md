# FR-053 — NGƯỜI chọn model, và bốn chỗ spec M12 sai

- **mở**: 2026-09-02 · **người quyết**: chủ dự án (*"M12 này cho user chọn model để
  chưng cất nội dung"*) · **trạng thái**: **ĐÃ DUYỆT** 2026-09-03 (chủ dự án)
- **artifact FROZEN chạm**: `06_modules/M12_chungcat/spec.md` ·
  `06_modules/M12_chungcat/rules.md`
- **artifact khác chạm**: `M12_chungcat/model_flow.md` · `data_flow.md` ·
  `testcases.md` (không frozen) · `chungcat/assets/model.json` (chưa tồn tại)
- **nguồn**: `01_research/m12-ky-thuat-trien-khai.md` (khảo 2026-09-02) + chỉ đạo
- **mở khoá**: s7 chia task C4 — hai trong bốn chỗ dưới đây làm `AC-3.2` và
  `AC-5.2` **không cài đúng được**, nên chia task vào đó là chia vào chỗ không
  verify được

## 0 · Vì sao MỘT FR, không phải năm

Chỉ đạo *"user chọn model"* **đổi vai của `model.json`** — từ **bộ chọn** thành
**danh mục năng lực + allowlist**. Bốn chỗ sai còn lại đều nằm trên cùng con
đường đó (adapter · định vị quote · hàng đợi · trần payload), và ba trong bốn
chỉ lộ ra khi đo thư viện thật. Chẻ ra thì mỗi FR sửa nửa một hợp đồng.

---

## 1 · NGƯỜI chọn model — `model.json` đổi VAI, không đổi hình dạng

### 1.1 · Cái đổi

| | trước (spec §4) | sau |
|---|---|---|
| ai quyết model | **máy** — tra `tac_vu × ngon_ngu` | **người**, mỗi job |
| vai `model.json` | **bộ chọn** | **danh mục năng lực + allowlist**; hàng tra thành **gợi ý mặc định** |
| tỉ lệ Hán do máy đếm | quyết định tuyến | **chỉ chọn cái được bày sẵn** |

`§4` luật 2 (*ngôn ngữ do MÁY đếm, không do model tự khai*) **giữ nguyên văn** —
nó vẫn là lý do gợi ý mặc định đáng tin. Cái mất là quyền quyết cuối, và nó về
tay người.

### 1.2 · Ai xác thực lựa chọn — `authz` về LÕI, `năng lực` về CHỦ SỞ HỮU

`spec §1.1` đã rút luật **MỘT chokepoint** cho `nguon[]`. Nhưng `model` **không
cùng loại câu hỏi** với `nguon[]`, và gộp chúng là sai:

| trường | câu hỏi | ai trả lời |
|---|---|---|
| `nguon[]` | *"người này có được đọc slug đó không"* → **authz** | **LÕI** (`AC-1.5`) |
| `model` | *"M12 gọi được model đó không"* → **năng lực** | **M12** — nó sở hữu `model.json`, adapter, và khoá |

LÕI không cầm `model.json`; bắt nó xác thực `model` là bắt nó đọc tài nguyên của
THỢ, tức dính hai vùng — đúng thứ `model_flow §2` cấm theo chiều ngược lại.

⇒ Ba nhịp, và **nhịp ba không được bỏ**:

1. `GET /model` của M12 trả danh mục **chỉ-đọc** (nhà · model · `khu_vuc` ·
   `can_key` đã có khoá hay chưa · có adapter hay chưa).
2. `web/` render bộ chọn từ danh mục đó (`Z7`: giao diện ở LÕI, không ở THỢ).
3. `POST /job` **xác thực lại** `model` tại M12 — client gửi gì cũng không tin.
   Bỏ nhịp 3 thì bộ chọn của `web/` **là** lớp xác thực, và một `curl` thẳng vào
   `:8790` đi qua nó.

### 1.3 · Bốn phép chặn phải xảy ra **trước khi tiêu một token**

Trước đây bảng khai chặn hộ vì máy chỉ chọn thứ trong bảng. Người chọn thì bốn
phép này thành phép **thật**, cùng khuôn `AC-2.1`:

| # | chặn khi | vì sao không để lỗi lúc chạy |
|---|---|---|
| a | `model` không có trong `model.json` | tên đoán được ⇒ cùng hình dạng CVE-2026-44560 |
| b | nhà đó **chưa có adapter** | `workflow §4` đã khai: đỏ ở cổng khai báo, không thử chạy |
| c | `can_key: true` mà **env thiếu khoá** | thử rồi lỗi là một lần payload đã dựng, và log egress ghi một lần gửi hỏng |
| d | `khu_vuc` **khác** khu vực của gợi ý mặc định | xem §1.4 — đây là chỗ nặng nhất |

### 1.4 · Chọn model là chọn **khu vực pháp lý** — phải hiện, không được im

`M12-R5` viết cho **dự phòng tự động**: rơi sang model khác `khu_vuc` phải có cờ
tường minh, vì `NĐ 356/2025` Điều 14 đã kích hoạt từ `FR-045`.

Người chọn thì **chính lựa chọn** làm việc đó. Một cú bấm chọn DeepSeek cho tài
liệu nội bộ là **một lần chuyển dữ liệu xuyên biên giới**, và nó không đi qua cờ
nào.

⇒ Hai điều, cả hai bắt buộc:

- **`web/` phải HIỆN `khu_vuc`** cạnh mỗi model trong bộ chọn — không phải chú
  thích cuối trang. Người quyết phải thấy mình đang quyết gì. *(Đúng luật
  `preview-controls`: control phải HIỆN hệ quả, không gọi tên hệ quả.)*
- **`egress.jsonl` ghi thêm**: `model_da_chon` · `la_mac_dinh: true|false` ·
  `khu_vuc`. Câu cần trả lời được sau này không phải *"gửi tới đâu"* mà
  *"ai đã chọn gửi tới đó, và đó có phải mặc định không"*.

### 1.5 · `du_phong` KHÔNG được rơi ra khỏi lựa chọn tường minh của người

Hệ quả sắc, và nó ngược `§4` luật 3:

> Người chọn model X. X chết. Rơi tự động sang Y = **âm thầm đảo quyết định của
> người**, và nếu Y khác `khu_vuc` thì đảo luôn quyết định pháp lý.

⇒ `du_phong` chỉ còn hiệu lực khi người **dùng mặc định**. Chọn tường minh mà
model chết ⇒ **job dừng, báo lý do, hỏi lại**. Không rơi.

Đây là cái giá của *"user chọn model"*, và không trả nó thì lựa chọn là trang trí.

### 1.6 · AC đổi và AC thêm

| AC | đổi thành |
|---|---|
| **AC-4.2** | *"**gợi ý mặc định** cho tài liệu 80% Việt + 20% Hán không phải Kimi/DeepSeek"* — vẫn đo bằng máy, chỉ đổi đối tượng đo từ *tuyến* sang *gợi ý* |
| **AC-4.3** | thu về **chỉ đường mặc định**; thêm vế: model **do người chọn tường minh** mà chết ⇒ **0 lần rơi**, job dừng |
| **AC-4.4** | thêm `la_mac_dinh` + `khu_vuc` vào dòng log; vẫn là model **đã dùng**, không phải model được chọn |
| **AC-4.5** *(mới)* | bốn phép chặn §1.3 xảy ra **trước** lời gọi model — gieo cả bốn ca, đếm **0 token**, và **0 dòng** `egress.jsonl` |
| **AC-4.6** *(mới)* | `POST /job` mang `model` không có trong `model.json` ⇒ từ chối. Cổng phải gọi **thẳng `:8790`**, không qua `web/` — nếu không nó chỉ kiểm bộ chọn của FE |

`M12-R4` (*không gõ tên model trong mã*) **giữ nguyên và nay mạnh hơn**: danh mục
`GET /model` trả về **phải sinh từ bảng khai**, nếu không thì bộ chọn của người
là chỗ thứ hai tên model được gõ tay.

---

## 2 · Claude Citations **không cắm được** vào hợp đồng — 400, không phải "kém tối ưu"

**Đo (tài liệu Anthropic, 2026-09-02)**: citations bật per-document-block, tất cả
hoặc không; trả `page_location` (1-indexed) cho PDF, `char_location` cho text.
Và: **`Incompatible with output_config.format` — trả 400.**

`spec §3` khai hợp đồng `(prompt, tài_liệu) → {text, quotes[]}` = structured
output. Nên câu *"Claude Citations tụt xuống **đường tắt tuỳ chọn**"* đúng về ý
định nhưng **chưa đo**: đường tắt đó không tồn tại trong cùng một lời gọi.

**Sửa: bỏ Citations khỏi hợp đồng.** Lý do đã có sẵn trong `model_flow §4` — nó
tự lập luận rằng `V` phải chạy trên **cả hai** nhánh, vì *"nếu đường Claude bỏ
qua `V` thì `V` chỉ được chạy trên các nhà khác, và một lỗi trong `V` sẽ không
bao giờ lộ ra ở đường phổ biến nhất"*. Nếu `V` luôn chạy và là nơi **duy nhất**
bảo đảm, Citations không mua thêm gì — nó chỉ thêm một nhánh mã, một cửa 400, và
một đường ít được kiểm.

- `ho_tro_citations` trong `model.json`: **giữ làm cột thông tin**, thôi làm cột
  điều khiển.
- `model_flow §4` diagram: nhánh `citations API → page_location` **xoá**; mọi nhà
  vào `V` bằng một đường.

*Chỗ có thể phản bác*: dùng **tool use** (`strict: true`) thay
`output_config.format` trên đường Anthropic **có thể** đi cùng citations — cơ chế
khác. **Chưa xác minh.** Không khai vào spec cái chưa thử; ai muốn lối đó thì mở
FR sau kèm một lời gọi thật.

---

## 3 · `re.finditer(re.escape(quote))` — khớp nguyên văn là điều kiện SAI

`spec §3` + `model_flow §4` khai phép định vị lại bằng `re.escape` thuần. Bốn
nguyên nhân độc lập làm nó trượt trên **quote THẬT**: ligature PDF (`fi`→một ký
tự) · gạch nối cuối dòng (`boost-\ning`) · khoảng trắng/newline giữa câu · model
chuẩn hoá nháy và gạch (`"`→`"`, `—`→`-`).

**Nên `AC-3.2` như đang viết sẽ TỪ CHỐI phần lớn khẳng định đúng** — đỏ oan, đúng
lớp lỗi `LOCATOR_RE` đã trả giá một lần. Và hệ quả tệ hơn lọt: người thi công sẽ
hạ ngưỡng tới lúc cổng hết đỏ.

**Sửa: ba tầng, ngưỡng trong bảng khai:**

```
1. chuẩn hoá CẢ HAI vế   NFKC · gỡ ligature · nối gạch-nối-cuối-dòng
                          · nén khoảng trắng về một space · casefold
2. khớp chính xác trên bản đã chuẩn hoá         ⇒ verified
3. rapidfuzz.partial_ratio_alignment ≥ nguong   ⇒ verified + vị trí
   dưới ngưỡng                                   ⇒ TỪ CHỐI khẳng định
```

Tầng 1 làm tầng 2 gánh hầu hết ca thật. `partial_ratio_alignment` trả **cả vị
trí**, tức nó cho luôn `p.7` mà `V` cần — không phải chạy hai phép.

**`nguong` là số phải ĐO**, khai ở `model.json` (hoặc bảng riêng), **không gõ
trong mã** — cùng lý do `M12-R4`. Chốt sau khi chạy ≥10 quote thật; kho có 1 PDF
nên hôm nay mọi con số là phỏng đoán.

**Tiền lệ ngoài, không phải tôi tự nghĩ ra**: `LegalQuants/lq-ai` khai đúng hai
tầng này — *exact match (byte-for-byte tại offset)* và *tolerant match (normalized
fuzzy)*. Hướng thu hẹp ở đầu vào: `mwestera/quotellm` dùng constrained generation
để model **chỉ** phát ra span nguyên văn của nguồn.

**`AC-3.2` phải có HAI vế, không một** — `testcases.md` thêm:

| vế | fixture | phải |
|---|---|---|
| bắt được bịa | quote không có trong PDF | **ĐỎ** |
| **không đỏ oan** | quote thật, nguồn có `boost-\ning` + ligature `fi` | **XANH** |

Thiếu vế hai thì *"xanh khi mọi quote khớp"* nghiệm đúng bằng cách **từ chối tất
cả** — cổng không phân biệt *"không có khẳng định nào"* với *"mọi khẳng định đều
sai"*.

---

## 4 · `os.replace` **không nguyên tử trên Windows** — tiền đề `AC-5.2` vỡ

`spec §5` trả lời *"thợ chết giữa chừng"* bằng: *"`os.replace` **nguyên tử** nên
không có trạng thái nửa vời"*. **Đo được: mệnh đề đó sai trên nền tảng đang
chạy.** `os.replace` gọi `MoveFileEx(MOVEFILE_REPLACE_EXISTING)`, và MoveFileEx
**không được bảo đảm nguyên tử**; *"under certain and unknown circumstances it may
silently fall back to a non-atomic `CopyFile()`"*. Máy phát triển là Windows 10.

Một AC `hard` đứng trên một tiền đề sai sẽ **xanh** — vì crash-đúng-lúc là ca
hiếm. Đúng kiểu hỏng im lặng.

**Sửa — không đổi Maildir, đổi cách chứng minh:**

1. **Luật mới**: tên đích trong `new/` **luôn duy nhất** (`<ULID>.json`), nên
   `os.replace` chỉ đi đường **rename-không-đè** — đường ít rủi ro nhất của
   `MoveFileEx`, và nhánh fallback `CopyFile` (chỉ liên quan khi phải thay file
   đang có) hết cửa. Khai thành luật, không để nó là tình cờ.
2. **`AC-5.2` đo lại**: *"giết tiến trình N lần ⇒ `new/` **không chứa file JSON
   parse-lỗi**, và job còn nguyên trong `tmp/`"* — một tính chất **đo được** thay
   một tính chất **tin tưởng**. Bỏ câu khẳng định về nguyên tử khỏi `spec §5`.
3. Ngày nào job có bước **đè** file trong `new/`, mở lại mục này. Ghi vào backlog
   M12 **lúc bước đó xuất hiện**, không phải bây giờ.

*(Tiền lệ: `avivsinai/agent-message-queue` — hàng đợi file Maildir `tmp→new→cur`
cho agent local, không Redis. Cùng hình dạng M12 đã chọn.)*

---

## 5 · Ba cột thêm vào `model.json` + một trần

### 5.1 · `kieu_structured` — vì trần 2 lần gửi đụng tỉ lệ lệch schema

Đo 244 model (2026): OpenAI Structured Outputs **<0.1%** · Anthropic tool use
**<0.2%** · Gemini **<0.3%** · OpenAI JSON mode **2–5%** · **DeepSeek JSON
5–12%**.

`M12-R6` cấm gửi lần thứ 3, `lan_gui` không reset. Một phản hồi lệch schema
**phải gửi lại**, và lần đó **là** một lần dữ liệu rời máy ⇒ `lan_gui++`. Ở
5–12%, hai lần liên tiếp đều lệch là **0.25%–1.4%** — cỡ **1 trong 70 đến 1 trong
400** job tiếng Trung **chết vĩnh viễn vì nhiễu định dạng**, không vì nội dung.

**Không nới trần** — byte đã ra là đã ra. Giảm xác suất lệch:

- cột **`kieu_structured`**: `tool_use | json_schema | json_mode`. Nhà chỉ có
  `json_mode` thì schema phải **phẳng** (`{text, quotes[]}`, không lồng).
- cột **`nguong_lech_schema`**: đo rồi khai. Vượt ngưỡng ⇒ **không được làm
  `du_phong`** cho tác vụ chưng cất. Cổng khai báo, cùng khuôn `AC-4.3`.
- khi `lan_gui = 2` mà **cả hai** lần đều lệch schema (không phải lỗi nội dung),
  thông báo phải **nói rõ điều đó** — hành động đúng là *tạo job mới với nhà
  khác*, không phải *sửa bài*.

### 5.2 · `che_do: sync | batch` — Batch API giảm 50%

Batch chạy bất đồng bộ ở **50% giá**, `custom_id` khoá kết quả (**không** theo
thứ tự). `ADR-05` đã bắt M12 bất đồng bộ (`POST` trả `viec_id`) và `AC-5.1` đã
chọn `job_ulid` làm khoá — **đúng** hình dạng Batch.

⚠️ **`M12-R3` phải giữ đúng nghĩa**: *"gửi"* = lúc **submit batch**, không phải
lúc đọc kết quả. Một dòng `egress.jsonl` cho **mỗi request trong batch**, ghi tại
submit, `seq` cấp trước khi mở socket. Log lúc đọc kết quả là **đảo** đúng thứ tự
`M12-R3` sinh ra để giữ — và ca `expired`/`errored` sẽ **không có dòng nào**.

C4 làm `sync` trước; bật `batch` là đổi **một dòng** — thêm một ca thật cho
`AC-7.1`.

### 5.3 · `thu_vien_pdf` + `giay_phep` — `PyMuPDF` là bẫy AGPL

PyMuPDF/MuPDF là **AGPL** hoặc thương mại: triển khai công khai — *gồm cả tool
nội bộ, SaaS, hosted API* — buộc mở mã theo AGPL hoặc mua licence Artifex.
`FR-045` + `M17_cong` nghe 443 nghĩa hệ **sẽ** tới người khác. Giấy phép là thứ
**không cổng nào bắt được**: CI xanh, vấn đề nổ ba năm sau dưới dạng một lá thư.

**Chọn `pdfplumber` (MIT).** PyMuPDF nhanh 8–12× (180 vs 18 trang/giây) nhưng
tốc độ **không phải ràng buộc của M12** — nó chạy *phút* theo `ADR-05`; 23 trang
ở 18 trang/giây là ~1.3 giây, nhỏ hơn nhiễu một lời gọi model.

⚠️ **Và KHÔNG dùng nhóm PDF→Markdown** (`marker` · `docling` · `MinerU` ·
`pdf-craft` · `PyMuPDF4LLM`). Chúng tối ưu cho **markdown đẹp**, còn M12 cần
**biên trang trung thực** để `[….pdf:p.7]` phân giải được — và markdown **làm mất
biên trang**: docling tự ghi *"exporting to Markdown or HTML is naturally lossy,
only certain layout information is preserved"*, và có discussion mở đúng về
*"Page Numbers Not Appearing Correctly in Provenance Metadata"*. `pdfplumber` cho
`page.extract_text()` **theo từng trang** — số trang là **cấu trúc**, không phải
suy ra. Thêm: bốn trong năm tool đó cần model/OCR (GPU khuyến nghị), tức thêm
một phụ thuộc nặng cho một thứ ta không cần.

Khai `thu_vien_pdf` + `giay_phep` vào bảng khai: lần sau ai đổi thư viện, giấy
phép phải **đọc được**, không phải nhớ ra.

### 5.4 · Trần **32 MB** cho `tong-hop-chu-de`, chặn TRƯỚC khi băm

PDF base64 giới hạn **32 MB/request** và **600 trang** (100 trang với model
context 200K). Một PDF hiện có ~2.8 MB — an toàn. Nhưng `tong-hop-chu-de` gộp
N nguồn thì 32 MB là **trần thật**, và vượt nó là 400 **sau khi** đã tính
`sha256` và ghi `egress.jsonl` — tức log ghi **một lần gửi không bao giờ xảy
ra**, và con số egress nói dối theo chiều phóng đại.

⇒ Cổng kiểm kích thước **trước** cửa egress. Thuộc `AC-6.x`.

---

## 6 · Ràng buộc KHÔNG được nới

1. **`M12-R1` · `M12-R2` nguyên vẹn** — người chọn model **không** cho ai quyền
   ghi kho hay tự duyệt.
2. **`M12-R4` nguyên vẹn và áp thêm cho `GET /model`** — danh mục trả về sinh từ
   bảng khai, không gõ tay.
3. **`M12-R6` KHÔNG nới** — trần 2 lần gửi giữ; lệch schema vẫn tính là một lần
   gửi. §5.1 giảm xác suất, không mở trần.
4. **`AC-1.5` nguyên vẹn** — `nguoi_dung_id` vẫn do LÕI gán. §1.2 chỉ nói về
   `model`, và nói rõ nó là câu hỏi **khác loại**.
5. **`Z7` nguyên vẹn** — bộ chọn model là màn của `web/`; M12 chỉ trả danh mục.

## 7 · Điều FR này KHÔNG làm

- **Không** quyết tên cột cuối trong `model.json` — s8 chốt khi dựng bảng.
- **Không** chốt `nguong` fuzzy, `nguong_lech_schema`, hay trần token. Cả ba
  **phải đo**; đặt số bây giờ trên kho 1 PDF là đoán.
- **Không** mở đường tool-use + citations (§2 phản bác) — chưa thử thật.
- **Không** đụng `FR-044` (`nguon` vào schema) hay `FR-047` (bảy cửa). Hai nợ đó
  đã khai ở `spec §nợ` và `backlog`, và FR này không giải chúng.
- **Không** giải đường **video** — nó đã sang **`FR-054`** (mở 2026-09-03), gồm:
  transcript thành hiện vật `text/vtt`, `sinh-transcript` là `loai` thứ ba của
  M12, bảng khai `nguon_transcript` hai lối, và phán quyết `B-E4`/`Scope OUT`.
  Ghi chú bên dưới là bản khảo **sơ** của cùng phiên; đọc `FR-054` thay vì nó.
  ~~Khảo 2026-09-03
  (`01_research/m12-ky-thuat-trien-khai.md` PHẦN C) ra một hình dạng thi công
  được: audio **không vào kho**, chỉ **transcript** vào làm hiện vật
  `la_dan_xuat: 1`, dạng **`text/vtt`** (có magic `WEBVTT` — `application/json`
  không có magic, sẽ là mục đầu tiên làm yếu lớp intake thứ sáu), ASR bằng
  **`faster-whisper`** (MIT) **local ⇒ 0 egress**, và `verify.py` **dùng lại y
  nguyên** vì `dinh_vi()` chỉ đổi đơn vị neo (trang → mốc).
  ⇒ **s7 chia C4 thành `C4a` (PDF) và `C4b` (video)**; `C4b` xếp **sau** vì nó
  dùng `verify.py` của `C4a`. `C4b` phụ thuộc **`FR-052`** (`media` thành mảng —
  đã quyết) + **một FR mới** thêm `text/vtt` vào `media-mime.json`.
  Còn **tự động lấy transcript từ URL** thì vẫn là **quyết định của người**, không
  phải một dòng mã: không có đường chính thức nào (`captions.download` đòi OAuth
  **chủ sở hữu video**, video người khác trả **403**, *by design*), nên hai lựa
  chọn còn lại là đảo `Scope OUT` về crawler, hoặc mở một **đích egress mới**.~~
  *(Bản khảo sơ ở trên thiếu hai lối và xếp sai ba chỗ — `FR-054` §2 và
  `PHẦN C §18.1` của file nghiên cứu ghi rõ từng chỗ sai.)*
- **Không** ký `FROZEN.lock`. Sau khi duyệt và áp vào hai file, **người** ký —
  cùng lượt với nợ ký của FR-034/036/041/042.

## 8 · Nguồn

- Citations · trần PDF · Batch · giá model: tài liệu Anthropic qua skill `claude-api`, đọc 2026-09-02
- Xác thực quote hai tầng: [LegalQuants/lq-ai](https://github.com/LegalQuants/lq-ai) · constrained generation: [mwestera/quotellm](https://github.com/mwestera/quotellm) · fuzzy ngưỡng 0.9: [arXiv 2511.11594](https://arxiv.org/html/2511.11594v1), [arXiv 2605.27700](https://arxiv.org/pdf/2605.27700)
- `os.replace`/Windows: [rust-atomicwrites#27](https://github.com/untitaker/rust-atomicwrites/issues/27) · [pyosreplace](https://pypi.org/project/pyosreplace/) · Maildir cho agent: [avivsinai/agent-message-queue](https://github.com/avivsinai/agent-message-queue)
- Lệch schema theo nhà: [Requesty — 244 model, 2026](https://www.requesty.ai/blog/structured-outputs-across-llm-providers-the-compatibility-mess)
- PDF: [PyMuPDF AGPL](https://www.file2markdown.ai/blog/is-pymupdf-free-for-commercial-use) · [so sánh 7 thư viện](https://www.nutrient.io/blog/best-python-pdf-libraries/) · [PDF→Markdown 2026](https://themenonlab.blog/blog/best-open-source-pdf-to-markdown-tools-2026) · [docling · page provenance #1012](https://github.com/docling-project/docling/discussions/1012)