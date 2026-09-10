# ADOPT — áp factory vào một dự án mới

> Việc **một lần cho mỗi dự án**: bootstrap, cây artifact, đấu socket, cửa vào cho
> dự án đã có code. Copy file này vào thư mục dự án rồi làm từ trên xuống.
>
> Việc **lặp mỗi ngày** — prompt từng bước, cách ký gate, phản xạ tình huống —
> không nằm ở đây: xem `GUIDE.md` trong plugin, và hỏi skill `/factory:map`.
> Hai file, hai vai, không chồng lấn: ADOPT biến theo dự án, GUIDE bất biến theo
> khung. Thấy mình sắp chép một bảng từ GUIDE sang đây ⇒ dừng, đó là nguồn thứ hai.

---

## 0 · Cài plugin (một lần cho máy)

Trong Claude Code gõ `/plugin` → **Add marketplace** → trỏ tới repo `All_in_one`
(đường dẫn local, hoặc `<owner>/All_in_one` nếu đã lên GitHub). Rồi install
`factory@all-in-one`.

**Kiểm hook đã chạy — bắt buộc.** Mở phiên mới và hỏi:

```
factory rules đã nạp chưa? đọc R1 và canary.
```

Claude phải nêu được canary `FACTORY-RULES-LOADED` **và** nội dung R1. Nêu được ⇒
SessionStart hook đã bơm 6 rule vào context, khung có hiệu lực.

**Không nêu được ⇒ dừng, đừng chạy dự án.** Sáu rule là tầng bất biến; thiếu nó
thì mọi tham chiếu R1–R6 rải trong 15 file skill khác thành chữ rỗng — và bạn sẽ
không nhận ra, vì không có thông báo lỗi nào. Bản v0.5.0 vấp đúng lỗi này
(`cases.md#khung-tự-dính`).

**Cách gọi skill.** Skill của plugin có namespace: `/factory:map`,
`/factory:factory-rules`, `/factory:wo`. Dạng trần `/map` cũng chạy *nếu* chưa
lệnh nào chiếm tên đó — đừng dựa vào nó, tên chung dễ va. Hoặc không gõ slash gì
cả: mô tả việc rồi để Claude tự chọn skill theo `description`.

---

## 1 · Bootstrap thư mục dự án (một lần cho mỗi dự án)

```powershell
cd <đường-dẫn-dự-án>
mkdir .factory\worklog, memory, .claude -Force
```

Tạo `.claude/settings.json` với deny path đóng băng:

```json
{
  "permissions": {
    "deny": [
      "Write(./05_uiux/contracts/**)",
      "Write(./06_modules/**/spec.md)",
      "Write(./06_modules/**/rules.md)"
    ]
  }
}
```

**Không phải thủ tục hình thức.** S1 (deny) là một trong bốn bề mặt duy nhất mà
rule có răng — ba cái kia là reviewer (S2), CI (S3), git (S4). Bỏ qua là tháo một
hàm răng: spec và UI contract đã chốt sẽ bị sửa tại chỗ thay vì mở FR lên đúng tầng.

`project_map.yaml` **không** deny — PM phải ghi nó. Răng của map nằm ở gate-check
và reviewer.

Khởi tạo git ngay, đừng đợi:

```powershell
git init
git add -A; git commit -m "bootstrap: factory framework"
```

R1 · R3 · R4 đo ở **mức nhánh**. Không có git thì chúng mất địa chỉ — không phải
vi phạm, mà là bộ máy không đo được gì.

---

## 2 · Cây artifact — mỗi bước một thư mục

Không tạo trước; mỗi bước tự sinh thư mục của nó. Biết trước để đọc trạng thái:

```
01_research/     s1   original_request.md · solutions_scan · gap_analysis · research_summary
02_proposal/     s2   proposal + phác thảo
03_docs/         s3   BRD · PRD · spec_overview
04_system/       s4   diagrams/ · scaffold · security_baseline · build_order · env_plan
05_uiux/         s5   wireframe · prototype · contracts/  ← ĐÓNG BĂNG sau G5
06_modules/Mxx/  s6   spec.md · rules.md (+ workflow/sockets nếu có pack)  ← ĐÓNG BĂNG sau G6A
07_plan/Mxx/     s7   tasks/
09_deploy/       s9
10_retro/        s10  proposal.md — MỘT file

project_map.yaml       chỉ mục cấu trúc — khởi tạo ở s4, bump mỗi lần đổi
.factory/worklog/      mỗi entry một file WL-<ulid>.yaml
.factory/sockets.yaml  đấu skill ngoài (tuỳ chọn, mục 4)
memory/decisions.md    vì sao chọn thế + "Đổi thì phải xem lại gì"
```

**`08_` cố ý không tồn tại** — s8 là implement, code sống trong repo thật, plan
sống ở `07_plan/`. Đừng đi tìm thư mục ma.

---

## 3 · Chạy hằng ngày → GUIDE.md

Prompt mẫu từng bước (kể cả dòng bug/improve) · cách ký gate và đòi evidence gì ·
năm tình huống hay gặp và phản xạ đúng: **`GUIDE.md` trong plugin.** Mở nó bằng
`/plugin` hoặc hỏi Claude *"đọc GUIDE.md của plugin factory"*.

Bản đồ khung (10 bước · G1→G7 · socket · đường PATCH): `/factory:map`.
Định nghĩa R1–R6, hard/soft, S1–S4: `/factory:factory-rules`.
Format worklog + decisions: `/factory:trace`.

Mất phương hướng bất cứ lúc nào, gõ trong thư mục dự án:

```
Theo project_map và worklog, dự án đang ở đâu và việc kế tiếp là gì?
```

---

## 4 · Cắm skill ngoài (tuỳ chọn, khi tới bước cần)

**Chưa đấu vội.** Tới s4 mới nghĩ tới ổ `diagram`, tới s5 mới nghĩ tới `wireframe`.
Socket trống ⇒ bước chạy chay theo SKILL.md của nó, hoàn toàn hợp lệ.

Khi thật sự cần:

```
đấu dây <skill> vào ổ <diagram|wireframe|prototype|security|deploy|executor>
theo socket-check
```

Nghi thức đủ ba nhịp, thiếu nhịp nào cũng không tính là đã đấu:

1. **Chạy conformance fixture** — kiểm output của skill có đổ đúng artifact chuẩn
   của bước không
2. **Ghi `.factory/sockets.yaml`** kèm `pinned` version và ngày `fixture`
3. **Một entry worklog**, `object` = thư mục fixture output

```yaml
# .factory/sockets.yaml — sockets.yaml của module override được file này
diagram: {skill: archify, pinned: "1.x", fixture: 2026-08-17}
```

Nhịp 3 là thứ hay bị bỏ. Thiếu nó thì lần audit sau không phân biệt được dây đã
qua fixture hay đấu chay — và `fixture: <ngày>` trong yaml chỉ là lời khai của
người ghi, không phải bằng chứng. Đổi `pinned` = đổi một thứ frozen ⇒ chạy lại
fixture + FR + worklog entry mới.

Ba luật cắm: output đổ về artifact chuẩn của bước · skill cắm **không bao giờ
đóng gate** · rules của bước áp lên output bất kể ai sinh. Skill đòi bỏ reviewer
hoặc tự merge ⇒ không cắm được, đó là tính năng.

---

## 5 · Dự án đã có code — cửa vào khác

Đừng chạy s1→s5, chúng giả định chưa có gì. Hai lối:

**Áp khung từ giữa** — dựng `project_map.yaml` từ code hiện có
(`/factory:project-map`), viết `security_baseline.md` thủ công, rồi vào s6 cho
module kế tiếp. Bỏ qua G1–G3; G4 ký trên map + baseline thay vì trên scaffold.

**Đường PATCH** — vòng ngắn nhất mà vẫn chạm đủ gate + reviewer, hợp để thử khung
lần đầu:

```
wo (work order thay spec module) → m-ba đọc WO → s7 plan → s8 implement
   (+ test tái hiện bắt buộc, R5) → s9 rút gọn
```

**`m-ba` đứng trước s7, không bỏ được.** WO do người viết thường mơ hồ hơn spec
module, nên trạm được-phép-DỪNG cần có mặt ở đó nhất — BA báo mơ hồ thì PM dừng,
FR ngược lại người mở WO. Bỏ m-ba là để PM chia task trên một mô tả chưa ai xác
nhận là đủ rõ.

Đường PATCH không chỉ dành cho dự án cũ: dự án mới chạy tới module 2 thì module 1
đã có bug. Prompt mở WO nằm ở `GUIDE.md`.

---

## 6 · Checklist bootstrap

```
[ ] plugin factory@all-in-one đã install
[ ] canary FACTORY-RULES-LOADED nêu được trong phiên mới, kèm nội dung R1
[ ] .factory/worklog/ + memory/ tồn tại
[ ] .claude/settings.json có deny 3 path
[ ] git init + commit đầu
[ ] đã đọc GUIDE.md của plugin một lượt
[ ] có mô tả yêu cầu gốc 3-5 câu để gõ cho s1
```
