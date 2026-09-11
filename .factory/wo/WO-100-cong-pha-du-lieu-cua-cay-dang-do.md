# WO-100 — `check_running.py` PHÁ dữ liệu của cây nó đang đo; và `.vtt` checkout CRLF làm `sha256` lệch tên

- **mở**: 2026-09-11 · **người mở**: claude (PM M13), từ hai ô backlog dev M13 mở sau sự cố
- **loại**: **bug** · **mức**: `hard` · **sự cố ĐÃ khắc phục** (`WL-01M27G9E22KJEPTBX3SCP25AG1`)
- **module**: `M01_core` (vế A — cổng) · `M04_ci` (vế B — `.gitattributes`) · `M02_kb` (vế C — câu sai ở `RUNNING.md`)
- **kho THẬT của chủ dự án không hề hấn gì** — thiệt hại nằm ở worktree `../gn-m13`, và đã khôi phục

## 0 · Một sự cố, HAI nguyên nhân độc lập

Chúng gặp nhau nên trông như một lỗi, nhưng sửa một cái không chữa cái kia:

```
.vtt trong kb/_media checkout ra CRLF (Windows, không có .gitattributes)
        ↓
sha256 nội dung ≠ sha256 trong TÊN FILE
        ↓
dung_lai_db.py từ chối giữa chừng  ⇒  để lại DB RỖNG        ← nguyên nhân B (M04)
        ↓
xuat_kho.py coi 16 file export là MỒ CÔI và XOÁ chúng
        ↑
check_running.py CHẠY THẬT hai lệnh đó trên kb/ của cây đang dùng ← nguyên nhân A (M01)
```

Không có A thì B chỉ làm một lệnh chạy tay thất bại. Không có B thì A vẫn là một cổng
được phép ghi đè dữ liệu. **Phải sửa cả hai.**

## 1 · Vế A — cổng không được phá thứ nó đang đo (M01)

`check_running.py` **thực thi** mọi lệnh liệt trong `RUNNING.md` (`:50`, `subprocess.run`).
Hai lệnh ở `RUNNING.md:173-174`:

```
| Dựng lại DB từ export (FR-034) | python core/tools/dung_lai_db.py |
| Export DB ra file markdown/yaml | python core/tools/xuat_kho.py  |
```

Không có cờ `--fix|--ghi|--ky` nên nhánh *"chỉ kiểm cú pháp"* (`:96`) không bắt; và
`GHI_KHONG_CO` (`:45`) chỉ có **một** phần tử `07_curate/curate.py`.

⚠️ Đây là **luật gốc ở dạng công cụ**: *không ai được sở hữu thứ dùng để đánh giá mình*
— biến thể: **cổng không được đổi thứ nó đo**. Hệ quả cụ thể ngoài mất dữ liệu: ai chạy
bộ cổng cũng nhận một working tree bẩn, và `git status` sau đó **không còn phân biệt
được** *"tôi vừa sửa gì"* với *"cổng vừa sinh gì"* — đúng công cụ dùng để **quy chủ**
khi máy đỏ.

**Vì sao sống lâu mà không ai thấy**: trên `main` nó **vô hại** (DB và export khớp nhau,
dựng lại ra y hệt). Chỉ worktree — nơi `.vtt` checkout CRLF — mới lộ. Lưới `WO-039` có
sẵn trong chính cổng báo được vết của `sinh_kb_mock.py` nhưng **không chặn** hai lệnh
này và **không hoàn tác**.

**Kỳ vọng**: chạy `check_running.py` **không đổi một byte nào** trong `kb/**`,
`_recycle/**`, `web/_loi.sqlite*`. Hai đường đều đứng được:
(a) thêm cả hai vào `GHI_KHONG_CO`, hoặc (b) chạy chúng với `KB_DIR`/`RECYCLE_DIR` trỏ
thư mục tạm. **(b) tốt hơn** — nó vẫn *chạy thật*, chỉ chạy ở chỗ khác; (a) hạ cổng
xuống mức "kiểm cú pháp" cho đúng hai lệnh quan trọng nhất.

## 2 · Vế B — `.vtt` phải là BINARY với git (M04)

`.gitattributes` hôm nay **rỗng nội dung** (chỉ hai dòng comment giữ đất). Trên Windows,
git checkout `.vtt` ra CRLF ⇒ **sha256 nội dung ≠ sha256 trong tên file** ⇒ mọi bên
kiểm byte đều từ chối.

**Kỳ vọng**: `kb/_media/** -text` (và/hoặc `*.vtt -text`) để git **không đổi EOL** cho
kho hiện vật. `dung_lai_db.py` chạy được trên **mọi** worktree Windows, không chỉ `main`.

⚠️ Đây cũng là lý do `check_worklog` đỏ 8 vế trên worktree mà xanh trên `main`, và là
họ hàng với ca *"19 file lệch chỉ vì EOL"* lúc review nhánh m13.

## 3 · Vế C — `RUNNING.md:54` nói sai về clone mới (M02)

Câu *"Clone mới chưa có DB: chạy `dung_lai_db.py` một lần để dựng"* **không chạy được**:
`kb/_media/*` bị `.gitignore` trừ vài ngoại lệ (**3/8** file có trong git), nên một clone
sạch luôn dừng ở *"kho thiếu byte"*. Đo **hai lần** độc lập:
`WL-01M24MFFK9T8GQSYBXZTZ17C9J` (T04-9) và `WL-01M27G9E22KJEPTBX3SCP25AG1` (hôm nay).

**Kỳ vọng**: câu đó nói đúng điều làm được — hoặc sửa câu, hoặc cho đủ byte vào git,
**và nói rõ đường nào**. Một câu hướng dẫn sai tốn đúng hai lượt đo để phát hiện.

## 4 · Điều WO này KHÔNG làm

- **Không** đổi `dung_lai_db.py`/`xuat_kho.py` — chúng hành xử **đúng**: từ chối khi
  byte lệch, dọn mồ côi khi export không có bản ghi. Lỗi ở **người gọi** và ở **EOL**.
- **Không** đưa byte media vào git để "cho tiện" — `.gitignore:95` chặn video/audio có
  chủ đích, và `rule.md` 19 vừa chốt không đẩy file nặng lên git. Vế C sửa **câu**, không
  sửa chính sách.
- **Không** gộp ba vế vào một đơn vị: ba module, ba chủ.

## 5 · Đo được hôm nay

```
.gitattributes                          2 dòng, đều là comment — 0 luật
GHI_KHONG_CO (check_running.py:45)      1 phần tử: 07_curate/curate.py
RUNNING.md:173-174                      hai lệnh GHI, không cờ, không trong GHI_KHONG_CO
kb/_media trong git                      3 file (2 .vtt + 1 .pdf) / 8 trên đĩa
thiệt hại worktree gn-m13                DB rỗng + 16 file export bị xoá — ĐÃ khôi phục
kho thật :8787                           16 bản ghi, bình thường
```
