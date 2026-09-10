# M11_video — ui flow

## Màn module này sở hữu

| Màn | path | `data-nav` | view id |
|---|---|---|---|
Video | `/video/` | `video` | `v-video` |
Nạp video | `/video/nap/` | — (vào từ nút trên màn Video) | `v-napvideo` |

`data-nav="video"` **đã thuần `[a-z]`** — may, vì hai regex `rail-trai.test.js:137`
và `:167` bắt `data-nav="[a-z]+"`. Hai module kia phải đổi tên (`tailieu`,
`baiviet`, `tonghop`); module này không.

**Vị trí chèn: SAU `v-all`, TRƯỚC `v-nap`** — cùng khe với M10, xem
`06_modules/M10_tailieu/ui_flow.md` cho lý do (hai đầu bị kẹp bởi
`trang-chu-layout.test.js:200` và `catNap()`).

## Màn Video

```
┌─ Video ─────────────────────────────────────────────────────┐
│  [+ đăng ký video]                              7 bản       │
│                                                              │
│  ┌ lọc ────────┐  ┌ danh sách ──────────────────────────┐   │
│  │ chủ đề      │  │ ▶  Hội thảo ngữ cảnh agent          │   │
│  │ khái niệm   │  │    youtube · một câu tóm tắt…       │   │
│  │ nguồn       │  │    [xem] [sửa] [xoá]                │   │
│  │  youtube 6  │  │ ─────────────────────────────────── │   │
│  │  tiktok  1  │  │ ▶  Demo retry-cost                  │   │
│  └─────────────┘  └──────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

**Không một khung nhúng nào trên màn danh sách.** Chỉ nút `▶`. Một danh sách 50
video tự nhúng hết là 50 request ra host ngoài trong một cú mở trang — M11-R2.

Trục lọc mới của màn này là **nguồn** (youtube / tiktok), nhóm theo `nhan` của
`video_host` trong bảng khai, không gõ tay. Cùng nguyên tắc với trục "định dạng"
của màn Tài liệu.

**Bộ lọc phải đếm TRONG CÙNG phạm vi với danh sách** —
`filter-counts.test.js:105-114` so số trong nhãn lọc với số thẻ trong lưới.

## Xem một video

```
┌─ cửa sổ đọc ────────────────────────────────────────────────┐
│  Hội thảo ngữ cảnh agent                          01 / 01   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                                                      │   │
│  │                      ▶  Xem video                    │   │
│  │                                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│  Bấm mới nhúng — mở trang không gọi ra ngoài.                │
│  ─────────────────────────────────────────────────────────  │
│  Ghi chú ngắn của người nạp…                                 │
└──────────────────────────────────────────────────────────────┘
```

Nút chiếm chỗ **đúng bằng** khung sẽ thay nó (`aspect-ratio` giống nhau) nên bấm
xong trang không giật. Hạ tầng này M09 đã dựng (`.hv-play`, `nhungVideo`); M11
dùng lại, **không viết bản thứ hai**.

## Màn nạp `/video/nap/`

```
Dán URL     [https://www.youtube.com/watch?v=dQw4w9WgXcQ_____]
            ✓ youtube · id dQw4w9WgXcQ
Một câu     [_______________________________] 0/160
Địa chỉ     [hoi-thao-ngu-canh-agent________]
Chủ đề [☐ agent-llm] …    Khái niệm [☐ backpressure] …
                                          [ Đăng ký vào kho ]
```

Dòng thứ hai (`✓ youtube · id …`) hiện **ngay khi dán**, và là chỗ báo lỗi khi host
ngoài whitelist. Lý do cùng loại với `file.size` của tài liệu: người dùng gặp lỗi ở
chỗ họ vừa gõ, không ở chỗ họ vừa bấm — M11-R3.

Khối metadata `hidden` cho tới khi URL hợp lệ. Nhớ BUG-1 của plan:
`body.api-co .api-only{display:block}` (0,2,1) **thắng** `[hidden]{display:none}`
(0,1,0) — màn này không được lặp lại nó.

## Điều màn này KHÔNG có

**Không ô chọn loại nguồn.** Máy đặt `source_type: video`. Đây là điều tách ra:
form viết bài hiện có `<option value="video">` (`shell.html:610`), tức người dùng
đăng ký video bằng cách chọn từ dropdown 7 loại rồi **viết thân bài 5 mục** cho một
video. Màn riêng bỏ cả hai bước đó.

**Không ô `media`.** Video không có byte trong kho.

## Ngân sách hiển thị

`chu-giao-dien.test.js:196` — chữ phụ trợ **≤ 480 ký tự/trang** cộng dồn, mỗi đoạn
≤ 80. Tooltip ≤ 220. CSS của màn ≤ 2 KB (`gn.css` đang 91/100 KB); phần lớn dùng
lại `.hv`/`.hv-play` M09 đã có.
