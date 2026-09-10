# M03_web — model flow

## Entity vào / ra

| Chiều | Entity | Chủ | Quyền M03 |
|---|---|---|---|
| Vào | `Analysis` | M02_kb | **chỉ đọc** |
| Vào | `Concept` | M02_kb | **chỉ đọc** |
| Ra | — | — | không sinh entity nào |

Site tĩnh là **dữ liệu dẫn xuất**: xoá sạch rồi build lại từ `kb/` ra y hệt. Đó là
lý do `backup.M03_web = KHÔNG cần` (quyết F4).

## Gọi module khác qua contract nào

| Gọi | Qua | Không qua |
|---|---|---|
| M02_kb | **đọc file `.md` trên đĩa** | không API, không import |
| M01_core | **không gọi** | — |

M03 không biết M01 tồn tại. Hợp đồng là **format file `.md`**, không phải interface
code — đây là điều khiến hai nhánh phát triển song song được.

## Ba custom part và chữ ký Quartz

| Part | Kiểu | Chữ ký |
|---|---|---|
| `approvedOnly` | filter | `shouldPublish(ctx, content) => boolean` |
| `mergeBySource` | emitter | `emit(ctx, content[], resources) => Promise<FilePath[]>` |
| `sortByPriority` | config | so sánh trong `defaultListPageLayout` |

**Vì sao gộp được** (kiểm tài liệu chính thức, quyết F1): `emit()` nhận **toàn bộ**
mảng content một lần, nên nhóm theo `url_normalized` làm được trong một lượt.
Nếu API là mỗi-file-một-lần thì phải dựng chỉ mục riêng — đó là điều tôi kiểm
trước khi giữ Quartz.

## Cần trường mới trên `Analysis` thì làm gì

**FR tới M02_kb.** Ví dụ: muốn hiện "số phút đọc ước tính" thì hoặc tính từ
`word_count` đã có (không cần FR), hoặc FR thêm trường (cần).

Ưu tiên tính từ trường sẵn có — thêm trường là thêm thứ mọi bản `.md` phải mang.
