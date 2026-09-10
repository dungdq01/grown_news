# FR-068 — Nới trần `gn.css` cho hệ token trạng thái

- **mở**: 2026-09-06 · **người quyết**: chủ dự án (*"mở trần"*, trả lời câu 3
  của `SCR-20`) · **trạng thái**: **ĐÃ DUYỆT hướng — số cụ thể ở §2**
- **artifact chạm**: `web/test/page-weight.test.js` (`TRAN = 100`)
- **liên đới**: **đảo một vế của `FR-061 §3`**, nguyên văn:
  > *"**`gn.css` và `gn.js` giữ nguyên 102400.** Đó là bundle CHUNG — nới nó là
  > nới cho mọi trang, kể cả trang đọc."*

  Đó là lý do việc này phải là một FR chứ không một dòng sửa số. Hai ngày
  trước chính chủ dự án chốt *"không nới bundle chung"*; hôm nay chốt ngược.
  Ghi cả hai lại để lần sau không ai phải đoán bên nào còn hiệu lực.

## 0 · Vì sao — số đo, không cảm giác

`T03-120` (`SCR-20`, đã duyệt 2026-09-06) đòi **hệ màu trạng thái ở THẺ trong
lưới**. Thẻ do máy dựng trang vẽ, không chạy qua chunk nào ⇒ token phải vào
`tokens.css` ⇒ vào `gn.css`.

Đo 2026-09-06, sau khi đã gộp bản trùng của `.tx` (`T03-119`):

| | |
|---|---|
| `gn.css` | **102 382 / 102 400** — còn **18** byte |
| cần cho 5 cặp token (sáng + tối) | ước **380** byte |
| `gn.js` | 90 574 / 102 400 — còn 11 826 byte |

18 byte không đủ cho một dòng CSS. Không có lối "vừa đủ" nào ở đây.

## 1 · Vì sao KHÔNG cắt mỡ trước

Nợ giảm béo `gn.css` (100+ selector trùng) vẫn mở từ `FR-061 §4`, và nó **vẫn
là việc phải làm**. Nhưng nó không phải việc của lượt này, vì hai lý do:

1. `prototype.css` tự ghi *"41 selector trùng nhưng 0 luật chết"* — chúng là
   **override hợp tác**, gộp phải đọc cascade từng ca. Đó là một đơn vị việc
   riêng có rủi ro hồi quy thị giác riêng.
2. Ép `T03-120` phải cắt mỡ trước là ép hai việc rủi ro khác nhau vào một PR.
   Hỏng thì không quy được chủ: màu sai vì token, hay vì một selector vừa bị
   gộp?

## 2 · Chốt số

```
gn.css:  102400  →  104448   (100 KB → 102 KB)
gn.js:   102400              ← KHÔNG ĐỔI
```

**+2048 byte, một lần.** Không phải +380 "vừa đủ": một trần chạm đúng vào mặt
mình là một trần sẽ vỡ ở đơn vị kế tiếp, và mỗi lần vỡ lại tốn một FR. 2 KB cho
5 cặp token + chỗ cho một đơn vị nữa, **không** chỗ cho mười.

`gn.js` không đổi vì nó không chật (còn 11.8 KB) — nới một thứ không chật là
nới không có số đo đằng sau.

## 3 · KHÔNG nới

- **`gn.js` giữ 102400.**
- **Trần HTML từng trang giữ nguyên** (home 61440 · trang khác 75776).
- **Công thức trang-có-chunk của `FR-061 §2` giữ nguyên** — nó vẫn là thứ chặn
  phép *"tách sang chunk để lách thước"*.
- Trần mới **vẫn là trần**: đơn vị FE kế tiếp chạm `gn.css` vẫn phải giảm béo
  hoặc mở FR riêng. Đây là một lần nới, không phải bỏ thước.

## 4 · Nợ vẫn còn

Ô backlog M03 *"giảm béo `gn.css` thật"* **giữ nguyên, không tick**. FR này
tháo chặn cho `T03-120`, nó không trả nợ ấy — và sau lượt này `gn.css` sẽ ở
~102 760/104 448, tức nợ vẫn còn nguyên tính cấp thiết.

## 5 · Bằng chứng đóng

- `cd web && npm test` — vế `gn.css` xanh với trần mới
- `git diff web/test/page-weight.test.js` — đúng MỘT số đổi, kèm chú thích trỏ
  FR này
