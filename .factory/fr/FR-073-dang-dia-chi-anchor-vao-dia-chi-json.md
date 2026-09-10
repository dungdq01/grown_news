# FR-073 — Dạng địa chỉ `file#anchor` vào `core/assets/dia-chi.json` (M01)

> ⚠️ **Đổi số `FR-071` → `FR-073`, 2026-09-07.** Bản này tạo lúc **02:03**; team
> M12 tạo một `FR-071` khác lúc **09:48** (*nạp lại một việc trả 200, không 201*),
> và bản của họ **đã duyệt + đã thi công**, được `M12/spec.md` (**FROZEN**) ·
> `M12/backlog.md` · 2 task file dẫn. Đổi số bản **ít tham chiếu ngoài hơn** —
> cùng cách đã xử `FR-054`/`FR-055`. Nội dung không đổi.
>
> ⚠️ File gốc bị **tôi tự xoá** trong lúc đổi số (`f"FR-{71}-"` không khớp
> `"FR-071-"` nên script ghi rồi `unlink` chính nó). Dựng lại từ nội dung viết
> cùng phiên. Bài học ghi ở `FR-072` đầu file.

- **mở**: 2026-09-07 · **người quyết**: chủ dự án — *"2. ok"* (duyệt mở) · **trạng thái**: **ĐÃ DUYỆT MỞ**, chờ áp
- **artifact chạm**: `core/assets/dia-chi.json` — **không** trong `FROZEN.lock`
  (đo: grep ⇒ 0) nhưng là **bảng khai của `B-A5`** mà `validate.py` · M13 · M14
  cùng đọc ⇒ đi FR, không sửa tay
- **artifact liên đới**: `06_modules/M01_core/spec.md` (nếu §AC nhắc danh sách dạng) ·
  `06_modules/M03_web/backlog.md:7` (ô C3, mở 2026-09-02, **chưa có task**) ·
  `06_modules/M14_chatbot/data_flow.md §2` (*"anchor phân giải qua dia-chi.json"*)
- **nguồn**: `01_research/m13-truy-hoi-dich-vu-nen.md §4` · `FR-072 §1.1`
- **phụ thuộc**: **không** — nhưng dạng này chỉ **bấm được** khi **C3** sinh `id` trên heading (§3)

## 0 · Vì sao phải FR — một câu sai đang đứng trong hai spec G6A xanh

```
dia-chi.json  dang = slug · slug-trang · slug-moc · file-dong · muc
                                                     ⇒ KHÔNG dạng nào chứa '#'
M13 spec §2       anchor = ASCII-fold; địa chỉ bấm được là file#anchor
M14 data_flow §2  "citations[].anchor — phân giải được qua core/assets/dia-chi.json"
                                                     ⇒ SAI hôm nay
```

M13 sinh `file#anchor`; M14 hứa phân giải nó qua bảng khai; bảng khai **không biết
dạng đó**. Hai spec đều G6A xanh vì phép thử s6 hỏi *"viết được testcase không"*,
không hỏi *"bảng khai có dạng này không"*.

## 1 · Hình dạng chốt — MỘT dòng vào `dang[]`

```json
{
  "ten": "file-anchor",
  "mau": "^([A-Za-z0-9._/-]+\\.md)#([a-z0-9]+(?:-[a-z0-9]+)*)$",
  "phan_giai": "có file kho/<đường dẫn> ∧ file có heading mà ASCII-fold (luật slugGoiY: NFD → bỏ dấu → đ→d → [^a-z0-9]+→- → cắt 60) ra ĐÚNG anchor này",
  "manh": "day_du",
  "vi_du": "[docs/xgboost-taylor-bac-hai.md#vi-sao-bac-hai]",
  "$vi_sao": "M13 chunk theo ##/### và sinh anchor bằng cùng luật slugGoiY của FE (decisions.md 2026-09-01 (1)). Đây là dạng địa chỉ chatbot trích; không khai thì B-A5 không phủ, và M14 'phân giải qua dia-chi.json' là câu sai.",
  "$dedup": "hai heading fold về cùng anchor ⇒ hậu tố -1, -2 (github-slugger: vòng while, state theo FILE, reset mỗi file — ref-impl §180). Renderer và indexer PHẢI cùng đi qua một object có state, theo cùng thứ tự heading."
}
```

Ba lựa chọn đã cân, ghi ra để không bàn lại:

| | vì sao không |
|---|---|
| anchor unicode (`#hướng-dẫn`) | `decisions.md` 2026-09-01 (1): *"kho đã chọn rồi — 0/5 tên file ngoài ASCII"*; đổi là hai luật slug trong một hệ |
| hậu tố `_1` (Python-Markdown `toc.py`) | lệch `-1` của github-slugger; file kho đang theo lối ascii-dash (`ref-impl §189`) |
| ghép vào `file-dong` (`file.md:84-121#anchor`) | hai neo trong một địa chỉ = hai thứ có thể lệch nhau cho cùng một chỗ |

## 2 · Cổng — `validate.py` + M13 + M14 cùng một bảng

| # | bắt gì | đỏ khi |
|---|---|---|
| A1 | `[docs/x.md#vi-sao-bac-hai]` **nhận dạng** được (đếm vào `citations_sampled`) | không khớp dạng nào |
| A2 | **phân giải**: file tồn tại **và** một heading của nó fold ra đúng anchor | anchor không thuộc heading nào ⇒ `citations_verified` không tăng |
| A3 | luật fold trong `phan_giai` **là** `slugGoiY` — fixture 50 heading thật cho cùng kết quả ở `validate.py` (Python) · M13 (`anchor_py`) · FE (`slugGoiY`) | **ba bản** lệch một heading |
| A4 | dedup: hai heading trùng ⇒ `-1`/`-2` **ổn định** qua hai lần dựng | dựng lại ra hậu tố khác |

**A3 là cổng đắt nhất và không thuộc riêng M01** — bản thứ ba (`id` trong HTML
render) là **C3**, việc của M03. Ô `M03/backlog.md:7` đã đòi đúng *"cổng đối chiếu
BA bản"*, mở 2026-09-02, chưa có task.

## 3 · Điều FR này KHÔNG làm — và nợ để hở

- **Không sinh `id` trên heading** — đó là **C3** (M03). Cho tới đó dạng này
  **nhận dạng được, phân giải được trên file**, nhưng **bấm không tới đâu** trên
  web (`M13/ui_flow §4`: *"địa chỉ là chữ, không phải link"*). Khai dạng trước C3
  là đúng thứ tự: bảng khai không nên đợi UI.
- **Không** đổi bốn dạng cũ.
- **Không** quyết `#anchor` cho heading **trong hiện vật** — transcript không có
  heading; PDF chưa có text. Neo của chúng là `slug:t=` và (sau) `slug:p.N`, đã có.

## 4 · Đo được hôm nay

```
core/assets/dia-chi.json  mẫu chứa '#'                     0
web/site/index.html  <h2>/<h3>: 15 · có id: 3 (đều id hộp thoại)
07_plan/M03_web/tasks  task C3                              0
```
