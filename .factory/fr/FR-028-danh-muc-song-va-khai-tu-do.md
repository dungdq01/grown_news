# FR-028 — Danh mục sống bằng API, và khai báo nhãn tự do

mở_bởi: người dùng, 2026-08-25 (*"tôi muốn concept hay topic đều có API crud chứ ko phải đọc từ .yaml ra nữa. user sẽ khai báo và update liên tục các key cho vào API"*)
tới: FR-019 (vế "đòi bằng chứng ≥ ngưỡng") · `06_modules/M08_api/spec.md` §danh mục — FROZEN
mức: gỡ MỘT răng do FR-019 tự dựng. KHÔNG đụng M02-R3, KHÔNG đụng BRD, KHÔNG đổi nguồn sự thật.
trạng_thái: **DUYỆT** 2026-08-25 — người dùng chốt ba nhánh qua AskUserQuestion.
bị_phủ_một_phần: **FR-034** (2026-08-26). Nhánh 1 của FR này — *"GIỮ `.yaml` làm nguồn sự thật, màn hình đọc API sống"* — đã bị chỉ đạo mới hơn lật: `kb/_kho.sqlite` là nguồn chân lý, `concepts.yaml`/`categories.yaml` thành **export dẫn xuất một chiều**. FR-034 §Vấn đề gọi tên FR này. HAI nhánh còn lại **vẫn hiệu lực**: bỏ cổng bằng chứng (khai nhãn tự do) và "topic = chủ đề sẵn có". Đọc FR này mà bỏ qua dòng trên là dựng lại đường đọc yaml đã tháo.

## Vấn đề — và nó KHÔNG phải là thiếu CRUD

Câu người dùng nói đọc như "chưa có CRUD". Khảo sát nói ngược lại: CRUD đã đủ bốn
cho cả hai danh mục từ FR-019 + FR-021 (`router.mjs:50-70`). Vấn đề nằm ở hai chỗ
khác hẳn, và phải tách ra thì mới sửa đúng.

### Một — màn hình đọc BẢN CHỤP của yaml, không đọc yaml

Emitter đọc `concepts.yaml`/`categories.yaml` **lúc build** rồi in thẳng vào 10
mốc HTML của màn Danh mục (`home-pages/index.ts:738-856`). Ghi qua API xong, màn
hình không đổi — nên 5 toast phải đính kèm câu *"chạy `npm run build` để cập
nhật"* (`NHAC_BUILD`, `multiwindow.inline.ts:1088`).

Đây là **cùng một lớp bệnh** FR-024 đã chữa cho bài viết (`GET /api/index` đọc
lúc request thay cho `static/open-index.json`). Chữa cho bài rồi, chưa chữa cho
nhãn. Không cần database để chữa — cần đọc lúc request.

### Hai — cổng bằng chứng chặn đúng thứ người dùng muốn làm

`POST /api/concepts` từ chối nếu nhãn chưa nằm trong `concepts_proposed` của ≥N
bài (`danhmuc.mjs:88-96`, N đọc từ `07_curate/thresholds.yaml`). Người dùng muốn
"khai báo và update liên tục các key" — cổng này chặn thẳng ngay từ key đầu tiên.

## Vì sao cổng đó tồn tại — và bỏ nó mất gì

FR-019 khai nguyên văn: cổng bằng chứng là **răng thay cho `check_frozen`**.
Lập luận lúc đó: server tự chạy `check_frozen --ky` sau mỗi lần ghi nên hash luôn
khớp, tức `check_frozen` không còn là rào cho `concepts.yaml`; phải có thứ khác
thay vào, và thứ đó là "nhãn phải đã thành xu hướng trong kho".

**Bỏ cổng thì `kb/_nhat-ky-danh-muc.md` là lớp bảo vệ duy nhất còn lại.** Ghi
thẳng ra đây chứ không nới im lặng.

### Cái KHÔNG mất

M02-R3 cấm `concepts.yaml` bị sửa **bởi máy, không qua người**. Endpoint này
chưa bao giờ sinh tên — nó ghi cái người gõ. Bỏ ngưỡng không đưa máy vào vai chủ
thể, nên **M02-R3 không bị đụng tới**. Ba răng còn lại giữ nguyên:

| Răng | Ở đâu | Chặn gì |
|---|---|---|
| `id` kebab-case | `laSlug(id)` | tên rác, tên có khoảng trắng |
| `label_vi` do NGƯỜI khai | `label.length < 2` ⇒ 422 | máy đặt nhãn hộ (M08-R3) |
| chưa trùng, kể cả trùng alias | `themVaoDanhMuc` | hai mục cùng nghĩa |

### Rủi ro còn lại — nói trước, không giấu

Không còn ngưỡng thì bài toán FR-019 mô tả quay lại: `rag` / `RAG` /
`retrieval-augmented` / `rag-pipeline` — bốn tên một thứ, bộ lọc ra bốn tập rời
nhau. Thứ chặn nó bây giờ chỉ còn kiểm trùng + trùng alias, và **mắt người đọc
màn Danh mục**.

Đó là đánh đổi người dùng đã chọn có ý thức (*"Bỏ cổng, khai tự do"*). Ghi vào
đây để lần sau còn truy được vì sao danh mục phình.

Điều làm rủi ro này chịu được: **FR-021 đã mở đường sửa và xoá**. Ở FR-019 thêm
nhầm một nhãn là nhãn đó ở lại vĩnh viễn, nên cổng vào phải chặt. Giờ nhãn thừa
xoá được (khi 0 bài dùng), nhãn sai chính tả sửa được. Cổng vào chặt không còn
là cách duy nhất giữ danh mục sạch.

## Ba nhánh người dùng đã chốt

| Hỏi | Chốt | Vì sao không chọn nhánh kia |
|---|---|---|
| Bỏ yaml hay chỉ bỏ đọc-bản-build? | **Giữ yaml**, màn đọc API sống | `validate.py`, `check_danh_muc.py`, `enum category` trong schema FROZEN, `FROZEN.lock` đều đọc yaml. Chuyển sang SQLite là viết lại cả chuỗi cổng Python — mà cái đau thật không cần tới đó. |
| Cổng bằng chứng? | **Bỏ** | (trên) |
| "topic" là gì? | **chủ đề/category sẵn có** | không thêm chiều phân loại thứ ba ⇒ không đụng schema FROZEN |

## Phạm vi

### Được mở

- `themKhaiNiem` bỏ `nguongGop()` + `demDeXuat()` + nhánh 422 "chưa đủ bằng chứng".
- `GET /api/concepts` · `GET /api/categories` trả thêm `gom`, `aliases`,
  `dang_dung` — đủ để màn Danh mục dựng lại từ API.
- FE vẽ lại các mốc của màn Danh mục từ API thay vì để nguyên bản build.

### KHÔNG được mở

- **Cổng `xac_nhan` của chủ đề GIỮ.** Nó không phải ma sát với người dùng — FE tự
  gửi `xac_nhan: true` sau khi người dùng xác nhận trong popup
  (`multiwindow.inline.ts:2148`). Nó là bước hai chống bấm nhầm khi sửa **enum
  trong schema FROZEN**, việc không có đường lùi tự động.
- **Guard xoá GIỮ nguyên** (409 khi nhãn còn bài dùng, 409 khi kho rỗng). Bỏ cổng
  *vào* không phải lý do nới cổng *ra* — hai việc khác nhau: thêm nhãn thừa thì
  xoá được, xoá nhãn đang dùng thì bài trỏ vào hư không.
- **Nguồn sự thật vẫn là yaml.** Không có bảng nhãn trong `_index.sqlite`.
- **`demDangDung()` vẫn đếm MỌI trạng thái.** Xem mục dưới.

## Bẫy: hai con số "đang dùng", hai câu hỏi khác nhau

Sau FR này, `danhmuc.mjs` và `articles.mjs` cùng có phép đếm "bao nhiêu bài dùng
nhãn này". Chúng **phải khác nhau**, và đó là chủ ý:

| | Đếm trên | Trả lời câu | Sai thì sao |
|---|---|---|---|
| `demDangDung` (guard xoá) | **mọi** trạng thái | *"có bài nào trỏ vào không?"* | đếm hẹp đi ⇒ xoá nhầm nhãn một bài draft đang dùng ⇒ validate chặn mọi lần ghi bài đó sau này |
| `dang_dung` (hiển thị) | **chỉ approved** | *"nhãn này được dùng tốt chưa?"* | đếm rộng ra ⇒ bật API lên là con số trên màn nhảy so với bản build |

Emitter đếm trên `appr` và đã ghi lý do tại chỗ (`index.ts:730-740`). Bản API
phải khớp **emitter**, không khớp guard.

Đây đúng lớp lỗi M05-R3 chống (hai bản đếm lệch nhau im lặng), nên nó được ghim
bằng test chứ không bằng lời hứa: một phép kiểm so `dang_dung` với số emitter in
ra, một phép kiểm khác chứng minh guard **không** dùng con số đó.

## AC

- **AC-1** (hard) `POST /api/concepts` với nhãn 0 bài đề xuất ⇒ **200**, mục vào
  `concepts.yaml`, có dòng trong `kb/_nhat-ky-danh-muc.md`.
  `cmd: node web/test/danh-muc-them.test.js`
- **AC-2** (hard) Ba răng còn lại vẫn 422: thiếu `label_vi` · `id` không
  kebab-case · trùng id hoặc trùng alias.
  `cmd: node web/test/danh-muc-them.test.js`
- **AC-3** (hard) `GET /api/concepts|categories` trả `dang_dung` đếm **chỉ
  approved**, khớp con số emitter in ra; guard xoá vẫn đếm mọi trạng thái.
  `cmd: node web/test/api-index-khong-can-build.test.js`
- **AC-4** (hard) `hangNhan` (emitter) và `hangNhanFE` (FE) không lệch: cùng tập
  `data-*` + class.
  `cmd: node web/test/man-danh-muc.test.js`
- **AC-5** (hard) 5 toast của nhãn không còn `NHAC_BUILD`; 6 toast còn lại vẫn có.
  `cmd: node web/test/man-danh-muc.test.js`
- **AC-6** (soft) Người dùng thêm một key mới trên web, thấy nó hiện ngay và còn
  đó sau F5, không chạy `npm run build`.
