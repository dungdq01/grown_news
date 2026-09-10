# SCR-21 · Menu "Tải xuống" đợt hai — wireframe

> `T03-121` bước 1. **Trạng thái: ĐÃ DUYỆT — chủ dự án, 2026-09-06.**
> Ba câu cuối đã chốt, xem §Chốt. Bước 2 (mã) được phép chạy.

## Chống conflict — khai ngay đầu, không để cuối

`T03-121` chạm **cùng hai file** với `T03-117` · `T03-119` · `T03-120`:
`multiwindow.inline.ts` và `cctab.inline.ts`.

**CHẶN CỨNG: cùng MỘT dev, nối lượt `117 → 119 → 120 → 121`.** Không worktree
song song cho bốn cái này — nhánh bảo vệ *lịch sử*, worktree mới bảo vệ *thư
mục*, mà bốn đơn vị này còn tranh nhau **cùng vài chục dòng**, nên cả hai đều
không cứu được.

`T12-26` (backend tải video theo chất lượng) **chạy song song vô hại** — đất
khác hẳn: `chungcat/` + một cửa API mới. Nó là *phụ thuộc* của mục 4 dưới đây,
không phải *đối thủ ghi*.

Tình trạng lượt: 117 ✔ · 119 ✔ · 120 ✔ · **121 = đơn vị này**.

---

## Mục 1 — menu NEO ĐÚNG NÚT, nền ĐẶC

### Lỗi hôm nay

`.tx-ds` khai `position:absolute` nhưng **cha gần nhất có `position`** không
chắc là `<details class="tx">`: khi thanh chân được vẽ lại, có ca `details`
chưa nhận luật `position:relative` (nó đến từ CSS **tiêm**, không từ
`prototype.css`) ⇒ neo trèo lên tổ tiên xa hơn ⇒ **menu bung ra giữa màn và đè
lên chữ**. Nền cũng không đặc, nên chữ dưới lòi qua.

```
HÔM NAY (sai)                          PHẢI THÀNH
┌─ cửa sổ ────────────────┐            ┌─ cửa sổ ────────────────┐
│ … thân bài … ┌────────┐ │            │ … thân bài …            │
│ … chữ bị đè  │Markdown│ │            │                         │
│ … lòi qua nề │Văn bản │ │            │              ┌────────┐ │
│              │Word    │ │            │              │Markdown│ │
├──────────────└────────┘─┤            │              │Văn bản │ │
│ […] [⬇ Tải xuống]       │            ├──────────────└────────┘─┤
└─────────────────────────┘            │ […] [⬇ Tải xuống ▾]     │
                                       └─────────────────────────┘
                                        neo vào ĐÁY nút, mở LÊN
```

### Sửa

- `position:relative` cho `details.tx` **đặt ở nơi không thể vắng** — cùng khối
  với `.tx-ds`, và cổng đo **toạ độ thật trong DOM**, không đo chuỗi CSS.
- nền `var(--card)` **đặc** + `box-shadow` + `z-index` trên lớp cửa sổ.
- **AC1 đo được:** `menu.getBoundingClientRect().right` cách
  `nút.getBoundingClientRect().right` **≤ 2px**, và `menu.bottom ≤ nút.top`.
  Đo hình học, không đo chữ — chữ CSS đúng mà neo sai vẫn là menu sai.

---

## Mục 2 — hết chữ "File gốc" mù mờ

### Vì sao nó mù mờ

`goc` là **một khoá kỹ thuật**, không phải một thứ người cầm được. Người bấm
*File gốc* trên một bản ghi tài liệu không biết mình sắp tải **2.8 MB PDF** hay
**210 MB MP4** — và trên mạng yếu, khác biệt ấy là khác biệt giữa "tải" và
"hỏng cả buổi".

### Nhãn dựng từ dữ liệu THẬT

`media[]` đã mang đủ: `mime` · `ten_goc` · `so_byte` (đo được trên bản ghi
thật hôm nay). Bảng `mime → tên người đọc` bổ sung vào `xuat-dang.json`, cùng
một nguồn khai với phần còn lại.

```
┌──────────────────────────────┐
│  Markdown           .md      │
│  Văn bản thuần      .txt     │
│  Word               .docx    │
│  PDF (in…)                   │
│ ──────────────────────────── │
│  PDF (.pdf) · 2.8 MB         │  ← thay "File gốc"
└──────────────────────────────┘
```

Không có `so_byte` (bản ghi văn bản thuần, `goc` = chính file `.md`) ⇒ nhãn là
`Nguyên file (.md, có frontmatter)` — nói đúng **cái khác biệt với `md`**, vì
đó là câu hỏi duy nhất người có ở chỗ ấy.

### Hộp thoại xác nhận — cho MỌI bản gốc nhị phân

```
        ┌──────────────────────────────────────────┐
        │  Tải bản gốc                             │
        │                                          │
        │  PDF · 2.8 MB · bao-cao-chi-phi.pdf      │
        │  Tải về máy bạn, không qua kho.          │
        │                                          │
        │              [ Huỷ ]  [ Tải 2.8 MB ]     │
        └──────────────────────────────────────────┘
```

- `<dialog>` của sản phẩm, **không** `confirm()` — `FR-022`.
- **Huỷ ⇒ 0 request.** Đây là AC đo bằng `performance.getEntriesByType`, không
  bằng mắt: một hộp thoại hỏi xong mà request đã bay rồi là một hộp thoại trang
  trí.
- **Hỏi cho MỌI bản gốc nhị phân** (chủ dự án chốt — xem §Chốt). Không có
  ngưỡng byte: một cửa hỏi-đôi-khi là một cửa người không đoán được, và cái
  giá phải trả cho việc hỏi luôn là một cú bấm, còn cái giá của việc **không**
  hỏi là 210 MB trên mạng 3G.
- **KHÔNG hỏi** cho các dạng dẫn xuất (`md` · `txt` · `docx` · `in`): chúng
  dựng từ chữ, luôn nhỏ, và hỏi ở đó mới đúng là dạy người bấm *Đồng ý* mà
  không đọc — rồi họ bấm quen tay khi tới lượt file 210 MB.

---

## Mục 3 — màn video: menu BA NHÓM

Một bản ghi video có tới ba sản phẩm khác nhau, và gộp chúng vào một danh sách
phẳng thì `.txt` của transcript đứng cạnh `.docx` của bản chưng cất mà không ai
biết cái nào là cái nào.

```
┌────────────────────────────────────┐
│ VIDEO                              │
│   Xem trên nguồn ↗                 │
│   Tải về (480p)      ⟨mục 4⟩       │
│ ────────────────────────────────── │
│ TRANSCRIPT                         │
│   Phụ đề            .srt           │
│   Văn bản thuần     .txt           │
│ ────────────────────────────────── │
│ BẢN CHƯNG CẤT                      │
│   ⌁ chưa sinh — Chưng cất ngay →   │  ← MỜ, nhưng bấm được
└────────────────────────────────────┘
```

**Sản phẩm chưa sinh thì MỜ + nói "chưa sinh" + dẫn tới nút sinh.** Ba lối và
vì sao hai lối kia sai:

| Lối | Hỏng ở đâu |
|---|---|
| **giấu** | người không biết chức năng tồn tại — và họ đi hỏi thay vì đi bấm |
| **mục chết** (bấm không ra gì) | tệ nhất: màn hứa một thứ nó không giao |
| **mờ + chỉ đường** ✔ | nói đủ *có thứ này · chưa có · lấy ở đâu* |

---

## Mục 4 — hàng CHẤT LƯỢNG (chỉ video URL)

```
│ VIDEO                              │
│   Xem trên nguồn ↗                 │
│   Tải về:  [360][480][720][1080][gốc]
│                  ↑ bấm → job T12-26
```

- **Chỉ video URL.** MP4 người tải lên chỉ có **một bản gốc** — bày `480p` cho
  nó là hứa một bậc không tồn tại, và dựng bậc ấy nghĩa là transcode: tốn CPU,
  mất chất lượng, và ra một file **không phải** thứ người đã nạp.
- Bậc là **thật**: host giữ sẵn các bậc, `yt-dlp -f` chọn bậc **lúc tải**.
  Không transcode ở phía ta.
- Bấm một bậc ⇒ mở job `tai-video` (`T12-26`), **theo dõi trong tab Việc** như
  mọi job khác — không có thanh tiến trình riêng cho menu này.
- Xong ⇒ mục `Tải về (480p)` **sáng lên**, trỏ file trong thư mục tạm.
- Bậc đã có file ⇒ hiện luôn dạng sáng, không mở job lần hai.

---

## Chỗ CSS sống

Vẫn `TX_CSS` (tiêm từ chunk). `gn.css` sau `FR-068` ở **102 613 / 104 448** —
dư 1 835 byte, nhưng menu ba nhóm + hộp thoại là **luật của cửa sổ đọc**, nên
nó không có việc gì trong bundle chung.

---

## Bốn AC đo được — nêu trước để bạn soi

1. **neo**: `right` lệch ≤ 2px, `bottom ≤ nút.top` — đo `getBoundingClientRect`
2. **nhãn**: 0 chuỗi `File gốc` còn trong DOM; nhãn khớp `mime`+`so_byte` thật
3. **huỷ = 0 request**: đếm `performance.getEntriesByType("resource")` trước/sau
4. **mục chưa sinh**: có thuộc tính mờ **và** có `href` dẫn tới nút sinh —
   không mục nào vừa mờ vừa chết

---

## Chốt — chủ dự án, 2026-09-06

1. **Hỏi cho MỌI bản gốc nhị phân.** Không ngưỡng byte. (Dạng dẫn xuất vẫn
   không hỏi — xem mục 2.)
2. **Bày cả 5 bậc** 360 · 480 · 720 · 1080 · gốc. Hàng dài hơn, nhưng người
   chọn 360 vì mạng yếu là đúng người cần bậc ấy nhất, và giấu nó đi để tiết
   kiệm một dòng là bỏ rơi đúng ca khó nhất.
3. **72 giờ**, không 24. `tran_xuat_tam_gio` trong `chungcat/assets/nguong.json`
   đổi theo — một con số, một chỗ.

**Đã duyệt ⇒ được code.** Điều kiện `AC0` của `T03-121` đã thoả.
