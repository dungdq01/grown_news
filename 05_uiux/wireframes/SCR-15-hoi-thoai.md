# SCR-15 · Hội thoại — [Q] phiên theo tài khoản (M14)

> Contract: `chatbot.sample.v2.json` (`lich_su_phien` + `hoi_dap`) · ma trận §2
> hàng 4 · mock: `prototype/dot-hai/hoi-thoai.html`.

## Bố cục

```
+ trái: bảng phiên ----------+ phải: transcript phiên đang chọn +
| phiên · tài khoản · kênh · | Q/A như rail Hỏi (cùng component)|
| lượt · cập nhật            | [xem JSON] [Xoá phiên]           |
```

## Luật riêng

- Hai người = hai phiên, không thấy ngữ cảnh của nhau (FR-045) — bảng có cột
  tài khoản để điều đó nhìn thấy được.
- Tin hỏi-đáp từ KÊNH đổ về cùng chỗ (kênh ghi trong cột) — một nơi xem tất cả.
- [xem JSON] mở raw hợp đồng blocks + từ chối — chứng minh service trả dữ liệu,
  web chỉ render.
- Xoá phiên là xoá ngữ cảnh hội thoại, KHÔNG đụng bài trong kho.

## Ba state

empty: "chưa có phiên nào" · loading: bảng một nhịp · error: mất service —
transcript cũ vẫn đọc được (dữ liệu ở LÕI).
