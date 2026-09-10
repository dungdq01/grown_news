# FR-052 · Một bản ghi, NHIỀU hiện vật — chỗ M16 chưa có

- **mở**: 2026-09-02 · **người quyết**: chủ dự án
- **trạng thái**: **ĐÃ ĐÓNG** 2026-09-02 — **cách 1** (`media` thành mảng) · **thứ tự**: **d**
- **tầng bị chạm**: `frontmatter.schema.json` (**FROZEN**) hoặc `kho.schema.sql`
  (**FROZEN**) — chọn một, xem §3

---

## 0 · Tôi đã khai nợ này SAI ở s6 — đây là bản đo lại

`WL-01K9X2S6DONG` ghi nợ này là:

> *"bảng `media` có đúng BA cột (`sha256`, `byte`, `la_dan_xuat`), KHÔNG cột
> nào trỏ về `slug`. Nên cả *"liệt kê artifact của bài X"* — thứ UI cần —
> KHÔNG viết nổi testcase."*

**Hai chỗ sai:**

**a · `media` có BỐN cột**, không phải ba: `sha256` · `byte` · `la_dan_xuat` ·
`so_byte` (GENERATED).

**b · Chiều *"artifact của bài X"* THỰC RA trả lời được** — hiện vật nằm trong
`frontmatter.media` của chính bản ghi:

```sql
SELECT json_extract(frontmatter, '$.media') FROM bai_viet WHERE slug = ?
```

Không cần cột nào trỏ về `slug`. Nợ tôi khai **không tồn tại theo cách tôi tả**.

## 1 · Nợ THẬT, và nó sắc hơn

Đo `frontmatter.schema.json`:

```
media type: object
keys: ['sha256', 'mime', 'ten_goc', 'so_byte']
```

**`media` là MỘT OBJECT, không phải một MẢNG.** Một bản ghi chứa **đúng một**
hiện vật.

Và `M16_artifact` sinh **slide + giọng đọc + video** cho **một** bài
(`spec_overview §553`). Ba hiện vật, một chỗ để đặt.

⇒ **Không phải *"không truy vấn được"*. Là *"không LƯU được"*.** Bản thứ hai
ghi đè bản thứ nhất, hoặc M16 phải bịa ra một chỗ khác — và chỗ khác đó sẽ là
một hình dạng thứ hai cho cùng một sự thật.

## 2 · Vì sao nó cũng làm `M16-R1` yếu

`M16-R1` = *"không xoá byte"*. `M16 AC-2.2` (sửa ở s6) đã mở rộng thành *"cấm
cả xoá lẫn GHI ĐÈ"*, vì:

> sinh lại cùng loại artifact cho cùng bài **ghi đè bản cũ** thì phá byte y
> hệt, và **không có `unlink` nào để grep**.

Với `media` là một object, **ghi đè là đường mặc định** — không phải một lỗi ai
đó phải mắc, mà là thứ xảy ra khi làm đúng theo schema. `M16 AC-2.2` đang canh
một luật mà **cấu trúc đang đẩy ngược lại**.

## 3 · Hai đường, và cả hai chạm FROZEN

| | cách | được | mất |
|---|---|---|---|
| **1** | `frontmatter.media` thành **mảng** | hiện vật ở cùng chỗ với bản ghi; `tham_chieu_media` không đổi một dòng | đổi `frontmatter.schema.json` (**FROZEN**) ⇒ mọi bản ghi `thu-vien` hiện có phải di trú; `M09` đọc `media.sha256` ở nhiều chỗ |
| **2** | thêm bảng `hien_vat(slug, source_type, sha256, loai)` | không đụng schema frontmatter; nhiều hiện vật tự nhiên; hỏi được **cả hai chiều** | đổi `kho.schema.sql` (**FROZEN**); `tham_chieu_media` lên **6 nhánh**; và **hai nơi khai một sự thật** — đúng thứ `kho.schema.sql:165` cảnh báo |

⚠️ **Cách 2 vướng một câu đã viết trong chính DDL**:

> *"KHÔNG CỘT METADATA NÀO ở đây. `mime`, `ten_goc`, `so_byte` sống trong
> `frontmatter.media` … Hai nơi khai một sự thật sẽ lệch."*

Thêm bảng `hien_vat` là làm đúng điều đó — **trừ khi** bảng mới chỉ giữ **quan
hệ** (`slug` ↔ `sha256` ↔ `loai`) và **không** giữ metadata. Ranh giới đó mảnh,
và nó là chỗ FR này phải chốt rõ nếu chọn cách 2.

## 4 · Đo trước khi quyết — bao nhiêu bản ghi bị ảnh hưởng

Cách 1 đòi di trú. Phải đếm **trước**, không đoán:

```bash
python -c "
import sqlite3; c=sqlite3.connect('kb/_kho.sqlite')
print(c.execute(\"SELECT count(*) FROM ban_ghi WHERE json_extract(frontmatter,'\$.media') IS NOT NULL\").fetchone())"
```

Kho hiện rất nhỏ ⇒ di trú **rẻ HÔM NAY**, và đắt dần. Đây là lý do FR này
không nên hoãn lâu dù nó xếp thứ **d**.

## 5 · Cổng

| | vế | đỏ khi |
|---|---|---|
| **Z1** | một bản ghi giữ được **≥2** hiện vật | ghi hiện vật thứ hai mà cái thứ nhất **mất** |
| **Z2** | `M16 AC-2.2` mạnh lên | sinh lại cùng loại mà `sha256` cũ không còn |
| **Z3** | luật mồ côi vẫn phủ | một `sha256` được tham chiếu mà `tham_chieu_media` không thấy |
| **Z4** | không hai nơi khai một sự thật | `mime`/`ten_goc`/`so_byte` xuất hiện ở **hai** chỗ |
| **Z5** | di trú không mất bản ghi | đếm + hash trước/sau lệch |

⚠️ **Z3 là vế chết người.** `xuat_kho.py` xoá byte không có trong
`tham_chieu_media`. Bỏ sót một nhánh ⇒ **mỗi DELETE phá byte vĩnh viễn** — DDL
đã viết cả một đoạn để kể chuyện đó.

## 6 · Điều FR này KHÔNG làm

- **Không** chọn hộ cách 1 hay cách 2 — cả hai chạm FROZEN và cả hai có một
  cái giá thật.
- **Không** ký `FROZEN.lock`.
- **Không** thi công `M16_artifact`. FR này chỉ mở **chỗ để đặt hiện vật**;
  sinh slide/giọng đọc/video là việc của `s8` cho M16.
- **Không** sửa `WL-01K9X2S6DONG`. Worklog là biên ghi — sai thì **đính chính ở
  bản mới**, không viết lại bản cũ. §0 của FR này là bản đính chính.

---

## 7 · Đóng — và phạm vi THẬT lớn hơn `§4` khai

**Thi công**: `T09-8`, 2026-09-02. `npm test` **exit 0 (84 file)** ·
`pytest` **45 passed** · `check_media_mang.py` xanh.

### `§4` đúng một nửa — đã báo trước khi sửa

| `§4` khai | đo được |
|---|---|
| *"di trú rẻ vì kho nhỏ"* | ✅ **1/3** bản ghi có `media` |
| *(không khai)* | ⚠️ **12 chỗ mã** + **41 chỗ fixture/test** |

Hai con số tôi từng ghi **sai**, sửa lại ở đây: `gn.js` dư **19.918 byte**
(không phải 86 — số đó từ một plan cũ), và `media` có **bốn** cột không phải ba.

### Hai chỗ CHẾT NGƯỜI — bịt trước khi đổi schema

`xuat_kho.py:182` + `dung_lai_db.py:81` đều là `isinstance(m, dict)`. Với mảng,
cả hai trả `False` ⇒ tập con trỏ **rỗng** ⇒ `xuat_kho.py:194-199` coi **mọi**
file trong `kb/_media/` là mồ côi và **xoá sạch**. Và nó chạy **tự động sau mỗi
phép ghi** (`banXuat()` tại `dungchung.mjs:375`).

`check_media_mang.py` dựng **trước** khi sửa gì, và nó đỏ đúng **3** chỗ.

### Ba bẫy IM LẶNG cùng một hình dạng

`articles.mjs` · `render/data.mjs` · `cong-module.mjs` — cả ba **chủ động chặn
mảng** (`!Array.isArray(m) ? m : null`). Quên bất kỳ cái nào ⇒ `media` thành
**`null` im lặng**: không lỗi, không cảnh báo, hiện vật biến mất khỏi API/render.

### Một bẫy KHÁC HẠNG

`dungchung.mjs:132` đọc `media.properties.mime` để dựng `DANG_MIME`. Sau khi
`mime` xuống `items`, đường đó là `undefined`, và **`new RegExp(undefined)` khớp
MỌI chuỗi** ⇒ phép kiểm mime **biến mất** mà mọi test vẫn xanh.

⚠️ Đây là bẫy tệ nhất trong bốn: ba cái kia làm **dữ liệu** mất (thấy được);
cái này làm **một phép kiểm** mất (không thấy được).

### Hai tầng khác nhau, CÓ CHỦ Ý

Mọi hàm **ĐỌC** chấp nhận **cả hai** hình dạng; **SCHEMA** chỉ ép mảng cho bản
ghi **MỚI**.

Nếu đọc cũng ép mảng thì đổi schema thành một **ngày cờ**: mọi bản ghi phải di
trú **cùng lúc** với mọi đoạn mã, và bất kỳ thứ tự nào cũng có một khoảng thời
gian hệ thống **từ chối dữ liệu của chính nó**.

Và có một ca test khẳng định chiều ngược: hình dạng cũ **BỊ từ chối** khi ghi
mới — để nó không sống mãi.
