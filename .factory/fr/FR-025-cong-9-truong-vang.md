# FR-025 — cổng 9 phải bắt cả khi `url_normalized` VẮNG, không chỉ khi khai sai

**Mức**: s6 (sửa `validate.py` — hợp đồng CI)
**Trạng thái**: MỞ — chờ người ký
**Ngày**: 2026-08-24
**Phát hiện từ**: FR-023 GĐ 3, lúc đối chiếu hai đường đọc

## Vấn đề — đo được, không phải suy diễn

`validate.py:233`:

```python
if fm.get("url") and fm.get("url_normalized"):
```

Điều kiện `and` làm cổng **ngủ** khi trường vắng hẳn. Nên:

- khai **sai** ⇒ bắt (đúng)
- **không khai** ⇒ im lặng (sai)

Và `--fix` chỉ sửa `word_count` (`validate.py:291-303`), không điền
`url_normalized`. Nên một trường **dẫn xuất** mà **không ai điền, không ai bắt**.

### Bằng chứng thật

`kb/docs/ai-agent-prototype-len-production.md` — bài thật đầu tiên của kho — có
`url` mà không có `url_normalized`, và `validate.py --strict` báo **0 lỗi**.

Hệ quả đo được lúc làm FR-023 GĐ 3: index tính lại bằng `normalize_url()` nên ra
`anthropic.com/engineering/multi-agent-research-system`, còn đường đĩa đọc lời
khai nên ra chuỗi rỗng. **Hai đường đọc cùng một bài ra hai khoá gộp khác nhau.**

### Vì sao đây là lỗi nghiệp vụ, không phải lỗi hình thức

M02 §2.3: `url_normalized` là **đơn vị đếm nguồn độc lập**. Ba bản phân tích cùng
một URL là **một** nguồn. Trường vắng ⇒ code gộp rơi về `|| ban.slug`
(`articles.mjs:73`, `home-pages/index.ts:437`) ⇒ mỗi bài thành một nguồn riêng.

Hai bài cùng nguồn mà đều thiếu trường thì **không gộp** — đúng cái §2.3 chống:
*"thêm `?utm_source=` là ra nguồn độc lập mới, và hệ số kiểm chứng chéo bị thổi
phồng bằng một thao tác copy link"*. Thiếu trường còn rẻ hơn thế: không cần
`?utm_source=`, chỉ cần **quên gõ một dòng**.

## Đổi gì

**1 · `--fix` điền `url_normalized`** khi có `url` mà thiếu trường. Cùng khuôn
`word_count`: `--fix` sửa được thứ là **phép tính**, không sửa thứ là **lời khai**.

**2 · Cổng 9 tách hai vế**:

```python
if fm.get("url"):
    dung = normalize_url(fm["url"])
    if not fm.get("url_normalized"):
        errs.append("có url mà thiếu url_normalized — chạy --fix")   # VẾ MỚI
    elif dung and fm["url_normalized"] != dung:
        errs.append(...)                                              # vế cũ
```

## Vì sao KHÔNG chọn cách khác

| Cách | Vì sao không |
|---|---|
| Đưa vào `required` của schema | Schema là FROZEN, 7 module bám vào (M02-R4 + deny S1). Và `url` cũng không required — bài không có URL thì không cần trường này |
| Để cảnh báo thay vì lỗi | Cảnh báo đã đủ để `--strict` exit 1, nên về hiệu lực CI là như nhau, mà lại yếu hơn ở chỗ khác: người đọc thấy WARN thì bỏ qua |
| Chỉ sửa `--fix`, không sửa cổng | `--fix` phải được **gọi** mới chạy. Đường ghi qua API gọi, nhưng người sửa file bằng editor thì không |

## Ảnh hưởng — đo trước khi sửa

| Kho | File có `url` | Thiếu `url_normalized` |
|---|---|---|
`kb/` | 3 | **0** |
`kb-mock/` | 14 | **0** |
`core/assets/` | 0 | 0 |

**Không file nào đỏ thêm.** Đây là lúc rẻ nhất để thêm cổng: nó bắt được lỗi
tương lai mà không đòi sửa dữ liệu hiện tại. Chờ thêm 20 bài nữa thì mỗi bài
thiếu trường là một lần phải quyết định "sửa hay nới cổng".

## Chặn bù

| # | Răng | Kiểm |
|---|---|---|
1 | Có `url` mà thiếu `url_normalized` ⇒ **lỗi**, không im lặng | pytest: gieo frontmatter thiếu trường |
2 | `--fix` điền đúng giá trị `normalize_url()` trả về | pytest: fix rồi so với hàm |
3 | Khai **sai** vẫn bắt như cũ (không hồi quy) | test cũ của cổng 9 phải còn xanh |
4 | Bài **không có** `url` ⇒ không đòi `url_normalized` | pytest: ca âm |

## Thi hành

Sau khi người ký. Kèm: 4 test pytest · worklog `fix` · không đụng schema
(không `FROZEN.lock`).
