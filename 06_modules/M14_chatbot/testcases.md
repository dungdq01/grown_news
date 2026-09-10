# M14_chatbot — testcases

> Mỗi AC **≥1 happy + ≥1 edge**, viết **bằng lời**. `m-test` ở s8 là vai riêng và
> giữ quyền FR ngược về đây (R1).
> **Phép thử s6**: *viết không nổi testcase ⇒ AC mơ hồ ⇒ DỪNG*. Kết quả ở §cuối.

## 1 · Service, không phải một lớp trong web

**AC-1.1** — API độc lập với web
- *happy*: `web` **tắt hẳn** (tiến trình không chạy) → `curl -X POST 127.0.0.1:8788/hoi` với payload có `bot` → JSON hợp lệ.
- *edge*: payload **không** có `bot` lẫn `nguon[]` → vẫn trả JSON (mặc định `bot: admin`), **không** 500.
- *edge 2*: `web` tắt **và** M13 tắt → trả JSON có `tu_choi` nêu dịch vụ nào chết, **không** treo cho tới timeout.

**AC-1.2** — trả dữ liệu, không trả trình bày
- *happy*: `find chatbot/ -name "*.html" -o -name "*.css"` → **0 file**.
- *edge*: phản hồi chứa `<b>` hay `<div>` bất kỳ → đỏ. (Kể cả khi model sinh ra HTML — M14 phải lột, không chuyển tiếp.)

**AC-1.3** — trần 2.000 dòng
- *happy*: `cloc chatbot/` (trừ `tests/`) ≤ 2.000.
- *edge*: vượt trần → đỏ, và thông báo nêu **file lớn nhất** (để biết chỗ chẻ).

## 2 · Hợp đồng JSON

**AC-2.1** — verify bắt buộc, không thừa hưởng bảo đảm của Anthropic
- *happy*: mọi `citations[]` đi qua cổng verify trước khi ra khỏi M14.
- *edge*: gieo một đường trả phản hồi **bỏ qua** verify → đỏ.
- *edge 2*: dùng adapter Anthropic (có Citations API) → **vẫn** qua verify; bỏ verify cho riêng nhánh đó ⇒ đỏ. (Đây là ca quan trọng: nếu nhánh phổ biến nhất bỏ qua verify thì lỗi trong verify không bao giờ lộ.)

**AC-2.2** — block `da-xac-minh` phải có citation
- *happy*: block khẳng định có ≥1 citation đã verify → `trang_thai: da-xac-minh`.
- *edge*: gieo một block có `citations: []` nhưng gắn `da-xac-minh` → đỏ.

**AC-2.3** — enum ba lý do
- *happy*: `ly_do` là một trong ba → qua.
- *edge*: `ly_do: "khong-chac"` (ngoài enum) → **chặn tại M14**, không chuyển tiếp cho client.

## 3 · Verify

**AC-3.1** — gắn cờ, không xoá
- *happy*: quote tìm thấy nguyên văn → `da-xac-minh`.
- *edge*: quote **không** có trong nguồn → block ra với `chua-xac-minh`, **không** bị xoá.

**AC-3.2** — không block nào bị bỏ im lặng
- *happy*: model sinh 5 block → 5 block ra.
- *edge*: 2/5 block có quote hỏng → **vẫn 5** block ra (3 `da-xac-minh` + 2 `chua-xac-minh`). Chênh một cái ⇒ đỏ.
- *edge 2*: model sinh 0 block → 0 ra, và `tu_choi` phải khác `null` (không trả rỗng câm).

**AC-3.3** — verify SAU parse, TRƯỚC trả
- *happy*: thứ tự parse → verify → trả.
- *edge*: đảo thành verify → parse → đỏ (không có gì để verify khi chưa parse).

**AC-3.4** — normalize không mất dấu tiếng Việt
- *happy*: quote `"kiểm chứng chéo"` khớp nguồn có đúng chuỗi đó.
- *edge*: nguồn **chỉ** có `"kiem chung cheo"` (không dấu) → quote có dấu **KHÔNG** khớp. (Normalize chỉ được bỏ whitespace + dấu câu **ASCII**, không bỏ dấu tiếng Việt.)
- *edge 2*: quote khác nguồn ở dấu phẩy/khoảng trắng thừa → **vẫn khớp**.

## 4 · Từ chối hai tầng

**AC-4.1** — `khong-co-trong-kho` do CODE quyết
- *happy*: M13 trả **0 hàng** → `ly_do: khong-co-trong-kho`, và model **không** được gọi (đếm 0 dòng egress).
- *edge*: M13 trả **3 hàng** nhưng model tự khai `khong-co-trong-kho` → **lời khai bị bỏ**, M14 trả lời bình thường.

**AC-4.2** — `co-nhung-mau-thuan` cần ≥2 địa chỉ, hai bản ghi khác nhau
- *happy*: model khai kèm `[a#m1]` và `[b#m2]`, cả hai phân giải, `a ≠ b` → chấp nhận.
- *edge*: khai kèm **1** địa chỉ → **bị bỏ**, trả lời bình thường.
- *edge 2*: khai kèm `[a#m1]` và `[a#m2]` — **cùng bản ghi** `a` → bị bỏ.
- *edge 3*: khai kèm hai địa chỉ mà một cái **không phân giải được** → bị bỏ.

**AC-4.3** — log HAI ca, phân biệt được
- *happy*: lần bắn **được chấp nhận** → một dòng `tu-choi.jsonl` loại **(a)**.
- *edge*: model khai kèm **1** địa chỉ ⇒ bị bỏ → một dòng loại **(b)**, kèm lý do bị bỏ.
- *edge 2*: đọc log rồi đếm riêng (a) và (b) → hai số **tách được**. Không tách thì ba tháng sau ta biết nhánh này bắn bao nhiêu lần, mà **không** biết nó bị chặn bao nhiêu lần — và con số thứ hai mới nói lên model có đang lạm dụng không.

**AC-4.4** — không ngưỡng bm25
- *happy*: `grep` một phép so sánh điểm với hằng số trong `chatbot/` → 0.
- *edge*: gieo `if diem < -8.5:` → đỏ.

## 5 · Citation-first

**AC-5.1** — mọi `doc_id` nằm trong tập đoạn M13 trả
- *happy*: M13 trả đoạn của `a`,`b` → mọi block trỏ về `a` hoặc `b`.
- *edge*: block trỏ về `c` (ngoài tập) → đỏ. (Model bịa một `doc_id` trông hợp lệ là ca thật.)

**AC-5.2** — một lượt = một lời gọi M13
- *happy*: một câu hỏi → đúng 1 request tới M13.
- *edge*: gieo một lời gọi M13 **thứ hai** sau khi model đã viết → đỏ. (Đó chính là cài đặt của generate-then-cite.)

## 6 · Multi-turn

**AC-6.1** — một lượt = một lời gọi model
- *happy*: một câu hỏi có lịch sử → 1 dòng `egress.jsonl`.
- *edge*: gieo một lời gọi condense → **2** dòng ⇒ đỏ.

**AC-6.2** — session độc lập
- *happy*: hai `phien` khác nhau hỏi cùng câu → không phiên nào thấy lịch sử phiên kia.
- *edge*: gieo `ngu_canh` của phiên A vào lượt của phiên B → M14 dùng đúng thứ người gọi đưa, và **không** tự trộn.

**AC-6.3** — M14 không đọc/ghi bảng `phien`
- *happy*: `grep` bảng `phien` trong `chatbot/` → 0.
- *edge*: gieo một câu SQL chạm bảng đó → đỏ.

## 7 · Egress

**AC-7.1** — một cửa, log trước khi gửi
- *happy*: một lượt → 1 dòng log; dựng lại payload từ log rồi băm ra **cùng** `sha256`.
- *edge*: request **không bao giờ hoàn thành** → dòng log **vẫn tồn tại**.
- *edge 2*: gieo một `httpx.post` ở file khác → đỏ.

**AC-7.2** — bảng khai model
- *happy*: `grep` tên model trong `chatbot/**` trừ `assets/` → 0.
- *edge*: gieo `model="claude-sonnet-5"` → đỏ.

## 8 · Knowledge

**AC-8.1** — hợp đồng nhận `bot` hoặc `nguon[]`
- *happy*: payload có `bot: admin` → chạy trên cả kho.
- *edge*: payload có **cả hai** `bot: x` và `nguon: [a,b]` → dùng **`[a,b]`** (`nguon[]` thắng), **và** có một dòng log ghi rằng hai thứ cùng có.
- *edge 2*: thiếu cả hai → mặc định `bot: admin`, và `grep` thấy **một dòng khai mặc định đó** (không phải một nhánh vắng).

**AC-8.2** — truyền tập nguồn xuống M13
- *happy*: `bot` có Knowledge `[a,b]` → request tới M13 mang đúng `[a,b]`.
- *edge*: gọi M13 **không** nêu tập nguồn → đỏ.

**AC-8.3** — bot hẹp không trả lời ngoài Knowledge *(soft)*
- *happy*: bot có Knowledge `[a]`; hỏi câu chỉ trả lời được từ `b` → `tu_choi: khong-co-trong-kho`.
- *edge*: gieo một đường khiến `b` lọt vào đoạn → đỏ.
- ⚠️ **`soft` hôm nay**: chỉ có một hạng bot (`admin`), nên chưa dựng được ca thật. Cổng bật khi có hạng bot thứ hai.

**AC-8.4** — MỘT chokepoint
- *happy*: đúng **một** hàm giải `bot → tập doc_id`; mọi đường truy hồi đi qua nó.
- *edge*: gieo một đường query kho thứ hai → đỏ, nêu file+dòng.
- *edge 2*: đếm số hàm gọi M13 → phải là **1**. (Open WebUI có **năm** đường; ba đường không kiểm quyền.)

**AC-8.5** — không nhận scope từ caller
- *happy*: payload không có trường nào cho phép nêu tên collection/doc_id/bảng.
- *edge*: gửi `{"collection_name": "kb-uuid"}` → trường bị **bỏ**, và tập nguồn vẫn do server giải.
- *edge 2*: `grep` một tham số đọc thẳng từ payload rồi đưa vào truy vấn → đỏ.

**AC-8.6** — DENY khi thiếu danh tính
- *happy*: có danh tính → chạy.
- *edge*: **không** danh tính và **không** `bot` → **từ chối**; không rơi về "cả kho".
- *edge 2*: gieo cài đặt `user ? whereWithUser(user) : where({})` → đỏ. (Đây là hình dạng nguyên văn của `CVE-2026-47713`.)

**AC-8.7** — PRE-filter, không POST-filter
- *happy*: ràng buộc tập nguồn là `AND` trong **cùng câu SQL** với `MATCH`.
- *edge*: gieo cài đặt lấy kết quả rồi lọc trong Python → đỏ.
- *edge 2*: đo bằng hành vi — gieo một chunk khớp **rất mạnh** ngoài tập nguồn; nếu nó **được đọc** rồi mới bị loại thì cài đặt là post-filter. Đo bằng cách đếm số hàng SQL trả về, không bằng đọc mã.

**AC-8.8** — không đường thứ hai tới kho
- *happy*: `chatbot/` không có tool/plugin/đường tải file nào chạm kho ngoài chokepoint.
- *edge*: gieo một hàm đọc `truyhoi/index.sqlite` trực tiếp → đỏ.

---

## Kết quả phép thử s6 — hai chỗ phải sửa

Chạy trên 29 AC: **27 viết được ngay**. Hai chỗ không, và cả hai là **thiếu một luật**,
không phải thiếu một câu chữ:

**a · `AC-8.1` — payload có CẢ `bot` LẪN `nguon[]` thì sao?**
Spec khai *"nhận `bot` **hoặc** `nguon[]`"* nhưng không nói ca **cả hai**. Testcase
*edge* của tôi phải bịa ra một luật ưu tiên để viết, và bịa luật trong testcase là
đúng thứ s6 cấm.
⇒ **Cần sửa `AC-8.1`**: khai luật ưu tiên tường minh. Đề xuất: **`nguon[]` thắng**,
và M14 **ghi log** khi hai thứ cùng có — vì đó là dấu hiệu người gọi đang nhầm.

**b · `AC-4.3` — *"mọi lần bắn được log"* chưa nói CA BỊ BỎ có log không.**
Ca đắt nhất là: model **định** khai `co-nhung-mau-thuan` nhưng thiếu hai địa chỉ nên
bị bỏ. Nếu ca đó không log thì ba tháng sau ta đếm được *"số lần từ chối"* mà **không**
đếm được *"số lần model định lạm dụng"* — và con số thứ hai mới nói lên nhánh này có
đang bị lạm dụng hay không.
⇒ **Cần sửa `AC-4.3`**: log **cả hai** ca — bắn thành công và bắn bị bỏ, phân biệt được.

**Cả hai ĐÃ SỬA trong spec** (2026-09-02), và nay viết được testcase:

- `AC-8.1` *edge*: payload có **cả** `bot: x` **lẫn** `nguon: [a,b]` → dùng `[a,b]`,
  **và** có một dòng log ghi rằng hai thứ cùng có.
- `AC-4.3` *edge*: model khai `co-nhung-mau-thuan` kèm **1** địa chỉ → lời khai bị bỏ,
  **và** `tu-choi.jsonl` có một dòng loại **(b)** phân biệt được với loại (a).

**Không còn AC nào của M14 viết không nổi testcase.**
