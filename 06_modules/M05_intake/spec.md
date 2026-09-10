# M05_intake — spec

> Module **duy nhất ngoài M01** được ghi vào `kb/`. Sai ở đây là nhiễm kho —
> nên nó là module có luật chặt nhất trong bảy.

## 1 · Phạm vi

| | |
|---|---|
| **Sở hữu** | thư mục `_inbox/`, quy trình gác cửa |
| **Không sở hữu** | `validate.py` (M01) — **dùng lại**, không copy · `Analysis` (M02) |
| **Vào** | file `.md` người dùng thả vào `_inbox/` |
| **Ra** | một hàng `articles` ở `draft` + `origin: external` (FR-034) · **hoặc** trả lại |
| **Ghi được** | `05_intake/**`, `kb/_kho.sqlite` (INSERT qua validate — file kb/** do xuat_kho.py export) |

## 2 · Business logic

### 2.1 · Vì sao tách khỏi M01

M05 có một luật M01 **không có**: bản `external` không bao giờ vào thẳng
`approved`. Nhét chung thì `validate.py` phải mang hai chế độ, và mỗi lần sửa
logic distiller lại phải nhớ kiểm đường external — thứ dễ quên nhất sau 3 tháng.

Cái làm M05 rẻ: nó **dùng lại nguyên si** schema và validator đã có. Không viết
logic kiểm mới.

### 2.2 · Bốn việc, đúng thứ tự

| # | Việc | Chi tiết |
|---|---|---|
| 1 | Đọc `_inbox/*.md` | không đệ quy, không tự tìm nơi khác |
| 2 | Validate bằng schema sẵn có | thiếu trường ⇒ **trả lại danh sách**, không tự điền |
| 3 | Bắt buộc `citations_sampled ≥ 2` | người tự mở link, xác nhận |
| 4 | INSERT vào kho ở `draft` (FR-034 — trước: ghi file `kb/`) | `origin: external`. **Kho đã có `(source_type, slug)` ⇒ TRẢ LẠI, không ghi đè** |
| 5 | Dọn `_inbox/` | file đã vào kho đổi tên `<ten>.da-vao-kho.md` — đổi tên, không xoá |

**Bước 4 và 5 là sửa của 2026-08-24, sau hai bug đo bằng thực nghiệm:**

- **Ghi đè im lặng.** `dich.write_text()` không kiểm tồn tại. Sửa `one_liner` một
  bài trên web rồi chạy gate ⇒ dòng sửa **biến mất**, không cảnh báo. M08_api có
  `_recycle/` + 409 cho đúng ca này (M08-R4: *"một click nhầm = mất bài"*); đường
  này không có gì. Cùng một kho, hai mức bảo vệ.
- **Không dọn.** File đã vào kho nằm lại `_inbox/`, nên **mỗi** lần chạy gate lại
  xử lý lại từ đầu — đó chính là cơ chế của bug trên. Đổi tên chứ không `unlink`:
  cùng tinh thần M08-R4, file người nộp không xoá thật.

Không tự đổi bản cũ thành `.v<n>.md`: bản lưu trữ là việc của re-analyze (quyết
F3, M02 §2.5), không phải hậu quả của một lần nạp trùng.

> **AC-2.2.4** · Kho đã có `<slug>.md` ⇒ bài nộp bị trả lại, bản trong kho không
> đổi **một byte**; file đã vào kho không bị xử lý lại ở lần chạy sau.
> `hard` · `cmd: python 05_intake/test_gate.py -k khong_ghi_de`
> và `cmd: python 05_intake/test_gate.py -k don_inbox`

**Luồng end-to-end `POST /api/inbox` → `_inbox/` → gate → `kb/`** có AC riêng ở
**T03-5 AC7** (`node web/test/luong-nap-bai.test.js`) — không đặt AC ở đây vì nó
kiểm `web/server.mjs`, thứ thuộc **M03**, còn `server.mjs` chỉ *gọi* gate. R1:
đơn vị test là đơn vị riêng.

Trước 2026-08-24 đây là **đường ghi duy nhất không có test hành vi nào**: `INBOX`
trong `server.mjs` và `INBOX`/`KB` trong `gate.py` là đường **cứng**, nên mọi
phép kiểm sẽ ghi vào `_inbox/` và `kb/` thật. Đó là lý do bug ghi đè sống lâu —
không ai dám viết test cho nó. `INBOX_DIR`/`KB_DIR` (cùng khuôn `KB_DIR` của
`sinh_index.py`) mở đường test.

> **AC-2.2.1** · File thiếu trường bắt buộc bị trả lại, **không** vào `kb/`.
> `hard` · `cmd: python 05_intake/test_gate.py -k tra_lai`

> **AC-2.2.2** · M05 **không tự điền** trường thiếu.
> `hard` · cùng lệnh. Tự điền là bịa có hệ thống — và bịa đi thẳng qua mọi cổng
> còn lại vì nó "hợp lệ".

> **AC-2.2.3** · Bản qua cổng luôn có `origin: external` và `review_status: draft`.
> `hard` · `cmd: python 05_intake/test_gate.py -k draft_external`

### 2.3 · Spot-check trích dẫn — cổng người, không phải cổng máy

Tỉ lệ bịa trích dẫn của LLM khi tóm tắt nguồn kỹ thuật là **17–34%**. Cứ 5 trích
dẫn thì khoảng 1 sai. Kho **không có cách nào tự biết** cái nào sai.

Nên cổng này là: **người mở ít nhất 2 link và xác nhận**.

Schema đã cưỡng chế phần đếm được:
```
origin: external  ⇒  citations_sampled >= 2
                  ⇒  citations_verified >= citations_sampled
                  ⇒  review_status const "draft"
```

> **AC-2.3.1** · `citations_sampled < 2` với `origin: external` ⇒ chặn.
> `hard` · `cmd: python -m pytest core/tests/test_gates.py -k external`

> **AC-2.3.2** · Người thật đã mở link, không phải máy khai hộ.
> `soft` — không lệnh nào phân biệt được. Người chốt. Đây là **giới hạn thật**,
> không phải nợ sẽ trả.

### 2.4 · Trường hợp không có frontmatter

Bản từ agent khác thường **không có frontmatter** — nó là markdown thuần.

Xử lý: trả lại kèm **khung frontmatter tối thiểu** để người điền. Không tự sinh
`id`, `slug`, `credibility` — cả ba đều là quyết định.

Một ngoại lệ: `word_count` là **phép tính**, M05 tính hộ được (giống `--fix`).

> **AC-2.4.1** · File không frontmatter ⇒ trả lại kèm khung, không vào `kb/`.
> `hard` · `cmd: python 05_intake/test_gate.py -k khong_frontmatter`

## 3 · Công thức

Không sở hữu công thức nào. Dùng `word_count` của M01 (§3 của M01_core).

## 4 · Điều module này CẤM

| Cấm | Vì |
|---|---|
| Ghi `review_status: approved` | schema cưỡng chế `draft`; và BRD B-B1 |
| Tự điền trường thiếu | bịa có hệ thống, đi qua mọi cổng vì "hợp lệ" |
| Copy logic từ `validate.py` | hai bản kiểm sẽ lệch nhau; dùng lại, không copy |
| Đặt `origin: pipeline` | bản không đi qua 6 pass thì không phải pipeline |
| Nhận file ngoài `_inbox/` | một cửa duy nhất, dễ rà |

## 5 · Trạng thái

✅ **as-built** — s8, 2026-08-19.

| Phần | File |
|---|---|
| Cổng gác cửa | `05_intake/gate.py` |
| Test | `05_intake/test_gate.py` — 5 nhóm AC |

**Dùng lại** `validate.check()` và `count_words()` của M01 qua import, không copy
(M05-R3). Thư mục vào: `_inbox/`.
