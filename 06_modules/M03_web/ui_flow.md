# M03_web — ui flow

> **Module duy nhất có màn.** Thiết kế đóng băng ở G5 — file này nói *thao tác nào
> lấy dữ liệu nào*, không thiết kế lại. Bố cục ở `05_uiux/wireframes/`.

## Màn thuộc module này

| Màn | Wireframe | Vai |
|---|---|---|
| `SCR-00` | `SCR-00-app-shell.md` | app shell + cửa sổ đọc nổi |
| `SCR-02` | `SCR-02-trang-chu.md` | trang chủ — 4 vùng |
| `SCR-01` | `SCR-01-trang-bai.md` | nội dung bài, các mục theo khung khai |
| `SCR-03` | `SCR-03-tra-cuu.md` | tra cứu theo concept |
| *Chờ duyệt* | `SCR-00` §Màn Chờ duyệt | **chỉ hiện**, không ghi |

## Thao tác → dữ liệu

| Thao tác | Đọc gì | Ra gì |
|---|---|---|
| Vào trang chủ | 6 bản `approved` | 4 vùng: nổi bật · mới · KPI kho · lưới gần đây |
| Bấm một bài | file `.md` đó | cửa sổ nổi mới, lệch 28px |
| Mở bài thứ 2 | file khác | cửa sổ thứ 2, bài 1 **còn nguyên** |
| Kéo / giãn cửa sổ | — | 8 hướng, min 340×220; chữ co theo `cqw` |
| Bấm concept | `concepts.yaml` + `concepts[]` mọi bài | SCR-03 lọc |
| *Xem tất cả* | 10 bản ghi, kể cả draft | 9 dòng (đã gộp 1 nhóm) |
| *Chờ duyệt* | 3 bản `draft` | danh sách — **hết**, không có nút duyệt |
| Esc | — | đóng cửa sổ trên cùng |

## Ba state — bắt buộc đủ

| State | Khi nào | Hiện gì |
|---|---|---|
| empty | kho 0 bài (**hiện tại**) | "chưa có bản phân tích nào" + cách nạp |
| loading | đang build/tải ảnh | skeleton theo token, không spinner giữa màn |
| error | file hỏng frontmatter | báo file nào, **không** ẩn im lặng |

State `empty` không phải giả định: kho **đang rỗng**, nên đây là màn đầu tiên
người dùng thấy khi M03 chạy lần đầu ở chặng B.

## Nút duyệt sống khi nào (FR-011 — trước đây mục này tên "Vì sao không có nút duyệt")

Nút duyệt/loại nằm ở **chân cửa sổ đọc**, không ở hàng danh sách: B-B1 tồn tại vì
*"đây là chỗ duy nhất một con người đọc thật"* — nút đứng cạnh nội dung vừa đọc,
không đứng cạnh một tiêu đề chưa mở.

Nó chỉ sống khi CẢ HAI điều đúng: `/api/health` trả 200 (người đã chạy
`npm run api`) VÀ đang ở bản thật (không phải `/mock/`). Thiếu một ⇒ control
không tồn tại trong DOM — bundle tĩnh deploy vẫn chỉ trả lời *"còn gì phải duyệt?"*.

Approve đòi người khai 3 trường M1 (FR-001), reject đòi lý do ≥5 ký tự — form
không prefill gì (M08-R3).

## Vì sao nội dung mọi bài giống nhau ở prototype

Nợ từ G5: `app-v20.html` chưa nối `kb/` nên nội dung mẫu dùng chung. Mở 2 cửa sổ thấy
nội dung y hệt.

**Không phải bug thiết kế** — là chỗ s8 nối dữ liệu thật vào.
