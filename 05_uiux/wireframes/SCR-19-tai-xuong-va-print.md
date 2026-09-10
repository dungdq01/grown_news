# SCR-19 · Nút "Tải xuống ▾" — wireframe

> `T03-117` bước 1. Backend `T08-33` đã xong (cửa `GET /api/xuat/...` và
> `/api/xuat-nhap/...`, bảng khai `core/assets/xuat-dang.json`).
> **Trạng thái: CHỜ CHỦ DỰ ÁN DUYỆT. Chưa một dòng mã bước 2 nào.**

---

## Nguyên tắc — vì sao menu KHÔNG giống nhau ở bốn ca

**Chỉ bày dạng mà nội dung THẬT SỰ có.**

Nội dung ta giữ dưới dạng VĂN BẢN (bài viết · bản chưng cất · transcript) xuất
đa dạng được, vì mọi dạng dựng từ **cùng một chữ**. Còn file NHỊ PHÂN người tải
lên thì *"tải xuống"* nghĩa là **trả lại đúng byte đã nạp**.

Bày `docx` cho một PDF là bày một bản **dựng lại** mang tên tài liệu gốc: mất bố
cục, mất bảng, mất phông — và người nhận tưởng đó là bản gốc. Đó là nói dối
bằng một cái nút.

Menu **dẫn xuất từ `xuat-dang.json`**, không gõ cứng: thêm một dạng vào bảng là
menu tự mọc, và cửa API với menu không bao giờ lệch nhau.

---

## Ca 1 — BÀI VIẾT / bản đã duyệt trong kho

```
┌─ Cài Đặt và Thiết Lập Hermes… ────────────────── [–][□][×] ┐
│  Xem  |  Chưng cất  |  Transcript                          │
│                                                            │
│  … thân bài …                                              │
│                                                            │
├────────────────────────────────────────────────────────────┤
│ [✕ Loại…] [✎ Sửa…] [🗑 Bỏ…]        [⬇ Tải xuống ▾]        │
└────────────────────────────────────────────────────────────┘
                                     ┌──────────────────────┐
                                     │  Markdown      .md   │
                                     │  Văn bản thuần .txt  │
                                     │  Word          .docx │
                                     │  ─────────────────   │
                                     │  PDF (in…)           │
                                     └──────────────────────┘
```

Ba mục đầu là `<a href="/api/xuat/article/<slug>?dang=…">` **thẳng cửa xuất** —
không blob JS. Trình duyệt tải bằng chính bộ tải của nó: có thanh tiến trình,
có thư mục Tải xuống, huỷ được. Một `Blob` + `URL.createObjectURL` thì ta phải
tự dựng lại tất cả những thứ đó, và nó giữ cả file trong RAM.

**PDF nằm DƯỚI vạch** vì nó khác loại: nó không tải file, nó mở một trang in.

---

## Ca 2 — BẢN CHƯNG CẤT (nháp)

```
│ [✓ Duyệt vào kho…] [↩ Trả lại…] [✎ Sửa…]  [⬇ Tải xuống ▾] │
└────────────────────────────────────────────────────────────┘
                                     ┌──────────────────────┐
                                     │  Markdown      .md   │
                                     │  Văn bản thuần .txt  │
                                     │  Word          .docx │
                                     │  ─────────────────   │
                                     │  PDF (in…)           │
                                     ├──────────────────────┤
                                     │ ⚠ Bản nháp — mọi file │
                                     │   tải về đều đóng dấu │
                                     │   "chưa duyệt".       │
                                     └──────────────────────┘
```

Câu cảnh báo ở chân menu **nói trước** điều file sẽ mang. Người gửi bản nháp qua
chat cần biết dấu ấy tồn tại — nếu không, họ tưởng mình gửi một bản sạch và
người nhận nhận một file có chữ *"BẢN NHÁP — chưa duyệt"* giữa cuộc họp.

Dấu ghi đủ ba dữ kiện: **nguồn · ngày · chỉ dẫn**. Một bản chưng theo yêu cầu
riêng phải được chấm bằng đúng yêu cầu đó.

---

## Ca 3 — TRANSCRIPT

```
                                     ┌──────────────────────┐
                                     │  Phụ đề SRT    .srt  │
                                     │  Văn bản thuần .txt  │
                                     │  Word          .docx │
                                     │  ─────────────────   │
                                     │  File gốc      .vtt  │
                                     └──────────────────────┘
```

**`.vtt` gọi là "File gốc"**, không gọi ".vtt": nó là hiện vật máy đã sinh và
lưu, còn ba mục trên là bản DỰNG LẠI từ nó. Tên gọi phải nói ra sự khác nhau
đó, vì chỉ bản gốc mới khớp từng mốc với video.

**Không có PDF.** Một transcript in ra PDF là 40 trang chữ không ai đọc; nó sinh
ra để máy đọc và để tua.

---

## Ca 4 — TÀI LIỆU PDF/DOC/PPT tải lên

```
                                     ┌──────────────────────┐
                                     │  File gốc      .pdf  │
                                     └──────────────────────┘
```

**Đúng một mục.** Không `docx`, không `txt`, không "PDF (in…)".

Người muốn bản văn bản của tài liệu này thì đi đường **Chưng cất** — và bản
chưng cất có menu đầy đủ của Ca 2. Hai đường, hai vật, không trộn.

> Nếu menu chỉ còn MỘT mục, cân nhắc bỏ luôn menu và để nút thành
> **[⬇ Tải file gốc]** — một menu xổ ra để lộ đúng một dòng là một cú bấm thừa.
> **Câu hỏi cho chủ dự án (1).**

---

## PDF — vì sao đi đường IN, không render ở máy chủ

`PDF (in…)` mở `?in=1` (một trang sạch: chỉ tiêu đề + thân, 0 shell, 0 sidebar)
rồi gọi `window.print()`.

| | |
|---|---|
| 0 phụ thuộc | mọi thư viện PDF server kéo theo phông nhúng |
| tiếng Việt | phông có dấu là chỗ thư viện PDF server vỡ trước tiên |
| người dùng chọn | khổ giấy, lề, có/không nền — hộp thoại in lo hết |
| in giấy | cùng một đường, không cần nút thứ hai |

Đánh đổi nói thẳng: người dùng phải bấm thêm một bước trong hộp thoại in, và
tên file mặc định do trình duyệt đặt. Đổi lại là 0 phụ thuộc mới và chữ Việt
không bao giờ thành ô vuông.

---

## Ràng buộc kỹ thuật

- Menu dẫn xuất từ `xuat-dang.json` qua một cửa đọc — **cấm gõ cứng** danh sách.
- Mục tải là `<a href>` thẳng, `download` để trình duyệt giữ tên từ
  `Content-Disposition`.
- CSS vào **chunk**, không `prototype.css`: `gn.css` còn **22 byte**.
- `FR-022`: menu là một `<details>`/`<dialog>`, không `confirm()`/`prompt()`.
- Nút nằm ở thanh chân cửa sổ (`[data-bt]`), **bên phải**, tách khỏi cụm nút
  phán quyết — tải xuống không phải một phán quyết.

## Ngân sách byte (đo 2026-09-06)

`gn.js` 84 602/102 400 (dư 17.4 KB) · `gn.css` 102 378/102 400 (**dư 22 byte**)
· trang chủ 59 241/61 440.

---

## Ba câu hỏi cần chủ dự án quyết cùng lúc duyệt

1. **Ca 4 chỉ một mục** — giữ menu xổ, hay đổi nút thành `[⬇ Tải file gốc]`?
2. **Bài viết có nên thêm "File gốc"** không? Bài trong kho là `.md` trên đĩa;
   `dang=md` đã trả đúng nội dung ấy, nên thêm mục nữa là hai tên cho một thứ.
3. **Nút đặt ở đâu**: chỉ trong cửa sổ đọc, hay có cả ở thẻ bài ngoài lưới
   (hover hiện `⬇`)? Thẻ ngoài lưới tiện hơn nhưng thêm byte cho MỌI trang.

---

**CHƯA DUYỆT ⇒ CHƯA CODE.** Bước 2 bắt đầu sau khi mốc duyệt vào worklog.
