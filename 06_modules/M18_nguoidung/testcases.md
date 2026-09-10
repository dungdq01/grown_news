# M18_nguoidung — testcases

> Mỗi AC ≥1 happy + ≥1 edge, viết bằng **lời** (đầu vào → kết quả mong đợi).
> Không thay trạm `m-test` ở s8 — spec khai *phải phủ gì*, m-test là **vai riêng
> viết test** và giữ quyền FR ngược về đây (`R1`).
>
> **`5/12` lệnh đã cài** (`cai-dat.test.js` chưa có) (`spec §8` — đo bằng máy). Testcase ở đây là
> hợp đồng cho người viết chúng.

## §1 · Tài khoản

**AC-1.1** — `tao_luc` do máy đặt
- *happy*: tạo tài khoản với `ten` → có đúng **một** hàng mới, `tao_luc` khác `null`.
- *edge*: gửi payload **có kèm** `tao_luc: "1999-01-01"` → hàng lưu **KHÔNG** mang
  giá trị đó. Đo bằng so sánh với giá trị gửi lên, không bằng *"trường có tồn tại"*.

**AC-1.2** — thu hồi không xoá hàng
- *happy*: thu hồi → `trang_thai` đổi, **số hàng `nguoi_dung` không đổi**.
- *edge*: thu hồi một tài khoản đã có bản ghi `audit_log` → mọi bản ghi đó vẫn
  **trỏ được** về nó (join ra đúng một hàng, không `null`).
- *edge 2*: thu hồi **hai lần** → lần hai không đổi thêm gì, không lỗi.

**AC-1.3** — thu hồi làm phiên hết hiệu lực
- *happy*: mở phiên → thu hồi → **dùng phiên đó** → bị từ chối.
- *edge*: phiên đang **giữa một request dài** lúc thu hồi → request kế tiếp bị từ
  chối. Không đòi cắt ngang request đang chạy — đòi **lần dùng kế tiếp**.
- *edge 2*: thu hồi rồi **khôi phục** `trang_thai` → phiên cũ **vẫn** hết hiệu
  lực, phải mở phiên mới. Khôi phục tài khoản không khôi phục phiên.

⚠️ *edge 2* là chỗ dễ cài sai nhất: một cài đặt "kiểm `trang_thai` mỗi request"
sẽ **xanh** ở happy và **đỏ** ở đây, vì nó làm phiên sống lại. Phiên phải bị đánh
dấu **tại thời điểm thu hồi**, không phải suy ra từ `trang_thai` hiện tại.

## §2 · Mã mời

**AC-2.1** — bắt buộc `het_han`
- *happy*: sinh mã → `het_han` khác `null` và **lớn hơn** thời điểm sinh.
- *edge*: gọi đường sinh mã **không** truyền `het_han` → **ĐỎ ngay ở cổng sinh**,
  không phải lúc mã bị dùng.
- *edge 2*: `het_han` ở **quá khứ** → đỏ ở cổng sinh.

**AC-2.2** — đánh dấu nguyên tử
- *happy*: dùng một mã chưa dùng → thành công, `dung_luc` được đặt.
- *edge*: **hai** request dùng **cùng** một mã **đồng thời** → đúng **MỘT** thành
  công. Đo bằng đếm số phản hồi thành công, và đếm số hàng `dinh_danh_kenh` mới.
- *edge 2*: mã **đã hết hạn** nhưng `dung_luc` vẫn `null` → từ chối. Hai điều
  kiện độc lập; qua một cái không qua cái kia.

**AC-2.3** — dùng lại
- *happy*: dùng lại một mã đã dùng → từ chối.
- *edge*: sau lần từ chối đó, `dung_luc` **giữ nguyên giá trị của lần đầu** —
  từng ký tự. Ghi đè `dung_luc` xoá mất **thời điểm dùng thật**, và đó là thứ
  audit cần khi phải điều tra.

## §3 · Định danh kênh

**AC-3.1** — đúng một chỗ ghi
- *happy*: đếm số chỗ `INSERT INTO dinh_danh_kenh` trong mã nguồn → **= 1**.
- *edge*: thêm một chỗ ghi thứ hai (dù hợp lệ về logic) → **ĐỎ**. Cổng đo **con
  số**, không đo *"có allowlist không"*.

⚠️ Phép đo cũ (*"không tìm thấy allowlist trong cấu hình"*) đã bị **loại ở s6** —
xem `spec §9`. Vắng mặt một chuỗi không chứng minh vắng mặt một hành vi.

**AC-3.2** — một `chat_id` một tài khoản
- *happy*: buộc `chat_id` A vào tài khoản 1 → thành công.
- *edge*: buộc **cùng** `chat_id` A vào tài khoản 2 → từ chối, **và** có một
  bản ghi `audit_log` mới cho lần thử đó.
- *edge 2*: buộc `chat_id` A trên **kênh khác** → **thành công**. Ràng buộc là
  (`kenh`, `chat_id`), không phải `chat_id` một mình.

**AC-3.3** — thông báo không phân biệt
- *happy*: gửi một `chat_id` chưa từng thấy → thông báo X.
- *edge*: gửi một `chat_id` **có trong bảng nhưng chưa buộc** → thông báo **giống
  hệt X**, từng byte, và **cùng mã trạng thái**.
- *edge 2*: **thời gian phản hồi** hai ca không lệch tới mức phân biệt được. Một
  thông báo giống nhau mà một ca nhanh gấp mười vẫn là một phép đếm tài khoản.

## §4 · Phiên

**AC-4.1** — M14 không có đường tới DB
- *happy*: khởi tiến trình M14 → **không** biến môi trường nào trỏ tới file `.db`
  của LÕI, **không** tham số dòng lệnh nào, **không** thư viện DB nào được nạp.
- *edge*: thêm một biến môi trường trỏ tới file đó → **ĐỎ**, kể cả khi không dòng
  mã nào đọc nó. Khả năng chạm tới là đủ để đỏ.

⚠️ Phép đo cũ (*"M14 không nhắc tên bảng"*) đã bị **loại ở s6** — `spec §9`. Đó
là đúng lớp lỗi `B8b`: kiểm *"không chứa hằng số"* **xanh oan** ngay khi hằng số
đi qua một biến.

**AC-4.2** — ngữ cảnh không rò
- *happy*: hai người, hai phiên → mỗi phiên đọc đúng `ngu_canh` của mình.
- *edge*: ghi vào phiên A rồi đọc phiên B **ngay sau đó** → B không thấy gì của A.
- *edge 2*: hai phiên của **cùng một người** trên **hai kênh** → cũng tách bạch.

## §5 · Xuất và backup

**AC-5.1** — ba bảng có đường export
- *happy*: mỗi bảng trong ba, `INSERT` một hàng rồi chạy export → file của nó
  **xuất hiện** và chứa hàng đó.
- *edge*: gỡ đường export của **một** trong ba → **ĐỎ**, và thông báo nói **tên
  bảng nào**.

**AC-5.2** — hai bảng không rò bí mật
- *happy*: sinh một mã, mở một phiên, chạy export → **không** file nào chứa giá
  trị `ma` hay `phien.id`.
- *edge*: ghi giá trị `ma` vào `audit_log.chi_tiet` rồi export → **ĐỎ**. Cổng
  quét **cả** file export **lẫn** `kb/_audit.jsonl`.

**AC-5.3** — xuất hai lần không xoá
- *happy*: export → đếm file; export **lần hai** → **cùng** số file, cùng nội dung.
- *edge*: `INSERT` một hàng mới rồi export lần hai → số file **TĂNG**, và file
  của lần đầu **còn nguyên**.

⚠️ *edge* này là chỗ `S12` đã cắn một lần: `xuat_kho.py:141-146` xoá **mọi** file
không nằm trong tập `can_co`. Phép đo phải là **trạng thái trước/sau**, không
phải một phép quét mã tìm `unlink`.

## §6 · Vai

**AC-6.1** — `vai` không phải cổng
- *happy*: hai tài khoản khác `vai`, cùng một thao tác ghi → **cùng** mã trạng
  thái và **cùng** thân phản hồi.
- *edge*: đặt `vai` thành một giá trị **chưa từng có** → vẫn cùng kết quả. Một
  cài đặt fail-open sẽ **xanh** ở happy và lộ ra ở đây.
- *edge 2*: `vai` là `null` → vẫn cùng kết quả. Đây đúng hình dạng
  `CVE-2026-47713`: `user ? whereWithUser(user) : where({})`.

⚠️ Phép đo cũ (*"không có `if (vai === ...)`"*) đã bị **loại ở s6** — `spec §9`.

## §7 · Ba AC `soft`, chờ FR

`AC-7.1` `AC-7.2` `AC-7.3` **viết được testcase** — chúng `soft` vì là **lỗ an
ninh trong một FR đã duyệt**, không phải vì mơ hồ. Testcase của chúng đã có ở
`M17_cong/testcases.md` (`AC-3.4`/`3.5`/`3.6`) và **không chép lại ở đây** —
chép nội dung artifact sang chỗ khác là thứ `CLAUDE.md` cấm; trỏ con trỏ.


## §10 · Cài đặt — ô quyền sửa được từ web

*(thêm 2026-09-03 · `proposal-3` · `ADR-07`)*

**AC-10.1** — khoá ngoài allowlist bị từ chối
- *happy*: ghi một khoá **có** trong `O_SUA_DUOC` → thành công, `cai_dat` có hàng.
- *edge*: ghi khoá `"linh-tinh"` → **từ chối**, và `count(*) FROM cai_dat` **không đổi**.
- *edge 2*: khoá **rỗng** `""` → từ chối.
- *edge 3*: khoá đúng nhưng **khác hoa/thường** (`"XEM-AUDIT"`) → từ chối. So khớp
  **chính xác**, không chuẩn hoá — chuẩn hoá là một chỗ để hai chuỗi khác nhau
  thành một khoá.

**AC-10.2** — allowlist, đo bằng HÀNH VI
- *happy*: mọi khoá trong `O_SUA_DUOC` ghi được.
- *edge*: **thêm một `viec` mới vào `QUYEN`** mà **không** khai nó trong
  `O_SUA_DUOC` → nó **KHÔNG** ghi được. Tức tập mặc định là **rỗng**.

⚠️ Đây là ca phân biệt allowlist với denylist. Một cài đặt denylist sẽ **xanh**
ở *happy* và **đỏ** ở đây — vì `viec` mới không nằm trong danh sách chặn nên nó
lọt.

**AC-10.3** — `duyet-bai` vắng mặt ở CẢ HAI chỗ
- *happy*: đếm `"duyet-bai"` trong `QUYEN` = **0** và trong `O_SUA_DUOC` = **0**.
- *edge*: `duocLam(chu, "duyet-bai")` → **`false`**, kể cả với chủ dự án.
- *edge 2*: ghi setting khoá `"duyet-bai"` → từ chối.

**AC-10.4** — `vai` không là một ô
- *happy*: sau khi ghi **mọi** ô trong `O_SUA_DUOC` sang `true`, `nguoi_dung.vai`
  của mọi hàng **không đổi** — so từng hàng trước/sau.
- *edge*: khoá `"vai"` hoặc `"nguoi_dung.vai"` → từ chối.

**AC-10.5** — cửa ghi nhận hai tham số, không nhận object
- *happy*: `datCaiDat("xem-audit", true)` → thành công.
- *edge*: gọi với **một object** `{ khoa, gia_tri, vai: "chu" }` → **từ chối**
  hoặc trường lạ **không có tác dụng nào**; `vai` không đổi.

⚠️ Ca *edge* là `CVE-2026-31942` viết thành testcase: LibreChat mất API key của
**mọi người** vì `{ userId: req.user.id, ...body }`. Thứ tự spread đó là cả lỗ.

**AC-10.6** — `sua-cai-dat` không nằm trong tập ô
- *happy*: đếm `"sua-cai-dat"` trong `O_SUA_DUOC` = **0**.
- *edge*: ghi khoá `"sua-cai-dat"` → từ chối. `chu` **không tự khoá được**.

**AC-10.7** — `gia_tri` là boolean
- *happy*: `true` và `false` đều nhận.
- *edge*: `"true"` (chuỗi) → từ chối · `1` → từ chối · `null` → từ chối.
- *edge 2*: `"../../etc/passwd"` → từ chối · `"$(rm -rf /)"` → từ chối ·
  `"http://evil/"` → từ chối.

⚠️ *edge 2* là vế **nền** (`§10.2`): không ô nào được diễn giải thành đường dẫn ·
lệnh · URL · mã. `CVE-2024-3028/3025`: một trường setting ⇒ **xoá được file
SQLite**.

**AC-10.8** — `duocLam` trả boolean đồng bộ
- *happy*: `typeof duocLam(chu, "xem-audit") === "boolean"`.
- *edge*: `duocLam(...)` **không** là `Promise` — `!(kq instanceof Promise)` và
  `kq.then === undefined`.
- *edge 2*: mọi tổ hợp (`null` id · `viec` lạ · tài khoản thu hồi) đều trả
  **boolean**, không `undefined`, không ném.

⚠️ `CVE-2026-77426`: một `await` bị quên ⇒ `Promise` **truthy** ⇒ **mọi** phép
kiểm thành `true`. Cổng duy nhất bắt được là **kiểu trả về**.

**AC-10.9** — cửa ghi kiểm CẢ BA câu
- *happy*: `chu` + khoá hợp lệ + boolean → thành công.
- *edge*: `dong_nghiep` + khoá hợp lệ + boolean → **từ chối** (*ai ghi*).
- *edge 2*: `chu` + khoá **lạ** + boolean → **từ chối** (*khoá nào*).
- *edge 3*: `chu` + khoá hợp lệ + **chuỗi** → **từ chối** (*giá trị nào*).

⚠️ Ba *edge* là ba câu khác nhau. Một cài đặt chỉ kiểm câu đầu (LiteLLM: gác
**route** không gác **trường**) sẽ xanh ở *edge* và **đỏ ở hai cái sau**.

**AC-10.10** — vết có CẢ HAI danh tính
- *happy*: đổi một ô → `audit_loi` có hàng mới, `boi` = người đổi, `doi_tuong`
  mang **tên khoá**.
- *edge*: đếm hàng `hanh_dong = 'doi-cai-dat' AND boi IS NULL` = **0**.
- *edge 2*: đổi **hai** ô liên tiếp → **hai** hàng audit, không phải một.

**AC-10.11** — quản quyền ≠ quản audit
- *happy*: `QUYEN` có `"xem-audit"`.
- *edge*: **không** `viec` nào tên chứa `ghi-audit` · `xoa-audit` · `sua-audit`.
- *edge 2*: bốn cửa ghi trên `audit_loi` (`UPDATE` · `DELETE` ·
  `INSERT OR REPLACE` · `INSERT OR IGNORE`) đều **ném** — kể cả với `chu`.

**AC-10.12** — gieo lại mỗi lần khởi động
- *happy*: `cai_dat` thiếu một khoá đã khai → sau khởi động nó có, mang giá trị
  **mặc định**.
- *edge*: chèn tay một khoá **không** có trong `O_SUA_DUOC` → sau khởi động nó
  **bị xoá**.
- *edge 2*: một khoá đã khai, giá trị **đã đổi có chủ ý** → sau khởi động
  **giữ nguyên giá trị đã đổi**, không bị đè về mặc định.

⚠️ *edge 2* là ca dễ cài sai nhất: một cài đặt *"đè hết về mặc định"* sẽ xanh ở
hai ca đầu và **xoá mọi thay đổi của người dùng** mỗi lần restart.

**AC-10.13** — bốn `viec` riêng
- *happy*: `QUYEN` có đủ bốn khoá `moi-nguoi-moi` · `thu-hoi` · `xem-audit` ·
  `sua-cai-dat`.
- *edge*: **không** `viec` nào phủ nhiều hơn một trong bốn — không có
  `quan-tri` / `admin` / `all`.
- *edge 2*: tắt `xem-audit` cho một vai **không** làm mất `thu-hoi` của vai đó.

⚠️ *edge 2* là `CVE-2024-3283` + `CVE-2026-32715` viết thành testcase: cả hai bị
khai thác qua **một endpoint generic mang một quyền thô**, không qua việc hai
thứ hiện cùng một trang.

---

### Phép thử của s6 trên 13 AC mới — 2 mơ hồ, đã sửa

| | |
|---|---|
| viết được ngay | **11 / 13** |
| phải sửa AC trước | **2** — `AC-10.2` · `AC-10.6` |

**`AC-10.2`** — phát biểu đầu là *"không có danh sách khoá bị cấm"*: **đo sự
vắng mặt**, đúng lớp lỗi `B8b` đã sửa **ba lần** trong dự án này (`AC-3.1` ·
`AC-4.1` · `AC-6.1`). Xanh oan ngay khi ai đó đặt tên danh sách chặn là gì khác.
⇒ đo thứ **CÓ MẶT**: thêm một `viec` mới mà không khai ⇒ **bị từ chối**.

**`AC-10.6`** — phát biểu đầu *"không sửa được DANH SÁCH ô sửa được"* **mơ hồ**:
`O_SUA_DUOC` là hằng trong **mã**, nên *"sửa nó qua web"* **vốn bất khả** và AC
không đo được gì. Nguy hiểm **thật** hẹp hơn: nếu `sua-cai-dat` **là** một ô thì
`chu` tắt nó rồi **không ai bật lại được**.
⇒ phát biểu lại thành một câu **đếm được**: `sua-cai-dat` không trong tập ô.

⚠️ **Cả hai đều là lỗi của tôi ở cùng một chỗ**: viết AC nói *cái gì KHÔNG được
tồn tại* thay vì *cái gì phải xảy ra khi thử*. Đó là lần thứ tư trong dự án, và
`spec §9` đã ghi luật: **AC bắt đầu bằng "KHÔNG" ⇒ hỏi ngay "tôi đo cái CÓ MẶT
nào?"**. Tôi viết luật đó rồi vi phạm nó hai lần trong mười ba AC.

---

## Kết quả phép thử của s6 — 18 AC, 3 phải sửa

| | |
|---|---|
| viết được ngay | **15 / 18** |
| phải sửa AC trước | **3** — `AC-3.1` · `AC-4.1` · `AC-6.1` |
| tỉ lệ mơ hồ | **17%** |

**Cả ba rơi vào MỘT lớp**: phép đo **sự vắng mặt** của một chuỗi trong mã nguồn.
Chi tiết + phép đo mới ở `spec §9`.

So với lượt trước (123 AC của M12–M17 → 11 mơ hồ, 9%), tỉ lệ ở đây **cao gấp
đôi**. Lý do đọc được: M18 có nhiều AC dạng **CẤM** hơn bất kỳ module nào khác
(`AC-3.1` một-chỗ-ghi · `AC-4.1` không-có-đường · `AC-6.1` không-dùng-làm-cổng),
và **AC cấm là loại dễ viết thành phép đo vắng mặt nhất**.

⇒ Ghi ra thành một bài học dùng được: **mỗi khi một AC bắt đầu bằng "KHÔNG", hỏi
ngay *"tôi sẽ đo cái CÓ MẶT nào để chứng minh cái không-có-mặt này?"*** Không trả
lời được câu đó ⇒ AC còn mơ hồ, dù câu chữ nghe rất rõ.
