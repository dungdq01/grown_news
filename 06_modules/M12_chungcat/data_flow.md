# M12_chungcat — data flow

> Dữ liệu nào đi đâu, ai sở hữu, và chỗ nào là bản sao chỉ-đọc.
> Công thức đầy đủ sống ở `spec.md`; file này chỉ nói **đường đi**.

## 1 · Bảng vào / ra

| | tên | sở hữu | M12 được làm gì |
|---|---|---|---|
| **vào** | `ban_ghi` (view) | **M02_kb** | **chỉ đọc**, và chỉ qua API của LÕI — không mở `_kho.sqlite` |
| **vào** | `kb/_media/<sha256>` | **M09_thuvien** | **chỉ đọc byte**; không xoá, không ghi |
| **vào** | `core/assets/khung-than-bai.json` | M01_core | chỉ đọc — khung 5 mục |
| **vào** | `core/assets/dia-chi.json` | M01_core | chỉ đọc — 5 dạng địa chỉ |
| **vào** | `chungcat/assets/model.json` | **M12** | sở hữu; bảng khai định tuyến |
| **ra** | hàng bảng nháp (`FR-046`), khoá `job_ulid` | **LÕI** | **ghi qua API**, luôn `trang_thai: nhap` + `review_status: draft` |
| **ra** | `chungcat/log/egress.jsonl` | **M12** | append-only; một dòng mỗi lần gửi RA |

**M12 không sở hữu một entity nào trong `kb/`.** Nó sở hữu đúng hai thứ: bảng khai
định tuyến, và log egress của chính nó. Đó là hình dạng đúng của một THỢ.

## 2 · Vòng đời một payload

```
job {slug|nguon[], loai, ulid}
  → đọc nguyên liệu (byte + frontmatter)     ← CHỈ ĐỌC
  → đếm tỉ lệ Hán → ngon_ngu                 ← máy đếm, không hỏi model
  → tra model.json[tac_vu][ngon_ngu]         ← bảng khai
  → payload {prompt, tai_lieu}
  → sha256(payload) → egress.jsonl           ← GHI TRƯỚC KHI GỬI
  → gửi RA
  → {text, quotes[]}
  → định vị lại từng quote trong nguồn        ← TA tính, không tin provider
  → citations_sampled / citations_verified    ← máy đếm (B-A6)
  → hàng bảng nháp qua API                    ← trang_thai: nhap · draft
```

**Chỗ dễ làm sai nhất là mũi tên thứ năm.** `sha256` phải băm **payload đã gửi**,
không băm file nguồn. Hai thứ khác nhau: file nguồn 30 trang có thể ra ba payload
khác nhau (ba lần thử, prompt khác nhau), và báo cáo egress cần biết **cái đã đi
ra**, không phải cái nằm trên đĩa.

## 3 · Số nào là DẪN XUẤT, số nào là quyết định

| trường | loại | ai điền |
|---|---|---|
| `citations_sampled` · `citations_verified` | **dẫn xuất** | máy đếm (`B-A6`) |
| `unverifiable_citations` | **dẫn xuất** | máy suy từ hai số trên |
| `word_count` · `url_normalized` | **dẫn xuất** | `validate.py --fix` |
| `credibility_max` | **QUYẾT ĐỊNH** | **người** — `M01-R2` cấm máy điền |
| `category` · `concepts` | **QUYẾT ĐỊNH** | người gán sau; bot bỏ trống là hợp lệ |
| ~~`model_da_dung`~~ | **CHƯA CÓ** | trường này tôi tự đặt; `frontmatter.schema.json` không có nó. Ghi model đã dùng cần **FR tới M01** (owner của schema) — chưa mở. Tới lúc đó, model đã dùng chỉ sống ở `egress.jsonl` |

Ranh giới này là lý do `--fix` tồn tại được mà không thành máy bịa. Một trường
nhảy từ cột phải sang cột trái là một **quyết định kiến trúc**, không phải một
dòng mã — nó cần FR.

## 4 · Cái M12 KHÔNG chạm, và vì sao ghi ra

| | vì sao ghi |
|---|---|
| file `kb/_kho.sqlite` | `M12-R1`. Ghi ra vì "đọc kho" nghe vô hại và là cách luật này chết |
| bảng `categories` và `concepts` | M12 không tự thêm nhãn — nhãn là quyết định của người |
| bảng `article_versions` và `recycle` | vòng đời bản ghi thuộc LÕI |
| thư mục `kb/_media/**` (ghi/xoá) | `M09-R1`: mỗi DELETE phá byte vĩnh viễn. THỢ không có quyền đó |

## 5 · Nợ hợp đồng, đo được hôm nay

`ho_so: tong-hop` cần trường **`nguon`**, và trường đó **chưa có** trong
`core/assets/frontmatter.schema.json`:

```bash
python -c "import json;print('nguon' in json.load(open('core/assets/frontmatter.schema.json',encoding='utf-8'))['properties'])"
# -> False   (đo 2026-09-01)
```

`FR-044` đã duyệt nhưng chưa áp — file frozen, và deny chặn agent ghi. Nên nửa
`tong-hop-chu-de` của M12 **không có hợp đồng dữ liệu** cho tới khi người áp
`FR-044` vào schema. Nửa `chung-cat-mot-nguon` thi công được ngay.
