# SCR-00 · App shell — wireframe

> **Bổ sung sau khi bác v1.** Ba wireframe SCR-01/02/03 ban đầu vẽ theo mô hình
> "tờ giấy nổi giữa màn hình" — không có chỗ cho dashboard, bộ lọc, thao tác
> hàng loạt. File này mô tả khung thật: **app shell + nhiều cửa sổ đọc**.
>
> SCR-01/02/03 vẫn đúng về *nội dung từng màn*, chỉ sai về *khung chứa*.

## Khung

```
┌──────────────────────────────────────────────────────────────────┐
│ Grown_news  TRANG CHỦ TẤT CẢ CHỜ DUYỆT KHÁI NIỆM   ❙❙ ◑3/5 ☾ [+NẠP]│ ← 56px, kính
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│   ╔═══════════════════════════════════════════════════════╗      │
│   ║  VÙNG 1 · NỔI BẬT                        xem tất cả → ║      │ ← panel kính
│   ╚═══════════════════════════════════════════════════════╝      │
│                        ↕ 64px                                     │
│   ╔═════════════════════════════════╗ ╔═══════════════════╗      │
│   ║ VÙNG 2 · MỚI PHÂN TÍCH          ║ ║ VÙNG 3 · KHO      ║      │
│   ║ 3 gần nhất       xem tất cả 9 → ║ ║ 4 KPI + bar chart ║      │
│   ╚═════════════════════════════════╝ ╚═══════════════════╝      │
│                        ↕ 64px                                     │
│   ╔═══════════════════════════════════════════════════════╗      │
│   ║  VÙNG 4 · KHO GẦN ĐÂY   4/9 bản       xem tất cả →   ║      │
│   ╚═══════════════════════════════════════════════════════╝      │
│                                                                   │
│  ← ẢNH NỀN phong cảnh, parallax 0.1×, tự đổi 5-7s →              │
├──────────────────────────────────────────────────────────────────┤
│ đang mở: [■ Walk-forward…] [■ Khử trùng…]                        │ ← dock, chỉ hiện
└──────────────────────────────────────────────────────────────────┘   khi có cửa sổ thu nhỏ
```

**Bốn vùng, bốn layout family khác nhau** — không family nào lặp:

| Vùng | Layout family | Hiện bao nhiêu |
|---|---|---|
| 1 Nổi bật | lưới bất đối xứng 1 lớn + 2 nhỏ | 3 bài |
| 2 Mới phân tích | danh sách `ngày \| nội dung` | **3 gần nhất** |
| 3 Kho | KPI 2×2 + bar chart ngang | — |
| 4 Kho gần đây | lưới thẻ, viền trên màu theo loại | **4 / 9 bản** |

**Mỗi vùng chỉ hiện mẫu**, nút *xem tất cả →* chuyển sang màn chi tiết. Trang chủ
là bản tóm tắt, không phải nơi chứa hết dữ liệu.

## Bốn màn

| Màn | Nội dung | Wireframe chi tiết |
|---|---|---|
| Trang chủ | 4 vùng ở trên | file này |
| Tất cả | lưới 9 thẻ + bộ lọc | SCR-03 |
| Chờ duyệt | 3 bản + hàng nút duyệt/loại/để sau | dưới |
| Khái niệm | danh mục kiểm soát + chờ duyệt lô | dưới |

---

## Cửa sổ đọc — multi-window

```
┌─ ■ Walk-forward validation: vì sao k-fold… ──── — ▢ × ─┐
│ MỤC LỤC    │                                            │
│ 01 Bối cảnh│  Walk-forward validation:                  │
│ 02 Ý tưởng │  vì sao k-fold ngẫu nhiên nói dối          │
│ 03 Bản đồ  │                                            │
│ 04 Trục    │  ┃ Chia chuỗi thời gian bằng k-fold…      │
│ 05 Cơ chế  │                                            │
│ 06 Tinh túy│  ⚠ Dè chừng trước khi đọc  ← NGHIÊNG      │
│ 07 Dè chừng│                                            │
│ 08 Lộ trình│  01  Bối cảnh          ← header, weight 600│
│ 09 Tự kiểm │  Pipeline dự báo…      ← body, weight 400  │
│            │                          CÙNG CỠ 15-16px   │
├────────────┴────────────────────────────────────────────┤
│ 14 trang · plausible      03 / 09      ‹ trước  tiếp ›  │
└──────────────────────────────────────────────── ⋰ ──────┘
                                          ↑ tay kéo giãn
```

| Thao tác | Cách | Ràng buộc |
|---|---|---|
| Mở | bấm bài bất kỳ | lệch 28px để thấy chồng |
| Kéo di chuyển | giữ thanh tiêu đề | không ra ngoài viewport |
| **Kéo giãn** | 8 hướng (4 cạnh + 4 góc) | **min 340×220** |
| Phóng to | nút ▢ | bấm lại trả kích cỡ cũ |
| Thu nhỏ | nút — | xuống dock đáy |
| Đóng | nút × hoặc **Esc** | đóng cửa sổ trên cùng |
| Đưa lên trên | bấm vào cửa sổ | z-index tăng dần |

**Chữ co giãn theo cửa sổ** (container query), nới tối đa 1 bậc so với token.

Góc dưới-phải có vạch chéo làm dấu hiệu kéo được, đậm lên khi rê chuột vào cửa sổ.

---

## Màn Chờ duyệt

```
╔══════════════════════════════════════════════════════════════╗
║ CHỜ DUYỆT      3 bản · cổng người duy nhất   xem cả kho →    ║
║ ──────────────────────────────────────────────────────────── ║
║ 4 ngày  Quartz plugin API                                    ║
║         Sáu loại plugin và điểm cắm trong vòng đời build.    ║
║         [docs] verified                                      ║
║ ──────────────────────────────────────────────────────────── ║
║ 2 ngày  Đọc log phân tán khi trace bị đứt                    ║
║ ──────────────────────────────────────────────────────────── ║
║ 1 ngày  Chi phí thật của một lần retry                       ║
║ ──────────────────────────────────────────────────────────── ║
║ [DUYỆT BẢN ĐÃ CHỌN] [LOẠI] [ĐỂ SAU]   chỉ người đổi được…   ║
╚══════════════════════════════════════════════════════════════╝
      ↑ primary      ↑ destructive  ↑ ghost   ↑ ghi chú NGHIÊNG
```

Ba biến thể nút phân biệt bằng **màu**, không bằng cỡ — nhìn là biết cái nào nguy
hiểm.

---

## Màn Khái niệm

```
╔═══════════════════════════════╗ ╔═══════════════════════════╗
║ DANH MỤC KIỂM SOÁT            ║ ║ CHỜ VÀO DANH MỤC          ║
║ idempotency      ████████ 5   ║ ║ retry-jitter    từ 1 nguồn║
║ context-mgmt     ██████   4   ║ ║ prompt-caching  từ 1 nguồn║
║ eval-harness     ███      2   ║ ║ plugin-lifecycle từ 1 nguồn║
║ …                             ║ ║                           ║
║                               ║ ║ ⌇ Duyệt lô theo tuần.     ║
║                               ║ ║   Không tính vào hệ số…   ║ ← NGHIÊNG
╚═══════════════════════════════╝ ╚═══════════════════════════╝
```

Khối "chờ vào danh mục" hiện ra ở đây là chủ ý — nhắc **nhịp tuần** mà README nói
dễ bị bỏ nhất.

---

## Ba state

| Màn | empty | loading | error |
|---|---|---|---|
| Trang chủ | **kho rỗng** — đếm draft, 4 bước thêm bài | — (tĩnh) | build lỗi → CI chặn |
| Tất cả | không kết quả khớp | — | — |
| Chờ duyệt | không còn bản chờ → "đã duyệt hết" | — | — |
| Cửa sổ | không áp dụng | — | 404 nếu bài chưa `approved` |

`empty` của trang chủ **không phải trường hợp hiếm** — nó là trạng thái hiện tại
của dự án (kho đang rỗng).

---

## Responsive

| Ngưỡng | Đổi gì |
|---|---|
| <1080px | vùng 2+3 xếp dọc · nổi bật 1 cột |
| <720px | cửa sổ chiếm toàn màn (`inset: 60px 0 0`) · ẩn mục lục · ẩn tab menu |
| Mọi cỡ | thân bài **không bao giờ** cuộn ngang; bảng cuộn trong ô |
