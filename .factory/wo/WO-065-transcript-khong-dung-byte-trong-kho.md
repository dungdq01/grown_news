# WO-065 — `sinh-transcript` không dùng byte ĐÃ CÓ trong kho, đi tải rồi chết ở host

loại: bug (kéo theo của `FR-075`)
module: M12_chungcat
mức: hard
người báo: chủ dự án, 2026-09-09 — *"tôi đang transcript file test đó nhưng hình như có vấn đề"*

## Hiện tượng — đo trên hàng đợi thật

```
chungcat/hang-doi/cur/e0c9562a….json   giai_doan: "cho"   lan_gui: 0
  payload: {loai: sinh-transcript, slug: video/on-thi-chi-yen,
            model_nguoi_chon: bee-tok/gemini-3.5-flash-lite}
  nhan_pid: 30568 (w2, CÒN SỐNG)   ·   bị giữ 206 giây mà không nhích
log/worker-w2.out:
  [worker] e0c9562a… · HỎNG (không phân loại) · HostKhongKhai:
  host `video` không có trong `host_cho_phep` của bảng khai.
```

## Nguyên nhân

`worker.py:610` — `_chon_loi()`:

```py
hop = [n for n in bang_nguon["nguon"] if n["loai"] != "file"]
return sorted(hop, key=lambda n: n["uu_tien"])[0]
```

Nó **loại lối `file` VÔ ĐIỀU KIỆN** rồi chọn theo `uu_tien`, nên luôn ra
`cua-asr` (cần khoá) hoặc `ytdlp-asr-local`. Cả hai là đường **tải về**, nên
`_tai_audio` gọi `_url_nguon(slug)` → `kho://video/on-thi-chi-yen` →
`kiem_host` bóc `video` ra làm hostname → `HostKhongKhai`.

Phép chọn lối **không bao giờ hỏi** *"bản ghi này đã có byte trong kho chưa?"*.

## Vì sao chú thích cũ ĐÚNG lúc viết

`_chon_loi` giải thích: *"Lối `file` KHÔNG phải việc của worker — người nạp
file, không có gì để chạy."* Đúng khi `file-nguoi-tai` nghĩa là *người nạp một
`.vtt` sẵn*. `FR-075` (2026-09-09, cùng ngày) biến *"người tải một `.mp4` lên"*
thành đường thật: byte **ở trong kho**, và worker **đọc được** nó.

⚠️ Và `spec §5.0b` tả `doc-byte` đúng là đường đó từ đầu:
> `doc-byte` — `GET /api/articles/media/<sha>` qua LÕI (quyết 1a) → audio vào
> Maildir của job, KHÔNG vào `kb/**`

Tức mã cài đường tải-về trước, còn đường spec tả TRƯỚC thì chưa ai cắm vào
phép chọn lối.

## Cơ chế đã có sẵn, không phải dựng mới

`worker.py:244` đã đọc byte hiện vật qua LÕI cho `.vtt`:
`urlopen(f"{_cua_loi()}/api/articles/media/{hv['sha256']}")`. Việc còn lại là
gọi nó cho hiện vật `video/*|audio/*` và ghi vào Maildir của job.

## Kỳ vọng

1. Bản ghi có hiện vật `video/*` hoặc `audio/*` trong kho ⇒ `doc-byte` **đọc
   byte đó qua LÕI**, **0 egress**, **0 phép kiểm host** (không có host nào).
2. Không có byte ⇒ giữ nguyên đường cũ (tải về, kiểm host, allowlist).
3. `egress.jsonl` phải phân biệt được hai lối — `tieu_egress: false` cho lối
   đọc-trong-kho, đúng thứ `M12-R8`/`AC-V3` đang canh.
4. Việc đang treo trong `cur/` phải chạy lại được sau khi vá, không phải tạo
   job mới (`AC-5.4` — chạy lại từ giai đoạn hỏng).

## Nợ kèm theo, KHÔNG thuộc WO này

Việc `e0c9562a…` **bị giữ lease 206 giây trong khi đã HỎNG** — worker báo hỏng
mà file việc vẫn nằm `cur/` với `giai_doan: cho`. Hoặc phép nhả lease sau khi
hỏng không chạy, hoặc `dat_giai_doan` không ghi trạng thái hỏng. Đó là một câu
hỏi riêng về vòng đời việc, và nó có thật dù WO này đóng.
