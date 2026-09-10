# WO-016 — bốn chiều nhãn: PHÂN LOẠI · LOẠI NGUỒN · CHỦ ĐỀ · KHÁI NIỆM

loại: thiếu tính năng (facet + đường gán) — không phải bug dữ liệu
module: **M03_web** (`trang.mjs` · FE lọc) · **M08_api** (đường đọc loại nguồn) ·
M10_tailieu · M11_video
mức: người dùng THẤY được — facet **Chủ đề** không tồn tại trên bất cứ màn nào

## Người dùng nói (2026-08-28)

> Phân biệt rõ **PHÂN LOẠI** / **Loại nguồn** / **CHỦ ĐỀ (category)** và
> **KHÁI NIỆM (concept)**
>
> - `/tat-ca/`: thanh menu hiển thị rõ cả 4
> - `/tai-lieu/` `/video/` `/bai-viet/`: đủ Loại nguồn / Chủ đề / Khái niệm
> - `/khai-niem/`: đủ component cho Loại nguồn / Chủ đề / Khái niệm ⇒ liệt kê
>   đủ các loại nguồn / chủ đề và khái niệm (cần làm bảng DB lưu trữ nếu chưa
>   có, sau đó mapping sang bảng dữ liệu khác)
>
> user story: khi tạo bài viết mới / upload tài liệu / tải video, url video →
> cần gán loại nguồn, concept và category, 3 trường này **get từ DB**

## Hiện trạng, đo được

Cắt HTML theo từng `v-*` (đo cả trang thì năm màn in ra cùng một danh sách —
mọi màn nằm chung một tài liệu):

| màn | cần | đang có | thiếu |
|---|---|---|---|
`/tat-ca/` | phân loại · nguồn · chủ đề · khái niệm | `pl` · `cpt` | **`nguon` · `cat`** |
`/bai-viet/` | nguồn · chủ đề · khái niệm | `nguon` · `cpt` | **`cat`** |
`/tai-lieu/` | nguồn · chủ đề · khái niệm | `nguon` · `cpt` | **`cat`** |
`/video/` | nguồn · chủ đề · khái niệm | `nguon` · `cpt` | **`cat`** |
`/khai-niem/` | ba component | **không facet nào** | cả ba |

Facet **Chủ đề** thiếu ở **mọi** màn — dù `categories` đã có bảng, đã có API, và
form bài viết đã có ô `f-cat`. Nhãn có mà không có đường lọc theo nó.

Đường nạp:

| màn nạp | byte | ô nhập | `<select>` |
|---|---|---|---|
`/bai-viet/nap/` | 9244 | 15 | 3 (`f-conf` · `f-cred` · `f-type`) |
`/tai-lieu/nap/` | 2004 | 3 | **0** |
`/video/nap/` | 1625 | 3 | **0** |

Hai đường sau **không có ô nào** cho loại nguồn / chủ đề / khái niệm ⇒ mọi tài
liệu và video vào kho với `category` và `concepts` rỗng, và ba facet ở trên sẽ
rỗng theo dù có dựng.

## Bảng DB: đã có, KHÔNG cần tạo

`kho.schema.sql:220` `concepts (id, label_vi, aliases)` ·
`:225` `categories (id, label_vi, gom)` · `:188` `VIEW nhan` đã mapping
nhãn → bản ghi qua `json_each`. API đã có: `GET/POST /api/concepts` ·
`/api/categories` · `PATCH`/`DELETE` một nhãn. `napDanhMuc()` (FE) đã lấy
`f-cpt`/`f-cat` **từ DB**.

Nên phần *"cần làm bảng DB lưu trữ nếu chưa có"* đã xong từ trước. Việc còn lại
là **đưa nó lên mặt** ở hai đường nạp kia và bốn thanh facet.

## ĐÍNH CHÍNH phép đo đầu tiên của tôi (đo tiếp mới thấy)

**Ba điều tôi khai ở trên sai hoặc nông.**

**(1) `cat` KHÔNG thiếu mã.** `bangLoc()` đã phát `nhom("chủ đề", "cat", …)` từ
trước. Nó vắng mặt vì `nhom()` trả chuỗi rỗng khi `!cap.length` — tức **không bản
ghi nào có `category`**. Kho thật: `category: []`. Kho mock: **không khai trường
này**. Vấn đề nằm ở DỮ LIỆU, không ở facet.

**(2) Gốc sâu hơn nữa: hai bảng nhãn RỖNG.**

```
categories   0 hàng
concepts     0 hàng
nhan         chỉ 5 dòng `proposed` (máy đề xuất, chưa ai xác nhận)
```

Chuỗi nhân quả đầy đủ: bảng rỗng ⇒ `f-cat`/`f-cpt` nạp từ DB nên chúng cũng rỗng
⇒ không ai gán được gì ⇒ `category: []` vĩnh viễn ⇒ facet không bao giờ hiện.
Dựng thêm facet mà không giải khúc này là dựng bốn tiêu đề rỗng.

**Và tôi KHÔNG được tự gieo nhãn.** M02-R3: chỉ người khai nhãn, máy không tự
sinh tên. Nên việc của đơn vị này là làm **đường** cho người tạo nhãn dễ và thấy
được, không phải điền hộ danh sách.

**(3) `/khai-niem/` đã có hai trong ba.** Màn có `dm-tabs`, hộp thoại *"Khái niệm
mới"* và *"Sửa nhãn"*, ô `dlg-gom` cho `gom` của chủ đề — tức khái niệm và chủ đề
đã có đủ đường thêm/sửa. Thiếu đúng **loại nguồn** (chuỗi "loại nguồn" không xuất
hiện trong `v-concepts`), và nó phải là component **chỉ đọc** — loại nguồn là
enum của schema, không phải nhãn người tạo.

**(4) `/tat-ca/` thiếu `nguon` là lỗi mã thật.** `bangLoc` dùng `if/else`:
`module ? nhom("loại nguồn"…) : nhom("phân loại"…)`. Màn trộn nhận `pl`, màn loại
nhận `nguon`, không màn nào nhận cả hai. Bốn chiều ở `/tat-ca/` đòi nhánh này
thành "màn trộn có CẢ HAI".

## LOẠI NGUỒN: giữ ở bảng khai, KHÔNG chuyển vào DB

Đây là chỗ tôi làm khác câu chữ của yêu cầu, và nói rõ vì sao:

`loai-nguon.json` **sinh ra chính các ràng buộc `CHECK` của DDL**. Đưa danh sách
loại nguồn vào một bảng DB là có **hai** nguồn sự thật cho cùng một enum — bảng
nói một đằng, `CHECK` nói một nẻo, và cái lệch đó im lặng cho tới khi một `INSERT`
bị từ chối vì lý do không ai đọc được.

Thêm nữa `coFileBai()` và phép kiểm `type` của route **phải chạy khi DB chưa tồn
tại** (kho mới tinh là trạng thái hợp lệ) — bảng DB thì không đáp được.

Tinh thần *"get từ DB"* là **FE không gõ tay danh sách**. Nó được giữ bằng cách
mở `GET /api/loai-nguon` đọc từ bảng khai, để FE lấy cả ba trường qua cùng một
kiểu lời gọi. Nếu người dùng vẫn muốn một bảng thật thì đó là FR trên
`kho.schema.sql` (FROZEN) và tôi mở FR trước, không tự làm.

## Bắt buộc: cổng module chặn (người dùng chốt 2026-08-28)

`cong-module.mjs` (**không** frozen) đòi `≥1 category` + `≥1 concepts` cho
`tai-lieu` và `video` ⇒ POST/PUT thiếu thì **400**. Không sửa `required` của
`frontmatter.schema.json`: file đó FROZEN, và mọi bản ghi cũ thiếu hai trường sẽ
thành không hợp lệ trên CẢ KHO.

## Kỳ vọng

1. `/tat-ca/` bốn tầng facet: `pl` · `nguon` · `cat` · `cpt`
2. ba màn loại: ba tầng `nguon` · `cat` · `cpt` (KHÔNG có `pl` — một dòng)
3. `/khai-niem/` liệt kê đủ ba: loại nguồn · chủ đề · khái niệm, mỗi mục kèm số
   bản ghi đang dùng
4. ba đường nạp đều có ô loại nguồn + chủ đề + khái niệm, **nạp từ server**
5. gửi tài liệu/video thiếu chủ đề hoặc khái niệm ⇒ 400, có câu nói ra thiếu gì

## Ràng buộc

- `gn.js` dư **1178 byte** / `gn.css` dư **7674 byte**. Phần lớn việc này là SSR
  (`trang.mjs` → HTML) nên rẻ về JS; đo lại sau mỗi `node build-fe.mjs`.
  Vượt trần ⇒ **tách bundle** (mã nạp/form là 20941 byte = 23% `gn.js` và đã bị
  `catNap()` cắt khỏi 7/10 trang), **không nới trần**.
- `data-loai` giữ nghĩa `source_type`; chiều mới đi vào `data-cat`.
- Tầng facet khai ở **một** nơi (`TANG` trong FE + `bangLoc` trong SSR đọc cùng
  danh sách), không gõ tay hai lần.
