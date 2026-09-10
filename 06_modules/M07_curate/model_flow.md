# M07_curate — model flow

## Entity vào / ra

| Chiều | Entity | Chủ | Quyền M07 |
|---|---|---|---|
| Vào | `Analysis` | M02_kb | **chỉ đọc** — cả draft/rejected |
| Vào | `Concept` | M02_kb | **chỉ đọc** |
| Ra | — | — | không sinh entity |

Báo cáo **không phải entity**: không schema, không ai parse, đổi format tự do.

## Gọi module khác qua contract nào

| Gọi | Qua |
|---|---|
| M02_kb | đọc file `.md` |
| M01_core | **không gọi** — xếp hàng, người bấm chạy |

M07 là module cô lập nhất: không ai phụ thuộc nó, nó không gọi ai. Xoá đi thì
sáu module còn lại chạy y nguyên — chỉ mất phần nhắc.

Đây là lý do nó xếp **cuối** build order: rủi ro thấp nhất nếu làm sau.

## Cần trường mới thì làm gì

FR tới M02. Ứng viên có thể cần:

| Trường | Để làm gì | Có cần thật không |
|---|---|---|
| `last_checked_at` | biết lần quét trước | **không** — suy từ tên file báo cáo |
| `decay_confirmed` | đánh dấu đã kiểm nguồn còn sống | có thể, khi thấy re-analyze quá nhiều bài còn tốt |

Nguyên tắc: hỏi *"cái này có cần nằm trong mọi bản `.md` không?"* Chỉ M07 cần thì
để `07_curate/state.json`, không đụng hợp đồng chung.
