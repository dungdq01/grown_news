# M16_artifact — testcases

> Mỗi AC **≥1 happy + ≥1 edge**, viết **bằng lời**. `m-test` ở s8 là vai riêng và
> giữ quyền FR ngược về đây (R1).
> **Phép thử s6**: *viết không nổi testcase ⇒ AC mơ hồ ⇒ SỬA AC*. Kết quả ở §cuối.

## 1 · Chạy PHÚT, không phải giây

**AC-1.1** — bất đồng bộ
- *happy*: `POST /artifact` → trả `job_id` trong **< 2 giây**, trong khi job còn chạy.
- *edge*: job mất 4 phút → request đầu **vẫn** trả trong 2 giây; không request nào của M16 chạy quá 2 giây.
- *edge 2*: gieo một cài đặt chờ engine xong rồi mới trả → đỏ.

**AC-1.2** — không file nửa vời
- *happy*: job xong → file trong `kb/_media/`, `sha256` khớp nội dung.
- *edge*: `kill -9` giữa lúc ghi → `kb/_media/` **không** có file nửa vời (dựng ở thư mục tạm rồi `os.replace`); job còn lại để chạy lại.
- *edge 2*: đĩa đầy giữa chừng → cùng kết quả: không file nửa vời trong `_media/`.

**AC-1.3** — idempotency
- *happy*: `job_id` mới → một artifact.
- *edge*: **cùng** `job_id` gọi lại → vẫn **một** artifact, và **0** lời gọi engine (đếm bằng log, không bằng lời khai).

## 2 · Chỉ bài duyệt, byte chỉ THÊM

**AC-2.1** — chỉ `approved`
- *happy*: slug `approved` → chạy.
- *edge*: slug `draft` → từ chối **trước khi** gọi engine; 0 dòng log egress.
- *edge 2*: bài đang `approved` bị hạ xuống `rejected` **giữa lúc** job chạy → job dừng, không ghi artifact.

**AC-2.2** — không xoá byte
- *happy*: trước/sau khi sinh artifact, **mọi** `sha256` cũ trong `media` giữ nguyên; số file chỉ **tăng**.
- *edge*: `grep` một `unlink`/`remove`/`truncate` trên đường `_media` trong `artifact/` → đỏ.
- *edge 2*: sinh **hai lần** cùng loại artifact cho cùng bài → bản cũ **không** bị ghi đè; hai hiện vật cùng tồn tại.

**AC-2.3** — khai `la_dan_xuat = 1`
- *happy*: hàng `media` do M16 sinh có `la_dan_xuat = 1`.
- *edge*: gieo một đường ghi thiếu cờ → đỏ.
- *edge 2*: hàng do **người nạp** có `la_dan_xuat = 0` — cổng kiểm **cả hai chiều**, không chỉ chiều của M16. (Một cột luôn bằng 1 thì nó không phân biệt gì.)

## 3 · Ba loại, engine từ bảng khai

**AC-3.1** — 0 tên engine trong mã
- *happy*: `grep -iE "marp|pandoc|azure|fpt|piper|ffmpeg"` trong `artifact/**` trừ `assets/` → **0**.
- *edge*: gieo `subprocess.run(["marp", ...])` → đỏ.

**AC-3.2** — bảng ghi giới hạn engine
- *happy*: dòng Marp trong `engine.json` có `gioi_han` nói **PPTX là ảnh**.
- *edge*: yêu cầu `slide-sua-duoc` mà bảng định tuyến sang Marp → **đỏ ở cổng khai báo**, không phải lúc người dùng mở file.
- *edge 2*: một dòng engine **thiếu** `gioi_han` → đỏ. (Không có giới hạn nào là một lời khai, không phải một sự thật.)

**AC-3.3** — dự phòng TTS cùng khu vực
- *happy*: Azure hết quota → rơi sang dự phòng **cùng `khu_vuc`**.
- *edge*: bảng khai Azure → FPT.AI (khác khu vực) **không** có cờ `cho_phep_cheo_khu_vuc` → đỏ ở cổng khai báo.
- *edge 2*: có cờ tường minh → xanh, **và** hàng artifact ghi nhà thật sự đã dùng.

## 4 · Quay ngược làm input

**AC-4.1** — ≥1 địa chỉ ở METADATA
- *happy*: PPTX sinh ra → đọc hyperlink của shape thấy ≥1 địa chỉ phân giải được.
- *edge*: artifact **không** có địa chỉ nào ở metadata → đỏ.
- *edge 2*: artifact có URL **vẽ trong pixel** nhưng **0** ở metadata → đỏ (không được tính là "có địa chỉ").

**AC-4.2** — phân giải bằng `dia-chi.json`
- *happy*: địa chỉ trong metadata khớp một dạng trong bảng khai và phân giải được.
- *edge*: địa chỉ dùng một cú pháp riêng của artifact (không có trong bảng) → đỏ.

**AC-4.3** — video: sidecar, không pixel
- *happy*: video có file sidecar `timestamp → URL`, số mốc ≥1.
- *edge*: video có chữ URL trong khung hình → đỏ. Đo bằng: **sidecar rỗng nhưng người xem thấy URL** ⇒ URL đó ở pixel.
- *edge 2*: đổi URL trong sidecar → **không** phải render lại video (chứng minh link sống ở metadata).

## 5 · Egress

**AC-5.1** — TTS cloud: log `sha256` VĂN BẢN, trước khi gửi
- *happy*: một job cloud → 1 dòng log; dựng lại văn bản từ log rồi băm ra **cùng** `sha256`.
- *edge*: request không hoàn thành → dòng log **vẫn tồn tại**.
- *edge 2*: băm **file audio kết quả** thay vì văn bản gửi đi → không khớp ⇒ đỏ.

**AC-5.2** — đường local sinh 0 dòng log
- *happy*: job dùng piper + ffmpeg → `egress.jsonl` **không thêm dòng nào**.
- *edge*: đường local sinh **≥1** dòng → đỏ. Nghĩa là có gì đó đang gọi ra ngoài mà ta không biết.
- *edge 2*: chạy đường local với mạng **bị chặn hoàn toàn** → job vẫn xong. (Phép đo mạnh nhất cho "0 byte rời máy".)

**AC-5.3** — allowlist đích
- *happy*: gọi host TTS có trong bảng → qua.
- *edge*: host lạ → **chặn trước khi mở socket** (không có kết nối TCP nào ra host đó).

## 6 · Ngưỡng corpus

**AC-6.1** — từ chối khi kho < 10 bản `approved` *(soft)*
- *happy*: kho có ≥10 bản `approved` → M16 chạy.
- *edge*: kho có 3 bản → từ chối, và **nói ra** ngưỡng + số hiện tại.
- *edge 2*: đổi ngưỡng trong cấu hình → hành vi đổi theo, **0 dòng mã**.
- ⚠️ `soft`: **người** chốt ngưỡng; máy chỉ đọc số từ cấu hình và so.

---

## Kết quả phép thử s6 — hai AC mơ hồ, ĐÃ SỬA

Chạy trên 16 AC: **14 viết được ngay**. Hai cái không:

**a · `AC-4.1` — *"artifact mang ≥1 địa chỉ phân giải được về bài nguồn"* KHÔNG LƯU
ĐƯỢC ở tầng kho.**
Đo 2026-09-02: bảng `media` có đúng **ba** cột — `sha256` · `byte` · `la_dan_xuat`.
**Không cột nào trỏ về `slug`.** Nên câu *"artifact này của bài nào"* trả lời được
**chỉ bằng cách mở từng file và đọc metadata**, không bằng một truy vấn.
Testcase *happy* của tôi viết được ở tầng **file**, nhưng ca *"liệt kê artifact của
bài X"* — thứ UI cần — **không viết nổi**.
⇒ **Đã sửa `AC-4.1`**: tách rõ **hai tầng**. Tầng **file** (metadata) là AC của M16
và kiểm được ngay. Tầng **kho** (truy vấn được) là **FR tới M09** — chủ sở hữu
bảng `media` — và ghi thành con trỏ trong `backlog.md`, không giả vờ M16 làm được.

**b · `AC-2.2` — *"không xoá byte"* thiếu vế GHI ĐÈ.**
Bản đầu chỉ cấm *xoá*. Nhưng sinh lại cùng loại artifact cho cùng bài **ghi đè** bản
cũ cũng phá byte y hệt, mà không có `unlink` nào để grep. Testcase *edge 2* của tôi
(sinh hai lần) lộ ra chỗ này.
⇒ **Đã sửa `AC-2.2`**: cấm **cả xoá lẫn ghi đè**, và phép đo là *mọi `sha256` cũ
giữ nguyên, số file chỉ TĂNG* — đo **trạng thái**, không đo lời gọi hàm.

**Bài học chung**: cả hai ca đều là AC đúng về ý nhưng **thiếu một nửa của phép đo**
— một cái thiếu tầng, một cái thiếu đường phá thứ hai.
