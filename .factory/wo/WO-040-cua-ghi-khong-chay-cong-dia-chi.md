# WO-040 — cửa ghi KHÔNG chạy cổng địa chỉ, nên `citations_*` vẫn là lời khai ở đúng chỗ bài vào kho

- **loại**: bug
- **module**: **M08_api** (`web/api/**`) — một module, không frozen ⇒ PATCH
- **mức**: **hard** — kho nhận bài với số trích dẫn tự khai; đây là G-7, lý do C1 tồn tại

## Repro

Copy đúng bản ghi thật vào thư mục tạm rồi gọi validate **y như cửa ghi gọi**:

```bash
T=$(mktemp -d); cp kb/docs/xgboost-taylor-bac-hai.md "$T/x.md"
cp kb/concepts.yaml kb/categories.yaml "$T/"
python core/src/source_distiller/validate.py "$T/x.md" --strict \
  --concepts "$T/concepts.yaml" --categories "$T/categories.yaml"
# -> 0 lỗi

python core/src/source_distiller/validate.py "$T/x.md" --strict \
  --concepts "$T/concepts.yaml" --categories "$T/categories.yaml" --kho kb
# -> 3 lỗi
```

Đo 2026-09-01:

| gọi như | kết quả |
|---|---|
| **cửa ghi hôm nay** | **0 lỗi** — 15 địa chỉ không phân giải được + khai `3/3` sai vẫn qua sạch |
| thêm `--kho kb` | **3 lỗi** |

Và nó đã là **một test ĐỎ thật**: `web/test/api-crud.test.js` §7
*"validate --strict cả kho tạm exit 0 sau đủ vòng CRUD"*.

## Nguyên nhân

`dungchung.mjs:654` gọi `chayValidate(tmpFile, catalog, ["--fix"])` — **tmpFile
là một FILE**. Sau C1, cổng địa chỉ tự bật **chỉ khi target là THƯ MỤC**
(`validate.py` — phép đoán gốc kho đã bị bỏ vì nó tự bật theo bố cục thư mục
xung quanh). Nên trên đường ghi cổng **tắt**.

> Hệ tự mâu thuẫn: **cửa ghi không sinh ra thứ mà phép kiểm thư mục đòi.** Bài
> đi vào qua API (cổng tắt, `citations_*` không được tính), rồi `ci.yml:43` và
> `api-crud` §7 validate cả thư mục (cổng bật) ⇒ đỏ. Không phải một bên sai —
> hai bên đo hai luật.

`§7` (mục phải có địa chỉ **máy hiểu**) vẫn chạy ở cửa ghi, nên `G-6` đóng một
phần. `G-7` thì **không đóng ở đó** — và đó là nửa quan trọng hơn, vì cửa ghi là
nơi bài **thật sự** vào kho.

## Kỳ vọng

Cửa ghi tính `citations_sampled` / `citations_verified` / `unverifiable_citations`
từ nội dung, phân giải vào **kho đang hoạt động**, trước khi COMMIT.

## Vì sao đáng sửa

`B-A6` nói *"do MÁY tính, không do người khai"*. Nếu chỉ `validate kb/` cưỡng
chế còn cửa ghi thì không, thì luật chỉ đúng với bài đã nằm trong kho — mọi bài
**mới** vào bằng lời khai, rồi lần validate sau mới phát hiện. Cổng phát hiện
muộn hơn cửa ghi thì kho đã nhiễm rồi.

## Điều WO này KHÔNG làm

- **Không** gõ cứng `kb/`. Kho hoạt động là `KB = process.env.KB_DIR ?? GOC/kb`
  (`dungchung.mjs:37`) — gõ cứng là mọi test chạy trên kho tạm sẽ phân giải vào
  kho THẬT của chủ dự án.
- **Không** sửa fixture `web/test/_api.mjs`. Fixture dùng `[nguon.py:10-40]`
  (nhận dạng được, không phân giải được) và nó đang **nói đúng sự thật** — sửa
  nó là làm test hết nói lên điều nó vừa phát hiện.
- **Không** đổi `validate.py`. C1 vừa đóng và cổng của nó xanh; lỗi ở phía gọi.
- **Không** di trú `kb/` — đó là `T02-4`, boundary M02.
