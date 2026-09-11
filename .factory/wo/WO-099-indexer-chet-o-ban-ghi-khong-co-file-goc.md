# WO-099 — Indexer M13 CHẾT ở bản ghi không có file gốc (422), và cổng CRASH thay vì ĐỎ

- **mở**: 2026-09-11 · **người mở**: claude (PM M13) · **loại**: **bug** · **mức**: `hard`
- **module**: `M13_truyhoi` · **đơn vị gây ra**: `T13-2` (indexer) · **cổng lộ ra**: `check_golden_du_ca` (`T13-6`)
- **phát hiện**: lần chạy THẬT đầu tiên trên kho thật, ngay sau khi chủ dự án restart `:8787` (2026-09-11). Đây đúng là thứ `T13-6` sinh ra để tìm — mọi cổng khác chạy trên kho tạm nên không thấy.

## 1 · Repro — hai lệnh

```bash
curl -s -o /dev/null -w "%{http_code}\n" "http://127.0.0.1:8787/api/xuat/video/webmcp?dang=goc"
# → 422

python truyhoi/tests/check_golden_du_ca.py
# → in được "kho thật: 16 bản ghi · 1 bản ghi có chữ Hán" rồi:
#   File "truyhoi/tests/check_golden_du_ca.py", line 121, in <module>
#     indexer.reindex(con, day_du=True)
#   urllib.error.HTTPError: HTTP Error 422: Unprocessable Entity
```

## 2 · Nguyên nhân — LÕI đúng, M13 sai

`truyhoi/src/indexer.py:259` gọi `GET /api/xuat/<loai>/<slug>?dang=goc` cho **mọi**
bản ghi, để lấy file `.md` đủ frontmatter (số dòng đếm trên bản này). Cửa xuất trả
**422 có chủ đích** khi bản ghi không có file trong kho:

```json
{"loi":"bản ghi `webmcp` không có file trong kho — video đăng ký bằng URL thì
        xem/tải ở nguồn, không có \"File gốc\"."}
```

Đó là hợp đồng **đúng** của M08/M11 (video đăng ký bằng URL, không byte vào kho —
`FR-075`). M13 mới là bên giả định sai: nó coi *"mọi bản ghi đều có file gốc"*.

**Quy mô đo được trên kho thật**: `16` bản ghi — `5` trả 200, **`11` trả 422**. Tức
indexer chết ở bản ghi thứ hai hoặc ba, và **2/3 kho không bao giờ được index**.

⚠️ **Vì sao 20 cổng vẫn xanh**: chúng chạy trên kho tạm do chính test dựng, nơi mọi
bản ghi đều có file. Fixture đầy đủ hơn thực tế — cổng xanh trên một thế giới không
tồn tại. Cùng lớp `#cổng-xanh-vì-neo-sai`.

## 3 · Hai vế, và vế thứ hai mới là vế nặng

**Vế A · indexer phải chịu được bản ghi không có file gốc.**
Đường có sẵn, **không cần cửa mới**: `GET /api/articles/<loai>/<slug>` trả
`{frontmatter, body}` và **200** cho đúng những bản ghi 422 ở trên (đo:
`/api/articles/video/webmcp` → 200). Indexer đã gọi cửa này ở `:260` cho metadata —
chỉ cần khi `xuat` trả 422 thì lấy `than` từ đó, và ghi nhận `line_start/line_end`
đếm trên thân ấy.

**Vế B · cổng CRASH thay vì ĐỎ.** `check_golden_du_ca.py:121` để `HTTPError` bay ra
⇒ traceback, không phải kết luận. Cổng **biết** nó đang đo gì và không nói được. Đây
**đúng lớp lỗi `WO-084`** (`check_g6b` chết ở dòng in) — lần thứ hai trong hai ngày.
Một cổng chết vì dữ liệu thật là cổng không dùng được đúng lúc cần nhất.

## 4 · Kỳ vọng

1. `reindex` chạy hết **16/16** bản ghi; bản ghi không có file gốc lấy `than` qua
   `/api/articles/<loai>/<slug>`, **không** bị bỏ im lặng.
2. Bản ghi thật sự không index được (nếu có) ⇒ **đếm và nêu slug**, không nuốt.
3. `check_golden_du_ca` **không traceback** với bất kỳ mã HTTP nào từ LÕI: 4xx/5xx ⇒
   ĐỎ nêu đúng cửa + mã + slug, `exit 1` vì **kết luận**.
4. `AC-2.3` giữ nguyên: `line_end ≤ số dòng thật` của **thân được dùng**.

## 5 · Điều WO này KHÔNG làm

- **Không** sửa cửa xuất của LÕI — 422 là hợp đồng đúng (`FR-075`), và `M01–M12`
  đóng băng phạm vi (`rule.md` 18).
- **Không** đổi `spec.md`/`rules.md` M13 (FROZEN) — `AC-1.3` đã nói *"đọc kho QUA API
  của LÕI"*, không nói cửa nào; đây là lỗi **cài đặt**, không phải lỗi hợp đồng.
- **Không** gộp vế B vào `WO-084` — khác file, khác chủ (`truyhoi/tests` là M13;
  `check_g6b` là M01).

## 6 · Đo được hôm nay

```
/api/kho-delta                                200   (restart đã có tác dụng)
/api/xuat/video/webmcp?dang=goc               422   · 11/16 bản ghi cùng mã
/api/articles/video/webmcp                    200   · đường thay thế, đã có
/api/tim?q=test                               502   · service :8791 CHƯA CHẠY (vận hành, không phải bug)
check_golden_du_ca                            traceback, không phải ĐỎ
19/20 cổng M13 khác                           xanh trên main
```
