# M16_artifact — data flow

> ⚠️ Quy ước viết: tên **bảng / file / cột** luôn có một từ chỉ loại đứng trước —
> `check_ba` đọc dòng bảng mở đầu bằng một tên lowercase trong backtick như **một
> trường frontmatter** (M12 đã vấp, `WL-01K9W3S6M12`).

## 1 · Vào / ra

| | tên | sở hữu | M16 được làm gì |
|---|---|---|---|
| **vào** | `slug` bài `approved` | M02_kb | chỉ đọc, qua API của LÕI |
| **vào** | file `artifact/assets/engine.json` | **M16** | sở hữu; `loai → engine` + giới hạn từng engine |
| **vào** | file `core/assets/dia-chi.json` | M01_core | chỉ đọc — địa chỉ nhúng vào metadata |
| **ra** | file trong thư mục `kb/_media/` | **M09_thuvien** | **CHỈ THÊM**, không xoá, không ghi đè |
| **ra** | bản ghi bảng `media` | **M09_thuvien** | ghi **qua cửa ghi của LÕI**, kèm `la_dan_xuat = 1` |
| **ra** | file `artifact/log/egress.jsonl` | **M16** | append-only; chỉ khi gọi TTS **cloud** |

**M16 là module DUY NHẤT ghi vào `kb/_media/`** — nên nó là module duy nhất có cơ
hội phá byte. Đó là toàn bộ lý do `M16-R1` tồn tại.

## 2 · Hai loại hiện vật, một bảng — và cột phân biệt chúng

| cột trong bảng `media` | nguyên liệu người nạp | artifact M16 sinh |
|---|---|---|
| cột `sha256` | có | có |
| cột `byte` | có | có |
| cột `la_dan_xuat` | **0** | **1** |
| dựng lại được ? | **KHÔNG** | **CÓ** |

Dòng cuối không phải một thuộc tính kỹ thuật, nó là **hạng dữ liệu**. Một PDF 30
trang người dùng nạp bằng tay mất là **mất vĩnh viễn**; một file MP3 M16 sinh mất
thì chạy lại là có.

⇒ Không có cột `la_dan_xuat` thì một công cụ dọn `_media/` **không thể** an toàn, và
nó sẽ được viết dù sao (vì `_media/` là thứ nặng nhất trong repo).

## 3 · Vòng đời một job

```
POST /artifact {slug, loai}
  → trả NGAY job_id                       ← < 2 giây (AC-1.1)
  → kiểm bài approved                     ← từ chối TRƯỚC khi gọi engine
  → tra engine.json[loai]
  → [nếu cloud] sha256(văn bản) → egress.jsonl   ← GHI TRƯỚC KHI GỬI
  → gọi engine
  → dựng file ở thư mục TẠM               ← không ghi thẳng vào _media/
  → nhúng địa chỉ vào METADATA            ← không vẽ vào pixel
  → os.replace vào kb/_media/             ← NGUYÊN TỬ
  → ghi bảng media qua cửa ghi LÕI, la_dan_xuat = 1
```

**Mũi tên thứ tám là chỗ dễ bỏ nhất.** Ghi thẳng vào `_media/` thì một job bị giết
giữa lúc ghi để lại **file nửa vời** trong kho hiện vật — và một file nửa vời có
`sha256` không khớp nội dung là đúng thứ `check_media_dan_xuat` sinh ra để bắt, phát
hiện muộn.

## 4 · Egress — hai đường, và một trong hai phải chứng minh nó IM LẶNG

| đường | dữ liệu rời máy | bậc | log |
|---|---|---|---|
| piper local + `ffmpeg` | **0 byte** | — | **0 dòng** |
| Azure vi-VN | **toàn văn bài** | **4** | 1 dòng/lần gọi |
| FPT.AI | **toàn văn bài** | **4** | 1 dòng/lần gọi |

Vế *"local sinh 0 dòng"* không phải cho đủ đôi — nó là cách đường local **chứng
minh** được nó không gửi gì, thay vì ta tin nó không gửi (`M16-R4`).

**Người dùng bấm "tạo giọng đọc" trông như một tiện ích nhỏ**, nhưng nó gửi toàn văn
một bài ra một nhà cung cấp nước ngoài — cùng bậc với M12 gửi tài liệu nguyên liệu.
Đây là chỗ dễ đánh giá thấp nhất của cả đợt hai.

## 5 · Cái M16 KHÔNG chạm

| | vì sao |
|---|---|
| xoá / ghi đè file trong thư mục `kb/_media/` | `M16-R1` · `M09-R1` — mỗi DELETE phá byte vĩnh viễn |
| bài chưa `approved` | `AC-2.1` — chưa ai chịu trách nhiệm nội dung đó |
| bảng `bai_viet`, `tai_lieu`, `video` | M16 không sửa bản ghi; chỉ thêm hiện vật + liên kết |
| ghi bảng `media` trực tiếp | qua **cửa ghi của LÕI** (`M08-R2`) |
| chọn `credibility_max` hay nhãn nào | quyết định của người (`M01-R2`) |

## 6 · Nợ hợp đồng

| nợ | trạng thái |
|---|---|
| **cột `la_dan_xuat` đã có** trong bảng `media` | ✅ đo được: `PRAGMA table_info(media)` ⇒ `['sha256','byte','la_dan_xuat']` |
| **liên kết artifact ↔ bài nguồn chưa có chỗ** | bảng `media` hiện **không** có cột trỏ về `slug`. Cần **FR tới M09** trước khi M16 ghi liên kết |
| **engine chưa chốt** | `research_summary` §10 tự khai M16 *"giữ mức phác"*. Spec này chốt **luật**, không chốt engine |
| **ngưỡng 10 bản ghi** | `AC-6.1` là `soft` — người chốt số, máy chỉ đọc từ cấu hình |
| **`khu_vuc` của Azure và FPT.AI** | gần như chắc chắn **khác** nhau ⇒ rơi dự phòng là ca **rơi chéo khu vực**, phải khai tường minh (`M12-R5`) |

⚠️ **Nợ thứ hai là chặn thật.** Đo 2026-09-01: bảng `media` có đúng **ba** cột
(`sha256`, `byte`, `la_dan_xuat`) — **không** có cột nào trỏ về bài nguồn. Nên
*"artifact của bài nào"* hiện **không lưu được**, và `AC-4.1` (artifact mang ≥1 địa
chỉ về bài nguồn) chỉ giải được ở tầng **metadata trong file**, chưa giải được ở
tầng **kho**.
