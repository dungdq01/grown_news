# WO-084 — `check_g6b` CRASH thay vì ĐỎ khi một task thiếu `verifiability:` — mất cổng plan cho CẢ HAI nhánh

- **mở**: 2026-09-09 · **người mở**: claude (PM M13) · **loại**: **bug** · **mức**: `hard`
- **module**: `M01_core` (chủ `core/tests/**`) · **ảnh hưởng**: mọi module có plan (306 task, 12 module)
- **đơn vị**: `T01-54` (test, đi trước) → `T01-53` — **ĐÃ DUYỆT** 2026-09-09, chủ dự án: *"2. duyệt"*; **chen lên trước `T01-52`** vì đây là cổng mọi đơn vị khác dùng để tự kiểm
- **trạng thái vế A**: **ĐÓNG** 2026-09-09 — chủ hai task tự sửa (`T03-136` 16:08 · `T03-137` 16:09), cả hai nay khai `verifiability:` đúng khuôn
- **trạng thái vế B**: **CÒN MỞ** — xem §6, và đọc §6 trước khi tưởng WO này xong
- **CHỦ THI CÔNG (đổi 2026-09-10)**: **dev M12**, chủ dự án giao (*"WO 84 dev M12 fix bug, tạm thời ko động"*). **PM M13 và dev M13 KHÔNG động** vào `T01-53` · `T01-54` · `core/tests/check_g6b.py` từ mốc này. Hai đơn vị giữ nguyên ID (đổi ID là phá 6 chỗ đang trỏ); chỉ đổi **người làm**

## 1 · Repro — một lệnh

```bash
export PYTHONIOENCODING=utf-8
python core/tests/check_g6b.py
```

```
  FAIL T03-135 M03_web       hard  4 AC/3 cmd  hard: 4 AC nhưng 3 cmd ⇒ R3 hạ soft
Traceback (most recent call last):
  File "core/tests/check_g6b.py", line 81, in <module>
    print(f"  {'ok  ' if not l else 'FAIL'} {tid:<7} {v['mod']:<13} {v['verif']:<5} "
TypeError: unsupported format string passed to NoneType.__format__
```

`exit` code khi chạy qua pipe là **0** — tức một vỏ bọc nào chỉ đọc exit code của
`| tail` sẽ tưởng cổng XANH. Chạy trực tiếp thì exit `1`, nhưng **không phải vì kết
luận**, mà vì traceback.

## 2 · Nguyên nhân — đo được, và nó KHÔNG phải "task sai khuôn"

Hai vế, hai chủ. Vế thứ hai là vế của WO này.

**Vế A · hai task khai sai khoá (chủ: nhánh M03).**
`check_g6b.py:36` đọc `re.search(r"verifiability:\s*(\w+)", t)`. Hai task **chưa
commit** dùng khuôn khác:

| task | mốc giờ | dòng khai |
|---|---|---|
| `T03-136-tran-hien-thi-danh-sach.md` | 14:50 | `- **Loại**: PATCH · \`hard\`` |
| `T03-137-cat-thut-dau-dong.md` | 15:27 | `- **Loại**: PATCH · \`hard\` · M03_web` |

Đo mức phổ biến: **295/297** task dùng `verifiability:`; đúng **2** file dùng khuôn
kia, và cả hai là `?? ` (chưa commit) ⇒ đây là **khuôn sai của một lượt**, không phải
một khuôn mới của dự án. Vế A là việc của **chủ hai task đó**, không phải của WO này.

**Vế B · cổng CRASH thay vì ĐỎ (chủ: M01) — đây là bug.**
Đọc `:74-81`: cổng **ĐÃ CÓ KẾT LUẬN ĐÚNG** — dòng `:76`
`if v["verif"] not in ("hard","soft"): l.append(f"verifiability={v['verif']!r}")`
đã ghi lỗi vào `l`. Nó chết ở **dòng IN** (`:81`), vì `f"{None:<5}"` không hợp lệ.

⇒ Cổng biết task nào sai, và **không nói ra được**. Nặng hơn: nó chết ở task đầu tiên
gặp `None`, nên **297 task còn lại không được kiểm** — một task sai của một người làm
**cả hai nhánh** mất cổng plan. Đây đúng lớp lỗi đã trả giá 2026-09-05 ở
`check_frozen.py`: *cổng kết luận XANH rồi chết ở dòng in, và vỏ nhận exit 1*
(`#cổng-đỏ-oan`, ghi ở docstring `check_frozen.py:26-32`).

## 3 · Kỳ vọng

1. Task thiếu (hoặc khai sai) `verifiability:` ⇒ cổng **ĐỎ, nêu đúng tên task**, và
   **chạy tiếp** 297 task còn lại. Không traceback.
2. Kết luận của cổng **không** phụ thuộc việc format một `None` — mọi ô in ra phải
   chịu được giá trị vắng.
3. `exit 1` vì **kết luận**, không vì exception. Chạy qua pipe cũng phải giữ được
   điều đó (đừng để `| tail` che mất).

## 4 · Vì sao gấp

- `check_g6b` là **cổng plan của mọi module**; hai nhánh (M13 và Space) đang cùng
  chạy và cả hai mất nó.
- `T13-0` (**đã ký FROZEN.lock** 2026-09-09) khai `AC7` với
  `cmd: python core/tests/check_g6b.py` — AC đó **hiện không đo được**.
- Nó cũng là cổng duy nhất hôm nay bắt *ID task trùng*, mà hai nhánh đã va ID **3
  lần** trong tuần.

## 5 · Điều WO này KHÔNG làm

- **Không** sửa `T03-136` / `T03-137`. Chúng thuộc nhánh khác và đang là `??` (chưa
  commit) — checklist song song §4: *"không chạm plan của nhánh kia"*. Vế A đã báo chủ
  dự án; chủ hai task đổi `- **Loại**: PATCH · hard` → `verifiability: hard` là xong.
- **Không** nới regex để chấp nhận khuôn `- **Loại**:` thành khuôn thứ hai. Hai khuôn
  cho một trường là hai chỗ sẽ lệch (`#cổng-xanh-vì-neo-sai`). Nếu dự án **muốn** đổi
  khuôn thì đó là một quyết định riêng, và phải đổi **cả 297 task** cùng lượt.
- **Không** sửa `T03-135` (FAIL `4 AC nhưng 3 cmd`) — đó là một FAIL **thật và đúng**,
  cổng đang làm việc của nó.

## 6 · Cập nhật 2026-09-09 — vế A đóng, và vì sao WO này CHƯA xong

**Đo lại 16:10** (sau khi chủ hai task sửa):

```
python core/tests/check_g6b.py | grep -c "TypeError|Traceback"   → 0
  ok   T03-136 M03_web       hard  5 AC/5 cmd
  ok   T03-137 M03_web       soft  1 AC/0 cmd
1 · 306 task — khai đủ ba mục bắt buộc        (trước: chết ở task thứ ~95)
G6B CHƯA ĐÓNG — 21 lỗi                        (kết luận, KHÔNG phải traceback)
```

`T03-136` = 16:08 · `T03-137` = 16:09, cả hai vẫn `??` chưa commit. Vế A **đóng**.

⚠️ **Cổng nay xanh vì HẾT DỮ LIỆU KÍCH HOẠT, không vì nó đã chịu được.** `:81` vẫn
in **bốn** ô qua f-string (`mod` · `verif` · `acs` · `cmds`); ô nào vắng cũng chết
cùng cách. Task tiếp theo khai thiếu một trường sẽ **lại** khoá cổng cho cả hai
nhánh — và lần này không ai còn nhớ đây là bug đã biết.

Đây là hình dạng nguy hiểm nhất của một bug: **triệu chứng biến mất trước khi nguyên
nhân được sửa**. Nếu đóng WO ở đây thì lần sau nó về dưới một cái tên khác.

⇒ `T01-54` → `T01-53` **giữ nguyên**, đã duyệt, và `T01-54` phải dựng **bốn** ca
(một ca cho mỗi ô in ra), không phải một ca cho `verifiability`. Sửa một ô rồi để ba
ô kia là sửa một phần tư cái bẫy.

**Điều KHÔNG được làm khi thi công**: đừng dùng plan thật làm fixture. Cổng chấm
`check_g6b` phải đọc một cây `07_plan/` **giả** ở thư mục tạm — nếu nó đọc plan thật
thì nó đổi màu theo việc của người khác, và đó đúng là thứ vừa xảy ra.

## 7 · Một lỗi MỚI của cùng lượt, không thuộc WO này

`check_g6b` hiện tố `T03-136`: *"chạm `web/test/tran-hien-thi-luoi.test.js`,
`web/test/_tran.mjs` mà tên không phải đơn vị test"* (`R1`, phần 5 của cổng). Đó là
một **FAIL thật và đúng** — cổng đang làm việc của nó. Chủ `T03-136` xử: tách cổng
sang một đơn vị test riêng, hoặc đổi tên đơn vị. **Không** thuộc `WO-084`, và không
phải việc của PM M13.
