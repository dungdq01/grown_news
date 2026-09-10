# M06_skillgen — model flow

## Entity vào / ra

| Chiều | Entity | Chủ | Quyền |
|---|---|---|---|
| Vào | `Analysis` (approved) | M02_kb | **chỉ đọc** |
| Ra | `SkillDraft` | **M06** | ghi — ngoài repo |

`SkillDraft` là entity duy nhất M06 sở hữu. Nó **không** nằm trong `kb/`, không có
schema JSON, không qua `validate.py` — nó là file cho agent đọc, không phải bản
ghi tri thức.

## Gọi module khác qua contract nào

| Gọi | Qua | Không qua |
|---|---|---|
| M02_kb | đọc file `.md` | không API |
| M01_core | **không** | — |
| M03_web | **không** | — |

M06 độc lập hoàn toàn: chạy được khi web chưa có, và web chạy được khi M06 chưa có.

## Vì sao `priority` sống ở đây chứ không ở M02

`priority` là **công thức chấm ứng viên skill** — nó chỉ có nghĩa với module quyết
định sinh hay không sinh nháp.

M02 *lưu* con số (trường trong schema), M06 *định nghĩa* nó. Map trỏ về đây:
`entities.Analysis.fields.skill_candidates.formula`.

M03 cũng đọc `priority` (sắp bài) nhưng **không định nghĩa** nó — dùng lại con số
đã tính.

## Cần trường mới thì làm gì

FR tới M02. Ví dụ muốn thêm `draft_generated_at`: FR + bump schema + test.

Trước khi FR, hỏi: cái này có cần nằm trong **mọi** bản `.md` không? Nếu chỉ M06
cần thì để trong `06_skillgen/state.json`, không đụng hợp đồng chung.
