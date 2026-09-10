# FR-048 · Chủ cho bốn bảng tài khoản (M18) + chỗ cho Bài học (M19)

**Mở**: 2026-09-02 · **người mở**: claude · **người duyệt**: chủ dự án
**Trạng thái**: ĐÃ DUYỆT — chủ dự án, 2026-09-02 (*"làm luôn đi"*)
**Tầng bị chạm**: s4 (`project_map` entities) · s3 (`spec_overview`) · s6 (hai module mới)

---

## 0 · Câu hỏi khiến FR này tồn tại

Chủ dự án hỏi, nguyên văn:

> *"có vẻ chúng ta đang thiếu module quản lý người dùng hay bài giảng - khóa học
> nhỉ … chúng ta cần thống nhất các chức năng quản lý người dùng và gom nhóm các
> tài liệu thành Bài giảng / khóa học (giống notebook LM) là module mới hay ở
> module nào"*

Đo xong: **cả hai đều đúng, và cái thứ nhất tệ hơn "thiếu module"**.

---

## 1 · Đo được — bốn bảng tài khoản KHÔNG CÓ CHỦ

`project_map.entities` có đúng **năm** entity:

```
Analysis · Concept · Category · SkillDraft · F0_toan_canh
```

`nguoi_dung` · `ma_moi` · `dinh_danh_kenh` · `phien` **không nằm trong đó**.

Chúng chỉ tồn tại dưới dạng **một khối comment** ở `project_map.yaml:83-90` —
và khối đó nằm trong phần của `M17_cong`, tức module mà `data_flow.md` của chính
nó khai: *"**M17 không sở hữu một entity nào**, và không sở hữu một file dữ liệu
nào."*

### Vì sao chuyện này xảy ra

`FR-045` viết *"bốn bảng, **LÕI** sở hữu"*. **LÕI là một VÙNG TIN CẬY, không phải
một module.** Vùng không đứng tên chủ được: `entities.*.owner` cần một **module**,
vì `owner` là thứ `phạm_vi_ghi` của task neo vào.

### Vì sao KHÔNG cổng nào báo

`core/tests/check_map.py` **không đọc khoá `entities` một lần nào**:

```bash
grep -n "entities\|owner" core/tests/check_map.py   # => 0 dòng
```

Nó chỉ đối chiếu `modules` ↔ thư mục `06_modules/`, hai chiều. Một entity không
chủ **không phải** thứ nó biết cách nhìn. Đây là **lỗ trong bộ cổng**, không phải
một lần ai đó quên.

### Và tôi đã góp vào chỗ sai đó

`ADR-06` (cùng phiên, 2026-09-02) có một bảng ghi chủ của bốn bảng là **M08_api**.
Tôi **tự gán**, trong một ADR, cho một entity chưa có trong map. `M08_api` khai
`purpose: bàn biên tập local — CRUD **bài viết** qua HTTP cho NGƯỜI`. Tài khoản
không nằm trong câu đó.

⇒ FR này sửa cả chỗ đó.

---

## 2 · Hậu quả THỰC — nó chặn `FR-047` ngay hôm nay

`FR-047` (đã duyệt) mở **bảy cửa thao tác trên bốn bảng không có chủ**.

Chia task cho nó bây giờ thì mọi task đều khai `phạm_vi_ghi: web/api/**` — **không
phân biệt được** với task CRUD bài viết. Hệ quả theo `R1`:

- `<scope-check>` không thấy hai task tranh nhau, vì trên giấy chúng **cùng một**
  phạm vi
- `check_g6b` không có module nào để neo `phạm_vi_ghi` vào
- `R1` đo ở **mức nhánh** — hai concern trong một boundary thì nó mất địa chỉ

Đây không phải lo xa: `WL-01K9X2S6DONG` đã ghi *"FR-047 đã duyệt nhưng CHƯA thi
công: bảy cửa ở M08. Ba module (M12 M15 M17) không chia task được trước đó."*
FR-047 chặn ba module, và **thiếu chủ chặn FR-047**.

---

## 3 · Quyết định A · M18_nguoidung — module NGANG, chủ của bốn bảng

### Hình dạng: NGANG, không phải dịch vụ mới

Dự án đã có **ba tiền lệ** đúng hình dạng này — `M09_thuvien`, `M10_tailieu`,
`M11_video`: `be: 06_modules/Mxx/**` · `fe: null` · **không sở hữu một file mã
nào**. Chúng khai **hợp đồng**, module chủ **thi hành**, và mỗi đơn vị việc khai
`phạm_vi_ghi` theo boundary của module chủ — `check_g6b` kiểm đúng điều đó.

⇒ M18 **không** tạo thư mục mới, **không** tiến trình, **không** cổng.
`ADR-05` (mỗi dịch vụ một thư mục/tiến trình/cổng) **không bị chạm**.

### Sở hữu

| entity | cột | ghi chú |
|---|---|---|
| `nguoi_dung` | `id` `ten` `vai` `trang_thai` `tao_luc` | `vai` **chưa ai đọc** — xem §6 |
| `ma_moi` | `ma` `nguoi_dung_id` `het_han` `dung_luc` | một-lần + hết-hạn |
| `dinh_danh_kenh` | `kenh` `chat_id` `nguoi_dung_id` `buoc_luc` | thay allowlist phẳng `B-B4` |
| `phien` | `id` `nguoi_dung_id` `kenh` `ngu_canh` `cap_nhat_luc` | M14 **không** được chạm (`U6`) |

### Ai thi hành

| việc | module chủ | vì sao |
|---|---|---|
| DDL + DB trong `web/` | **M08_api** | `ADR-06` — backend của phần nào ở đâu thì `.db` ở đó |
| bảy cửa `C1–C7` | **M08_api** | `FR-047` |
| xác thực ở biên | **M17_cong** | `Z4` — BIÊN hỏi qua API, không chạm bảng |
| màn admin | **M03_web** | mọi FE thuộc M03 |

### Vì sao s6 là ĐỦ, không cần quay về s1

| tầng | đã phủ chưa | bằng chứng |
|---|---|---|
| s1 research | — | không cần: đây không phải câu hỏi khảo sát |
| s2 proposal | ✅ | `FR-045` đã duyệt = phạm vi đã chốt ở tầng trên s2 |
| s3 PRD | ✅ | `prd.md:8` *"MỘT chủ dự án + 5 tài khoản đọc"*, sửa 2026-09-01 |
| s4 system | ⚠️ | `project_map.entities` thiếu — **FR này vá** |
| s5 UI | ⚠️ | chưa có wireframe màn admin — xem §6 nợ |
| s6 | ⇒ chạy | 9 artifact |

**Tiền lệ quyết định**: `M17_cong` **cũng vào bằng đúng đường này**. Nó không có
mục `## M17_cong` nào trong `spec_overview` — chỉ **ba dòng bảng** (`:429`,
`:580`, `:609`). Nó sinh từ `FR-045` rồi đi thẳng s6, và G6A của nó đã xanh.

⇒ M18 là **giấy tờ đuổi theo một FR đã duyệt**, không phải phạm vi mới.

---

## 4 · Quyết định B · M19_baihoc — GIỮ CHỖ, chưa thi công

### Nó là gì

Một **tập nguồn CÓ TÊN và CÓ THỨ TỰ**, gom bài viết + tài liệu + video thành một
đơn vị học. Chủ dự án mô tả nguyên văn:

> *"mục gom nhóm tập các bài viết, tài liệu hay bài phân tích của AI, video liên
> quan nhau thành 1 tủ sách để dễ phân loại. Dù hiện tại đã có chủ đề, concept
> nhưng mục này là kiểu khác"*

Và lộ trình đã chốt: **bài học → khóa học → lớp học ⇒ Edu**, ở **đợt upgrade 2**.

### Vì sao nó KHÔNG nhét vào M12_chungcat

`M12` chưng **một** nguồn thành **một** nháp — quan hệ 1→1. Bài học là quan hệ
**nhiều-nhiều CÓ THỨ TỰ** giữa ba bảng đã có. Hai hình dạng khác nhau.

Và nó khác `concepts`/`category` ở một điểm **đo được**: **thứ tự không suy ra
được**. `concepts` là một tập; bài học là một **danh sách**. Không có phép tính
nào lấy `concepts` ra thứ tự bài 1 → bài 2 → bài 3.

⇒ Đây là **chiều phân loại THỨ TƯ**, không phải một cách nhìn của ba chiều đã có.

### Chỗ nối ĐÃ CÓ SẴN — và đây là lý lẽ mạnh nhất

`M14_chatbot AC-8.4` (đã viết, G6A xanh) khai:

> *"**MỘT chokepoint.** Đúng **một** hàm giải `bot → tập doc_id`"*

Hôm nay **không có bảng nào đứng sau lời hứa đó**. `AC-8.1` nhận `bot` hoặc
`nguon[]`, `AC-8.5` cấm nhận tập nguồn từ caller ⇒ **server phải giải được `bot`
thành một tập** — bằng cái gì thì M14 không nói, vì không có gì để nói.

`bai_hoc` **chính là** cái bảng đó.

⇒ M19 không phải một cơ chế mới. Nó là **bảng mà M14 đã khai là phải tồn tại**,
và việc chưa có nó là lý do `AC-8.3` phải khai `soft`.

### Vì sao s6 CHƯA đủ cho M19 — nhưng cũng KHÔNG cần s1

| tầng | đã phủ chưa | bằng chứng |
|---|---|---|
| s1 research | ✅ | `research_summary §3.1` nguyên lý ①: *"phạm vi truy hồi là control **hiển thị**"* — đúng ý niệm notebook. NotebookLM là 1 trong 4 bản khảo đã chưng |
| s2 proposal | ❌ | proposal đợt hai **không có** scope-in nào tên "gom nhóm" |
| s3 PRD | ❌ | `prd.md` không có "bài học" |
| s6 | **chặn** | `spec_overview §582` đòi *"mọi scope-in đợt hai có module gánh"* — M19 sẽ là module **không gánh scope-in nào** |

Luật riêng của s2 nói thẳng: *"Proposal duyệt xong = phạm vi thô **CHỐT**. Đổi ⇒
FR, **không âm thầm phình ở s3**."* Edu **là** một mở rộng phạm vi.

⇒ **Không quay về s1.** Đường đúng: FR mở rộng phạm vi (đợt upgrade 2) → PRD +
proposal → s6. FR-048 này **không** làm việc đó — nó chỉ **giữ chỗ**.

### FR-048 làm gì cho M19 — và KHÔNG làm gì

**LÀM**: khai entity `bai_hoc` + `bai_hoc_thanh_vien` vào `project_map.entities`
với `owner: M19_baihoc`, `status: planned`, và một dòng trong `spec_overview`.
Mục đích **duy nhất**: để ba module đợt hai (M13, M14, M03) khai được con trỏ tới
nó thay vì mỗi module tự nghĩ ra một hình dạng.

**KHÔNG LÀM**: spec · AC · DDL · màn · testcase. Không có `06_modules/M19_baihoc/`
ở FR này.

> ⚠️ **Không dùng cờ `da_dung: false` hay bất kỳ cờ "nhớ lật" nào.** `S18` của
> plan tách-ba-module đã trả giá cho đúng bài học đó: *"thứ phải nhớ lật thì sẽ
> có ngày không được lật"*. Ở đây dùng `status: planned` — cùng giá trị `M10` và
> `M11` đang mang, và `check_map` đã biết cách đọc nó.

---

## 5 · Cổng — FR này đóng khi

| # | vế | lệnh |
|---|---|---|
| V1 | bốn entity tài khoản có `owner: M18_nguoidung` trong `project_map` | `python core/tests/check_map.py` |
| V2 | `06_modules/M18_nguoidung/` đủ **9** artifact | `python core/tests/check_g6a.py` |
| V3 | mọi rule S3 của M18 có đủ `lệnh` + `đỏ_khi` + `xanh_khi` | `python core/tests/check_rule_surfaces.py` |
| V4 | `spec_overview` có dòng bảng cho M18 **và** M19 | `python core/tests/check_ba.py` |
| V5 | `ADR-06` sửa chủ bốn bảng từ `M08_api` sang `M18_nguoidung` | đọc |
| V6 | `M19_baihoc` có entity trong map, **không** có thư mục `06_modules/` | `check_map` (hai chiều) |
| V7 | mermaid của M18 dựng được | `python core/tests/check_mermaid.py` |

⚠️ **V6 là vế dễ hiểu ngược**: `check_map` kiểm **hai chiều** — module trong map
phải có thư mục, và thư mục phải có trong map. M19 khai entity nhưng **không**
khai module ⇒ không vi phạm chiều nào. Nếu ai đó thêm `M19_baihoc:` vào `modules:`
mà không dựng thư mục, `check_map` sẽ **đỏ**, và đó là **đúng** — nó bắt đúng lúc
ai đó định thi công M19 mà chưa qua s2/s3.

---

## 6 · Nợ FR này KHÔNG giải — ghi ra để không rơi vào khe

**a · Cột `vai` vẫn chưa ai đọc.** `nguoi_dung.vai` tồn tại từ `FR-045` và
**không một dòng mã nào đọc nó**. "Phân quyền" hôm nay là **một cột trống**;
`M17-R6` (lột `review_status` khỏi payload) là lớp chặn **duy nhất** giữa một
account thường và quyền duyệt. M18 khai điều này thành rule kiểm được, nhưng
**quyết định "vai nào làm được gì"** là của chủ dự án, không phải của FR này.

**b · Chưa có wireframe màn admin.** `05_uiux/wireframes/` có SCR-00…SCR-17,
**không** cái nào là quản lý người dùng. s5 chưa chạy cho màn này. M18 khai
`screens: []` và mở ô backlog, **không** tự bịa một số SCR.

> ⚠️ Kèm theo: hai hệ đánh số SCR đang **lệch nhau**. `project_map` khai
> `SCR-06 SCR-07` = màn Tài liệu / nạp tài liệu; `05_uiux/wireframes/` có
> `SCR-06-ba-man-nap.md` và `SCR-07-chung-cat.md`. **Hai thứ khác hẳn cùng một
> số.** Không phải việc của FR này, nhưng ai đặt số mới cho màn admin sẽ vấp
> ngay ⇒ ô backlog ở M03.

**c · Rate limit + entropy + log thất bại** — lỗ trong `FR-045` đã duyệt
(`security_baseline §8.1`). `FR-047 §4` cố ý không gộp; FR này cũng không.
Vẫn cần **FR riêng**. Nay nó có **chủ** để gửi tới: M18.

**d · M19 cần s2/s3 khi upgrade 2 khởi động.** FR này giữ chỗ, không thay thế.

---

## 7 · Điều FR này KHÔNG đổi

- **`B-B1` nguyên vẹn** — chủ dự án là người **duy nhất** duyệt. M18 quản lý *ai
  có account*, **không** đụng *ai được duyệt*.
- **`M05-R1` nguyên vẹn** — có account không có nghĩa nạp được `approved`.
- **`ADR-05`** — M18/M19 là module NGANG, không dịch vụ, không cổng.
- **`ADR-06`** — chỗ ở của `.db` không đổi; chỉ đổi **tên chủ** trong bảng.
- **`FR-045` U1–U7** — FR này giao chủ cho thứ FR-045 đã quyết, không quyết lại.
- **Không** thi công M19. Không DDL, không màn, không AC.
