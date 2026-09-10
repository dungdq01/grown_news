# s5 — UI/UX · FROZEN v1

> **Đóng ngày 2026-08-18.** Mọi thứ dưới đây là hợp đồng cho s6.
> Đổi bất kỳ giá trị nào ⇒ mở FR, bump version, ghi worklog. Chủ sở hữu drift: PM.

## Bản chạy được

`prototype/app-v20.html` — mở thẳng bằng trình duyệt, không cần build.

Hai mươi bản, mỗi bản sửa một nhóm vấn đề. Bản trước giữ lại để đọc `git diff`.

## Đọc theo thứ tự nào

| Nếu bạn cần | Đọc |
|---|---|
| Giá trị token để code | [`tokens.css`](tokens.css) — **nguồn duy nhất**, import thẳng |
| Hiểu vì sao token là vậy | [`DESIGN.md`](DESIGN.md) |
| Cỡ chữ nào dùng ở đâu | [`TYPOGRAPHY.md`](TYPOGRAPHY.md) — bảng tra 4 nhóm |
| Bố cục màn | [`wireframes/SCR-00-app-shell.md`](wireframes/SCR-00-app-shell.md) |
| Hợp đồng BA MÀN NẠP | [`wireframes/SCR-06-ba-man-nap.md`](wireframes/SCR-06-ba-man-nap.md) — cái gì phải giống nhau, cái gì được khác |
| Shape dữ liệu | [`contracts/analyses.sample.v5.json`](contracts/analyses.sample.v5.json) |
| Màu biểu đồ | [`contracts/chart-palette.json`](contracts/chart-palette.json) |

**`tokens.css` thắng mọi tài liệu khác.** Lệch nhau thì sửa tài liệu, không sửa token.

## Bốn hợp đồng cho s6

### 1 · Token

113 token trong `tokens.css`, chia 6 nhóm: spacing (thang 4px) · type (10 bậc) ·
màu (shadcn map) · radius · chất liệu kính · palette biểu đồ.

Import file này. **Không gõ lại giá trị** — kể cả khi thấy nó chỉ là `16px`.

### 2 · Ba luật chữ

```
1 · Menu: ĐẬM (600) + THẲNG
2 · Header và nội dung CÙNG CỠ — khác nhau ở weight, không ở size
3 · Ghi chú / cảnh báo / lỗi: NGHIÊNG
```

Luật 2 là điểm đặc trưng của sản phẩm này: phân cấp bằng **weight**, chữ gọn.

### 3 · Data contract v3

13 bản ghi phủ edge case thật: gộp 2 bản cùng `url_normalized` · dải cảnh báo ·
badge external · draft và rejected không lên web · **đủ 4 verdict cho M06** ·
**1 ca `priority` dưới ngưỡng** (FR-006).

Khối `_expected_render` là **test của contract** — mọi số tính bằng máy, không gõ tay.

**Ba con số ở ba tầng, đừng nhầm là lệch:**

| Số | Nghĩa |
|---|---|
| **13** | bản ghi trong `kb/` — mỗi file `.md` một bản |
| **12** | dòng ở màn Tất cả — gộp 2 bản STORM cùng nguồn |
| **8** | bài trên site — chỉ `approved`, rồi gộp `url_normalized` |

### 4 · Ba màn + cửa sổ đọc

Trang chủ (4 vùng) · Tất cả · Chờ duyệt · Khái niệm, cộng **multi-window** cho
đọc bài.

Mỗi vùng chỉ hiện mẫu, có nút *xem tất cả* → chuyển màn.

## Đã kiểm bằng máy — không phải lời khai

| Phép kiểm | Kết quả |
|---|---|
| Tương phản WCAG AA (24 cặp đặc + 24 cặp trên kính + 2 hue) | **50/50 pass** |
| Palette biểu đồ (`dataviz/validate_palette.js`) | pass cả light và dark |
| Cỡ chữ gõ tay ngoài thang | **0** |
| Họ chữ | 2 (Inter + JetBrains Mono) |
| Weight ngoài token | 0 |
| Cửa sổ đọc lệch khỏi thang | ≤0.8px (trước 18px) |
| Blur không đồng bộ | 0 — một `--blur-lift` cho mọi bề mặt |
| Guidelines Vercel (a11y, form, motion) | 12 lỗi tìm ra, **12 đã sửa** |
| `node --check` + runtime | pass |

## Bảy lượt bác và điều học được

Ghi lại vì s6 sẽ gặp lại cùng loại sai:

| Lượt | Bị bác vì | Điều học được |
|---|---|---|
| v1 | "xấu dã man" | Thoả đặc tả ≠ đẹp. Wireframe là ràng buộc, không phải thiết kế |
| v2 | lỗi font | Khai tên font mà không cung cấp file ⇒ trình duyệt fallback, mất phân cấp |
| v3 | chưa phân trang | Ảnh tham khảo ghi rõ "2 / 9" mà tôi vẫn dựng cuộn liên tục |
| v5 | "layout cơ bản quá" | Có biến màu nhưng **không có biến spacing** ⇒ gõ tay 9 giá trị cho cùng một vai |
| v6 | "ai bảo đổi nền" | Tự suy diễn ngoài yêu cầu. Bỏ thứ người dùng không bảo bỏ |
| v13 | ảnh mờ | Cắt dải nhỏ rồi phóng 2.7× — vỡ là tất nhiên |
| v19 | chữ vẫn to | Cửa sổ đọc dùng `clamp` tự do, không đi qua token ⇒ lệch khỏi hệ vừa áp |

**Bài học lớn nhất**: mọi thứ đo được thì phải đo. Tương phản, độ nét, cỡ chữ,
số lượng thẻ — tôi phát hiện lỗi bằng script nhiều hơn bằng mắt.

**Bài học thứ hai**: publish mà không chạy `node --check` một lần cho ra trang
trắng. Từ v13 trở đi mọi lần publish đều kiểm cú pháp + runtime trước.

## Nợ chuyển sang s6

| Nợ | Vì sao chưa làm | Ảnh hưởng |
|---|---|---|
| Nội dung 9 mục dùng chung cho mọi bài | Prototype chưa nối `kb/` | Mở 2 cửa sổ thấy nội dung giống nhau |
| Ảnh gốc 1308px, phóng 1.47× | Cần ảnh ≥1920px | Chưa nét hoàn toàn ở màn 2560px |
| Chưa có Dialog / Toast / Command palette | Chưa module nào cần | Thêm khi s6 cần |
| Chưa test Safari / Firefox | Chưa có môi trường | `backdrop-filter` + `container-query` cần kiểm |
| Prototype dựng vanilla, chưa port Quartz | Cần lặp nhanh — 20 bản một phiên | s6 quyết: port hay giữ vanilla (`gap-quartz`) |

## Điều kiện đóng G5 — đối chiếu

| Yêu cầu của bước | Trạng thái |
|---|---|
| Mọi flow P0 click được trên data sample | ✅ F3 publish — 4 màn + multi-window |
| Contracts có version | ✅ `analyses.sample.v2.json`, `chart-palette.json` |
| `ui_kit` đủ cho module đầu tiên bắt đầu | ✅ `tokens.css` 113 token + 3 luật chữ |
| `project_map` cập nhật screens | ✅ v3, có khối `ui_frozen` |

---

## Một câu cho s6

> Import `tokens.css`. Đọc `TYPOGRAPHY.md` khi cần cỡ chữ. Mọi thứ khác trong
> thư mục này là *giải thích*, không phải *nguồn*.

---

# Đợt hai — 2026-09-02 · bộ s5 chờ duyệt (CHƯA frozen)

| Nếu bạn cần | Đọc |
|---|---|
| cái gì xuất hiện ở đâu, dạng gì | [`ma-tran-module-man.md`](ma-tran-module-man.md) — ma trận surface×năng lực, TÀI LIỆU TRUNG TÂM |
| bảng tra component + luật hai mặt | [`ui_kit.md`](ui_kit.md) |
| bố cục từng bề mặt + 3 state | `wireframes/SCR-12..17` (SCR-07..11 là SUPERSEDED) |
| shape dữ liệu đợt hai | `contracts/{chungcat,truyhoi,chatbot,kenh,artifact}.sample.v2.json` |
| bản click được | `prototype/dot-hai/index.html` — mở thẳng, sinh bởi `prototype/sinh_dot_hai.py` từ contracts |
| quyết định nền | `FR-046` (nháp lưu DB) · `memory/decisions.md` 2026-09-02 · khảo sát `01_research/ui-embed-matrix-scan.md` |

Đóng G5 đợt hai: NGƯỜI duyệt prototype + ma trận ⇒ frozen v2 ⇒ port từng module
vào web lần lượt (nút vào bảng khai CÙNG LÚC với lần dựng API thật).

