# M10_tailieu — ui flow

## Màn module này sở hữu

| Màn | path | `data-nav` | view id |
|---|---|---|---|
Tài liệu | `/tai-lieu/` | `tailieu` | `v-tailieu` |
Nạp tài liệu | `/tai-lieu/nap/` | — (vào từ nút trên màn Tài liệu) | `v-naptailieu` |

**`data-nav` thuần `[a-z]`, không gạch nối** — `rail-trai.test.js:137` và `:167`
bắt `data-nav="[a-z]+"`. Tên `tai-lieu` không khớp ⇒ nhãn lặng lẽ ra khỏi phép đo
và `soTab >= 4` đỏ. Path URL vẫn được có gạch nối; chỉ `data-nav` bị ràng.

**Vị trí chèn: SAU `v-all`, TRƯỚC `v-nap`.** Đúng một khe, kẹp hai đầu:
`trang-chu-layout.test.js:200` cắt `slice(indexOf('v-home'), indexOf('v-all'))` ⇒
chèn giữa hai cái đó làm 7 phép đếm sai. `catNap()` (`trang.mjs:247`) cắt từ
`id="v-nap"` tới `</main>` ⇒ đặt sau nó là bị cắt im lặng khỏi bốn trang kia.

## Màn Tài liệu

```
┌─ Tài liệu ──────────────────────────────────────────────────┐
│  [+ nạp tài liệu]                    12 bản · 148 MB        │
│                                                              │
│  ┌ lọc ────────┐  ┌ danh sách ──────────────────────────┐   │
│  │ chủ đề      │  │ ▣ Báo cáo chi phí 2026     .pdf    │   │
│  │ khái niệm   │  │   một câu tóm tắt…                  │   │
│  │ định dạng   │  │   [xem] [sửa] [xoá]                 │   │
│  │  pdf   8    │  │ ─────────────────────────────────── │   │
│  │  pptx  3    │  │ ▤ Slide kiến trúc         .pptx    │   │
│  │  docx  1    │  │   …                                  │   │
│  └─────────────┘  └──────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

**Bộ lọc phải đếm TRONG CÙNG phạm vi với danh sách.** `filter-counts.test.js`
(`:105-114`) đọc số trong nhãn lọc rồi so với số thẻ trong lưới — nếu sidebar đếm
toàn kho mà lưới chỉ hiện tài liệu thì đỏ hàng loạt. Nhãn "định dạng" là trục mới
của màn này (không có ở màn bài viết): nhóm theo `media.mime`, lấy nhãn từ bảng
khai `media-mime.json`, không gõ tay.

## CRUD tại chỗ — và cạm bẫy dispatch

Ba nút trên mỗi hàng: `xem` (mở cửa sổ đọc) · `sửa` (mở form của màn này) · `xoá`.

`bam()` (`multiwindow.inline.ts:638-639`) có
`const win = t.closest(".bk"); if (!win) return` ⇒ **mọi `data-act` bắt buộc nằm
trong `.bk`**. Nút của màn này nằm ngoài cửa sổ đọc, nên phải bắt **TRƯỚC** dòng
đó — cùng khuôn `data-suanhan`/`data-xoanhan` mà màn Danh mục đã dùng (`:622`,
`:629`).

Và `nut-song.test.js:51-60` canh **hai chiều**: mỗi `data-act` được vẽ phải có
nhánh `act === "..."`, và ngược lại. Viết nhánh trước rồi mới vẽ nút ⇒ đỏ vì
"nhánh mồ côi". Thứ tự đúng: vẽ và xử trong **cùng một đơn vị việc**.

## Form sửa — PHẢI có ô `media`

```
┌─ Sửa tài liệu ──────────────────────────────────────────────┐
│  Tiêu đề       [___________________________]                 │
│  Một câu       [___________________________] 0/160           │
│  Chủ đề        [☑ chi-phi] [☐ agent-llm] …                   │
│  Khái niệm     [☑ retry-cost] …                              │
│  ─── Hiện vật ─────────────────────────────────────────────  │
│  chi-phi-2026.pdf · PDF · 812 KB · sha256 3f2a0000…          │
│  [thay file khác]   ← nạp byte mới, đổi con trỏ              │
└──────────────────────────────────────────────────────────────┘
```

Khối "Hiện vật" là **lý do màn này tồn tại**. Form viết bài không có nó, nên sửa
một tài liệu hôm nay dựa vào `FM_GOC` giữ hộ — xem M10-R2.

## Màn nạp `/tai-lieu/nap/`

```
[ Chọn tài liệu ]  hoặc kéo thả · .pdf .pptx .docx .ppt .doc · tối đa 25.0 MB
  ↓ sau khi nạp byte
Một câu tóm tắt   [_______________________________]
Địa chỉ trong kho [bao-cao-chi-phi-2026__________]
Chủ đề            [☐ …]      Khái niệm  [☐ …]
chi-phi-2026.pdf · PDF · 812 KB · sha256 3f2a0000…
                                              [ Ghi vào kho ]
```

Khối metadata **`hidden` cho tới khi byte nạp xong**. Cạm bẫy đã đo:
`body.api-co .api-only{display:block}` (0,2,1) **thắng** `[hidden]{display:none}`
(0,1,0) ⇒ khối vẫn hiện. Xem BUG-1 của plan; màn này không được lặp lại nó.

## Ngân sách hiển thị

`chu-giao-dien.test.js:196` — tổng chữ phụ trợ (`.note`/`.np-h`/`<em>`) **≤ 480 ký
tự/trang**, và vì mọi màn ở cùng tài liệu nên chữ của màn này **cộng dồn vào từng
trang**. Mỗi đoạn ≤ 80 ký tự. Tooltip ≤ 220 ký tự.
CSS của màn ≤ 2 KB — `gn.css` đang 91/100 KB.
