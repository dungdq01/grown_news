# UI kit — bộ UI áp toàn dự án

> **Vì sao file này tồn tại**: vế hard của G5 đòi `ui_kit.md` TỒN TẠI — G5 từng
> đóng khi nó không có, và s8 chẳng có gì để kế thừa (bài học ghi trong chính
> skill s5). File này là **bảng tra**, không phải nơi định nghĩa: giá trị sống
> ở `tokens.css`, lý do ở `DESIGN.md`, cỡ chữ ở `TYPOGRAPHY.md` — trỏ con trỏ,
> không chép.
>
> Hai tầng: §1–§3 là bộ ĐỢT MỘT (đang chạy thật trong `web/`, tên class là tên
> THẬT trong `web/styles/prototype.css`). §4 là bộ ĐỢT HAI (mới có trong mock
> `prototype/dot-hai/` — **LUẬT là phần chốt, tên class mock đặt lại khi port**).

## 1 · Nguồn sự thật

| cần | đọc | luật |
|---|---|---|
| giá trị token | `tokens.css` | nguồn DUY NHẤT — 113 token, import thẳng, không gõ lại giá trị |
| vì sao token là vậy | `DESIGN.md` | |
| cỡ chữ dùng ở đâu | `TYPOGRAPHY.md` | 3 luật chữ: menu ĐẬM THẲNG · header = nội dung cùng cỡ khác weight · ghi chú/cảnh báo NGHIÊNG |
| màu biểu đồ | `contracts/chart-palette.json` | palette đóng, `sinh_contrast_audit.py` là trọng tài |
| shape dữ liệu | `contracts/*.sample.v*.json` | contract có version — BE trả đúng, FE đọc đúng |

## 2 · Component đợt một (tên class THẬT — `web/styles/prototype.css`)

| component | class | dùng cho |
|---|---|---|
| panel màn | `.pn` + header `.pn-h` (`.dot` + `h2` + `.ln`) | mọi khối lớn của một view |
| tab rail trái | `.tb` + `data-nav` + `data-i18n` LIỀN NHAU | format bị regex cổng ghim — không chèn thuộc tính giữa |
| nút | `.bt` (biến thể `pri/ghost/sm`) | mọi nút hành động |
| ô số | `.kpi` | thống kê một-số |
| khối 3D / thẻ | `.mb-*` / `.the` | trang chủ, danh sách |
| trạng thái rỗng / gợi ý | `.empty` · `.hint` | ba-state: mọi màn phải có empty/loading/error |
| chart Kho | `.dn` `.wf` `.lc` `.sl` `.cot` | mỗi hình một lần (kho-hinh-dang ghim danh sách đóng) |
| cửa sổ nổi | multiwindow — viền brand `color-mix(--brand 55%, --edge)` | cụm nút −□× là `.ct` — TÊN NÀY ĐÃ CÓ CHỦ, đặt tên mới phải grep va chạm |

Luật nền: token-only (không hex trong CSS màn) · animation MỘT NHỊP có chốt
reduced-motion · gn.css trần 100KB (hiện chỉ còn ~150B dư — khối mới phải viết sát).

## 3 · Ba state bắt buộc

Mọi màn/khối dữ liệu: **empty** (nói rõ vì sao rỗng + việc-nên-làm, empty CÓ
phạm-vi khác empty toàn-cục) · **loading** (skeleton một nhịp; việc PHÚT hiện
BƯỚC chứ không spinner vô danh) · **error** (nguyên văn lỗi + hành động sửa —
"có lỗi xảy ra" là xoá thông tin).

## 4 · Component đợt hai (luật chốt — tên mock trong `prototype/dot-hai/`, đặt lại khi port)

Ba component "khai một chỗ" của ma trận (`ma-tran-module-man.md` §3.4) + phụ kiện:

| component | mock class | LUẬT (phần frozen) |
|---|---|---|
| **Nút năng lực** | `.tile`, nút trên thanh tiêu đề | chỉ hiện khi hành động HỢP LỆ; one-click tách khỏi nút chat; tác vụ tốn ⇒ hỏi-trước (model · ước phí/phút · dữ liệu đi đâu) — bấm lần hai mới chạy |
| **Chip trạng thái job** | `.bd` + thanh giai đoạn `.gd` | giai đoạn ĐẾM ĐƯỢC từ enum, không %; `dừng` không bao giờ hiện như đang-chạy; kèm lý do phân loại |
| **Nhãn AI sinh / gắn cờ** | `.blk.co` | block `chua-xac-minh` ra markup KHÁC HẲN block đã xác minh (viền đứt + nhãn ⚑) — đo bằng máy, không đo ý định |
| rail phải cửa sổ đọc | `.rail` 2 tab Hỏi/Sinh | gập được; artifact của bài xếp ngay dưới tile |
| chip ngữ cảnh bôi đen | `.chip-nc` + `.selbar` | đoạn chọn ĐÍNH vào chat, không replace (kho chỉ-đọc) |
| toast nối hai mặt | `.toast` | có nút "Xem tiến độ" (deep-link `?job=`); bền tới khi bấm; ≥2 job xong gần nhau thì GỘP |
| badge nav | `.badge` | trên đúng MỘT mục nav (Xưởng) — đếm việc "cần xử lý" |
| diff bản AI | `.diff` `del`/`ins` | bản-AI-gốc bất biến (FR-046) — diff luôn trả lời "người đã đổi gì" |
| khung tin nhắn kênh | `.tg` | giao diện ta không sở hữu — chỉ minh hoạ 5 luật nội dung tin |

Luật nhịp ĐÔI xuyên suốt (ma trận §0): tác vụ GIÂY sống inline trong panel;
tác vụ PHÚT khởi phát tại chỗ, SỐNG ở trang quản lý; không optimistic UI.

## 5 · Khi port đợt hai vào web

- Nút mọc từ BẢNG KHAI (kiểu `man-hinh.json`), không rải if — thêm chỗ xuất
  hiện là thêm một dòng bảng.
- Nút vào `man-hinh.json`/shell **cùng lúc** với lần dựng API thật (bài học
  S18/C5 — khai trước là 500 thật trên URL chưa ai làm).
- Luật focus/z-order (cửa sổ đọc · panel chat · tray) viết vào spec M03 trước
  khi code (đã chốt 2026-09-02).
