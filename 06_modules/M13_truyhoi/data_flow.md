# M13_truyhoi — data flow

> Dữ liệu nào đi đâu, ai sở hữu. Công thức đầy đủ sống ở `spec.md`.
>
> ⚠️ Quy ước viết: tên **bảng / file / cột** ở đây luôn có một từ chỉ loại đứng
> trước (`bảng …`, `cột …`). Không phải để đẹp — `check_ba` đọc dòng bảng mở đầu
> bằng một tên lowercase trong backtick như **một trường frontmatter**, và M12 đã
> vấp đúng chỗ đó (`WL-01K9W3S6M12`).

## 1 · Vào / ra

| | tên | sở hữu | M13 được làm gì |
|---|---|---|---|
| **vào** | view `ban_ghi` | **M02_kb** | **chỉ đọc**, qua HTTP `127.0.0.1:8787` — không mở file DB |
| **vào** | bảng `media` — **hiện vật văn bản** (`text/vtt` · `.srt` · `text/plain`) | **M09_thuvien** | **chỉ ĐỌC**, qua HTTP (`GET /api/xuat/<slug>/txt\|srt` · `GET /api/articles/media/<sha>`) — **không** mở `kb/_media/**` (`FR-072` §1.3) |
| **vào** | file `core/assets/dia-chi.json` | M01_core | chỉ đọc — 6 dạng địa chỉ (thêm `file-anchor`, `FR-073`) |
| **vào** | file `core/assets/dai-han.json` | **M01_core** | chỉ đọc — *(`FR-072` §1.2 · chốt PM 2026-09-09: bản trước ghi chủ là **M13**; file về M01 để hai THỢ đọc một bảng ở LÕI, không THỢ nào sở hữu luật của THỢ kia)* |
| **ra** | file `truyhoi/index.sqlite` | **M13** | sở hữu **toàn bộ**; xoá được, dựng lại được |
| **ra** | file `truyhoi/golden.yaml` | **M13** | sở hữu; expect **địa chỉ**, không expect điểm |
| **ra** | JSON `{đoạn, địa_chỉ, điểm, số_bản_ghi_trong_phạm_vi}` | — | trả cho M14 |

**M13 không sở hữu một entity nào trong `kb/`**, và chỉ mục của nó **không phải
chân lý**. Đó là hình dạng đúng: một tầng đọc hoàn toàn có thể bị xoá.

## 2 · Hình dạng một chunk

| cột | ở đâu | vì sao |
|---|---|---|
| cột `id` | bảng thường | `content_rowid` của FTS |
| cột `file`, `heading`, `anchor` | bảng thường | ba thứ hợp thành **địa chỉ bấm được** |
| cột `line_start`, `line_end` | bảng thường | lấy **miễn phí** lúc parse; là địa chỉ dạng `file:A-B` |
| cột `title`, `body` | bảng thường | `body` là **bằng chứng trích dẫn** (đầy đủ, không cắt) |
| cột `tim` | bảng thường | `chuan_hoa_tim(body)` — **chỉ để tìm**, không bao giờ hiển thị |
| cột `checksum` | bảng thường | `sha256` nội dung file; điều kiện re-index tăng dần |
| cột `doc_id` | bảng thường | slug của bản ghi — khoá `M14/data_flow §2` đã chốt cho `citations[].doc_id` (`FR-072` §1.1) |
| cột `dia_chi` | bảng thường | dạng **phân giải được** theo `dia-chi.json`: `file-dong` cho `than` và `.md`/`.txt`, `slug-moc` cho cue transcript |
| cột `nguon_van_ban` | bảng thường | `than` · `hien-vat:text/vtt` · `hien-vat:text/plain` — nói ra một đoạn đến từ ĐÂU (`FR-054` §1.4: chữ *verified* đổi nghĩa với transcript ASR) |
| FTS index | bảng ảo | chỉ `title` + `tim`; `content=chunks` nên **không nhân đôi** `body` |

Ba cột cuối là cột **mới** *(`FR-072` §1.1)*. Với chunk từ cue transcript, ba cột
`anchor` · `line_start` · `line_end` mang `NULL` **tường minh** — một giá trị KHAI,
cùng lối `nguon: null` mà chính FR chốt *(PM 2026-09-09)*.

**`tim` là cột hiển nhiên nhất bị dùng sai.** Nó đã bị `chuan_hoa_tim()` làm biến dạng
(chèn cách quanh chữ Hán, `đ`→`d`, bỏ dấu). Trả nó ra cho người đọc là trả một câu
tiếng Việt không dấu và tiếng Trung rời rạc. Bằng chứng luôn là `body`.

## 3 · Cái M13 KHÔNG chạm

| | vì sao |
|---|---|
| ghi vào thư mục `kb/**` | `M13-R3`. Một trường chỉ sống trong index là lúc "mất chỉ mục không mất gì" thành lời nói dối |
| file `kb/_kho.sqlite` | cùng lý do; đọc qua API của LÕI |
| **GHI** vào bảng `media`, và **mọi** truy cập trực tiếp `kb/_media/**` | `M09-R1`: byte là thứ không dựng lại được. Chỉ mục thì dựng lại được — hai loại dữ liệu, hai quyền |
| bất kỳ lời gọi mạng **ra ngoài `127.0.0.1`** | `M13-R5`. `FR-043` chưa khai bậc nào cho truy hồi |
| trích text PDF | `FR-072` §5 — việc của M12 (`FR-079`); M13 đọc kết quả qua cùng cửa, 0 dep mới |

⚠️ **`FR-072` §1.3 · vế ĐỌC của bảng `media` được mở.** Bản trước của mục này viết
*"bảng `media` và thư mục `kb/_media/**` — KHÔNG chạm"*. Lý do (*"byte là thứ không
dựng lại được"*) **đúng cho GHI, không đúng cho ĐỌC**: đọc một hiện vật văn bản không
làm mất byte nào, và chỉ mục sinh ra từ nó vẫn là dữ liệu **dẫn xuất**. Nay sửa thành:
M13 **ĐỌC** hiện vật văn bản **qua API của LÕI** (`GET /api/xuat/<slug>/txt|srt` ·
`GET /api/articles/media/<sha>`), **không** mở `kb/_media/**`, **không** ghi. Đo
2026-09-09: câu cũ làm truy hồi mù 11/13 bản ghi trong kho.

## 4 · Dữ liệu DẪN XUẤT và số ĐO ĐƯỢC

| thứ | loại | ai sinh |
|---|---|---|
| toàn bộ file `index.sqlite` | **dẫn xuất** | dựng lại từ kho, bất cứ lúc nào |
| cột `anchor` | **dẫn xuất** | ASCII-fold từ heading — **cùng luật** với M03 |
| cột `tim` | **dẫn xuất** | `chuan_hoa_tim(body)` |
| cột `dia_chi` | **dẫn xuất** | ghép từ `file`+`line_*` (hoặc `slug`+mốc cue) theo dạng đã khai trong `dia-chi.json` — **không** lưu một dạng thứ hai |
| số `điểm` (bm25) | **dẫn xuất** | đổi khi `w_title` đổi ⇒ **golden set không được ghim nó** |
| số truy vấn 0 kết quả | **số ĐO** | đếm và ghi; là tín hiệu điểm rẽ hybrid |
| số lần gõ lại ≥2 | **số ĐO** | cùng mục đích |
| tham số `w_title` | **cấu hình** | người đặt sau khi đo; **hai** giá trị — vi/en và zh |

Hai dòng cuối của cột "dẫn xuất" là chỗ dễ nhầm nhất: `điểm` là **dẫn xuất của
cấu hình**, nên bất kỳ test nào ghim `điểm` sẽ đỏ mỗi lần tinh chỉnh xếp hạng — và
một test đỏ vì lý do vô hại là test dạy người ta bỏ qua nó.

## 5 · Nợ hợp đồng, đo được hôm nay

**`chuan_hoa_tim()` chưa có bản Python nào.** *(Tên chốt PM 2026-09-09 — bản trước gọi
nó `chuan_hoa()`, trùng tên với `chungcat/src/verify.py:55` vốn có nghĩa khác.)*

```bash
grep -rn "NFD\|unicodedata\|combining" --include=*.py core 05_intake | wc -l
# -> 0   (đo 2026-09-01)
```

Luật ASCII-fold hiện chỉ tồn tại bằng **JavaScript** (`multiwindow.inline.ts:1015-1021`).
Bản Python của M13 là bản **thứ hai của một luật** — đúng lớp lỗi đang làm
`check_danh_muc` đỏ ngay lúc này (hai bản `frontmatter.schema.json` lệch nhau ở
`media.mime`).

Nên `M13-R2` (anchor khớp M03) **không phải một AC cho đẹp**: nó là cổng duy nhất
chặn hai bản trôi khỏi nhau. Và nó phải so **hai bản thật**, không so bản Python với
một bảng giá trị mong đợi viết tay — so với bảng viết tay thì cả hai bản cùng trôi
mà cổng vẫn xanh.
