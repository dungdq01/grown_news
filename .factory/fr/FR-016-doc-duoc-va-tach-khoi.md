# FR-016 — Đọc được và tách khối: chữ đậm hơn, khối rời nhau, màn Nạp nguồn theo tab

mở_bởi: người dùng, 2026-08-19 — rà bản chạy thật ở `127.0.0.1:8787`
tới: s5 (`05_uiux/` — hợp đồng UI, `ui_frozen`) · s8 (`web/styles/prototype.css`, `shell.html`)
mức: nhịp + màu chữ + bố cục một màn. **Không đổi giá trị token nào.**
trạng_thái: MỞ — thi hành theo yêu cầu trực tiếp

## Vấn đề — sáu điểm người dùng chỉ trên ảnh chụp

1. Panel *"Trong kho"* ở trang chủ **dính** vào khối hai cột ngay trên nó.
2. Chữ nhiều chỗ **mờ**, có chỗ "conflict màu".
3. Màn Kho: bốn số thống kê **đen tuyền như nhau**; và cùng lỗi dính khối như (1).
4. Màn Nạp nguồn ba cột chật, form không nói rõ **từng trường là gì**.
5. Sửa bài chuyển sang màn Nạp nguồn nhưng **cửa sổ đọc che mất form**; không thấy
   nút lưu; nút *"thôi"* không rõ nghĩa.
6. (trùng 2) chữ phụ cần đậm thêm.

## Chẩn đoán

| # | Nguyên nhân thật |
|---|---|
| 1, 3 | `.pn` cách nhau `--s-2xl`, nhưng `.two > .pn` bị đặt `margin-bottom:0` (để hai cột thẳng đáy, L2) và **bản thân `.two` không có margin nào** ⇒ panel kế tiếp dán vào đáy. Màn Kho tệ hơn: cột phải lệch xuống `--s-lg` (nhịp FR-014) nên chạm hẳn panel dưới. |
| 2, 6 | Hai thứ khác nhau. (a) **Lỗi thật của FR-011**: 7 chỗ dùng `--muted` — vốn là token **NỀN** `#F1F1EE` — làm **màu chữ**, nên nhãn form gần như trắng trên trắng. (b) `--ink-3` (`#6B6B74`, 5.14:1) dùng cho hầu hết chữ phụ: đạt AA trên nền đặc, nhưng trên panel kính phủ ảnh phong cảnh thì mắt đọc ra "mờ". |
| 4 | Ba lối xếp ba cột: form 14 trường + textarea 14 dòng nhét vào 1/3 bề ngang. |
| 5 | Cửa sổ đọc nổi trên mọi thứ, không đóng khi chuyển màn. **Và một bug mất dữ liệu**: `guiForm` dựng lại frontmatter TỪ SỐ 0 nên mọi trường ngoài form (`citations_*`, `ingested_at`, 3 trường M1…) bị xoá ⇒ bài `external` trượt validate, hiện 422. |

## Quyết định

**Không đổi giá trị token.** `contrast-audit.json` là hợp đồng frozen, và script
đo 50 cặp × 4 ảnh nền không nằm trong repo (FR-014 §"Đổi thì" khai điều này) —
đổi số màu là tự bịa một bằng chứng không kiểm được.

Thay vào đó **dùng token có sẵn, đậm hơn**: `--ink-2` (`#3A3A42`) đã có trong
audit với tỉ lệ **10.98:1** so với 5.14:1 của `--ink-3`. Đổi 43 chỗ `--ink-3` →
`--ink-2` là đi **từ một cặp đã validate sang một cặp đã validate khác, tốt hơn**
— audit vẫn đúng nguyên văn, không phải đo lại. Giữ `--ink-3` cho `::placeholder`
(gợi ý thì nên mờ hơn nội dung).

Bảy chỗ `color:var(--muted)` là **lỗi**, không phải lựa chọn — sửa thẳng.

## Phạm vi

| Được | KHÔNG được |
|---|---|
| Đổi token nào dùng ở đâu (`--ink-3` → `--ink-2`) | Đổi **giá trị** token trong `tokens.css` |
| `.two` có `margin-bottom` đúng nhịp panel | Đổi thang `--s-*` |
| Số KPI mang màu trạng thái (`--success`/`--warning`/`--destructive`) | Thêm màu mới ngoài token trạng thái đang dùng |
| Màn Nạp nguồn: 3 cột → 3 tab, mô tả từng trường | Đổi luồng nạp (vẫn 3 lối, vẫn kết ở `draft`) |
| Đóng cửa sổ đọc khi bấm Sửa; đổi tên nút | Đổi hợp đồng API |

Số 0 **không** tô màu trạng thái (`.kp.trong`): "0 bài bị loại" tô đỏ là báo động giả.

## Thi hành

| Chỗ | Đổi |
|---|---|
| `web/styles/prototype.css` | 7 `--muted`→`--ink-2` (lỗi) · 43 `--ink-3`→`--ink-2` · `.two` margin · `.kp.ok/.warn/.bad/.tong/.trong` · `.np-tabs`/`.np-tab`/`.np-p`/`.np-lead` |
| `web/plugins/home-pages/shell.html` | v-nap dựng lại theo tab; mỗi trường form có mô tả + đánh dấu bắt buộc |
| `web/plugins/home-pages/index.ts` | KPI mang class trạng thái (2 chỗ) · **cắt comment HTML lúc phát** (2.3 KB × mọi trang) |
| `web/plugins/multiwindow/.../multiwindow.inline.ts` | `FM_GOC` giữ frontmatter gốc (sửa bug mất dữ liệu) · `dong(id)` trước khi sang màn sửa · `moTabNap()` · `datLaiForm()` · nhãn nút theo chế độ |
| `web/test/page-weight.test.js` | ngưỡng 40 → **48 KB**, kèm lý do: shell nay mang SCR-04; tripwire vẫn cách xa mức 86 KB của lỗi nó sinh ra để bắt |
| `project_map.yaml` | `ui_frozen.amended_at` + ghi chú FR-016 |

## Đổi thì

Muốn đậm hơn nữa `--ink-2` thì phải **đổi giá trị token** ⇒ FR khác, và FR đó
phải kèm script đo lại 50 cặp — không có script thì không có bằng chứng.
