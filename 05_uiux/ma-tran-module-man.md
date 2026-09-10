# Ma trận module × màn — UI đợt hai

> **v2 · 2026-09-02** — khung theo chỉ đạo *"module len lỏi vào module khác…
> ngoài trang quản lý riêng còn button đi kèm khi đọc bài"*, ô đã đổ pattern từ
> khảo sát đợt năm (`01_research/ui-embed-matrix-scan.md`, 30/36 claim confirm).
> Phương pháp: ma trận surface×năng lực (CRUD-style) + CTA Inventory (OOUX).
> Z7 giữ nguyên: mọi ô là UI của **web (M03)** gọi API dịch vụ.
>
> Hai mặt: **[N] ngữ cảnh** (tại chỗ, nhanh) · **[Q] quản lý** (chi tiết, sửa,
> lịch sử). Luật nhịp ĐÔI xuyên suốt: *tác vụ GIÂY sống trong panel tại chỗ;
> tác vụ PHÚT khởi phát tại chỗ nhưng SỐNG ở trang quản lý* — không optimistic
> UI cho job LLM (job có thể chết sau retry cap, trạng thái phải trung thực).

## 1 · Mặt [N] — len lỏi vào màn đã có

| Màn ▼ · Module ▶ | M12 chưng cất | M13 truy hồi | M14 hỏi kho | M16 artifact |
|---|---|---|---|---|
| **Cửa sổ đọc — thanh tiêu đề** | cụm nút tiện ích trên **MỌI** cửa sổ (chỉ đạo 09-03): tài liệu = **Chưng cất** · video = **Sinh transcript** rồi Chưng cất (FR-054) · phan-tich = không — một component, hành vi theo bảng loại | — | nút **Hỏi bài này** (mở rail phải, phạm vi = bài) | trong tab Sinh |
| **Cửa sổ đọc — rail phải gập được** (mẫu NotebookLM 3-panel rút còn 2 vùng) | tab **Sinh**: tile Chưng cất + trạng thái | kết quả hỏi kèm chip trích dẫn bấm-nhảy-về-đoạn | tab **Hỏi**: chat, trả lời trong GIÂY, inline | tab **Sinh**: tile Slide · Đọc · Video (chỉ bài đã lên) + artifact đã sinh của bài xếp ngay dưới (mẫu Studio) |
| **Cửa sổ đọc — bôi đen** (bài viết/tài liệu; VIDEO KHÔNG có — vào từ transcript, luật ba-module) | "Chưng cất từ đoạn này" | đoạn chọn thành **chip ngữ cảnh** đính vào chat (mẫu Dia) — KHÔNG replace, kho chỉ-đọc | cùng chip ngữ cảnh | — |
| **Cửa sổ đọc — Ctrl+F** | — | nâng cấp **tìm-hoặc-hỏi** (mẫu Arc Max) — giữ nhánh tìm-chữ thường | trả lời ngắn ngay trong thanh | — |
| **Danh sách** Bài viết · Tài liệu · Video | nút Chưng cất trên thẻ thu-vien | hover thẻ → popover tóm tắt ĐÃ chưng sẵn (không sinh lúc hover) | "Hỏi trong phạm vi này" (facet đang lọc) | — |
| **Tổng hợp** | chọn ≥2 → **Tổng hợp chủ đề** | — | hỏi trên phạm vi lọc | — |
| **Kho** | dòng chảy nhận bản nháp | facet = phạm vi truy hồi (đã có) | lối vào chat phạm vi = facet | — |
| **Dashboard** | khối việc RÚT GỌN → link [Q] Xưởng | đếm truy vấn 0-kết-quả (tín hiệu điểm rẽ) | — | chung khối việc với M12 |

M15 kênh: mặt [N] của nó là **tin nhắn** (giao diện ta không sở hữu — 5 luật
nội dung tin đã chốt ở prototype `tin-nhan-kenh.html`).

**Trước khi chạy tác vụ tốn (M12/M16)** — popover hỏi-trước (mẫu HAX): model
nào, ước phí/phút, dữ liệu đi đâu (cloud = toàn văn rời máy) — bấm lần hai mới
chạy. Sau bấm: nút đổi "Đã xếp hàng" tại chỗ + toast có **Xem tiến độ**.

## 2 · Mặt [Q] — trang quản lý

> ⚠️ **ĐÈ 2026-09-03 (rule 5 / T03-97)**: chủ dự án chốt **mỗi module một URL
> + button menu riêng** (/chung-cat/ · /hoi-kho/ · /kenh/ · /artifact/; trang
> phụ nằm DƯỚI url module — /chung-cat/nhap/). Bảng dưới giữ làm hồ sơ của
> phương án theo-loại-việc; BỐ CỤC BÊN TRONG từng trang vẫn dùng nguyên (4 vùng
> kiểu Actions, triage 2 cột...), chỉ cách CHIA URL đổi.

Khảo sát nghiêng hẳn về gộp (Cloudscape/GitHub console hợp nhất; một người
vận hành không cần 5 dashboard):

| Trang [Q] | phục vụ | bố cục (tiền lệ) |
|---|---|---|
| **Xưởng** (việc nền) | M12 + M16 | 4 vùng kiểu GitHub Actions/Vercel: list-filter (trạng thái · loại) → bấm hàng mở **cửa sổ nổi chi tiết** (tận dụng multiwindow) = timeline giai đoạn enum + log theo job id (bền, đóng tab còn) + hành động Chạy lại · Huỷ · Xoá; mục **"Cần xử lý"** riêng cho job hết trần (dead-letter kiểu Sidekiq) mang badge đếm trên rail |
| **Hàng đợi duyệt** (nháp AI) | M12 nháp → kho | hai cột kiểu Linear Triage: list nháp + preview; 4 hành động **duyệt · sửa-rồi-duyệt · trả lại · xoá**; bản AI gốc lưu bất biến → nút "khác gì bản AI" diff được; hiện "đã tỉa N khẳng định" |
| **Kênh & tài khoản** (FR-045) | M15 (+M17) | adapter bật/tắt · định danh chat↔tài khoản · mã mời · nhật ký + audit |
| **Hội thoại** | M14 | lịch sử phiên theo tài khoản · xem JSON · xoá phiên (tin nhắn hỏi-đáp từ kênh đổ về cùng chỗ) |
| **Cấu hình** | cả 5 | read-only kiểu VS Code: hiện bảng khai + trỏ *"sửa ở file"* — không form |

## 3 · Nối hai mặt — xương sống MỘT hợp đồng cho cả 5 module

1. Hành động ngữ cảnh sinh **job id (ULID) ngay**. Trạng thái việc sống ở
   **hàng đợi Maildir của THỢ** (chốt 2026-09-02 — `os.replace` nguyên tử, đúng
   ranh giới vùng; KHÔNG bảng job ở LÕI), phơi qua **MỘT endpoint API của M12**
   (`GET /trang-thai/<ulid>` · `GET /job`) — panel, toast, badge, trang [Q]
   đều đọc từ đó, web polling 3–5s khi đang chạy. Riêng BẢN NHÁP (đầu ra) sống
   trong DB riêng ở `web/` (FR-046 + ADR-06).
2. **Deep-link hai chiều**: [N]→[Q] `?job=<id>` (trang Xưởng lọc sẵn);
   [Q]→[N] cột "Nguồn" mở tài liệu trong cửa sổ đọc nổi — lợi thế multiwindow
   mà GitHub/Slack không có: mở nguồn không mất chỗ đứng.
3. **Thông báo 3 tầng** (Carbon/NN/g): đang ở màn liên quan → inline status tự
   đổi, KHÔNG toast; ở màn khác → toast có nút "Xem" (bền tới khi bấm); rời máy
   quay lại → badge đếm trên đúng MỘT mục nav (Xưởng). ≥2 job xong gần nhau →
   GỘP toast. Hoãn notification-center.
4. **3 component khai một chỗ** cắm vào mọi ô: `Nút năng lực` · `Chip trạng
   thái job` · `Nhãn AI sinh` — ma trận này thi công bằng BẢNG KHAI, nút mọc
   từ bảng, không rải if.

## 4 · Đã chốt (người quyết 2026-09-02)

1. **Nháp chưng cất lưu DB** — `FR-046` (bản-AI-gốc bất biến + revision; bài
   đã vào kho thì file vẫn là chân lý). Màn Hàng đợi duyệt hết bị chặn.
2. **M12 có checkpoint giai đoạn** — Chạy-lại mặc định từ giai-đoạn-hỏng;
   từ-đầu là lựa chọn phụ tường minh (mỗi lần từ-đầu = toàn văn rời máy nữa).
3. Luật focus/z-order (cửa sổ đọc · panel chat · tray) → viết vào spec M03
   lúc port.
4. Rail phải gập/bottom-sheet → đo trên breakpoint thật lúc port.
5. **Hàng đợi việc GIỮ Maildir** (chốt 2026-09-02) — không bảng job ở LÕI;
   nháp (đầu ra) mới ở DB `web/`. Ma trận §3.1 là câu chữ chuẩn.

## 5 · Luật giữ nguyên bất kể pattern

Nút chỉ hiện khi hành động hợp lệ · hỏi-trước-khi-tốn · giai đoạn đếm được
không % · dừng kèm lý do phân loại · không bỏ im lặng (gắn cờ, khai đã tỉa) ·
ba module Bài viết/Tài liệu/Video là ba hàng tách biệt ở mọi tầng — component
chung, bộ hành động khai theo loại.
