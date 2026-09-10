# T12-16 — `sinh-transcript`: faster-whisper LOCAL + hiện vật .vtt

> FR-054 đã duyệt: transcript là hiện vật DẪN XUẤT (`la_dan_xuat=1`,
> `kieu_moc=la_asr`), người sửa được TRƯỚC khi chưng. ASR local 0-egress
> (nghiên cứu §17: faster-whisper MIT/CTranslate2, INT8 ~8x realtime —
> 60 phút ≈ 7-8 phút ⇒ checkpoint phải THẬT).
> CHẶN CỨNG: sau T12-13 (worker) + T12-14 (spec ký) + T12-15 (cổng đỏ trước).

## ⚑ QUYẾT ĐỊNH CHỦ DỰ ÁN 2026-09-04 — LÀM CẢ HAI LỐI, ƯU TIÊN GỌI DỊCH VỤ

Nguyên văn: *"qua cửa hay local gì cũng được, nên làm cả 2 và ưu tiên call dịch
vụ llm trước (tiện nhất thì làm, kết hợp được thì tốt)"*.

Điều này đổi `uu_tien` của `nguon_transcript` (`FR-054 §1.5`), **không** đổi hợp
đồng — bảng đó đã khai sẵn ba lối:

| # | ten | loai | tieu_egress | vì sao thứ tự này |
|---|---|---|---|---|
| 1 | `<cửa>-asr` | `dich_vu` | **true** | Đo 2026-09-04: cửa Beeknoee có **23 model nhận audio** + các model `*-stt`. 0 gói mới, 0 model tải về, nhanh nhất — *"tiện nhất thì làm"* |
| 2 | `file-nguoi-tai` | `file` | false | Người đã có bản chữ thì không tiêu gì cả. Rẻ nhất, nhưng cần người |
| 3 | `ytdlp-asr-local` | `tai_ve` | false | 0 egress, chạy offline. Đường dự phòng khi audio KHÔNG được rời máy |

**Hai lối là HAI `loai` NGUỒN, không phải hai nhánh trong `asr.py`.** Task này
khai *"`asr.py` KHÔNG import egress, cổng canh bằng AST"* — lối `dich_vu` gửi
audio RA NGOÀI, tức nó phải đi qua `egress.gui()`. Gộp vào một file là phá đúng
cái cổng đang canh, và mất luôn câu *"lối này có tiêu egress không"* mà
`FR-054 §1.5` viết ra để trả lời.

⇒ Chẻ đơn vị: `asr.py` giữ nguyên lối local (0 egress) · lối `dich_vu` là một
module riêng gọi qua adapter phương ngữ đã có (`FR-059`) · `dinh_tuyen` chọn lối
theo `uu_tien` + `tieu_egress` của bảng khai.

⚠️ **`tieu_egress: true` là một mệnh đề PHÁP LÝ, không phải một cột kỹ thuật.**
Audio của một cuộc họp nội bộ rời máy là một lần chuyển dữ liệu — cùng hạng với
`§4.0c` của chưng cất. Bộ chọn phải HIỆN điều đó trước khi người bấm, và
`egress.jsonl` phải ghi `tieu_egress` đúng cho từng lối (`FR-054 §1.5` cấm trộn
hai nghĩa của chữ *egress* vào một cột).

## Hình dạng

- `chungcat/src/asr.py`: byte → segments → .vtt (magic WEBVTT). Model
  `small` INT8, tải 1 lần vào `CHUNGCAT_MODEL_DIR` (ngoài repo). KHÔNG import
  egress — cổng check_asr_khong_egress canh bằng AST.
- `loai: sinh-transcript` trong worker dispatch. Giai đoạn: `doc-byte`
  (GET /api/articles/media/<sha> qua LÕI — lối (a), 0 mở _kho.sqlite) →
  `asr` (checkpoint theo segment-block, resume không chạy lại block xong) →
  `vtt` → `gan-hien-vat` (POST media .vtt + gắn frontmatter media[] bản ghi
  video — THAY nếu đã có, bump ban theo FR-054 §9.1).
- Trần hai nhịp: byte đo ở cửa nhận job; thời lượng đo SAU khi đọc metadata
  (ffprobe/av) — quá 3600s ⇒ job dừng có lý do phân loại, 0 giây ASR chạy.
- `giay_phep` khai: faster-whisper MIT · CTranslate2 (KIỂM trước khi chốt —
  ô backlog PyMuPDF là bài học; CTranslate2 là MIT, ghi nguồn vào bảng khai).

phạm_vi_ghi:
  - chungcat/src/asr.py                # MỚI
  - chungcat/src/worker.py             # +1 entry dispatch
  - chungcat/src/vong.py               # checkpoint block nếu thiếu hàm
  - chungcat/assets/nguong.json        # tran_video_byte · tran_audio_byte · tran_thoi_luong_giay
  - chungcat/pyproject.toml            # faster-whisper pin + extras [asr]

verifiability: hard
tiêu_chí:
  - AC1: audio fixture 10s (thư mục tạm) → .vtt hợp lệ, cue tăng dần
    cmd: python chungcat/tests/check_vtt_hop_le.py
  - AC2: đường asr 0 lời gọi egress (AST + runtime hook đếm 0)
    cmd: python chungcat/tests/check_asr_khong_egress.py
  - AC3: trần hai nhịp — byte quá ⇒ chặn ở cửa (0 log); thời lượng quá ⇒ dừng
      sau metadata, lý do nói rõ
    cmd: python chungcat/tests/check_tran_hai_nhip.py
  - AC4: .vtt vào kho đúng hình: la_dan_xuat=1 + kieu_moc=la_asr, bản ghi
      video giữ nguyên byte gốc, chạy lại lần 2 = THAY + bump ban
    cmd: python chungcat/tests/check_transcript_hien_vat.py
  - AC5: nền không vỡ
    cmd: python chungcat/tests/check_e2e_chung_cat.py --mock
