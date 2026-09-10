# T13-7 — CHUNK HIỆN VẬT VĂN BẢN qua cửa xuất: .vtt cue → slug:t= · .srt · .md/.txt

> Bối cảnh chung plan M13 (s7 2026-09-07, thêm 2026-09-09): FR-072 §1.3 — M13
> ĐỌC hiện vật văn bản qua API của LÕI, KHÔNG mở kb/_media/**, 0 dep mới, 0
> egress. Với kho hôm nay (2 bài · 2 tài liệu · 9 video) chỉ index `than` là RAG
> mù 11/13 bản ghi.
> Nguồn: transcript `text/vtt` qua `GET /api/xuat/<slug>/txt|srt` (cửa xuất
> T08-33 — CÙNG chữ người tải xuống, không có bản chuyển đổi thứ hai) hoặc
> `GET /api/articles/media/<sha>`; `.srt` người tải (srt→cue là đảo của
> vttSangSrt); `.md/.txt` người tải (T03-111) chunk theo ##/### như `than`.
> PDF: KHÔNG — text PDF là nợ M12 (FR-072 §5 → **FR-079**, đã duyệt mở 2026-09-09,
> thi công sau M13); khi M12 sinh hiện vật `text/plain` la_dan_xuat với dấu trang
> thì đơn vị này thấy qua cùng cửa, 0 dòng mã mới. Dấu trang đọc từ bảng khai
> chung (FR-079 §1.1), không gõ ở đây.

phạm_vi_ghi:
  - truyhoi/src/hien_vat.py
  - truyhoi/src/indexer.py

phụ_thuộc: T13-2

verifiability: hard
tiêu_chí:
  - AC1: chunk từ .vtt có neo slug:t=mm:ss khớp cue thật (neo trong thời lượng);
      nguon_van_ban = hien-vat:text/vtt; từ .md/.txt = hien-vat:text/plain;
      từ than = than (AC-2.5, AC-2.6 — cổng T4 FR-072)
    cmd: python truyhoi/tests/check_chunk_hien_vat.py
  - AC2: mọi lần đọc hiện vật là HTTP tới 127.0.0.1:8787; 0 open() trỏ kb/_media
      (cổng T5 FR-072)
    cmd: python truyhoi/tests/check_khong_cham_kho.py
  - AC3: dựng lại chỉ mục có hiện vật vẫn là điểm bất động (AC-1.1 giữ)
    cmd: python truyhoi/tests/check_dung_lai_duoc.py
