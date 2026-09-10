# FR-056 — `core/assets/man-hinh.json` về chủ M03_web

- **mở**: 2026-09-03 · **người mở**: claude (PM) · **trạng thái**: **ĐÃ DUYỆT** 2026-09-03 (chủ dự án: "tôi duyệt") — map v28 đã áp
- **artifact chạm**: `project_map.yaml` (boundary `M03_web.fe`)
- **mở khoá**: check_g6b hết 3 FAIL boundary (T03-90 · T03-93 · T03-94); mọi
  màn tương lai thêm vào bảng không phải xin đất nữa.

## 0 · Vì sao

Ba task cùng vi phạm một chỗ (khai ghi `man-hinh.json` ngoài boundary M03) —
đó là tín hiệu ĐẤT SAI, không phải ba lỗi task. Đo quan hệ của file:

- **Ai đọc**: `web/server.mjs` (VIEW_SSR) · `web/render/trang.mjs` (MAN) ·
  `web/build-fe.mjs` (`__DUONG__`/`__MAN__`) · các cổng `web/test/*` — TOÀN BỘ
  là M03.
- **Ai ghi**: chỉ các đơn vị thêm/bớt MÀN — việc của M03 theo định nghĩa
  (C6a/C6b thêm màn nạp, T03-90 thêm màn mock, T03-93/94 sắp thêm hai màn [Q]).
- **Vì sao nó nằm ở `core/assets/`**: quy ước "bảng khai ở một chỗ" — vị trí
  vật lý, không phải quan hệ sở hữu. `check_khai_mot_noi` chỉ ràng CÁCH ĐỌC,
  không ràng chủ.

## 1 · Chốt

`project_map.yaml` → `M03_web.fe` thêm một đường:

```yaml
fe: [web/**, 05_uiux/**, core/assets/man-hinh.json]   # FR-056 — bảng khai MÀN:
     # mọi bên đọc/ghi đều là M03; nằm ở core/assets chỉ vì quy ước bảng-khai-một-chỗ
```

## 2 · Vì sao KHÔNG chọn lối (b) — "một đơn vị module khác làm thay"

Mỗi màn mới trong tương lai sẽ lại cần một đơn vị M01 "ghi hộ một entry JSON"
— phụ thuộc chéo vĩnh viễn cho một thao tác thuần M03. Lối (a) trả một lần
(FR + một dòng map), lối (b) trả mỗi lần.

## 3 · KHÔNG làm

- Không dời file khỏi `core/assets/` (đường dẫn được 5+ chỗ đọc thẳng, và
  `check_khai_mot_noi` ghim cách khai).
- Không đổi chủ bảng khai nào khác (loai-nguon, media-mime, khung-than-bai —
  chúng có người đọc ở core/Python, khác quan hệ).
