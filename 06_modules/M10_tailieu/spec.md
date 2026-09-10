# M10_tailieu — module TÀI LIỆU: pdf · ppt · word

> Nguồn đối chiếu: `core/assets/kho.schema.sql` (bảng `documents`) ·
> `core/assets/nhom-loai.json` · `web/api/dungchung.mjs` · `web/render/trang.mjs`

| | |
|---|---|
| **Mở bởi** | FR-038 — *"module bài viết tách biệt với video / tài liệu… các giao diện nạp bài, CRUD cũng cần tách biệt rõ ràng"* |
| **Sở hữu** | bảng `documents` · màn `/tai-lieu/` · màn nạp `/tai-lieu/nap/` · CRUD tại chỗ của tài liệu |
| **Vào** | file pdf/ppt/word ≤ 25 MB · một câu tóm tắt · nhãn `category`/`concepts` |
| **Ra** | một hàng `documents` (`source_type: tai-lieu`, `ho_so: thu-vien`) · một dòng `media` · byte export `kb/_media/<sha256>.<đuôi>` |
| **KHÔNG sở hữu** | kho hiện vật (M09 — bảng `media`, magic-byte, sáu đầu đề) · cửa ghi DB (M08) · export/import (M02) · chuyển đổi ppt→pdf (nợ, không ở v1) |

---

## 1 · Vì sao module này tồn tại RIÊNG

FR-037 dựng tài liệu thành một **hồ sơ** (`ho_so: thu-vien`) trong màn bài viết.
Người dùng đính chính hai lần. Lần thứ hai nguyên văn: *"ko gộp chung các màn và
tính năng lại với nhau"*.

Điều tách được đo, không phải cảm tính — ba thứ khác nhau về **bản chất**:

| | bài viết | tài liệu |
|---|---|---|
nội dung | thân bài theo khung 5 mục | **một file**, thân bài chỉ là ghi chú |
cổng validate | hồ sơ `phan-tich` — mục/dẫn nhập/tinh túy/locator | hồ sơ `thu-vien` + magic-byte + trần 25 MB |
`priority` | tính từ `skill_candidates` | **luôn 0** (không có ứng viên skill) |
sửa | form 8 ô | phải có ô `media` — form 8 ô KHÔNG có |

Dòng cuối là lỗ đã đo: `suaTuCua()` (`multiwindow.inline.ts:1884`) đưa bản
`tai-lieu` vào form `#f-bai`, form không có ô nào cho `media`, và chỉ `FM_GOC`
(`:1882`) giữ hộ. Tức **sửa một tài liệu hôm nay dựa vào may**, không dựa vào cơ
chế. Màn riêng là chỗ chữa nó.

## 2 · Business logic

### 2.1 · Bảng `documents` — cùng hình dạng, CHECK hẹp hơn

Giữ nguyên mọi cột của `articles` (frontmatter JSON + than + version + etag + 7
cột GENERATED + hai CHECK buộc frontmatter khớp cột + 3 INDEX). Khác duy nhất:

```sql
source_type TEXT NOT NULL CHECK (source_type = 'tai-lieu')
```

**Không thêm cột `mime`/`ten_goc`/`so_byte`** — chúng sống trong
`frontmatter.media`, cùng triết lý *"mọi cột khác GENERATED từ JSON"* đã có.

> **AC-2.1.1** · Hàng `documents` chỉ nhận `source_type = 'tai-lieu'`; mọi ràng
> buộc của `articles` còn hiệu lực trên bảng này (thử vi phạm trên BẢN SAO DB).
> `hard` · `cmd: python core/tests/check_ba_bang.py`

### 2.2 · Màn `/tai-lieu/` — danh sách + CRUD tại chỗ

Chỉ đọc `documents`, **không** trộn loại khác. CRUD (sửa · xoá · đổi trạng thái)
nằm **trên chính màn này**, không ở chân cửa sổ đọc dùng chung.

Cạm bẫy dispatch đã đo: `bam()` (`multiwindow.inline.ts:638-639`) có
`const win = t.closest(".bk"); if (!win) return` — **mọi `data-act` bắt buộc nằm
trong `.bk`**. Nút CRUD của màn này phải bắt **TRƯỚC** dòng đó, cùng khuôn
`data-suanhan`/`data-xoanhan` mà màn Danh mục đã dùng (`:622`, `:629`).

> **AC-2.2.1** · Màn `/tai-lieu/` chỉ hiện bản ghi `tai-lieu`; gieo thêm bài viết
> và video thì số đếm của màn KHÔNG đổi.
> `hard` · `cmd: cd web && node test/man-tai-lieu.test.js`

> **AC-2.2.2** · Sửa một bản `tai-lieu` qua form của màn này thì `media.sha256`
> KHÔNG đổi — và điều đó đúng vì form CÓ ô `media`, không vì `FM_GOC` giữ hộ.
> `hard` · `cmd: cd web && node test/man-tai-lieu.test.js`

### 2.3 · Màn nạp `/tai-lieu/nap/`

Byte đi trước, bản ghi đi sau (M09 §2.3 — hạ tầng đã có). Màn này chỉ là **giao
diện**: chọn file → tóm tắt → nhãn → ghi.

**Nhãn là bắt buộc theo yêu cầu người dùng**: *"cái tài liệu (pdf, ppt, docs) và
url video cũng gán với concept và category như bài viết"*. Cổng 5/5b của
`validate.py` đã áp cho mọi hồ sơ, nên đây là việc của **form**: phải có ô chọn
`category` + `concepts` từ danh mục, không để trống rồi ghi.

> **AC-2.3.1** · Form nạp có ô chọn `category` và `concepts` đọc từ danh mục
> (`GET /api/categories`, `GET /api/concepts`); nhãn ngoài danh mục bị chặn.
> `hard` · `cmd: cd web && node test/man-tai-lieu.test.js`

> **AC-2.3.2** · `file.size` kiểm TRƯỚC `fetch` — `413` không tới được client
> giữa lúc upload (đo ở `WL-01K9N7FR036B5`).
> `hard` · `cmd: cd web && node test/thu-vien-nap.test.js`

## 3 · Công thức

Không có công thức riêng. `priority` của bản ghi tài liệu **luôn 0** vì nó không
có `skill_candidates` — và đó là lý do M09-R4 giữ nó ra khỏi ba pane chất lượng.

## 4 · Điều module này CẤM

- **Không** đọc/ghi bảng `articles` hay `videos`.
- **Không** tự cầm SQL — mọi mutation qua `web/api/dungchung.mjs` (M08-R2).
- **Không** nhận `sha256`/`so_byte` từ client (M09-R2).
- **Không** trộn danh sách loại khác vào màn `/tai-lieu/` — chỉ Kho và Tổng hợp
  được trộn.

## 5 · Trạng thái

⬜ **chưa dựng** — spec này là hợp đồng của C0 (FR-038). Thi hành ở C2→C7.
