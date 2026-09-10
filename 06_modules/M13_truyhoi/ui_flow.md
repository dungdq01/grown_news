# M13_truyhoi — ui flow

> **M13 KHÔNG CÓ giao diện** (`ADR-05` `Z7` — THỢ chỉ backend).
> Nhưng nó là module quyết định **một control người dùng nhìn thấy**: phạm vi truy
> hồi. File này nói control đó phải hiện gì, và ai vẽ.

## 1 · Phạm vi là control HIỂN THỊ — nguyên lý ① của NotebookLM

`B-C2` + `research_summary` §3.1: khi verify đắt hơn tin, **không ai verify**. Phạm
vi ẩn làm verify đắt lên vì người đọc không biết câu trả lời được rút từ tập nào.

| màn (`man-hinh.json`) | M13 góp gì | ai vẽ |
|---|---|---|
| cửa sổ chat (thuộc M14/M03) | **số bản ghi trong phạm vi**, trả cùng kết quả | M03_web |
| bộ lọc facet đã có ở `/kho/` | tập ứng viên = đúng facet đang chọn | M03_web |
| mỗi đoạn trả về | `file#anchor` **bấm được** → mở đúng vị trí trong nguồn | M03_web (C3) |

**M13 không vẽ pixel nào.** Nó trả **ba thứ** để web vẽ được sự thật: đoạn, địa
chỉ, và số bản ghi trong phạm vi.

## 2 · Ba thứ phải NÓI RA, không được ẩn

**a · Số bản ghi trong phạm vi.** Trả **cùng** kết quả, không phải một lời gọi
riêng. Hai lời gọi ⇒ hai thời điểm ⇒ số hiện trên màn có thể không phải số đã dùng
để trả lời. Tiền lệ trong dự án: `#acount` từng hiện **20** trong khi SSR trả
**16**, vì FE đếm trên phạm vi khác với nhãn nói (BUG-2, plan C8).

**b · Truy vấn 0 kết quả.** Phải hiện *"không có trong kho"*, không hiện danh sách
rỗng. Đây cũng chính là **tín hiệu điểm rẽ hybrid** (`AC-7.1`) — nên nó phải được
**đếm và ghi**, không chỉ hiển thị.

**c · `k` do người gọi đưa.** Nếu UI có ô "số kết quả" thì con số đó đi xuống tận
M13. Không có ô thì web phải khai một mặc định **tường minh**, không để M13 gõ cứng
(`AC-5.2`).

## 3 · Cái CỐ Ý không có

| | vì sao |
|---|---|
| bất kỳ HTML/CSS/JS | `Z7`; thêm một `.html` vào `truyhoi/` là vi phạm khai được |
| điểm bm25 hiện cho người dùng | số **âm**, và đổi khi `w_title` đổi. Hiện nó là hiện một con số không nghĩa |
| thanh "độ liên quan %" | bm25 không phải xác suất; đổi thang thành % là bịa |
| ô "tìm nâng cao" với cú pháp riêng | cú pháp FTS5 lộ ra ngoài là hợp đồng ta không muốn giữ |
| preview cắt bằng `snippet()` làm bằng chứng | `M13-R4` — trần 64 token; preview thì được, bằng chứng thì không |

## 4 · Nợ

**`man-hinh.json` chưa có màn chat nào**, và **không được thêm trước khi dựng** —
bài học `S18`/C5: bảng khai chứa màn chưa dựng thì `server.mjs` dẫn xuất `VIEW_SSR`
từ nó và URL đó thành **500 thật**. Màn chat vào bảng khai **cùng lúc** với lần
dựng nó, và đó là việc của M03 sau khi M14 có API.

**Địa chỉ bấm được là C3, chưa làm.** M13 trả `file#anchor` từ đầu, nhưng cho tới
khi C3 xong thì địa chỉ đó là **chữ**, không phải link. Ghi ra để không ai đọc
`AC-2.3` rồi tưởng người dùng đã bấm được.
