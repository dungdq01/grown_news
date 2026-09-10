# FR-047 — BẢY cửa cho MÁY ở LÕI, và vì sao chúng khác cửa cho NGƯỜI

- **mở**: 2026-09-02 · **người quyết**: chủ dự án · **trạng thái**: **ĐÃ ĐÓNG** 2026-09-02
- **đóng bởi**: chủ dự án — *"tạm thời đóng, khi lòi ra vấn đề fix sau"*
- **artifact chạm**: `06_modules/M08_api/**` (spec + rules) · `web/api/**` (s8) ·
  **DDL của DB mới trong `web/`** — ⚠️ **KHÔNG** `core/assets/kho.schema.sql`
- **sửa 2026-09-02 (`ADR-06`)**: bản đầu của FR này khai chạm `kho.schema.sql`.
  **Sai** — `dung_lai_db.py:139-140` XOÁ `kb/_kho.sqlite` rồi dựng lại từ file, nên
  năm bảng dữ liệu GỐC nằm trong đó sẽ **bị xoá sạch** mỗi lần chạy lệnh đó. Chủ dự
  án chốt: *"backend của phần nào ở đâu thì `.db` nằm ở đó"* ⇒ DB riêng ở `web/`.
- **mở khoá**: s7 (G6B) cho **M12 · M15 · M17** — ba module hiện **không chia task
  được** vì mọi đường của chúng vào LÕI đều chưa có cửa.

## 0 · Vì sao phải FR

s6 đóng G6A cho sáu module đợt hai. Ba trong sáu (**M12 · M15 · M17**) khai cùng
một nợ: chúng cần LÕI mở cửa, và **không cửa nào tồn tại**.

Đây không phải "thiếu vài endpoint". Đây là một **khoảng trống có hình dạng**:

> `FR-045` khai **bốn bảng** (`nguoi_dung` · `ma_moi` · `dinh_danh_kenh` ·
> `phien`) mà **không khai một endpoint nào**. `FR-046` khai **bảng nháp** mà
> không khai đường ghi. Nên ba module BIẾT dữ liệu ở đâu, và **không biết chạm
> nó thế nào**.

Và khoảng trống đó **có một đường đi vòng đang mở**: `POST /api/articles`
(`taoBai`) đặt `review_status: approved` **VÔ ĐIỀU KIỆN** — vì nó được thiết kế cho
**người** viết. Một người thi công M15 gặp deadline sẽ dùng cửa đó, và **`M05-R1`
mất trong khi mọi cổng vẫn xanh**.

## 1 · Nguyên tắc gốc: cửa cho MÁY ≠ cửa cho NGƯỜI

| | cửa cho NGƯỜI (đã có) | cửa cho MÁY (FR này) |
|---|---|---|
| ai gọi | trình duyệt, sau khi người gõ | THỢ / BIÊN, tự động |
| `review_status` | `approved` — người chịu trách nhiệm | **luôn `draft`**, không nhận từ payload |
| danh tính | session của người | **do LÕI gán**, không nhận từ payload |
| nội dung | người viết | **untrusted** — đến từ Internet hoặc model |

Ba dòng cuối là toàn bộ lý do FR này tồn tại. Gộp hai loại cửa là cách `M05-R1`
chết mà không ai thấy.

## 2 · Bảy cửa

| # | cửa | ai gọi | luật riêng |
|---|---|---|---|
| **C1** | `POST /api/nhap` — nạp nội dung từ máy | M15 | **luôn `draft`**; `review_status` trong payload bị **lột**, không phải bị từ chối |
| **C2** | `POST /api/nhap-chung-cat` — ghi bảng nháp (`FR-046`) | M12 | `trang_thai: nhap` mặc định; `ban_goc_ai` **ghi một lần**, không sửa được |
| **C3** | `GET /api/dinh-danh?kenh=&chat_id=` | M15, M17 | trả **`nguoi_dung_id` hoặc rỗng** — **không** trả tên/email/số tài khoản |
| **C4** | `POST /api/dinh-danh` — buộc `chat_id ↔ account` | M17 | tiêu `ma_moi` **trong cùng transaction**; `U3` + `U4` |
| **C5** | `POST /api/audit` | M15, M17 | **append-only**; không có đường sửa/xoá |
| **C6** | `GET /api/phien/<id>` → danh tính | M17 | trả **`nguoi_dung_id` + hạn**, không trả `ngu_canh` |
| **C7** | `POST /api/ma-moi/dung` — tra + đánh dấu | M17 | **một lần**: `UPDATE … WHERE dung_luc IS NULL` + `changes()` |

### 2.1 · Ba luật xuyên suốt cả bảy

**L1 · Danh tính do LÕI gán, KHÔNG nhận từ payload.**
Bảy cửa đều **bỏ** mọi trường danh tính người gọi gửi lên. Lý do đo được:
`CVE-2026-47713` (AnythingLLM) — cách ly cài thành nhánh điều kiện trên sự có mặt
của danh tính, nên **vị từ WHERE biến mất** khi danh tính vắng.

**L2 · DENY khi thiếu danh tính, không nới.**
Thiếu danh tính ⇒ **từ chối**, không rơi về "cả kho" hay "người dùng mặc định".
Cùng CVE — fail-open là hình dạng lỗi lặp lại nhiều nhất trong khảo sát đợt năm.

**L3 · Khoá xác thực service-to-service phải RIÊNG.**
Không dùng chung với khoá session của người dùng, và **validate `aud`**.
`CVE-2025-41258` (LibreChat, CVSS **8.0**, `I:H/A:H`): dùng **cùng một** JWT secret
cho session trình duyệt và cho RAG API ⇒ token session hợp lệ xác thực **thẳng**
vào dịch vụ nội bộ và **đi vòng toàn bộ ACL một lúc** — gồm cả **GHI**.

> Đối chiếu vào ta: `M17_cong` cấp danh tính; `M12`/`M13`/`M14` là THỢ; cả bốn
> nói chuyện với LÕI. **Ba chỗ dùng chung một bí mật thì ranh giới LÕI/THỢ/BIÊN
> sập bằng một dòng cấu hình** — và nó sập im lặng, vì mọi test vẫn xanh.

## 3 · Cổng — mỗi cổng một câu đỏ được

| | cổng | đỏ khi |
|---|---|---|
| **V1** | `review_status` không bao giờ từ payload vào kho qua C1/C2 | gieo payload `approved` ⇒ bản ghi ra **không** phải `draft` |
| **V2** | danh tính không bao giờ từ payload | gieo `nguoi_dung_id` giả ⇒ hàng ghi ra giữ giá trị đó |
| **V3** | thiếu danh tính ⇒ **từ chối** | gọi C1–C7 không danh tính mà được 2xx |
| **V4** | `ma_moi` **một lần** | dùng lại một mã ⇒ lần hai vẫn qua |
| **V5** | `audit_log` **append-only** | tồn tại một đường `UPDATE`/`DELETE` trên bảng đó |
| **V6** | C3 **không rò danh tính** | phản hồi chứa tên/email, hoặc phân biệt được *"chat_id lạ"* với *"chat_id có nhưng chưa buộc"* |
| **V7** | khoá service-to-service **khác** khoá session | hai khoá bằng nhau, hoặc `aud` không được validate |
| **V8** | `ban_goc_ai` bất biến | sửa được sau lần ghi đầu |

**V6 đáng đọc kỹ**: một thông báo *"chat_id này chưa buộc tài khoản nào"* khác
*"chat_id không tồn tại"* là một phép **đếm tài khoản** cho người lạ. Hai ca phải
trả **cùng một** phản hồi.

## 4 · Điều FR này KHÔNG làm

- **Không** bỏ `POST /api/articles`. Nó là cửa của **người**, và FE dựng URL thẳng
  ở bốn chỗ (`FR-024` đã một lần làm vỡ đúng đó).
- **Không** chọn tên cột cuối cho bảng nháp — `FR-046 §3` đã giao việc đó cho s6.
- **Không** thi công rate-limit / entropy ≥128 bit / log-thất-bại của `M17`. Đó là
  **lỗ trong `FR-045` đã duyệt** (`security_baseline §8.1`) và cần **FR riêng** —
  gộp vào đây là giấu một lỗ an ninh trong một FR về hợp đồng.
- **Không** đụng `frontmatter.schema.json` (FROZEN). Hai nợ còn lại — `nguon`
  (`FR-044`) và `model_da_dung` (M12) — thuộc **FR tới M01**, không phải FR này.
- **Không** ký `FROZEN.lock`.

## 5 · Vì sao MỘT FR chứ không bảy

Bảy cửa chung **một hình dạng** (§1) và **ba luật xuyên suốt** (§2.1). Tách làm
bảy thì `L3` phải nhắc lại bảy lần, và lần thứ tám ai đó quên — đúng lớp lỗi
"gõ tay ở tầng thứ hai" mà dự án này đã trúng ba lần (`LOAI` bốn nơi · hai bản
schema · hai bản `chuan_hoa`).

## 6 · Đo được hôm nay — trạng thái trước FR

```bash
grep -c "api/nhap\|api/dinh-danh\|api/audit\|api/phien\|api/ma-moi" web/api/*.mjs
# -> 0   (đo 2026-09-02)
```

Và ba module khai nợ này trong artifact của chính chúng:
`M12` spec §1.1 · `M15` data_flow §6 + model_flow §6 · `M17` data_flow §5 +
model_flow §6.

---

## 6 · Đóng — bằng chứng, và ba vế CỐ Ý để hở

**Đóng 2026-09-02** theo quyết định của chủ dự án: *"tạm thời đóng, khi lòi ra
vấn đề fix sau"*.

### Bằng chứng

| | |
|---|---|
| bảy cửa `C1`–`C7` | `web/api/loi-cua.mjs` — 7 handler, **0 handler quên** `quaCong` (đếm được, không nhìn mắt) |
| DDL năm bảng | `web/api/loi.schema.sql` — DB riêng ở `web/` theo `ADR-06` |
| `V1` `V3` `V6` | đo trên **SERVER THẬT** (`loi-cua-http.test.js`), không phải regex mã nguồn |
| `V2` `V4` `V5` `V7` `V8` | `loi-cua.test.js` — 30+ ca trên lớp thao tác |
| `ADR-06 (c)` | bản lùi ba bảng **tự cập nhật** sau mỗi phép ghi; hai bảng bí mật không xuất |
| toàn bộ | `npm test` **82 file exit 0** · `pytest 42` · 22/27 cổng Python xanh (5 đỏ có trước, đã quy chủ) |

### Ba vế để hở — BIẾT mà đóng, không phải quên

**a · `AC-7.1/7.2/7.3` (rate-limit · entropy ≥128 bit · log thất bại) KHÔNG thi
công.** `§4` cố ý loại chúng: đó là **lỗ an ninh trong `FR-045` đã duyệt**, và
gộp vào một FR về hợp đồng là giấu nó ở chỗ không ai xem kỹ. ⇒ `FR-049`.

**b · `C1` chưa có test HTTP cho ca GHI THÀNH CÔNG.** `loi-cua-http` đo *"không
đường nào trả `approved`"* — đúng, nhưng chưa đủ: nó chưa gieo một payload đủ
trường để đi tới `201` rồi đọc **file `.md` thật trong kho**. Hôm nay validate
chặn ở `422` vì fixture thiếu trường, nên vế *"bản ghi ra đĩa mang `draft`"*
**chưa ai đo**.

⚠️ Vế này đáng nhớ vì nó là hình dạng *"cổng xanh vì chưa tới được chỗ cần
đo"* — cùng lớp với cổng xanh rỗng.

**c · Bản lùi tự chạy nhưng chưa ai kiểm trên `web/_luu` THẬT.** Mọi ca chạy
trên `LOI_LUU` tạm. Lần đầu chạy trên đường thật sẽ là lần tạo tài khoản đầu
tiên — và đó cũng là lần đầu dữ liệu cá nhân được ghi ra một file trong git
(⇒ `FR-050`).

⇒ Ba vế trên ghi **ở đây** thay vì mở ô `backlog`: chúng là *"thứ chưa xây"*,
không phải nợ do một thay đổi cụ thể vừa gây ra — và `backlog.md` khai rõ nó
không phải chỗ chứa loại đó.
