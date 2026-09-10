# FR-050 · Dữ liệu cá nhân trong bản lùi, và lần `push` đầu tiên

- **mở**: 2026-09-02 · **người quyết**: chủ dự án
- **trạng thái**: **ĐÃ CHỐT** 2026-09-02 — **cách 2** (backup ra ổ, không vào git) · **thứ tự**: **b**
- **tầng bị chạm**: s4 (`security_baseline`, `env_plan`) · s8 (một cổng mới)

---

## 0 · Hệ quả của một quyết định đúng

`ADR-06 (c)` — chỉ đạo nguyên văn *"dữ liệu mới làm như dữ liệu cũ đi, site
chính `.db` còn ta vẫn xuất ra được `.md`/`.yaml` để backup"* — là quyết định
**đúng**: nó cho ba bảng gốc một đường lùi, dùng đúng cơ chế `B-C1` của kho.

Nhưng nó tạo ra một thứ dự án **chưa từng có**: **file trong git chứa dữ liệu
cá nhân**.

| file | trường cá nhân |
|---|---|
| `web/_luu/nguoi-dung.yaml` | `ten` — tên thật đồng nghiệp |
| `web/_luu/dinh-danh-kenh.yaml` | `chat_id` — định danh Telegram |

Và `.gitignore` đã khai `!web/_luu/*.yaml` ⇒ chúng **được commit**.

## 1 · Đo: hôm nay chưa nguy, và vì sao

```bash
git remote -v      # => rỗng
```

Repo **chưa có remote**. Trong git **local**, file lùi không khác gì DB — cùng
một ổ cứng, cùng một người truy cập. `B-E5` (NĐ 356/2025) nói về **chuyển** dữ
liệu cá nhân, và chưa có phép chuyển nào xảy ra.

⇒ **Không phải lỗ đang chảy.** Nó là một **bẫy đã cài**: nó nổ vào đúng lần
`git push` đầu tiên, và lúc đó nó nổ **im lặng** — không cổng nào chặn, không
thông báo nào hiện, và dữ liệu đã ra ngoài trước khi ai kịp nghĩ.

## 2 · Quyết định

**a · Một cổng CHẶN `push` khi chưa có hồ sơ.**
`.githooks/pre-push` (mới) — đỏ nếu `web/_luu/*.yaml` nằm trong những gì sắp
push **và** hồ sơ `B-E5` chưa tồn tại.

⚠️ Chọn `pre-push` chứ **không** `pre-commit`: commit vào repo local **không
phải** phép chuyển. Chặn ở commit là chặn sai chỗ, và một cổng chặn sai chỗ sẽ
bị người ta `--no-verify` cho qua — rồi lần sau nó cũng bị bỏ qua ở chỗ đúng.

**b · Hồ sơ tối thiểu, không phải DPIA đầy đủ.**
`04_system/ho-so-du-lieu-ca-nhan.md` — bốn câu: **thu gì · để làm gì · giữ bao
lâu · ai xem được**. Đủ để `pre-push` có thứ đối chiếu và đủ để trả lời nếu
được hỏi. DPIA + DPO là việc của `s9`, không phải điều kiện để đi tiếp.

**c · Ba đường thoát, chủ dự án chọn — FR này KHÔNG chọn hộ.**

| | cách | được gì | mất gì |
|---|---|---|---|
| **1** | remote **riêng tư**, có hồ sơ | giữ nguyên `ADR-06 (c)` | phải viết hồ sơ |
| **2** | **không push** `web/_luu/` — backup ra ổ ngoài | không dữ liệu cá nhân trong git | mất *"clone repo là có đủ"* của `B-C1` |
| **3** | **giả danh hoá**: `ten` → `nd-01`, `chat_id` → băm | đẩy đi đâu cũng được | mất khả năng khôi phục *ai là ai* — mà đó là cả lý do bảng tồn tại |

⚠️ **Cách 3 nghe an toàn nhất nhưng có thể vô dụng nhất**: bản lùi tồn tại để
trả lời *"tài khoản nào của ai"*. Băm `chat_id` xong thì khôi phục ra một tập
người **không định danh được**, và mọi người phải buộc lại kênh — tức đúng thứ
`ADR-06 (c)` xếp là *"mất là mọi người phải buộc lại `chat_id`"*.

## 3 · Cổng

| | vế | đỏ khi |
|---|---|---|
| **X1** | `pre-push` chặn khi thiếu hồ sơ | push có `web/_luu/*.yaml` mà không có hồ sơ ⇒ **qua** |
| **X2** | `pre-push` KHÔNG chặn oan | push không chạm `web/_luu/` mà bị chặn |
| **X3** | hồ sơ có bốn câu | thiếu một trong bốn |
| **X4** | `security_baseline` khai đúng trạng thái | còn câu nào nói *"không có dữ liệu cá nhân"* |

⚠️ **X2 quan trọng ngang X1.** Một hook chặn oan là một hook bị `--no-verify`,
và một hook bị bỏ qua thường xuyên thì lần nó đúng cũng bị bỏ qua.

## 4 · Điều FR này KHÔNG làm

- **Không** chọn hộ một trong ba cách ở §2c — đó là quyết định của chủ dự án về
  dữ liệu của đồng nghiệp mình.
- **Không** lập DPIA/DPO. `s9` làm, và `M17 model_flow §6` đã ghi nó là nợ.
- **Không** gỡ `!web/_luu/*.yaml` khỏi `.gitignore` cho tới khi §2c có quyết
  định — gỡ bây giờ là làm ba bảng gốc **mất backup** để tránh một rủi ro chưa
  xảy ra.
- **Không** đụng `ADR-06`. Quyết định xuất-ra-file **không** bị FR này lật.

---

## 6 · CHỐT — cách **2**: backup ra ổ, KHÔNG vào git

Chủ dự án chọn, nguyên văn: *"option 2: lưu backup ở ổ, kiểu như `/_backup`"*.

### Quyết định

| | |
|---|---|
| `web/_luu/*.yaml` | **KHÔNG commit** — gỡ hai dòng `!` trong `.gitignore` |
| đường backup | `_backup/` ở gốc repo, **gitignore** · override bằng `LOI_LUU` |
| dữ liệu cá nhân trong git | **KHÔNG CÓ** — vấn đề `B-E5` **biến mất**, không phải được quản |

⇒ Không cần hồ sơ 4 câu, không cần hook `pre-push`. Cổng `X1`/`X2`/`X3` của
`§3` **bỏ**; thay bằng `X5`/`X6` dưới.

### Vì sao cách này gọn hơn nó trông

Cách 1 (remote riêng tư + hồ sơ) quản một **rủi ro**; cách 2 **xoá** rủi ro đó.
Với 5 tài khoản, chi phí thật của cách 2 chỉ là *"phải nhớ ổ backup ở đâu"* —
rẻ hơn *"phải nhớ mình đang giữ dữ liệu cá nhân trong git"*.

### ⚠️ Cách này LẬT một vế của `ADR-06 (c)` — phải ghi ra

`ADR-06 (c)` viết: *"ba bảng đáng cứu nay đi đúng đường `B-C1`"* — tức
**export ra file rồi commit vào git**. Sau quyết định này, vế **commit vào
git** **không còn**.

Và `env_plan` §"Dữ liệu giữa các môi trường" khai *"clone repo là có đủ **cộng
một lệnh**"*. Câu đó **hết đúng cho DB của LÕI**: clone repo cho bạn kho, mã,
và mọi thứ dựng lại được từ file — **không** cho bạn 5 tài khoản và mọi `chat_id`
đã buộc.

⇒ Ba câu phải sửa, và đây là **điểm yếu thật** của cách 2:

> **Mất ổ backup = mất tài khoản.** Không có bản thứ hai ở đâu cả. Cách 1 có
> git remote làm bản thứ hai; cách 2 không.

Ghi ra để không ai đọc `B-C1` rồi tưởng git đã phủ.

### Cổng mới

| | vế | đỏ khi |
|---|---|---|
| **X4** | không dữ liệu cá nhân nào trong thứ sắp commit | `git ls-files` thấy `web/_luu/` hoặc `_backup/` |
| **X5** | backup **có thật** ở đường đã khai | `_backup/` rỗng sau khi tạo một tài khoản |
| **X6** | `env_plan` + `ADR-06` khai đúng | còn câu nào nói *"backup = export vào git"* cho DB của LÕI |
| **X7** | mất `_backup/` thì NÓI RA | khôi phục từ repo trắng mà không cảnh báo thiếu tài khoản |

⚠️ **X7 là vế dễ bỏ nhất.** Sau cách 2, một `clone` mới sẽ chạy được **và
không có tài khoản nào** — và đó trông **giống hệt** một hệ thống mới tinh. Phải
phân biệt được *"chưa mời ai"* với *"backup không có ở đây"*, cùng lớp lỗi
`ui_flow §3` (danh sách rỗng vì API chết trông giống chưa mời ai).

### Điều KHÔNG đổi

- `ADR-06 (a)(b)` — dữ liệu có CRUD ⇒ DB; `.db` nằm cùng backend. **Nguyên vẹn**.
- Hai bảng `ma_moi` · `phien` vẫn **không xuất**.
- `xuatLoi()` vẫn tự chạy sau mỗi phép ghi — chỉ **đích** đổi.
- Kho (`kb/`) vẫn dùng `B-C1` như cũ: export vào git **là** backup của nó, vì
  nó **dựng lại được từ file**. Hai loại dữ liệu, hai cơ chế — và đó là lý do
  `ADR-06` tồn tại.
