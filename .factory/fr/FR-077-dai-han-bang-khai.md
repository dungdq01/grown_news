# FR-077 — Dải ký tự Hán thành bảng khai `core/assets/dai-han.json` (chủ: M01)

- **mở**: 2026-09-09 · **người mở**: claude (PM M13)
- **trạng thái**: **ĐÃ DUYỆT** 2026-09-09 · **người quyết**: chủ dự án, nguyên văn: *"1. Duyệt giúp tôi"* · **thi công**: dev M13, đơn vị `T01-51` (áp), `T01-52` (cổng đi trước)
- **artifact chạm**: `core/assets/dai-han.json` (**MỚI**) · `core/tests/check_khai_mot_noi.py` (thêm §4) — **không** file nào trong `FROZEN.lock`
- **artifact khác chạm**: `chungcat/src/dinh_tuyen.py` (`_DAI_HAN`, qua `FR-078`) · `06_modules/M12_chungcat/model_flow.md §5` · `06_modules/M12_chungcat/backlog.md:631`
- **nguồn**: `M13 spec AC-3.4` (**đã ký** 2026-09-09) · `M12 spec §4.2` mục 2 · `01_research/m13-truy-hoi-dich-vu-nen.md §5.3` · `§8 G6`
- **thi công**: `T01-51` (M01) — bảng khai + `T01-52` (cổng). M12 chuyển sang đọc bảng ở `FR-078`
- **vì sao FR chứ không sửa tay**: `dai-han.json` **không** frozen, nhưng nó là **bảng khai `B-A5`** mà **hai module ở hai vùng** cùng đọc (M13 chèn dấu cách khi index · M12 đếm tỉ lệ để định tuyến model). Cùng lý lẽ đã áp cho `dia-chi.json` ở `FR-073`.

## 0 · Vì sao phải FR — bốn số đo, và một nợ đang bị mười chỗ trỏ

```
chungcat/src/dinh_tuyen.py:27-33   _DAI_HAN = 4 dải CJK gõ cứng TRONG MÃ M12,
                                    kèm ghi chú của chính tác giả: "M13 định nghĩa;
                                    M12 đọc. M13 chưa tồn tại, nên dải nằm TẠM ở đây
                                    và phải chuyển sang bảng khai chung khi M13 dựng"
M13 spec AC-3.4 (đã ký 09-09)      "Dải ký tự Hán đọc từ core/assets/dai-han.json
                                    (M01, T01-51 + FR-077)"        ⇒ FILE CHƯA TỒN TẠI
M12 spec §4.2 mục 2                "Dùng đúng dải Hán của chuan_hoa() (M13)"
                                    ⇒ SAI VỀ CƠ CHẾ: thứ dùng chung là BẢNG KHAI,
                                      không phải hàm (FR-078 §1.1 sửa câu này)
grep FR-077 toàn repo              10 file trỏ tới, 0 file tồn tại
ls core/assets/dai-han.json        không có
```

Nợ này **đã được chính M12 khai** trong mã, và **M13 vừa ký một AC trỏ vào nó**. Một
FR bị mười chỗ dẫn mà không có file là đúng thứ `#cổng-xanh-vì-neo-sai` mô tả ở dạng
giấy: mọi bên đều "chạy đúng" theo một tài liệu không tồn tại.

## 1 · Hình dạng chốt

### 1.1 · Một file, khuôn của `core/assets/**`

```json
{
  "$comment": "NGUỒN KHAI DUY NHẤT của 'chữ Hán là gì'. Hai bên đọc, ở HAI VÙNG khác nhau: M13_truyhoi (THỢ) chèn dấu cách quanh mỗi chữ Hán trước khi đưa vào FTS5 — không chèn thì unicode61 cắt câu 15 chữ thành ĐÚNG MỘT token và mọi truy vấn tiếng Trung trả 0; M12_chungcat (THỢ) đếm tỉ lệ ký tự Hán để định tuyến model theo ngôn ngữ. Trước file này, bốn dải gõ cứng trong chungcat/src/dinh_tuyen.py:27-33 với ghi chú 'tạm, chuyển sang bảng khai chung khi M13 dựng'.",
  "phien_ban": 1,
  "$comment_dai": "Mỗi dải là [đầu, cuối] INCLUSIVE, số nguyên codepoint. Giữ dạng SỐ chứ không phải chuỗi regex: hai bên đọc là Python và (sau này) JS, và một regex `[\\u4E00-\\u9FFF]` viết cho engine này không chắc đúng ở engine kia — nhất là với dải ngoài BMP cần surrogate pair. Bên đọc tự dựng phép kiểm từ số.",
  "dai": [
    {"tu": 13312,  "den": 19903,  "ten": "CJK Ext A",                 "$vi_sao": "chữ hiếm, có thật trong văn bản phồn thể cổ"},
    {"tu": 19968,  "den": 40959,  "ten": "CJK Unified Ideographs",    "$vi_sao": "dải CHÍNH — gần như mọi chữ Hán hiện đại, cả phồn lẫn giản"},
    {"tu": 63744,  "den": 64255,  "ten": "CJK Compatibility Ideographs", "$vi_sao": "biến thể tương thích; bỏ dải này thì cùng một chữ có hai kết quả tuỳ nguồn gõ"},
    {"tu": 131072, "den": 173791, "ten": "CJK Ext B",                 "$vi_sao": "ngoài BMP — chính chỗ một regex viết tay dễ trượt vì surrogate pair"}
  ],
  "$comment_khong_gom": "KHÔNG gồm Hiragana/Katakana (3040–30FF) và Hangul (AC00–D7AF). Chúng KHÔNG phải chữ Hán, và gộp vào đây làm `ti_le_han` của M12 định tuyến một bài tiếng Nhật sang model tiếng Trung. Cần tiếng Nhật/Hàn thì mở một FR khác với một bảng khác — không nới bảng này.",
  "$comment_nguong": "Bảng này KHÔNG chứa ngưỡng tỉ lệ. `nguong_han` của M12 sống ở chungcat/assets/ vì nó là tham số ĐO ĐƯỢC của một module; dải ký tự là ĐỊNH NGHĨA dùng chung. Trộn hai thứ vào một file là chỗ để sau này ai đó đổi ngưỡng và tưởng mình đang đổi định nghĩa."
}
```

Bốn dải **giữ nguyên** giá trị M12 đang chạy (`0x3400-0x4DBF` · `0x4E00-0x9FFF` ·
`0xF900-0xFAFF` · `0x20000-0x2A6DF`) — FR này **không** đổi hành vi định tuyến của
M12, nó chỉ dời nơi ở của con số. Đổi tập dải là một quyết định khác, cần đo lại
`ti_le_han` trên kho thật.

### 1.2 · Chủ là M01, không phải M13

`M13/data_flow` bản trước khai *"bảng khai dải ký tự Hán — **M13** sở hữu; M12 đọc
lại"*. Chốt PM 2026-09-09 (`research §8 G6`) đảo điều đó: **hai THỢ đọc một bảng ở
LÕI**, không THỢ nào sở hữu luật của THỢ kia. Nếu M13 sở hữu thì M12 phụ thuộc M13
vì một hằng số — và `depends_on` của M12 sẽ mọc một cạnh mà không có lời gọi nào.

| | vì sao không |
|---|---|
| `truyhoi/assets/dai-han.json` | M12 đọc file trong thư mục của M13 ⇒ một cạnh phụ thuộc không có lời gọi; và xoá `truyhoi/` là M12 chết |
| `chungcat/assets/` (giữ nguyên chỗ cũ) | M13 đọc đất M12 — cùng bệnh, đổi chiều. Và M12 đã tự khai đây là chỗ **tạm** |
| mỗi bên một bản, cổng đối chiếu | đúng cho **hàm** (`chuan_hoa_tim` ≠ `chuan_hoa`, hai mục đích), **sai cho hằng số**: một hằng số không có "mục đích riêng", nó chỉ có giá trị đúng hoặc sai |

## 2 · Cổng — mỗi cổng một câu đỏ được

| # | bắt gì | đỏ khi |
|---|---|---|
| H1 | `dai-han.json` tồn tại, parse được, `dai` có **≥4** phần tử, **mỗi** phần tử đủ `tu` · `den` · `ten` · `$vi_sao`, và `tu ≤ den` | thiếu file · thiếu một khoá · một dải ngược đầu-cuối |
| H2 | các dải **không chồng nhau** và **sắp tăng** theo `tu` | hai dải giao nhau (một ký tự đếm hai lần là một tỉ lệ sai) |
| H3 | **0** literal dải Hán trong mã: `grep -nE '0x3400\|0x4E00\|0xF900\|0x20000\|\\u4[Ee]00' chungcat/src truyhoi/src` ⇒ rỗng | một bên gõ lại số (đây là vế đóng ô `M12/backlog.md:631`) |
| H4 | bảng khai **không** chứa Hiragana/Katakana/Hangul | ai đó nới dải sang 3040–30FF hoặc AC00–D7AF mà không mở FR |
| H5 | xoá file ⇒ **cả hai** bên đỏ **nói đúng tên file**, không rơi về một dải mặc định im lặng | một bên vẫn chạy khi bảng khai vắng |

H1·H2·H4 vào `core/tests/check_khai_mot_noi.py` (§4 mới — cổng đó đã là nhà của
*"hai tập khai một nơi"*, đây là tập thứ ba). H3·H5 là vế của `FR-078` phía M12 và
`T13-3` phía M13, vì chúng đo **mã của bên đọc**, không đo bảng khai.

## 3 · Ràng buộc KHÔNG được nới

1. **Không đổi giá trị bốn dải** — dời chỗ, không đổi hành vi. Đổi tập dải là FR khác.
2. **Không thêm ngưỡng** `nguong_han` vào file này (`$comment_nguong` nói rõ vì sao).
3. **Không cho bên đọc có dải mặc định** — thiếu bảng khai thì đỏ, không đoán (H5).
4. **Giữ dạng SỐ**, không phải chuỗi regex: hai bên đọc là hai ngôn ngữ khác nhau.

## 4 · Điều FR này KHÔNG làm

- **Không** sửa `chungcat/src/dinh_tuyen.py` — đó là `FR-078` (đã duyệt mở), team M12 áp.
- **Không** viết `chuan_hoa_tim` của M13 — `T13-3`.
- **Không** quyết fold phồn↔giản (OpenCC) — chưa đo, và kho có 0 bài chữ Hán
  (`M13 AC-6.3` đang `soft` vì đúng lý do đó).
- **Không** ký `FROZEN.lock` — không file nào trong FR này frozen.

## 5 · Đo được hôm nay — trạng thái trước FR

```
core/assets/dai-han.json                             không có
grep -rl FR-077 (md + yaml)                          10 file trỏ tới
chungcat/src/dinh_tuyen.py:27-33  _DAI_HAN           4 dải gõ cứng + ghi chú "tạm"
06_modules/M12_chungcat/backlog.md:631               ô [ ] "dải Hán HAI bản tiềm tàng"
M13 spec AC-3.4                                      ĐÃ KÝ, trỏ vào file chưa tồn tại
kb/**  bản ghi chữ Hán                               0
```
