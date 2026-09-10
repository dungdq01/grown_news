# PLAN 2026-09-09 — ba việc, tuần tự dễ → khó

Chỉ đạo: *"viết plan và làm tuần tự 3 task từ dễ đến khó"*.

## Định tuyến (ba câu của `/factory:go`)

| việc | ≥2 module? | chạm FROZEN? | đường |
|---|---|---|---|
| A · màn thùng rác VIỆC | không (M03) | không | **PATCH** |
| B · thumbnail video URL | M12 + M08 | không | **PATCH** ×2 đơn vị |
| C · thumbnail mp4 / PDF | M12 | không | **PATCH** |

Không việc nào cần FR: `FROZEN.lock` không chứa file nào trong ba phạm vi.

## ⚠️ Đính chính thứ tự bạn nêu

Bạn xếp *"reel fb"* là việc thứ hai, ngầm hiểu nó nhẹ hơn T12-29. **Nó là một
NHÁNH của chính T12-29** — và là nhánh của host KHÓ NHẤT:

```
youtube   ảnh đoán được từ id     i.ytimg.com/vi/<id>/hqdefault.jpg   ← ĐÃ CÓ
tiktok    oEmbed CÔNG KHAI
fb        oEmbed ĐÒI app token (từ 10/2020)   ← không có token thì tắc
douyin    oEmbed không rõ, và `douyin.com` CHƯA có trong `host_cho_phep`
```

⇒ Nên tôi **không** làm fb bằng oEmbed. Dùng **`yt-dlp --write-thumbnail
--skip-download`**: một công cụ đã cài, đã qua cửa egress, đã có allowlist, và
nó có extractor cho cả bốn host — **0 token, 0 nhánh per-platform**. Đây là
thay đổi thiết kế so với `T12-29` bản soạn (bản đó khai oEmbed), và nó làm
nhánh (a) rẻ đi nhiều.

Vậy thứ tự dễ→khó THẬT là:

```
A  màn thùng rác việc      thuần FE, API đã có        ← dễ nhất
B  thumbnail video URL     một nhánh worker           ← T12-29 (a), viết lại theo yt-dlp
C  thumbnail mp4 + PDF     hai nhánh, hai thư viện    ← T12-29 (b)(c)
```

---

## A · Màn thùng rác VIỆC — `WO-070`

**Vì sao dễ nhất**: `GET /api/job?rac=1` đã chạy (WO-068), `POST
/api/viec/<id>/lai` đã chạy (WO-067). Chỉ thiếu chỗ bấm.

- màn `/chung-cat/` (`id_shell=chungcat`) thêm một mục **Thùng rác** — thu gọn
  mặc định, hiện số lượng
- mỗi dòng: lý do hỏng · chặng hỏng · **↻ Chạy lại** · **🗑 Xoá hẳn**
- "Xoá hẳn" cần một cửa mới ở THỢ (`DELETE /viec/<u>`) — sổ egress KHÔNG đụng
  tới, nên câu *"đã tiêu bao nhiêu"* vẫn trả lời được

`phạm_vi_ghi`: `web/plugins/cctab/src/cctab.inline.ts` · `web/render/shell.html`
· `web/api/{tho-cua,router}.mjs` · `chungcat/src/api.py`
`tiêu_chí`: cổng mới `web/test/thung-rac-viec.test.js` + §G của cổng M12

## B · Thumbnail cho video URL — `WO-071`

- `loai: sinh-thumbnail` trong worker; nhánh URL chạy
  `yt-dlp --write-thumbnail --skip-download --convert-thumbnails jpg`
- ảnh vào kho qua **cửa hiện vật sẵn có**, gắn `media[]` mime `image/jpeg`
- **SINH LẠI = THAY**, không thêm — đúng lỗi append của transcript (backlog
  2026-09-08) mà `T12-29` đã cảnh báo sẵn
- `douyin.com` thêm vào `host_cho_phep` kèm `$vi_sao`
- FE **0 dòng**: `nenThe` lớp 1 đã đọc `media[].mime` bắt đầu `image/`

## C · Thumbnail mp4 + PDF — `WO-072`

- mp4 có byte trong kho ⇒ `ffmpeg -ss 1 -vframes 1` (ffmpeg đã có)
- PDF ⇒ `pypdfium2` trang 1 (đi kèm `pdfplumber`), bề rộng ở bảng khai
- thiếu công cụ ⇒ **exit 3 thiếu-gói**, không đỏ oan (khuôn `_nap.py`)

---

## Luật chung cho cả ba

- cổng viết **TRƯỚC** mã, chạy ĐỎ, ghi số vào worklog (R5)
- mỗi việc xong: gieo fixture hỏng chứng minh cổng **ĐỎ ĐƯỢC**
- không restart giữa lúc chủ dự án đang test; xong mỗi việc thì build + restart
- `page-weight` trang chủ đang đỏ và **đã có chủ ở WO-055** — không tính vào
  ba việc này
