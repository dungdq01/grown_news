# Proposal 2 — Hệ AI/LLM + chatbot + tích hợp đa kênh

> s2 · 2026-08-31 · đọc từ `01_research/research_summary.md` (đã chưng, 213 dòng).
> `project_map.yaml:29` khai `skipped_gates: [G1, G2, G3]` ⇒ đây là **ghi chú theo
> giao thức s2**, không phải artifact ký gate.

## 0 · Quan hệ với `proposal.md` (08-18)

Bản cũ **không sai và không bị thay thế** — nó mô tả một công cụ đọc cho một
người, và phần đó đã dựng xong 4/5. Bản này **mở rộng phạm vi**, và mở rộng thật:

| `proposal.md` §4 Scope OUT | bản này |
|---|---|
| *"Tự động **tìm** nguồn mới"* | ⚠️ **một phần** — agent tuyển **khi được ra lệnh** |
| *"Multi-user, phân quyền, auth"* | ⚠️ **giai đoạn 2**, không làm bây giờ |
| *"SEO, tối ưu chia sẻ công khai"* | ⚠️ **giai đoạn 2** — dạy bạn bè qua kênh chat |

> Ba dòng đó là **cam kết đã ghi**, nên đảo chúng phải nói ra ở đây chứ không
> lặng lẽ phình ở s3. Ba dòng còn lại (tự viết SSG, tự viết engine tóm tắt,
> realtime/collab, app mobile) **giữ nguyên**.

---

## 1 · Vấn đề

**Vấn đề gốc chưa giải xong, và phạm vi mới làm nó cấp bách hơn.**

`research_summary §2`: có RAG vẫn bịa **17–34%** truy vấn. Dự án dựng cả bộ cổng
để chống. Nhưng đo tại chỗ 08-30 cho thấy **bộ cổng ấy tự khai từ đầu đến cuối**:

| mắt xích | đáng lẽ | thực tế | gap |
|---|---|---|---|
| `LOCATOR_RE` | một địa chỉ | **ngoặc vuông bất kỳ** — một công thức toán qua cổng | **G-6** |
| `citations_sampled` | máy đếm | `fm.get()` — số người gõ | **G-7** |
| `citations_verified` | máy đối chiếu | `fm.get()` — số người gõ | **G-7** |

⇒ **Hệ hiện không có cách nào phân biệt trích dẫn thật với trích dẫn bịa.**

Năm vấn đề còn lại, mỗi cái trỏ về một gap đã có bằng chứng:

| | vấn đề | gap |
|---|---|---|
| P1 | Không phân biệt được trích dẫn thật/bịa | G-6, G-7 |
| P2 | Không tầng truy hồi nào — tìm kiếm là lọc chuỗi trên DOM | G-8 |
| P3 | Kho không tự lớn — mọi thứ vào bằng tay, tại máy, qua trình duyệt | G-9 |
| P4 | **Không luật nào nói về dữ liệu GỬI RA** | G-10 |
| P5 | Không có chatbot; và nếu viết nhầm chỗ thì mỗi kênh là viết lại | G-11 |
| P6 | Không sinh được artifact (slide/voice/video) từ bài học | G-12 |

## 2 · Cho ai

**Giai đoạn 1 — một người: chủ dự án.** Bản tin hằng ngày để học. Không auth,
không multi-user, chạy local.

**Giai đoạn 2 — bạn bè, rồi khách trả tiền (subscription).** Không nằm trong
phạm vi thi công của proposal này, **nhưng kiến trúc không được cản nó**. Cụ
thể: chatbot phải là service có API ngay từ đầu (P5), và chính sách gửi RA phải
viết theo bậc để bậc "dạy người khác" cắm vào được (P4).

## 3 · Giải pháp đề xuất — phác thảo

1. Vá đường ray chống bịa **trước tiên** (S8, S9): địa chỉ phải phân giải được,
   và `citations_verified` do **máy tính** thay vì người gõ. **0 dòng LLM, 0 phụ
   thuộc** — nên nó đi trước cả FR.
2. Chốt chính sách **gửi RA** theo bậc (S7). Từ đây trở xuống mọi thứ có model.
3. Agent chưng cất đọc nguyên liệu trong `_media/`, viết bản phân tích 5 mục ra
   `_inbox/` → `gate.py` → `draft`. Máy chấm từng địa chỉ.
4. Index truy hồi trên kho; **phạm vi truy hồi lấy từ bộ lọc facet đã có**, hiển
   thị cho người dùng thấy — không phải top-k ẩn.
5. Chatbot là **một service có API riêng**. Web là client thứ nhất. Trả lời kèm
   địa chỉ **bấm được**; không có trong kho thì **từ chối, có phân loại lý do**.
6. Adapter kênh: một tiến trình local, **gọi RA** lấy tin, **gọi vào
   `127.0.0.1`** để nạp. Telegram trước, Discord sau.
7. Cuối cùng: sinh slide/voice/video từ bài đã duyệt.

## 4 · Phạm vi

### Scope IN

> Bảng là **danh sách**, không phải thứ tự. Thứ tự phụ thuộc ở `research_summary §6`:
> **S8·S9 → S7 → S11 → S12 → S13 → *core xong* → S14 → S15**.

| # | Hạng mục | Truy về |
|---|---|---|
| **S7** | FR *"dữ liệu gửi RA"* trong `security_baseline.md`, viết theo **bậc** | P4 · G-10 |
| **S8** | Cú pháp địa chỉ + phép phân giải; cổng chặn địa chỉ chết | P1 · G-6 |
| **S9** | `citations_sampled`/`citations_verified` thành **dữ liệu dẫn xuất** do `validate` tính | P1 · G-7 |
| **S10** | Bấm địa chỉ → mở nguồn đúng chỗ trong cửa sổ đọc | P1 · G-6 |
| **S11** | `M12_chungcat` — worker chưng cất, ghi qua `_inbox/` | P3 · G-9 |
| **S12** | `M13_truyhoi` — index + truy hồi, phạm vi = facet `TANG` | P2 · G-8 |
| **S13** | `M14_chatbot` — **service có API**, web là client #1 | P5 · G-11 |
| **S14** | `M15_kenh` — adapter Telegram, rồi Discord | P3 · G-9 |
| **S15** | `M16_artifact` — slide · voice · video | P6 · G-12 |
| **S16** | Ba vùng LÕI/THỢ/BIÊN, **mỗi ranh giới một cổng canh** | P4, P5 |

### Scope OUT — quan trọng hơn scope in

| Cố ý KHÔNG làm | Vì sao |
|---|---|
| **Crawler/scraper cho kênh không có API chính thức** | Crawler là cỗ máy **hỏng-im-lặng theo thiết kế** — mâu thuẫn với lý do tồn tại của dự án. FB: Groups API gỡ 22/04/2024, Meta có đội Anti-Scraping |
| **MTProto userbot · tự động hoá Zalo cá nhân** | Rủi ro khoá tài khoản gắn số điện thoại. Không có API chính thức cho Zalo cá nhân *(mới ở mức giả định — chưa khảo hết)* |
| **Zalo OA · FB Messenger** trong phạm vi này | Cả hai đòi **webhook nghe VÀO** ⇒ VPS/tunnel + app review. Khác hạng với Telegram/Discord |
| **Zalo Bot API** | Trạng thái **đang nghiên cứu** (lượt 14) — điều kiện/phí/rate limit chưa xác minh |
| **Cron tự kéo RSS** | Người dùng chốt **request-driven** (lượt 11) |
| **Multi-user · auth · thanh toán** | Giai đoạn 2. Kiến trúc không cản, nhưng không thi công |
| **Public web · SEO** | B-D3 còn hiệu lực; đảo nó cần FR riêng |
| **Truy hồi/RAG trước khi S8+S9 xong** | Chatbot không kiểm được thì chỉ là ChatGPT có thêm một bước |
| **Artifact trước khi core xong** | Phụ thuộc nhiều nhất, tốn nhất, "gửi RA" gắt nhất |
| **Tự viết TTS/video engine · tự train model** | Đã có tool tốt; giá trị nằm ở kỷ luật quanh nó |
| **Hermes `cron` + `gateway` trong profile dev** | G3 hạng **chặn** — cò súng ngoài cổng Factory |
| **Tách repo cho từng service** | Tách repo là cổng hết nhìn thấy nhau. Một repo, nhiều tiến trình |

## 5 · Tiêu chí thành công — số, không phải tính từ

### M5 · Đường ray chống bịa có RĂNG *(chặn — S8, S9)*

| Metric | Ngưỡng | Cách đo |
|---|---|---|
| M5.1 | `% địa chỉ phân giải được` **in ra được một con số** | lệnh mới; hôm nay **không đo được** |
| M5.2 | **100%** bài `phan-tich` mới có địa chỉ chết ⇒ **validate ĐỎ** | fixture: bài trỏ `[khong-ton-tai.md:9]` → exit ≠ 0 |
| M5.3 | **Đỏ oan = 0** — công thức/mảng số **không** bị tính là địa chỉ hỏng | fixture 5 chuỗi không-phải-địa-chỉ → exit 0 |
| M5.4 | `citations_verified` **khai sai ⇒ ĐỎ** | sửa tay số trong fixture → validate đỏ |

**M5 là metric chặn.** Không đạt ⇒ mọi tính năng LLM phía sau **nhân rủi ro lên**
chứ không nhân giá trị.

### M6 · Chưng cất dùng được *(S11)*

| Metric | Ngưỡng | Cách đo |
|---|---|---|
| M6.1 | ≥ **8/10** tài liệu cho ra bản nháp duyệt được sau ≤ **10 phút** sửa | bấm giờ, ghi worklog |
| M6.2 | Chi phí token/bài **đo được và ghi lại** | `--usage-file` JSON. **Chưa đặt trần** — đo 10 bài rồi mới đặt |
| M6.3 | **0** bản nháp tự vào `approved` | đếm; M05-R1 đã cưỡng chế |

### M7 · Chatbot — ĐỊNH NGHĨA "CORE XONG" *(S12, S13)*

| Metric | Ngưỡng | Cách đo |
|---|---|---|
| M7.1 | 10 câu hỏi chuẩn bị trước → ≥ **8** trả lời đúng | chủ dự án chấm, ghi worklog |
| M7.2 | **100%** khẳng định trong câu trả lời có địa chỉ **bấm được** | bấm từng cái, đếm |
| M7.3 | 5 câu ngoài kho → **0** lần bịa; từ chối có **phân loại lý do** | đếm |
| M7.4 | Gọi được **không qua web**: `curl` vào API trả JSON | 1 lệnh — chứng minh chatbot không mọc trong `web/` |

> **M7.1 + M7.2 + M7.3 + M7.4 đạt = CORE XONG.** Chỉ khi đó mới bắt đầu S14.
> Định nghĩa này **không cần một con số corpus tuỳ tiện** — nếu kho quá nhỏ thì
> M7.1 tự trượt.

### M8 · Kênh *(S14)*

| Metric | Ngưỡng | Cách đo |
|---|---|---|
| M8.1 | Từ "thấy link" → "bản ghi ở draft" ≤ **15 giây** thao tác người | bấm giờ |
| M8.2 | **Kênh thứ hai tốn ≤ 20% công kênh thứ nhất** | đếm dòng adapter + giờ trong worklog |
| M8.3 | **0** bản ghi tạo từ chat-id ngoài allowlist | gửi từ tài khoản lạ, đếm |
| M8.4 | 5 ca sai định dạng → **5** phản hồi nêu **đúng trường thiếu** | đếm |

**M8.2 là metric kiến trúc**: nó chứng minh hoặc bác bỏ luận điểm *"core xong
trước thì kênh rẻ"*. Trượt ⇒ chatbot đã mọc nhầm chỗ.

### M9 · Chính sách gửi RA *(S7, S16)*

| Metric | Ngưỡng | Cách đo |
|---|---|---|
| M9.1 | `security_baseline.md` có mục *"dữ liệu gửi RA"* với **≥ 4 bậc** định nghĩa | đọc file |
| M9.2 | **0** lời gọi ra Internet trong `web/api/**` | cổng mới, cùng khuôn `api-guard` |
| M9.3 | **100%** lời gọi model ghi lại **cái gì đã gửi** | log có `sha256` của payload |

## 6 · Rủi ro

| # | Rủi ro | Mức | Giảm bằng |
|---|---|---|---|
| R-a | **Đỏ oan của S8** làm cổng bị tắt | ~~cao~~ → **thấp** | Thiết kế Q5 dập nó: dạng không khớp thì **bỏ qua, không báo lỗi** — cổng chỉ đỏ khi một mục KHÔNG có địa chỉ nào hiểu được. M5.3 vẫn giữ, fixture đỏ-oan vẫn viết **trước** code |
| R-b | Chi phí LLM không dự toán được | cao | NotebookLM đã phải đổi sang quota compute-based (02/09/2026) — **đo trước, đặt trần sau** (M6.2) |
| R-c | Di trú bài `phan-tich` đang có khi đổi cú pháp địa chỉ | **thấp** | Kho có **đúng 1** bản `phan-tich` (2 bản kia là `thu-vien`, miễn cổng locator). Làm bây giờ gần như không tốn gì; để tới khi có 50 thì đắt |
| R-d | Corpus quá nhỏ để biết truy hồi có hoạt động | vừa | M7.1 tự trượt nếu kho thiếu ⇒ không cần ngưỡng riêng |
| R-e | Long polling ⇒ **máy tắt là không xử lý** | thấp | Telegram giữ update ~24h; chấp nhận cho dùng cá nhân |
| R-f | Pháp lý khi có người dùng thật (NĐ 356/2025 Điều 14) | vừa | Ngoài phạm vi thi công; **ghi vào `adr.md`** để giai đoạn 2 không quên |
| R-g | **Discord chưa khảo bằng nguồn nào** | vừa | Mọi phát biểu về Discord đang là **giả định** — khảo trước khi đưa vào S14 |
| R-h | Chatbot mọc trong `web/` | **cao** | M7.4 + M8.2 là hai metric bắt được |

## 7 · Ba câu chặn — ĐÃ DUYỆT 2026-08-31

### Q4 · Bậc của "gửi RA" → **FR-043**

Người quyết: *"liên quan input tích hợp để nhận / gửi request thì open hết"*.

| bậc | hành vi | trạng thái |
|---|---|---|
| 1 | adapter kéo update (token, request) | ✅ **mở** |
| 2 | bot trả *"đã nạp: `<slug>`"* — về **chính chủ dự án** | ✅ **mở** |
| 3 | bot gửi **thân bài** cho **người khác** | ✅ **MỞ 09-01** — `FR-045`, chỉ tới người trong `nguoi_dung` |
| 4 | tài liệu nguồn → model đám mây | ✅ **mở giai đoạn 1**, kèm ràng buộc log |

**Ràng buộc bắt buộc của bậc 4**: mọi lời gọi model **ghi log `sha256` của thứ
đã gửi**. Không có log thì câu hỏi *"tài liệu X đã từng rời máy chưa"* là không
trả lời được, vĩnh viễn.

> **Cập nhật 2026-09-01**: bậc 3 **đã MỞ** qua `FR-045` — chỉ đạo *"cả a và b:
> mỗi người 1 account"* làm `B-D3` phải luận lại thành `B-D3b`. Câu *"bậc 3
> đóng không chặn gì bây giờ"* ở trên đúng lúc viết, và nay không còn áp.
Chi tiết + bốn cổng canh: `.factory/fr/FR-043-du-lieu-gui-ra-ngoai.md`.
**S11 hết bị chặn.**

### Q5 · Cú pháp địa chỉ → **tập DẠNG, không phải một cú pháp**

Người quyết: *"linh động đi"*. Diễn giải thành thiết kế cụ thể — vì *linh động*
và *phân giải được* kéo ngược nhau, và cách hoà giải là **không bắt buộc một
cú pháp, mà nhận nhiều dạng rồi chỉ ĐẾM cái nào máy hiểu**:

| người gõ | máy hiểu |
|---|---|
| `[§II.4]` · `[§3.2]` | nội chỉ — trỏ vào nguồn của chính bài |
| `[ten-file.md:12-31]` | ngoại chỉ + dòng |
| `[….pdf:p.7]` · `[p.7]` | trang |
| `[t=03:15]` | mốc thời gian video |
| `[slug-bai-khac]` | trỏ sang bản ghi khác trong kho |
| `[2, 1, 0.5]` · `[ l(y)+g·f(x) ]` · `[Reading]` | **không phải địa chỉ — BỎ QUA, không đỏ** |

Luật thành: **mỗi mục cần locator phải có ≥1 địa chỉ máy phân giải được.**

Ba hệ quả:

- Công thức toán trong ngoặc vuông **vẫn viết thoải mái** — chỉ không được tính.
- **Dập rủi ro R-a** (đỏ oan làm người dùng tắt cổng): thứ không khớp thì **im
  lặng bỏ qua**, không bao giờ báo lỗi. Cổng chỉ đỏ khi một mục **không có**
  địa chỉ nào hiểu được.
- Thêm dạng mới sau = thêm **một dòng vào bảng khai**, không phải sửa luật.

Tập dạng phải nằm ở **một bảng khai** (như `khung-than-bai.json` đã làm với
khung), không gõ tay trong `validate.py` — nếu không thì mỗi tầng đọc một bản.

### Q7 · Hồ sơ `tong-hop` → **FR-044** *(phát sinh 08-31, đã duyệt)*

Use case *"PDF + video về một chủ đề → một bản tổng hợp"* cho ra bản ghi có
**N nguồn, không `url` đơn nào**. Đo được: `ho_so` chỉ có `phan-tich` và
`thu-vien`; `url` là trường **bắt buộc**. Không khớp cái nào.

Người quyết: **phương án A** — mở FR ngay, để s4 thiết kế cả hai kiểu.

`FR-044`: `ho_so` thêm `tong-hop` · trường mới `nguon: [slug…]` ≥2 ·
`url: grown://tong-hop/<slug>` · ba cổng T1–T3. **Không** đụng `source_type`,
**không** gỡ `url` khỏi `required`.

**Chặn**: T2 cần tập dạng địa chỉ của Q5 ⇒ **S11 không đi trước S8 được**.

### Q6 · "Core xong" → **chat + phân tích chạy được TRÊN WEB HIỆN TẠI**

Người quyết: *"core trước tích hợp sau: chat và phân tích được trên web hiện
tại → sau đó mới tích hợp → tích hợp tele trước ⇒ mở rộng discord zalo fb sau"*.

Định nghĩa này **gọn hơn** M7.1–M7.4 và thay thế nó ở mức phát biểu. M7.1–M7.4
giữ lại làm **cách đo** cho đúng câu đó — **không thêm ngưỡng corpus nào**.

Thứ tự kênh chốt: **Telegram → Discord → Zalo → FB**. Ba kênh sau nằm ngoài
phạm vi thi công của proposal này (§4 Scope OUT); ghi thứ tự để s3 không xếp lại.

---

## 7b · Thứ tự thi công sau khi ba câu đã chốt

```text
S8 · S9   địa chỉ phân giải được + citations do máy tính    ← 0 LLM, 0 phụ thuộc
   ↓         di trú: ĐÚNG 1 bản ghi `phan-tich`
S7        FR-043 — đã viết, đã duyệt                        ← mở khoá S11
   ↓
S10       bấm địa chỉ → mở nguồn
   ↓
S11       M12_chungcat                                      ← máy chấm từng địa chỉ
   ↓
S12       M13_truyhoi
   ↓
S13       M14_chatbot (service có API) + web là client #1
   ↓
          ═══ CORE XONG — Q6 ═══
   ↓
S14       M15_kenh — Telegram, rồi Discord
   ↓
S15       M16_artifact
```
## 8 · Trạng thái đã đo (2026-08-31)

- Kho: **3 bản ghi** (`select count(*) from ban_ghi`) + 1 PDF trong `_media/`
- `% địa chỉ phân giải được`: **chưa đo được** — chưa có công cụ
- Cổng: pytest **42 passed** · **22/26** cổng Python xanh · 80 cổng web
- Bốn đỏ tồn đọng, **không thuộc phạm vi này**: `check_danh_muc` + `check_skill`
  (schema `core/skill-src`) · `check_frozen` (chờ người ký) · `check_running`
  (hệ quả)
