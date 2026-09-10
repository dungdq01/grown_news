# FR-021 — Sửa/xoá nhãn CÓ ĐIỀU KIỆN: nắn M02-R3 theo đúng thứ nó bảo vệ

mở_bởi: người dùng, 2026-08-19 ("tôi muốn màn này chính là màn quản lý Thêm sửa xóa các category và concept")
tới: s6 (`06_modules/M02_kb/rules.md` M02-R3 — FROZEN)
mức: nắn một vế của rule bất biến cấp module; KHÔNG đổi bề mặt (S3+S2 giữ nguyên)
trạng_thái: **DUYỆT** 2026-08-19 — người dùng chốt phạm vi qua AskUserQuestion: *"Chỉ cho xoá nhãn 0 bài + sửa nhãn hiển thị"*

## Vấn đề

FR-019 (duyệt sáng nay) mở `POST` cho hai danh mục, và tôi viết vào M02-R3:

> *"hoặc một đường ghi vào hai file đó mà không đòi người khai nhãn, **hoặc cho
> sửa/xoá mục đã có**"*

Người dùng muốn màn Danh mục làm đủ **thêm/sửa/xoá**. Vế thứ ba trên chặn thẳng.

## M02-R3 đang chặn RỘNG hơn thứ nó bảo vệ

Lý do của M02-R3 (nguyên văn, không đổi):

> *"Danh mục đóng chỉ có giá trị khi cùng một ý có cùng một tên. Cho máy thêm thì
> sau 60 bài có rag / RAG / retrieval-augmented / rag-pipeline — bốn tên một thứ,
> bộ lọc ra bốn tập rời nhau."*

Cái nó bảo vệ là **`id`** — thứ bài viết trỏ vào, thứ bộ lọc so khớp. Đo được ở
`validate.py:194-198`:

```python
for c in fm.get("concepts") or []:
    if c not in concepts:
        errs.append(f"concepts · '{c}' không có trong concepts.yaml")
```

Nó so `id`. **`label_vi` và `gom` không xuất hiện trong bất kỳ phép kiểm nào** —
chúng chỉ để hiển thị trên web (`docDanhMucFile` đọc, sidebar và chip hiện).

Nên vế "cấm sửa" đang chặn cả:
- **đổi `id`** → vỡ thật: bài cũ trỏ vào nhãn không còn, `validate` báo lỗi, và
  mọi lần ghi bài đó sau này bị chặn. **PHẢI giữ cấm.**
- **sửa `label_vi`** → sửa một lỗi chính tả trên nhãn tiếng Việt. Không file nào
  trỏ vào nó. Chặn cái này không bảo vệ gì.

Tương tự với xoá. Đo trên `kb-mock/`: **11/22 khái niệm và 1/6 chủ đề chưa bài nào
dùng**. Xoá một nhãn `đếm = 0` không có file nào trỏ tới ⇒ không vỡ gì. Xoá nhãn
`đếm > 0` thì vỡ đúng như trên.

## Phạm vi

### Được mở

| Endpoint | Cho phép |
|---|---|
`PATCH /api/concepts/:id` · `PATCH /api/categories/:id` | sửa `label_vi`, `gom`; thêm vào `aliases` |
`DELETE /api/concepts/:id` · `DELETE /api/categories/:id` | xoá **chỉ khi** không bài nào dùng |

### KHÔNG mở — vẫn cấm

- **Đổi `id`.** `id` trong body → **400**. Muốn đổi tên thì thêm nhãn mới + sửa
  từng bài + xoá nhãn cũ — ba việc, mỗi việc có cổng riêng, không gộp thành một
  request đổi N file.
- **Xoá `aliases` đã có.** Alias là đường tra cứu; gỡ nó làm mất một cách gọi mà
  người khác có thể đang dùng. Chỉ thêm.
- **Xoá nhãn đang có bài dùng.** `đếm > 0` → **409 kèm số bài**. Server **tự đếm**,
  không tin client: một client sai (hoặc cố tình) gửi `dem=0` thì kho vỡ.

## Đổi thì

| File | Đổi gì | Frozen? |
|---|---|---|
`06_modules/M02_kb/rules.md` | M02-R3: vế 3 từ *"cho sửa/xoá mục đã có"* → *"cho đổi `id`, xoá `aliases`, hoặc xoá nhãn đang có bài dùng"* | **CÓ** |
`web/api/danhmuc.mjs` · `router.mjs` | thêm 4 route | không |
`web/api/dungchung.mjs` | `suaTrongDanhMuc` · `xoaKhoiDanhMuc` | không |
`web/test/danh-muc-them.test.js` | phép kiểm *"PUT/PATCH/DELETE → 404"* phải sửa — giờ chỉ `PUT` là 404 | không |
`kb/concepts.yaml` · `categories.yaml` · schema enum | dữ liệu, ký lại `FROZEN.lock` | **CÓ** |

**Bề mặt cưỡng chế KHÔNG đổi**: vẫn `S3 + S2` như FR-019 đặt. FR này chỉ nắn *nội
dung* vế cấm, không đổi *chỗ* cưỡng chế.

### Mất gì — nói thẳng

**`PUT` vẫn 404 nhưng `PATCH` thì không.** FR-019 dùng "cả ba method đều 404" làm
một phép kiểm gọn. Giờ phải phân biệt: `PUT` = thay toàn bộ (cho đổi `id`) ⇒ vẫn
404; `PATCH` = sửa một phần ⇒ mở. Ranh giới mảnh hơn, và người đọc test phải hiểu
vì sao hai method na ná nhau lại khác nhau. Đó là chi phí thật của FR này.

**Một nhãn xoá được là một nhãn có thể xoá SAI.** Người bấm xoá `feature-store` vì
tưởng không cần, tuần sau có bài về feature store thì phải thêm lại và đi lại
đường bằng chứng ≥2 bài. Không có thùng rác cho nhãn (khác bài — bài có
`_recycle/`). Bù: nhật ký `kb/_nhat-ky-danh-muc.md` ghi cả dòng xoá, nên biết
chính xác nhãn nào mất và khi nào.

## Chặn bù — 5 răng, kiểm được bằng máy

| # | Răng | Kiểm |
|---|---|---|
1 | `id` trong body `PATCH` → **400** | POST body có `id` |
2 | `PATCH` không có trường nào sửa được → **422** (không im lặng thành no-op) | body `{}` |
3 | `DELETE` nhãn đang dùng → **409 kèm số bài**; server tự đếm bằng `quetKho`+`docBai` | xoá nhãn 2 bài |
4 | `PUT` vẫn **404** — thay toàn bộ là đường đổi `id` | `PUT` |
5 | Mọi thao tác: `check_danh_muc.py` xanh sau đó, rollback nếu đỏ; nhật ký có dòng | diff file |

`aliases` của mục KHÔNG bị sửa phải nguyên văn từng byte — cùng phép kiểm FR-019
đã có.

## Thi hành

Kèm worklog `amend-frozen`, phạm vi `M02_kb + M08_api + M03_web`. Ký lại
`FROZEN.lock` **sau** khi sửa `rules.md`.
