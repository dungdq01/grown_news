# T08-26 — Bảng `cai_dat` + `O_SUA_DUOC` + cửa ghi (đơn vị CODE)

> `proposal-3 §12` + `ADR-07` + `M18 §10` (13 AC). Đây là **tầng thứ ba** của
> `ADR-07`: giá trị ô ở DB, `chu` đổi được qua web.
>
> Hai tầng trên **đã có**: bất biến (DDL `CHECK` cho `vai`, `duyet-bai` ngoài
> `QUYEN`) và schema ô (`QUYEN` trong mã).

## Vì sao đơn vị này đóng một cổng đang ĐỎ

`M18-R5` và `M18-R6` (thêm ở s6, 2026-09-03) trỏ
`cd web && node test/cai-dat.test.js` — **file chưa tồn tại**, nên
`check_rule_surfaces` đỏ. Theo `R3`, hai rule đó **hiện là `soft`** dù khai `S3`.

⇒ Đơn vị này làm chúng thành `S3` thật.

## Phạm vi

phạm_vi_ghi:
  - web/api/loi.schema.sql        # bảng `cai_dat`
  - web/api/dungchung.mjs         # `O_SUA_DUOC` + `datCaiDat` + `docCaiDat` + `gieoLaiCaiDat`

**Không** chạm: `web/test/**` (đơn vị TEST `T08-17b` — `R1`) · `router.mjs`
(chưa đấu route — màn admin chưa có, `s5` bỏ qua) · `QUYEN` (đã đủ).

## Quyết định

**a · `O_SUA_DUOC` là ALLOWLIST, và nó KHÁC `QUYEN`.**

| bảng | trả lời |
|---|---|
| `QUYEN` | *"`viec` này vai nào làm được"* |
| `O_SUA_DUOC` | *"ô nào bật/tắt được từ web"* |

Hai câu khác nhau. Gộp chúng là làm mọi `viec` thành sửa-được — kể cả
`sua-cai-dat`, tức `chu` tự khoá được (`AC-10.6`).

**b · `sua-cai-dat` KHÔNG trong `O_SUA_DUOC`** — `AC-10.6`. `chu` tắt nó rồi thì
không ai bật lại được.

**c · `gia_tri` là `INTEGER CHECK (gia_tri IN (0,1))`** — boolean ở tầng DDL,
không ở tầng handler. `AC-10.7`: không ô nào được diễn giải thành đường
dẫn/lệnh/URL/mã (`CVE-2024-3028`: một trường setting ⇒ **xoá được file SQLite**).

**d · Cửa ghi nhận `(khoa, gia_tri)`, KHÔNG nhận object** — `AC-10.5`.
`CVE-2026-31942`: `{ userId: req.user.id, ...body }` ⇒ LibreChat mất API key
**mọi người**.

**e · `gieoLaiCaiDat()` chạy lúc mở DB.** Khoá ngoài `O_SUA_DUOC` bị **xoá**;
khoá thiếu được gieo mặc định; khoá **đã đổi có chủ ý giữ nguyên giá trị**
(`AC-10.12` *edge 2* — một cài đặt *"đè hết về mặc định"* sẽ xoá mọi thay đổi
của người dùng mỗi lần restart).

**f · `duocLam` đọc `cai_dat` khi ô đó tồn tại, ngược lại đọc `QUYEN`.**
Đây là chỗ tầng ba **thay** tầng hai cho đúng những ô đã khai — và **chỉ**
những ô đó.

⚠️ Vế này là chỗ dễ sai nhất của cả đơn vị: nếu `duocLam` đọc `cai_dat`
**trước** rồi rơi về `QUYEN` khi không có hàng, thì một hàng `cai_dat` bịa ra
cho một `viec` **không** trong `O_SUA_DUOC` sẽ **thắng** `QUYEN`. Phải lọc theo
`O_SUA_DUOC` **trước** khi tra `cai_dat`.

## Tiêu chí

verifiability: hard
tiêu_chí:
  - AC1 (10.1 · 10.2): khoá ngoài allowlist ⇒ từ chối, **0** hàng mới
    cmd: cd web && node test/cai-dat.test.js
  - AC2 (10.3 · 10.4 · 10.6): `duyet-bai` · `vai` · `sua-cai-dat` đều **vắng**
    cmd: cd web && node test/cai-dat.test.js
  - AC3 (10.5 · 10.7): cửa nhận hai tham số; `gia_tri` boolean
    cmd: cd web && node test/cai-dat.test.js
  - AC4 (10.8 · 10.9): `duocLam` trả boolean đồng bộ; cửa kiểm **cả ba** câu
    cmd: cd web && node test/cai-dat.test.js
  - AC5 (10.10 · 10.11): vết có `boi`; không `viec` nào ghi/xoá audit
    cmd: cd web && node test/cai-dat.test.js
  - AC6 (10.12): gieo lại — xoá khoá lạ, gieo khoá thiếu, **giữ** giá trị đã đổi
    cmd: cd web && node test/cai-dat.test.js
  - AC7 (f): hàng `cai_dat` bịa cho `viec` ngoài allowlist **KHÔNG** thắng `QUYEN`
    cmd: cd web && node test/cai-dat.test.js
  - AC8: `M18-R5`/`R6` thành `S3` thật
    cmd: python core/tests/check_rule_surfaces.py
  - AC9: không hồi quy
    cmd: cd web && npm test

⚠️ **AC7 không có trong `§10`** — tôi tìm ra nó khi viết task file này, ở
quyết định `f`. Nó là ca *"tầng ba thắng tầng hai một cách không được phép"*, và
không AC nào của `§10` hỏi câu đó.

## Đỏ TRƯỚC

`R5`: `T08-17b` viết `test/cai-dat.test.js` **trước** — nó phải ĐỎ vì
`O_SUA_DUOC` và `datCaiDat` chưa tồn tại.

phụ_thuộc: T08-16 (phân quyền — đã xong)
