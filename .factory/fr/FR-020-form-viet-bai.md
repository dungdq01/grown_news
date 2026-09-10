# FR-020 — Form viết bài: bố cục theo câu hỏi, cột theo dõi cổng, tách khỏi shell

mở_bởi: người dùng, 2026-08-19 — *"design lại table - page viết bài… tôi cần chuyên nghiệp và khoa học chứ không phải làm bừa một cái để ghi vào là được"*
tới: s5 (`ui_frozen` — bố cục màn Nạp nguồn) · s8 (`shell.html`, `prototype.css`, emitter, script, test)
mức: dựng lại một màn + đổi cách phát trang
trạng_thái: MỞ — thi hành theo yêu cầu trực tiếp
con_số_bị_thay_thế: FR-036 (2026-08-27)

> **Phần CON SỐ của FR này đã bị FR-036 thay thế.** Khung thân bài đổi từ 9 mục
> sang 5 mục (§3 có bốn mục con), nên "9 ô" thành **8 ô** = số mục LÁ, và cổng
> tỉ lệ đảo từ sàn `mục 5+6 ≥35%` thành trần `mục 1+2 ≤25%`.
>
> **Phần NGUYÊN TẮC vẫn nguyên hiệu lực** và FR-036 dựa vào nó: một ràng buộc của
> cổng ⇒ một ô nhập · chế độ thô luôn còn làm đường thoát · mục có cấu trúc lồng
> thì cho nút nạp khung chứ không dựng form lồng · cột theo dõi chỉ ƯỚC TÍNH,
> không chặn gì (M05-R3).
>
> Con số giờ khai ở `core/assets/khung-than-bai.json` và cổng
> `core/tests/check_khung.py` đối chiếu nó với shell — nên FR sau đổi khung không
> phải sửa lại FR này nữa.

## Bản cũ sai ở đâu

| Hiện tượng | Nguyên nhân |
|---|---|
| Đọc mỏi: nhãn ở trái, chú thích văng sang mép phải cách nửa màn hình | một `.f-row > span` gộp cả nhãn lẫn chú thích, `justify-content:space-between` |
| Ô nhập kéo dài 1300px | không có trần bề rộng — dòng quá 70 ký tự thì mắt mất điểm neo khi nhảy dòng |
| 14 trường nằm thành một khối phẳng | không nhóm; người viết không biết còn mấy bước |
| Gửi xong mới biết thiếu mục 6, thiếu locator, mục 5+6 quá mỏng | cổng chạy ở máy chủ; mỗi lần trượt là một vòng gửi → 422 → đọc → sửa |
| Không biết bài sẽ nằm ở đâu | `source_type` và `slug` là hai ô rời; đường file chỉ hiện ra sau khi ghi xong |
| Form hiện cả ở bản `/mock/` — nơi nó không chạy được | `.np-form{display:block}` đứng sau `.api-only{display:none}` cùng độ ưu tiên ⇒ thắng, và nuốt luôn thuộc tính `hidden` |
| Trang chủ 47 KB / ngưỡng 48 | khối `v-nap` nặng **12.5 KB trên 21.9 KB shell (57%)** và đi theo **mọi** trang |

## Thiết kế mới

**Bốn nhóm, mỗi nhóm một câu hỏi** — thứ tự theo thứ người viết biết trước:

1. *Bài này là gì* — tiêu đề · một câu tóm tắt · URL · loại nguồn · ngày
2. *Cất ở đâu trong kho* — id · slug (hai trường **là địa chỉ**, khoá khi sửa)
3. *Bạn đánh giá thế nào* — tin cậy · conformance · category · concepts
4. *Nội dung* — thân bài

Mỗi hàng xếp **dọc**: nhãn → chú thích → ô nhập. Chú thích nằm ngay dưới nhãn thì
mắt đọc liền mạch; kéo sang mép phải là bắt người dùng nhảy ngang. Ô nhập cụt ở
`--w-read`.

### Cột theo dõi — phản chiếu cổng, không thay cổng

Cột phải dính khi cuộn, cập nhật lúc gõ: 9 mục đã có/còn thiếu · số từ so với
trần 1800 · tỉ lệ mục 5+6 so với ngưỡng 35%.

Ba thứ đó là **ba lỗi validate hay gặp nhất** và đều đếm được ngay trên trình
duyệt. Nó **không phải bản kiểm thứ hai** (M05-R3 cấm hai bản kiểm lệch nhau im
lặng): không chặn gì, không quyết gì, và tự khai *"ước tính — lời cuối là
`validate.py`"*. Nó chỉ trả lời sớm câu mà cổng sẽ hỏi.

Cộng: dòng **"sẽ ghi vào `kb/<loại>/<slug>.md`"** cập nhật trực tiếp, thanh hành
động dính đáy, `Ctrl+Enter` để ghi.

### Màn Nạp nguồn tách khỏi shell

Emitter chỉ nhúng `v-nap` vào trang `/nap/`. Trang khác không mang nó ⇒
**trang chủ 47 → 35 KB**. Đổi lại: bấm "Nạp nguồn" từ trang khác là **tải lại
trang thật** — `doiView()` rơi về `location.href` khi không thấy màn.

Chấp nhận được: đây là màn để **viết**, không phải để đọc song song với cửa sổ
khác. Có chốt chống lặp: đang ở đúng trang đó mà vẫn không thấy màn thì đứng yên,
để lỗi lộ ra thay vì tải mãi.

## Thi hành

| Chỗ | Đổi |
|---|---|
| `shell.html` | form dựng lại: 4 `fieldset` đánh số, hàng xếp dọc, header có đường ghi, cột theo dõi |
| `prototype.css` | lưới 2 cột cho form · `.f-nhom` · `.f-row` dọc · `.f-doi-chieu` dính · `.f-act` dính đáy · `[hidden]` thắng class · bỏ `display` khỏi `.np-form` |
| `multiwindow.inline.ts` | `soiThanBai()` · `veDuongGhi()` · Ctrl+Enter · `doiView()` rơi về tải trang |
| `home-pages/index.ts` | `catNap()` — cắt `v-nap` khỏi mọi trang trừ `/nap/`, áp ở **cả hai** chỗ sinh trang |
| `four-screens.test.js` | thêm nhóm kiểm FR-020; sửa CÓ CHỦ ĐÍCH luật "form ngủ" (xem dưới) |

### Luật "form ngủ" sửa có chủ đích

Bản cũ đòi **đúng một** form và bắt buộc có cả `hidden`. Nó bắt nhầm form thêm
nhãn (`#f-cat-moi`, FR-019) — form đó `api-only` và ngủ đúng nghĩa, chỉ không
đóng sẵn. Đếm form là đếm sai thứ. Luật đúng: **mọi** `<form>` trong bundle tĩnh
phải mang `api-only`.

## Đổi thì

Muốn màn Nạp nguồn mở được bằng SPA từ mọi trang ⇒ phải nhúng lại `v-nap` vào
shell, và trả lại 12.5 KB cho mỗi trang. `page-weight.test.js` sẽ nói ngay.

---

## Sửa lần 2 — SCR-05 (cùng ngày, sau khi người dùng rà bản dựng)

Người dùng: *"UI vẫn chưa ổn — chưa có sample cho user nhập. Mục nội dung đòi
đủ 9 mục nhưng không thiết form cho từng mục nhỏ đó. Redesign… ô nhập nằm ngang
ô title. Nên vẽ wireframe rồi hẵng dựng."*

Wireframe vẽ trước: [`05_uiux/wireframes/SCR-05-form-viet-bai.md`](../../05_uiux/wireframes/SCR-05-form-viet-bai.md).

| Điều sai | Sửa |
|---|---|
| Ô trống, không biết viết gì | Nút **điền một bài mẫu** đổ cả form bằng một bài THẬT lấy từ `kb-mock/` — kho đó qua `validate.py` trong CI (`check_kb_mock.py`) nên mẫu chắc chắn hợp lệ. Gõ tay mẫu trong JS thì nó sai lặng lẽ ngay lần đầu schema đổi |
| Đòi 9 mục, cho 1 textarea | **9 ô**, mỗi mục một ô, gợi ý nằm trong chính ô đó. Mục 5 và 6 đánh dấu "mục nặng" (cổng soi kỹ nhất). Ghép thành `## n. <tên>` khi gửi |
| Nhãn trên ô nhập | Nhãn **cột trái 13rem**, ô nhập phải — chỉ ở ≥1200px; hẹp hơn thì xếp dọc đúng hơn |

### Ba điều không được phá, và cách giữ

- **Chế độ thô luôn còn.** Bài do skill 6-pass sinh có thể mang cấu trúc khác;
  `raiMuc9()` trả `false` khi không tách được sạch, và form **ở lại chế độ thô**
  kèm một dòng báo. Nhét bừa vào 9 ô là nuốt mất nội dung — hỏng nặng hơn nhiều
  so với việc hiện một textarea.
- **Mục 6 không dựng form lồng.** Nó có nhiều `### 6.x`, mỗi cái 5 dòng bullet
  bắt buộc. Dựng form cho nó là dựng một trình soạn thảo. Thay bằng nút
  **[+ một tinh túy]** nạp sẵn đúng khuôn 5 dòng.
- **Nút mẫu không phải "máy tự điền"** (M05-R2). Nó có nhãn nói rõ việc nó làm,
  đổ tất cả cùng lúc, và người dùng xoá dần thay bằng bài của mình — khác hẳn
  việc lặng lẽ đoán hộ một ô người ta bỏ trống.

### Răng máy

`four-screens.test.js` nhóm SCR-05: có `#f-muc9` · có nút đổi chế độ (chế độ thô
là **đường thoát**, bỏ nó là nuốt nội dung) · có nút mẫu · JS có đủ
`dungMuc9`/`gomMuc9`/`raiMuc9`/`dienMau` · mẫu **lấy từ kho mẫu, không gõ tay
trong JS**.

### Sửa lần 3 — cấp bậc thị giác và nhất quán bố cục

Người dùng: *"mục 5 và 6 lỗi này — nó là con (thuộc 9 mục) của nội dung mà;
các phần 2-3 chưa đúng ý tôi"*. Cả hai đều đúng:

| Lỗi | Nguyên nhân | Sửa |
|---|---|---|
| Mục 5, 6 trông ngang hàng với nhóm lớn | dùng lại **huy hiệu tròn đỏ** của nhóm cha (①②③④) để nhấn "mục nặng" — trùng ký hiệu là trùng cấp bậc | số nền nhạt (`--accent`) + **vạch dọc đỏ ở mép ô nhập**: khác hình, khác vai |
| Nhóm 2–3 xếp dọc trong khi nhóm 1 nằm ngang | cặp trường bọc trong lưới 2 cột **lồng** bên trong `.f-nhom`, nên không nhận luật nhãn-trái | `.f-doi{display:contents}` — gỡ lớp lồng, mọi hàng ăn cùng một luật |

Ghi thêm vào wireframe SCR-05 (mục "Sửa sau lượt rà đầu") để lần sau đọc lại
được lý do, không chỉ thấy kết quả.
