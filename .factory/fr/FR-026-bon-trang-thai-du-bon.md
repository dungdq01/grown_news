# FR-026 — bốn trạng thái phải được đối xử đủ bốn; và `rejected` cần một cửa ra

**Mức**: s5 (bump `ui_frozen`) + s6 (vế B sửa `BANG_CHUYEN`)
**Trạng thái**: vế A **ĐÃ LÀM** · vế B + B2 **ĐÃ KÝ và ĐÃ LÀM** (2026-08-25)
**Ngày**: 2026-08-24
**Người dùng yêu cầu**: *"kiểm tra tất cả các trạng thái và button in chờ duyệt nha"*

---

## Đo trước, không suy diễn

Chạy 16 cặp chuyển trạng thái qua API thật (`PATCH /status`, kho tạm):

| từ ↓ đến → | draft | edited | approved | rejected |
|---|---|---|---|---|
**draft** | 409 | 409 | **200** | **200** |
**edited** | 409 | 409 | **200** | 409 |
**approved** | 409 | 409 | 409 | 409 |
**rejected** | 409 | 409 | 409 | 409 |

Cộng `approved → edited` — hệ quả của PUT sửa nội dung, không phải một lệnh.

**Khớp hoàn hảo, không sửa gì**: nút `Duyệt` chỉ hiện với `draft`/`edited`, nút
`Loại` chỉ hiện với `draft` — khớp chính xác `BANG_CHUYEN`. **Không nút chết
nào.** 11/11 `data-act` đều có handler. Hộp thoại Duyệt gửi đúng và chỉ đúng
những gì server đòi (đo 6 ca: 2 tick + 0 phút → 200; thiếu/rỗng/âm/thập phân →
422 kèm đúng tên trường).

---

## Vế A — ĐÃ LÀM: ba chỗ bỏ sót `edited`

`review_status` có **4** giá trị (M02 §2.2) nhưng code liệt kê tay **3** ở nhiều
chỗ. Đây là lần **thứ ba** cùng một lỗi, mỗi lần một chỗ khác:

1. (đã sửa trước) chỉ mục cửa sổ gom `[...appr, ...draft, ...rej]` ⇒ bài `edited`
   không có `data-open` ⇒ bấm thẻ không mở được gì.
2. **màn Chờ duyệt** lọc `=== "draft"` ⇒ bài `edited` **không hiện**, dù API cho
   `edited → approved` và cửa sổ đọc **có** vẽ nút Duyệt.
3. **`st-edited` không có luật CSS nào** ⇒ trông y hệt `approved`.

### Vì sao (2) là lỗi nặng, không phải thiếu tiện

Đo trên kho thật (2 `draft` + 1 `edited`): ô KPI *"chờ duyệt"* hiện **2**,
*"tổng bản ghi"* hiện **3** — bài `edited` không nằm trong **bất kỳ ô nào** trong
4 ô. Và nó đến trạng thái đó bằng một đường **bình thường**: sửa một bài
`approved` làm nó tụt `edited` ⇒ **rời khỏi site** (M03-R1 chỉ publish
`approved`) ⇒ rồi biến mất khỏi mọi con số và mọi hàng chờ. **Không tín hiệu nào
cho người duyệt biết có việc phải làm.**

Đường duy nhất tới bài `edited` trước FR này: vào màn Tất cả, **tự mắt quét** tìm
chữ `· edited` ở dòng meta — sidebar chỉ có 3 facet `cat`/`loai`/`cpt`, **không
có facet trạng thái**.

Chua nhất: `home-pages/index.ts:435-439` **đã có comment dài** giải thích đúng lỗi
này (*"liệt kê trạng thái bằng tay là đếm thủ công một enum sẽ dài ra"*) — tác giả
sửa cho **chỉ mục**, nhưng không áp cho `queue`/`qcount`/`kpi2` ngay bên dưới.
Bài học viết ra rồi mà không áp hết.

### Đã đổi

| Chỗ | Trước | Sau |
|---|---|---|
`home-pages/index.ts` | 6 chỗ dùng `draft` | tập `choDuyet` = `draft` + `edited` |
`prototype.css` | `st-edited` không luật nào | `border-left:3px solid var(--warn)` |
`prototype.css` | bảng dữ liệu thiếu `edited` | `box-shadow:inset 3px 0` |
`multiwindow.inline.ts` | `✎ Sửa`, **không `title`** | `✎ Sửa…` + `title` theo trạng thái |

**`st-edited` KHÔNG dùng `opacity`** — cố ý. `draft`/`rejected` mờ vì *"chưa
tới"* hoặc *"đã bỏ"*; `edited` thì **cần hành động**, làm mờ là ngược nghĩa. Và
`opacity` trên chữ là thứ hợp đồng tương phản phải canh — viền không sinh màu chữ
mới nào nên `contrast-audit.json` không đổi.

### Nút `✎ Sửa` — nút có hệ quả nặng nhất mà im lặng

Ba nút kia đều có `title` nói hệ quả và có `…` báo "còn một bước". `Sửa` không có
cả hai, trong khi hệ quả trên bài `approved` là **rời khỏi site**. Cảnh báo có
thật (`multiwindow.inline.ts:1349`) nhưng chỉ hiện **sau khi đã bấm**, ở màn nạp.

Đúng lớp lỗi mà `:1153-1160` viết cả một đoạn để phòng (*"người dùng bấm xoá rồi
đi tìm bài ở ô đã loại… `title` nói hệ quả, vì nhãn ngắn không nói hết được"*) —
áp cho `Loại` và `Bỏ khỏi kho`, **bỏ sót đúng `Sửa`**.

### Răng — `web/test/bon-trang-thai.test.js` (19 phép kiểm)

Không kiểm "đã sửa chỗ đó chưa" mà kiểm **tính chất**:

- đọc `BANG_CHUYEN` **từ `status.mjs`**, không gõ lại ⇒ đổi bảng thì test theo
- FE vẽ nút Duyệt cho **đúng** tập trạng thái bảng cho phép (bắt cả nút chết lẫn đường cụt)
- 4 nút hành động đều có `title`; `title` của `Sửa` phải nói `edited` + `site`
- 4 mốc (`queue`, `qcount`, `oKpi`, `oNho`) **không** được dùng riêng `draft`
- 3 trạng thái non-approved đều có luật CSS; `st-edited` không được có `opacity`
- trên **trang đã build**: mọi bài `st-draft`/`st-edited` ở màn Tất cả phải có ở
  màn Chờ duyệt, và `qcount` khớp số hàng thật

Kiểm hai chiều: lùi cả ba sửa ⇒ **5 phép kiểm đỏ**, gọi tên đúng từng nguyên nhân.

---

## Vế B — MỞ: `rejected` là hố đen, không có cửa ra

`BANG_CHUYEN` **không có khoá `rejected`** nên `?? []` ⇒ mọi PATCH đều 409. Đã rà
**mọi** endpoint:

| Đường | Kết quả trên bài `rejected` |
|---|---|
`PATCH /status` (4 đích) | **409** cả bốn, `duoc_phep: []` |
`PUT` sửa nội dung | **200 nhưng vẫn `rejected`** — `articles.mjs:211-214` lột `review_status` rồi gán lại giá trị cũ; nhánh nâng cấp chỉ chạy khi `=== "approved"` |
`DELETE` + `restore` | giữ **nguyên byte** ⇒ giữ `rejected` |
`POST /api/articles` | về `draft` được, nhưng là **bài MỚI** (id/slug mới) |

⇒ Loại nhầm một bài thì **không có đường nào** đưa nó lại qua web. Chỉ còn sửa
file `.md` bằng editor tay — tức rơi ra ngoài bàn biên tập, đúng thứ FR-011 tồn
tại để tránh.

Và web vẫn hiện nút `✎ Sửa` trên bài `rejected`: sửa xong nhận `200 OK`, thông
báo *"Đã lưu — trạng thái: rejected"*. Nhãn ngụ ý *"sửa để tốt hơn"*; hệ quả là
*"sửa xong vẫn chết"*. (FR này đã thêm `title` nói thẳng điều đó — nhưng đó là
**dán nhãn cho một ngõ cụt**, không phải mở đường.)

**Spec và code KHỚP nhau** ở thiết kế bịt kín này: `M02_kb/spec.md` §2.2 vẽ
`└──> rejected` cũng là mũi tên một chiều. Nên đây **không phải bug**, mà là một
quyết định cần xem lại — và vì thế cần FR chứ không sửa lặng.

### Đề xuất: thêm `rejected → draft`

```
draft ──người duyệt──> approved ──> (lên web)
  │                        │
  └──> rejected            └──> edited ──> approved
         │
         └──người mở lại──> draft        ← THÊM
```

**Vì sao `draft` chứ không `approved`**: mở lại là *"tôi muốn xem lại bài này"*,
không phải *"tôi duyệt nó"*. Đi về `draft` thì nó qua **đúng cổng người** một lần
nữa (B-B1 nguyên vẹn), và nó xuất hiện lại ở màn Chờ duyệt — nơi vế A vừa sửa cho
đúng.

**Đòi gì**: xoá `reject_reason` khi mở lại (lý do cũ không còn đúng), và ghi vào
`_nhat-ky-danh-muc.md`? — **không**, nhật ký đó dành cho danh mục nhãn. Cần một
lời khai riêng hay không là câu hỏi cho người ký.

### Vế B2 — `approved` không thu hồi được (nhẹ hơn, có thể để sau)

Không có `approved → rejected` cũng không có `→ draft`. Muốn hạ một bài đã duyệt
phải **PUT sửa nội dung** cho nó tụt `edited` — dùng **tác dụng phụ làm chức
năng**. Ít gặp hơn vế B nên đề xuất để sau.

---

## Hai điều đo được, khai thẳng, KHÔNG sửa trong FR này

**`review_minutes: 0` qua cổng.** `Number.isInteger(0) && 0 >= 0` PASS, và schema
`minimum: 0`. Mở cửa sổ 2 giây rồi duyệt vẫn hợp lệ. Ngưỡng M1 *"trung bình <20
phút"* **không cổng nào canh** — nó là ngưỡng trên tập, không trên từng bài, nên
canh ở đây có thể sai chỗ. Cần đo M1 thật trước khi quyết.

**Phiếu Duyệt có thể trả 422 `loi_validate`** vì một trường schema khác (vd
`conformance`) mà hộp thoại không hỏi và không sửa được. FE hiện lỗi nguyên văn
nhưng đó là chuỗi validate thô, không phải khuôn THIẾU/SAI/SỬA. Chưa gặp thật.

---

## Thi hành

Vế A: đã làm, `ui_frozen` bump **v1.9 → v1.10**, worklog `WL-01K9K5BONTRANGTHAI`.

Vế B: chờ người ký. Nếu duyệt thì sửa `BANG_CHUYEN` + `M02_kb/spec.md` §2.2 +
nút "Mở lại" ở cửa sổ đọc cho `st === "rejected"` + mở rộng ma trận trong
`bon-trang-thai.test.js` và `luong-day-du.test.js` (16 cặp → cặp mới thành 200).

---

## Vế B + B2 — **ĐÃ KÝ và ĐÃ LÀM** (2026-08-25)

**Người dùng chốt**: *"Mở cả hai đi, sao cho tiện nhất mà đầy đủ"*.

### Vì sao câu hỏi được đặt lại

Người dùng hỏi *"API bài viết: duyệt / sửa / loại / chuyển kho — có hoạt động
không?"*. Tôi viết `vong-doi-bai.test.js` đi trọn một vòng đời và nó **đỏ** ở
bước loại: `approved → rejected` trả **409**.

API đúng, test tôi sai. Nhưng khi đọc `BANG_CHUYEN` thì lộ ra điều tệ hơn một
lỗi:

```
draft    → approved | rejected
edited   → approved
approved → (không đi đâu)          ← ngõ cụt
rejected → (không đi đâu)          ← ngõ cụt
```

Bài đã duyệt **không có đường nào** tới `rejected` — kể cả đi qua `edited`, vì
`edited` chỉ tới `approved`. Đường ra duy nhất là **XOÁ**. Tức duyệt nhầm một bài
thì phải xoá nó, mà xoá là một việc khác hẳn về nghĩa: nó đưa file ra khỏi mọi ô
thống kê, không phải ghi lại một phán quyết.

Và vế B đã ghi từ trước: `rejected` là hố đen — bài bị loại chỉ còn cách nạp lại
như bài mới, tức **mất cả lịch sử của nó**.

### Bảng mới — không còn ngõ cụt nào

```
draft    → approved | rejected
edited   → approved | rejected      ← MỚI: sửa rồi thấy dở thì loại được
approved → draft    | rejected      ← MỚI (vế B2 · bỏ duyệt)
rejected → draft                    ← MỚI (vế B · đưa lại vào hàng chờ)
```

Bốn đường mới. Mọi trạng thái về được `draft`, nên từ **mọi** trạng thái đi tiếp
được. `vong-doi-bai.test.js` có một phép kiểm riêng cho tính chất đó (**6d ·
đồ thị không còn ngõ cụt**) — nó đọc `BANG_CHUYEN` và đòi mỗi trạng thái có ít
nhất một đường ra, chứ không gõ lại danh sách.

`edited → rejected` được thêm dù vế B/B2 không nêu: thiếu nó thì sửa một bài
approved rồi thấy nó dở là lại kẹt — đúng cùng một hình dạng bế tắc, ở một chỗ
khác. *"Đầy đủ"* nghĩa là đóng cả ba, không phải hai.

### B-B1 nguyên vẹn — và kiểm được

Luật đó nói **chỉ người được ĐẶT `approved`**. Bốn đường mới đều **rút** hoặc
**từ chối**, không đường nào **cấp** phê duyệt. `→ approved` vẫn đòi đủ ba trường
M1, và `api-guard.test.js` vẫn quét literal để chắc code không có default nào.

### `→ draft` KHÔNG đòi trường mới — ba lý do

1. `kb/` nằm trong git, và **B-C1** nói `.md` trong git là nguồn chân lý duy
   nhất. Git **chính là** dấu vết cho mọi chuyển đổi bài. Thêm một trường "lý do
   rút" là ghi lại thứ git đã ghi.
2. Thêm trường = sửa `frontmatter.schema.json`, một file **FROZEN**. Đắt, và
   người dùng không yêu cầu.
3. Rút phê duyệt là việc **phục hồi được** (duyệt lại là xong), khác `rejected`
   là một **phán quyết** — nên nó không cần lý do như phán quyết cần.

Đó là phần *"tiện nhất"* của yêu cầu: không thêm ma sát vào một việc đảo được.

### Trường HẾT HIỆU LỰC bị bỏ — phần *"đầy đủ"*

```
rời `approved`  ⇒ bỏ insight_new · skill_installed · review_minutes
rời `rejected`  ⇒ bỏ reject_reason
```

Ba trường M1 là **lời khai của người**, gắn với **một** lần phê duyệt cụ thể
(*"tôi đã đọc, nó dạy tôi cái mới, mất N phút"*). Rút phê duyệt mà để nguyên
chúng là để một bản `draft` mang **một lời khai đã ký cho một phê duyệt không
còn tồn tại**. Cùng lý với `reject_reason` khi thu hồi phán quyết.

Và nó có hệ quả kiểm được: duyệt lại **phải hỏi lại** M1. Nếu không bỏ, lần duyệt
sau vẫn hỏi (API luôn đòi) nhưng giá trị cũ nằm đó trông như đang có hiệu lực.

**Xoá khoá, không đặt `null`**: `insight_new` khai kiểu `boolean` nên `null` sẽ
trượt validate. Một khoá vắng đọc ra *"không có"*; một khoá `null` đọc ra *"có mà
rỗng"* — hai điều khác nhau.

### FE — hai nút mới, và hai dòng giải thích từng SAI

`veBienTap` thêm:

| Trạng thái | Nút mới |
|---|---|
`approved` | **⤺ Bỏ duyệt…** + **✕ Loại (ghi lý do)…** |
`rejected` | **⤺ Đưa lại vào hàng chờ…** |
`edited` | **✕ Loại (ghi lý do)…** |

Hai đường về `draft` dùng **một** hàm `veHangCho()` vì chúng cùng một lệnh
(`{to:"draft"}`) và cùng một hệ quả cấu trúc. Khác nhau chỉ ở **câu nói với
người dùng** — và câu đó phải khác, vì hai việc xuất phát từ hai ý định khác nhau.

**Không mở phiếu** — `→ draft` không đòi trường nào, một phiếu rỗng chỉ là thêm
một cú bấm. **Có hỏi lại** — cả hai đổi thứ người khác thấy: `bo-duyet` lấy một
bài khỏi site, `hoi-sinh` đưa một bài đã loại trở lại hàng việc. Hỏi lại không
vì chúng khó phục hồi, mà vì chúng **không hiển nhiên**.

Và hai dòng `.hint` cũ **đã sai ngay khi bảng mở**:

> *"vòng đời M02 không có đường `rejected → approved`. Muốn dùng lại thì sửa nội
> dung rồi nạp như bài mới."*

Đúng lúc viết, sai lúc này. **Một dòng giải thích lạc hậu tệ hơn không có dòng
nào**: người đọc tin nó và không thử nút ngay bên cạnh. Đã viết lại: *"không có
đường trực tiếp — đưa lại vào hàng chờ trước, rồi duyệt"*.

### Một lỗi fixture bị thay đổi này phơi ra

`luong-day-du.test.js` có helper `datTrang(slug, trang)` ghi thẳng trạng thái vào
file để dựng fixture. Nó **đã** thêm `reject_reason` khi đặt `rejected` — nhưng
**quên** ba trường M1 khi đặt `approved`.

Trước đây lỗi đó không lộ: mọi đường `approved → *` đều 409 nên không gì xoá M1
khỏi file, và M1 còn sót từ bước trước. Mở bảng + bỏ trường hết hiệu lực làm
fixture thành **bản ghi không hợp lệ**, và nó báo 422 ở một phép kiểm nói về
chuyện khác — tức **lỗi hiện ra ở sai địa chỉ**.

Đã sửa để fixture tự hợp lệ với trạng thái nó đặt, đối xứng với nhánh `rejected`
đã có.

### Kết quả đo

| | Số |
|---|---|
`npm test` | **40/40** · chạy độc lập 0 file đỏ |
`npm run check` | sạch |
cổng Python | **14/14** |
`validate.py kb/ --strict` | 3 file · **0 lỗi · 0 cảnh báo** |
ma trận chuyển | 12/16 cặp hợp lệ → **7 cặp hợp lệ / 16** khai tường minh |
đồ thị | **0 ngõ cụt** (trước: 2) |

`bon-trang-thai.test.js` vẫn xanh — nó đọc `BANG_CHUYEN` làm nguồn chân lý và so
với FE, nên nó **tự** khớp bảng mới. Đó là lý do nó được viết như vậy.

### Điều KHÔNG làm

- **Không** thêm trường vào `frontmatter.schema.json` (file FROZEN).
- **Không** mở `rejected → approved` trực tiếp. Phải qua `draft`, tức phải đi
  qua hàng chờ và khai lại M1 — một bài từng bị loại không được lên site mà
  không ai đọc lại.
- **Không** đổi ý nghĩa của `DELETE`/`restore`. Chúng vẫn là **di chuyển kho**
  (`kb/` ↔ `_recycle/`), khác hẳn `rejected` là phán quyết.
