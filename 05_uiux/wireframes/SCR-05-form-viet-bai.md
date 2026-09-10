# SCR-05 · Form viết bài (màn Nạp nguồn, lối C) — wireframe

> Vẽ **trước** khi dựng, theo yêu cầu người dùng. Ba điều bản trước làm sai:
>
> 1. Không có **mẫu** — người viết nhìn ô trống, không biết viết gì vào đó.
> 2. Đòi **đủ số mục** nhưng cho đúng **một ô textarea** — người viết phải tự nhớ
>    tên mục, tự gõ `## 5.`, và chỉ biết mình sai sau khi cổng trả về.
> 3. Nhãn nằm **trên** ô nhập ⇒ form cao gấp đôi, mắt cuộn nhiều, và với nhãn
>    ngắn (2–4 từ) thì cả một dòng ngang bị bỏ phí.
>
> Nguyên tắc của bản này: **mỗi ràng buộc của cổng phải có một ô nhập tương ứng**.
> Cổng đòi locator ⇒ chú thích ngay chỗ gõ locator.
>
> **Con số theo khung, không theo wireframe** (FR-036, 2026-08-27). Khung thân
> bài khai ở `core/assets/khung-than-bai.json`; số ô = số **mục LÁ** của nó.
> Hiện: 5 mục `##`, trong đó §3 có bốn mục con ⇒ **8 mục lá ⇒ 8 ô**. Cổng
> `core/tests/check_khung.py` đối chiếu con số này với shell — nên khi khung đổi,
> chỗ đỏ là shell, và bản vẽ này không phải sửa lại con số nữa.
>
> Nguyên tắc trên là hợp đồng; con số 9 của bản đầu chỉ là hệ quả của khung lúc đó.

## Desktop ≥1200px — nhãn TRÁI, ô nhập PHẢI

```
┌─ NẠP NGUỒN ───────────────────────────────────────────────────────────────────┐
│  [ Dán link ]  [ Nộp file .md ]  [ TỰ VIẾT BÀI ]                              │
├───────────────────────────────────────────────────────────────────────────────┤
│  Viết bài mới · vào kho ở draft        sẽ ghi → kb/article/<slug>.md          │
│                                                        [ điền một bài mẫu ]   │ ← học bằng ví dụ
├──────────────────────────────────────────────────────┬────────────────────────┤
│                                                       │  CỔNG SẼ KIỂM         │
│  ① BÀI NÀY LÀ GÌ                                     │                        │
│                                                       │  ① Overview       ✓   │
│  Tiêu đề *          ┃ [Vì sao retry mù làm hỏng…    ] │  ② Bối cảnh       ✓   │
│  hiện trên thẻ      ┃                                 │  ③ Nội dung           │
│  ─────────────────────────────────────────────────────│    3.1 Đầu vào    ·   │
│  Một câu tóm tắt *  ┃ [Retry không idempotent…      ] │    3.2 Process    ✓   │
│  0/160              ┃                                 │    3.3 Output     ·   │
│  ─────────────────────────────────────────────────────│    3.4 Tinh túy   ✓   │
│  URL nguồn *        ┃ [https://…                    ] │  ④ Ý nghĩa thực tế ·  │
│  ─────────────────────────────────────────────────────│  ⑤ Rủi ro, tầm nhìn · │
│  Loại nguồn *       ┃ [article ▾]                     │                        │
│  Ngày phân tích *   ┃ [2026-08-19]                    │  1 240 từ / trần 1800 │
│                                                       │  mục 1+2: 14% ≤25% ✓  │
│  ② CẤT Ở ĐÂU TRONG KHO                               │                        │
│                                                       │  ⓘ ước tính tại chỗ.  │
│  id *               ┃ [src_abc123]     ← src_+≥6 ký tự│    lời cuối là         │
│  slug *             ┃ [vi-sao-retry-mu] ← tên file    │    validate.py        │
│                                                       │                        │
│  ③ BẠN ĐÁNH GIÁ THẾ NÀO                              │  (cột DÍNH khi cuộn)  │
│                                                       │                        │
│  Tin cậy tối đa     ┃ [plausible ▾]                   │                        │
│  Conformance        ┃ [B ▾]                           │                        │
│  Category           ┃ ☐agent-llm ☑backend ☐data-ml    │                        │
│  Concepts           ┃ ☑idempotency ☐retry-jitter …    │                        │
│  Đề xuất mới        ┃ [rag-eval, tool-sandbox       ] │                        │
│                                                       │                        │
├───────────────────────────────────────────────────────┴────────────────────────┤
│  ④ NỘI DUNG — 5 mục của giao thức        [ 8 ô ][ thô ]   [nạp khung 5 mục]   │
│                                                                                 │
│  1 Overview      ┃ [Một câu: bài này nói cái gì mới………………………]  ~40 từ       │
│  2 Bối cảnh      ┃ [Vấn đề gì tồn tại trước → vì sao nguồn này có]  1+2 ≤25%   │
│                                                                                 │
│  3 NỘI DUNG      ── bốn mục con, ghép thành `## 3.` + bốn `### 3.n` khi gửi ──  │
│   3.1 Đầu vào    ┃ [Nhận vào cái gì: dữ liệu, tiền đề……………]                  │
│   3.2 Process  * ┃ [CƠ CHẾ THẬT — chạy thế nào, ở đâu trong mã ]  ← mục NẶNG   │
│                  ┃ [phải có locator [file.py:10-40]…………………]                  │
│   3.3 Output   * ┃ [Tạo ra cái gì, đo được ở đâu [locator]……]                 │
│   3.4 Tinh túy * ┃ [#### 3.4.1 <tên>                          ]  ← mục NẶNG   │
│                  ┃ [- **Không hiển nhiên vì:** …               ]  [+ tinh túy] │
│                  ┃ [- **Chuyển giao:** …                       ]  ← nạp 5 dòng │
│                  ┃ [- **Tin cậy:** … - **Bằng chứng:** [§…]    ]    bắt buộc   │
│                                                                                 │
│  4 Ý nghĩa th.tế*┃ [Dùng vào việc gì + MỘT ví dụ thật [locator]]               │
│  5 Rủi ro, t.nhìn┃ [Chỗ nào sai/thiếu/chưa ai tái lập………………]                 │
│                                                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│  [ GHI VÀO KHO ]  [ ĐÓNG ]   Ctrl+Enter để ghi          ← thanh DÍNH đáy       │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## <1080px — nhãn về lại TRÊN ô nhập

Nhãn trái chỉ đúng khi còn đủ chỗ cho ô nhập. Dưới 1080px, cột nhãn 14rem ăn
mất một nửa bề ngang ⇒ quay lại xếp dọc, cột theo dõi tụt xuống dưới form.

## Ba quyết định, và vì sao

### 1 · Một ô cho mỗi mục lá, thay một textarea

| | Một textarea | Một ô mỗi mục lá |
|---|---|---|
| Người viết phải nhớ | tên mục + cú pháp `## n.` / `### n.m` | không gì |
| Biết thiếu mục khi nào | sau khi cổng trả 422 | ngay lúc gõ |
| Gợi ý cho từng mục | không chỗ đặt | placeholder của chính ô đó |

Ghép khi gửi: mục gốc thành `## <n>. <tên>`, mục con thành `### <n.m> <tên>`.
Đọc ngược khi sửa bài cũ: cắt theo **cả hai** cấp. **Không khớp thì rơi về chế độ
thô** — bài do skill 6-pass sinh có thể có cấu trúc khác, và nuốt mất nội dung
của nó là hỏng nặng hơn nhiều so với việc hiện một textarea.

Vì sao là mục **LÁ** chứ không phải mục `##`: §3 gộp bốn ràng buộc riêng của cổng
(mỗi mục con có gợi ý riêng, và ba trong bốn đòi locator). Cho §3 một ô lớn thì
người viết phải tự gõ `### 3.1 Đầu vào` … `### 3.4 Tinh túy` đúng chính tả —
**đúng cái lỗi số 2 ở đầu file này**, chỉ lùi xuống một cấp tiêu đề.

Nút `[N ô][thô]` luôn có: chế độ thô là **đường thoát**, không phải chế độ ẩn.

### 2 · Mục tinh túy giữ dạng thô + nút nạp khung

Mục tinh túy (§3.4) có cấu trúc lồng: nhiều `#### 3.4.x`, mỗi cái **5 dòng bullet
bắt buộc**. Dựng form lồng cho nó là dựng một trình soạn thảo — quá tay cho thứ
người dùng gõ 2–3 lần một bài. Thay bằng nút **[+ tinh túy]** nạp sẵn 5 dòng đúng
khuôn, đọc từ `KHUNG.tinh_tuy.bullets` chứ không gõ lại trong FE.

### 3 · Một bài MẪU, không phải placeholder rỗng

Nút `[điền một bài mẫu]` đổ **cả form** bằng một bài thật, hợp lệ, qua được cổng.
Người dùng xoá dần và thay bằng bài của mình — học bằng ví dụ, không phải học
bằng tài liệu. Đây là thứ bản trước thiếu hẳn.

Mẫu lấy từ chính `kb-mock/` (đã qua `validate.py` trong CI) chứ không gõ tay
trong JS — hai bản mẫu lệch nhau thì bản trong JS sẽ sai lúc schema đổi.

## Sửa sau lượt rà đầu — hai điều người dùng chỉ đúng

### a · Mục con không được mang ký hiệu của nhóm cha

Bốn nhóm lớn (①②③④) dùng **huy hiệu tròn đỏ**. Bản dựng đầu cho các mục nặng —
vốn là **con** của nhóm ④ Nội dung — đúng cái huy hiệu tròn đỏ đó để nhấn "mục
nặng". Trùng ký hiệu là **trùng cấp bậc** trong mắt người đọc: nhìn vào tưởng
một mục thân bài ngang hàng với "Cất ở đâu trong kho".

Sau FR-036 có **ba** cấp trong nhóm ④, nên luật này áp cho cả cấp thứ ba: nhóm ④
→ mục `##` → mục con `###`. Mục nào là "nặng" đọc từ `nang: true` trong khung,
không gõ số vào FE.

Nhấn bằng thứ khác hẳn cấp cha:

```
  ④ NỘI DUNG                        ← huy hiệu TRÒN ĐỎ (cấp nhóm)

  ③ Nội dung                        ← số nền nhạt (cấp mục `##`)
   3.2 Process  mục nặng ┃┃[ … ]    ← thụt vào + VẠCH DỌC đỏ ở mép ô nhập
   3.4 Tinh túy mục nặng ┃┃[ … ]      (cấp mục con — khác hình, khác vai)
  ⑦ Dè chừng          ┃ [ … ]
```

### b · Một bố cục cho cả form, không hai

Nhóm ② và ③ vẫn xếp **dọc** trong khi nhóm ① đã nằm **ngang** — vì các cặp
trường (`id`+`slug`, `tin cậy`+`conformance`) bọc trong một lưới hai cột lồng
bên trong, nên chúng không nhận được luật nhãn-trái.

Gỡ lớp lồng (`display:contents`) ⇒ mọi hàng của mọi nhóm ăn cùng một luật. Nửa
form ngang nửa form dọc là thứ mắt đọc ra ngay, kể cả khi không gọi tên được.

## Ràng buộc không được phá

- Không tự điền trường **quyết định** (id, slug, credibility…) — M05-R2. Nút mẫu
  điền TẤT CẢ cùng lúc và nói rõ "đây là bài mẫu", khác hẳn việc lặng lẽ đoán hộ
  một trường khi người dùng bỏ trống.
- Cột theo dõi vẫn chỉ **ước tính**, không chặn gì — M05-R3.
- Form vẫn `api-only` + `hidden`: bundle tĩnh không có đường ghi nào.
- Chỉ dùng token; nhãn HOA dùng `--f-ui` + tracking (FR-018).
