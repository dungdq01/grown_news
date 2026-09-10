# T08-25 — Năm cửa tài khoản `C3`–`C7` (đơn vị CODE)

> `FR-047` §2 mở bảy cửa. Đơn vị này làm **năm cửa liên quan tài khoản** —
> `C3` `C4` `C5` `C6` `C7`. Hai cửa còn lại (`C1` nạp, `C2` nháp chưng cất)
> chạm đường validate/kho nên tách sang `T08-13`.
>
> Ba module đang chờ đúng năm cửa này: `M15_kenh` · `M17_cong` · (`M12` chờ C2).

## Ràng buộc quyết định hình dạng — `api-guard` răng 2

`web/test/api-guard.test.js:69-71` cấm `prepare(` · `BEGIN IMMEDIATE` ·
`DatabaseSync` trong **mọi** file `web/api/` trừ `dungchung.mjs`.

⇒ Handler **không được cầm `db` thô**. `dungchung` phải lộ ra **thao tác có
tên** (`loiTraDinhDanh` · `loiBuocDinhDanh` · …), handler chỉ gọi tên.

⚠️ **Ràng buộc này là món quà, không phải chướng ngại.** Nó ép đúng thứ
`M18 AC-3.1` đòi — *"đúng MỘT chỗ `INSERT INTO dinh_danh_kenh`"* — thành **cấu
trúc** thay vì kỷ luật. Một handler cầm `db` thô thì chokepoint đó là lời hứa.

## Phạm vi

phạm_vi_ghi:
  - web/api/dungchung.mjs      # 5 thao tác có tên + xác thực dịch vụ
  - web/api/loi-cua.mjs        # MỚI — 5 handler, KHÔNG cầm SQL
  - web/api/router.mjs         # đấu 5 route

**Không** chạm: `web/test/**` (đơn vị TEST `T08-12b` — `R1`) ·
`core/**` · `web/api/articles.mjs` · `web/api/danhmuc.mjs`.

## Năm cửa

| | route | trả gì | luật riêng |
|---|---|---|---|
| **C3** | `GET /api/dinh-danh?kenh=&chat_id=` | `{nguoi_dung_id}` **hoặc** `{}` | **V6**: hai ca "lạ" và "chưa buộc" trả **giống hệt nhau** |
| **C4** | `POST /api/dinh-danh` | buộc `chat_id` | tiêu `ma_moi` **trong cùng transaction** |
| **C5** | `POST /api/audit` | ghi vết | **append-only**, không đường sửa/xoá |
| **C6** | `GET /api/phien/:id` | `{nguoi_dung_id, het_han}` | **không** trả `ngu_canh` |
| **C7** | `POST /api/ma-moi/dung` | tra + đánh dấu | `UPDATE … WHERE dung_luc IS NULL` + `changes()` |

## Ba luật xuyên suốt (`FR-047 §2.1`)

**L1 · Danh tính do LÕI gán.** Năm handler **lột** mọi trường danh tính trong
payload trước khi chạm dữ liệu. `CVE-2026-47713`.

**L2 · DENY khi thiếu danh tính.** Không rơi về "cả kho" hay "người mặc định".

**L3 · Khoá service-to-service RIÊNG.** `KHOA_DICH_VU` — **khác** khoá session,
và request phải khai `aud` khớp. `CVE-2025-41258` (CVSS 8.0): dùng chung một
secret cho session và dịch vụ nội bộ ⇒ token session đi vòng **toàn bộ** ACL,
gồm cả GHI.

## Tiêu chí

verifiability: hard
tiêu_chí:
  - AC1 (V2): gieo `nguoi_dung_id` giả trong payload C4 ⇒ hàng ghi ra **không** mang giá trị đó
    cmd: cd web && node test/loi-cua.test.js
  - AC2 (V3): gọi cả năm cửa **không** khoá dịch vụ ⇒ **401/403**, không 2xx
    cmd: cd web && node test/loi-cua.test.js
  - AC3 (V4): dùng lại một `ma_moi` ⇒ lần hai **từ chối**, `dung_luc` không đổi
    cmd: cd web && node test/loi-cua.test.js
  - AC4 (V6): C3 với `chat_id` lạ và `chat_id` chưa buộc ⇒ **cùng status + cùng body**
    cmd: cd web && node test/loi-cua.test.js
  - AC5 (V5): không tồn tại đường `UPDATE`/`DELETE` nào trên `audit_log`
    cmd: cd web && node test/loi-cua.test.js
  - AC6 (V7): `KHOA_DICH_VU` ≠ khoá session, và `aud` được kiểm
    cmd: cd web && node test/loi-cua.test.js
  - AC7: `api-guard` **không nới** — 0 SQL ngoài `dungchung.mjs`
    cmd: cd web && node test/api-guard.test.js
  - AC8: không hồi quy
    cmd: cd web && npm test

## Đỏ TRƯỚC

`T08-12b` viết `test/loi-cua.test.js` **trước**; nó phải ĐỎ vì chưa có route nào.

phụ_thuộc: T08-11 (DDL — đã xong)
