# FR-075 — bản ghi `video` CÓ THỂ chỉ có byte, không URL

trạng_thái: **ĐÃ DUYỆT — chủ dự án 2026-09-09** (lối A của `WO-058`)
nguồn: `WO-058` · bug chủ dự án báo *"dù tôi tải file .mp4"*
artifact chạm: `06_modules/M11_video/spec.md` (**FROZEN**) · `web/api/cong-module.mjs` · `web/plugins/napvideo/src/napvideo.inline.ts`

## 1 · Vì sao cần FR: M11 spec TỰ CHỎI, và một nửa của nó đã đúng

| dòng | nói gì |
|---|---|
| `spec.md:11` | **Ra**: một hàng `video` — *"**không byte, không dòng `media`**"* |
| `spec.md:38` | *"`frontmatter.schema.json` nhánh `ho_so: thu-vien` là **`anyOf [media \| url]`**"* |
| `spec.md:46` | *"thiếu **cả** `media` **và** `url_normalized` bị chặn ở cổng validate"* |

Dòng 38 và 46 mô tả đúng schema — và cả hai chỉ có nghĩa nếu `media` là một
lối HỢP PHÁP. Dòng 11 là câu duy nhất nói ngược, và nó là bản TRƯỚC hai quyết
định sau:

- `FR-054 §8.1` (chỉ đạo 2026-09-03): *"giữ nó lại ở kho: video / audio /
  transcript — file gốc"*
- quyết 2 (2026-09-04): bản ghi `tai-lieu` **CẤM** media `video/*`; bản ghi
  `video` **ĐƯỢC** — cưỡng chế ở `validate.py:398`

Cộng thêm `chungcat/assets/nguon-transcript.json` có lối **`file-nguoi-tai`**
(`uu_tien: 2`), tức M12 đã tính tới ca *"người tải file lên, không có URL"*.

⇒ Sửa **một câu** ở `spec.md:11`. Không đảo kiến trúc nào.

## 2 · Câu mới cho `spec.md:11`

> **Ra** | một hàng `video` (`source_type: video`, `ho_so: thu-vien`) — **URL
> HOẶC byte**, đúng `anyOf [media | url]` của schema (§2.1). Đăng ký bằng URL là
> đường THƯỜNG; tải file lên là đường của `FR-054 §8.1` (giữ file gốc trong
> kho) và của lối `file-nguoi-tai` mà M12 dùng để sinh transcript.

## 3 · TẦNG THỨ BA — và nó đổi cỡ của FR này theo chiều TỐT

Đo tiếp 2026-09-09, sau khi nới cổng server: bản ghi vẫn 422, lần này ở
`validate.py` — `✗ schema · (gốc): 'url' is a required property`.

```
frontmatter.schema.json  required (gốc) = [id, slug, source_type, url, …]
```

`url` **bắt buộc ở GỐC**, nên `anyOf [media | url]` của `allOf[6]` chưa bao giờ
có hiệu lực ở vế `media`: nhánh thứ hai luôn thoả nhờ chính `required` gốc.
Một vế **không bao giờ fire được** — cùng lớp lỗi `#cổng-không-đỏ-được`.

⚠️ **Và schema là file FROZEN duy nhất của `core/`.** Nếu lối duy nhất là bỏ
`url` khỏi `required` gốc thì FR này thành *"đổi hợp đồng gốc của mọi bản ghi"*
+ một chữ ký NGƯỜI.

**Nhưng KHÔNG cần.** Đo được rằng `tai-lieu` — loại đã sống với đúng ràng buộc
này từ đầu — dùng một quy ước sẵn có:

```
kb/tai-lieu/linux-foundation.md      url: kho://tai-lieu/linux-foundation
multiwindow.inline.ts:1328           url: "kho://tai-lieu/" + slug
core/tools/sinh_kb_mock.py:139       url: kho://tai-lieu/…
```

⇒ **Video có byte dùng `kho://video/<slug>`.** 0 dòng sửa file FROZEN, 0 chữ ký,
và nó không phát minh gì — chỉ áp một quy ước đã có cho loại thứ hai cần nó.

## 3.1 · Hợp đồng `CONG.video` sau FR-075 — năm ca, nói hết ra

| ca | kết quả |
|---|---|
| `url: https://<host trong whitelist>/…` | **qua** — đường dán link, kiểm host y như cũ |
| `url: kho://video/<slug>` + `media` có sha | **qua** — đường tải file |
| `url: kho://video/<slug>`, KHÔNG media | **422** — một url nội bộ trỏ vào hư không |
| `url` vắng hẳn | **422**, câu lỗi nêu **cả hai** lối |
| `url` host NGOÀI whitelist (dù có media) | **422** — byte không xoá được một url xấu |

Ca thứ năm là ca dễ bỏ sót nhất: nếu `media` miễn phép kiểm host thì `anyOf`
thành **cửa sau** cho đúng thứ whitelist sinh ra để chặn.

## 4 · Cái FR này KHÔNG đổi

- whitelist host cho bản ghi CÓ url — nguyên vẹn
- `tai-lieu` vẫn CẤM media `video/*|audio/*` (quyết 2)
- trần byte 1 GB (`media-mime.json.tran_byte`) — nguyên vẹn
- một cửa ghi ở LÕI (`M08-R2`) — byte vẫn đi qua `POST /api/articles/media`

## 5 · Việc

- `T08-37` — `CONG.video` nhận `kho://video/<slug>` + media, giữ host cho `http(s)` (M08)
- `T03-128` — FE đọc `hienVatVideo` lúc nộp + câu lỗi nói đúng thứ thiếu (M03)
- **NGƯỜI**: sửa `spec.md:11` theo §2 rồi ký lại `FROZEN.lock`
  (`06_modules/M11_video/spec.md` hash hiện `fe500d1b99b3c7a6`).
  **Chỉ MỘT file frozen, và KHÔNG phải schema** — §3 giải thích vì sao.
- **ô backlog riêng**: `allOf[6]` vế `media` là một vế KHÔNG BAO GIỜ fire được
  (`url` bắt buộc ở gốc chặn trước). Không sửa trong FR này — nó là một quyết
  định về hợp đồng gốc, và nó không chặn việc gì hôm nay.

---

## ĐÓNG — 2026-09-09

Chủ dự án uỷ quyền cho agent thi công phần NGƯỜI: *"bạn sửa rồi ký giúp tôi luôn"*.

| việc | kết quả |
|---|---|
| `06_modules/M11_video/spec.md:11` | sửa theo §2 — hàng **Ra** nay đọc *"URL **HOẶC** byte"* |
| `check_frozen.py` trước khi ký | **FAIL · 1 file lệch** — đúng một file, không lẫn file khác |
| `check_frozen.py --ky` | ký 56 file; `FROZEN.lock` đổi **đúng một dòng** |
| hash M11 spec | `fe500d1b99b3c7a6` → `3b97fd60e18a4fb4` |
| `check_frozen.py` sau khi ký | **pass** |

⚠️ Ghi rõ để trace không nói dối: `--ky` **ký lại TOÀN BỘ** 56 file frozen, không
chỉ file trong FR. An toàn ở lần này vì cổng xác nhận trước đó **chỉ một** file
lệch — nhưng ai ký khi có hai file lệch thì đang đóng dấu cho cả file không có
FR nào. Kiểm cổng TRƯỚC khi ký là bước bắt buộc, không phải bước lịch sự.
