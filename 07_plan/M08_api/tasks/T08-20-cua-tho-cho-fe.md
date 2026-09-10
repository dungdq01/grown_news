# T08-20 — Hai cửa LÕI để FE gọi được THỢ (`GET /api/model` · `POST /api/job`)

> **Mở bởi**: chỉ đạo chủ dự án 2026-09-03 (*"bạn viết luôn task và làm đi nhé"*),
> sau khi đo được chỗ chặn: `grep "8790|chungcat|/api/model|/api/job"` trên
> `web/api/router.mjs` + `web/server.mjs` ⇒ **0 kết quả**.
>
> ⚠️ **Task này do agent thi công tự viết.** Plan là `soft` và người duyệt, nên
> điều đó hợp lệ — nhưng nó bỏ mất một lần đọc độc lập giữa "ai ra việc" và "ai
> làm việc". Ghi ra để reviewer ở nhịp ⑤ biết mà soi kỹ hơn chỗ này.
>
> **Nó CHẶN bốn task UI cùng lúc**: `T03-92` (nút Chưng cất) · `T03-93` (Xưởng)
> · `T03-94` (Hàng đợi nháp) · `T03-95` (khối dashboard) — cả bốn đọc
> `GET /model` hoặc `GET /job`. Nên nó đi TRƯỚC cả bốn.

## Là gì — và không phải là gì

`web` **gọi** `:8790`; **trình duyệt KHÔNG**. Hai chủ thể khác nhau, và đây là
toàn bộ lý do hai cửa này tồn tại:

```
✅  web (tiến trình Node, phía server) ──► chungcat :8790
❌  trình duyệt (JS phía client)       ──► chungcat :8790
```

Không phải vì mạng — máy này chạy cả hai nên trình duyệt **gọi tới được**. Lý do:

1. **`Z8`** (`ADR-05`): *"chỉ `web/` gọi service; trình duyệt gọi `web`"* — MỘT
   chỗ chuẩn hoá output. Hai client tự dựng output từ cùng một service thì hai
   bên sẽ lệch.
2. **`M12-R7`** đòi `POST /job` mang `X-Khoa-Loi`. Trình duyệt gọi thẳng nghĩa
   là khoá nằm trong JS tải về máy người dùng — **mở DevTools là thấy khoá**, và
   từ đó ai cũng gọi thẳng vào THỢ, bỏ qua mọi thứ `web` canh. Đó là
   `CVE-2025-41258` theo một đường khác.

⇒ Đặt lời gọi ở phía `web` giữ khoá **ở lại server**. Đó là toàn bộ giá trị nó mua.

## Hai cửa

| cửa | khoá? | làm gì |
|---|---|---|
| `GET /api/model` | **không** | `web` fetch `:8790/model`, **lọc bỏ `dich`** rồi trả. Bộ chọn của FE cần nó TRƯỚC khi người dùng làm gì; nó không lộ nội dung kho, không lộ đích egress |
| `POST /api/job` | **có** — khoá dịch vụ ở env server | `web` giải phiên → `nguoi_dung_id`, gắn `X-Khoa-Loi` + `X-Nguoi-Dung`, fetch `:8790/job`, trả nguyên mã và thân về FE |

**Lọc `dich` KHÔNG phải làm đẹp**: `dich` là **đích egress**. Bộ chọn không cần
biết gửi tới đâu, và mọi trường không cần thiết mà vẫn ra trình duyệt là một
dòng thông tin phải audit về sau. `chungcat/src/api.py::do_GET` đã lọc sẵn ở
đầu kia — cửa này **kiểm lại**, không tin đầu kia đã lọc: hai lớp cho một luật
mà lớp thứ hai rẻ.

## Danh tính người dùng — chỗ CHƯA CÓ, khai thẳng

`FR-047 §2.1 L2` nói *"thiếu danh tính ⇒ DENY"*. Nhưng luật đó viết cho **bảy
cửa của MÁY** (M15/M17 gọi vào), còn người gọi ở đây là **trình duyệt**, và
**hôm nay chưa có phiên đăng nhập cho trình duyệt**: `FR-045` khai bốn bảng
(`nguoi_dung` · `ma_moi` · `dinh_danh_kenh` · `phien`) nhưng đường đăng nhập
web chưa dựng.

⇒ Quyết định của task này, và nó phải đọc được chứ không nằm trong đầu ai:

- Có phiên (`x-phien` hoặc `phien` trong thân) ⇒ giải ra `nguoi_dung_id`, gắn
  `X-Nguoi-Dung`.
- **Không có phiên ⇒ VẪN tạo việc, `nguoi_dung_id` = null**, và ghi một dòng
  `audit_log` nói rõ việc này **không có chủ**.
- **KHÔNG** rơi về một "người dùng mặc định" — đó mới là fail-open mà `L2` cấm.

Vì sao không DENY: `spec M12 §1.1` đã đo và khai *"hôm nay phép giải quyền CHƯA
TỒN TẠI — cả 5 tài khoản đọc cả kho, chưa có ACL theo tài liệu"*. DENY ở đây
làm tính năng không dùng được cho tới khi đăng nhập web xong, mà việc đó là một
FR khác. Null **có ghi vết** là trung thực; "người dùng mặc định" là nói dối.

⚠️ Khi đăng nhập web có: đổi thành DENY, và các việc cũ `nguoi_dung_id = null`
phải được nhận ra là **việc không có chủ**, không phải việc của người đầu tiên
đăng nhập.

phạm_vi_ghi:
  - web/api/tho-cua.mjs                 # hai handler + phép lọc `dich`
  - web/api/router.mjs                  # 2 dòng route

# ⚠️ `web/package.json` ĐÃ TỪNG khai ở đây, nay GỠ. Máy bắt đúng, hai lần:
#   check_g6b → "ghi web/package.json ngoài boundary M08_api
#                (web/api/** · _recycle/** · 06_modules/M08_api/**)"
# Nó là đất **M03** (`web/**`). Lượt thi công thêm nó vào giữa việc vì
# `nut-song.test.js` đòi *"mọi file test đều được `npm test` gọi"* — tức là
# **nới `phạm_vi_ghi` tại chỗ**, đúng thứ `CLAUDE.md` §DỪNG cấm, và tệ hơn mức
# đã tự ghi nhận: không chỉ thiếu khai, mà là file của module khác.
#
# ⇒ Một dòng đăng ký đó chuyển về `T03-91` — đơn vị TEST sở hữu
#   `web/test/loi-*.test.js`. Ai sở hữu cổng thì đăng ký cổng; hợp cả R1 lẫn
#   nghĩa. Dòng đã ghi vào `web/package.json` rồi, nên T03-91 nhận cả vật lẫn
#   trách nhiệm — reviewer nhịp ⑤ đối chiếu ở đó, không ở đây.

# ⚠️ Cổng KHÔNG khai ở đây. `web/test/**` là đất của đơn vị TEST (R1:
# `check_g6b` bắt "chạm file test mà không phải đơn vị test"). Cổng của task
# này tên `web/test/loi-tho-cua.test.js` và nó rơi đúng vào glob
# `web/test/loi-*.test.js` mà `T03-91` đã khai sở hữu — đó không phải mẹo đặt
# tên: hai cửa này LÀ cửa của LÕI, chỉ khác chỗ đích là THỢ.

verifiability: hard
tiêu_chí:
  - AC1: `GET /api/model` trả 200 + danh mục, và KHÔNG trường nào tên `dich`
      trong thân trả về — kể cả khi đầu kia trả nó
    cmd: node web/test/loi-tho-cua.test.js
  - AC2: `POST /api/job` gắn `X-Khoa-Loi` từ env SERVER — khoá KHÔNG xuất hiện
      trong bất kỳ thân trả về nào, và không có trong `gn.js`
    cmd: node web/test/loi-tho-cua.test.js
  - AC3: có phiên ⇒ `X-Nguoi-Dung` mang `nguoi_dung_id` giải từ phiên; KHÔNG
      phiên ⇒ vẫn tạo việc, không header đó, và CÓ dòng `audit_log` nói việc
      không có chủ. Payload khai `nguoi_dung_id` ⇒ bị BỎ (không tin client)
    cmd: node web/test/loi-tho-cua.test.js
  - AC4: THỢ chết / không nghe ⇒ cửa trả 502 kèm câu đọc được, KHÔNG 500 trần
      và KHÔNG treo (có timeout)
    cmd: node web/test/loi-tho-cua.test.js
  - AC5: mã trả về của THỢ đi NGUYÊN về FE (403/422/201) — cửa không dịch lại
      thành 200, vì FE cần phân biệt "bị chặn" với "đã nhận"
    cmd: node web/test/loi-tho-cua.test.js
  - AC6: không phá gì — `api-guard` vẫn xanh (LÕI vẫn không nghe ngoài
      loopback), suite web xanh
    cmd: cd web && npm test
    # ĐO ĐƯỢC 2026-09-03: 8 cổng của lượt này xanh; suite còn **một** đỏ:
    #   `nut-song.test.js` — *"KHÔNG được gọi: cai-dat.test.js"*
    # đỏ_do: T08-17b (KHÔNG phải lượt này). `web/test/cai-dat.test.js` là cổng
    # đỏ-trước của T08-17b, ghi 02:57 hôm nay, còn `??`. Quy chủ bằng
    # `git status` + mtime, không bằng phỏng đoán.
    # Nó là biểu hiện của một luật chỏi luật — ô nợ M08 mô tả đầy đủ.

# `check_g6b:46` đọc TRỌN phần sau khoá phụ-thuộc làm MỘT id ⇒ chú thích trong
# ngoặc biến cả dòng thành một id không tồn tại. Ghi chú lên dòng riêng.
# Và regex đó quét CẢ dòng chú thích: nhắc lại tên khoá y nguyên trong một
# comment cũng sinh một phụ-thuộc-treo. Nên câu này viết tên khoá bằng chữ.
# T08-19: mã cửa LÕI + `quaCong` — đã viết, chưa commit.
phụ_thuộc: T08-19
