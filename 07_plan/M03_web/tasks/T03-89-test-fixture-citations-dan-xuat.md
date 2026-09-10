# T03-89 — fixture của harness API phải tự nhất quán sau B-A6 (đơn vị TEST)

> Nửa thứ hai của `WO-040`. `T08-18` sửa CỬA GHI, nhưng `api-crud.test.js` §7
> vẫn đỏ vì bốn bản ghi seed **không đi qua cửa ghi**: `_api.mjs:159-173` ghi
> thẳng file `.md` rồi `napLaiDb()` nạp vào DB (đúng thiết kế FR-034 — file là
> export, DB là chân lý).
>
> Thân fixture (`_api.mjs:43-46`) mang bốn địa chỉ `[nguon.py:10-40]` ·
> `[nguon.md:1-2]` — **nhận dạng được, không phân giải được** (hai file đó không
> có trong kho tạm). `grep unverifiable_citations _api.mjs` ⇒ **0**. Nên §7c bắn.
>
> **KHÔNG sửa địa chỉ trong fixture.** Chúng đang nói đúng sự thật, và một
> fixture mà mọi địa chỉ đều phân giải được sẽ **không bao giờ** đi qua nhánh
> "không phân giải được" — tức bỏ mất đúng ca C1 vừa dựng.
>
> **Không gõ tay `unverifiable_citations: true` vào fixture** — đó là số DẪN
> XUẤT, và gõ tay là đúng thứ `B-A6` cấm. Đường đúng: nơi GIEO dữ liệu là nơi
> TÍNH nó, cùng bài học đã ghi ở `sinh_kb_mock.py:65` cho `word_count`.

phạm_vi_ghi:
  - web/test/_api.mjs

verifiability: hard
tiêu_chí:
  - AC1: `api-crud.test.js` §7 XANH — kho tạm qua `validate --strict` sau đủ vòng CRUD
    cmd: node web/test/api-crud.test.js
  - AC2: fixture KHÔNG gõ tay `unverifiable_citations` — grep ra 0 dòng gán tay;
      giá trị đến từ `validate --fix` chạy trên kho tạm
    cmd: node web/test/api-crud.test.js
  - AC3: fixture VẪN giữ địa chỉ không phân giải được (nhánh đó còn được đi qua)
    cmd: node web/test/api-crud.test.js
  - AC4: harness dùng chung không hỏng — mọi test dựa vào `dungKho()` vẫn xanh
    cmd: node web/test/api-status.test.js && node web/test/api-recycle.test.js && node web/test/vong-doi-bai.test.js && node web/test/thu-vien.test.js
phụ_thuộc: T08-18
