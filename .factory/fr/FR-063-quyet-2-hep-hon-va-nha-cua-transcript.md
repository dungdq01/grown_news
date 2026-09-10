# FR-063 — quyết 2 đọc HẸP hơn câu chữ · nhà của mã transcript

- **mở**: 2026-09-05 · **loại**: hai chỗ hợp đồng · **module**: M01_core + M03_web
- **trạng thái**: **DUYỆT 2026-09-05** — chủ dự án chỉ đạo *"Ký giúp tôi luôn"*.
  Agent ghi hộ dấu duyệt theo lời chủ dự án; agent KHÔNG tự duyệt (`R2`).

## §1 · `quyết 2` chỏi `FR-052`, và tôi đã chọn nghĩa hẹp

`T01-45 AC4` viết: *"bản ghi `tai-lieu` mang media mime `video/mp4` ⇒ validate
ĐỎ"*. Cài đúng câu chữ đó thì **ca mà `FR-052` nêu làm lý do tồn tại của mình**
đỏ ngay:

```
test_thu_vien_HAI_hien_vat_di_qua  — "M16 sinh slide + giọng đọc + video cho MỘT bài"
  media: [ {application/pdf, slide.pdf}, {audio/mpeg, doc.mp3} ]   ⇒ ĐỎ
```

Hai quyết định đã ký nói ngược nhau, nên tôi tìm nghĩa bao được cả hai thay vì
chọn một bên. Lỗ **thật** mà quyết 2 đóng là *"MP4 lạc bảng"*: một bản ghi mà
hiện vật CHÍNH là video, lọt vào bảng tài liệu qua ô file không lọc — và bản ghi
đó **không có hiện vật tài liệu nào**.

⇒ Đã cài: **đỏ khi media CHỈ có `video/*`|`audio/*`**. Giọng đọc kèm slide qua.

| ca | kết quả | ghi ở |
|---|---|---|
| `tai-lieu` + chỉ `video/mp4` | ĐỎ | `test_tai_lieu_mang_media_video_BI_CHAN` |
| `tai-lieu` + chỉ `audio/mpeg` | ĐỎ | `test_tai_lieu_mang_media_audio_BI_CHAN` |
| `tai-lieu` + `pdf` **+** `mp3` | XANH | `test_thu_vien_HAI_hien_vat_di_qua` (`FR-052`) |
| `video` + `mp4` | XANH | `test_ban_ghi_video_mang_media_video_DI_QUA` |
| `tai-lieu` + `pdf` | XANH | `test_tai_lieu_mang_pdf_VAN_DI_QUA` |

**Xin duyệt:** nghĩa hẹp này, hoặc nói rõ rằng `FR-052` bị quyết 2 thu lại (lúc
đó phải sửa `FR-052` và bỏ ca `HAI_hien_vat`).

## §2 · Ô file MP4 do CHUNK dựng, không phải `trang.mjs`

`T03-109` khai markup ở `web/render/trang.mjs`. Đo thật thì không được: shell là
MỘT bản dùng cho mọi màn, nên một ô file thêm vào đó tính vào HTML của **mọi**
trang — và trần HTML trang chủ lúc đó còn **7 byte** (61433/61440).

⇒ Ô file dựng từ `napvideo.inline.ts` (đã có trong `phạm_vi_ghi`). Nó tồn tại
đúng ở `/video/nap/`, 0 byte ở trang khác. **Hẹp hơn** phạm vi đã khai.

## §3 · Thân transcript + hộp thoại chưng cất ở chunk `cctab`

`T03-108` khai `chungcat.inline.ts` + `multiwindow.inline.ts`. Thân nằm ở
`web/plugins/cctab/` — **ngoài phạm vi**, cùng lý do `FR-062` đã duyệt.

Kèm đó là một phép **DỌN CHỖ** bắt buộc: năm dòng mime video của `T01-45` đẩy
`gn.js` lên **102460/102400**, và `FR-061` cấm nới bundle chung. Đo được:

| việc | `gn.js` |
|---|---|
| trước T01-45 | 102260 / 102400 |
| + 5 dòng mime video | **102460** ⇒ ĐỎ |
| dời hộp thoại chưng cất (2986B) sang chunk | **99175 / 102400** (dư 3225) |

Hộp thoại chỉ mở khi người bấm "Chưng cất". Trong bundle chung thì mọi người đọc
báo trả trước; ở chunk thì chỉ người bấm trả.

## §4 · Bảy cổng đo SAI CHỖ — sửa phép đo, không sửa mã

Phép dời làm bảy vế đỏ **trong khi hành vi không đổi**. Cả bảy là cổng đo tên
hàm / khoảng cách ký tự / một trong hai đường:

| cổng | đo sai gì | sửa thành |
|---|---|---|
| `page-weight` chunk sống | chỉ đếm thẻ `<script>` của màn | nhận cả nạp-theo-yêu-cầu |
| `bang-khai-khong-mo` | chỉ đọc `multiwindow` làm "ai đọc" | đọc MỌI plugin (chunk đọc `__GN_MEDIA__`) |
| `chung-cat-ui` (5 vế) | đọc một file nguồn | đọc cả `cctab` |
| `chung-cat-ui` nhánh mở | `[\s\S]{0,N}` — nới 3 lần rồi vẫn đỏ | cắt thân nhánh bằng ĐẾM NGOẶC |
| `tab-theo-doi` mở tab | đòi đúng chữ `moTabChungCat` | nhận `moTab(` qua cầu |
| `bon-chieu-facet` | chip `tai-lieu` lấy cả dòng video | lọc `nhom_thu_vien` |
| `dinh-dang-mo` trần | gõ `== 26214400`, lệch sau `FR-054 §9` | so HAI CHỖ phải khớp nhau |

Vế `dinh-dang-mo` là vế đáng ghi nhất: con số trong cổng không phải một mệnh đề
về hệ thống, nó là **bản sao thứ hai của một quyết định** — nên nó nói dối ngay
lần quyết định đổi. Bản mới so `media-mime.json.tran_byte` **với**
`frontmatter.schema.json so_byte.maximum`, tức bắt đúng ca *"hai chỗ nói hai
trần thì bên nghiêm hơn thắng vô hình"* (đo được hôm nay: bảng 1 GiB, schema 25
MiB — trần THẬT vẫn là 25 MiB dù FR đã ký).

## §5 · Một phép chiếu tôi đã HOÀN NGUYÊN, và vì sao

Để lấy 220 byte tôi từng chiếu `xem_truoc` ra khỏi bundle trừ dòng `iframe`. Nó
làm `media-cua-so` đỏ (*"bundle nhắc dạng `the`"*), và tôi **đã định sửa chính
cổng đó** để vừa phép chiếu. Đó là sửa thước cho khớp vật.

Sau khi dọn hộp thoại, `gn.js` dư 3225 byte ⇒ 220 byte kia không còn phải đổi
bằng một mệnh đề bị làm yếu. **Đã hoàn nguyên cả hai phép chiếu.**

## §6 · Nợ đã đo, chưa làm

- `check_frozen.py` **exit 1 oan** trên console mặc định của Windows: nó in
  tiếng Việt ra `cp1252` ⇒ `UnicodeEncodeError` **sau khi** đã kết luận "không
  file nào đổi". `PYTHONIOENCODING=utf-8` thì exit 0. Cổng nói ĐỎ trong khi vật
  XANH — `#cổng-đỏ-oan`, và nó chặn đúng cái gate người phải ký.
- Trần HTML trang chủ **61433/61440** (7 byte). Ô/chip mới nào cũng vỡ nó. Đây
  là ngưỡng thật đang chặn, không phải `gn.js`.
- `esc2` (multiwindow:2366) trông như bản trùng của `esc` nhưng **không phải**:
  `esc` ném trên non-string, `esc2` ép `String(s ?? "")`. Ghi ra để lần sau
  không ai "dọn trùng" rồi vỡ.

· object: `core/assets/media-mime.json` · `core/src/source_distiller/validate.py`
  · `core/tests/test_gates.py` · `core/tests/check_dinh_dang_mo.py`
  · `core/assets/frontmatter.schema.json` · `web/api/dungchung.mjs`
  · `web/plugins/cctab/src/cctab.inline.ts` · `web/plugins/napvideo/src/napvideo.inline.ts`
  · `web/render/trang.mjs` · `web/build-fe.mjs` · `web/test/sinh-transcript-ui.test.js`
