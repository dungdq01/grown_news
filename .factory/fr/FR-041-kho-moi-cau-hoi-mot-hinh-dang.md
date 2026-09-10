# FR-041 — Màn Kho: mỗi câu hỏi một hình dạng, chuyển động một nhịp

mở_bởi: người dùng, 2026-08-29 (WO-036 — *"các biểu đồ đang cùng 1 form quá…
  visualize đủ hấp dẫn để mời gọi khách hàng, thêm animation siêu việt"*)
tới: `project_map.yaml` ui_frozen v1.17 (trình bày màn Kho do FR-027i/k + FR-031 ký)
mức: đổi CÁCH VẼ 5/8 vùng của màn Kho. KHÔNG đổi dữ liệu, không đổi mốc `id`,
  không đổi thứ tự mục (spec M03 §2.3 giữ nguyên — KPI → Chờ duyệt → biểu đồ).
trạng_thái: **DUYỆT** 2026-08-29 — người dùng yêu cầu trực tiếp kèm 3 ảnh và gọi
  `/factory:go /factory:m-uiux /design:design-review`.

## Vì sao FR — lật cái gì

FR-027i chọn "thanh chia đoạn thay ô số", FR-031 chọn "cột dọc · thanh chia
đoạn · hàng" cho ba pane Dòng chảy. Từng lựa chọn đúng lúc đứng riêng — nhưng
cộng lại, màn có **bar ngang ×3 + thanh chia đoạn ×3** cho 7 bộ dữ liệu. Nguyên
tắc FR-031 tự đề ("mỗi góc nhìn một hình dạng") bị chính các lần vá sau làm mòn.
FR này áp nguyên tắc đó cho CẢ màn, nên phải lật một phần hai FR kia.

## Bản đồ hình dạng mới — wireframe

```
┌─ KHO · toàn cảnh ─────────────────────────────────────────────┐
│  [khối 3D — giữ]  [dải máy]           BẢN GHI · KHÔNG ĐỌC ĐƯỢC │
│                                                                │
│   ◐ VÒNG DONUT (svg)        hàng KPI (giữ) · thùng rác (giữ)  │
│   tâm: tổng, đếm 0→n                                           │
├─ PHÂN TÍCH KHO · ba góc nhìn ─────────────────────────────────┤
│  THEO LOẠI NGUỒN      THEO TIN CẬY          TRẠNG THÁI DUYỆT   │
│  ▦▦▦▦▦ lưới ô        ▔▔▔▔▔▔▔▔ bậc thang    (draft)→(approved) │
│  mỗi ô = 1 bài        4 bậc, rộng ∝ tỉ lệ   vòng đời, node     │
│  màu theo loại        thứ tự = thang đo      + connector       │
├─ DÒNG CHẢY KHO · 3 pane tự chuyển ────────────────────────────┤
│  theo tháng: ĐƯỜNG VÙNG (svg, vẽ dần)                          │
│  theo nguồn: thanh chia đoạn (GIỮ — giờ là duy nhất trên màn)  │
│  theo ưu tiên: bar ngang (GIỮ — duy nhất trên màn)             │
└────────────────────────────────────────────────────────────────┘
```

8 hình dạng, mỗi hình đúng MỘT lần: 3D · donut · lưới ô · bậc thang · vòng đời
· đường vùng · thanh chia đoạn · bar ngang.

## Vì sao từng hình — không phải trang trí

| Vùng | Dữ liệu là gì | Hình | Vì sao đúng bản chất |
|---|---|---|---|
| kpi2 | 3 phần của MỘT tổng + tổng là con số chính | donut, tâm là tổng | phần-của-tổng đọc bằng góc; tổng đứng giữa đúng vai chính |
| bars2 | đếm theo loại, kho nhỏ | lưới ô, 1 ô = 1 bài | ở n nhỏ, ĐẾM Ô thật hơn so chiều dài; màu theo `--c-<loại>` sẵn có |
| bars3 | enum CÓ THỨ TỰ (thang tin cậy) | bậc thang căn giữa | thứ tự là của THANG ĐO, không của dữ liệu — bậc giữ thứ tự, rộng mang tỉ lệ |
| bars4 | vòng đời có bảng chuyển | chuỗi node + mũi tên | nó LÀ một vòng đời; bar ngang giấu chính điều đó |
| kf-thang | chuỗi thời gian | đường vùng SVG | xu hướng đọc bằng ĐƯỜNG; cột chỉ hơn khi so từng tháng lẻ |
| kf-nguon · kf-uutien | như cũ | giữ | mỗi hình còn lại giờ xuất hiện đúng một lần |

## Chuyển động — luật giữ nguyên từ FR-027i

Chạy **MỘT NHỊP khi vùng vào tầm nhìn**, không vòng lặp: dashboard là ảnh chụp,
hiệu ứng "đang xử lý" trên trang tĩnh là nói sai về hệ thống. Cụ thể: donut
quét cung (dashoffset) + tâm đếm 0→n; ô lưới hiện so le; bậc nở từ 0; node
vòng đời nảy + connector vẽ; đường vùng vẽ dần. Tất cả qua máy reveal sẵn có
của `home-motion` (cờ `reduced` + chống chạy lại `__s`), KHÔNG thêm vòng rAF mới.

## Răng

- **AC-1** (hard) markup 5 vùng đổi hình đúng khai trên; mỗi hình một lần
  `cmd: node web/test/kho-hinh-dang.test.js`
- **AC-2** (hard) mọi chuyển động mới có chốt reduced-motion; không vòng lặp mới;
  không `backdrop-filter` mới; không hex trong markup
  `cmd: node web/test/kho-hinh-dang.test.js`
- **AC-3** (hard) `bars4` vẫn đọc `TRANG_THAI` từ schema; đủ 4 nhãn trên trang
  `cmd: node web/test/bon-trang-thai.test.js`
- **AC-4** (hard) các cổng cũ của màn không đỏ oan sau đổi
  `cmd: cd web && npm test`

## Lượt 2 — 2026-08-29, chỉ đạo mới của người dùng (đè một phần lượt 1)

> *"bỏ thống kê phân tích theo tin cậy và theo ưu tiên đi. chúng ta cần:
> 1 thời gian (ngày/tháng) · 2 phân loại (bài viết, tài liệu, video) ·
> 3 loại nguồn (pdf, youtube, repo…) · 4 trạng thái"*

Bốn tổng hợp — và CHỈ bốn:

| # | Tổng hợp | Vùng · hình |
|---|---|---|
| 1 | thời gian | Dòng chảy: **theo ngày** (cột dọc, MỚI `kf-ngay`) · **theo tháng** (đường vùng, giữ) |
| 2 | phân loại (3 mảng nội dung) | `kf-nhom` (MỚI, thế chỗ pane tin cậy) — bar ngang, đọc `BANG_MODULE` từ `loai-nguon.json` |
| 3 | loại nguồn (source_type) | lưới ô — giữ |
| 4 | trạng thái | donut (lên site · chưa lên · đã loại) + vòng đời (draft·approved·edited·rejected) — giữ |

**RỜI MÀN**: pane tin cậy (`bars3`) · pane ưu tiên (`kf-uutien`) · pane nguồn
gốc origin (`kf-nguon` — không nằm trong bốn tổng hợp người dùng chốt).

**Kéo theo spec FROZEN**: `M03_web/spec.md` §pane chất lượng khai *"Ba pane
đứng trên phanTich: mball · kf-uutien · bars3"* — còn MỘT (`mball`, màn Tất
cả). AC-2.3c.1 giữ nguyên lời (tính chất vẫn đo được trên `mball`). Spec đã
sửa theo FR này; **CHƯA ký lại FROZEN.lock** vì baseline đang lệch sẵn ở
`frontmatter.schema.json` (việc dở của phiên song song) — ký lúc này là ký hộ.
Việc ký: sau khi phiên kia đóng schema, chạy `check_frozen --ky` một lần cho cả hai.

## KHÔNG mở

- Dữ liệu, cách đếm, nền đếm (`tatCa`/`appr`/`phanTich`) — 0 đổi.
- Mốc `id` các vùng — giữ nguyên (spec M03 trỏ vào chúng, spec không phải sửa).
- `kf-nguon` · `kf-uutien` · khối 3D · hàng KPI · thùng rác — giữ.
- Palette: chỉ token đã audit. Không màu mới.
