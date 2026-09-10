# FR-033 — Bỏ hẳn bước duyệt

**Mức**: s8 (M03_web) + M08_api + schema (frozen ⇒ ký lại)
**Ngày**: 2026-08-26
**Nguồn**: `upgrade.md` §"update chức năng" — *"bỏ logic duyệt bài mới và duyệt
các concept / category tạo mới → user tạo là lên chính thức luôn"*, người dùng
nhắc lại: *"tức là bỏ tất cả thứ gọi là chờ duyệt ấy"*

---

## 1 · Cái giá, nói trước

Schema đòi đủ ba trường M1 (`insight_new`, `skill_installed`, `review_minutes`)
khi `review_status: approved` (FR-001), còn M08-R3/B-B1 **cấm máy** điền chúng.
Bài tạo ra đã ở `approved` thì một trong hai phải nhường.

Tôi đã nêu điều này và dừng lại. Người dùng nhắc lại yêu cầu ⇒ đó là quyết định
của họ, và tôi làm **vế schema**: bỏ ràng buộc `approved ⇒ require M1`.

**Hệ quả: M1 không còn đo được từ kho.** Ba trường vẫn tồn tại và vẫn ghi được
nếu ai đó khai, nhưng không còn bước nào sinh ra chúng.

**Điều KHÔNG mất — và giờ nó là toàn bộ phần còn lại của B-B1:** máy không bao
giờ tự khai ba trường đó. Trước đây luật ấy được bảo vệ *gián tiếp* (schema bắt
buộc ⇒ ai đó phải điền ⇒ phiếu hỏi người). Giờ chúng là tuỳ chọn, nên đường tắt
*"điền đại một giá trị mặc định cho xong"* **mở ra** — và `cac-man-con-lai §5`
là chỗ duy nhất canh nó, bằng cách đọc thẳng `status.mjs`.

## 2 · Ranh giới VẪN CÒN, và nó ở chỗ khác

`gate.py:123` (M05-R1) giữ nguyên `draft` cho hàng **nhập từ ngoài** qua
`_inbox/`. Một file thả vào thư mục mà tự lên site là chuyện khác hẳn với việc
bạn bấm "Ghi vào kho".

Nên `draft`/`edited` vẫn có thể tồn tại, và cửa sổ đọc vẫn có nút đưa chúng lên
site. Điều bỏ đi là **hàng đợi** — một danh sách riêng để duyệt — chứ không phải
khả năng tồn tại của trạng thái.

## 3 · Bốn thay đổi ở backend

| Chỗ | Trước | Sau |
|---|---|---|
`taoBai` | `review_status = "draft"` | `"approved"` |
`suaBai` | nội dung đổi ⇒ hạ `edited` | **bỏ nhánh** — sửa không đổi trạng thái |
`doiTrangThai` | `approved` đòi đủ M1 ⇒ 422 | M1 **tuỳ chọn**, chỉ kiểm KIỂU |
`themChuDe` | đòi cờ `xac_nhan` | bỏ — `label_vi` + `gom` vẫn bắt buộc |

**Bảng chuyển** đổi hai cặp:
- `rejected → approved` **MỞ** — trước phải vòng qua `draft`, tức qua hàng đợi.
- `approved → draft` **ĐÓNG** — đó đúng là "trả về hàng chờ". Muốn gỡ một bài
  khỏi site thì **Loại**: có lý do, và là một phán quyết chứ không phải một chỗ
  đứng chờ.

Vì sao bỏ nhánh `edited`: nó là hàng đợi mang tên khác. Sửa một dấu phẩy trong
bài của mình và bài biến mất khỏi site cho tới khi tự duyệt lại bản thân.

## 4 · Giao diện — bỏ theo TÊN GỌI, không chỉ bỏ cái màn

Người dùng nói *"bỏ tất cả thứ **gọi là** chờ duyệt"*. Nên phạm vi gồm cả chữ:

| Bỏ | |
|---|---|
mục `#cho-duyet` trong Kho | cùng 4 mốc: `queue` · `qcount` · `mbq` · `tbn` |
badge số trên tab Kho | nó đếm hàng đợi |
phiếu duyệt | hỏi ba câu M1 cho một thủ tục không còn |
nút "Bỏ duyệt" | `approved → draft` = trả về hàng chờ |
`dongDuyet()` | hàm dựng một hàng của danh sách chờ |

| Đổi tên | |
|---|---|
`choDuyet` → `chuaLen` | *"chờ duyệt"* mô tả một **THỦ TỤC**; *"chưa lên site"* mô tả một **TRẠNG THÁI**. Thủ tục bỏ, trạng thái còn. |
"Đưa lại vào hàng chờ" → **"Đưa lên site"** | cùng nút, đổi đích: `rejected → approved` |
tab "Chờ duyệt" ở Danh mục → **"Đề xuất từ bài"** | nó liệt kê `concepts_proposed` do BÀI đề xuất, không phải một bước duyệt cho thứ người dùng tạo |

Con số *"chưa lên site"* **giữ lại**: nó thật (hàng nhập từ `_inbox/`), và bỏ
đếm là giấu một phần của kho.

## 5 · 12 phép kiểm đổi chiều — và ba cái tôi phải viết lại thước đo

Bộ test neo rất chặt vào vòng đời cũ. Đa số là đảo chiều thẳng. Ba cái đáng ghi:

**`bon-trang-thai` §2b** — đo *"tên trạng thái có xuất hiện gần nút không"*
(`st === "approved"[\s\S]{0,600}?data-act="loai"`). Chỉ đúng khi mỗi nút nằm
trong một nhánh riêng. FR-033 gộp điều kiện (`chuaLen`, `st !== "rejected"`) và
nó đỏ oan dù FE vẽ đúng. Sửa: **đọc hai điều kiện đó rồi TÍNH** tập nút của từng
trạng thái.

**`luong-day-du`** — ma trận 16 cặp **gõ tay**. Đúng lớp lỗi repo đã sửa bốn lần
ở chỗ khác. Sửa: **đọc `BANG_CHUYEN` từ `status.mjs`**. Phép kiểm vẫn có răng —
nó không hỏi *"bảng có đúng 7 cặp không"* mà hỏi *"API có xử đúng bảng nó tự khai
không"*. Bảng sai là một quyết định thiết kế và nó có FR; API lệch bảng mới là bug.

**`api-guard` §5** — *"không chỗ nào gán `review_status = 'approved'` bằng
literal"*. Đây là cổng canh đúng thứ FR này cố ý phá. **Không bỏ — thu hẹp**: cho
đúng MỘT chỗ, khai bằng **tên hàm** (`taoBai`), cấm phần còn lại. Đếm theo hàm
chứ không theo số lần: thêm một literal ở `doiTrangThai` rồi bớt một ở `taoBai`
thì tổng vẫn khớp. Và có chiều ngược: `taoBai` **phải** còn gán — mất nó là bài
tạo mới quay về `draft`, tức dựng lại hàng đợi.

`test_gates.py::test_approved_thieu_truong_M1_bi_chan` cũng đảo chiều, và tên đổi
theo (`test_approved_khong_con_doi_truong_M1`) — một tên nói ngược với thân hàm
là thứ người đọc sau sẽ tin.

## 6 · Ba lần `\n` và `\b` cắn tôi trong một lượt

Viết test qua script Python + bash heredoc, ba lần một chuỗi bị tầng escaping
dịch lại:

- `\n` trong `split("\n")` và trong regex → **newline thật** ⇒ SyntaxError
- `\b` → **backspace (0x08)**, vô hình với `grep`/`Read`/terminal, chỉ `repr()`
  phơi ra. Regex `/<(\/?)div\x08/g` không khớp gì ⇒ vòng lặp không chạy ⇒ hàm trả
  về cả phần còn lại của trang ⇒ phép kiểm *"mốc không được trắng"* **luôn xanh**.

Cái cuối chỉ bị bắt bởi **kiểm hai chiều**: làm mốc rỗng thật và nó vẫn exit 0.
Không có bước đó thì một phép kiểm vô răng đã nằm trong bộ test — và nó tệ hơn
không có phép kiểm, vì nó *bảo đảm* một điều nó không kiểm.

**Luật**: không viết regex chứa `\b`/`\n` qua script Python. Dùng Edit, chuỗi
raw, hoặc tránh hẳn (`(?![a-z])` thay `\b`).

## 7 · Kết quả đo

| | |
|---|---|
`npm test` | **43/43** · chạy độc lập 0 file đỏ |
cổng Python · pytest | **14/14** · **30 passed** |
`contrast-audit` · `validate kb` | 62 cặp 0 trượt · 0 file 0 lỗi (kho trắng) |
`gn.css` · `gn.js` | ≤100 KB |

Kiểm tay trên server thật, kho tạm:

```
1 tạo            -> 201 · trên đĩa: approved · M1: (không có)
2 sửa            -> 200 · vẫn approved
3 loại           -> 200
4 lên site lại   -> 200 · reject_reason đã bỏ
5 thêm khái niệm -> 200
6 thêm chủ đề    -> 200  (không cần xac_nhan)
```

## 8 · Điều KHÔNG làm

- **Không** đụng `gate.py` — hàng nhập từ `_inbox/` vẫn dừng ở `draft` (M05-R1).
- **Không** bỏ ba trường M1 khỏi schema — chúng vẫn ghi được, chỉ thôi bắt buộc.
- **Không** cho máy điền hộ chúng: không `?? false`, không `|| 0`. Vắng là sự
  thật (*"không ai khai"*); `false` là một lời khai không ai đưa ra.
- **Không** bỏ kiểm KIỂU: tuỳ chọn nghĩa là được phép **vắng**, không phải được
  phép là **rác**.
- **Không** bỏ phiếu LOẠI — nó hỏi `reject_reason`, thứ schema **còn** đòi. Đó
  là một phép kiểm, không phải một thủ tục.
- **Không** bỏ trang chuyển hướng `/cho-duyet/` — bookmark cũ không được 404.
  Chỉ đổi đích sang `../kho/` vì neo `#cho-duyet` đã thành neo chết.
- Không commit, không push.

## 9 · Nợ khai rõ

- **M1 không còn đo được.** Nếu sau này cần lại, đường ngắn nhất là một nút
  *"ghi nhận đã đọc"* tuỳ chọn ở cửa sổ đọc — không phải dựng lại hàng đợi.
- `draft`/`edited` giờ chỉ đến từ `_inbox/`. Chúng hiện ở màn **Tất cả** như mọi
  bài khác và mở ra có nút "Đưa lên site". Không có danh sách riêng — một danh
  sách riêng chính là hàng đợi.
- Ô KPI *"chưa lên site"* sẽ đọc **0** trong hầu hết trường hợp (kho trắng, và
  mọi bài tạo trên web đều lên thẳng). Đó là số đúng, không phải lỗi.
