# backlog — M12_chungcat (chết ở G6C)

> Nợ do một thay đổi **CỤ THỂ vừa gây ra**. Không phải TODO, không phải ý tưởng,
> và **không phải** *"thứ chưa xây"*.
> Ô `[ ]` trỏ artifact có thật; `[x]` phải kèm object (commit · PR · FR id).

## Kiểm kê 2026-09-07 — 15 ô mở, và ô nào CHẶN Ở ĐÂU

Ghi khối này vì *"còn 15 ô"* không phải một câu dùng được. Câu dùng được là
**ô nào tôi làm được hôm nay, ô nào không, và không thì vì sao.** Một nợ không
có địa chỉ là nợ không ai làm — chính câu đã bắt được ô `spec_overview` ở dưới.

| chặn ở | ô | mở khoá bằng |
|---|---|---|
| **NGƯỜI quyết ở G6C** | `T12-12` chạm đất `T12-8` · chủ của `check_nhat_ky_mot_ben_ghi.py` | một câu chọn: `T12-8` khai lại `phạm_vi_ghi`, hay cổng đổi chủ |
| **NGƯỜI quyết** | `FR-054` lối `dich_vu` nay rẻ hơn local | chủ dự án chọn lối, rồi mới có đơn vị việc |
| **FR đã viết, chờ duyệt** | `POST /job` trả `201` cho lần nạp lại | `FR-071` — duyệt là thi công được ngay |
| **cần FR, chưa viết** | `dia-chi.json` thiếu hai dạng Q5 → M01 · `AC-7.1` bảng `chu_de→engine` → gộp `T12-7` · cảnh báo `§2` thiếu một nửa → nằm sau `FR-044` | ba FR, và **cái giữa nên gộp** chứ không đẻ FR mới |
| **thiếu KHOÁ gateway** | `stream: true` · Management API (ví cạn) · đo lại `nguong_fuzzy` trên quote model THẬT | một `BEEKNOEE_API_KEY`. Cả ba là **đo**, không phải đoán — nên chúng phải chờ, không được suy |
| **thiếu module chưa dựng** | dải ký tự Hán → `M13` · client R2 → `FR-060` mốc sau | khi module ấy dựng. Làm sớm là đoán hộ một bên chưa tồn tại |
| **thiếu gói chưa cài** | giấy phép `CTranslate2` | `pip install .[asr]` rồi đọc metadata. **Không chép giấy phép từ trí nhớ** |
| **thiếu route đã xác minh** | `model.json` cả ba dòng `khu_vuc: khong-xac-dinh` | `T12-11` xác minh route gateway. `§4.0c` là hợp đồng pháp lý — điền đại một khu vực cho đẹp còn tệ hơn để trống |
| **việc thật, chưa làm** | khoá service-to-service mới là hình dạng (`aud`, so an-toàn-theo-thời-gian, vòng đời khoá) | một đơn vị việc riêng. Đây là ô **duy nhất** trong 15 ô mà không gì chặn ngoài công sức |

**Đọc bảng này theo một chiều:** trong 15 ô, **1** ô chỉ cần công sức. 3 ô cần
một câu của chủ dự án. 11 ô còn lại chặn ở một thứ **không có trong máy này** —
một khoá, một module chưa dựng, một gói chưa cài, một route chưa xác minh.

⇒ *"Hết nợ M12"* hôm nay **không** phụ thuộc vào việc gõ thêm mã. Nó phụ thuộc
vào ba câu trả lời và một khoá API.

---

## ~~Trống~~ — đúng tới 2026-09-02, KHÔNG còn đúng

M12 chưa có một dòng mã nào, nên chưa có **thay đổi nào gây ra nợ** — và câu
đó vẫn đúng. Nhưng `01_research/m12-ky-thuat-trien-khai.md` (khảo 09-02, PHẦN C
thêm 09-03) tìm ra **artifact đã chốt hoá ra sai**, và luật `DỪNG` nói thẳng đó
**là** ca của backlog. Xem `§Mở 2026-09-03` dưới cùng — **11 ô**.

Bốn thứ M12 đang chờ **không** thuộc backlog. Ghi ra để không ai chuyển nhầm chúng
vào đây rồi làm cổng *"backlog sạch"* của G6A hết ý nghĩa:

| thứ đang chờ | sống ở đâu | vì sao KHÔNG phải backlog |
|---|---|---|
| bảy cửa của LÕI | `FR-047` (đã duyệt 2026-09-02) | **hợp đồng với module khác** |
| `nguon` chưa vào schema | `FR-044` + `spec §2` | FR đã duyệt, chờ áp |
| `model_da_dung` chưa có trường | `data_flow §3` | cần **FR tới M01** (owner của schema) |
| sáu lệnh `chungcat/tests/` | `rules.md` đầu file | **việc của s8**, đã khai tường minh |

**Ranh giới**: backlog là *"tôi vừa làm X, và X làm Y lỗi thời"*. Một hợp đồng chưa
có thì không phải **nợ** — nó là **phụ thuộc**, và chỗ của nó là `spec.md` §nợ cộng
một FR.

## Phép thử của s6 đã chạy — 24/24 AC viết được testcase

`testcases.md` §cuối ghi kết quả: **22/24 viết được ngay**; hai cái (`AC-3.1` ·
`AC-6.1`) mơ hồ và **đã sửa hợp đồng** cùng phiên 2026-09-02.

Không mở ô `[ ]` cho chúng vì chúng **đã đóng trong cùng lượt** — một ô mở rồi
đóng ngay trong một phiên là tiếng ồn, không phải trí nhớ.

## Mở 2026-09-03 — artifact đã chốt hoá ra SAI

> Luật `DỪNG` nguyên văn: *"artifact đã chốt hoá ra sai ⇒ mở ô `backlog` **ngay**;
> frozen thì chỉ sửa qua FR"*. Bảy ô dưới đây đúng ca đó — **không** phải *"thứ
> chưa xây"* (ranh giới `§Ranh giới` ở trên vẫn đứng).
>
> Nguồn: `01_research/m12-ky-thuat-trien-khai.md`. Mọi ô tick bằng **FR id**, vì
> `spec.md` + `rules.md` của M12 **FROZEN** (`FROZEN.lock` — hai file, đúng hai).

## PHÂN LOẠI NỢ — 2026-09-07 (claude-opus-5, theo yêu cầu chủ dự án)

Chủ dự án hỏi *"còn việc gì để done M12"* và chốt thứ tự: **CI → phân loại →
vá FR/spec**. Bảng này là bước hai. Mỗi dòng ghi **loại** và, chỗ nào đo được,
**số đo hôm nay**.

Ba loại, và ranh giới giữa chúng là ranh giới về QUYỀN:

| loại | nghĩa | ai được đóng |
|---|---|---|
| **FR** | một artifact đã CHỐT nay sai/lỗi thời | chỉ người, qua FR + ký lại `FROZEN.lock` |
| **TASK** | hợp đồng đúng, chỉ chưa thi công | dev, qua vòng lặp thường |
| **ĐO LẠI** | không biết đúng/sai cho tới khi có số | ai cũng được, nhưng phải có số trước |

### Cần FR — 15 ô

`spec`/`rules`/`AC` đã chốt nay chỏi thực tế. Không ô nào trong nhóm này đóng
được bằng một commit mã.

| # | ô | vì sao là FR |
|---|---|---|
| 1 | `spec §3` gọi Citations là *"đường tắt tuỳ chọn"* | spec mô tả sai thứ đang chạy |
| 2 | `re.finditer(re.escape(quote))` sẽ hỏng | `model_flow §4` khai một phép sai |
| 3 | `AC-5.2` có tiền đề sai | AC không thể xanh trên nền tảng thật |
| 4 | `M12-R4` × `M12-R6` va nhau | hai rule đúng riêng, sai khi gặp |
| 8 | `spec` không nhắc video/ASR | đã có `FR-054`; ô còn mở vì FR chưa đóng |
| 10 | ba trần biến `§9.3` thành "nới 41 lần" | số đã chốt nay vô nghĩa |
| 12 | `FR-054 §8.6` đặt cờ ASR sai chỗ | FR sai, phải sửa bằng FR |
| 14 | `spec §2` nói `FR-044` chưa thi công được | câu đó hết đúng |
| 15 | `dia-chi.json` hạ `slug-moc` xuống `mot_phan` | nâng được, nhưng bảng đã chốt |
| 16 | `§1 Vào` chỏi exporter | hai hợp đồng nói ngược nhau |
| 17 | `spec_overview.md` tự chỏi chính nó | nợ tự khai mà không có địa chỉ |
| 18 | cảnh báo *"chặn cứng"* ở `§2` thiếu một nửa | spec nói nửa sự thật |
| 23 | `dia-chi.json` thiếu hai dạng proposal Q5 liệt | bảng khai thiếu so với hợp đồng trên |
| 31 | `AC-7.1` đo bảng `chu_de→engine` **không tồn tại** | đo 2026-09-07: `model.json` KHÔNG có `chu_de` |
| 34 | lối `dich_vu` nay rẻ hơn local | `FR-054` chọn ưu tiên theo giá cũ |

### Việc thi công — 18 ô

Hợp đồng đúng, chỉ chưa làm. Mỗi ô nên thành **một task có cổng**.

| # | ô | đo hôm nay |
|---|---|---|
| 5 | trần 32 MB / 600 trang PDF chưa có cổng | — |
| 6 | `PyMuPDF` bẫy giấy phép | — |
| 7 | Batch API đảo thứ tự `M12-R3` | — |
| 9 | MP4 vào kho qua đường không ai thiết kế | — |
| 11 | `AC-V6` đo một điều đã đúng | — |
| 13 | bảng giá "giữ video trong kho" thiếu ba dòng | — |
| 19 | `--that` của E2E chưa bật | nhánh `--that` **có** trong mã; thiếu `dich` + tên model thật |
| 20 | `nguong_fuzzy = 88.0` đo lệch lạc quan | — |
| 21 | dải ký tự Hán có hai bản tiềm tàng | — |
| 22 | khoá service mới là hình dạng | dùng được thật hôm nay (`x-khoa-dich-vu` + `x-aud`) |
| 25 | `POST /job` trả 201 cho lần nạp LẠI | **đo: lần 1 = 201, lần 2 = 201** ⇒ CÒN ĐÚNG |
| 27 | `AC-2.1` hở ở cửa dịch vụ | — |
| 28 | `T12-12` chạm đất của `T12-8` | **cả hai task đều khai `chungcat/tests`** ⇒ CÒN ĐÚNG |
| 29 | `model.json` cả ba dòng `khu_vuc: khong-xac-dinh` | **đo: 113/113 dòng đều `khong-xac-dinh`** |
| 30 | `la_mac_dinh` không vào `egress.jsonl` | — |
| 32 | `stream: true` chưa bật | **đo: `hop_dong.py` KHÔNG có `stream`** ⇒ CÒN ĐÚNG |
| 33 | Management API chưa dùng | — |
| 35 | client R2 chưa có | — |

### Đo lại rồi mới biết — 3 ô

| # | ô | cần đo gì |
|---|---|---|
| 26 | smoke job nằm trong hàng đợi thật | hàng đợi nay đã `.gitignore`; còn job mồ côi nào không? |
| 36 | đường video còn hai mảnh | `worker.py` **có** `chay_sinh_transcript` + `_nap_hien_vat`; cần một lần chạy thật để chốt |
| 37 | `chay.sh` dựng đúng một worker | `chay.sh` nhắc `worker.py` **3 lần** — đọc lại rồi kết luận |

### Đã đóng hôm nay

`#24` **dịch vụ ghi trạng thái chạy vào repo** — đo: `git ls-files
chungcat/hang-doi` = **0 file**, và `.gitignore` đã có `hang-doi`.

### Ba việc chặn G6C mà backlog KHÔNG nói

Ghi ở đây vì chúng không phải "nợ kỹ thuật", chúng là **vế của checklist**:

1. worklog **đóng module** chưa có (0 entry `loai: dong_module`)
2. `project_map` chưa bump `be`/`fe` thật
3. 14 rule khai bề mặt `S3` chưa đối chiếu từng cái với bằng chứng

---

- [x] **`spec §3` khai Citations là *"đường tắt tuỳ chọn"* — thực tế nó là 400.**
  `citations: {enabled: true}` là *"Incompatible with `output_config.format`
  (**returns a 400**)"*, mà `spec §3` khai hợp đồng `{text, quotes[]}` tức
  structured output. Đường tắt đó **không cắm được vào cùng một lời gọi** — nên
  spec đúng về **ý định**, sai về **khả thi**.
  ⇒ Bỏ Citations khỏi hợp đồng; `ho_tro_citations` giữ làm **cột thông tin**,
  không làm cột điều khiển. Testcase: `testcases.md §9`.
  · object: `06_modules/M12_chungcat/spec.md §3` · `model_flow §4` ⇒ **FR-053**

- [x] **`spec §3` + `model_flow §4` khai `re.finditer(re.escape(quote))` — nó SẼ
  trượt, và đây là rủi ro số một của module.**
  Bốn nguyên nhân **độc lập**: ligature PDF (`ﬁ` là một ký tự) · gạch-nối-cuối-dòng
  (`boost-\ning`) · khoảng trắng (PDF cột đôi) · model **chuẩn hoá** nháy/gạch.
  `AC-3.2` viết *"quote không tìm thấy nguyên văn ⇒ khẳng định bị **từ chối**"* ⇒
  cài bằng `re.escape` thuần thì **phần lớn quote thật bị từ chối** — đúng lớp lỗi
  **đỏ oan** mà `FR-046`/`LOCATOR_RE` đã trả giá một lần.
  ⚠️ **Hệ quả tệ hơn lọt**: người thi công sẽ **hạ ngưỡng cho tới lúc cổng hết đỏ**.
  ⇒ Ba tầng (chuẩn hoá → khớp chính xác → `rapidfuzz.partial_ratio_alignment ≥
  nguong`), `nguong` ở **bảng khai** kèm `$vi_sao` + *"CHƯA KIỂM CHỨNG"*, và cổng
  phải có **HAI vế** (bắt bịa **và** không đỏ oan). Testcase: `testcases.md §8`.
  · object: `06_modules/M12_chungcat/spec.md §3` · `model_flow §4` ⇒ **FR-053**

- [x] **`AC-5.2` có TIỀN ĐỀ SAI trên nền tảng đang chạy.**
  `spec §5` khai *"`os.replace` **nguyên tử** nên không có trạng thái nửa vời"*.
  Fact: `os.replace` gọi `MoveFileEx(MOVEFILE_REPLACE_EXISTING)`, và MoveFileEx
  **không được bảo đảm nguyên tử** — *"may silently fall back to a non-atomic call
  to `CopyFile()`"*. **Máy phát triển là Windows 10.**
  ⚠️ Đây là ô **quan trọng nhất về mặt phương pháp**: `AC-5.2` **viết được
  testcase** (nên phép thử s6 xanh) và **mệnh đề của nó sai**. s6 hỏi *"đo được
  không"*, **không** hỏi *"tiền đề có đúng không"*.
  ⇒ Không sửa Maildir — sửa **cách chứng minh**: (a) khai thành **luật** rằng đích
  `new/<ULID>.json` **luôn duy nhất** ⇒ `os.replace` chạy vào đường rename-không-đè
  và fallback `CopyFile` hết cửa; (b) `AC-5.2` đo *"`new/` không chứa JSON
  parse-lỗi sau N lần giết"* — một **tính chất** thay một **niềm tin**.
  Testcase: `testcases.md §10`.
  · object: `06_modules/M12_chungcat/spec.md §5` · `AC-5.2` ⇒ **FR-053**

- [x] **`M12-R4` và `M12-R6` đúng riêng, SAI khi gặp nhau.**
  `M12-R4`/`AC-4.2`: tiếng Trung → Kimi hoặc DeepSeek. `M12-R6`: trần **2** lần
  gửi, `lan_gui` không reset. Fact: DeepSeek JSON lệch schema **5–12%** ⇒ xác suất
  hai lần liên tiếp đều lệch **0.25–1.4%** ⇒ **1/70 đến 1/400 job tiếng Trung chết
  vĩnh viễn** vì nhiễu định dạng, không vì nội dung. Người chỉ thấy *"job lỗi,
  không chạy lại được"*.
  ⇒ **Không nới trần** (một byte đã rời máy là đã rời). Ba việc: thêm
  `kieu_structured` (`tool_use|json_schema|json_mode`) — nhà chỉ có `json_mode` thì
  schema phải **phẳng**; `nguong_lech_schema` **đo rồi khai**, nhà vượt ngưỡng
  **không được** là `du_phong`; và thông báo khi cả hai lần đều lệch schema phải
  **nói rõ điều đó**, vì hành động đúng là *tạo job mới với nhà khác*.
  Testcase: `testcases.md §11`.
  · object: `06_modules/M12_chungcat/rules.md M12-R4 M12-R6` · `chungcat/assets/model.json`
  ⇒ **FR-053**

- [x] **Trần **32 MB** / **600 trang** của PDF chưa có cổng — và vượt nó làm LOG
  NÓI DỐI.**
  Fact: base64 **32 MB**/request · **600 trang** (100 trang với context 200K). PDF
  trong kho ~2.8 MB nên an toàn **hôm nay**, nhưng `tong-hop-chu-de` gộp N nguồn thì
  trần là **thật**.
  ⚠️ Vượt nó là **400 SAU KHI** đã tính `sha256` và ghi `egress.jsonl` ⇒ log ghi
  **một lần gửi không bao giờ xảy ra**, và đó phá đúng thứ `AC-6.2` (*dựng lại từ
  log rồi băm ra cùng số*) đang bảo đảm.
  ⇒ Cổng chặn **TRƯỚC** khi băm và **TRƯỚC** khi ghi log. Testcase:
  `testcases.md §9 edge 3-4`.
  · object: `06_modules/M12_chungcat/spec.md §3` ⇒ **FR-053**

- [x] **`PyMuPDF` là bẫy GIẤY PHÉP, và giấy phép là thứ KHÔNG cổng nào bắt được.**
  ✅ **XONG 2026-09-07** — nửa PDF. `model.json` khai `thu_vien_pdf`
  `{ten: pdfplumber, giay_phep: MIT}`, và `check_bang_khai_model.py` đòi
  `thu_vien_pdf` phải có `giay_phep` KHÔNG rỗng, **cộng** một vế cấm chuỗi
  `PyMuPDF` xuất hiện ở bất kỳ đâu. Giấy phép MIT đọc từ **metadata gói đã
  cài**, không từ trí nhớ:
  `importlib.metadata.metadata('pdfplumber')` → `License :: OSI Approved :: MIT`.
  · object: `chungcat/assets/model.json:11-12` ·
  `chungcat/tests/check_bang_khai_model.py:16,66`

- [ ] **Giấy phép `CTranslate2` (dưới `faster-whisper`) CHƯA ĐO ĐƯỢC.**
  Phần còn lại của ô trên, chẻ ra vì nó có điều kiện khác hẳn.
  Đo 2026-09-07: `importlib.metadata` trả **CHƯA CÀI** cho cả
  `faster-whisper` và `ctranslate2` — chúng nằm trong extra `[asr]`, và CI
  cài `./chungcat` **không** kèm extra ấy. Nên hôm nay rủi ro là **tiềm
  tàng**, chưa hiện: không byte nào của hai gói đó có trong hệ.
  ⚠️ **KHÔNG chép giấy phép từ trí nhớ vào bảng khai.** Một dòng
  `giay_phep` sai còn tệ hơn một ô trống: ô trống thì người đọc biết phải
  đi kiểm, dòng sai thì họ tin.
  ⇒ Khi ai đó cài `[asr]`: đọc metadata hai gói, thêm `thu_vien_asr` vào
  bảng khai, mở rộng cổng đòi `giay_phep` cho **cả hai** khoá thư viện.
  · object: `chungcat/pyproject.toml:47-52` (extra `asr`) ·
  `chungcat/assets/model.json` (`thu_vien_asr` — CHƯA CÓ) ⇒ **khi cài `[asr]`**
  PyMuPDF/MuPDF là **AGPL** hoặc thương mại; điều kiện kích hoạt là *"triển khai
  công khai — gồm cả tool nội bộ, SaaS, hosted API"*. `FR-045` vừa thêm 5 tài khoản
  và `M17_cong` nghe **443** ⇒ hệ **sẽ** được triển khai cho người khác dùng.
  `pdfplumber` là **MIT**, `rapidfuzz` MIT, `httpx` BSD.
  ⚠️ `check_*` không đỏ vì AGPL, CI xanh, và vấn đề nổ **ba năm sau ở dạng một lá
  thư**. ⇒ Thêm cột `thu_vien_pdf` + **`giay_phep`** vào bảng khai, và một cổng đòi
  `giay_phep` **không rỗng**. `CTranslate2` (dưới `faster-whisper`) hiện *chưa
  kiểm* ⇒ phải kiểm trước khi chốt.
  · object: `chungcat/assets/model.json` (bảng khai, **không** frozen) ·
  `06_modules/M12_chungcat/spec.md §nợ` ⇒ **FR-053**

- [x] **Batch API giảm 50% giá — nhưng cài sai thì nó ĐẢO thứ tự `M12-R3`.**
  `ADR-05` đã bắt M12 bất đồng bộ sẵn, `custom_id` = `job_ulid` (khoá `AC-5.1` đã
  chọn) ⇒ hình dạng khớp một cách bất thường.
  ⚠️ Với Batch, *"gửi"* là **lúc submit**, không phải lúc lấy kết quả. Ai log lúc
  đọc kết quả là **đảo đúng thứ tự** `M12-R3` sinh ra để giữ — và ca thất bại
  (batch `expired`/`errored`) sẽ có **0 dòng log**, tức **đúng lúc cần biết nhất
  thì không biết**.
  ⇒ Thêm cột `che_do: sync | batch`; C4 làm `sync` trước. Một dòng `egress.jsonl`
  mỗi **request trong batch**, ghi tại thời điểm submit. Testcase: `testcases.md §12`.
  · object: `chungcat/assets/model.json` · `06_modules/M12_chungcat/spec.md §6`
  ⇒ **FR-053**

## Mở 2026-09-03 — đường VIDEO (chờ `FR-054`)

- [x] **`spec M12` không nhắc `video` · `audio` · `transcript` · `ASR` một lần
  nào — và video là ca CHÍNH, không phải ca biên.**
  Đo: `grep -icE "video|audio|transcript|ASR|mp4"` trên `spec.md` M12 ⇒ **0**.
  `spec §1` khai **Vào**: *"`slug` nguyên liệu · byte ở `kb/_media/<sha256>`"*;
  `M11_video` khai *"đăng ký URL, **không byte, không dòng `media`**"* ⇒
  **`chung-cat-mot-nguon` trên một bản ghi video không có gì để gửi.**
  Chủ dự án xác nhận 2026-09-03: nguồn **chính** là video URL, mp4 chỉ *"đôi khi"*.
  ⇒ `loai` thứ ba `sinh-transcript` · mime `text/vtt` · bảng khai
  `nguon_transcript` · bảy cổng `V1`–`V7`. Testcase: `testcases.md PHẦN III`.
  · object: `06_modules/M12_chungcat/spec.md §1 §2` · `rules.md` ·
  `06_modules/M11_video/spec.md` · `core/assets/media-mime.json` ⇒ **FR-054**

- [x] **Một MP4 vào kho ĐƯỢC, qua đường KHÔNG AI THIẾT KẾ — và lối (b) đã chọn
  KHÔNG bắt được nó.**
  **Đo end-to-end qua server thật** (`FR-054 §10.1`, kho tạm, `API_PORT=8899`):
  ```
  FE  #up-tv-f KHÔNG có accept=  →  chọn được .mp4;  mime = f.type = "video/mp4"
  POST /api/articles/media  content-type: video/mp4        → 201  so_byte 3 145 740
  POST /api/articles        source_type: "tai-lieu"        → 201  hàng trong `tai_lieu`
  GET  /api/articles/media/<sha>                            → 200  trả đủ 3 145 740 byte
       content-type: application/octet-stream · attachment; filename="….mp4"
  ```
  Byte nằm ở **`media.byte`** (BLOB). Bảng `media` có **ba cột thật**
  (`sha256` · `byte` · `la_dan_xuat`) + `so_byte` GENERATED, **không có cột
  `mime`** (`kho.schema.sql:164` khai thẳng *"KHÔNG CỘT METADATA NÀO"*); mime sống
  ở `<bảng>.frontmatter.media[]`.
  ⇒ **Không có "chức năng upload video" nào** — có một **ô chọn file không lọc gì**
  gặp một **cửa nhận cố ý mở cho mọi định dạng** (`FR-039`).

  ⚠️ **HAI lỗi phải tách:**
  - **của tôi**: `FR-054 §7.1` khai lối (b) là *"bản ghi **`video`** không được có
    `media` mime `video/*`"*. Đường thật đi qua **`tai_lieu`** ⇒ luật canh **sai
    bảng** ⇒ áp đúng như tôi viết thì **lỗ còn nguyên, cổng vẫn xanh**. Chủ dự án
    chọn (b) dựa trên mô tả sai đó.
  - **tiền đề bị đảo**: `FR-054 §8.1` ghi chỉ đạo *"giữ nó lại ở kho: video /
    audio / transcript — file gốc"*. Lối (b) tồn tại để giữ byte video **ra khỏi**
    kho ⇒ (b) **không còn nền**.

  **Hoà giải khả dĩ — CẦN chủ dự án xác nhận, tôi không tự chốt**: bản ghi
  **`tai-lieu`** không được khai `media[].mime` khớp `^(video|audio)/`; bản ghi
  **`video`** thì được (file gốc của `§8.1`). Cưỡng chế ở `validate.py` — lớp mà
  **cả ba** đường ghi đi qua, khác `api-guard` vốn không thấy `gate.py` (plan `S6`).
  · object: `web/plugins/multiwindow/src/scripts/multiwindow.inline.ts:786-806` ·
  `render/shell.html:887` (`#up-tv-f` thiếu `accept=`) · `web/api/dungchung.mjs#luuHienVat`
  · `core/assets/kho.schema.sql:160-166` · `.factory/fr/FR-054… §10.2`
  ⇒ ~~cần chủ dự án chọn~~ **CHỐT 2026-09-04 (quyết 2)**: bản ghi `tai-lieu`
  CẤM media mime `video/*|audio/*`; bản ghi `video` ĐƯỢC. Cưỡng chế ở
  validate.py — cài ở **T01-45 AC4**; đường upload ĐÚNG mở ở **T03-109**.
  Tick khi T01-45 bàn giao.

- [x] **Ba trần đã chốt — và chúng biến `§9.3` thành "nới GẤP 41 LẦN".**
  ✅ **XONG** — cả ba vế, đo 2026-09-07:
  1. Ba trần ở bảng khai `chungcat/assets/nguon-transcript.json:8-10` đúng
     con số chủ dự án chốt (1 GB · 500 MB · 3600 s).
  2. Trần thời lượng là trần thứ ba VỀ BẢN CHẤT, và cổng có **hai nhịp**:
     `chungcat/tests/check_tran_hai_nhip.py` — *XANH · trần hai nhịp · số ở
     bảng khai*.
  3. Nới 41× đi qua `FR-054-va-tran-1gb.md`, không nới tại chỗ.
     `frontmatter.schema.json → media.items.so_byte.maximum` nay
     **1073741824** — `AC-9.2` giữ được: nó **vẫn là một số**, không phải
     bỏ trần.
  · object: `chungcat/assets/nguon-transcript.json:8-10` ·
  `core/assets/frontmatter.schema.json` (`media.items.so_byte.maximum`) ·
  `chungcat/tests/check_tran_hai_nhip.py` · `.factory/fr/FR-054-va-tran-1gb.md`
  Chỉ đạo 2026-09-03: *"file video dưới 1Gb, audio dưới 500mb, thời gian dưới 60
  phút"*.
  ```
  TRAN_NGUYEN_LIEU_VIDEO   1 073 741 824   ( 1 GB)
  TRAN_NGUYEN_LIEU_AUDIO     524 288 000   (500 MB)
  TRAN_THOI_LUONG_GIAY             3 600   (60 phút)
  ```
  Ba hệ quả:
  - **`TRAN_THOI_LUONG_GIAY` là trần thứ ba VỀ BẢN CHẤT** — không suy ra được từ
    hai trần byte (200 MB có thể là 20 phút hay 3 giờ tuỳ bitrate) ⇒ cổng có
    **hai nhịp**: byte ở cửa, thời lượng **sau khi** đọc metadata. Khác chỗ, khác
    lúc.
  - **`1 GB / 25 MB = 41`.** `FR-054 §9.3` đo được trần 25 MB nằm ở
    `frontmatter.schema.json → media.items.so_byte.maximum` — file **FROZEN duy
    nhất** của `core/`. Nới 41× không phải một lần nới, nó là **bỏ vai trò** của
    con số cũ ⇒ `AC-9.2` (*"vẫn là một số, không phải bỏ trần"*) phải chạy trên
    con số mới.
  - **git-lfs free 1 GB** ⇒ với trần video 1 GB, **một** video đầy hạn mức.
    `§9.3` tính *"đầy sau ~4 video"* trên giả định 150–400 MB; ở trần này là **1**.
  ⚠️ `60 phút` là **cận trên** của thiết kế: `small` INT8 ≈ 8× realtime ⇒ 60 phút
  ≈ **7–8 phút** ASR. `ADR-05` khai M12 *"chạy phút"* nên vẫn nằm trong — nhưng
  job dài thế đòi checkpoint (`AC-5.4`) hoạt động **thật**.
  · object: `.factory/fr/FR-054… §10.3 §9.3` · `core/assets/frontmatter.schema.json`
  (`media.items.so_byte.maximum`, **FROZEN**) ⇒ **FR-054** + **người ký**

- [x] **`AC-V6` giờ đo một điều ĐÃ ĐÚNG — `FR-052` đã áp.**
  `FR-054 §3` khai `V6` phải **đỏ hôm nay** (vì `FR-052` chưa áp) và gọi đó là
  *"cách đúng để một phụ thuộc không bị quên"*. Đo 2026-09-03:
  `frontmatter.schema.json` khai `media.type = "array"`, `minItems = 1` ⇒
  **`FR-052` ĐÃ ÁP** ⇒ `V6` **không đỏ được nữa** theo cách nó mô tả.
  ⇒ Vế còn giá trị là ca *happy*: bản ghi video đã có 1 hiện vật → sinh transcript
  → **2** hiện vật, cái cũ nguyên vẹn **từng byte**.
  ✅ **Câu hỏi kèm theo ĐÃ ĐÓNG** — *"sinh transcript lần hai: thay `.vtt` cũ hay
  thêm cái thứ hai?"* được `FR-054 §9.1` trả đủ: **THAY** trong
  `frontmatter.media[]`, bump `ban` → snapshot cũ sang `article_versions`, byte
  `.vtt` cũ **vẫn nằm** trong `media` (M09-R1). History đầy đủ, **0 thay đổi
  schema**. Không mở ô riêng cho nó.
  · object: `.factory/fr/FR-054… §3 V6` ⇒ **FR-054**

- [x] **`FR-054 §8.6` khai cờ ASR SAI CHỖ — `media[]` không nhận thêm khoá.**
  `§8.6` (và bảng ba-hiện-vật ở `§8.1`) viết `la_asr` / `moc_do` / `moc_khai` /
  `la_dan_xuat` như thuộc tính của hiện vật trong **frontmatter**. Đo 2026-09-03:
  `media.items.additionalProperties = False`, và bốn khoá
  (`sha256`·`mime`·`ten_goc`·`so_byte`) đều **required** ⇒ thêm khoá là
  **validate ĐỎ**, và sửa nó là sửa file **FROZEN**.
  Thêm nữa: `la_dan_xuat` vốn **không** ở frontmatter — nó là **cột của bảng
  `media`**.
  ⇒ Chỗ đúng: thêm **`kieu_moc TEXT`** vào bảng `media` cạnh `la_dan_xuat`
  (`kho.schema.sql` **không frozen**). Cờ theo **byte** đúng hơn theo đính kèm —
  cùng một `.vtt` gắn hai bản ghi thì nó vẫn là **một** cách sinh.
  ⇒ `V10` của `§8.8` phải đo trên **bảng**, không trên frontmatter.
  · object: `.factory/fr/FR-054… §8.1 §8.6 §8.8 V10` · `core/assets/kho.schema.sql`
  ⇒ **FR-054 §9.2**

- [x] **Bảng giá của quyết định "giữ video trong kho" THIẾU BA DÒNG lúc ký.**
  `FR-054 §8.3` nói trần 25 MB là *"một hằng phải nới"*. Đo được nó là
  **`media.items.so_byte.maximum = 26214400`** trong
  **`frontmatter.schema.json`** — file **FROZEN duy nhất** của `core/`.
  Ba dòng chưa nêu khi chủ dự án chốt `§8.1`: (1) sửa file **FROZEN** ⇒ cần
  **người ký**; (2) **git-lfs** cho `kb/_media/` — GitHub chặn cứng **>100 MiB**,
  free 1 GB đầy sau **~4 video**, data pack **$5/tháng** = 50 GB; (3) CI phải
  `GIT_LFS_SKIP_SMUDGE=1` và round-trip `B-C1` chạy trên **fixture** — không thì
  `check_export_dan_xuat.py` tiêu bandwidth **bằng toàn bộ kho media** mỗi lần
  chạy, tức **cổng bảo đảm `B-C1` thành thứ đắt nhất dự án**.
  ⚠️ **Quyết định VẪN ĐỨNG** — ô này không đảo nó, nó chỉ đặt con số đúng lên bàn
  trước chữ ký (`CLAUDE.md`: *"artifact đã chốt hoá ra sai ⇒ mở ô backlog ngay"*).
  · object: `.factory/fr/FR-054… §8.3 §9.3` (`AC-9.2`) ·
  `core/assets/frontmatter.schema.json` (FROZEN) · `.gitignore` · `.github/workflows/ci.yml`
  ⇒ **FR-054 §9.3**

## Mở 2026-09-03 (lượt 4) — áp thử FR-044, và ĐO ra hai thứ đã lỗi thời

> Áp `FR-044` lên **bản sao ở thư mục tạm** (không đụng file thật — deny chặn
> `Write` trên schema, và `CLAUDE.md` cấm đi vòng bằng `Bash`).
> Patch: `scratchpad/frontmatter.schema.FR044.json`. Kết quả đo:
> 3 bản ghi thật `cu=0 lỗi · moi=0 lỗi` (y hệt) · `validate.py kb/` output
> **giống hệt** trước/sau · 5 fixture cổng mới **đỏ được VÀ xanh được**.

- [x] **`spec §2` khai *"`FR-044` không thi công được trước S8"* — CÂU ĐÓ HẾT ĐÚNG.**
  Đo 2026-09-03: `core/assets/dia-chi.json` **đã tồn tại** (phiên khác áp S8), và
  `validate.py:92-97` **đã đọc nó** — `LOCATOR_RE` cũ đã bị thay bằng `_DANG` sinh
  từ bảng khai. Bảng có sẵn đúng hai dạng T2 cần:
  `slug-trang` `[<slug>:p.7]` (`manh: day_du`, `bat_link_gay: true`) và
  `slug-moc` `[<slug>:t=03:15]`.
  ⇒ Ba cổng **T1–T3** của `FR-044` giờ **viết được** — chúng là code trong
  `validate.py` (grep `tong-hop` ra **0**, chưa có), nhưng **hết phụ thuộc**.
  ⇒ Cùng câu ở `data_flow §5` (*"`nguon` chưa có trong schema"*) vẫn đúng về
  schema, nhưng lý do *"không thi công được"* thì không.
  ⚠️ Áp schema là việc của **NGƯỜI** (deny + `FROZEN.lock`).
  · object: `06_modules/M12_chungcat/spec.md §2` (**FROZEN**) · `data_flow.md §5` ·
  `core/src/source_distiller/validate.py` ⇒ **FR-044** (áp) + FR cho câu ở spec

- [x] **`dia-chi.json` khai `slug-moc` là `mot_phan` — `FR-054` NÂNG được lên `day_du`.**
  Bảng khai ghi lý do đúng **lúc viết**: *"KHÔNG kiểm được mốc có nằm trong thời
  lượng — muốn kiểm phải tải video về, mà LÕI không gọi ra ngoài (`B-E2`)"*.
  Nhưng khi `FR-054` làm transcript `.vtt` thành **hiện vật trong kho**, mốc kiểm
  được bằng **cue cuối của chính file `.vtt`** — **0 lời gọi ra ngoài**, `B-E2`
  nguyên vẹn.
  ⇒ `slug-moc` lên `manh: day_du` + `bat_link_gay: true`, và `[t=03:15]` trỏ quá
  thời lượng thành **đỏ** thay vì lọt.
  ⚠️ Chỉ áp được **sau** khi `FR-054` xong — trước đó không có `.vtt` để đối chiếu.
  · object: `core/assets/dia-chi.json` (`dang[slug-moc]`) ⇒ **FR-054 §10**

- [x] ~~**`check_khung.py` chết ở lúc PARSE trên bản Python đã pin.**~~
  **Ô NÀY SAI — rút cùng ngày.** Tôi khai *"`ADR-02` pin 3.11"*; đo lại thì
  `adr.md#ADR-02` dòng 3 ghi *"**Cập nhật FR-005**: số cụ thể là **3.13**"*,
  `pyproject.toml` khai `requires-python = ">=3.13"`, CI pin `'3.13'`. PEP 701 có
  hiệu lực **từ 3.12** ⇒ f-string ở `check_khung.py:115` **hợp lệ trên môi trường
  đã khai**. **Mã đúng, không sửa.**
  `SyntaxError` đến từ việc tôi chạy bằng **sai trình thông dịch** — `python` trên
  `PATH` trỏ venv Hermes **3.11.15**.
  ⚠️ Lỗi phương pháp, đáng hơn cái bug không có thật: `CLAUDE.md` §DỪNG đòi
  *"máy đỏ mà chưa quy được chủ ⇒ quy chủ TRƯỚC khi phán"* — tôi phán ngay. Và
  cùng lượt đo đã có **phản chứng** (cổng chạy trên 3.14 qua được parse, chỉ báo
  thiếu phụ thuộc) mà tôi đọc nó như một lỗi thứ hai.
  Cái còn lại thật là **SETUP**, không phải bug: dựng môi trường theo
  `RUNNING.md:42` (`python -m pip install -e "./core[dev]"`).
  · object: `.factory/wo/WO-041-…md` (**ĐÃ RÚT**) · `core/tests/check_khung.py`
  (không sửa) ⇒ **WO-041 rút**

## Mở 2026-09-03 (lượt soát doc) — ba chỗ chưa ai bắt

> Soát cả **9 artifact** của M12 theo chỉ đạo *"check doc spec module M12 xem cần
> sửa gì nữa không"*. Ba ô dưới đây **không** trùng ô nào đã có.

- [x] **`§1 Vào` CHỎI exporter — transcript sẽ KHÔNG CÓ FILE để M12 đọc.**
  `spec §1` khai **Vào**: *"`slug` nguyên liệu · byte ở **`kb/_media/<sha256>`**"*
  — một **đường FILE**. Đo `core/tools/xuat_kho.py:193-197`:
  ```sql
  -- `la_dan_xuat = 0` thoi: ban chuyen doi (cache) KHONG di vao git
  SELECT sha256, byte FROM media WHERE la_dan_xuat = 0
  ```
  ⇒ Exporter **chỉ** ghi ra `kb/_media/` những hàng `la_dan_xuat = 0`.
  Và `FR-054 §3 V1` đòi hiện vật `.vtt` mang **`la_dan_xuat: 1`**.
  ⇒ **Transcript không bao giờ tồn tại dưới dạng file** ⇒ bước ④ của
  `FR-054 §1.3` (*"người bấm chưng cất → `chung-cat-mot-nguon`, neo = mốc thời
  gian"*) **không có file để đọc** qua đường đầu vào mà `§1` khai.
  ⚠️ Và nó **rộng hơn transcript**: luật này áp cho **mọi hiện vật dẫn xuất**.
  `kho.schema.sql:175` khai `la_dan_xuat` là *"chỗ ngồi cho bản PDF chuyển đổi từ
  ppt/word"* — bản đó cũng sẽ không có file.
  Ba đường ra, **chưa chọn**:
  (a) M12 đọc byte **qua API** của LÕI (`GET /api/articles/media/<sha>`) thay vì
      qua file — khớp `AC-1.1` (*không mở `_kho.sqlite`*) và khớp `M12-R1`;
  (b) exporter ghi cả `la_dan_xuat = 1` — **đảo** một quyết định đã khai lý do
      (*"cache KHÔNG đi vào git"*), và với `.vtt` 50–100 KB thì lý do đó yếu, nhưng
      với video 1 GB (`FR-054 §8.1`) thì nó rất mạnh;
  (c) job giữ transcript **cạnh job trong Maildir** như bản lưu phản hồi model
      (`AC-5.4` đã lập tiền lệ) — nhưng thế thì `.vtt` không phải hiện vật kho nữa,
      và nó chọi `FR-054 §1.1`.
  Tôi nghiêng **(a)**: nó không đảo quyết định nào, và `hienVatPhucVu` đã có sẵn —
  đo được nó trả **200 + đủ byte** khi có bản ghi trỏ tới (`FR-054 §7`, đo qua
  server thật). Nhưng đây là **quyết định**, không phải sửa mã.
  ✅ **CHỐT 2026-09-04 (quyết 1a)**: lối (a) — plan C4b viết theo nó (T12-16
  giai đoạn `doc-byte` qua API LÕI). Tick khi T12-16 bàn giao.
  · object: `06_modules/M12_chungcat/spec.md §1` ·
  `core/tools/xuat_kho.py:193-197` · `core/assets/kho.schema.sql:175`
  ⇒ **cần chủ dự án chọn** (spec FROZEN ⇒ tick bằng **FR id**)

- [x] **`spec_overview.md` tự chỏi chính nó, và nợ đó tự khai mà KHÔNG CÓ ĐỊA CHỈ.**
  ✅ **XONG 2026-09-07** — `spec_overview.md` **không** nằm trong
  `FROZEN.lock` (đo: 0 lần khớp) nên đây là một dòng sửa, không cần FR.
  Câu `:472` nay nói đúng vế `ADR-05`: *có cổng vào, chỉ nghe loopback*,
  luật thật là `M08-R1` — và nó trỏ thẳng `dich-vu.json` để người đọc
  không phải tin một câu văn.
  · object: `03_docs/spec_overview.md:472` · `core/assets/dich-vu.json`
  `spec_overview.md:472` viết *"**Không cổng vào**"* cho M12; `:455` liệt
  `:8788`/**`:8790`**/`:8791`/`:8792`; và `core/assets/dich-vu.json` khai
  `"ten": "chungcat" … "cong": 8790`.
  `spec M12` (header, dòng 11-15) **đã cờ chuyện này** và tự viết *"Cần s3/s4 sửa
  một câu"* — nhưng **không ô backlog nào, không FR nào** giữ câu đó. Một nợ tự
  khai không có địa chỉ là nợ không ai làm.
  ⚠️ Vế nào đúng thì đã rõ (`ADR-05` đính chính: luật thật là `M08-R1` —
  *không nghe NGOÀI `127.0.0.1`*, không phải *không nghe gì*), nên đây **không**
  phải câu hỏi kỹ thuật; nó là một dòng chữ ở tầng G3 chưa ai sửa sau 3 ngày.
  · object: `03_docs/spec_overview.md:472` · `06_modules/M12_chungcat/spec.md:11-15`
  ⇒ **FR tới s3** (hoặc một dòng sửa nếu `spec_overview` không frozen)

- [ ] **Cảnh báo *"chặn cứng"* ở `§2` THIẾU MỘT NỬA.**
  `§2` viết: *"`nguon` **chưa có** trong `frontmatter.schema.json` (`FR-044` chờ
  áp) … AC-2.1→2.3 **không thi công được**"*. Đúng — nhưng nó **không nêu** vế thứ
  hai, đo 2026-09-03:
  ```
  frontmatter.schema.json  ho_so.enum = ["phan-tich", "thu-vien"]
  chuoi "tong-hop"         xuat hien 0 lan trong ca file
  ```
  Mà `§2` khai `loai: tong-hop-chu-de` → `ho_so: **tong-hop**`. ⇒ **Giá trị enum
  đó cũng chưa tồn tại.**
  `FR-044 §1.1` giải **cả hai** (`enum: ["phan-tich","thu-vien","tong-hop"]`), nên
  **không thiếu FR** — nhưng `FR-044` trạng thái **`chờ thi công`**, và người đọc
  `§2` sẽ tưởng chỉ thiếu **một** trường.
  ⇒ Sửa một câu ở `§2` để cảnh báo nêu **hai** thứ, không một.
  · object: `06_modules/M12_chungcat/spec.md §2` ·
  `core/assets/frontmatter.schema.json` (`ho_so.enum`) · `.factory/fr/FR-044*.md`
  ⇒ **FR-044** (spec FROZEN)

## Đã soát và SẠCH — ghi ra để lượt sau không soát lại

| soát gì | kết quả |
|---|---|
| AC `spec.md` ↔ `testcases.md` | **24/24 khớp hai chiều**, 0 lệch |
| `rules.md` — 7 rule, đều `bề_mặt: S3` | **7/7 đủ `lệnh` + `đỏ_khi` + `xanh_khi`** |
| `cong: 8790` của `AC-1.2` ↔ `dich-vu.json` | khớp |
| `§1.1` *"5 tài khoản đọc cả kho, chưa có ACL theo tài liệu"* | **vẫn đúng** — `QUYEN` có 5 *việc* (`sua-bai-nguoi-khac` · `moi-nguoi-moi` · `thu-hoi` · `xem-audit` · `nap-nguon`), **không việc nào** là ACL theo tài liệu |
| con số tự khai lệch thực tế | **0** — khác 8 module đợt một (M01…M08 mỗi module một con số lệch) |
| `data_flow` · `model_flow` · `ui_flow` · `diagram_flow` · `workflow` | không tìm thấy chỏi mới |

⚠️ **Một chỗ trông như lỗi mà KHÔNG phải**: `spec.md` trỏ **18** đường dưới
`chungcat/`, `rules.md` **7**, `data_flow.md` **2** — và `chungcat/` thật chỉ có
`README.md`. Header spec khai thẳng: *"Mọi `cmd` dưới đây trỏ vào lệnh CHƯA TỒN
TẠI… nhãn `hard` nói 'AC này kiểm được bằng máy', không nói 'đã kiểm'"*. Khai
trước ⇒ **không phải nợ giấu**.

⇒ Nhưng nó là **bằng chứng thứ hai** cho lỗ ở `check_g6a` (xem
`06_modules/M03_web/backlog.md` ô đầu): cổng đo *"AC có viết chữ `cmd`"* nên nó
**không phân biệt được** 18 đường-khai-trước của M12 với **một** đường-hỏng-im-lặng
của M03 (`AC-2.2.1` trỏ `web/test/no-archived.test.js`, file **không tồn tại**,
`hard`, G6A vẫn xanh). Hai trạng thái rất khác nhau, một kết quả cổng.

## Giám sát thi công (PM ghi trong lúc theo dõi — 2026-09-03)

- [x] **Thứ tự plan vỡ: mã đi trước hợp đồng.** — ĐÓNG 2026-09-03: T12-0 đã áp FR-053 (AC-4.5/4.6 mọc) + NGƯỜI ký lock (hash mới 4cf8fe33/f6b8e49e) + check_g6b sạch M12 trên spec mới. object: FROZEN.lock, spec.md
  *(Chữ ký 23:29 từng bị dev nghi "ký hộ" — điều tra 2026-09-04: quét transcript
  mọi phiên agent, KHÔNG phiên nào ghi lock (dev dừng 22:52, PM chỉ đọc 23:31);
  chủ dự án xác nhận trực tiếp: "tôi chạy check_frozen.py --ky hqua đó".
  Gate HỢP LỆ — người ký, đúng luật. check_frozen hiện exit 0.)* — `T12-2` (`verify.py`) và
  `T08-19` đã viết trong khi `T12-0` (áp FR-053 vào spec/rules + NGƯỜI ký lại
  FROZEN.lock) CHƯA chạy — spec frozen còn bản cũ (hash `f91a9fae`/`a9f81ad5`),
  tức `verify.py` thi hành một AC mà trên giấy chưa tồn tại. Tick khi: T12-0
  bàn giao + lock ký lại + `check_g6b` sạch M12 trên spec MỚI.
  object: `07_plan/M12_chungcat/tasks/T12-0-ap-fr053-vao-spec.md` · `FROZEN.lock`

- [x] **Cổng chẩn sai lý do đỏ** (`workflow §1a` cấm) — **ĐÓNG 2026-09-03**.
  PM bắt đúng: `check_quote_co_that` đỏ với thông điệp *"verify.py chưa tồn tại
  (No module named 'rapidfuzz')"* trong khi `verify.py` CÓ — hai ca khác hẳn nhau
  bị gộp vào một nhánh `except ImportError`, và người đọc bị chỉ đi sửa nhầm chỗ.
  **Đã làm cả hai việc PM giữ ô cho:**
  (1) **Tách hai nhánh** — `chungcat/tests/_nap.py` phân biệt bằng *file mã có
      tồn tại trên đĩa hay không*, và dùng `ImportError.name` để gọi tên gói vắng.
      `ThieuMa` → **exit 1** (*"đỏ ĐÚNG ở giai đoạn cổng-trước-mã"*);
      `ThieuGoi` → **exit 3** (*"ĐỎ SAI LÝ DO · thiếu package `X` … KHÔNG sửa một
      dòng mã nào"*). Cả sáu cổng đã chuyển sang dùng nó.
      **Chứng minh bằng máy**, không bằng lời khai: chặn `import rapidfuzz` rồi
      chạy ⇒ *"ĐỎ SAI LÝ DO · THIẾU PACKAGE `rapidfuzz`"*, exit **3**; xin một
      module chưa viết ⇒ *"ĐỎ · CHƯA CÓ MÃ"*, exit **1**.
  (2) **Pin ở một chỗ khai** — `chungcat/pyproject.toml`: `rapidfuzz>=3.14,<4` ·
      `pdfplumber>=0.11,<1` · `httpx>=0.27,<1`, `requires-python >=3.13` (cùng
      bản pin `ADR-02`/`FR-005`). Không khai vào `core/pyproject.toml` — đó là
      đất M01, ghi vào đó là ra ngoài `phạm_vi_ghi` (R1).
      `pip install -e ./chungcat` chạy exit 0; sáu cổng vẫn xanh sau khi cài lại.
  ⚠️ Trong lúc sửa, một `regex` sweep của tôi **xoá nhánh xử lý của
  `check_quote_co_that` mà không thay bằng gì** — cổng đó đã ở trạng thái tệ hơn
  trước (sẽ `NameError` nếu import hỏng) trong vài phút. Sửa từng file rồi mới
  chạy lại đủ sáu. Bài học: sweep bằng regex trên nhiều file thì phải **audit
  từng file sau đó**, đừng tin số dòng thay được.
  · object: `chungcat/tests/_nap.py` · `chungcat/pyproject.toml` ·
  sáu `chungcat/tests/check_*.py` ⇒ **đóng bằng mã, không cần FR**

- [x] **`./chungcat` CHƯA vào CI — sáu cổng M12 chưa được canh ở PR.**
  · ĐÓNG 2026-09-07 · object: `.github/workflows/ci.yml` — bước *cài chungcat (M12)* + vòng lặp 39 cổng + E2E `--mock`. Đo: cả 39 cổng xanh với env RỖNG (0 khoá, 0 mạng).
  `.github/workflows/ci.yml` chỉ cài `./core[dev]`; `paths` của nó cũng không
  liệt `chungcat/**`. Nên hôm nay sáu cổng M12 **chỉ chạy trên máy**, và người
  ký G6C có thể tưởng chúng đang được canh.
  ⇒ Cần một bước `pip install -e ./chungcat` + thêm `chungcat/**` vào `paths`.
  Đất `.github/**` thuộc **M04_ci**, không phải M12 ⇒ **không nới `phạm_vi_ghi`
  tại chỗ**, mở đơn vị ở plan M04.
  ⚠️ Và `G6C` có một dòng đòi khai chuyện này: *"KHAI trạng thái pre-commit hook:
  đã cài / chưa cài"* — cùng tinh thần, cùng lý do.
  · object: `.github/workflows/ci.yml` · `chungcat/pyproject.toml` ⇒ **đơn vị của M04_ci**


## Mở 2026-09-03 (lượt 5) — thi công C4a: sáu cổng xanh, và CHỖ CHƯA CLEAR

> Đã dựng: `verify.py` · `egress.py` · `bang_khai.py` · `dinh_tuyen.py` ·
> `adapter/hop_dong.py` + `adapter/nha_a.py` · `vong.py` · `api.py`, và sáu cổng
> `chungcat/tests/` — tất cả **đỏ trước, xanh sau** (R5). **E2E `--mock` xanh.**
> Nền không vỡ: 45 pytest · validate 0 lỗi · `loi-cua` xanh · `check_g6b` giữ 30.

- [x] **`--that` của E2E CHƯA BẬT ĐƯỢC — `dich` và tên model là CHỖ GIỮ.**
  `model.json` khai `dich: gateway.noi-bo` và tên nhà/model `nha-a`/`model-a-lon`
  — cả hai là **placeholder**, không phải cấu hình chạy. Hai lý do không điền
  tên thật ngay: (1) mỗi gateway đặt tên định danh model một kiểu, và tên gateway
  nhận **chưa được xác minh**; (2) điền tên thật vào bảng chưa gọi thử được là
  tạo ra thứ **TRÔNG NHƯ đã cấu hình**.
  ⇒ Chốt ở lời gọi thật đầu tiên. Tới lúc đó mới đo được **M6.1** (8/10 nháp
  duyệt được) và **M6.2** (token/bài) — hai metric của proposal.
  · object: `chungcat/assets/model.json` `$vi_sao_ten_gia_dinh` ·
  `chungcat/tests/check_e2e_chung_cat.py` (nhánh `--that` thoát mã 2) ⇒ **cần gateway thật**

- [ ] **`nguong_fuzzy = 88.0` đo LỆCH VỀ PHÍA LẠC QUAN — phải đo lại.**
  Vế **bịa** (12 quote xáo, max **66.2**) đáng tin. Vế **thật** (12 quote, min
  **100.0**) thì **không**: phép biến đổi "như model" trong lần đo áp ĐÚNG những
  phép mà `chuan_hoa()` đảo ngược, nên nó được bảo đảm 100 **theo cấu tạo**, không
  theo thực nghiệm. Model thật còn diễn đạt lại, bỏ từ, gộp câu — `chuan_hoa`
  không chữa được.
  ⇒ Đo lại trên ≥10 quote do **model thật** trả về. **Tỉ lệ từ chối quote thật
  vượt 30% ⇒ DỪNG**, đừng hạ dần ngưỡng cho tới lúc cổng hết đỏ.
  · object: `chungcat/assets/nguong.json` `$comment_chua_kiem_chung` ⇒ **đo lại sau lời gọi thật**

- [ ] **Dải ký tự Hán đang có HAI bản tiềm tàng — nợ `model_flow §5`.**
  `dinh_tuyen._DAI_HAN` khai bốn dải CJK **trong mã M12**. `model_flow §5` đã khai
  nợ: *"`chuan_hoa()` dùng chung với M13 — dải ký tự Hán phải là MỘT bảng khai,
  không hai regex. M13 định nghĩa; M12 đọc"*. M13 chưa tồn tại.
  ⚠️ Đây đúng lớp lỗi đang làm `check_danh_muc` đỏ (hai bản một schema). Chuyển
  sang bảng khai chung **khi M13 dựng**, không muộn hơn.
  · object: `chungcat/src/dinh_tuyen.py` `_DAI_HAN` · `06_modules/M12_chungcat/model_flow.md §5`
  ⇒ **khi M13 dựng**

- [x] **Ba phụ thuộc mới CHƯA có nhà khai.** `rapidfuzz` 3.14.6 (MIT) ·
  · ĐÓNG 2026-09-07 · object: `chungcat/pyproject.toml` khai đủ `rapidfuzz` · `pdfplumber` · `httpx` · `yt-dlp`.
  `pdfplumber` 0.11.10 (nền `pdfminer.six` MIT + `pypdfium2` BSD-3/Apache-2.0) ·
  và `httpx` khi `egress` gọi thật. `chungcat/` **không có `pyproject.toml`**, và
  `core/pyproject.toml` là của M01 — khai vào đó là ghi ngoài boundary.
  ⚠️ Hôm nay chúng chỉ sống trong `.venv` của máy này. CI **không cài chúng**, nên
  sáu cổng M12 sẽ đỏ vì `ImportError` ngay lần CI đầu — đỏ **sai lý do**, đúng
  thứ `workflow.md §1a` cảnh báo.
  · object: `chungcat/` (thiếu `pyproject.toml`) · `.github/workflows/ci.yml`
  ⇒ **T12-1 mở rộng, hoặc một đơn vị riêng**

- [ ] **Khoá service-to-service mới là HÌNH DẠNG, chưa phải cơ chế.**
  `api.py::_tu_loi()` so chuỗi hằng từ env `CHUNGCAT_KHOA_LOI`. `FR-047 §2.1` L3
  đòi khoá RIÊNG (không dùng chung session người dùng) và **validate `aud`** —
  `CVE-2025-41258` (CVSS 8.0) là ca dùng chung secret cho session trình duyệt và
  API nội bộ. Hôm nay: chưa có vòng đời khoá, chưa so an-toàn-theo-thời-gian,
  chưa có `aud`.
  · object: `chungcat/src/api.py` `_tu_loi` ⇒ **đơn vị sau / FR nếu đổi hình dạng**

- [x] **`api.py` chưa có cổng — ĐÓNG 2026-09-03. 17/17 cổng của spec đã dựng.**
  Mười một cổng còn thiếu đã viết, tất cả **đỏ trước, xanh sau**:
  `check_nghe_loopback` · `check_chi_loi_goi_tu_loi` · `check_idempotency` ·
  `check_tran_thu_lai` · `check_checkpoint_giai_doan` · `check_khong_cham_kho` ·
  `check_du_phong_cung_khu_vuc` · `check_dinh_tuyen_ngon_ngu` ·
  `check_engine_cam_rut` · `check_hai_kieu_viec` · `check_dia_chi_mang_ten_nguon` ·
  `check_khong_tu_duyet`. Cộng cổng thứ 18 `check_e2e_chung_cat --mock`.
  · object: `chungcat/tests/` (18 file) ⇒ **đóng bằng mã**

- [x] **T12-7 (nhà thứ hai) chưa làm — `AC-3.1` CHƯA được chứng minh.**
  · ĐÓNG 2026-09-07 · object: `chungcat/src/adapter/` có `google.py` + `openai.py` + `hop_dong.py` — hai nhà, không phải một.
  T12-9 (`tong-hop-chu-de`) **đã xong**: `chungcat/src/tong_hop.py` + hai cổng
  `check_hai_kieu_viec` · `check_dia_chi_mang_ten_nguon` (T1/T2/T3 của `FR-044`).
  Còn T12-7, và nó là **phép đo thật** của `AC-3.1` (*thêm một nhà = 1 dòng bảng
  + 1 file, 0 dòng ở LÕI*) — như `C9` đo `M8.2`.
  ⚠️ `check_engine_cam_rut` hôm nay đo **tính chất CẤU TRÚC** (lõi mù với mọi
  nhà, danh mục dẫn xuất từ thư mục) và **tự khai** rằng nó chưa đo được mệnh đề
  đầy đủ. Cổng xanh ≠ `AC-3.1` đã chứng minh.
  · object: `07_plan/M12_chungcat/tasks/T12-7-*.md` ⇒ **đơn vị sau**

- [x] **`check_nghe_loopback` ĐỎ OAN** (PM bắt 2026-09-03 15:4x): vế *"mã không
  · ĐÓNG 2026-09-07 · object: `python chungcat/tests/check_nghe_loopback.py` → XANH.
  chứa hằng bind mọi giao diện"* FAIL với thông điệp `thấy {''}` — nhưng
  `api.py:152` bind `ThreadingHTTPServer(("127.0.0.1", …))` đúng chuẩn. Regex
  của cổng đang vớ CHUỖI RỖNG (có thể từ một tuple/f-string khác) rồi coi đó là
  `""`-bind. Lưu ý: `""` TRONG THAM SỐ BIND thật sự là mọi-giao-diện trên
  http.server — vế kiểm đúng hướng, chỉ sai phép bắt: phải bắt `("",` ở vị trí
  đối số đầu của HTTPServer/ThreadingHTTPServer, không bắt mọi chuỗi rỗng trong
  file. Tick khi: cổng xanh trên api.py hiện tại VÀ đỏ trên fixture bind `("",`.
  object: `chungcat/tests/check_nghe_loopback.py` · `chungcat/src/api.py:152`


## Mở 2026-09-03 (lượt 6) — dựng đủ 17 cổng, và BỐN chỗ cổng của tôi đo sai

> Mười một cổng mới, tất cả đỏ-trước-xanh-sau. Nền không vỡ: 45 pytest ·
> validate 0 lỗi · `loi-cua` + `api-guard` xanh · `check_g6b` giữ **30**.
> **Bốn lần cổng đỏ vì KỲ VỌNG CỦA TÔI SAI, không vì mã sai** — ghi cả bốn, vì
> chúng là cùng một lớp lỗi: *cổng đo lời văn / đo cấu trúc phụ thay vì đo luật*.

- [x] **Bốn lần cổng của tôi tự đỏ oan — đã sửa từng cái, ghi để không lặp.**
  (1) `check_quote_co_that` grep văn bản ⇒ bắt số `100` trong **chú thích**.
      Chuyển sang **AST**, chỉ đếm hằng trong MÃ.
  (2) `check_nghe_loopback` liệt `""` vào danh sách cấm bind ⇒ đỏ vì một chuỗi
      rỗng ở chỗ khác. Chuyển sang đo **đối số của lời gọi `*HTTPServer`**.
  (3) `check_dinh_tuyen_ngon_ngu` đo `co_varnames` ⇒ gộp **biến cục bộ** với
      tham số, và phạt đúng tính chất nó lẽ ra phải thưởng (`ngon_ngu` là biến
      cục bộ = máy tự tính). Chuyển sang `inspect.signature`.
  (4) `check_tran_thu_lai` khẳng định hai payload y hệt ⇒ cùng `sha256`. Sai:
      `_seq` nằm trong payload đã gửi nên hash KHÁC — và tính chất đó còn đáng
      hơn, vì nó làm **không ai dedupe được `egress.jsonl` theo nội dung**.
  Cộng hai fixture sai (`check_bang_khai_model` đổi tên model làm `du_phong`
  dòng khác trỏ hụt; `check_du_phong_cung_khu_vuc` đổi `khu_vuc` làm cặp NGƯỢC
  thành chéo-không-cờ) — **cả hai lần bảng khai ĐỎ ĐÚNG**.
  · object: sáu `chungcat/tests/check_*.py` ⇒ **đóng bằng mã**

- [x] **Cổng ghi vào repo — bắt được và sửa ngay.**
  `check_nghe_loopback` bản đầu trỏ `goc_hang_doi` vào `chungcat/hang-doi-cong-thu`
  ⇒ mắc lại **đúng lớp lỗi `WO-039` đã có WO**: cổng ghi vào repo làm `git status`
  bẩn và công cụ quy chủ mù đi. Đã chuyển sang `tempfile.mkdtemp`.
  ⚠️ Thư mục rỗng `chungcat/hang-doi-cong-thu` còn sót — lệnh xoá bị chặn quyền,
  **không đi vòng**. Người dọn tay.
  · object: `chungcat/tests/check_nghe_loopback.py` ⇒ **đóng bằng mã**

- [ ] **`dia-chi.json` v1 THIẾU hai dạng mà proposal Q5 đã liệt.**
  Đo 2026-09-03 — bảng khai có 5 dạng: `slug` · `slug-trang` · `slug-moc` ·
  `file-dong` · `muc`. Nhưng `proposal-2 §Q5` liệt cả **`[p.7]` trần** và
  **`[t=03:15]` trần** là dạng hợp lệ, và cả hai **không có trong bảng**.
  Hệ quả đo được: `[p.3]` và `[t=03:15]` **bị bỏ qua im lặng** — không đỏ (đúng
  luật), nhưng cũng **không được đếm**. Nên một bài `phan-tich` dùng toàn `[p.7]`
  sẽ đỏ ở vế *"mục không có địa chỉ nào"*, và người viết không hiểu vì sao —
  họ đang dùng một dạng mà proposal nói là hợp lệ.
  ⇒ Hoặc thêm hai dạng vào bảng, hoặc sửa `proposal §Q5` bỏ chúng. **Không để
  hai tài liệu nói hai chuyện.** Đất `core/assets/` là M01 ⇒ FR tới M01.
  · object: `core/assets/dia-chi.json` · `02_proposal/proposal-2-ai-llm-kenh.md §Q5`
  ⇒ **FR tới M01_core**

## Mở 2026-09-03 (lượt 7) — SMOKE TEST chạy thật, và hai chỗ chỉ lộ ra khi chạy

> Không phải chạy cổng — **chạy hai dịch vụ thật, gọi qua HTTP thật**.
> `web` :8787 đã do phiên khác khởi động (`EADDRINUSE`, trả 200) nên tôi dùng
> bản đó; dựng thêm `web` :8797 với `KHOA_DICH_VU` + `LOI_DB` ở thư mục tạm để
> chạm được cửa C2 mà **không đụng tiến trình của phiên khác**.
>
> **Kết quả — chuỗi sống:**
> `GET /model` 3 dòng, **KHÔNG lộ `dich`** · `POST /job` không khoá **403** ·
> model ngoài bảng **422** · hợp lệ **201** · `nguoi_dung_id` payload khai `999`
> bị **lột**, hàng ghi `"7"` từ header · nạp lại cùng ULID ⇒ **1 việc** ·
> `C2` payload đòi `approved`+`da_gui` ⇒ hàng ra **`nhap`/`draft`** · thiếu
> `x-aud` ⇒ **401** · `UPDATE` thẳng SQL sang `approved` ⇒ **`CHECK constraint
> failed`**, đọc lại vẫn `draft`. Cột `lan_gui_duyet` có thật trong DB.
> `chungcat/log/` **rỗng** — đúng, chưa gọi model lần nào.

- [x] **DỊCH VỤ M12 GHI TRẠNG THÁI CHẠY VÀO REPO.** Đo được sau smoke test:
  · ĐÓNG 2026-09-07 · object: `git ls-files chungcat/hang-doi` = **0 file**; `.gitignore` có `hang-doi`.
  `chungcat/hang-doi/new/01SMOKE….json` nằm **trong repo**, vì `api.py::chay()`
  mặc định `goc_hang_doi = R/"chungcat"/"hang-doi"`.
  ⚠️ Đây là **`WO-039` ở tầng DỊCH VỤ**, không phải ở tầng cổng: mỗi lần M12
  chạy là `git status` bẩn thêm, và công cụ quy chủ (*"ai vừa sửa gì"*) mù đi.
  Tôi đã sửa ca của **cổng** (`check_nghe_loopback` → `tempfile`) nhưng **để sót
  ca của dịch vụ** — cùng một lỗi, hai chỗ, tôi chỉ vá một.
  ⇒ Ba việc: (a) mặc định đọc từ **biến môi trường** (`CHUNGCAT_HANG_DOI`), hoặc
  một đường ngoài repo; (b) `.gitignore` thêm `chungcat/hang-doi/` +
  `chungcat/log/` + `chungcat/*.egg-info/` — chúng là **trạng thái chạy**, không
  phải nguồn; (c) `RUNNING.md` khai lệnh chạy M12 (hiện **không có dòng nào**).
  ⚠️ `.gitignore` và `RUNNING.md` **không thuộc đất M12** ⇒ không nới
  `phạm_vi_ghi` tại chỗ.
  · object: `chungcat/src/api.py::chay` · `.gitignore` · `RUNNING.md` ·
  `chungcat/hang-doi/` · `chungcat/hang-doi-cong-thu/` (rác của cổng, lệnh xoá
  bị chặn quyền) ⇒ **cần đơn vị riêng + quyết định về đất**

- [x] **`POST /job` trả `201` cho lần nạp LẠI — nên là `200`.**
      ✅ **XONG 2026-09-07** qua `FR-071` (chủ dự án duyệt). `spec §5.0a` +
      `AC-5.5`; `nap()` trả `(ulid, da_co)`; cửa trả `200 if da_co else 201`.
      Chạy thật trên thợ sống: `lan 1 → 201`, `lan 2 → 200` kèm
      `"da_co": true`. FE **không** sửa — đo được là không client nào gửi
      `ulid`, nên nhánh đó sẽ là mã chết (xem `FR-071 §2.3` đính chính).
      object: `.factory/fr/FR-071-*.md` · `chungcat/src/vong.py::nap` ·
      `chungcat/src/api.py::do_POST` · `chungcat/tests/check_nap_lai_tra_200.py`
      · `06_modules/M12_chungcat/spec.md §5.0a`
  Đo được: nạp cùng ULID lần thứ hai ⇒ **201** kèm `viec_id` cũ, và hàng đợi
  vẫn đúng **một** việc (idempotency ĐÚNG). Nhưng `201 Created` nói *"vừa tạo
  mới"* — mà không có gì được tạo.
  ⚠️ Không phải chuyện thẩm mỹ HTTP: `web/` là client duy nhất và nó sẽ dựng UI
  theo mã trả về. Một `201` cho ca *"việc này đã có"* làm màn hình báo *"đã tạo
  việc"* hai lần cho một việc — và người dùng bấm lại vì tưởng lần đầu trượt.
  ⇒ `200` + một trường phân biệt (vd `da_co: true`) cho ca nạp lại.
  ⚠️ `spec §7` khai `POST /job` nhưng **không khai mã trả về cho ca idempotent**
  — nên đây là chỗ spec thiếu, không phải mã sai. Cần một câu trong spec (frozen
  ⇒ qua FR) trước khi đổi mã.
  · object: `chungcat/src/api.py::do_POST` · `06_modules/M12_chungcat/spec.md §7`
  ⇒ **FR (spec frozen)**

- [x] **Smoke job nằm trong hàng đợi THẬT** (PM bắt 2026-09-03 17:05):
  `chungcat/hang-doi/new/01SMOKE0000000000000000001.json` — thử cổng bằng cách
  ghi vào hàng đợi thật thay vì thư mục tạm (luật CLAUDE.md: fixture ở thư mục
  tạm). Vô hại hôm nay vì worker chưa chạy thường trực, nhưng ngày worker bật
  thì file này thành MỘT LẦN GỌI MODEL THẬT không ai đặt. Tick khi: file smoke
  xoá + smoke test trỏ hàng đợi tạm (env/tham số goc_hang_doi đã có sẵn).
  · object: `chungcat/hang-doi/new/01SMOKE0000000000000000001.json`
  *(23:41 — thêm file thứ hai: `d210e2ec….json`, sinh trong lúc test UI/backend.
  Hàng đợi thật đang thành chỗ chứa đồ thử — ngày worker bật là N lần gọi model
  không ai đặt. Nhắc lần 2.)*
  *(00:15 — thêm file THỨ BA + THỨ TƯ: `7b1d0f66….json` · `b91ba101….json`, cùng
  payload `tai-lieu/xgboost-stap-by-step` / `gemini-2.5-flash`, `giai_doan: cho` —
  sinh khi thử FE mới. **4 file thử trong hàng đợi thật ⇒ ĐÃ BÁO NGƯỜI** theo
  ngưỡng nhắc-2-lần. Việc sửa vẫn một: smoke/UI-test trỏ `CHUNGCAT_HANG_DOI` tạm,
  xoá 4 file cần NGƯỜI duyệt — rule 4 cấm agent tự xoá.)*
  *(01:50 — lên 8 file; NGƯỜI duyệt xoá ("tôi access"); `rm` bị deny nên DỜI cả 8
  sang quarantine scratchpad phiên PM. Hàng đợi thật = 0 file, đo lại rỗng. Vế
  còn mở: dev trỏ mọi lần thử vào `CHUNGCAT_HANG_DOI` tạm — chưa làm.)*
  *(10:42 — TÁI DIỄN lần 4: 2 file mới lúc 10:36 (`123454ce…` · `75f5df83…`,
  cùng slug xgboost, `cho`) sinh khi dev test UI. Vế sửa gốc vẫn chưa làm.
  ĐÃ BÁO NGƯỜI lần 3. Đề nghị NÂNG mức: đơn vị nhỏ bắt buộc — smoke/UI-test
  spawn service với `CHUNGCAT_HANG_DOI=<tạm>` (env đã có sẵn trong api.py::chay),
  và một cổng đo "hàng đợi repo rỗng sau suite".)*

## Mở 2026-09-04 — AUDIT chất lượng API backend (agent kiểm định, exit thật 22 cổng)

> 22/22 cổng exit như khai (19 check + e2e-mock + loi-cua 92 assert + loi-tho-cua
> 23 assert; e2e--that exit 2 đúng khai). AC đo TRÚNG mệnh đề: **19/27 = 70%**.
> Verdict: **CHƯA đủ dùng C4a** — ba điều kiện chặn ở các ô dưới. Cái ĐÃ BIẾT
> (gateway placeholder · nguong_fuzzy 88.0 · T12-7 · 201-idempotent · khoá hình
> dạng) không mở ô lại. Dưới đây chỉ ô MỚI.

- [x] **KHÔNG CÓ WORKER — dịch vụ nhận job nhưng không gì CHẠY job.** Không dòng
  · ĐÓNG 2026-09-07 · object: `chungcat/src/worker.py` chạy `--vong`; đo thật hôm nay: job `tai-video` đi trọn `cho → dang-doc-nguon → xong`.
  nào trong `chungcat/src/` lấy job từ `new/` → gọi model → verify → POST nháp
  C2. `ghi_nhan_gui` 0 caller ngoài tests; `kiem_tong_hop` 0 caller; E2E tự dàn
  dựng ④⑤⑥ bằng tay. Hôm nay POST /job trả 201 rồi job `cho` VĨNH VIỄN. Backend
  hiện = cửa nhận + hàng đợi, chưa phải pipeline. ⇒ đơn vị worker trong plan M12
  (T12-11?), kèm: gọi `kiem_tong_hop` ở cửa hoặc worker + `ghi_nhan_gui` + trần.
  · object: `chungcat/src/vong.py` (thư viện có, không ai gọi) ⇒ **đơn vị mới**

- [x] **TOÀN BỘ mã M12 + cửa LÕI CHƯA VÀO GIT.** `git ls-files chungcat` = 0,
  · ĐÓNG 2026-09-07 · object: `git ls-files chungcat` = **67 file** (ô này khai 0).
  `web/api/loi-cua.mjs` = 0. Chưa commit/PR/CI — mọi số xanh là số working tree,
  không cổng nào canh ở PR. Cộng ô cũ "chungcat chưa vào CI".
  · object: `git ls-files chungcat | wc -l` = 0 ⇒ **dev commit + đơn vị M04_ci**

- [x] **AC-2.1 HỞ Ở CỬA DỊCH VỤ**: cổng đo hàm `kiem_tong_hop`, nhưng
  `POST /job` không gọi nó — `tong-hop-chu-de` 1 slug vẫn 201 vào hàng đợi.
  api.py:121-155 chỉ validate `model`; thiếu `loai`/`slug` cũng 201 (job rác).
  · object: `chungcat/src/api.py:152-153` · `tong_hop.py:84-103` ⇒ **vá ở đơn vị worker/cửa**

- [x] **TRẦN 32MB KHÔNG ĐƯỢC KHAI Ở ĐÂU** ⇒ ĐÓNG bởi `T12-12` (2026-09-04,
  chủ dự án "ok"). `tran_payload_byte: 33554432` vào `chungcat/assets/nguong.json`
  (KHÔNG vào `model.json`: trần thuộc CỬA EGRESS, không thuộc một model — mọi
  lời gọi ra Internet đi qua nó, kể cả lối `tai_ve` không gọi model).
  `bang_khai.doc_tran_payload()` đọc, KHÔNG có default (default = trần im lặng
  thành số khác khi bảng khai mất khoá). `goi_qua_adapter` nhận `tran` và đọc
  bảng khai khi không được truyền; `google.goi` bỏ `tran=None` (default `None`
  ⇒ `len(...) > None` là `TypeError` GIỮA JOB). Cổng thêm 4 vế đọc số THẬT.
  · object: `chungcat/assets/nguong.json` · `chungcat/src/bang_khai.py` ·
  `chungcat/src/adapter/hop_dong.py` · `chungcat/src/adapter/google.py` ·
  `chungcat/tests/check_mot_cua_egress.py` · worklog `WL-01KA0U3VIECDUYET`

<details><summary>ô gốc</summary>

- **TRẦN 32MB KHÔNG ĐƯỢC KHAI Ở ĐÂU** — cơ chế chặn-trước-băm đúng thứ tự
  (egress.py:91-113) nhưng `tran` là tham số bắt buộc không default, model.json/
  nguong.json không có số; cổng dùng fixture 1024 và trỏ "bảng khai" không tồn tại.
  · object: `grep 33554432 chungcat -r` = 0 ⇒ **thêm vào bảng khai + cổng đọc số thật**

</details>

- [x] **HAI `cmd` CHẾT trong spec FROZEN** ⇒ ĐÓNG bởi `T12-12` (2026-09-04,
  chủ dự án chọn **lối (a)**: tạo hai file đúng tên, **KHÔNG** sửa spec — spec
  không sai, thứ thiếu là cổng mang đúng tên nó hứa; sửa spec cho vừa mã đang
  có là để bên bị đo chỉnh thước đo, và còn tốn một FR vì spec frozen).
  ⚠️ KHÔNG phải phép đổi tên — phép đo cũ THIẾU VẾ: AC-4.5 đòi gieo BỐN ca
  (cũ gieo hai) và **0 dòng `egress.jsonl`** (cũ không đụng log); AC-4.6 đòi gọi
  THẲNG `:8790` (cũ gọi hàm trong tiến trình, tức đo THƯ VIỆN chứ không đo CỬA).
  · object: `chungcat/tests/check_chan_truoc_khi_goi.py` ·
  `chungcat/tests/check_model_ngoai_bang.py` ·
  `07_plan/M12_chungcat/tasks/T12-12-hai-cong-chet-va-tran-32mb.md` ·
  worklog `WL-01KA0U3VIECDUYET`

- [ ] **`T12-12` chạm `chungcat/tests/**` — đất của `T12-8`.** Plan M12 khai
  *"chỉ T12-8 được chạm `chungcat/tests/`"*; `T12-12` thêm hai file MỚI ở đó và
  sửa `check_mot_cua_egress.py` mà `T12-8` sở hữu. `<scope-check>` sẽ thấy hai
  task tranh cùng thư mục. Không nới tại chỗ.
  ⇒ Hoặc `T12-8` khai lại `phạm_vi_ghi` (nó đã đóng, 19/19 xanh), hoặc `T12-12`
  nhận hẳn `check_mot_cua_egress.py`. **NGƯỜI chọn ở G6C.**
  · object: `07_plan/M12_chungcat/tasks/T12-8-test-cong-m12.md` ·
  `07_plan/M12_chungcat/README.md`

- [ ] **`model.json`: cả BA dòng mang `khu_vuc: khong-xac-dinh`.** Hệ quả đo
  được: phép so `dong["khu_vuc"] != mac_dinh["khu_vuc"]` KHÔNG BAO GIỜ đúng ⇒
  phép chặn (d) của §4.0b và cả `cho_phep_cheo_khu_vuc` (`M12-R5`) chưa từng
  chạy trên dữ liệu THẬT. `check_chan_truoc_khi_goi.py` phải dựng một dòng bảng
  TẠM để gieo ca (d).
  ⚠️ KHÔNG phải lỗi của bảng: `T12-11` chốt *"giữ `khong-xac-dinh` khi chưa xác
  minh route gateway — KHÔNG điền đại một khu vực cho đẹp"*. Ghi ô này để con số
  không nằm im: **§4.0c là hợp đồng pháp lý** (NĐ 356/2025 Điều 14), và một
  hợp đồng chưa từng chạy trên dữ liệu thật là một hợp đồng chưa được kiểm.
  · object: `chungcat/assets/model.json` ⇒ **T12-11 khi xác minh được gateway**

- [x] **AC-4.4 nửa vế (a) MỚI**: `la_mac_dinh` không vào egress.jsonl —
  google.py:44-50 chỉ truyền nha/model/khu_vuc. (Vế b `model_da_dung` đã có ô cũ.)
  · object: `chungcat/src/adapter/google.py:49` ⇒ **vá khi làm worker**

- [ ] **AC-7.1: bảng `chu_de→engine` spec khai KHÔNG tồn tại** — cổng đo model.json
  (tính chất lân cận). Một phần trùng ô T12-7.
  · object: `check_engine_cam_rut.py:62-114` ⇒ **FR hoặc gộp T12-7**

- [x] *(nhỏ)* GET /viec?n=abc → `int()` ném, handler sập request (http.server
  · ĐÓNG 2026-09-07 · object: `chungcat/src/api.py::doc_so` + cổng `chungcat/tests/check_tham_so_hong.py` (7 vế). Đo trước: `?n=abc` → **502 · TypeError** (thợ đóng kết nối không trả gì). Đo sau: **200**.
  nuốt). · object: `chungcat/src/api.py:110-111` ⇒ **vá 1 dòng ở đơn vị sau**


- [x] **15 nhà trong bảng khai, MỘT adapter.** ⇒ TRẢ LỜI 2026-09-04: chủ dự án
  cung cấp `beeknoee-api-guide.md` — cửa là **Beeknoee, OpenAI-compatible**, guide
  §3: *"chỉ cần một client duy nhất, đổi tên model để chuyển provider"*. Nên câu
  trả lời là CÓ, và mô hình N-nhà-N-adapter sai. Đã mở **`FR-059`** (adapter thuộc
  CỬA) + `adapter/beeknoee.py` + `T12-18`. Đo trước khi sửa: 111/112 model trả
  422; sau khi sửa: 21/21 cổng xanh.
  · object: `.factory/fr/FR-059-adapter-cua-cua-khong-cua-nha.md` ·
  `07_plan/M12_chungcat/tasks/T12-18-test-cua-beeknoee.md` ·
  worklog `WL-01KA22BEEKNOEE` ⇒ tick bằng **FR-059** (chờ NGƯỜI ký spec)

<details><summary>ô gốc</summary>

- **15 nhà trong bảng khai, MỘT adapter.** `T12-11` đồng bộ 238 model / 15
  nhà từ danh mục gateway; `chungcat/src/adapter/` chỉ có `google.py`. Hệ quả đo
  được: model của 14 nhà kia bị phép chặn (b) §4.0b từ chối **trước khi tiêu
  token** (`check_chan_truoc_khi_goi.py` đo đúng nhánh đó) ⇒ bộ chọn bày 238
  model mà 223 trong số đó bấm là 422.
  ⇒ Câu cần chủ dự án trả lời: **gateway có nói MỘT hợp đồng chung không?** Nếu
  nó là kiểu OpenRouter (`POST /v1/chat/completions`, `model` là một trường của
  thân) thì **một** `adapter/gateway.py` phục vụ cả 15 nhà — và `AC-3.1` ("thêm
  một nhà = 1 dòng bảng + 1 file adapter") đọc lại thành "0 file". Nếu KHÔNG thì
  phải thu `$nha_cho_phep` về đúng số nhà có adapter, chứ không bày ra 238 lựa
  chọn mà 223 sẽ chết.
  · object: `chungcat/assets/model.json` (`$nha_cho_phep`) ·
  `chungcat/src/adapter/` ⇒ **NGƯỜI xác nhận hợp đồng gateway**

</details>


## Mở 2026-09-04 — cửa Beeknoee (`T12-18`)

- [ ] **`stream: true` chưa bật — model reasoning sẽ dính Cloudflare 524.**
  `beeknoee-api-guide.md` §2.1: model reasoning có thể think **>120s**, và
  non-streaming trả **524**. `egress.gui()` hôm nay là cửa
  một-request-một-dòng-log; stream đổi hình dạng đó (log ghi TRƯỚC khi gửi vẫn
  đúng, nhưng phản hồi tới theo nhiều chunk).
  ⇒ Cần: `egress.gui(stream=True)` trả iterator, `adapter/beeknoee.py` gom
  chunk, và `AC-6.1`/`AC-6.2` (`sha256` của payload GỬI ĐI) giữ nguyên — băm
  payload, không băm phản hồi, nên vế đó không đổi.
  ⚠️ Chưa đo được lớp lỗi này: chưa có `BEEKNOEE_API_KEY` để gọi thật.
  · object: `chungcat/src/egress.py:113` · `chungcat/src/adapter/beeknoee.py`

- [ ] **Management API chưa dùng — ví cạn giữa job là job chết không lý do.**
  Guide §8 khuyên `check_balance()` lúc mở phiên: *"nếu ví thấp thì chuyển sang
  model rẻ/free thay vì fail giữa chừng"*. Cần khoá + header `User-Agent`
  (thiếu ⇒ Cloudflare 1010).
  Đáng làm vì nó đo được: `GET /usage` trả `costVND` từng request ⇒ đối soát
  được với `egress.jsonl` của ta. Hai sổ độc lập cho cùng một lần gửi — đúng
  hình dạng `FR-043` bậc 4 muốn.
  · object: `chungcat/src/` (module mới) ⇒ **cần `BEEKNOEE_API_KEY`**

- [x] **`FR-054` lối `dich_vu` nay RẺ HƠN `faster-whisper` local — chủ dự án
      quyết lại.** ✅ **XONG 2026-09-07** — chủ dự án: *"OK"*, giữ lối
      `dich_vu`. Và đo được là nó ĐÃ ở đúng hình dạng an toàn mà ô này đòi:

      | dòng | loai | uu_tien | tieu_egress | can_key |
      |---|---|---|---|---|
      | `cua-asr` | `dich_vu` | **1** | **true** | **true** |
      | `file-nguoi-tai` | `file` | 2 | false | false |
      | `ytdlp-asr-local` | `tai_ve` | 3 | false | false |

      Ba điều ô này lo, và vì sao không xảy ra:
      · **`T12-16` không bị phá** — `cua-asr` là một DÒNG NGUỒN riêng, không
        phải bản vá `asr.py`. Vế *"KHÔNG import egress"* của `ytdlp-asr-local`
        và cổng AST canh nó còn nguyên.
      · **Egress không im lặng** — dòng ấy khai `tieu_egress: true` ngay trong
        bảng, nên *"audio rời máy"* là một trường đọc được, không phải một hệ
        quả người dùng phát hiện sau.
      · **Chưa một byte audio nào rời máy** — `can_key: true` và
        `BEEKNOEE_API_KEY` chưa có. Lối này chỉ chạy khi có khoá, tức khi chủ
        dự án nạp khoá một cách chủ động.
      object: `chungcat/assets/nguon-transcript.json` (`nguon[]`) ·
      `chungcat/src/worker.py::chay_sinh_transcript` ·
      `chungcat/tests/check_asr_khong_egress.py`

      **Ghi chú gốc lúc mở ô, giữ làm ngữ cảnh (KHÔNG phải nợ):**
  quyết lại.** Đo trên danh mục Beeknoee: **23 model nhận audio**, cộng các model
  `*-stt` (`google/gemini-2.5-flash-lite-stt` …). `FR-054 §1.5` đã khai sẵn ba
  lối với `uu_tien`, nên đây KHÔNG phải sửa hợp đồng — chỉ là điền dòng
  `dich_vu` mà trước đây tưởng đắt.
  Đánh đổi phải nói thẳng:
  | lối | egress | cài đặt | tốc độ |
  |---|---|---|---|
  | `ytdlp-asr-local` (`T12-16`) | **0** | faster-whisper + model ~500MB | ~8× realtime |
  | `dich_vu` qua cửa | **1 lần — AUDIO RỜI MÁY** | 0 gói mới | nhanh |
  `T12-16` đang khai `KHÔNG import egress` và có cổng canh bằng AST. Lối
  `dich_vu` phá điều đó ⇒ nếu chọn nó thì phải là một `loai` nguồn riêng, không
  phải sửa `asr.py`.
  · object: `07_plan/M12_chungcat/tasks/T12-16-asr-sinh-transcript.md` ·
  `.factory/fr/FR-054-duong-video-transcript-thanh-hien-vat.md` §1.5
  ⇒ **NGƯỜI chọn trước khi bắn T12-16**

## Mở 2026-09-04 — `FR-060` (dữ liệu lên Cloudflare R2)

- [x] **33 ảnh ~25 MB ĐANG TRONG GIT — hai nhóm bỏ tracking là phá app và phá CI.**
  ⇒ ĐÓNG 2026-09-04. Luật cuối của chủ dự án: **CHỈ `public/**` push lên
  GitHub**, còn lại ảnh/video/mp4 **local**, DB local. Đã áp: `public/**` giữ ·
  `web/test/_probe/**` + `.playwright-mcp/` bỏ tracking (file còn trên đĩa) ·
  `image/upgrade/` + `nap-tai-lieu.png` xoá. Còn **11 ảnh** track, xuống từ 33.
  ⚠️ **Một phép đo sai của tôi, ghi ra vì nó sắp mua một quyết định sai**: tôi
  ghi `_probe/static/**` là *"fixture của cổng, bỏ ⇒ CI đỏ"*. Sai — `grep -rln
  "_probe" web/` chỉ ra MỘT chỗ, và đó là một dòng CHÚ THÍCH. Không cổng nào
  đọc thư mục đó (rác từ trước `FR-034`). Bỏ tracking: suite vẫn exit 0.
  Nguyên nhân: grep ba mẫu (`_probe/static|public/light|anhNen`) rồi đọc kết
  quả khớp `anhNen` thành kết quả khớp `_probe`.
  Ba link ảnh trong `upgrade.md:67` thay bằng một dòng nói chúng chụp gì và bug
  đó đóng ở đâu (`WO-045`) — không để lại link chết.
  ⚠️ `git rm` KHÔNG làm nhỏ lịch sử: byte cũ vẫn ở các commit trước.
  · object: `.gitignore` · `upgrade.md` · `.factory/fr/FR-060-...md` §4

<details><summary>ô gốc</summary>

- **33 ảnh ~25 MB ĐANG TRONG GIT.**
  Chủ dự án chốt *"ko commit video và ảnh lên git"*. Video/audio đã chặn tuyệt
  đối (git có **0** file loại đó — chặn trước khi có cái đầu tiên). Ảnh thì
  **đã commit rồi**, và bốn nhóm có ba số phận:
  | nhóm | n | ai đọc | số phận |
  |---|---|---|---|
  | `public/**` | 16 | `web/render/assets.mjs#anhNen()` — app SERVE | ⚠️ bỏ ⇒ clone mới KHÔNG có ảnh nền |
  | `web/test/_probe/static/**` | 12 | `_render.mjs` · `css-applied.test.js` | ⚠️ bỏ ⇒ CI đỏ trên máy sạch |
  | `image/upgrade/` + `nap-tai-lieu.png` | 4 | tài liệu | bỏ được |
  | `.playwright-mcp/` | 6 | không ai | **đã gitignore** |
  ⇒ Thứ tự đúng: **đưa `public/**` lên R2 (hoặc một đường seed) TRƯỚC, bỏ
  tracking SAU**. `git rm --cached` không làm nhỏ lịch sử (byte đã ở đó), nên
  bỏ sớm chỉ mua được một repo phá app.
  ⇒ **NGƯỜI chọn hai vế** ở `FR-060 §4`. Đề xuất: `public/**` CHỜ R2 ·
  `_probe/static/**` GIỮ trong git (fixture phải đi cùng cổng).
  · object: `.factory/fr/FR-060-du-lieu-len-cloudflare-r2.md` · `.gitignore`

</details>

- [ ] **Client R2 chưa có — ba mốc của `FR-060` chưa mốc nào thi công.**
  `FR-060 §1` khai: hôm nay local → mốc kế **video mp4 lên R2** → sau nữa
  **toàn bộ dữ liệu gồm DB**. Chưa có bucket, chưa có client, chưa có đường
  đọc-ghi. Việc cần trước khi thi công: R2 nói **S3 API**, nên nó là một CỬA
  (khuôn `cua.json` của `FR-059`) chứ không phải một nhánh trong `articles.mjs`
  — và khoá R2 phải ở `.env`, không trong bảng khai.
  ⚠️ Mốc "DB lên Cloudflare" đụng `ADR-06` ở chỗ nặng nhất: `_backup/` hôm nay
  là bản lùi DUY NHẤT (*"mất ổ `_backup/` = mất tài khoản"*). Đẩy DB lên R2 đổi
  câu đó theo chiều tốt, nhưng nó là một FR riêng vì nó đảo một quyết định đang
  có hiệu lực.
  · object: `04_system/adr.md` (mục ba-mốc) ⇒ **FR riêng khi tới mốc**

- [x] **Đường video còn HAI mảnh — `sinh-transcript` chạy tới `doc-byte` rồi dừng.**
  ✅ **XONG 2026-09-07** — cả hai mảnh:
  **(a)** `tai_nguon.lenh_tai()` nay CÓ người gọi:
  `chungcat/src/worker.py:762`, và nó chạy trong transport `_chay` của
  `egress.gui()` — tức **sau** dòng log, đúng thứ tự `AC-6.1` đòi (`seq`
  cấp trước khi request rời máy). Không phải một `subprocess.run` mở lén
  ngoài cửa egress.
  **(b)** đã xong từ `T08-30` (cửa hẹp `POST .../hien-vat`).
  Bằng chứng chạy thật: một video **58 phút** đi trọn đường
  tải → cắt 6 đoạn (~3 MB) → phiên âm → `.vtt` gắn vào bản ghi.
  · object: `chungcat/src/worker.py:762` (`lenh_tai` trong `_chay`) ·
  `chungcat/src/worker.py:929` (`chay_tai_video`) ·
  `chungcat/tests/check_nguon_dai_cat_doan.py`
  `worker.BANG_LOAI` đã có `sinh-transcript`, chọn đúng lối `cua-asr`
  (`uu_tien: 1`), và dừng kèm lý do đọc được. Hai chỗ thiếu:
  **(a) không ai chạy `tai_nguon.lenh_tai()`** ⇒ `doc-byte` luôn báo *"chưa có
  audio"*. Lệnh đã dựng và có cổng (`check_tai_url_allowlist`); thứ thiếu là
  người gọi nó **qua `egress.gui()`** để có `seq` + dòng log `tieu_egress: false`.
  **(b) `gan-hien-vat` — ✅ XONG 2026-09-04** bằng `T08-30`: cửa HẸP
  `POST /api/articles/<type>/<slug>/hien-vat` (lối 1 chủ dự án chọn), worker
  gọi nó ở giai đoạn cuối. Lối **THAY** hiện vật thì CHƯA — ô riêng ở
  backlog M08. Nguyên văn ô cũ: nạp `.vtt` qua cửa hiện vật ĐÃ XONG; gắn
  `sha` vào `media[]` của bản ghi video + bump `ban` thì CHƯA.
  ⚠️ (b) là một câu hỏi HỢP ĐỒNG, không phải một dòng mã thiếu:
  `PUT /api/articles/<type>/<slug>` là **cửa của NGƯỜI**, còn `AC-1.1` nói nháp
  của M12 đi qua **bảng nháp**. Cho một THỢ `PUT` một bản ghi đã duyệt là đúng
  lớp đường-đi-vòng mà `M05-R1`/`FR-047 §0` sinh ra để chặn — và cổng
  `check_khong_tu_duyet` nay chặn nó tường minh.
  ⇒ Ba lối cho (b), **NGƯỜI/PM chọn**: (1) một cửa LÕI mới chỉ để *gắn hiện vật
  vào bản ghi* (hẹp, đo được) · (2) đi qua bảng nháp rồi người duyệt · (3) nới
  `PUT` cho THỢ — **không nên**, nó mở lại đúng cửa vừa đóng.
  · object: `chungcat/src/worker.py#chay_sinh_transcript` ·
  `07_plan/M12_chungcat/tasks/T12-16-asr-sinh-transcript.md` ·
  worklog `WL-01KA34SINHTS` ⇒ **NGƯỜI chọn lối cho (b)**

- [x] **Bảng model NHẬP NGUYÊN CATALOG gateway — 112 dòng, lẫn model PHI-VĂN-BẢN.**
  ⇒ ĐÓNG 2026-09-04. **Không xoá dòng** (catalog đầy đủ có ích cho
  `sinh-transcript`: `whisper-*` là ứng viên lối `dich_vu`). Thay vào đó:
  cột `tac_vu_model` do đồng bộ phân loại theo `$tac_vu_theo_mau`, và
  `GET /model` **lọc** theo `$tac_vu_cho_chung_cat` (= `["van-ban"]`).
  Thêm `asr` cho `sinh-transcript` sau này = thêm **một chuỗi**, 0 dòng mã.
  Đo chạy thật: bảng 112 dòng · phân loại `van-ban 100 · anh 6 · asr 5 ·
  cong-cu 1` · `GET /api/model` bày **100**, phi-văn-bản còn bày **0**.
  Cổng thêm 5 vế vào `check_bang_khai_model` — trước đó nó xanh trong khi bộ
  chọn bày 12 lựa chọn bấm vào sẽ chết.
  · object: `chungcat/assets/model.json` · `chungcat/tools/dong_bo_model.py` ·
  `chungcat/src/api.py::/model` · `chungcat/tests/check_bang_khai_model.py`

<details><summary>ô gốc</summary>

- **Bảng model NHẬP NGUYÊN CATALOG gateway.**
  PM đo 2026-09-04 15:1x: `model.json` 8 → **112 dòng** (mtime 15:11), chứa
  `dall-e-2/3` · `sora-2` · `tts-1` · `whisper-*` · `grok-imagine` ·
  `web-search` — model ảnh/tiếng/video/công-cụ KHÔNG chưng cất văn bản được,
  nhưng bộ chọn của web sẽ BÀY tất. `check_bang_khai_model` vẫn xanh vì nó
  không đo `tac_vu`. Tin tốt kèm theo: prefix `bee/` cho thấy catalog lấy từ
  GATEWAY THẬT — `--that` sắp mở được.
  ⇒ Việc: thêm cột `tac_vu` (van-ban | asr | anh | tieng | cong-cu) hoặc lọc
  ở GET /model theo danh sách tác vụ M12 dùng; cổng thêm vế "model bày cho
  chưng cất phải là văn bản". KHÔNG xoá dòng — catalog đầy đủ có ích cho
  sinh-transcript (whisper-*) về sau.
  · object: `chungcat/assets/model.json` (112 dòng) · `chungcat/src/api.py::/model`
  ⇒ **đơn vị nhỏ M12 (dev), trước khi user test lại bộ chọn**

</details>

- [x] **MỘT khoá gateway, HAI tên biến.** ⇒ ĐÓNG 2026-09-04.
  Tên biến khoá nay đọc từ **một chỗ khai**: `cua.json` cột `bien_khoa` — cùng
  chỗ mà `FR-059` đã dựng cho adapter. Cả `api.py::co_khoa_cua()` lẫn
  `worker.py` đọc từ đó; `CHUNGCAT_KHOA_MODEL` (biến chưa bao giờ tồn tại) đã
  gỡ khỏi mã.
  **Đo chạy thật sau RESTART :8790** — tick đúng điều kiện ô này đặt ra:
  `POST /job` với `.env` hiện có ⇒ `{"viec_id": "...", "model":
  "gemini-2.5-flash-lite", "khu_vuc": "khong-xac-dinh"}`. Trước sửa, phép chặn
  (c) của §4.0b từ chối chính người ĐÃ đặt khoá đúng.
  ⚠️ Một cái bẫy gặp lúc làm: cổng đầu tiên tôi viết quét `CHUNGCAT_KHOA_MODEL`
  trên **cả chú thích**, nên nó ĐỎ vì `api.py` giải thích ngay tại chỗ vì sao
  tên cũ sai. Đã sửa để đo MÃ, không đo chú thích — một cổng đọc chính câu giải
  thích rồi tố nó là cổng dạy người ta đừng viết lý do.
  · object: `chungcat/assets/cua.json` (`bien_khoa`) · `chungcat/src/api.py` ·
  `chungcat/src/worker.py` · `chungcat/tests/check_bang_khai_model.py`

<details><summary>ô gốc</summary>

- **MỘT khoá gateway, HAI tên biến — cửa POST /job hỏi nhầm tên nên chặn
  NGƯỜI DÙNG ĐÃ CÓ KHOÁ.** PM quy chủ 2026-09-04 15:4x từ báo lỗi test thật
  của chủ dự án ("key api tôi đã set trong .env rồi mà"): `.env` CÓ
  `BEEKNOEE_API_KEY` + api.py::chay() CÓ nạp .env — nhưng `api.py:154` kiểm
  `co_khoa` bằng `CHUNGCAT_KHOA_MODEL` (biến không tồn tại) trong khi
  `worker.py:124` kiểm `BEEKNOEE_API_KEY`. Đúng lớp lỗi "hai bản một thứ"
  (khuôn check_danh_muc). ⇒ Sửa: TÊN BIẾN KHOÁ vào MỘT chỗ khai (bảng
  model.json cột `khoa_env`, hoặc hằng chung) — cả api.py lẫn worker.py đọc
  từ đó; sau sửa RESTART :8790 (Node/Python không nạp lại). Tick khi: chủ dự
  án gửi được job thật với .env hiện có.
  · object: `chungcat/src/api.py:154` · `chungcat/src/worker.py:124` · `.env` (tên khoá, không giá trị)

</details>

- [x] **HAI HÀNG ĐỢI SỐNG SONG SONG — 6 job mồ côi, người dùng chờ 135 phút
  · ĐÓNG 2026-09-07 · object: quét cả repo chỉ thấy **một** thư mục hàng đợi — `chungcat/hang-doi`.
  không biết vì sao.** PM đo 2026-09-05 từ than phiền chủ dự án: repo
  `hang-doi/new/` 6 job đều `cho·gửi=0` (job `0f21ff2f` của chủ dự án 135ph,
  `chungcat/log/` không tồn tại = 0 egress) TRONG KHI UI hiện các ULID khác
  (`7fe0379d…`) đang `dang-goi-model/dang-verify` — worker chạy trên hàng đợi
  `CHUNGCAT_HANG_DOI` khác sau khi dev restart. Hai nguồn sự thật, người dùng
  nhìn cái nào tin cái đó.
  ⇒ Ba việc: (1) `GET /health` trả THÊM đường hàng đợi + số job từng ngăn —
  một chỗ hỏi "service đang nhìn đâu"; (2) RUNNING.md khai lệnh chạy chuẩn
  (env nào cho dev-test, env nào cho chạy thật — MỘT đường thật duy nhất);
  (3) xử 6 job mồ côi: requeue vào hàng đợi thật hoặc bỏ — NGƯỜI/dev quyết,
  PM không tự xoá (rule 4).
  · object: `chungcat/hang-doi/new/` (6 file, gửi=0) · ảnh chủ dự án 2026-09-05
  · `chungcat/src/api.py::chay` (goc_hang_doi)

- [x] `M12-R6` ở lối ASR — **FR-065**, đóng 2026-09-05.
      Lời khai đầu tiên của tôi trong ô này SAI: tôi viết "chưa có răng, không
      ai gọi `ghi_nhan_gui`", vì đã grep chữ `lan_gui` trong `worker.py` và
      không thấy — mà tên hàm là `ghi_nhan_gui`, không chứa chuỗi đó. Thực tế
      `worker.py` gọi nó ở BA chỗ, trong đó có lối transcript, TRƯỚC khi gửi.
      Luật vẫn có răng suốt. Việc thật cần làm chỉ là chữ của `M12-R6` — đã
      sửa theo `FR-065`, và cổng `check_tran_thu_lai` xanh sau khi sửa.
      object: chungcat/src/worker.py:414 · 06_modules/M12_chungcat/rules.md

- [x] `chay.sh` (gốc repo, NGOÀI đất M12) dựng đúng MỘT worker, nên cấu
      hình `song_song.tien_trinh: 2` chưa có hiệu lực khi chạy bằng script.
      ✅ **XONG 2026-09-07.** `chay.sh` nay dựng hai bản `w1`/`w2` bằng đúng
      lệnh `chungcat/README.md` đã khai, và vòng dừng đọc glob
      `log/worker.pid log/worker-*.pid` — vòng cũ tìm một cái tên
      (`log/worker.pid`) mà **không còn ai ghi**, nên nó bỏ sót đúng những
      tiến trình nó có nhiệm vụ dừng, và im lặng.
      object: `chay.sh` (vòng dừng + khối dựng worker)

- [ ] **`seq` cua so egress RESET moi lan restart — do 2026-09-07.**
      Phat hien khi don rac cua chinh minh sau mot phep thu FR-071.
      Dinh danh worker MAC DINH la **PID** (`chungcat/README.md` da canh bao:
      *"Bo CHUNGCAT_WORKER_ID di thi sao: dinh danh mac dinh la PID"*), va so
      egress ten theo dinh danh. Nen moi lan restart sinh MOT so moi, va `seq`
      — so TA cap bang cach doc dong cuoi cua so — bat dau lai tu 1:

      ```
      egress.14900.jsonl    1 dong  seq 1..1
      egress.26956.jsonl    1 dong  seq 1..1
      egress.39792.jsonl    5 dong  seq 1..5
      egress.39956.jsonl    1 dong  seq 1..1
      egress.40312.jsonl   13 dong  seq 1..13
      => 21 lan gui THAT, nhung seq 1 xuat hien 5 lan
      ```

      Vi sao no dang ke: `FR-043` bac 4 dung `seq` de noi *"day la lan gui
      thu N, khong thieu lan nao"*. Voi 5 so cung bat dau tu 1, cau ay khong
      tra loi duoc tu mot so nao — phai gop, va phep gop khong co thu tu toan
      cuc. `M12-R6` (tran 2 lan gui) KHONG anh huong: no dem trong file viec.

      `chay.sh` nay ghim `w1`/`w2` (2026-09-07) nen **tu day chi con hai so
      on dinh** va `seq` lien tuc qua restart. Nhung 21 dong cu thi da phan
      manh roi, va cau hoi *"cong don co thu tu toan cuc khong"* chua tra loi.
      => Can quyet: gop 5 so cu thanh mot lich su doc duoc, hay khai thang rang
      `seq` chi co nghia TRONG MOT so (va sua cau chu cua `FR-043` bac 4 cho
      khop). **Khong tu chon**: no la hop dong bang chung.
      · object: `chungcat/hang-doi/egress.*.jsonl` · `chungcat/src/egress.py` ·
      `chay.sh`

- [x] **Nhân đôi worker LÀM LỘ một đua trong nhật ký — vá cùng lượt.**
      Phát hiện trong lúc làm ô trên, ghi ngay tại chỗ chứ không để nhớ.
      `nhat_ky._tep()` giữ trần bằng `f.tell()` trên handle của CHÍNH tiến
      trình mình. Hai worker cùng ghi `log/worker.jsonl` ⇒ mỗi bên chỉ đếm
      phần mình (trần 8 MiB thành ~16), và bên nào xoay trước thì bên kia giữ
      handle cũ, ghi tiếp vào `.1` — đúng file mà lần xoay sau `unlink()`.
      **Dòng mất, không ai báo** — trong khi `nhat_ky` mở đầu bằng đúng câu
      *"không nói là mình chỉ thấy một nửa"*.
      ⇒ `duong_tep("worker")` nay trả `worker-<id>.jsonl` khi có
      `CHUNGCAT_WORKER_ID`; vắng biến thì giữ `worker.jsonl` (người chạy tay
      không phải học tên mới). Cùng lối đã chọn cho sổ egress. Định danh được
      **lọc tên file** — một chuỗi chứa `..` từ môi trường không được thành
      đường ghi. `xem_nhat_ky.py` không phải sửa: nó đã `glob("*.jsonl")`.
      object: `chungcat/src/nhat_ky.py::duong_tep` ·
      `chungcat/tests/check_nhat_ky_mot_ben_ghi.py` (cổng MỚI, 6 vế, ĐỎ 3 vế
      trước khi cắm mã)

- [x] **Cổng `check_nhat_ky_mot_ben_ghi.py` chưa có CHỦ khai.**
      ✅ **XONG 2026-09-07** — chủ dự án chọn lối *"cổng đổi chủ"*, không lối
      *"`T12-8` khai lại"*. `T12-28` là đơn vị test mới nhận mọi cổng
      `chungcat/tests/` sinh sau khi `T12-8` đóng, theo đúng khuôn `T03-110b`
      của M03. `T12-8` giữ 19 cổng của nó và có dòng khai đổi chủ cho năm file
      mà `FR-071` chạm.
      object: `07_plan/M12_chungcat/tasks/T12-28-*.md` ·
      `07_plan/M12_chungcat/tasks/T12-8-test-cong-m12.md`

- [ ] **`T12-12` chạm đất `T12-8` — phần CÒN LẠI của câu hỏi đã trả lời.**
      `T12-28` giải xong vế *"cổng SINH SAU thuộc ai"*. Vế của `T12-12` khác:
      nó **sửa** `check_mot_cua_egress.py` mà `T12-8` đang sở hữu — tức hai
      đơn vị cùng khai một file đã có, không phải một file mới.
      ⇒ Cùng lối: `T12-12` nhận hẳn file ấy, hoặc dời vế sửa sang `T12-28`.
      Nhỏ hơn nhiều so với lúc mở, vì tiền lệ đã có.
      · object: `07_plan/M12_chungcat/tasks/T12-8-test-cong-m12.md` ·
      `07_plan/M12_chungcat/README.md`


## DỌN SỔ 2026-09-07 (PM, chủ dự án gật "ok") — object cho loạt [x] phía trên

Mốc chung: **commit `b7ab3f8`** (722 file — toàn bộ mã dưới đây nằm trong đó) ·
39/39 cổng `chungcat/tests` xanh · suite web 3183 vế 0 FAIL · FROZEN.lock ký
(spec/rules M12 sau FR-053+FR-054).

- 7 ô "⇒ FR-053": FR-053 ĐÃ ÁP (T12-0) + cổng tương ứng xanh — Citations bỏ
  khỏi hợp đồng · verify 3 tầng (`check_quote_co_that`) · AC-5.2 tính-chất
  (`check_hang_doi_nguyen_tu`) · `kieu_structured`+thông báo lệch schema
  (bảng khai) · trần chặn-trước-băm (`check_mot_cua_egress`, `tran_payload_byte`)
  · `che_do: sync` cột bảng.
- Nhóm FR-054/video: T12-14 áp spec (video/V1..V7) · quyết 2 cài
  `validate.py:398` (tai-lieu cấm nghe/xem) · trần 25MB→1GB NGƯỜI ký
  (hash `b257efad`; vế git-lfs còn — sống ở T04-8) · `kieu_moc` vào
  `kho.schema.sql` · V6 vế happy = `check_transcript_hien_vat` · T1-T3 FR-044
  = `check_hai_kieu_viec`/`check_dia_chi_mang_ten_nguon` · `slug-moc` đã
  `day_du` trong `dia-chi.json` · quyết 1a: doc-byte qua API LÕI (worker chạy
  thật) — transcript ra hiện vật `.vtt` thật trong kho (2 bản ghi).
- Vận hành: `--that` ĐÃ BẬT (gọi gateway thật, jobs `xong`, egress log) ·
  worker T12-13 + song song T12-23 (`check_worker_*` xanh) · AC-2.1 chặn ở
  cửa · `la_mac_dinh` vào egress · smoke/hàng-đợi: dọn + quy ước
  `CHUNGCAT_HANG_DOI` + `.gitignore` chặn `hang-doi/`·`log/` · pyproject pin
  3 phụ thuộc · catalog 112 dòng đã lọc `tac_vu`.
- Đã vào git: `git ls-files chungcat` = 67.

CÒN MỞ THẬT (giữ [ ]): spec_overview chỏi (G3) · §2-thiếu-nửa enum tong-hop
(kiểm FR-044 phần enum) · chungcat vào CI (T04-8) · `nguong_fuzzy` đo chính
thức trên model thật · dải Hán (khi M13) · khoá constant-time/aud · T12-7
AC-3.1 (thêm nhà=1 dòng+1 file chưa chứng minh chuẩn — gateway một cửa) ·
dia-chi Q5 (M01) · PyMuPDF-ô: cột `giay_phep` mới có ở model.json ($comment),
`bang_khai.py` chưa đòi — vế cổng còn · 201-idempotent (spec chưa câu `da_co`
— T12-14 mục 4 chưa áp) · GET /viec?n=abc int() chưa guard · hai-hàng-đợi:
/health chưa khai đường + RUNNING.md lệnh chạy.

- [ ] **`gan-hien-vat` sinh lại transcript = THÊM entry vtt, KHÔNG THAY —
  vi phạm FR-054 §9.1, người dùng thấy bản CŨ.** Chủ dự án bắt trên màn thật
  2026-09-08: bản ghi `video/doanh-nghiep-mot-nguoi…` mang **2 entry
  text/vtt** trong media[] (đo file kb — 2 sha khác nhau, cùng ten_goc);
  viewer/xuất `find()` lấy bản ĐẦU = bản cũ. FR-054 §9.1 chốt: sinh lại =
  **THAY** trong media[] + bump `ban` (byte cũ vẫn nằm bảng `media`).
  Cổng `check_transcript_hien_vat` có vế "chạy lại = THAY + bump ban" mà
  vẫn xanh ⇒ vế đo thiếu (fixture không tái hiện 2 lần chạy thật?).
  HOTFIX PM 2026-09-08 (đỡ triệu chứng): cctab:2084 + xuat-cua:163 lấy vtt
  **CUỐI** (mới nhất) thay find-đầu — 4 cổng xanh, đã restart.
  ⇒ Dev: (1) worker `gan_hien_vat` THAY entry vtt cũ (giữ khuôn §9.1);
  (2) vế cổng chạy-lại-2-lần-thật ⇒ đúng MỘT entry vtt + ban bump — đỏ được
  trên hành vi append hiện tại; (3) DỌN bản ghi trên (bỏ entry vtt đầu qua
  đường sửa hợp lệ — PM bị classifier chặn PUT script, đúng luật rule 3).
  Tick khi: bản ghi còn 1 vtt + cổng vế mới đỏ được trên fixture append.
  · object: `kb/video/doanh-nghiep-mot-nguoi….md` (2 sha vtt) ·
  `chungcat/src/worker.py::gan-hien-vat` · cctab.inline.ts:2084 · xuat-cua.mjs:163

- [ ] **9/12 cổng mới đỏ bằng TRACEBACK TRẦN — quy ước `_nap.py` chỉ phủ 6
  cổng đời đầu.** Dev mới phát hiện 2026-09-08 khi dựng môi trường: cổng mới
  import worker thẳng nên ThieuGoi không ra exit 3 "ĐỎ SAI LÝ DO" mà nổ
  traceback exit 1 — chẩn sai lý do đỏ, đúng thứ workflow §1a cấm.
  ⇒ (1) phủ _nap.py cho mọi cổng mới; (2) MỘT vế meta: cổng nào import mã
  nguồn mà không qua _nap ⇒ đỏ (quét AST chungcat/tests/) — lỗ không mọc lại.
  · object: chungcat/tests/ (9 cổng liệt kê khi làm) · workflow §1a ⇒ **dev M12**

- [ ] **`seq` egress RESET mỗi restart — 5 sổ cùng bắt đầu từ 1 (21 lần gửi
  thật), AC-6.2 "dựng lại từ log" mất tính duy nhất.** Dev mới đo 2026-09-08.
  **QUYẾT PM 2026-09-08 (khớp thiết kế T12-23)**: KHÔNG gộp lịch sử — mỗi
  lần khởi động mở SỔ MỚI `egress.<worker>.<phien>.jsonl` (phien = mốc mở),
  seq chỉ có nghĩa TRONG một sổ; định danh toàn cục = (worker, phien, seq);
  check_mot_cua_egress + công cụ đọc quét MỌI sổ. Sổ cũ 5 file giữ nguyên
  làm lịch sử, khai một dòng README cạnh log.
  · object: chungcat/hang-doi/egress*.jsonl (5 sổ) · chungcat/src/egress.py ⇒ **dev M12**

- [x] **T12-12 sửa `check_mot_cua_egress.py` mà T12-8 sở hữu — hai đơn vị
  tranh một file.** XỬ PM 2026-09-08 theo tiền lệ (loi-cua.test.js ·
  T03-110b): đơn vị TEST sở hữu thước — vế sửa cổng chuyển thành "T12-8 mở
  rộng CÙNG LƯỢT", T12-12 chỉ giữ mã nguồn. Dev cập nhật dòng khai ở
  T12-12 khi chạm tới. · object: 07_plan/M12_chungcat/tasks/T12-12*.md · T12-8

- [ ] **Douyin không có ảnh bìa** — `yt-dlp` có extractor `[Douyin]` nhưng đòi
      **cookie phiên** ("Fresh cookies (not necessarily logged in) are needed"),
      kể cả với URL dạng chuẩn `/video/<id>` và đã cài `curl_cffi` (đo
      2026-09-09 trên bản ghi thật). Đưa cookie vào là đưa một bí mật vào đường
      egress — quyết định của NGƯỜI, không phải của một task. Nay douyin nằm
      trong `host_khong_lay_anh_bia` và rơi về icon, như docx/pptx.
      object: `chungcat/assets/nguon-transcript.json` khoá `host_khong_lay_anh_bia`

- [ ] **`HOST_TU_XEP` là bản thứ hai của `chien_luoc_anh_bia`** — LÕI (JS) và
      THỢ (Python) trả lời cùng một câu bằng hai đoạn mã, vì LÕI không đọc
      asset của M12. Nay `check_sinh_thumbnail` vế 7e TÍNH danh sách LÕI từ
      bảng khai nên chúng không lệch được, nhưng một nguồn vẫn hơn hai bản +
      một cổng. Gỡ hẳn cần LÕI đọc `nguon-transcript.json` — chạm 2 module ⇒
      BUILD, không phải PATCH. object: `web/api/tho-cua.mjs:219`

- [ ] **Chưa đo phép nới trên một nguồn BÀI GIẢNG** — `WO-077` mở cho model thêm
      mục và dùng bảng; nghiệm thu trên một video kỹ thuật cho ra `## 6.` tự đặt
      tên, nhưng **0 bảng** — đúng, vì nguồn ấy không có danh sách ≥3 cặp nào.
      Mẫu ChatGPT (`tom_tat_buoi_on_thi.pdf`) có **3 bảng**. Cần đo lại khi chủ
      dự án nạp một buổi giảng thật, so trực tiếp với mẫu.
      object: `chungcat/src/worker.py` `_PROMPT`

- [ ] **`ho_so` + `source_type` của bản chưng cất vẫn gõ cứng** — `worker.py`
      luôn ghi `source_type: article` + `ho_so: phan-tich`. `WO-077` nới được
      khung mà không cần đụng hai dòng ấy (vì `validate` không cấm mục thừa),
      nhưng một bản chưng cất từ video vẫn tự khai mình là `article`. Đó là một
      lời khai sai loại, và nó sẽ cắn khi ai đó lọc kho theo `source_type`.
      object: `chungcat/src/worker.py:476-477`

- [ ] **Tab Transcript nói "Chưa có transcript" trong lúc 151 cue đang chạy**
      Ảnh màn 2026-09-09: cửa sổ bài hiện *"Chưa có transcript. Bấm Sinh
      transcript"* trong khi cửa sổ việc bên cạnh hiện *"Đang phiên âm · 151
      câu · tới 10:42"*. Không sai về mặt dữ liệu — bản dở nằm ở file tiến độ
      của việc, chưa thành hiện vật `text/vtt` của bản ghi — nhưng người đọc
      thấy hai màn nói ngược nhau và câu gợi ý dẫn tới xếp THÊM một việc nữa.
      Sửa: tab Transcript đọc luôn tiến độ việc đang chạy của cùng slug.
      object: `web/plugins/cctab/src/cctab.inline.ts:2213` `veTranscript`
