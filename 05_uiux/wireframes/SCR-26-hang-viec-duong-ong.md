# SCR-26 · HÀNG VIỆC — dòng bài + đường ống, nhóm theo mốc ngày

> **Trạng thái: ĐÃ DUYỆT — chủ dự án, 2026-09-10** (*"A và C được đấy"*).
>
> Bản dựng để duyệt (đúng token `05_uiux/tokens.css`, dữ liệu thật của màn):
> <https://claude.ai/code/artifact/e6083e5b-ccc8-4813-a5d0-f70c4c9ccb1b>
>
> Chỉ đạo, chép nguyên văn: *"design không ổn: vẽ lại wireframe, tôi ko chấp
> nhận kiểu list menu design cổ hủ như thế"*.

## 0 · Cái sai của bản bị từ chối — và nó là của tôi

`WO-085` (sáng 2026-09-10) trả lời đúng câu hỏi *"việc này thuộc bài nào"*
nhưng trả lời bằng **một tiêu đề `<h3>` chen vào lưới phẳng** — tức một vách
ngăn, không phải một bố cục. Và cùng lúc nó **thêm hàng nút thứ ba** vào một
màn đã có hai hàng.

Đo được trên màn thật:

| hàng nút | chiều nó gánh | lẽ ra nằm ở đâu |
|---|---|---|
| `tất cả · chờ · đang chạy · dừng · xong` | trạng thái | trên chính dòng việc |
| `mới nhất · cũ nhất` + `hôm nay · 7 ngày · 30 ngày · tất cả` | thời gian | tiêu đề nhóm ngày |
| `<h3>` tiêu đề bài (WO-085) | bài gốc | là hình dạng của hàng |

**Mệnh đề của bản vẽ lại: mỗi hàng nút là một chiều dữ liệu chưa được đưa vào
bố cục.** Khi hình dạng không nói được gì thì mọi thứ phải leo lên thanh lọc,
và màn thành một thanh công cụ có danh sách đính kèm.

## 1 · Hình dạng — một bài một dòng

```
Hôm nay ─────────────────────────────────────────────── 3 việc

┌────┐  Doanh nghiệp một người tại Việt Nam…       ╭──────────┬──────────┬───────────╮
│ ▶  │  3 việc · bee-tok/gemini-3.5 · 02:00        │✓transcript│✓ảnh bìa │✓chưng cất │
└────┘                                             ╰──────────┴──────────┴───────────╯

Hôm qua · 09-09 ──────────────────────────────────────── 14 việc

┌────┐  Mở mang tầm mắt sau khi xem chị Lauren…    ╭──────────┬──────────┬───────────╮
│ ▶  │  4 việc · gemini-2.5-flash-lite · 07:34     │✓transcript│✓ảnh bìa │✕chưng cất │
└────┘                                             ╰──────────┴──────────┴───────────╯
                                                                          ↑ đỏ, đọc
                                                                            được từ xa
┌────┐  Cài đặt và thiết lập Hermes trên VPS       ╭──────────┬──────────┬───────────╮
│ ◆  │  2 việc · gemini-2.5-flash-lite · 22:10     │✓transcript│●tải video│ chưng cất │
└────┘                                             ╰──────────┴──────────┴───────────╯
                                                               ↑ vàng      ↑ mờ = chưa có
```

- **Bìa** 44px — icon + màu theo `source_type`, dùng lại lớp màu của `SCR-25`.
- **Đường ống** — mỗi chặng là MỘT việc. Bốn trạng thái đọc bằng màu:
  `✓ xong` (mực thường) · `● đang chạy` (vàng) · `✕ hỏng` (đỏ) · `chưa có` (mờ).
- Bấm một chặng = mở đúng việc ấy. Chặng `xong` của `chung-cat` mở thẳng bản
  nháp — giữ nguyên `data-ccnhap` đang có.
- **Mốc ngày** là tiêu đề nhóm: `Hôm nay · Hôm qua · <mm-dd>`.

## 2 · Ba hàng nút biến đi đâu

| chiều | trước | sau |
|---|---|---|
| trạng thái | 5 nút | **màu của chặng** — và số tổng kết ở đầu màn thành chỗ bấm để lọc |
| thời gian | 6 nút | **tiêu đề mốc ngày**; cuộn tới đâu là biết ngày tới đó |
| bài gốc | `<h3>` chen giữa lưới | **là chính cái hàng** |

⇒ Thanh lọc còn **không hàng nút nào**.

### 2.1 · Một quyết định của tôi, nói ra để bạn bác được

Bỏ hẳn năm nút trạng thái thì **mất khả năng lọc**, và với 40 bài thì "tìm bài
đang hỏng" lại thành cuộn tay. Nên tôi giữ khả năng ấy nhưng **không dựng lại
một hàng nút**: ba con số tổng kết đã có sẵn dưới thanh tiến trình
(`xong 24 · cần xử lý 1 · chờ 0`) trở thành **chỗ bấm**.

Nó không phải hàng nút thứ tư — nó là bản tóm tắt vốn đã ở đó, nay bấm được.
Không muốn thì nói, tôi bỏ luôn.

## 3 · Điều KHÔNG được đổi

- **Tổng kết vẫn nói về CẢ hàng đợi**, không tính lại trên tập đã lọc —
  `WO-015/BUG-2`, đã trả giá một lần.
- **Trần hiển thị `WO-082`** vẫn áp. Cảnh báo: `capNhin` đang neo cứng vào
  `.cd`; đơn vị bị cắt nay là DÒNG BÀI, nên phải cho `capNhin` nhận selector —
  không thì trần im lặng ngừng chạy và không cổng nào báo.
- **`ccThe` giữ `tenLoai(...)` và `data-ccnhap`** — ba cổng đang đo hai thứ đó
  (`the-viec-noi-ro-loai` · `viec-theo-loai` · `ban-cu-vao-rac`). Chuyển nó
  thành bộ vẽ CHẶNG giữ được cả hai một cách tự nhiên.
- Ba tab `Hàng việc · Kết quả · Thùng rác` giữ nguyên. WO chỉ đụng tab đầu.

## 4 · Hướng B đã cân nhắc và KHÔNG chọn

Cột theo giai đoạn (kanban) xoá hàng trạng thái triệt để nhất và làm việc tắc
nổi bật nhất. Không chọn vì: cột `xong` luôn dài gấp hai chục lần ba cột kia,
và bốn cột không sống được trên màn hẹp — trong khi `A+C` xoá được **hai**
hàng nút thay vì một.

Ghi lại để lần sau không ai đề xuất lại mà không biết nó đã bị cân nhắc.

---

## 5 · Bản 2 — hai điều chủ dự án bác, sửa 2026-09-10

### 5.1 · Đường ống là việc của NGƯỜI, không phải của máy

Chủ dự án: *"Sinh thumbnail là cái gì? tao chỉ có transcript và chưng cất, ko
có sinh thumbnail gì hết, nhác rác vào các trạng thái của tao à?"*

Đo được — hai lớp việc, và bản 1 trộn chúng:

| việc | số | ai đặt |
|---|---|---|
| `sinh-transcript` | 14 | **người** |
| `chung-cat-mot-nguon` | 3 | **người** |
| `sinh-thumbnail` | 7 | MÁY tự xếp (`tho-cua.mjs:203`, `WO-071 lối (a)`) |
| `tai-video` | 1 | MÁY, là bước tiền đề |

⇒ Đường ống **hai chặng**: `transcript → chưng cất`. Việc của máy xuống hàng
meta thành nhãn mờ (`+ảnh bìa`), và **chỉ nổi lên thành chip đỏ khi nó hỏng** —
lúc ấy mới cần người.

### 5.2 · Màu và chuyển động

Chủ dự án: *"bản vẽ lại cần thêm màu sắc và hiệu ứng, làm cơ bản thế cho người
cổ đại dùng à?"*

- **Cột sống trái** mang màu loại nguồn (cùng bảng `SCR-25`), sáng + toả bóng
  khi rê chuột — biết đang ở dòng nào mà không cần thêm một khung viền.
- **Chặng** màu ngữ nghĩa: lục xong · vàng đang chạy · đỏ hỏng · gạch đứt
  chưa có.
- **Chỉ chặng đang chạy mới động**: chấm thở + một vệt sáng quét dọc. Cả màn
  MỘT chỗ chuyển động, nên mắt bị kéo về đúng chỗ đang bận.
- Tắt sạch dưới `prefers-reduced-motion` — chuyển động là thông tin, không
  phải điều kiện để đọc được màn.

Bản dựng: <https://claude.ai/code/artifact/e6083e5b-ccc8-4813-a5d0-f70c4c9ccb1b>

### 5.3 · CHỜ THI CÔNG — hai ý note thêm 2026-09-10

Chưa vào bản dựng, ghi ra để WO tới không bỏ sót.

**(a) Hàng việc chỉ hiện BẢN CUỐI.** Transcript / chưng cất đã `bỏ` · `lỗi` ·
`loại` thì nằm hẳn ở **Thùng rác**, không hiện ở Hàng việc. Hôm nay hàng việc
mang cả 25 việc gồm bản cũ và bản chết, nên nó là một cái sổ chứ không phải
một màn làm việc. *(Hôm nay đã có nhãn `bản cũ đang ẩn — hiện`, nhưng bản
`dừng`/`hỏng` vẫn đứng chung hàng.)*

**(b) Tab `Kết quả` là nơi hiện MỌI bản và MỌI trạng thái** — nó mới là chỗ
tra lịch sử, và cần vẽ lại theo tinh thần ấy.

Bug đo được ở tab đó hôm nay: **chip `tất cả` nói dối.**

```
GET /api/nhap-chung-cat                    → tổng 3
GET /api/nhap-chung-cat?trang_thai=da_bo   → tổng 5
DB thật: da_bo 5 · nhap 2 · da_duyet 1     = 8
```

Cửa mặc định **lược `da_bo`**, nên `tất cả` ra 3 trong khi có 8 — và bốn ô số
(`2 nháp · 0 đã gửi duyệt · 0 trả lại · 1 đã vào kho`) cũng đếm trên tập đã bị
lược. Chip `đã bỏ` thì đúng (5). Tức lỗi ở NGHĨA của `tất cả`, không ở cửa.

