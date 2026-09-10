# T13-0 — Áp FR-072 + FR-073 vào spec/rules M13 (đơn vị GIẤY, chạy TRƯỚC mọi mã)

> Bối cảnh chung plan M13 (s7 2026-09-07, sửa 2026-09-09 sau duyệt): spec G6A
> xanh (20 AC hard, 5 rule CHỜ bề mặt) · service RIÊNG :8791 · ADR-08: THỢ gọi
> THỢ có bảng `goi_duoc`, web chỉ wrapper · chỉ mục = DẪN XUẤT, mất không mất gì.
> FR-072 (một hợp đồng API cho mọi client · `doc_id` · `nguon[]` · đọc hiện vật
> văn bản) và FR-073 (dạng `file-anchor`) ĐÃ DUYỆT MỞ 2026-09-07 nhưng spec chưa
> ăn — `check_frozen` pass nghĩa là spec vẫn khai "M14 khách duy nhất" và
> `{cau_hoi, pham_vi, k}`. Chia task code vào spec cũ là chia vào chỗ không
> verify được (bài học T12-0). spec.md + rules.md TRONG FROZEN.lock ⇒ NGƯỜI ký lại.
> Thay bản T13-0 cũ (bảng dải Hán · cửa kho-delta · shape tap_nguon): bảng dải
> Hán + dich-vu.json sang T01-51 (đất M01, boundary đúng chủ); cửa kho-delta là
> hợp đồng của T08-35; `tap_nguon` đổi tên `nguon` theo FR-072 §1.1.

## Việc

1. `spec.md`: §1 Ra → hình dạng FR-072 §1.1 (`POST /truy-hoi`, `ket_qua[]` mang
   `doc_id`=slug · `file` · `anchor` · `line_start/end` · `dia_chi` dạng
   `file:A-B` · `heading_path` · `body` đầy đủ · `nguon_van_ban` · `bm25`;
   `so_ban_ghi_trong_pham_vi` + `tong` cùng lời gọi). `pham_vi` dùng ĐÚNG khoá
   `TANG` của FE (`cat·loai·cpt·pl·nguon`) **và dành sẵn khoá `space`** (giá trị
   mặc định = space mặc định; chốt PM 2026-09-09 theo khảo Space §6 — `doc_id`
   giữ slug cho tới khi R1 Space trả lời, đổi thì qua MỘT FR).
   Thêm AC-1.6 (người gọi ngoài `goi_duoc` / `aud` sai / thiếu khoá ⇒ 403,
   `cmd: python truyhoi/tests/check_ai_goi_vao.py`) · AC-2.5 (chunk theo cue cho
   `text/vtt`/`.srt`, neo `slug:t=`) · AC-2.6 (`nguon_van_ban` đúng từng chunk;
   cả hai `cmd: python truyhoi/tests/check_chunk_hien_vat.py`) · AC-5.3 thêm vế
   "`nguon: null` là giá trị KHAI trong payload, thiếu khoá ⇒ 400".
   §3: hàm chuẩn hoá của M13 tên `chuan_hoa_tim` — `chungcat.verify.chuan_hoa`
   đã tồn tại cùng tên khác nghĩa (research §5.2); một tên hai nghĩa là lỗi
   M13-R1 mô tả. Dải Hán đọc từ `core/assets/dai-han.json` (T01-51).
   §6: vế zh của AC-6.1 khai `soft` KÈM LÝ DO (kho 0 bài Hán) cho tới khi có ≥2
   bài tiếng Trung — phồn thể hoặc giản thể đều được (chủ dự án 2026-09-09).
2. `rules.md`: thêm M13-R6 (nhận lời gọi ngoài `goi_duoc` hoặc không kiểm `aud`;
   S3; cùng lệnh AC-1.6), ba vế đủ.
3. `model_flow.md` §2: bảng contract theo §1.1; M03 gọi cho TÌM (trả đoạn +
   `dia_chi`, không ghép câu trả lời), hỏi qua M14. §3: mũi tên ❌ `web → M13`
   thành ❌ "web ghép đoạn thành câu trả lời". `data_flow.md` §3: bảng `media`
   "KHÔNG ghi; ĐỌC qua API của LÕI (`GET /api/xuat/<slug>/txt|srt` ·
   `GET /api/articles/media/<sha>`)". `testcases.md`: happy + edge cho AC-1.6 ·
   AC-2.5 · AC-2.6.
4. `05_uiux/contracts/truyhoi.sample.v3.json` theo §1.1 (v2 giữ, FROZEN; v3 là
   fixture của cổng T1 FR-072). `truyhoi/README.md`: lệnh chạy + tham chiếu FR.
5. Kéo theo — mở **6 ô** `backlog.md` M13 NGAY khi áp, mỗi ô trỏ chủ thật:
   `chungcat/src/dinh_tuyen.py:25` dải Hán gõ cứng (đóng bằng `T01-51`+`FR-078`) ·
   `web/render/trang.mjs:1707,1722` hard-code `sample.v1` + khoá `chunks` +
   `trang_thai: "chưa dựng"` (PM M03) · `05_uiux/prototype/sinh_v21.py:216` ghi 8791
   là chatbot (M03) · `03_docs/spec_overview.md:503` còn *"khách hàng duy nhất"*
   (`03_docs/**` chưa có chủ ⇒ cần một dòng của chủ dự án) · `ui_flow.md §1` địa chỉ
   `file#anchor` (chính M13 nhưng ngoài `phạm_vi_ghi` lượt này ⇒ `T13-4`) · hai
   nghĩa của chữ `nguon` (theo dõi; chỉ đổi tên nếu **đo được** ai đọc lẫn).
   **KHÔNG mở ô cho M14** — đo 2026-09-09: `M14/model_flow.md:41` **đã** khớp
   `FR-072 §1.1` (đủ 10 trường `ket_qua[]` · `nguon` bắt buộc · khoá chiều + `aud`),
   sửa cùng ngày ở `WL-01KB41KEOTHEO`. Một ô cho một nợ **đã trả** là một ô dạy
   người ta bỏ qua backlog.

phạm_vi_ghi:
  - 06_modules/M13_truyhoi/spec.md         # FROZEN — sửa theo FR-072/073, ký lại lock
  - 06_modules/M13_truyhoi/rules.md        # FROZEN — cùng đợt ký
  - 06_modules/M13_truyhoi/model_flow.md
  - 06_modules/M13_truyhoi/data_flow.md
  - 06_modules/M13_truyhoi/testcases.md
  - 06_modules/M13_truyhoi/backlog.md
  - 05_uiux/contracts/truyhoi.sample.v3.json
  - truyhoi/README.md
# `FROZEN.lock` KHÔNG nằm ở đây: khai nó là khai một quyền mình không có, và
# check_g6b bắt đúng — nó ngoài boundary của M13 (khuôn comment T12-14:33-36).
# Lượt này chủ dự án UỶ QUYỀN ký tường minh (2026-09-09), và uỷ quyền ghi ở
# block `uy_quyen` của worklog, không ghi thành một dòng phạm vi.

phụ_thuộc: —
# chạy SONG SONG đơn vị bảng khai của M01 (dai-han · dia-chi · dich-vu) — không chờ nhau

verifiability: hard
tiêu_chí:
  - AC1: check_g6a xanh trên spec/rules MỚI — M13 in "6 rule · AC 23 hard/1 soft"
      (baseline: 5 rule · 20 hard/0 soft). Tức AC-1.6/2.5/2.6 có nhãn `hard` là
      token đầu dòng blockquote + literal `cmd:`; AC-6.3 có nhãn `soft`; M13-R6 đủ
      ba field `vi_phạm`·`bề_mặt: S3`·`why`
    cmd: python core/tests/check_g6a.py
  - AC2: check_rule_surfaces — DO vẫn 0, CHO 52 -> 53 (thêm M13-R6 "chờ s8"). Bỏ
      dòng `lệnh:` của M13-R6 ⇒ ĐỎ NGAY (nó không có trong GRANDFATHER)
    cmd: python core/tests/check_rule_surfaces.py
  - AC3: check_ba — M13 vẫn in "đọc 0 trường" sau khi data_flow §2 thêm cột
      `nguon_van_ban`/`dia_chi`/`doc_id` (mọi dòng bảng giữ TỪ CHỈ LOẠI đứng trước
      tên trong backtick — nếu quên, check_ba đọc nó như một trường frontmatter và
      TREO; M12 đã vấp đúng đây ở WL-01K9W3S6M12)
    cmd: python core/tests/check_ba.py
  - AC4: check_mermaid xanh trên hai diagram vừa viết lại (model_flow §1 thêm
      subgraph KHACH + nút hiện vật; §3 hai đường TÌM/HỎI + nút ❌)
    cmd: python core/tests/check_mermaid.py
  - AC5: truyhoi.sample.v3.json parse được, `version` = 3, GIỮ khoá `chunks`
      (trang.mjs soDotHai đếm khoá đó), và MỌI trường `ket_qua[]` của model_flow §2
      có trong sample và ngược lại — đối chiếu HAI CHIỀU, ghi kết quả vào worklog.
      Cổng máy hoá của phép đối chiếu này là T1 của FR-072, sống ở
      truyhoi/tests/check_hop_dong_v3.py và thuộc T13-1 (xem ghi chú dưới)
    cmd: python -c "import json;d=json.load(open('05_uiux/contracts/truyhoi.sample.v3.json',encoding='utf-8'));assert d['version']==3 and 'chunks' in d"
  - AC6: check_frozen ĐỎ ĐÚNG BA DÒNG trước khi ký (ĐỔI rules.md · ĐỔI spec.md ·
      MỚI truyhoi.sample.v3.json), MẤT rỗng; pass sau khi ký; lock đi 56 -> 57 file.
      Dòng lệch thứ TƯ là DỪNG — `--ky` ghi đè toàn bộ lock và không kiểm gì
    cmd: python core/tests/check_frozen.py
  - AC7: check_g6b — 0 dòng lỗi nào mang mã M13/T13; 13 lỗi có sẵn của T01-50 ·
      T03-129/130/131 · T08-36 · T08-38 · T12-31 · T12-33 · T12-34 KHÔNG đổi số;
      W5 in "ok M13_truyhoi spec 17 cmd" (baseline 15) vì T13-4 AC6 và T13-7 AC1
      đã khai check_ai_goi_vao.py + check_chunk_hien_vat.py
    cmd: python core/tests/check_g6b.py

# VÌ SAO AC2 CŨ BỊ THAY (đo 2026-09-09, trước khi sửa một dòng nào):
#   bản trước khai `cmd: python core/tests/check_nguon_hop_dong.py` cho vế "sample v3
#   khớp model_flow". Cổng đó đo trường `nguon` trong core/assets/frontmatter.schema.json
#   bằng jsonschema; nó KHÔNG đọc 05_uiux/contracts/ một byte nào, và chưa cổng nào
#   trong repo đọc truyhoi.sample.* (grep ⇒ chỉ check_frozen băm nó qua glob).
#   Tức AC đó xanh oan có bảo đảm — đúng lớp lỗi `#cổng-xanh-vì-neo-sai`.
#   AC1 cũ cũng khai bốn mệnh đề (`hết "khách hàng duy nhất"` · grep doc_id · khoá
#   nguon/space · ba vế rule) mà check_g6a KHÔNG grep một chữ nào trong đó — và chữ
#   "khách hàng duy nhất" còn không nằm trong spec.md, nó ở model_flow.md.
#   `check_ky_tu_vo_hinh.py` KHÔNG dùng được làm cmd trên máy này: nó chết ở rglob vì
#   web/_quartz (thượng nguồn ngoài git) — vỡ độc lập với lượt này, đã quy chủ ở worklog.
