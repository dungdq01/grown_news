# backlog — M13_truyhoi (chết ở G6C)

> Nợ do một thay đổi **CỤ THỂ vừa gây ra**. Không phải TODO, không phải ý tưởng,
> và **không phải** *"thứ chưa xây"*.
> Ô `[ ]` trỏ artifact có thật; `[x]` phải kèm object (commit · PR · FR id).

## 2026-09-09 · KÉO THEO từ `T13-0` (áp `FR-072` + `FR-073` vào spec)

Sáu ô dưới đây do **một thay đổi cụ thể vừa gây ra**: spec M13 nay khai một hợp đồng
mới, và sáu chỗ **ngoài** boundary của M13 nói sai theo nó. Không sửa tại chỗ vì mỗi
chỗ thuộc một chủ khác — ô trỏ đúng người.

- [ ] **`chungcat/src/dinh_tuyen.py:25` còn gõ cứng dải Hán.** `AC-3.4` nay khai
      nguồn sự thật là `core/assets/dai-han.json` (chủ M01), và chính mã M12 đã ghi
      *"phải chuyển sang bảng khai chung khi M13 dựng"*. Để nguyên thì một tài liệu
      được **index** theo dải này và **định tuyến model** theo dải kia.
      Đóng bằng: `T01-51` tạo bảng khai (`FR-077`) → `FR-078` cho M12 đọc bảng.
      · object: `chungcat/src/dinh_tuyen.py` `_DAI_HAN` · `06_modules/M12_chungcat/backlog.md:631`
- [ ] **`web/render/trang.mjs:1722` `soDotHai()` hard-code `truyhoi.sample.v1.json`
      và đếm khoá `chunks`; thiếu file thì NÉM** (trang `/dot-hai/` chết). Lượt này
      thêm `v3.json` và **giữ nguyên** v1/v2 nên hôm nay không vỡ — nhưng ai đó dọn
      v1 hoặc đổi shape v1 theo v3 là trang chết. Cùng chỗ: `trang.mjs:1707` khai
      `trang_thai: "chưa dựng"` cho M13, sẽ lỗi thời khi service sống.
      ⇒ ô này thuộc **PM M03**; M13 không sửa `web/**`.
      · object: `web/render/trang.mjs:1707,1722-1726`
- [ ] **`05_uiux/prototype/sinh_v21.py:216` (và bản sinh ra `app-v21.html:196`) ghi
      *"Service chatbot không chạy (cổng 8791)"*.** Sai người: chatbot là `8788`,
      `8791` **là truyhoi**. Khi M13 sống ở 8791 thì thông báo này chỉ sai dịch vụ,
      và nó nằm trong **script sinh**, không phải một dòng tài liệu.
      ⇒ đất `05_uiux/**` thuộc **M03** (map v17/FR-042).
      · object: `05_uiux/prototype/sinh_v21.py:216`
- [ ] **`03_docs/spec_overview.md:503` còn khai M14 là *"khách hàng duy nhất"* của
      M13.** `spec §1a` + `model_flow §2` nay khai **hai** khách (M14 hỏi · web tìm)
      theo `ADR-08`. Câu ở `:452-458` đã đính chính 2026-09-09 (`WL-01KB41KEOTHEO`),
      câu `:503` thì chưa. `03_docs/**` **chưa có chủ** trong `project_map` (ghi chú
      v15 liệt nó vào nhóm còn thiếu chủ) ⇒ cần một dòng của chủ dự án về ai sửa.
      · object: `03_docs/spec_overview.md:503`
- [ ] **`ui_flow.md §1` bảng "M13 góp gì" còn khai địa chỉ là `file#anchor` bấm
      được.** Sau `FR-073` + `AC-2.3`, thứ M13 trả là `dia_chi` với **hai** dạng
      (`file-dong` · `slug-moc`), và `file-anchor` chỉ bấm được sau C3. `ui_flow.md`
      thuộc **chính M13** nhưng **không** trong `phạm_vi_ghi` của `T13-0` ⇒ sửa ở
      đơn vị tiếp theo chạm nó (`T13-4` khi có `/health` + hình dạng trả về thật).
      · object: `06_modules/M13_truyhoi/ui_flow.md` §1 · §2c
- [ ] **Hai chữ `nguon` mang hai nghĩa trong cùng một payload.** `pham_vi.nguon` là
      facet loại nguồn; `nguon` ở gốc là tập nguồn Knowledge. `FR-072 §1.1` duyệt cả
      hai tên nên lượt này **chỉ khai rõ hai trục bằng chữ** (spec §1a ·
      `sample.v3` `$comment_hai_chu_nguon` · `model_flow §2`), **không** đổi tên —
      đổi là đảo một FR đã duyệt, và `M14/model_flow §2` đang khai `nguon` là khoá
      bắt buộc. Nếu về sau có ai đọc lẫn thật (đo được: một lời gọi truyền slug vào
      `pham_vi.nguon` hoặc loại nguồn vào `nguon`) ⇒ mở FR đổi tên `tap_nguon`.
      · object: `spec.md §1a` · `05_uiux/contracts/truyhoi.sample.v3.json`

- [ ] **`spec.md` AC-2.2 (FROZEN) nói vế *"khớp anchor M03 render ra"* là "AC của C3,
      ghi ở backlog" — sau `T03-149` vế đó CÓ cổng thật** (`T03-148` ca D, cổng BA bản
      = A3 của FR-073). Câu trong spec sẽ lỗi thời: nó nói "chưa có gì để so" trong khi
      đã có. Sửa một dòng frozen ⇒ **FR** (gộp vào FR kế tiếp của M13, không mở riêng).
      · object: `06_modules/M13_truyhoi/spec.md` AC-2.2 · `07_plan/M03_web/tasks/T03-148-*`, `T03-149-*`
      ⇒ **sau T03-149 xong**

- [ ] **`POST :8791/reindex-poke` được T08-35 khai (plan 09-07) nhưng KHÔNG có trong spec/
      model_flow M13 đã ký 09-09.** Review 2026-09-10 phát hiện khi dev SKIP AC3 đúng luật.
      Hoãn: M13 re-index tăng dần theo kho-delta khi được gọi (T13-2 AC5) là đủ đợt này;
      poke sau khi ghi là tối ưu độ tươi, không phải hợp đồng. Muốn có ⇒ FR thêm endpoint
      (gộp FR kế tiếp cùng ô AC-2.2 ở trên).
      · object: `07_plan/M08_api/tasks/T08-35-*` AC3 · `07_plan/M08_api/tasks/T08-35-kho-delta.test.js:24-25`

## Bốn thứ M13 đang chờ — KHÔNG phải backlog

Bốn thứ M13 đang chờ **không** thuộc backlog:

| thứ đang chờ | sống ở đâu | vì sao KHÔNG phải backlog |
|---|---|---|
| `chuan_hoa_tim()` bản Python | `spec §3` + `workflow §1b` | **phụ thuộc**, và nó là việc của chính M13 ở bước 1 (`T13-3`) |
| `w_title` chưa có số | `spec AC-4.2` | phải **ĐO**, và đo là việc của s8 (`T13-4`) |
| **sáu** lệnh `truyhoi/tests/` | `rules.md` đầu file | **việc của s8**, đã khai tường minh (`T13-1`, 18 cổng một lượt) |
| ≥2 bài tiếng Trung cho `AC-6.3` | `spec §6` | **dữ liệu**, việc của người: chọn 2 video tiếng Trung rồi M12 `sinh-transcript`. Không phải một artifact ai sửa được |

*(Dòng "dải ký tự Hán thành bảng khai" đã rời khỏi bảng này 2026-09-09: nó nay là ô
`[ ]` thật ở trên, vì chủ file đổi sang M01 và M12 đang chạy trên bản tạm — tức đã có
**hai** bản của một luật, không còn là "thứ chưa xây".)*

## Kéo theo C3 — một vế của `AC-2.2` không thuộc M13

Phép thử s6 (`testcases.md` §cuối) bắt được: bản đầu của `AC-2.2` đòi *"anchor khớp
với anchor **renderer M03 sinh**"*, nhưng đo 2026-09-02:

```bash
grep -rn "anchor" web/render/ web/plugins/    # -> 0
grep -o '<h[23][^>]*>' web/site/index.html    # -> <h2 data-i18n="..."> <h3>  — KHÔNG id
```

**M03 chưa sinh heading anchor nào**, nên vế đó **không viết nổi testcase**. AC đã
sửa để đo thứ tồn tại hôm nay (hai bản luật slug: `anchor_py()` ↔ `slugGoiY()`).


Vế còn lại **không phải nợ của M13** — M13 sinh đúng phần của nó. Ô `[ ]` thật sự
nằm ở **`06_modules/M03_web/backlog.md`**, vì đó là nơi công việc (C3) sống, và một
ô trong backlog M13 sẽ chặn G6A của M13 vì một nợ của module khác.

**Cập nhật 2026-09-09**: nợ ấy từng gồm **hai** vế — *bảng khai không biết dạng
`#anchor`* và *C3 chưa sinh `id`*. Vế thứ nhất nay có lời giải: `FR-073` thêm dạng
`file-anchor` vào `dia-chi.json`, dựng ở `T01-51`, cổng A1/A2/A4 ở `T01-52`. Nên chỉ
còn **một** vế là C3, và cổng đối chiếu **ba bản** (`anchor_py` ↔ `slugGoiY` ↔ `id`
trong HTML) là **A3 của `FR-073`** — vẫn ở M03.

Tóm tắt để đọc mà không cần mở file kia: **C3 phải sinh `id` trên heading, và `id`
đó phải khớp `anchor` của M13**. Cho tới lúc đó, sơ đồ địa chỉ `file#anchor` **chưa
có người tiêu thụ** — chatbot sẽ trích dẫn những địa chỉ **bấm vào không tới đâu**.
