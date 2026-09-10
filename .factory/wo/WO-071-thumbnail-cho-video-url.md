# WO-071 — video URL (fb/tiktok/douyin) không có nền ảnh

loại: cải tiến (task B của `PLAN-2026-09-09`)
module: M12_chungcat (job) · M08_api (cửa gắn + bảng mime) · M01 (schema `kieu_moc`)
mức: hard
người báo: chủ dự án 2026-09-09 — *"reel (url fb) chưa có nền giống youtube hay tiktok (nền ảnh trong video)"*

## Vì sao chỉ YouTube có

`nenThe` lớp 2 dựng `i.ytimg.com/vi/<id>/hqdefault.jpg` — URL **đoán được từ
id**. Ba host còn lại không có URL đoán được, phải HỎI nền tảng.

## Bỏ oEmbed, dùng `yt-dlp` — đổi thiết kế so với `T12-29` bản soạn

```
tiktok   oEmbed CÔNG KHAI
fb       oEmbed ĐÒI app token (từ 10/2020)     ← không có token thì tắc
douyin   oEmbed không rõ · `douyin.com` chưa có trong host_cho_phep
```

`yt-dlp --write-thumbnail --skip-download` có extractor cho **cả bốn** host,
**0 token**, **0 nhánh per-platform**, và nó đã cài + đã qua cửa egress + đã
có allowlist. `T12-29` bản soạn khai oEmbed; bản này thay nó và nói rõ vì sao.

## BỐN chỗ phải sửa, và ba trong đó là thứ dễ quên

**1 · `media-mime.json` chưa có `image/*`.** Đo: `luuHienVat` chỉ soi magic
`if (loai)` — mime lạ **lọt qua không kiểm magic**; và `hienVatPhucVu` trả
`application/octet-stream` + `attachment`. ⇒ Ảnh nạp được nhưng **thẻ không
hiện nổi**, và lớp magic-byte (lớp thứ sáu của intake) vắng mặt đúng lúc byte
đến từ một CDN ngoài. Thêm `image/jpeg` (`ffd8ff`) + `image/png`
(`89504e47`) + `xem_truoc: "anh"`; `articles.mjs` trả **inline** cho `anh`.

**2 · Cửa gắn hiện vật THÊM, không THAY** (`articles.mjs:700`
`media: [...media, entry]`). Đây đúng là ô backlog append của transcript
(2026-09-08) còn treo. Sinh thumbnail lần hai phải **THAY** — không thì mỗi
lần chạy lại đẻ một entry và `nenThe` lấy cái đầu = cái cũ.
⇒ Cửa nhận `thay_kieu_moc: true`: bỏ mọi entry cùng `kieu_moc` rồi mới thêm.
`kieu_moc` là CỘT của bảng `media`, nên cửa tra bảng chứ không đọc frontmatter.

**3 · `kieu_moc` CHECK chỉ có `('la_asr','nguoi_sua')`** — thêm
`la_thumbnail` ở `kho.schema.sql` (KHÔNG frozen) và `KIEU_MOC` của
`articles.mjs`.

**4 · `douyin.com` chưa có trong `host_cho_phep`** — thêm kèm `$vi_sao`.

## FE: 0 dòng

`nenThe` lớp 1 đã đọc `media[].mime` bắt đầu `image/` (WO-064). Ảnh về là thẻ
tự dùng.

## Lối (a) — chủ dự án chọn 2026-09-09

LÕI TỰ xếp việc sau khi ghi bản ghi video (`xepViecThumbnail`), fire-and-forget.
Ảnh bìa không phải một quyết định như chưng cất (tốn token, chọn model) hay tải
video (chọn chất lượng) — nó là thứ LUÔN NÊN CÓ. Bỏ qua YouTube (`nenThe` lớp 2
đã có ảnh từ id) và `kho://` (byte đã trong kho).

## HAI thứ chỉ lộ ra khi CHẠY THẬT — cả hai lọt qua mọi cổng

**1 · `egress.gui(..., _chay=)` sai TÊN THAM SỐ** (đúng là `chuyen=`). Tên lạ
rơi vào `**kw`, và `**kw` đi thẳng vào dòng log JSON ⇒
`TypeError: Object of type function is not JSON serializable`. Năm vế đầu của
cổng đọc NGUỒN nên không thấy. Vá + thêm vế `6` CHẠY THẬT với LÕI giả.

**2 · DDL sửa rồi mà DB ĐANG CHẠY vẫn CHECK cũ.** Job chạy trọn đường, tải được
ảnh reel fb, nạp được byte, rồi chết ở `dang-verify`:
`CHECK constraint failed: kieu_moc IN ('la_asr','nguoi_sua')`.
Mọi cổng dùng DB TẠM dựng từ DDL MỚI, nên không cổng nào thấy được điều này.
⇒ `core/tools/di_tru_kieu_moc.py` — phép 12 bước của SQLite, có bản lùi, đếm
hàng trước/sau. **KHÔNG dùng `dung_lai_db.py`**: nó dựng lại từ export file, mà
`xuat_kho.py` chỉ ghi ra `la_dan_xuat = 0` ⇒ ngày nào kho có hiện vật dẫn xuất
thì dựng lại là xoá sạch chúng. Hôm nay đếm được 0 nên nó vô hại — một công cụ
chỉ an toàn nhờ hoàn cảnh là công cụ sẽ hỏng lúc hoàn cảnh đổi.

## Nghiệm thu trên máy thật

```
POST /api/job {loai:sinh-thumbnail, slug:video/mo-mang-tam-mat-…}
  → xong · ket_qua.sha256 = 94a01fdb… · ảnh 45 591 byte
  → media[] có image/jpeg
  → màn /video/: nền = ẢNH TRONG KHO, 960×559, hiện được
```

## Vòng ba — cửa sổ đọc nói "không mở được" cho một tấm jpg

Chủ dự án bắt SAU khi thẻ 2 tầng đã đúng: *"Tệp khác · 45 KB — Trình duyệt
không mở được dạng này"*. Hai tầng nói hai điều khác nhau về CÙNG một hiện vật.

**Gốc KHÔNG phải thiếu một nhánh vẽ** — dù đó là thứ tôi sửa đầu tiên. Gốc là
`image/jpeg` chưa có trong bảng: mime lạ ⇒ `loai` rơi về `mac_dinh`
(*"Tệp khác"*) và rơi luôn nhánh cuối. Thêm dòng bảng + `chi_dan_xuat: true`
chữa cả hai vế: ảnh thôi bị coi là hiện vật CHÍNH, nên bản ghi video hiện
**trình phát** — đúng thứ người mở muốn thấy, không phải tấm ảnh bìa.

⚠️ **Tôi thêm một nhánh `xem_truoc === "anh"` rồi GỠ trong cùng lượt.** Đo
được: mọi mime ảnh đều `chi_dan_xuat`, và danh sách định dạng người nạp được
làm tài liệu (`.pdf .pptx .docx .ppt .doc`) không có ảnh ⇒ nhánh ấy **không bao
giờ chạy**. Mã chết cộng trần trang đang âm = gỡ. Cổng đổi sang canh HÀNH VI
(mọi mime ảnh phải `chi_dan_xuat`), không canh nhánh — canh một nhánh chết là
buộc người sau giữ mã chết.

## BUILD VỠ IM LẶNG — lỗi quy trình của tôi

`npm run build` đã HỎNG từ task A (`chungcat.inline.ts:756` chuỗi vỡ, cùng bẫy
escaping heredoc đã dính nhiều lần), và tôi báo "build + restart xong" vì chỉ
đọc `tail -1`. Hệ quả: tab Thùng rác của `WO-070` **chưa bao giờ được phục vụ**
cho tới lượt này, dù mọi cổng xanh — `chunk-tu-chua.test.js` biên dịch chunk
nhưng nó đọc file `.js` ĐÃ DỰNG, tức một artifact CŨ. Một cổng đọc output build
không bắt được một lần build hỏng.
⇒ Từ nay đọc đủ đuôi output build, và coi `build-fe: N file` là điều kiện.

## Nợ phát hiện, KHÔNG thuộc WO này

`la_dan_xuat` **cũng chưa bao giờ được ghi** — `luuHienVat` chỉ
`INSERT (sha256, byte)`, để DEFAULT 0. Cùng với `kieu_moc`, đó là hai cột tồn
tại mà không ai điền. Hệ quả: `AC-V1` đòi hiện vật `.vtt` mang `la_dan_xuat: 1`
+ `kieu_moc: la_asr` + model ASR — **không cái nào có trong DB**, mà cổng của
AC ấy vẫn xanh. Đáng một ô backlog riêng.

## Cái WO này KHÔNG làm

mp4 frame · PDF trang 1 — đó là task C (`WO-072`).
