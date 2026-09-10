# FR-030 — Màn Danh mục dựng lại, và "biểu đồ đúng loại"

**Mức**: s8 (M03_web) — không đụng token, không bump `ui_frozen`
**Ngày**: 2026-08-25
**Nguồn**: người dùng — *"design lại màn catalog từ A–Z, cả pop up insert khái
niệm"* · *"phần kho bảo làm dashboard summary mà chưa làm à?"*

---

## Luật rút ra được từ hai màn: **độ dài cột phải mang thông tin**

Cả hai việc trong FR này đều là **một** lỗi ở hai chỗ: vẽ bar khi độ dài bar
không nói gì.

| Chỗ | Đo được | Kết luận |
|---|---|---|
Danh mục · nhãn đang dùng | mock: mọi cột **50% hoặc 100%** · real: **toàn bộ 100%** | mỗi nhãn dùng 1–2 lần ⇒ độ dài cột gần như hằng số |
Kho · độ tin cậy | 4 mức **có thứ tự**, câu hỏi thật là *"bao nhiêu phần kho đã kiểm"* | đó là câu hỏi về **tỉ lệ**, bar rời rạc bắt mắt tự cộng |

Một biểu đồ mà mọi cột dài bằng nhau **không phải biểu đồ** — nó là một danh
sách được vẽ to hơn cần thiết. Và nó che mất điều người dùng đến màn Danh mục để
làm: **tìm** một nhãn rồi **sửa/xoá** nó.

---

## Màn Danh mục

### 1 · Một thực thể, một hình dạng

Trước: nhãn **đang dùng** vẽ bằng bar (`#cb`), nhãn **chưa dùng** vẽ bằng hàng
(`#cchua`). Cùng một thực thể có **hai** hình dạng — mắt phải học hai lần, và
không thấy được chúng là cùng một loại vật.

Sau: cả hai là **hàng** `.rc-r` — `số bài · tên · mã · hành động`. Sắp **giảm
dần** theo số bài: màn này để *tìm*, và thứ tự tuỳ ý bắt người dùng quét cả
danh sách.

**Vẫn là nút lọc.** `data-loc`/`data-gt` giữ nguyên — đổi *hình dạng*, không đổi
*chức năng*. Bấm một hàng vẫn lọc bài mang nhãn đó.

### 2 · Song sinh — và nó bắt được tôi

Emitter in hàng lúc build; `barCptFE()` in **lại** đúng hàng đó từ API sau mỗi
lần thêm/sửa/xoá. Tôi đổi bản emitter mà **quên bản FE**, và
`man-danh-muc.test.js §6a` đỏ ngay: nếu để nguyên thì sau một lần thêm nhãn,
danh sách **lặng lẽ quay về bar**.

Đó là lý do phép kiểm song sinh tồn tại, và nó vừa trả cổ tức.

### 3 · Độ phủ là một TỈ LỆ

Câu hỏi thật của màn này: *"danh mục có đang phình không"*. Một danh mục 30 nhãn
mà 10 được dùng là một tín hiệu — nhưng hai số `30` và `10 đang dùng` đặt cạnh
nhau bắt người đọc **tự chia**.

Thêm thanh chia đoạn (`.tp-b`, dùng lại từ FR-027i): cùng loại câu hỏi thì cùng
loại biểu đồ, không phát minh cơ chế thứ hai. Và nó thừa hưởng luôn
`veThanhPhan()` — đoạn dựng một lần khi vào tầm nhìn.

### 4 · Popup — cơ chế đã tốt, **chữ** thì không

`<dialog>` native (focus-trap · ESC · backdrop · `inert` — trình duyệt làm sẵn,
đúng hơn mọi bản tự viết), một dialog cho cả hai loại nhãn, `pattern` chặn định
dạng. Không sửa cơ chế.

Chữ thì vi phạm đúng thứ FR-029 cấm:

| Trước | Sau |
|---|---|
`id` · *"kebab-case: chữ thường, số, gạch ngang"* | **Mã nhãn** · *"tiếng Anh, chữ thường, nối bằng gạch ngang — bài sẽ trỏ vào mã này nên nó không đổi được sau"* |
`Nhãn tiếng Việt` · *"chữ người đọc thấy trên web"* | **Tên hiển thị** · *"chữ bạn thấy trên các màn"* |
`Alias` · *"tên gọi khác, phẩy ngăn cách"* | **Tên gọi khác** · *"cách nhau bằng phẩy — chỉ dùng khi tìm kiếm, không hiện trên màn"* |

`id` và `kebab-case` là từ vựng của **người viết code**. Người thêm một nhãn
không cần biết chúng — nhưng **ràng buộc** thì thật (mã là khoá ổn định, bài trỏ
vào nó, không đổi được sau), nên phải nói ra bằng tiếng người. `pattern` vẫn chặn.

### 5 · Hai class chết được cho việc thật

`.r-cpt` / `.r-cat` từng **không có luật CSS nào** — chúng chỉ là móc nhận diện
(`man-danh-muc.test.js` đếm hàng khái niệm bằng `.r-cpt`). Khi tôi đưa `.r-cpt`
vào markup cửa sổ, `markup-matches-css` bắt đúng.

**Không xoá móc** — nó đang được dùng. Cho nó một việc thật: vạch 2px lề trái
cùng màu với tab (`.dm-tab.t-cpt` → `--brand`, `.t-cat` → `--ok`). Ba tab đã phân
biệt bằng màu; hàng mang cùng màu thì mắt đọc ra *"hàng này thuộc tab kia"* mà
không phải nhớ. **Màu lấy từ tab, không chọn mới** — cả hai đã trong
`contrast-audit`.

---

## Màn Kho — dashboard summary

### 6 · Lỗi thật: biểu đồ trạng thái thiếu một trạng thái

`bars4` ("Trạng thái duyệt") gõ tay `[approved, draft, rejected]` — **bỏ sót
`edited`**. Nên một bài đã duyệt rồi bị sửa **không xuất hiện ở đâu** trong biểu
đồ trạng thái, dù `edited` là một trong **bốn** giá trị enum. Và `maxTrang` tính
trên `choDuyet` trong khi cột vẽ `draft`, nên thang cũng lệch.

Đây là **lần thứ tư** cùng lớp lỗi (`bon-trang-thai.test.js` mở đầu bằng ba lần
trước: chỉ mục cửa sổ · màn Chờ duyệt · luật CSS). Ba lần trước sửa **từng chỗ**.

**Lần này sửa GỐC**: emitter đọc `enum` **từ schema** (`TRANG_THAI`). Không ai
liệt kê tay được nữa, và một trạng thái thứ năm sẽ **tự** có mặt ở mọi biểu đồ.

Răng canh hỏi *"có liệt kê tay không"*, **không** hỏi *"có đủ bốn không"* — đếm
bốn thì lần thứ năm vẫn lọt.

Fallback là enum hiện tại chứ không phải `[]`: thiếu file schema thì vẽ **đủ**
bốn cột còn hơn vẽ một biểu đồ rỗng mà không ai biết vì sao.

### 7 · Gom ba biểu đồ, ba LOẠI chart cho ba hình dạng dữ liệu

Trước: ba nhóm ở **hai** panel (`.two` + một panel riêng). Ba biểu đồ cùng trả
lời một câu hỏi mà nằm ở ba khung rời rạc.

Sau: **một** panel ba cột. `upgrade.md` nói *"Dashboard cần đa dạng loại chart"*
— nhưng đa dạng phải theo **hình dạng dữ liệu**, không theo số lượng loại:

| Dữ liệu | Hình dạng | Chart |
|---|---|---|
loại nguồn | danh mục **rời rạc**, không thứ tự | bar ngang |
độ tin cậy | danh mục **có thứ tự**, cần **tỉ lệ** | thanh chia đoạn |
trạng thái | bốn giá trị rời rạc, cần **số chính xác** | bar ngang |

**Cơ sở đếm khai ở TỪNG mục**, không khai một lần cho cả panel: hai mục đầu đếm
`appr` (bài đã lên site), mục cuối đếm `tatCa`. Ba biểu đồ cạnh nhau mà khác
mẫu số là lỗi im lặng nếu không nói ra — người đọc cộng nhầm.

### 8 · Vì sao `bars4` KHÔNG trùng thanh thành phần ở đầu màn

Thanh kia gộp `draft + edited` thành một đoạn *"chờ duyệt"* — đúng cho câu hỏi
*"kho đang ở đâu"*. `bars4` **tách** chúng, vì hai tình huống khác nhau: `draft`
là chưa ai đọc, `edited` là đã duyệt rồi bị sửa nên **rời khỏi site**. Người
quản lý cần phân biệt.

---

## Kết quả đo

| | Số |
|---|---|
`npm test` | **41/41** · chạy độc lập 0 file đỏ |
`npm run check` | sạch |
cổng Python | **14/14** |
`contrast-audit` | 62 cặp · **0 trượt** (không thêm màu nào) |
`gn.css` · `gn.js` | 89 · 82 KB (trần 100/100) |
trang chủ · lớn nhất | 54 KB (trần 60) · **64 KB** (trần 74) |
nhãn `bars4` trên trang | `draft · approved · edited · rejected` (trước: 3) |
`#cb` | **10 hàng**, 0 thanh `.bw`, 10 nút lọc, sắp giảm dần |

## Ba phép kiểm đổi THỨ ĐO, giữ Ý ĐỊNH

Đổi thiết kế thì phép kiểm khoá thiết kế cũ phải đổi — nhưng **ý định** không:

| Phép kiểm | Trước | Sau, cùng ý định |
|---|---|---|
`filter-counts` | `#cb` dùng `class="br"` | `#cb` dùng `.rc-r` · **vẫn** đòi số mục khớp nhãn đếm · **thêm** đòi sắp giảm dần |
`man-danh-muc §6a` | hai bản có `.bw`/`.bn` | hai bản có `<time>`/`<code>`/`.rc-act` · **thêm** đòi **không** bản nào còn `.bw` |
`bon-trang-thai` | (không canh `bars4`) | canh `bars4` đọc `TRANG_THAI`, và `TRANG_THAI` lấy từ `enum` của schema |

Kiểm **hai chiều**: quay về liệt kê tay ba trạng thái ⇒ đỏ · `TRANG_THAI` gõ tay
⇒ đỏ kèm *"thiếu: edited"*.

## Điều KHÔNG làm

- **Không** đụng token, **không** bump `ui_frozen` — FR này không đổi hợp đồng
  s5, chỉ đổi cách một màn trình bày dữ liệu nó đã có.
- **Không** sửa cơ chế popup — `<dialog>` native đã đúng. Chỉ sửa **chữ**.
- **Không** xoá `.r-cpt`/`.r-cat` — chúng là móc đang được dùng.
- **Không** đổi cơ sở đếm của hai panel `appr` — đó là đổi **ý nghĩa** panel;
  chỉ **khai** cơ sở ra ở nhãn.
