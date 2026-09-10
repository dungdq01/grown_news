# Chức năng chính của hệ thống — một bảng

- **ngày**: 2026-09-07 · **vai**: overview (s1) · **nguồn**: `03_docs/prd.md` U1–U12 ·
  `03_docs/spec_overview.md` hai bảng module · `project_map.yaml` v30 · `06_modules/*/spec.md`
- **luật đọc bảng**: *chức năng* = việc hệ làm được cho người dùng hoặc cho tri thức.
  **API · web · màn hình · kênh chat · cổng HTTPS KHÔNG phải chức năng** — chúng là
  *wrapper* (chỉ đạo chủ dự án 2026-09-07: *"module/service gọi lẫn nhau, web chỉ là wrapper"*).
  Cột **wrapper** ghi chúng ở đâu, để không ai nhầm.
- **trạng thái đo** 2026-09-07: `src/*.py` · `tests/*.py` · `07_plan/*/tasks` —
  chungcat 18·47·28 · truyhoi 0·0·**7** · chatbot/kenh/artifact/cong 0·0·0.

## Bảng

| # | Chức năng | Mô tả — hệ làm gì, ra gì | Luật cứng đi kèm | Service (chủ) | Wrapper | Trạng thái |
|---|---|---|---|---|---|---|
| 1 | **Nạp nguồn thành bản ghi** | Một link, một file, hay một URL video ⇒ một bản ghi `.md` có frontmatter chuẩn trong `kb/`, ở trạng thái `draft`. Ba loại **tách bạch ở mọi tầng**: bài viết · tài liệu (pdf/ppt/word — giữ **byte** trong `media`) · video (chỉ URL, **không byte**). | Mọi ghi vào kho đi qua **một** validator (`validate.py`). Bản ghi nào cũng gán **category + concepts**. | M01 · M09 · M10 · M11 | M08 (`POST /api/…`) · M03 màn nạp | ✅ chạy |
| 2 | **Nhận bản làm sẵn từ ngoài** | Bản `.md` do agent khác viết ⇒ vào `_inbox/` ⇒ kiểm ⇒ vào kho ở `draft` hoặc trả lại kèm lý do. | Không có đường nào vào kho mà **không qua cửa này** (M05). | M05 | CLI `make intake` | ✅ chạy |
| 3 | **Kiểm kho bằng máy** | Schema · địa chỉ trích dẫn phân giải được · concepts hợp lệ · media không mồ côi · vòng export/import đạt điểm bất động. Đỏ thì PR không merge. | Kết quả máy là **bằng chứng duy nhất** (R2). Người không tự khai "đã kiểm". | M01 · M04 | CI · hook | ✅ chạy |
| 4 | **Duyệt bản — cổng người duy nhất** | `draft → approved` (hoặc `rejected`). Chỉ **người** bấm. Có phiên bản, có thùng rác, có lịch sử. | Không agent nào duyệt. `approved` là điều kiện của **mọi** chức năng sinh ra sau (skill, artifact, RAG). | M02 (trạng thái) · M08 | M03 màn CRUD | ✅ chạy |
| 5 | **Địa chỉ bấm được** | Mọi trích dẫn có **địa chỉ phân giải được**: `slug` · trang `:p.N` · mốc `:t=mm:ss` · dòng `file:A-B` · mục `§`. Bấm ⇒ mở **đúng chỗ** trong nguồn. Bảng dạng ở `core/assets/dia-chi.json`, một bản, ba bên đọc. | Địa chỉ không phân giải ⇒ trích dẫn **không tính** là verified. Dạng `file#anchor` **đang mở** (`FR-073`). | M01 | M03 render · M14 trả | ✅ 5 dạng · ⏳ `#anchor` |
| 6 | **Chưng cất: nguyên liệu → bản nháp** | Agent đọc **một** nguồn ⇒ bản phân tích 5 mục (`ho_so: phan-tich`) với trích dẫn **máy chấm ba tầng** (chính xác / chuẩn hoá / fuzzy ≥ ngưỡng khai). Ra `_inbox/` ⇒ qua #2 ⇒ người duyệt (#4). | Người **chọn model**. Bản nháp **không tự thành approved**. Video ⇒ **phải có transcript** trước, không rơi về mô tả (`FR-070`). | M12 | M08 cửa `tho-cua` · M03 nút | ✅ chạy |
| 7 | **Tổng hợp N nguồn** | ≥2 bản ghi ⇒ một bài tổng hợp (`ho_so: tong-hop`, `FR-044`), mỗi ý trỏ về nguồn nào. | Cùng luật #6. | M12 | như #6 | ✅ chạy |
| 8 | **Sinh transcript cho video** | URL video (hoặc file audio/video người tải) ⇒ hiện vật `.vtt` gắn vào bản ghi (`la_dan_xuat`, `kieu_moc: la_asr / nguoi_sua`). Người tải xuống được `.txt/.srt`. Sinh lại được khi có model tốt hơn. | Trần: video < 1 GB · audio < 500 MB · < 60 phút. Chỉ THỢ gọi ra Internet (bậc gửi RA `FR-043`). | M12 | M08 cửa xuất `xuat-cua` · M03 nút | ✅ chạy |
| 9 | **Tải video về máy theo chất lượng** | URL ⇒ file tạm đúng chất lượng chọn, làm đầu vào cho #8. | **`FR-069` CHỜ DUYỆT** — mã chạy trước spec. | M12 | như #8 | ⚠️ chạy, spec chưa |
| 10 | **Truy hồi: chỉ mục + tìm đoạn có địa chỉ** | Toàn bộ `than` (và hiện vật văn bản: transcript, `.md/.txt` tải lên) ⇒ chỉ mục FTS5 theo `##/###` (hoặc **cue** cho transcript). Câu hỏi + **phạm vi nhìn thấy** (facet đang bật, tập nguồn có tên) ⇒ danh sách **đoạn đầy đủ + địa chỉ**, không snippet. | 0 lời gọi mạng · không ghi kho · không vector (đợt này) · **một** hợp đồng cho mọi client (`FR-072`) · chỉ mục là dữ liệu **dẫn xuất**, dựng lại được. PDF **chưa** có text ⇒ còn mù (nợ M12). | M13 | M03 ô tìm (trả nợ U6) · M14 | 📐 spec + 7 task, 0 mã |
| 11 | **Hỏi đáp có địa chỉ (chatbot)** | Câu hỏi tiếng người ⇒ trả lời **kèm địa chỉ** (#5). Không có trong kho ⇒ **từ chối kèm lý do enum** (`khong-co-trong-kho` · `co-nhung-mau-thuan` · `ngoai-pham-vi`), không bịa. Bot **phạm vi hẹp** = rule + tập tài liệu chọn (kiểu custom GPT); admin ôm cả kho. | Trả **JSON**, không trả trình bày. Giải `bot → tập doc_id` ở **một** hàm (AC-8.4). Model do người chọn. | M14 | M03 màn hỏi · M15 kênh | 📐 spec, 0 mã |
| 12 | **Tuyển nguồn theo lệnh** | `/tìm <chủ đề>` ⇒ agent **chọn** nguồn, **người duyệt cái đã chọn** rồi mới nạp (#1). Không tự quét Internet. | Agent tuyển **khi được ra lệnh** — không có "tự động tìm nguồn mới". | M12 (+M14) | M15 lệnh | 📐 PRD, chưa spec riêng |
| 13 | **Sinh skill cho agent nội bộ** | Bản `approved` có `skill_candidates` ⇒ `SKILL.md` **nháp**, ngoài repo. | Chỉ từ `approved`. Nháp — người xem lại. | M06 | CLI | ✅ chạy |
| 14 | **Giữ kho khỏi mục theo nhịp** | Quét theo tuần/tháng ⇒ báo **bài chết** (link hỏng) · **draft đọng** · **concepts phình**. Chỉ **báo**, không tự sửa. | Read-only tuyệt đối. | M07 | CLI · báo cáo | ✅ chạy |
| 15 | **Biến bài duyệt thành artifact** | Bài `approved` ⇒ **slide** (Marp) · **giọng đọc** (TTS) · **video** (ffmpeg). Link ngược về bài nằm ở **tầng metadata** (PPTX hyperlink · PDF `#page=N` · ID3 CHAP · sidecar `timestamp → URL`), **không vẽ vào pixel**. | Byte là hiện vật `_media/` (M09-R1: không dựng lại được ⇒ không xoá). Text rời máy khi gọi cloud TTS ⇒ **log sha256** (bậc 4). | M16 | M03 nút xuất | 📐 spec, 0 mã |
| 16 | **Tài khoản · mời · thu hồi · phiên** | Một `chu` + ≤5 tài khoản đọc. Mời bằng **mã một lần có hạn**, buộc kênh chat, thu hồi, xem audit. | Bốn `viec` **tách**, mỗi cái một phép kiểm (`moi-nguoi-moi` · `thu-hoi` · `xem-audit` · `sua-cai-dat`). Audit **không sửa/xoá được** (4 cửa đều ném). | M18 | M03 một màn admin · M08 | 🔧 đang (T08-17 · FR-045) |
| 17 | **Cài đặt đổi được từ web, không sửa mã** | Ô quyền · ngưỡng · model theo tác vụ · trần — **giá trị** ở bảng `cai_dat`, **schema ô** là allowlist trong mã, **bất biến** ở DDL CHECK. | Đúng **1** cửa ghi `(khoa, gia_tri)` · 0 ô ngoài allowlist ghi được · mọi lần đổi có **hai** danh tính · công bố `(số_hàng, head)` ra chỗ `chu` **không sở hữu**. | M18 | M03 cùng màn #16 | 🔧 đang (proposal-3) |
| 18 | **Khoá và cách ly ba vùng tin cậy** | **LÕI** giữ dữ liệu, một cửa ghi, không khoá model, không gọi ra. **THỢ** giữ khoá model, là nơi **duy nhất** gọi Internet (bốn bậc gửi RA có log). **BIÊN** là chỗ duy nhất nghe ngoài loopback. Service gọi service theo **allowlist `goi_duoc`**, khoá theo chiều + `aud`, **bên nhận** cưỡng chế (`ADR-08`). | Ai đứng ở vùng nào là **cấu trúc** (cổng Z1–Z9), không phải kỷ luật. | ADR-05/08 (mọi service) | — | ✅ LÕI/THỢ đo được · ⏳ Z9 |
| 20 | **Dùng hệ từ xa qua kênh chat** | Từ điện thoại: gửi một link ⇒ nó vào kho (#1, `draft`); gõ `/tìm` (#12); hỏi kho (#11) và nhận trả lời có địa chỉ ngay trong chat. Máy tắt ⇒ Telegram giữ tin ~24h. | **Chỉ id trong allowlist** được gửi — không thì kho thành hộp thư công cộng. Sai định dạng ⇒ bot nói rõ thiếu trường nào. Kênh **không** giữ logic: ba việc, không hơn. Thứ tự kênh: Telegram → Discord → Zalo (hoãn) → FB (cần webhook). | M15 (kênh) · M17 (cổng) — **PRD U11** | — (chính nó là lớp wrapper mỏng của #1/#11/#12) | 📐 spec G6A xanh (17+17 AC), 0 mã, 0 task |
| 19 | *Bài học → khoá học → lớp học* | *Tập nguồn **có tên, có thứ tự** — chiều phân loại thứ tư, không suy được từ facet.* | *Giữ chỗ (`M19`), hình dạng phải mở từ đợt hai vì `M14 AC-8.4` đứng trên nó.* | *M19* | — | ⬜ giữ chỗ |

## Không phải chức năng — để không ai xếp nhầm

| Thứ | Là gì | Của ai |
|---|---|---|
| `/api/**` (M08) | cửa HTTP cho **người** và cho service, gọi vào #1–#17 | wrapper của LÕI |
| bảy màn web (M03) | render `kb/` + nút gọi cửa trên | wrapper hiển thị |
| Telegram (M15) | ba việc: allowlist người gửi · dịch lệnh → gọi `web:8787` · dịch phản hồi — **cái người dùng được** là dòng #20 | wrapper kênh |
| cổng HTTPS (M17) | xác thực, chuyển tiếp vào `127.0.0.1` — điều kiện để #20 chạy từ Internet | wrapper biên |
| CI/hook (M04) | *cưỡng chế* #3 — nó là răng của luật, không phải chức năng mới | bộ máy |

## Trạng thái — ký hiệu

✅ chạy trên server thật, có gate xanh · ⚠️ mã chạy trước spec frozen · 🔧 đang thi công ·
📐 spec G6A xanh, chưa mã · ⏳ FR đã duyệt mở, chưa áp · ⬜ giữ chỗ

## Đọc thêm

Chi tiết từng dòng: `06_modules/Mxx/spec.md`. Vì sao hệ cắt theo **ranh giới tin cậy**
chứ không theo tính năng: `spec_overview.md §419`. Vì sao service gọi lẫn nhau:
`04_system/adr.md ADR-08`.
