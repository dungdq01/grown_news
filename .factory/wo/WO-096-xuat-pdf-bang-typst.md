# WO-096 · Xuất PDF THẬT bằng Typst — chữ Computer Modern, không qua trình duyệt

| | |
|---|---|
| **Loại** | tính năng · M03_web (cửa xuất) |
| **Mức** | `hard` |
| **Mở** | 2026-09-10, chủ dự án: *"cố gắng sử dụng latex mà làm. Trong tài liệu tôi chụp gửi bạn là font latex xuất ra pdf đó, thử nghiên cứu thêm?"* |

## `s1` đã khảo, và gap cuối vừa ĐÓNG hôm nay

`01_research/m12-chat-luong-transcript-chung-cat.md` đã chọn **Typst**:

- một binary, không cần cả một bản phân phối TeX;
- `pandoc --pdf-engine=typst` **27× nhanh hơn xelatex** (356 ms vs 9.65 s);
- font **New Computer Modern** — *"cùng họ với font của mẫu ChatGPT"*, tức đúng
  thứ chủ dự án chỉ vào.

Gap treo là `[G] NCM phủ dấu tiếng Việt — chưa đo`. **Đo 2026-09-10, đóng:**

```
typst 0.15.1 · biên dịch 0 cảnh báo
trích chữ khỏi PDF bằng pypdf, đối chiếu 74 ký tự
  (65 thường + 9 HOA: Ầ Ắ Ẵ Ệ Ộ Ợ Ữ Ỹ Đ)
⇒ thiếu 0 ký tự · SVG không có .notdef
```

## Vì sao Typst chứ không LaTeX đầy đủ

TeX Live là **vài GB** và một lần cài không tái lập được. Typst là một `.exe`
~30 MB, cài bằng một dòng `winget`, và cho ra **cùng họ chữ** — thứ chủ dự án
thật sự chỉ vào là *cái nhìn của bản PDF*, không phải cái tên `\documentclass`.

## Vì sao LÕI được phép gọi tiến trình con

`dungchung.mjs:469` **đã** `spawn` Python để chạy validate. Nên `spawn("typst")`
đi cùng khuôn đã có, không mở một hạng mới cho tầng này.

## Kỳ vọng

- `?dang=pdf` ⇒ `application/pdf`, `attachment`, tên file theo `WO-091`.
- `mdSangTypst(md)` THUẦN: tiêu đề · đoạn · danh sách · **bảng** · trích dẫn ·
  khối mã · đậm/nghiêng/mã · liên kết.
- **Thoát ký tự đặc biệt của Typst TRƯỚC khi dựng markup** — `# $ @ * _ \ < > ` [ ]`.
  Thân bài do MODEL sinh; một `#import` lọt vào là chạy mã trong bộ dựng.
- Không có binary ⇒ **503 nói thẳng**, và đường `?dang=in` (`WO-095`) vẫn còn.
  Không im lặng trả một file rỗng.
- Trần thời gian cho tiến trình con; treo thì giết, không để cửa đứng mãi.

## Ngoài phạm vi

- Cài Typst trên máy triển khai — một dòng `winget install Typst.Typst`, ghi ở
  README của cửa.
- Mục lục / đánh số tự động / trích dẫn kiểu LaTeX — chưa ai xin.
