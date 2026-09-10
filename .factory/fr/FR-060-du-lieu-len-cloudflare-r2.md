# FR-060 — Dữ liệu lên Cloudflare R2; git KHÔNG chứa video/ảnh

- **mở**: 2026-09-04 · **người quyết**: chủ dự án ·
  **trạng thái**: **ĐÃ QUYẾT ĐỦ** 2026-09-04 — bốn nhóm ảnh đã chọn (§4), đã áp
- **nguyên văn**: *"Sau này DB chúng ta lưu cloudflared R2, còn hiện tại ko
  commit video và ảnh lên git (lưu ở local) → note thêm lưu Video mp4 ở
  cloudflared. Và sau này tất cả dữ liệu đẩy lên Cloudflare hết."*
- **artifact chạm**: `04_system/adr.md` (`ADR-06` — chỗ ở của dữ liệu) ·
  `.gitignore` · `07_plan/M04_ci/tasks/T04-8-git-lfs-media-ci.md` (**thành lỗi
  thời**) · `.factory/fr/FR-054-va-tran-1gb.md` (ba dòng giá hết đúng)

## 1 · Chốt — ba mốc thời gian, đừng trộn

| khi | dữ liệu ở đâu |
|---|---|
| **hôm nay** | video + ảnh **KHÔNG commit** — sống ở **local**. DB vẫn local (`kb/_kho.sqlite`), bản lùi vẫn `_backup/` (`ADR-06 (c)` + `FR-050`) |
| **mốc kế** | **video mp4 lên Cloudflare R2** |
| **sau nữa** | **toàn bộ dữ liệu** lên Cloudflare — gồm DB |

Ba mốc là ba việc khác nhau. Gộp chúng thành *"chuyển hết lên R2"* là cách mốc
đầu (rẻ, làm ngay) bị hoãn theo mốc cuối (đắt, cần đo).

## 2 · Hệ quả ĐO ĐƯỢC — nói trước khi làm

### 2.1 · `T04-8` (git-lfs cho media) thành LỖI THỜI

`T04-8` dựng git-lfs để media vào git mà không phình repo. Nếu media **không
vào git**, git-lfs không giải bài nào. ⇒ Đóng `T04-8`, mở lại chỉ khi mốc R2 bị
bỏ.

### 2.2 · Ba dòng giá của `FR-054-va-tran-1gb.md` HẾT ĐÚNG

Lời mời ký trần 1GB nêu *"git-lfs 1GB free ≈ đúng một video · $5/50GB · CI
skip-smudge"*. Cả ba nói về **git-lfs**. Media không vào git thì giá phải nói về
**R2**: R2 free 10 GB/tháng lưu trữ, **egress $0** (đó là điểm bán của R2), và
Class A/B operations có hạn mức riêng. ⇒ Sửa mục §3 của lời mời **trước khi ký**.
Trần 1GB **vẫn cần** — nó là trần của cửa nhận media, không phải của git.

### 2.3 · Ảnh ĐANG TRONG GIT — 25 MB, và bỏ tracking là đổi thứ một clone nhận

Đo 2026-09-04: **33 file ảnh, ~25 MB** đã commit. Xoá khỏi tracking **không**
làm nhỏ lịch sử (byte đã ở đó), và nó đổi thứ một clone mới nhận được. Bốn nhóm,
ba số phận khác nhau:

| nhóm | n | ai đọc | số phận |
|---|---|---|---|
| `public/` + `public/light/` | 16 | **`web/render/assets.mjs#anhNen()`** — app SERVE chúng | ⚠️ bỏ tracking ⇒ **clone mới không có ảnh nền** |
| `web/test/_probe/static/**` | 12 | **KHÔNG AI** — xem ⚠️ dưới | bỏ tracking, 0 cổng đỏ |
| `image/upgrade/` + `nap-tai-lieu.png` | 4 | tài liệu | bỏ được, chỉ mất ảnh trong doc |
| `.playwright-mcp/` | 6 | **không ai** — ảnh chụp rác của agent | **bỏ ngay**, và gitignore |

⚠️ **SỬA MỘT CÂU TÔI VIẾT SAI.** Bản đầu của bảng này ghi
`web/test/_probe/static/**` là *"fixture của cổng, bỏ tracking ⇒ CI đỏ trên máy
sạch"*. **Sai.** Tôi grep `_probe/static|public/light|anhNen` và đọc kết quả
khớp `anhNen` thành kết quả khớp `_probe` — một phép đo ba mẫu rồi quy kết luận
cho mẫu không khớp.

Đo lại đúng: `grep -rln "_probe" web/` chỉ ra **một** file, và chỗ đó là một
**dòng chú thích** (`nap-ba-khung.test.js:11` nhắc `test/_probe/` khi giải thích
lịch sử). **Không cổng nào đọc thư mục đó** — nó là rác từ thời trước `FR-034`,
khi test còn đọc `web/site`/`_site` của bản build. Bỏ tracking: **suite vẫn
exit 0**, đã chạy để chứng minh.

Bài học đáng ghi: câu *"bỏ tracking ⇒ CI đỏ"* là câu duy nhất khiến nhóm này
được đề xuất GIỮ. Một phép đo sai ở đó đã sắp mua một quyết định sai.

## 3 · Làm ngay (không cần chờ gì)

1. `.gitignore` chặn **video/audio tuyệt đối** (`*.mp4` `*.mov` `*.webm` `*.mkv`
   `*.mp3` `*.wav` `*.m4a`) — hôm nay **0 file** loại này trong git, nên đây là
   phép chặn *trước khi* có cái đầu tiên, đúng lúc rẻ nhất.
2. `.gitignore` chặn `.playwright-mcp/` — 6 ảnh rác, không ai đọc.
3. `kb/_media/**` chặn tuyệt đối: đó là byte hiện vật, và `ADR-06` đã nói kho
   dựng lại được từ file.
4. Ghi ba mốc vào `04_system/adr.md` cạnh `ADR-06` — **không** đổi quyết định
   nào đang có hiệu lực, chỉ ghi hướng.

## 4 · Luật cuối — CHỈ `public/**` lên GitHub

Chủ dự án 2026-09-04: *"Chỉ ảnh trong `public/**` được push lên github, còn lại
ảnh và video, mp4 khác lưu local — DB local."*

| nhóm | n | quyết | đã làm |
|---|---|---|---|
| `public/**` | 11 | **PUSH** | không đụng — `anhNen()` serve chúng |
| `web/test/_probe/**` | 12 | **local** | `git rm --cached` ✅ · suite vẫn exit 0 |
| `image/upgrade/` + `nap-tai-lieu.png` | 4 | **XOÁ** | `git rm` (git + đĩa) ✅ |
| `.playwright-mcp/` | 6 | **local** | `git rm --cached` ✅ |

Sau khi áp: **11 ảnh** còn track, tất cả trong `public/**`. Xuống từ 33.

`.gitignore` viết theo chiều **chặn-rồi-mở**: chặn mọi đuôi ảnh, rồi
`!public/**`. Không liệt kê từng thư mục cần chặn — thư mục mới sinh ra liên
tục, và một danh sách chặn gõ tay là chỗ ảnh mới lọt vào git im lặng.

⚠️ `!public/**` chỉ mở lại được vì **không** mẫu nào chặn chính thư mục
`public/`. Git không re-include một file nếu thư mục CHA đã bị loại — thêm một
dòng `public/` ở đâu đó là vô hiệu hoá cả hai dòng mở mà không báo gì.

⚠️ **Ba ảnh của `image/upgrade/` đang được `upgrade.md:67` NHÚNG.** Xoá thẳng để
lại ba link chết trong một tài liệu chỉ đạo, và không ai biết chúng từng chụp
gì. ⇒ Thay bằng một dòng nói **chúng chụp gì** và **bug đó đóng ở đâu**
(`WO-045` — nút "Sửa" mở form Nạp-mới rỗng).

⚠️ `git rm` **không** làm nhỏ lịch sử: 25 MB byte đã ở trong các commit trước.
Xoá là chặn *từ đây trở đi* + gỡ khỏi một clone mới, không phải một phép dọn quá
khứ. Dọn thật cần rewrite history — việc khác hẳn, và nó phá mọi clone đang có.

## 5 · KHÔNG làm trong FR này

- Không dựng client R2, không đặt bucket, không đổi `ADR-06 (c)` (`_backup/`
  vẫn là bản lùi hôm nay).
- Không rewrite history. `git rm` chỉ gỡ khỏi clone MỚI; 25 MB byte cũ vẫn ở
  trong các commit trước, và dọn chúng là một việc phá mọi bản clone đang có.
- Không nới trần nào. `M12-R9` (1GB/500MB/3600s) giữ nguyên.
