# FR-071 — nạp lại một việc đã có trả `200`, không `201`

- **mở**: 2026-09-07 · **người quyết**: chờ chủ dự án · **trạng thái**:
  **ĐÃ DUYỆT** — chủ dự án 2026-09-07 (*"1, 2 và 3: OK"*) · **ĐÃ THI CÔNG**
- **artifact chạm (FROZEN)**: `06_modules/M12_chungcat/spec.md` §5
  — **đính chính**: FR này viết "§7" khi mở. Đo lúc thi công: §7 là
  *Engine cắm rút được*; chỗ khai hàng đợi và idempotency là **§5**.
  Câu mới nằm ở `§5.0a`, kèm `AC-5.5`.
- **nợ gốc**: ô backlog M12 dòng 701, mở 2026-09-03

## 0 · Điều đo được

Nạp cùng một `ulid` lần thứ hai vào `POST :8790/job`:

```
lần 1  → 201  {viec_id, model, khu_vuc}      hàng đợi: 1 việc
lần 2  → 201  {viec_id CŨ, model, khu_vuc}   hàng đợi: 1 việc   ← vẫn đúng 1
```

**Phép idempotent ĐÚNG.** `vong.HangDoi.nap()` thấy file đã có thì trả `ulid`
và không ghi gì (`AC-5.1`). Không có việc thứ hai, không có payload bị đè.

Hỏng ở chỗ khác: `201 Created` là một câu **nói dối** — nó khai *"vừa tạo"*
trong khi không có gì được tạo. Và `nap()` trả `ulid` cho **cả hai** đường, nên
cửa **không có cách nào** biết mình vừa ở đường nào để nói khác đi.

## 1 · Vì sao nó không phải chuyện thẩm mỹ HTTP

`web/` là client duy nhất, và nó dựng màn theo mã trả về. Một `201` cho ca
*"việc này đã có"* làm màn báo **"đã tạo việc"** hai lần cho một việc — rồi
người dùng bấm lại, vì họ tưởng lần đầu trượt.

Cái vòng ấy tự khép: mã trả về sai → màn nói sai → người bấm lại → lại `201`.
Không có bước nào trong vòng đó báo lỗi.

## 2 · Hình dạng đề xuất

### 2.1 · `spec §5` thêm một câu về mã trả về

`§5` hôm nay khai `POST /job` nhưng **không khai mã trả về cho ca idempotent** —
nên đây là chỗ **spec thiếu**, không phải mã sai. Thêm:

```
POST /job  ·  201 Created  — việc vừa được xếp
              200 OK       — ULID này ĐÃ có việc; thân trả `da_co: true`
                             kèm `viec_id` cũ. Hàng đợi không đổi.
```

### 2.2 · `nap()` phải NÓI ĐƯỢC nó đã làm gì

Hôm nay nó trả `str`. Đổi thành `(ulid, da_co: bool)` — hoặc một hàm
`da_co(ulid)` riêng.

**Chọn giá trị trả về, không chọn hàm tra riêng.** Một hàm tra riêng là hai lời
gọi cho một câu hỏi, và giữa hai lời gọi ấy có một khoảng để trạng thái đổi —
đúng lớp lỗi kiểm-rồi-mới-làm (`TOCTOU`) mà `_ghi_nguyen_tu` được viết ra để
tránh. Sự thật *"tôi vừa tạo hay không"* chỉ bên GHI biết chắc.

### 2.3 · `web/` đọc `da_co` và nói đúng — **KHÔNG thi công, có lý do**

Đề xuất khi mở FR: `200 + da_co` ⇒ *"Việc này đã có — đang mở lại"*.

**Đo lúc thi công 2026-09-07: không client nào gửi `ulid`.** `api.py::do_POST`
làm `b.get("ulid") or uuid.uuid4().hex`, và `grep` trên toàn bộ
`web/plugins/**/*.ts` + `web/api/tho-cua.mjs` không có một chỗ nào đặt trường
ấy. ⇒ Từ FE, `da_co` **không thể** là `true`.

Nên nhánh FE ấy sẽ là mã chết — một nhánh không đường nào tới, không cổng nào
đo được, và người đọc sau tưởng nó đang chạy. Hợp đồng ở CỬA vẫn đúng và đã
chứng minh trên thợ sống; FE sẽ đọc `da_co` **khi** có client thật gửi `ulid`
(vd một phép thử lại có định danh). Ô backlog giữ câu đó.

## 3 · KHÔNG đổi

- **Phép idempotent giữ nguyên hoàn toàn.** FR này chỉ đổi thứ cửa **NÓI**, không
  đổi thứ cửa **LÀM**. `AC-5.1` không bị chạm.
- `4xx` của mọi phép chặn giữ nguyên mã và thứ tự (`§4.0b`).
- `viec_id` trả về vẫn là ULID cũ — client dùng nó để mở đúng việc.

## 4 · Bằng chứng đóng

- một cổng mới trong `chungcat/tests/`: nạp hai lần cùng ULID ⇒ **`201` rồi
  `200`**, hàng đợi vẫn đúng **một** việc, và lần hai mang `da_co: true`
- vế chống-đỏ-oan: nạp hai ULID **khác nhau** ⇒ `201` cả hai lần
- `chungcat/tests/check_hang_doi_nguyen_tu.py` giữ xanh — phép nguyên tử không
  được đổi
- `<freeze-check> --ký` sau khi FR duyệt

## 5 · Chỗ cần chủ dự án chốt

1. **`200 + da_co: true`** — hay bạn muốn `409 Conflict`? Tôi đề xuất `200`:
   nạp lại không phải một xung đột, nó là một phép idempotent **thành công**.
   `409` sẽ đẩy `web/` vào nhánh lỗi cho một chuyện không sai.
2. Cổng mới thuộc **đơn vị test nào** — cùng câu hỏi với ô `T12-12`/`T12-8` đang
   chờ bạn chọn ở G6C. Một lần trả lời cho cả ba.

---

## 6 · Đã thi công 2026-09-07 — bằng chứng

| | |
|---|---|
| spec | `§5.0a` + `AC-5.5` · `FROZEN.lock` ký lại |
| hàng đợi | `vong.HangDoi.nap()` → `(ulid, da_co)` |
| cửa | `api.py::do_POST` → `200 if da_co else 201`, thân thêm `da_co` |
| cổng MỚI | `chungcat/tests/check_nap_lai_tra_200.py` — 7 vế, **ĐỎ trước** |
| cổng CŨ | 6 file gọi `nap()` cập nhật (`T12-28` khai chủ) |

**Chạy thật trên thợ đang sống** (`loai: thu-hong`, không tiêu token):

```
lan 1 → 201
lan 2 → 200
{"viec_id": "01K9ZLIVE8749158000000000", …, "da_co": true}
```

Một chỗ đã sai và đáng ghi: tôi vá **năm** file gọi `nap()` rồi tuyên xanh, còn
file thứ **sáu** (`check_tran_thu_lai.py`) thì bỏ sót — nó lộ ra vì suite chạy
đỏ, không vì tôi kiểm lại. Đếm bằng `grep` trên toàn bộ thư mục ngay từ đầu thì
không mất nhịp đó.
