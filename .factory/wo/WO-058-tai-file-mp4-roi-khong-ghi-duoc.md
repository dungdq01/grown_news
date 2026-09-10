# WO-058 — tải file .mp4 lên rồi KHÔNG ghi được: cửa vẫn đòi URL

loại: bug
module: M03_web (FE) · M08_api (cổng module)
mức: hard
người báo: chủ dự án, 2026-09-09 — *"dù tôi tải file .mp4"*

## Hiện tượng — tái hiện được, đo trên `:8787` thật

Màn *Đăng ký video* → chọn file `.mp4` → điền tiêu đề/mô tả → **Ghi vào kho**:

```
Nơi phát này không nằm trong danh sách nhận:
youtube.com · tiktok.com · facebook.com · douyin.com
```

Người dùng **không dán URL nào** — họ tải file, đúng thứ màn mời làm.

## Nguyên nhân — HAI tầng, cả hai đòi `url` vô điều kiện

**FE** `napvideo.inline.ts:122`:
```js
if (!hostVideoHopLe(tho)) { kqTV(loiHost(), …); return }   // dòng ĐẦU của ghiVideo()
```
Và `hienVatVideo` — biến giữ hiện vật vừa nạp — **không ai ĐỌC**: khai ở
dòng 331, gán ở 392, nhắc trong câu thông báo ở 396, **hết**. Payload luôn gửi
`url: tho`, chưa bao giờ gửi `media`.
⇒ Cả nhánh tải file là **đường chết**: nó nạp byte vào kho thành công rồi
không dẫn tới đâu.

**Server** `web/api/cong-module.mjs` (`CONG.video`):
```js
const u = String(fm?.url ?? "").trim()
if (!u) return { ma: 422, loi: "Bản video phải có `url`." }
```

## HAI HỢP ĐỒNG NÓI NGƯỢC NHAU — đây là chỗ phải NGƯỜI quyết

| nguồn | nói gì |
|---|---|
| `frontmatter.schema.json` `allOf[6]` | `ho_so: thu-vien` ⇒ **`anyOf [media, url]`** — byte HOẶC url |
| `cong-module.mjs` `CONG.video` | video ⇒ **`url` BẮT BUỘC** |
| `M11_video/spec` | video = *"đăng ký URL, **không byte, không dòng media**"* |
| `FR-054 §8.1` + quyết 2 (09-04) | *"giữ lại ở kho: video/audio/transcript — file gốc"*; bản ghi `video` **ĐƯỢC** media `video/*` |
| nhãn trên chính màn đó | *"…hoặc tải lên file — để sinh transcript"* |
| `chungcat/assets/nguon-transcript.json` | có lối **`file-nguoi-tai`** (`uu_tien: 2`) — nghĩa là M12 đã tính tới ca không có URL |

Schema và hai quyết định mới cho phép; `CONG.video` và `M11 spec` là bản
TRƯỚC hai quyết định đó và chưa ai sửa. Đoán một bên là để mọi phép kiểm sau
chạy trên nền sai (`CLAUDE.md` §DỪNG).

## Hai lối

**(A) Video CÓ THỂ chỉ có byte** — nới `CONG.video` thành `anyOf [media, url]`
(khớp schema). `url` có thì vẫn kiểm host như cũ. FE gửi `media: [hienVatVideo]`
khi không có URL.
· được: đúng thứ người dùng vừa làm · khớp schema + `FR-054 §8.1` + lối
  `file-nguoi-tai` của M12
· phải trả: `M11_video/spec` sai một câu ⇒ cần **FR** (spec M11 có FROZEN?)

**(B) Video LUÔN cần URL**, ô file chỉ để GẮN byte vào bản ghi có URL
· được: `M11 spec` nguyên vẹn, 0 FR
· phải trả: nhãn *"hoặc tải lên file"* phải sửa thành *"và"*, và người tải một
  mp4 rời (không có link) **không đăng ký được** — tức bỏ một ca dùng thật

## Kỳ vọng chung cho CẢ HAI lối

1. `hienVatVideo` phải được ĐỌC lúc nộp — không thì ô file là trang trí.
2. Câu lỗi phải nói đúng thứ thiếu. Câu hiện tại nói *"nơi phát không trong
   danh sách"* cho một người **không dán nơi phát nào** — nó tả sai trạng thái.
3. Cổng phải đỏ được trên hành vi hôm nay (nạp file → nộp → 422).
