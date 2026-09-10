# SCR-23 · Phiếu CHƯNG CẤT — một phiếu, và nó phải nói ra cái giá

> Chủ dự án 2026-09-07: *"Và sửa lại UI màn chưng cất nhé, chốt dùng 1 cái thôi
> và làm cho đẹp — khoa học và có hiệu ứng vào. xấu quá"*
>
> **Trạng thái: ĐÃ DUYỆT — chủ dự án 2026-09-07** (*"hợp lý, sửa đi"*).
> Ba câu ở §6 chốt theo phương án đề xuất: CÓ đánh số ①②③ · CÓ thanh "gửi gì" ·
> khung cảnh báo KHU VỰC giữ nguyên 3 dòng.
>
> Mẫu số của thanh ① là **`tran_payload_byte` = 33 554 432** (`nguong.json`,
> kiểm TRƯỚC cửa egress) — một trần ĐÃ KHAI, không phải một con số tôi bịa để
> thanh trông đẹp. Cửa `/api/model` phải chở thêm trường ấy; vắng nó thì ① hiện
> con số mà KHÔNG vẽ thanh, y khuôn `veOChiDan` trả rỗng khi thiếu trần.
>
> Note thường trực đã ký, áp cả ở đây:
> *"UI và animation lúc transcript / chưng cất phải hiệu ứng 3D, superpower
> (kiểu dải tần số, hiệu ứng âm thanh...) vào nha. now, it's basic"*

> ## ĐẢO LẠI 2026-09-07 — chủ dự án, sau khi chạy thật
>
> *"xoá hết text comment, mô tả thừa thãi đi. Tôi chỉ cần chọn model, viết
> prompt là được, mà ô viết prompt làm cho to tí"*
>
> Phần lớn wireframe dưới đây **KHÔNG còn hiệu lực**. Bỏ: khối ① GỬI GÌ (thanh
> + phần trăm + `tran_payload_byte`) · ba nhãn đánh số ①②③ · khung cảnh báo ba
> dòng + câu dịch khu vực · câu *"Chỉ dẫn KHÔNG đổi được khung mục"* · hai
> trong bốn hiệu ứng.
>
> **Phiếu nay đúng hai thứ: chọn model, và một ô prompt TO mở sẵn.**
>
> Giữ lại đúng ba thứ, và ba thứ ấy là hợp đồng chứ không phải thẩm mỹ:
> · một DÒNG công bố egress + khu vực nguyên văn (`spec §4.0c` frozen)
> · ô prompt mở sẵn — `T03-116` gấp nó vì cho là ít người dùng; chủ dự án khai
>   ngược, nên lý lẽ cũ hết hiệu lực
> · chuyển động trong guard opt-in, 0 thuộc tính layout
>
> **Bài học tôi phải ghi:** tôi đo được sáu chỗ xấu rất đúng ở §0, rồi chữa
> bằng cách THÊM — thêm khối, thêm số, thêm khung, thêm câu giải thích. Chủ dự
> án hỏi một phiếu gọn hơn; tôi giao một phiếu công phu hơn. *Thiếu thứ bậc*
> chẩn đúng, nhưng thứ bậc đạt được bằng cách BỎ, không bằng cách xếp tầng.
>
> Và một lỗi nặng hơn cả thiết kế: `moPhieuChungCat` không gọi `trCss()`, nên
> toàn bộ 5 929 byte CSS của bản đầu **chưa bao giờ vào trang**. Cổng đo *luật
> CSS có tồn tại* nên xanh hết. Vế `1` của cổng nay canh đúng chuyện ấy.

---

## 0 · Đo cái đang xấu, trước khi vẽ cái mới

Không phải "xấu" chung chung. Sáu chỗ đo được trên ảnh chụp:

| # | đo được | vì sao nó xấu, và xấu THẾ NÀO |
|---|---|---|
| 1 | `textarea` ~3 dòng, rộng ~1/3 phiếu, có tay kéo | Ô nhập **nhỏ hơn** placeholder của chính nó ⇒ chữ mẫu bị cắt giữa câu. Người đọc thấy một ô hỏng, không thấy một lời mời |
| 2 | placeholder dùng **font mono** | Cả phiếu là font UI. Một ô mono giữa phiếu đọc như một khối mã lỡ dán vào |
| 3 | 3 chip xám đặc, sát nhau, không lề | Trông như **tab đang tắt**, không như nút bấm được. Người không biết bấm được |
| 4 | `còn 500 ký tự` + `Chỉ dẫn KHÔNG đổi được…` là hai dòng văn xuôi rời | Hai câu cùng nói về ô nhập mà nằm thành hai khối, đẩy nút chính xuống dưới màn |
| 5 | `Khu vực  khong-xac-dinh` — **slug thô** | `FR-053 §1.4` đòi hiện NGUYÊN VĂN, đúng. Nhưng nguyên văn ≠ **trần trụi**: nó là thông tin PHÁP LÝ (NĐ 356/2025 Điều 14) mà đang nhìn như một lỗi dữ liệu |
| 6 | ba hàng `label + control` canh lệch nhau | `Nhà cung cấp`/`Model` là `select` cao ~40px, `Khu vực` là text — mắt không bám được một trục nào |

**Kết luận đọc được từ bảng trên:** phiếu này không thiếu hiệu ứng. Nó thiếu
**thứ bậc** — mọi phần tử đang cùng một trọng lượng, nên mắt không biết đọc gì
trước. Thêm animation vào một bố cục phẳng chỉ làm nó nhoè hơn.

---

## 1 · Ý tưởng chủ đạo: phiếu là một BẢN KHAI EGRESS, không phải một form

Đây là chỗ duy nhất trong hệ mà **dữ liệu rời khỏi máy**. Phiếu nên trông như
một tờ khai hải quan, không như hộp thoại cài đặt: người phải đọc *gửi cái gì ·
tới đâu · rồi mới bấm*.

⇒ Ba KHỐI theo đúng thứ tự đó, mỗi khối một câu hỏi:

```
   ┌────────────────────────────────────────────────────────┐
   │  ⚗  CHƯNG CẤT                                      ✕   │
   │     tai-lieu/linux-foundation                          │
   ├────────────────────────────────────────────────────────┤
   │                                                        │
   │  ①  GỬI GÌ                                             │
   │      ┌──────────────────────────────────────────────┐  │
   │      │ ▓▓▓▓▓▓▓▓▓▓▓▓▓░░░  toàn văn · 12 400 chữ      │  │
   │      └──────────────────────────────────────────────┘  │
   │      video ⇒ dòng này đọc "TRANSCRIPT · 142 câu"       │
   │                                                        │
   │  ②  TỚI ĐÂU                          ← khối NẶNG nhất  │
   │      nhà      [ deepseek            ▾]                 │
   │      model    [ deepseek-v4-flash   ▾]  ● free         │
   │      ┌──────────────────────────────────────────────┐  │
   │      │ ⚠  KHU VỰC  khong-xac-dinh                   │  │
   │      │    chưa xác minh được route của cửa —        │  │
   │      │    dữ liệu có thể tới bất kỳ vùng nào        │  │
   │      └──────────────────────────────────────────────┘  │
   │                                                        │
   │  ③  GÓC NHÌN RIÊNG            (tuỳ chọn)      488/500  │
   │      ⟨ Tóm cho dev ⟩ ⟨ Tập trung rủi ro ⟩ ⟨ Thực tiễn VN ⟩│
   │      ┌──────────────────────────────────────────────┐  │
   │      │                                              │  │
   │      │                                              │  │
   │      └──────────────────────────────────────────────┘  │
   │      không đổi được khung mục hay hạng tin cậy         │
   ├────────────────────────────────────────────────────────┤
   │  Đóng                          ⚗  GỬI ĐI CHƯNG CẤT     │
   └────────────────────────────────────────────────────────┘
```

### Vì sao ĐÁNH SỐ ①②③ chứ không chỉ tách khoảng trắng

Ba khối trả ba câu **khác loại**: một câu về nguyên liệu, một câu có hệ quả
pháp lý, một câu tuỳ chọn. Khoảng trắng nói *"đây là ba nhóm"*; con số nói
*"đọc theo thứ tự này"*. Với một phiếu mà bấm sai là tiêu token thật, thứ tự
đọc là thứ đáng cưỡng chế.

### Vì sao KHU VỰC được đóng khung, không phải một dòng text

Nó là **hợp đồng pháp lý**, và `spec §4.0c` khai nguyên văn *"chọn model là
chọn KHU VỰC PHÁP LÝ — phải hiện, không được im"*. Hôm nay nó là chữ nhỏ nhất
trong phiếu, cạnh hai `select` to. Đóng khung + câu giải thích là cách duy nhất
để `khong-xac-dinh` đọc thành *một cảnh báo* thay vì *một lỗi dữ liệu*.

Giữ NGUYÊN VĂN slug (`FR-053 §1.4`) — chỉ thêm **câu dịch bên dưới**, không
thay chữ.

---

## 2 · Hiệu ứng — bốn cái, mỗi cái phải LÀ MỘT PHÉP ĐO

Note của chủ dự án đòi 3D/superpower. Nhưng `SCR-22` đã chốt luật cho mọi
chuyển động ở hệ này, và luật ấy áp tiếp ở đây:

> Chuyển động phải là một **PHÉP ĐO**, không phải một lớp trang trí. Cổng cấm
> `Math.random()` trên đường vẽ.

| hiệu ứng | nó ĐO gì | nếu bỏ thì mất gì |
|---|---|---|
| **a · phiếu vào** — `perspective` + `rotateX(6deg)→0` + `opacity`, 260ms | hướng: phiếu tới từ trước mặt, không bật ra từ hư không | mất cảm giác *"một thứ mở ra trên nền trang"* |
| **b · thanh GỬI GÌ** — `scaleX` từ 0 tới tỉ lệ **số chữ thật / trần** | **kích thước nguyên liệu**. Thanh dài ⇒ tốn nhiều token | người không thấy 12 400 chữ khác 300 chữ ở đâu |
| **c · KHU VỰC đổi** — khung nháy viền 1 nhịp khi `model` đổi | *"con số vừa đổi vì bạn vừa chọn khác"* | đổi model xong khu vực đổi im lặng — thứ tệ nhất có thể ở đúng ô này |
| **d · nút GỬI** — 3 vòng đồng tâm quét ra 1 lần lúc bấm | xác nhận cú bấm ĐÃ nhận, trước khi mạng trả lời | người bấm hai lần vì tưởng lần đầu trượt |

**KHÔNG có:** dải tần số (không có âm thanh ở đây — mượn hình của việc khác,
đúng lỗi `SCR-20` đã cấm) · thanh phần trăm chờ mạng (ta không đo được) ·
chuyển động nền, gradient chạy, hạt bay.

**3D bằng gì:** `perspective` trên `dialog`, `transform` trên con. Chỉ
`transform`/`opacity` — `AC6` cấm animate thuộc tính layout.

**Guard:** viết chiều OPT-IN (`prefers-reduced-motion: no-preference`) như ba
khối sẵn có của chunk. Người đã khai cần tắt vẫn **đọc được đủ**: thanh ② vẫn
đúng chiều dài, khung khu vực vẫn có viền, chỉ thôi chuyển động.

---

## 3 · Sáu chỗ xấu ở §0 được vá thế nào

| # | vá |
|---|---|
| 1 | `textarea` **full-width**, min 4 dòng, `resize: vertical` |
| 2 | bỏ mono — dùng `--f-ui` như cả phiếu |
| 3 | chip thành **outline + bo tròn + gap**, có `:hover`/`:active`; chúng là NÚT nên phải trông như nút |
| 4 | `488/500` lên **cùng hàng với nhãn ③** (số bên phải); câu *"không đổi được khung mục"* thành chú thích nhỏ dưới ô, một dòng |
| 5 | khu vực vào **khung cảnh báo** kèm câu dịch |
| 6 | ba hàng dùng **một grid 2 cột** — nhãn phải, control trái, baseline thẳng |

---

## 4 · Chỗ CSS sống, và ngân sách

| | |
|---|---|
| `gn.js` | 101 931 / 102 400 — còn **469 byte** |
| `gn.css` | 102 763 / 104 448 — còn 1 685 byte |
| `KHOI_CSS` của `cctab` | 11 776 byte, **0 byte vào bundle chung** |

⇒ Toàn bộ đi vào `KHOI_CSS`. Phiếu này chỉ tồn tại trong chunk `cctab`, nên
không có lý do nào để một pixel của nó nằm ở `gn.css`.

---

## 5 · Năm AC đo được

1. **0 `Math.random()`** trên mọi đường vẽ
2. **0 thuộc tính layout** được animate (chỉ `transform`/`opacity`)
3. thanh ② dẫn từ **số chữ THẬT** của bản ghi, không từ một hằng
4. có guard chuyển động và nó **giữ** thông tin, chỉ bỏ chuyển động
5. `gn.js`/`gn.css` **không đổi một byte** — đo bằng `page-weight.test.js`

---

## 6 · Ba câu cần chủ dự án chốt

1. **Ba khối ①②③ có đánh số** — hay bạn muốn chỉ tách khoảng trắng, không số?
   Tôi đề xuất có số: nó cưỡng chế thứ tự đọc cho một phiếu mà bấm sai là tiêu
   token thật.
2. **Thanh "GỬI GÌ" ở ①** là thứ MỚI (hôm nay phiếu không hề nói nguyên liệu
   lớn bao nhiêu). Thêm hay bỏ? Tôi đề xuất thêm — nó là con số duy nhất trong
   phiếu nói trước *cú bấm này đắt cỡ nào*.
3. **Khung cảnh báo KHU VỰC** chiếm ~3 dòng. Đáng chỗ đó không, hay bạn muốn
   một dòng gọn hơn?

**Chưa duyệt ⇒ chưa code.** `AC0`.
