# M14_chatbot — data flow

> ⚠️ Quy ước viết: tên **bảng / file / cột / khoá JSON** luôn có một từ chỉ loại
> đứng trước. `check_ba` đọc dòng bảng mở đầu bằng một tên lowercase trong backtick
> như **một trường frontmatter** — M12 đã vấp đúng đó (`WL-01K9W3S6M12`).

## 1 · Vào / ra

| | tên | sở hữu | M14 được làm gì |
|---|---|---|---|
| **vào** | JSON `{cau_hoi, pham_vi, k, ngu_canh}` | người gọi | nhận; `ngu_canh` do **LÕI** cấp |
| **vào** | JSON đoạn từ M13 | **M13_truyhoi** | chỉ đọc; là **tập nguồn duy nhất** được trích |
| **vào** | bảng khai định tuyến model | M12 hoặc riêng — s7 quyết | chỉ đọc |
| **ra** | JSON `{blocks[], tu_choi}` | — | trả cho client |
| **ra** | file `chatbot/log/egress.jsonl` | **M14** | append-only, một dòng mỗi lần gửi RA |
| **ra** | file `chatbot/log/tu-choi.jsonl` | **M14** | append-only; **mọi** lần bắn `co-nhung-mau-thuan` |

**M14 không sở hữu một entity nào**, và **không giữ trạng thái** giữa hai lượt hỏi.
Nó sở hữu đúng hai file log của chính nó.

## 2 · Hình dạng một block

| khoá JSON | ai điền | kiểm bằng gì |
|---|---|---|
| khoá `text` | model | — |
| khoá `citations[].doc_id` | model | phải có trong tập đoạn M13 trả về (`AC-5.1`) |
| khoá `citations[].anchor` | model | phân giải được qua `core/assets/dia-chi.json` |
| khoá `citations[].cited_text` | model | **tìm thấy nguyên văn** trong nguồn — cổng verify |
| khoá `citations[].start`/`end` | **MÁY tính** | `re.finditer(re.escape(quote))` — không tin số của model |
| khoá `trang_thai` | **MÁY** | `da-xac-minh` / `chua-xac-minh`, suy từ verify |

**`start`/`end` là chỗ dễ tin nhầm nhất.** Model trả được hai số đó, và chúng
*trông* đúng. Nhưng bảo đảm vị trí là thứ **ta** cung cấp, không phải provider —
Claude Citations là ngoại lệ duy nhất, và ta **vẫn** định vị lại (cùng lý do M12
§3: nếu đường Claude bỏ qua verify thì lỗi trong verify không bao giờ lộ ở đường
phổ biến nhất).

## 3 · Số nào MÁY tính, số nào MODEL khai

| thứ | ai | ghi chú |
|---|---|---|
| trạng thái xác minh của từng block | **MÁY** | verify quote |
| vị trí `start`/`end` | **MÁY** | định vị lại, bỏ số model gửi |
| lý do `khong-co-trong-kho` | **MÁY** | chỉ khi M13 trả **0 hàng** |
| lý do `ngoai-pham-vi` | **MÁY** | so với facet đang chọn |
| lý do `co-nhung-mau-thuan` | **MODEL khai**, MÁY kiểm điều kiện cần | ≥2 địa chỉ, phân giải được, hai bản ghi khác nhau |
| nội dung câu trả lời | **MODEL** | — |
| số lần bắn từ chối | **MÁY đếm** | vào `tu-choi.jsonl`; sau ba tháng đếm được tỉ lệ sai |

Dòng thứ năm là chỗ duy nhất của cả dự án mà **model được phán một điều máy không
kiểm lại được**. Ranh giới: model khai **kết luận**, máy kiểm **điều kiện cần**.
Máy không phán được nội dung có ngược nhau; nó chặn được lần từ chối không trỏ vào
đâu cả.

## 4 · Cái M14 KHÔNG chạm

| | vì sao |
|---|---|
| bảng `phien` | `M14-R5` · `FR-045` U6 — session là dữ liệu, ở LÕI |
| ghi vào thư mục `kb/**` | một cửa ghi ở LÕI; M14 chỉ đọc, và chỉ qua M13 |
| file `truyhoi/index.sqlite` | không đọc trực tiếp; đi qua API của M13 |
| bất kỳ thẻ HTML nào | `Z7` — trả dữ liệu, không trả trình bày |

## 5 · Không giữ trạng thái — và vì sao đó là một quyết định

M14 **không nhớ gì** giữa hai lượt. Lịch sử hội thoại đến từ `ngu_canh` mà người
gọi đưa vào.

Cái giá: mỗi lượt phải gửi lại history ⇒ tốn token. Cái được: **hai kênh không bao
giờ thấy session của nhau bằng tai nạn**, và khi thêm kênh thứ ba thì không có bản
session thứ ba nào mọc ra. `FR-045` U6 chọn cái được.

Giai đoạn đầu **không condense** (`AC-6.1`): nhét history vào một user message, 0
lời gọi model phụ. Nâng lên condense **chỉ khi** có tín hiệu vận hành.

## 6 · Nợ hợp đồng

| nợ | vì sao chưa giải ở đây |
|---|---|
| **`co-nhung-mau-thuan` không có tiền lệ mã** | không có bản đối chiếu nào; AC + testcase tự thiết kế. `AC-4.3` (log mọi lần bắn) là thứ duy nhất cho biết nó có bị lạm dụng |
| **cờ `chua-xac-minh` phải được NHÌN THẤY** | M14 chỉ bảo đảm cờ có trong dữ liệu; việc nó hiện khác block đã xác minh là AC của **M03** |
| **bảng khai model dùng chung hay riêng** | s7 quyết. Dùng chung `model.json` của M12 thì hai module dính vào một file; riêng thì hai bảng phải khớp |
| **`ngu_canh` chưa có hình dạng chốt** | `FR-045` khai bảng `phien` có cột `ngu_canh` nhưng chưa khai **hình dạng** JSON của nó. Cần chốt trước khi M14 nhận |
