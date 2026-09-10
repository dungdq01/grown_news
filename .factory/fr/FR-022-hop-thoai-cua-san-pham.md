# FR-022 — Hộp thoại của sản phẩm, bỏ `confirm()`/`prompt()` của trình duyệt

mở_bởi: người dùng, 2026-08-20
tới: s5 (`ui_frozen` — lớp cảnh báo) · s8 (`shell.html`, `prototype.css`, script, test)
mức: thay lớp hỏi-đáp của toàn bộ giao diện
trạng_thái: MỞ — thi hành theo yêu cầu trực tiếp

## Vấn đề

Người dùng chỉ vào hộp thoại `127.0.0.1:8787 says` khi xoá bài:

> *"tất cả những cảnh báo như này vẫn design popup thông báo chứ ko phải thông
> báo kiểu dev này đâu nhé"*

`confirm()`/`prompt()` là hộp thoại của **trình duyệt**, không phải của sản phẩm:
tiêu đề mang địa chỉ máy chủ, font và nút của hệ điều hành, không token nào,
không theo quy ước đặt tên nút (FR-016).

**Và có một hệ quả nặng hơn thẩm mỹ.** Từ lần thứ hai, Chrome hiện ô *"Không cho
trang này tạo hộp thoại nữa"*. Bấm nhầm một lần thì **mọi `confirm` sau đó trả
`false` im lặng** — nút Xoá thành nút chết, không báo gì, và không ai đoán ra vì
sao. Một lớp bảo vệ mà người dùng tự tắt được bằng một cú bấm nhầm thì không
phải lớp bảo vệ.

## Không dựng mới — repo đã có sẵn hệ hộp thoại

`<dialog class="dlg">` (`#dlg-nhan`, `#dlg-sua`) dựng ở FR-019/FR-021, kèm lý do
đã chốt trong `shell.html`: *"focus-trap, ESC đóng, backdrop, `inert` — trình
duyệt làm sẵn, đúng hơn mọi bản tự viết"*. FR này **tái dùng đúng khuôn đó**,
thêm một hộp thoại dùng chung.

Lý do kỹ thuật mạnh nhất để không tự dựng overlay: cửa sổ đọc dùng `z-index`
**tăng không trần** (`let Z = 40`, `++Z` mỗi lần mở/focus/kéo). Một overlay
`position:fixed` sẽ **chui xuống dưới** cửa sổ ngay khi người dùng mở đủ nhiều.
`showModal()` vào *top layer* — không có cuộc đua nào để thua.

## Thiết kế

Một hàm, ba vai, trả Promise:

```ts
hoi({ tieuDe, chu, nutOk, pha?, nhap? }): Promise<boolean | string | null>
```

| Vai | Thay cho | Trả về |
|---|---|---|
| xác nhận | `confirm()` | `true` / `false` |
| hỏi một dòng chữ | `prompt()` | chuỗi đã trim / `null` |
| báo tin (đã có sẵn) | `alert()` | `bao()` — toast, không chặn |

**Toast giữ nguyên, và đó là chủ ý**: `hoi()` HỎI (chặn, đòi trả lời), `bao()`
BÁO (việc đã xong, tự tắt sau 6s). Bắt bấm OK mỗi lần lưu thành công là phiền vô
ích.

### Bốn chỗ thay, nhãn nút theo FR-016

| Hàm | Nhãn nút chính |
|---|---|
| `xoaTuCua` — xoá bài | **Chuyển vào thùng rác** (đỏ) |
| `ketNapKhaiNiem` — hỏi nhãn | **Thêm nhãn** (có ô nhập) |
| `xoaNhanTuWeb` — xoá nhãn | **Xoá nhãn** (đỏ) |
| nút `#f-huy` — đóng form đang sửa | **Đóng, bỏ thay đổi** (đỏ) |

Luật FR-016 *"thao tác không thuận nghịch phải hỏi lại trước"* **giữ nguyên** —
thay `confirm` không phải là bỏ bước hỏi.

Người dùng chốt: **một mức xác nhận cho tất cả** (không làm kiểu gõ-tên-để-xác-nhận
cho xoá nhãn).

## Bốn cái bẫy đã xử lý

1. **Promise treo.** Đóng bằng Escape / nút ✕ / bấm ra ngoài đều bắn sự kiện
   `close` chứ không qua nút OK. Không nghe `close` thì hàm gọi đứng chờ mãi một
   câu trả lời không bao giờ tới. ⇒ nghe `close`, trả `false`/`null`.
2. **Trả lời hai lần.** `dongHoi()` xoá tham chiếu `hoiXong` **trước** khi gọi
   `close()`, nên handler `close` không trả lời chồng lên.
3. **Listener chồng.** `gan()` chạy lại mỗi lần điều hướng SPA ⇒ listener `close`
   phải gỡ trong `addCleanup`, cùng chỗ với các listener khác.
4. **Escape của cửa sổ đọc.** Handler `phim` đóng cửa sổ trên cùng khi Escape.
   Khi hộp thoại mở, `phim` thoát sớm — Escape để `<dialog>` tự lo, không đóng
   nhầm cửa sổ phía sau.

Cộng: câu hỏi đặt bằng `textContent` — tiêu đề bài do người dùng đặt, nhét thẳng
vào `innerHTML` là mở đường cho thẻ trong tên bài chạy thật.

## Đường dự phòng — cố ý giữ

Trong chính `hoi()`: nếu trang không có thẻ `<dialog id="dlg-hoi">` (bản build
cũ còn trong cache), rơi về `confirm`/`prompt`. Thà hỏi bằng hộp thoại trình
duyệt còn hơn **im lặng làm luôn** một việc xoá. Đây là hai lời gọi duy nhất còn
lại, và test cho phép đúng hai.

## Răng máy

`four-screens.test.js`: đếm lời gọi `confirm|alert|prompt` trong bundle, **tối đa
2** (đường dự phòng) · `dlg-hoi` + `showModal` phải có trong bundle · thẻ
`<dialog id="dlg-hoi">` phải có trong shell.

## Đổi thì

Thêm chỗ hỏi mới ⇒ gọi `hoi()`, không gõ `confirm`. Test sẽ đỏ ngay ở lời gọi
thứ ba.
