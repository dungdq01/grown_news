# Screen inventory

> Sinh từ `04_system/diagrams/flow-tong.md` + PRD U5/U6. Không bịa màn ngoài flow.
>
> **Chỉ 3 màn.** Web là lớp **chỉ đọc** — không form, không editor, không đăng
> nhập. Mọi hành động ghi xảy ra ở `M01_core` qua CLI/git, không qua web
> (BRD B-C3).

## Flow P0 nào cần màn web?

| Flow | Có màn web? | Vì sao |
|---|---|---|
| F1 ingest | ❌ | Xảy ra trong Claude Code + git, không có UI |
| F2 review | ❌ | Người sửa file `.md` rồi commit — không có UI duyệt trên web |
| **F3 publish** | ✅ | Đây là flow duy nhất chạm web |

F3 là flow P0 duy nhất cần click được đầu-tới-cuối trên prototype.

## Ba màn

### SCR-01 · Trang bài

**Là gì**: nơi nội dung sống. Màn quan trọng nhất — vẽ trước, chốt trước.

**Vào từ**: SCR-02 (tít), SCR-03 (kết quả tìm), URL trực tiếp

**Dữ liệu**: một `Analysis` có `review_status: approved`

**Bảy khối** — thứ tự theo mức cam kết tăng dần của người đọc (PRD U5):

| # | Khối | Nguồn dữ liệu | Vì sao ở vị trí này |
|---|---|---|---|
| 1 | Tít + sapo | `title` / `one_liner` + khối "60 giây" | Quyết định đọc tiếp trong 5 giây |
| 2 | Hộp metadata | `author` `published_at` `license` `credibility_max` `decay_risk` `analyzed_at` `version_id` badge `origin` | Lọc được nhiều người đọc — đặt ngay dưới sapo |
| 3 | **Dải cảnh báo** | `unverifiable_citations` · `contradicted_by` | Mục 7 đẩy lên đầu khi có rủi ro |
| 4 | Thân bài theo khung khai | các mục `## n.` | Nội dung chính |
| 5 | Lộ trình tiếp thu | mục 8 | Checklist, lưu localStorage |
| 6 | Tự kiểm | mục 9 | Ẩn đáp án, bấm mới hiện |
| 7 | Đề xuất skill | `skill_candidates[]` | Hộp riêng, hiện `why_now` + `priority` |

**Đặc thù**: khi nhiều bản cùng `url_normalized` → hiện **tab** ở đầu bài, không
phải nhiều trang (BRD B-A3).

---

### SCR-02 · Trang chủ

**Là gì**: cửa vào, nơi lang thang.

**Ba khối, không hơn** (PRD U5):

| Khối | Nội dung | Luật sắp xếp |
|---|---|---|
| Tiêu điểm | 1 bài, sapo đầy đủ | `priority` cao nhất 7 ngày — **KHÔNG theo ngày** |
| Dòng thời gian | bài mới, tít + sapo 2 dòng + chuyên mục + thời gian đọc | `analyzed_at` giảm dần |
| Theo chuyên mục | 6 cột theo `source_type`, mỗi cột 4 tít | — |

**Cố ý bỏ**: carousel · infinite scroll · popup đăng ký. Nội dung để tra cứu,
không để giữ chân.

**Lưu ý**: `web-spec.md` nói *trang chủ chỉ có nghĩa khi trên 20 bài*. Hiện kho
rỗng — wireframe vẫn vẽ, nhưng dựng thật có thể hoãn.

---

### SCR-03 · Tra cứu

**Là gì**: tìm lại thứ đã học.

**Hai chế độ, cùng một ô nhập** (PRD U6):

| Chế độ | Cách | Vì sao đủ |
|---|---|---|
| Từ khóa | full-text trên `title`, `one_liner`, thân bài | Nhu cầu thường gặp |
| **Khái niệm** | lọc theo `concepts` | Chính xác vì danh mục **được kiểm soát** — không cần embedding |

**Kết quả trả về kèm đoạn khớp**, không chỉ tít — người dùng thấy ngay lý do nó khớp.

**Bộ lọc phụ**: `source_type` · `credibility_max` · `decay_risk`

---

## Ba state mỗi màn

Bắt buộc theo workflow s5. Với dự án này, `error` hiếm (site tĩnh) nhưng `empty`
**rất thật** — kho đang rỗng.

| Màn | empty | loading | error |
|---|---|---|---|
| SCR-01 | không áp dụng (không có bài thì không có URL) | — (tĩnh) | 404 — bài không tồn tại hoặc chưa `approved` |
| SCR-02 | **kho rỗng / chưa bài nào approved** ← trạng thái hiện tại | — (tĩnh) | build lỗi |
| SCR-03 | không có kết quả khớp | — (lọc client-side) | — |

`empty` của SCR-02 không phải trường hợp hiếm — nó là **trạng thái hiện tại của
dự án**, và là màn đầu tiên người dùng thấy. Phải thiết kế tử tế, không để trống trơn.

## Không có màn nào cho

| Không có | Vì sao |
|---|---|
| Đăng nhập | Một người dùng, web private |
| Quản lý `concepts.yaml` | Sửa file, deny S1 chặn ghi tự động |

> **Đã rời bảng (FR-011, 2026-08-19)**: "Duyệt bài trên web" và "Sửa nội dung"
> — giờ là **SCR-04 bàn biên tập**: nút duyệt/loại ở chân cửa sổ đọc (khai 3
> trường M1), form viết/sửa bài ở màn Nạp nguồn, thùng rác ở màn Kho. Mọi
> control ghi ẩn khi không có API local (`npm run api`) — site tĩnh vẫn chỉ-đọc.
> "Nạp nguồn" và "Dashboard" đã thành màn thật từ trước (v-nap, /kho/).

## project_map screens

Cập nhật `M03_web.screens`: `[SCR-01, SCR-02, SCR-03]`

---

# Đợt hai — 2026-09-01 · năm màn M12–M16 (mock s5)

> Sinh từ PRD U9–U12 + spec_overview đợt hai.
> Contract: `contracts/{chungcat,truyhoi,chatbot,kenh,artifact}.sample.v1.json`.
>
> **Trình tự chốt** (chỉ đạo 2026-09-01, lần ba): *"xóa /dot-hai/ ở web —
> prototype trước, sau apply TỪNG MODULE lần lượt"*. Và s6 đã chốt **Z7: dịch
> vụ không có màn riêng** — nên bảng SCR-07..11 dưới đây (mỗi module một màn)
> là hồ sơ của bản nháp ĐÃ BỊ BÁC, giữ để đọc lại lý do.
>
> **Bản CHÍNH của s5 đợt hai: `prototype/dot-hai/` — 7 trang theo MÀN THẬT**
> (sinh bởi `sinh_dot_hai.py` từ contracts **v2**, mở thẳng `index.html`):
>
> | trang | là gì |
> |---|---|
> | index | bản đồ tính-năng-nằm-ở-màn-nào + 4 luật hiển thị |
> | man-tai-lieu | màn ĐÃ CÓ + nút Chưng cất → việc chạy theo `giai_doan` |
> | man-tong-hop | màn ĐÃ CÓ + chọn ≥2 → Tổng hợp chủ đề |
> | dashboard | màn ĐÃ CÓ + khối việc: giai đoạn đếm được, lý do dừng 3 loại |
> | cua-so-chat | màn MỚI duy nhất: phạm vi hiển thị · gắn cờ chưa-xác-minh · 3 từ chối kèm việc-nên-làm |
> | cua-so-doc | màn ĐÃ CÓ + nút artifact (chỉ bài đã lên) + hỏi-trước-khi-sinh |
> | tin-nhan-kenh | giao diện ta không sở hữu — 5 hội thoại = 5 luật nội dung tin |
>
> ~~Web KHÔNG còn `/dot-hai/` (đã gỡ sạch 5 lớp, suite xanh).~~
> **ĐẢO LẠI 2026-09-03** — chỉ đạo: *"màn /dot-hai thì phải implement cả giao
> diện cho đẹp vào nhe"*. Nên `/dot-hai/` **CÓ LẠI** trong web, dựng theo
> `T03-90`: một route, năm thẻ M12–M16, số đọc từ `contracts/*.sample.v1.json`.
>
> ⚠️ Đây là lần **thứ tư** hướng của màn này đổi (09-01 có → 09-01 lần ba xoá →
> 09-03 có lại). Ghi ra vì nó đáng: một màn bị gỡ rồi thêm lại là hai lần công,
> và lần thứ ba sẽ tốn đúng như vậy. Cái KHÔNG đổi qua cả bốn lượt:
> `prototype/dot-hai/` là **bản đối chiếu** (prototype thắng khi lệch), và
> **`Z7` vẫn nguyên** — dịch vụ không có màn riêng, nên `/dot-hai/` là màn
> TOÀN CẢNH (liệt dịch vụ), không phải năm màn cho năm module.
>
> Khi prototype được duyệt: apply từng module vào web lần lượt, mỗi lần một
> đơn vị việc — vế này của chỉ đạo 09-01 **còn hiệu lực**.
> `app-v21.html` + bộ m1x-*.html cũ: SUPERSEDED, đã xoá m1x-*.

| SCR | Màn / bề mặt | Gánh | Wireframe |
|---|---|---|---|
| SCR-12 | Cửa sổ đọc — bổ sung đợt hai (trung tâm mặt [N]) | M12 · M13 · M14 · M16 | wireframes/SCR-12-cua-so-doc-dot-hai.md |
| SCR-13 | Xưởng — [Q] việc nền | M12 · M16 | wireframes/SCR-13-xuong.md |
| SCR-14 | Hàng đợi duyệt — [Q] nháp AI (FR-046) | M12 | wireframes/SCR-14-hang-doi-duyet.md |
| SCR-15 | Hội thoại — [Q] phiên | M14 (+M15 đổ về) | wireframes/SCR-15-hoi-thoai.md |
| SCR-16 | Cấu hình — [Q] read-only | cả 5 | wireframes/SCR-16-cau-hinh.md |
| SCR-17 | Tin nhắn kênh — hợp đồng nội dung tin | M15 | wireframes/SCR-17-tin-nhan-kenh.md |

SCR-07..11 (mỗi-module-một-màn): **SUPERSEDED** — giữ làm hồ sơ vì-sao-đổi.
Các màn đã có (Tài liệu · Tổng hợp · Dashboard) chỉ THÊM nút/khối theo ma trận
`ma-tran-module-man.md` §1 — không cần wireframe riêng, prototype là hợp đồng.

Flow P0 đợt hai phải click được đầu-tới-cuối trên mock:
nguyên liệu → chưng cất (job + sha256) → bản nháp → (duyệt ngoài mock) →
tra cứu ra đoạn có địa chỉ → hỏi kho được trả lời có citation bấm được →
kênh nạp/hỏi từ xa có định danh → artifact mang đường về nguồn.

## `/dot-hai/` — lần đổi hướng thứ NĂM, và chỗ nó dừng

| # | hướng | ai chốt |
|---|---|---|
| 1–4 | (bốn lần trước, ghi ở phần trên) | — |
| 5 | **rule 5**: mỗi module phase-2 một URL + button riêng; *"gom tất cả vào `/dot-hai/` không phải ý tưởng tốt"* | chủ dự án 2026-09-03 |
| **chốt** | `/dot-hai/` = **trang OVERVIEW**: giữ URL, `menu: false`, không button rail | chủ dự án 2026-09-03 (T03-98) |

Rule 5 cấm **gom** các module vào một URL — nó không cấm **một trang toàn cảnh**.
Hai thứ cùng tồn tại: `/chung-cat/` · `/hoi-kho/` · `/kenh/` · `/artifact/` mỗi
cái một URL + một button; `/dot-hai/` là chỗ đọc *"đợt hai đang đứng ở đâu"* và
vào bằng URL, không bằng một mục nav thường trực.

Vì sao KHÔNG tháo hẳn: nó là thứ **duy nhất hôm nay** trả lời được câu đó — số
liệu đọc từ `contracts/*.sample.v1.json`, không phải chữ gõ tay. Bốn màn thay
thế chưa dựng (T03-93/94 còn CHẶN vì thiếu cửa ĐỌC — ô nợ M08).

**Bốn lần dựng-rồi-đổi trên cùng một màn là số liệu cho s10-retro**, không phải
lời phán ai sai: nó nói nhịp *chốt hình dạng màn trước khi dựng* đang thiếu.
