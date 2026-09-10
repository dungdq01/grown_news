# M16_artifact — spec

> **Vùng THỢ.** Một bài `approved` → bản trình bày / bản đọc / bản video.
> Nguồn: `spec_overview.md#M16_artifact` · `research_summary.md` §10 (M16) ·
> `FR-043` bậc 4 · `M09-R1`.
>
> ⚠️ **Mọi `cmd` dưới đây trỏ vào lệnh CHƯA TỒN TẠI** — `artifact/` chỉ có README.
> Và M16 là module **phác thảo nhất** trong sáu: `research_summary` §10 tự khai nó
> *"giữ mức phác"*. Spec này chốt **ranh giới và luật**, không chốt engine.

## 1 · Chạy PHÚT, không phải giây

Sinh slide/giọng đọc/video mất **phút**. Nó **không** nằm trong một HTTP request.

> **AC-1.1** · `POST /artifact` trả **ngay** một `job_id`; không request nào của
> M16 chạy quá **2 giây**.
> `hard` · `cmd: python artifact/tests/check_bat_dong_bo.py`

> **AC-1.2** · Giết tiến trình giữa lúc sinh ⇒ **không** file nửa vời nào trong
> `kb/_media/`; job còn nguyên để chạy lại.
> `hard` · `cmd: python artifact/tests/check_khong_file_nua_voi.py`

> **AC-1.3** · Cùng `job_id` gọi hai lần ⇒ đúng **một** artifact, lần hai **0** lời
> gọi engine (cùng khuôn ULID của M12).
> `hard` · `cmd: python artifact/tests/check_idempotency.py`

## 2 · Chỉ bài `approved`, và byte là thứ KHÔNG dựng lại được

> **AC-2.1** · M16 **chỉ** nhận `slug` của bài `review_status: approved`. Bài
> `draft`/`rejected` ⇒ từ chối trước khi gọi engine.
> `hard` · `cmd: python artifact/tests/check_chi_bai_duyet.py`

> **AC-2.2** · M16 **chỉ THÊM** vào `kb/_media/` — không xoá **và không ghi đè**.
> Phép đo là **TRẠNG THÁI**, không phải lời gọi hàm: trước/sau khi sinh artifact,
> **mọi `sha256` cũ giữ nguyên** và **số file chỉ TĂNG**.
> `hard` · `cmd: python artifact/tests/check_khong_xoa_byte.py`

⚠️ **Vế "ghi đè" thêm vào 2026-09-02 vì phép thử s6.** Bản đầu chỉ cấm *xoá*.
Nhưng sinh lại cùng loại artifact cho cùng bài **ghi đè** bản cũ thì phá byte y
hệt — và **không có `unlink` nào để grep**. Đó là lý do phép đo phải là trạng thái
trước/sau, không phải một phép quét mã tìm lời gọi xoá.

> **AC-2.3** · Artifact sinh ra khai `la_dan_xuat = 1` trong bảng `media` — phân
> biệt được với nguyên liệu người nạp. Thiếu cờ ⇒ đỏ.
> `hard` · `cmd: python artifact/tests/check_khai_dan_xuat.py`

⚠️ **`AC-2.3` là ranh giới cứu được `M09-R1`.** Nguyên liệu người nạp **không** dựng
lại được; artifact **dựng lại được**. Không phân biệt hai loại thì một ngày ai đó
dọn `_media/` để tiết kiệm chỗ và xoá cả hai.

## 3 · Ba loại artifact, ba engine — và engine KHÔNG chốt ở đây

| loại | đường đề xuất | vì sao |
|---|---|---|
| **slide** | **Marp CLI** — LLM sinh outline JSON → template ép Marp `.md` → render | template ép ⇒ LLM không tự do đặt bố cục |
| **slide sửa được chữ** | `pandoc` → `pptx` | **PPTX của Marp là ẢNH**; cần sửa chữ thì Marp không dùng được |
| **giọng đọc** | thứ tự: **Azure vi-VN** (500K ký tự/tháng free ≈ 55 bài) → **FPT.AI** (100K free) → **piper** local | tránh **ElevenLabs**: đắt nhất, tiếng Việt không có ở model tốt nhất |
| **video** | `ffmpeg concat` + TTS **local** | **0 byte rời máy** |

> **AC-3.1** · Engine đọc từ **bảng khai** `artifact/assets/engine.json`; grep tên
> engine trong mã (ngoài `assets/`) ⇒ đỏ.
> `hard` · `cmd: python artifact/tests/check_bang_khai_engine.py`

> **AC-3.2** · Bảng khai ghi rõ **PPTX của Marp là ảnh**; chọn Marp cho một yêu cầu
> *"sửa được chữ"* ⇒ đỏ ở cổng, không phải phát hiện lúc người dùng mở file.
> `hard` · `cmd: python artifact/tests/check_bang_khai_engine.py`

> **AC-3.3** · Thứ tự dự phòng TTS đọc từ bảng, và **rơi trong cùng `khu_vuc`**
> (cùng luật `M12-R5`). Azure và FPT.AI khác khu vực ⇒ phải khai tường minh.
> `hard` · `cmd: python artifact/tests/check_du_phong_cung_khu_vuc.py`

## 4 · Quay ngược làm input — link ở tầng METADATA, không ở pixel

Nguyên lý ⑤ của NotebookLM, và nó là **lý do M16 tồn tại** thay vì chỉ xuất file:

> Artifact phải **quay ngược làm input**. Bấm một chỗ trong slide thì hỏi tiếp
> được — không phải *"sinh ra file rồi hết"*.

Cài đặt: link đặt ở **tầng metadata**, không đặt trong pixel.

| loại | link sống ở đâu |
|---|---|
| PPTX | hyperlink của shape |
| PDF | `#page=N` |
| audio | **ID3 CHAP** (chapter) |
| video | **sidecar** `timestamp → URL`, **không** vẽ vào khung hình |

> **AC-4.1** · Mọi artifact mang **≥1 địa chỉ phân giải được** về bài nguồn, ở
> **metadata** của chính file (PPTX hyperlink · PDF `#page=N` · ID3 CHAP · sidecar).
> Đốt link vào pixel ⇒ đỏ.
> **Đây là tầng FILE.** Tầng **KHO** (*liệt kê artifact của bài X bằng một truy
> vấn*) **không** thuộc AC này — xem cảnh báo dưới.
> `hard` · `cmd: python artifact/tests/check_link_o_metadata.py`

⚠️ **Tách hai tầng vì phép thử s6.** Đo 2026-09-02: bảng `media` có đúng **ba** cột
(`sha256` · `byte` · `la_dan_xuat`) — **không cột nào trỏ về `slug`**. Nên câu
*"artifact này của bài nào"* trả lời được **chỉ bằng cách mở từng file**, không
bằng một truy vấn. Ca *liệt kê artifact của bài X* — thứ UI cần — **không viết nổi
testcase**.
Giữ AC này ở tầng file (kiểm được ngay), và tầng kho là **FR tới M09** (chủ sở hữu
bảng `media`), ghi con trỏ ở `backlog.md`. Khai gộp hai tầng vào một AC là hứa một
thứ M16 **không thể** làm một mình.

> **AC-4.2** · Địa chỉ trong artifact phân giải được bằng
> `core/assets/dia-chi.json` — cùng bảng, không dạng riêng cho artifact.
> `hard` · `cmd: python artifact/tests/check_link_o_metadata.py`

> **AC-4.3** · Video **không** có chữ URL nào vẽ trong khung hình; kiểm bằng cách
> đọc sidecar và đối chiếu số mốc.
> `hard` · `cmd: python artifact/tests/check_link_o_metadata.py`

⚠️ **Vì sao không vẽ URL vào pixel**: người xem không bấm được, không copy được, và
khi URL đổi thì phải **render lại cả video**. Metadata sửa được; pixel thì không.

## 5 · Egress — hai đường, và một trong hai là bậc 4

| đường | dữ liệu rời máy | bậc |
|---|---|---|
| TTS **local** (piper) + `ffmpeg` | **0 byte** | không phải egress |
| TTS **cloud** (Azure/FPT.AI) | **toàn văn bài** | **bậc 4** |

> **AC-5.1** · Gọi TTS cloud ⇒ log `sha256` **văn bản đã gửi**, trước khi gửi
> (cùng luật `M12-R3`).
> `hard` · `cmd: python artifact/tests/check_mot_cua_egress.py`

> **AC-5.2** · Đường **local** không sinh dòng log egress nào — nếu có, tức có gì
> đang gọi ra ngoài mà ta không biết.
> `hard` · `cmd: python artifact/tests/check_mot_cua_egress.py`

> **AC-5.3** · Đích TTS khai trong bảng; gọi host không khai ⇒ chặn trước khi mở
> socket.
> `hard` · `cmd: python artifact/tests/check_dich_trong_bang.py`

⚠️ **Đây là chỗ dễ đánh giá thấp nhất của cả đợt hai.** Người dùng bấm *"tạo giọng
đọc"* trông như một tiện ích nhỏ, nhưng nó gửi **toàn văn một bài** ra một nhà cung
cấp nước ngoài — cùng bậc với M12 gửi tài liệu nguyên liệu. `AC-5.2` tồn tại để
đường local **chứng minh được** là nó không gửi gì.

## 6 · Xếp CUỐI, và bốn lý do

`spec_overview`: M16 xếp cuối vì **cần corpus** · **cần M12 chạy tốt** · **tốn
nhất** · **gửi RA gắt nhất**.

Kho hiện có **3** bản ghi. Sinh slide từ 3 bài không chứng minh được gì về giá trị,
và mỗi lần thử là một lần gửi toàn văn ra ngoài.

> **AC-6.1** · M16 **từ chối** chạy khi kho có < **10** bản ghi `approved` — ngưỡng
> README, đọc từ cấu hình. Không phải để cản, mà để không ai đo giá trị M16 trên
> một corpus chưa đủ.
> `soft` · người chốt ngưỡng; máy chỉ đọc số từ cấu hình

## 7 · Cái CỐ Ý không có

| | vì sao |
|---|---|
| ElevenLabs | đắt nhất, và tiếng Việt **không có** ở model tốt nhất của họ |
| Marp cho slide cần sửa chữ | PPTX của Marp là **ảnh** — `AC-3.2` |
| URL vẽ trong khung hình video | `AC-4.3` — không bấm được, và đổi URL phải render lại |
| xoá byte trong `_media/` | `M09-R1` — mỗi DELETE phá byte vĩnh viễn |
| chạy trong một HTTP request | `AC-1.1` — mất phút, không phải giây |
| giao diện | `Z7` |
| sinh artifact từ bài `draft` | `AC-2.1` — chưa ai chịu trách nhiệm nội dung đó |
