# WO-021 — MỘT format chung cho ba form nạp · và bố cục hai cột

loại: thống nhất giao diện + gỡ trường không cần + bug bố cục
module: **M03_web** (`shell.html` · `trang.mjs` · FE · CSS) · **M08_api** (nới cổng)
mức: người dùng THẤY được cả hai

## Người dùng nói (2026-08-28, kèm 4 ảnh)

> 1 · format của viết bài và nạp tài liệu / video **chưa đồng bộ** form input.
>     ⇒ cần thống nhất 1 format chung và **bỏ đi 1 số trường ko cần thiết**.
>     ví dụ ở mục viết bài: *Cất ở đâu trong kho / Tin cậy tối đa / Mức đầy đủ*
>     → chưa cần thiết
>
>     giải pháp: chỉ giữ 1 số trường cần thiết cho input POST API — bản chất ta
>     tải bài viết / tài liệu / video lên web thì đó **chỉ là nội dung thôi**.
>     Các fields cố định thì up gì lên cũng nên hiển thị lên UI — **ko hẳn cần
>     require** (ví dụ gán category, concept, tiêu đề, mô tả ngắn gọn)
>
> 2 · UI các màn nhập input nạp **đang bị lệch về bên trái quá**

## Hiện trạng, đo được

**Ba bộ trường khác nhau, không chỉ khác thứ tự:**

| | bài viết | tài liệu | video |
|---|---|---|---|
tiêu đề | `f-title` | **không có** | **không có** |
tóm tắt | `f-1l` | `tv-1l` | `vd-1l` |
mô tả | *(gọi là "Thân bài — markdown thô")* | `tv-mo` | `vd-mo` |
địa chỉ kho | `f-id` + `f-slug` | `tv-slug` | `vd-slug` |
đánh giá | `f-cred` + `f-conf` | — | — |
ngày | `f-ngay` | — | — |

**Bố cục lệch trái, và đây là con số:** `.f-row` có `max-width: 600px`, panel rộng
**1344px** ⇒ **trống 715px bên phải = 53% panel**. Không phải cảm giác.

## Hai quyết định của người dùng (2026-08-28)

**(a) BỎ chặn.** Cổng module không còn đòi `≥1 category` + `≥1 concepts` cho tài
liệu/video. Ô vẫn hiện đủ và vẫn nhắc, nhưng gửi thiếu thì **vẫn ghi được**.
Đây là ĐẢO một quyết định của chính người dùng ở T08-17 (hai lượt trước họ chọn
"cổng module chặn"), nên tôi hỏi lại trước khi gỡ, và họ chốt bỏ.
Hệ quả nói ra: facet Chủ đề sẽ rỗng dần nếu bỏ qua thường xuyên.

**(b) GỠ đúng ba nhóm** người dùng kể — máy tự điền:

| gỡ khỏi form | máy điền bằng |
|---|---|
`Mã bài` (`id`) | `src_` + băm tiêu đề — cùng cách tài liệu đang làm |
`Tên đường dẫn` (`slug`) | slug suy từ tiêu đề (`slugGoiY` đã có) |
`Tín cậy tối đa` (`credibility_max`) | `plausible` |
`Mức đầy đủ` (`conformance`) | `B` |

**GIỮ** `Ngày phân tích` và `Loại nguồn` — người dùng không kể chúng, và `Loại
nguồn` là nội dung thật (nó quyết bản ghi vào bảng nào).

## Format chung

Cùng thứ tự, cùng nhãn, ở cả ba màn:

```
① thứ đang nạp     bài viết: URL nguồn + Loại nguồn
                   tài liệu: chọn tệp
                   video:    dán URL
② Tiêu đề          — cả ba (tài liệu/video CHƯA CÓ, phải thêm)
③ Một câu tóm tắt  — cả ba
④ Mô tả            — cả ba (bài viết: khung 5 mục là nội dung riêng của nó)
⑤ Chủ đề · Khái niệm — cả ba, nhãn "nên có" thay cho "bắt buộc"
```

## Bố cục hai cột

Màn nạp có đúng hai loại nội dung: **form** và **lời giải thích máy làm gì**. Xếp
chúng cạnh nhau dùng hết bề rộng, và form ngắn lại nên ít phải cuộn:

```
┌ NẠP TÀI LIỆU ───────────────────────────────────────┐
│ [dải lối]                                            │
│ ┌── form (≤40rem) ────────┬── máy làm gì (≤22rem) ─┐ │
│ │ vùng chọn tệp           │ băm nội dung sha256    │ │
│ │ Tiêu đề                 │ soi byte mở đầu        │ │
│ │ Tóm tắt · Mô tả         │ giữ bản sao ngoài DB   │ │
│ │ Chủ đề · Khái niệm      │                        │ │
│ │ [Ghi vào kho]           │                        │ │
│ └─────────────────────────┴────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

Hẹp thì về một cột. **Không** kéo ô nhập rộng 1344px: một ô chữ dài thế thì mắt
mất dòng, và đó là lý do `max-width: 600px` tồn tại — vấn đề là chỗ TRỐNG, không
phải chiều rộng ô.

## Ràng buộc

- `gn.js` dư 2697 byte · `gn.css` dư 4400. Gỡ trường LÀM GIẢM JS; thêm tiêu đề
  cho hai màn tốn ít.
- Gỡ `f-id`/`f-slug`/`f-cred`/`f-conf` khỏi form thì `guiFormThat` phải tự điền —
  schema vẫn đòi bốn trường đó, và thiếu là 422.
- `chu-giao-dien`: ≤80 ký tự/đoạn, ≤480 ký tự/trang. Gỡ trường làm giảm chữ.
- Cổng cũ ghim tên/số ô sẽ đỏ: `thu-vien-nap` · `nap-ba-khung` ·
  `mo-ta-va-nut-nap` · `nhan-bat-buoc` — sửa trong đơn vị TEST, không sửa lẫn.
