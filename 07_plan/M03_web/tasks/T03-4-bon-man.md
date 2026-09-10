# T03-4 — bốn màn + ba state

phạm_vi_ghi:
  - web/quartz/components/**
  - web/quartz/styles/**
verifiability: soft
tiêu_chí:
  - AC1: mọi flow P0 click được trên sample data
    (soft — click là thao tác người, không lệnh nào đo được)
  - AC2: ba state đầy đủ ở mọi màn: empty · loading · error
    (soft — người chốt trên bản build thật)

phụ_thuộc: T03-3

## Việc

| Màn | Wireframe |
|---|---|
| `SCR-02` trang chủ, 4 vùng | `05_uiux/wireframes/SCR-02-trang-chu.md` |
| `SCR-01` trang bài, 9 mục | `SCR-01-trang-bai.md` |
| `SCR-03` tra cứu concept | `SCR-03-tra-cuu.md` |
| *Chờ duyệt* | `SCR-00` §Màn Chờ duyệt |

**Không thiết kế lại.** Wireframe đã frozen G5.

## State `empty` là màn ĐẦU TIÊN người dùng thấy

Kho đang **0 bài**. Chạy M03 lần đầu ở chặng B thì mọi màn đều rỗng.

Đây không phải trường hợp biên hiếm gặp — nó là đường chạy mặc định lúc này. Làm
`empty` cẩu thả thì ấn tượng đầu tiên là một trang trắng.

## Vì sao task này `soft`

Không lệnh nào đo được "click được" hay "state đủ". Theo luật gốc:
**1 lần thử · người chốt bắt buộc · output là DRAFT**.

Không phải task phụ — nó là task *đắt nhất* về mặt quy trình.

## Rule áp vào

Màn Chờ duyệt **không có nút duyệt** — `M03-R2`. Kiểm ở T03-3 AC2 (S3).
