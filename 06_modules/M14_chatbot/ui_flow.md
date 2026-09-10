# M14_chatbot — ui flow

> **M14 KHÔNG CÓ giao diện** (`Z7`). Nhưng nó là module mà **một quyết định UI
> quyết định luôn giá trị của cả module**: cờ `chua-xac-minh` có được nhìn thấy
> hay không.

## 1 · Màn nào phục vụ M14

| màn | thao tác | ai sở hữu | M14 góp gì |
|---|---|---|---|
| cửa sổ chat (chưa dựng) | hỏi → đọc trả lời | M03_web | `blocks[]` + `tu_choi` |
| mỗi citation trong trả lời | bấm địa chỉ → mở đúng vị trí nguồn | M03_web (**C3**) | `doc_id` + `anchor` + `cited_text` |
| bộ lọc facet ở `/kho/` | chọn phạm vi trước khi hỏi | M03_web | phạm vi đi xuống M13 qua M14 |
| Telegram / Discord | hỏi trong chat | M15_kenh | **cùng** endpoint, cùng JSON |

## 2 · Cờ `chua-xac-minh` — chỗ cả module thành trang trí hoặc không

Chủ dự án chốt 2026-09-01: citation không verify được ⇒ **gắn cờ TỪNG khẳng định**,
câu trả lời vẫn hiện.

Lựa chọn đó chỉ có nghĩa nếu **cờ được nhìn thấy**. Một block `chua-xac-minh` render
**giống** block đã xác minh thì hệ đã bỏ im lặng — chỉ là bỏ trong mắt người đọc
thay vì bỏ trong dữ liệu.

> **Đây là AC của M03, không phải M14.** M14 chỉ bảo đảm cờ có trong dữ liệu
> (`AC-3.1`). Ghi ở đây vì nếu không ai viết AC bên M03 thì lựa chọn của chủ dự án
> mất hiệu lực **mà không cổng nào đỏ**.

Cổng phải đo **HÀNH VI**, không đo ý định: cùng một câu trả lời, hai block khác
`trang_thai` phải ra **markup khác nhau**. Tiền lệ trong dự án: `hien-that.test.js`
được dựng đúng vì hai bug mà markup "trông đúng" nhưng hành vi sai (BUG-1/BUG-2,
plan C8).

## 3 · Ba thứ phải NÓI RA

**a · Từ chối phải hiện LÝ DO PHÂN LOẠI**, không hiện một câu lịch sự. Ba lý do dẫn
tới ba hành động khác nhau của người dùng:

| `ly_do` | người dùng nên làm gì |
|---|---|
| `khong-co-trong-kho` | nạp nguồn về chủ đề đó |
| `ngoai-pham-vi` | mở rộng facet đang chọn |
| `co-nhung-mau-thuan` | đọc **hai** địa chỉ được trỏ, tự quyết |

Gộp cả ba thành *"tôi không biết"* là xoá thông tin đắt nhất mà hệ vừa tính ra.

**b · Phạm vi đang hỏi.** Số bản ghi trong phạm vi đến từ M13 qua M14 và phải hiện
— `B-C2`: người dùng phải **thấy** mình đang hỏi trên tập nào.

**c · `cited_text` phải xem được không cần rời trang.** Nguyên lý ③ NotebookLM: hover
xem nguyên văn, bấm nhảy tới vị trí — verify tốn **một cử động chuột**. Khi verify
đắt hơn tin, không ai verify, và grounding thành trang trí.

## 4 · Cái CỐ Ý không có

| | vì sao |
|---|---|
| bất kỳ HTML/CSS/JS trong `chatbot/` | `Z7`; `M14-R4` đo được bằng grep |
| markdown render phía M14 | trả **dữ liệu**; web chuẩn hoá trình bày (vai của `web` trong `dich-vu.json`) |
| streaming token | chưa cần, và nó ràng buộc hình dạng API với một cách hiển thị |
| "độ tự tin %" | bm25 không phải xác suất; đổi thang thành % là bịa |
| gợi ý câu hỏi tiếp | model tự sinh ⇒ không có địa chỉ ⇒ chỏi `B-A5` |

## 5 · Nợ

**Màn chat chưa tồn tại, và `man-hinh.json` KHÔNG được khai trước.** Bài học
`S18`/C5: bảng khai chứa màn chưa dựng thì `server.mjs` dẫn xuất `VIEW_SSR` từ nó và
URL đó thành **500 thật** trên đường người dùng. Màn chat vào bảng khai **cùng lúc**
với lần dựng nó.

**Địa chỉ bấm được là C3, chưa làm.** M14 trả `doc_id#anchor` từ đầu, nhưng tới khi
C3 xong thì địa chỉ là **chữ**, không phải link — tức nguyên lý ③ (verify tốn một cử
động chuột) **chưa có hiệu lực**, dù dữ liệu đã đủ.
