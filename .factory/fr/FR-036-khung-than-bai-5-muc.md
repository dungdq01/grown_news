# FR-036 — Khung thân bài: 9 mục → 5 mục, khai ở MỘT nơi

mở_bởi: người dùng — `upgrade.md:70-82` *"Hiện tại cấu trúc bài viết hơi rườm rà và thiếu linh động… tôi cần linh động cho tất cả bài viết có thể là Technical, AI, ecommerce, bank… ta cần tìm bộ khung linh động và cơ bản nhất"*, kèm đề xuất 5 mục; đính chính *"chỉ nằm trong mục nội dung thôi (khung 9 mục giờ thay bằng khung này)"*
tới: M01_core (`spec.md` FROZEN · `diagram_flow.md`) · M02_kb (`model_flow.md`) · M03_web (`spec.md` FROZEN) · `core/src/source_distiller/validate.py` · `05_uiux/wireframes/SCR-05` · `03_docs/prd.md` · `FROZEN.lock`
mức: đổi hợp đồng hình dạng thân bài — mọi đường ghi của hệ thống đi qua nó
trạng_thái: **DUYỆT 2026-08-27** — người dùng duyệt plan qua ExitPlanMode; bốn quyết định chốt qua AskUserQuestion
thay_thế: phần CON SỐ của FR-020 (9 ô, sàn 35%). Nguyên tắc của FR-020 giữ nguyên.

---

## 1 · Khung mới

```
## 1. Overview              một câu: bài này nói cái gì mới
## 2. Bối cảnh              vấn đề gì tồn tại trước → vì sao nguồn này có
## 3. Nội dung              MỘT mục, bốn mục con:
     ### 3.1 Đầu vào
     ### 3.2 Process        mục nặng · đòi locator
     ### 3.3 Output         đòi locator
     ### 3.4 Tinh túy       mục nặng · đòi locator · `#### 3.4.x` + 5 dòng bullet
## 4. Ý nghĩa thực tế       đòi locator ("+ ví dụ thực tế" — ví dụ không địa chỉ là ví dụ bịa)
## 5. Rủi ro và tầm nhìn
```

Mục **Tự kiểm** (§9 cũ) bỏ — người dùng xác nhận.

## 2 · Cái giá, nói trước

**Cổng tỉ lệ đảo chiều, và nếu không đảo thì nó thành cổng không bao giờ đỏ.**
Bản cũ đo SÀN: *mục 5+6 ≥35%*. §3 mới hút cả bốn mục cũ (3,4,5,6) nên nó ~70%
thân bài **kể cả khi phần dẫn nhập phình ra** — sàn đó luôn thoả, tức nó thôi đo
điều nó sinh ra để đo.

Ý định không đổi (chặn người viết viết lại phần dẫn nhập thay vì đọc thật), nên
cổng đo ở **chỗ bị lạm dụng**: TRẦN `§1+§2 ≤ 25%`.

Guard là `if actual:` chứ **không** `if 1 in secs and 2 in secs` — đó là lỗ của
cổng cũ: xoá mục là cổng tự tắt. Mục vắng góp 0 từ, và cổng "thiếu mục" đã lo
việc nó vắng.

## 3 · Khai ở MỘT nơi — `core/assets/khung-than-bai.json`

Khung 9 mục cũ được gõ tay ở **sáu** chỗ, và đã trôi thành **HAI bộ tên khác
nhau** mà không cổng nào bắt được — vì `validate.py` chỉ ép SỐ mục, không bao giờ
đọc tên:

| Bộ | Ở đâu |
|---|---|
A | `TEN_MUC` trong FE · `kb/` · `core/tests/fixtures/dat-chuan.md` |
B | **cả 14** `kb-mock/` · `web/test/_api.mjs` · `_seed.mjs` · `05_intake/test_gate.py` · `nap-bai/SKILL.md` |

Bốn đường dẫn xuất, không bản gõ tay thứ hai:

| Người dùng | Cách lấy |
|---|---|
Python | `core/src/source_distiller/khung.py` — `SO_MUC/CON/LA/CAN_LOCATOR/TRAN_DAN_NHAP` + `than_mau()` |
Test Node | `web/test/_khung.mjs` — cùng file JSON, cùng luật chèn locator |
Bundle FE | `web/build-fe.mjs` → `define: { __KHUNG__ }` (esbuild), lột khoá `$comment*` trước khi nhúng |
Văn xuôi | **không dẫn xuất được** ⇒ cổng `core/tests/check_khung.py` ép khớp |

JSON chứ không YAML: đó là format duy nhất **cả** `json.load` **và** esbuild đọc
không cần thêm dep.

## 4 · Form: 8 Ô, không 5

`SCR-05:11` khai nguyên tắc: *mỗi ràng buộc của cổng phải có một ô nhập tương
ứng*. Cổng đòi **8 mục LÁ**, nên form có **8 ô** — markdown vẫn ra 5 mục `##` +
bốn `### 3.n`.

Cho §3 một ô lớn thì người viết phải tự gõ `### 3.1 Đầu vào` … `### 3.4 Tinh túy`
đúng chính tả — **đúng cái lỗi SCR-05 sinh ra để chữa**, chỉ lùi xuống một cấp
tiêu đề. Người dùng chốt 8 ô.

Số ô **dẫn xuất** từ `len(LA)`; `id` của khối ô **bỏ số** (`f-o-muc`) — một id
mang số là một tập gõ tay nữa, lần đổi khung sau lại phải rename ở shell + CSS +
test.

## 5 · Điều KHÔNG mất

- Nguyên tắc FR-020 giữ nguyên: một ràng buộc một ô · chế độ thô luôn còn làm
  đường thoát · mục có cấu trúc lồng thì cho nút nạp khung chứ không dựng form
  lồng · cột theo dõi chỉ **ước tính**, không chặn gì (M05-R3).
- Cổng tinh túy giữ nguyên răng, chỉ đổi địa chỉ: `### 6.x` → `#### 3.4.x`, vẫn
  ≤5 mục, vẫn đủ 5 dòng bullet. Đây là cổng duy nhất buộc bài phải **dùng lại
  được**; mất nó thì 5 mục chỉ là mục lục đẹp.
- Cổng locator giữ đúng tập cũ `(4,5,6)` ánh xạ sang `(3.3, 3.2, 3.4)`, **cộng**
  §4 mới.
- Ba state của màn nạp (rỗng · đang tải · lỗi) đã có và được **giữ**; hai chuỗi
  còn ghim số 9 là state rỗng và state lỗi nên đổi chữ, không bỏ.

## 6 · Kiểm hai chiều — 9 ca

| Chiều | Ca |
|---|---|
`đỏ_khi` | thiếu §5 · thiếu §3.3 · dẫn nhập phình 67% · tinh túy sai cấp (`###` thay `####`) · thiếu một bullet · §4 mất locator · §3.3 mất locator |
`xanh_khi` | **§3.2 dài 400 từ KHÔNG làm đỏ cổng dẫn nhập** — ca âm mà bộ test cũ không diễn đạt được · §5 không locator vẫn sạch (miễn trừ đã khai) |

Ca `xanh_khi` thứ nhất là lý do field `xanh_khi` đáng có: `đỏ_khi` một mình
chứng minh cổng **đỏ được**, không chứng minh nó **không đỏ oan**. Và cổng đỏ oan
là cổng sẽ bị tắt.

## 7 · Kết quả đo (đang cập nhật theo đơn vị)

| Đơn vị | |
|---|---|
A1 khai khung + cổng | ✅ |
A2 validator + fixture + test Python | ✅ fixture giữ **đúng 202 từ** ⇒ 8 chỗ hardcode `202` không phải sửa · pytest **34 passed** |
A3 máy sinh + harness | ✅ `kb-mock` sinh lại (14 file, 1 ca âm cố ý) · hai bộ tên sụp thành một |
A4a wireframe + FR | ✅ file này |
A4b FE code | ⬜ |
A4c m-test | ⬜ |
A5 di trú `hermes-agent.md` | ⬜ |
A6 tài liệu + skill ngoài repo | ⬜ |

## 8 · Nợ khai rõ

- `~/.claude/skills/source-distiller/` giữ **5 bản sao khung** không có nguồn
  trong repo, gồm **bản validator thứ tư đã lạc hậu từ trước FR-034**. Không sửa
  ⇒ mọi bài skill viết ra bị cổng mới trả về. Trả ở A6.
- `05_uiux/contracts/analyses.sample.v1..v5.json` chứa
  `"_derived_body_sections": "9 mục"` — grep ra **0** người đọc. Không bump 5
  hash cho một comment chết; ghi nợ ở đây.
- `validate kb/ --strict` **đang đỏ từ trước** FR này (hermes 1580 > trần mềm
  1500 + 5 `concepts_proposed`). A5 hạ xuống ≈1475 ⇒ hết cảnh báo trần mềm; 5
  cảnh báo danh mục vẫn còn tới khi người dùng nhập danh mục.
- Không commit, không push.
