# FR-031 — Nút chết, danh mục mở khoá, và "kho rỗng là trạng thái hợp lệ"

**Mức**: s8 (M03_web) + M08_api · đụng file frozen ⇒ ký lại baseline
**Ngày**: 2026-08-26
**Nguồn**: người dùng, 5 ảnh + danh sách việc trên 4 màn. Đứng đầu:
*"các button: sửa / bỏ khỏi kho / đưa lại vào hàng chờ: hiện tại click vô dụng"*

---

## 1 · Bug lớn nhất: FE dựng URL thiếu một đoạn

```
FE gọi :  /api/articles/<slug>          →  404
Route là:  /api/articles/<type>/<slug>   →  200
```

Đo trên server đang chạy, cùng một bài:

| Đường | Mã |
|---|---|
`GET /api/articles/ai-agent-prototype-len-production` | **404** |
`GET /api/articles/docs/ai-agent-prototype-len-production` | **200** |
`PATCH /api/articles/<slug>/status` | **400** `type phải thuộc:…` |
`PATCH /api/articles/docs/<slug>/status` | **409** (route KHỚP, handler xét tiếp) |

`router.mjs:78` đòi `phan.length >= 4`. Năm chỗ trong FE dựng URL chỉ bằng
`ban.slug`. Vì `docChiTiet` là bước ĐẦU của cả bốn nút (nó lấy `etag` cho
`If-Match`), **bốn nút chết ở cùng một chỗ**.

Sửa gốc bằng MỘT helper `duongBai(b) = b.source_type + "/" + b.slug`, không sửa
tay năm chỗ — sửa tay thì chỗ thứ sáu viết sau này lại thiếu.

### Vì sao 41 phép kiểm không bắt

`vong-doi-bai.test.js` gọi API **trực tiếp** bằng đường tự gõ đúng. Nó chứng minh
API tốt — và API tốt thật. Không phép kiểm nào hỏi *"FE dựng đường NÀO"*.

Đây là bản một-mặt của lớp lỗi **bản song sinh**: khi hai bên phải khớp nhau,
kiểm từng bên xanh KHÔNG suy ra chỗ nối xanh.

Răng mới `duong-api-khop-route.test.js` — hai mục cố ý khác loại:
- §1 soi **bundle đã build**, cấm đúng hình dạng đã gây lỗi (`+ x.slug`)
- §2 dựng server thật, chứng minh router **thật sự** đòi `type` ⇒ §1 có lý do

Nếu ai nới router cho nhận 3 đoạn, §1c tự khai là hết hiệu lực thay vì đỏ oan.

## 2 · Lỗi UI ở cửa sổ đọc

**Nhãn gãy 2–3 dòng.** `.bk-f` là MỘT hàng `space-between` chứa 4 nút biên tập +
số trang + prev/next. `space-between` chia đều **khoảng trống**, không chia theo
nhu cầu — nên nút nhãn dài bị bóp y như nút nhãn ngắn. Tách hai hàng: hành động,
rồi meta.

**Giữ nhãn `Loại (ghi lý do)`.** `four-screens.test.js:227` canh đúng nó vì một
lỗi người dùng thật (xoá bài rồi đi tìm ở ô "đã loại"). Cái sai là gãy dòng,
không phải chữ.

**Thiếu dấu**: `‹ truoc` · `tiep ›` · `Dang tai...`.

**Một câu vô nghĩa trên `/nap/`**: *"Lời cuối vẫn là Bài được kiểm tự động ngay
khi bạn bấm ghi."* — một lần sửa trước cắt mất chủ ngữ và để lại hai nửa câu
dính nhau. Lỗi HIỂN THỊ, không ai báo.

**Hai câu giải thích ở chân cửa sổ đã bỏ** — và bỏ được vì chỗ thiếu đã được
sửa, không phải vì "cho gọn": câu cho `rejected` ra đời khi `rejected` là ngõ cụt
(không nút nào); FR-026 mở `rejected → draft` nên giờ chỗ đó CÓ nút. *Một câu
giải thích trên màn là dấu hiệu giao diện còn thiếu một nút hoặc một nhãn.*

## 3 · Hàng danh mục cao gấp đôi — nguyên nhân là specificity

`.rc-act` cũng là một `<span>`, nên `.rc-r span` (0,1,1) khớp nó **và thắng**
`.rc-act{grid-column:4}` (0,1,0). Ô hành động bị đặt vào **cột 2** cùng nhãn;
grid không xếp hai thứ vào một ô nên đẩy nó xuống **dòng 2**.

Đó là gốc của hàng ~90px người dùng chỉ trong ảnh, với "đang dùng" trôi xuống một
dòng riêng. **Không phải lỗi padding.** Sửa bằng `:not(.rc-act)` ở selector, chứ
không bằng đổi thứ tự dòng — thứ tự chỉ quyết khi specificity bằng nhau.

## 4 · Mở khoá sửa/xoá nhãn đang dùng

**Sửa**: API **đã cho** từ đầu (`suaNhan` chỉ chặn đổi `id`). Chỉ giao diện khoá:
hàng `#cb` là một `<button>` lọc, và `<button>` không lồng được `<button>`, nên
không có chỗ đặt nút. Tức **giao diện tự cấm một việc hệ thống vẫn cho làm**.
Sửa: hàng thành `<div>`, phần lọc thành `.rc-loc` bên trong.

**Xoá** (người dùng chọn *"ép xoá kèm cảnh báo"*): `?force=1`. Ba điều bắt buộc:
- mặc định **KHÔNG đổi** — không cờ thì vẫn 409
- 409 trả **danh sách bài**, không chỉ con số: một con số không cho người dùng
  đường nào đi tiếp, mấy cái slug thì có
- 200 trả `gay_hong` — im lặng là để người dùng tự phát hiện ba tuần sau, lúc sửa
  một bài và không hiểu vì sao trượt

Phép kiểm chứng minh hệ quả là **thật**: bài trỏ hụt PUT ⇒ 422. Không có phép
kiểm đó thì cảnh báo chỉ là một lời nói suông.

Nhật ký ghi `ÉP XOÁ` kèm bài bị bỏ lại — bản trước hardcode `0 bài dùng`, với
`force` thì câu đó thành **lời khai sai** trong đúng file dùng để tra lại.

## 5 · Khôi phục dưới tên khác

`slug_moi` trong body. Ba điều đáng ghi:

- **`slug` trong frontmatter phải đổi theo tên file.** API trả `slug` lấy từ TÊN
  FILE (`quetKho`), form sửa bài đọc `fm.slug`. Để lệch thì file tự khai hai địa
  chỉ và form điền địa chỉ cũ — bug im lặng chờ sẵn.
- **Chỉ rename + write, KHÔNG unlink.** Bản đầu tôi dùng `unlinkSync` để hoàn
  nguyên và `no-write-path` đỏ. Cổng đúng: một guard chỉ đáng tin khi nó không có
  ngoại lệ *"trường hợp của tôi thì khác"*.
- **`banIndex()` ngay sau TỪNG lần di chuyển**, kể cả nhánh hoàn nguyên — giữa
  lúc file vào kho và lúc index bị đánh dấu bẩn, mọi lời đọc index đều sai.

## 6 · Ba dashboard nữa ở Kho, vòng xoay RIÊNG

Ba góc nhìn mới, ba **hình dạng dữ liệu** khác nhau, cả ba đọc từ trường đã có —
không thêm trường, không đổi API:

| Dữ liệu | Hình dạng | Chart |
|---|---|---|
`analyzed_at` | chuỗi THỜI GIAN, có thứ tự tự nhiên | cột dọc |
`origin` | ba phần của một tổng | thanh chia đoạn |
`priority` | ba mức có thứ tự, cần số chính xác | hàng |

**`data-kpane`/`data-ktab`, không dùng lại `data-pane`/`data-tab`.** `shell.html`
là CHUNG cho mọi trang, nên markup vòng xoay của Trang chủ **có mặt** trên
`/kho/` (đo được: 3 phần tử `data-pane` trong `site/kho/index.html`). Dùng chung
tên là hai vòng trộn thành một tập — bấm tab ở Kho đổi pane ở Trang chủ. Và lỗi
đó **không hiện ra ở màn Kho**, nên người sửa sẽ đi tìm ở chỗ không có gì sai.

Chu kỳ 7s, lệch với hai vòng kia (6s · 5s): ba vùng đổi cùng lúc thì cả trang
nhảy một nhịp, đọc ra như lỗi.

`opacity:0` đặt **inline trong markup**, không trong CSS — theo đúng khuôn vòng
Trang chủ. Hai lý do thật: không JS thì pane 0 vẫn đọc được; và
`opacity-khong-pha-contrast` quét LUẬT CSS, một luật `opacity:0` cho phần tử có
chữ là 1.00:1.

## 7 · Xoá sạch danh mục — và điều nó phơi ra

Người dùng: *"clear all category và concept hiện tại, tôi sẽ nhập từng cái sau."*

Tôi làm thật, **đo được 33 lỗi validate ở `kb-mock/`**, rồi hoàn nguyên để cây
không nằm đỏ, rồi hỏi. Hai ràng buộc tôi không tự quyết:
1. `sinh_kb_mock.py` COPY danh mục của `kb/` sang `kb-mock/` ⇒ kho mẫu không giữ
   được nhãn khi `kb/` rỗng.
2. enum `category` nằm trong schema DÙNG CHUNG ⇒ xoá chủ đề làm 12 bản ghi mẫu
   sai schema **bất kể** mock có danh mục riêng hay không.

Người dùng chốt: **xoá sạch cả hai**, chấp nhận /mock/ mất biểu đồ nhãn.

Đã xoá: `kb/concepts.yaml` (24→0) · `kb/categories.yaml` (6→0) · enum `category`
ở CẢ HAI bản schema (6→0) · nhãn trong 3 bài thật · nhãn trong 13 bản ghi của
contract mẫu.

### 7a · "Kho rỗng là trạng thái hợp lệ" — 22 phép kiểm không biết điều đó

Xoá xong, **22 phép kiểm đỏ cùng lúc** và không cái nào tìm ra bug. Chúng chỉ
mất thứ để đo, vì fixture đang **mượn dữ liệu của người dùng**:

| Chỗ | Vay gì | Sửa |
|---|---|---|
`_api.mjs` | `kb/concepts.yaml` (bản ghi seed trỏ `idempotency`) | fixture tự viết danh mục 6 mục, có `aliases` |
`dungSchema` | enum thật (giờ rỗng) ⇒ "khởi đầu 6 chủ đề — được 0" | bơm `CAT_FX` vào schema TẠM |
`test_gates.py` | `kb/concepts.yaml` ⇒ `None` ⇒ **18 test ERROR** | đọc tập id từ chính `fixtures/dat-chuan.md` |
`check_index_dan_xuat` | "0 bài có nhãn" | fixture tự chèn `concepts:` cho mọi bài |
`danh-muc-them` | id thật `agent-llm` | lấy `CAT_FX[0][0]` |
`filter-counts` · `url-va-tuong-tac` · `man-danh-muc` · `nhan-dai` · `cac-man-con-lai` | đếm tuyệt đối trên dữ liệu sống | khẳng định **cả hai nhánh** |

**Nguyên tắc rút ra:** phép kiểm không được mượn dữ liệu người dùng. Kho thật
rỗng là trạng thái hợp lệ — nó không được làm bộ test mù.

Và khi phải nhánh hoá, **cấm `if (co) {...}` không có `else`**: khi điều kiện mất
thì cả khối tự biến mất và phép kiểm tự vô hiệu (đúng lớp lỗi đã bắt ở
`open-card.test.js`). Nhánh nào cũng phải có răng — ví dụ "0 nhãn ⇒ tầng lọc phải
VẮNG **và** màn Danh mục phải nói ra là đang trống".

Tôi cũng đã tự vi phạm điều này một lần trong lượt sửa (`ok(x > 0 || true, …)`)
và sửa lại thành khẳng định thật.

### 7b · Hai chỗ SẬP vì danh mục rỗng — defect thật, không phải hệ quả

`concepts.yaml` chỉ còn comment ⇒ `yaml.safe_load` trả `None` ⇒
`{c["id"] for c in None}` **TypeError**:
- `validate.py:279` — người dùng thấy traceback thay vì một câu nói kho sai đâu
- `05_intake/gate.py:152` — cổng nộp bài chết giữa đường

Sửa cả hai bằng `or []`: **rỗng khác thiếu**. Rỗng = danh mục đóng, chưa có mục
nào (mọi `concepts` trong bài bị chặn, đúng M02-R3); thiếu file mới là cổng TẮT,
và `catalog_missing` lo ca đó.

### 7c · Câu sai trên màn

`"Chưa đọc được danh mục khái niệm."` là câu về một **lỗi đọc file**. Danh mục
rỗng là trạng thái hợp lệ. Nói sai nguyên nhân thì người dùng đi tìm một lỗi
không có. Đổi thành *"Danh mục khái niệm đang trống — thêm mục đầu tiên bằng nút
bên trên."*

## 8 · LỖ ĐÃ BỊT: `npm test` tự ký lại `FROZEN.lock`

`kyLaiBaseline()` gọi `check_frozen.py --ky` **vô điều kiện** với `cwd: GOC`.
Nghĩa là mỗi lần một test POST/DELETE một nhãn — trên kho TẠM, schema TẠM, không
chạm một byte nào của repo — nó vẫn ký lại baseline của repo.

Đo được: tôi sửa 3 file frozen, `check_frozen` đỏ đúng thiết kế; chạy `npm test`
một lượt và nó **XANH trở lại**. Cổng có nhiệm vụ đòi *"đổi file frozen phải qua
FR"* bị vô hiệu bởi chính bộ test.

Đó là lớp lỗi tệ nhất của một cổng: **nó không kêu, nó chúc phúc.**

Guard: có `KB_DIR` hoặc `SCHEMA_DIR` ⇒ đang làm việc trên thư mục tạm ⇒ không ký.
Fail closed: bỏ một lần ký đáng ra phải làm thì `check_frozen` kêu và người sửa
biết; ký thừa thì im lặng.

Kiểm hai chiều: đưa `FROZEN.lock` về HEAD, chạy trọn `npm test` (43/43 xanh),
`git hash-object` **không đổi**.

## 9 · Ba cổng bắt đúng, và tôi sửa mình

| Cổng | Bắt gì |
|---|---|
`no-write-path` | `unlinkSync` trong `web/api/**` (M08-R4) · và đích của lời gọi ghi phải ĐỌC ĐƯỢC ngay tại chỗ gọi |
`api-guard` | `renameSync` mọc ngoài ba hàm được thiết kế |
`page-weight` | cắt-theo-số-cứng trong emitter (mọi ngưỡng phải khai ở `NGUONG`) |

Hai cổng trong số đó **báo động giả vì comment của tôi**: chúng quét nguyên văn
nguồn, và một dòng giải thích nhắc tên hàm gọi mạng / cách cắt cũ là đủ để đỏ.
`page-weight` đã sửa để bóc comment trước khi quét — bóc comment không làm cổng
yếu đi (một `.slice(1,3)` trong comment thì không chạy), nhưng nó **dạy người ta
đừng viết chú thích về đoạn mã vừa sửa**, tức phạt đúng thứ đáng khuyến khích.

`api-guard` cũng được siết: đếm **HÀM** thay vì đếm **số lần gọi**. Và danh sách
hàm cũ ghi `ghiSauValidate` — đo lại thì hàm đó **không** gọi `renameSync`, nó
gọi `doiTenBenBi`. Con số 3 khớp nên không ai phát hiện tên sai: một phép kiểm
xanh vì con số, trong khi câu nó khai về hệ thống thì sai.

`man-danh-muc §6a` (đối chiếu song sinh) cũng xanh sai: nó so chuỗi trên nguyên
văn nguồn, và comment tôi vừa viết có chứa mấy chữ `đang dùng` để giải thích cái
vừa bỏ. Phép kiểm đối chiếu hai bản **cài đặt** lại đi đọc hai bản **văn xuôi**.
Từ giờ nó bóc comment trước khi so.

## 10 · Kết quả đo

| | Số |
|---|---|
`npm test` | **43/43** · chạy độc lập 0 file đỏ |
`npm run check` | sạch |
cổng Python | **14/14** · `pytest core/tests` **30 passed** |
`contrast-audit` | 62 cặp · 0 trượt |
`validate kb --strict` | 3 file · 0 lỗi |
`check_kb_mock` | 14 file · 1 ca âm CỐ Ý · 0 lỗi thật |
`gn.css` · `gn.js` | ≤100 KB (trần 100) |
đường FE ghép bằng `.slug` trần | **0** |
chữ phụ trợ mỗi màn | **145 → 73** ký tự · `/nap/` 498 → 426 |
danh mục | 24 khái niệm + 6 chủ đề → **0 + 0** |

## 11 · Điều KHÔNG làm

- **Không** thêm miễn trừ cho `opacity-khong-pha-contrast` — dùng khuôn inline
  của vòng Trang chủ, vốn cũng là fail-safe khi không có JS.
- **Không** nới guard *"kho rỗng thì không xoá nhãn"* — nó chống lớp lỗi khác với
  cái người dùng đang mở.
- **Không** đổi `id` của nhãn (bài trỏ vào nó) — API chặn đúng, giữ.
- **Không** cascade gỡ nhãn khỏi bài khi xoá một nhãn — người dùng chọn "ép xoá
  kèm cảnh báo", và cascade sửa nội dung nhiều bài trong một cú bấm.
- **Không** đổi mặc định của `GET /api/concepts|categories` — `/nap/` vẽ một
  checkbox mỗi nhãn, nên cắt mặc định là **lặng lẽ mất nhãn**, không phải phân
  trang. Có `limit` thì cắt, không có thì trả hết.
- **Không** nới trần `page-weight`.
- Không commit, không push.

## 12 · Nợ khai rõ

- **`/mock/` mất biểu đồ nhãn** cho tới khi bản mẫu được gán lại nhãn. Đây là hệ
  quả người dùng đã chấp nhận khi chốt "xoá sạch cả hai".
- **Emitter đọc kho từ repo, không từ thư mục build** (`duongKho()` =
  `join(GOC, "..", "kb"|"kb-mock")`), nên mọi phép kiểm về dashboard thật ra đang
  đo `kb-mock/`, và fixture KHÔNG thể tự sở hữu dữ liệu dashboard. Đã ghi lại ở
  `_seed.mjs` để không ai thử lại. Sửa được, nhưng là đổi kiến trúc emitter —
  ngoài phạm vi FR này.
- Cổng `no-write-path` và `api-guard` **vẫn quét nguyên văn** (chưa bóc comment)
  — hai lần báo động giả trong lượt này đều từ đó.
- `/nap/` **chưa dựng lại bố cục** (mục 4 "Nội dung" 9 ô) — chỉ dọn chữ và đổi
  nhãn. Cùng với canvas particles, scroll parallax, lưới bất đối xứng trang bài,
  và ngưỡng red-as-ink (`REDESIGN-PLAN §3.3`) — đều còn nợ.
