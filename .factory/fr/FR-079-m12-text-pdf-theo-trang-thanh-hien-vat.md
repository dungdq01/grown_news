# FR-079 — M12: trích text PDF THEO TRANG thành hiện vật `text/plain` dẫn xuất — neo `slug:p.N` thật

- **mở**: 2026-09-09 · **người mở**: claude (PM M13) · **người quyết**: chủ dự án — *"chốt cả 4"* (duyệt mở) · **trạng thái**: **ĐÃ DUYỆT MỞ** · **thi công**: **SAU khi M13 chạy một đường** (thứ tự research M13 §9), team M12
- **artifact FROZEN chạm**: `06_modules/M12_chungcat/spec.md` (§1 Vào · AC-3.x định vị quote · loại việc)
- **artifact khác chạm**: `chungcat/src/worker.py` (`_doc_nguon` :109-141 · `_nap_hien_vat` :936) · `model_flow.md` · `data_flow.md` · `chungcat/assets/model.json` (`thu_vien_pdf` đã khai) · `core/assets/xuat-dang.json` (nếu muốn cửa xuất `.txt` cho PDF)
- **nguồn**: `FR-072 §5` (*"tài liệu PDF vẫn mù với RAG — nợ của M12"*) · `FR-054` (khuôn hiện vật dẫn xuất `la_dan_xuat=1`, `kieu_moc`) · `01_research/m13-truy-hoi-dich-vu-nen.md §5.4`
- **phụ thuộc**: không có về mã. Về thứ tự: M13 `T13-7` xong trước để có người tiêu thụ đo được

## 0 · Vì sao phải FR — đo 2026-09-09

```
chungcat/src/worker.py:141    _doc_nguon(slug) → [{"neo": f"{slug}:p.1", "text": than}]
                               ⇒ MỌI tài liệu: một khối, neo p.1 GIẢ, text = `than` (ghi chú ≤400 từ),
                                  KHÔNG phải nội dung PDF
chungcat/src/worker.py:1213   pdfplumber chỉ dùng gián tiếp (pypdfium2) để sinh THUMBNAIL trang 1
grep pdfplumber chungcat/src   0 lần trích text (pyproject.toml khai dep — khai mà không dùng)
kb/_kho.sqlite                2 bản ghi tai_lieu — cả hai vô hình với truy hồi và với chưng cất thật
dia-chi.json  dạng slug-trang  "media là PDF ∧ trang ≤ số trang thật" — dạng có khai, KHÔNG có nguồn nào sinh
```

Hậu quả **kép**, và cái thứ hai là của chính M12: (1) RAG mù tài liệu; (2) bản
chưng cất một PDF hôm nay trích dẫn `slug:p.1` cho mọi khẳng định — địa chỉ *trông*
phân giải được (`dia-chi.json` chỉ kiểm `trang ≤ số trang`) nhưng **không trỏ vào
đâu**. Cổng `check_dia_chi` xanh oan đúng lớp `#cổng-xanh-vì-neo-sai`.

## 1 · Hình dạng chốt

### 1.1 · Text PDF là HIỆN VẬT DẪN XUẤT, đi cùng đường transcript

| | transcript (FR-054, đã chạy) | text PDF (FR này) |
|---|---|---|
| ai sinh | M12 `sinh-transcript` | M12 — bước đầu của `chung-cat-mot-nguon` khi nguyên liệu là PDF, **hoặc** loại việc riêng `trich-text-pdf` (s7 M12 quyết; đề nghị: bước đầu, để một PDF không cần hai job) |
| mime | `text/vtt` | `text/plain` |
| `la_dan_xuat` | 1 | 1 |
| `kieu_moc` | `t=` (mốc giờ) | `p.N` (trang) — **đã có dạng `slug-trang`** trong `dia-chi.json` |
| vào kho qua | `_nap_hien_vat(byte, "text/vtt", ten_goc)` → `POST /api/nhap-chung-cat`/media của LÕI | **cùng hàm**, `"text/plain"` |
| thư viện | ASR | `pdfplumber` (MIT — `model.json thu_vien_pdf` đã khai, `check_bang_khai_model` đã canh giấy phép) |

Định dạng text: mỗi trang một khối, mở đầu bằng một dòng đánh dấu trang máy đọc
được (vd `\f` hoặc `## p.N`) — để `_doc_nguon` và M13 cùng tách trang bằng **một**
luật. Luật đó khai trong `chungcat/assets/` (bảng khai), không gõ hai nơi.

### 1.2 · `_doc_nguon` đọc hiện vật text thay `than`

Với bản ghi `tai-lieu` có hiện vật `text/plain` dẫn xuất: `_doc_nguon` trả
**N khối, neo `slug:p.N` thật**. Không có hiện vật ⇒ **từ chối chưng cất** với lý
do máy nêu (*"PDF chưa trích text"*), **không** rơi về `than` + `p.1` giả — rơi về
là giữ nguyên bug hôm nay dưới một cái tên khác.

### 1.3 · M13 thấy nó qua cùng cửa — 0 dòng mã mới

`T13-7` đọc hiện vật văn bản qua `GET /api/articles/media/<sha>`; `text/plain` với
dấu trang ⇒ chunk theo trang, neo `slug:p.N`, `nguon_van_ban = hien-vat:text/plain`
(FR-072 §1.3 đã khai dòng `.md/.txt`). Không đổi hợp đồng M13.

## 2 · Ràng buộc KHÔNG được nới

1. M12 **không** ghi kho trực tiếp — vẫn qua cửa LÕI (M12-R1/Z5).
2. Byte PDF **không** rời máy vì bước này — trích text là **local**, 0 egress; chỉ
   text đã trích mới đi vào lời gọi model như hôm nay (`AC-4.x` log sha256 giữ).
3. Không đổi trần 32 MB / 600 trang (backlog M12 mục 5 — đã có cổng riêng).
4. `PyMuPDF` vẫn cấm (backlog M12 mục 6, giấy phép AGPL).

## 3 · Cổng — đỏ được

| # | bắt gì | đỏ khi |
|---|---|---|
| P1 | chưng cất PDF ⇒ hiện vật `text/plain` `la_dan_xuat=1` xuất hiện trong `media` của bản ghi, số khối trang = số trang thật (`pypdfium2` đếm) | thiếu hiện vật, hoặc số trang lệch |
| P2 | `_doc_nguon` trên PDF trả neo `p.N` với N > 1 khi PDF > 1 trang; **0** neo `p.1` cho khẳng định lấy từ trang khác | mọi neo đều `p.1` |
| P3 | PDF chưa có text ⇒ job từ chối có lý do, không chưng cất trên `than` | job thành công với `p.1` giả |
| P4 | dấu trang đọc từ **một** bảng khai; grep literal dấu trang trong `chungcat/src` + `truyhoi/src` ⇒ 0 | hai chỗ gõ tay |

## 4 · Điều FR này KHÔNG làm — và nợ để hở có tên

- **Không** OCR PDF scan — `pdfplumber` chỉ lấy text layer. PDF không có text layer
  ⇒ P3 từ chối, và đó là **nợ mới có tên** (OCR = egress hay local? — quyết sau).
- **Không** đổi `dia-chi.json` — dạng `slug-trang` đã có.
- **Không** đụng `.docx`/`.pptx` — `loai-nguon` có `docx/pptx` nhưng chưa có thư viện
  khai trong `model.json`; mở FR riêng khi cần.
- **Không** ký `FROZEN.lock` — người ký sau khi áp.
