# FR-082 — M13: `AC-2.2` hết nợ C3 (vế ấy nay CÓ cổng thật) · quyết `POST /reindex-poke`

- **mở**: 2026-09-15 · **người mở**: claude (PM M13) · **trạng thái**: **CHỜ CHỦ DỰ ÁN**
- **artifact FROZEN chạm**: `06_modules/M13_truyhoi/spec.md` — khối chú thích `AC-2.2`
  (`:133-140`) · `AC-2.3` (`:142-150`) · §1 danh sách endpoint *(chỉ nếu chọn phương án B ở §2)*
- **artifact khác chạm**: `06_modules/M13_truyhoi/backlog.md` (tick 2 ô) ·
  `06_modules/M13_truyhoi/model_flow.md` *(chỉ nếu B)* · `07_plan/M08_api/tasks/T08-35-*` AC3
- **nguồn**: hai ô backlog M13 mở 2026-09-09 và 2026-09-10, cả hai **tự khai phải gộp vào
  một FR**, không mở riêng
- **vì sao MỘT FR cho hai việc**: cả hai chạm **cùng một file FROZEN**, và mỗi lần mở
  `spec.md` là một lần ký lại `FROZEN.lock`. Ký hai lần cho hai câu là hai lần cơ hội cho
  một dòng thứ ba lọt vào cùng chữ ký — `check_frozen.py --ky` **ghi đè toàn bộ lock và
  không kiểm gì trước khi ký**. Ít lần mở file frozen hơn là ít rủi ro hơn.

---

## §1 · `AC-2.2` đang khai một món nợ đã trả

**Đo được hôm nay.** `spec.md:139-140` viết:

> *Nên AC này nay đo thứ **tồn tại hôm nay** (hai bản luật slug); vế "khớp với anchor
> M03 render ra" là **AC của C3**, ghi ở `backlog.md`.*

Câu ấy đúng lúc ký (2026-09-09). Nay sai, và sai theo hướng **giảm giá trị của chính hệ**:

| ngày | trạng thái đo được |
|---|---|
| 2026-09-02 | `grep -rn anchor web/render/ web/plugins/` ⇒ **0**; `<h2>`/`<h3>` trong site build **không có `id`** |
| 2026-09-11 | `T03-149` (commit `8648cee`) — `md()` sinh `id` trên heading = `slugGoiY` + dedup theo bài |
| 2026-09-11 | `T03-148` (commit `5e401c2`) — `web/test/heading-id-anchor.test.js` ca D: **BA bản** khớp trên **29 heading kho thật** (`id` HTML == `slugGoiY` == `anchor_py` qua `truyhoi/src/anchor.py`) |

Tức vế *"khớp anchor M03 render ra"* **không còn là nợ ghi ở backlog** — nó có một cổng
chạy được, đo trên kho thật, và cổng ấy đang xanh. Spec đang nói *"chưa có gì để so"*
trong khi đã có ba bản để so.

**Vì sao đáng sửa chứ không kệ.** Một câu nợ đã trả mà vẫn nằm trong spec là **nợ giả**:
người đọc sau sẽ đi tìm cổng cho nó, không thấy, rồi hoặc viết lại một cổng thứ hai
trùng chức năng, hoặc kết luận M13 còn thiếu răng. Cả hai đều tốn một lượt. Và ở chiều
ngược lại, nếu ai đó lỡ xoá `heading-id-anchor.test.js` thì **không câu nào trong spec
M13 nói rằng vế ấy phải có cổng** — mất răng im lặng, đúng lớp lỗi *cổng xanh vì neo sai*.

**Xin duyệt — sửa đúng hai chỗ, 0 AC mới, 0 đổi hợp đồng:**

1. `spec.md:139-140` — thay câu *"vế … là AC của C3, ghi ở backlog.md"* bằng một câu khai
   cổng thật, theo khuôn inline đã dùng cho FR-072/073:
   `⚠️ **FR-082 §1 · vế C3 nay CÓ cổng**` + nêu `web/test/heading-id-anchor.test.js` ca D
   (29 heading kho thật, ba bản khớp) + ngày và commit.
2. `AC-2.3` (`:148-150`) — câu *"bấm chưa tới đâu cho tới khi C3 sinh `id` trên heading"*
   nay **đã tới**: thêm `> **Vế thêm** (FR-082 §1)` nói dạng `file-anchor` bấm được từ
   `T03-149`, và `slug-moc` **vẫn không** bấm-tới-vị-trí-văn-bản (mốc thời gian mở trình
   phát). Vế thứ hai là thứ dễ bị đọc nhầm nhất và hôm nay chưa câu nào nói.

**KHÔNG xin**: đổi `cmd` của `AC-2.2`. Cổng `check_anchor_mot_luat.py` vẫn đúng việc của nó
(hai bản luật slug). Cổng ba-bản là của M03, đo ở đất M03 — M13 **trỏ** tới, không **sở hữu**.
Đó là luật gốc: bên bị đánh giá không cầm thước.

---

## §2 · `POST :8791/reindex-poke` — xin một quyết định, không xin một tính năng

**Chuyện đã xảy ra.** `T08-35` (plan M08, 09-07) khai một AC3 gọi `POST :8791/reindex-poke`
sau khi ghi bản ghi. Spec và `model_flow` M13 ký 09-09 **không có** endpoint ấy. Dev M08
gặp, **SKIP AC3 và ghi rõ lý do** — đúng luật, và review 09-10 phát hiện nhờ chỗ SKIP đó.
Ô backlog mở cùng ngày, hoãn với lý do: re-index tăng dần theo `kho-delta` khi được gọi
(`T13-2 AC5`) là đủ đợt này; poke là **tối ưu độ tươi**, không phải hợp đồng.

**Phép thử tay 2026-09-11 xác nhận cái giá của việc hoãn**, đo được: `indexer.py --kiem-lech`
**bắt được** chỉ mục lệch và exit 1, nhưng **không tự sửa** — phải người chạy `--day-du`.
Nghĩa là sau khi sửa một bài, kết quả tìm **sai cho tới lần chạy tay kế tiếp**, và không ai
được báo. Cổng im lặng vì nó chỉ chạy khi có người gọi.

**Ba phương án, xin chủ dự án chọn một:**

| | phương án | được | mất |
|---|---|---|---|
| **A** | **Giữ nguyên, đóng ô.** Không thêm endpoint. `--kiem-lech` vào cron/CI, chạy định kỳ | 0 đổi FROZEN · 0 mã mới ở M13 · M08 không phải đợi | Độ tươi vẫn tính bằng chu kỳ cron, không tính bằng lần ghi |
| **B** | **Thêm `POST /reindex-poke`** vào `spec.md` §1 + `model_flow §2` + một AC; M08 bỏ SKIP | Ghi xong là chỉ mục tươi · `T08-35 AC3` hết SKIP | Mở FROZEN, ký lại lock · thêm một chiều gọi `M08 → M13` phải khai trong `goi_duoc` (`ADR-08`/Z9) · thêm một cửa cần kiểm `aud` |
| **C** | **Hoãn tiếp, có hạn.** Ô backlog ghi điều kiện lật thành **một số** (vd: khi kho > 200 bản ghi, hoặc khi có người báo kết quả tìm cũ) | Không quyết vội · ô không thành ý tưởng treo | Vẫn là một ô mở khi xét G6C |

**PM khuyến nghị A**, lý do đo được: kho hiện **16 tài liệu · 111 chunk**, một lượt
`--day-du` mất dưới một giây. Ở quy mô này poke mua rất ít độ tươi mà trả bằng **một
chiều gọi mới giữa hai module** — thứ đắt nhất trong `ADR-08`, vì mỗi chiều là một khoá,
một `aud`, một cửa phải kiểm. Nếu chọn A thì `T08-35 AC3` được đóng bằng một câu trong
task file, không phải SKIP treo, và ô backlog tick bằng `FR-082 §2`.

---

## Thứ tự nếu duyệt

1. Sửa `spec.md` (§1) — đơn vị giấy, khuôn `T13-0`. Chỉ khi **B** thì mới chạm §1 endpoint.
2. Chạy `check_frozen.py` ⇒ phải in **đúng 1 dòng lệch** (`spec.md`). **Dòng thứ hai là DỪNG.**
3. **NGƯỜI ký** `check_frozen.py --ky` — agent không ký, trừ khi chủ dự án uỷ quyền bằng
   một câu ghi nguyên văn vào `uy_quyen` của worklog (khuôn `T13-0`).
4. Tick hai ô `backlog.md` bằng `FR-082 §1` và `FR-082 §2`.
5. Worklog `entry: ky-gate`, có `object` là hash trước → sau.
