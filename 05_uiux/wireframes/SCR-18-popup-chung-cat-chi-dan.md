# SCR-18 · Popup chưng cất + ô CHỈ DẪN THÊM — wireframe

> `T03-116` bước 1. Backend: `T12-25` (đã xong — trần `tran_chi_dan_ky_tu`,
> preset `chi-dan-mau.json`, cửa `GET /model` trả kèm cả hai).
> **Trạng thái: CHỜ CHỦ DỰ ÁN DUYỆT. Chưa một dòng mã bước 2 nào được viết.**

Vẽ trên popup THẬT đang chạy (`cctab.inline.ts:699`, `<dialog id="dlg-cc">`),
không vẽ một popup tưởng tượng — mọi thứ đã có ở đó giữ nguyên vị trí.

---

## Trạng thái 1 — MẶC ĐỊNH (ô chỉ dẫn GẤP)

Đây là trạng thái 100% người dùng thấy đầu tiên. Popup **không được dài thêm
một dòng nào** so với hôm nay ngoài đúng một dòng gấp.

```
┌─ Chưng cất ─────────────────────────────────────────────────┐
│  tai-lieu/linux-foundation                                  │  ← dlg-id, giữ
│                                                             │
│  ⚠ Chưng cất tiêu token và gửi nội dung ra ngoài…           │  ← CANH_BAO_CC
│                                                             │     T03-106, giữ NGUYÊN VĂN
│  Nhà cung cấp   [ google            ▾ ]                     │  ← optgroup, giữ
│  Model          [ bee/gemini-3.5-flash-lite   ▾ ]           │
│                                                             │
│  ▸ Chỉ dẫn thêm (tuỳ chọn)                                  │  ← MỚI · MỘT DÒNG
│                                                             │
│                          [ Đóng ]  [ Gửi đi chưng cất ]     │
└─────────────────────────────────────────────────────────────┘
```

**Vì sao GẤP mặc định, không mở sẵn:** ô mở sẵn biến một hộp thoại xác nhận
thành một cái form. Người bấm "Chưng cất" đã quyết định rồi; bắt họ đi qua một
ô trống nữa là thêm một bước cho 100% người dùng để phục vụ số ít có yêu cầu
riêng. Mũi tên `▸` nói ô tồn tại mà không đòi ai phải đọc nó.

---

## Trạng thái 2 — MỞ RỘNG

```
┌─ Chưng cất ─────────────────────────────────────────────────┐
│  … (ba khối trên giữ nguyên) …                              │
│                                                             │
│  ▾ Chỉ dẫn thêm (tuỳ chọn)                                  │
│    ┌───────────────────────────────────────────────────┐    │
│    │ Viết cho lập trình viên: ưu tiên chi tiết kỹ      │    │  ← textarea, 3 dòng
│    │ thuật, đánh đổi và con số đo được…                │    │
│    │                                                   │    │
│    └───────────────────────────────────────────────────┘    │
│    [Tóm cho dev] [Tập trung rủi ro] [So sánh thực tiễn VN]   │  ← CHIPS, dẫn xuất API
│                                        còn 371 ký tự         │  ← đếm ngược
│                                                             │
│    Chỉ dẫn KHÔNG đổi được khung mục hay hạng tin cậy.       │  ← một dòng, cỡ nano
│                                                             │
│                          [ Đóng ]  [ Gửi đi chưng cất ]     │
└─────────────────────────────────────────────────────────────┘
```

**Chips bấm-là-điền, KHÔNG bấm-là-gửi.** Chip đổ chữ vào textarea rồi để con
trỏ ở cuối — người sửa tiếp được. Chip gửi thẳng là một nút làm hai việc, và
người bấm nhầm không có đường lùi.

**Đếm NGƯỢC ("còn 371"), không đếm xuôi ("129/500").** Câu hỏi của người đang
gõ là *"tôi còn bao nhiêu chỗ"*, không phải *"tôi đã gõ bao nhiêu"*.

**Câu một dòng ở cuối là câu THẬT, không phải trấn an.** `_dung_nhap` gán cứng
bậc thấp nhất (`M12-R2`), `_than_theo_khung` dựng lại thân theo khung, và
`verify.py` đối chiếu quote với nguồn. Nói ra để người không phí một lần gọi
vào một yêu cầu chắc chắn bị bỏ.

---

## Trạng thái 3 — QUÁ TRẦN

```
│  ▾ Chỉ dẫn thêm (tuỳ chọn)                                  │
│    ┌───────────────────────────────────────────────────┐    │
│    │ …(chữ người gõ, GIỮ NGUYÊN — không cắt)…          │    │  ← viền đỏ
│    └───────────────────────────────────────────────────┘    │
│    [Tóm cho dev] [Tập trung rủi ro] [So sánh thực tiễn VN]   │
│                                       vượt 87 ký tự          │  ← đỏ
│                                                             │
│    ⚠ `chi_dan` dài 587 ký tự, trần 500. Rút gọn rồi gửi     │  ← NGUYÊN VĂN 422
│      lại — máy KHÔNG cắt hộ, vì một câu bị cắt giữa chừng    │
│      đổi nghĩa của chính nó.                                │
│                                                             │
│                          [ Đóng ]  [ Gửi đi chưng cất ]     │  ← nút KHÔNG disable
└─────────────────────────────────────────────────────────────┘
```

**Chữ người gõ giữ nguyên, không cắt.** Máy cắt hộ thì người gửi đi một yêu
cầu khác thứ mình viết mà không biết — đó là lý do server trả 422 thay vì cắt.

**Nút Gửi KHÔNG disable.** Nút xám không nói vì sao nó xám; người bấm vào chỗ
trống rồi đoán. Để nút sống, bấm thì hiện đúng câu 422 của server — người đọc
được một câu thay vì đối diện một nút chết.

**Câu lỗi là NGUYÊN VĂN từ server**, không phải bản FE viết lại. Hai bản của
một lời là hai chỗ để lệch, và bản FE sẽ nói câu cũ sau lần server đổi trần.

---

## Ràng buộc kế thừa — đã kiểm, giữ nguyên

| | |
|---|---|
| `CANH_BAO_CC` (`T03-106`) | nguyên văn, nguyên vị trí |
| optgroup Nhà cung cấp / Model | giữ; chỉ dẫn nằm DƯỚI, không chen giữa |
| popup gọn | trạng thái 1 dài hơn hôm nay đúng **một dòng** |
| `FR-022` | không `prompt()`/`confirm()` — mọi thứ trong `<dialog>` |

## Ngân sách byte — đo TRƯỚC khi code

`gn.js` 84 073/102 400 (dư 18 KB sau `WO-057`) · `gn.css` 102 378/102 400
(**dư 22 byte**).

⇒ CSS của ô này đi vào **chunk `cctab`** (`trCss()`/`KHOI_CSS` đã có sẵn ở
đó), KHÔNG vào `prototype.css`. Một luật chỉ dùng trong một hộp thoại mà nằm
trong bundle chung thì mọi độc giả tải nó.

## Ba câu hỏi cần chủ dự án quyết cùng lúc duyệt

1. **Nhớ chỉ dẫn gần nhất theo tab** (task nêu, `sessionStorage`): nhớ rồi
   **điền sẵn** vào ô, hay chỉ nhớ để hiện một chip "dùng lại chỉ dẫn trước"?
   Điền sẵn tiện hơn nhưng lặng lẽ đổi kết quả của lần chưng cất sau.
2. **Chip preset thứ tư** — có muốn thêm "giữ nguyên giọng tài liệu gốc" không?
   Thêm một dòng vào `chi-dan-mau.json` là xong, 0 dòng mã.
3. **Dòng meta ở cửa sổ kết quả** hiện chỉ dẫn ĐẦY ĐỦ hay cắt còn ~60 ký tự
   kèm rê-chuột-xem-đủ?

---

**CHƯA DUYỆT ⇒ CHƯA CODE.** Bước 2 chỉ bắt đầu sau khi mốc duyệt vào worklog.
