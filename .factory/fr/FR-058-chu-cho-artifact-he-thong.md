# FR-058 — Chủ cho artifact HỆ THỐNG (`04_system/**` · `.gitignore` · bảng khai một-chủ)

- **mở**: 2026-09-04 · **người mở**: claude (thi công T08-28) ·
  **trạng thái**: **ĐÃ DUYỆT** 2026-09-04 (chủ dự án: "duyệt đề xuất") — đã áp: `project_map.yaml` mục `he_thong` + lớp A cho `M08_api.be`; `check_g6b` đọc map (T04-7). Đo: 32 → 27 lỗi
- **artifact chạm**: `project_map.yaml` (boundary) — **không** đụng file nào khác
- **mở khoá**: `check_g6b` hết 4 FAIL boundary (`T08-15` · `T08-24` · `T08-28` +
  mọi task tương lai chạm cùng lớp file)

## 0 · Vì sao — và vì sao KHÔNG gộp cả 13 FAIL vào một rổ

`check_g6b` đang báo 13 dòng *"ghi X ngoài boundary"*. Đọc kỹ thì chúng là **BA
bài toán khác nhau**, và gộp lại là cách sửa sai cả ba:

| lớp | task | bản chất | lối đúng |
|---|---|---|---|
| **A** bảng khai một-chủ ở `core/assets/` | `T08-15` (`nguong-loi.json`) | mọi bên đọc/ghi đều là M08; nằm ở `core/assets/` chỉ vì quy ước *bảng-khai-một-chỗ* | **FR này** — đúng khuôn `FR-056` |
| **B** artifact hệ thống KHÔNG có chủ về bản chất | `T08-24` (`.gitignore`) · `T08-28` (`04_system/adr.md`) | mọi module đều có thể cần chạm; gán cho một module là nói dối về quan hệ | **FR này**, nhưng bằng LUẬT chứ không bằng chủ |
| **C** task chạm nhiều module | `T08-16` (spec/rules M18) · `T09-8` (13 file, 4 module) | đây là **BUILD**, không phải PATCH — câu 1 của bảng phân đường | **KHÔNG** thuộc FR này |

Lớp C không phải lỗi boundary; nó là **task khai sai đường**. Nới boundary cho nó
là gỡ đúng cái răng đang cắn.

## 1 · Chốt — lớp A

`project_map.yaml` → boundary `M08_api` thêm một đường, đúng lập luận `FR-056`:

```yaml
# FR-058 lớp A — bảng khai NGƯỠNG: người đọc duy nhất là web/api/dungchung.mjs
#   (`nguongLoi()`); nằm ở core/assets chỉ vì quy ước bảng-khai-một-chỗ.
- core/assets/nguong-loi.json
```

Đo trước khi khai, không đoán: `grep -rl nguong-loi core web chungcat` phải chỉ
ra **đúng** M08 (+ cổng của nó). Không đúng ⇒ lớp A không áp cho file này.

## 2 · Chốt — lớp B: LUẬT, không phải chủ

`04_system/**` và `.gitignore` **không nhận chủ**. Gán chúng cho một module là
nói dối: `adr.md` là artifact **s4**, ở TẦNG TRÊN mọi module, và luật gốc nói
*"không ai được sở hữu thứ dùng để đánh giá mình"* — cho một module sở hữu một
ADR là đúng thứ đó.

Thay vào đó, `project_map.yaml` khai một mục mới:

```yaml
he_thong:            # FR-058 lớp B — artifact KHÔNG có chủ module
  - 04_system/**
  - .gitignore
  luat: |
    Task của MỌI module được khai chúng trong `phạm_vi_ghi`, với ba điều kiện:
      · khai TƯỜNG MINH từng file (không wildcard) + một dòng lý do ngay cạnh;
      · worklog entry của lượt đó phải có file trong `object`;
      · file FROZEN thì vẫn phải qua FR như thường — mục này KHÔNG mở khoá gì.
    `check_g6b` đọc mục này và KHÔNG báo boundary cho chúng.
```

⚠️ Điều này **nới** một phép kiểm. Đổi lại nó lấy được thứ đang mất: hôm nay
mỗi lần chạm `adr.md` là một dòng FAIL bị **bỏ qua bằng tay**, và một cổng mà
mọi người quen bỏ qua là một cổng đã chết. Thà khai luật ra rồi đo nó.

## 3 · Việc phải làm sau khi duyệt

- `core/tests/check_g6b.py` đọc `he_thong` (đơn vị của **M04_ci** — cổng không
  thuộc bên bị đo).
- `T08-16` và `T09-8` **đổi đường**, không nới boundary: hoặc tách phần ngoài
  module thành đơn vị của module chủ, hoặc khai lại là BUILD.

## 4 · KHÔNG làm

- Không đổi chủ bảng khai nào khác (`loai-nguon`, `media-mime`,
  `khung-than-bai`, `dia-chi.json` — chúng có người đọc ở core/Python, khác
  quan hệ hẳn).
- Không dời file nào khỏi chỗ đang nằm.
- Không mở khoá gì cho file FROZEN.

## 5 · Nợ đã phát sinh — nói thẳng (ĐÃ TRẢ 2026-09-04)

`T08-28` (đã thi công 2026-09-04) **đã ghi** `04_system/adr.md`. Nó nằm trong
`phạm_vi_ghi` mà task đó tự khai, nên R1 ở mức *đơn vị việc* không thủng — thứ
thủng là **phạm vi khai vượt boundary của module**, và `check_g6b` bắt đúng.
Ghi ra ở đây thay vì im: FR này là chỗ trả nợ đó, và nếu chủ dự án bác lối trên
thì `T08-28` phải quay lại đổi đường.
