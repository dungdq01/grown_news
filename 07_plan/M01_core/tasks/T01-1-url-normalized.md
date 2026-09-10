# T01-1 — hàm chuẩn hoá URL + test

phạm_vi_ghi:
  - core/src/source_distiller/validate.py
verifiability: hard
tiêu_chí:
  - AC1: hai URL khác nhau chỉ ở tracking param cho cùng url_normalized
    cmd: python -m pytest core/tests/ -k url_normalized
  - AC2: 19 test cũ vẫn xanh
    cmd: python -m pytest core/tests -q
  - AC3: thêm cổng thì thêm test — tỉ lệ không tụt
    cmd: python core/tests/check_rule_surfaces.py

## Task này thuộc M01, không phải M02

Nó ghi vào `core/src/source_distiller/validate.py` — file **M01 sở hữu**
(`project_map.modules.M01_core.be = core/**`).

Luật gốc: không ai sở hữu thứ dùng để đánh giá mình, và hệ quả là **chủ file làm
việc trên file đó**. AC thì thuộc spec M02 (`url_normalized` là trường của
`Analysis`), nhưng *việc* thuộc M01.

s7 lượt đầu tôi đặt nó dưới M02 — `check_g6b.py` bắt được: phạm vi ghi ngoài
boundary module.

## Nợ khai ở s6

AC-2.3.1 của spec M02 hiện là `soft` vì **chưa có hàm nào** chuẩn hoá URL trong
`core/`. Trường `url_normalized` hiện do người điền tay.

Task này biến nó thành `hard`.

## Chuẩn hoá gồm

| Việc | Ví dụ |
|---|---|
| bỏ tracking param | `?utm_source=x` → bỏ |
| bỏ `www.` | `www.github.com` → `github.com` |
| youtu.be → youtube.com | `youtu.be/X` → `youtube.com/watch?v=X` |
| arxiv pdf → abs | `arxiv.org/pdf/X` → `arxiv.org/abs/X` |

## Vì sao quan trọng hơn vẻ ngoài

`url_normalized` là **đơn vị đếm nguồn độc lập**. Đếm theo `url` thô thì thêm
`?utm_source=` là ra "nguồn độc lập" mới — và hệ số kiểm chứng chéo bị thổi phồng
bằng một thao tác copy link.

Hệ số đó đi thẳng vào `priority`, và `priority` quyết định sinh skill hay không.

## Lưu ý phạm vi ghi

`validate.py` **không** trong deny list, nhưng nó là nhà của 8 cổng. Chạm vào là
chạm vào M01 — `M01-R3` đòi thêm cổng phải thêm test (AC3).
