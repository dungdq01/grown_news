# M18_nguoidung — spec

> **Module NGANG.** Nó **không sở hữu một file mã nào**. Nó sở hữu **bốn entity**
> và khai hợp đồng; module chủ thi hành (`M08_api` · `M17_cong` · `M03_web`).
> Cùng hình dạng `M09_thuvien` · `M10_tailieu` · `M11_video`.
>
> Nguồn: `FR-045` (đã duyệt) · `FR-047` (đã duyệt) · `FR-048` (mở FR này)
> · `ADR-06` · `prd.md:8` · `security_baseline §8.1`.

## §0 · Vì sao module này tồn tại

`FR-045` khai bốn bảng và viết *"**LÕI** sở hữu"*. **LÕI là một VÙNG TIN CẬY,
không phải một module** — `project_map.entities.*.owner` không nhận được nó, vì
`owner` là thứ `phạm_vi_ghi` của một task neo vào.

Hậu quả đo được trước `FR-048`: bốn bảng chỉ tồn tại dưới dạng **một khối
comment** ở `project_map.yaml:83-90`, và `check_map.py` **không đọc khoá
`entities` một lần nào** (`grep "entities\|owner" core/tests/check_map.py` → 0
dòng). Nên một entity không chủ **không phải thứ bộ cổng biết cách nhìn**.

M18 là cái tên đó. Nó không thêm chức năng nào — nó làm cho thứ `FR-045` đã
quyết trở nên **neo được**.

## §0.1 · Cái M18 KHÔNG đổi

| | vẫn nguyên |
|---|---|
| `B-B1` | chủ dự án là người **DUY NHẤT** duyệt. M18 quản *ai có account*, không quản *ai được duyệt* |
| `M05-R1` | có account **không** có nghĩa nạp được `approved` |
| `ADR-05` | M18 là module NGANG — không thư mục, không tiến trình, không cổng |
| `ADR-06` | chỗ ở của `.db` không đổi; `FR-048` chỉ đổi **tên chủ** |
| `FR-045` U1–U7 | M18 giao chủ cho thứ FR-045 đã quyết, **không quyết lại** |

---

## §1 · Tài khoản

> **AC-1.1** · Tạo một tài khoản sinh đúng một hàng `nguoi_dung` với `tao_luc`
> do **MÁY** đặt, không nhận từ payload.
> `hard` · `cmd: python core/tests/check_tai_khoan.py`

> **AC-1.2** · Thu hồi một tài khoản đổi `trang_thai`, **KHÔNG** xoá hàng. Xoá
> hàng làm mọi bản ghi `audit_log` trỏ tới nó thành mồ côi — và audit là thứ
> duy nhất trả lời *"ai đã làm gì"* sau khi account biến mất.
> `hard` · `cmd: python core/tests/check_tai_khoan.py`

> **AC-1.3** · Sau khi thu hồi, **mọi** `phien` của tài khoản đó hết hiệu lực ở
> **lần dùng kế tiếp**. Đây là vế người ta hay quên: đổi `trang_thai` mà session
> cũ vẫn chạy nghĩa là **thu hồi không có tác dụng gì**.
> `hard` · `cmd: python core/tests/check_thu_hoi.py`

⚠️ **`AC-1.3` học từ một CVE có thật.** `CVE-2026-44560` (Open WebUI) ghi thẳng:
*"revocation is ineffective"* — quyền bị gỡ ở bảng, nhưng ba trong năm đường code
không kiểm lại, nên phiên đang mở vẫn đọc được. Phép đo phải là **hành vi sau khi
thu hồi**, không phải *"cột đã đổi giá trị"*.

---

## §2 · Mã mời

> **AC-2.1** · Sinh mã **bắt buộc** có `het_han`. Sinh một mã không hết hạn là
> **ĐỎ ở cổng SINH**, không phải lúc nó bị dùng.
> `hard` · `cmd: python core/tests/check_ma_moi.py`

> **AC-2.2** · Đánh dấu đã dùng bằng **một câu** `UPDATE ... WHERE dung_luc IS
> NULL` rồi đọc `changes()`. Hai request dùng **cùng** một mã **đồng thời** ⇒
> đúng **MỘT** thành công.
> `hard` · `cmd: python core/tests/check_ma_moi.py`

> **AC-2.3** · Dùng **lại** một mã đã dùng → từ chối, và `dung_luc` **không đổi
> lần hai**. Ghi đè `dung_luc` xoá mất **thời điểm dùng thật**.
> `hard` · `cmd: python core/tests/check_ma_moi.py`

⚠️ **`AC-2.2` là lý do M18-R1 tồn tại.** `SELECT` rồi `UPDATE` là hai câu, và
giữa hai câu có một khe. Với 5 tài khoản thì khe đó gần như không bao giờ trúng
— **và đó chính là điều làm nó nguy hiểm**: nó sẽ không đỏ trong test tay, chỉ
đỏ vào đúng ngày hai người bấm cùng lúc.

---

## §3 · Định danh kênh

> **AC-3.1** · Buộc `chat_id` **chỉ** qua một mã mời hợp lệ, và có **đúng MỘT**
> chỗ trong mã nguồn `INSERT` vào `dinh_danh_kenh`. Phép đo là **đếm** (`= 1`),
> không phải *"không tìm thấy allowlist"*.
> `hard` · `cmd: python core/tests/check_dinh_danh.py`

> **AC-3.2** · Một `chat_id` buộc được vào **đúng một** tài khoản trên **một**
> kênh. Buộc lại vào tài khoản khác ⇒ từ chối, **và ghi audit**.
> `hard` · `cmd: python core/tests/check_dinh_danh.py`

> **AC-3.3** · Thông báo từ chối **KHÔNG** phân biệt được *"chat_id lạ"* với
> *"chat_id có nhưng chưa buộc"*.
> `hard` · `cmd: python core/tests/check_dinh_danh.py`

⚠️ **`AC-3.3` không phải chuyện lịch sự.** Hai thông báo khác nhau biến cửa buộc
kênh thành một **phép đếm tài khoản** cho người lạ: gửi thử N `chat_id`, đọc
thông báo, biết cái nào có thật. `FR-047 V6` khai đúng vế này.

---

## §4 · Phiên

> **AC-4.1** · `phien` sống ở **LÕI**. Tiến trình `M14_chatbot` **không có đường
> tới file `.db` đó** — không biến môi trường trỏ tới nó, không tham số dòng
> lệnh, không thư viện DB nào được nạp. Phép đo là **khả năng**, không phải *"mã
> không nhắc tên bảng"*.
> `hard` · `cmd: python core/tests/check_phien.py`

> **AC-4.2** · `ngu_canh` của một phiên **không** rò sang phiên của tài khoản
> khác. Hai phiên song song của hai người ⇒ hai ngữ cảnh tách bạch.
> `hard` · `cmd: python core/tests/check_phien.py`

⚠️ **`AC-4.1` bảo vệ khỏi một hạng lỗi, không phải một lỗi.** M14 là **THỢ** —
vùng **duy nhất** giữ khoá model và gọi ra Internet. Một prompt injection ở đó là
chuyện phải giả định sẽ xảy ra. Nếu M14 ghi được `phien`, thì injection đó viết
được vào ngữ cảnh của **người khác**. Ranh giới này là thứ biến một sự cố thành
một sự cố **có giới hạn**.

---

## §5 · Xuất và backup

> **AC-5.1** · Hai bảng **của M18** xuất ra file: `nguoi_dung` ·
> `dinh_danh_kenh`. Một trong hai không có đường export ⇒ **ĐỎ**.
> `hard` · `cmd: python core/tests/check_db_dung_cho.py`

⚠️ **Bảng thứ ba phải-xuất — `nhap_chung_cat` — KHÔNG thuộc M18.** Chủ của nó
là `M12_chungcat` (`FR-046`, chủ gán ở `FR-048`). Cùng chính sách `ADR-06 (c)`,
khác chủ — nên AC của nó sống ở M12, và M18 **không khai hộ**. Cả ba dùng
chung một lệnh vì một cổng đọc một bảng khai rẻ hơn ba cổng.

> **AC-5.2** · **HAI** bảng **KHÔNG** xuất trạng thái: `ma_moi` · `phien`. Tìm
> thấy giá trị `ma` hoặc `phien.id` trong bất kỳ file export nào ⇒ **ĐỎ**.
> `hard` · `cmd: python core/tests/check_db_dung_cho.py`

> **AC-5.3** · Xuất **hai lần liên tiếp** không xoá file của lần đầu.
> `hard` · `cmd: python core/tests/check_export_dan_xuat.py`

⚠️ **`AC-5.3` chống một cơ chế đã suýt xoá cả một loại trong kho.**
`xuat_kho.py:141-146` xoá **mọi** file không nằm trong tập `can_co`. Ba bảng mới
xuất ra file ⇒ chúng **phải** vào tập đó, không thì **mỗi lần xuất là mỗi lần xoá
sạch bản backup vừa ghi**. Đây đúng là rủi ro `S12` của plan tách-ba-bảng, tái
xuất trên một tập bảng khác.

---

## §6 · Vai — một cột trống, và spec này KHÔNG lấp nó

> **AC-6.1** *(ĐỔI NGHĨA 2026-09-02, `FR-051`)* · `nguoi_dung.vai` được đọc ở
> **ĐÚNG MỘT** chokepoint (`duocLam`). Mọi khác biệt hành vi giữa hai vai đi
> qua chokepoint đó — **không** qua một `if` rải rác.
> `hard` · `cmd: cd web && node test/phan-quyen.test.js`

> **AC-6.2** · `vai` là **enum ĐÓNG** (`chu` · `dong_nghiep`), `NOT NULL`,
> mặc định là vai **ÍT quyền nhất**. Một hàng thiếu `vai` **không dựng được**.
> `hard` · `cmd: cd web && node test/phan-quyen.test.js`

> **AC-6.3** · **DENY mặc định**: một `viec` chưa khai quyền ⇒ **không ai** làm
> được, kể cả chủ dự án.
> `hard` · `cmd: cd web && node test/phan-quyen.test.js`

> **AC-6.4** · `duyet-bai` **KHÔNG** có trong bảng quyền. `B-B1` ở **mã**,
> không ở dữ liệu.
> `hard` · `cmd: cd web && node test/phan-quyen.test.js`

### Vòng đời của `AC-6.1` — một AC CẤM thành một AC LÀM

| | |
|---|---|
| s6, lúc viết spec | `vai` là **cột trống**. AC-6.1 khai **CẤM**: *"bốn vai khác nhau ⇒ cùng một kết quả"* |
| vì sao cấm | một cột trống bắt đầu làm cổng chặn sẽ chặn theo giá trị **chưa ai định nghĩa**, và cách hỏng của nó là **fail-open** (`CVE-2026-47713`: `user ? whereWithUser(user) : where({})` — thiếu danh tính thì trả **tất cả**) |
| `FR-051` chốt ma trận | `vai` **có** tác dụng ⇒ AC cũ **phải đỏ**, và nó đỏ bằng cách **NÉM** vì `CHECK` mới từ chối giá trị bịa mà nó gieo |
| 2026-09-02 | AC **ĐỔI NGHĨA**, không bị xoá: từ *"vai không phải cổng"* sang *"vai chỉ đọc ở một chokepoint"* |

⚠️ **Sửa AC, KHÔNG xoá cổng.** Xoá một cổng vì nó đỏ là cách một luật biến mất
mà không ai quyết định gỡ nó. Vế bản cũ giữ được — *"cùng `vai` ⇒ cùng kết
quả"* — nay là một trong năm ca của nghĩa mới.

**Fail-open nay bị cấm bằng CẤU TRÚC, không bằng phép kiểm**: `vai NOT NULL
DEFAULT 'dong_nghiep'` + `CHECK` enum ⇒ ca `vai = null` **không dựng được nữa**.

**`M17-R6` vẫn là lớp chặn ở BIÊN** và không bị `FR-051` thay: nó lột
`review_status` khỏi payload theo **đường**, còn `duocLam` chặn theo **người**.
Hai lớp, hai chiều — bỏ một cái thì cái kia không cứu được.

---

## §6.5 · Bốn cửa ĐÃ CẮM — ở tầng THAO TÁC, và vì sao không ở route

Chủ dự án chốt 2026-09-03: *"cắm cả 4 cửa nha"*.

### Cắm ở đâu, và vì sao không ở route

Đo được trước khi cắm: **3 trong 4** `viec` **chưa có route nào** —
`moi-nguoi-moi` · `thu-hoi` · `xem-audit` đều là thao tác của màn admin, mà màn
đó chưa dựng (`screens: []`, s5 chưa chạy). Chỉ `sua-bai-nguoi-khac` có route
(`PUT /api/articles/:type/:slug`).

⇒ Cắm ở **route** nghĩa là để **ba lỗ hở** tới ngày dựng màn — và ngày đó ai
dựng route sẽ phải **NHỚ** cắm. Một phép kiểm phải-nhớ-cắm là một phép kiểm sẽ
có ngày không được cắm.

⇒ Cắm trong **hàm** (`epQuyen`), gọi từ **năm** thao tác quản trị. Route mới
**không đi vòng được**.

| thao tác | `viec` |
|---|---|
| `loiTaoNguoiDung` · `loiCapMaMoi` · `loiDatVai` | `moi-nguoi-moi` |
| `loiThuHoi` | `thu-hoi` |
| `loiDocAudit` | `xem-audit` |

### Cửa bootstrap — và nó TỰ ĐÓNG

`epQuyen` **fail-closed**: thiếu danh tính ⇒ **NÉM**, không phải cho qua. Đúng
một ngoại lệ: bảng `nguoi_dung` còn **rỗng**.

Ngoại lệ đó cần thiết vì tài khoản **đầu tiên** không thể do ai tạo — chưa có
ai. Và nó **tự đóng**: sau hàng đầu tiên `count(*) > 0` vĩnh viễn, nên **không
cờ nào phải nhớ tắt**. Bài học `S18` (*"thứ phải nhớ lật sẽ có ngày không được
lật"*) áp cho một cửa thoát an ninh.

> **AC-6.5** · Năm thao tác quản trị gọi `epQuyen`; `epQuyen` gọi `duocLam`;
> thiếu danh tính ⇒ NÉM. Mọi `viec` trong `QUYEN` (trừ `nap-nguon` — của cả hai
> vai) có một chỗ ép.
> `hard` · `cmd: cd web && node test/phan-quyen.test.js`

### ⚠️ Một DEADLOCK trong bản đầu của tôi — đã sửa

Bản đầu luôn tạo `dong_nghiep` (theo `DEFAULT` của DDL). Hệ quả: tài khoản đầu
tiên **tạo được** qua cửa bootstrap, nhưng **không bao giờ nâng lên `chu`
được** — `loiDatVai` đòi quyền `moi-nguoi-moi`, quyền đó đòi vai `chu`, và
không ai có vai `chu`.

Một hệ thống **không ai quản được, từ dòng đầu tiên**. Và nó sẽ chỉ lộ ra ở lần
cài đặt thật đầu tiên, không lộ ra ở bất kỳ test nào đang có.

⇒ Cửa bootstrap không chỉ phải cho **TẠO**, nó phải cho tạo **một người quản
được hệ**. Nay: tài khoản đầu tiên **sinh ra với vai `chu`**. Khớp `prd.md:8`
(*MỘT chủ dự án + 5 đồng nghiệp*).

> **AC-6.6** · Tài khoản đầu tiên sinh ra với `vai = chu`; tài khoản thứ hai
> trở đi là `dong_nghiep`.
> `hard` · `cmd: cd web && node test/phan-quyen.test.js`

### Vế còn lại: `sua-bai-nguoi-khac` — CHƯA CẮM

`PUT /api/articles/:type/:slug` là **cửa của NGƯỜI** trên `127.0.0.1`, và nó
**không mang danh tính người gọi** — hôm nay không có phiên nào ở đường đó.

Cắm nó đòi một quyết định khác: cửa của người phải **có phiên** trước. Đó là
việc của màn admin + `C6`, không phải của FR này.

⚠️ Câu **«CHƯA CẮM»** ở trên do cổng `Y11` canh: cắm rồi thì nó **buộc phải
gỡ**, không thì đỏ. Trạng thái này không lặng lẽ đọc thành *"đã cưỡng chế"* được.

---

## §7 · Ba AC là LỖ trong `FR-045` đã duyệt — chưa được phép thi công

> **AC-7.1** · Rate limit theo **IP** và theo **mã**, đo bằng **HÀNH VI**: bắn
> `N+1` request, đòi cái thứ `N+1` bị chặn; đổi ngưỡng rồi bắn lại ⇒ điểm chặn
> **dời theo**.
> `hard` · `cmd: cd web && node test/rate-limit.test.js`

> **AC-7.2** · Entropy của `ma` ≥ **128 bit** từ nguồn ngẫu nhiên **mã hoá**.
> `hard` · `cmd: cd web && node test/rate-limit.test.js`

> **AC-7.3** · **Mỗi** lần thử thất bại ghi `audit_log`, và **dòng log KHÔNG
> chứa mã đã thử**.
> `hard` · `cmd: cd web && node test/rate-limit.test.js`

✅ **`FR-049` đã duyệt và THI CÔNG 2026-09-02** — ba AC trên promote từ `soft`
sang `hard`, lệnh `cd web && node test/rate-limit.test.js` **chạy được**.

Giữ lại đoạn dưới vì nó ghi *vì sao* ba AC này từng là `soft`, và đó là một
tiền lệ đáng đọc lại: chúng `soft` **không phải vì không đo được** — cả ba viết
được testcase ngay từ s6. Chúng `soft` vì là **một lỗ an ninh trong một FR ĐÃ
DUYỆT** (`security_baseline §8.1`), và thi công một lỗ an ninh dưới vỏ một task
thường là cách nó không được ai xem kỹ. `FR-047 §4` cố ý không gộp; `FR-048`
cũng không. Chúng chờ **FR riêng**, và `FR-049` là FR đó.

⚠️ **Hai trong ba vế hoá ra ĐÃ ĐÚNG trước khi `FR-049` chạy** — entropy đã là
256 bit, log thất bại đã có, cả hai đến từ `FR-047` **không cố ý**. Nhưng
**0 cổng canh chúng**: đổi `randomBytes(32)` → `Math.random()` thì mọi test cũ
vẫn xanh. ⇒ Phần lớn giá trị của `FR-049` không phải *dựng thêm*, mà là **đặt
răng cho hai tính chất đang đúng mà không được bảo vệ**. Một tính chất đúng
tình cờ là một tính chất sẽ mất tình cờ.

Hậu quả nếu bỏ: `ma_moi` một-lần + hết-hạn chặn *dùng lại* và *dùng muộn*,
**không** chặn **thử hàng nghìn lần trong cửa sổ còn hiệu lực**. Và đoán được mã
không phải *"đăng nhập sai"* — nó là **THÀNH người khác trong kho**.

---

## §8 · Trạng thái các lệnh trong spec này

**Mười một lệnh riêng biệt, `5/11` đã cài** (đo bằng máy, không đếm tay):

| có | chưa cài |
|---|---|
| `check_db_dung_cho.py` *(T08-10)* · `check_export_dan_xuat.py` · `web/test/loi-cua.test.js` *(T08-12b)* · `web/test/loi-cua-http.test.js` *(T08-14b)* · `web/test/rate-limit.test.js` *(T08-15b)* | `check_tai_khoan` · `check_thu_hoi` · `check_dinh_danh` · `check_phien` |

⚠️ **Bản đầu của mục này viết *"sáu lệnh chưa cài một cái nào"* — SAI ngay lúc
viết**, không phải sai vì cũ: `check_export_dan_xuat.py` đã tồn tại từ trước.
Tôi đếm tay thay vì cho máy đếm, đúng thứ `CLAUDE.md` cấm (*"đếm tay rồi chép
số"*). Lệnh đếm lại:

```bash
grep -oE "cmd: python [a-z_/.]+" 06_modules/M18_nguoidung/spec.md \n  | sed 's/cmd: python //' | sort -u \n  | while read f; do [ -f "$f" ] && echo "CO   $f" || echo "chua $f"; done
```

Sáu lệnh còn lại đều kiểm **hành vi runtime của bốn bảng chưa được tạo**, nên
viết bây giờ là viết cổng rỗng.

Ghi ra vì đây là chỗ dễ đọc sai nhất của một spec module `planned`: nhãn `hard`
nói *"AC này đo được bằng máy"*, **không** nói *"máy đó đã tồn tại"*. Chưa cài ⇒
vế gate đó **không tồn tại và không ai báo**.

`M17_cong` đang ở đúng trạng thái này với sáu lệnh `cong/tests/` của nó.

## §10 · Cài đặt — ô quyền sửa được từ web

*(mở 2026-09-03 · `FR-054` · `ADR-07` · `B-B6` · `security_baseline §9`)*

### §10.0 · Ba tầng, và ranh giới giữa chúng LÀ spec

| tầng | ở đâu | ai đổi được |
|---|---|---|
| **bất biến** | mã + DDL `CHECK` | **không ai**, kể cả `chu`, kể cả qua form |
| **schema ô** | `O_SUA_DUOC` trong mã | không ai **qua web** — sửa = PR |
| **giá trị ô** | bảng `cai_dat` | `chu`, qua web |

Tầng giữa phân biệt spec này với *"một form sửa DB"*: DB chỉ giữ **giá trị** của
ô **đã khai tồn tại trong mã**. Không đường nào để form **tạo ra một ô mới**.

> **AC-10.1** · Ghi một khoá **không có** trong `O_SUA_DUOC` ⇒ **từ chối**, và
> **không** tạo hàng nào trong `cai_dat`.
> `hard` · `cmd: cd web && node test/cai-dat.test.js`

> **AC-10.2** · **Allowlist, không denylist** — đo bằng **HÀNH VI**: thêm một
> khoá **mới** vào tập ô mà **không** khai nó trong `O_SUA_DUOC` ⇒ nó **bị từ
> chối**. Tức tập mặc định là **rỗng**, không phải *"mọi thứ trừ vài cái"*.
> `hard` · `cmd: cd web && node test/cai-dat.test.js`

⚠️ Phép đo đầu tôi viết là *"không có danh sách khoá bị cấm"* — **đo sự vắng
mặt**, đúng lớp lỗi `B8b` đã sửa ba lần trong dự án này (`AC-3.1` · `AC-4.1` ·
`AC-6.1`). Nó xanh oan ngay khi ai đó đặt tên danh sách chặn là gì khác.
⇒ Đo thứ **CÓ MẶT**: một khoá chưa khai **bị từ chối**.

⚠️ `AC-10.2` từ hai bằng chứng độc lập: `CVE-2018-8007` (CouchDB) **đi vòng một
blacklist**; và Supabase cho thấy invariant *"update hàng của mình nhưng không
cột này"* là **bất khả** diễn đạt trong RLS — tức có luật **không viết được** ở
tầng dữ liệu, nên tập ô phải khai ở tầng **mã**.

### §10.1 · Bốn vế KHÔNG THƯƠNG LƯỢNG

> **AC-10.3** · `duyet-bai` **không** có trong `QUYEN` **và không** có trong
> `O_SUA_DUOC`.
> `hard` · `cmd: cd web && node test/cai-dat.test.js`

> **AC-10.4** · `vai` **không** là một ô. Không khoá nào trong `O_SUA_DUOC` đổi
> được `nguoi_dung.vai`.
> `hard` · `cmd: cd web && node test/cai-dat.test.js`

> **AC-10.5** · Cửa ghi nhận **`(khoa, gia_tri)`**, KHÔNG nhận object.
> `hard` · `cmd: cd web && node test/cai-dat.test.js`

> **AC-10.6** · **`sua-cai-dat` KHÔNG có trong `O_SUA_DUOC`.** Tức ô *"ai được
> sửa cài đặt"* **không phải một ô sửa được** — nó là bất biến ở tầng `QUYEN`.
> `hard` · `cmd: cd web && node test/cai-dat.test.js`

⚠️ Phát biểu đầu của tôi — *"không sửa được DANH SÁCH ô sửa được"* — **mơ hồ**:
`O_SUA_DUOC` là một hằng trong **mã**, không phải hàng trong DB, nên *"sửa nó
qua web"* **vốn đã bất khả** và AC đó không đo được gì.

Nguy hiểm **thật** hẹp hơn và cụ thể hơn: nếu `sua-cai-dat` **là** một ô, thì
`chu` tắt nó rồi **không ai bật lại được** (tự khoá), hoặc — tệ hơn — một ô
khác bật nó cho `dong_nghiep` và **một ô mở ra tất cả các ô**
(`CVE-2026-17601`).
⇒ Phát biểu lại thành một câu **đếm được**: `sua-cai-dat` không nằm trong tập ô.

| AC | giá nếu bỏ |
|---|---|
| `10.3` | `CVE-2024-3283` — cửa setting đổi `multi_user_mode` ⇒ **tạo được admin** |
| `10.4` | `CVE-2026-9796` — neo luật vào **tên vai** sửa được ⇒ TOCTOU đổi tên |
| `10.5` | `CVE-2026-31942` — `{ userId: req.user.id, ...body }` ⇒ mất API key **mọi người** |
| `10.6` | `CVE-2026-17601` — một ô **mở ra tất cả các ô** |

### §10.2 · Vế NỀN — rẻ hơn cả bốn vế trên

> **AC-10.7** · `gia_tri` là **boolean**. Không chuỗi tự do, không JSON. Không
> ô nào được diễn giải thành đường dẫn · lệnh · URL server gọi ra · mã.
> `hard` · `cmd: cd web && node test/cai-dat.test.js`

Giá nếu làm ngược: `CVE-2024-3104` (**9.8**) · `CVE-2024-3028`/`3025` (một
trường setting ⇒ **xoá được file SQLite**) · `CVE-2026-32625` (nội suy **trong
tầng validate** ⇒ rò `JWT_SECRET`).

⇒ Với vế này, một lỗi bỏ sót phép kiểm vai tốn **toàn vẹn dữ liệu**. Không có
nó, nó tốn **máy chủ**.

### §10.3 · Chokepoint phải trả BA câu, không một

> **AC-10.8** · `duocLam` trả **`boolean` ĐỒNG BỘ** — `typeof === "boolean"`,
> không bao giờ `Promise`.
> `hard` · `cmd: cd web && node test/cai-dat.test.js`

⚠️ **`AC-10.8` nghe vụn nhưng nó là một CVE.** `CVE-2026-77426` (Unleash): một
`await` bị quên biến `Promise` thành **truthy** ⇒ **mọi** phép kiểm thành
`true`. `duocLam` hôm nay đồng bộ — nhưng **do may**, và cổng duy nhất bắt được
là **kiểu trả về**.

> **AC-10.9** · Cửa ghi setting kiểm **cả ba**: *ai ghi* · *khoá nào* · *giá trị
> nào*. Không phải chỉ *ai ghi*.
> `hard` · `cmd: cd web && node test/cai-dat.test.js`

⚠️ **Một chokepoint là điều kiện CẦN, không ĐỦ.** LiteLLM **có** chokepoint; nó
gác **route**, không gác **trường**. `duocLam` hôm nay trả câu đầu — `AC-10.9`
là hai câu còn lại.

### §10.4 · Vết đổi setting

> **AC-10.10** · Mọi lần đổi ghi `audit_loi` với **cả hai** danh tính: `boi`
> (ai đã đổi) và khoá bị đổi. Đếm hàng `boi IS NULL` = **0**.
> `hard` · `cmd: cd web && node test/cai-dat.test.js`

`SEC 17a-4(f)(2)(i)` gọi tên trường này — *"identity of the actor"*. Và
`CVE-2026-48086` ghi đúng chỗ né được nếu thiếu.

> **AC-10.11** · *"Quản quyền"* và *"quản audit"* **không** cùng một `viec`.
> `QUYEN` có `xem-audit` (**đọc**) và **không** `viec` nào **ghi/xoá** audit.
> `hard` · `cmd: cd web && node test/cai-dat.test.js`

`NIST AU-9(4)` + `AC-5` + `ASVS V4.3.3` đòi tách trục **quyền ↔ audit**. Trạng
thái hôm nay **đúng sẵn** — `AC-10.11` khai nó thành luật để nó không trôi.

### §10.5 · Gieo lại mỗi lần khởi động — `ADR-07 (a)` đường 3

> **AC-10.12** · Mỗi lần khởi động: khoá trong `cai_dat` **không** có trong
> `O_SUA_DUOC` bị **xoá**; khoá thiếu được gieo giá trị mặc định.
> `hard` · `cmd: cd web && node test/cai-dat.test.js`

Hình dạng `k8s` auto-reconciliation. Hợp `SCR-16` (*bảng khai trong repo là
nguồn*).

⚠️ **Nó KHÔNG thay break-glass.** Nó cứu ca *"ô setting bị sửa hỏng"*, **không**
cứu ca *"không còn `chu`"*. Ca thứ hai `ADR-07 (a)` **cố ý để hở** — xem §10.7.

### §10.6 · Màn: GỘP, nhưng `viec` TÁCH

> **AC-10.13** · Bốn `viec` riêng: `moi-nguoi-moi` · `thu-hoi` · `xem-audit` ·
> `sua-cai-dat`. **Không** một `viec` khối nào phủ cả bốn.
> `hard` · `cmd: cd web && node test/cai-dat.test.js`

`s1` tìm tiền lệ **tách** (Strapi: *"separation of concerns"*) nhưng lý do
**không phải an ninh**, và *"có hệ nào HỐI TIẾC vì gộp"* ⇒ **không tìm thấy**.

Có **CVE** trả lời đúng câu hỏi: `CVE-2024-3283` rồi `CVE-2026-32715` (hai năm
sau, **cùng cặp cửa**) đều bị khai thác qua **một endpoint generic mang một
quyền thô** — không phải qua việc hai thứ hiện cùng một trang.

⇒ Cái gây hại là **độ thô của phép uỷ quyền**. Nên: **một màn, bốn `viec`**.

### §10.7 · Ca CÒN HỞ — chấp nhận có ý thức, không bỏ sót

**`chu` duy nhất mất quyền truy cập ⇒ không có đường vào.**

`ADR-07 (a)` chọn *chặn* (`Y10`, đã có) + *gieo lại* (`AC-10.12`), và **cố ý
không** làm break-glass ngoài UI: nó là một **cửa hậu thường trực** mà `s1` khai
phải kèm **năm** nghĩa vụ (đánh dấu tạm trên UI · xoá bằng tay · phục hồi đòi
dừng tiến trình · ghi audit · báo động). Với **một** admin duy nhất, năm nghĩa
vụ đó không có ai kiểm chéo.

Đường ra là `sqlite3` trên file `.db` — **chạm máy**, không chạm UI. Chấp nhận
được vì `web/` chỉ nghe `127.0.0.1`.

> ⚠️ **Câu này ĐỔI nếu `M17_cong` đưa hệ ra Internet.** Ghi ở đây, không ở
> `backlog`: đó là *"thứ chưa xây"* theo một điều kiện chưa xảy ra, không phải
> nợ do một thay đổi cụ thể gây ra.

### §10.8 · Nhân chứng cho `audit_loi` — CHƯA GIẢI

`ADR-07 (c)` chốt `git push` sang remote có `denyNonFastForwards` +
`denyDeletes`. Nhưng nó đụng `FR-050` cách 2: bản lùi của DB LÕI **không vào
git** vì chứa dữ liệu cá nhân.

`_audit.jsonl` là audit của **kho**; `audit_loi` là audit của **LÕI** — hai file
khác nhau. Vế *"nhân chứng cho `audit_loi`"* **chưa có đường**, và nó là câu cho
FR thi công, không phải cho spec này.

⚠️ Và phải công bố **`(số_hàng, head, thời_điểm)`**, không chỉ hash: chỉ hash
thì **cắt đuôi** vẫn cho chuỗi hợp lệ (`RFC 9162 §1`).

### §10.9 · Điều §10 KHÔNG làm

- **Không** làm `SCR-16` thành form. Bảng model/trần/quota vẫn **read-only, trỏ
  file**. Chỉ **ô quyền** mở ra ở đợt này.
- **Không** dựng RBAC đầy đủ / ABAC / policy engine.
  ⚠️ Và khai thẳng: `s1` **tìm kỹ và KHÔNG tìm thấy** ngưỡng công bố dạng *"dưới
  N người thì RBAC là thừa"* — 14 truy vấn, **9 PDF grep toàn văn** (NIST IR
  7316, ANSI INCITS 359-2004, Sandhu 1996, Zanzibar 2019…), **toàn bộ âm tính**.
  Nên câu *"6 người thì RBAC thừa"* là **suy luận**, không phải fact.
- **Không** mở `M20`. Gộp vào `M18` (`FR-054 §8`).
- **Không** ký `FROZEN.lock`.

---

## §9 · Phép thử của s6 — ba AC đã sửa trước khi viết testcase

s6 nói: *"viết không nổi testcase cho một AC ⇒ AC đó mơ hồ ⇒ DỪNG, sửa AC"*.
Chạy trên 18 AC: **15 viết được ngay, 3 không**. Cả ba rơi vào **cùng một lớp** —
và đó là lớp lỗi dự án **đã trả giá một lần**, ở `B8b`:

> phép kiểm *"mã không chứa hằng số X"* **xanh oan** ngay khi X đi qua một biến.

| AC | đo cũ (hỏng) | đo mới |
|---|---|---|
| `AC-3.1` | *"không tìm thấy allowlist"* — vắng mặt | **đếm** chỗ `INSERT dinh_danh_kenh` `= 1` |
| `AC-4.1` | *"M14 không nhắc tên bảng"* — grep | **khả năng**: tiến trình M14 không có đường tới file `.db` |
| `AC-6.1` | *"không có `if (vai === ...)`"* — grep | **hành vi**: hai `vai` khác nhau ⇒ cùng một kết quả |

**Ba cái đều là phép đo SỰ VẮNG MẶT.** Sự vắng mặt của một chuỗi trong mã không
chứng minh sự vắng mặt của một hành vi: đổi tên biến, nối chuỗi, đọc từ cấu hình
— cổng vẫn xanh, luật đã chết. Ba phép đo mới đều đo thứ **có mặt**: một con số
đếm được, một khả năng có/không, một cặp kết quả so được với nhau.

⚠️ Đây không phải chuyện câu chữ. Nếu để nguyên, cả ba sẽ vào s8 thành **ba cổng
xanh rỗng** — và một cổng xanh rỗng tệ hơn không có cổng, vì nó làm người ta tin.
