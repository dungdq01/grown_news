# WO-097 · `gn.js` vỡ trần sau đợt WO-092…096 — lấy lại byte, và thước `tach` phải đọc được dạng mũi tên

| | |
|---|---|
| **Loại** | bug (nợ kỹ thuật) · M03_web |
| **Mức** | `hard` |
| **Mở** | 2026-09-11, phát hiện khi **chạy thử chính lệnh §4 vừa khai vào `_devops/infra.md`** |

## Repro

```bash
cd web && node -e 'import("./render/assets.mjs").then(m=>console.log(m.gnJs().length))'
# 105539   — trần 105472 (FR-061a: js 103 KB)
```

Bảy cổng trần byte đỏ cùng lúc: `chung-cat-hover` · `mo-ta-va-nut-nap` ·
`nap-ba-khung` · `o-nhan-nap` · `page-weight` · `sinh-transcript-ui` ·
`sua-dung-man` · `tab-theo-doi-chung-cat`.

**Quy chủ:** của chính đợt `WO-092…096` — cầu `multiwindow` nhận thêm
`viecNguoi`/`vatHong`/`tenBai`/`_timBan` mà không trả lại byte nào.

## Kỳ vọng

`gn.js` dưới 105472 **mà không nới trần** — `FR-061` cấm nới, và nới một lần là
lần sau không ai đo nữa. Byte phải lấy lại từ chính mã vừa thêm.

## Vế thứ hai — cái đắt hơn

Đổi bốn phép sang dạng mũi tên làm **cổng `chung-cat-nhom-theo-bai` đỏ**: helper
`tach()` của nó chỉ biết `function ten(`. Đây là *"code dịch chỗ thì thước phải
dịch theo"* — sửa thước, **không** nới vế, và cũng **không** giữ mã ở dạng cũ
chỉ để chiều cái thước.

Đo lúc sửa thước còn lòi ra: `tach` cũ **không đọc được `async function`** —
`ccNap` chỉ khớp nhờ `indexOf` tìm chuỗi con. Neo mới `(?:^|\n)[\t ]*(?:async )?`
đọc đúng cả ba dạng, và vẫn trả `null` khi tên biến mất.
