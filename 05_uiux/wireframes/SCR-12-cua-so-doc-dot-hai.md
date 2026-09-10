# SCR-12 · Cửa sổ đọc — bổ sung đợt hai (trung tâm mặt [N])

> Contract: `chungcat/chatbot/artifact.sample.v2.json` · ma trận §1 hàng 1–4 ·
> mock: `prototype/dot-hai/cua-so-doc.html`. Prototype thắng khi lệch.
> Đây KHÔNG phải màn mới — là phần GHÉP vào cửa sổ đọc multiwindow đã có.

## Bố cục

```
+ thanh tiêu đề: tên bài · [Chưng cất]* [Hỏi bài này] [gập rail] - o x +
| + nội dung bài (cuộn) --------------+ rail phải 320px, gập được +   |
| | h3 các mục — citation nhảy về đây | [Hỏi] | [Sinh]  (2 tab)   |   |
| | bôi đen => toolbar nổi:           | Hỏi: phạm vi=bài · chip   |   |
| |  [Hỏi đoạn này][Chưng cất từ đoạn]|  ngữ cảnh · chat · ô nhập |   |
| |                                   | Sinh: tile theo loại bài  |   |
| +-----------------------------------+  + artifact đã sinh       +   |
```

`*` nút Chưng cất one-click CHỈ trên bản thu-vien (tách khỏi nút chat — mẫu Comet).

## Nút hợp lệ theo loại bài (ui_kit §4 "Nút năng lực")

| bài đang mở | thanh tiêu đề | tab Sinh |
|---|---|---|
| phan-tich đã lên | Hỏi bài này | tile Slide · Đọc · Video + artifact list |
| thu-vien | + Chưng cất | tile Chưng cất |
| nháp | Hỏi bài này | KHÔNG tile — một câu nói vì sao |

## Luồng nhịp ĐÔI

- Hỏi (GIÂY): trả lời inline trong tab Hỏi — block `chua-xac-minh` render khác
  hẳn (cờ + viền đứt); citation chip hover thấy nguyên văn, bấm nhảy về đúng mục
  TRONG bài; từ chối = badge lý do + "→ việc nên làm".
- Chưng cất / Sinh (PHÚT): popover hỏi-trước (model · ước phí · dữ liệu rời máy)
  → bấm lần hai → toast "Đã xếp hàng" + link `xuong?job=` — người dùng Ở LẠI bài.
- Bôi đen: đoạn → chip ngữ cảnh đính vào ô chat, focus vào ô nhập; KHÔNG replace
  (kho chỉ-đọc). Video không có bôi đen — vào từ transcript (luật ba-module).

## Ba state (của rail)

| state | hiện |
|---|---|
| empty | tab Hỏi: 3 câu mẫu là lối vào · tab Sinh: vì-sao-không-có-tile |
| loading | hỏi: "đang truy hồi…" một nhịp · sinh: KHÔNG loading tại đây — việc sống ở Xưởng |
| error | service tắt: nêu cổng + lệnh bật — KHÁC từ chối của bot |
