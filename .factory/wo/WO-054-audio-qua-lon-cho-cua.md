# WO-054 — audio 19 phút vỡ trần thân request, đường ASR chưa từng chạy

loại: bug (đường chạy chưa bao giờ xanh, không phải hồi quy)
module: M12_chungcat
mức: hard

## Hiện tượng

`T03-108` (nút *Sinh transcript*) xanh ở mức nguồn + cổng, nhưng đường ASR
**chưa từng chạy đầu-cuối một lần nào**. Lối `cua-asr` (`ưu_tiên: 1`, lối chủ
dự án chọn) chặn ngay ở `asr_cua.phien_am`.

## Repro

```
$ ffprobe chungcat/hang-doi/cur/4fa1b5a6e43f462794c6944d4c972e06.audio.mp3
1133 giây (18′53″), 12 MB
```

⇒ `QuaLonChoCua`: base64 ~16 MB > `tran_than_cua_byte` 8 MiB.

Ba file audio đã tải trong `hang-doi/cur/` đều 1133 giây — **không phải một ca
biên**, đây là độ dài video thường.

## Vì sao chưa sửa được bằng cách hiển nhiên

Thông báo lỗi hiện tự chỉ hai lối, và **cả hai đều tắc**:

| lối | tắc ở đâu |
|---|---|
| `pip install "./chungcat[asr]"` | ~500 MB tải về, **cần chủ dự án quyết** — chưa hỏi |
| *"cắt nguồn thành đoạn ngắn"* | N đoạn = **N lần gửi cho cùng một job** ⇒ đụng `M12-R6` (*"gửi lần thứ 3 cho cùng một job"*, trần 2, không reset). `rules.md` FROZEN ⇒ cần FR |

## Kỳ vọng

Audio 19 phút đi qua cửa được, **một lần gửi**, không nới trần nào và không
chạm luật frozen nào.

## Đo được (2026-09-05, trên chính file trên)

`ffmpeg 8.1.1` đã có sẵn trên máy — 0 gói mới.

| xử lý | byte | base64 | trần 8 MiB |
|---|---|---|---|
| gốc (mp3 stereo) | 12.0 MB | ~16.0 MB | **vỡ** |
| mono 16 kHz mp3 32k | 4.53 MB | ~6.04 MB | **lọt** |
| mono 16 kHz opus 24k | 3.46 MB | ~4.61 MB | lọt |

Chọn **mp3**, không opus: `beeknoee-api-guide.md` §4.3 chỉ khai `format: "mp3"`.
Opus nhỏ hơn nhưng không có tài liệu — đổi một trần đo được lấy một giả định.

## Phạm vi WO này

CHỈ nén. Cắt đoạn (nguồn > ~26 phút) **không** thuộc WO này — nó cần FR cho
`M12-R6` và đó là một quyết định riêng, để chủ dự án cân.
