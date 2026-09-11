# WO-100 — Indexer M13 NUỐT file nhị phân của cửa xuất; panel tìm hiện `%PDF-1.5`

- **mở**: 2026-09-11 · **người mở**: dev M13 · **loại**: **bug** · **mức**: `hard`
- **module**: `M13_truyhoi` · **đơn vị gây ra**: `T13-2` (indexer) · **lộ ra**: chủ dự án THỬ TAY trên panel tìm (`T03-125`), không cổng nào bắt
- **người báo**: chủ dự án, ảnh màn hình `localhost:8890/tat-ca/?tim=her`

## 1 · Triệu chứng — người dùng thấy trước máy

Gõ `her` vào ô tìm ⇒ panel hiện một dòng kết quả là **byte nhị phân**:

```
xgboost-stap-by-step · tai-lieu
����F�.��e��kgg�…��7F�6lp��Her��J���F�QsW/��…
tai-lieu/xgboost-stap-by-step.md:1-9739
```

Truy vấn `her` khớp vì trong 2.9 MB byte PDF có chuỗi `Her`. Tức chỉ mục đang chứa
**cả một file PDF** dưới dạng một chunk 9739 dòng, đeo nhãn `nguon_van_ban: than`.

## 2 · Nguyên nhân — LÕI đúng, M13 sai (lần thứ hai, cùng lớp với `WO-099`)

`indexer.lay_bai_va_goc` gọi `GET /api/xuat/<loai>/<slug>?dang=goc` và giả định nó
luôn trả `.md`. Với bản ghi có **hiện vật nhị phân** (`tai-lieu`: pdf · docx · pptx),
cửa xuất **302 sang cửa media** và trả **đúng byte đã nạp** — đó là hợp đồng ĐÃ KHAI:

```
core/assets/xuat-dang.json · dang.goc.$la:
  "Với bản ghi VĂN BẢN: nguyên file .md như trên đĩa, CÓ frontmatter.
   Với bản ghi có HIỆN VẬT nhị phân: đúng byte đã nạp, trả qua cửa media —
   không chuyển đổi."
```

Đo 2026-09-11 trên kho thật:

```
curl -sL "/api/xuat/tai-lieu/xgboost-stap-by-step?dang=goc"
  → 302 → /api/articles/media/6714ee19…  ·  application/pdf  ·  2 976 936 byte  ·  %PDF-1.5
```

`urllib` **tự theo redirect**, nên M13 nhận PDF, `decode("utf-8", errors="replace")`
rồi chunk theo dòng. `content-type` có ngay trong phản hồi — M13 không nhìn.

## 3 · Vì sao 21 cổng vẫn xanh

Cùng hình dạng `WO-099` §"vì sao": `_loi_gia.kho_mau()` chỉ có bản ghi mà `goc` trả
`.md`. **Fixture giàu hơn thực tế** — kho thật có 2 bản ghi `tai-lieu` với hiện vật PDF.
Cổng xanh trên một thế giới không tồn tại (`#cổng-xanh-vì-neo-sai`).

Và lần này **chính người dùng** là cổng cuối: không ca test nào gõ một chuỗi khớp
rác nhị phân, nhưng `her` thì có.

## 4 · Sửa — 0 cửa mới, 4 dòng

`lay_bai_va_goc` kiểm `content-type`: chỉ chunk khi mime ∈ `{text/markdown, text/plain,
text/x-markdown}`; ngược lại dùng `body` của `/api/articles` — **đúng nhánh đã có cho 422**.
Danh sách mime hẹp, không đoán bằng `startswith("text/")`.

Trích text PDF là nợ của **M12** (`FR-079`), không phải việc M13 (`FR-072 §5`).

## 5 · Kỳ vọng

1. Không chunk nào chứa byte nhị phân; bản ghi PDF vẫn index được từ `than`.
2. `line_end` ≤ số dòng thật của thân được dùng (`AC-2.3` giữ nguyên).
3. Bản ghi có hiện vật nhị phân **không** vào `hong` — nó index được, chỉ bằng nguồn khác.
4. Cổng bắt được: fixture phải có một bản ghi mà `goc` trả `application/pdf`.

## 6 · Đo được hôm nay

```
chunk `xgboost-stap-by-step`  TRƯỚC: 1 chunk · 9739 dòng · body `%PDF-1.5\n%…`
                              SAU:   1 chunk ·    4 dòng · body `Boosting (tạm dịch: tăng cường)…`
reindex kho thật              16/16 · hong [] · 111 chunk
/api/tim?q=her                TRƯỚC: 1 kết quả rác   SAU: 0 kết quả (đúng — kho không có từ này)
/api/tim?q=skill|hermes|rui ro  3 · 2 · 3 kết quả, địa chỉ phân giải được
```
