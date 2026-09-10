# WO-091 · Tải "Bản gốc" ra tên SHA, và `inline` thay vì `attachment`

| | |
|---|---|
| **Loại** | bug · M03_web (cửa hiện vật) |
| **Mức** | `hard` — người dùng THẤY |
| **Mở** | 2026-09-10 (ô backlog M03 mở 2026-09-09) |

## Repro

Cửa sổ đọc → **Tải xuống ▾ → Bản gốc**:

- file lưu thành `6714ee19086f.pdf`, không phải tên thật;
- với PDF, cửa trả `Content-Disposition: inline` nên trình duyệt **mở tab** thay
  vì tải.

## Gốc — và vì sao KHÔNG phải "quên dùng `ten_goc`"

`articles.mjs:485`

```js
"content-disposition": `${dat}; filename="${sha256.slice(0, 12)}${hv.duoi}"`
```

Chú thích ngay trên đó ghi rõ lý do, và lý do ấy ĐÚNG:

> *"`filename` dùng ĐUÔI từ bảng khai, không dùng `ten_goc` thô: tên gốc là
> chuỗi của người gửi, và một `filename=` mang dấu ngoặc kép hay newline là
> đường tách đầu đề."*

⇒ Sửa **không phải** bỏ lớp chặn ấy. Sửa là dùng **RFC 5987**:
`filename*=UTF-8''<percent-encoded>` — phần trăm-mã hoá làm mọi ký tự nguy hiểm
thành vô hại, kèm `filename="…"` ASCII đã lọc làm đường lùi cho cửa sổ cũ.

Và `dat`: `xem_truoc: iframe` (PDF) ⇒ `inline`, đúng cho thẻ nhúng. Nhưng khi
người bấm **Bản gốc** thì ý định là TẢI. Ý định ấy phải nói ra ở URL, không suy
từ mime.

## Kỳ vọng

- `?dang=goc` ⇒ **luôn** `attachment`, bất kể `xem_truoc`.
- Không có `?dang=goc` ⇒ hành vi y như cũ (thẻ 2 tầng, `<video>`, `<img>`,
  iframe PDF đều còn nhúng được).
- `filename*` mang tên thật, phần trăm-mã hoá.
- `filename=` ASCII đã lọc: bỏ mọi thứ ngoài `[A-Za-z0-9._-]`, và **không bao
  giờ** chứa `"` `\` `\r` `\n`.
- Tên rỗng / toàn ký tự lạ ⇒ lùi về `<sha12><duoi>` như hôm nay.

## Ngoài phạm vi

- 5 file tải về tên UUID — ô backlog riêng, **chưa tái hiện được**.
