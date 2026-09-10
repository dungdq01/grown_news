# Định tuyến `/factory:go` — Space Model

**Ngày**: 2026-09-10 · **agent**: kiểm soát dữ liệu · **chỉ định tuyến, chưa làm gì**
**Trạng thái**: chờ chủ dự án nói *"chạy"*. Không FR nào được mở, không artifact nào được viết.
**Nền**: [09-09 · ảnh hưởng database](2026-09-09-space-model-anh-huong-database.md) ·
`01_research/space-model-danh-gia-va-de-bai.md` (s1) ·
`01_research/space-model-da-vu-tru-tri-thuc.md` (ý tưởng gốc)

> File này để agent nào nhận việc Space cũng đọc được đường đi, không phải suy lại.

---

## 0 · Kết quả một dòng

**FR trước mọi thứ → BUILD.** Và **s2/s3 không đóng gate nào** trên dự án này —
`skipped_gates: [G1, G2, G3]`. Kế hoạch "s1→s6" co lại thành **FR → ADR-09 → s6 → s7 → s8**.

---

## 1 · Chặn trước khi phân đường

| kiểm (theo bảng của `/factory:go`) | kết quả | bằng chứng |
|---|---|---|
| Yêu cầu mơ hồ? | ❌ không | hai tài liệu s1 đã khai rõ phạm vi + đề bài |
| Trộn nhiều việc? | ⚠️ có, nhưng đúng hình dạng BUILD | tách ở **s6 theo module**, không tách ở cửa vào |
| Chưa biết bug nằm đâu? | — | không phải bug |
| Không thuộc factory? | ❌ thuộc | đổi hợp đồng dữ liệu |
| Chưa có `project_map.yaml`? | ✅ có | `version: 31` |
| Đang dở WO khác? | ❌ không | không WO nào cho Space; nhánh `space` **0 commit ahead of main** |
| **Sắp viết proposal/BRD/PRD?** | 🔴 **CÓ ⇒ tra `skipped_gates` TRƯỚC** | §2 |

---

## 2 · 🔴 Phát hiện quyết định — `project_map.yaml:42`

```yaml
skipped_gates: [G1, G2, G3]
```

Luật của chính `/factory:go`, mục **Ca lạ**:

> *Sắp viết proposal/BRD/PRD ⇒ Tra `project_map.skipped_gates` **trước**. Gate của
> bước đó bị bỏ ⇒ artifact ấy **không đóng gate nào, chỉ là giấy tờ** — viết FR,
> hoặc để nó làm **con trỏ** tới FR.*

| gate | bước | trạng thái | nghĩa cho Space |
|---|---|---|---|
| G1 | s1 research | **BỎ** | tài liệu s1 đã có, không cần gate |
| G2 | s2 proposal | **BỎ** | proposal Space **không đóng gate nào** |
| G3 | s3 BRD/PRD | **BỎ** | sửa tiền đề *"một vũ trụ"* **không đóng gate nào** |
| G4 | s4 system/ADR | ✅ **SỐNG** | **ADR-09 có răng** — đây là nhà của quyết định |
| G5 | s5 prototype | ✅ **SỐNG** | tab bar chạm `05_uiux/` (frozen) — xem §5 câu hỏi |
| G6A/B/C | s6/s7/s8 | ✅ **SỐNG** | spec → plan → implement từng module |

⇒ **Câu hỏi "làm s1 đến s6" có câu trả lời cụ thể**: s2 và s3 viết thì chỉ để làm
**con trỏ** tới FR + ADR-09. Thứ có răng là **FR** và **s4**.

---

## 3 · Ba câu phân đường

| # | câu | trả lời | bằng chứng |
|---|---|---|---|
| **1** | Chạm ≥2 module, hoặc đổi `owner` của entity? | **CÓ** | 9 module chạm (M01·M02·M03·M08·M09/10/11·M13·M14·M18); `entities.BaiHoc.owner = M19_baihoc` đổi chủ nếu **D3** = có |
| **2** | Chạm file FROZEN? | **CÓ** | `core/assets/frontmatter.schema.json` — thêm `space`, và enum `source_type` nếu **D2** chọn nó. Spec/rules của module bị chạm nằm trong 56 mục `FROZEN.lock` |
| **3** | còn lại ⇒ PATCH | không áp dụng | — |

### ⇒ Đường: **FR trước mọi thứ → BUILD**

```
① FR-0xx ─── frontmatter.schema.json: thêm `space`
             Mở TRƯỚC, KHÔNG chờ ADR — FR chỉ khai QUYỀN chạm,
             không khai hình dạng. Hình dạng là việc của ADR-09.
      │
② ADR-09 ─── s4 · G4 CÒN SỐNG
             Nhà của D1 (hình dạng khoá A/B/C) · D2 (loai_nguon vs
             source_type) · D3 (Space thay M19?).
             Trình phương án kèm số đo; chủ dự án quyết lúc duyệt.
             ⚠️ Tiền lệ: ADR-06 (2026-09-02) được THÊM vào adr.md giữa
             dự án cùng một cụm FR — không chạy lại s4 toàn bộ.
      │
③ s5 delta ── G5 CÒN SỐNG · tab bar chạm 05_uiux/ (frozen)
             ⚠️ CHƯA XÁC NHẬN bắt buộc — xem §5
      │
④ s6 ──────── KHÔNG module-pack: Space không phải module mới,
             không có thư mục mã, không vào `modules:`
             Song song SAU ADR: M02+M01 · M08 · M09/10/11 · M03 · M18 · M13
      │
⑤ s7 → s8 ─── theo thứ tự phụ thuộc, TỪNG module một
             M02 → M01 → M08 → M09/10/11 → M03 → M13/M14 → M18
             KHÔNG gom s6 cả 8 module rồi merge một lượt
```

---

## 4 · Hai thứ phải xử **trước khi ai gõ dòng đầu**

### 4.1 · `[chặn]` Nhánh `space` đang ở nền cũ

```bash
git worktree list
  C:/Users/Admin/Downloads/Grown_news  940da7a [main]
  C:/Users/Admin/Downloads/gn-m13      8ccc653 [m13]
  C:/Users/Admin/Downloads/gn-space    8ccc653 [space]

git log --oneline main..space   → (rỗng — 0 commit ahead)
git diff --stat main..space     → 104 files, +144 / −10.578
```

`space` cắt ở `8ccc653`, `main` đã ở `940da7a`. **Rebase trước**, không thì mọi
spec viết trên nền đã lỗi thời — và `M12` vừa chốt nằm trong 104 file đó.

*(Worktree đã có sẵn cho cả `m13` lẫn `space` ⇒ luật `CLAUDE.md` "song song ⇒
mỗi đơn vị việc một worktree" **đã thoả**.)*

### 4.2 · `[chặn]` Chưa có WO / task file cho Space

Bỏ bước đó thì `phạm_vi_ghi` không được khai. Theo bảng **"bỏ bước nào mất gì"**
của `/factory:go`:

> `4 · task file` — không khai `phạm_vi_ghi` ⇒ **R1 vô địa chỉ · R3 gãy vĩnh viễn**

Với BUILD thì `phạm_vi_ghi` sinh ở **s7**, nhưng ADR-09 và các FR vẫn là đơn vị
việc cần biên — ai ghi vào `04_system/adr.md` và `.factory/fr/` phải khai.

---

## 5 · Ba câu còn treo — cần chủ dự án

| # | câu | vì sao chặn |
|---|---|---|
| **V1** | **Vai của agent này**: đổi vai chạy s2→s6, hay giữ vai kiểm soát và agent khác chạy? | Luật gốc Factory: *"không ai được sở hữu thứ dùng để đánh giá mình"*. Tôi viết ADR-09 + 8 spec thì không review được chúng, và 5 báo cáo `_control_db/` mất giá trị làm thước đo |
| **V2** | **Tab bar có bắt buộc qua s5 (G5) không**, hay là FR sửa `man-hinh.json` + tokens? | `05_uiux/` frozen, G5 còn sống. Hai đường khác nhau về **giấy tờ**, không khác về code. Đổi khối lượng đáng kể |
| **V3** | **D1 · D2 · D3** — đã chốt: *để ADR-09 trình phương án, chưa quyết gì* (2026-09-09) | Hệ quả: **s2/s3 phải viết mà KHÔNG giả định hình dạng khoá.** Proposal nói *"Space là một trục scoping"*, không nói *"slug trùng được giữa space"* |

---

## 6 · Ba việc KHÔNG chờ ADR — hạn chót độc lập

Cả ba đúng với **mọi** phương án D1 (A, B hay C), nên làm sớm không mất gì.

| # | việc | hạn chót là gì |
|---|---|---|
| 1 | `truyhoi/index.sqlite` vẽ có cột `space` **từ hàng đầu tiên** | file **chưa tồn tại**; M13 đang lên plan. Cửa sổ đóng theo tiến độ M13, không theo Space |
| 2 | Thêm cột `space` vào `audit_log` (13 dòng) + `audit_loi` (124 dòng) | hai bảng **append-only bằng trigger** ⇒ **không backfill được**. Sau khi mở space thứ hai thì 137+ dòng vĩnh viễn mù |
| 3 | Ba nợ cũ nay thành **điều kiện** của Space | `audit_loi`+`lan_thu` vào `loi.schema.sql` · trigger `BEFORE DELETE` cho `nhap_chung_cat` · `bam_noi_dung()` băm cả `loai_nguon` (bảng này sắp thành per-space) |

---

## 7 · Trạng thái — đọc một dòng

```
định tuyến   ✅ xong   FR → ADR-09 → s6 → s7 → s8;  s2/s3 chỉ là con trỏ
quyết định   ⏸ treo    V1 (vai) · V2 (s5?) · D1/D2/D3 → ADR-09 trình
thi công     ⛔ chưa    0 FR mở · 0 artifact viết · nhánh space cần rebase
```

---

*Agent kiểm soát dữ liệu · định tuyến, không thi công · không mở FR · không ký gate.*
