# SCR-11 · Artifact (M16) — mock đợt hai

> ⚠️ **SUPERSEDED BY prototype/dot-hai/ + ma-tran-module-man.md (2026-09-02).**
> Bản này vẽ "mỗi module một màn" — s6 (Z7) đã bác: dịch vụ không có màn riêng,
> UI ghép vào màn đã có. Giữ làm hồ sơ vì-sao-đổi. Bản thay: SCR-12..17.


> Contract: `contracts/artifact.sample.v1.json` · PRD U12 · vùng THỢ, job chạy
> PHÚT — màn phải sống được với việc chờ.

**Là gì**: bài `approved` → slide / giọng đọc / video. Nguyên lý phải nhìn thấy
được: **artifact quay ngược làm input** — mọi file sinh ra mang đường về nguồn
(metadata + sidecar), không phải "sinh file rồi hết".

## Bố cục

```
┌ Chọn bài approved ─ [Slide] [Audio] [Video] ────────┐
├─ Danh sách artifact (card) ─────────────────────────┤
│ af-01 slide · XONG · 41s                            │
│   files: .pdf (#page=N) · .pptx (hyperlink về bài)  │
│ af-02 audio · XONG · piper LOCAL — 0 byte rời máy   │
│   sidecar: 00:00→bài · 01:12→#vi-sao-bac-hai …      │
│ af-03 video · ĐANG SINH — ffmpeg ghép (2/3)         │
│   TTS azure → text RỜI MÁY: sha256 8c1d90…          │
│ af-04 slide · LỖI — marp exit 1, sửa outline        │
└──────────────────────────────────────────────────────┘
```

## Thành phần

- **Card artifact**: badge loại + trạng thái · thời gian sinh · danh sách file
  kèm CÁCH link về nguồn (PDF `#page=N` · PPTX hyperlink · MP3 ID3 CHAP).
- **Sidecar viewer**: bảng `t → url` bấm được — mở cửa sổ đọc đúng anchor. Đây
  là cái chatbot sẽ dùng để trả "địa chỉ bấm được" cho nội dung video.
- **Dòng egress**: TTS cloud hiện sha256 (bậc 4); TTS local hiện rõ "0 byte rời
  máy" — hai đường, hai nhãn, người duyệt chọn có ý thức.

## Ba state

| state | hiện |
|---|---|
| empty | kho chưa có bài approved — trỏ về màn duyệt |
| loading | card `dang-sinh` + bước hiện tại (job phút — hiện bước, không hiện %) |
| error | card `loi` — lỗi nguyên văn + hành động sửa cụ thể |
