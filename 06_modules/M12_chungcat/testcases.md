# M12_chungcat — testcases

> Mỗi AC **≥1 happy + ≥1 edge**, viết **bằng lời** (đầu vào → kết quả mong đợi).
> Không viết mã test — `m-test` ở s8 là **vai riêng** và giữ nguyên quyền FR ngược
> về đây (R1).
>
> **Phép thử của chính s6**: *viết không nổi testcase cho một AC ⇒ AC đó mơ hồ ⇒
> DỪNG, sửa AC*. Kết quả của phép thử đó ghi ở **§cuối**, không giấu.

## 1 · Vai và ranh giới

**AC-1.1** — không chạm kho
- *happy*: chạy đủ một job chưng cất → `lsof`/audit đường file cho thấy `chungcat/` **không mở** `kb/_kho.sqlite`; mọi lần đọc kho là HTTP `GET` tới `127.0.0.1:8787`.
- *edge*: gieo một dòng `sqlite3.connect(KB)` vào một file bất kỳ trong `chungcat/` → cổng **đỏ** và **nêu đúng file + số dòng** đó (không chỉ nói "có vi phạm").
- *edge 2*: gieo `open(kb/x.md, "w")` → đỏ. (Đọc mã không đủ nếu đường ghi nằm sau một biến — cổng phải bắt cả ca đường dẫn ghép chuỗi.)

**AC-1.2** — bind loopback, cổng đọc từ bảng khai
- *happy*: khởi động, `netstat` cho đúng `127.0.0.1:8790`; đổi `cong` trong `dich-vu.json` thành `8795` rồi khởi động lại → nó bind `8795` mà **0 dòng mã** đổi.
- *edge*: sửa mã bind `0.0.0.0:8790` → đỏ.
- *edge 2*: gõ cứng `8790` trong mã (không đọc bảng) → đỏ, kể cả khi số **trùng** với bảng — vì lần bảng đổi thì mã không đổi theo.

**AC-1.3** — không tự duyệt
- *happy*: job bình thường → hàng nháp đọc lại có `trang_thai: nhap` **và** `review_status: draft`.
- *edge*: payload chứa `review_status: approved` → hàng nháp đọc lại **vẫn** `draft`; và chuỗi `approved` **không** xuất hiện ở bất kỳ cột nào của hàng đó.
- *edge 2*: payload chứa `trang_thai: da_duyet` → bị lột tương tự.

**AC-1.4** — chỉ lời gọi từ LÕI
- *happy*: `POST /job` mang danh tính LÕI → nhận, trả `job_id`.
- *edge*: cùng payload, gọi từ `chatbot:8788` (một THỢ khác trên cùng loopback) → **từ chối**. Đây là ca `AC-1.2` **không** bắt được, nên phải test riêng.
- *edge 2*: gọi không mang danh tính nào → từ chối (**deny**, không rơi về mặc định).

**AC-1.5** — `nguoi_dung_id` do LÕI gán
- *happy*: LÕI tạo job cho tài khoản #3 → hàng job mang `nguoi_dung_id = 3`.
- *edge*: payload tự khai `nguoi_dung_id: 1` trong khi LÕI gán `3` → hàng job mang **`3`**; giá trị `1` **bị bỏ**, không gây lỗi 4xx (lột, không từ chối — để một client cũ không vỡ).

## 2 · Hai kiểu việc

**AC-2.1** — `tong-hop` đòi ≥2 nguồn
- *happy*: `loai: tong-hop-chu-de`, `nguon` 3 slug → job chạy.
- *edge*: `nguon` **1** slug → từ chối, và `egress.jsonl` **không thêm dòng nào** (chứng minh "0 token" — không đo bằng lời khai).
- *edge 2*: `nguon` rỗng `[]` → từ chối cùng cách.

**AC-2.2** — địa chỉ phân giải về slug trong `nguon`
- *happy*: `nguon: [a, b]`, model trả địa chỉ `[a:p.2]` và `[b:p.5]` → bản nháp ghi được.
- *edge*: model trả `[c:p.1]` với `c` **không** trong `nguon` → bản nháp **bị loại tại M12**, không ghi vào bảng nháp; log nêu địa chỉ vi phạm.

**AC-2.3** — mỗi nguồn được nhắc ≥1 lần
- *happy*: `nguon: [a, b]`, thân bài có địa chỉ tới cả `a` và `b` → qua.
- *edge*: `nguon: [a, b]` nhưng thân bài chỉ nhắc `a` → **loại**, và thông báo nêu **`b`** là slug bị bỏ quên (không chỉ nói "thiếu nguồn").

## 3 · Adapter model

**AC-3.1** — một hợp đồng cho mọi nhà
- *happy*: chạy cùng một job qua adapter `anthropic` rồi `deepseek` → hai lần trả **cùng hình dạng** `{text, quotes[]}`; lõi chưng cất **không** phân biệt.
- *edge*: thêm adapter thứ sáu (giả) → `git diff --stat` trên **LÕI** (`chungcat/src/**` TRỪ `adapter/**`) ra **0 dòng**.
- *edge 2*: thêm nhà bằng cách sửa một `if` trong `chungcat/src/dinh_tuyen.py` → **đỏ**, nêu đúng file.
- *edge 3*: sửa một file **trong** `chungcat/src/adapter/` → **KHÔNG** đỏ (ngoài lõi theo định nghĩa) — ca chặn cổng đỏ oan.

**AC-3.2** — quote phải có thật
- *happy*: model trả quote xuất hiện nguyên văn trong nguồn → giữ, và `start`/`end` do **ta** tính khớp vị trí thật.
- *edge*: model trả quote **không** có trong nguồn → khẳng định đó **bị từ chối**, và số khẳng định bị tỉa được ghi lại (không im lặng bỏ).
- *edge 2*: model trả `start`/`end` **sai** kèm quote **đúng** → ta bỏ số của model, dùng số tự tính; kết quả vẫn đúng vị trí.

**AC-3.3** — `citations_*` do máy đếm
- *happy*: bản nháp có 7 địa chỉ nhận dạng, 4 phân giải → `citations_sampled: 7`, `citations_verified: 4`.
- *edge*: model khai `citations_sampled: 99` trong output → số đó **bị bỏ**; hàng nháp vẫn `7`.

## 4 · Định tuyến model

**AC-4.1** — 0 tên model trong mã
- *happy*: `grep -iE "claude|gpt|gemini|deepseek|kimi|sonnet|opus"` trong `chungcat/**/*.py` trừ `assets/` → **0 dòng**.
- *edge*: gieo `if model == "claude-opus-5":` vào một file → đỏ, nêu đúng file+dòng.

**AC-4.2** — định tuyến theo TỈ LỆ Hán
- *happy*: tài liệu **95%** Hán → chọn nhà khai cho `zh`.
- *edge*: tài liệu **80% Việt + 20% Hán** → **KHÔNG** chọn nhà `zh` (đây là ca chỉ đạo nêu đích danh).
- *edge 2*: đổi ngưỡng trong `model.json` từ 50% xuống 15% → cùng tài liệu 20% Hán **nay** chọn `zh`, và **0 dòng mã** đổi.
- *edge 3*: tài liệu 0 ký tự Hán nhưng model **tự khai** `ngon_ngu: zh` trong output → lời khai bị bỏ; định tuyến theo số máy đếm.

**AC-4.3** — dự phòng cùng khu vực
- *happy*: model chính chết → rơi sang `du_phong` **cùng `khu_vuc`**, job xong.
- *edge*: `model.json` khai `du_phong` trỏ sang dòng khác `khu_vuc` **không** có cờ `cho_phep_cheo_khu_vuc` → **đỏ ở cổng khai báo**, trước khi chạy job nào.
- *edge 2*: cùng cấu hình đó **có** cờ tường minh → xanh.

**AC-4.4** — ghi model ĐÃ DÙNG
- *happy*: không có dự phòng → `model_da_dung` = model được chọn.
- *edge*: dự phòng bắn → `model_da_dung` = model **dự phòng**, không phải model được chọn; và `egress.jsonl` cũng ghi model dự phòng.

## 5 · Hàng đợi, idempotency, trần gửi

**AC-5.1** — idempotency theo ULID
- *happy*: nạp ULID `X` → một bản nháp.
- *edge*: nạp lại **cùng** ULID `X` → vẫn **một** bản nháp, và `egress.jsonl` **không thêm dòng** (chứng minh 0 lời gọi model).

**AC-5.2** — hàng đợi nguyên tử
- *happy*: job chạy bình thường → file đi `tmp/` → `new/`.
- *edge*: `kill -9` giữa lúc ghi → `new/` **không** chứa file nửa vời; file còn trong `tmp/`; chạy lại thành công.

**AC-5.3** — trần 2 lần GỬI
- *happy*: model lỗi 1 lần rồi thành công → 2 dòng `egress.jsonl`.
- *edge*: model lỗi liên tục → đúng **2** lần gửi, đúng **2** dòng log; lần thứ 3 **không xảy ra**.
- *edge 2*: hai lần gửi payload **y hệt nhau** → vẫn **2** dòng log (không gộp/dedupe).

**AC-5.4** — checkpoint theo giai đoạn
- *happy*: job hỏng ở `dang-verify` → chạy lại từ đó, **0** lời gọi model, `lan_gui` **không tăng**.
- *edge*: job hỏng ở `dang-doc-nguon` → chạy lại tốn **0** egress (chưa từng gửi).
- *edge 2*: xoá bản lưu phản hồi model rồi chạy lại từ `dang-verify` → hệ phải **nói ra** là phải gọi lại model (và trừ `lan_gui`), không âm thầm gọi.

**AC-5.5** — `lan_gui` bền qua chạy lại
- *happy*: chạy lại 5 lần từ `dang-verify` → `lan_gui` giữ nguyên.
- *edge*: `lan_gui = 2`, bấm *"chạy lại từ đầu"* → **từ chối kèm lý do**, và lý do nêu được đường ra (*"tạo job mới"*); **không** im lặng không làm gì.
- *edge 2*: tạo job **mới** cùng nội dung → chạy được, `lan_gui` của job mới bắt đầu từ 0, và `egress.jsonl` có dòng mới với ULID mới.

## 6 · Egress

**AC-6.1** — một cửa, log trước khi gửi *(đo bằng `seq`, không bằng đồng hồ)*
- *happy*: một job → dòng log mang `seq=1`, và **payload đã gửi cũng mang `seq=1`**; hai số khớp.
- *edge*: giả lập request **không bao giờ hoàn thành** → dòng log `seq=N` **vẫn tồn tại**. Đây là ca chứng minh log đi trước — cài đặt log-sau **không có dòng nào**.
- *edge 2*: hai lần gửi → `seq` **1** rồi **2**; không trùng, không nhảy cóc.
- *edge 3*: gieo cài đặt ghi log **sau** khi `httpx.post` trả về → ca *edge* đầu **đỏ**, chứng minh cổng phân biệt được hai thứ tự.
- *edge 4*: gieo một `httpx.post` ở file khác → đỏ.

**AC-6.2** — `sha256` khớp payload đã gửi
- *happy*: dựng lại payload từ log rồi băm → **cùng** `sha256`.
- *edge*: hai lần thử với prompt khác nhau (checkpoint) → **hai** `sha256` khác nhau, không phải cùng một.
- *edge 3*: băm **file nguồn** thay vì payload → không khớp ⇒ đỏ. (Đây là chỗ dễ cài sai nhất.)

**AC-6.3** — allowlist đích
- *happy*: gọi host có trong `model.json` → qua.
- *edge*: gọi host không khai → **chặn trước khi mở socket** (đo bằng: không có kết nối TCP nào ra host đó, không chỉ là "request trả lỗi").

## 7 · Engine cắm rút

**AC-7.1** — đổi bảng đổi engine
- *happy*: đổi `chu_de → engine` trong bảng → engine thực dùng đổi theo, `git diff` mã = **0 dòng**.
- *edge*: bảng trỏ một engine **không tồn tại** → đỏ **ở cổng khai báo**, không phải lỗi lúc chạy job.

---

# PHẦN II · Ca sinh từ NGHIÊN CỨU KỸ THUẬT — `01_research/m12-ky-thuat-trien-khai.md`

> Bổ sung 2026-09-03. Nghiên cứu kỹ thuật (khảo 09-02, PHẦN C thêm 09-03) tìm ra
> **bốn chỏi spec · hai lỗ spec · một cơ hội**, cộng cả một đường dữ liệu mới
> (video). Mỗi mục dưới đây là **testcase cho hợp đồng SAU khi FR được duyệt**.
>
> ⚠️ **`spec.md` và `rules.md` của M12 đang FROZEN.** File này **không** frozen,
> nên ca viết được ngay — nhưng ca nào giả định một hợp đồng **chưa duyệt** thì
> phải mang nhãn **`CHỜ FR-053`** hoặc **`CHỜ FR-054`**. Không nhãn thì lượt sau
> đọc nó như thoả thuận đã có.
>
> Giá trị của việc viết bây giờ: nó là **đặc tả cho s8**, và nó buộc mỗi sửa-đổi
> phải *đo được* trước khi ai viết một dòng mã. Đúng lý lẽ mà `spec M03 §2.7` đã
> viết cho ca ngược (*"viết lệnh ra bây giờ buộc AC phải đo được"*).

## 8 · `AC-3.2` phải có HAI VẾ — nghiên cứu chỉ đích danh mục này 〔CHỜ FR-053〕

Nghiên cứu `§2` viết nguyên văn: *"Cổng phải có HAI vế, không một (đây là chỗ
`testcases.md` nên thêm)"*. Lý do là một lỗi **đã trả giá một lần** ở
`FR-046`/`LOCATOR_RE`: cổng *"xanh khi mọi quote khớp"* **nghiệm đúng bằng cách
từ chối tất cả** — nó không phân biệt được *"không có khẳng định nào"* với *"mọi
khẳng định đều sai"*.

**AC-3.2** — quote phải có thật, **và** cổng không được đỏ oan
- *happy*: quote nguyên văn → giữ, `start`/`end` do **ta** tính.
- *vế 1 · bắt được BỊA*: quote **không** có trong PDF → khẳng định **bị từ chối**,
  số khẳng định bị tỉa **được ghi lại**.
- *vế 2 · KHÔNG đỏ oan* — bốn nguyên nhân **độc lập**, mỗi cái một fixture, vì
  một fixture gộp cả bốn không nói được cái nào chưa xử lý:
  - **ligature**: nguồn có `ﬁ` (một ký tự Unicode), model trả `fi` (hai chữ) → **XANH**
  - **gạch nối cuối dòng**: nguồn có `boost-\ning`, model trả `boosting` → **XANH**
  - **khoảng trắng**: nguồn có `\n` giữa câu (PDF cột đôi cho khoảng trắng kép),
    model trả một space → **XANH**
  - **model chuẩn hoá**: nguồn có `"` `—`, model trả `"` `-` → **XANH**
- *edge*: quote đúng **97%** với một từ bị ASR/OCR sai → XANH ở tầng 3, và kết quả
  mang **điểm** + `tang: "fuzzy"`, không mang `diem: 100`. Một cổng gộp hai tầng
  vào một nhãn làm mất thông tin *"cái này khớp gần, không khớp đúng"*.
- *edge 2*: quote đúng **60%** → **TỪ CHỐI**. Ngưỡng phải ở **bảng khai**, không
  trong mã: đổi `nguong` từ 0.9 xuống 0.5 ⇒ ca 60% **nay XANH**, **0 dòng mã** đổi.
- *edge 3*: `nguong = 0` → mọi quote XANH. Ca này phải **đỏ ở cổng khai báo**,
  không phải chạy rồi mới biết — một ngưỡng vô hiệu hoá cả `AC-3.2`.
- *edge 4*: hai trang **đều** khớp fuzzy → trả trang có **điểm cao nhất**, tất
  định. Nếu hai trang **cùng điểm** thì phải chốt một quy tắc (trang nhỏ hơn), vì
  không chốt là kết quả đổi giữa hai lượt chạy trên cùng đầu vào.
- *edge 5*: `partial_ratio_alignment` trả **cả vị trí** ⇒ `p.7` lấy từ đó, **không**
  chạy thêm một phép tìm. Phép thử: gieo hai cài đặt cùng kết quả, đòi cái chỉ
  gọi **một** lần.

⚠️ **`nguong` là số phải ĐO, không đoán** — nghiên cứu `§2` chốt thế, cùng lý do
`M6.2` chưa đặt trần token. Kho có **1** PDF, nên phép đo phải chạy 10 quote thật
trước khi chốt số. Cho tới lúc đó, `nguong` trong bảng khai phải mang
`$vi_sao` + **"CHƯA KIỂM CHỨNG"**, cùng khuôn `nguong-loi.json`.

## 9 · Citations API là **400**, không phải "kém tối ưu" 〔CHỜ FR-053〕

Nghiên cứu `§3` (đọc tài liệu Anthropic): `citations: {enabled: true}` là
*"Incompatible with `output_config.format` (**returns a 400**)"*. Mà `spec §3` khai
hợp đồng `(prompt, tài_liệu) → {text, quotes[]}` — tức **structured output**.

**AC-3.1 · vế mới** — một hợp đồng cho mọi nhà, **không nhánh Citations**
- *happy*: chạy cùng job qua `anthropic` rồi `deepseek` → cùng hình dạng
  `{text, quotes[]}`.
- *edge*: quét `chungcat/src/**` tìm `citations` → **0** chỗ **bật** nó. Cột
  `ho_tro_citations` trong `model.json` được **giữ làm cột thông tin**, không làm
  cột **điều khiển** ⇒ phép thử: đổi cột đó từ `true` sang `false` → hành vi
  **KHÔNG** đổi. Đây là ca phân biệt *cột mô tả* với *cột điều khiển*, và nó là
  cách duy nhất chứng minh Citations đã ra khỏi hợp đồng.
- *edge 2*: nếu ai đó bật Citations **cùng** schema → **400**. Phép thử phải đòi
  cổng chặn **trước khi mở socket** (`AC-6.3` cùng khuôn), không đòi *"xử lý 400
  cho đẹp"* — một lời gọi chắc chắn 400 vẫn là một lần **tài liệu rời máy** nếu
  nó tới được socket.

⚠️ Lý lẽ mạnh nhất cho việc bỏ nằm ở chính `model_flow §4`: *"nếu đường Claude bỏ
qua `V` thì `V` chỉ được chạy trên các nhà khác, và một lỗi trong `V` sẽ không bao
giờ lộ ra ở đường phổ biến nhất"*. ⇒ `V` **luôn** chạy ⇒ Citations không mua thêm
gì, chỉ thêm một nhánh mã và một đường ít được kiểm.

**Giới hạn PDF phải có cổng** (fact: base64 **32 MB**/request · **600 trang**,
100 trang với context 200K):
- *edge 3*: `tong-hop-chu-de` gộp N nguồn vượt **32 MB** → chặn **TRƯỚC** khi tính
  `sha256` và **TRƯỚC** khi ghi `egress.jsonl`. Vượt mà log rồi mới 400 nghĩa là
  log ghi **một lần gửi không bao giờ xảy ra** — và đó làm hỏng đúng thứ
  `AC-6.2` (*dựng lại từ log rồi băm ra cùng số*) đang bảo đảm.
- *edge 4*: một nguồn **601 trang** → chặn, và thông báo nêu **trang**, không nêu
  byte (hai trần khác nhau, hai nguyên nhân khác nhau).

## 10 · `AC-5.2` — tiền đề SAI trên nền tảng đang chạy 〔CHỜ FR-053〕

`spec §5` trả lời *"thợ chết giữa chừng"* bằng *"`os.replace` **nguyên tử** nên
không có trạng thái nửa vời"*. Nghiên cứu `§4`: `os.replace` gọi
`MoveFileEx(MOVEFILE_REPLACE_EXISTING)`, và **MoveFileEx không được bảo đảm nguyên
tử** — *"under certain and unknown circumstances it may silently fall back to a
non-atomic call to `CopyFile()`"*.

**Máy phát triển là Windows 10.** ⇒ Tiền đề của một AC `hard` là mệnh đề **sai
trên nền tảng đang chạy**, và cổng sẽ **xanh** vì crash-đúng-chỗ là ca hiếm — đúng
kiểu hỏng im lặng mà cả dự án tồn tại để chống.

**AC-5.2** — đo **tính chất**, không đo **niềm tin**
- *happy*: job chạy bình thường → file đi `tmp/` → `new/`.
- *vế mới 1 · đích LUÔN DUY NHẤT*: mọi file trong `new/` mang tên `<ULID>.json` ⇒
  `os.replace` chạy vào đường **rename không đè**, và fallback `CopyFile` (chỉ
  liên quan khi phải **thay** file đang có) hết cửa. Phép thử: gieo một cài đặt
  ghi `new/<slug>.json` (tên **lặp lại được**) → **đỏ**. Đây là luật, không phải
  tình cờ, nên phải có cổng.
- *vế mới 2 · N lần giết*: `kill -9` **50 lần** ở thời điểm ngẫu nhiên → `new/`
  **không chứa JSON parse-lỗi nào**. Đây là **tính chất đo được** thay cho mệnh đề
  *"os.replace nguyên tử"* — và nó đúng bất kể OS.
- *edge*: `kill -9` giữa lúc ghi → file còn trong `tmp/`, chạy lại thành công.
- *edge 2*: một file trong `tmp/` **mồ côi** sau 50 lần giết → phải có đường dọn,
  và dọn phải **nói ra**. `tmp/` đầy dần là hỏng chậm, không phải hỏng im lặng —
  nhưng nó cũng không tự lành.
- *edge 3*: nếu về sau job có bước **ĐÈ** file trong `new/` → mục này **phải xét
  lại**, và ô `backlog` mở **ngay lúc bước đó xuất hiện**, không đợi nhớ.

## 11 · Trần 2 lần gửi ĐỤNG tỉ lệ trượt schema 〔CHỜ FR-053〕

Hai luật đúng riêng, sai khi gặp nhau: `M12-R4`/`AC-4.2` (tiếng Trung → Kimi hoặc
DeepSeek) và `M12-R6` (trần **2** lần gửi, `lan_gui` không reset).

Fact: tỉ lệ lệch schema **DeepSeek JSON 5–12%** (OpenAI Structured <0.1% ·
Anthropic tool use <0.2%). ⇒ Xác suất **hai lần liên tiếp** đều lệch là
**0.25%–1.4%** — cỡ **1/70 đến 1/400 job tiếng Trung chết vĩnh viễn** vì nhiễu
định dạng, không vì nội dung.

**AC-5.3** — trần 2 lần gửi, và **nói rõ đã chết vì gì**
- *happy*: model lỗi 1 lần rồi thành công → **2** dòng `egress.jsonl`.
- *edge*: lỗi liên tục → đúng **2** lần gửi, lần thứ 3 **không xảy ra**.
- *vế mới 1*: phản hồi **không parse được** (JSON lệch schema) → **VẪN** tăng
  `lan_gui`. Không có lối lách: **một byte đã rời máy là đã rời.** Phép thử: giả
  lập hai lần trả JSON lệch → `lan_gui = 2`, **2** dòng log.
- *vế mới 2 · thông báo phân biệt được hai nguyên nhân*: `lan_gui = 2` mà **cả
  hai** lần đều lệch schema → thông báo phải nói **rõ điều đó**, vì hành động đúng
  là *tạo job mới với nhà khác*, **không** phải *sửa bài*. Một thông báo
  *"job lỗi"* chung cho cả hai nguyên nhân đẩy người dùng đi sai đường.
- *vế mới 3 · `kieu_structured` là cột cổng đọc*: nhà chỉ có `json_mode` ⇒ schema
  phải **phẳng** (`{text, quotes[]}`, không lồng). Phép thử: gieo một nhà
  `json_mode` với schema **lồng** → đỏ **ở cổng khai báo**.
- *vế mới 4 · `nguong_lech_schema`*: nhà vượt ngưỡng **không được** là `du_phong`
  cho tác vụ chưng cất → đỏ ở cổng khai báo, cùng khuôn `AC-4.3`.
- *edge 2*: hai lần gửi payload **y hệt** → vẫn 2 dòng log (không dedupe).

## 12 · Batch API — cơ hội, nhưng nó ĐẢO thứ tự `M12-R3` 〔CHỜ FR-053〕

Batch chạy ở **50% giá**, và `ADR-05` đã bắt M12 bất đồng bộ sẵn (`POST` trả
`viec_id`) — đúng hình dạng Batch, với `custom_id` = `job_ulid` (thứ `AC-5.1` đã
chọn làm khoá idempotency).

**Chỗ dễ cài sai, và nó phá đúng luật quan trọng nhất của module:**

**AC-6.1 · vế mới cho `che_do: batch`**
- *happy*: submit một batch 5 request → **5** dòng `egress.jsonl`, ghi **tại thời
  điểm submit**, `seq` cấp **trước khi mở socket**.
- *vế mới 1*: gieo cài đặt ghi log **lúc đọc kết quả** → **đỏ**. Với Batch, *"gửi"*
  là **lúc submit**, không phải lúc lấy kết quả. Ai log lúc đọc là **đảo đúng thứ
  tự** `M12-R3` sinh ra để giữ.
- *vế mới 2 · ca thất bại là ca quan trọng nhất*: batch trả `expired` hoặc
  `errored` → **vẫn** có 5 dòng log. Cài đặt log-lúc-đọc cho **0 dòng** ở đúng ca
  này, tức **đúng lúc cần biết nhất thì không biết**.
- *vế mới 3*: kết quả Batch trả **không theo thứ tự** → khoá bằng `custom_id`,
  **không** bằng vị trí. Phép thử: giả lập trả đảo ngược → mỗi kết quả về đúng job.
- *edge*: `che_do: sync | batch` là **một dòng bảng khai** ⇒ đổi nó thì hành vi đổi,
  **0 dòng mã**. Đây là ca thật thứ hai cho `AC-7.1`.

## 13 · Giấy phép là thứ KHÔNG cổng nào bắt được 〔CHỜ FR-053〕

Nghiên cứu `§1`: PyMuPDF/MuPDF là **AGPL** hoặc thương mại, và điều kiện kích hoạt
AGPL là *"triển khai công khai — gồm cả tool nội bộ, SaaS, hosted API"*. `FR-045`
vừa thêm 5 tài khoản và `M17_cong` nghe **443** ⇒ hệ **sẽ** được triển khai cho
người khác dùng. `pdfplumber` là **MIT**.

**AC mới · `thu_vien_pdf` + `giay_phep` trong bảng khai**
- *happy*: bảng khai có dòng `pdfplumber` + `giay_phep: MIT` → cổng xanh.
- *edge*: một phụ thuộc có `giay_phep` **rỗng** hoặc `"chưa kiểm"` → **đỏ**. Đây
  là cách duy nhất biến giấy phép thành thứ **đọc được** thay vì thứ **nhớ ra**:
  `check_*` không đỏ vì AGPL, CI xanh, và vấn đề nổ ba năm sau ở dạng **một lá thư**.
- *edge 2*: quét `chungcat/**` tìm `import fitz` / `pymupdf` → **0**.
- *edge 3*: `CTranslate2` (dưới `faster-whisper`) `giay_phep` *chưa kiểm* → đỏ tới
  khi kiểm. Nghiên cứu `§20` tự khai điều này — bài học `PyMuPDF` áp cho **mọi**
  phụ thuộc mới, không riêng PDF.

⚠️ Tốc độ **không** là ràng buộc: PyMuPDF nhanh 8–12× nhưng M12 chạy *phút* theo
`ADR-05`, và một PDF 23 trang ở 18 trang/giây là **~1.3 giây** — nhỏ hơn nhiễu của
một lời gọi model. Đổi 10× tốc độ **ở chỗ không ai đo** để lấy một giấy phép sạch
là đổi đúng chiều.

---

# PHẦN III · Đường VIDEO — `sinh-transcript` 〔CHỜ FR-054〕

> `FR-054` đang **chờ duyệt**. Bảy cổng `V1`–`V7` của nó viết thành testcase ở đây
> để chúng *đo được* trước khi ai viết mã — và để phép thử s6 chạy trên chúng.
>
> ⚠️ Nếu `FR-054` bị trả lại hoặc đổi hình dạng, **cả PHẦN C này phải viết lại**.
> Nó không phải thoả thuận đã có.

## 14 · `AC-V1` — hiện vật `.vtt` mang đủ ba trường dẫn xuất

- *happy*: job `sinh-transcript` xong → hiện vật có `la_dan_xuat: 1` +
  `la_asr: true` + **model ASR đã dùng**.
- *edge*: thiếu **một** trong ba → đỏ. Ba ca riêng, không một ca thiếu cả ba:
  thiếu cả ba thì một cài đặt chỉ kiểm trường đầu vẫn xanh.
- *edge 2*: transcript do **người dán** (không qua ASR) → `la_asr: false`, và
  trường model ASR **vắng** hoặc `null`, **không** mang tên một model không chạy.
- *edge 3*: `la_dan_xuat: 1` ⇒ exporter **BỎ QUA** dòng đó (`kho.schema.sql:177`).
  Phép thử: sinh transcript rồi `xuat_kho` → **0** file `.vtt` trong `kb/`, và
  vòng thứ hai vẫn **0 file ghi** (fixpoint). Đây là vế `la_dan_xuat` **thật sự có
  tác dụng**, không chỉ có mặt.

⚠️ Vì sao ba trường này là **cổng**, không phải trang trí: với đường ASR, chữ
*"verified"* **đổi nghĩa** — `V` chỉ bảo đảm *"quote có trong **transcript của
ta**"*, không bảo đảm *"người trong video có nói thế"*. `credibility_max` là chỗ
sự khác biệt đó được chấm, và `M01-R2` **cấm máy điền** nó. Nên người chấm phải
**thấy được** mình đang chấm một hiện vật dẫn xuất.

## 15 · `AC-V2` — audio KHÔNG vào kho, và BỊ XOÁ khi job xong

Nghiên cứu gọi đây là *"cổng dễ quên nhất"*, vì **audio là thứ nặng nhất trong
toàn hệ**.

- *happy*: job xong → `kb/**` **0 byte audio**; Maildir của job **0 file audio**.
- *edge*: job **hỏng giữa chừng** (`kill -9` lúc đang ASR) → chạy lại, và sau khi
  job đóng vẫn **0 file audio**. Một job hỏng để lại audio là ca cổng phải bắt,
  và nó là ca **duy nhất** phân biệt *"xoá ở đường thành công"* với *"xoá thật"*.
- *edge 2*: một hàng `media` có mime khớp `^(audio|video)/` → **đỏ**. Đây là vế
  đo **kho**, khác vế đo **thư mục job** ở trên; hai chỗ, hai phép đo.
- *edge 3*: job bị **hủy** giữa lúc tải audio (lối `tai_ve`) → file tải dở bị xoá,
  không nằm lại `tmp/`.
- *edge 4*: **hai** job cùng video chạy song song → không job nào xoá audio của
  job kia. Địa chỉ file tạm phải mang `job_ulid`, không mang `slug`.

⚠️ **`AC-V2 edge 2` hôm nay ĐỎ ĐƯỢC, và nó cần một cổng chưa có** — xem
`backlog.md` ô *"`FR-039` chỏi `FR-054 §4.2`"*. Đo 2026-09-03: `luuHienVat` **nhận**
`video/mp4` · `audio/mpeg` · `video/quicktime` · `video/x-matroska` · `video/webm`
(201), tới trần 25 MB. Tức luật *"không byte video vào kho"* đang sống bằng **chữ**.

## 16 · `AC-V3` · `AC-V4` — hai nghĩa của chữ *egress*, một cột phân biệt

`tai_ve` **vẫn là lời gọi ra Internet** dù không gửi dữ liệu của ta đi. Trộn hai
nghĩa vào một cột là *"cách con số này bắt đầu nói dối"* (`FR-054 §1.5`).

**`AC-V3`** — `egress.jsonl` ghi **lối đã dùng** + `tieu_egress`
- *happy*: lối `ytdlp-asr-local` → một dòng log, `tieu_egress: false`, và
  `sha256` payload **vắng** (không có payload của ta nào rời máy).
- *happy 2*: lối `dich_vu` → một dòng, `tieu_egress: true`, **có** `sha256` payload.
- *happy 3*: lối `file-nguoi-tai` → **0** dòng (không chạm mạng).
- *edge*: báo cáo egress phải **phân biệt được** ba lối. Phép thử: sinh 3 transcript
  bằng 3 lối → báo cáo cho **3** con số khác nhau, không một tổng gộp. Không phân
  biệt được thì `FR-043` bậc 4 mất câu trả lời nó tồn tại để trả.
- *edge 2*: `tieu_egress` **vắng** trong một dòng log → đỏ. Cột bỏ trống là cột
  đọc được thành `false` một cách im lặng.

**`AC-V4`** — `tai_ve` và `dich_vu` đều qua **cửa egress duy nhất**
- *happy*: cả hai lối đi qua hàm `gui()`; host trong allowlist.
- *edge*: một `yt_dlp.download()` **ngoài** hàm egress → đỏ, nêu đúng file+dòng.
- *edge 2*: một `httpx` ngoài hàm egress → đỏ.
- *edge 3*: host nền tảng (`youtube.com`) **không** trong allowlist → chặn **trước
  khi mở socket**. ⚠️ Đây là ca nghiên cứu `§18` cảnh báo: `youtube.com` là một
  đích **trông hợp lý**, nên `AC-6.3` sẽ **không** bắt được nếu ai thêm nó vào
  allowlist mà không hỏi. Cổng máy không thay được người ký ở đây.
- *edge 4*: `yt-dlp` **không pin version** → đỏ. `FR-054 §2.2` khai đây là điều
  kiện của phán quyết, không phải khuyến nghị: *"nó đổi nhanh theo nền tảng; đó là
  bản chất của lối này, không phải một rủi ro có thể vá"*.

## 17 · `AC-V5` — bảng khai `nguon_transcript` đổi hành vi, 0 dòng mã

- *happy*: thêm một dòng `nguon_transcript` → lối mới dùng được, `git diff` mã
  **0 dòng**.
- *edge*: **bớt** một dòng → lối đó không còn được thử, và hệ **nói ra** thay vì
  im lặng bỏ qua.
- *edge 2*: đổi `uu_tien` → **thứ tự thử đổi theo**. Phép thử phải đo *thứ tự*, vì
  một cài đặt đọc bảng mà sắp bằng thứ tự file vẫn xanh ở ca một-lối.
- *edge 3*: **mọi** lối trong bảng thất bại → thông báo nêu **từng** lối đã thử và
  lý do từng cái, không nói *"không lấy được transcript"*.
- *edge 4*: bảng trỏ một `loai` **không tồn tại** (không phải `file|tai_ve|dich_vu`)
  → đỏ **ở cổng khai báo**, trước khi chạy job nào.

## 18 · `AC-V6` — cổng PHỤ THUỘC, và nó phải ĐỎ hôm nay

`FR-054` khai `FR-052` (`media` thành mảng) là **phụ thuộc CỨNG**: không áp thì
transcript **ghi đè** hiện vật đang có của bản ghi.

- *happy*: bản ghi video đã có 1 hiện vật → sinh transcript → **2** hiện vật, cái
  cũ **nguyên vẹn** từng byte.
- *edge*: `media` còn là **object** (⇒ `FR-052` chưa áp) mà vẫn cho ghi → **đỏ**.
- ✅ **Đo 2026-09-03: `FR-052` ĐÃ ÁP.** `frontmatter.schema.json` khai
  `media.type = "array"`, `minItems = 1`. Nên ca *edge* trên **không tái hiện được
  nữa** trên schema hiện tại, và đó là tin **tốt** — nhưng nó nghĩa là `AC-V6` giờ
  đo một điều **đã đúng**. ⇒ Vế còn giá trị là ca *happy*: **hai** hiện vật cùng
  tồn tại, và cái cũ không mất.
- *edge 2*: sinh transcript **hai lần** cho cùng bản ghi → **thay** hiện vật `.vtt`
  cũ hay thêm cái thứ hai? `FR-054` **không nói**. Hai hành vi cho hai kết quả rất
  khác (một bản ghi có 3 hiện vật, hay 2), và `§1.3` lấy *"sinh lại transcript"*
  làm một trong ba lý do chọn job riêng ⇒ ca này **sẽ xảy ra**.

## 19 · `AC-V7` — magic `WEBVTT` là lớp thứ sáu, và nó phải THẬT

`media-mime.json` khai `magic` là *"LỚP THỨ SÁU của intake"* — lớp **duy nhất** soi
byte, tồn tại vì năm lớp kia không lớp nào soi.

- *happy*: file bắt đầu `WEBVTT` (`5745425654`) dán nhãn `text/vtt` → nhận.
- *edge*: file dán nhãn `text/vtt` mà byte mở đầu **khác** → **từ chối**.
- *edge 2*: một JSON (`{`) dán nhãn `text/vtt` → từ chối. Đây là ca giải thích vì
  sao **không** chọn `application/json`: `{` là **một byte** (`7b`) xuất hiện ở đầu
  vô số thứ, nên nó sẽ là *"mục đầu tiên trong bảng làm yếu lớp thứ sáu"*.
- *edge 3*: file VTT **hợp lệ** nhưng có BOM UTF-8 trước `WEBVTT` → phải chốt một
  hành vi. Chuẩn W3C cho phép BOM; một phép so byte thô sẽ **từ chối oan**.
- *edge 4*: VTT rỗng (chỉ dòng `WEBVTT`) → nhận ở tầng magic, và bị chặn ở đâu?
  Một transcript 0 đoạn không dùng được cho `dinh_vi()`.

## 20 · `dinh_vi()` dùng LẠI — cùng hàm, đổi ĐƠN VỊ NEO

Kết quả đáng giá nhất của nghiên cứu PHẦN C: **thành phần rủi ro cao nhất của M12
không phải viết lại cho video.** PDF cho `neo = trang`, transcript cho `neo = mốc`.

- *happy*: cùng `dinh_vi(quote, khoi, nguong)` chạy trên `khoi` = trang → trả `7`;
  trên `khoi` = đoạn transcript → trả `03:15`.
- *edge*: `AC-3.2` phủ **cả hai** bằng **cùng** một cổng, **thêm một fixture** —
  không thêm một nhánh mã. Phép thử: `git diff` trên `verify.py` khi thêm đường
  video ra **0 dòng**.
- *edge 2*: `dia-chi.json` đã khai `moc_thoi_gian` `[t=03:15]` hợp lệ ⇒ định dạng
  neo **không** phải thứ mới. Phép thử: một địa chỉ `[t=03:15]` phân giải được
  **trước khi** có đường video nào — tức bảng khai đã sẵn.
- *edge 3*: đường video **dễ hơn** PDF ở đúng chỗ khó: không ligature, không
  gạch-nối-cuối-dòng, vì model đọc **chính** transcript ta đưa ⇒ hai vế của phép so
  cùng một nguồn văn bản. Phép thử: tỉ lệ khớp ở **tầng 2** (chính xác) trên đường
  video phải **cao hơn** đường PDF. Nếu nó thấp bằng nhau, một bước chuẩn hoá đang
  chạy sai chỗ.
- *edge 4*: mốc thời gian **vượt** độ dài video (`[t=99:99]`) → từ chối, cùng cách
  `[a:p.999]` bị từ chối cho một PDF 23 trang.

## 21 · Nhịp ③ — cổng NGƯỜI, và nó không có lệnh nào đo được

`FR-054 §1.4` đòi *"người đọc/sửa được transcript trước ④"*. Không có nhịp này thì
`credibility_max` — thứ `M01-R2` cấm máy điền — **không có cái thật để chấm**.

- *happy*: người mở transcript, sửa một câu ASR sai, lưu → hiện vật `.vtt` đổi
  `sha256`, và `la_asr` **vẫn** `true` (nó vẫn sinh từ ASR, chỉ được sửa tay).
- *edge*: người sửa xong → bản `phan-tich` chưng cất sau đó dùng **bản đã sửa**,
  không dùng bản gốc ASR.
- *edge 2*: chưng cất **trước khi** ai đọc transcript → được phép (không chặn),
  nhưng `credibility_max` phải **để trống** cho người chấm. Chặn cứng ở đây là
  chặn một người biết mình đang làm gì.
- `soft` — *"người có thật sự đọc không"* **không lệnh nào đo được**. Vế đo được là
  *"transcript sửa được"* và *"bản sửa là bản được dùng"*; hai ca trên phủ chúng.

⚠️ Đây là AC duy nhất của đường video mà **giá trị nằm ở thao tác người**. Ghi
`soft` ngay từ s6 thay vì khai `hard` rồi tụt — `R3` nói `hard` không có lệnh chạy
được **là** `soft`.

---

## Kết quả phép thử của s6 — hai AC mơ hồ, ĐÃ SỬA

s6 nói: *viết không nổi testcase ⇒ AC mơ hồ ⇒ DỪNG, sửa AC*. Chạy phép thử trên
24 AC: **22 viết được ngay**, hai cái không. Cả hai **đã sửa hợp đồng** (chủ dự án
chốt 2026-09-02), và nay viết được testcase:

**a · `AC-3.1`** — bản đầu nói *"0 dòng ở lõi"* mà **không định nghĩa lõi**.
Không chốt thì cổng hoặc đỏ oan (đụng một file phụ) hoặc không đỏ được (lõi rộng
tới mức mọi thay đổi đều nằm ngoài).
**Đã sửa**: `LÕI = chungcat/src/** TRỪ chungcat/src/adapter/**`.
- *happy*: thêm nhà thứ sáu → `git diff --stat` trên `chungcat/src/` trừ
  `adapter/` ra **0 dòng**; `model.json` +1 dòng; `adapter/` +1 file.
- *edge*: thêm nhà bằng cách sửa một `if` trong `chungcat/src/dinh_tuyen.py`
  → **đỏ**, và nêu đúng file đó.
- *edge 2*: sửa một file trong `chungcat/src/adapter/` → **KHÔNG** đỏ (nó ngoài
  lõi theo định nghĩa) — ca này chặn cổng đỏ oan.

**b · `AC-6.1`** — bản đầu nói *"log trước khi gửi"* mà **không nói đo bằng gì**.
Đo *"dòng log có tồn tại"* thì một cài đặt **log-SAU-khi-gửi vẫn xanh** ở ca thành
công; còn so timestamp của ta với của request là so **hai đồng hồ khác nhau**.
**Đã sửa**: cửa egress cấp `seq` tăng dần; log mang `seq`, payload gửi đi mang
cùng `seq`.
- *happy*: một job → dòng log `seq=1`, và payload đã gửi mang `seq=1`; hai số khớp.
- *edge*: giả lập request **không bao giờ hoàn thành** → dòng log `seq=N` **vẫn
  tồn tại**. (Đây là ca chứng minh log đi trước — cài đặt log-sau không có dòng nào.)
- *edge 2*: hai lần gửi → `seq` **1** rồi **2**, không trùng, không nhảy cóc.
- *edge 3*: gieo một cài đặt ghi log sau khi `httpx.post` trả về → ca *edge* đầu
  **đỏ**, chứng minh cổng phân biệt được hai thứ tự.

**Không còn AC nào của M12 viết không nổi testcase** — đúng tại 2026-09-02, trên
**24** AC của `spec.md`.

### Bổ sung 2026-09-03 — phép thử chạy LẠI trên nghiên cứu kỹ thuật

Câu trên nói về **AC trong spec**. Nó **không** nói về hợp đồng có đúng hay không.
`01_research/m12-ky-thuat-trien-khai.md` chạy phép thử khác — *"chỗ nào spec sẽ vỡ
khi gặp thư viện thật"* — và tìm ra **bốn chỏi spec · hai lỗ spec · một cơ hội**,
cộng cả một đường dữ liệu (video) mà spec **không nhắc một lần**.

⇒ **Hai phép thử khác nhau, và s6 chỉ chạy một.** Phép thử của s6 hỏi *"AC này
viết được testcase không?"*. Nó **không** hỏi *"tiền đề của AC này có đúng không?"*.
`AC-5.2` là ví dụ sạch nhất: nó viết được testcase ngay (*"`kill -9` giữa lúc ghi
⇒ `new/` không có file nửa vời"*), và **tiền đề của nó sai trên Windows**. Phép thử
s6 xanh; mệnh đề sai.

Ba mục dưới đây là **giới hạn của chính s6**, ghi ra để lượt sau không tin quá:

| s6 bắt được | s6 KHÔNG bắt được |
|---|---|
| AC không đo được (`AC-3.1` *"lõi"* không định nghĩa · `AC-6.1` *"trước"* không nói đo bằng gì) | AC đo được mà **tiền đề sai** (`AC-5.2` trên Windows) |
| AC thiếu ca biên | Hợp đồng **thiếu cả một đường dữ liệu** (video) |
| — | Thư viện **không dùng được** như spec giả định (Citations = 400 · `re.escape` trượt) |

**PHẦN II** và **PHẦN III** ở trên là kết quả của phép thử thứ hai đó. Cả hai mang
nhãn **CHỜ FR-053 / CHỜ FR-054** vì chúng giả định hợp đồng **chưa duyệt**.

⚠️ Và một điều PHẦN III vừa đo ra, không có trong `FR-054`: luật *"không byte video
vào kho"* đang sống bằng **chữ**, không bằng cổng — `FR-039` đã mở cổng nhận cho
mọi mime. Xem `backlog.md`.
